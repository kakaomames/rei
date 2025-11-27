// pokemongo-UI.js

import { updateSetting, getCurrentTheme } from './settings.js';
import { getInventory, ITEMS } from './item.js'; // ⭐ NEW: item.jsからインポート ⭐

// ポケモンの捕獲ベース確率 (仮設定)
const BASE_CATCH_RATE = 0.5;

// ローカルストレージのキー
const CATCHED_POKEMON_KEY = 'pokemon_go_caught_box';

// ===========================================
// ローカルストレージ (ボックス) 管理関数
// ===========================================

/**
 * ローカルストレージから捕獲済みポケモンリストを取得する
 */
function getPokemonBox() {
    try {
        const storedData = localStorage.getItem(CATCHED_POKEMON_KEY);
        return storedData ? JSON.parse(storedData) : [];
    } catch (e) {
        console.error("[STORAGE ERROR] ローカルストレージからの読み込みに失敗しました。", e);
        return [];
    }
}

/**
 * 捕獲したポケモンをローカルストレージに保存する
 */
function savePokemonToBox(pokemonData) {
    const box = getPokemonBox();
    box.push(pokemonData);
    try {
        localStorage.setItem(CATCHED_POKEMON_KEY, JSON.stringify(box));
        console.log(`[STORAGE] ${pokemonData.japanese} (CP:${pokemonData.cp}) をボックスに保存しました。`);
    } catch (e) {
        console.error("[STORAGE ERROR] ローカルストレージへの書き込みに失敗しました。", e);
    }
}

// ===========================================
// メインUI関数 (捕獲モード)
// ===========================================

/**
 * 捕獲画面のUI要素を作成し、マップを非表示にして表示する
 */
export function startCaptureMode(pokemonData) {
    console.log(`[UI] 捕獲モードを開始します。ターゲット: ${pokemonData.japanese} (ID: ${pokemonData.id})`);

    const mapContainer = document.getElementById('map');
    const captureContainer = document.getElementById('capture-ui'); 

    if (!mapContainer || !captureContainer) {
        console.error("[UI ERROR] 'map'または'capture-ui'コンテナが見つかりません。");
        return;
    }

    window.currentPokemonData = pokemonData; 
    mapContainer.style.display = 'none';
    captureContainer.style.display = 'block';

    renderCaptureUI(pokemonData);
}

/**
 * 捕獲UIの初期画面を描画する
 */
function renderCaptureUI(pokemonData, message = "") {
    const captureContainer = document.getElementById('capture-ui');
    
    captureContainer.innerHTML = `
        <div style="text-align: center; padding: 20px;">
            <h2>野生の ${pokemonData.japanese} が現れた！</h2>
            <p style="color: red;">${message}</p>
            <img src="./assets/${pokemonData.id}.png" alt="${pokemonData.japanese}" style="width: 150px; height: 150px; margin: 20px 0;">
            <p>タイプ: ${pokemonData.types.join(' / ')}</p>
            
            <div style="margin-top: 30px;">
                <button onclick="window.throwPokeBall('${pokemonData.id}')" style="padding: 10px 20px; font-size: 16px; background-color: #f44336; color: white; border: none; cursor: pointer;">
                    モンスターボールを投げる 🔴
                </button>
                <button onclick="window.exitCaptureMode()" style="padding: 10px 20px; font-size: 16px; margin-left: 10px; background-color: #ccc; border: none; cursor: pointer;">
                    逃げる (マップに戻る) 🏃
                </button>
            </div>
        </div>
    `;
}

/**
 * モンスターボールを投げる処理。捕獲成否を判定する。
 */
export function throwPokeBall(pokemonId) {
    const targetPokemon = window.currentPokemonData;
    if (!targetPokemon || targetPokemon.id != pokemonId) {
        console.error("[CATCH ERROR] 捕獲対象のポケモンデータが見つかりません。");
        return;
    }
    
    const normalizedId = targetPokemon.id / 151; 
    const finalCatchRate = BASE_CATCH_RATE * (1 - (normalizedId * 0.3)); 
    const randomNumber = Math.random();
    
    console.log(`[CATCH] 捕獲率: ${finalCatchRate.toFixed(4)}, 乱数: ${randomNumber.toFixed(4)}`);

    if (randomNumber < finalCatchRate) {
        handleCatchSuccess(targetPokemon);
    } else {
        handleCatchFailure(targetPokemon);
    }
}

