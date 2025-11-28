// service-worker.js

const CACHE_NAME = 'pokemon-go-web-v2-final';

// アプリケーションシェル（オフライン時に必要な静的ファイル）
// app.jsとservice-worker.jsがindex.htmlと同じ階層にあると仮定
const urlsToCache = [
    // ルートファイル
    '/',
    '/index.html',
    // スクリプトとスタイル
    './app.js',
    './service-worker.js',
    './map-appv2.css', 
    
    // データファイル (app.jsから参照パスが変更されたため、index.html基準で指定)
    '/rei/pokemon.json', 
    '/rei/item.json',
    
    // Leafletローカルファイル
    '/rei/leaflet/leaflet.css',
    '/rei/leaflet/leaflet.js',
    
    // アセットファイル（app.jsで参照パスは../assets/に変更されたが、SWは相対パスでキャッシュ）
    '/rei/assets/item/pokeball.png', // 例としてアイテムアイコンの一部をキャッシュ
    // ... 他の必要なアイコンもすべて追加 ...
];

self.addEventListener('install', (event) => {
    // Service Workerがインストールされたときにキャッシュを行う
    console.log('SW: インストール中');
    event.waitUntil(
        caches.open(CACHE_NAME)
            .then((cache) => {
                console.log('SW: ファイルをプリキャッシュしました');
                // Note: キャッシュリストのパスはService Workerのスコープに対する相対パス
                return cache.addAll(urlsToCache.filter(url => url.indexOf('..') === -1)); // 外部パスは除外するケース
            })
    );
});

self.addEventListener('fetch', (event) => {
    // ネットワークリクエストが発生したときの処理
    
    // APIや外部タイル（OpenStreetMap）はキャッシュしない
    if (event.request.url.includes('openstreetmap.org') || event.request.url.includes('vercel.app')) {
        return;
    }
    
    event.respondWith(
        caches.match(event.request)
            .then((response) => {
                // キャッシュで見つかった場合はそれを返す
                if (response) {
                    // console.log('SW: キャッシュから取得: ' + event.request.url);
                    return response;
                }
                
                // キャッシュに見つからない場合はネットワークから取得し、キャッシュに追加する
                return fetch(event.request).then(
                    (response) => {
                        if (!response || response.status !== 200 || response.type !== 'basic') {
                            return response;
                        }
                        
                        const responseToCache = response.clone();
                        caches.open(CACHE_NAME)
                            .then((cache) => {
                                cache.put(event.request, responseToCache);
                            });
                            
                        return response;
                    }
                );
            })
    );
});

self.addEventListener('activate', (event) => {
    // 以前のキャッシュをクリーンアップ
    console.log('SW: アクティベート中');
    event.waitUntil(
        caches.keys().then((cacheNames) => {
            return Promise.all(
                cacheNames.filter((cacheName) => {
                    return cacheName !== CACHE_NAME;
                }).map((cacheName) => {
                    console.log('SW: 古いキャッシュを削除: ' + cacheName);
                    return caches.delete(cacheName);
                })
            );
        })
    );
});
