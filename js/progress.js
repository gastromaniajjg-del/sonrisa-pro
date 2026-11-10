// Progreso guardado en el dispositivo (localStorage). No sale del móvil.

import { ACCESSORIES, isUnlocked } from './accessories.js';
import { AUDIO_MODES } from './config.js';

const KEY = 'mision-sonrisa:v1';

const DEFAULTS = {
  stars: 0,
  missions: [], // [{ date: ISO, seconds: 120 }]
  equipped: { cabeza: null, cara: null, cuello: null, capa: null },
  audio: { mode: AUDIO_MODES.CANCION, musicVolume: 0.8, voiceVolume: 1 },
};

export class Progress {
  constructor(storage = globalThis.localStorage) {
    this.storage = storage;
    this.data = this._load();
  }

  _load() {
    try {
      const raw = this.storage?.getItem(KEY);
      if (!raw) return structuredClone(DEFAULTS);
      const d = JSON.parse(raw);
      return {
        ...structuredClone(DEFAULTS),
        ...d,
        equipped: { ...DEFAULTS.equipped, ...d.equipped },
        audio: { ...DEFAULTS.audio, ...d.audio },
      };
    } catch {
      return structuredClone(DEFAULTS);
    }
  }

  save() {
    try {
      this.storage?.setItem(KEY, JSON.stringify(this.data));
      return true;
    } catch {
      return false; // modo privado o almacenamiento lleno: la app sigue funcionando
    }
  }

  get stars() {
    return this.data.stars;
  }

  /** Registra una misión completa. Devuelve los accesorios recién desbloqueados. */
  completeMission(date = new Date()) {
    const before = this.data.stars;
    this.data.stars += 1;
    this.data.missions.push({ date: date.toISOString(), seconds: 120 });
    if (this.data.missions.length > 500) this.data.missions.splice(0, this.data.missions.length - 500);
    this.save();
    return ACCESSORIES.filter((a) => a.stars > before && a.stars <= this.data.stars);
  }

  equip(id) {
    const acc = ACCESSORIES.find((a) => a.id === id);
    if (!acc || !isUnlocked(acc, this.data.stars)) return false;
    this.data.equipped[acc.slot] = this.data.equipped[acc.slot] === id ? null : id;
    this.save();
    return true;
  }

  setAudio(patch) {
    this.data.audio = { ...this.data.audio, ...patch };
    this.save();
  }

  missionsToday(now = new Date()) {
    const day = now.toDateString();
    return this.data.missions.filter((m) => new Date(m.date).toDateString() === day).length;
  }
}
