const CACHE_NAME = 'kingshall-pwa-v4-gold-crown';
const APP_SHELL = ['/', '/index.html', '/manifest.json', '/icons/ke-icon.svg'];
const CACHEABLE_EXTENSIONS = ['.js', '.css', '.png', '.jpg', '.jpeg', '.svg', '.webp', '.ico', '.woff', '.woff2'];

self.addEventListener('install', (event) => {
  event.waitUntil(
    caches.open(CACHE_NAME).then((cache) => cache.addAll(APP_SHELL)).catch(() => {
      // Ignore precache failures so install can continue.
    }),
  );
  self.skipWaiting();
});

self.addEventListener('activate', (event) => {
  event.waitUntil(
    caches.keys().then((cacheNames) => Promise.all(
      cacheNames.map((cacheName) => {
        if (cacheName !== CACHE_NAME) {
          return caches.delete(cacheName);
        }

        return Promise.resolve();
      }),
    )).then(() => self.clients.claim()),
  );
});

self.addEventListener('fetch', (event) => {
  if (event.request.method !== 'GET') {
    return;
  }

  const requestUrl = new URL(event.request.url);
  const isSameOrigin = requestUrl.origin === self.location.origin;
  const isNavigationRequest = event.request.mode === 'navigate';
  const isCacheableAsset = CACHEABLE_EXTENSIONS.some((extension) => requestUrl.pathname.endsWith(extension));

  if (isNavigationRequest) {
    event.respondWith(
      fetch(event.request).catch(() => caches.match('/index.html').then((response) => response || caches.match('/'))),
    );
    return;
  }

  if (!isSameOrigin || !isCacheableAsset) {
    return;
  }

  event.respondWith(
    caches.match(event.request).then((cachedResponse) => {
      if (cachedResponse) {
        return cachedResponse;
      }

      return fetch(event.request).then((networkResponse) => {
        const responseClone = networkResponse.clone();
        caches.open(CACHE_NAME).then((cache) => cache.put(event.request, responseClone)).catch(() => {
          // Ignore cache write failures.
        });
        return networkResponse;
      });
    }),
  );
});

self.addEventListener('message', (event) => {
  if (event.data && event.data.type === 'SKIP_WAITING') {
    self.skipWaiting();
  }
});
