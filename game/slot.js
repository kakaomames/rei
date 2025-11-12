// slot.js

// ----------------------------------------------------------------------
// スロットゲームの定義と状態管理
// ----------------------------------------------------------------------
const SYMBOLS = ['❼', '👑', '🍋', '☘️', '💎', '🍒', '⛱️', '❻'];
const PAYOUTS = {
    '❼': 10000, '👑': 5000, '💎': 3000, '🍒': 2000, '🍋': 1000, '☘️': 500, '⛱': 0, '❻': 'HALF' 
};
const REEL_COUNT = 3;

// スロット専用の状態変数
let reelResults = Array(REEL_COUNT).fill(''); 
let isSpinning = Array(REEL_COUNT).fill(false);
let allReelsStopped = true; 
const spinIntervals = Array(REEL_COUNT).fill(null);

// ----------------------------------------------------------------------
// 🚨 確率定義 (重み付け抽選用)
// ----------------------------------------------------------------------
const REEL_VISUAL_COUNT = 30; // アニメーションで縦に見せるシンボルの数

// 通常時の抽選リスト: 7は少なく、🍒🍋などは多い
const NORMAL_WEIGHTED_SYMBOLS = [
    '❼', '👑', '👑', '💎', '💎', '💎', 
    '🍒', '🍒', '🍒', '🍒', '🍋', '🍋', '🍋', '🍋', 
    '☘️', '☘️', '☘️', '⛱️', '⛱️', '❻' 
];

// 確率変動時の抽選リスト: 7の比率を上げ、⛱️❻の比率を下げる
const KAKUHEN_WEIGHTED_SYMBOLS = [
    '❼', '❼', '❼', '👑', '👑', '👑', '💎', '💎', 
    '🍒', '🍒', '🍋', '🍋', '☘️', '⛱️', '❻'
];


// ----------------------------------------------------------------------
// ヘルパー関数
// ----------------------------------------------------------------------
function getRandomSymbol() {
    // 🚨 script.js から isKakuhen を参照して抽選配列を切り替える
    // isKakuhenはscript.jsで let isKakuhen = false; と定義されている前提
    const weightedArray = isKakuhen ? KAKUHEN_WEIGHTED_SYMBOLS : NORMAL_WEIGHTED_SYMBOLS;
    
    const index = Math.floor(Math.random() * weightedArray.length);
    return weightedArray[index];
}

function getReelElement(index) {
    return document.getElementById(`reel-${index + 1}`);
}

// 🚨 新規追加: リールにシンボルをセットする関数 (アニメーション用)
function setReelSymbols(reelElement) {
    let symbolsHtml = '';
    // REEL_VISUAL_COUNT の数だけシンボルを生成
    for (let i = 0; i < REEL_VISUAL_COUNT; i++) {
        const symbol = getRandomSymbol();
        // 各シンボルは高さ100pxの要素として配置
        symbolsHtml += `<div style="height: 100px; display: flex; align-items: center; justify-content: center;">${symbol}</div>`;
    }
    reelElement.innerHTML = symbolsHtml;
}

// ----------------------------------------------------------------------
// スロット画面初期化 (script.jsのshowPageから呼ばれる)
// ----------------------------------------------------------------------
function initSlotGame() {
    // 持ち金の表示を更新
    const moneyEl = document.getElementById('money-display');
    const messageEl = document.getElementById('result-message');
    if (moneyEl) moneyEl.textContent = currentMoney;
    if (messageEl) messageEl.textContent = `スピンボタンを押してください (1回 ${BET_AMOUNT}円)`;
    
    // リールを初期シンボルに戻す
    for(let i = 0; i < REEL_COUNT; i++) {
        const reel = getReelElement(i);
        if(reel) {
             reel.textContent = '?';
             reel.classList.remove('spinning');
             reel.style.transform = `translateY(0)`; // 位置をリセット
        }
    }

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
    document.getElementById('result-message').textContent = 'リール回転中... リールをタップして止められます。';
    
    document.getElementById('spin-button').disabled = true;
    allReelsStopped = false;
    isSpinning.fill(true); // リールをスピン状態にする

    for (let i = 0; i < REEL_COUNT; i++) {
        const reel = getReelElement(i);
        
        // 🚨 修正1: リールに長いシンボルリストを設定
        setReelSymbols(reel); 
        
        // 🚨 修正2: アニメーション開始クラスを追加 (CSSアニメーションが開始)
        reel.classList.add('spinning');
        reel.style.transition = 'none'; // CSSアニメーションに干渉しないように
        reel.style.transform = 'translateY(0)';
    }
}

// ----------------------------------------------------------------------
// リール停止処理 (キーダウンイベント or タップ/onclickから呼び出される)
// ----------------------------------------------------------------------
function stopReel(reelIndex) {
    if (!isSpinning[reelIndex]) return;

    isSpinning[reelIndex] = false;
    
    const finalSymbol = getRandomSymbol(); 
    reelResults[reelIndex] = finalSymbol;
    print(`reelResults[${reelIndex}]:${finalSymbol}`);
    
    const reel = getReelElement(reelIndex);
    if (reel) {
        // 🚨 修正1: アニメーションを停止
        reel.classList.remove('spinning'); 
        
        // 🚨 修正2: 確定演出（最後のシンボルを表示）
        
        // ランダムな位置に最終結果のシンボルを挿入した短いリストを再設定
        // 最終シンボルを中央に表示するために、前後にもシンボルを用意する
        reel.innerHTML = `
            <div style="height: 100px; display: flex; align-items: center; justify-content: center;">${getRandomSymbol()}</div>
            <div style="height: 100px; display: flex; align-items: center; justify-content: center; font-size: 50px;">${finalSymbol}</div>
            <div style="height: 100px; display: flex; align-items: center; justify-content: center;">${getRandomSymbol()}</div>
        `;
        
        // 停止時のビジュアル調整: 短いtransitionを有効にし、少しスクロールして確定させる
        // 中央のシンボルが枠内にくるようにY軸を調整（300px = 枠外のシンボル数 * 100px）
        const stopOffset = Math.floor(Math.random() * 50) + 200; // 200px + ランダムなガタつき
        
        reel.style.transition = `transform 0.2s ease-out`;
        reel.style.transform = `translateY(-${stopOffset}px)`; // 一旦ランダムな位置で止まる

        // 停止アニメーション完了を待ってから、最終結果に固定する
        setTimeout(() => {
            reel.style.transition = `none`;
            reel.style.transform = `translateY(-100px)`; // 最終シンボルが中央(100px)に来る位置に固定
            reel.textContent = finalSymbol; // 完全に固定後はテキストのみに戻す
        }, 250); 
    } 
    
    // 全てのリールが停止したかチェック
    if (isSpinning.every(state => state === false)) {
        allReelsStopped = true;
        document.getElementById('spin-button').disabled = false;
        checkWin(reelResults);
    }
}

// ----------------------------------------------------------------------
// キーイベントのリスナー (キーボード対応)
// ----------------------------------------------------------------------
window.addEventListener('keydown', (event) => {
    // スロット画面にいるか、かつスピン中かチェック
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

            // 🚨 確変突入の判定
            if (symbol === '❼' || symbol === '👑') {
                isKakuhen = true; // script.jsの変数を変更
                message += ` 💥確変突入！当たりやすくなりました！💥`;
            }
        }
    } else {
        message = '残念! スロットが揃いませんでした...';
        
        // 🚨 確変終了の判定
        if (isKakuhen) {
            isKakuhen = false; // script.jsの変数を変更
            message += ` ⚡️確変が終了し、通常時へ戻ります。`;
        }
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
