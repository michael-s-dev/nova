const CACHE_NAME = 'pwa-force-offline-v1';

// 1. Pri inštalácii hneď prevezmi kontrolu nad aplikáciou
self.addEventListener('install', (event) => {
  self.skipWaiting();
});

// 2. Aktivácia a okamžité previazanie na všetky otvorené okná
self.addEventListener('activate', (event) => {
  event.waitUntil(self.clients.claim());
});

// 3. AGRESÍVNA CACHE-FIRST STRATÉGIA (Bezpečné pre vadné SSL a offline beh)
self.addEventListener('fetch', (event) => {
  if (event.request.method !== 'GET') return;

  event.respondWith(
    caches.match(event.request).then((cachedResponse) => {
      // AK JE SÚBOR V CACHE: Okamžite ho vráť (aj offline). Na sieť sa vôbec nepýtaj.
      if (cachedResponse) {
        return cachedResponse;
      }

      // AK SÚBOR V CACHE NIE JE: Stiahni ho zo siete a ZA POCHODU ho ulož
      return fetch(event.request, { mode: 'no-cors' }) // 'no-cors' pomáha obísť niektoré SSL reštrikcie starého Chromia
        .then((networkResponse) => {
          // Ak dostaneme odpoveď, klonujeme ju a uložíme do cache pre nabudúce
          if (networkResponse) {
            const responseToCache = networkResponse.clone();
            caches.open(CACHE_NAME).then((cache) => {
              cache.put(event.request, responseToCache);
            });
          }
          return networkResponse;
        })
        .catch(() => {
          // Núdzový fallback ak zlyhá sieť aj cache (napr. pre hlavnú stránku)
          return caches.match('/');
        });
    })
  );
});
