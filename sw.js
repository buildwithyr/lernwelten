/**
 * Lernwelten Service Worker
 *
 * Grundsätze:
 *  • localStorage wird nie berührt.
 *  • Eine neue Version aktiviert sich NICHT von selbst. Sie wartet, bis
 *    js/pwa.js eine SKIP_WAITING-Nachricht schickt — das passiert erst,
 *    wenn keine Übung läuft und jemand ausdrücklich darauf tippt.
 *  • Alle Dateien der App stehen in STATIC_ASSETS. Fehlt eine Datei hier,
 *    funktioniert die App offline nicht vollständig — deshalb prüft
 *    tests/offline.test.js diese Liste gegen index.html.
 */

const CACHE_VERSION = 'lernwelten-v4';

const STATIC_ASSETS = [
  './',
  './index.html',
  './manifest.json',
  './favicon.ico',

  // CSS
  './css/fonts.css',
  './css/main.css',
  './css/village.css',
  './css/workshop.css',
  './css/modules.css',
  './css/parents.css',
  './css/oskar.css',
  './css/print.css',

  // Schriften (lokal, keine externen Anfragen)
  './assets/fonts/atkinson-hyperlegible-400-latin.woff2',
  './assets/fonts/atkinson-hyperlegible-400-latin-ext.woff2',
  './assets/fonts/atkinson-hyperlegible-700-latin.woff2',
  './assets/fonts/atkinson-hyperlegible-700-latin-ext.woff2',
  './assets/fonts/baloo-2-var-latin.woff2',
  './assets/fonts/baloo-2-var-latin-ext.woff2',

  // Kern
  './js/core/util.js',
  './js/core/topics.js',
  './js/core/answer.js',
  './js/core/storage.js',
  './js/core/progress.js',
  './js/core/rewards.js',
  './js/core/timers.js',
  './js/core/session.js',

  // Darstellungen
  './js/ui/clock.js',
  './js/ui/widgets.js',
  './js/ui/dom.js',
  './js/ui/taskview.js',
  './js/ui/profile.js',
  './js/ui/workshop.js',

  // Inhalte
  './js/content/words-data.js',
  './js/content/german-data.js',
  './js/content/science-data.js',
  './js/content/logic-data.js',

  // Generatoren
  './js/generators/math-gen.js',
  './js/generators/german-gen.js',
  './js/generators/misc-gen.js',
  './js/generators/index.js',

  // Funktionen
  './js/features/toolbox.js',
  './js/features/album.js',
  './js/features/shop.js',
  './js/features/mirror.js',
  './js/features/worksheet.js',
  './js/features/daily.js',
  './js/features/parents.js',

  // Rest
  './js/oskar.js',
  './js/app.js',
  './js/pwa.js',

  // Bilder
  './assets/oskar-cartoon.png',
  './assets/oskar-default.png',
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

// ─── Nachricht: Update anwenden ─────────────────────────────────────────────
// Wird ausschließlich von js/pwa.js gesendet, wenn keine Übung läuft.

self.addEventListener('message', (event) => {
  if (event.data && event.data.type === 'SKIP_WAITING') self.skipWaiting();
});

// ─── Install ────────────────────────────────────────────────────────────────
// Kein self.skipWaiting() hier: Die neue Version wartet ab.

self.addEventListener('install', (event) => {
  event.waitUntil(
    caches.open(CACHE_VERSION).then((cache) =>
      // addAll bricht komplett ab, wenn eine Datei fehlt. Damit ein einzelnes
      // fehlendes Bild nicht die gesamte Offline-Fähigkeit verhindert, wird
      // jede Datei einzeln geholt und ein Fehlschlag protokolliert.
      Promise.all(STATIC_ASSETS.map((url) =>
        cache.add(url).catch((err) => {
          console.warn('[SW] Nicht zwischengespeichert:', url, err);
        })
      ))
    )
  );
});

// ─── Activate ───────────────────────────────────────────────────────────────

self.addEventListener('activate', (event) => {
  event.waitUntil(
    caches.keys()
      .then((keys) => Promise.all(
        keys.filter((key) => key !== CACHE_VERSION).map((key) => caches.delete(key))
      ))
      .then(() => self.clients.claim())
  );
});

// ─── Fetch ──────────────────────────────────────────────────────────────────
// Eigene Dateien: aus dem Cache, im Hintergrund auffrischen.
// Fremde Adressen: gar nicht anfassen — die App braucht keine.

self.addEventListener('fetch', (event) => {
  const request = event.request;
  if (request.method !== 'GET') return;

  const url = new URL(request.url);
  if (url.origin !== self.location.origin) return;

  event.respondWith(
    caches.match(request).then((cached) => {
      const network = fetch(request).then((response) => {
        if (response && response.status === 200 && response.type === 'basic') {
          const copy = response.clone();
          caches.open(CACHE_VERSION).then((cache) => cache.put(request, copy));
        }
        return response;
      }).catch(() => {
        if (request.mode === 'navigate') return caches.match('./index.html');
        return cached;
      });

      // Cache zuerst ausliefern, Netzwerk läuft im Hintergrund weiter.
      return cached || network;
    })
  );
});
