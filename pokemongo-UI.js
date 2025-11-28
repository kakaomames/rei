// pokemongo-UI.js
console.log("🔥 [UI:START] pokemongo-UI.js ファイルの実行を開始しました。");

import { getInventory, getPokemonById, useItem, getPokemonName, ITEMS } from './item.js';
import { getMyPokemonList, updatePokemonHp } from './pokemon.js';
import { executeAttack, getGymDefenders } from './gym.js';
import { getCurrentTheme } from './settings.js';

// ===========================================
// グローバルUI要素のキャッシュ
// ===========================================
const UI_ELEMENTS = {
    mainMenu: document.getElementById('main-menu'),
    captureUI: document.getElementById('capture-ui'),
    pokemonBoxUI: document.getElementById('pokemon-box-ui'),
    pokemonListContainer: document.getElementById('pokemon-list-container'),
    settingsContainer: document.getElementById('settings-container'),
    inventoryContainer: document.getElementById('inventory-container'),
    map: document.getElementById('map'),
    menuButton: document.getElementById('menu-button'),
};

// ===========================================
// UI制御 - メニュー開閉
// ===========================================

/**
 * メインメニューを開く
 */
window.openMenu = () => {
    UI_ELEMENTS.mainMenu.style.display = 'block';
    UI_ELEMENTS.menuButton.style.display = 'none';
    
    // 開いたときにデフォルトで道具箱を表示
    window.showInventory(); 
};

/**
 * メインメニューを閉じる
 */
window.closeMenu = () => {
    UI_ELEMENTS.mainMenu.style.display = 'none';
    UI_ELEMENTS.menuButton.style.display = 'block';
    
    // 全てのサブメニューを非表示にする
    document.querySelectorAll('.sub-menu-content').forEach(el => {
        el.style.display = 'none';
    });
    
    // メニューオプションを再表示
    document.getElementById('menu-options').style.display = 'block';
};


/**
 * サブメニューを表示し、他のサブメニューとメインオプションを非表示にする
 * @param {HTMLElement} container 表示するサブメニューコンテナ
 */
function showSubMenu(container) {
    document.querySelectorAll('.sub-menu-content').forEach(el => {
        el.style.display = 'none';
    });
    document.getElementById('menu-options').style.display = 'none';
    container.style.display = 'block';
}

// ===========================================
// UI制御 - 道具箱表示
// ===========================================

/**
 * 道具箱UIを更新・表示する
 * (マップ上のコンパクト表示と、メニュー内の詳細表示を兼ねる)
 */
export function renderPokemonBoxUI() {
    const inventory = getInventory();
    let ballCount = inventory['POKEBALL'] || 0;
    
    // マップ上のコンパクト表示 (右上のUI)
    UI_ELEMENTS.pokemonBoxUI.innerHTML = `
        <p style="margin: 0; font-size: 1.2em;">
            ⚾️ ボール: ${ballCount}
        </p>
    `;
}

/**
 * メニュー内で道具リストを表示する
 */
window.showInventory = () => {
    showSubMenu(UI_ELEMENTS.inventoryContainer);
    const inventory = getInventory();
    
    let html = `
        <h2>道具箱</h2>
        <button onclick="window.closeSubMenu()">戻る</button>
        <div style="margin-top: 20px;">
    `;
    
    // インベントリの中身をリスト表示
    for (const [itemId, count] of Object.entries(inventory)) {
        const itemInfo = ITEMS[itemId];
        if (count > 0 && itemInfo) {
            html += `
                <div style="display: flex; justify-content: space-between; padding: 10px; margin-bottom: 5px; border-bottom: 1px solid #555;">
                    <span>${itemInfo.name_ja} (${itemInfo.type})</span>
                    <span>所持数: ${count}</span>
                </div>
            `;
        }
    }
    
    html += `</div>`;
    UI_ELEMENTS.inventoryContainer.innerHTML = html;
};

// ===========================================
// UI制御 - ポケモンリスト表示
// ===========================================

/**
 * ポケモンリストUIを更新・表示する
 */