/**
 * 捕獲成功時の処理 (CPを付与し、保存、UI更新)
 */
function handleCatchSuccess(pokemonData) {
    const minCp = 10;
    const maxCp = 1500;
    const cpRange = maxCp - minCp;
    const cp = Math.floor(Math.random() * cpRange) + minCp; 
    
    const caughtPokemon = {
        ...pokemonData,
        cp: cp,
        caughtTime: Date.now(),
        uniqueId: Math.random().toString(36).substring(2) 
    };

    savePokemonToBox(caughtPokemon);

    console.log(`[SUCCESS] ${caughtPokemon.japanese} (CP:${caughtPokemon.cp}) を捕獲しました！`);
    const captureContainer = document.getElementById('capture-ui');
    
    captureContainer.innerHTML = `
        <div style="text-align: center; padding: 50px; background-color: #e8f5e9;">
            <h2 style="color: green;">🎉 ${caughtPokemon.japanese} を捕獲成功！ 🎉</h2>
            <h3>CP: ${caughtPokemon.cp}</h3>
            <img src="./assets/${caughtPokemon.id}.png" alt="${caughtPokemon.japanese}" style="width: 150px; height: 150px; margin: 20px 0;">
            <p>新しい仲間がボックスに加わりました！</p>
            <button onclick="window.exitCaptureMode()" style="padding: 10px 30px; margin-top: 20px;">
                マップに戻る
            </button>
        </div>
    `;
    
    renderPokemonBoxUI();
}

/**
 * 捕獲失敗時の処理
 */
function handleCatchFailure(pokemonData) {
    console.log(`[FAILURE] ${pokemonData.japanese} は逃げ出した...！`);
    
    const message = "ポケモンはボールから飛び出してしまいました！";
    renderCaptureUI(pokemonData, message);
}

/**
 * 捕獲画面を非表示にし、マップ画面に戻る
 */
export function exitCaptureMode() {
    console.log("[UI] 捕獲モードを終了し、マップに戻ります。");
    const mapContainer = document.getElementById('map');
    const captureContainer = document.getElementById('capture-ui');

    if (mapContainer && captureContainer) {
        mapContainer.style.display = 'block';
        captureContainer.style.display = 'none';
    }
    window.currentPokemonData = null;
    
    renderPokemonBoxUI();
}

// ===========================================
// メインメニュー制御
// ===========================================

/**
 * メインメニュー画面を開く
 */
export function openMenu() {
    console.log("[UI] メインメニューを開きます。");
    document.getElementById('main-menu').style.display = 'block';
    
    // メニュー選択肢エリアに戻し、サブ画面を非表示にする
    document.getElementById('menu-options').style.display = 'block';
    document.getElementById('pokemon-list-container').style.display = 'none';
    document.getElementById('settings-container').style.display = 'none';
    document.getElementById('inventory-container').style.display = 'none'; // ⭐ NEW: 道具画面も非表示に ⭐
}

/**
 * メインメニュー画面を閉じる
 */
export function closeMenu() {
    console.log("[UI] メインメニューを閉じます。");
    document.getElementById('main-menu').style.display = 'none';
}

/**
 * ポケモン一覧画面を表示する
 */
export function showPokemonList() {
    console.log("[UI] ポケモンボックス一覧を表示します。");
    
    document.getElementById('menu-options').style.display = 'none';
    document.getElementById('settings-container').style.display = 'none';
    document.getElementById('inventory-container').style.display = 'none'; // ⭐ NEW: 道具画面を非表示に ⭐
    document.getElementById('pokemon-list-container').style.display = 'block';

    renderPokemonList();
}

/**
 * 設定画面を表示する
 */
