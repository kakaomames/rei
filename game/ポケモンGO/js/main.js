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

// js/main.js (修正部分)

// ... (import 文は省略) ...

// マップが準備できたときに呼び出されるコールバック
function onMapReady(mapInstance, initialPlayerLocation) {
    console.log("Map is ready. Starting Three.js integration.");
    
    // 1. Three.jsの初期化とOBJモデルの読み込みをキック
    // マップインスタンスとターゲット位置情報を渡す
    initThree(mapInstance, TARGET_POKEMON_LOCATION); 

    // 2. Leafletのイベントリスナーを設定
    function setupMapListeners() {
        // マップの移動・ズーム時に、ポケモンモデルの位置を再計算して更新
        mapInstance.on('move', () => {
            updatePokemonPosition(mapInstance, TARGET_POKEMON_LOCATION);
        });
        mapInstance.on('zoom', () => {
            updatePokemonPosition(mapInstance, TARGET_POKEMON_LOCATION);
        });
        
        // 初回位置設定（initThree内で実行されますが、安全のためここでも呼び出しておきます）
        updatePokemonPosition(mapInstance, TARGET_POKEMON_LOCATION);
    }
    
    mapInstance.whenReady(setupMapListeners);
}
// ... (startApp 関数はそのまま) ...
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
