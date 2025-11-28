// app.js

// **********************************
// 1. グローバル変数と初期設定
// **********************************

// 全てのビュー要素
const views = {
    '/': document.getElementById('map'),
    '/capture': document.getElementById('capture-ui'),
    '/menu': document.getElementById('main-menu'),
};
const subMenuViews = document.querySelectorAll('#sub-menu-container .sub-menu-content');
const menuOptions = document.getElementById('menu-options');


// 現在のプレイヤーの位置情報 (初期値: 東京駅付近)
let currentLat = 35.681236;
let currentLng = 139.767125;
let myLocationMarker; // プレイヤーの現在地マーカー
let myLocationAccuracyCircle; // GPSの精度を示す円

// Leafletマップオブジェクト
let map;

// マーカーのレイヤーグループ
let pokestopGymLayer = L.layerGroup(); 
let wildPokemonLayer = L.layerGroup();

// **********************************
// 2. ビュー切り替え (History API)
// **********************************

/**
 * パスに基づいてビューを切り替える
 * @param {string} path - 現在のURLパス
 */
function renderView(path) {
    console.log(`現在のパス: ${path} にビューを切り替え`); // 値を出力
    
    // 全てのメインビューを非表示にする
    Object.values(views).forEach(el => el.classList.remove('view-active'));
    
    // サブメニュー内のコンテンツを非表示にする
    subMenuViews.forEach(el => el.classList.add('view-hidden'));
    menuOptions.classList.remove('view-hidden');
    
    // メインビューの切り替え
    if (views[path]) {
        // マップ、捕獲、メニューなどのルートパスの場合
        views[path].classList.add('view-active');
        document.getElementById('ui-overlay').style.display = (path === '/' || path === '/capture') ? 'block' : 'none';

    } else if (path.startsWith('/menu')) {
        // メニュー画面内のサブメニューの場合
        views['/menu'].classList.add('view-active');
        
        // サブメニューのパスを取得 (例: /menu/pokemon, /menu/inventory)
        const subPath = path; 
        
        if (subPath === '/menu' || subPath === '/menu/') {
            // メインメニューオプション表示
            menuOptions.classList.remove('view-hidden');
        } else {
            // サブメニューコンテンツ表示
            menuOptions.classList.add('view-hidden');
            // data-path属性でビュー要素を検索
            const targetEl = document.querySelector(`#sub-menu-container [data-path="${subPath}"]`);
            if (targetEl) {
                targetEl.classList.remove('view-hidden');
                // コンテンツの読み込み (例: ポケモンリスト)
                if (subPath === '/menu/pokemon') loadPokemonList();
                if (subPath === '/menu/inventory') loadInventory();
            }
        }
    } else {
        // 該当するビューがない場合、マップに戻す
        views['/'].classList.add('view-active');
        window.navigate('/', false);
    }

    // マップ表示中はマップを更新
    if (path === '/') {
        setTimeout(() => map.invalidateSize(), 100);
    }
}

/**
 * History APIを使ってURLを移動し、ビューを切り替える
 * @param {string} path - 移動先のパス
 * @param {boolean} pushState - history.pushStateを呼び出すか (デフォルト: true)
 */
window.navigate = function(path, pushState = true) {
    // 末尾のスラッシュを削除して正規化
    const currentPath = window.location.pathname.replace(/\/$/, ''); 
    const newPath = path.replace(/\/$/, '');
    
    if (pushState) {
        // history.pushStateでURLを変更
        history.pushState(null, '', newPath);
        console.log(`history.pushState実行: ${newPath}`); // 値を出力
    }
    
    renderView(newPath);
}

// ブラウザの戻る/進むボタンが押された時の処理
window.addEventListener('popstate', () => {
    // popstateイベントでは、pushStateは不要 (falseを渡す)
    window.navigate(window.location.pathname, false);
});


// **********************************
// 3. Leafletマップ初期化とGPS機能
// **********************************

function initMap() {
    map = L.map('map').setView([currentLat, currentLng], 16);

    L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
        attribution: '© OpenStreetMap contributors'
    }).addTo(map);

    // GPSトラッキングを開始
    map.locate({ setView: true, maxZoom: 16, watch: true, enableHighAccuracy: true });

    // 成功時: 現在地が更新された時の処理
    map.on('locationfound', onLocationFound);
    // 失敗時: 現在地取得に失敗した時の処理
    map.on('locationerror', onLocationError);
    
    // マップが移動した時にポケストップAPIを呼び出す (デモ)
    map.on('moveend', () => {
        const center = map.getCenter();
        loadGymsAndPokestops(center.lat, center.lng);
        // 野生ポケモンは現在地ベースでロードするため、マップ移動では実行しない
    });
}

