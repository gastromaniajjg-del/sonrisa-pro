// Temporizador maestro. Es la ÚNICA fuente de verdad del tiempo de cepillado.
// La música y la voz le siguen a él, nunca al revés: si el audio se retrasa,
// tarda en cargar o falla, el temporizador sigue y se detiene a los 120 s exactos.

import { SEGMENT_SECONDS, TOTAL_SECONDS, PHRASE_SECONDS } from './config.js';

export class BrushingTimer {
  /**
   * @param {object} [opts]
   * @param {() => number} [opts.now]  reloj en milisegundos (inyectable para tests)
   * @param {number} [opts.total]      duración en segundos
   */
  constructor({ now = () => performance.now(), total = TOTAL_SECONDS } = {}) {
    this.now = now;
    this.total = total;
    this.state = 'idle'; // idle | running | paused | done
    this._accumulated = 0; // ms acumulados antes de la última reanudación
    this._startedAt = 0;
    this._listeners = new Map();
    this._lastSegment = -1;
    this._lastPhrase = -1;
  }

  on(event, fn) {
    if (!this._listeners.has(event)) this._listeners.set(event, new Set());
    this._listeners.get(event).add(fn);
    return () => this._listeners.get(event).delete(fn);
  }

  _emit(event, payload) {
    this._listeners.get(event)?.forEach((fn) => fn(payload));
  }

  /** Segundos transcurridos, siempre entre 0 y total. */
  elapsed() {
    let ms = this._accumulated;
    if (this.state === 'running') ms += this.now() - this._startedAt;
    return Math.min(this.total, Math.max(0, ms / 1000));
  }

  remaining() {
    return this.total - this.elapsed();
  }

  start() {
    if (this.state === 'running') return;
    if (this.state === 'done' || this.state === 'idle') {
      this._accumulated = 0;
      this._lastSegment = -1;
      this._lastPhrase = -1;
    }
    this._startedAt = this.now();
    this.state = 'running';
    this._emit('start', { elapsed: this.elapsed() });
    this.update();
  }

  pause() {
    if (this.state !== 'running') return;
    this._accumulated += this.now() - this._startedAt;
    this.state = 'paused';
    this._emit('pause', { elapsed: this.elapsed() });
  }

  resume() {
    if (this.state !== 'paused') return;
    this._startedAt = this.now();
    this.state = 'running';
    this._emit('resume', { elapsed: this.elapsed() });
  }

  reset() {
    this.state = 'idle';
    this._accumulated = 0;
    this._lastSegment = -1;
    this._lastPhrase = -1;
    this._emit('reset', {});
  }

  /**
   * Avanza la lógica. Se llama desde el bucle de la app (y desde un setTimeout de
   * respaldo), pero el tiempo se calcula siempre con el reloj, así que da igual
   * cada cuánto se llame: el resultado es exacto.
   */
  update() {
    if (this.state !== 'running') return;
    const t = this.elapsed();

    const seg = Math.min(3, Math.floor(t / SEGMENT_SECONDS));
    if (seg !== this._lastSegment) {
      this._lastSegment = seg;
      this._emit('segment', { index: seg, elapsed: t });
    }
    const phrase = Math.min(15, Math.floor(t / PHRASE_SECONDS));
    if (phrase !== this._lastPhrase) {
      this._lastPhrase = phrase;
      this._emit('step', { index: phrase % 4, segment: seg, elapsed: t });
    }

    this._emit('tick', { elapsed: t, remaining: this.total - t });

    if (t >= this.total) {
      this._accumulated = this.total * 1000;
      this.state = 'done';
      this._emit('complete', { elapsed: this.total });
    }
  }
}

/** Formato 1:05 */
export function formatTime(seconds) {
  const s = Math.max(0, Math.ceil(seconds));
  return `${Math.floor(s / 60)}:${String(s % 60).padStart(2, '0')}`;
}
