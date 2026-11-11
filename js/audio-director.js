// Director de audio: decide qué suena según el modo y lo mantiene pegado al temporizador.
//
// Reglas:
//  · El temporizador manda. El audio se programa a partir de `timer.elapsed()`.
//  · Todo el audio termina, como muy tarde, en el segundo 120 (fundido de 30 ms que acaba ahí).
//  · Al completar, pausar o reiniciar se corta todo, haya terminado la música o no.
//  · Si el reloj de audio se desvía más de 40 ms del temporizador, se recoloca.

import { AUDIO_MODES, AUDIO_FILES, TOTAL_SECONDS } from './config.js';
import { cuesFor, getTheme } from './themes.js';
import { arrangementFor } from './arrangements.js';
import { SynthMusic } from './music-engine.js';

const DRIFT_TOLERANCE = 0.04;

// ── Desbloqueo de audio en iPhone ────────────────────────────────────────────
// Safari en iOS trata el audio de una web como «sonido de aviso»: si el interruptor
// lateral está en silencio, no suena nada. Reproducir un <audio> silencioso en bucle
// (y pedir la sesión de audio «playback» donde existe) lo pasa a «reproducción
// multimedia», que suena aunque el interruptor esté en silencio.
let silentEl = null;
function silentWavUrl() {
  const n = 4000; // 0,5 s a 8 kHz, 8 bits
  const buf = new ArrayBuffer(44 + n);
  const v = new DataView(buf);
  const w = (o, str) => [...str].forEach((c, i) => v.setUint8(o + i, c.charCodeAt(0)));
  w(0, 'RIFF'); v.setUint32(4, 36 + n, true); w(8, 'WAVE'); w(12, 'fmt ');
  v.setUint32(16, 16, true); v.setUint16(20, 1, true); v.setUint16(22, 1, true);
  v.setUint32(24, 8000, true); v.setUint32(28, 8000, true); v.setUint16(32, 1, true); v.setUint16(34, 8, true);
  w(36, 'data'); v.setUint32(40, n, true);
  for (let i = 0; i < n; i++) v.setUint8(44 + i, 128);
  return URL.createObjectURL(new Blob([buf], { type: 'audio/wav' }));
}
function unlockMediaSession() {
  try { if (navigator.audioSession) navigator.audioSession.type = 'playback'; } catch { /* no soportado */ }
  try {
    if (!silentEl) {
      silentEl = new Audio(silentWavUrl());
      silentEl.loop = true;
      silentEl.setAttribute('playsinline', '');
    }
    if (silentEl.paused) silentEl.play().catch(() => {});
  } catch { /* no soportado */ }
}
function releaseMediaSession() {
  try { silentEl?.pause(); } catch { /* nada */ }
}
const START_LATENCY = 0.06;

export class AudioDirector {
  /**
   * @param {BrushingTimer} timer
   * @param {object} settings
   * @param {AudioDirector} [shareWith] reutiliza el contexto y los archivos de otro director (prueba de sonido)
   */
  constructor(timer, settings, shareWith = null) {
    this.timer = timer;
    this.shareWith = shareWith;
    this.settings = { mode: AUDIO_MODES.MUSICA_RADIO, musicVolume: 0.8, voiceVolume: 1, ...settings };
    this.ctx = null;
    this._store = {}; // audios grabados por temática
    this._manifest = null;
    this._sources = [];
    this._firedCues = new Set();
    this._speechTimer = null;
    this._esVoice = null;
    this._anchor = null; // { ctx, song }
    this.setTheme(getTheme(settings?.theme), settings?.name);

    timer.on('start', ({ elapsed }) => this._begin(elapsed));
    timer.on('resume', ({ elapsed }) => this._begin(elapsed));
    timer.on('pause', () => this.stopAll());
    timer.on('reset', () => { this.stopAll(); if (!this.shareWith) releaseMediaSession(); });
    timer.on('complete', () => { this.stopAll(); if (!this.shareWith) releaseMediaSession(); });
    timer.on('tick', ({ elapsed }) => this._onTick(elapsed));
  }

