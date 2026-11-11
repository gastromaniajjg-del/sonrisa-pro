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
  for (let d = 1; d <= 3; d++) { p.completeMission(new Date(2026, 10, d, 8)); p.completeMission(new Date(2026, 10, d, 21)); }
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

// Fechas locales fijas para las pruebas de turnos y rachas.
const at = (d, h, min = 0) => new Date(2026, 10, d, h, min);

test('turnos: máximo un premio por la mañana y otro por la noche', () => {
  const p = new Progress(memStorage());
  assert.equal(p.completeMission(at(2, 8)).rewarded, true);
  assert.equal(p.completeMission(at(2, 9)).rewarded, false); // segunda de la mañana: sin premio
  assert.equal(p.completeMission(at(2, 21)).rewarded, true);
  assert.equal(p.completeMission(at(3, 1)).rewarded, false); // a la 1:00 cuenta como la noche anterior
  assert.equal(p.stars, 2);
  assert.equal(p.data.missions.length, 4);
});

test('racha: días seguidos, no se rompe hasta que acaba el día, y días perfectos', () => {
  const p = new Progress(memStorage());
  p.completeMission(at(1, 21));
  p.completeMission(at(2, 8));
  p.completeMission(at(2, 21));
  p.completeMission(at(3, 8));
  assert.equal(p.streak(at(3, 12)), 3);
  assert.equal(p.streak(at(4, 10)), 3); // el día 4 aún no se ha cepillado, la racha sigue
  assert.equal(p.streak(at(5, 10)), 0); // se saltó el día 4
  const s = p.stats(at(3, 12));
  assert.equal(s.perfectDays, 1);
  assert.equal(s.bestStreak, 3);
});

test('logros: se consiguen una sola vez y desbloquean el accesorio de leyenda a los 7 días', () => {
  const p = new Progress(memStorage());
  const first = p.completeMission(at(1, 8));
  assert.ok(first.achievements.some((a) => a.id === 'primero'));
  let legend = null;
  for (let d = 2; d <= 7; d++) {
    const r = p.completeMission(at(d, 8));
    if (r.drone.some((a) => a.id === 'leyenda')) legend = d;
  }
  assert.equal(legend, 7);
  assert.ok(p.achievements['racha-7']);
  assert.equal(p.equip('leyenda', 'drone'), true);
  assert.equal(p.equip('capa-leyenda', 'tooth'), true);
  assert.equal(p.completeMission(at(8, 8)).achievements.some((a) => a.id === 'primero'), false);
});

test('premio pactado: cuenta desde que se pacta y avisa una vez al conseguirlo', () => {
  const p = new Progress(memStorage());
  p.completeMission(at(1, 8)); // antes del pacto: no cuenta
  p.setPact({ reward: 'Elegir la cena', type: 'racha', target: 3 }, at(2, 7));
  assert.equal(p.completeMission(at(2, 8)).pactDone, false);
  assert.equal(p.completeMission(at(3, 8)).pactDone, false);
  assert.deepEqual(p.pactProgress(at(3, 9)), { value: 2, target: 3, done: false });
  assert.equal(p.completeMission(at(4, 8)).pactDone, true);
  assert.equal(p.completeMission(at(5, 8)).pactDone, false);
  p.markPactDelivered(at(5, 9));
  assert.ok(p.data.pact.deliveredAt);
});

test('premio pactado por días perfectos', () => {
  const p = new Progress(memStorage());
  p.setPact({ reward: 'Parque', type: 'perfectos', target: 2 }, at(1, 7));
  p.completeMission(at(1, 8));
  p.completeMission(at(1, 21));
  p.completeMission(at(2, 8)); // día 2 sin noche: no es perfecto
  assert.equal(p.pactProgress(at(2, 12)).value, 1);
  assert.equal(p.completeMission(at(3, 8)).pactDone, false);
  assert.equal(p.completeMission(at(3, 21)).pactDone, true);
});
