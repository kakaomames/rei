// ====================================================
// ⚙️ ゲームロジックファイル (game.js)
// ====================================================

// state.jsで定義されたグローバル変数を参照:
// canvas, ctx, WIDTH, HEIGHT, isGameLoopRunning, isGameOver, isGameClear, 
// score, currentRebel, MAX_REBEL, gameData, player, bullets, enemies, boss, golem, 
// DEFENSE_STATS, isDay, timeOfDayTimer, TIME_CYCLE_DURATION, controlButtons, etc.

// 他のファイルで定義された関数を参照:
// addLog, loadSettings, drawGame, updatePlayer, updateEnemies, handleCollisions, goToHome, drawGameOver, drawGameClear

let gameLoopId;

/**
 * ゲームの初期化、データロード、初期画面遷移を行う
 */
async function loadGameData() {
    // 敵データやストアアイテムのJSONファイルを読み込む
    try {
        // 例: JSONデータの取得 (実際には fetch() を使用)
        const response = await fetch('./data/game_data.json');
        if (!response.ok) {
            throw new Error(`JSONロードエラー: ${response.status}`);
        }
        const data = await response.json();
        
        // データをグローバルな gameData に格納 (state.js で定義された変数)
        Object.assign(gameData, data);

        // state.js の player をここで初期化
        // Playerオブジェクトは player.js で初期化関数を用意する想定
        if (typeof initializePlayer === 'function') {
            player = initializePlayer(); 
            addLog("プレイヤー情報を初期化しました。");
        } else {
            // Playerオブジェクトの簡易的な代替 (player.js未ロードの場合)
            player = {
                x: WIDTH / 2, y: HEIGHT - 50, width: 30, height: 30, color: 'blue', 
                hp: 100, maxHp: 100, speed: 5, coins: 0, defenseLevel: 1, 
                inventory: {}, shieldCooldown: 0, isShielded: false, 
                unlockedGolemLevel: 0, debuff: { burning: 0, poison: 0, frozen: 0 }
            };
            addLog("⚠️ player.jsが見つかりません。簡易プレイヤーで続行します。");
        }
        
        // settings.js の設定をロード
        if (typeof loadSettings === 'function') {
            loadSettings();
        } else {
             addLog("⚠️ settings.jsのロードに失敗しました。");
        }
        
        addLog("ゲームデータを正常にロードしました。");
    } catch (error) {
        addLog(`致命的なエラー: ${error.message}`);
        console.error("ゲームデータロード失敗:", error);
        // エラーポップアップを表示
        if (typeof showPopupMessage === 'function') {
            showPopupMessage("初期データのロードに失敗しました。");
        }
        throw error; // ナビゲーションを強制するためにエラーを再スロー
    }
}

/**
 * ゲームループの開始
 */
function startGameLoop() {
    if (isGameLoopRunning) return;
    isGameLoopRunning = true;
    
    // ゲーム開始時のログ
    addLog(`REBEL ${currentRebel} ゲームループを開始します。`);

    // プレイヤーと敵をクリア
    if (typeof clearEnemies === 'function') clearEnemies();
    bullets = [];
    isGameOver = false;
    isGameClear = false;
    
    // キャンバスを表示
    const gameCanvas = document.getElementById('gameCanvas');
    const controls = document.querySelector('.controls');
    if (gameCanvas) gameCanvas.style.display = 'block';
    if (controls) controls.style.display = 'flex';
    
    gameLoopId = requestAnimationFrame(gameLoop);
}

/**
 * メインゲームループ (30FPS)
 */
function gameLoop() {
    if (isGameOver || isGameClear) {
        // ループを停止
        cancelAnimationFrame(gameLoopId);
        isGameLoopRunning = false;
        
        // ゲームオーバー/クリア画面を描画
        if (isGameOver) {
            if (typeof drawGameOver === 'function') drawGameOver();
            addLog("ゲームオーバー画面を描画しました。");
        } else if (isGameClear) {
            if (typeof drawGameClear === 'function') drawGameClear();
            addLog("ゲームクリア画面を描画しました。");
        }
        return;
    }

    // 1. 更新処理 (物理/ロジック)
    if (typeof updatePlayer === 'function') updatePlayer();
    if (typeof updateEnemies === 'function') updateEnemies();
    
    // 時間帯の更新 (昼夜サイクル)
    timeOfDayTimer = (timeOfDayTimer + 1) % TIME_CYCLE_DURATION;
    isDay = timeOfDayTimer < (TIME_CYCLE_DURATION / 2);

    // 弾丸の更新と画面外に出たものの除去
    bullets = bullets.filter(bullet => {
        bullet.y += bullet.velocityY;
        bullet.x += bullet.velocityX;
        // 画面外チェック
        return bullet.y > -bullet.height && bullet.y < HEIGHT + bullet.height &&
               bullet.x > -bullet.width && bullet.x < WIDTH + bullet.width;
    });

    // 衝突判定
    if (typeof handleCollisions === 'function') handleCollisions();

    // 2. 描画処理
    if (typeof drawGame === 'function') drawGame();
    
    // ログを表示する設定ならデバッグログを描画
    if (window.settings && window.settings.show_log && typeof drawDebugLogOverlay === 'function') {
        drawDebugLogOverlay();
    }
    
    // 3. 次のフレームへ
    gameLoopId = requestAnimationFrame(gameLoop);
}

