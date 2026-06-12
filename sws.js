const CACHE_NAME = 'dynamicka-pwa-cache-v1';

// Pri prvom načítaní uložíme len absolútny základ aplikácie
self.addEventListener('install', (e) => {
  e.waitUntil(
    caches.open(CACHE_NAME).then((cache) => {
      return cache.addAll(['index.html', 'manifest.json']);
    })
  );
});

// Automaticky zachytí a uloží do pamäte každé CSS, JS aj obrázok, ktorý web použije
self.addEventListener('fetch', (e) => {
  e.respondWith(
    caches.match(e.request).then((cachedResponse) => {
      // Ak už súbor máme v pamäti, okamžite ho načítame (rýchly štart / offline)
      if (cachedResponse) {
        return cachedResponse;
      }

      // Ak ho nemáme, stiahneme ho z webu a rovno odložíme do pamäte na neskôr
      return fetch(e.request).then((networkResponse) => {
        if (networkResponse && networkResponse.status === 200 && e.request.url.startsWith(self.location.origin)) {
          const responseToCache = networkResponse.clone();
          caches.open(CACHE_NAME).then((cache) => {
            cache.put(e.request, responseToCache);
          });
        }
        return networkResponse;
      });
    })
  );
});
