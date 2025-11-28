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

// マスターデータ (出現ロジック用)
let pokemonMasterData = null; 

// **********************************
// 2. ビュー切り替え (History API)
// **********************************

/**
 * パスに基づいてビューを切り替える
 * @param {string} path - 現在のURLパス
 */
function renderView(path) {
    console.log(`現在のパス: ${path} にビューを切り替え`);
    
    // 全てのメインビューを非表示にする
    Object.values(views).forEach(el => el.classList.remove('view-active'));
    
    // サブメニュー内のコンテンツを非表示にする
    subMenuViews.forEach(el => el.classList.add('view-hidden'));
    menuOptions.classList.remove('view-hidden');
    
    // メインビューの切り替え
    if (views[path]) {
        views[path].classList.add('view-active');
        document.getElementById('ui-overlay').style.display = (path === '/' || path === '/capture') ? 'block' : 'none';

    } else if (path.startsWith('/menu')) {
        views['/menu'].classList.add('view-active');
        
        const subPath = path; 
        
        if (subPath === '/menu' || subPath === '/menu/') {
            menuOptions.classList.remove('view-hidden');
        } else {
            menuOptions.classList.add('view-hidden');
            const targetEl = document.querySelector(`#sub-menu-container [data-path="${subPath}"]`);
            if (targetEl) {
                targetEl.classList.remove('view-hidden');
                if (subPath === '/menu/pokemon') loadPokemonList();
                if (subPath === '/menu/inventory') loadInventory();
            }
        }
    } else {
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
    const currentPath = window.location.pathname.replace(/\/$/, ''); 
    const newPath = path.replace(/\/$/, '');
    
    if (pushState) {
        history.pushState(null, '', newPath);
        console.log(`history.pushState実行: ${newPath}`);
    }
    
    renderView(newPath);
}

// ブラウザの戻る/進むボタンが押された時の処理
window.addEventListener('popstate', () => {
    window.navigate(window.location.pathname, false);
});


// **********************************
// 3. Leafletマップ初期化とGPS機能
// **********************************

/**
 * pokemon.jsonをプリロードする関数
 */
async function preloadMasterData() {
    try {
        // index.htmlの階層から一つ上の階層を参照 (e.g., /rei/)
        const response = await fetch('../pokemon.json'); 
        pokemonMasterData = await response.json();
        console.log(`Pokemon Master Data Preloaded: ${pokemonMasterData.comment}`);
    } catch (error) {
        console.error('マスターデータのプリロードに失敗しました:', error);
    }
}

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
    
    // マップが移動した時にポケストップAPIを呼び出す
    map.on('moveend', () => {
        const center = map.getCenter();
        loadGymsAndPokestops(center.lat, center.lng);
    });
}

/**
 * ユーザー指定のカスタムアイコンURLを取得する
 */
