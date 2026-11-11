// Guarda la app en el móvil para que funcione sin conexión.
// Al cambiar cualquier archivo, sube VERSION para que los móviles descarguen la nueva.
const VERSION = 'sonrisa-v1';
const FILES = [
  './', 'index.html', 'manifest.webmanifest', 'css/styles.css',
  'icons/icon-192.png', 'icons/icon-512.png', 'assets/audio/manifest.json',
  'js/app.js', 'js/accessories.js', 'js/audio-director.js', 'js/config.js', 'js/mouth.js',
  'js/music-engine.js', 'js/progress.js', 'js/scene.js', 'js/soundtrack.js', 'js/timer.js',
  'vendor/three.module.min.js',
];

self.addEventListener('install', (e) => {
  e.waitUntil(caches.open(VERSION).then((c) => c.addAll(FILES)).then(() => self.skipWaiting()));
});

self.addEventListener('activate', (e) => {
  e.waitUntil(
    caches.keys()
      .then((keys) => Promise.all(keys.filter((k) => k !== VERSION).map((k) => caches.delete(k))))
      .then(() => self.clients.claim()),
  );
});

// Primero lo guardado; si no está, la red (y se guarda para la próxima vez).
self.addEventListener('fetch', (e) => {
  if (e.request.method !== 'GET' || new URL(e.request.url).origin !== location.origin) return;
  e.respondWith(
    caches.match(e.request, { ignoreSearch: true }).then((hit) =>
      hit || fetch(e.request).then((res) => {
        if (res.ok) { const copy = res.clone(); caches.open(VERSION).then((c) => c.put(e.request, copy)); }
        return res;
      }),
    ),
  );
});
