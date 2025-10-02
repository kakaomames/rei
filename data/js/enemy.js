// game.jsで定義されたグローバル変数を使用:
// WIDTH, HEIGHT, gameData, currentRebel, isBossPhase, MAX_REBEL, score, player
// addLog (settings.js), startBossPhase (game.js), gameLoop (game.js)

// --- グローバル状態変数 ---
let enemies = [];
let enemySpawnTimer = 0;
const INITIAL_ENEMY_SPAWN_INTERVAL = 90; // 30FPSで3秒ごと (スポーン間隔)
let currentKills = 0; // 現在のレベルで倒したMob数
let requiredKills = 0; // ボス出現に必要なMob数
let isMobPhase = false; // Mob出現中かどうか

// 敵のステータス定義 (JSONデータの代替として簡易定義)
// ※ 実際は gameData.enemies から読み込むことを想定
const ENEMY_STATUS = new Map([
    // Mobフェーズの敵
    [1, { id: 'zombie', name: 'ゾンビ', hp: 10, speed: 2, damage: 5, color: 'green', width: 30, height: 30, spawnChance: 0.8 }],
    [2, { id: 'skeleton', name: 'スケルトン', hp: 8, speed: 3, damage: 4, color: 'white', width: 25, height: 35, spawnChance: 0.2 }],
    // ... レベルが上がれば他の敵も増える
]);

/**
 * 現在のレベルに基づいて、ボス出現に必要なキル数を設定し、Mobフェーズを開始する準備をする。
 */
function checkLevelUp() {
    // 敵スポーンの目標を設定（例：レベル * 5体の敵）
    requiredKills = currentRebel * 5;
    currentKills = 0; // キル数をリセット
    
    if (typeof addLog === 'function') {
        addLog(`REBEL ${currentRebel} Mobフェーズ目標: 敵 ${requiredKills} 体キル`);
    }
}

/**
 * 敵を生成し、enemies配列に追加する
 * (game.js の startLevel から呼ばれる可能性がある)
 * @param {number} level - 現在のREBELレベル
 * @param {number} currentEnemyCount - 現在画面上の敵の数
 */
function spawnEnemy(level, currentEnemyCount) {
    // スポーン可能な敵のリストからランダムに選択（レベルに応じたロジックを後で追加）
    const enemyType = ENEMY_STATUS.get(1); // とりあえずゾンビをスポーン

    if (!enemyType) return;

    // 画面上部のランダムなX座標
    const x = Math.random() * (WIDTH - enemyType.width);
    const y = -enemyType.height; // 画面外からスタート

    const newEnemy = {
        x: x,
        y: y,
        width: enemyType.width,
        height: enemyType.height,
        color: enemyType.color,
        hp: enemyType.hp + (level - 1) * 5, // レベルに応じてHP増加
        maxHp: enemyType.hp + (level - 1) * 5,
        speed: enemyType.speed,
        damage: enemyType.damage,
        id: enemyType.id,
        isBoss: false,
        debuff: { // デバフの初期化
            burning: 0,
            frozen: 0
        }
    };

    enemies.push(newEnemy);
}

/**
 * 敵が倒された時の処理
 * (collision.js の handleCollision などから呼ばれる)
 * @param {object} enemy - 倒された敵のオブジェクト
 */
function handleEnemyDefeat(enemy) {
    if (enemy.isBoss) {
        // ボス撃破処理は game.js の handleBossDefeat で行う
        return;
    }
    
    // Mob撃破時の処理
    currentKills++; // キル数をインクリメント
    player.coins += 1; // コイン付与（暫定）
    score += 100; // スコア加算
    
    if (typeof addLog === 'function') {
        addLog(`敵(${enemy.id})を撃破。キル数: ${currentKills}/${requiredKills}`);
    }
}

/**
 * 敵の移動、更新、スポーンを管理するメイン関数
 * (game.js の gameLoop から呼ばれる)
 */
