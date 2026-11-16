const CACHE_NAME = 'fit-master-v03';
const APP_SHELL = [
  "./",
  "./index.html",
  "./styles.css",
  "./app.js",
  "./exercises-data.js",
  "./exercises.json",
  "./manifest.webmanifest",
  "./icon.svg",
  "./assets/icon-180.png",
  "./assets/icon-192.png",
  "./assets/icon-512.png",
  "./assets/anatomy/arms.svg",
  "./assets/anatomy/back.svg",
  "./assets/anatomy/chest.svg",
  "./assets/anatomy/legs.svg",
  "./assets/exercises/biceps-machine.svg",
  "./assets/exercises/chest-fly.svg",
  "./assets/exercises/chest-press.svg",
  "./assets/exercises/flat-walk.svg",
  "./assets/exercises/hip-abduction.svg",
  "./assets/exercises/hip-adduction.svg",
  "./assets/exercises/lateral-raise.svg",
  "./assets/exercises/leg-extension.svg",
  "./assets/exercises/reverse-fly-supported.svg",
  "./assets/exercises/row-chest-supported.svg",
  "./assets/exercises/seated-leg-curl.svg",
  "./assets/exercises/triceps-machine.svg",
  "./assets/exercises/water-arms.svg",
  "./assets/exercises/water-walk.svg"
];
self.addEventListener('install', event => {
  event.waitUntil(caches.open(CACHE_NAME).then(cache => cache.addAll(APP_SHELL)).then(() => self.skipWaiting()));
});
self.addEventListener('activate', event => {
  event.waitUntil(caches.keys().then(keys => Promise.all(keys.filter(key => key.startsWith('fit-master-') && key !== CACHE_NAME).map(key => caches.delete(key)))).then(() => self.clients.claim()));
});
self.addEventListener('fetch', event => {
  const request = event.request;
  if (request.method !== 'GET') return;
  const url = new URL(request.url);
  if (url.origin !== self.location.origin) return;
  if (request.mode === 'navigate') {
    event.respondWith(fetch(request).then(response => {
      const copy = response.clone(); caches.open(CACHE_NAME).then(cache => cache.put('./index.html', copy)); return response;
    }).catch(() => caches.match('./index.html')));
    return;
  }
  event.respondWith(caches.match(request).then(cached => cached || fetch(request).then(response => {
    if (response && response.ok) { const copy=response.clone(); caches.open(CACHE_NAME).then(cache=>cache.put(request,copy)); }
    return response;
  }).catch(() => caches.match('./index.html'))));
});
