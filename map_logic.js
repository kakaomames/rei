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

// 初期座標 (例: 忠生公園付近)
let initialCoords = [35.5330, 139.4370]; 
const ACCESS_RADIUS_M = 100; // ポケストップやポケモンにアクセス可能な距離 (メートル)
const UPDATE_INTERVAL_MS = 5000; // ランドマークの再取得・更新間隔 (5秒)
let lastUpdateTime = 0;

const TRANSPARENT_IMAGE = 'data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAQAAAC1HAwCAAAAC0lEQVR42mNkYAAAAAYAAjCB0C8AAAAASUVORK5CYII=';
let initialIconUrl = './assets/男子(中～高).png'; // プレイヤーアイコン

let LANDMARK_ICONS = {
    'gym': './assets/gym.png', 
    'pokestop': './assets/pokestop.png' 
};
console.log("🔥 [2. VAR] グローバル変数と定数の設定が完了しました。");


// ===========================================
// 距離計算とアクセス可能チェック関数
// ===========================================

/**
 * 2つの座標間の距離をメートル単位で計算する (ハーバーサインの公式)
 * @param {number} lat1 緯度1
 * @param {number} lon1 経度1
 * @param {number} lat2 緯度2
 * @param {number} lon2 経度2
 * @returns {number} 距離 (メートル)
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

    const distance = R * c; 
    return distance;
}

/**
 * 指定されたランドマークがプレイヤーのアクセス範囲内かチェックする
 * @param {number} landmarkLat ランドマークの緯度
 * @param {number} landmarkLng ランドマークの経度
 * @returns {boolean} アクセス可能であれば true
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
/**
 * Leafletマップを初期化し、イベントリスナーをセットアップする
 * @param {Array<Object>} initialGyms APIから取得した初期ジムデータ
 * @param {Array<Object>} initialPokestops APIから取得した初期ポケストップデータ
 */
function initMap(initialGyms, initialPokestops) {
    console.log("💡 [6. INIT] initMap関数を開始。");
    
    if (typeof L === 'undefined') {
        console.error("🚨 [FATAL ERROR] initMap内: L (Leaflet) オブジェクトが見つかりません。");
        return;
    }
    
    try {
        // 1. URLパラメータから初期座標を取得するロジック (省略されていた部分)
        const urlParams = new URLSearchParams(window.location.search);
        if (urlParams.has('lat') && urlParams.has('lng')) {
            const lat = parseFloat(urlParams.get('lat'));
            const lng = parseFloat(urlParams.get('lng'));
            if (!isNaN(lat) && !isNaN(lng)) {
                initialCoords = [lat, lng];
                console.log(`💡 [6.0] URLパラメータから座標をロード: ${lat}, ${lng}`);
            }
        }
        
        // 2. マップ初期化
        map = L.map('map').setView(initialCoords, 17);
        console.log("💡 [6.1] Leafletマップを作成しました。");
        
        L.tileLayer('https://tile.openstreetmap.org/{z}/{x}/{y}.png', {
            maxZoom: 19,
            attribution: '© OpenStreetMap contributors' 
        }).addTo(map);
        
        // カスタムペインを作成し、Z-indexを設定 (ポケモンとランドマークを上に表示するため)
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
        }, 5 * 60 * 1000); // 5分ごとにポケモンを再生成

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
/**
 * APIからランドマークデータを取得する
 * @param {number} lat 緯度
 * @param {number} lng 経度
 * @returns {Promise<{gyms: Array<Object>, pokestops: Array<Object>}>}
 */
async function loadLandmarkData(lat, lng) {
    console.log("📞 [4. API] loadLandmarkDataを開始。api.jsを呼び出します。");
    return await fetchLandmarkDataFromApi(lat, lng);
}


// ===========================================
// ランドマーク/ポケモン配置ロジック
// ===========================================
/**
 * 取得したジムとポケストップのデータをマップ上にマーカーとして配置する
 * @param {Array<Object>} gyms ジムデータ配列
 * @param {Array<Object>} pokestops ポケストップデータ配列
 */