  // ── Inicialización ─────────────────────────────────────────────────────────
  /**
   * Debe llamarse desde un gesto del usuario (requisito de los navegadores).
   * Todo lo que desbloquea el audio se hace de forma síncrona, antes del primer `await`,
   * porque Safari en iPhone solo lo acepta dentro del propio toque.
   */
  async unlock() {
    unlockMediaSession();
    let pending = null;
    if (this.shareWith && !this.ctx) {
      pending = this.shareWith.unlock(); // crea su contexto de forma síncrona
      this.ctx = this.shareWith.ctx;
      if (this.ctx) this._buildGraph();
    }
    if (!this.ctx) {
      const Ctx = window.AudioContext || window.webkitAudioContext;
      if (!Ctx) return false;
      this.ctx = new Ctx({ latencyHint: 'interactive' });
      this._buildGraph();
      this._loadAssets(); // en segundo plano; si no hay archivos se usa síntesis
    }
    const resumed = this.ctx.state !== 'running' ? this.ctx.resume() : null;
    // Un sonido vacío dentro del toque termina de desbloquear el audio en iOS.
    try {
      const src = this.ctx.createBufferSource();
      src.buffer = this.ctx.createBuffer(1, 1, 22050);
      src.connect(this.ctx.destination);
      src.start(0);
    } catch { /* nada */ }
    this._pickVoice();
    // iOS bloquea la voz si la primera frase no sale de un toque: se «estrena» con una vacía.
    if ('speechSynthesis' in window && !this._speechPrimed) {
      try {
        const u = new SpeechSynthesisUtterance(' ');
        u.volume = 0;
        speechSynthesis.speak(u);
        this._speechPrimed = true;
      } catch { /* nada */ }
    }
    await Promise.all([resumed, pending].map((x) => x?.catch?.(() => {})));
    return this.ctx.state === 'running';
  }

  _buildGraph() {
    const ctx = this.ctx;
    this.musicGain = ctx.createGain();
    this.duckGain = ctx.createGain();
    this.voiceGain = ctx.createGain();
    this.musicGain.connect(this.duckGain).connect(ctx.destination);
    this.voiceGain.connect(ctx.destination);
    // Cadena «walkie-talkie» para las frases grabadas: banda estrecha + algo de saturación.
    this.radioIn = ctx.createBiquadFilter();
    this.radioIn.type = 'highpass';
    this.radioIn.frequency.value = 350;
    const lp = ctx.createBiquadFilter();
    lp.type = 'lowpass';
    lp.frequency.value = 3400;
    const shaper = ctx.createWaveShaper();
    const curve = new Float32Array(256);
    for (let i = 0; i < 256; i++) { const x = (i / 255) * 2 - 1; curve[i] = Math.tanh(x * 2.2) / Math.tanh(2.2); }
    shaper.curve = curve;
    this.radioIn.connect(lp).connect(shaper).connect(this.voiceGain);
    this.applyVolumes();
    this.synth = new SynthMusic(ctx, this.musicGain, this.arrangement);
  }

  /** Audios grabados de la temática actual (vacío si no hay: se usa síntesis y voz del sistema). */
  get assets() {
    const store = (this.shareWith || this)._store;
    return (store[this.theme.id] ??= { instrumental: null, voice: new Map() });
  }

  async _loadAssets() {
    if (!this.ctx) return;
    try {
      if (!this._manifest) {
        const res = await fetch('assets/audio/manifest.json', { cache: 'no-cache' });
        if (!res.ok) return;
        this._manifest = await res.json();
      }
    } catch { return; }
    const id = this.theme.id;
    const entry = this._manifest[id];
    const target = this.assets;
    if (!entry || target.loaded) return;
    target.loaded = true;
    const load = async (url) => {
      const r = await fetch(url);
      if (!r.ok) throw new Error(url);
      return this.ctx.decodeAudioData(await r.arrayBuffer());
    };
    const dir = `${AUDIO_FILES.dir}${id}/`;
    if (entry.instrumental) target.instrumental = await load(`${dir}musica.mp3`).catch(() => null);
    for (const cue of entry.voz || []) {
      const buf = await load(`${dir}voz/${cue}.mp3`).catch(() => null);
      if (buf) target.voice.set(cue, buf);
    }
  }

