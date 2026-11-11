// Arranque y pantallas de «La misión de la sonrisa»: perfil, aventura, cepillado y premios.

import { SEGMENTS, STEPS, TOTAL_SECONDS, SEGMENT_SECONDS, AUDIO_MODES, stepAt } from './config.js';
import { BrushingTimer, formatTime } from './timer.js';
import { AudioDirector } from './audio-director.js';
import { FLICKERS } from './soundtrack.js';
import { lyricAt } from './song-dientin.js';
import { THEMES, getTheme, recommendedTheme, dentitionForAge, cueAt } from './themes.js';
import { Mouth } from './mouth.js';
import { Progress } from './progress.js';
import { ACHIEVEMENTS } from './achievements.js';
import { accessoriesFor, isUnlocked, nextUnlock } from './accessories.js';

const $ = (sel) => document.querySelector(sel);
const progress = new Progress();
const profile = () => progress.profile || { name: '', age: 8, theme: 'dientin' };
let theme = getTheme(profile().theme);
const timer = new BrushingTimer();
const audio = new AudioDirector(timer, { ...progress.data.audio, theme: theme.id, name: profile().name });
const mouth = new Mouth($('#mouth'), dentitionForAge(profile().age));

// ── Escenario 3D (si el móvil no tiene WebGL, queda el fondo de color) ───────
let world = null;
async function initWorld() {
  try {
    const mod = await import('./scene.js');
    if (!mod.webglAvailable()) return;
    world = new mod.Scene($('#world'));
    applyThemeToWorld();
    world.setMode(sceneModeFor(current));
    world.start();
  } catch (err) {
    console.warn('Escenario 3D no disponible', err);
  }
}

function applyThemeToWorld() {
  if (!world) return;
  world.setWorld(theme.world);
  world.setMascot(theme.mascot, theme.variant);
  world.setEquipped(progress.data.equipped[mascotKey()], mascotKey());
}

const mascotKey = () => (theme.mascot === 'tooth' ? 'tooth' : 'drone');

// ── Temática: textos, colores, audio, escáner y mundo ───────────────────────
function applyTheme() {
  const p = profile();
  theme = getTheme(p.theme);
  document.body.dataset.theme = theme.id;
  audio.setTheme(theme, p.name);
  mouth.setDentition(dentitionForAge(p.age));
  const title = $('#home-title');
  title.textContent = theme.title;
  title.dataset.text = theme.title;
  title.classList.toggle('glitch', theme.id === 'escapa');
  $('#home-kicker').innerHTML = theme.id === 'escapa' ? '<span class="dot"></span> REC · CINTA 07' : `${theme.emoji} Hola, ${escapeHtml(p.name || 'campeón')}`;
  $('#home-kicker').classList.toggle('rec', theme.id === 'escapa');
  $('#home-sub').textContent = `${theme.tagline} Cuatro zonas de la boca, dos minutos.`;
  $('#btn-start').textContent = theme.start;
  ['#reward-icon', '#reward-icon-2'].forEach((s) => { $(s).textContent = theme.reward.icon; });
  ['#wardrobe-label', '#wardrobe-label-2'].forEach((s) => { $(s).textContent = `Taller de ${theme.companion}`; });
  $('#wardrobe-title').textContent = `Taller de ${theme.companion}`;
  $('#radio-tag').textContent = theme.voice.radio ? '📻 BASE' : `💬 ${theme.companion.toUpperCase()}`;
  $('#scanner-title').textContent = theme.id === 'escapa' ? 'ESCÁNER DENTAL' : 'TUS DIENTES';
  $('#mode-desc-1').textContent = theme.id === 'dientin' ? 'Canción, letra en pantalla y la voz de Dientín' : `Música y ${theme.voice.radio ? 'la radio' : `la voz de ${theme.companion}`}`;
  document.querySelector('meta[name="theme-color"]').content = getComputedStyle(document.body).backgroundColor;
  applyThemeToWorld();
}

