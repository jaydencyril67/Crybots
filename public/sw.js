const CACHE_NAME = 'crybots-pwa-v18-web-push';
const APP_SHELL = ['/', '/index.html', '/manifest.json', '/pwa-launch-icon.svg?v=4', '/icons/crybots-app-icon.svg?v=7'];
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

self.addEventListener('push', (event) => {
  let payload = {};
  try {
    payload = event.data ? event.data.json() : {};
  } catch {
    payload = { title: 'CryBots alert', body: event.data ? event.data.text() : 'You have a new notification.' };
  }
  const title = typeof payload.title === 'string' && payload.title ? payload.title : 'CryBots alert';
  const body = typeof payload.body === 'string' ? payload.body : (typeof payload.message === 'string' ? payload.message : 'You have a new notification.');
  const requestedUrl = typeof payload.url === 'string' ? payload.url : '/notifications';
  const url = requestedUrl.startsWith('/') && !requestedUrl.startsWith('//') ? requestedUrl : '/notifications';
  event.waitUntil(self.registration.showNotification(title, {
    body,
    tag: typeof payload.tag === 'string' ? payload.tag : (typeof payload.notificationId === 'string' ? 'crybots-' + payload.notificationId : 'crybots-alert'),
    icon: '/icons/crybots-app-icon.svg?v=7',
    badge: '/icons/crybots-app-icon.svg?v=7',
    data: { url },
  }));
});

self.addEventListener('notificationclick', (event) => {
  event.notification.close();
  const requestedUrl = event.notification?.data?.url;
  const url = typeof requestedUrl === 'string' && requestedUrl.startsWith('/') && !requestedUrl.startsWith('//') ? requestedUrl : '/notifications';
  event.waitUntil((async () => {
    const windows = await self.clients.matchAll({ type: 'window', includeUncontrolled: true });
    for (const client of windows) {
      if ('focus' in client) {
        await client.focus();
        if ('navigate' in client) await client.navigate(url);
        return;
      }
    }
    if (self.clients.openWindow) await self.clients.openWindow(url);
  })());
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
