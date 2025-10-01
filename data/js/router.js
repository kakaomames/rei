// game.jsで定義されたグローバル変数と関数を参照:
// goToHome, goToStore, goToSettings, startLevel, MAX_REBEL

/**
 * URLハッシュに基づいて画面を切り替えるメインルーティング関数。
 * DOM要素の表示/非表示を集中管理します。
 * @param {string} hash - URLのハッシュ（例: #home, #store, #level1）
 */
function navigate(hash) {
    // 最初の '#' を取り除き、小文字に変換してパスを取得
    const path = hash.replace(/^#/, '').toLowerCase();
    
    const homeScreen = document.getElementById('homeScreen');
    const gameCanvas = document.getElementById('gameCanvas');
    const controls = document.querySelector('.controls');
    
    // 全てのビューを初期状態で非表示にする
    if (homeScreen) homeScreen.style.display = 'none';
    if (gameCanvas) gameCanvas.style.display = 'none';
    if (controls) controls.style.display = 'none';
    
    // パスに基づいて画面を切り替える
    if (path === 'home' || path === '') {
        if (homeScreen) homeScreen.style.display = 'block';
        goToHome(); // game.js: ホーム画面のコンテンツを描画
        
    } else if (path === 'store') {
        if (homeScreen) homeScreen.style.display = 'block';
        goToStore(); // game.js: ストアのコンテンツを描画
        
    } else if (path === 'settings') {
        if (homeScreen) homeScreen.style.display = 'block';
        if (typeof goToSettings === 'function') {
            goToSettings(); // settings.js: 設定画面のコンテンツを描画
        } else {
             console.error("goToSettings関数が定義されていません。settings.jsのロードを確認してください。");
             window.location.hash = '#home'; // フォールバック
        }
        
    } else if (path.startsWith('level')) {
        const levelNum = parseInt(path.replace('level', ''), 10);
        
        // 有効なレベル範囲かチェック
        if (!isNaN(levelNum) && levelNum >= 1 && levelNum <= MAX_REBEL) {
            if (gameCanvas) gameCanvas.style.display = 'block';
            if (controls) controls.style.display = 'flex';
            startLevel(levelNum); // game.js: ゲーム開始、ループ起動
        } else {
            // 無効なレベルの場合はホームに戻す
            window.location.hash = '#home';
        }
    } else {
        // 未知のハッシュの場合はホームに戻す
        window.location.hash = '#home';
    }
}

// ----------------------------------------------------
// 💡 イベントリスナーと初期化
// ----------------------------------------------------

// 1. ハッシュ変更イベントの監視
// ブラウザの「戻る」「進む」ボタンや、JSによるハッシュ変更を捕捉
window.addEventListener('hashchange', () => {
    navigate(window.location.hash);
});

// 2. ページロード時の初期ハッシュ設定とナビゲーション
// loadGameData() の成功後、game.js の末尾で navigate(window.location.hash) が呼び出されます。
// ロード時にハッシュがない場合は '#home' を設定
if (window.location.hash === '') {
    window.location.hash = '#home';
}
