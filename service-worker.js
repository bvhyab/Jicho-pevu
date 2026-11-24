/* ============================================================
   Jicho — Service Worker
   Provides offline support and faster loads on repeat visits.
   ============================================================ */

const CACHE_NAME = 'jicho-v1';
const STATIC_CACHE_PATHS = [
  '/',
  '/index.html',
  '/admin.html',
  '/article.html',
  '/category.html',
  '/css/style.css',
  '/js/data.js',
  '/js/main.js',
  '/js/admin.js',
  '/manifest.json',
  '/icons/icon-192.png',
  '/icons/icon-512.png',
];

self.addEventListener('install', (event) => {
  event.waitUntil(
    caches.open(CACHE_NAME).then((cache) => {
      console.log('[ServiceWorker] Caching static assets');
      return cache.addAll(STATIC_CACHE_PATHS);
    })
  );
  self.skipWaiting();
});

self.addEventListener('activate', (event) => {
  event.waitUntil(
    caches.keys().then((cacheNames) => {
      return Promise.all(
        cacheNames
          .filter((name) => name !== CACHE_NAME)
          .map((name) => caches.delete(name))
      );
    })
  );
  self.clients.claim();
});

self.addEventListener('fetch', (event) => {
  // Skip cross-origin requests (e.g., Google Fonts, Unsplash)
  if (event.request.url.startsWith('https://') && !event.request.url.startsWith(self.location.origin)) {
    return;
  }

  event.respondWith(
    caches.match(event.request).then((response) => {
      // Return cache if found, otherwise fetch from network
      return response || fetch(event.request).catch(() => {
        // If network fails and no cache, return a fallback
        if (event.request.headers.get('accept').includes('text/html')) {
          return caches.match('/index.html');
        }
        return null;
      });
    })
  );
});
