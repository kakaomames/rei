// js/main.js (SPAルーティング部分の追加)

// ... (initMap, initThree などの import はそのまま) ...

// ----------------------------------------------------
// SPA ルーティングロジック
// ----------------------------------------------------
const SCREENS = {
    '#map': document.getElementById('mapid'),
    '#menu': document.getElementById('menu-screen'),
    '#bag': document.getElementById('bag-screen'),
};

// 画面を切り替える関数
function navigateTo(hash) {
    // 1. 全ての画面を非アクティブにする
    document.querySelectorAll('.screen').forEach(screen => {
        screen.classList.remove('active');
        screen.style.display = 'none'; // 物理的にDOMから外す（Leafletの描画負荷軽減のため）
    });

    // 2. 指定された画面をアクティブにする
    const targetScreen = SCREENS[hash] || SCREENS['#map']; // デフォルトはマップ
    if (targetScreen) {
        targetScreen.style.display = 'flex'; // Flexに戻す
        // 遅延させてactiveクラスを追加し、CSSのトランジションを効かせる
        setTimeout(() => {
            targetScreen.classList.add('active');
        }, 10);
    }
    
    console.log(`Mapsd to: ${hash}`);
}

// ハッシュが変わったときのイベントリスナー
window.addEventListener('hashchange', () => {
    navigateTo(window.location.hash);
});

// ボタンクリックイベントの設定
function setupUIListeners() {
    // メニューボタン -> メニュー画面に遷移
    document.getElementById('pokeball-btn').addEventListener('click', () => {
        window.location.hash = '#menu';
    });
    
    // バッグボタン -> バッグ画面に遷移
    document.getElementById('bag-btn').addEventListener('click', () => {
        window.location.hash = '#bag';
    });
    
    // 閉じるボタン -> マップ画面に戻る
    document.getElementById('close-menu-btn').addEventListener('click', () => {
        window.location.hash = '#map';
    });
    document.getElementById('close-bag-btn').addEventListener('click', () => {
        window.location.hash = '#map';
    });

    // 初回読み込み時の処理
    navigateTo(window.location.hash || '#map');
}

// startApp関数の最後に setupUIListeners() を呼び出す必要があります。
// 修正前のstartApp関数があれば、その最後に以下を追加してください。

// ... (startApp関数内) ...
// アプリケーション起動
 startApp();
 setupUIListeners();
// ...
