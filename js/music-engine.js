// Motor de música original sintetizada en tiempo real con Web Audio.
// No usa muestras ni archivos externos: funciona sin conexión desde el primer momento.
// Sirve para un AudioContext normal (reproducción) o un OfflineAudioContext (exportar WAV).

import { TOTAL_SECONDS } from './config.js';
import { buildArrangement } from './song.js';

const midiToHz = (n) => 440 * Math.pow(2, (n - 69) / 12);

const noiseCache = new WeakMap();
function noiseBuffer(ctx) {
  if (noiseCache.has(ctx)) return noiseCache.get(ctx);
  const len = Math.floor(ctx.sampleRate * 1);
  const buf = ctx.createBuffer(1, len, ctx.sampleRate);
  const data = buf.getChannelData(0);
  let seed = 12345; // ruido determinista: el resultado es idéntico en cada render
  for (let i = 0; i < len; i++) {
    seed = (seed * 1103515245 + 12345) & 0x7fffffff;
    data[i] = (seed / 0x3fffffff) - 1;
  }
  noiseCache.set(ctx, buf);
  return buf;
}

function env(gainParam, t, peak, attack, dur, release = 0.05) {
  gainParam.setValueAtTime(0.0001, t);
  gainParam.linearRampToValueAtTime(peak, t + attack);
  gainParam.setTargetAtTime(peak * 0.6, t + attack, dur * 0.4);
  gainParam.setTargetAtTime(0.0001, t + dur, release / 3);
}

