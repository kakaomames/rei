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

// ⬇️ GitHub Pagesのサブディレクトリをベースパスとして設定 ⬇️
const BASE_PATH = '/rei/ポケモンGO';
// ⬆️ BASE_PATH 終わり ⬆️

/**
 * パスに基づいてビューを切り替える
 * @param {string} path - History APIから渡された絶対パス (例: /rei/ポケモンGO/menu)
 */
function renderView(path) {
    // URL全体からBASE_PATH以降の論理パスを取得 (例: /menu, /capture, /)
    const logicalPath = path.startsWith(BASE_PATH) ? path.substring(BASE_PATH.length).replace(/\/$/, '') || '/' : path.replace(/\/$/, '');

    console.log(`現在の論理パス: ${logicalPath} にビューを切り替え`);
    
    // 全てのメインビューを非表示にする
    Object.values(views).forEach(el => el.classList.remove('view-active'));
    
    // サブメニュー内のコンテンツを非表示にする
    subMenuViews.forEach(el => el.classList.add('view-hidden'));
    menuOptions.classList.remove('view-hidden');
    
    // メインビューの切り替え (logicalPathで判定)
    if (views[logicalPath]) {
        views[logicalPath].classList.add('view-active');
        document.getElementById('ui-overlay').style.display = (logicalPath === '/' || logicalPath === '/capture') ? 'block' : 'none';

    } else if (logicalPath.startsWith('/menu')) {
        views['/menu'].classList.add('view-active');
        
        const subPath = logicalPath; 
        
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
        // 論理パスのルート ('/') に戻す
        window.navigate('/', false);
    }

    // マップ表示中はマップを更新
    if (logicalPath === '/') {
        setTimeout(() => map.invalidateSize(), 100);
    }
}

/**
 * History APIを使ってURLを移動し、ビューを切り替える
 * @param {string} logicalPath - 移動先の論理パス (例: /menu, /capture)
 * @param {boolean} pushState - history.pushStateを呼び出すか (デフォルト: true)
 */
window.navigate = function(logicalPath, pushState = true) {
    // ユーザーが渡す論理パスを正規化
    const normalizedLogicalPath = logicalPath.replace(/\/$/, '') || '/';
    
    // History APIに渡す絶対パスを作成: /rei/ポケモンGO + /menu
    const newAbsolutePath = BASE_PATH + normalizedLogicalPath;

    console.log(`論理パス: ${normalizedLogicalPath}`);
    console.log(`絶対URLパス: ${newAbsolutePath}`);
    
    if (pushState) {
        // history.pushStateでURLを変更
        history.pushState(null, '', newAbsolutePath);
        console.log(`history.pushState実行: ${newAbsolutePath}`);
    }
    
    // renderViewに絶対パスを渡す
    renderView(newAbsolutePath);
}

