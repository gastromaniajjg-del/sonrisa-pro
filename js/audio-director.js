// Director de audio: decide qué suena según el modo y lo mantiene pegado al temporizador.
//
// Reglas:
//  · El temporizador manda. El audio se programa a partir de `timer.elapsed()`.
//  · Todo el audio termina, como muy tarde, en el segundo 120 (fundido de 30 ms que acaba ahí).
//  · Al completar, pausar o reiniciar se corta todo, haya terminado la canción o no.
//  · Si el reloj de audio se desvía más de 40 ms del temporizador, se recoloca.

import { AUDIO_MODES, AUDIO_FILES, TOTAL_SECONDS } from './config.js';
import { VOICE_CUES } from './song.js';
import { SynthMusic } from './music-engine.js';

const DRIFT_TOLERANCE = 0.04;
const START_LATENCY = 0.06;

export class AudioDirector {
  /**
   * @param {BrushingTimer} timer
   * @param {object} settings
   * @param {AudioDirector} [shareWith] reutiliza el contexto y los archivos de otro director (prueba de sonido)
   */
  constructor(timer, settings, shareWith = null) {
    this.shareWith = shareWith;
    this.timer = timer;
    this.settings = { mode: AUDIO_MODES.CANCION, musicVolume: 0.8, voiceVolume: 1, ...settings };
    this.ctx = null;
    this.assets = { instrumental: null, vocal: null, voice: new Map() };
    this.available = { instrumental: false, vocal: false, voz: [] };
    this._sources = [];
    this._firedCues = new Set();
    this._speechTimer = null;
    this._esVoice = null;
    this._anchor = null; // { ctx, song }

    timer.on('start', ({ elapsed }) => this._begin(elapsed));
    timer.on('resume', ({ elapsed }) => this._begin(elapsed));
    timer.on('pause', () => this.stopAll());
    timer.on('reset', () => this.stopAll());
    timer.on('complete', () => this.stopAll());
    timer.on('tick', ({ elapsed }) => this._onTick(elapsed));
  }

  // ── Inicialización ─────────────────────────────────────────────────────────
  /** Debe llamarse desde un gesto del usuario (requisito de los navegadores). */
  async unlock() {
    if (this.shareWith && !this.ctx) {
      await this.shareWith.unlock();
      this.ctx = this.shareWith.ctx;
      this.assets = this.shareWith.assets;
      this._buildGraph();
    }
    if (!this.ctx) {
      const Ctx = window.AudioContext || window.webkitAudioContext;
      if (!Ctx) return false;
      this.ctx = new Ctx({ latencyHint: 'interactive' });
      this._buildGraph();
      this._loadAssets(); // en segundo plano; si no hay archivos se usa síntesis
    }
    if (this.ctx.state === 'suspended') await this.ctx.resume();
    this._pickVoice();
    return true;
  }

  _buildGraph() {
    this.musicGain = this.ctx.createGain();
    this.voiceGain = this.ctx.createGain();
    this.duckGain = this.ctx.createGain();
    this.musicGain.connect(this.duckGain).connect(this.ctx.destination);
    this.voiceGain.connect(this.ctx.destination);
    this.applyVolumes();
    this.synth = new SynthMusic(this.ctx, this.musicGain);
  }

  /** Desconecta este director (solo para directores que comparten contexto). */
  dispose() {
    this.stopAll();
    setTimeout(() => {
      try { this.musicGain.disconnect(); this.duckGain.disconnect(); this.voiceGain.disconnect(); } catch { /* nada */ }
    }, 60);
  }

  async _loadAssets() {
    try {
      const res = await fetch('assets/audio/manifest.json', { cache: 'no-cache' });
      if (!res.ok) return;
      this.available = { ...this.available, ...(await res.json()) };
    } catch { return; }
    const load = async (url) => {
      const r = await fetch(url);
      if (!r.ok) throw new Error(url);
      return this.ctx.decodeAudioData(await r.arrayBuffer());
    };
    if (this.available.instrumental) this.assets.instrumental = await load(AUDIO_FILES.instrumental).catch(() => null);
    if (this.available.vocal) this.assets.vocal = await load(AUDIO_FILES.vocal).catch(() => null);
    for (const id of this.available.voz || []) {
      const buf = await load(`${AUDIO_FILES.voiceDir}${id}.mp3`).catch(() => null);
      if (buf) this.assets.voice.set(id, buf);
    }
  }

