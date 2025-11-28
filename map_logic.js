// map_logic.js

import { spawnPokemonByType } from './pokemon.js'; 
import { startCaptureMode } from './pokemongo-UI.js'; 
import { getPokestopPopupContent } from './pokestop.js'; 
// ⭐ NEW: API連携モジュールから関数をインポート ⭐
import { fetchLandmarkDataFromApi } from './api.js'; 

// ===========================================
// グローバル変数と定数
// ===========================================
let map;
let playerMarker;
let pokemonMarkers = []; 
let landmarkMarkers = [];
let pokestopMarkers = {}; 

// ⭐ REMOVED: GYM_DATA / POKESTOP_DATA は api.js から直接ロードして利用するため削除 ⭐

// 初期座標
let initialCoords = [35.5330, 139.4370]; 
const ACCESS_RADIUS_M = 100; // アクセス可能半径 100メートル

// ランドマークの更新頻度 (GPS移動時)
const UPDATE_INTERVAL_MS = 5000; // 5秒
let lastUpdateTime = 0;

const TRANSPARENT_IMAGE = 'data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAQAAAC1HAwCAAAAC0lEQVR42mNkYAAAAAYAAjCB0C8AAAAASUVORK5CYII=';
let initialIconUrl = './assets/男子(中～高).png';

let LANDMARK_ICONS = {
    'gym': './assets/gym.png', 
    'pokestop': './assets/pokestop.png' 
};


// ===========================================
// 距離計算とアクセス可能チェック関数
// ===========================================

/**
 * 2つの座標間の距離をメートル単位で計算する
 */
function getDistance(lat1, lon1, lat2, lon2) {
    const R = 6371e3; // 地球の半径 (メートル)
    const φ1 = lat1 * Math.PI/180;
    const φ2 = lat2 * Math.PI/180;
    const Δφ = (lat2-lat1) * Math.PI/180;
    const Δλ = (lon2-lon1) * Math.PI/180;

    const a = Math.sin(Δφ/2) * Math.sin(Δφ/2) +
              Math.cos(φ1) * Math.cos(φ2) *
              Math.sin(Δλ/2) * Math.sin(Δλ/2);
    const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1-a));

    const distance = R * c; // メートル単位の距離
    return distance;
}

/**
 * ランドマークがプレイヤーのアクセス範囲内にあるかチェックする
 */
export function isWithinAccessRange(landmarkLat, landmarkLng) {
    if (!playerMarker) return false;
    
    const playerPos = playerMarker.getLatLng();
    const distance = getDistance(playerPos.lat, playerPos.lng, landmarkLat, landmarkLng);
    
    return distance <= ACCESS_RADIUS_M;
}


// ===========================================
// Leaflet マップ 初期化関数
// ===========================================
function initMap() {
    if (typeof L === 'undefined') {
        console.error("[FATAL ERROR] L (Leaflet) オブジェクトが見つかりません。");
        return;
    }
    console.log("[DEBUG:INIT] Leafletオブジェクトを確認。マップ初期化開始。");

    // 1. URLクエリパラメータから各種情報を取得するロジック
    try {
        const urlParams = new URLSearchParams(window.location.search);
        // ... (URLパラメータ解析ロジックは省略) ...
    } catch(e) {
        console.error("[INIT ERROR] URLパラメータの解析中にエラー:", e);
    }

    try {
        // 2. マップ初期化
        map = L.map('map').setView(initialCoords, 17);
        console.log("[DEBUG:INIT] Leafletマップを作成しました。");
        
        L.tileLayer('https://tile.openstreetmap.org/{z}/{x}/{y}.png', {
            maxZoom: 19,
            attribution: '© OpenStreetMap contributors' 
        }).addTo(map);
        
        // カスタムペインを作成し、Z-indexを設定
        map.createPane('marker_z5');
        map.getPane('marker_z5').style.zIndex = 600; 
        console.log("[DEBUG:INIT] カスタムペイン 'marker_z5' (Z-index: 600) を作成しました。");

        // プレイヤーマーカーの初期化
        const initialIcon = L.icon({
            iconUrl: initialIconUrl, 
            iconSize: [64, 64],
            iconAnchor: [32, 64],
            className: 'player-marker'
        });
        playerMarker = L.marker(initialCoords, { icon: initialIcon }).addTo(map);
        console.log("[DEBUG:INIT] プレイヤーマーカーを初期位置に追加しました。");

        // 初回ランドマークロード (非同期処理)
        loadLandmarkData(initialCoords[0], initialCoords[1]).then(({ gyms, pokestops }) => {
            loadLandmarks(gyms, pokestops); // 修正: ロードしたデータを渡す
        });
        
        // ポケモン生成タイマー (5分ごと)
        (function initialSpawn() {
            if(playerMarker) {
                const pos = playerMarker.getLatLng();
                spawnRandomPokemon(pos.lat, pos.lng);
            }
        })();

        setInterval(() => {
            if(playerMarker) {
                const pos = playerMarker.getLatLng();
                spawnRandomPokemon(pos.lat, pos.lng);
            }
        }, 5 * 60 * 1000); 

        // GPSトラッキングを開始し、プレイヤーを移動可能にする
        startPlayerLocationTracking();

    } catch (e) {
        console.error("[FATAL ERROR] マップの初期化中に致命的なエラーが発生しました。", e);
    }
}

