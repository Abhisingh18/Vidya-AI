// VidyaAI service worker — basic offline shell + runtime caching.
const CACHE = 'vidyaai-v2';
const PRECACHE = ['/', '/library', '/offline'];

self.addEventListener('install', (event) => {
  event.waitUntil(
    caches.open(CACHE).then((c) => c.addAll(PRECACHE).catch(() => {})),
  );
  self.skipWaiting();
});

self.addEventListener('activate', (event) => {
  event.waitUntil(
    caches.keys().then((keys) =>
      Promise.all(keys.filter((k) => k !== CACHE).map((k) => caches.delete(k))),
    ),
  );
  self.clients.claim();
});

self.addEventListener('fetch', (event) => {
  const { request } = event;
  // Only handle GET; never cache API calls (always fresh) or Next.js build
  // assets — those are content-hashed, and a stale copy breaks the page.
  if (request.method !== 'GET' || request.url.includes('/api/') || request.url.includes('/_next/')) return;

  event.respondWith(
    fetch(request)
      .then((res) => {
        // Cache successful navigations/assets for offline use.
        const copy = res.clone();
        caches.open(CACHE).then((c) => c.put(request, copy)).catch(() => {});
        return res;
      })
      .catch(() =>
        caches.match(request).then((cached) => cached || caches.match('/offline')),
      ),
  );
});
