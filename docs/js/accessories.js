// Mejoras del dron Denti. Se desbloquean con fragmentos de mapa (1 por misión completada).
// slot: dónde se monta. Solo puede haber una por slot.

export const ACCESSORIES = [
  { id: 'linterna', name: 'Linterna frontal', slot: 'frontal', stars: 1, icon: '🔦' },
  { id: 'antena', name: 'Antena de largo alcance', slot: 'arriba', stars: 2, icon: '📡' },
  { id: 'faros', name: 'Faros rojos', slot: 'frontal', stars: 3, icon: '🚨' },
  { id: 'camuflaje', name: 'Carcasa camuflaje', slot: 'carcasa', stars: 5, icon: '🪖', color: 'camo' },
  { id: 'helices', name: 'Hélices turbo', slot: 'arriba', stars: 7, icon: '🌀' },
  { id: 'dorada', name: 'Carcasa dorada', slot: 'carcasa', stars: 10, icon: '🥇', color: 0xd9a92b },
  { id: 'sigilo', name: 'Carcasa sigilo', slot: 'carcasa', stars: 14, icon: '🕶️', color: 0x1c1f24 },
  { id: 'holo', name: 'Carcasa holográfica', slot: 'carcasa', stars: 20, icon: '🌈', color: 'holo' },
];

export const SLOTS = ['arriba', 'frontal', 'carcasa'];

export function isUnlocked(acc, stars) {
  return stars >= acc.stars;
}

export function nextUnlock(stars) {
  return ACCESSORIES.filter((a) => a.stars > stars).sort((a, b) => a.stars - b.stars)[0] || null;
}