export function showSettings() {
    console.log("[UI] 設定画面を表示します。");
    
    document.getElementById('menu-options').style.display = 'none';
    document.getElementById('pokemon-list-container').style.display = 'none';
    document.getElementById('inventory-container').style.display = 'none'; // ⭐ NEW: 道具画面を非表示に ⭐
    document.getElementById('settings-container').style.display = 'block';
    
    renderSettings();
}

/**
 * ⭐ NEW: 道具（インベントリ）画面を表示する ⭐
 */
export function showInventory() {
    console.log("[UI] 道具（インベントリ）画面を表示します。");
    
    document.getElementById('menu-options').style.display = 'none';
    document.getElementById('pokemon-list-container').style.display = 'none';
    document.getElementById('settings-container').style.display = 'none';
    document.getElementById('inventory-container').style.display = 'block'; // ⭐ NEW: 道具画面を表示 ⭐
    
    renderInventory();
}


// ===========================================
// UI描画ロジック
// ===========================================

/**
 * ボックスの内容を一覧として描画する
 */
function renderPokemonList() {
    const listContainer = document.getElementById('pokemon-list-container');
    const box = getPokemonBox();
    
    if (box.length === 0) {
        listContainer.innerHTML = `
            <h2 style="text-align: center; margin-top: 50px;">ボックスにポケモンはいません 🥺</h2>
            <button onclick="window.openMenu()" style="margin-top: 30px; padding: 10px 20px;">戻る</button>
        `;
        return;
    }

    const pokemonHtml = box.map(p => `
        <div style="width: 150px; text-align: center; padding: 10px; border: 1px solid #555; border-radius: 5px; margin: 10px; background-color: #222;">
            <img src="./assets/${p.id}.png" alt="${p.japanese}" style="width: 100px; height: 100px;">
            <h4 style="margin: 5px 0 0;">${p.japanese}</h4>
            <p style="font-size: 14px; color: #ffeb3b;">CP: ${p.cp}</p>
            <p style="font-size: 12px; color: #aaa;">ID: ${p.uniqueId.substring(0, 6)}...</p>
        </div>
    `).join('');

    listContainer.innerHTML = `
        <h2 style="text-align: center;">ポケモン一覧 (${box.length}匹)</h2>
        <button onclick="window.openMenu()" style="position: absolute; top: 20px; left: 20px; padding: 10px 15px;">⬅ 戻る</button>
        <div style="display: flex; flex-wrap: wrap; justify-content: center; margin-top: 20px; padding-bottom: 80px;">
            ${pokemonHtml}
        </div>
    `;
}

/**
 * ⭐ NEW: 道具（インベントリ）画面を描画する ⭐
 */
function renderInventory() {
    const inventoryContainer = document.getElementById('inventory-container');
    const inventory = getInventory();
    
    const itemsKeys = Object.keys(inventory).sort();
    
    if (itemsKeys.length === 0) {
        inventoryContainer.innerHTML = `
            <h2 style="text-align: center; margin-top: 50px;">道具箱は空です... 😱</h2>
            <button onclick="window.openMenu()" style="position: absolute; top: 20px; left: 20px; padding: 10px 15px;">⬅ 戻る</button>
        `;
        return;
    }

    const itemHtml = itemsKeys.map(id => {
        const itemInfo = ITEMS[id.toUpperCase()]; // item.jsで定義したアイテム情報
        const count = inventory[id];
        
        return `
            <div style="display: flex; align-items: center; padding: 15px; border-bottom: 1px solid #555; width: 100%; max-width: 600px; margin: 0 auto;">
                <img src="./assets/items/${id}.png" alt="${itemInfo.name_ja}" style="width: 50px; height: 50px; margin-right: 20px; background-color: #444; border-radius: 5px;">
                <div style="flex-grow: 1;">
                    <h4 style="margin: 0; font-size: 18px;">${itemInfo.name_ja}</h4>
                    <p style="margin: 5px 0 0; font-size: 12px; color: #aaa;">${itemInfo.description_ja}</p>
                </div>
                <span style="font-size: 24px; font-weight: bold; color: #ffeb3b;">x ${count}</span>
            </div>
        `;
    }).join('');

    inventoryContainer.innerHTML = `
        <h2 style="text-align: center;">道具 (${itemsKeys.length}種類)</h2>
        <button onclick="window.openMenu()" style="position: absolute; top: 20px; left: 20px; padding: 10px 15px;">⬅ 戻る</button>
        <div style="display: flex; flex-direction: column; align-items: center; margin-top: 20px; padding-bottom: 80px;">
            ${itemHtml}
        </div>
    `;
}