  _pickVoice() {
    if (!('speechSynthesis' in window)) return;
    const choose = () => {
      const es = speechSynthesis.getVoices().filter((v) => v.lang?.toLowerCase().startsWith('es'));
      // Preferimos voces de España y locales (las locales funcionan sin conexión).
      this._esVoice =
        es.find((v) => v.lang === 'es-ES' && v.localService) ||
        es.find((v) => v.lang === 'es-ES') ||
        es.find((v) => v.localService) ||
        es[0] || null;
    };
    choose();
    speechSynthesis.onvoiceschanged = choose;
  }

  // ── Ajustes ────────────────────────────────────────────────────────────────
  /** Temática y nombre: cambian la música, la voz y los mensajes. */
  setTheme(theme, name) {
    this.theme = theme;
    this.cues = cuesFor(theme, name);
    this.arrangement = arrangementFor(theme);
    if (this.synth) this.synth.arrangement = this.arrangement;
    this._loadAssets();
  }

  setMode(mode) {
    this.settings.mode = mode;
    if (this.timer.state === 'running') this._begin(this.timer.elapsed());
  }

  setVolumes({ musicVolume, voiceVolume }) {
    if (musicVolume != null) this.settings.musicVolume = musicVolume;
    if (voiceVolume != null) this.settings.voiceVolume = voiceVolume;
    this.applyVolumes();
  }

  applyVolumes() {
    if (!this.ctx) return;
    const t = this.ctx.currentTime;
    this.musicGain.gain.setTargetAtTime(this.settings.musicVolume, t, 0.03);
    this.voiceGain.gain.setTargetAtTime(this.settings.voiceVolume, t, 0.03);
  }

  get musicOn() {
    return this.settings.mode !== AUDIO_MODES.RADIO;
  }

  get radioOn() {
    return this.settings.mode !== AUDIO_MODES.MUSICA;
  }

  // ── Reproducción ───────────────────────────────────────────────────────────
  _songToCtx = (songT) => this._anchor.ctx + (songT - this._anchor.song);

  _begin(elapsed) {
    this.stopAll();
    if (!this.ctx || elapsed >= TOTAL_SECONDS) return;
    // En el instante ctx+LATENCIA el temporizador marcará elapsed+LATENCIA.
    this._anchor = { ctx: this.ctx.currentTime + START_LATENCY, song: elapsed + START_LATENCY };
    // Los mensajes ya pasados no se repiten al reanudar.
    this._firedCues = new Set(this.cues.filter((c) => c.t < elapsed - 0.25).map((c) => c.id));

    if (this.musicOn) {
      if (this.assets.instrumental) this._playBuffer(this.assets.instrumental, this.musicGain);
      else this.synth.play(elapsed, this._songToCtx);
    }
  }

  _playBuffer(buffer, out) {
    const src = this.ctx.createBufferSource();
    src.buffer = buffer;
    const g = this.ctx.createGain();
    src.connect(g).connect(out);
    const startCtx = this._anchor.ctx;
    const endCtx = this._songToCtx(TOTAL_SECONDS);
    g.gain.setValueAtTime(1, endCtx - 0.03);
    g.gain.linearRampToValueAtTime(0, endCtx);
    src.start(startCtx, this._anchor.song); // empieza en el segundo donde está el temporizador
    src.stop(endCtx); // corte duro en el segundo 120, aunque el archivo dure más
    this._sources.push({ src, g });
  }

  _onTick(elapsed) {
    if (!this.ctx || !this._anchor || this.timer.state !== 'running') return;

    // 1) Control de desfase entre reloj de audio y temporizador.
    const drift = this.ctx.currentTime - this._songToCtx(elapsed);
    if (Math.abs(drift) > DRIFT_TOLERANCE && this.ctx.currentTime > this._anchor.ctx) {
      if (this._sources.some((s) => !s.voice)) {
        this._begin(elapsed); // archivo de audio: se recoloca
        return;
      }
      this._anchor = { ctx: this.ctx.currentTime, song: elapsed };
      this.synth.retime(this._songToCtx);
    }

    // 2) Mensajes de radio.
    if (!this.radioOn) return;
    for (const cue of this.cues) {
      if (cue.t > elapsed) break;
      if (this._firedCues.has(cue.id)) continue;
      this._firedCues.add(cue.id);
      if (elapsed - cue.t < 0.5) this._speak(cue, elapsed);
    }
  }

