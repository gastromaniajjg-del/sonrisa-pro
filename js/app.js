// Arranque y pantallas de «La misión de la sonrisa».

import { SEGMENTS, STEPS, TOTAL_SECONDS, AUDIO_MODES, stepAt } from './config.js';
import { BrushingTimer, formatTime } from './timer.js';
import { AudioDirector } from './audio-director.js';
import { LYRIC_LINES, lyricAt } from './song.js';
import { Mouth } from './mouth.js';
import { Progress } from './progress.js';
import { ACCESSORIES, isUnlocked, nextUnlock } from './accessories.js';
import { startConfetti } from './confetti.js';

const $ = (sel) => document.querySelector(sel);
const progress = new Progress();
const timer = new BrushingTimer();
const audio = new AudioDirector(timer, progress.data.audio);
const mouth = new Mouth($('#mouth'));

// ── Denti (3D, con alternativa 2D) ──────────────────────────────────────────
let denti;
async function initDenti() {
  try {
    const mod = await import('./denti.js');
    denti = mod.webglAvailable() ? new mod.Denti() : new mod.DentiFallback();
  } catch (err) {
    console.warn('Denti 3D no disponible', err);
    const mod = await import('./denti.js').catch(() => null);
    denti = mod ? new mod.DentiFallback() : null;
  }
  if (!denti) return;
  denti.setEquipped(progress.data.equipped);
  denti.mount($('#home-denti'));
  denti.setExpression('feliz');
}

// ── Navegación ──────────────────────────────────────────────────────────────
let current = 'home';
const history = [];
function show(name, { back = false } = {}) {
  if (!back && current !== name) history.push(current);
  document.querySelectorAll('.screen').forEach((s) => s.classList.toggle('active', s.id === `screen-${name}`));
  current = name;
  const slot = { home: '#home-denti', brush: '#brush-denti', done: '#done-denti', wardrobe: '#wardrobe-denti' }[name];
  if (denti && slot) denti.mount($(slot));
  if (name === 'home') renderHome();
  if (name === 'wardrobe') renderWardrobe();
  if (name === 'settings') renderSettings();
}
document.querySelectorAll('[data-back]').forEach((b) => b.addEventListener('click', () => show(history.pop() || 'home', { back: true })));

// ── Inicio ──────────────────────────────────────────────────────────────────
function renderHome() {
  $('#home-stars').textContent = progress.stars;
  const next = nextUnlock(progress.stars);
  $('#next-unlock').textContent = next
    ? `Te faltan ${next.stars - progress.stars} ⭐ para: ${next.emoji} ${next.name}`
    : '¡Has desbloqueado todos los disfraces!';
  denti?.setBrushMotion(null);
  denti?.setExpression('feliz');
  denti?.setShine(0);
}

$('#btn-start').addEventListener('click', startMission);
$('#btn-wardrobe').addEventListener('click', () => show('wardrobe'));
$('#btn-wardrobe-2').addEventListener('click', () => show('wardrobe'));
$('#btn-settings').addEventListener('click', () => show('settings'));
$('#btn-home').addEventListener('click', () => { history.length = 0; show('home', { back: true }); });

// ── Cepillado ───────────────────────────────────────────────────────────────
// Marcas de los cambios de zona en el anillo.
$('#ring-ticks').innerHTML = [30, 60, 90]
  .map((s) => {
    const a = (s / TOTAL_SECONDS) * Math.PI * 2;
    const [x1, y1, x2, y2] = [50 + Math.cos(a) * 38, 50 + Math.sin(a) * 38, 50 + Math.cos(a) * 50, 50 + Math.sin(a) * 50];
    return `<line class="ring-tick" x1="${x1}" y1="${y1}" x2="${x2}" y2="${y2}"/>`;
  })
  .join('');

let wakeLock = null;
async function keepAwake(on) {
  try {
    if (on && 'wakeLock' in navigator) wakeLock = await navigator.wakeLock.request('screen');
    else if (!on && wakeLock) { await wakeLock.release(); wakeLock = null; }
  } catch { /* no soportado o denegado */ }
}

async function startMission() {
  await audio.unlock(); // dentro del gesto del usuario
  mouth.reset();
  show('brush');
  denti?.setExpression('feliz');
  denti?.setShine(0);
  $('#btn-pause').textContent = '⏸ Pausa';
  $('#lyrics').hidden = audio.settings.mode !== AUDIO_MODES.CANCION && audio.settings.mode !== AUDIO_MODES.INSTRUMENTAL;
  keepAwake(true);
  timer.start();
  loop();
}

