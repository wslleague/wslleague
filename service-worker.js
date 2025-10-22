
const STATIC_CACHE = 'wsl-static-v1';
const DATA_CACHE = 'wsl-data-v1';
const DATA_URL = 'https://wslleague.github.io/wsl-league-data/league_report_data.json';

const STATIC_ASSETS = [
  './',
  './index.html',
  './manifest.webmanifest',
  './icon-192.png',
  './icon-512.png'
];

self.addEventListener('install', (event) => {
  event.waitUntil(
    caches.open(STATIC_CACHE).then(cache => cache.addAll(STATIC_ASSETS)).then(() => self.skipWaiting())
  );
});

self.addEventListener('activate', (event) => {
  event.waitUntil(
    caches.keys().then(keys =>
      Promise.all(keys.map(k => (k !== STATIC_CACHE && k !== DATA_CACHE) ? caches.delete(k) : null))
    ).then(() => self.clients.claim())
  );
});

// Network-first for JSON; cache-first for static
self.addEventListener('fetch', (event) => {
  const url = new URL(event.request.url);
  if (url.href === DATA_URL) {
    event.respondWith((async () => {
      try {
        const fresh = await fetch(event.request, { cache: 'no-store' });
        const cache = await caches.open(DATA_CACHE);
        cache.put(event.request, fresh.clone());
        return fresh;
      } catch (e) {
        const cache = await caches.open(DATA_CACHE);
        const cached = await cache.match(event.request);
        if (cached) return cached;
        throw e;
      }
    })());
    return;
  }
  event.respondWith(caches.match(event.request).then(cached => cached || fetch(event.request)));
});
