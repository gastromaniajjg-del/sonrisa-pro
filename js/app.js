// Arranque y pantallas de «La misión de la sonrisa · Escapa en 2 minutos».

import { SEGMENTS, STEPS, TOTAL_SECONDS, SEGMENT_SECONDS, stepAt } from './config.js';
import { BrushingTimer, formatTime } from './timer.js';
import { AudioDirector } from './audio-director.js';
import { RADIO_CUES, FLICKERS, radioAt } from './soundtrack.js';
import { Mouth } from './mouth.js';
import { Progress } from './progress.js';
import { ACCESSORIES, isUnlocked, nextUnlock } from './accessories.js';

const $ = (sel) => document.querySelector(sel);
const progress = new Progress();
const timer = new BrushingTimer();
const audio = new AudioDirector(timer, progress.data.audio);
const mouth = new Mouth($('#mouth'));

// ── Escenario 3D (si el móvil no tiene WebGL, queda un fondo liso) ───────────
let world = null;
async function initWorld() {
  try {
    const mod = await import('./scene.js');
    if (!mod.webglAvailable()) return;
    world = new mod.Scene($('#world'));
    world.setEquipped(progress.data.equipped);
    world.setMode(current);
    world.start();
  } catch (err) {
    console.warn('Escenario 3D no disponible', err);
  }
}

// ── Navegación ──────────────────────────────────────────────────────────────
let current = 'home';
const history = [];
function show(name, { back = false } = {}) {
  if (!back && current !== name) history.push(current);
  document.querySelectorAll('.screen').forEach((s) => s.classList.toggle('active', s.id === `screen-${name}`));
  current = name;
  const sceneMode = { home: 'home', brush: 'brush', done: 'done', wardrobe: 'hangar', settings: 'home' }[name];
  world?.setMode(sceneMode);
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
    ? `${next.stars - progress.stars} 🗺️ más para: ${next.icon} ${next.name}`
    : 'Taller completo: lo tienes todo.';
  world?.setBrushMotion(null);
  world?.setExpression('feliz');
  world?.setLevel(0, { instant: true });
}

$('#btn-start').addEventListener('click', startMission);
$('#btn-wardrobe').addEventListener('click', () => show('wardrobe'));
$('#btn-wardrobe-2').addEventListener('click', () => show('wardrobe'));
$('#btn-settings').addEventListener('click', () => show('settings'));
$('#btn-home').addEventListener('click', () => { history.length = 0; show('home', { back: true }); });

// ── Cepillado ───────────────────────────────────────────────────────────────
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

let nextFlicker = 0;
async function startMission() {
  await audio.unlock(); // dentro del gesto del usuario
  mouth.reset();
  nextFlicker = 0;
  $('#radio-text').textContent = '…';
  delete $('#radio').dataset.cue;
  show('brush');
  world?.setLevel(0, { instant: true });
  world?.setExpression('feliz');
  $('#btn-pause').textContent = 'Pausa';
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
  // el temporizador sigue comprobándose.
  backupTimeout = setTimeout(() => timer.update(), 250);
}
document.addEventListener('visibilitychange', () => { if (!document.hidden && timer.state === 'running') loop(); });

timer.on('tick', ({ elapsed, remaining }) => {
  $('#time-left').textContent = formatTime(remaining);
  $('#ring-fg').style.strokeDashoffset = String(TOTAL_SECONDS - elapsed);
  mouth.update(elapsed, stepAt(elapsed));
  $('#clean-pct').textContent = `LIMPIEZA ${Math.floor((elapsed / TOTAL_SECONDS) * 100)}%`;
  // Parpadeos de luz sincronizados con el chasquido de la música.
  while (nextFlicker < FLICKERS.length && FLICKERS[nextFlicker] <= elapsed) {
    if (elapsed - FLICKERS[nextFlicker] < 0.5) world?.flicker(0.6);
    nextFlicker++;
  }
  renderRadio(elapsed);
});

timer.on('segment', ({ index, elapsed }) => {
  const seg = SEGMENTS[index];
  $('#zone-label').textContent = seg.label;
  $('#level-label').textContent = seg.level.toUpperCase();
  document.querySelectorAll('#zone-dots i').forEach((d, i) => {
    d.classList.toggle('done', i < index);
    d.classList.toggle('active', i === index);
  });
  const card = $('#level-card');
  card.textContent = seg.level.toUpperCase();
  card.classList.remove('go');
  void card.offsetWidth;
  card.classList.add('go');
  if (index > 0) {
    world?.setLevel(index);
    world?.cheer(1800); // animado al cambiar de nivel
    navigator.vibrate?.([80, 60, 80]);
  } else if (elapsed < 1) {
    // Feliz al empezar; concentrado en cuanto empieza a enseñar.
    setTimeout(() => { if (timer.state === 'running' && world?.mood === 'feliz') world.setExpression('concentrado'); }, 2500);
  }
});

