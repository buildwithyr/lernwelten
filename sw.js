/**
 * Lernwelten Service Worker
 * Offline-first caching — niemals localStorage berühren.
 */

const CACHE_VERSION = 'lernwelten-v2';

const STATIC_ASSETS = [
  './',
  './index.html',
  './manifest.json',
  './favicon.ico',
  // CSS
  './css/main.css',
  './css/village.css',
  './css/workshop.css',
  './css/oskar.css',
  './css/modules.css',
  // JavaScript
  './js/storage.js',
  './js/adaptive.js',
  './js/oskar.js',
  './js/profile.js',
  './js/clock.js',
  './js/app.js',
  './js/modules/math.js',
  './js/modules/words.js',
  './js/modules/puzzles.js',
  './js/modules/science.js',
  // Assets
  './assets/oskar-cartoon.png',
  './assets/oskar-default.png',
  // Icons
  './assets/icons/icon-72x72.png',
  './assets/icons/icon-96x96.png',
  './assets/icons/icon-128x128.png',
  './assets/icons/icon-144x144.png',
  './assets/icons/icon-152x152.png',
  './assets/icons/icon-192x192.png',
  './assets/icons/icon-384x384.png',
  './assets/icons/icon-512x512.png',
  './assets/icons/apple-touch-icon.png',
];

// Google Fonts — separate cache, longer lifetime
const FONT_CACHE = 'lernwelten-fonts-v1';

// ─── Message: allow clients to trigger skipWaiting ──────────────────────────

self.addEventListener('message', (event) => {
  if (event.data && event.data.type === 'SKIP_WAITING') {
    self.skipWaiting();
  }
});

// ─── Install: cache all static assets ───────────────────────────────────────

self.addEventListener('install', (event) => {
  event.waitUntil(
    caches.open(CACHE_VERSION).then((cache) => {
      return cache.addAll(STATIC_ASSETS);
    }).then(() => self.skipWaiting())
  );
});

// ─── Activate: remove old caches (never touches localStorage) ───────────────

self.addEventListener('activate', (event) => {
  event.waitUntil(
    caches.keys().then((keys) => {
      return Promise.all(
        keys
          .filter((key) => key !== CACHE_VERSION && key !== FONT_CACHE)
          .map((key) => caches.delete(key))
      );
    }).then(() => self.clients.claim())
  );
});

// ─── Fetch: cache-first for static, network-first for fonts ─────────────────

self.addEventListener('fetch', (event) => {
  const url = new URL(event.request.url);

  // Google Fonts: network-first, fallback to cache
  if (url.hostname === 'fonts.googleapis.com' || url.hostname === 'fonts.gstatic.com') {
    event.respondWith(
      caches.open(FONT_CACHE).then((cache) => {
        return fetch(event.request)
          .then((response) => {
            cache.put(event.request, response.clone());
            return response;
          })
          .catch(() => cache.match(event.request));
      })
    );
    return;
  }

  // Everything else: cache-first, then network
  event.respondWith(
    caches.match(event.request).then((cached) => {
      if (cached) return cached;

      return fetch(event.request).then((response) => {
        // Only cache successful same-origin responses
        if (response && response.status === 200 && response.type === 'basic') {
          const toCache = response.clone();
          caches.open(CACHE_VERSION).then((cache) => cache.put(event.request, toCache));
        }
        return response;
      }).catch(() => {
        // Offline fallback: return index.html for navigation requests
        if (event.request.mode === 'navigate') {
          return caches.match('./index.html');
        }
      });
    })
  );
});