// ── Instrumentos ─────────────────────────────────────────────────────────────
const INSTRUMENTS = {
  lead(ctx, out, t, e, end) {
    // Melodía: onda cuadrada suave + triángulo una octava arriba, con vibrato ligero.
    const g = ctx.createGain();
    const f = ctx.createBiquadFilter();
    f.type = 'lowpass';
    f.frequency.value = 2600;
    const o1 = ctx.createOscillator();
    const o2 = ctx.createOscillator();
    o1.type = 'square';
    o2.type = 'triangle';
    o1.frequency.value = midiToHz(e.note);
    o2.frequency.value = midiToHz(e.note + 12);
    const g2 = ctx.createGain();
    g2.gain.value = 0.35;
    const lfo = ctx.createOscillator();
    const lfoG = ctx.createGain();
    lfo.frequency.value = 5.5;
    lfoG.gain.value = 3;
    lfo.connect(lfoG).connect(o1.frequency);
    o1.connect(f);
    o2.connect(g2).connect(f);
    f.connect(g).connect(out);
    env(g.gain, t, 0.15 * e.vel, 0.012, e.dur, 0.08);
    const stop = Math.min(end, t + e.dur + 0.2);
    [o1, o2, lfo].forEach((o) => { o.start(t); o.stop(stop); });
  },

  bass(ctx, out, t, e, end) {
    const o = ctx.createOscillator();
    const sub = ctx.createOscillator();
    const f = ctx.createBiquadFilter();
    const g = ctx.createGain();
    o.type = 'sawtooth';
    sub.type = 'sine';
    o.frequency.value = midiToHz(e.note);
    sub.frequency.value = midiToHz(e.note);
    f.type = 'lowpass';
    f.Q.value = 6;
    f.frequency.setValueAtTime(900, t);
    f.frequency.exponentialRampToValueAtTime(220, t + 0.18);
    o.connect(f);
    sub.connect(f);
    f.connect(g).connect(out);
    env(g.gain, t, 0.22 * e.vel, 0.005, e.dur, 0.04);
    const stop = Math.min(end, t + e.dur + 0.1);
    o.start(t); sub.start(t); o.stop(stop); sub.stop(stop);
  },

  pad(ctx, out, t, e, end) {
    const g = ctx.createGain();
    const f = ctx.createBiquadFilter();
    f.type = 'lowpass';
    f.frequency.value = 1400;
    f.connect(g).connect(out);
    const stop = Math.min(end, t + e.dur + 0.3);
    e.notes.forEach((n, i) => {
      [-6, 6].forEach((detune) => {
        const o = ctx.createOscillator();
        o.type = 'sawtooth';
        o.frequency.value = midiToHz(n);
        o.detune.value = detune + i;
        o.connect(f);
        o.start(t);
        o.stop(stop);
      });
    });
    g.gain.setValueAtTime(0.0001, t);
    g.gain.linearRampToValueAtTime(0.018 * e.vel, t + 0.25);
    g.gain.setTargetAtTime(0.0001, t + e.dur - 0.05, 0.08);
  },

  kick(ctx, out, t, e, end) {
    const o = ctx.createOscillator();
    const g = ctx.createGain();
    o.type = 'sine';
    o.frequency.setValueAtTime(150, t);
    o.frequency.exponentialRampToValueAtTime(45, t + 0.12);
    g.gain.setValueAtTime(0.45 * e.vel, t);
    g.gain.exponentialRampToValueAtTime(0.001, t + 0.28);
    o.connect(g).connect(out);
    o.start(t);
    o.stop(Math.min(end, t + 0.3));
  },

  clap(ctx, out, t, e, end) {
    // Palmas: tres ráfagas de ruido muy seguidas + cola.
    const src = ctx.createBufferSource();
    src.buffer = noiseBuffer(ctx);
    const f = ctx.createBiquadFilter();
    f.type = 'bandpass';
    f.frequency.value = 1500;
    f.Q.value = 0.9;
    const g = ctx.createGain();
    const v = 0.38 * e.vel;
    g.gain.setValueAtTime(0.0001, t);
    [0, 0.012, 0.024].forEach((d) => {
      g.gain.setValueAtTime(v, t + d);
      g.gain.exponentialRampToValueAtTime(v * 0.25, t + d + 0.01);
    });
    g.gain.exponentialRampToValueAtTime(0.001, t + 0.2);
    src.connect(f).connect(g).connect(out);
    src.start(t, (t * 7.3) % 0.5);
    src.stop(Math.min(end, t + 0.22));
  },

  snare(ctx, out, t, e, end) {
    const src = ctx.createBufferSource();
    src.buffer = noiseBuffer(ctx);
    const f = ctx.createBiquadFilter();
    f.type = 'highpass';
    f.frequency.value = 1800;
    const g = ctx.createGain();
    g.gain.setValueAtTime(0.25 * e.vel, t);
    g.gain.exponentialRampToValueAtTime(0.001, t + 0.09);
    src.connect(f).connect(g).connect(out);
    src.start(t, (t * 3.1) % 0.5);
    src.stop(Math.min(end, t + 0.1));
  },

  hat(ctx, out, t, e, end) {
    const src = ctx.createBufferSource();
    src.buffer = noiseBuffer(ctx);
    const f = ctx.createBiquadFilter();
    f.type = 'highpass';
    f.frequency.value = 7500;
    const g = ctx.createGain();
    g.gain.setValueAtTime(0.12 * e.vel, t);
    g.gain.exponentialRampToValueAtTime(0.001, t + 0.045);
    src.connect(f).connect(g).connect(out);
    src.start(t, (t * 5.7) % 0.5);
    src.stop(Math.min(end, t + 0.05));
  },

  swell(ctx, out, t, e, end) {
    const src = ctx.createBufferSource();
    src.buffer = noiseBuffer(ctx);
    src.loop = true;
    const f = ctx.createBiquadFilter();
    f.type = 'bandpass';
    f.Q.value = 2;
    f.frequency.setValueAtTime(600, t);
    f.frequency.exponentialRampToValueAtTime(6000, t + e.dur);
    const g = ctx.createGain();
    g.gain.setValueAtTime(0.0001, t);
    g.gain.exponentialRampToValueAtTime(0.06 * e.vel, t + e.dur * 0.95);
    g.gain.linearRampToValueAtTime(0.0001, t + e.dur);
    src.connect(f).connect(g).connect(out);
    src.start(t);
    src.stop(Math.min(end, t + e.dur));
  },

  bell(ctx, out, t, e, end) {
    // Campanita (síntesis FM sencilla) para avisar del cambio de zona.
    const car = ctx.createOscillator();
    const mod = ctx.createOscillator();
    const modG = ctx.createGain();
    const g = ctx.createGain();
    const hz = midiToHz(e.note);
    car.frequency.value = hz;
    mod.frequency.value = hz * 3.5;
    modG.gain.setValueAtTime(hz * 2, t);
    modG.gain.exponentialRampToValueAtTime(1, t + e.dur);
    mod.connect(modG).connect(car.frequency);
    g.gain.setValueAtTime(0.0001, t);
    g.gain.linearRampToValueAtTime(0.09 * e.vel, t + 0.005);
    g.gain.exponentialRampToValueAtTime(0.0001, t + e.dur);
    car.connect(g).connect(out);
    const stop = Math.min(end, t + e.dur);
    car.start(t); mod.start(t); car.stop(stop); mod.stop(stop);
  },
};