  _pickVoice() {
    if (!('speechSynthesis' in window)) return;
    const choose = () => {
      const voices = speechSynthesis.getVoices();
      const es = voices.filter((v) => v.lang?.toLowerCase().startsWith('es'));
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

  get hasSungVocal() {
    return !!this.assets.vocal;
  }

  // ── Reproducción ───────────────────────────────────────────────────────────
  _songToCtx = (songT) => this._anchor.ctx + (songT - this._anchor.song);

  _begin(elapsed) {
    this.stopAll();
    if (!this.ctx || elapsed >= TOTAL_SECONDS) return;
    const mode = this.settings.mode;
    // En el instante ctx+LATENCIA el temporizador marcará elapsed+LATENCIA.
    this._anchor = { ctx: this.ctx.currentTime + START_LATENCY, song: elapsed + START_LATENCY };
    // Los cues ya pasados no se repiten al reanudar.
    this._firedCues = new Set(VOICE_CUES.filter((c) => c.t < elapsed - 0.25).map((c) => c.id));

    if (mode === AUDIO_MODES.CANCION || mode === AUDIO_MODES.INSTRUMENTAL) {
      if (this.assets.instrumental) {
        this._playBuffer(this.assets.instrumental, this.musicGain, elapsed);
      } else {
        // Con pista cantada grabada, la melodía la lleva la voz: el sintetizador no la dobla.
        const melody = !(mode === AUDIO_MODES.CANCION && this.assets.vocal);
        this.synth.melody = melody;
        this.synth.play(elapsed, this._songToCtx);
      }
    }
    if (mode === AUDIO_MODES.CANCION && this.assets.vocal) {
      this._playBuffer(this.assets.vocal, this.voiceGain, elapsed);
    }
  }

  _playBuffer(buffer, out, fromSong) {
    const src = this.ctx.createBufferSource();
    src.buffer = buffer;
    const g = this.ctx.createGain();
    src.connect(g).connect(out);
    const startCtx = this._anchor.ctx;
    fromSong = this._anchor.song;
    const endCtx = this._songToCtx(TOTAL_SECONDS);
    g.gain.setValueAtTime(1, endCtx - 0.03);
    g.gain.linearRampToValueAtTime(0, endCtx);
    src.start(startCtx, fromSong); // offset = segundo de canción donde estamos
    src.stop(endCtx); // corte duro en el segundo 120, aunque el archivo dure más
    this._sources.push({ src, g, fromSong, startCtx });
  }

  _onTick(elapsed) {
    if (!this.ctx || !this._anchor || this.timer.state !== 'running') return;

    // 1) Control de desfase entre reloj de audio y temporizador.
    const expectedCtx = this._songToCtx(elapsed);
    const drift = this.ctx.currentTime - expectedCtx;
    if (Math.abs(drift) > DRIFT_TOLERANCE && this.ctx.currentTime > this._anchor.ctx) {
      if (this._sources.some((s) => !s.voice)) {
        // Archivos de audio: se recolocan para volver a coincidir.
        this._begin(elapsed);
        return;
      }
      this._anchor = { ctx: this.ctx.currentTime, song: elapsed };
      this.synth.retime(this._songToCtx);
    }

    // 2) Cues de voz.
    const mode = this.settings.mode;
    if (mode === AUDIO_MODES.INSTRUMENTAL) return;
    if (mode === AUDIO_MODES.CANCION && this.assets.vocal) return; // la letra cantada ya avisa
    for (const cue of VOICE_CUES) {
      if (cue.t > elapsed) break;
      if (this._firedCues.has(cue.id) || !cue.modes.includes(mode)) continue;
      this._firedCues.add(cue.id);
      if (elapsed - cue.t < 0.5) this._speak(cue, elapsed);
    }
  }

  _speak(cue, elapsed) {
    // Nunca más allá del siguiente cue ni del segundo 120.
    const budget = Math.min(cue.maxSeconds, TOTAL_SECONDS - elapsed) - 0.1;
    if (budget <= 0.3) return;
    const clip = this.assets.voice.get(cue.id);
    const duck = this.settings.mode === AUDIO_MODES.CANCION;
    if (clip) {
      const src = this.ctx.createBufferSource();
      src.buffer = clip;
      src.connect(this.voiceGain);
      const t = this.ctx.currentTime;
      src.start(t);
      src.stop(t + Math.min(budget, clip.duration));
      this._sources.push({ src, voice: true });
      if (duck) this._duck(t, Math.min(budget, clip.duration));
      return;
    }
    if (!('speechSynthesis' in window)) return;
    speechSynthesis.cancel();
    const u = new SpeechSynthesisUtterance(cue.text);
    u.lang = 'es-ES';
    if (this._esVoice) u.voice = this._esVoice;
    u.rate = 1.05;
    u.pitch = 1.25; // voz algo más aguda y simpática
    u.volume = Math.min(1, this.settings.voiceVolume);
    if (duck) {
      u.onstart = () => this._duck(this.ctx.currentTime, null);
      u.onend = () => this._unduck();
    }
    speechSynthesis.speak(u);
    clearTimeout(this._speechTimer);
    this._speechTimer = setTimeout(() => { speechSynthesis.cancel(); this._unduck(); }, budget * 1000);
  }

  _duck(t, dur) {
    const g = this.duckGain.gain;
    g.cancelScheduledValues(t);
    g.setTargetAtTime(0.45, t, 0.05);
    if (dur != null) g.setTargetAtTime(1, t + dur, 0.15);
  }

  _unduck() {
    if (!this.ctx) return;
    this.duckGain.gain.setTargetAtTime(1, this.ctx.currentTime, 0.15);
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
