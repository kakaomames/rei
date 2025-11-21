// map_manager.js
import { startCapture } from "./capture_3d.js";

// --- グローバル変数 (ここではモジュール内変数) ---
let userLat = 35.6895; // 初期値（東京）
let userLng = 139.6917;
let map = null;
let userMarker = null;
const monsters = [];

// --- 外部から呼び出せるようにするための関数 ---
window.moveFake = (dLat, dLng) => {
    userLat += dLat;
    userLng += dLng;
    updateUserPosition();
};

window.closeCapture = () => {
    // capture_3d.js の関数を呼び出す
    document.getElementById('capture-container').style.display = 'none';
    document.getElementById('map-container').style.display = 'block';
    if(map) map.invalidateSize();
};

// --- 初期化 ---
function initMap() {
    map = L.map('map-container').setView([userLat, userLng], 16);
    L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
        attribution: '© OpenStreetMap contributors'
    }).addTo(map);

    const userIcon = L.divIcon({
        className: 'custom-icon',
        html: '🏃',
        iconSize: [40, 40],
        iconAnchor: [20, 40]
    });

    userMarker = L.marker([userLat, userLng], {icon: userIcon}).addTo(map)
        .bindPopup("現在地 (あなた)");
    
    document.getElementById('msg').innerText = "マップ準備完了。移動してモンスターを探そう！";
    
    // モンスターの初期スポーン
    spawnMonster(userLat + 0.001, userLng + 0.001, "🍌", "ワイルドバナナ");
    spawnMonster(userLat - 0.001, userLng + 0.001, "🦍", "怒れるゴリラ");
    spawnMonster(userLat + 0.001, userLng - 0.001, "🍫", "伝説のカカオ");
    
    // GPSの起動
    initGPS();
}

// ユーザー位置の更新
function updateUserPosition() {
    if(map && userMarker) {
        const newLatLng = new L.LatLng(userLat, userLng);
        userMarker.setLatLng(newLatLng);
        map.panTo(newLatLng);
        document.getElementById('msg').innerText = `現在地: ${userLat.toFixed(4)}, ${userLng.toFixed(4)}`;
    }
}

// GPSの起動
function initGPS() {
    if (navigator.geolocation) {
        navigator.geolocation.watchPosition(
            (position) => {
                userLat = position.coords.latitude;
                userLng = position.coords.longitude;
                updateUserPosition();
            },
            (error) => {
                document.getElementById('msg').innerText = "GPSエラー: " + error.message;
            },
            { enableHighAccuracy: true }
        );
    } else {
        alert("このブラウザはGPSに対応していません。");
    }
}

// モンスター生成
function spawnMonster(lat, lng, emoji, name) {
    const monsterIcon = L.divIcon({
        className: 'custom-icon',
        html: emoji,
        iconSize: [40, 40],
        iconAnchor: [20, 40]
    });

    const marker = L.marker([lat, lng], {icon: monsterIcon}).addTo(map);
    
    // クリックイベント：3D画面へ遷移
    marker.on('click', () => {
        // capture_3d.js の関数を呼び出す
        document.getElementById('map-container').style.display = 'none';
        document.getElementById('capture-container').style.display = 'block';
        startCapture({ emoji, name, marker }); // マーカー情報も渡して、捕獲成功時に消せるようにする
    });

    monsters.push(marker);
}

// マップの初期化を呼び出し、ゲーム開始！
console.log("【3. map_manager.js 実行開始】 initMap()を呼び出します。");
initMap();
