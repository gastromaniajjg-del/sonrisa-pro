import { test } from 'node:test';
import assert from 'node:assert/strict';
import { SEGMENTS, TOTAL_SECONDS, BAR_SECONDS, PHRASE_SECONDS, BARS_PER_SEGMENT, SEGMENT_SECONDS, stepAt, segmentAt } from '../js/config.js';
import { LYRICS, LYRIC_LINES, VOICE_CUES, buildArrangement } from '../js/song.js';

const EPS = 1e-9;

test('128 BPM: 16 compases = 30 s exactos y 4 cuadrantes = 120 s', () => {
  assert.ok(Math.abs(BAR_SECONDS * BARS_PER_SEGMENT - SEGMENT_SECONDS) < EPS);
  assert.ok(Math.abs(PHRASE_SECONDS - 7.5) < EPS);
  assert.equal(SEGMENTS.length, 4);
  assert.equal(SEGMENTS.at(-1).end, TOTAL_SECONDS);
  SEGMENTS.forEach((s, i) => assert.equal(s.start, i * 30));
});

test('la letra tiene 4 cuadrantes × 4 frases × 2 versos y acaba en 120 s', () => {
  assert.equal(LYRICS.length, 4);
  LYRICS.forEach((seg) => { assert.equal(seg.length, 4); seg.forEach((p) => assert.equal(p.length, 2)); });
  assert.equal(LYRIC_LINES.length, 32);
  assert.ok(Math.abs(LYRIC_LINES.at(-1).end - TOTAL_SECONDS) < EPS);
});

test('cada cambio de zona se anuncia en la letra y en la voz', () => {
  SEGMENTS.forEach((seg, i) => {
    const first = LYRICS[i][0].join(' ').toLowerCase();
    assert.ok(first.includes(seg.label.toLowerCase().split(' ')[0]), `zona ${seg.id}`);
    const cue = VOICE_CUES.find((c) => c.t >= seg.start && c.t < seg.start + 1);
    assert.ok(cue, `cue de voz en ${seg.start}`);
    assert.ok(cue.modes.includes('voz') && cue.modes.includes('cancion'));
  });
});

test('ningún cue de voz empieza después de 120 s ni pisa al siguiente', () => {
  for (const c of VOICE_CUES) {
    assert.ok(c.t >= 0 && c.t < TOTAL_SECONDS);
    assert.ok(c.t + c.maxSeconds <= TOTAL_SECONDS + EPS);
  }
});

test('ningún evento musical suena después de 120 s', () => {
  const ev = buildArrangement();
  assert.ok(ev.length > 1000);
  for (const e of ev) {
    assert.ok(e.t >= 0, 'empieza en 0 o después');
    assert.ok(e.t + e.dur <= TOTAL_SECONDS + EPS, `${e.type} en ${e.t} acaba en ${e.t + e.dur}`);
  }
});

test('la música cubre los cuatro cuadrantes y avisa con campanita en cada cambio', () => {
  const ev = buildArrangement();
  for (const seg of SEGMENTS) {
    assert.ok(ev.some((e) => e.type === 'bell' && Math.abs(e.t - seg.start) < 0.01), `campana en ${seg.start}`);
    assert.ok(ev.some((e) => e.type === 'lead' && e.t >= seg.start && e.t < seg.end));
  }
  // Redoble antes de los cambios de zona 30, 60, 90 (no antes del final).
  for (const s of [30, 60, 90]) assert.ok(ev.some((e) => e.type === 'snare' && e.t > s - 1 && e.t < s));
  assert.ok(!ev.some((e) => e.type === 'snare' && e.t > 119));
});

test('pasos y segmentos por tiempo', () => {
  assert.equal(segmentAt(0).id, 'sup-der');
  assert.equal(segmentAt(29.99).id, 'sup-der');
  assert.equal(segmentAt(30).id, 'sup-izq');
  assert.equal(segmentAt(119.99).id, 'inf-der');
  assert.equal(segmentAt(120).id, 'inf-der');
  assert.equal(stepAt(0).id, 'zona');
  assert.equal(stepAt(7.5).id, 'fuera');
  assert.equal(stepAt(15).id, 'dentro');
  assert.equal(stepAt(22.5).id, 'muelas');
  assert.equal(stepAt(37.6).id, 'fuera');
});
