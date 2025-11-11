// script.js

// 🚨 デバッグ関数: Pythonのprintを模倣 (未定義エラー防止とログ追跡のため)
function print(value) {
    console.log(`[PRINT_VALUE] ${value}`);
}

// ----------------------------------------------------------------------
// スロットゲームの定義
// ----------------------------------------------------------------------
const SYMBOLS = ['❼', '👑', '🍋', '☘️', '💎', '🍒', '⛱️', '❻'];
const PAYOUTS = {
    '❼': 10000, 
    '👑': 5000,
    '💎': 3000,
    '🍒': 2000,
    '🍋': 1000,
    '☘️': 500,
    '⛱': 0, 
    '❻': 'HALF' 
};
const BET_AMOUNT = 100; 
let currentMoney = 5000; 

// 状態管理変数
const REEL_COUNT = 3;
const reelResults = Array(REEL_COUNT).fill(''); 
let isSpinning = Array(REEL_COUNT).fill(false);
let allReelsStopped = true; 
const spinIntervals = Array(REEL_COUNT).fill(null);

// ----------------------------------------------------------------------
// ヘルパー関数
// ----------------------------------------------------------------------
function getRandomSymbol() {
    const index = Math.floor(Math.random() * SYMBOLS.length);
    return SYMBOLS[index];
}

function getReelElement(index) {
    // indexは0, 1, 2。IDは reel-1, reel-2, reel-3
    return document.getElementById(`reel-${index + 1}`);
}

// ----------------------------------------------------------------------
// スロットのメイン処理
// ----------------------------------------------------------------------
function spin() {
    if (!allReelsStopped) {
        return;
    }

    if (currentMoney < BET_AMOUNT) {
        alert('持ち金が足りません！タイトルに戻ります。');
        navigateTo('title');
        return;
    }

    // 1. 賭け金を減らす
    currentMoney -= BET_AMOUNT;
    print(`currentMoney:${currentMoney}`);
    document.getElementById('money-display').textContent = currentMoney;
    document.getElementById('result-message').textContent = 'リール回転中... 1, 2, 3キーで止められます。';
    
    const spinButton = document.getElementById('spin-button');
    spinButton.disabled = true;
    allReelsStopped = false;

    // 2. 全リールを回転状態にする
    for (let i = 0; i < REEL_COUNT; i++) {
        isSpinning[i] = true;
        
        // リールを視覚的に回転させるインターバルを設定
        spinIntervals[i] = setInterval(() => {
            const reel = getReelElement(i);
            reel.textContent = getRandomSymbol(); 
        }, 100); 
    }
}

// ----------------------------------------------------------------------
// リールを停止させる関数 (1, 2, 3キーで呼び出される)
// ----------------------------------------------------------------------
function stopReel(reelIndex) {
    // すでに停止している、または回転中でなければ無視
    if (!isSpinning[reelIndex]) {
        return;
    }

    // 1. インターバルをクリアして回転を止める
    clearInterval(spinIntervals[reelIndex]);
    isSpinning[reelIndex] = false;
    
    // 2. 最終結果のシンボルを決定し、表示を確定する
    const finalSymbol = getRandomSymbol(); 
    reelResults[reelIndex] = finalSymbol;
    print(`reelResults[${reelIndex}]:${finalSymbol}`);
    
    const reel = getReelElement(reelIndex);
    reel.textContent = finalSymbol; 
    
    // 3. 全てのリールが停止したかチェック
    if (isSpinning.every(state => state === false)) {
        allReelsStopped = true;
        document.getElementById('spin-button').disabled = false;
        
        // 勝敗判定を実行
        checkWin(reelResults);
    }
}

// ----------------------------------------------------------------------
// キーイベントのリスナー
// ----------------------------------------------------------------------
window.addEventListener('keydown', (event) => {
    // 全てのリールが停止しているときはキー操作を無視
    if (allReelsStopped) {
        return;
    }
    
    let reelToStop = -1;

    if (event.key === '1') {
        reelToStop = 0; // 1列目 (インデックス0)
    } else if (event.key === '2') {
        reelToStop = 1; // 2列目 (インデックス1)
    } else if (event.key === '3') {
        reelToStop = 2; // 3列目 (インデックス2)
    }
    
    if (reelToStop !== -1) {
        event.preventDefault();
        stopReel(reelToStop);
    }
});

// ----------------------------------------------------------------------
// 勝敗判定ロジック
// ----------------------------------------------------------------------
function checkWin(result) {
    const isThreeOfAKind = result[0] === result[1] && result[1] === result[2];
    let message = '';
    
    if (isThreeOfAKind) {
        const symbol = result[0];
        const payoutAction = PAYOUTS[symbol];
        
        if (payoutAction === 'HALF') {
            const penalty = Math.floor(currentMoney / 2);
            print(`penalty:${penalty}`);
            currentMoney -= penalty;
            message = `ペナルティ! ❻が揃ったため、持ち金${penalty}円を失い、残り${currentMoney}円になりました...😭`;
        } else {
            const winnings = payoutAction;
            currentMoney += winnings;
            
            if (winnings > 0) {
                message = `🎉🎉 ${symbol}揃い! ${winnings}円を獲得しました! 🎉🎉`;
            } else {
                message = `⛱️ 揃い。ハズレですが、リールが揃っただけでもすごい!`;
            }
        }
    } else {
        message = '残念! スロットが揃いませんでした...';
    }

    document.getElementById('result-message').textContent = message;
    document.getElementById('money-display').textContent = currentMoney;
    
    if (currentMoney <= 0) {
        alert('持ち金がなくなりました。ゲームオーバーです...');
        navigateTo('title'); 
    }
}

// ----------------------------------------------------------------------
// ページ切り替えロジック
// ----------------------------------------------------------------------

// URLから 'type' パラメータを取得
function getPageTypeFromUrl() {
    const params = new URLSearchParams(window.location.search);
    const type = params.get('type') || 'title';
    print(`type:${type}`); 
    return type;
}

// 画面を表示する
function showPage(pageType) {
    const pages = document.querySelectorAll('.game-page');
    
    pages.forEach(page => {
        page.classList.remove('active');
    });

    const targetId = pageType + '-screen';
    const targetPage = document.getElementById(targetId);
    
    if (targetPage) {
        targetPage.classList.add('active');
        // スロット画面に切り替わったときの初期化
        if (pageType === 'slot') {
            document.getElementById('money-display').textContent = currentMoney;
            document.getElementById('result-message').textContent = `スピンボタンを押してください (1回 ${BET_AMOUNT}円)`;
            allReelsStopped = true; 
        }
    } else {
        showPage('title'); 
    }
}

// ページ遷移を実行し、URLを更新
function navigateTo(pageType) {
    let newSearch = '';
    
    if (pageType !== 'title') {
        newSearch = `?type=${pageType}`;
    }

    // history APIでURLを更新 (リロードなし)
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