window.showPokemonList = () => {
    showSubMenu(UI_ELEMENTS.pokemonListContainer);
    const pokemonList = getMyPokemonList();
    
    let html = `
        <h2>ポケモンリスト (${pokemonList.length} 匹)</h2>
        <button onclick="window.closeSubMenu()">戻る</button>
        <div style="margin-top: 20px; display: grid; gap: 10px; grid-template-columns: repeat(auto-fit, minmax(150px, 1fr));">
    `;
    
    // ポケモンをタイル表示
    pokemonList.forEach(p => {
        // テーマによって色を動的に変更
        const bgColor = getCurrentTheme() === 'dark' ? '#444' : '#eee';
        const textColor = getCurrentTheme() === 'dark' ? 'white' : 'black';
        
        html += `
            <div style="background-color: ${bgColor}; padding: 10px; border-radius: 8px; border: 1px solid #777; color: ${textColor}; text-align: center;">
                <b>${p.japanese}</b>
                <p style="margin: 5px 0;">CP ${p.cp}</p>
                <p style="margin: 5px 0; color: ${p.currentHp / p.maxHp > 0.3 ? 'green' : 'red'};">HP: ${p.currentHp}/${p.maxHp}</p>
                <button onclick="alert('${p.japanese} の詳細情報 (後で実装)')" style="width: 100%;">詳細</button>
            </div>
        `;
    });
    
    html += `</div>`;
    UI_ELEMENTS.pokemonListContainer.innerHTML = html;
};


// ===========================================
// UI制御 - 捕獲モード
// ===========================================

let currentTargetPokemon = null;

/**
 * ポケモンとの遭遇時に捕獲UIに切り替える
 * @param {Object} pokemonData 遭遇したポケモンのデータ
 */
export function startCaptureMode(pokemonData) {
    currentTargetPokemon = pokemonData;
    
    // マップとメニューを隠す
    UI_ELEMENTS.map.style.display = 'none';
    UI_ELEMENTS.menuButton.style.display = 'none';
    
    // 捕獲UIを表示
    UI_ELEMENTS.captureUI.style.display = 'flex';
    UI_ELEMENTS.captureUI.style.flexDirection = 'column';
    UI_ELEMENTS.captureUI.style.alignItems = 'center';
    UI_ELEMENTS.captureUI.style.justifyContent = 'center';
    
    renderCaptureUI(pokemonData);
    console.log(`[CAPTURE] 捕獲モードを開始: ${pokemonData.japanese}`);
}

/**
 * 捕獲UIのコンテンツをレンダリングする
 * @param {Object} pokemonData 捕獲対象のポケモンのデータ
 */
function renderCaptureUI(pokemonData) {
    const inventory = getInventory();
    const pokeballCount = inventory['POKEBALL'] || 0;
    
    let captureContent = `
        <h2 style="color: ${getCurrentTheme() === 'dark' ? 'white' : 'black'};">野生の ${pokemonData.japanese} が現れた！</h2>
        <img src="./assets/button_icon_M${pokemonData.id}.png" alt="${pokemonData.japanese}" style="width: 150px; height: 150px; margin: 20px;">
        <p>CP: ${pokemonData.cp}</p>
        
        <div style="margin-top: 30px; text-align: center;">
            <h3>道具を使う:</h3>
            <p>モンスターボール: ${pokeballCount} 個</p>
            <button 
                onclick="window.throwPokeball()" 
                ${pokeballCount === 0 ? 'disabled' : ''}
                style="padding: 10px 20px; font-size: 16px; margin-right: 15px;"
            >
                モンスターボールを投げる
            </button>
            <button onclick="window.fleeFromCapture()" style="background-color: #d32f2f; color: white; padding: 10px 20px;">
                逃げる
            </button>
        </div>
        <div id="capture-message" style="margin-top: 20px; font-weight: bold;"></div>
    `;
    
    UI_ELEMENTS.captureUI.innerHTML = captureContent;
}

/**
 * モンスターボールを投げる処理
 */
