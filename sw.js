// Service worker: guarda la app completa en el móvil para que funcione sin Internet.
// Al cambiar cualquier archivo, sube la versión para que se actualice la caché.
const VERSION = 'mision-sonrisa-v6';

const CORE = [
  './',
  'index.html',
  'manifest.webmanifest',
  'css/styles.css',
  'js/app.js',
  'js/config.js',
  'js/soundtrack.js',
  'js/song-dientin.js',
  'js/themes.js',
  'js/arrangements.js',
  'js/worlds.js',
  'js/tooth.js',
  'js/timer.js',
  'js/music-engine.js',
  'js/audio-director.js',
  'js/mouth.js',
  'js/scene.js',
  'js/accessories.js',
  'js/progress.js',
  'js/achievements.js',
  'vendor/three.module.min.js',
  'assets/icons/icon.svg',
  'assets/icons/icon-192.png',
  'assets/icons/icon-512.png',
  'assets/audio/manifest.json',
];

async function audioFiles() {
  try {
    const res = await fetch('assets/audio/manifest.json', { cache: 'no-cache' });
    const m = await res.json();
    const files = [];
    for (const [theme, entry] of Object.entries(m)) {
      if (entry.instrumental) files.push(`assets/audio/${theme}/musica.mp3`);
      for (const id of entry.voz || []) files.push(`assets/audio/${theme}/voz/${id}.mp3`);
    }
    return files;
  } catch {
    return [];
  }
}

self.addEventListener('install', (event) => {
  event.waitUntil((async () => {
    const cache = await caches.open(VERSION);
    await cache.addAll(CORE);
    // Los audios grabados son opcionales: si alguno falla, la app sigue funcionando.
    for (const f of await audioFiles()) await cache.add(f).catch(() => {});
    self.skipWaiting();
  })());
});

self.addEventListener('activate', (event) => {
  event.waitUntil((async () => {
    for (const key of await caches.keys()) if (key !== VERSION) await caches.delete(key);
    await self.clients.claim();
  })());
});

self.addEventListener('fetch', (event) => {
  if (event.request.method !== 'GET') return;
  event.respondWith((async () => {
    const cached = await caches.match(event.request, { ignoreSearch: true });
    if (cached) return cached;
    try {
      const res = await fetch(event.request);
      if (res.ok && new URL(event.request.url).origin === location.origin) {
        const cache = await caches.open(VERSION);
        cache.put(event.request, res.clone());
      }
      return res;
    } catch {
      if (event.request.mode === 'navigate') return caches.match('index.html');
      throw new Error('sin conexión');
    }
  })());
});
