import { test } from 'node:test';
import assert from 'node:assert/strict';
import { Progress } from '../js/progress.js';

function memStorage() {
  const m = new Map();
  return { getItem: (k) => m.get(k) ?? null, setItem: (k, v) => m.set(k, String(v)) };
}

test('completar misiones suma estrellas, guarda y desbloquea accesorios', () => {
  const st = memStorage();
  const p = new Progress(st);
  assert.equal(p.stars, 0);
  const u1 = p.completeMission();
  assert.deepEqual(u1.map((a) => a.id), ['linterna']);
  p.completeMission();
  const reloaded = new Progress(st);
  assert.equal(reloaded.stars, 2);
  assert.equal(reloaded.data.missions.length, 2);
});

test('no se puede equipar lo bloqueado; un accesorio por hueco', () => {
  const p = new Progress(memStorage());
  assert.equal(p.equip('camuflaje'), false);
  for (let i = 0; i < 5; i++) p.completeMission();
  assert.equal(p.equip('linterna'), true);
  assert.equal(p.equip('faros'), true);
  assert.equal(p.data.equipped.frontal, 'faros');
  p.equip('faros');
  assert.equal(p.data.equipped.frontal, null);
});

test('almacenamiento roto no rompe la app', () => {
  const p = new Progress({ getItem: () => '{roto', setItem: () => { throw new Error('lleno'); } });
  assert.equal(p.stars, 0);
  p.completeMission();
  assert.equal(p.stars, 1);
});

test('ajustes guardados de la versión anterior se migran', () => {
  const st = memStorage();
  st.setItem('mision-sonrisa:v1', JSON.stringify({ stars: 3, equipped: { cabeza: 'gorra' }, audio: { mode: 'cancion', musicVolume: 0.5 } }));
  const p = new Progress(st);
  assert.equal(p.stars, 3);
  assert.equal(p.data.audio.mode, 'musica-radio');
  assert.equal(p.data.audio.musicVolume, 0.5);
  assert.deepEqual(Object.keys(p.data.equipped), ['arriba', 'frontal', 'carcasa']);
});