/**
 * 設定画面を描画する
 */
function renderSettings() {
    const settingsContainer = document.getElementById('settings-container');
    
    const currentLang = localStorage.getItem('setting_lang') || '日本語';
    const currentTheme = getCurrentTheme();
    
    settingsContainer.innerHTML = `
        <h2 style="text-align: center;">設定</h2>
        <button onclick="window.openMenu()" style="position: absolute; top: 20px; left: 20px; padding: 10px 15px;">⬅ 戻る</button>
        
        <div style="max-width: 400px; margin: 50px auto; padding: 20px; background-color: #333; border-radius: 10px;">
            
            <h3 style="margin-top: 0;">言語</h3>
            <select id="setting-language" onchange="window.updateSetting('lang', this.value)">
                <option value="日本語" ${currentLang === '日本語' ? 'selected' : ''}>日本語</option>
                <option value="English" ${currentLang === 'English' ? 'selected' : ''}>English</option>
            </select>
            
            <h3 style="margin-top: 30px;">テーマ</h3>
            <select id="setting-theme" onchange="window.updateSetting('theme', this.value)">
                <option value="light" ${currentTheme === 'light' ? 'selected' : ''}>ライト</option>
                <option value="dark" ${currentTheme === 'dark' ? 'selected' : ''}>ダーク</option>
            </select>
            <p style="font-size: 12px; color: #aaa; margin-top: 10px;">(テーマ変更は設定ファイルを介して<body>のクラスを切り替えます)</p>
        </div>
    `;
}

/**
 * ボックスの内容を取得し、画面右上のUIに表示する
 */
export function renderPokemonBoxUI() {
    const boxContainer = document.getElementById('pokemon-box-ui'); 
    if (!boxContainer) {
        // ... (エラー処理)
        return;
    }
    
    const box = getPokemonBox();
    const recentThree = box.slice(-3).reverse(); 

    if (recentThree.length === 0) {
        boxContainer.innerHTML = `<p style="color: white; padding: 10px;">ボックスは空です 🥚</p>`;
        return;
    }

    const pokemonHtml = recentThree.map(p => `
        <div style="display: flex; flex-direction: column; align-items: center; margin: 0 5px; background-color: rgba(255, 255, 255, 0.9); border-radius: 5px; padding: 5px; box-shadow: 0 0 5px rgba(0,0,0,0.3);">
            <img src="./assets/${p.id}.png" alt="${p.japanese}" style="width: 70px; height: 70px;">
            <span style="font-size: 12px; font-weight: bold; color: #333; margin-top: 2px;">CP: ${p.cp}</span>
        </div>
    `).join('');

    boxContainer.innerHTML = `
        <h3 style="color: white; margin-bottom: 5px;">🔥 マイボックス (最新3体)</h3>
        <div style="display: flex; justify-content: flex-start;">
            ${pokemonHtml}
        </div>
    `;
}


// ===========================================
// グローバル登録 (重要)
// ===========================================
window.startCaptureMode = startCaptureMode;
window.exitCaptureMode = exitCaptureMode;
window.throwPokeBall = throwPokeBall;
window.openMenu = openMenu;
window.closeMenu = closeMenu;
window.showPokemonList = showPokemonList;
window.showSettings = showSettings;
window.showInventory = showInventory; // ⭐ NEW: 道具画面の表示をグローバル登録 ⭐
window.updateSetting = updateSetting; 
window.renderPokemonBoxUI = renderPokemonBoxUI;

// 初期ロード時にボックスUIを一度描画する
document.addEventListener('DOMContentLoaded', () => {
    setTimeout(renderPokemonBoxUI, 1000); 
});
