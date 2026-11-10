import { test } from 'node:test';
import assert from 'node:assert/strict';
import { SEGMENTS, TOTAL_SECONDS, BAR_SECONDS, PHRASE_SECONDS, BARS_PER_SEGMENT, SEGMENT_SECONDS, stepAt, segmentAt } from '../js/config.js';
import { RADIO_CUES, FLICKERS, radioAt, buildArrangement } from '../js/soundtrack.js';

const EPS = 1e-9;

test('128 BPM: 16 compases = 30 s exactos y 4 niveles = 120 s', () => {
  assert.ok(Math.abs(BAR_SECONDS * BARS_PER_SEGMENT - SEGMENT_SECONDS) < EPS);
  assert.ok(Math.abs(PHRASE_SECONDS - 7.5) < EPS);
  assert.equal(SEGMENTS.length, 4);
  assert.equal(SEGMENTS.at(-1).end, TOTAL_SECONDS);
  SEGMENTS.forEach((s, i) => assert.equal(s.start, i * 30));
});

test('la radio anuncia cada nivel en su segundo exacto y da los 4 pasos de cada nivel', () => {
  SEGMENTS.forEach((seg, i) => {
    const cue = RADIO_CUES.find((c) => c.t >= seg.start && c.t < seg.start + 1);
    assert.ok(cue, `mensaje en ${seg.start}`);
    assert.match(cue.text.toLowerCase(), new RegExp(seg.label.toLowerCase().split(' ')[0]));
    for (let p = 1; p < 4; p++) assert.ok(RADIO_CUES.some((c) => Math.abs(c.t - (seg.start + p * PHRASE_SECONDS)) < EPS), `paso ${p} del nivel ${i + 1}`);
  });
});

test('ningún mensaje de radio empieza después de 120 s ni pisa al siguiente', () => {
  for (const c of RADIO_CUES) {
    assert.ok(c.t >= 0 && c.t < TOTAL_SECONDS);
    assert.ok(c.t + c.maxSeconds <= TOTAL_SECONDS + EPS);
  }
  assert.equal(radioAt(0), null);
  assert.equal(radioAt(31).id, 'n2');
});

test('ningún evento musical suena después de 120 s', () => {
  const ev = buildArrangement();
  assert.ok(ev.length > 1000);
  for (const e of ev) {
    assert.ok(e.t >= 0);
    assert.ok(e.t + e.dur <= TOTAL_SECONDS + EPS, `${e.type} en ${e.t} acaba en ${e.t + e.dur}`);
  }
});

test('la música avisa de cada cambio de nivel y sube de intensidad', () => {
  const ev = buildArrangement();
  for (const s of [30, 60, 90]) {
    assert.ok(ev.some((e) => e.type === 'alarm' && Math.abs(e.t - s) < 0.01), `alarma en ${s}`);
    assert.ok(ev.some((e) => e.type === 'swell' && e.t > s - 1 && e.t < s), `barrido antes de ${s}`);
  }
  const kicksIn = (L) => ev.filter((e) => e.type === 'kick' && e.t >= L * 30 && e.t < L * 30 + 30).length;
  assert.equal(kicksIn(0), 0);
  assert.ok(kicksIn(1) < kicksIn(3));
  // Los parpadeos de luz suenan en sus tiempos.
  for (const f of FLICKERS) assert.ok(ev.some((e) => e.type === 'zap' && e.t === f));
});

test('pasos y niveles por tiempo', () => {
  assert.equal(segmentAt(0).id, 'sup-der');
  assert.equal(segmentAt(30).id, 'sup-izq');
  assert.equal(segmentAt(120).id, 'inf-der');
  assert.equal(stepAt(0).id, 'zona');
  assert.equal(stepAt(7.5).id, 'fuera');
  assert.equal(stepAt(15).id, 'dentro');
  assert.equal(stepAt(22.5).id, 'muelas');
  assert.equal(stepAt(120).id, 'muelas');
});
