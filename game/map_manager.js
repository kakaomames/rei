// map_manager.js (現在地スポーン対応版)

// --- グローバル変数 (ここではモジュール内変数) ---
// GPS成功後にこの値が更新されますが、初期表示は東京のまま
let userLat = 35.6895; 
let userLng = 139.6917;
let map = null;
let userMarker = null;
const monsters = [];

// --- 外部から呼び出せるようにするための関数 ---
function moveFakeInternal(dLat, dLng) {
    userLat += dLat;
    userLng += dLng;
    updateUserPosition();
};
window.moveFake = moveFakeInternal; // グローバルに公開

// 逃げるボタンが押されたときの処理
function closeCaptureInternal() {
    document.getElementById('capture-container').style.display = 'none';
    document.getElementById('map-container').style.display = 'block';
    if(map) map.invalidateSize();
};
window.closeCapture = closeCaptureInternal; // グローバルに公開


// --- 初期化 ---
function initMap() {
    // 地図の初期化
    map = L.map('map-container').setView([userLat, userLng], 16);

    L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
        attribution: '© OpenStreetMap contributors'
    }).addTo(map);

    // ★ユーザーマーカーの定義 (デバッグのため標準ピンで定義します)
    userMarker = L.marker([userLat, userLng]).addTo(map)
        .bindPopup("現在地 (あなた)");
    
    document.getElementById('msg').innerText = "マップ準備完了。移動してモンスターを探そう！";
    
    // --- モンスターの初期スポーンを、現在地 (userLat/userLng) を基準に変更！ ---
    const baseLat = userLat; 
    const baseLng = userLng; 

    // 0.001 (約110m) を加減して、現在地の周辺にスポーンさせます
    spawnMonster(baseLat + 0.001, baseLng + 0.001, "🍌", "ワイルドバナナ");
    spawnMonster(baseLat - 0.001, baseLng + 0.001, "🦍", "怒れるゴリラ");
    spawnMonster(baseLat + 0.001, baseLng - 0.001, "🍫", "伝説のカカオ");
    
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
                // 成功時
                userLat = position.coords.latitude;
                userLng = position.coords.longitude;
                updateUserPosition();
            },
            (error) => {
                // 失敗時：エラーコードとメッセージをコンソールに出力
                console.error("Geolocation Error Code:", error.code); 
                console.error("Geolocation Error Message:", error.message);
                
                document.getElementById('msg').innerText = `GPSエラー: Code ${error.code} - ${error.message}`;
                
                if (error.code === 1) {
                    console.warn("位置情報が拒否されました。設定を確認してください。");
                }
            },
            { 
                enableHighAccuracy: true,
                timeout: 3000,
                maximumAge: 0   
            }
        );
    } else {
        alert("このブラウザはGPSに対応していません。");
    }
}

// モンスター生成
function spawnMonster(lat, lng, emoji, name) {
    
    // 標準ピンマーカーの作成 (L.divIconのCSS問題が解決するまでこちらを使用)
    const marker = L.marker([lat, lng]).addTo(map)
        .bindPopup(`${name} (${emoji})`); // ポップアップで名前を表示

    console.log(`[MONSTER] ${name} (${emoji}) を ${lat.toFixed(4)}, ${lng.toFixed(4)} にスポーン`);
    
    // クリックイベント：3D画面へ遷移
    marker.on('click', () => {
        // capture_3d.js の関数を window 経由で呼び出す
        if (window.startCapture) {
             document.getElementById('map-container').style.display = 'none';
             document.getElementById('capture-container').style.display = 'block';
             // window.を付けて呼び出し
             window.startCapture({ emoji, name, marker }); 
        } else {
             console.error("Error: window.startCapture is not defined. (capture_3d.jsの読み込みに失敗)");
        }
    });

    monsters.push(marker);
}

// マップの初期化を呼び出し、ゲーム開始！
console.log("【3. map_manager.js 実行開始】 initMap()を呼び出します。");
initMap();