// ===========================================
// 外部データロードロジック (API対応版)
// ===========================================
/**
 * ランドマークデータをAPI経由で取得する (api.jsに処理を委譲)
 * @param {number} lat 緯度
 * @param {number} lng 経度
 * @returns {{gyms: Array<Object>, pokestops: Array<Object>}}
 */
async function loadLandmarkData(lat, lng) {
    // ⭐ api.js からデータを取得する関数を呼び出す ⭐
    return await fetchLandmarkDataFromApi(lat, lng);
}


// ===========================================
// ランドマーク/ポケモン配置ロジック
// ===========================================
/**
 * マーカーを全て削除し、新しいデータを配置する関数
 * @param {Array<Object>} gyms 配置するジムのデータ
 * @param {Array<Object>} pokestops 配置するポケストップのデータ
 */
function loadLandmarks(gyms, pokestops) {
    // ジムを配置
    gyms.forEach(gym => {
        // チームカラークラスを付与 (teamプロパティはAPIレスポンスに含まれないためダミー)
        const teamClass = `gym-team-none`; 
        
        const icon = L.icon({
            iconUrl: LANDMARK_ICONS.gym, 
            iconSize: [48, 48],
            iconAnchor: [24, 24],
            className: `gym-marker ${teamClass}`
        });
        
        const marker = L.marker([gym.pm_lat, gym.pm_lng], { // ⭐ 修正: pm_lat, pm_lng を使用 ⭐
            icon: icon,
            pane: 'marker_z5' 
        }).addTo(map);
        
        marker.bindPopup(`<b>${gym.pm_name}</b><br>ID: ${gym.pm_id}`); // ⭐ 修正: pm_name を使用 ⭐
        landmarkMarkers.push(marker);
    });

    // ポケストップを配置
    pokestops.forEach(stop => {
        const icon = L.icon({
            iconUrl: LANDMARK_ICONS.pokestop, 
            iconSize: [48, 48],
            iconAnchor: [24, 24]
        });
        const marker = L.marker([stop.pm_lat, stop.pm_lng], { // ⭐ 修正: pm_lat, pm_lng を使用 ⭐
            icon: icon,
            pane: 'marker_z5'
        });
        
        marker.on('popupopen', function (e) {
            const isAccessible = isWithinAccessRange(stop.pm_lat, stop.pm_lng);
            const latestContent = getPokestopPopupContent(stop.pm_id, stop.pm_name, isAccessible); // ⭐ 修正: pm_id, pm_name を使用 ⭐
            e.popup.setContent(latestContent);
        });
        
        // マーカーをマップに追加
        marker.addTo(map);
        landmarkMarkers.push(marker);
        pokestopMarkers[stop.pm_id] = marker; // IDでマーカーを管理
    });
    
    console.log(`[DEBUG:LANDMARK] ランドマークの配置が完了しました。`);
}

/**
 * マップ上の既存のランドマークマーカーを全て削除する
 */
function clearAllLandmarkMarkers() {
    landmarkMarkers.forEach(marker => {
        if (map.hasLayer(marker)) {
            map.removeLayer(marker);
        }
    });
    landmarkMarkers = [];
    pokestopMarkers = {};
    console.log("[DEBUG:MAP] 全てのランドマークマーカーを削除しました。");
}

/**
 * プレイヤーが移動したときにランドマークを更新する
 */
