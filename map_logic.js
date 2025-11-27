// map_logic.js
// このファイルは index.html で <script type="module" src="./map_logic.js"></script> としてロードされる必要があります
import { startCaptureMode } from './pokemongo-UI.js';
import { spawnPokemonByType } from './pokemon.js'; 

// ===========================================
// グローバル変数と初期設定
// ===========================================
let map;
let playerMarker;
let pokemonMarkers = [];
let landmarkMarkers = [];

// ⭐ ランドマークデータは外部JSONからロードするため空で初期化 ⭐
const LANDMARKS = []; 
let GYM_DATA = [];
let POKESTOP_DATA = [];

// 初期座標 (URLパラメータで上書き可能)
let initialCoords = [35.681236, 139.767125]; 

const TRANSPARENT_IMAGE = 'data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAQAAAC1HAwCAAAAC0lEQVR42mNkYAAAAAYAAjCB0C8AAAAASUVORK5CYII=';
let initialIconUrl = TRANSPARENT_IMAGE; 

// ランドマークアイコン (URLパラメータで上書き可能)
let LANDMARK_ICONS = {
    'gym': 'https://example.com/gym.png', 
    'pokestop': 'https://example.com/pokestop.png' 
};


// ===========================================
// Leaflet マップ 初期化関数
// ===========================================
function initMap() {
    if (typeof L === 'undefined') {
        console.error("[FATAL ERROR] L (Leaflet) オブジェクトが見つかりません。");
        return;
    }
    console.log("[DEBUG:INIT] Leafletオブジェクトを確認。マップ初期化開始。");

    // ⭐ 1. URLクエリパラメータから各種情報を取得するロジック (省略) ⭐
    // ... (URLパラメータの取得ロジックは変更なし) ...
    try {
        const urlParams = new URLSearchParams(window.location.search);
        
        const myIconParam = urlParams.get('myicon');
        if (myIconParam) {
            initialIconUrl = myIconParam;
        }

        const gymIconParam = urlParams.get('gymicon');
        if (gymIconParam) {
            LANDMARK_ICONS.gym = gymIconParam;
        }

        const pokestopIconParam = urlParams.get('pokestopicon');
        if (pokestopIconParam) {
            LANDMARK_ICONS.pokestop = pokestopIconParam;
        }

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
    // ⭐ ---------------------------------------------------- ⭐

    try {
        // 2. マップ初期化
        map = L.map('map').setView(initialCoords, 17);
        console.log("[DEBUG:INIT] Leafletマップを作成しました。");
        
        L.tileLayer('https://tile.openstreetmap.org/{z}/{x}/{y}.png', {
            maxZoom: 19,
            attribution: '© OpenStreetMap contributors' 
        }).addTo(map);
        
        // ⭐ NEW: カスタムペインを作成し、Z-index: 5 を設定 ⭐
        map.createPane('marker_z5');
        map.getPane('marker_z5').style.zIndex = 5;
        console.log("[DEBUG:INIT] カスタムペイン 'marker_z5' (Z-index: 5) を作成しました。");

        // プレイヤーマーカーの初期化 (デフォルトのZ-indexを使用)
        const initialIcon = L.icon({
            iconUrl: initialIconUrl, 
            iconSize: [64, 64],
            iconAnchor: [32, 64]
        });
        playerMarker = L.marker(initialCoords, { icon: initialIcon }).addTo(map);
        console.log("[DEBUG:INIT] プレイヤーマーカーを初期位置に追加しました。");

        loadLandmarks(); // ロード済みのデータを使って配置を実行
        
        // ポケモン生成タイマー (5分ごと)
        setInterval(() => {
            if(playerMarker) {
                const pos = playerMarker.getLatLng();
                spawnRandomPokemon(pos.lat, pos.lng);
            }
        }, 5 * 60 * 1000); 

    } catch (e) {
        console.error("[FATAL ERROR] マップの初期化中に致命的なエラーが発生しました。", e);
    }
}

// ===========================================
// 外部データロードロジック
// ===========================================
/**
 * 外部JSONファイルからジムとポケストップのデータを非同期でロードする
 */
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
        const icon = L.icon({
            iconUrl: LANDMARK_ICONS.gym || TRANSPARENT_IMAGE, 
            iconSize: [48, 48],
            iconAnchor: [24, 24]
        });
        const marker = L.marker([gym.lat, gym.lng], { 
            icon: icon,
            // ⭐ Z-index 5 ペインを指定 ⭐
            pane: 'marker_z5' 
        }).addTo(map);
        marker.bindPopup(`<b>${gym.name_ja}</b><br>チーム: ${gym.team}`); 
        landmarkMarkers.push(marker);
    });

    // ポケストップを配置
    POKESTOP_DATA.forEach(stop => {
        const icon = L.icon({
            iconUrl: LANDMARK_ICONS.pokestop || TRANSPARENT_IMAGE, 
            iconSize: [48, 48],
            iconAnchor: [24, 24]
        });
        const marker = L.marker([stop.lat, stop.lng], { 
            icon: icon,
            // ⭐ Z-index 5 ペインを指定 ⭐
            pane: 'marker_z5'
        }).addTo(map);
        marker.bindPopup(`<b>${stop.name_ja}</b>`);
        landmarkMarkers.push(marker);
    });
    
    console.log(`[DEBUG:LANDMARK] ランドマークの配置が完了しました。`);
}

