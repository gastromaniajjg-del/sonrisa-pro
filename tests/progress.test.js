import { test } from 'node:test';
import assert from 'node:assert/strict';
import { Progress } from '../js/progress.js';

function memStorage() {
  const m = new Map();
  return { getItem: (k) => m.get(k) ?? null, setItem: (k, v) => m.set(k, String(v)) };
}

test('perfil: se guarda limpio y la edad se acota', () => {
  const st = memStorage();
  const p = new Progress(st);
  assert.equal(p.profile, null);
  p.setProfile({ name: '  <Lucía>  ', age: '9', theme: 'mar' });
  const again = new Progress(st);
  assert.deepEqual(again.profile, { name: 'Lucía', age: 9, theme: 'mar' });
  p.setProfile({ name: 'X', age: 99, theme: 'mar' });
  assert.equal(p.profile.age, 18);
});

test('misiones: suman recompensas y desbloquean en los dos juegos de accesorios', () => {
  const st = memStorage();
  const p = new Progress(st);
  const u = p.completeMission(new Date(), 'mar');
  assert.deepEqual(u.drone.map((a) => a.id), ['linterna']);
  assert.deepEqual(u.tooth.map((a) => a.id), ['gafas']);
  assert.equal(new Progress(st).data.missions[0].theme, 'mar');
});

test('accesorios: bloqueados no; uno por hueco y por compañero', () => {
  const p = new Progress(memStorage());
  assert.equal(p.equip('corona', 'tooth'), false);
  for (let i = 0; i < 5; i++) p.completeMission();
  assert.equal(p.equip('corona', 'tooth'), true);
  assert.equal(p.equip('faros', 'drone'), true);
  assert.equal(p.data.equipped.tooth.cabeza, 'corona');
  assert.equal(p.data.equipped.drone.frontal, 'faros');
  assert.equal(p.equip('corona', 'drone'), false);
});

test('datos de versiones anteriores se migran', () => {
  const st = memStorage();
  st.setItem('mision-sonrisa:v1', JSON.stringify({ stars: 3, equipped: { frontal: 'faros' }, audio: { mode: 'cancion', musicVolume: 0.5 } }));
  const p = new Progress(st);
  assert.equal(p.stars, 3);
  assert.equal(p.profile, null);
  assert.equal(p.data.audio.mode, 'musica-radio');
  assert.equal(p.data.equipped.drone.frontal, 'faros');
  assert.equal(p.data.equipped.tooth.cabeza, null);
});

test('almacenamiento roto no rompe la app', () => {
  const p = new Progress({ getItem: () => '{roto', setItem: () => { throw new Error('lleno'); } });
  p.completeMission();
  assert.equal(p.stars, 1);
});
