import { test } from 'node:test';
import assert from 'node:assert/strict';
import { BrushingTimer, formatTime } from '../js/timer.js';

function fakeClock() {
  let ms = 0;
  return { now: () => ms, advance: (s) => { ms += s * 1000; } };
}

test('dura exactamente 120 s y emite complete una sola vez', () => {
  const c = fakeClock();
  const t = new BrushingTimer({ now: c.now });
  let completes = 0;
  let completeAt = null;
  t.on('complete', ({ elapsed }) => { completes++; completeAt = elapsed; });
  t.start();
  c.advance(119.99); t.update();
  assert.equal(t.state, 'running');
  c.advance(0.02); t.update();
  assert.equal(t.state, 'done');
  assert.equal(completeAt, 120);
  c.advance(10); t.update();
  assert.equal(completes, 1);
  assert.equal(t.elapsed(), 120);
});

test('aunque se actualice tarde (pantalla bloqueada), nunca pasa de 120', () => {
  const c = fakeClock();
  const t = new BrushingTimer({ now: c.now });
  t.start();
  c.advance(500); t.update();
  assert.equal(t.elapsed(), 120);
  assert.equal(t.state, 'done');
});

test('emite los 4 cambios de zona en 0, 30, 60 y 90 s', () => {
  const c = fakeClock();
  const t = new BrushingTimer({ now: c.now });
  const seen = [];
  t.on('segment', ({ index, elapsed }) => seen.push([index, Math.floor(elapsed)]));
  t.start();
  for (let i = 0; i < 1210; i++) { c.advance(0.1); t.update(); }
  assert.deepEqual(seen.map((s) => s[0]), [0, 1, 2, 3]);
  assert.deepEqual(seen.map((s) => s[1]), [0, 30, 60, 90]);
});

test('emite 16 pasos (4 por zona) cada 7,5 s', () => {
  const c = fakeClock();
  const t = new BrushingTimer({ now: c.now });
  const steps = [];
  t.on('step', (s) => steps.push(s.index));
  t.start();
  for (let i = 0; i < 2410; i++) { c.advance(0.05); t.update(); }
  assert.equal(steps.length, 16);
  assert.deepEqual(steps.slice(0, 8), [0, 1, 2, 3, 0, 1, 2, 3]);
});

test('la pausa no cuenta como tiempo de cepillado', () => {
  const c = fakeClock();
  const t = new BrushingTimer({ now: c.now });
  t.start();
  c.advance(40); t.update();
  t.pause();
  c.advance(300);
  assert.equal(t.elapsed(), 40);
  t.resume();
  c.advance(79.9); t.update();
  assert.equal(t.state, 'running');
  c.advance(0.2); t.update();
  assert.equal(t.state, 'done');
});

test('formatTime', () => {
  assert.equal(formatTime(120), '2:00');
  assert.equal(formatTime(65.2), '1:06');
  assert.equal(formatTime(0), '0:00');
});