function escapeHtml(s) {
  return String(s).replace(/[&<>"']/g, (c) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]));
}

// ── Navegación ──────────────────────────────────────────────────────────────
let current = 'home';
const history = [];
const sceneModeFor = (name) => ({ home: 'home', brush: 'brush', done: 'done', wardrobe: 'hangar' }[name] || 'home');
function show(name, { back = false } = {}) {
  if (!back && current !== name) history.push(current);
  document.querySelectorAll('.screen').forEach((s) => s.classList.toggle('active', s.id === `screen-${name}`));
  current = name;
  world?.setMode(sceneModeFor(name));
  if (name === 'home') renderHome();
  if (name === 'wardrobe') renderWardrobe();
  if (name === 'settings') renderSettings();
  if (name === 'profile') renderProfile();
  if (name === 'logros') renderLogros();
  if (name === 'padres') renderPadresGate();
  window.scrollTo(0, 0);
}
document.querySelectorAll('[data-back]').forEach((b) => b.addEventListener('click', () => show(history.pop() || 'home', { back: true })));

// ── Perfil y elección de aventura ───────────────────────────────────────────
const draft = { name: '', age: null, theme: null };
const AGES = [3, 4, 5, 6, 7, 8, 9, 10, 11, 12, 13, 14];

function renderProfile() {
  const p = progress.profile;
  draft.name = p?.name ?? '';
  draft.age = p?.age ?? null;
  draft.theme = p?.theme ?? null;
  $('#profile-back').hidden = !p; // la primera vez no hay a dónde volver
  $('#p-name').value = draft.name;
  const ages = $('#age-grid');
  ages.innerHTML = '';
  for (const a of AGES) {
    const b = document.createElement('button');
    b.type = 'button';
    b.textContent = a === 14 ? '14+' : String(a);
    b.setAttribute('aria-pressed', String(draft.age === a));
    b.setAttribute('aria-label', `${a} años`);
    b.addEventListener('click', () => {
      draft.age = a;
      if (!draft.themeTouched) draft.theme = recommendedTheme(a).id;
      renderProfileChoices();
    });
    ages.appendChild(b);
  }
  renderProfileChoices();
}

function renderProfileChoices() {
  document.querySelectorAll('#age-grid button').forEach((b, i) => b.setAttribute('aria-pressed', String(AGES[i] === draft.age)));
  const rec = draft.age ? recommendedTheme(draft.age).id : null;
  const grid = $('#theme-grid');
  grid.innerHTML = '';
  for (const t of THEMES) {
    const li = document.createElement('li');
    const b = document.createElement('button');
    b.type = 'button';
    b.className = 'theme-card';
    b.setAttribute('aria-pressed', String(draft.theme === t.id));
    b.innerHTML = `<span class="e" aria-hidden="true">${t.emoji}</span><b>${t.name}</b><small>${t.tagline}</small><span class="ages">${t.ages[0]}–${t.ages[1]} años</span>${t.id === rec ? '<span class="badge">PARA TI</span>' : ''}`;
    b.addEventListener('click', () => {
      draft.theme = t.id;
      draft.themeTouched = true;
      renderProfileChoices();
    });
    li.appendChild(b);
    grid.appendChild(li);
  }
  $('#btn-profile-save').disabled = !(draft.name.trim() && draft.age && draft.theme);
}

$('#p-name').addEventListener('input', (e) => {
  draft.name = e.target.value;
  $('#btn-profile-save').disabled = !(draft.name.trim() && draft.age && draft.theme);
});
$('#btn-profile-save').addEventListener('click', () => {
  progress.setProfile(draft);
  draft.themeTouched = false;
  applyTheme();
  history.length = 0;
  show('home', { back: true });
});
$('#btn-profile').addEventListener('click', () => show('profile'));

// ── Inicio ──────────────────────────────────────────────────────────────────
function renderHome() {
  $('#home-stars').textContent = progress.stars;
  const next = nextUnlock(progress.stars, mascotKey());
  $('#next-unlock').textContent = next
    ? `${next.stars - progress.stars} ${theme.reward.icon} más para: ${next.icon} ${next.name}`
    : `Taller completo: ${theme.companion} lo tiene todo.`;
  const st = progress.stats();
  $('#streak').textContent = st.streak ? `🔥 ${st.streak} ${st.streak === 1 ? 'día' : 'días'} seguidos` : '🔥 Empieza tu racha';
  const slot = new Date().getHours() >= 4 && new Date().getHours() < 14 ? 'mañana' : 'noche';
  $('#slot-hint').textContent = progress.slotRewarded()
    ? `Premio de esta ${slot} conseguido ✓`
    : `Premio de esta ${slot}: pendiente`;
  renderWeek($('#week'), progress.week(new Date(), 7));
  $('#logros-count').textContent = `${Object.keys(progress.achievements).length}/${ACHIEVEMENTS.length}`;
  const pp = progress.pactProgress();
  const pact = progress.data.pact;
  const ph = $('#pact-home');
  ph.hidden = !pact || !!pact.deliveredAt;
  if (pact && !pact.deliveredAt) ph.textContent = pp.done ? `🎁 ¡Premio conseguido: ${pact.reward}!` : `🎁 ${pact.reward}: ${pp.value}/${pp.target} ${pact.type === 'perfectos' ? 'días perfectos' : 'días seguidos'}`;
  world?.setBrushMotion(null);
  world?.setExpression('feliz');
  world?.setLevel(0, { instant: true });
}

const DOW = ['D', 'L', 'M', 'X', 'J', 'V', 'S'];
function renderWeek(ol, days) {
  ol.innerHTML = '';
  for (const d of days) {
    const [y, m, dd] = d.key.split('-').map(Number);
    const li = document.createElement('li');
    li.className = `${d.today ? 'today' : ''} ${d.manana && d.noche ? 'perfect' : ''}`;
    li.title = `${dd}/${m}: ${d.manana ? 'mañana ✓' : 'mañana —'} · ${d.noche ? 'noche ✓' : 'noche —'}`;
    li.innerHTML = `<span class="dots"><i class="${d.manana ? 'on-m' : ''}"></i><i class="${d.noche ? 'on-n' : ''}"></i></span>${DOW[new Date(y, m - 1, dd).getDay()]}`;
    ol.appendChild(li);
  }
}

$('#btn-logros').addEventListener('click', () => show('logros'));
$('#btn-padres').addEventListener('click', () => show('padres'));

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
  world?.setShine(0);
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
  // Respaldo por si el navegador congela requestAnimationFrame (pantalla en segundo plano).
  backupTimeout = setTimeout(() => timer.update(), 250);
}
document.addEventListener('visibilitychange', () => { if (!document.hidden && timer.state === 'running') loop(); });

timer.on('tick', ({ elapsed, remaining }) => {
  $('#time-left').textContent = formatTime(remaining);
  $('#ring-fg').style.strokeDashoffset = String(TOTAL_SECONDS - elapsed);
  mouth.update(elapsed, stepAt(elapsed));
  $('#clean-pct').textContent = `LIMPIEZA ${Math.floor((elapsed / TOTAL_SECONDS) * 100)}%`;
  const segIdx = Math.min(3, Math.floor(elapsed / SEGMENT_SECONDS));
  world?.setShine(((elapsed - segIdx * SEGMENT_SECONDS) / SEGMENT_SECONDS) * 0.6 + segIdx * 0.1);
  // Parpadeos de luz de «Escapa», sincronizados con el chasquido de la música.
  if (theme.id === 'escapa') {
    while (nextFlicker < FLICKERS.length && FLICKERS[nextFlicker] <= elapsed) {
      if (elapsed - FLICKERS[nextFlicker] < 0.5) world?.flicker(0.6);
      nextFlicker++;
    }
  }
  renderVoiceBox(elapsed);
});

timer.on('segment', ({ index, elapsed }) => {
  const seg = SEGMENTS[index];
  $('#zone-label').textContent = seg.label;
  $('#level-label').textContent = theme.levels[index].toUpperCase();
  document.querySelectorAll('#zone-dots i').forEach((d, i) => {
    d.classList.toggle('done', i < index);
    d.classList.toggle('active', i === index);
  });
  const card = $('#level-card');
  card.textContent = theme.levels[index].toUpperCase();
  card.classList.remove('go');
  void card.offsetWidth;
  card.classList.add('go');
  if (index > 0) {
    world?.setLevel(index);
    world?.cheer(1800); // animado al cambiar de zona
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
  showDone(progress.completeMission(new Date(), theme.id));
});

// Recuadro de texto: la letra de la canción (Dientín, con música) o lo que dice la voz.
function renderVoiceBox(t) {
  const box = $('#radio');
  const lyrics = theme.id === 'dientin' && audio.settings.mode !== AUDIO_MODES.RADIO;
  const item = lyrics ? lyricAt(t) : cueAt(audio.cues, t);
  const key = item ? `${lyrics ? 'l' : 'c'}${item.id ?? item.start}` : '';
  if (!item || box.dataset.cue === key) return;
  box.dataset.cue = key;
  $('#radio-tag').textContent = lyrics ? '🎵' : theme.voice.radio ? '📻 BASE' : `💬 ${theme.companion.toUpperCase()}`;
  $('#radio-text').textContent = item.text;
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

// ── Final ───────────────────────────────────────────────────────────────────
function showDone(result) {
  show('done');
  world?.setBrushMotion(null);
  world?.setShine(1);
  world?.setExpression('contento');
  const n = progress.stars;
  const name = profile().name || 'campeón';
  const st = progress.stats();
  const streak = st.streak > 1 ? ` 🔥 Racha: ${st.streak} días.` : '';
  $('#done-title').textContent = theme.done;
  $('#award').textContent = result.rewarded ? theme.reward.icon : '🪥';
  $('#done-text').textContent = result.rewarded
    ? `¡Bien hecho, ${name}! +1 ${theme.reward.icon} · Llevas ${n} ${n === 1 ? theme.reward.one : theme.reward.many}.${streak}`
    : `¡Bien hecho, ${name}! El premio de esta ${result.slot === 'manana' ? 'mañana' : 'noche'} ya lo tenías. El siguiente, ${result.slot === 'manana' ? 'esta noche' : 'mañana por la mañana'}.${streak}`;
  const unlocked = result[mascotKey()];
  const box = $('#unlocked');
  box.hidden = !unlocked.length;
  if (unlocked.length) box.textContent = `Desbloqueado para ${theme.companion}: ${unlocked.map((a) => `${a.icon} ${a.name}`).join(', ')}`;
  const ul = $('#new-logros');
  ul.hidden = !result.achievements.length;
  ul.innerHTML = result.achievements.map((a) => `<li>${a.icon} Logro nuevo: ${a.name}</li>`).join('');
  const pd = $('#pact-done');
  pd.hidden = !result.pactDone;
  if (result.pactDone) pd.textContent = `🎁 ¡Has conseguido el premio: ${progress.data.pact.reward}! Avisa a tu familia.`;
}

// ── Logros ──────────────────────────────────────────────────────────────────
function renderLogros() {
  const st = progress.stats();
  const got = progress.achievements;
  $('#logros-pill').textContent = `${Object.keys(got).length}/${ACHIEVEMENTS.length}`;
  $('#stats-card').innerHTML = `
    <div><b>${st.streak}</b><small>días seguidos</small></div>
    <div><b>${st.bestStreak}</b><small>mejor racha</small></div>
    <div><b>${st.perfectDays}</b><small>días perfectos</small></div>`;
  $('#logros-grid').innerHTML = ACHIEVEMENTS.map((a) => `
    <li class="logro ${got[a.id] ? '' : 'locked'}"><span class="e" aria-hidden="true">${got[a.id] ? a.icon : '🔒'}</span><b>${a.name}</b><small>${a.desc}</small></li>`).join('');
}

// ── Zona de padres ──────────────────────────────────────────────────────────
let gateAnswer = 0;
function renderPadresGate() {
  const a = 6 + Math.floor(Math.random() * 4);
  const b = 6 + Math.floor(Math.random() * 4);
  gateAnswer = a * b;
  $('#gate-q').textContent = `${a} × ${b}`;
  $('#gate-a').value = '';
  $('#gate-msg').textContent = '';
  $('#padres-gate').hidden = false;
  $('#padres-panel').hidden = true;
}
function tryGate() {
  if (Number($('#gate-a').value) === gateAnswer) {
    $('#padres-gate').hidden = true;
    $('#padres-panel').hidden = false;
    renderPadres();
  } else {
    $('#gate-msg').textContent = 'No es correcto. Prueba otra vez.';
  }
}
$('#gate-ok').addEventListener('click', tryGate);
$('#gate-a').addEventListener('keydown', (e) => { if (e.key === 'Enter') tryGate(); });

function renderPadres() {
  renderWeek($('#week-14'), progress.week(new Date(), 14));
  const st = progress.stats();
  const last7 = progress.week(new Date(), 7);
  const turns7 = last7.reduce((n, d) => n + (d.manana ? 1 : 0) + (d.noche ? 1 : 0), 0);
  $('#kpis').innerHTML = [
    ['Racha actual', `${st.streak} d`],
    ['Mejor racha', `${st.bestStreak} d`],
    ['Turnos esta semana', `${turns7}/14`],
    ['Días perfectos', st.perfectDays],
    ['Cepillados totales', st.total],
    ['Aventuras probadas', `${st.themes}/7`],
  ].map(([k, v]) => `<div><dt>${k}</dt><dd>${v}</dd></div>`).join('');
  const pact = progress.data.pact;
  const view = $('#pact-view');
  if (!pact) {
    view.innerHTML = '<p class="sub">No hay ningún premio pactado.</p>';
  } else {
    const pp = progress.pactProgress();
    const what = pact.type === 'perfectos' ? 'días perfectos' : 'días seguidos';
    view.innerHTML = `
      <p><b>${escapeHtml(pact.reward)}</b> · ${pp.value}/${pp.target} ${what}</p>
      <div class="pact-bar"><i style="width:${Math.round((pp.value / pp.target) * 100)}%"></i></div>
      <p class="sub">${pact.deliveredAt ? 'Entregado ✓' : pp.done ? '¡Conseguido! Pendiente de entregar.' : 'En marcha.'}</p>
      <div class="pact-actions">
        ${pp.done && !pact.deliveredAt ? '<button class="soft-btn" id="pact-delivered">Marcar como entregado</button>' : ''}
        <button class="soft-btn ghost" id="pact-clear">Quitar premio</button>
      </div>`;
    $('#pact-delivered')?.addEventListener('click', () => { progress.markPactDelivered(); renderPadres(); });
    $('#pact-clear').addEventListener('click', () => { progress.clearPact(); renderPadres(); });
  }
  $('#pact-form').hidden = !!pact && !pact.deliveredAt;
}
$('#pact-form').addEventListener('submit', (e) => {
  e.preventDefault();
  const reward = $('#pact-reward').value.trim();
  if (!reward) { $('#pact-reward').focus(); return; }
  progress.setPact({ reward, type: $('#pact-type').value, target: $('#pact-target').value });
  $('#pact-reward').value = '';
  renderPadres();
});

// ── Taller del compañero ────────────────────────────────────────────────────
function renderWardrobe() {
  $('#wardrobe-stars').textContent = progress.stars;
  world?.setBrushMotion(null);
  world?.setExpression('feliz');
  const key = mascotKey();
  const equipped = progress.data.equipped[key];
  const grid = $('#acc-grid');
  grid.innerHTML = '';
  for (const acc of accessoriesFor(key)) {
    const li = document.createElement('li');
    const b = document.createElement('button');
    b.className = 'acc';
    const open = isUnlocked(acc, progress.stars, progress.achievements);
    const on = equipped[acc.slot] === acc.id;
    b.disabled = !open;
    b.setAttribute('aria-pressed', String(on));
    b.innerHTML = `<span class="e" aria-hidden="true">${open ? acc.icon : '🔒'}</span><b>${acc.name}</b><small>${open ? (on ? 'PUESTO' : 'PONER') : acc.achievement ? '🔥 7 días seguidos' : `${acc.stars} ${theme.reward.icon}`}</small>`;
    b.addEventListener('click', () => {
      progress.equip(acc.id, key);
      world?.setEquipped(progress.data.equipped[key], key);
      world?.cheer(1200);
      renderWardrobe();
    });
    li.appendChild(b);
    grid.appendChild(li);
  }
}

// ── Sonido ──────────────────────────────────────────────────────────────────
function renderSettings() {
  const a = progress.data.audio;
  document.querySelectorAll('input[name="mode"]').forEach((r) => { r.checked = r.value === a.mode; });
  $('#vol-music').value = a.musicVolume;
  $('#vol-voice').value = a.voiceVolume;
  const status = [
    audio.assets.instrumental ? 'Música: pista grabada.' : 'Música: original, generada en el móvil (funciona sin conexión).',
    audio.assets.voice.size
      ? `Voz: ${audio.assets.voice.size} de ${audio.cues.length} frases grabadas.`
      : 'Voz: la del móvil en español (sin conexión solo si el móvil la tiene descargada).',
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
  const d = new AudioDirector(t, { ...progress.data.audio, theme: theme.id, name: profile().name }, audio);
  await d.unlock();
  t.start();
  const iv = setInterval(() => t.update(), 50);
  setTimeout(() => { clearInterval(iv); t.reset(); d.dispose(); testing = false; }, 5000);
});

// ── Service worker (funcionamiento sin conexión) ───────────────────────────
if ('serviceWorker' in navigator && location.protocol !== 'file:') {
  navigator.serviceWorker.register('sw.js').catch((e) => console.warn('SW', e));
}

applyTheme();
if (!progress.profile) show('profile');
else renderHome();
initWorld();

// Acceso para depuración desde la consola.
window.__mision = { timer, audio, progress, mouth, get world() { return world; }, get theme() { return theme; } };
