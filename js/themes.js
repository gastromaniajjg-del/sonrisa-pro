// Catálogo de temáticas. Todas comparten el mismo reloj (4 niveles × 4 pasos = 120 s);
// cambian el escenario, el compañero, la música, la voz y los textos.

import { SEGMENTS, PHRASE_SECONDS, TOTAL_SECONDS } from './config.js';

const STEP_LINES = {
  fuera: ['Círculos pequeños por fuera. Sin prisa.', 'Círculos por fuera. Suave, no aprietes.', 'Por fuera, círculos pequeños.', 'Círculos por fuera.'],
  dentro: ['Ahora la cara de dentro.', 'Por dentro. Que no se escape ninguno.', 'Cara de dentro.', 'Por dentro. Casi lo tienes.'],
  muelas: ['Muelas: adelante y atrás, por encima.', 'Muelas de arriba. Adelante y atrás.', 'Muelas de abajo. Adelante y atrás.', 'Muelas, adelante y atrás.'],
};

export const THEMES = [
  {
    id: 'dientin',
    name: 'Dientín',
    emoji: '🦷',
    tagline: 'Canción, burbujas y un diente con capa.',
    ages: [3, 7],
    mascot: 'tooth',
    companion: 'Dientín',
    world: 'sonrisa',
    levels: ['Colina Burbuja', 'Valle Espuma', 'Río Brillante', 'Castillo Sonrisa'],
    reward: { one: 'estrella', many: 'estrellas', icon: '⭐' },
    title: 'La misión de la sonrisa',
    start: '¡Empezar!',
    done: '¡Misión cumplida!',
    voice: {
      radio: false, pitch: 1.25, rate: 1.0,
      intro: (n) => `¡Hola, ${n}! Soy Dientín. Empezamos arriba, a la derecha.`,
      levels: ['¡Cambio de zona! Arriba, a la izquierda.', '¡Cambio de zona! Abajo, a la izquierda. ¡Vamos por la mitad!', '¡Último cambio! Abajo, a la derecha.'],
      steps: {
        fuera: ['Circulitos por fuera, junto a la encía.', 'Circulitos por fuera, sin apretar.', 'Circulitos por fuera.', 'Circulitos por fuera.'],
        dentro: ['Ahora por dentro.', 'Por dentro también.', 'Ahora por dentro.', 'Por dentro, ya casi está.'],
        muelas: ['Sobre las muelas, adelante y atrás.', 'Las muelas de arriba, adelante y atrás.', 'Sobre las muelas, adelante y atrás.', 'Muelas de abajo, adelante y atrás.'],
      },
      final: (n) => `Tres, dos, uno… ¡Misión cumplida, ${n}!`,
    },
    music: { kind: 'dientin' },
  },
  {
    id: 'mar',
    name: 'Fondo del mar',
    emoji: '🐠',
    tagline: 'Un minisubmarino por cuatro zonas del arrecife.',
    ages: [5, 10],
    mascot: 'drone', variant: 'submarino',
    companion: 'Burbuja',
    world: 'mar',
    levels: ['Arrecife', 'Bosque de algas', 'Cueva de coral', 'Fosa luminosa'],
    reward: { one: 'concha', many: 'conchas', icon: '🐚' },
    title: 'Misión submarina',
    start: '¡A bucear!',
    done: '¡Tesoro encontrado!',
    voice: {
      radio: true, pitch: 1.05, rate: 1.05,
      intro: (n) => `Aquí Base Submarina. Hola, ${n}. Inmersión en el arrecife: arriba a la derecha.`,
      levels: ['Bajamos al bosque de algas: arriba a la izquierda.', 'Entramos en la cueva de coral: abajo a la izquierda. Vas por la mitad.', 'Última zona, la fosa luminosa: abajo a la derecha.'],
      steps: STEP_LINES,
      final: (n) => `¡Tesoro encontrado! Buen trabajo, ${n}.`,
    },
    music: {
      kind: 'generic',
      prog: ['C', 'Am', 'F', 'G'], exit: ['F', 'G', 'C', 'C'],
      motif: [[0, 76], [2, 79], [4, 84], [6, 81], [8, 79], [10, 76], [12, 74], [14, 72]], motifInst: 'bell',
      arpWave: 'triangle', drums: 'light', ambience: { type: 'waves', vel: 0.9, cutoff: 500, rate: 0.1 },
      chirps: { notes: [91, 86], every: 7.5, offset: 3.2, up: false, dur: 0.35 }, alert: 'sonar',
    },
  },
  {
    id: 'bosque',
    name: 'Bosque mágico',
    emoji: '🍄',
    tagline: 'Setas, luciérnagas y un hada luminosa.',
    ages: [4, 9],
    mascot: 'drone', variant: 'hada',
    companion: 'Chispa',
    world: 'bosque',
    levels: ['Claro del bosque', 'Puente de setas', 'Lago de las hadas', 'Árbol gigante'],
    reward: { one: 'gema mágica', many: 'gemas mágicas', icon: '💠' },
    title: 'El bosque mágico',
    start: '¡Entrar al bosque!',
    done: '¡Hechizo completado!',
    voice: {
      radio: false, pitch: 1.2, rate: 1.0,
      intro: (n) => `Hola, ${n}. Soy Chispa. Empezamos en el claro: arriba a la derecha.`,
      levels: ['Cruzamos el puente de setas: arriba a la izquierda.', 'Llegamos al lago de las hadas: abajo a la izquierda. ¡Mitad del camino!', 'Último lugar, el árbol gigante: abajo a la derecha.'],
      steps: STEP_LINES,
      final: (n) => `¡Hechizo completado, ${n}! Tu sonrisa brilla.`,
    },
    music: {
      kind: 'generic',
      prog: ['F', 'Am', 'Bb', 'C'], exit: ['Bb', 'C', 'F', 'F'],
      motif: [[0, 72], [1, 77], [2, 81], [4, 79], [6, 77], [8, 76], [9, 77], [10, 79], [12, 72]], motifInst: 'bell',
      arpWave: 'sine', drums: 'light', ambience: { type: 'waves', vel: 0.5, cutoff: 2200, rate: 0.2 },
      chirps: { notes: [100, 103, 98], every: 3.75, offset: 1.1, up: true, dur: 0.12 }, alert: 'bell',
    },
  },
  {
    id: 'dinos',
    name: 'Dinosaurios',
    emoji: '🦕',
    tagline: 'Expedición por la selva de los dinosaurios.',
    ages: [5, 11],
    mascot: 'drone', variant: 'safari',
    companion: 'Rex-1',
    world: 'jungla',
    levels: ['Selva', 'Río de los dinosaurios', 'Cañón', 'Volcán'],
    reward: { one: 'fósil', many: 'fósiles', icon: '🦴' },
    title: 'Expedición jurásica',
    start: '¡Expedición!',
    done: '¡Expedición completada!',
    voice: {
      radio: true, pitch: 0.95, rate: 1.05,
      intro: (n) => `Aquí Campamento Base. Hola, ${n}. Entramos en la selva: arriba a la derecha.`,
      levels: ['Llegamos al río de los dinosaurios: arriba a la izquierda.', 'Cruzamos el cañón: abajo a la izquierda. Vas por la mitad.', 'Último tramo, el volcán: abajo a la derecha.'],
      steps: STEP_LINES,
      final: (n) => `¡Expedición completada, ${n}! Vuelta al campamento.`,
    },
    music: {
      kind: 'generic',
      prog: ['Em', 'C', 'G', 'D'], exit: ['C', 'D', 'G', 'G'],
      motif: [[0, 76], [1.5, 79], [3, 81], [4, 79], [6, 76], [8, 74], [9.5, 76], [11, 71], [14, 76]], motifInst: 'lead',
      arpWave: 'triangle', drums: 'tribal', ambience: { type: 'waves', vel: 0.6, cutoff: 900, rate: 0.15 },
      chirps: { notes: [95, 99], every: 15, offset: 5.3, up: true, dur: 0.18 }, alert: 'tom',
    },
  },
  {
    id: 'espacio',
    name: 'Misión espacial',
    emoji: '🚀',
    tagline: 'Cuatro planetas y una sonda exploradora.',
    ages: [7, 12],
    mascot: 'drone', variant: 'sonda',
    companion: 'Sonda S-1',
    world: 'espacio',
    levels: ['Planeta Hielo', 'Planeta Rojo', 'Cinturón de asteroides', 'Nebulosa Azul'],
    reward: { one: 'cristal estelar', many: 'cristales estelares', icon: '💎' },
    title: 'Misión espacial',
    start: 'Despegar',
    done: 'Misión completada',
    voice: {
      radio: true, pitch: 1.0, rate: 1.05,
      intro: (n) => `Control de misión a ${n}. Despegue confirmado. Planeta Hielo: arriba a la derecha.`,
      levels: ['Rumbo al Planeta Rojo: arriba a la izquierda.', 'Atravesamos el cinturón de asteroides: abajo a la izquierda. Mitad de la misión.', 'Última parada, la Nebulosa Azul: abajo a la derecha.'],
      steps: STEP_LINES,
      final: (n) => `Misión completada, ${n}. Regreso a la Tierra.`,
    },
    music: {
      kind: 'generic',
      prog: ['Dm', 'Bb', 'F', 'C'], exit: ['Bb', 'C', 'F', 'F'],
      motif: [[0, 74], [2, 77], [4, 81], [7, 79], [8, 77], [10, 74], [12, 72], [14, 69]], motifInst: 'bell',
      arpWave: 'sawtooth', drums: 'build', ambience: { type: 'waves', vel: 0.5, cutoff: 300, rate: 0.07 },
      chirps: { notes: [93, 97], every: 7.5, offset: 5.6, up: true, dur: 0.08 }, alert: 'beep',
    },
  },
  {
    id: 'partido',
    name: 'Partido',
    emoji: '⚽',
    tagline: 'Cuatro cuartos de 30 segundos para ganar.',
    ages: [6, 14],
    mascot: 'drone', variant: 'balon',
    companion: 'Bala',
    world: 'estadio',
    levels: ['Primer cuarto', 'Segundo cuarto', 'Tercer cuarto', 'Último cuarto'],
    reward: { one: 'medalla', many: 'medallas', icon: '🏅' },
    title: 'El gran partido',
    start: '¡Al campo!',
    done: '¡Victoria!',
    voice: {
      radio: false, pitch: 1.0, rate: 1.12,
      intro: (n) => `¡Empieza el partido! ${n} sale al campo. Primer cuarto: arriba a la derecha.`,
      levels: ['¡Segundo cuarto! Arriba a la izquierda.', '¡Tercer cuarto! Abajo a la izquierda. ¡Mitad del partido!', '¡Último cuarto! Abajo a la derecha.'],
      steps: STEP_LINES,
      final: (n) => `¡Final del partido! ¡Victoria para ${n}!`,
    },
    music: {
      kind: 'generic',
      prog: ['G', 'D', 'Em', 'C'], exit: ['C', 'D', 'G', 'G'],
      motif: [[0, 79], [1, 79], [2, 83], [3, 81], [4, 79], [8, 76], [9, 78], [10, 79], [12, 74]], motifInst: 'lead',
      arpWave: 'square', drums: 'stadium', ambience: { type: 'crowd', vel: 0.8 },
      chirps: null, alert: 'whistle',
    },
  },
  {
    id: 'escapa',
    name: 'Escapa en 2:00',
    emoji: '🚪',
    tagline: 'Pasillos liminales, un dron y la salida al final.',
    ages: [10, 14],
    mascot: 'drone', variant: 'dron',
    companion: 'Denti',
    world: 'pasillos',
    levels: ['Nivel 1', 'Nivel 2', 'Nivel 3', 'Nivel 4'],
    reward: { one: 'fragmento de mapa', many: 'fragmentos de mapa', icon: '🗺️' },
    title: 'ESCAPA EN 2:00',
    start: 'Entrar',
    done: 'HAS ESCAPADO',
    voice: {
      radio: true, pitch: 0.9, rate: 1.08,
      intro: (n) => `Aquí Base. Te recibo, ${n}. Nivel uno: arriba a la derecha. Cepillo inclinado hacia la encía.`,
      levels: ['Nivel dos. Arriba a la izquierda.', 'Nivel tres. Abajo a la izquierda. Vas por la mitad.', 'Último nivel. Abajo a la derecha. La salida está cerca.'],
      steps: STEP_LINES,
      final: () => 'Salida localizada. Has escapado.',
    },
    music: { kind: 'escapa' },
  },
];

