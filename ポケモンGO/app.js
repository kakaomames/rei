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
console.log(`views定義済み`);

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

// ローカルストレージのキー
const POKEMON_STORAGE_KEY = 'kakaomame_pokemons'; 
console.log(`POKEMON_STORAGE_KEY:${POKEMON_STORAGE_KEY}`);
const ITEM_STORAGE_KEY = 'kakaomame_inventory';
console.log(`ITEM_STORAGE_KEY:${ITEM_STORAGE_KEY}`);

// 現在捕獲対象のポケモン
let currentWildPokemon = null; 
console.log(`currentWildPokemon:${currentWildPokemon}`);

// **********************************
// 2. ビュー切り替え (History API)
// **********************************

// GitHub Pagesのサブディレクトリをベースパスとして設定
const BASE_PATH = '/rei/ポケモンGO';
console.log(`BASE_PATH:${BASE_PATH}`);

/**
 * パスに基づいてビューを切り替える
 * @param {string} path - History APIから渡された絶対パス (例: /rei/ポケモンGO/menu?myicon=...)
 */
function renderView(path) {
    // pathからクエリパラメータを分離
    const pathWithoutQuery = path.split('?')[0];
    
    // URL全体からBASE_PATH以降の論理パスを取得 (例: /menu, /capture, /)
    const logicalPath = pathWithoutQuery.startsWith(BASE_PATH) 
        ? pathWithoutQuery.substring(BASE_PATH.length).replace(/\/$/, '') || '/' 
        : pathWithoutQuery.replace(/\/$/, '');
    
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

        if (logicalPath === '/capture') {
            updateCaptureUI();
        }

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
 * History APIを使ってURLを移動し、ビューを切り替える (クエリパラメータを保持)
 * @param {string} logicalPath - 移動先の論理パス (例: /menu, /capture)
 * @param {boolean} pushState - history.pushStateを呼び出すか (デフォルト: true)
 */
window.navigate = function(logicalPath, pushState = true) {
    // ユーザーが渡す論理パスを正規化 (パス部分のみ)
    const pathPart = logicalPath.split('?')[0].replace(/\/$/, '') || '/';
    
    // 既存のクエリパラメータを抽出
    const currentQuery = window.location.search;
    console.log(`currentQuery:${currentQuery}`);
    
    // History APIに渡す新しい絶対URLパスを作成: BASE_PATH + pathPart + currentQuery
    const newAbsolutePath = BASE_PATH + pathPart + currentQuery;
    console.log(`newAbsolutePath:${newAbsolutePath}`);

    console.log(`論理パス: ${pathPart}`);
    console.log(`絶対URLパス: ${newAbsolutePath}`);
    
    if (pushState) {
        // history.pushStateでURLを変更
        history.pushState(null, '', newAbsolutePath);
        console.log(`history.pushState実行: ${newAbsolutePath}`);
    }
    
    // renderViewに絶対パスを渡す (renderView側でクエリパラメータは無視される)
    renderView(newAbsolutePath);
}

// ブラウザの戻る/進むボタンが押された時の処理
window.addEventListener('popstate', () => {
    // クエリパラメータも含めたURL全体をnavigateに渡す
    const fullPath = window.location.pathname + window.location.search;
    window.navigate(fullPath, false);
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
    console.log(`map:${map}`);

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
    
    // マップ初期化後、念のためサイズを再計算
    setTimeout(() => map.invalidateSize(), 100); 
}

function getMyIconUrl() {
    // クエリパラメータからmyiconの値を取得
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
        iconUrl: getMyIconUrl(), // クエリパラメータから取得
        iconSize: [25, 41],
        iconAnchor: [12, 41],
        popupAnchor: [1, -34]
    });

    if (myLocationMarker) {
        myLocationMarker.remove();
        myLocationAccuracyCircle.remove();
    }
    console.log(`currentLat:${currentLat}`);
    console.log(`currentLng:${currentLng}`);

    myLocationMarker = L.marker([lat, lng], {icon: myIcon}).addTo(map)
        .bindPopup('あなたの現在地 (精度: 約' + Math.round(radius) + 'm)').openPopup();
    console.log(`myLocationMarker:${myLocationMarker}`);

    myLocationAccuracyCircle = L.circle([lat, lng], {
        radius: radius,
        color: '#1E90FF', 
        fillColor: '#1E90FF',
        fillOpacity: 0.2
    }).addTo(map);
    console.log(`myLocationAccuracyCircle:${myLocationAccuracyCircle}`);

    loadWildPokemon(lat, lng);
}

