// Accesorios del compañero. Se desbloquean con las recompensas (máximo 2 al día,
// compartidas entre temáticas) o, los de leyenda, con la racha de 7 días. Hay dos juegos: uno para el diente (Dientín) y otro
// para los compañeros-dron (submarino, hada, sonda, balón…).
// slot: dónde se monta. Solo puede haber uno por slot.

export const DRONE_ACCESSORIES = [
  { id: 'linterna', name: 'Linterna frontal', slot: 'frontal', stars: 1, icon: '🔦' },
  { id: 'antena', name: 'Antena de largo alcance', slot: 'arriba', stars: 2, icon: '📡' },
  { id: 'faros', name: 'Faros rojos', slot: 'frontal', stars: 3, icon: '🚨' },
  { id: 'camuflaje', name: 'Carcasa camuflaje', slot: 'carcasa', stars: 5, icon: '🪖', color: 'camo' },
  { id: 'helices', name: 'Hélices turbo', slot: 'arriba', stars: 7, icon: '🌀' },
  { id: 'dorada', name: 'Carcasa dorada', slot: 'carcasa', stars: 10, icon: '🥇', color: 0xd9a92b },
  { id: 'sigilo', name: 'Carcasa sigilo', slot: 'carcasa', stars: 14, icon: '🕶️', color: 0x1c1f24 },
  { id: 'holo', name: 'Carcasa holográfica', slot: 'carcasa', stars: 20, icon: '🌈', color: 'holo' },
  { id: 'leyenda', name: 'Carcasa de leyenda', slot: 'carcasa', achievement: 'racha-7', icon: '👑', color: 'legend' },
];

export const TOOTH_ACCESSORIES = [
  { id: 'gafas', name: 'Gafas de sol', slot: 'cara', stars: 1, icon: '🕶️' },
  { id: 'gorra', name: 'Gorra deportiva', slot: 'cabeza', stars: 2, icon: '🧢' },
  { id: 'pajarita', name: 'Pajarita', slot: 'cuello', stars: 3, icon: '🎀' },
  { id: 'corona', name: 'Corona brillante', slot: 'cabeza', stars: 5, icon: '👑' },
  { id: 'mago', name: 'Gorro de mago', slot: 'cabeza', stars: 7, icon: '🧙' },
  { id: 'capa-dorada', name: 'Capa dorada', slot: 'capa', stars: 10, icon: '✨', color: 0xf5c542 },
  { id: 'heroe', name: 'Disfraz de superhéroe', slot: 'cara', stars: 14, icon: '🦸', cape: 0xe0384b },
  { id: 'capa-arcoiris', name: 'Capa arcoíris', slot: 'capa', stars: 20, icon: '🌈', color: 'rainbow' },
  { id: 'capa-leyenda', name: 'Capa de leyenda', slot: 'capa', achievement: 'racha-7', icon: '👑', color: 'legend' },
];

// Compatibilidad con el código anterior.
export const ACCESSORIES = DRONE_ACCESSORIES;

export function accessoriesFor(mascot) {
  return mascot === 'tooth' ? TOOTH_ACCESSORIES : DRONE_ACCESSORIES;
}

/** Los de leyenda no se compran con premios: se ganan con un logro (7 días seguidos). */
export function isUnlocked(acc, stars, achievements = {}) {
  return acc.achievement ? !!achievements[acc.achievement] : stars >= acc.stars;
}

export function nextUnlock(stars, mascot = 'drone') {
  return accessoriesFor(mascot).filter((a) => a.stars > stars).sort((a, b) => a.stars - b.stars)[0] || null;
}