export const DEFAULT_THEME = 'dientin';

export function getTheme(id) {
  return THEMES.find((t) => t.id === id) || THEMES.find((t) => t.id === DEFAULT_THEME);
}

/** Temática recomendada para una edad: la que mejor la centra en su rango. */
export function recommendedTheme(age) {
  const a = Number(age) || 8;
  const fits = THEMES.filter((t) => a >= t.ages[0] && a <= t.ages[1]);
  const pool = fits.length ? fits : THEMES;
  return pool.slice().sort((x, y) => Math.abs((x.ages[0] + x.ages[1]) / 2 - a) - Math.abs((y.ages[0] + y.ages[1]) / 2 - a))[0];
}

/** Dientes que enseña el escáner según la edad (aproximado). */
export function dentitionForAge(age) {
  const a = Number(age) || 8;
  if (a < 7) return 'leche'; // 20 dientes de leche
  if (a < 12) return 'mixta'; // 24: aún sin segundos molares
  return 'definitiva'; // 28
}

/**
 * Mensajes de voz de una temática, con el nombre del niño o la niña.
 * Mismo esquema en todas: aviso de nivel en 0/30/60/90 s, un mensaje por paso y el final.
 */
export function cuesFor(theme, name = 'Dani') {
  const n = (name || '').trim() || 'campeón';
  const v = theme.voice;
  const cues = [];
  SEGMENTS.forEach((seg, i) => {
    cues.push({ t: i === 0 ? 0.4 : seg.start, id: `n${i + 1}`, text: i === 0 ? v.intro(n) : v.levels[i - 1] });
    ['fuera', 'dentro', 'muelas'].forEach((k, j) => {
      cues.push({ t: seg.start + (j + 1) * PHRASE_SECONDS, id: `n${i + 1}-${k}`, text: v.steps[k][i] });
    });
  });
  cues.push({ t: 116.6, id: 'salida', text: v.final(n) });
  return cues.map((c, i, all) => ({ ...c, maxSeconds: (all[i + 1]?.t ?? TOTAL_SECONDS) - c.t }));
}

export function cueAt(cues, t) {
  let last = null;
  for (const c of cues) if (c.t <= t) last = c;
  return last;
}