function spawnRandomPokemon(centerLat, centerLng) {
    // 乱数で生成位置を決定
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
    const pokemonName = chosenPokemonObj.japanese;
    
    // アイコンURLを ID ベースで生成: /assets/[ID].png
    const iconUrl = `/rei/assets/${pokemonId}.png`;
    
    const icon = L.icon({
        iconUrl: iconUrl, 
        iconSize: [40, 40],
        iconAnchor: [20, 20]
    });
    
    const marker = L.marker([lat, lng], { 
        icon: icon,
        // ⭐ Z-index 5 ペインを指定 ⭐
        pane: 'marker_z5' 
    }).addTo(map);
    // ⭐ 修正: マーカーに緯度・経度情報も追加で付与 ⭐
    marker.pokemonData = {
        ...chosenPokemonObj,
        lat: lat,
        lng: lng
    };

    
    marker.on('click', function(e) {
        // マーカーを消滅させる前に捕獲モードを開始
        startCaptureMode(this.pokemonData); 
        
        // マーカーをマップから削除（捕獲または逃走後に削除）
        map.removeLayer(this); 
        pokemonMarkers = pokemonMarkers.filter(m => m !== this);
        console.log(`[EVENT] ${this.pokemonData.japanese} マーカーを一時的に削除しました。`);
    });
    // ⭐ -------------------------------------- ⭐
    
    pokemonMarkers.push(marker);

    
    // マーカーにツールチップで名前を表示
    marker.bindTooltip(pokemonName, { permanent: true, direction: "bottom" }).openTooltip();
    
    console.log(`[DEBUG:POKEMON] ${pokemonName} (ID: ${pokemonId}) を生成しました。15分後に消滅します。`);
    
    setTimeout(() => {
        map.removeLayer(marker); 
        pokemonMarkers = pokemonMarkers.filter(m => m !== marker); 
        console.log(`[DEBUG:POKEMON] ${pokemonName}を消滅させました。`);
    }, 15 * 60 * 1000); 
}

// ===========================================
// マーカー/マップ更新ロジック (postMessage受信時)
// ===========================================
// ... (updateSpriteMarker, updateMapView 関数は変更なし) ...

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
// DOMロードとマップ初期化のトリガー (修正)
// ===========================================
document.addEventListener('DOMContentLoaded', () => {
    console.log("[DEBUG:TRIGGER] DOMContentLoadedを検知しました。");
    
    // ⭐ ランドマークデータをロードし、成功したらマップ初期化を実行 ⭐
    loadLandmarkData().then(() => {
        // 確実な実行のために500msの遅延を維持
        setTimeout(initMap, 500); 
    });
});
