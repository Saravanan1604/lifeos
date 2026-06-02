// LifeOS Service Worker - v53.0
const CACHE = 'lifeos-v72';

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
  '/js/init.js',
  '/js/core.js',
  '/js/storage.js',
  '/js/dashboard.js',
  '/js/finance.js',
  '/js/health.js',
  '/js/habits.js',
  '/js/goals.js',
  '/js/growth.js',
  '/js/calculator.js',
  '/js/analytics.js',
  '/js/settings.js',
  '/js/ai.js',
  '/js/premium.js',
  '/js/voice.js',
  '/js/compare.js',
  '/manifest.json',
  '/icons/icon-192.png',
  '/icons/icon-512.png',
  'https://fonts.googleapis.com/css2?family=Inter:wght@300;400;500;600;700;800;900&display=swap',
  'https://cdn.jsdelivr.net/npm/chart.js@4.4.0/dist/chart.umd.min.js'
];

// Install — cache all core assets
self.addEventListener('install', e => {
  e.waitUntil(
    caches.open(CACHE).then(cache => cache.addAll(ASSETS.map(u => new Request(u, { cache: 'reload' }))))
      .then(() => self.skipWaiting())
      .catch(() => self.skipWaiting()) // don't fail install on CDN errors
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
