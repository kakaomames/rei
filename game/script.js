// script.js

// ----------------------------------------------------------------------
// スロットゲームの定義 (変更なし)
// ----------------------------------------------------------------------
const SYMBOLS = ['❼', '👑', '🍋', '☘️', '💎', '🍒', '⛱️', '❻'];
const PAYOUTS = {
    '❼': 10000, 
    '👑': 5000,
    '💎': 3000,
    '🍒': 2000,
    '🍋': 1000,
    '☘️': 500,
    '⛱️': 0, 
    '❻': 'HALF' 
};
const BET_AMOUNT = 100; 
let currentMoney = 5000; 

// ----------------------------------------------------------------------
// 🚨 新しい状態管理変数
// ----------------------------------------------------------------------
const REEL_COUNT = 3;
// リールの現在のシンボルを保持 (結果判定に使う)
const reelResults = Array(REEL_COUNT).fill(''); 
// リールのスピン状態を管理 (false: 停止, true: 回転中)
let isSpinning = Array(REEL_COUNT).fill(false);
// 全てのリールが停止したかどうかのフラグ
let allReelsStopped = true; 
// リールが回転し続けるためのインターバルID
const spinIntervals = Array(REEL_COUNT).fill(null);

// ----------------------------------------------------------------------
// シンボル取得とリール要素の取得 (変更なし)
// ----------------------------------------------------------------------
function getRandomSymbol() {
    const index = Math.floor(Math.random() * SYMBOLS.length);
    return SYMBOLS[index];
}

function getReelElement(index) {
    return document.getElementById(`reel-${index + 1}`);
}

// ----------------------------------------------------------------------
// スロットのメイン処理
// ----------------------------------------------------------------------
function spin() {
    // スピン中であれば、多重起動を防止
    if (!allReelsStopped) {
        console.log('まだスピン中です。');
        return;
    }

    // 持ち金チェック
    if (currentMoney < BET_AMOUNT) {
        alert('持ち金が足りません！タイトルに戻ります。');
        navigateTo('title');
        return;
    }

    // 1. 賭け金を減らす
    currentMoney -= BET_AMOUNT;
    print(f"currentMoney:{currentMoney}");
    document.getElementById('money-display').textContent = currentMoney;
    document.getElementById('result-message').textContent = 'リール回転中... 1, 2, 3キーで止められます。';
    
    const spinButton = document.getElementById('spin-button');
    spinButton.disabled = true; // スピン中はボタンを無効化
    allReelsStopped = false;

    // 2. 全リールを回転状態にする
    for (let i = 0; i < REEL_COUNT; i++) {
        isSpinning[i] = true;
        
        // リールを視覚的に回転させるインターバルを設定
        spinIntervals[i] = setInterval(() => {
            const reel = getReelElement(i);
            // ランダムなシンボルを次々に表示し、回転しているように見せる
            reel.textContent = getRandomSymbol(); 
        }, 100); 
    }
}

// ----------------------------------------------------------------------
// 🚨 リールを停止させる関数
// ----------------------------------------------------------------------
function stopReel(reelIndex) {
    // 0, 1, 2 (1列目, 2列目, 3列目)
    
    // すでに停止している、またはそもそも回転中でなければ何もしない
    if (!isSpinning[reelIndex]) {
        return;
    }

    // 1. インターバルをクリアして回転を止める
    clearInterval(spinIntervals[reelIndex]);
    isSpinning[reelIndex] = false;
    
    // 2. 最終結果のシンボルを決定し、表示を確定する
    const finalSymbol = getRandomSymbol(); // 停止時のシンボルを決定
    reelResults[reelIndex] = finalSymbol;
    print(f"reelResults[{reelIndex}]:{finalSymbol}");
    
    const reel = getReelElement(reelIndex);
    reel.textContent = finalSymbol; // 最終結果を表示
    
    console.log(`${reelIndex + 1}列目が停止: ${finalSymbol}`);

    // 3. 全てのリールが停止したかチェック
    if (isSpinning.every(state => state === false)) {
        allReelsStopped = true;
        console.log('全てのリールが停止しました。');
        document.getElementById('spin-button').disabled = false;
        
        // 勝敗判定を実行
        checkWin(reelResults);
    }
}

// ----------------------------------------------------------------------
// 🚨 キーイベントのリスナーを追加
// ----------------------------------------------------------------------
window.addEventListener('keydown', (event) => {
    // スピン中でなければキー操作を無視
    if (allReelsStopped) {
        return;
    }
    
    let reelToStop = -1; // 停止させるリールのインデックス

    if (event.key === '1') {
        reelToStop = 0; // 1列目
    } else if (event.key === '2') {
        reelToStop = 1; // 2列目
    } else if (event.key === '3') {
        reelToStop = 2; // 3列目
    }
    
    if (reelToStop !== -1) {
        event.preventDefault(); // ブラウザのデフォルト動作をキャンセル
        stopReel(reelToStop);
    }
});

// ----------------------------------------------------------------------
// 勝敗判定ロジック (引数が reelResults に変わった以外、内容は変更なし)
// ----------------------------------------------------------------------
function checkWin(result) {
    // 3つが揃ったか判定
    const isThreeOfAKind = result[0] === result[1] && result[1] === result[2];
    let message = '';
    
    if (isThreeOfAKind) {
        const symbol = result[0];
        const payoutAction = PAYOUTS[symbol];
        
        if (payoutAction === 'HALF') {
            // [❻, ❻, ❻] のペナルティ: 持ち金半分、小数点以下切り捨て
            const penalty = Math.floor(currentMoney / 2);
            print(f"penalty:{penalty}");
            currentMoney -= penalty;
            message = `ペナルティ! ❻が揃ったため、持ち金${penalty}円を失い、残り${currentMoney}円になりました...😭`;
        } else {
            // 通常の勝利
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
    
    // 持ち金が0になった場合のゲームオーバー処理
    if (currentMoney <= 0) {
        alert('持ち金がなくなりました。ゲームオーバーです...');
        navigateTo('title'); 
    }
}

// ----------------------------------------------------------------------
// ページ切り替えロジック (変更なし)
// ----------------------------------------------------------------------

function getPageTypeFromUrl() {
    const params = new URLSearchParams(window.location.search);
    const type = params.get('type') || 'title';
    print(f"type:{type}"); 
    return type;
}

function showPage(pageType) {
    const pages = document.querySelectorAll('.game-page');
    
    pages.forEach(page => {
        page.classList.remove('active');
    });

    const targetId = pageType + '-screen';
    const targetPage = document.getElementById(targetId);
    
    if (targetPage) {
        targetPage.classList.add('active');
        if (pageType === 'slot') {
            document.getElementById('money-display').textContent = currentMoney;
            document.getElementById('result-message').textContent = `スピンボタンを押してください (1回 ${BET_AMOUNT}円)`;
            // スロット画面に移動した際、キー入力を受け付ける準備
            allReelsStopped = true; 
        }
    } else {
        showPage('title'); 
    }
}

function navigateTo(pageType) {
    let newSearch = '';
    
    if (pageType !== 'title') {
        newSearch = `?type=${pageType}`;
    }

    history.pushState(null, '', newSearch);
    showPage(pageType);
}

window.addEventListener('popstate', () => {
    const pageType = getPageTypeFromUrl();
    showPage(pageType);
});

document.addEventListener('DOMContentLoaded', () => {
    const initialPageType = getPageTypeFromUrl();
    showPage(initialPageType);
});