let rafId = 0;
let backupTimeout = 0;
let endTimeout = 0;
// Despertador exacto para el segundo 120 (no depende de los fotogramas).
function armEnd() {
  clearTimeout(endTimeout);
  if (timer.state === 'running') endTimeout = setTimeout(() => timer.update(), timer.remaining() * 1000 + 1);
}
timer.on('start', armEnd);
timer.on('resume', armEnd);
timer.on('pause', () => clearTimeout(endTimeout));
timer.on('reset', () => clearTimeout(endTimeout));

function loop() {
  cancelAnimationFrame(rafId);
  clearTimeout(backupTimeout);
  if (timer.state !== 'running') return;
  timer.update();
  rafId = requestAnimationFrame(loop);
  // Respaldo: si el navegador congela requestAnimationFrame (pantalla en segundo plano),
  // el temporizador sigue comprobándose y la misión termina en su segundo exacto.
  backupTimeout = setTimeout(() => timer.update(), 250);
}
document.addEventListener('visibilitychange', () => { if (!document.hidden && timer.state === 'running') loop(); });

timer.on('tick', ({ elapsed, remaining }) => {
  $('#time-left').textContent = formatTime(remaining);
  $('#ring-fg').style.strokeDashoffset = String(TOTAL_SECONDS - elapsed);
  mouth.update(elapsed, stepAt(elapsed));
  const segIdx = Math.min(3, Math.floor(elapsed / 30));
  denti?.setShine((elapsed - segIdx * 30) / 30 * 0.6 + segIdx * 0.1);
  renderLyrics(elapsed);
});

timer.on('segment', ({ index, elapsed }) => {
  const seg = SEGMENTS[index];
  $('#zone-label').textContent = seg.label;
  document.querySelectorAll('#zone-dots i').forEach((d, i) => {
    d.classList.toggle('done', i < index);
    d.classList.toggle('active', i === index);
  });
  if (index > 0) {
    denti?.cheer(1800); // animado al cambiar de zona
    const f = $('#zone-flash');
    f.classList.remove('go');
    void f.offsetWidth;
    f.classList.add('go');
    navigator.vibrate?.(120);
  } else if (elapsed < 1) {
    // Feliz al empezar, concentrado en cuanto empieza a enseñar.
    setTimeout(() => { if (timer.state === 'running' && denti?.mood === 'feliz') denti.setExpression('concentrado'); }, 2500);
  }
});

timer.on('step', ({ index }) => {
  const step = STEPS[index];
  $('#step-label').textContent = step.label;
  $('#step-hint').textContent = step.hint;
  denti?.setBrushMotion(step.brush);
});

timer.on('complete', () => {
  cancelAnimationFrame(rafId);
  clearTimeout(backupTimeout);
  keepAwake(false);
  $('#time-left').textContent = '0:00';
  $('#ring-fg').style.strokeDashoffset = '0';
  mouth.finish();
  const unlocked = progress.completeMission();
  showCelebration(unlocked);
});

function renderLyrics(t) {
  const box = $('#lyrics');
  if (box.hidden) return;
  const line = lyricAt(t);
  const key = line ? line.start : -1;
  if (box.dataset.key === String(key)) return;
  box.dataset.key = String(key);
  const next = LYRIC_LINES.find((l) => l.start >= (line ? line.end : t));
  box.innerHTML = '';
  const cur = document.createElement('div');
  cur.className = 'line';
  cur.textContent = line ? line.text : '';
  box.appendChild(cur);
  if (next && next.start < TOTAL_SECONDS) {
    const n = document.createElement('div');
    n.className = 'line next';
    n.textContent = next.text;
    box.appendChild(n);
  }
}

$('#btn-pause').addEventListener('click', () => {
  if (timer.state === 'running') {
    timer.pause();
    $('#btn-pause').textContent = '▶ Seguir';
    denti?.setBrushMotion(null);
    keepAwake(false);
  } else if (timer.state === 'paused') {
    audio.unlock().then(() => {
      timer.resume();
      $('#btn-pause').textContent = '⏸ Pausa';
      denti?.setBrushMotion(stepAt(timer.elapsed()).brush);
      keepAwake(true);
      loop();
    });
  }
});

