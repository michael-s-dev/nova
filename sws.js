const CACHE_NAME = 'pwa-dynamic-cache-v2';

self.addEventListener('install', (event) => {
  self.skipWaiting();
});

self.addEventListener('activate', (event) => {
  event.waitUntil(
    caches.keys().then((cacheNames) => {
      return Promise.all(
        cacheNames.map((cache) => {
          if (cache !== CACHE_NAME) {
            return caches.delete(cache);
          }
        })
      );
    })
  );
  return self.clients.claim();
});

// Hlavný filter pre zachytávanie požiadaviek
self.addEventListener('fetch', (event) => {
  // 1. Ignorujeme všetko, čo nie je GET
  if (event.request.method !== 'GET') return;

  // 2. OPRAVA: Ignorujeme chrome-extension, edge-extension, atď.
  const url = new URL(event.request.url);
  if (!url.protocol.startsWith('http')) return;

  event.respondWith(
    caches.match(event.request).then((cachedResponse) => {
      // Ak súbor už máme v cache, okamžite ho vrátime (ideálne pre offline)
      if (cachedResponse) {
        return cachedResponse;
      }

      // Ak v cache nie je, stiahneme ho zo siete
      return fetch(event.request)
        .then((networkResponse) => {
          // Ukladáme iba validné odpovede (status 200)
          if (networkResponse && networkResponse.status === 200) {
            const responseToCache = networkResponse.clone();
            caches.open(CACHE_NAME).then((cache) => {
              // Bezpečne uložíme iba legitímne HTTP/HTTPS požiadavky
              cache.put(event.request, responseToCache).catch((err) => {
                console.warn('Nepodarilo sa uložiť do cache:', err);
              });
            });
          }
          return networkResponse;
        })
        .catch((error) => {
          // OPRAVA 'Failed to convert value to 'Response'':
          // Ak sieť zlyhá a nemáme ani cache, musíme vrátiť niečo platné.
          // Pokúsime sa nájsť hlavnú index stránku v cache.
          return caches.match('/nova/index.html').then((fallback) => {
            if (fallback) return fallback;
            
            // Úplná záchrana: ak nemáme vôbec nič, vygenerujeme čistú offline textovú odpoveď, aby prehliadač nespadol na TypeError
            return new Response('Aplikácia je offline a dáta nie sú načítané.', {
              status: 503,
              headers: { 'Content-Type': 'text/plain; charset=utf-8' }
            });
          });
        });
    })
  );
});
