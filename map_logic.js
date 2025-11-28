// map_logic.js
console.log("🔥 [1. START] map_logic.js ファイルの実行を開始しました。");

import { spawnPokemonByType } from './pokemon.js'; 
import { startCaptureMode } from './pokemongo-UI.js'; 
import { getPokestopPopupContent } from './pokestop.js'; 
import { fetchLandmarkDataFromApi } from './api.js'; 

// ===========================================
// グローバル変数と定数
// ===========================================
let map;
let playerMarker;
let pokemonMarkers = []; 
let landmarkMarkers = [];
let pokestopMarkers = {}; 

let initialCoords = [35.5330, 139.4370]; 
const ACCESS_RADIUS_M = 100; 
const UPDATE_INTERVAL_MS = 5000; 
let lastUpdateTime = 0;

const TRANSPARENT_IMAGE = 'data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAQAAAC1HAwCAAAAC0lEQVR42mNkYAAAAAYAAjCB0C8AAAAASUVORK5CYII=';
let initialIconUrl = './assets/男子(中～高).png';

let LANDMARK_ICONS = {
    'gym': './assets/gym.png', 
    'pokestop': './assets/pokestop.png' 
};
console.log("🔥 [2. VAR] グローバル変数と定数の設定が完了しました。");


// ===========================================
// 距離計算とアクセス可能チェック関数
// ===========================================

function getDistance(lat1, lon1, lat2, lon2) {
    // ... (距離計算ロジックは省略) ...
    const R = 6371e3;
    const φ1 = lat1 * Math.PI/180;
    const φ2 = lat2 * Math.PI/180;
    const Δφ = (lat2-lat1) * Math.PI/180;
    const Δλ = (lon2-lon1) * Math.PI/180;

    const a = Math.sin(Δφ/2) * Math.sin(Δφ/2) +
              Math.cos(φ1) * Math.cos(φ2) *
              Math.sin(Δλ/2) * Math.sin(Δλ/2);
    const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1-a));

    const distance = R * c; 
    return distance;
}

export function isWithinAccessRange(landmarkLat, landmarkLng) {
    if (!playerMarker) return false;
    
    const playerPos = playerMarker.getLatLng();
    const distance = getDistance(playerPos.lat, playerPos.lng, landmarkLat, landmarkLng);
    
    return distance <= ACCESS_RADIUS_M;
}


// ===========================================
// Leaflet マップ 初期化関数
// ===========================================
/**
 * Leafletマップを初期化し、イベントリスナーをセットアップする
 */
function initMap(initialGyms, initialPokestops) {
    console.log("💡 [6. INIT] initMap関数を開始。");
    
    if (typeof L === 'undefined') {
        console.error("🚨 [FATAL ERROR] initMap内: L (Leaflet) オブジェクトが見つかりません。");
        return;
    }
    
    try {
        // ... (URLパラメータ解析ロジックは省略) ...
        
        // 2. マップ初期化
        map = L.map('map').setView(initialCoords, 17);
        console.log("💡 [6.1] Leafletマップを作成しました。");
        
        L.tileLayer('https://tile.openstreetmap.org/{z}/{x}/{y}.png', {
            maxZoom: 19,
            attribution: '© OpenStreetMap contributors' 
        }).addTo(map);
        
        // カスタムペインを作成し、Z-indexを設定
        map.createPane('marker_z5');
        map.getPane('marker_z5').style.zIndex = 600; 

        // プレイヤーマーカーの初期化
        const initialIcon = L.icon({
            iconUrl: initialIconUrl, 
            iconSize: [64, 64],
            iconAnchor: [32, 64],
            className: 'player-marker'
        });
        playerMarker = L.marker(initialCoords, { icon: initialIcon }).addTo(map);
        console.log("💡 [6.2] プレイヤーマーカーを追加しました。");

        // 初回ランドマーク配置
        loadLandmarks(initialGyms, initialPokestops);
        
        // ポケモン生成タイマー (即時実行とインターバル)
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
        console.log("💡 [6.3] GPSトラッキングを開始しました。");

    } catch (e) {
        console.error("🚨 [FATAL ERROR] マップの初期化中に致命的なエラーが発生しました。", e);
    }
}

// ===========================================
// 外部データロードロジック (API対応版)
// ===========================================
async function loadLandmarkData(lat, lng) {
    console.log("📞 [4. API] loadLandmarkDataを開始。api.jsを呼び出します。");
    return await fetchLandmarkDataFromApi(lat, lng);
}