async function updateLandmarksOnMove() {
    const pos = playerMarker.getLatLng();

    // 既存のマーカーを削除
    clearAllLandmarkMarkers(); 
    
    // APIから新しい位置のデータを取得
    const { gyms, pokestops } = await loadLandmarkData(pos.lat, pos.lng);

    // 取得したデータでマップ上に再配置
    loadLandmarks(gyms, pokestops);
}


/**
 * pokestop.js からマーカーを取得するためにグローバルに登録
 */
window.getPokestopMarkerById = (stopId) => {
    return pokestopMarkers[stopId];
};

// ... (removePokemonMarker 関数、spawnRandomPokemon 関数は省略なし) ...

/**
 * ポケモンマーカーの削除関数 (pokemongo-UI.jsから呼び出される)
 */
export function removePokemonMarker(markerToRemove) {
    if (map && markerToRemove && map.hasLayer(markerToRemove)) {
        map.removeLayer(markerToRemove); 
        pokemonMarkers = pokemonMarkers.filter(m => m !== markerToRemove); 
        console.log(`[EVENT] ポケモン マーカーをマップから削除しました (捕獲モード移行)。`);
        return true;
    }
    return false;
}


function spawnRandomPokemon(centerLat, centerLng) {
    // 乱数で生成位置を決定
    const randomAngle = Math.random() * 2 * Math.PI;
    const randomDistance = Math.random() * 0.0005; // 0m〜約50mの範囲
    
    const lat = centerLat + randomDistance * Math.cos(randomAngle);
    const lng = centerLng + randomDistance * Math.sin(randomAngle);
    
    const chosenPokemonObj = spawnPokemonByType(lat, lng);
    
    if (!chosenPokemonObj) {
        console.warn("[SPAWN] ポケモンの抽選に失敗しました。");
        return;
    }

    const pokemonId = chosenPokemonObj.id;
    const pokemonName = chosenPokemonObj.japanese;
    
    const iconUrl = `./assets/button_icon_M${pokemonId}.png`;
    
    const icon = L.icon({
        iconUrl: iconUrl, 
        iconSize: [40, 40],
        iconAnchor: [20, 20]
    });
    
    const marker = L.marker([lat, lng], { 
        icon: icon,
        pane: 'marker_z5' 
    }).addTo(map);
    
    marker.pokemonData = {
        ...chosenPokemonObj,
        lat: lat,
        lng: lng,
        uniqueId: Math.random().toString(36).substring(2)
    }; 
    
    // マーカークリックイベント: 捕獲モードを開始
    marker.on('click', function(e) {
        
        startCaptureMode(this.pokemonData); 
        
        // 捕獲モード中はマップからマーカーを削除
        if (removePokemonMarker(this)) {
             // ログは removePokemonMarker 内で出力済み
        }
    });
    
    pokemonMarkers.push(marker);
    
    marker.bindTooltip(pokemonName, { permanent: true, direction: "bottom" }).openTooltip();
    
    console.log(`[DEBUG:POKEMON] ${pokemonName} (ID: ${pokemonId}) を生成しました。15分後に消滅します。`);
    
    setTimeout(() => {
        if (removePokemonMarker(marker)) {
             console.log(`[DEBUG:POKEMON] ${pokemonName}を消滅させました。`);
        }
    }, 15 * 60 * 1000); 
}

// ===========================================
// GPSとプレイヤー移動ロジック
// ===========================================

/**
 * GPSの位置情報取得を開始し、プレイヤーマーカーを更新する
 */
export function startPlayerLocationTracking() {
    if ("geolocation" in navigator) {
        console.log("[GPS] 位置情報トラッキングを開始します...");
        
        const options = {
            enableHighAccuracy: true,
            timeout: 5000,
            maximumAge: 0
        };

        const watchId = navigator.geolocation.watchPosition((position) => {
            const lat = position.coords.latitude;
            const lng = position.coords.longitude;
            const newPos = [lat, lng];

            console.log(`[GPS:UPDATE] プレイヤー位置を更新: Lat:${lat}, Lng:${lng}`);

            if (playerMarker && map) {
                playerMarker.setLatLng(newPos); 
                map.panTo(newPos, { animate: true, duration: 1.0 }); 
                
                // ⭐ ランドマークの更新頻度チェック ⭐
                const currentTime = Date.now();
                if (currentTime - lastUpdateTime > UPDATE_INTERVAL_MS) {
                    console.log("[GPS:LANDMARK] 5秒経過、ランドマークを更新します。");
                    updateLandmarksOnMove(); // ランドマークを再ロード＆再配置
                    lastUpdateTime = currentTime;
                }
                
                // ポケモンやポケストップとのインタラクションチェックをトリガー
                checkInteractionOnMove(newPos);
            }
        }, (error) => {
            console.error("[GPS:ERROR] 位置情報の取得に失敗しました:", error.message);
        }, options);
        
        window.gpsWatchId = watchId;

    } else {
        console.error("[GPS:ERROR] お使いのブラウザは位置情報APIをサポートしていません。");
    }
}