/**
 * ユーザー指定のカスタムアイコンURLを取得する
 */
function getMyIconUrl() {
    const urlParams = new URLSearchParams(window.location.search);
    const customUrl = urlParams.get('myicon');
    
    // カスタムURLがあればそれを、なければLeafletのデフォルトを使用
    return customUrl || 'https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon.png';
}

function onLocationFound(e) {
    const lat = e.latitude;
    const lng = e.longitude;
    const radius = e.accuracy;

    currentLat = lat;
    currentLng = lng;

    // 現在地マーカーのカスタムアイコン
    const myIcon = L.icon({
        iconUrl: getMyIconUrl(),
        iconSize: [25, 41],
        iconAnchor: [12, 41],
        popupAnchor: [1, -34]
    });

    // 既存のマーカーと円を削除
    if (myLocationMarker) {
        myLocationMarker.remove();
        myLocationAccuracyCircle.remove();
    }

    // 新しいマーカーと円を追加
    myLocationMarker = L.marker([lat, lng], {icon: myIcon}).addTo(map)
        .bindPopup('あなたの現在地 (精度: 約' + Math.round(radius) + 'm)').openPopup();

    myLocationAccuracyCircle = L.circle([lat, lng], {
        radius: radius,
        color: '#1E90FF', // 青
        fillColor: '#1E90FF',
        fillOpacity: 0.2
    }).addTo(map);

    // 現在地が更新されたら、その付近のポケモンをロード
    loadWildPokemon(lat, lng);
}

function onLocationError(e) {
    console.error('GPS位置情報取得に失敗しました:', e.message);
    // 失敗しても初期位置でポケストップはロード
    loadGymsAndPokestops(currentLat, currentLng);
}


// **********************************
// 4. データロード関数
// **********************************

// ポケストップ/ジムのロード (API使用)
function loadGymsAndPokestops(lat, lng) {
    // 既存のマーカーをクリア
    pokestopGymLayer.clearLayers();
    pokestopGymLayer.addTo(map);

    const apiUrl = `https://xeroxapp032.vercel.app/api/listget?lat=${lat}&lng=${lng}`;
    console.log(`APIコール (ポケストップ/ジム): ${apiUrl}`); // 値を出力

    fetch(apiUrl)
        .then(response => response.json())
        .then(data => {
            console.log(`取得データ数: ${data.length} 件`); // 値を出力

            if (!Array.isArray(data)) {
                console.error('APIレスポンスが配列ではありません。');
                return;
            }
            
            const validSpots = data.filter(item => typeof item === 'object' && item.pm_id);

            validSpots.forEach(spot => {
                const type = spot.pm_type; // '2'がポケストップ、'3'がジムと仮定
                const name = spot.pm_name;
                const spotLat = parseFloat(spot.pm_lat);
                const spotLng = parseFloat(spot.pm_lng);

                if (isNaN(spotLat) || isNaN(spotLng)) {
                    console.warn(`無効な座標データ: ${name}`);
                    return;
                }

                let iconUrl;
                let popupContent = `<b>${name}</b><br>住所: ${spot.pm_address}<br>`;

                if (type === '3') {
                    // ジムの場合
                    iconUrl = 'https://unpkg.com/leaflet/dist/images/marker-icon-red.png'; // 赤色のマーカー（ジムの代替）
                    popupContent += 'タイプ: ジム 🥊';
                } else {
                    // ポケストップ（またはその他のスポット）の場合
                    iconUrl = 'https://unpkg.com/leaflet/dist/images/marker-icon-blue.png'; // 青色のマーカー（ポケストップの代替）
                    popupContent += 'タイプ: ポケストップ 🔵';
                }

                // Leafletのカスタムアイコン
                const customIcon = L.icon({
                    iconUrl: iconUrl,
                    iconSize: [25, 41],
                    iconAnchor: [12, 41],
                    popupAnchor: [1, -34]
                });

                L.marker([spotLat, spotLng], { icon: customIcon })
                    .bindPopup(popupContent)
                    .addTo(pokestopGymLayer);
            });
        })
        .catch(error => {
            console.error('ポケストップ/ジムデータの取得中にエラーが発生しました:', error);
        });
}