export const ARRANGEMENT = buildArrangement();

/** Compresor suave para que nada sature, ni en el móvil ni en la exportación. */
function limiter(ctx, destination) {
  const c = ctx.createDynamicsCompressor();
  c.threshold.value = -10;
  c.knee.value = 6;
  c.ratio.value = 4;
  c.attack.value = 0.003;
  c.release.value = 0.15;
  c.connect(destination);
  return c;
}

/**
 * Programa la música sintetizada en un contexto de audio.
 * El llamador decide en qué momento del contexto corresponde cada segundo de la canción
 * mediante `songToCtx(t)`. Así el temporizador sigue mandando.
 */
export class SynthMusic {
  constructor(ctx, destination, { melody = true } = {}) {
    this.ctx = ctx;
    this.destination = destination;
    this.melody = melody;
    this.bus = null;
    this._timer = null;
  }

  /** Reproduce en vivo desde `fromSeconds`, programando con antelación. */
  play(fromSeconds, songToCtx) {
    this.stop();
    const ctx = this.ctx;
    this.bus = ctx.createGain();
    this.bus.connect(limiter(ctx, this.destination));
    this._songToCtx = songToCtx;
    const endCtx = songToCtx(TOTAL_SECONDS);
    // Fundido de 30 ms que TERMINA exactamente en el segundo 120.
    this.bus.gain.setValueAtTime(1, Math.max(ctx.currentTime, endCtx - 0.03));
    this.bus.gain.linearRampToValueAtTime(0, endCtx);

    let i = ARRANGEMENT.findIndex((e) => e.t + e.dur > fromSeconds);
    if (i < 0) return;
    const bus = this.bus;
    const lookahead = 0.35;
    const pump = () => {
      if (bus !== this.bus) return;
      const horizonCtx = ctx.currentTime + lookahead;
      while (i < ARRANGEMENT.length) {
        const e = ARRANGEMENT[i];
        const at = this._songToCtx(e.t);
        if (at > horizonCtx) break;
        i++;
        if (e.type === 'lead' && !this.melody) continue;
        if (at + e.dur < ctx.currentTime) continue; // ya pasó
        INSTRUMENTS[e.type](ctx, bus, Math.max(at, ctx.currentTime), e, this._songToCtx(TOTAL_SECONDS));
      }
      if (i >= ARRANGEMENT.length) this._stopPump();
    };
    pump();
    this._timer = setInterval(pump, 60);
  }

  /** Corrige el mapa tiempo-canción → tiempo-contexto (solo afecta a lo que aún no se ha programado). */
  retime(songToCtx) {
    this._songToCtx = songToCtx;
  }

  _stopPump() {
    if (this._timer) clearInterval(this._timer);
    this._timer = null;
  }

  stop() {
    this._stopPump();
    if (this.bus) {
      const old = this.bus;
      try {
        old.gain.cancelScheduledValues(this.ctx.currentTime);
        old.gain.setValueAtTime(old.gain.value, this.ctx.currentTime);
        old.gain.linearRampToValueAtTime(0, this.ctx.currentTime + 0.02);
      } catch { /* contexto cerrado */ }
      setTimeout(() => { try { old.disconnect(); } catch { /* ya desconectado */ } }, 40);
    }
    this.bus = null;
  }
}

/** Renderiza la pista completa (120 s) en un OfflineAudioContext. */
export function renderAll(ctx, destination, { melody = true } = {}) {
  const bus = ctx.createGain();
  bus.connect(limiter(ctx, destination));
  bus.gain.setValueAtTime(1, TOTAL_SECONDS - 0.03);
  bus.gain.linearRampToValueAtTime(0, TOTAL_SECONDS);
  for (const e of ARRANGEMENT) {
    if (e.type === 'lead' && !melody) continue;
    INSTRUMENTS[e.type](ctx, bus, e.t, e, TOTAL_SECONDS);
  }
}
