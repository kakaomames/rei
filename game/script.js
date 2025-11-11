// script.js

// 🚨 デバッグ関数
function print(value) {
    console.log(`[PRINT_VALUE] ${value}`);
}

// ----------------------------------------------------------------------
// 状態管理変数 (グローバルに維持されます)
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
let currentMoney = 5000; // 持ち金はJS内で維持

// ----------------------------------------------------------------------
// ページ遷移ロジック (HTML上書きのため、機能を簡略化)
// ----------------------------------------------------------------------

// 画面を遷移させ、URLを更新する関数
function navigateTo(pageType) {
    let newSearch = '';
    
    if (pageType !== 'title') {
        newSearch = `?type=${pageType}`;
    }

    // URLを更新 (リロードなし)
    history.pushState(null, '', newSearch);
    
    // 画面全体を再描画
    renderPage(pageType);
}

// URLの 'type' パラメータを取得
function getPageTypeFromUrl() {
    const params = new URLSearchParams(window.location.search);
    const type = params.get('type') || 'title';
    print(`type:${type}`); 
    return type;
}

// ブラウザの「戻る/進む」ボタンに対応
window.addEventListener('popstate', () => {
    const pageType = getPageTypeFromUrl();
    renderPage(pageType); // 画面全体を再描画
});

// ----------------------------------------------------------------------
// 🚨 メインの描画関数: body全体を上書き
// ----------------------------------------------------------------------
function renderPage(pageType) {
    let htmlContent = '';
    
    // 描画する画面を選択
    if (pageType === 'slot') {
        htmlContent = getSlotScreenHtml();
    } else if (pageType === 'game1') {
        htmlContent = getGame1ScreenHtml();
    } else {
        // デフォルトはタイトル画面
        htmlContent = getTitleScreenHtml();
    }

    // 🚨 document.body の中身を上書き
    document.body.innerHTML = htmlContent;
    
    // 警告やメッセージをクリア
    document.getElementById('result-message')?.textContent = `スピンボタンを押してください (1回 ${BET_AMOUNT}円)`;

    // スロット画面の場合は、キーボードイベントを再登録する必要がある
    if (pageType === 'slot') {
        // 毎回 body が上書きされるため、リール停止ロジックを再実行できる状態にする
        allReelsStopped = true; 
        
        // 毎回イベントリスナーを再登録する処理が必要だが、今回は簡略化のため
        // キーイベントのリスナーはグローバルに維持されていると仮定し、
        // 処理に必要な要素IDが再構築されていることを利用します。
        
        // 持ち金の表示を更新
        document.getElementById('money-display').textContent = currentMoney;
    }
}

// ----------------------------------------------------------------------
// ページごとのHTMLテンプレート
// ----------------------------------------------------------------------
function getTitleScreenHtml() {
    return `
        <section id="title-screen" class="game-page active">
            <h1>ゲーム選択画面</h1>
            <p>
                <button onclick="navigateTo('game1')">ゲーム1へ (type=game1)</button>
                <button onclick="navigateTo('slot')">スロットへ (type=slot)</button>
            </p>
        </section>
    `;
}

function getGame1ScreenHtml() {
    return `
        <section id="game1-screen" class="game-page active">
            <h2>🎮 ゲーム1 画面</h2>
            <p>ここが ?type=game1 で表示される画面です。</p>
            <p><button onclick="navigateTo('title')">タイトルに戻る</button></p>
        </section>
    `;
}

function getSlotScreenHtml() {
    // スロット画面のHTML
    return `
        <section id="slot-screen" class="game-page active">
            <h2>💰 持ち金: <span id="money-display">${currentMoney}</span> 円</h2>
            
            <div id="reels-container">
                <div class="reel-box"><div id="reel-1" class="reel">?</div></div>
                <div class="reel-box"><div id="reel-2" class="reel">?</div></div>
                <div class="reel-box"><div id="reel-3" class="reel">?</div></div>
            </div>
            
            <p id="result-message">スピンボタンを押してください (1回 ${BET_AMOUNT}円)</p>
            
            <button id="spin-button" onclick="spin()">スピン！</button>
            <p style="margin-top: 20px;"><button onclick="navigateTo('title')">タイトルに戻る</button></p>
        </section>
    `;
}

// ----------------------------------------------------------------------
// スロットのゲームロジック (HTML上書き方式に合わせて調整)
// ----------------------------------------------------------------------
const REEL_COUNT = 3;
// reelResults, isSpinning, spinIntervals は、関数外（グローバル）で定義されていることが前提
let reelResults = Array(REEL_COUNT).fill(''); 
let isSpinning = Array(REEL_COUNT).fill(false);
let allReelsStopped = true; 
const spinIntervals = Array(REEL_COUNT).fill(null);

function getRandomSymbol() {
    const index = Math.floor(Math.random() * SYMBOLS.length);
    return SYMBOLS[index];
}

function getReelElement(index) {
    // 描画後にDOMから取得
    return document.getElementById(`reel-${index + 1}`);
}

function spin() {
    // 描画関数内で isSpinning がリセットされているので、再チェック
    if (!allReelsStopped) { return; }

    if (currentMoney < BET_AMOUNT) {
        alert('持ち金が足りません！タイトルに戻ります。');
        navigateTo('title');
        return;
    }

    currentMoney -= BET_AMOUNT;
    print(`currentMoney:${currentMoney}`);
    document.getElementById('money-display').textContent = currentMoney;
    document.getElementById('result-message').textContent = 'リール回転中... 1, 2, 3キーで止められます。';
    
    const spinButton = document.getElementById('spin-button');
    spinButton.disabled = true;
    allReelsStopped = false;
    isSpinning = Array(REEL_COUNT).fill(true); // リセット

    for (let i = 0; i < REEL_COUNT; i++) {
        spinIntervals[i] = setInterval(() => {
            const reel = getReelElement(i);
            if (reel) reel.textContent = getRandomSymbol(); 
        }, 100); 
    }
}

function stopReel(reelIndex) {
    if (!isSpinning[reelIndex]) { return; }

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

// キーイベントのリスナーは body 上書き後もグローバルに維持されますが、
// DOM要素が再構築されるため、操作の際は renderPage 後に要素の存在チェックが必要です。
window.addEventListener('keydown', (event) => {
    // スロット画面でない、またはスピン中でなければ無視
    if (getPageTypeFromUrl() !== 'slot' || allReelsStopped) {
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
        // ゲームオーバー後は強制的にタイトルに戻し、持ち金をリセット
        currentMoney = 5000;
        navigateTo('title'); 
    }
}


// ----------------------------------------------------------------------
// ページ読み込み時の初期表示
// ----------------------------------------------------------------------
document.addEventListener('DOMContentLoaded', () => {
    const initialPageType = getPageTypeFromUrl();
    // 最初の画面描画を実行
    renderPage(initialPageType);
});
