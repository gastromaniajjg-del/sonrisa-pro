// «La misión de la sonrisa · Escapa en 2 minutos» — banda sonora original y guion de radio.
// Todo medido en segundos desde el inicio del temporizador. Nada puede pasar de 120 s:
// los tests (tests/timeline.test.js) lo comprueban.

import { BEAT_SECONDS, BAR_SECONDS, PHRASE_SECONDS, SEGMENTS, TOTAL_SECONDS } from './config.js';

export const TRACK = {
  title: 'Escapa en 2 minutos',
  key: 'La menor → Do mayor (salida)',
  bpm: 128,
  duration: TOTAL_SECONDS,
};

// ── Guion de radio ──────────────────────────────────────────────────────────
// La «Base» guía a Dani por radio. Suena en los modos «Música + radio» y «Solo radio».
// En «Solo música» el mismo texto aparece en pantalla.
// Si existe assets/audio/radio/<id>.mp3 se reproduce el archivo (con filtro de radio);
// si no, voz del sistema en español precedida de un chasquido de radio.
// maxSeconds: tiempo hasta el siguiente mensaje (la voz se corta si se pasa).
export const RADIO_CUES = [
  { t: 0.4, id: 'n1', text: 'Aquí Base. Te recibo, Dani. Nivel uno: arriba a la derecha. Cepillo inclinado hacia la encía.' },
  { t: 7.5, id: 'n1-fuera', text: 'Círculos pequeños por fuera. Sin prisa.' },
  { t: 15, id: 'n1-dentro', text: 'Ahora la cara de dentro.' },
  { t: 22.5, id: 'n1-muelas', text: 'Muelas: adelante y atrás, por encima.' },
  { t: 30, id: 'n2', text: 'Nivel dos. Arriba a la izquierda.' },
  { t: 37.5, id: 'n2-fuera', text: 'Círculos por fuera. Suave, no aprietes.' },
  { t: 45, id: 'n2-dentro', text: 'Por dentro. Que no se escape ninguno.' },
  { t: 52.5, id: 'n2-muelas', text: 'Muelas de arriba. Adelante y atrás.' },
  { t: 60, id: 'n3', text: 'Nivel tres. Abajo a la izquierda. Vas por la mitad.' },
  { t: 67.5, id: 'n3-fuera', text: 'Por fuera, círculos pequeños.' },
  { t: 75, id: 'n3-dentro', text: 'Cara de dentro.' },
  { t: 82.5, id: 'n3-muelas', text: 'Muelas de abajo. Adelante y atrás.' },
  { t: 90, id: 'n4', text: 'Último nivel. Abajo a la derecha. La salida está cerca.' },
  { t: 97.5, id: 'n4-fuera', text: 'Círculos por fuera.' },
  { t: 105, id: 'n4-dentro', text: 'Por dentro. Casi lo tienes.' },
  { t: 112.5, id: 'n4-muelas', text: 'Muelas, adelante y atrás.' },
  { t: 116.6, id: 'salida', text: 'Salida localizada. Has escapado.' },
].map((cue, i, all) => ({ ...cue, maxSeconds: (all[i + 1]?.t ?? TOTAL_SECONDS) - cue.t }));

export function radioAt(t) {
  let last = null;
  for (const c of RADIO_CUES) if (c.t <= t) last = c;
  return last;
}

// Parpadeos de los fluorescentes: los usan a la vez la música (chasquido) y el escenario (luz).
export const FLICKERS = [11.3, 26.1, 43.9, 56.2, 73.4, 86.0, 98.7, 108.2];

// ── Composición ─────────────────────────────────────────────────────────────
const CHORDS = {
  Am: [45, 48, 52],
  F: [41, 45, 48],
  Dm: [38, 41, 45],
  E: [40, 44, 47], // Mi mayor: la tensión de «algo no cuadra»
  G: [43, 47, 50],
  C: [48, 52, 55],
};
const PROG = ['Am', 'F', 'Dm', 'E'];
const PROG_EXIT = ['F', 'G', 'C', 'C'];

// Motivo de caja de música (campana FM), en la primera frase de cada nivel. [pulso, nota]
const MOTIF = [[0, 76], [1.5, 72], [3, 69], [6, 71], [8, 76], [9.5, 74], [11, 72], [14, 71]];
const MOTIF_EXIT = [[0, 72], [2, 74], [4, 76], [6, 79], [8, 84]];

/**
 * Lista completa de eventos (segundos absolutos).
 * Cada evento: { t, dur, type, note?, notes?, vel, level? }
 */
