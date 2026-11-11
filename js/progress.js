// Progreso guardado en el dispositivo (localStorage). No sale del móvil.
//
// Reglas de motivación:
//  · Cada día tiene dos turnos: mañana (de 4:00 a 13:59) y noche (de 14:00 a 3:59).
//    Lo que pasa de madrugada cuenta para la noche del día anterior.
//  · Solo el primer cepillado de cada turno da premio: máximo 2 al día.
//    Los demás se registran, pero no suman (así no se desbloquea todo en una tarde).
//  · Racha: días seguidos con al menos un cepillado. Día perfecto: mañana y noche.

import { DRONE_ACCESSORIES, TOOTH_ACCESSORIES, accessoriesFor, isUnlocked } from './accessories.js';
import { ACHIEVEMENTS } from './achievements.js';
import { AUDIO_MODES } from './config.js';

const KEY = 'mision-sonrisa:v1';
const DAY_START_HOUR = 4;
const NIGHT_FROM_HOUR = 14;

const DEFAULTS = {
  profile: null, // { name, age, theme }
  stars: 0, // premios: máximo 2 al día (compartidos entre aventuras)
  missions: [], // [{ date: ISO, seconds: 120, theme, slot: 'manana'|'noche', rewarded }]
  achievements: {}, // { id: fecha ISO en que se consiguió }
  pact: null, // { reward, type: 'racha'|'perfectos', target, since: 'AAAA-MM-DD', doneAt?, deliveredAt? }
  equipped: {
    drone: { arriba: null, frontal: null, carcasa: null },
    tooth: { cabeza: null, cara: null, cuello: null, capa: null },
  },
  audio: { mode: AUDIO_MODES.MUSICA_RADIO, musicVolume: 0.8, voiceVolume: 1 },
};

const clean = (s, n = 20) => String(s ?? '').replace(/[<>]/g, '').trim().slice(0, n);
const pad = (n) => String(n).padStart(2, '0');

/** Día «de cepillado» (AAAA-MM-DD) al que pertenece una fecha. */
export function dayKey(date) {
  const d = new Date(date);
  if (d.getHours() < DAY_START_HOUR) d.setDate(d.getDate() - 1);
  return `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}`;
}

export function slotOf(date) {
  const h = new Date(date).getHours();
  return h >= DAY_START_HOUR && h < NIGHT_FROM_HOUR ? 'manana' : 'noche';
}