function onLocationError(e) {
    console.error('GPS位置情報取得に失敗しました:', e.message);
    loadGymsAndPokestops(currentLat, currentLng);
}


// **********************************
// 4. データロードと出現ロジック
// **********************************

/**
 * ポケストップ/ジムのロード (API使用)
 */
function loadGymsAndPokestops(lat, lng) {
    pokestopGymLayer.clearLayers();
    pokestopGymLayer.addTo(map);

    const apiUrl = `https://xeroxapp032.vercel.app/api/listget?lat=${lat}&lng=${lng}`;
    console.log(`APIコール (ポケストップ/ジム): ${apiUrl}`);

    fetch(apiUrl)
        // response.json() の代わりに response.text() を使用
        .then(response => response.text())
        .then(textData => {
            console.log(`APIから取得した生のデータ: ${textData.substring(0, 100)}...`);
            
            // 正規表現を使って、[ と ] で囲まれたJSON配列部分を抽出
            const match = textData.match(/\[.*?\]/s); 
            
            if (!match) {
                console.error('APIレスポンスから有効なJSON配列を抽出できませんでした。');
                return;
            }
            
            let data;
            try {
                // 抽出した文字列をJSONとしてパース
                data = JSON.parse(match[0]);
            } catch (e) {
                console.error('抽出した文字列のJSONパースに失敗しました:', e);
                console.log(`抽出された文字列の先頭: ${match[0].substring(0, 100)}...`);
                return;
            }

            console.log(`取得データ数: ${data.length} 件`);
            if (!Array.isArray(data)) return;
            
            const validSpots = data.filter(item => typeof item === 'object' && item.pm_id);

            validSpots.forEach(spot => {
                const type = spot.pm_type; // '2'がポケストップ、'3'がジム
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

                const marker = L.marker([spotLat, spotLng], { icon: customIcon })
                    .bindPopup(popupContent)
                    .addTo(pokestopGymLayer);
                    
                // ポケストップ(type === '2')にクリックイベントを追加
                if (type === '2') { 
                    marker.on('click', () => {
                        handlePokestopSpin(marker, name);
                    });
                }
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
        console.log(`ポケモン:${pokemon.japanese}, 重み:${finalWeight}`);

        if (finalWeight > 0) {
            weightedList.push({
                pokemon: pokemon,
                weight: finalWeight
            });
        }
    });
    console.log(`weightedList.length:${weightedList.length}`);
    return weightedList;
}

function getPokemonByWeightedRandom(weightedList) {
    const totalWeight = weightedList.reduce((sum, item) => sum + item.weight, 0);
    console.log(`totalWeight:${totalWeight}`);
    let randomValue = Math.random() * totalWeight;
    console.log(`randomValue:${randomValue}`);

    for (const item of weightedList) {
        randomValue -= item.weight;
        if (randomValue <= 0) {
            console.log(`選択されたポケモン:${item.pokemon.japanese}`);
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
                // クリックされたポケモンの情報を currentWildPokemon に保存
                currentWildPokemon = selectedPokemon;
                console.log(`捕獲対象を設定: ${currentWildPokemon.japanese}`);
                
                // 捕獲画面へ遷移
                window.navigate('/capture');
            });
        }
    }
}

