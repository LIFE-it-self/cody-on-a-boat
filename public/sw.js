// Galaxy Boat Service Worker — cache-first strategy for offline play.
// Bump CACHE_VERSION to force a full re-cache on next deploy.
const CACHE_VERSION = 'galaxy-boat-v2';

self.addEventListener('install', (event) => {
  // Activate immediately without waiting for old SW to finish
  self.skipWaiting();
});

self.addEventListener('activate', (event) => {
  // Delete old caches when a new version activates
  event.waitUntil(
    caches.keys().then((keys) =>
      Promise.all(
        keys
          .filter((key) => key !== CACHE_VERSION)
          .map((key) => caches.delete(key))
      )
    ).then(() => self.clients.claim())
  );
});

self.addEventListener('fetch', (event) => {
  const url = new URL(event.request.url);

  // Only cache same-origin requests (skip analytics, CDNs, etc.)
  if (url.origin !== self.location.origin) return;

  event.respondWith(
    caches.match(event.request).then((cached) => {
      if (cached) return cached;

      return fetch(event.request).then((response) => {
        // Don't cache non-ok responses or non-GET requests
        if (!response.ok || event.request.method !== 'GET') return response;

        const clone = response.clone();
        caches.open(CACHE_VERSION).then((cache) => {
          cache.put(event.request, clone);
        });
        return response;
      });
    })
  );
});