window.throwPokeball = () => {
    if (!currentTargetPokemon) return;
    
    const messageEl = document.getElementById('capture-message');
    
    // 1. モンスターボールを消費
    const usedSuccessfully = useItem('POKEBALL', 1); // item.jsで実装されることを想定
    
    if (!usedSuccessfully) {
        messageEl.textContent = '❌ モンスターボールが足りません！';
        renderCaptureUI(currentTargetPokemon); // UIを更新してボール数を0にする
        return;
    }
    
    // 2. 捕獲判定 (CPとランダム性を考慮した簡易ロジック)
    const captureChance = 1 - (currentTargetPokemon.cp / 3000) + (Math.random() * 0.3);
    
    if (captureChance > 0.6) {
        // 捕獲成功
        const caughtPokemon = { ...currentTargetPokemon };
        // pokemon.jsの捕獲ロジックを呼び出す (pokemon.jsで実装されることを想定)
        // window.catchPokemon(caughtPokemon); 
        
        messageEl.textContent = `🎉 捕獲成功！ ${caughtPokemon.japanese} をゲットしました！`;
        
        // 1.5秒後に捕獲モードを終了
        setTimeout(() => {
            endCaptureMode(true, caughtPokemon.japanese);
        }, 1500);
        
    } else {
        // 捕獲失敗
        messageEl.textContent = '💔 逃げられてしまいました...';
        
        // 1.5秒後に捕獲モードを終了
        setTimeout(() => {
            endCaptureMode(false, currentTargetPokemon.japanese);
        }, 1500);
    }
    
    renderCaptureUI(currentTargetPokemon); // UIを更新
    renderPokemonBoxUI(); // 道具箱も更新
};

/**
 * 捕獲モードから逃げる
 */
window.fleeFromCapture = () => {
    endCaptureMode(false, currentTargetPokemon ? currentTargetPokemon.japanese : 'ポケモン');
};

/**
 * 捕獲モードを終了し、マップ画面に戻る
 * @param {boolean} caught 捕獲に成功したか
 * @param {string} pokemonName ポケモンの名前
 */
function endCaptureMode(caught, pokemonName) {
    if (caught) {
        alert(`🎉 ${pokemonName} を捕獲しました！`);
    } else {
        alert(`😭 ${pokemonName} に逃げられました...`);
    }
    
    currentTargetPokemon = null;
    UI_ELEMENTS.captureUI.style.display = 'none';
    UI_ELEMENTS.map.style.display = 'block';
    UI_ELEMENTS.menuButton.style.display = 'block';
}

// ===========================================
// UI制御 - バトルモード
// ===========================================

let currentGymId = null;
let currentDefenderIndex = 0;
let battlePlayerTeam = [];

/**
 * ジムバトルUIに切り替える
 * @param {string} gymId ジムのID
 * @param {Array<Object>} defenders 防衛ポケモンのリスト
 * @param {Array<Object>} playerTeam プレイヤーの戦えるポケモンリスト
 */
export function renderBattleUI(gymId, defenders, playerTeam) {
    currentGymId = gymId;
    currentDefenderIndex = 0;
    battlePlayerTeam = playerTeam.filter(p => p.currentHp > 0); // HPのあるポケモンのみ

    if (defenders.length === 0 || battlePlayerTeam.length === 0) {
        alert("バトル開始に必要なポケモンがいません。");
        return;
    }

    // マップとメニューを隠す
    UI_ELEMENTS.map.style.display = 'none';
    UI_ELEMENTS.menuButton.style.display = 'none';
    UI_ELEMENTS.captureUI.style.display = 'none'; // 捕獲UIは非表示
    
    // バトルUIは #capture-ui を流用する
    UI_ELEMENTS.captureUI.style.display = 'flex';
    
    updateBattleScreen();
}

/**
 * バトル画面のHPやステータスを更新する
 */
