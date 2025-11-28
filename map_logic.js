// map_logic.js

import { spawnPokemonByType } from './pokemon.js'; 
import { startCaptureMode } from './pokemongo-UI.js'; 
import { getPokestopPopupContent } from './pokestop.js'; 

// ===========================================
// グローバル変数と定数
// ===========================================
let map;
let playerMarker;
let pokemonMarkers = []; 
let landmarkMarkers = [];
let pokestopMarkers = {}; 

// ランドマークデータはロード後にここに格納される
export let GYM_DATA = [];
export let POKESTOP_DATA = []; 

// 初期座標
let initialCoords = [35.5330, 139.4370]; 
const ACCESS_RADIUS_M = 100; // アクセス可能半径 100メートル

const TRANSPARENT_IMAGE = 'data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAQAAAC1HAwCAAAAC0lEQVR42mNkYAAAAAYAAjCB0C8AAAAASUVORK5CYII=';
// デフォルトのプレイヤーアイコン (URLパラメータで上書き可能)
let initialIconUrl = './assets/男子(中～高).png';

let LANDMARK_ICONS = {
    // URLは相対パスでアセットを参照
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
        
        const myIconParam = urlParams.get('myicon');
        if (myIconParam) { initialIconUrl = myIconParam; }
        const gymIconParam = urlParams.get('gymicon');
        if (gymIconParam) { LANDMARK_ICONS.gym = gymIconParam; }
        const pokestopIconParam = urlParams.get('pokestopicon');
        if (pokestopIconParam) { LANDMARK_ICONS.pokestop = pokestopIconParam; }

        const latParam = urlParams.get('lat');
        const lngParam = urlParams.get('lng');
        if (latParam && lngParam) {
            const newLat = parseFloat(latParam);
            const newLng = parseFloat(lngParam);
            if (!isNaN(newLat) && !isNaN(newLng)) {
                initialCoords = [newLat, newLng];
            }
        }
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
        // ⭐ Z-indexを600に設定 (ランドマークをタイルレイヤーより手前に表示) ⭐
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

        loadLandmarks(); // ロード済みのデータを使って配置を実行
        
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

        // ⭐ NEW: GPSトラッキングを開始し、プレイヤーを移動可能にする ⭐
        startPlayerLocationTracking();

    } catch (e) {
        console.error("[FATAL ERROR] マップの初期化中に致命的なエラーが発生しました。", e);
    }
}

// ===========================================
// 外部データロードロジック
// ===========================================
async function loadLandmarkData() {
    try {
        const [gymRes, stopRes] = await Promise.all([
            fetch('./gym.json'),
            fetch('./pokestop.json')
        ]);

        if (!gymRes.ok || !stopRes.ok) {
            throw new Error("ランドマークJSONのロードに失敗しました。");
        }

        GYM_DATA = await gymRes.json();
        POKESTOP_DATA = await stopRes.json();
        
        console.log(`[LANDMARK] ジムデータ ${GYM_DATA.length} 件、ポケストップデータ ${POKESTOP_DATA.length} 件をロードしました。`);

    } catch (error) {
        console.error("[LANDMARK ERROR] ランドマークデータのロード中にエラー:", error);
    }
}


// ===========================================
// ランドマーク/ポケモン配置ロジック
// ===========================================
function loadLandmarks() {
    // ジムを配置
    GYM_DATA.forEach(gym => {
        const teamClass = `gym-team-${gym.team.toLowerCase()}`; 
        
        const icon = L.icon({
            iconUrl: LANDMARK_ICONS.gym, 
            iconSize: [48, 48],
            iconAnchor: [24, 24],
            className: `gym-marker ${teamClass}`
        });
        
        const marker = L.marker([gym.lat, gym.lng], { 
            icon: icon,
            pane: 'marker_z5' 
        }).addTo(map);
        
        marker.bindPopup(`<b>${gym.name_ja}</b><br>チーム: ${gym.team}`); 
        landmarkMarkers.push(marker);
    });

    // ポケストップを配置
    POKESTOP_DATA.forEach(stop => {
        const icon = L.icon({
            iconUrl: LANDMARK_ICONS.pokestop, 
            iconSize: [48, 48],
            iconAnchor: [24, 24]
        });
        const marker = L.marker([stop.lat, stop.lng], { 
            icon: icon,
            pane: 'marker_z5'
        }).addTo(map);
        
        // ポップアップが開くたびに内容を最新の状態に更新
        marker.on('popupopen', function (e) {
            const isAccessible = isWithinAccessRange(stop.lat, stop.lng);
            const latestContent = getPokestopPopupContent(stop.id, stop.name_ja, isAccessible); 
            e.popup.setContent(latestContent);
        });
        
        landmarkMarkers.push(marker);
        pokestopMarkers[stop.id] = marker; // IDでマーカーを管理
    });
    
    console.log(`[DEBUG:LANDMARK] ランドマークの配置が完了しました。`);
}

/**
 * pokestop.js からマーカーを取得するためにグローバルに登録
 */
window.getPokestopMarkerById = (stopId) => {
    return pokestopMarkers[stopId];
};

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
    
    // ⭐ 修正: アイコンパスを './assets/button_icon_M{id}.png' に変更 ⭐
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
// GPSとプレイヤー移動ロジック (NEW)
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
                // プレイヤーマーカーを新しい位置に移動
                playerMarker.setLatLng(newPos); 
                // マップの中心をプレイヤーに合わせる
                map.panTo(newPos, { animate: true, duration: 1.0 }); 
                
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
    // プレイヤーが移動したら、全てのポケストップとの距離をチェックする
    const pokestops = Object.values(pokestopMarkers);
    const playerPos = L.latLng(playerLatlng[0], playerLatlng[1]);

    pokestops.forEach(marker => {
        if (!marker._map) return; // マーカーがマップ上にない場合はスキップ
        
        const distance = playerPos.distanceTo(marker.getLatLng()); 
        if (distance <= ACCESS_RADIUS_M) {
            // 例: ポケストップにアクセス可能範囲に入った場合
            // console.log(`[INTERACT] ポケストップ ${marker.options.id} の近くにいます。`);
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
    loadLandmarkData().then(() => {
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