// 野生ポケモンのロード
function loadWildPokemon(lat, lng) {
    wildPokemonLayer.clearLayers();
    wildPokemonLayer.addTo(map);
    
    console.log(`野生ポケモンを現在地付近にロード (lat:${lat}, lng:${lng})`); // 値を出力
    
    // デモ: 現在地から少し離れた場所にピカチュウを配置
    const pikaId = 25; 
    const pikaLat = lat + 0.0005;
    const pikaLng = lng - 0.0005;
    
    // ポケモンアイコン (assets/button_icon_M{p-id}.png を使用)
    const pikaIcon = L.icon({
        iconUrl: `../assets/button_icon_M${pikaId}.png`,
        iconSize: [40, 40],
        iconAnchor: [20, 20]
    });

    const pikaMarker = L.marker([pikaLat, pikaLng], {icon: pikaIcon}).addTo(wildPokemonLayer)
        .bindPopup('野生のピカチュウ！');
        
    pikaMarker.on('click', () => {
        // ポケモンアイコンクリックで捕獲画面に遷移
        window.navigate('/capture');
    });
}

// ポケモンリストのロード (静的JSON使用)
async function loadPokemonList() {
    const container = document.getElementById('pokemon-list-content');
    container.innerHTML = '<p style="text-align: center;">...ロード中...</p>';
    
    try {
        const response = await fetch('../pokemon.json');
        const masterData = await response.json();
        
        // ユーザーが捕まえたポケモンデータ (デモ)
        const userPokemon = [
            { id: 25, cp: 850 }, // ピカチュウ
            { id: 1, cp: 420 },  // フシギダネ
            { id: 4, cp: 710 },  // ヒトカゲ
        ];
        
        const getPokemonInfo = (id) => masterData.pokemonList.find(p => p.id === id);


        let html = '<h3>所持ポケモン (' + userPokemon.length + '匹)</h3><div style="display: flex; flex-wrap: wrap; gap: 10px;">';
        
        userPokemon.forEach(p => {
            const info = getPokemonInfo(p.id);
            const name = info ? info.japanese : '不明なポケモン';
            
            // ポケモンアイコン (assets/button_icon_M{p-id}.png を使用)
            const iconPath = `../assets/button_icon_M${p.id}.png`;
            
            html += `<div style="border: 1px solid #ccc; padding: 10px; border-radius: 5px; width: 100px; text-align: center;">
                        <img src="${iconPath}" alt="${name}" style="width: 50px; height: 50px;"><br>
                        <strong>${name}</strong><br>
                        CP: ${p.cp}
                    </div>`;
        });
        html += '</div>';

        container.innerHTML = html;
        console.log(`Pokemon Master Data Loaded: ${masterData.comment}`); // 値を出力
        
    } catch (error) {
        container.innerHTML = `<p style="color: red;">ポケモンデータのロードに失敗しました: ${error}</p>`;
    }
}

// 道具バッグのロード (静的JSON使用)
async function loadInventory() {
    const container = document.getElementById('inventory-content');
    container.innerHTML = '<p style="text-align: center;">...ロード中...</p>';
    
    try {
        const response = await fetch('../item.json');
        const itemData = await response.json();
        
        // ユーザーの所持アイテムデータ (デモ)
        const userItemCounts = {
            "POKEBALL": 50,
            "SUPERBALL": 20,
            "POTION": 15,
            "REVIVE": 5
        };

        let html = '<h3>バッグの中身</h3><ul>';
        
        for (const categoryKey in itemData) {
            html += `<h4>${categoryKey}</h4>`;
            for (const itemKey in itemData[categoryKey]) {
                const item = itemData[categoryKey][itemKey];
                const count = userItemCounts[itemKey] || 0; // 所持数を取得
                
                if (count > 0) {
                    // アイテムアイコン (assets/item/{id}.png を使用)
                    const iconPath = `../assets/item/${item.id}.png`;
                    
                    html += `<li style="margin-bottom: 8px; display: flex; align-items: center;">
                                <img src="${iconPath}" alt="${item.japanese}" style="width: 30px; height: 30px; margin-right: 10px;">
                                <div>
                                    <strong>${item.japanese}</strong>: ${count} 個 <br>
                                    <small>(${item.description_ja})</small>
                                </div>
                            </li>`;
                }
            }
        }
        html += '</ul>';

        container.innerHTML = html;
        console.log(`itemData keys: ${Object.keys(itemData).join(', ')}`); // 値を出力

    } catch (error) {
        container.innerHTML = `<p style="color: red;">アイテムデータのロードに失敗しました: ${error}</p>`;
    }
}


// **********************************
// 5. アプリケーション起動
// **********************************

document.addEventListener('DOMContentLoaded', () => {
    initMap();
    
    // アプリケーション起動時のURLに基づいてビューを初期化
    window.navigate(window.location.pathname, false);
});
