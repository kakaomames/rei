// sw.js - Gemini programming隊 謹製オフラインエンジン
const CACHE_NAME = 'merge-craft-v1';
const ASSETS = [
  './',
  './index.html',
  '/bgm/another-eden/bgm_normal_battle.mp3',
  '/kougeki.ogg',
  'https://kakaomames.github.io/rei/logo.png'
];

// インストール時にアセットをキャッシュ
self.addEventListener('install', (event) => {
  event.waitUntil(
    caches.open(CACHE_NAME).then((cache) => {
      console.log('Caching assets...');
      return cache.addAll(ASSETS);
    })
  );
});

// オフライン時でもキャッシュから応答
self.addEventListener('fetch', (event) => {
  event.respondWith(
    caches.match(event.request).then((response) => {
      return response || fetch(event.request);
    })
  );
});