export function buildArrangement() {
  const ev = [];
  const b = BEAT_SECONDS;

  SEGMENTS.forEach((seg, L) => {
    // Zumbido de fluorescentes (50 Hz, la red eléctrica en España). En el último nivel
    // se apaga al entrar en la recta final: el silencio es la salida.
    ev.push({ t: seg.start, dur: L === 3 ? 22.5 : 30, type: 'hum', vel: [0.5, 0.55, 0.5, 0.75][L], level: L });

    for (let p = 0; p < 4; p++) {
      const t0 = seg.start + p * PHRASE_SECONDS;
      const exit = L === 3 && p === 3;
      const prog = exit ? PROG_EXIT : PROG;

      prog.forEach((name, bar) => {
        const chord = CHORDS[name];
        const tb = t0 + bar * BAR_SECONDS;
        const lastBar = exit && bar === 3;
        ev.push({ t: tb, dur: BAR_SECONDS * 0.99, type: 'pad', notes: chord.map((n) => n + 12), vel: exit ? 0.9 : 0.45 + L * 0.12, level: L });
        ev.push({ t: tb, dur: BAR_SECONDS * 0.98, type: 'sub', note: chord[0] - 12, vel: 0.8 });

        // Arpegio: desde el paso 2 del nivel 1; más denso y brillante en cada nivel.
        if (!(L === 0 && p === 0) && !lastBar) {
          const step = L === 0 ? 0.5 : 0.25;
          const pattern = [0, 1, 2, 1, 2, 3, 2, 1];
          for (let k = 0, i = 0; k < 4 - 1e-9; k += step, i++) {
            const deg = pattern[i % pattern.length];
            const note = deg === 3 ? chord[0] + 36 : chord[deg] + 24;
            ev.push({ t: tb + k * b, dur: step * b * 0.8, type: 'arp', note, vel: 0.5 + L * 0.12, level: L });
          }
        }

        if (lastBar) {
          ev.push({ t: tb, dur: BAR_SECONDS, type: 'shimmer', notes: [72, 76, 79, 84], vel: 0.8 });
          return;
        }

        // Percusión, cada vez más presente.
        if (L >= 1) [0, 2].forEach((beat) => ev.push({ t: tb + beat * b, dur: 0.3, type: 'kick', vel: 0.8 }));
        if (L >= 3) [1, 3].forEach((beat) => ev.push({ t: tb + beat * b, dur: 0.3, type: 'kick', vel: 0.55 }));
        if (L >= 2) for (let h = 0; h < 8; h++) ev.push({ t: tb + h * 0.5 * b, dur: 0.05, type: 'hat', vel: h % 2 ? 0.5 : 0.25 });
        if (L >= 3) [1, 3].forEach((beat) => ev.push({ t: tb + beat * b, dur: 0.12, type: 'snare', vel: 0.6 }));
        if (L >= 2) {
          for (let k = 0; k < 8; k++) ev.push({ t: tb + k * 0.5 * b, dur: 0.4 * b, type: 'bass', note: chord[0] - 12 + (k === 7 ? 12 : 0), vel: 0.7 });
        }
      });

      // Motivo de caja de música en la primera frase de cada nivel (y la subida final).
      if (p === 0) MOTIF.forEach(([beat, note]) => ev.push({ t: t0 + beat * b, dur: 1.2, type: 'bell', note, vel: 0.5 }));
      if (exit) MOTIF_EXIT.forEach(([beat, note]) => ev.push({ t: t0 + beat * b, dur: 1.4, type: 'bell', note, vel: 0.6 }));

      // Barrido que anuncia el cambio de nivel (últimos 2 pulsos del nivel).
      if (p === 3 && L < 3) ev.push({ t: t0 + 14 * b, dur: 2 * b, type: 'swell', vel: 0.6 });
    }

    // Cambio de nivel: estática + alarma de dos tonos. Al empezar, solo el «clic» de la radio.
    ev.push({ t: seg.start, dur: L === 0 ? 0.15 : 0.35, type: 'static', vel: 0.6 });
    if (L > 0) [[0, 81], [0.22, 76], [0.44, 81], [0.66, 76]].forEach(([d, note]) => ev.push({ t: seg.start + d, dur: 0.18, type: 'alarm', note, vel: 0.5 }));
  });

  FLICKERS.forEach((t) => ev.push({ t, dur: 0.25, type: 'zap', vel: 0.6 }));

  // Recorte de seguridad: nada puede sonar después de 120 s.
  return ev
    .filter((e) => e.t < TOTAL_SECONDS)
    .map((e) => ({ ...e, dur: Math.min(e.dur, TOTAL_SECONDS - e.t) }))
    .sort((a, c) => a.t - c.t);
}
