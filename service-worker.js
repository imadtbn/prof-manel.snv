const CACHE_VERSION = 'snv-pwa-v2-20261005';
const APP_BASE = '/prof-manel.snv/';
const CORE = [
  APP_BASE,
  APP_BASE + 'index.html',
  APP_BASE + 'offline.html',
  APP_BASE + 'assets/css/style.css',
  APP_BASE + 'assets/css/catalog.css',
  APP_BASE + 'assets/js/script.js',
  APP_BASE + 'assets/js/catalog.js',
  APP_BASE + 'assets/js/pwa.js',
  APP_BASE + 'assets/js/user-features.js',
  APP_BASE + 'assets/data/resources.json',
  APP_BASE + 'assets/img/favicon.svg',
  APP_BASE + 'assets/img/icon-maskable.svg',
  APP_BASE + 'resources/',
  APP_BASE + 'years/first-year.html',
  APP_BASE + 'years/second-year.html',
  APP_BASE + 'years/third-year.html',
  APP_BASE + 'favorites.html'
];

self.addEventListener('install', event => {
  event.waitUntil(caches.open(CACHE_VERSION).then(cache => cache.addAll(CORE)).then(() => self.skipWaiting()));
});

self.addEventListener('activate', event => {
  event.waitUntil(
    caches.keys().then(keys => Promise.all(keys.filter(k => k.startsWith('snv-pwa-') && k !== CACHE_VERSION).map(k => caches.delete(k))))
      .then(() => self.clients.claim())
  );
});

self.addEventListener('message', event => {
  if (event.data === 'SKIP_WAITING') self.skipWaiting();
});

self.addEventListener('fetch', event => {
  const request = event.request;
  if (request.method !== 'GET') return;

  const url = new URL(request.url);
  if (url.origin !== self.location.origin) return;

  if (request.mode === 'navigate') {
    event.respondWith(
      fetch(request).then(response => {
        const copy = response.clone();
        caches.open(CACHE_VERSION).then(cache => cache.put(request, copy));
        return response;
      }).catch(async () => (await caches.match(request)) || (await caches.match(APP_BASE + 'offline.html')))
    );
    return;
  }

  if (url.pathname.endsWith('/assets/data/resources.json')) {
    event.respondWith(
      fetch(request).then(response => {
        const copy = response.clone();
        caches.open(CACHE_VERSION).then(cache => cache.put(request, copy));
        return response;
      }).catch(() => caches.match(request))
    );
    return;
  }

  event.respondWith(
    caches.match(request).then(cached => cached || fetch(request).then(response => {
      if (response.ok) caches.open(CACHE_VERSION).then(cache => cache.put(request, response.clone()));
      return response;
    }))
  );
});