function loadLandmarks(gyms, pokestops) {
    console.log(`✅ [5. LANDMARK] ジム:${gyms.length}、ポケストップ:${pokestops.length} を配置開始。`);
    
    // ジムの配置
    gyms.forEach(gym => {
        // pm_type === "2"
        const teamClass = `gym-team-none`; // チーム情報はAPIデータに含まれていないため仮設定
        
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
        
        // ポップアップには簡易情報
        marker.bindPopup(`<b>${gym.pm_name}</b><br>ID: ${gym.pm_id}<br><button onclick="window.openGymUI('${gym.pm_id}')">ジムへ挑む</button>`); 
        landmarkMarkers.push(marker);
    });

    // ポケストップの配置
    pokestops.forEach(stop => {
        // pm_type === "3"
        const icon = L.icon({
            iconUrl: LANDMARK_ICONS.pokestop, 
            iconSize: [48, 48],
            iconAnchor: [24, 24]
        });
        const marker = L.marker([stop.pm_lat, stop.pm_lng], { 
            icon: icon,
            pane: 'marker_z5'
        });
        
        // ポップアップが開かれるたびに、アクセス圏内かクールダウン中かをチェック
        marker.on('popupopen', function (e) {
            // 距離チェック
            const isAccessible = isWithinAccessRange(stop.pm_lat, stop.pm_lng);
            
            // pokestop.js の関数を呼び出し、最新のコンテンツを取得
            // ⭐ isAccessibleフラグを渡すことで、pokestop.js側でボタンを制御できる
            const latestContent = getPokestopPopupContent(stop.pm_id, stop.pm_name, isAccessible); 
            e.popup.setContent(latestContent);
        });
        
        marker.addTo(map);
        landmarkMarkers.push(marker);
        pokestopMarkers[stop.pm_id] = marker; // IDで参照できるように保存
    });
    
    console.log(`✅ [5.1] ランドマークの配置が完了しました。`);
}

/**
 * マップ上の全てのランドマークマーカーを削除する
 */
function clearAllLandmarkMarkers() {
    landmarkMarkers.forEach(marker => {
        if (map.hasLayer(marker)) {
            map.removeLayer(marker);
        }
    });
    landmarkMarkers = [];
    pokestopMarkers = {}; // ID参照テーブルもリセット
    console.log("[MAP] 全てのランドマークマーカーを削除しました。");
}

/**
 * プレイヤーの移動に伴い、周辺のランドマークデータを再取得・更新する
 */
async function updateLandmarksOnMove() {
    const pos = playerMarker.getLatLng();
    clearAllLandmarkMarkers(); 
    const { gyms, pokestops } = await loadLandmarkData(pos.lat, pos.lng);
    loadLandmarks(gyms, pokestops);
}

/**
 * ポケストップIDに基づいてLeafletマーカーオブジェクトを取得する (pokestop.js からの参照用)
 * @param {string} stopId ポケストップのID
 * @returns {L.Marker | undefined}
 */
window.getPokestopMarkerById = (stopId) => {
    return pokestopMarkers[stopId];
};

/**
 * マップからポケモンマーカーを削除する
 * @param {L.Marker} markerToRemove 削除対象のLeafletマーカーオブジェクト
 * @returns {boolean} 削除が成功したか
 */
export function removePokemonMarker(markerToRemove) {
    if (map && markerToRemove && map.hasLayer(markerToRemove)) {
        map.removeLayer(markerToRemove); 
        pokemonMarkers = pokemonMarkers.filter(m => m !== markerToRemove); 
        console.log(`[EVENT] ポケモン マーカーをマップから削除しました (捕獲モード移行/時間切れ)。`);
        return true;
    }
    return false;
}

/**
 * プレイヤー周辺のランダムな位置にポケモンを生成し、マーカーを配置する
 * @param {number} centerLat 中心緯度
 * @param {number} centerLng 中心経度
 */
