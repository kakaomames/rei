// script.js

// 🚨 デバッグ関数
function print(value) {
    console.log(`[PRINT_VALUE] ${value}`);
}

// ----------------------------------------------------------------------
// 共通状態管理変数 (slot.jsからも参照される)
// ----------------------------------------------------------------------
const BET_AMOUNT = 100; 
let currentMoney = 5000; // 持ち金はここで定義

// ----------------------------------------------------------------------
// CSS定義 (動的スタイル)
// ----------------------------------------------------------------------

// 全てのページに共通する基本CSS (display: none のルールは index.html へ移動)
const BASE_CSS = `
    /* activeな画面だけ表示 */
    .game-page.active {
        display: block !important; /* index.htmlのCSSに勝つように !important を追加 */
    }
    .game-page {
        padding: 20px;
        border: 1px solid #ccc;
        margin-bottom: 10px;
        text-align: center; 
    }
    button {
        padding: 5px 15px;
        font-size: 1.1em;
        cursor: pointer;
    }
`;

// スロット画面にのみ必要な追加CSS (slot.jsからの参照時に使用)


const SLOT_CSS = `
    /* activeな画面だけ表示 */
    .game-page.active {
        display: block !important;
    }
    .game-page {
        padding: 20px;
        border: 1px solid #ccc;
        margin-bottom: 10px;
        text-align: center; 
    }
    button {
        padding: 5px 15px;
        font-size: 1.1em;
        cursor: pointer;
    }
    
    /* -------------------- スロットゲーム用のスタイル -------------------- */
    
    #reels-container {
        display: flex;
        justify-content: center;
        gap: 10px;
        margin: 30px 0;
    }
    
    .reel-box {
        width: 100px;
        height: 100px;
        border: 3px solid gold; 
        overflow: hidden; /* 枠外のシンボルを隠す */
        position: relative; /* リールコンテナの配置基準 */
        display: flex;
        align-items: center;
        justify-content: center;
        background-color: #222;
        border-radius: 8px;
        cursor: pointer; /* タップ対応 */
    }
    
    .reel {
        font-size: 50px;
        line-height: 100px;
        text-align: center;
        width: 100%;
        color: white;
        transition: transform 0.1s ease-out; 
        
        /* 縦方向に動かすための設定 */
        position: absolute;
        top: 0;
        left: 0;
        height: 2000px; /* 十分な長さ */
        display: flex;
        flex-direction: column;
        justify-content: flex-start;
        align-items: center;
    }
    
    /* 🚨 アニメーション開始時：縦スクロールアニメーションを適用 🚨 */
    .reel.spinning {
        transition: none !important; /* スピン中はtransitionを無効化 */
        animation: scroll-down 0.05s linear infinite; /* 高速でループ */
    }
    
    /* 🚨 アニメーション定義 (このキーフレームが必須です) 🚨 */
    @keyframes scroll-down {
        from {
            transform: translateY(0);
        }
        to {
            /* リール内のシンボル1個分 (100px) 移動 */
            transform: translateY(100px); 
        }
    }
    
    #result-message {
        font-size: 1.2em;
        font-weight: bold;
        margin: 20px 0;
        min-height: 1.2em;
    }
    #spin-button {
        padding: 10px 30px;
        font-size: 1.5em;
    }
`;

// ----------------------------------------------------------------------
// ページ切り替えロジック
// ----------------------------------------------------------------------

function getPageTypeFromUrl() {
    const params = new URLSearchParams(window.location.search);
    const type = params.get('type') || 'title';
    print(`type:${type}`); 
    return type;
}

// 画面を表示/非表示で切り替える
function showPage(pageType) {
    // 1. CSSを動的に適用
    const styleTag = document.getElementById('dynamic-style');
    let currentCSS = BASE_CSS;

    if (pageType === 'slot') {
        currentCSS += SLOT_CSS;
    } 
    
    if (styleTag) {
        styleTag.innerHTML = currentCSS;
    }

    // 2. DOMの表示/非表示を切り替える
    const pages = document.querySelectorAll('.game-page');
    
    pages.forEach(page => {
        page.classList.remove('active');
    });

    const targetId = pageType + '-screen';
    const targetPage = document.getElementById(targetId);
    
    if (targetPage) {
        targetPage.classList.add('active');
        
        // スロット画面に切り替わったとき、slot.js内の初期化関数を呼ぶ
        if (pageType === 'slot') {
            // initSlotGameはslot.jsで定義されている
            if (typeof initSlotGame === 'function') {
                initSlotGame();
            }
        }
    } else {
        showPage('title'); 
    }
}

// ページ遷移を実行し、URLを更新 (ボタンから呼び出される)
function navigateTo(pageType) {
    let newSearch = '';
    
    if (pageType !== 'title') {
        newSearch = `?type=${pageType}`;
    }

    history.pushState(null, '', newSearch);
    showPage(pageType);
}

// ブラウザの「戻る/進む」ボタンに対応
window.addEventListener('popstate', () => {
    const pageType = getPageTypeFromUrl();
    showPage(pageType);
});

// ----------------------------------------------------------------------
// 🚨 初期化関数 (index.htmlの遅延ロードスクリプトから呼び出される) 🚨
// ----------------------------------------------------------------------
function initializeGame() {
    const initialPageType = getPageTypeFromUrl();
    showPage(initialPageType);
}