  /** Chasquido de «pulsar para hablar». */
  _squelch(t) {
    const len = Math.floor(this.ctx.sampleRate * 0.12);
    const buf = this.ctx.createBuffer(1, len, this.ctx.sampleRate);
    const d = buf.getChannelData(0);
    for (let i = 0; i < len; i++) d[i] = (Math.random() * 2 - 1) * (1 - i / len);
    const src = this.ctx.createBufferSource();
    src.buffer = buf;
    const g = this.ctx.createGain();
    g.gain.value = 0.18;
    src.connect(g).connect(this.radioIn);
    src.start(t);
    this._sources.push({ src, voice: true });
  }

  _speak(cue, elapsed) {
    // Nunca más allá del siguiente mensaje ni del segundo 120.
    const budget = Math.min(cue.maxSeconds, TOTAL_SECONDS - elapsed) - 0.1;
    if (budget <= 0.3) return;
    const duck = this.musicOn;
    const t = this.ctx.currentTime;
    const radio = this.theme.voice.radio;
    if (radio) this._squelch(t);
    const clip = this.assets.voice.get(cue.id);
    if (clip) {
      const src = this.ctx.createBufferSource();
      src.buffer = clip;
      src.connect(radio ? this.radioIn : this.voiceGain);
      const len = Math.min(budget - 0.1, clip.duration);
      src.start(t + 0.1);
      src.stop(t + 0.1 + len);
      this._sources.push({ src, voice: true });
      if (duck) this._duck(t, len + 0.1);
      return;
    }
    if (!('speechSynthesis' in window)) return;
    speechSynthesis.cancel();
    const u = new SpeechSynthesisUtterance(cue.text);
    u.lang = 'es-ES';
    if (this._esVoice) u.voice = this._esVoice;
    u.rate = this.theme.voice.rate;
    u.pitch = this.theme.voice.pitch;
    u.volume = Math.min(1, this.settings.voiceVolume);
    if (duck) {
      u.onstart = () => this._duck(this.ctx.currentTime, null);
      u.onend = () => this._unduck();
    }
    setTimeout(() => speechSynthesis.speak(u), 100);
    clearTimeout(this._speechTimer);
    this._speechTimer = setTimeout(() => { speechSynthesis.cancel(); this._unduck(); }, budget * 1000);
  }

  _duck(t, dur) {
    const g = this.duckGain.gain;
    g.cancelScheduledValues(t);
    g.setTargetAtTime(0.4, t, 0.05);
    if (dur != null) g.setTargetAtTime(1, t + dur, 0.15);
  }

  _unduck() {
    if (!this.ctx) return;
    this.duckGain.gain.setTargetAtTime(1, this.ctx.currentTime, 0.15);
  }

  /** Desconecta este director (solo para directores que comparten contexto). */
  dispose() {
    this.stopAll();
    setTimeout(() => {
      try { this.musicGain.disconnect(); this.duckGain.disconnect(); this.voiceGain.disconnect(); } catch { /* nada */ }
    }, 60);
  }

  /** Corta todo el audio inmediatamente. */
  stopAll() {
    this.synth?.stop();
    const now = this.ctx?.currentTime ?? 0;
    for (const s of this._sources) {
      try {
        if (s.g) {
          s.g.gain.cancelScheduledValues(now);
          s.g.gain.setValueAtTime(s.g.gain.value, now);
          s.g.gain.linearRampToValueAtTime(0, now + 0.02);
        }
        s.src.stop(now + 0.025);
      } catch { /* ya parado */ }
    }
    this._sources = [];
    this._anchor = null;
    clearTimeout(this._speechTimer);
    if ('speechSynthesis' in window) speechSynthesis.cancel();
    this._unduck();
  }
}
