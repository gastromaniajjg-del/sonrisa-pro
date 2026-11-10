// Accesorios y disfraces de Denti. Se desbloquean acumulando estrellas.
// slot: dónde se coloca. Solo puede haber uno equipado por slot.

export const ACCESSORIES = [
  { id: 'gafas', name: 'Gafas de sol', slot: 'cara', stars: 1, emoji: '🕶️' },
  { id: 'gorra', name: 'Gorra deportiva', slot: 'cabeza', stars: 2, emoji: '🧢' },
  { id: 'pajarita', name: 'Pajarita', slot: 'cuello', stars: 3, emoji: '🎀' },
  { id: 'corona', name: 'Corona brillante', slot: 'cabeza', stars: 5, emoji: '👑' },
  { id: 'mago', name: 'Gorro de mago', slot: 'cabeza', stars: 7, emoji: '🧙' },
  { id: 'capa-dorada', name: 'Disfraz: capa dorada', slot: 'capa', stars: 10, emoji: '✨', color: 0xf5c542 },
  { id: 'heroe', name: 'Disfraz: superhéroe', slot: 'cara', stars: 14, emoji: '🦸', cape: 0xe0384b },
  { id: 'capa-arcoiris', name: 'Disfraz: capa arcoíris', slot: 'capa', stars: 20, emoji: '🌈', color: 'rainbow' },
];

export const SLOTS = ['cabeza', 'cara', 'cuello', 'capa'];

export function isUnlocked(acc, stars) {
  return stars >= acc.stars;
}

export function unlockedAt(stars) {
  return ACCESSORIES.filter((a) => a.stars === stars);
}

export function nextUnlock(stars) {
  return ACCESSORIES.filter((a) => a.stars > stars).sort((a, b) => a.stars - b.stars)[0] || null;
}
