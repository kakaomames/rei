const CACHE_NAME = 'gemini-prog-v1';
// キャッシュするリスト
const urlsToCache = [
  './',
  './sw.js',
  './mob/villager.obj',
  './index.html',
  './mob/enemy.json',
  './mob/friendly.json',
  './mob/audio/mobs_audio.json',
  './mob/event/events.json',
  'https://unpkg.com/three@0.150.1/build/three.module.js'
];

// インストール時にファイルをキャッシュ
self.addEventListener('install', (event) => {
  console.log("SW: Installing and caching assets...");
  event.waitUntil(
    caches.open(CACHE_NAME).then((cache) => {
      return cache.addAll(urlsToCache);
    })
  );
});

// フェッチ時にキャッシュがあればそれを返す（爆速化）
self.addEventListener('fetch', (event) => {
  event.respondWith(
    caches.match(event.request).then((response) => {
      return response || fetch(event.request);
    })
  );
});
