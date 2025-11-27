// pokemongo-UI.js

/**
 * 捕獲画面のUI要素を作成し、マップを非表示にして表示する
 * @param {object} pokemonData 抽選されたポケモンのデータ (id, name, japanese, types)
 */
export function startCaptureMode(pokemonData) {
    console.log(`[UI] 捕獲モードを開始します。ターゲット: ${pokemonData.japanese} (ID: ${pokemonData.id})`);

    // 1. マップとUIコンテナを取得
    const mapContainer = document.getElementById('map');
    const captureContainer = document.getElementById('capture-ui'); // index.htmlにこのIDのコンテナが必要です

    if (!mapContainer || !captureContainer) {
        console.error("[UI ERROR] 'map'または'capture-ui'コンテナが見つかりません。");
        return;
    }

    // 2. マップを非表示にし、捕獲UIを表示
    mapContainer.style.display = 'none';
    captureContainer.style.display = 'block';

    // 3. 捕獲UIの内容を動的に更新
    captureContainer.innerHTML = `
        <div style="text-align: center; padding: 20px;">
            <h2>野生の ${pokemonData.japanese} が現れた！</h2>
            <img src="./assets/${pokemonData.id}.png" alt="${pokemonData.japanese}" style="width: 150px; height: 150px; margin: 20px 0;">
            <p>タイプ: ${pokemonData.types.join(' / ')}</p>
            <p>緯度: ${pokemonData.lat.toFixed(6)}, 経度: ${pokemonData.lng.toFixed(6)}</p>
            <button onclick="window.exitCaptureMode()">逃げる (マップに戻る)</button>
            <button onclick="alert('モンスターボールを投げる処理...')">モンスターボールを投げる</button>
        </div>
    `;

    // プレイヤーの位置情報をポケモンデータに一時的に保存（マーカーから渡されたもの）
    // 捕獲の際にプレイヤーの位置とポケモンの位置が必要になるため
    window.currentPokemonData = pokemonData; 
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
}

// 捕獲画面のボタンから直接呼び出すために、グローバルに登録
window.exitCaptureMode = exitCaptureMode;