function updateBattleScreen() {
    if (!currentGymId) return;

    const defenders = getGymDefenders(currentGymId);
    const currentDefender = defenders[currentDefenderIndex];
    const playerPokemon = battlePlayerTeam[0]; // 常に最初のポケモンと仮定

    if (!currentDefender || !playerPokemon) {
        endBattle(defenders.every(d => d.currentHp <= 0));
        return;
    }

    const html = `
        <h2 style="color: red;">🔥 ジムバトル中: ${currentDefender.japanese} (CP ${currentDefender.cp})</h2>
        
        <div style="display: flex; justify-content: space-around; width: 80%; margin: 20px auto;">
            <div style="text-align: center;">
                <h3>防衛側</h3>
                <img src="./assets/button_icon_M${currentDefender.id}.png" style="width: 100px;">
                <p>HP: ${currentDefender.currentHp}/${currentDefender.maxHp}</p>
                <div style="width: 80px; height: 10px; background-color: gray; margin: 0 auto;">
                    <div style="width: ${(currentDefender.currentHp / currentDefender.maxHp) * 100}%; height: 100%; background-color: red;"></div>
                </div>
            </div>

            <div style="text-align: center;">
                <h3>プレイヤー側</h3>
                <img src="./assets/button_icon_M${playerPokemon.id}.png" style="width: 100px;">
                <p>HP: ${playerPokemon.currentHp}/${playerPokemon.maxHp}</p>
                <div style="width: 80px; height: 10px; background-color: gray; margin: 0 auto;">
                    <div style="width: ${(playerPokemon.currentHp / playerPokemon.maxHp) * 100}%; height: 100%; background-color: green;"></div>
                </div>
            </div>
        </div>

        <div id="battle-log" style="margin: 20px; padding: 10px; border: 1px solid #ccc; min-height: 50px; background-color: rgba(0,0,0,0.1);">
            戦闘開始！
        </div>

        <button onclick="window.performAttack()" style="padding: 15px 30px; font-size: 20px; background-color: #007bff; color: white; border-radius: 5px;">
            アタック！
        </button>
        <button onclick="endBattle(false, '逃走')" style="background-color: #d32f2f; color: white; margin-top: 15px; padding: 8px 15px;">
            逃げる
        </button>
    `;
    
    UI_ELEMENTS.captureUI.innerHTML = html;
}

/**
 * 攻撃ボタンが押されたときの処理
 */
window.performAttack = () => {
    const defenders = getGymDefenders(currentGymId);
    const currentDefender = defenders[currentDefenderIndex];
    const playerPokemon = battlePlayerTeam[0];

    // gym.js のバトルロジックを呼び出す
    const result = executeAttack(currentGymId, playerPokemon, currentDefender);

    const logEl = document.getElementById('battle-log');
    let logMessage = '';

    // ログメッセージの生成
    logMessage += `\n${playerPokemon.japanese} が ${currentDefender.japanese} に ${result.playerDamage} ダメージを与えた！`;
    logMessage += `\n${currentDefender.japanese} の反撃！ ${playerPokemon.japanese} は ${result.defenderDamage} ダメージを受けた。`;
    
    logEl.textContent = logMessage;
    
    // HPが0になったポケモンを処理
    if (result.status === 'DEFEATED') {
        logEl.textContent += `\n✅ ${currentDefender.japanese} を倒した！`;
        currentDefenderIndex++; // 次の防衛ポケモンへ
    } else if (result.status === 'FAINTED') {
        logEl.textContent += `\n❌ ${playerPokemon.japanese} はひんしになった...`;
        battlePlayerTeam.shift(); // ひんしになったポケモンをチームから除外
    }

    // 0.5秒遅延させてHPバーを更新し、次の状態をチェック
    setTimeout(() => {
        updateBattleScreen();
    }, 500);
};

/**
 * バトルを終了し、マップに戻る
 * @param {boolean} won プレイヤーが勝利したか
 * @param {string} reason 終了理由 (例: '逃走')
 */
function endBattle(won, reason = '') {
    if (won) {
        alert("🎉 ジムバトルに勝利しました！");
    } else if (reason === '逃走') {
        alert("🏃 バトルから逃げました。");
    } else {
        alert("💔 ジムバトルに敗北しました... (あなたのポケモンが全滅)");
    }

    currentGymId = null;
    currentDefenderIndex = 0;
    battlePlayerTeam = [];
    
    // マップとメニューを再表示
    UI_ELEMENTS.captureUI.style.display = 'none';
    UI_ELEMENTS.map.style.display = 'block';
    UI_ELEMENTS.menuButton.style.display = 'block';
    
    // 道具箱UIをリフレッシュ
    renderPokemonBoxUI();
}


// ===========================================
// 初期化
// ===========================================
document.addEventListener('DOMContentLoaded', () => {
    // ページのロード時に一度UIをレンダリングしておく
    renderPokemonBoxUI();
    
    // 補助関数をグローバルに登録
    window.closeSubMenu = () => {
        document.getElementById('menu-options').style.display = 'block';
        document.querySelectorAll('.sub-menu-content').forEach(el => {
            el.style.display = 'none';
        });
    };
});
console.log("🔥 [UI:END] pokemongo-UI.js の定義が完了しました。");
