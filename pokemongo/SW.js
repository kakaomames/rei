// SW.js

const CACHE_NAME = 'gemini-pokemon-web-v1.1'; // キャッシュバージョンを更新
const urlsToCache = [
  // 必須コアファイル
  '/',
  '/index.html',
  
  // SPAビューのHTMLファイル (index.htmlに埋め込んでいるが、将来の分割に備えてリスト化)
  '/menu.html',
  '/pokemon.html',
  '/hokaku.html', // 捕獲ビュー
  '/gym.html',
  '/pokestop.html',
  '/item.html',    // アイテムビュー
  '/hokoku.html',
  
  // アセットとライブラリ
  '/rei/leaflet/leaflet.css',
  '/rei/leaflet/leaflet.js',
  'https://cdnjs.cloudflare.com/ajax/libs/three.js/r128/three.min.js',
  
  // ポケモンアイコンのテクスチャ (例)
  '/rei/assets/button_icon_M25.png', 
  // プレイヤーマーカーなどのCSSで参照されるアセットがあれば追加
];

// ----------------------------------------------------
// 1. インストールイベント: キャッシュの作成
// ----------------------------------------------------
self.addEventListener('install', event => {
  console.log('Service Worker: インストール中...');
  event.waitUntil(
    caches.open(CACHE_NAME)
      .then(cache => {
        console.log('Service Worker: コアファイルをキャッシュに追加しました。');
        return cache.addAll(urlsToCache).catch(err => {
            console.error('Service Worker: キャッシュ追加中にエラーが発生しました:', err);
        });
      })
  );
});

// ----------------------------------------------------
// 2. アクティベートイベント: 古いキャッシュの削除
// ----------------------------------------------------
self.addEventListener('activate', event => {
  console.log('Service Worker: アクティベート中...');
  event.waitUntil(
    caches.keys().then(cacheNames => {
      return Promise.all(
        cacheNames.map(cacheName => {
          if (cacheName !== CACHE_NAME) {
            console.log('Service Worker: 古いキャッシュを削除:', cacheName);
            return caches.delete(cacheName);
          }
        })
      );
    })
  );
});

// ----------------------------------------------------
// 3. フェッチイベント: キャッシュファースト戦略
// ----------------------------------------------------
self.addEventListener('fetch', event => {
  // ポケストップAPIなど、外部のデータAPIはキャッシュしない
  if (event.request.url.includes('api/listget')) {
    return;
  }
  
  event.respondWith(
    caches.match(event.request)
      .then(response => {
        // キャッシュがあればそれを返す
        if (response) {
          return response;
        }
        // キャッシュがなければネットワークにリクエスト
        return fetch(event.request);
      }
    )
  );
});