// ===========================================
// ランドマーク/ポケモン配置ロジック
// ===========================================
function loadLandmarks(gyms, pokestops) {
    console.log(`✅ [5. LANDMARK] ジム:${gyms.length}、ポケストップ:${pokestops.length} を配置開始。`);
    // ... (ジム、ポケストップ配置ロジックは省略) ...

    gyms.forEach(gym => {
        const teamClass = `gym-team-none`; 
        
        const icon = L.icon({
            iconUrl: LANDMARK_ICONS.gym, 
            iconSize: [48, 48],
            iconAnchor: [24, 24],
            className: `gym-marker ${teamClass}`
        });
        
        const marker = L.marker([gym.pm_lat, gym.pm_lng], { 
            icon: icon,
            pane: 'marker_z5' 
        }).addTo(map);
        
        marker.bindPopup(`<b>${gym.pm_name}</b><br>ID: ${gym.pm_id}`); 
        landmarkMarkers.push(marker);
    });

    pokestops.forEach(stop => {
        const icon = L.icon({
            iconUrl: LANDMARK_ICONS.pokestop, 
            iconSize: [48, 48],
            iconAnchor: [24, 24]
        });
        const marker = L.marker([stop.pm_lat, stop.pm_lng], { 
            icon: icon,
            pane: 'marker_z5'
        });
        
        marker.on('popupopen', function (e) {
            const isAccessible = isWithinAccessRange(stop.pm_lat, stop.pm_lng);
            const latestContent = getPokestopPopupContent(stop.pm_id, stop.pm_name, isAccessible); 
            e.popup.setContent(latestContent);
        });
        
        marker.addTo(map);
        landmarkMarkers.push(marker);
        pokestopMarkers[stop.pm_id] = marker; 
    });
    
    console.log(`✅ [5.1] ランドマークの配置が完了しました。`);
}

function clearAllLandmarkMarkers() {
    // ... (マーカー削除ロジックは省略) ...
    landmarkMarkers.forEach(marker => {
        if (map.hasLayer(marker)) {
            map.removeLayer(marker);
        }
    });
    landmarkMarkers = [];
    pokestopMarkers = {};
    console.log("[MAP] 全てのランドマークマーカーを削除しました。");
}

async function updateLandmarksOnMove() {
    const pos = playerMarker.getLatLng();
    clearAllLandmarkMarkers(); 
    const { gyms, pokestops } = await loadLandmarkData(pos.lat, pos.lng);
    loadLandmarks(gyms, pokestops);
}


window.getPokestopMarkerById = (stopId) => {
    return pokestopMarkers[stopId];
};

export function removePokemonMarker(markerToRemove) {
    // ... (ポケモンマーカー削除ロジックは省略) ...
    if (map && markerToRemove && map.hasLayer(markerToRemove)) {
        map.removeLayer(markerToRemove); 
        pokemonMarkers = pokemonMarkers.filter(m => m !== markerToRemove); 
        console.log(`[EVENT] ポケモン マーカーをマップから削除しました (捕獲モード移行)。`);
        return true;
    }
    return false;
}

function spawnRandomPokemon(centerLat, centerLng) {
    // ... (ポケモン生成ロジックは省略) ...
    // console.log(`[POKEMON] ...`);
    const randomAngle = Math.random() * 2 * Math.PI;
    const randomDistance = Math.random() * 0.0005; 
    
    const lat = centerLat + randomDistance * Math.cos(randomAngle);
    const lng = centerLng + randomDistance * Math.sin(randomAngle);
    
    const chosenPokemonObj = spawnPokemonByType(lat, lng);
    
    if (!chosenPokemonObj) {
        console.warn("[SPAWN] ポケモンの抽選に失敗しました。");
        return;
    }

    const pokemonId = chosenPokemonObj.id;
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
    
    marker.on('click', function(e) {
        startCaptureMode(this.pokemonData); 
        if (removePokemonMarker(this)) {}
    });
    
    pokemonMarkers.push(marker);
    marker.bindTooltip(chosenPokemonObj.japanese, { permanent: true, direction: "bottom" }).openTooltip();
    
    setTimeout(() => {
        if (removePokemonMarker(marker)) {}
    }, 15 * 60 * 1000); 
}

// ===========================================
// GPSとプレイヤー移動ロジック
// ===========================================