// ブラウザの戻る/進むボタンが押された時の処理
window.addEventListener('popstate', () => {
    // popstateイベントではブラウザがセットした絶対パスが使われる
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

    map.locate({ setView: true, maxZoom: 16, watch: true, enableHighAccuracy: true });
    map.on('locationfound', onLocationFound);
    map.on('locationerror', onLocationError);
    
    map.on('moveend', () => {
        const center = map.getCenter();
        loadGymsAndPokestops(center.lat, center.lng);
    });
}

function getMyIconUrl() {
    const urlParams = new URLSearchParams(window.location.search);
    const customUrl = urlParams.get('myicon');
    
    return customUrl || 'https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon.png';
}

function onLocationFound(e) {
    const lat = e.latitude;
    const lng = e.longitude;
    const radius = e.accuracy;

    currentLat = lat;
    currentLng = lng;

    const myIcon = L.icon({
        iconUrl: getMyIconUrl(),
        iconSize: [25, 41],
        iconAnchor: [12, 41],
        popupAnchor: [1, -34]
    });

    if (myLocationMarker) {
        myLocationMarker.remove();
        myLocationAccuracyCircle.remove();
    }

    myLocationMarker = L.marker([lat, lng], {icon: myIcon}).addTo(map)
        .bindPopup('あなたの現在地 (精度: 約' + Math.round(radius) + 'm)').openPopup();

    myLocationAccuracyCircle = L.circle([lat, lng], {
        radius: radius,
        color: '#1E90FF', 
        fillColor: '#1E90FF',
        fillOpacity: 0.2
    }).addTo(map);

    loadWildPokemon(lat, lng);
}

function onLocationError(e) {
    console.error('GPS位置情報取得に失敗しました:', e.message);
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
            if (!Array.isArray(data)) return;
            
            const validSpots = data.filter(item => typeof item === 'object' && item.pm_id);

            validSpots.forEach(spot => {
                const type = spot.pm_type; 
                const name = spot.pm_name;
                const spotLat = parseFloat(spot.pm_lat);
                const spotLng = parseFloat(spot.pm_lng);

                if (isNaN(spotLat) || isNaN(spotLng)) return;

                let iconUrl;
                let popupContent = `<b>${name}</b><br>住所: ${spot.pm_address}<br>`;

                iconUrl = (type === '3') 
                    ? 'https://unpkg.com/leaflet/dist/images/marker-icon-red.png'
                    : 'https://unpkg.com/leaflet/dist/images/marker-icon-blue.png';
                popupContent += (type === '3') ? 'タイプ: ジム 🥊' : 'タイプ: ポケストップ 🔵';

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

function calculateWeightedPokemonList(environmentKey) {
    if (!pokemonMasterData) return [];
    
    const { pokemonList, typeBoosts } = pokemonMasterData;
    const currentBoosts = typeBoosts[environmentKey] || typeBoosts.DEFAULT;
    
    const weightedList = [];

    pokemonList.forEach(pokemon => {
        let cumulativeBoost = 1.0;
        
        pokemon.types.forEach(type => {
            const boost = currentBoosts[type] || typeBoosts.DEFAULT[type] || 1.0;
            cumulativeBoost *= boost;
        });

        const finalWeight = 1.0 * cumulativeBoost;

        if (finalWeight > 0) {
            weightedList.push({
                pokemon: pokemon,
                weight: finalWeight
            });
        }
    });

    return weightedList;
}

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

// 野生ポケモンのロード
function loadWildPokemon(lat, lng) {
    wildPokemonLayer.clearLayers();
    wildPokemonLayer.addTo(map);

    if (!pokemonMasterData) return;
    
    const environmentKey = determineEnvironment(lat, lng);
    const weightedList = calculateWeightedPokemonList(environmentKey);
    
    console.log(`現在の環境: ${environmentKey}。重み付きリストサイズ: ${weightedList.length}`);

    const NUM_WILD_POKEMON = 5; 
    const RADIUS_KM = 0.5; 

    for (let i = 0; i < NUM_WILD_POKEMON; i++) {
        const selectedPokemon = getPokemonByWeightedRandom(weightedList);
        
        if (selectedPokemon) {
            const offset = (Math.random() - 0.5) * 2 * RADIUS_KM / 111; 
            const angle = Math.random() * 2 * Math.PI;
            
            const spawnLat = lat + offset * Math.cos(angle);
            const spawnLng = lng + offset * Math.sin(angle) / Math.cos(lat * Math.PI / 180);
            
            console.log(`出現ポケモン #${i+1}: ${selectedPokemon.japanese} (ID: ${selectedPokemon.id})`);
            
            const pokeId = selectedPokemon.id;
            // アセットパスは../assets/を維持
            const pikaIcon = L.icon({
                iconUrl: `../assets/button_icon_M${pokeId}.png`,
                iconSize: [40, 40],
                iconAnchor: [20, 20]
            });

            const pikaMarker = L.marker([spawnLat, spawnLng], {icon: pikaIcon}).addTo(wildPokemonLayer)
                .bindPopup(`野生の ${selectedPokemon.japanese} が出現！`);
                
            pikaMarker.on('click', () => {
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
        const response = await fetch('../pokemon.json');
        const masterData = await response.json();
        
        // デモデータ (変更なし)
        const userPokemon = [
            { id: 25, cp: 850 }, 
            { id: 1, cp: 420 },  
            { id: 4, cp: 710 },  
        ];
        
        const getPokemonInfo = (id) => masterData.pokemonList.find(p => p.id === id);

        let html = '<h3>所持ポケモン (' + userPokemon.length + '匹)</h3><div style="display: flex; flex-wrap: wrap; gap: 10px;">';
        
        userPokemon.forEach(p => {
            const info = getPokemonInfo(p.id);
            const name = info ? info.japanese : '不明なポケモン';
            
            // アセットパスは../assets/を維持
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
        const response = await fetch('../item.json');
        const itemData = await response.json();
        
        // デモデータ (変更なし)
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
                const count = userItemCounts[itemKey] || 0; 
                
                if (count > 0) {
                    // アセットパスは../assets/を維持
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
    
    // 初期化時、ブラウザの絶対パスを渡してビューを決定
    window.navigate(window.location.pathname, false);
});