$('#btn-quit').addEventListener('click', () => {
  timer.reset();
  cancelAnimationFrame(rafId);
  keepAwake(false);
  history.length = 0;
  show('home', { back: true });
});

// ── Celebración ─────────────────────────────────────────────────────────────
function showCelebration(unlocked) {
  show('done');
  denti?.setBrushMotion(null);
  denti?.setShine(1);
  denti?.setExpression('contento');
  $('#done-text').textContent = `Has ganado una estrella. ¡Ya tienes ${progress.stars} ⭐!`;
  const box = $('#unlocked');
  if (unlocked.length) {
    box.hidden = false;
    box.textContent = `🎁 ¡Nuevo para Denti! ${unlocked.map((a) => `${a.emoji} ${a.name}`).join(', ')}`;
  } else {
    box.hidden = true;
  }
  startConfetti($('#confetti'));
}

// ── Vestidor ────────────────────────────────────────────────────────────────
function renderWardrobe() {
  $('#wardrobe-stars').textContent = progress.stars;
  denti?.setBrushMotion(null);
  denti?.setExpression('feliz');
  const grid = $('#acc-grid');
  grid.innerHTML = '';
  for (const acc of ACCESSORIES) {
    const li = document.createElement('li');
    const b = document.createElement('button');
    b.className = 'acc';
    const open = isUnlocked(acc, progress.stars);
    b.disabled = !open;
    b.setAttribute('aria-pressed', String(progress.data.equipped[acc.slot] === acc.id));
    b.innerHTML = `<span class="e" aria-hidden="true">${open ? acc.emoji : '🔒'}</span><b>${acc.name}</b><small>${open ? (progress.data.equipped[acc.slot] === acc.id ? 'Puesto' : 'Ponérselo') : `${acc.stars} ⭐`}</small>`;
    b.addEventListener('click', () => {
      progress.equip(acc.id);
      denti?.setEquipped(progress.data.equipped);
      denti?.cheer(1200);
      renderWardrobe();
    });
    li.appendChild(b);
    grid.appendChild(li);
  }
}

// ── Ajustes de sonido ───────────────────────────────────────────────────────
function renderSettings() {
  const a = progress.data.audio;
  document.querySelectorAll('input[name="mode"]').forEach((r) => { r.checked = r.value === a.mode; });
  $('#vol-music').value = a.musicVolume;
  $('#vol-voice').value = a.voiceVolume;
  const status = [];
  status.push(audio.assets.instrumental ? 'Música: pista grabada.' : 'Música: sintetizada en el móvil (original, sin conexión).');
  status.push(audio.assets.vocal ? 'Canción cantada: grabada.' : 'Canción cantada: aún no grabada; la letra se muestra en pantalla.');
  status.push(audio.assets.voice.size ? `Voz: ${audio.assets.voice.size} frases grabadas.` : 'Voz: voz del sistema en español (si el móvil la tiene instalada).');
  $('#audio-status').textContent = status.join(' ');
}

document.querySelectorAll('input[name="mode"]').forEach((r) =>
  r.addEventListener('change', () => {
    progress.setAudio({ mode: r.value });
    audio.setMode(r.value);
  }),
);
$('#vol-music').addEventListener('input', (e) => {
  progress.setAudio({ musicVolume: +e.target.value });
  audio.setVolumes({ musicVolume: +e.target.value });
});
$('#vol-voice').addEventListener('input', (e) => {
  progress.setAudio({ voiceVolume: +e.target.value });
  audio.setVolumes({ voiceVolume: +e.target.value });
});

// Prueba de 5 s: usa un temporizador propio, independiente del de la misión.
let testTimer = null;
$('#btn-test-audio').addEventListener('click', async () => {
  if (testTimer) return;
  const t = new BrushingTimer({ total: TOTAL_SECONDS });
  const d = new AudioDirector(t, { ...progress.data.audio }, audio);
  await d.unlock();
  testTimer = t;
  t.start();
  const iv = setInterval(() => t.update(), 50);
  setTimeout(() => {
    clearInterval(iv);
    t.reset();
    d.dispose();
    testTimer = null;
  }, 5000);
});

// ── Service worker (funcionamiento sin conexión) ───────────────────────────
if ('serviceWorker' in navigator && location.protocol !== 'file:') {
  navigator.serviceWorker.register('sw.js').catch((e) => console.warn('SW', e));
}

initDenti();
renderHome();

// Acceso para depuración desde la consola.
window.__mision = { timer, audio, progress };