timer.on('step', ({ index }) => {
  const step = STEPS[index];
  $('#step-label').textContent = step.label;
  $('#step-hint').textContent = step.hint;
  world?.setBrushMotion(step.brush);
});

timer.on('complete', () => {
  cancelAnimationFrame(rafId);
  clearTimeout(backupTimeout);
  keepAwake(false);
  $('#time-left').textContent = '0:00';
  $('#ring-fg').style.strokeDashoffset = '0';
  $('#clean-pct').textContent = 'LIMPIEZA 100%';
  mouth.finish();
  const unlocked = progress.completeMission();
  showExit(unlocked);
});

// Transcripción de la radio: siempre visible, también en «Solo música».
function renderRadio(t) {
  const cue = radioAt(t);
  const box = $('#radio');
  if (!cue || box.dataset.cue === cue.id) return;
  box.dataset.cue = cue.id;
  $('#radio-text').textContent = cue.text;
  box.classList.remove('new');
  void box.offsetWidth;
  box.classList.add('new');
}

$('#btn-pause').addEventListener('click', () => {
  if (timer.state === 'running') {
    timer.pause();
    $('#btn-pause').textContent = 'Seguir';
    world?.setBrushMotion(null);
    world?.setMode('home');
    keepAwake(false);
  } else if (timer.state === 'paused') {
    audio.unlock().then(() => {
      timer.resume();
      $('#btn-pause').textContent = 'Pausa';
      world?.setMode('brush');
      world?.setBrushMotion(stepAt(timer.elapsed()).brush);
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

// ── Salida (celebración) ────────────────────────────────────────────────────
function showExit(unlocked) {
  show('done');
  world?.setBrushMotion(null);
  world?.setExpression('contento');
  $('#done-text').textContent = `Fragmento de mapa conseguido. Llevas ${progress.stars} 🗺️.`;
  const box = $('#unlocked');
  if (unlocked.length) {
    box.hidden = false;
    box.textContent = `Desbloqueado: ${unlocked.map((a) => `${a.icon} ${a.name}`).join(', ')}`;
  } else {
    box.hidden = true;
  }
}

// ── Taller del dron ─────────────────────────────────────────────────────────
function renderWardrobe() {
  $('#wardrobe-stars').textContent = progress.stars;
  world?.setBrushMotion(null);
  world?.setExpression('feliz');
  const grid = $('#acc-grid');
  grid.innerHTML = '';
  for (const acc of ACCESSORIES) {
    const li = document.createElement('li');
    const b = document.createElement('button');
    b.className = 'acc';
    const open = isUnlocked(acc, progress.stars);
    const on = progress.data.equipped[acc.slot] === acc.id;
    b.disabled = !open;
    b.setAttribute('aria-pressed', String(on));
    b.innerHTML = `<span class="e" aria-hidden="true">${open ? acc.icon : '🔒'}</span><b>${acc.name}</b><small>${open ? (on ? 'MONTADO' : 'MONTAR') : `${acc.stars} 🗺️`}</small>`;
    b.addEventListener('click', () => {
      progress.equip(acc.id);
      world?.setEquipped(progress.data.equipped);
      world?.cheer(1200);
      renderWardrobe();
    });
    li.appendChild(b);
    grid.appendChild(li);
  }
}

// ── Audio ───────────────────────────────────────────────────────────────────
function renderSettings() {
  const a = progress.data.audio;
  document.querySelectorAll('input[name="mode"]').forEach((r) => { r.checked = r.value === a.mode; });
  $('#vol-music').value = a.musicVolume;
  $('#vol-voice').value = a.voiceVolume;
  const status = [
    audio.assets.instrumental ? 'Música: pista grabada.' : 'Música: generada en el móvil (original, funciona sin conexión).',
    audio.assets.voice.size
      ? `Radio: ${audio.assets.voice.size} de ${RADIO_CUES.length} mensajes grabados.`
      : 'Radio: voz del sistema en español (sin conexión solo si el móvil la tiene descargada).',
  ];
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

// Prueba de 5 s con un temporizador propio, independiente del de la misión.
let testing = false;
$('#btn-test-audio').addEventListener('click', async () => {
  if (testing) return;
  testing = true;
  const t = new BrushingTimer({ total: TOTAL_SECONDS });
  const d = new AudioDirector(t, { ...progress.data.audio }, audio);
  await d.unlock();
  t.start();
  const iv = setInterval(() => t.update(), 50);
  setTimeout(() => { clearInterval(iv); t.reset(); d.dispose(); testing = false; }, 5000);
});

// ── Service worker (funcionamiento sin conexión) ───────────────────────────
if ('serviceWorker' in navigator && location.protocol !== 'file:') {
  navigator.serviceWorker.register('sw.js').catch((e) => console.warn('SW', e));
}

renderHome();
initWorld();

// Acceso para depuración desde la consola.
window.__mision = { timer, audio, progress, get world() { return world; }, SEGMENT_SECONDS };