function updateEnemies() {
    // 敵の移動と生存確認
    enemies = enemies.filter(enemy => {
        // 敵の移動ロジック
        enemy.y += enemy.speed;

        // 画面外に出た敵は排除 (画面外に出た敵は game.js/collision.js でHP減少処理を行う想定)
        // 画面の高さ（HEIGHT）を超えたら false を返し、配列から除外
        if (enemy.y >= HEIGHT) {
            // プレイヤーのライフを減らす処理を game.js または collision.js で行う想定
            return false;
        }
        
        return true; 
    });

    // ----------------------------------------
    // 敵のスポーン管理
    // ----------------------------------------
    if (!isBossPhase) {
        enemySpawnTimer++;
        
        // 🚨 Mobフェーズが始まっていない場合は、強制的に開始させる (startLevel()で呼び出し漏れ対策)
        if (!isMobPhase) {
             checkLevelUp(); // Mobフェーズ開始に必要なキル数を設定
             isMobPhase = true; // Mobフェーズ開始フラグを立てる
             
             if (typeof addLog === 'function') {
                 addLog("Mobフェーズを開始しました。");
             }
        }

        // スポーン条件: スポーン間隔が経過し、かつ必要なキル数に達していない場合
        if (enemySpawnTimer >= INITIAL_ENEMY_SPAWN_INTERVAL && currentKills < requiredKills) {
            
            // 敵をスポーンさせる
            if (typeof spawnEnemy === 'function') {
                spawnEnemy(currentRebel, enemies.length);
                
                // ログに出す（デバッグ用）
                if (typeof addLog === 'function') {
                    addLog(`敵をスポーン。敵数: ${enemies.length + 1} / 目標キル: ${requiredKills}`);
                }
            } else {
                 console.error("spawnEnemy関数が定義されていません。");
            }
            
            enemySpawnTimer = 0; // タイマーリセット
        }
    }
    
    // ----------------------------------------
    // Mobフェーズの終了とボスフェーズへの移行チェック
    // ----------------------------------------
    if (isMobPhase && currentKills >= requiredKills) {
        isMobPhase = false; // Mobフェーズ終了
        
        if (typeof addLog === 'function') {
            addLog("目標キル数達成。ボスフェーズへ移行します！");
        }
        
        // ボスフェーズ開始 (game.js の関数を呼び出し)
        if (typeof startBossPhase === 'function') {
            startBossPhase(currentRebel);
        } else {
             console.error("startBossPhase関数が定義されていません。ゲームが進行できません。");
        }
    }
    
    // ----------------------------------------
    // 敵のデバフ処理（燃焼・凍結など）
    // ----------------------------------------
    enemies.forEach(enemy => {
        // 例: 燃焼デバフによるダメージ
        if (enemy.debuff.burning > 0) {
            // ダメージ処理（省略）
            // enemy.hp -= 0.1; 
            enemy.debuff.burning--;
        }
        
        // 例: 凍結デバフによる移動速度低下
        if (enemy.debuff.frozen > 0) {
            // speed = enemy.baseSpeed * 0.5; など
            enemy.debuff.frozen--;
        }
        
        // HPが0以下になったら撃破処理（collision.jsで処理されない場合）
        if (enemy.hp <= 0) {
            handleEnemyDefeat(enemy);
        }
    });
}

/**
 * ボス撃破時の処理 (game.js の handleBossDefeat から呼ばれることを想定)
 * ※ ここにはロジックは最小限に留め、スコア加算などは game.js で行う
 */
function handleBossDefeat(boss) {
    if (typeof addLog === 'function') {
        addLog(`REBEL ${currentRebel} BOSS ${boss.id} を撃破しました！`);
    }
}

/**
 * 外部から敵配列をクリアするための関数 (ゲームオーバー時などに使用)
 */
function clearEnemies() {
    enemies = [];
    enemySpawnTimer = 0;
    currentKills = 0;
    requiredKills = 0;
    isMobPhase = false;
    // isBossPhase のリセットは game.js の resetGame などで行う想定
    
    if (typeof addLog === 'function') {
        addLog("敵システムをリセットしました。");
    }
}
