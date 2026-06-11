// atworth Service Worker - v363.0
const CACHE = 'lifeos-v363';

// Allow the page to tell a waiting SW to activate immediately
self.addEventListener('message', e => {
  if (e.data === 'SKIP_WAITING') self.skipWaiting();
});
const ASSETS = [
  '/',
  '/index.html',
  '/privacy.html',
  '/terms.html',
  '/css/styles.css',
  '/css/calc.css',
  '/css/premium.css',
  '/css/mobile.css',
  '/js/storage.js',
  '/js/core.js',
  '/js/dashboard.js',
  '/js/finance.js',
  '/js/bank-tracker.js',
  '/js/life.js',
  '/js/growth.js',
  '/js/ai.js',
  '/js/calculator.js',
  '/js/features.js',
  '/js/premium.js',
  '/js/categories.js',
  '/js/compare.js',
  '/js/pages.js',
  '/js/help.js',
  '/js/voice.js',
  '/js/applock.js',
  '/js/onboarding.js',
  '/js/layout.js',
  '/js/notes.js',
  '/js/widgets.js',
  '/js/yearly.js',
  '/js/init.js',
  '/manifest.json',
  '/icons/emblem.png',
  '/icons/icon-192.png',
  '/icons/icon-512.png',
  'https://fonts.googleapis.com/css2?family=Inter:wght@300;400;500;600;700;800;900&display=swap',
  'https://cdn.jsdelivr.net/npm/chart.js@4.4.0/dist/chart.umd.min.js',
  'https://cdn.jsdelivr.net/npm/chartjs-chart-sankey@0.12.1/dist/chartjs-chart-sankey.min.js'
];

// Install — cache all core assets
self.addEventListener('install', e => {
  e.waitUntil(
    caches.open(CACHE).then(cache =>
      // Cache each asset individually so one failure (404 / CDN hiccup) can't
      // reject the whole batch the way cache.addAll() does (it's atomic).
      Promise.allSettled(
        ASSETS.map(u => cache.add(new Request(u, { cache: 'reload' })))
      )
    ).then(() => self.skipWaiting())
     .catch(() => self.skipWaiting())
  );
});

// Activate — clear old caches
self.addEventListener('activate', e => {
  e.waitUntil(
    caches.keys().then(keys =>
      Promise.all(keys.filter(k => k !== CACHE).map(k => caches.delete(k)))
    ).then(() => self.clients.claim())
  );
});

// Fetch — network first, fall back to cache
self.addEventListener('fetch', e => {
  if (e.request.method !== 'GET') return;
  e.respondWith(
    fetch(e.request)
      .then(res => {
        if (res && res.status === 200) {
          const clone = res.clone();
          caches.open(CACHE).then(cache => cache.put(e.request, clone));
        }
        return res;
      })
      .catch(() => caches.match(e.request))
  );
});
