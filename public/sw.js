// Service worker: what makes the game installable as an app and lets it open
// with no signal.
//
// Network first, so a new version always wins when there is a connection;
// whatever was fetched last is kept as the fallback. The game's own calls to
// the server (/api/) are never touched.

const CACHE = 'greyhaven-v3';

self.addEventListener('install', () => self.skipWaiting());

self.addEventListener('activate', (event) => {
  event.waitUntil(
    (async () => {
      for (const key of await caches.keys()) if (key !== CACHE) await caches.delete(key);
      await self.clients.claim();
    })(),
  );
});

self.addEventListener('fetch', (event) => {
  const req = event.request;
  if (req.method !== 'GET') return;
  const url = new URL(req.url);
  if (url.pathname.includes('/api/')) return;
  const fonts = /(^|\.)fonts\.(googleapis|gstatic)\.com$/.test(url.hostname);
  if (url.origin !== self.location.origin && !fonts) return;
  event.respondWith(
    (async () => {
      const cache = await caches.open(CACHE);
      // Models and textures are large and do not change between versions of this cache: once is enough.
      if (url.pathname.includes('/assets/')) {
        const kept = await cache.match(req);
        if (kept) return kept;
      }
      try {
        const res = await fetch(req);
        if (res.ok || res.type === 'opaque') cache.put(req, res.clone()).catch(() => {});
        return res;
      } catch (err) {
        const hit = await cache.match(req, { ignoreSearch: req.mode === 'navigate' });
        if (hit) return hit;
        throw err;
      }
    })(),
  );
});