/**
 * プレイヤーの移動時にインタラクションをチェックする
 */
function checkInteractionOnMove(playerLatlng) {
    const pokestops = Object.values(pokestopMarkers);
    const playerPos = L.latLng(playerLatlng[0], playerLatlng[1]);

    pokestops.forEach(marker => {
        if (!marker._map) return;
        
        const distance = playerPos.distanceTo(marker.getLatLng()); 
        if (distance <= ACCESS_RADIUS_M) {
            // インタラクションロジック
        }
    });
}


// ===========================================
// マーカー/マップ更新ロジック (postMessage受信時)
// ===========================================
function updateSpriteMarker(lat, lng, imageData) {
    console.log(`[DEBUG:MSG] UPDATE_SPRITEを受信しました。Lat:${lat}, Lon:${lng}`);
    const newPos = [lat, lng];
    
    if (playerMarker) {
        playerMarker.setLatLng(newPos);
        if (imageData && imageData.length > 50) { 
            const customIcon = L.icon({
                iconUrl: imageData,
                iconSize: [64, 64],
                iconAnchor: [32, 64] 
            });
            playerMarker.setIcon(customIcon);
            console.log("[DEBUG:MSG] スプライトアイコンを更新しました。");
        }
        map.panTo(newPos);
        console.log("[DEBUG:MSG] マップをプレイヤーの位置にセンタリングしました。");
    }
}

function updateMapView(lat, lng, radius) {
     console.log(`[DEBUG:MSG] UPDATE_MAP_VIEWを受信しました。Lat:${lat}, Lon:${lng}, Radius:${radius}`);
     const newCenter = [lat, lng];
     map.panTo(newCenter);
     const zoomLevel = Math.max(12, Math.min(19, Math.floor(-Math.log2(radius) + 11)));
     map.setZoom(zoomLevel);
     console.log(`[DEBUG:MSG] ズームレベルを ${zoomLevel} に設定しました。`);
}

// ===========================================
// postMessage リスナー
// ===========================================
window.addEventListener('message', (event) => {
    const data = event.data;
    if (!data || !data.type) {
           console.warn("[WARN:MSG] 受信したメッセージの形式が不正です。");
           return;
    }

    console.log(`[DEBUG:MSG] 受信メッセージタイプ: ${data.type}`);
    switch (data.type) {
        case 'UPDATE_SPRITE':
            updateSpriteMarker(data.latitude, data.longitude, data.imageData);
            break;
        case 'UPDATE_MAP_VIEW':
            updateMapView(data.latitude, data.longitude, data.radius);
            break;
        default:
            console.warn(`[WARN:MSG] 未知のメッセージタイプ: ${data.type}`);
    }
});

// ===========================================
// マップ初期化のトリガー (index.htmlから呼び出す)
// ===========================================
/**
 * 外部からマップモジュールの初期化シーケンスを開始するための関数
 */
export function initializeMapModule() {
    console.log("[DEBUG:TRIGGER] Leaflet ロード後の初期化シーケンス開始。");
    
    // ランドマークデータをロードし、成功したらマップ初期化を実行
    // この時点で playerMarker は存在しないため、初期座標を渡す
    loadLandmarkData(initialCoords[0], initialCoords[1]).then(() => {
        const mapContainer = document.getElementById('map');
        if (mapContainer && mapContainer.style.display === 'none') {
            console.warn("[WARN:MAP] マップコンテナが非表示になっています。強制的に表示します。");
            mapContainer.style.display = 'block';
        }
        
        initMap(); 
        console.log("[DEBUG:INIT] initMap() を実行しました。マップが表示されるはずです。");
    });
}

// グローバルに登録 (index.html から呼び出すため)
window.initializeMapModule = initializeMapModule;