function spawnRandomPokemon(centerLat, centerLng) {
    // ポケモンが出現する範囲 (ランダムな距離と角度)
    const randomAngle = Math.random() * 2 * Math.PI;
    const randomDistance = Math.random() * 0.0005; // 約50メートル範囲
    
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
        pane: 'marker_z5' // ランドマークの上に表示
    }).addTo(map);
    
    marker.pokemonData = {
        ...chosenPokemonObj,
        lat: lat,
        lng: lng,
        uniqueId: Math.random().toString(36).substring(2) // 識別用
    }; 
    
    // ポケモンがクリックされたら捕獲モードへ移行
    marker.on('click', function(e) {
        // ⭐ NEW: クリック時にアクセス圏内かチェック
        const isAccessible = isWithinAccessRange(this.pokemonData.lat, this.pokemonData.lng);
        
        if (isAccessible) {
            startCaptureMode(this.pokemonData); 
            removePokemonMarker(this);
        } else {
            alert("❌ ポケモンが遠すぎます。もっと近付いてください。");
        }
    });
    
    pokemonMarkers.push(marker);
    marker.bindTooltip(chosenPokemonObj.japanese, { permanent: true, direction: "bottom" }).openTooltip();
    
    // 15分後にポケモンを自動削除
    setTimeout(() => {
        removePokemonMarker(marker);
    }, 15 * 60 * 1000); 
}

// ===========================================
// GPSとプレイヤー移動ロジック
// ===========================================

/**
 * ブラウザのGeolocation APIを使用してプレイヤーの位置を追跡し、マーカーを更新する
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

            if (playerMarker && map) {
                playerMarker.setLatLng(newPos); 
                map.panTo(newPos, { animate: true, duration: 1.0 }); 
                
                const currentTime = Date.now();
                // 5秒間隔でランドマークを更新
                if (currentTime - lastUpdateTime > UPDATE_INTERVAL_MS) {
                    console.log("[GPS:LANDMARK] ランドマークを更新します。");
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

/**
 * プレイヤーの移動時に、周辺のランドマークとのインタラクションをチェックする (未実装のロジック用)
 * @param {Array<number>} playerLatlng [lat, lng] 形式のプレイヤー座標
 */
function checkInteractionOnMove(playerLatlng) {
    // プレイヤーが移動した際、ポケストップやジムの見た目を変える、通知を出す等のロジックをここに実装する
    const pokestops = Object.values(pokestopMarkers);
    const playerPos = L.latLng(playerLatlng[0], playerLatlng[1]);

    pokestops.forEach(marker => {
        if (!marker._map) return;
        
        const distance = playerPos.distanceTo(marker.getLatLng()); 
        if (distance <= ACCESS_RADIUS_M) {
            // 例: ポケストップのアイコンを「回せる」色に変える処理など
        }
    });
}


// ===========================================
// マーカー/マップ更新ロジック (postMessage受信時)
// ===========================================
/**
 * プレイヤーマーカーの位置とアイコンを更新する
 * @param {number} lat 緯度
 * @param {number} lng 経度
 * @param {string} imageData base64形式の画像データURL
 */
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

/**
 * マップの中心位置とズームレベルを更新する
 * @param {number} lat 緯度
 * @param {number} lng 経度
 * @param {number} radius 表示範囲 (ズームレベル計算に使用)
 */
function updateMapView(lat, lng, radius) {
     const newCenter = [lat, lng];
     map.panTo(newCenter);
     // 簡易的なズームレベル計算ロジック
     const zoomLevel = Math.max(12, Math.min(19, Math.floor(-Math.log2(radius) + 11)));
     map.setZoom(zoomLevel);
}


// ===========================================
// postMessage リスナー
// ===========================================
window.addEventListener('message', (event) => {
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
// モジュール初期化のトリガー (イベントリスナー)
// ===========================================

/**
 * マップモジュールの初期化シーケンスを開始するプライベート関数
 */
function startMapInitializationSequence() {
    console.log("🔑 [T4. CALL] Leaflet初期化イベントを受信。初期化シーケンス開始。");
    
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

// 外部ファイル (index.html) からのカスタムイベントをリッスンし、初期化を開始
document.addEventListener('leafletReadyForModule', startMapInitializationSequence);
console.log("🔑 [T5. EVENT] leafletReadyForModule イベントリスナーを登録しました。");

// 2. 登録完了後、Lがすでに定義されているかチェック (イベントを逃した場合のフォールバック)
if (typeof L !== 'undefined') {
    // Lがあるのにイベントが来ていない（間に合わなかった）場合は、ここで直接初期化を開始する
    console.warn("⚠️ [FALLBACK] Lオブジェクトは既に存在します。フォールバックで直接初期化を開始します。");
    startMapInitializationSequence();
}