// ----------------------------------------------------
// 🏠 画面遷移関数 (router.jsから呼ばれる)
// ----------------------------------------------------

/**
 * ホーム画面を表示する
 */
function goToHome() {
    // 既存のゲームループがあれば停止
    if (isGameLoopRunning) {
        cancelAnimationFrame(gameLoopId);
        isGameLoopRunning = false;
    }
    
    const homeScreen = document.getElementById('homeScreen');
    if (homeScreen) {
        homeScreen.innerHTML = `
            <h2>🛡️ REBEL WARFARE</h2>
            <p>人類最後の抵抗</p>
            <hr>
            <div id="levelSelect">
                <h3>REBEL選択</h3>
                ${Array.from({ length: MAX_REBEL }, (_, i) => i + 1).map(level => `
                    <button 
                        onclick="window.location.hash='#level${level}'" 
                        style="padding: 10px; margin: 5px;"
                    >
                        REBEL ${level}
                    </button>
                `).join('')}
            </div>
            <hr>
            <button onclick="window.location.hash='#store'" style="padding: 10px 20px; margin: 10px;">🛒 ストア</button>
            <button onclick="window.location.hash='#settings'" style="padding: 10px 20px; margin: 10px;">⚙️ 設定</button>
            <p style="margin-top: 20px; font-size: 12px; color: #888;">バージョン 0.0.1</p>
        `;
    }
    addLog("ホーム画面に遷移しました。");
}

/**
 * ストア画面を表示する
 */
function goToStore() {
    // 既存のゲームループがあれば停止
    if (isGameLoopRunning) {
        cancelAnimationFrame(gameLoopId);
        isGameLoopRunning = false;
    }
    // ストア画面の描画ロジックは store.js で実装される想定
    const homeScreen = document.getElementById('homeScreen');
    if (homeScreen) {
        homeScreen.innerHTML = `
            <h2>🛒 ストア</h2>
            <p>ここではコインを使ってアップグレードを購入できます。</p>
            <hr>
            <p style="font-size: 20px;">所持コイン: ${player ? player.coins : 0}</p>
            <div id="storeItems">
                <p>アイテムリスト...</p>
            </div>
            <hr>
            <button onclick="window.location.hash='#home'" style="padding: 10px 20px; margin: 10px;">🏠 ホームに戻る</button>
        `;
    }
    addLog("ストア画面に遷移しました。");
}

/**
 * レベルを開始する
 * @param {number} level - 開始するREBELレベル
 */
function startLevel(level) {
    currentRebel = level; // グローバル変数更新
    player.hp = player.maxHp; // HP全回復

    // 敵スポーンの初期化（enemy.js に依存）
    if (typeof checkLevelUp === 'function') checkLevelUp();

    // 画面の表示切り替えは router.js で行われる
    
    // ゲームループ開始
    startGameLoop();
}

/**
 * ボス戦を開始する
 * @param {number} level - 現在のREBELレベル
 */
function startBossPhase(level) {
    addLog(`REBEL ${level} のボス戦を開始します！`);
    // ボスの初期化 (boss.js を想定)
    // isBossPhase = true;
    
    // ... (ボススポーンロジック) ...
}

// ----------------------------------------------------
// 🚀 ゲーム起動
// ----------------------------------------------------

// ゲーム開始はJSONのロードから
(async function() {
    // navigate関数（router.js）がロードされているか確認
    if (typeof navigate !== 'function') {
         console.warn("router.js が未ロードです。ナビゲーションの準備ができていません。");
    }

    try {
        await loadGameData();
        
    } catch (error) {
        // loadGameData() の中で致命的なエラーが発生した場合 (JSON解析失敗など)
        console.error("致命的な初期ロードエラーが発生しましたが、続行を試みます:", error);
        
        if (typeof showPopupMessage === 'function') {
            showPopupMessage("データのロードに失敗しました。コンソールを確認してください。", 8000, 'error');
        }
        
    } finally {
        // 成功しても失敗しても、最後に必ず実行され画面遷移を試みる
        if (typeof navigate === 'function') {
            navigate(window.location.hash);
        } else {
            console.error("Router.js がロードされていません。ハッシュルーティングなしで起動します。");
            goToHome();
        }
    }
})();
