// Motor de la banda sonora original, sintetizada en tiempo real con Web Audio.
// No usa muestras ni archivos externos: funciona sin conexión desde el primer momento.
// Sirve para un AudioContext normal (reproducción) o un OfflineAudioContext (exportar WAV).

import { TOTAL_SECONDS } from './config.js';

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
    // Melodía: cuadrada suave + triángulo una octava arriba, con vibrato ligero.
    const g = ctx.createGain();
    const f = ctx.createBiquadFilter();
    f.type = 'lowpass';
    f.frequency.value = 2600;
    const o1 = ctx.createOscillator();
    const o2 = ctx.createOscillator();
    o1.type = e.wave || 'square';
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

  tom(ctx, out, t, e, end) {
    // Tambor grave (dinosaurios, estadio).
    const o = ctx.createOscillator();
    const g = ctx.createGain();
    o.type = 'sine';
    const hz = midiToHz(e.note || 45);
    o.frequency.setValueAtTime(hz * 1.6, t);
    o.frequency.exponentialRampToValueAtTime(hz, t + 0.08);
    g.gain.setValueAtTime(0.35 * e.vel, t);
    g.gain.exponentialRampToValueAtTime(0.001, t + 0.35);
    o.connect(g).connect(out);
    o.start(t);
    o.stop(Math.min(end, t + 0.36));
  },

  waves(ctx, out, t, e, end) {
    // Olas / agua: ruido filtrado que sube y baja lentamente.
    const src = ctx.createBufferSource();
    src.buffer = noiseBuffer(ctx);
    src.loop = true;
    const f = ctx.createBiquadFilter();
    f.type = 'lowpass';
    f.frequency.value = e.cutoff || 600;
    const g = ctx.createGain();
    const stop = Math.min(end, t + e.dur);
    const lfo = ctx.createOscillator();
    const lfoG = ctx.createGain();
    lfo.frequency.value = e.rate || 0.12;
    lfoG.gain.value = 0.02 * e.vel;
    lfo.connect(lfoG).connect(g.gain);
    g.gain.setValueAtTime(0.0001, t);
    g.gain.linearRampToValueAtTime(0.03 * e.vel, t + 2);
    g.gain.setValueAtTime(0.03 * e.vel, Math.max(t + 2, stop - 0.5));
    g.gain.linearRampToValueAtTime(0.0001, stop);
    src.connect(f).connect(g).connect(out);
    src.start(t);
    lfo.start(t);
    src.stop(stop);
    lfo.stop(stop);
  },

  crowd(ctx, out, t, e, end) {
    // Murmullo de grada: ruido de banda media con ondulación.
    INSTRUMENTS.waves(ctx, out, t, { ...e, cutoff: 1400, rate: 0.35 }, end);
  },

  chirp(ctx, out, t, e, end) {
    // Pajarito / luciérnaga / sonar: barrido corto agudo.
    const o = ctx.createOscillator();
    const g = ctx.createGain();
    o.type = 'sine';
    const hz = midiToHz(e.note || 96);
    o.frequency.setValueAtTime(hz, t);
    o.frequency.exponentialRampToValueAtTime(hz * (e.up ? 1.5 : 0.7), t + e.dur);
    g.gain.setValueAtTime(0.0001, t);
    g.gain.linearRampToValueAtTime(0.04 * e.vel, t + 0.01);
    g.gain.exponentialRampToValueAtTime(0.0001, t + e.dur);
    o.connect(g).connect(out);
    o.start(t);
    o.stop(Math.min(end, t + e.dur));
  },
  hum(ctx, out, t, e, end) {
    // Zumbido de fluorescente: 50 Hz y armónicos, con un leve temblor de intensidad.
    const g = ctx.createGain();
    const f = ctx.createBiquadFilter();
    f.type = 'bandpass';
    f.frequency.value = 200;
    f.Q.value = 0.7;
    const stop = Math.min(end, t + e.dur);
    [50, 100, 150, 200].forEach((hz, i) => {
      const o = ctx.createOscillator();
      o.type = i === 0 ? 'sine' : 'sawtooth';
      o.frequency.value = hz;
      const og = ctx.createGain();
      og.gain.value = [1, 0.35, 0.12, 0.08][i];
      o.connect(og).connect(f);
      o.start(t);
      o.stop(stop);
    });
    const lfo = ctx.createOscillator();
    const lfoG = ctx.createGain();
    lfo.frequency.value = 0.23 + e.level * 0.11;
    lfoG.gain.value = 0.006 * e.vel;
    lfo.connect(lfoG).connect(g.gain);
    lfo.start(t);
    lfo.stop(stop);
    f.connect(g).connect(out);
    g.gain.setValueAtTime(0.0001, t);
    g.gain.linearRampToValueAtTime(0.022 * e.vel, t + 1.5);
    g.gain.setValueAtTime(0.022 * e.vel, Math.max(t + 1.5, stop - 0.4));
    g.gain.linearRampToValueAtTime(0.0001, stop);
  },

  sub(ctx, out, t, e, end) {
    const o = ctx.createOscillator();
    const g = ctx.createGain();
    o.type = 'sine';
    o.frequency.value = midiToHz(e.note);
    o.connect(g).connect(out);
    g.gain.setValueAtTime(0.0001, t);
    g.gain.linearRampToValueAtTime(0.16 * e.vel, t + 0.3);
    g.gain.setTargetAtTime(0.0001, t + e.dur - 0.2, 0.07);
    o.start(t);
    o.stop(Math.min(end, t + e.dur));
  },

  arp(ctx, out, t, e, end) {
    // Arpegio electrónico: cuadrada filtrada; el filtro se abre en cada nivel.
    const o = ctx.createOscillator();
    const f = ctx.createBiquadFilter();
    const g = ctx.createGain();
    o.type = e.wave || 'square';
    o.frequency.value = midiToHz(e.note);
    f.type = 'lowpass';
    f.Q.value = 4;
    const cut = e.cutoff || 700 + e.level * 650;
    f.frequency.setValueAtTime(cut * 2, t);
    f.frequency.exponentialRampToValueAtTime(cut, t + 0.08);
    o.connect(f).connect(g).connect(out);
    env(g.gain, t, 0.05 * e.vel, 0.004, e.dur, 0.03);
    o.start(t);
    o.stop(Math.min(end, t + e.dur + 0.06));
  },

  bass(ctx, out, t, e, end) {
    const o = ctx.createOscillator();
    const f = ctx.createBiquadFilter();
    const g = ctx.createGain();
    o.type = 'sawtooth';
    o.frequency.value = midiToHz(e.note + 12);
    f.type = 'lowpass';
    f.Q.value = 5;
    f.frequency.setValueAtTime(800, t);
    f.frequency.exponentialRampToValueAtTime(180, t + 0.15);
    o.connect(f).connect(g).connect(out);
    env(g.gain, t, 0.16 * e.vel, 0.005, e.dur, 0.03);
    o.start(t);
    o.stop(Math.min(end, t + e.dur + 0.05));
  },

  pad(ctx, out, t, e, end) {
    // Acordes de fondo oscuros; más abiertos a medida que suben los niveles.
    const g = ctx.createGain();
    const f = ctx.createBiquadFilter();
    f.type = 'lowpass';
    f.frequency.value = 500 + (e.level ?? 0) * 260 + (e.vel > 0.85 ? 1500 : 0);
    f.connect(g).connect(out);
    const stop = Math.min(end, t + e.dur + 0.3);
    e.notes.forEach((n, i) => {
      [-8, 8].forEach((detune) => {
        const o = ctx.createOscillator();
        o.type = 'sawtooth';
        o.frequency.value = midiToHz(n);
        o.detune.value = detune + i * 2;
        o.connect(f);
        o.start(t);
        o.stop(stop);
      });
    });
    g.gain.setValueAtTime(0.0001, t);
    g.gain.linearRampToValueAtTime(0.03 * e.vel, t + 0.5);
    g.gain.setTargetAtTime(0.0001, t + e.dur - 0.1, 0.1);
  },

  shimmer(ctx, out, t, e, end) {
    // Acorde final luminoso: la «luz de la salida».
    const g = ctx.createGain();
    g.connect(out);
    const stop = Math.min(end, t + e.dur);
    e.notes.forEach((n, i) => {
      const o = ctx.createOscillator();
      o.type = 'triangle';
      o.frequency.value = midiToHz(n);
      o.detune.value = (i - 1.5) * 4;
      o.connect(g);
      o.start(t);
      o.stop(stop);
    });
    g.gain.setValueAtTime(0.0001, t);
    g.gain.linearRampToValueAtTime(0.05 * e.vel, t + 0.4);
    g.gain.setValueAtTime(0.05 * e.vel, Math.max(t + 0.4, stop - 0.5));
    g.gain.linearRampToValueAtTime(0.0001, stop);
  },

  static(ctx, out, t, e, end) {
    // Estática de radio.
    const src = ctx.createBufferSource();
    src.buffer = noiseBuffer(ctx);
    const f = ctx.createBiquadFilter();
    f.type = 'bandpass';
    f.frequency.value = 2200;
    f.Q.value = 0.8;
    const g = ctx.createGain();
    g.gain.setValueAtTime(0.12 * e.vel, t);
    g.gain.setValueAtTime(0.03 * e.vel, t + e.dur * 0.3);
    g.gain.linearRampToValueAtTime(0.0001, t + e.dur);
    src.connect(f).connect(g).connect(out);
    src.start(t, (t * 1.7) % 0.5);
    src.stop(Math.min(end, t + e.dur));
  },

  alarm(ctx, out, t, e, end) {
    const o = ctx.createOscillator();
    const g = ctx.createGain();
    o.type = 'square';
    o.frequency.value = midiToHz(e.note);
    const f = ctx.createBiquadFilter();
    f.type = 'lowpass';
    f.frequency.value = 2500;
    o.connect(f).connect(g).connect(out);
    g.gain.setValueAtTime(0.0001, t);
    g.gain.linearRampToValueAtTime(0.05 * e.vel, t + 0.01);
    g.gain.setValueAtTime(0.05 * e.vel, t + e.dur - 0.03);
    g.gain.linearRampToValueAtTime(0.0001, t + e.dur);
    o.start(t);
    o.stop(Math.min(end, t + e.dur));
  },

  zap(ctx, out, t, e, end) {
    // Chasquido de fluorescente que falla.
    const src = ctx.createBufferSource();
    src.buffer = noiseBuffer(ctx);
    const f = ctx.createBiquadFilter();
    f.type = 'highpass';
    f.frequency.value = 3000;
    const g = ctx.createGain();
    g.gain.setValueAtTime(0.0001, t);
    [0, 0.06, 0.09, 0.17].forEach((d) => {
      g.gain.setValueAtTime(0.09 * e.vel, t + d);
      g.gain.setValueAtTime(0.0001, t + d + 0.025);
    });
    src.connect(f).connect(g).connect(out);
    src.start(t, (t * 2.3) % 0.5);
    src.stop(Math.min(end, t + e.dur));
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
    g.gain.linearRampToValueAtTime(0.07 * e.vel, t + 0.005);
    g.gain.exponentialRampToValueAtTime(0.0001, t + e.dur);
    car.connect(g).connect(out);
    const stop = Math.min(end, t + e.dur);
    car.start(t); mod.start(t); car.stop(stop); mod.stop(stop);
  },
};


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
  constructor(ctx, destination, arrangement = []) {
    this.ctx = ctx;
    this.destination = destination;
    this.arrangement = arrangement;
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

    const ARRANGEMENT = this.arrangement;
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
export function renderAll(ctx, destination, ARRANGEMENT) {
  const bus = ctx.createGain();
  bus.connect(limiter(ctx, destination));
  bus.gain.setValueAtTime(1, TOTAL_SECONDS - 0.03);
  bus.gain.linearRampToValueAtTime(0, TOTAL_SECONDS);
  for (const e of ARRANGEMENT) {
    INSTRUMENTS[e.type](ctx, bus, e.t, e, TOTAL_SECONDS);
  }
}
