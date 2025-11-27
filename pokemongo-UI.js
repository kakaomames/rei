// pokemongo-UI.js

// ポケモンの捕獲ベース確率 (仮設定)
const BASE_CATCH_RATE = 0.5;

// ⭐ NEW: ローカルストレージのキー ⭐
const CATCHED_POKEMON_KEY = 'pokemon_go_caught_box';

// ===========================================
// ローカルストレージ (ボックス) 管理関数
// ===========================================

/**
 * ローカルストレージから捕獲済みポケモンリストを取得する
 * @returns {Array<object>} 捕獲済みポケモンデータの配列
 */
function getPokemonBox() {
    try {
        const storedData = localStorage.getItem(CATCHED_POKEMON_KEY);
        // データがない場合は空配列、ある場合はパースして返す
        return storedData ? JSON.parse(storedData) : [];
    } catch (e) {
        console.error("[STORAGE ERROR] ローカルストレージからの読み込みに失敗しました。", e);
        return [];
    }
}

/**
 * 捕獲したポケモンをローカルストレージに保存する
 * @param {object} pokemonData 保存するポケモンのデータ（CP付き）
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
// メインUI関数
// ===========================================

/**
 * 捕獲画面のUI要素を作成し、マップを非表示にして表示する
 */
export function startCaptureMode(pokemonData) {
    // ... (省略: 既存の startCaptureMode の中身は変更なし) ...
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

// ... (省略: renderCaptureUI, throwPokeBall 関数は変更なし) ...
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

// ===========================================
// 捕獲結果処理
// ===========================================

/**
 * 捕獲成功時の処理 (CPを付与し、保存、UI更新)
 */
function handleCatchSuccess(pokemonData) {
    // ⭐ NEW: CPを決定し、データに追加 ⭐
    const minCp = 10;
    const maxCp = 1500;
    const cpRange = maxCp - minCp;
    // CPをランダムに決定 (ここでは単純な乱数を使用)
    const cp = Math.floor(Math.random() * cpRange) + minCp; 
    
    const caughtPokemon = {
        ...pokemonData,
        cp: cp,
        caughtTime: Date.now(),
        uniqueId: Math.random().toString(36).substring(2) // 識別用ID
    };

    // ローカルストレージに保存
    savePokemonToBox(caughtPokemon);

    console.log(`[SUCCESS] ${caughtPokemon.japanese} (CP:${caughtPokemon.cp}) を捕獲しました！`);
    const captureContainer = document.getElementById('capture-ui');
    
    // 捕獲成功UIを表示し、マップに戻るボタンのみにする
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
    
    // 成功時にボックスUIを更新するトリガー
    renderPokemonBoxUI();
}

/**
 * 捕獲失敗時の処理 (UI更新: ポケモンはそのまま残る)
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
    
    // マップに戻った時もボックスUIを更新
    renderPokemonBoxUI();
}

// ===========================================
// ⭐ NEW: ボックスUI描画ロジック ⭐
// ===========================================

/**
 * ボックスの内容を取得し、画面右上のUIに表示する
 */
export function renderPokemonBoxUI() {
    const boxContainer = document.getElementById('pokemon-box-ui'); // index.htmlにこのIDが必要
    if (!boxContainer) {
        console.error("[UI ERROR] 'pokemon-box-ui'コンテナが見つかりません。");
        return;
    }
    
    const box = getPokemonBox();
    
    // 最新の3体を取得 (UIの要件)
    const recentThree = box.slice(-3).reverse(); 

    if (recentThree.length === 0) {
        boxContainer.innerHTML = `<p style="color: white; padding: 10px;">ボックスは空です 🥚</p>`;
        return;
    }

    // 3体表示のUIを構築
    const pokemonHtml = recentThree.map(p => `
        <div style="display: flex; flex-direction: column; align-items: center; margin: 0 5px; background-color: rgba(255, 255, 255, 0.9); border-radius: 5px; padding: 5px; box-shadow: 0 0 5px rgba(0,0,0,0.3);">
            <img src="./assets/${p.id}.png" alt="${p.japanese}" style="width: 70px; height: 70px;">
            <span style="font-size: 12px; font-weight: bold; color: #333; margin-top: 2px;">CP: ${p.cp}</span>
        </div>
    `).join('');

    boxContainer.innerHTML = `
        <h3 style="color: white; margin-bottom: 5px;">🔥 マイボックス</h3>
        <div style="display: flex; justify-content: flex-start;">
            ${pokemonHtml}
        </div>
    `;
}

// 捕獲画面のボタンから直接呼び出すために、グローバルに登録
window.exitCaptureMode = exitCaptureMode;
window.throwPokeBall = throwPokeBall;
window.renderPokemonBoxUI = renderPokemonBoxUI; // 外部から呼び出し可能にする

// ⭐ 初期ロード時にボックスUIを一度描画する (initMapから呼ばれる必要あり) ⭐
document.addEventListener('DOMContentLoaded', () => {
    // 確実にマップやUIがロードされた後に実行
    setTimeout(renderPokemonBoxUI, 1000); 
});
