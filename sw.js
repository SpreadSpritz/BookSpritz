// BookSpritz Service Worker — offline-first for the app shell
// Strategy: cache-first for the app shell (HTML, CSS, JS, icons, fonts),
// network-first for Firebase (so auth/sync always uses fresh data when online).

const CACHE_VERSION = 'bookspritz-v10';
const APP_SHELL = [
  './',
  './index.html',
  './styles.css',
  './manifest.json',
  './icon-32.png',
  './icon-192.png',
  './icon-512.png',
  './maskable-192.png',
  './maskable-512.png',
  './core.js',
  './books.js',
  './editor.js',
  './lore.js',
  './history.js',
  './stats.js',
  './export-import.js',
  './settings.js',
  './mobile.js',
  './app.js',
  './focus.js',
  './search.js',
  './namegen.js',
  './analyzer.js',
  './tutorial.js',
  './saveindicator.js',
  // Google Fonts — cached for offline writing
  'https://fonts.googleapis.com/css2?family=Merriweather:ital,wght@0,400;0,700;1,400&family=Nunito:wght@400;600;700&display=swap',
  // Firebase SDK — cached so the app loads even offline
  'https://www.gstatic.com/firebasejs/10.7.1/firebase-app-compat.js',
  'https://www.gstatic.com/firebasejs/10.7.1/firebase-auth-compat.js',
  'https://www.gstatic.com/firebasejs/10.7.1/firebase-database-compat.js'
];

self.addEventListener('install', e => {
  e.waitUntil(
    caches.open(CACHE_VERSION).then(cache => {
      // Use addAll but tolerate individual failures (fonts CDN may have CORS quirks)
      return Promise.allSettled(APP_SHELL.map(url => cache.add(url)));
    }).then(() => self.skipWaiting())
  );
});

self.addEventListener('activate', e => {
  e.waitUntil(
    caches.keys().then(keys => Promise.all(
      keys.filter(k => k !== CACHE_VERSION).map(k => caches.delete(k))
    )).then(() => self.clients.claim())
  );
});

self.addEventListener('fetch', e => {
  const url = new URL(e.request.url);

  // Never intercept non-GET requests (Firebase writes, auth POSTs, etc.)
  if (e.request.method !== 'GET') return;

  // Firebase API calls — always go to network when online, fall back to nothing (offline mode)
  if (url.hostname.includes('firebasedatabase.app') || url.hostname.includes('googleapis.com') && url.pathname.includes('identitytoolkit')) {
    e.respondWith(
      fetch(e.request).catch(() => new Response('{}', { status: 200, headers: { 'Content-Type': 'application/json' } }))
    );
    return;
  }

  // App shell — cache-first, with network fallback updating the cache
  e.respondWith(
    caches.match(e.request).then(cached => {
      const fetchPromise = fetch(e.request).then(response => {
        // Only cache successful same-origin responses and CDN assets
        if (response && response.status === 200 && (url.origin === location.origin || url.hostname.includes('gstatic') || url.hostname.includes('googleapis'))) {
          const clone = response.clone();
          caches.open(CACHE_VERSION).then(cache => cache.put(e.request, clone)).catch(() => {});
        }
        return response;
      }).catch(() => cached);
      return cached || fetchPromise;
    })
  );
});

// Allow page to trigger immediate update when new SW is available
self.addEventListener('message', e => {
  if (e.data === 'SKIP_WAITING') self.skipWaiting();
});