function getMyIconUrl() {
    const urlParams = new URLSearchParams(window.location.search);
    const customUrl = urlParams.get('myicon');
    
    // カスタムURLがなければLeafletのデフォルトを使用
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
// 4. データロードと出現ロジック
// **********************************

// ポケストップ/ジムのロード (API使用)
function loadGymsAndPokestops(lat, lng) {
    pokestopGymLayer.clearLayers();
    pokestopGymLayer.addTo(map);

    const apiUrl = `https://xeroxapp032.vercel.app/api/listget?lat=${lat}&lng=${lng}`;
    console.log(`APIコール (ポケストップ/ジム): ${apiUrl}`);

    fetch(apiUrl)
        .then(response => response.json())
        .then(data => {
            console.log(`取得データ数: ${data.length} 件`);

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
                    iconUrl = 'https://unpkg.com/leaflet/dist/images/marker-icon-red.png';
                    popupContent += 'タイプ: ジム 🥊';
                } else {
                    // ポケストップ（またはその他のスポット）の場合
                    iconUrl = 'https://unpkg.com/leaflet/dist/images/marker-icon-blue.png';
                    popupContent += 'タイプ: ポケストップ 🔵';
                }

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

/**
 * 緯度・経度に基づき、仮の環境タイプを決定する (デモ用)
 */
function determineEnvironment(lat, lng) {
    // 緯度が偶数ならPARK、奇数ならBUILDING、それ以外はDEFAULTとするデモロジック
    if (Math.floor(lat * 10) % 2 === 0) {
        return 'PARK';
    } else if (Math.floor(lng * 10) % 2 !== 0) {
        return 'BUILDING';
    } else {
        return 'DEFAULT';
    }
}

/**
 * 環境とタイプに基づき、出現ポケモンの重み付きリストを作成する
 */
function calculateWeightedPokemonList(environmentKey) {
    if (!pokemonMasterData) return [];
    
    const { pokemonList, typeBoosts } = pokemonMasterData;
    const currentBoosts = typeBoosts[environmentKey] || typeBoosts.DEFAULT;
    
    const weightedList = [];

    // ポケモンごとの重み計算
    pokemonList.forEach(pokemon => {
        let cumulativeBoost = 1.0;
        
        // ポケモンが持つ全てのタイプに対してブーストを適用
        pokemon.types.forEach(type => {
            const boost = currentBoosts[type] || typeBoosts.DEFAULT[type] || 1.0;
            cumulativeBoost *= boost;
        });

        const baseWeight = 1.0;
        const finalWeight = baseWeight * cumulativeBoost;

        if (finalWeight > 0) {
            weightedList.push({
                pokemon: pokemon,
                weight: finalWeight
            });
        }
    });

    return weightedList;
}

/**
 * 重み付きリストからランダムにポケモンを一つ抽選する
 */
function getPokemonByWeightedRandom(weightedList) {
    const totalWeight = weightedList.reduce((sum, item) => sum + item.weight, 0);
    let randomValue = Math.random() * totalWeight;

    for (const item of weightedList) {
        randomValue -= item.weight;
        if (randomValue <= 0) {
            return item.pokemon;
        }
    }
    return null;
}

// 野生ポケモンのロード (修正)
function loadWildPokemon(lat, lng) {
    wildPokemonLayer.clearLayers();
    wildPokemonLayer.addTo(map);

    if (!pokemonMasterData) {
        console.warn('マスターデータが未ロードのため野生ポケモンを生成できません。');
        return;
    }
    
    const environmentKey = determineEnvironment(lat, lng);
    const weightedList = calculateWeightedPokemonList(environmentKey);
    
    console.log(`現在の環境: ${environmentKey}。重み付きリストサイズ: ${weightedList.length}`);

    const NUM_WILD_POKEMON = 5; // 周辺に出現させるポケモンの数
    const RADIUS_KM = 0.5; // 出現範囲（0.5km）

    for (let i = 0; i < NUM_WILD_POKEMON; i++) {
        const selectedPokemon = getPokemonByWeightedRandom(weightedList);
        
        if (selectedPokemon) {
            // 現在地を中心に出現範囲内でランダムな座標を生成
            const offset = (Math.random() - 0.5) * 2 * RADIUS_KM / 111; // 1度あたり約111km
            const angle = Math.random() * 2 * Math.PI;
            
            const spawnLat = lat + offset * Math.cos(angle);
            const spawnLng = lng + offset * Math.sin(angle) / Math.cos(lat * Math.PI / 180);
            
            console.log(`出現ポケモン #${i+1}: ${selectedPokemon.japanese} (ID: ${selectedPokemon.id})`);
            
            // ポケモンアイコン (../assets/button_icon_M{p-id}.png を使用)
            const pokeId = selectedPokemon.id;
            const pikaIcon = L.icon({
                iconUrl: `../assets/button_icon_M${pokeId}.png`,
                iconSize: [40, 40],
                iconAnchor: [20, 20]
            });

            const pikaMarker = L.marker([spawnLat, spawnLng], {icon: pikaIcon}).addTo(wildPokemonLayer)
                .bindPopup(`野生の ${selectedPokemon.japanese} が出現！`);
                
            pikaMarker.on('click', () => {
                // ポケモンアイコンクリックで捕獲画面に遷移
                window.navigate('/capture');
            });
        }
    }
}

// ポケモンリストのロード (静的JSON使用)
async function loadPokemonList() {
    const container = document.getElementById('pokemon-list-content');
    container.innerHTML = '<p style="text-align: center;">...ロード中...</p>';
    
    try {
        // index.htmlの階層から一つ上の階層を参照
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
            
            // ポケモンアイコン (../assets/button_icon_M{p-id}.png を使用)
            const iconPath = `../assets/button_icon_M${p.id}.png`;
            
            html += `<div style="border: 1px solid #ccc; padding: 10px; border-radius: 5px; width: 100px; text-align: center;">
                        <img src="${iconPath}" alt="${name}" style="width: 50px; height: 50px;"><br>
                        <strong>${name}</strong><br>
                        CP: ${p.cp}
                    </div>`;
        });
        html += '</div>';

        container.innerHTML = html;
        console.log(`Pokemon Master Data Loaded: ${masterData.comment}`);
        
    } catch (error) {
        container.innerHTML = `<p style="color: red;">ポケモンデータのロードに失敗しました: ${error}</p>`;
    }
}

// 道具バッグのロード (静的JSON使用)
async function loadInventory() {
    const container = document.getElementById('inventory-content');
    container.innerHTML = '<p style="text-align: center;">...ロード中...</p>';
    
    try {
        // index.htmlの階層から一つ上の階層を参照
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
                    // アイテムアイコン (../assets/item/{id}.png を使用)
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
        console.log(`itemData keys: ${Object.keys(itemData).join(', ')}`);

    } catch (error) {
        container.innerHTML = `<p style="color: red;">アイテムデータのロードに失敗しました: ${error}</p>`;
    }
}


// **********************************
// 5. アプリケーション起動
// **********************************

document.addEventListener('DOMContentLoaded', async () => {
    await preloadMasterData();
    initMap();
    
    // アプリケーション起動時のURLに基づいてビューを初期化
    window.navigate(window.location.pathname, false);
});
