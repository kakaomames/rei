// script.js

// 🚨 デバッグ関数
function print(value) {
    console.log(`[PRINT_VALUE] ${value}`);
}

// ----------------------------------------------------------------------
// 共通状態管理変数
// ----------------------------------------------------------------------
const BET_AMOUNT = 100; 
let currentMoney = 5000; // 持ち金はここで定義し、slot.jsから参照/変更される

// ----------------------------------------------------------------------
// CSS定義 (動的スタイル)
// ----------------------------------------------------------------------

// 全てのページに共通する基本CSS
const BASE_CSS = `
    /* ページ切り替えの基本設定 */
    .game-page {
        display: none;
        padding: 20px;
        border: 1px solid #ccc;
        margin-bottom: 10px;
        text-align: center; 
    }
    .game-page.active {
        display: block;
    }
    button {
        padding: 5px 15px;
        font-size: 1.1em;
        cursor: pointer;
    }
`;

// スロット画面にのみ必要な追加CSS (slot.jsに移動するが、ここでは定義)
const SLOT_CSS = `
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
        overflow: hidden; 
        display: flex;
        align-items: center;
        justify-content: center;
        background-color: #222;
        border-radius: 8px;
    }
    .reel {
        font-size: 50px;
        line-height: 100px;
        text-align: center;
        width: 100%;
        color: white;
        transition: transform 0.1s ease-out; 
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

// ページ読み込み時の初期表示
document.addEventListener('DOMContentLoaded', () => {
    const initialPageType = getPageTypeFromUrl();
    showPage(initialPageType);
});
