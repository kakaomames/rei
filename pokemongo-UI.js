// pokemongo-UI.js

// ポケモンの捕獲ベース確率 (仮設定。IDなどで変更可能)
const BASE_CATCH_RATE = 0.5; // 50%

/**
 * 捕獲画面のUI要素を作成し、マップを非表示にして表示する
 * @param {object} pokemonData 抽選されたポケモンのデータ (id, name, japanese, types, lat, lng)
 */
export function startCaptureMode(pokemonData) {
    console.log(`[UI] 捕獲モードを開始します。ターゲット: ${pokemonData.japanese} (ID: ${pokemonData.id})`);

    const mapContainer = document.getElementById('map');
    const captureContainer = document.getElementById('capture-ui'); 

    if (!mapContainer || !captureContainer) {
        console.error("[UI ERROR] 'map'または'capture-ui'コンテナが見つかりません。");
        return;
    }

    // プレイヤーの位置情報をポケモンデータに一時的に保存（捕獲の際に使用）
    window.currentPokemonData = pokemonData; 

    // マップを非表示にし、捕獲UIを表示
    mapContainer.style.display = 'none';
    captureContainer.style.display = 'block';

    // 捕獲UIの内容を動的に更新
    renderCaptureUI(pokemonData);
}

/**
 * 捕獲UIの初期画面を描画する
 */
function renderCaptureUI(pokemonData, message = "") {
    const captureContainer = document.getElementById('capture-ui');
    
    // ⭐ IDを引数に渡して、モンスターボールを投げられるようにする ⭐
    captureContainer.innerHTML = `
        <div style="text-align: center; padding: 20px;">
            <h2>野生の ${pokemonData.japanese} が現れた！</h2>
            <p style="color: red;">${message}</p>
            <img src="/assets/${pokemonData.id}.png" alt="${pokemonData.japanese}" style="width: 150px; height: 150px; margin: 20px 0;">
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
 * @param {string} pokemonId 捕獲対象のポケモンのID
 */
export function throwPokeBall(pokemonId) {
    const targetPokemon = window.currentPokemonData;
    if (!targetPokemon || targetPokemon.id != pokemonId) {
        console.error("[CATCH ERROR] 捕獲対象のポケモンデータが見つかりません。");
        return;
    }
    
    // ⭐ 捕獲成功率を計算 ⭐
    // 捕獲率はBASE_CATCH_RATEに、ポケモンのID（強さの目安）に応じた補正などを加える
    // 例: IDが小さいほど捕まえやすい (151(ミュウ)は難しい)
    const normalizedId = targetPokemon.id / 151; // 0から1に近い値
    // IDが大きいほど捕獲率が下がるように調整
    const finalCatchRate = BASE_CATCH_RATE * (1 - (normalizedId * 0.3)); // 最大30%減少
    
    const randomNumber = Math.random();
    
    console.log(`[CATCH] 捕獲率: ${finalCatchRate.toFixed(4)}, 乱数: ${randomNumber.toFixed(4)}`);

    if (randomNumber < finalCatchRate) {
        // 捕獲成功！
        handleCatchSuccess(targetPokemon);
    } else {
        // 捕獲失敗！
        handleCatchFailure(targetPokemon);
    }
}

/**
 * 捕獲成功時の処理 (UI更新)
 */
function handleCatchSuccess(pokemonData) {
    console.log(`[SUCCESS] ${pokemonData.japanese} を捕獲しました！`);
    const captureContainer = document.getElementById('capture-ui');
    
    // 捕獲成功UIを表示し、マップに戻るボタンのみにする
    captureContainer.innerHTML = `
        <div style="text-align: center; padding: 50px; background-color: #e8f5e9;">
            <h2 style="color: green;">🎉 ${pokemonData.japanese} を捕獲成功！ 🎉</h2>
            <img src="assets/${pokemonData.id}.png" alt="${pokemonData.japanese}" style="width: 150px; height: 150px; margin: 20px 0;">
            <p>新しい仲間が加わりました！図鑑に登録されます。</p>
            <button onclick="window.exitCaptureMode()" style="padding: 10px 30px; margin-top: 20px;">
                マップに戻る
            </button>
        </div>
    `;
    // ⭐ ここでサーバー側やローカルストレージにポケモンを保存する処理が必要になります ⭐
}

/**
 * 捕獲失敗時の処理 (UI更新: ポケモンはそのまま残る)
 */
function handleCatchFailure(pokemonData) {
    console.log(`[FAILURE] ${pokemonData.japanese} は逃げ出した...！`);
    
    // 失敗メッセージを表示して、再度ボールを投げられるようにUIをレンダリングし直す
    const message = "ポケモンはボールから飛び出してしまいました！";
    renderCaptureUI(pokemonData, message);
    
    // ⭐ ポケモンが逃走する可能性もここで判定・実装できます ⭐
    // if (Math.random() < 0.1) { /* ポケモンが逃走 */ }
}


/**
 * 捕獲画面を非表示にし、マップ画面に戻る
 */
export function exitCaptureMode() {
    console.log("[UI] 捕獲モードを終了し、マップに戻ります。");
    const mapContainer = document.getElementById('map');
    const captureContainer = document.getElementById('capture-ui');

    if (mapContainer && captureContainer) {
        // ⭐ マップを再表示 ⭐
        mapContainer.style.display = 'block';
        captureContainer.style.display = 'none';
    }
    window.currentPokemonData = null;
}

// 捕獲画面のボタンから直接呼び出すために、グローバルに登録
window.exitCaptureMode = exitCaptureMode;
window.throwPokeBall = throwPokeBall;
