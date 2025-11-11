// slot.js

// ----------------------------------------------------------------------
// スロットゲームの定義と状態管理
// ----------------------------------------------------------------------
const SYMBOLS = ['❼', '👑', '🍋', '☘️', '💎', '🍒', '⛱️', '❻'];
const PAYOUTS = {
    '❼': 10000, '👑': 5000, '💎': 3000, '🍒': 2000, '🍋': 1000, '☘️': 500, '⛱': 0, '❻': 'HALF' 
};
const REEL_COUNT = 3;

// スロット専用の状態変数 (script.jsから分離)
let reelResults = Array(REEL_COUNT).fill(''); 
let isSpinning = Array(REEL_COUNT).fill(false);
let allReelsStopped = true; 
const spinIntervals = Array(REEL_COUNT).fill(null);

// ----------------------------------------------------------------------
// ヘルパー関数
// ----------------------------------------------------------------------
function getRandomSymbol() {
    return SYMBOLS[Math.floor(Math.random() * SYMBOLS.length)];
}

function getReelElement(index) {
    return document.getElementById(`reel-${index + 1}`);
}

// ----------------------------------------------------------------------
// スロット画面初期化 (script.jsのshowPageから呼ばれる)
// ----------------------------------------------------------------------
function initSlotGame() {
    // 持ち金の表示を更新 (currentMoneyはscript.jsから参照)
    const moneyEl = document.getElementById('money-display');
    const messageEl = document.getElementById('result-message');
    if (moneyEl) moneyEl.textContent = currentMoney;
    if (messageEl) messageEl.textContent = `スピンボタンを押してください (1回 ${BET_AMOUNT}円)`;
    
    // 状態をリセット
    allReelsStopped = true; 
    isSpinning.fill(false);
}

// ----------------------------------------------------------------------
// スロットメイン処理 (HTMLのonclick="spin()"から呼び出される)
// ----------------------------------------------------------------------
function spin() {
    // script.jsから currentMoney と BET_AMOUNT を参照
    if (!allReelsStopped) return;
    if (currentMoney < BET_AMOUNT) {
        alert('持ち金が足りません！');
        return;
    }

    currentMoney -= BET_AMOUNT; // script.jsの変数を変更
    print(`currentMoney:${currentMoney}`);
    document.getElementById('money-display').textContent = currentMoney;
    document.getElementById('result-message').textContent = 'リール回転中... 1, 2, 3キーで止められます。';
    
    document.getElementById('spin-button').disabled = true;
    allReelsStopped = false;
    isSpinning.fill(true);

    for (let i = 0; i < REEL_COUNT; i++) {
        spinIntervals[i] = setInterval(() => {
            const reel = getReelElement(i);
            if (reel) reel.textContent = getRandomSymbol(); 
        }, 100); 
    }
}

// リール停止処理 (キーダウンイベントから呼び出される)
function stopReel(reelIndex) {
    if (!isSpinning[reelIndex]) return;

    clearInterval(spinIntervals[reelIndex]);
    isSpinning[reelIndex] = false;
    
    const finalSymbol = getRandomSymbol(); 
    reelResults[reelIndex] = finalSymbol;
    print(`reelResults[${reelIndex}]:${finalSymbol}`);
    
    const reel = getReelElement(reelIndex);
    if (reel) reel.textContent = finalSymbol; 
    
    if (isSpinning.every(state => state === false)) {
        allReelsStopped = true;
        document.getElementById('spin-button').disabled = false;
        checkWin(reelResults);
    }
}

// キーイベントのリスナー
window.addEventListener('keydown', (event) => {
    // スロット画面にいるか、かつスピン中かチェック
    // getPageTypeFromUrl() は script.js の関数
    if (typeof getPageTypeFromUrl === 'function' && getPageTypeFromUrl() !== 'slot') {
        return;
    }
    if (allReelsStopped) {
        return;
    }
    
    let reelToStop = -1;
    if (event.key === '1') { reelToStop = 0; } 
    else if (event.key === '2') { reelToStop = 1; } 
    else if (event.key === '3') { reelToStop = 2; }
    
    if (reelToStop !== -1) {
        event.preventDefault();
        stopReel(reelToStop);
    }
});

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
        currentMoney = 5000;
        // navigateTo() は script.js の関数
        if (typeof navigateTo === 'function') {
            navigateTo('title'); 
        }
    }
}