// ポケモンリストのロード (ローカルストレージ使用)
async function loadPokemonList() {
    const container = document.getElementById('pokemon-list-content');
    container.innerHTML = '<p style="text-align: center;">...ロード中...</p>';
    
    try {
        const response = await fetch('../pokemon.json');
        const masterData = await response.json();
        
        // ローカルストレージからデータをロード
        const userPokemons = loadUserPokemons();
        
        const getPokemonInfo = (id) => masterData.pokemonList.find(p => p.id === id);

        let html = '<h3>所持ポケモン (' + userPokemons.length + '匹)</h3><div style="display: flex; justify-content: center; flex-wrap: wrap; gap: 10px;">';
        
        userPokemons.forEach(p => {
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
        console.log(`ローカルストレージからポケモンデータ ${userPokemons.length} 匹をロードしました。`);
        
    } catch (error) {
        container.innerHTML = `<p style="color: red;">ポケモンデータのロードに失敗しました: ${error}</p>`;
    }
}

// 道具バッグのロード (ローカルストレージ使用)
async function loadInventory() {
    const container = document.getElementById('inventory-content');
    container.innerHTML = '<p style="text-align: center;">...ロード中...</p>';
    
    try {
        const response = await fetch('../item.json');
        const itemData = await response.json();
        
        // ローカルストレージから在庫数をロード
        const userItemCounts = loadInventoryCounts(); 
        console.log(`userItemCounts:${Object.keys(userItemCounts).length}種類`);

        let html = '<h3>バッグの中身</h3><ul>';
        
        // 道具のカテゴリーを走査
        for (const categoryKey in itemData) {
            html += `<h4>${categoryKey}</h4>`;
            // 道具アイテムを走査
            for (const itemKey in itemData[categoryKey]) {
                const item = itemData[categoryKey][itemKey];
                // ローカルストレージの在庫数を使用
                const count = userItemCounts[itemKey] || 0; 
                
                if (count >= 0) { // 在庫が0以上なら表示する
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
        console.log(`アイテム在庫データロード完了`);

    } catch (error) {
        container.innerHTML = `<p style="color: red;">アイテムデータのロードに失敗しました: ${error}</p>`;
    }
}


// **********************************
// 5. 捕獲画面とロジック
// **********************************

/**
 * 捕獲画面の情報を更新する
 */
function updateCaptureUI() {
    const infoDiv = document.getElementById('capture-target-info');

    if (!currentWildPokemon) {
        infoDiv.innerHTML = '<p style="color: red;">エラー: 捕獲対象のポケモンがいません。</p>';
        console.log(`エラー: 捕獲対象がいません`);
        return;
    }

    const pokeId = currentWildPokemon.id;
    const name = currentWildPokemon.japanese;
    const iconPath = `../assets/button_icon_M${pokeId}.png`;
    console.log(`捕獲UI更新対象:${name}`);

    infoDiv.innerHTML = `
        <img src="${iconPath}" alt="${name}" style="width: 80px; height: 80px;"><br>
        <h2>${name}</h2>
        <p>野生の ${name} が現れた！</p>
    `;

    // ボール選択UIをリセット（捕獲判定後に再表示するため）
    const ballSelection = document.getElementById('ball-selection');
    ballSelection.style.display = 'flex';
}

/**
 * 捕獲判定ロジックを実行する
 * @param {string} itemKey - 使用するボールのキー (e.g., 'POKEBALL', 'SUPERBALL')
 */
function attemptCapture(itemKey) {
    if (!currentWildPokemon) return;
    
    // ⬇️ 道具の在庫確認と消費 ⬇️
    let inventoryCounts = loadInventoryCounts();
    const currentCount = inventoryCounts[itemKey] || 0;
    console.log(`${itemKey}の現在在庫:${currentCount}`); 

    if (currentCount <= 0) {
        const infoDiv = document.getElementById('capture-target-info');
        infoDiv.innerHTML = `
            <h2 style="color: orange;">在庫がありません！ 😭</h2>
            <p>${itemKey === 'POKEBALL' ? 'モンスターボール' : 'スーパーボール'}がありません。</p>
            <button onclick="window.parent.navigate('/');" class="back-to-menu-button" style="position: static;">マップに戻る</button>
        `;
        console.log(`在庫切れのため捕獲失敗`);
        // ボール選択UIを非表示
        document.getElementById('ball-selection').style.display = 'none';
        return; 
    }

    // 在庫を1減らす
    inventoryCounts[itemKey] = currentCount - 1;
    saveInventoryCounts(inventoryCounts);
    console.log(`${itemKey}を消費しました。残り:${inventoryCounts[itemKey]}`); 
    // ⬆️ 道具の在庫確認と消費終わり ⬆️

    console.log(`捕獲開始: ${currentWildPokemon.japanese} に ${itemKey} を使用`);
    
    // ボールUIを非表示
    document.getElementById('ball-selection').style.display = 'none';

    const infoDiv = document.getElementById('capture-target-info');
    infoDiv.innerHTML = `<h2 style="color: blue;">${itemKey === 'SUPERBALL' ? 'スーパーボール' : 'モンスターボール'}が飛んでいった！...</h2>`;

    // 簡易的な捕獲成功率 (デモ)
    let baseCatchRate = 0.4; 
    if (itemKey === 'SUPERBALL') {
        baseCatchRate = 0.6;
    }
    console.log(`baseCatchRate:${baseCatchRate}`);

    // 捕獲判定
    const isCaught = Math.random() < baseCatchRate;
    console.log(`isCaught:${isCaught}`);
    
    setTimeout(() => {
        if (isCaught) {
            
            // 捕獲したポケモンをローカルストレージに保存
            const userPokemons = loadUserPokemons();
            const newPokemon = { 
                id: currentWildPokemon.id, 
                cp: Math.floor(Math.random() * 1000) + 10, // CPをランダム生成
                nickname: currentWildPokemon.japanese 
            };
            userPokemons.push(newPokemon);
            saveUserPokemons(userPokemons);
            
            console.log(`新しいポケモンをリストに追加: ${newPokemon.nickname} (CP:${newPokemon.cp})`); 
            
            infoDiv.innerHTML = `
                <img src="../assets/item/1.png" alt="モンスターボール" class="shake-animation" style="width: 80px;">
                <h2 style="color: green;">🎉 ゲットだぜ！🎉</h2>
                <p>${currentWildPokemon.japanese} を捕まえた！</p>
                <button onclick="window.parent.navigate('/');" class="back-to-menu-button" style="position: static;">マップに戻る</button>
            `;
            
            currentWildPokemon = null; // 捕獲完了
        } else {
            infoDiv.innerHTML = `
                <img src="../assets/button_icon_M${currentWildPokemon.id}.png" alt="ポケモン" style="width: 80px;">
                <h2 style="color: red;">逃げられた... 😥</h2>
                <p>野生の ${currentWildPokemon.japanese} はボールから飛び出してしまった！</p>
                <button onclick="window.parent.navigate('/');" class="back-to-menu-button" style="position: static;">マップに戻る</button>
            `;
        }
    }, 3000); // 3秒後に結果を表示
}

// **********************************
// 6. アプリケーション起動 (修正版)
// **********************************

/**
 * アプリケーションの初期起動処理
 */
function startApp() {
    console.log("--- app.js 起動処理開始 (即時実行) ---"); 

    await preloadMasterData();
    
    // 道具在庫の初期化
    initializeInventory();
    
    initMap(); // Leafletマップを初期化
    
    // 初期化時、ブラウザの絶対パスを渡してビューを決定
    const initialPath = window.location.pathname + window.location.search;
    window.navigate(initialPath, false);
    
    console.log("--- app.js 起動処理完了 ---"); 
}
// ページロード時に即座に実行する (DOMの準備はHTMLの遅延ロードで担保されているため)
startApp();
});


// **********************************
// 7. ローカルストレージ管理
// **********************************

/**
 * ローカルストレージから所持ポケモンリストを読み込む
 * @returns {Array<Object>} 所持ポケモンの配列
 */
function loadUserPokemons() {
    try {
        const storedData = localStorage.getItem(POKEMON_STORAGE_KEY);
        // JSONをパースし、失敗した場合は空の配列を返す
        return storedData ? JSON.parse(storedData) : [];
    } catch (error) {
        console.error('ローカルストレージからの読み込みに失敗:', error);
        return [];
    }
}
console.log(`loadUserPokemons関数定義済み`);

/**
 * 所持ポケモンリストをローカルストレージに保存する
 * @param {Array<Object>} pokemons - 保存する所持ポケモンの配列
 */
function saveUserPokemons(pokemons) {
    try {
        localStorage.setItem(POKEMON_STORAGE_KEY, JSON.stringify(pokemons));
        console.log(`所持ポケモンリストを保存しました。総数: ${pokemons.length}`);
    } catch (error) {
        console.error('ローカルストレージへの書き込みに失敗:', error);
    }
}
console.log(`saveUserPokemons関数定義済み`);

/**
 * ローカルストレージから道具在庫を読み込む
 * @returns {Object} 道具キーと数のマップ (例: { "POKEBALL": 50, "SUPERBALL": 20 })
 */
function loadInventoryCounts() {
    try {
        const storedData = localStorage.getItem(ITEM_STORAGE_KEY);
        // JSONをパースし、失敗した場合は空のオブジェクトを返す
        return storedData ? JSON.parse(storedData) : {};
    } catch (error) {
        console.error('道具在庫の読み込みに失敗:', error);
        return {};
    }
}
console.log(`loadInventoryCounts関数定義済み`);

/**
 * 道具在庫をローカルストレージに保存する
 * @param {Object} counts - 保存する道具キーと数のマップ
 */
function saveInventoryCounts(counts) {
    try {
        localStorage.setItem(ITEM_STORAGE_KEY, JSON.stringify(counts));
        console.log(`道具在庫を保存しました。`);
    } catch (error) {
        console.error('道具在庫の書き込みに失敗:', error);
    }
}
console.log(`saveInventoryCounts関数定義済み`);

/**
 * 道具在庫が存在しない場合、初期在庫を設定する
 */
function initializeInventory() {
    const counts = loadInventoryCounts();
    if (Object.keys(counts).length === 0) {
        // 在庫がない場合、初期値を設定
        const initialCounts = {
            "POKEBALL": 50,
            "SUPERBALL": 20,
            "POTION": 15, 
            "REVIVE": 5
        };
        saveInventoryCounts(initialCounts);
        console.log("初期道具在庫を設定しました。"); 
    }
}
console.log(`initializeInventory関数定義済み`);


// **********************************
// 8. ポケストップ/ジム操作ロジック
// **********************************

/**
 * ポケストップを回したときのランダムな道具取得ロジック
 * @returns {Object} 取得した道具キーと数のマップ (例: { "POKEBALL": 3, "SUPERBALL": 1 })
 */
function getPokestopRewards() {
    const rewards = {};
    // ポケモンボール、スーパーボール、キズぐすり、げんきのかけらを候補とする
    const possibleItems = ["POKEBALL", "POKEBALL", "POKEBALL", "SUPERBALL", "POTION", "REVIVE"];
    const numItems = Math.floor(Math.random() * 4) + 2; // 2〜5個の道具を取得

    console.log(`ポケストップ報酬: 道具を ${numItems} 個抽選します`); 

    for (let i = 0; i < numItems; i++) {
        const itemKey = possibleItems[Math.floor(Math.random() * possibleItems.length)];
        rewards[itemKey] = (rewards[itemKey] || 0) + 1;
    }
    
    const rewardsJson = JSON.stringify(rewards);
    console.log(`獲得した報酬:${rewardsJson}`); 
    return rewards;
}
console.log(`getPokestopRewards関数定義済み`);

/**
 * 道具の報酬を在庫に追加し、ローカルストレージに保存する
 * @param {Object} rewards - 獲得した道具キーと数のマップ
 * @returns {Object} 更新後の在庫マップ
 */
function addRewardsToInventory(rewards) {
    let inventoryCounts = loadInventoryCounts();
    let updatedCounts = 0;

    for (const itemKey in rewards) {
        const count = rewards[itemKey];
        // 既存の在庫に加算
        inventoryCounts[itemKey] = (inventoryCounts[itemKey] || 0) + count;
        updatedCounts += count;
    }
    
    saveInventoryCounts(inventoryCounts);
    console.log(`道具在庫に ${updatedCounts} 個のアイテムが追加されました。`); 
    return inventoryCounts;
}
console.log(`addRewardsToInventory関数定義済み`);

/**
 * ポケストップをタップしたときの処理
 * @param {L.Marker} marker - タップされたポケストップのマーカーオブジェクト
 * @param {string} name - ポケストップの名前
 */
function handlePokestopSpin(marker, name) {
    // 既にクールタイムでロックされている場合は無視
    if (marker.options.isLocked) return; 
    
    // 報酬を取得し、在庫に追加
    const rewards = getPokestopRewards();
    addRewardsToInventory(rewards);
    
    // ポップアップを更新して報酬を表示
    let rewardsHtml = '';
    for (const itemKey in rewards) {
        rewardsHtml += `<li>${itemKey} x ${rewards[itemKey]}</li>`;
    }

    const newPopupContent = `
        <b>${name}</b><br>
        <p style="color: green;">アイテムゲット！🎉</p>
        <ul style="padding-left: 15px;">${rewardsHtml}</ul>
        <small style="color: red;">(クールタイム中)</small>
    `;
    
    marker.setPopupContent(newPopupContent).openPopup();

    // クールタイム（60秒間）を設定
    marker.options.isLocked = true;
    console.log(`ポケストップ ${name} をロックしました。`); 

    setTimeout(() => {
        marker.options.isLocked = false;
        // ポップアップを元の表示に戻す
        marker.setPopupContent(`<b>${name}</b><br>タイプ: ポケストップ 🔵`);
        console.log(`ポケストップ ${name} のロックを解除しました。`); 
    }, 60000); // 60秒のクールタイム
}
console.log(`handlePokestopSpin関数定義済み`);
