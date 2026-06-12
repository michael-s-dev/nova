const CACHE_NAME = 'pwa-dynamic-cache-v1';

// 1. Inštalácia - len aktivuje Service Worker, nič vopred nesťahuje
self.addEventListener('install', (event) => {
  self.skipWaiting();
});

// 2. Aktivácia - vyčistí starú vyrovnávaciu pamäť pri aktualizácii
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

// 3. Stratégia: Network First, s automatickým ukladaním do Cache pre offline beh
self.addEventListener('fetch', (event) => {
  // Ignorujeme požiadavky iné ako GET (napr. POST dáta sa nedajú cachovať)
  if (event.request.method !== 'GET') return;

  event.respondWith(
    fetch(event.request)
      .then((networkResponse) => {
        // Ak sieť funguje, skontrolujeme, či je odpoveď v poriadku
        if (!networkResponse || networkResponse.status !== 200 || networkResponse.type !== 'basic') {
          return networkResponse;
        }

        // Klonujeme odpoveď, pretože jeden prúd spotrebuje prehliadač a druhý cache
        const responseToCache = networkResponse.clone();

        caches.open(CACHE_NAME).then((cache) => {
          // AUTOMATICKY uložíme súbor do cache pre budúce offline použitie
          cache.put(event.request, responseToCache);
        });

        return networkResponse;
      })
      .catch(() => {
        // AK SIEŤ ZLYHÁ (sme offline), prehliadač automaticky siahne do cache
        return caches.match(event.request);
      })
  );
});
