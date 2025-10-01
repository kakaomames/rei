// game.jsで定義された関数: startLevel, goToHome, goToStore, goToSettings

// --- グローバル変数: 現在の画面状態を保持 ---
let currentView = '';

/**
 * URLハッシュに基づいて画面を切り替える
 * @param {string} hash - URLのハッシュ（例: #home, #store, #level1）
 */
function navigate(hash) {
    // 最初の '#' を取り除き、小文字に変換
    const path = hash.replace(/^#/, '').toLowerCase();
    
    // 全てのビューを非表示にする
    document.getElementById('homeScreen').style.display = 'none';
    document.getElementById('gameCanvas').style.display = 'none';
    document.querySelector('.controls').style.display = 'none';
    
    // パスに基づいて画面を切り替える
    if (path === 'home' || path === '') {
        document.getElementById('homeScreen').style.display = 'block';
        currentView = 'home';
        // URLを変更せず、内部状態のみ更新
    } else if (path === 'store') {
        goToStore(); // store.js/game.js で実装される関数
        currentView = 'store';
        document.getElementById('homeScreen').style.display = 'block'; // Storeはホーム画面内に描画されると仮定
    } else if (path === 'settings') {
        goToSettings(); // settings.js で実装される関数
        currentView = 'settings';
        document.getElementById('homeScreen').style.display = 'block'; // Settingsもホーム画面内に描画されると仮定
    } else if (path.startsWith('level')) {
        const levelNum = parseInt(path.replace('level', ''), 10);
        if (!isNaN(levelNum) && levelNum >= 1 && levelNum <= MAX_REBEL) {
            startLevel(levelNum); // game.js で実装される関数
            document.getElementById('gameCanvas').style.display = 'block';
            document.querySelector('.controls').style.display = 'flex';
            currentView = `level${levelNum}`;
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
window.addEventListener('hashchange', () => {
    navigate(window.location.hash);
});

// 2. ページロード時の初期ハッシュ設定
// ロード時にハッシュがなければ #home を設定
if (window.location.hash === '') {
    window.location.hash = '#home';
} else {
    // 既にハッシュがあれば、それに合わせて初期画面を決定
    // navigate() は game.js の loadGameData() 完了後に実行されるよう、
    // game.js 側で工夫が必要です
    // ここでは、game.jsの最後に呼び出されるようにします
}
