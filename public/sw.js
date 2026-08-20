// Service Worker — 离线缓存 App 外壳
const CACHE_NAME = 'workbench-v4';
const ASSETS = [
  '/',
  '/mobile',
  '/desktop',
  '/manifest.json',
  '/sw.js',
  '/icon-512.jpg',
  '/assets/greet-banner.jpg',
];

self.addEventListener('install', (e) => {
  e.waitUntil(
    caches.open(CACHE_NAME).then(cache => cache.addAll(ASSETS).catch(() => {}))
  );
  self.skipWaiting();
});

self.addEventListener('activate', (e) => {
  e.waitUntil(
    caches.keys().then(keys =>
      Promise.all(keys.filter(k => k !== CACHE_NAME).map(k => caches.delete(k)))
    )
  );
  self.clients.claim();
});

self.addEventListener('fetch', (e) => {
  // API 请求不走缓存
  if (e.request.url.includes('/api/')) return;
  // 其余请求：缓存优先，网络兜底
  e.respondWith(
    caches.match(e.request).then(cached => {
      return cached || fetch(e.request).then(res => {
        // 成功的请求才缓存
        if (res.ok && e.request.method === 'GET') {
          const clone = res.clone();
          caches.open(CACHE_NAME).then(cache => cache.put(e.request, clone));
        }
        return res;
      }).catch(() => cached)
    })
  );
});
