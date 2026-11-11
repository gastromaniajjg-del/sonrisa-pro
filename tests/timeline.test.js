import { test } from 'node:test';
import assert from 'node:assert/strict';
import { SEGMENTS, TOTAL_SECONDS, BAR_SECONDS, PHRASE_SECONDS, BARS_PER_SEGMENT, SEGMENT_SECONDS, stepAt, segmentAt } from '../js/config.js';
import { FLICKERS } from '../js/soundtrack.js';
import { LYRICS, LYRIC_LINES } from '../js/song-dientin.js';
import { THEMES, cuesFor, cueAt, recommendedTheme, dentitionForAge } from '../js/themes.js';
import { arrangementFor } from '../js/arrangements.js';

const EPS = 1e-9;

test('128 BPM: 16 compases = 30 s exactos y 4 niveles = 120 s', () => {
  assert.ok(Math.abs(BAR_SECONDS * BARS_PER_SEGMENT - SEGMENT_SECONDS) < EPS);
  assert.ok(Math.abs(PHRASE_SECONDS - 7.5) < EPS);
  assert.equal(SEGMENTS.length, 4);
  assert.equal(SEGMENTS.at(-1).end, TOTAL_SECONDS);
});

test('hay 7 temáticas completas', () => {
  assert.equal(THEMES.length, 7);
  for (const t of THEMES) {
    assert.equal(t.levels.length, 4, t.id);
    assert.ok(t.reward.icon && t.reward.one && t.reward.many, t.id);
    assert.ok(['tooth', 'drone'].includes(t.mascot), t.id);
    assert.equal(t.voice.levels.length, 3, t.id);
    for (const k of ['fuera', 'dentro', 'muelas']) assert.equal(t.voice.steps[k].length, 4, `${t.id} ${k}`);
  }
});

for (const t of THEMES) {
  test(`«${t.name}»: la voz avisa de cada zona y cada paso, y nunca pasa de 120 s`, () => {
    const cues = cuesFor(t, 'Lucía');
    assert.equal(cues.length, 17);
    for (const seg of SEGMENTS) {
      assert.ok(cues.some((c) => c.t >= seg.start && c.t < seg.start + 1), `aviso de zona en ${seg.start}`);
      for (let p = 1; p < 4; p++) assert.ok(cues.some((c) => Math.abs(c.t - (seg.start + p * PHRASE_SECONDS)) < EPS));
    }
    for (const c of cues) assert.ok(c.t + c.maxSeconds <= TOTAL_SECONDS + EPS);
    assert.match(cues[0].text, /Lucía/);
    assert.equal(cueAt(cues, 31).id, 'n2');
  });

  test(`«${t.name}»: ningún sonido después de 120 s y aviso musical en cada cambio de zona`, () => {
    const ev = arrangementFor(t);
    assert.ok(ev.length > 800);
    for (const e of ev) assert.ok(e.t >= 0 && e.t + e.dur <= TOTAL_SECONDS + EPS, `${e.type} en ${e.t}`);
    for (const s of [30, 60, 90]) {
      assert.ok(ev.some((e) => ['bell', 'alarm', 'chirp', 'tom', 'static'].includes(e.type) && Math.abs(e.t - s) < 0.7), `aviso en ${s}`);
      assert.ok(ev.some((e) => e.type === 'swell' && e.t > s - 1 && e.t < s), `barrido antes de ${s}`);
    }
  });
}

test('Dientín conserva su canción: 32 versos que acaban en 120 s', () => {
  assert.equal(LYRICS.length, 4);
  assert.equal(LYRIC_LINES.length, 32);
  assert.ok(Math.abs(LYRIC_LINES.at(-1).end - TOTAL_SECONDS) < EPS);
});

test('Escapa: parpadeos sincronizados con la música', () => {
  const ev = arrangementFor(THEMES.find((t) => t.id === 'escapa'));
  for (const f of FLICKERS) assert.ok(ev.some((e) => e.type === 'zap' && e.t === f));
});

test('recomendación por edad y dientes por edad', () => {
  assert.equal(recommendedTheme(4).id, 'dientin');
  assert.equal(recommendedTheme(12).id, 'escapa');
  for (let a = 3; a <= 14; a++) {
    const t = recommendedTheme(a);
    assert.ok(a >= t.ages[0] && a <= t.ages[1], `${a} años → ${t.id}`);
  }
  assert.equal(dentitionForAge(5), 'leche');
  assert.equal(dentitionForAge(9), 'mixta');
  assert.equal(dentitionForAge(12), 'definitiva');
});

test('pasos y zonas por tiempo', () => {
  assert.equal(segmentAt(0).id, 'sup-der');
  assert.equal(segmentAt(30).id, 'sup-izq');
  assert.equal(segmentAt(120).id, 'inf-der');
  assert.equal(stepAt(7.5).id, 'fuera');
  assert.equal(stepAt(22.5).id, 'muelas');
  assert.equal(stepAt(120).id, 'muelas');
});