export function startPlayerLocationTracking() {
    // ... (GPSロジックは省略) ...
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

            if (playerMarker && map) {
                playerMarker.setLatLng(newPos); 
                map.panTo(newPos, { animate: true, duration: 1.0 }); 
                
                const currentTime = Date.now();
                if (currentTime - lastUpdateTime > UPDATE_INTERVAL_MS) {
                    console.log("[GPS:LANDMARK] 5秒経過、ランドマークを更新します。");
                    updateLandmarksOnMove(); 
                    lastUpdateTime = currentTime;
                }
                
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

function checkInteractionOnMove(playerLatlng) {
    // ... (インタラクションチェックロジックは省略) ...
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
// ... (updateSpriteMarker, updateMapView 関数は省略) ...
function updateSpriteMarker(lat, lng, imageData) {
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
        }
        map.panTo(newPos);
    }
}

function updateMapView(lat, lng, radius) {
     const newCenter = [lat, lng];
     map.panTo(newCenter);
     const zoomLevel = Math.max(12, Math.min(19, Math.floor(-Math.log2(radius) + 11)));
     map.setZoom(zoomLevel);
}


// ===========================================
// postMessage リスナー
// ===========================================
window.addEventListener('message', (event) => {
    // ... (メッセージ処理ロジックは省略) ...
    const data = event.data;
    if (!data || !data.type) return;

    switch (data.type) {
        case 'UPDATE_SPRITE':
            updateSpriteMarker(data.latitude, data.longitude, data.imageData);
            break;
        case 'UPDATE_MAP_VIEW':
            updateMapView(data.latitude, data.longitude, data.radius);
            break;
    }
});
console.log("🔥 [3. END] map_logic.js の定義が完了しました。");


// ===========================================
// マップ初期化のトリガー (index.htmlから呼び出す)
// ===========================================
/**
 * 外部からマップモジュールの初期化シーケンスを開始するための関数
 */
export function initializeMapModule() {
    console.log("🔑 [T4. CALL] initializeMapModuleが外部から呼び出されました。");
    
    if (typeof L === 'undefined') {
        console.error("🚨 [FATAL ERROR] initializeMapModule内: L (Leaflet) オブジェクトが見つかりません。");
        return;
    }

    // ランドマークデータをロードし、成功したらマップ初期化を実行
    loadLandmarkData(initialCoords[0], initialCoords[1]).then(({ gyms, pokestops }) => {
        console.log("🔑 [T4.1] ランドマークデータ取得完了。initMapを呼び出します。");
        
        const mapContainer = document.getElementById('map');
        if (mapContainer && mapContainer.style.display === 'none') {
            mapContainer.style.display = 'block';
        }
        
        initMap(gyms, pokestops); 
        console.log("🔑 [T4.2] マップ初期化シーケンス完了。");
    }).catch(e => {
        console.error("🚨 [ERROR] ランドマークデータ取得中にエラーが発生しました:", e);
    });
}

// map_logic.js の一番最後 (postMessage リスナーブロックの次)

// 🚨 T5. REGISTER と initializeMapModule 関数の定義は全て削除！ 🚨

// ===========================================
// モジュール初期化のトリガー (イベントリスナー)
// ===========================================

/**
 * マップモジュールの初期化シーケンスを開始するプライベート関数
 */
function startMapInitializationSequence() {
    console.log("🔑 [T4. CALL] leafletReadyForModuleイベントを受信。初期化シーケンス開始。");
    
    // LのチェックはHTML側で行っているが、念のため再度チェック
    if (typeof L === 'undefined') {
        console.error("🚨 [FATAL ERROR] イベント受信後も L (Leaflet) オブジェクトが見つかりません。");
        return;
    }

    // ランドマークデータをロードし、成功したらマップ初期化を実行
    loadLandmarkData(initialCoords[0], initialCoords[1]).then(({ gyms, pokestops }) => {
        console.log("🔑 [T4.1] ランドマークデータ取得完了。initMapを呼び出します。");
        
        const mapContainer = document.getElementById('map');
        if (mapContainer && mapContainer.style.display === 'none') {
            mapContainer.style.display = 'block';
        }
        
        initMap(gyms, pokestops); 
        console.log("🔑 [T4.2] マップ初期化シーケンス完了。");
    }).catch(e => {
        console.error("🚨 [ERROR] ランドマークデータ取得中にエラーが発生しました:", e);
    });
}


document.addEventListener('leafletReadyForModule', startMapInitializationSequence);
console.log("🔑 [T5. EVENT] leafletReadyForModule イベントリスナーを登録しました。");

// 2. 登録完了後、Lがすでに定義されているかチェック (イベントを逃した場合の対応)
if (typeof L !== 'undefined') {
    // Lがあるのにイベントが来ていない（間に合わなかった）場合は、ここで直接初期化を開始する
    console.warn("⚠️ [FALLBACK] Lオブジェクトは既に存在します。イベントリスナーが間に合わなかったため、フォールバックで直接初期化を開始します。");
    startMapInitializationSequence();
}
