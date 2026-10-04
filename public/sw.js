/**
 * Redactify Sovereign Service Worker
 * Enforces cold-start offline execution, pre-caching the application shell and local Tesseract OCR binaries.
 */

const CACHE_NAME = 'redactify-v2-cache-v1';
const PRECACHE_ASSETS = [
  '/',
  '/index.html',
  '/logo.svg',
  '/manifest.webmanifest',
  '/robots.txt',
  '/tessdata/worker.min.js',
  '/tessdata/tesseract-core-lstm.wasm.js',
  '/tessdata/tesseract-core-simd-lstm.wasm.js',
  '/tessdata/eng.traineddata'
];

self.addEventListener('install', (event) => {
  event.waitUntil(
    caches.open(CACHE_NAME).then(async (cache) => {
      // Pre-cache core shell assets
      for (const asset of PRECACHE_ASSETS) {
        try {
          await cache.add(asset);
        } catch (err) {
          // Log but do not block installation for optional assets
          console.warn(`[SW] Precache skipped for ${asset}:`, err.message);
        }
      }
    }).then(() => self.skipWaiting())
  );
});

self.addEventListener('activate', (event) => {
  event.waitUntil(
    caches.keys().then((keys) => {
      return Promise.all(
        keys.filter((key) => key !== CACHE_NAME).map((key) => caches.delete(key))
      );
    }).then(() => self.clients.claim())
  );
});

self.addEventListener('fetch', (event) => {
  const url = new URL(event.request.url);

  // Skip non-GET requests or external API calls
  if (event.request.method !== 'GET' || !url.origin.includes(self.location.origin)) {
    return;
  }

  // 1. Cache-First Strategy for OCR Assets & Fonts
  if (url.pathname.startsWith('/tessdata/') || url.pathname.startsWith('/fonts/')) {
    event.respondWith(
      caches.match(event.request).then((cached) => {
        if (cached) return cached;
        return fetch(event.request).then((response) => {
          if (response && response.status === 200) {
            const clone = response.clone();
            caches.open(CACHE_NAME).then((cache) => cache.put(event.request, clone));
          }
          return response;
        });
      })
    );
    return;
  }

  // 2. Stale-While-Revalidate Strategy for App Shell & Bundles
  event.respondWith(
    caches.match(event.request).then((cached) => {
      const fetchPromise = fetch(event.request).then((networkResponse) => {
        if (networkResponse && networkResponse.status === 200) {
          const clone = networkResponse.clone();
          caches.open(CACHE_NAME).then((cache) => cache.put(event.request, clone));
        }
        return networkResponse;
      }).catch(() => {
        // Return index.html on navigation failures if offline
        if (event.request.mode === 'navigate') {
          return caches.match('/index.html');
        }
        return null;
      });

      return cached || fetchPromise;
    })
  );
});
