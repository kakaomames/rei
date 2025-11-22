// map_manager.js (JSON対応版)

// --- グローバル変数 ---
let userLat = 35.6895; 
let userLng = 139.6917;
let map = null;
let userMarker = null;
const monsters = []; // Leaflet Markerオブジェクトを格納
let monsterDataList = []; // ★JSONから読み込んだモンスターデータリストを格納★

// --- 外部から呼び出せるようにするための関数 ---
function moveFakeInternal(dLat, dLng) {
    userLat += dLat;
    userLng += dLng;
    updateUserPosition();
};
window.moveFake = moveFakeInternal; 

function closeCaptureInternal() {
    // UIの重なりを解消するため、マップ画面側のUIも表示/非表示を徹底
    document.getElementById('capture-container').style.display = 'none';
    document.getElementById('map-container').style.display = 'block';
    
    // マップ側のオーバーレイUIも表示に戻す
    const topUI = document.querySelector('.overlay-ui.top-ui');
    topUI.style.display = 'block';

    if(map) map.invalidateSize();
};
window.closeCapture = closeCaptureInternal; 

function logPositionsInternal() {
    console.log("=====================================");
    console.log("[LOG DUMP] 位置情報デバッグ出力");
    console.log(`[USER] 現在地: Lat=${userLat.toFixed(6)}, Lng=${userLng.toFixed(6)}`);
    console.log("-------------------------------------");

    if (monsters.length === 0) {
        console.log("[MONSTER] モンスターはまだスポーンしていません。");
    } else {
        monsters.forEach((marker, index) => {
            const latLng = marker.getLatLng();
            const monsterInfo = marker.options.monsterData || { name: '不明' }; // データを取得
            console.log(`[M #${index + 1}] ${monsterInfo.name} (${monsterInfo.emoji}): Lat=${latLng.lat.toFixed(6)}, Lng=${latLng.lng.toFixed(6)}`);
        });
    }
    console.log("=====================================");
}
window.logPositions = logPositionsInternal; 

// --- JSON読み込みと初期化を待機させるため、initMapをasync関数に変更 ---
async function initMap() {
    // ★JSONデータの読み込み★
    try {
        document.getElementById('msg').innerText = "モンスターデータを読み込み中...";
        const response = await fetch('./monsters.json');
        if (!response.ok) {
            throw new Error('monsters.jsonの読み込みに失敗しました');
        }
        monsterDataList = await response.json();
        
        if (monsterDataList.length === 0) {
             throw new Error('monsters.jsonにデータがありません');
        }
        document.getElementById('msg').innerText = "マップ準備完了。移動してモンスターを探そう！";

    } catch (error) {
        console.error("JSON Error:", error);
        document.getElementById('msg').innerText = `初期化エラー: ${error.message}`;
        return; // エラー時は処理を中断
    }

    // 地図の初期化 (JSON読み込み後に実行)
    map = L.map('map-container').setView([userLat, userLng], 16);

    L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
        attribution: '© OpenStreetMap contributors'
    }).addTo(map);

    // ユーザーマーカーの定義 (デバッグのため標準ピンで定義します)
    userMarker = L.marker([userLat, userLng]).addTo(map)
        .bindPopup("現在地 (あなた)");
    
    // モンスターの初期スポーンを、現在地 (userLat/userLng) を基準に変更！
    const baseLat = userLat; 
    const baseLng = userLng; 

    // 初回スポーン (ランダムに選ばれたモンスターを3体スポーン)
    spawnMonster(baseLat + 0.001, baseLng + 0.001);
    spawnMonster(baseLat - 0.001, baseLng + 0.001);
    spawnMonster(baseLat + 0.001, baseLng - 0.001);
    
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
    // ... (中略：GPS関数は変更なし) ...
    if (navigator.geolocation) {
        navigator.geolocation.watchPosition(
            (position) => {
                // 成功時
                userLat = position.coords.latitude;
                userLng = position.coords.longitude;
                updateUserPosition();
                // GPS取得に成功したら、モンスターの位置も現在地基準で更新
                updateMonsterPositions();
            },
            (error) => {
                // ... (エラー処理は省略) ...
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

// モンスター位置の更新 (GPSが更新されたときに、モンスターも現在地基準で更新するための関数)
function updateMonsterPositions() {
    // モンスターデータがない場合は実行しない
    if (monsterDataList.length === 0) return; 

    // 既存のマーカーを削除
    monsters.forEach(marker => {
        map.removeLayer(marker);
    });
    monsters.length = 0; // 配列を空にする

    // 現在地周辺に新しいモンスターを再生成
    const baseLat = userLat; 
    const baseLng = userLng; 

    // ランダムなオフセット (少しバラつかせる)
    const offset1 = Math.random() * 0.002 - 0.001; // -0.001 から 0.001
    const offset2 = Math.random() * 0.002 - 0.001; 
    const offset3 = Math.random() * 0.002 - 0.001; 

    spawnMonster(baseLat + 0.001 + offset1, baseLng + 0.001 + offset2);
    spawnMonster(baseLat - 0.001 + offset2, baseLng + 0.001 + offset3);
    spawnMonster(baseLat + 0.001 + offset3, baseLng - 0.001 + offset1);
}

// 重み付けされたランダムモンスター選択関数
function getRandomMonsterData() {
    let totalWeight = monsterDataList.reduce((sum, data) => sum + data.spawn_weight, 0);
    let randomNum = Math.random() * totalWeight;

    for (const data of monsterDataList) {
        randomNum -= data.spawn_weight;
        if (randomNum <= 0) {
            return data;
        }
    }
    return monsterDataList[0]; // フォールバック
}


// モンスター生成 (引数からデータが消え、ランダム選択に)
function spawnMonster(lat, lng) {
    
    const monsterData = getRandomMonsterData(); // ★ランダムにデータを取得★

    // L.divIconを使うため、カスタムアイコンを再定義
    const monsterIcon = L.divIcon({
        className: 'custom-icon monster-icon',
        html: monsterData.emoji,
        iconSize: [40, 40],
        iconAnchor: [20, 40]
    });
    
    // Leafletマーカーを作成し、オプションとしてJSONデータ全体を渡します
    const marker = L.marker([lat, lng], {
        icon: monsterIcon,
        monsterData: monsterData // ★ここにJSONデータを埋め込む★
    }).addTo(map)
      .bindPopup(`${monsterData.name} (${monsterData.emoji})`); 

    console.log(`[MONSTER] ${monsterData.name} (${monsterData.emoji}) を ${lat.toFixed(4)}, ${lng.toFixed(4)} にスポーン`);
    
    // クリックイベント：3D画面へ遷移
    marker.on('click', () => {
        // window.startCaptureが見えているかチェック
        if (window.startCapture) {
             console.log("[CLICK] 👾 モンスタークリック成功！3D画面へ遷移します。");
             document.getElementById('map-container').style.display = 'none';
             
             // マップ側のオーバーレイUIを非表示にする
             const topUI = document.querySelector('.overlay-ui.top-ui');
             topUI.style.display = 'none';
             
             document.getElementById('capture-container').style.display = 'block';
             
             // JSONデータ全体を渡す
             window.startCapture(monsterData, marker); 
        } else {
             console.error("[CLICK ERROR] window.startCapture is not defined. capture_3d.jsの関数が見えていません。");
        }
    });

    monsters.push(marker);
}

// マップの初期化を呼び出し、ゲーム開始！
console.log("【3. map_manager.js 実行開始】 initMap()を呼び出します。");
initMap();