/** Suma días a una clave AAAA-MM-DD. */
export function addDays(key, n) {
  const [y, m, d] = key.split('-').map(Number);
  const dt = new Date(y, m - 1, d + n, 12);
  return `${dt.getFullYear()}-${pad(dt.getMonth() + 1)}-${pad(dt.getDate())}`;
}

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
      // Misiones antiguas: se les calcula el turno; su premio ya se había dado.
      const missions = (d.missions || []).map((m) => ({ slot: slotOf(m.date), rewarded: true, ...m }));
      return { ...structuredClone(DEFAULTS), ...d, missions, equipped, audio, profile: d.profile ?? null, achievements: d.achievements || {}, pact: d.pact || null };
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

  get stars() { return this.data.stars; }
  get profile() { return this.data.profile; }
  get achievements() { return this.data.achievements; }

  setProfile({ name, age, theme }) {
    const a = Math.max(2, Math.min(18, Math.round(Number(age)) || 8));
    this.data.profile = { name: clean(name), age: a, theme };
    this.save();
    return this.data.profile;
  }

  // ── Calendario y estadísticas ─────────────────────────────────────────────
  /** Map día → { manana, noche, count } */
  days() {
    const map = new Map();
    for (const m of this.data.missions) {
      const k = dayKey(m.date);
      const e = map.get(k) || { manana: false, noche: false, count: 0 };
      e[m.slot || slotOf(m.date)] = true;
      e.count++;
      map.set(k, e);
    }
    return map;
  }

  /** Racha actual. Si hoy aún no se ha cepillado, cuenta desde ayer (no se rompe hasta que acaba el día). */
  streak(now = new Date(), perfect = false) {
    const days = this.days();
    const ok = (k) => { const e = days.get(k); return perfect ? !!(e?.manana && e?.noche) : !!e; };
    let k = dayKey(now);
    if (!ok(k)) k = addDays(k, -1);
    let n = 0;
    while (ok(k)) { n++; k = addDays(k, -1); }
    return n;
  }

  stats(now = new Date()) {
    const days = this.days();
    const keys = [...days.keys()].sort();
    let best = 0, run = 0, bestP = 0, runP = 0, prev = null, perfectDays = 0;
    for (const k of keys) {
      const e = days.get(k);
      const consecutive = prev && addDays(prev, 1) === k;
      run = consecutive ? run + 1 : 1;
      const perfect = e.manana && e.noche;
      if (perfect) perfectDays++;
      runP = perfect ? (consecutive ? runP + 1 : 1) : 0;
      best = Math.max(best, run);
      bestP = Math.max(bestP, runP);
      prev = k;
    }
    const ms = this.data.missions;
    return {
      total: ms.length,
      morning: ms.filter((m) => m.slot === 'manana').length,
      night: ms.filter((m) => m.slot === 'noche').length,
      themes: new Set(ms.map((m) => m.theme).filter(Boolean)).size,
      streak: this.streak(now),
      perfectStreak: this.streak(now, true),
      bestStreak: best,
      bestPerfectStreak: bestP,
      perfectDays,
    };
  }

  /** Últimos n días (el más reciente al final) con sus dos turnos. */
  week(now = new Date(), n = 7) {
    const days = this.days();
    const today = dayKey(now);
    return Array.from({ length: n }, (_, i) => {
      const k = addDays(today, i - (n - 1));
      const e = days.get(k) || { manana: false, noche: false, count: 0 };
      return { key: k, today: k === today, ...e };
    });
  }

  /** ¿Este turno ya tiene premio? */
  slotRewarded(now = new Date()) {
    const k = dayKey(now);
    const s = slotOf(now);
    return this.data.missions.some((m) => m.rewarded && dayKey(m.date) === k && m.slot === s);
  }

  // ── Misión completada ─────────────────────────────────────────────────────
  /**
   * Registra una misión. Devuelve qué ha pasado para enseñarlo en la pantalla final:
   * { rewarded, slot, drone: [], tooth: [], achievements: [], pactDone }
   */
  completeMission(date = new Date(), theme = this.data.profile?.theme) {
    const before = this.data.stars;
    const slot = slotOf(date);
    const rewarded = !this.slotRewarded(date);
    if (rewarded) this.data.stars += 1;
    this.data.missions.push({ date: date.toISOString(), seconds: 120, theme, slot, rewarded });
    if (this.data.missions.length > 1500) this.data.missions.splice(0, this.data.missions.length - 1500);

    // Logros nuevos
    const st = this.stats(date);
    const fresh = [];
    for (const a of ACHIEVEMENTS) {
      if (!this.data.achievements[a.id] && a.check(st)) {
        this.data.achievements[a.id] = date.toISOString();
        fresh.push(a);
      }
    }
    // Premio pactado con la familia
    let pactDone = false;
    const pact = this.data.pact;
    if (pact && !pact.doneAt && this.pactProgress(date).done) {
      pact.doneAt = date.toISOString();
      pactDone = true;
    }
    this.save();

    const unlockedBy = (list) => list.filter((a) =>
      a.achievement ? fresh.some((f) => f.id === a.achievement) : a.stars > before && a.stars <= this.data.stars);
    return { rewarded, slot, drone: unlockedBy(DRONE_ACCESSORIES), tooth: unlockedBy(TOOTH_ACCESSORIES), achievements: fresh, pactDone };
  }

  equip(id, mascot = 'drone') {
    const acc = accessoriesFor(mascot).find((a) => a.id === id);
    if (!acc || !isUnlocked(acc, this.data.stars, this.data.achievements)) return false;
    const eq = this.data.equipped[mascot];
    eq[acc.slot] = eq[acc.slot] === id ? null : id;
    this.save();
    return true;
  }

  // ── Premio pactado (panel de padres) ──────────────────────────────────────
  setPact({ reward, type, target }, now = new Date()) {
    const t = Math.max(1, Math.min(60, Math.round(Number(target)) || 7));
    this.data.pact = { reward: clean(reward, 60), type: type === 'perfectos' ? 'perfectos' : 'racha', target: t, since: dayKey(now) };
    this.save();
    return this.data.pact;
  }

  clearPact() {
    this.data.pact = null;
    this.save();
  }

  markPactDelivered(now = new Date()) {
    if (this.data.pact) { this.data.pact.deliveredAt = now.toISOString(); this.save(); }
  }

  /** { value, target, done } desde que se pactó. */
  pactProgress(now = new Date()) {
    const p = this.data.pact;
    if (!p) return null;
    let value;
    if (p.type === 'perfectos') {
      value = [...this.days().entries()].filter(([k, e]) => k >= p.since && e.manana && e.noche).length;
    } else {
      // Racha contada solo desde el día del pacto.
      const days = this.days();
      let k = dayKey(now);
      if (!days.get(k)) k = addDays(k, -1);
      value = 0;
      while (k >= p.since && days.get(k)) { value++; k = addDays(k, -1); }
    }
    return { value: Math.min(value, p.target), target: p.target, done: !!p.doneAt || value >= p.target };
  }

  setAudio(patch) {
    this.data.audio = { ...this.data.audio, ...patch };
    this.save();
  }
}
