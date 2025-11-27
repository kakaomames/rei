// map_logic.js
// このファイルは index.html で <script type="module" src="./map_logic.js"></script> としてロードされる必要があります

// ⭐ 追記: pokemon.js から出現ロジックをインポート ⭐
import { spawnPokemonByType } from './pokemon.js'; 

// ===========================================
// グローバル変数と初期設定
// ===========================================
let map;
let playerMarker;
let pokemonMarkers = [];
let landmarkMarkers = [];

// 初期座標 (URLパラメータで上書き可能)
let initialCoords = [35.681236, 139.767125]; 

const TRANSPARENT_IMAGE = 'data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAQAAAC1HAwCAAAAC0lEQVR42mNkYAAAAAYAAjCB0C8AAAAASUVORK5CYII=';
let initialIconUrl = TRANSPARENT_IMAGE; 

// ランドマークアイコン (URLパラメータで上書き可能)
let LANDMARK_ICONS = {
    'gym': 'https://example.com/gym.png', 
    'pokestop': 'https://example.com/pokestop.png' 
};

// ランドマークデータ (静的データ)
const LANDMARKS = [
  {"lat": 35.6816, "lng": 139.766, "type": "gym"},
  {"lat": 35.6808, "lng": 139.7675, "type": "pokestop"},
];

// ⭐ 削除済み: POKEMON_ICONS は ID ベースのURLに置き換えられました ⭐


// ===========================================
// Leaflet マップ 初期化関数
// ===========================================
function initMap() {
    if (typeof L === 'undefined') {
        console.error("[FATAL ERROR] L (Leaflet) オブジェクトが見つかりません。");
        return;
    }
    console.log("[DEBUG:INIT] L (Leaflet) オブジェクトを確認。マップ初期化開始。");

    // ⭐ 1. URLクエリパラメータから各種情報を取得するロジック
    try {
        const urlParams = new URLSearchParams(window.location.search);
        
        const myIconParam = urlParams.get('myicon');
        if (myIconParam) {
            initialIconUrl = myIconParam;
            console.log(`[INIT] URLからプレイヤーアイコン ${initialIconUrl} を取得しました。`);
        }

        const gymIconParam = urlParams.get('gymicon');
        if (gymIconParam) {
            LANDMARK_ICONS.gym = gymIconParam;
            console.log(`[INIT] URLからジムアイコン ${LANDMARK_ICONS.gym} を取得しました。`);
        }

        const pokestopIconParam = urlParams.get('pokestopicon');
        if (pokestopIconParam) {
            LANDMARK_ICONS.pokestop = pokestopIconParam;
            console.log(`[INIT] URLからポケストップアイコン ${LANDMARK_ICONS.pokestop} を取得しました。`);
        }

        const latParam = urlParams.get('lat');
        const lngParam = urlParams.get('lng');
        if (latParam && lngParam) {
            const newLat = parseFloat(latParam);
            const newLng = parseFloat(lngParam);
            if (!isNaN(newLat) && !isNaN(newLng)) {
                initialCoords = [newLat, newLng];
                console.log(`[INIT] URLから初期座標 [${newLat}, ${newLng}] を取得しました。`);
            } else {
                 console.warn("[INIT WARN] lat/lngパラメータが不正な数値です。初期値を使用します。");
            }
        }
        
    } catch(e) {
        console.error("[INIT ERROR] URLパラメータの解析中にエラー:", e);
    }

    try {
        // ⭐ 2. 更新されたinitialCoordsを使用してマップを初期化
        map = L.map('map').setView(initialCoords, 17);
        console.log("[DEBUG:INIT] Leafletマップを作成しました。");
        
        L.tileLayer('https://tile.openstreetmap.org/{z}/{x}/{y}.png', {
            maxZoom: 19,
            attribution: '© OpenStreetMap contributors' 
        }).addTo(map);
        console.log("[DEBUG:INIT] OpenStreetMapタイルレイヤーを追加しました。");

        // プレイヤーマーカーの初期化
        const initialIcon = L.icon({
            iconUrl: initialIconUrl, 
            iconSize: [64, 64],
            iconAnchor: [32, 64]
        });
        playerMarker = L.marker(initialCoords, { icon: initialIcon }).addTo(map);
        console.log("[DEBUG:INIT] プレイヤーマーカーを初期位置に追加しました。");

        loadLandmarks();
        
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
// ランドマーク/ポケモン配置ロジック
// ===========================================
function loadLandmarks() {
    console.log(`[DEBUG:LANDMARK] ランドマーク ${LANDMARKS.length} 件の配置を開始します。`);
    LANDMARKS.forEach(landmark => {
        const icon = L.icon({
            iconUrl: LANDMARK_ICONS[landmark.type] || TRANSPARENT_IMAGE, 
            iconSize: [48, 48],
            iconAnchor: [24, 24]
        });
        const marker = L.marker([landmark.lat, landmark.lng], { icon: icon }).addTo(map);
        landmarkMarkers.push(marker);
        console.log(`[DEBUG:LANDMARK] ${landmark.type}を配置 (Lat: ${landmark.lat})`);
    });
}

function spawnRandomPokemon(centerLat, centerLng) {
    // 乱数で生成位置を決定 (プレイヤー周辺 0.0005度以内)
    const randomAngle = Math.random() * 2 * Math.PI;
    const randomDistance = Math.random() * 0.0005; 
    
    const lat = centerLat + randomDistance * Math.cos(randomAngle);
    const lng = centerLng + randomDistance * Math.sin(randomAngle);
    
    // ⭐ 環境ベースの出現ロジックを使用し、ポケモンオブジェクトを取得 ⭐
    const chosenPokemonObj = spawnPokemonByType(lat, lng);
    
    if (!chosenPokemonObj) {
        console.warn("[SPAWN] ポケモンの抽選に失敗しました (データ未ロードなど)。");
        return;
    }

    const pokemonId = chosenPokemonObj.id;
    const pokemonName = chosenPokemonObj.japanese;
    
    // ⭐ アイコンURLを ID ベースで生成: /assets/[ID].png ⭐
    const iconUrl = `/rei/assets/${pokemonId}.png`;
    
    const icon = L.icon({
        iconUrl: iconUrl, 
        iconSize: [40, 40],
        iconAnchor: [20, 20]
    });
    
    const marker = L.marker([lat, lng], { icon: icon }).addTo(map);
    
    // ⭐ マーカーにポケモンデータを付与 (次のステップでクリック処理に使用) ⭐
    marker.pokemonData = chosenPokemonObj; 
    
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
function updateSpriteMarker(lat, lng, imageData) {
    console.log(`[DEBUG:MSG] UPDATE_SPRITEを受信しました。Lat:${lat}, Lon:${lng}`);
    const newPos = [lat, lng];
    
    if (playerMarker) {
        playerMarker.setLatLng(newPos);

        // imageData（URLまたはBase64）があればアイコンを更新
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

     // ズームレベルの計算 (radiusが大きいほどズームアウト)
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
// DOMロードとマップ初期化のトリガー
// ===========================================
document.addEventListener('DOMContentLoaded', () => {
    console.log("[DEBUG:TRIGGER] DOMContentLoadedを検知しました。500ms後にマップ初期化を実行します。");
    // 確実な実行のために500msの遅延を維持
    setTimeout(initMap, 500); 
});
