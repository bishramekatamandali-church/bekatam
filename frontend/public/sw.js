const CACHE_VERSION = 'v3';
const STATIC_CACHE = `bem-static-${CACHE_VERSION}`;

const STATIC_ASSETS = [
  '/',
  '/index.html',
  '/manifest.json',
  '/icons/brand.svg',
  '/android-chrome-192x192.png',
  '/android-chrome-512x512.png',
  '/apple-touch-icon.png',
  '/favicon.ico',
  '/maskable/maskable-icon-192x192.png',
  '/maskable/maskable-icon-512x512.png',
];

self.addEventListener('install', (event) => {
  event.waitUntil(
    caches.open(STATIC_CACHE).then((cache) => cache.addAll(STATIC_ASSETS)),
  );
  self.skipWaiting();
});

self.addEventListener('activate', (event) => {
  event.waitUntil(
    caches.keys().then((keys) =>
      Promise.all(
        keys
          .filter((key) => key !== STATIC_CACHE)
          .map((key) => caches.delete(key)),
      ),
    ),
  );
  self.clients.claim();
});

self.addEventListener('message', (event) => {
  if (event.data?.type === 'SKIP_WAITING') {
    self.skipWaiting();
  }
});

self.addEventListener('notificationclick', (event) => {
  const link = event.notification?.data?.link || '/';
  event.notification.close();
  event.waitUntil(
    self.clients.matchAll({ type: 'window', includeUncontrolled: true }).then((clients) => {
      for (const client of clients) {
        if ('focus' in client) {
          client.navigate(link);
          return client.focus();
        }
      }
      if (self.clients.openWindow) {
        return self.clients.openWindow(link);
      }
      return undefined;
    }),
  );
});

self.addEventListener('fetch', (event) => {
  const { request } = event;

  if (request.method !== 'GET') {
    return;
  }

  const url = new URL(request.url);
  const isSameOrigin = url.origin === self.location.origin;
  const acceptHeader = request.headers.get('accept') || '';
  const isEventStream = acceptHeader.includes('text/event-stream') || url.pathname === '/api/content-updates';

  if (request.mode === 'navigate') {
    event.respondWith(
      fetch(request)
        .then((response) => {
          const responseClone = response.clone();
          caches.open(STATIC_CACHE).then((cache) => cache.put('/index.html', responseClone));
          return response;
        })
        .catch(() => caches.match('/index.html')),
    );
    return;
  }

  if (isSameOrigin && url.pathname.startsWith('/api/')) {
    if (isEventStream) {
      return;
    }
    event.respondWith(fetch(request));
    return;
  }

  if (isSameOrigin) {
    event.respondWith(
      caches.match(request).then((cached) => {
        if (cached) return cached;
        return fetch(request)
          .then((response) => {
            const responseClone = response.clone();
            caches.open(STATIC_CACHE).then((cache) => cache.put(request, responseClone));
            return response;
          });
      }),
    );
  }
});
