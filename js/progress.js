// Progreso guardado en el dispositivo (localStorage). No sale del móvil.

import { DRONE_ACCESSORIES, TOOTH_ACCESSORIES, accessoriesFor, isUnlocked } from './accessories.js';
import { AUDIO_MODES } from './config.js';

const KEY = 'mision-sonrisa:v1';

const DEFAULTS = {
  profile: null, // { name, age, theme } — null hasta que se rellena la primera vez
  stars: 0, // recompensas: 1 por misión completada (compartidas entre temáticas)
  missions: [], // [{ date: ISO, seconds: 120, theme }]
  equipped: {
    drone: { arriba: null, frontal: null, carcasa: null },
    tooth: { cabeza: null, cara: null, cuello: null, capa: null },
  },
  audio: { mode: AUDIO_MODES.MUSICA_RADIO, musicVolume: 0.8, voiceVolume: 1 },
};

const clean = (s) => String(s ?? '').replace(/[<>]/g, '').trim().slice(0, 20);

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
      const audio = { ...DEFAULTS.audio, ...d.audio };
      if (!Object.values(AUDIO_MODES).includes(audio.mode)) audio.mode = DEFAULTS.audio.mode;
      const equipped = structuredClone(DEFAULTS.equipped);
      // Versiones anteriores guardaban los accesorios del dron sin agrupar.
      const oldDrone = d.equipped && !d.equipped.drone ? d.equipped : d.equipped?.drone;
      for (const slot of Object.keys(equipped.drone)) if (oldDrone?.[slot]) equipped.drone[slot] = oldDrone[slot];
      for (const slot of Object.keys(equipped.tooth)) if (d.equipped?.tooth?.[slot]) equipped.tooth[slot] = d.equipped.tooth[slot];
      return { ...structuredClone(DEFAULTS), ...d, equipped, audio, profile: d.profile ?? null };
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

  get profile() {
    return this.data.profile;
  }

  setProfile({ name, age, theme }) {
    const a = Math.max(2, Math.min(18, Math.round(Number(age)) || 8));
    this.data.profile = { name: clean(name), age: a, theme };
    this.save();
    return this.data.profile;
  }

  /** Registra una misión completa. Devuelve los accesorios recién desbloqueados (de los dos juegos). */
  completeMission(date = new Date(), theme = this.data.profile?.theme) {
    const before = this.data.stars;
    this.data.stars += 1;
    this.data.missions.push({ date: date.toISOString(), seconds: 120, theme });
    if (this.data.missions.length > 500) this.data.missions.splice(0, this.data.missions.length - 500);
    this.save();
    const fresh = (list) => list.filter((a) => a.stars > before && a.stars <= this.data.stars);
    return { drone: fresh(DRONE_ACCESSORIES), tooth: fresh(TOOTH_ACCESSORIES) };
  }

  equip(id, mascot = 'drone') {
    const acc = accessoriesFor(mascot).find((a) => a.id === id);
    if (!acc || !isUnlocked(acc, this.data.stars)) return false;
    const eq = this.data.equipped[mascot];
    eq[acc.slot] = eq[acc.slot] === id ? null : id;
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
