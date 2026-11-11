// Arreglo musical de cada temática. Todos usan la misma rejilla (128 BPM, 16 compases
// por nivel, 120 s) para que la música avise de los cambios en el segundo exacto.

import { BEAT_SECONDS, BAR_SECONDS, PHRASE_SECONDS, SEGMENTS, TOTAL_SECONDS } from './config.js';
import { buildArrangement as buildEscapa } from './soundtrack.js';
import { buildDientinArrangement } from './song-dientin.js';

const CHORDS = {
  Am: [45, 48, 52], F: [41, 45, 48], Dm: [38, 41, 45], E: [40, 44, 47], G: [43, 47, 50],
  C: [48, 52, 55], Em: [40, 43, 47], D: [38, 42, 45], Bm: [47, 50, 54], Bb: [46, 50, 53],
};

const cache = new Map();

export function arrangementFor(theme) {
  if (!cache.has(theme.id)) {
    const m = theme.music;
    const ev = m.kind === 'escapa' ? buildEscapa() : m.kind === 'dientin' ? buildDientinArrangement() : buildGeneric(m);
    cache.set(theme.id, clip(ev));
  }
  return cache.get(theme.id);
}

function clip(ev) {
  return ev
    .filter((e) => e.t < TOTAL_SECONDS)
    .map((e) => ({ ...e, dur: Math.min(e.dur, TOTAL_SECONDS - e.t) }))
    .sort((a, c) => a.t - c.t);
}

/** Arreglo paramétrico: acordes, motivo, arpegio, percusión, ambiente y avisos de nivel. */
export function buildGeneric(m) {
  const ev = [];
  const b = BEAT_SECONDS;

  if (m.ambience) {
    SEGMENTS.forEach((seg, L) => {
      ev.push({ t: seg.start, dur: L === 3 ? 22.5 : 30, type: m.ambience.type, vel: m.ambience.vel, cutoff: m.ambience.cutoff, rate: m.ambience.rate, level: L });
    });
  }

  SEGMENTS.forEach((seg, L) => {
    for (let p = 0; p < 4; p++) {
      const t0 = seg.start + p * PHRASE_SECONDS;
      const exit = L === 3 && p === 3;
      const prog = exit ? m.exit : m.prog;

      prog.forEach((name, bar) => {
        const chord = CHORDS[name];
        const tb = t0 + bar * BAR_SECONDS;
        const lastBar = exit && bar === 3;
        ev.push({ t: tb, dur: BAR_SECONDS * 0.99, type: 'pad', notes: chord.map((n) => n + 12), vel: exit ? 0.9 : 0.5 + L * 0.1, level: Math.min(3, L + 1) });
        ev.push({ t: tb, dur: BAR_SECONDS * 0.98, type: 'sub', note: chord[0] - 12, vel: 0.7 });

        if (!(L === 0 && p === 0) && !lastBar) {
          const step = L === 0 ? 0.5 : 0.25;
          const pattern = [0, 1, 2, 1, 2, 3, 2, 1];
          for (let k = 0, i = 0; k < 4 - 1e-9; k += step, i++) {
            const deg = pattern[i % pattern.length];
            const note = deg === 3 ? chord[0] + 36 : chord[deg] + 24;
            ev.push({ t: tb + k * b, dur: step * b * 0.8, type: 'arp', note, vel: 0.45 + L * 0.1, level: L, wave: m.arpWave });
          }
        }
        if (lastBar) {
          ev.push({ t: tb, dur: BAR_SECONDS, type: 'shimmer', notes: chord.map((n) => n + 24).concat(chord[0] + 36), vel: 0.8 });
          return;
        }
        drums(ev, m.drums, L, tb, chord, b, bar);
      });

      if (p === 0 || p === 2) {
        m.motif.forEach(([beat, note]) => ev.push({ t: t0 + beat * b, dur: m.motifInst === 'lead' ? 0.9 * b : 1.2, type: m.motifInst, note, vel: m.motifInst === 'lead' ? 0.55 : 0.5, wave: m.motifWave }));
      }
      if (exit) [[0, 72], [2, 76], [4, 79], [6, 84]].forEach(([beat, note]) => ev.push({ t: t0 + beat * b, dur: 1.4, type: 'bell', note, vel: 0.6 }));
      if (p === 3 && L < 3) ev.push({ t: t0 + 14 * b, dur: 2 * b, type: 'swell', vel: 0.5 });
    }

    if (L > 0) alert(ev, m.alert, seg.start);
  });

  if (m.chirps) {
    for (let t = m.chirps.offset, i = 0; t < TOTAL_SECONDS - 1; t += m.chirps.every, i++) {
      ev.push({ t, dur: m.chirps.dur, type: 'chirp', note: m.chirps.notes[i % m.chirps.notes.length], up: m.chirps.up, vel: 0.6 });
    }
  }
  return ev;
}

