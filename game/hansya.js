/**
 * 反射神経ゲームのHTMLコンテンツ全体をロードし、documentを置き換える関数です。
 * HTMLファイルがこのスクリプトを読み込んだ際に自動的に実行されます。
 */
function loadReactionGame() {
    // HTMLコンテンツ（<head>と<body>の中身）を全て含む文字列
    // 注意: スタイルとスクリプトはこの文字列内に完全に埋め込まれています
    const gameHtmlContent = `
        <head>
            <meta charset="UTF-8">
            <meta name="viewport" content="width=device-width, initial-scale=1.0">
            <title>反射神経ゲーム</title>

            <style>
                body {
                    font-family: 'Arial', sans-serif;
                    display: flex;
                    flex-direction: column;
                    align-items: center;
                    justify-content: center;
                    min-height: 100vh;
                    margin: 0;
                    background-color: #f0f8ff; /* 初期背景色 */
                    color: #333;
                    transition: background-color 0.5s;
                }

                #game-area {
                    width: 400px;
                    height: 400px;
                    background-color: #eee;
                    border: 5px solid #333;
                    border-radius: 10px;
                    position: relative;
                    cursor: pointer;
                    display: flex;
                    align-items: center;
                    justify-content: center;
                    margin-bottom: 20px;
                    user-select: none;
                    overflow: hidden;
                }

                #target {
                    width: 80px;
                    height: 80px;
                    background-color: #ff6347; /* 初期ターゲット色 */
                    border-radius: 50%;
                    position: absolute;
                    display: none;
                    transform: translate(-50%, -50%);
                    transition: background-color 0.1s, transform 0.05s;
                }
                
                #target:active {
                     transform: translate(-50%, -50%) scale(0.95);
                }

                #message {
                    margin-top: 20px;
                    font-size: 1.2em;
                    font-weight: bold;
                    color: #008080;
                }

                .result {
                    font-size: 1.5em;
                    color: #4682b4;
                }

                .instruction {
                    color: #555;
                    margin-bottom: 10px;
                }

                /* ホームに戻るリンクのスタイル（ゲーム画面用） */
                .home-link {
                    color: #1e90ff;
                    text-decoration: none;
                    margin-top: 30px;
                    padding: 10px 20px;
                    border: 2px solid #1e90ff;
                    border-radius: 5px;
                    transition: background-color 0.3s, color 0.3s;
                }

                .home-link:hover {
                    background-color: #1e90ff;
                    color: white;
                }
                
                /* --- ストア関連スタイル --- */
                #store {
                    margin-top: 20px;
                    padding: 15px;
                    border: 2px solid #ccc;
                    border-radius: 8px;
                    background-color: rgba(255, 255, 255, 0.8);
                    width: 400px;
                }

                .item {
                    display: flex;
                    justify-content: space-between;
                    align-items: center;
                    padding: 5px 0;
                    border-bottom: 1px dashed #eee;
                }
                
                .item:last-child {
                    border-bottom: none;
                }

                .buy-button {
                    background-color: #4CAF50;
                    color: white;
                    border: none;
                    padding: 5px 10px;
                    text-align: center;
                    text-decoration: none;
                    display: inline-block;
                    font-size: 14px;
                    cursor: pointer;
                    border-radius: 4px;
                    transition: background-color 0.3s;
                    min-width: 60px;
                }
                
                .buy-button:disabled {
                    background-color: #aaa;
                    cursor: not-allowed;
                }
            </style>
        </head>
        <body>

            <h1>🚀 反射神経テストゲーム</h1>
            <p class="instruction">現在のコイン: <span id="coin-display">0</span> 🪙</p>
            <p class="instruction">「スタート！」の表示後、丸が表示されたらすぐにクリックしてください。</p>
            <div id="game-area">
                <div id="target"></div>
                <div id="message">クリックでスタート！</div>
            </div>
            <div id="result" class="result"></div>
            
            <h2>🛒 カスタマイズストア</h2>
            <div id="store">
                </div>
            
            <script>
                // DOM要素の取得
                const gameArea = document.getElementById('game-area');
                const target = document.getElementById('target');
                const message = document.getElementById('message');
                const resultDisplay = document.getElementById('result');
                const coinDisplay = document.getElementById('coin-display');
                const storeDiv = document.getElementById('store');

                // --- ゲームの状態とローカルストレージの管理 ---

                let gameState = {
                    coins: 0,
                    targetColor: '#ff6347',
                    backgroundColor: '#f0f8ff',
                    purchasedItems: []
                };
                console.log(\`初期 gameState:\`, gameState); 

                // 購入可能なアイテムの定義
                const items = [
                    { id: 't_blue', name: '🔵 ターゲット(青)', type: 'target', value: 'blue', colorCode: '#1e90ff', price: 100, isOwned: false },
                    { id: 't_green', name: '🟢 ターゲット(緑)', type: 'target', value: 'green', colorCode: '#3cb371', price: 200, isOwned: false },
                    { id: 'b_dark', name: '🌌 背景(ダーク)', type: 'background', value: 'dark', colorCode: '#333333', price: 150, isOwned: false },
                    { id: 'b_light', name: '☀️ 背景(ホワイト)', type: 'background', value: 'light', colorCode: '#ffffff', price: 100, isOwned: false }
                ];
                console.log(\`items:\`, items);

                /**
                 * ローカルストレージからデータをロードし、スタイルを適用します。
                 */
                function loadState() {
                    const storedState = localStorage.getItem('reactionGame_gameState');
                    if (storedState) {
                        gameState = JSON.parse(storedState);
                        console.log(\`ロード後の gameState:\`, gameState);
                    } else {
                         gameState.purchasedItems.push('t_default', 'b_default');
                    }
                    
                    items.forEach(item => {
                        item.isOwned = gameState.purchasedItems.includes(item.id);
                    });
                    
                    applyStyles();
                    updateUI();
                }

                /**
                 * 現在のゲーム状態をローカルストレージに保存します。
                 */
                function saveState() {
                    localStorage.setItem('reactionGame_gameState', JSON.stringify(gameState));
                    console.log(\`保存された gameState:\`, gameState);
                }

                /**
                 * コインの表示とスタイルを更新し、ストアを再描画します。
                 */
                function updateUI() {
                    coinDisplay.textContent = gameState.coins;
                    renderStore();
                }

                /**
                 * 現在の状態に基づいてゲームのスタイル（色、背景）を適用します。
                 */
                function applyStyles() {
                    document.body.style.backgroundColor = gameState.backgroundColor;
                    target.style.backgroundColor = gameState.targetColor;
                }
                
                /**
                 * 反応時間に基づいてコインを付与します。
                 */
                function getCoinReward(time) {
                    let reward = 0;
                    if (time < 150) {
                        reward = 50; 
                    } else if (time < 200) {
                        reward = 30; 
                    } else if (time < 300) {
                        reward = 10; 
                    } else if (time < 500) {
                        reward = 5;  
                    }
                    console.log(\`反応時間: \${time.toFixed(0)}ms, 獲得コイン: \${reward}\`);
                    return reward;
                }

                // --- ストア機能の管理 ---

                /**
                 * ストアアイテムを画面に描画します。
                 */
                function renderStore() {
                    storeDiv.innerHTML = '';
                    items.forEach(item => {
                        const itemDiv = document.createElement('div');
                        itemDiv.className = 'item';
                        
                        const status = item.isOwned ? '✅ 所有済み' : \`\${item.price} 🪙\`;
                        let buttonText = item.isOwned ? '適用' : '購入';
                        
                        const isCurrentTarget = item.type === 'target' && gameState.targetColor === item.colorCode;
                        const isCurrentBackground = item.type === 'background' && gameState.backgroundColor === item.colorCode;
                        const isCurrent = isCurrentTarget || isCurrentBackground;
                        
                        if (isCurrent) {
                            buttonText = '適用中';
                        }

                        itemDiv.innerHTML = \`
                            <span>\${item.name} <span style="color: \${item.colorCode};">■</span></span>
                            <span>\${status}</span>
                            <button id="btn_\${item.id}" class="buy-button" 
                                data-id="\${item.id}" 
                                data-price="\${item.price}" 
                                data-color="\${item.colorCode}"
                                data-type="\${item.type}"
                                \${isCurrent ? 'disabled' : ''}>
                                \${buttonText}
                            </button>
                        \`;
                        storeDiv.appendChild(itemDiv);
                    });
                    // ボタンにイベントリスナーを設定
                    document.querySelectorAll('.buy-button').forEach(button => {
                        button.addEventListener('click', handleStoreAction);
                    });
                }

                /**
                 * ストアボタンがクリックされた時の処理です。
                 */
                function handleStoreAction(e) {
                    const button = e.currentTarget;
                    const itemId = button.getAttribute('data-id');
                    const itemPrice = parseInt(button.getAttribute('data-price'));
                    const itemColor = button.getAttribute('data-color');
                    const itemType = button.getAttribute('data-type');
                    
                    const item = items.find(i => i.id === itemId);
                    console.log(\`ストアアクション: itemID=\${itemId}, type=\${itemType}\`);
                    
                    if (!item.isOwned) {
                        // --- 購入処理 ---
                        if (gameState.coins >= itemPrice) {
                            gameState.coins -= itemPrice;
                            gameState.purchasedItems.push(itemId);
                            item.isOwned = true;
                            alert(\`\${item.name} を購入しました！\`);
                            console.log(\`コイン消費: \${itemPrice}, 残高: \${gameState.coins}\`);
                        } else {
                            alert('コインが不足しています！もっと反射神経を鍛えましょう！');
                            return;
                        }
                    }
                    
                    // --- 適用処理 ---
                    if (itemType === 'target') {
                        gameState.targetColor = itemColor;
                    } else if (itemType === 'background') {
                        gameState.backgroundColor = itemColor;
                    }

                    applyStyles();
                    saveState();
                    updateUI(); 
                }

                // --- ゲームロジック ---

                // ゲームの状態を管理する変数（ゲームプレイ専用）
                let isWaiting = false; 
                let isGameStarted = false; 
                let startTime = 0; 
                let waitTimeout; 

                function moveTarget() {
                    const areaWidth = gameArea.clientWidth;
                    const areaHeight = gameArea.clientHeight;
                    const targetSize = target.clientWidth;
                    const maxX = areaWidth - targetSize / 2;
                    const maxY = areaHeight - targetSize / 2;
                    const min = targetSize / 2;

                    const x = Math.floor(Math.random() * (maxX - min)) + min;
                    const y = Math.floor(Math.random() * (maxY - min)) + min;

                    target.style.left = \`\${x}px\`;
                    target.style.top = \`\${y}px\`;
                    console.log(\`targetの位置: (\${x}, \${y})\`);
                }

                function startGame() {
                    if (isGameStarted) return;
                    
                    isGameStarted = true;
                    console.log(\`isGameStarted:\${isGameStarted}\`);
                    
                    resultDisplay.textContent = '';
                    target.style.display = 'none';
                    message.textContent = '👀 スタート！ 丸を待て...';
                    
                    const waitTime = Math.random() * 4000 + 1000; 
                    console.log(\`waitTime:\${waitTime}ms\`);
                    
                    waitTimeout = setTimeout(showTarget, waitTime);
                    isWaiting = true;
                    console.log(\`isWaiting:\${isWaiting}\`);
                }

                function showTarget() {
                    if (!isWaiting) return; 

                    isWaiting = false;
                    console.log(\`isWaiting:\${isWaiting}\`);
                    
                    moveTarget();
                    target.style.display = 'block'; 
                    
                    startTime = performance.now();
                    console.log(\`startTime:\${startTime}\`);
                    
                    message.textContent = '⚡️ 今すぐクリック！';
                }

                function clickHandler(e) {
                    if (e.target.id === 'target') {
                        // --- ターゲットクリック時（成功） ---
                        if (startTime !== 0) {
                            const endTime = performance.now();
                            console.log(\`endTime:\${endTime}\`);
                            
                            const reactionTime = endTime - startTime;
                            const roundedTime = reactionTime.toFixed(0);

                            // 報酬計算と付与
                            const reward = getCoinReward(reactionTime);
                            gameState.coins += reward;
                            saveState(); 
                            updateUI(); 

                            message.textContent = \`🎉 反応時間: \${roundedTime}ms (+\${reward}コイン)\`;
                            resultDisplay.textContent = \`あなたの記録: \${roundedTime}ミリ秒\`;

                            // 状態をリセット
                            startTime = 0;
                            target.style.display = 'none';
                            isGameStarted = false;
                            console.log(\`isGameStarted:\${isGameStarted}\`);
                            
                            setTimeout(() => {
                                message.textContent = 'もう一度クリックでスタート！';
                            }, 2000); 
                        }
                    } else if (e.target.id === 'game-area') {
                        // --- game-areaクリック時 ---
                        if (!isGameStarted) {
                            startGame();
                        } else if (isWaiting) {
                            clearTimeout(waitTimeout);
                            isWaiting = false;
                            isGameStarted = false;
                            startTime = 0;
                            console.log(\`isWaiting:\${isWaiting}\`);
                            console.log(\`isGameStarted:\${isGameStarted}\`);
                            
                            message.textContent = '❌ フライング！もう一度クリックでやり直し。';
                            resultDisplay.textContent = 'フライングペナルティ！';
                        }
                        
                    }
                }

                // --- 初期化処理 ---
                
                // ページロード時に状態をロードし、ゲームの準備を完了
                // 注意: DOM要素がロードされた後に実行されるように、このコードブロックの最後に配置
                loadState(); 
                
                // クリックイベントリスナーを設定
                gameArea.addEventListener('click', clickHandler);
                
            </script>

            <a href="#" class="home-link">ホームに戻る</a>
        </body>
    `;

    // document全体を新しいHTMLコンテンツに置き換える
    document.open();
    document.write('<!DOCTYPE html><html>' + gameHtmlContent + '</html>');
    document.close();
}

// 外部JSファイルとして読み込まれたら、すぐにゲームをロードする関数を実行
// これにより、HTMLのコンテンツ全体がゲームに置き換わります。
loadReactionGame();
