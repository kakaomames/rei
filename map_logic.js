// map_logic.js

import { spawnPokemon } from './pokemon.js';
import { renderPokemonBoxUI } from './pokemongo-UI.js';
import { addPokestopMarker, addGymMarker, fetchLandmarkData, getPokestopMarkers } from './pokestop.js';
import { startCaptureMode } from './pokemongo-UI.js';

// グローバル変数としてマップインスタンスを保持
let map;
let playerMarker;
let isFirstLoad = true;

// ポケモンマーカーの集合（捕獲モード移行時に削除するため）
const pokemonMarkers = new Map(); 

// 初期位置の緯度経度
const INITIAL_LAT = 35.5312; 
const INITIAL_LNG = 139.6901;

// ===========================================
// Leaflet カスタムアイコンの定義
// ===========================================

// プレイヤーアイコン
const PlayerIcon = L.icon({
    iconUrl: './assets/男子(中～高).png', 
    iconSize: [64, 64], 
    iconAnchor: [32, 32], 
});

// ===========================================
// マップ初期化関数
// ===========================================

/**
 * Leafletマップを初期化し、レイヤー、マーカー、ランドマークを追加する
 */
function initMap() {
    console.log("[DEBUG:INIT] initMap() を実行しました。マップが表示されるはずです。");

    // Leafletオブジェクトの確認
    if (typeof L === 'undefined') {
        console.error("🚨 [FATAL] Leaflet (L) がロードされていません。マップ初期化をスキップします。");
        return;
    }
    console.log("[DEBUG:INIT] Leafletオブジェクトを確認。マップ初期化開始。");

    // 既存のマップインスタンスが存在すれば破棄
    if (map) {
        map.remove();
    }

    // マップインスタンスの作成
    map = L.map('map', {
        center: [INITIAL_LAT, INITIAL_LNG],
        zoom: 17,
        zoomControl: false, 
        attributionControl: false 
    });
    console.log("[DEBUG:INIT] Leafletマップを作成しました。");

    // -------------------------------------------
    // カスタムペインの作成とZ-indexの設定
    // -------------------------------------------
    map.createPane('marker_z5');
    // ⭐ Z-indexを600に設定 (UIの妨げにならず、タイルの上に表示させるため) ⭐
    map.getPane('marker_z5').style.zIndex = 600; 

    console.log("[DEBUG:INIT] カスタムペイン 'marker_z5' (Z-index: 600) を作成しました。");
    // -------------------------------------------

    // OpenStreetMap タイルレイヤーの追加
    L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
        maxZoom: 19,
    }).addTo(map);


    // プレイヤーマーカーの追加
    playerMarker = L.marker([INITIAL_LAT, INITIAL_LNG], {
        icon: PlayerIcon,
        pane: 'marker_z5' // カスタムペインに配置
    }).addTo(map);
    console.log("[DEBUG:INIT] プレイヤーマーカーを初期位置に追加しました。");
    
    // 初回ロード時のみランドマークとポケモンの生成を行う
    if (isFirstLoad) {
        initializeLandmarksAndPokemon();
        isFirstLoad = false;
    }

    // イベントリスナーの設定
    setupMapEventListeners();
}

/**
 * ランドマークとポケモンの初期配置を行う
 */
async function initializeLandmarksAndPokemon() {
    // ランドマーク（ポケストップ、ジム）のデータ取得と配置
    const { gyms, pokestops } = await fetchLandmarkData();
    console.log("[LANDMARK] ジムデータ " + gyms.length + " 件、ポケストップデータ " + pokestops.length + " 件をロードしました。");

    // ジムの配置
    gyms.forEach(gym => {
        addGymMarker(map, gym, 'marker_z5'); // カスタムペインを渡す
    });
    
    // ポケストップの配置
    pokestops.forEach(pokestop => {
        addPokestopMarker(map, pokestop, 'marker_z5'); // カスタムペインを渡す
    });
    console.log("[DEBUG:LANDMARK] ランドマークの配置が完了しました。");

    // ポケモンの初期スポーン
    const initialPokemon = spawnPokemon(INITIAL_LAT, INITIAL_LNG, 0.001); // プレイヤーの近くにスポーン
    addPokemonMarker(initialPokemon); 
    console.log(`[DEBUG:POKEMON] ${initialPokemon.japanese} (ID: ${initialPokemon.id}) を生成しました。15分後に消滅します。`);

    // ボックスUIをレンダリング
    renderPokemonBoxUI();
}

/**
 * ポケモンマーカーをマップに追加する
 */
function addPokemonMarker(pokemon) {
    // ⭐ アイコンURLを修正: ./assets/button_icon_M{id}.png を使用 ⭐
    const icon = L.icon({
        iconUrl: `./assets/button_icon_M${pokemon.id}.png`, 
        iconSize: [50, 50],
        iconAnchor: [25, 25],
    });

    const marker = L.marker([pokemon.lat, pokemon.lng], {
        icon: icon,
        pane: 'marker_z5' // カスタムペインに配置
    }).addTo(map);

    // クリックイベントの設定（捕獲モードへの移行）
    marker.on('click', () => {
        startCaptureMode(pokemon); // pokemongo-UI.js の関数を呼び出す
        removePokemonMarker(pokemon.uniqueId); // マップからポケモンマーカーを削除
    });

    pokemonMarkers.set(pokemon.uniqueId, marker);
}

/**
 * ポケモンマーカーをマップから削除する
 */
export function removePokemonMarker(uniqueId) {
    const marker = pokemonMarkers.get(uniqueId);
    if (marker) {
        map.removeLayer(marker);
        pokemonMarkers.delete(uniqueId);
        console.log(`[EVENT] ポケモン マーカーをマップから削除しました (捕獲モード移行)。`);
    }
}

/**
 * マップイベントリスナーを設定する
 */
function setupMapEventListeners() {
    // マップ移動時に、プレイヤーマーカーも更新する（デバッグ用）
    map.on('move', () => {
        const center = map.getCenter();
        // プレイヤーマーカーをマップ中心に常に維持する（固定カメラシミュレーション）
        playerMarker.setLatLng(center); 
    });
    
    // ポケストップの当たり判定を復活させるためのクリックイベント
    map.on('click', (e) => {
        checkPokestopInteraction(e.latlng);
    });
}

/**
 * クリック位置に基づいてポケストップとのインタラクションを確認する
 */
function checkPokestopInteraction(latlng) {
    const radius = 50; // インタラクション判定半径 (メートル)
    const pokestops = getPokestopMarkers(); // pokestop.jsからマーカーリストを取得

    pokestops.forEach(marker => {
        // マーカーが既にマップ上から削除されていないか確認
        if (!marker._map) return; 
        
        const markerLatlng = marker.getLatLng();
        // Leafletの距離計算関数 (latlng.distanceTo) を使用
        const distance = latlng.distanceTo(markerLatlng); 

        if (distance < radius) {
            console.log(`[INTERACT] ポケストップ ${marker.options.id} に接近しました。距離: ${distance.toFixed(2)}m`);
            // ポケストップを回すロジック（後で実装）
            alert(`ポケストップ(${marker.options.id})を回しました！（アイテム獲得は未実装）`);
        }
    });
}


// ===========================================
// グローバル登録と初期化トリガー
// ===========================================

// マップ初期化関数を外部から呼び出せるようにグローバル登録
window.initializeMapModule = initMap;

// 捕獲後のマーカー削除を pokemongo-UI.js から呼び出せるようにエクスポート
export { 
    removePokemonMarker 
};