function drums(ev, style, L, tb, chord, b, bar) {
  const kick = (beat, vel = 0.8) => ev.push({ t: tb + beat * b, dur: 0.3, type: 'kick', vel });
  const clap = (beat, vel = 0.7) => ev.push({ t: tb + beat * b, dur: 0.12, type: 'clap', vel });
  const hats = (vel = 0.5) => { for (let h = 0; h < 8; h++) ev.push({ t: tb + h * 0.5 * b, dur: 0.05, type: 'hat', vel: h % 2 ? vel : vel * 0.5 }); };
  const bass = () => { for (let k = 0; k < 8; k++) ev.push({ t: tb + k * 0.5 * b, dur: 0.4 * b, type: 'bass', note: chord[0] - 12 + (k === 7 ? 12 : 0), vel: 0.65 }); };
  const tom = (beat, note, vel = 0.8) => ev.push({ t: tb + beat * b, dur: 0.35, type: 'tom', note, vel });

  switch (style) {
    case 'build': // como «Escapa»: la percusión entra nivel a nivel
      if (L >= 1) [0, 2].forEach((x) => kick(x));
      if (L >= 3) [1, 3].forEach((x) => kick(x, 0.55));
      if (L >= 2) { hats(); bass(); }
      if (L >= 3) [1, 3].forEach((x) => ev.push({ t: tb + x * b, dur: 0.12, type: 'snare', vel: 0.6 }));
      break;
    case 'light': // suave: palmas y charles, bombo solo al final
      if (L >= 1) [1, 3].forEach((x) => clap(x, 0.45));
      if (L >= 2) hats(0.35);
      if (L >= 3) [0, 2].forEach((x) => kick(x, 0.6));
      break;
    case 'tribal': // tambores graves
      [0, 1.5, 2, 3].forEach((x, i) => tom(x, i % 2 ? 50 : 45, 0.6 + L * 0.08));
      if (L >= 1) [0, 2].forEach((x) => kick(x, 0.7));
      if (L >= 2) hats(0.35);
      if (L >= 3) bass();
      break;
    case 'stadium': // ritmo de grada: bombo, palmas y redoble de tambor al final de cada frase
      [0, 2].forEach((x) => kick(x));
      [1, 3].forEach((x) => clap(x, 0.75));
      if (L >= 1) hats(0.4);
      if (L >= 2) bass();
      if (bar === 3) [2, 2.5, 3, 3.5].forEach((x, i) => tom(x, 48 - i * 2, 0.7));
      break;
    case 'chip': // estilo consola antigua: bombo, caja de ruido, charles y bajo saltarín
      [0, 2].forEach((x) => kick(x, 0.75));
      [1, 3].forEach((x) => ev.push({ t: tb + x * b, dur: 0.1, type: 'snare', vel: 0.55 }));
      if (L >= 1) hats(0.35);
      bass();
      break;
    default:
      break;
  }
}

function alert(ev, kind, t) {
  ev.push({ t, dur: 0.3, type: 'static', vel: kind === 'beep' ? 0.5 : 0.25 });
  switch (kind) {
    case 'sonar':
      [0, 0.6].forEach((d) => ev.push({ t: t + d, dur: 0.5, type: 'chirp', note: 93, up: false, vel: 1 }));
      break;
    case 'beep':
      [[0, 88], [0.2, 93], [0.4, 100]].forEach(([d, n]) => ev.push({ t: t + d, dur: 0.15, type: 'alarm', note: n, vel: 0.4 }));
      break;
    case 'whistle':
      [0, 0.35].forEach((d) => ev.push({ t: t + d, dur: d ? 0.6 : 0.25, type: 'chirp', note: 100, up: false, vel: 1.2 }));
      break;
    case 'tom':
      [0, 0.15, 0.3, 0.45].forEach((d, i) => ev.push({ t: t + d, dur: 0.35, type: 'tom', note: 50 - i * 2, vel: 0.9 }));
      break;
    default: // campanita
      [84, 88, 91, 96].forEach((note, i) => ev.push({ t: t + i * 0.12, dur: 0.6, type: 'bell', note, vel: 0.55 }));
  }
}
