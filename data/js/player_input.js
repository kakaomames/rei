// ====================================================
// 🕹️ プレイヤー入力と移動 (player_input.js)
// ====================================================

// state.jsで定義されたグローバル変数を参照: player, WIDTH, HEIGHT, isGameOver, isGameClear
// settings.jsで定義された関数を参照: addLog

/**
 * プレイヤーの移動、クールダウン、デバフを毎フレーム更新する
 * (game.js の gameLoop から呼ばれる)
 */
function updatePlayer() {
    if (!player || isGameOver || isGameClear) return;

    // --- 1. 移動の処理 ---
    
    // スピードの決定 (凍結デバフ中は半減など)
    player.speed = player.baseSpeed;
    if (player.debuff.frozen > 0) {
        player.speed *= 0.5; 
    }
    
    // X軸の移動
    player.x += player.moveX * player.speed;
    
    // Y軸の移動
    // ※ プレイヤーは通常左右のみだが、上下移動もサポートする場合
    // player.y += player.moveY * player.speed; 
    
    // 境界チェック (画面外に出ないようにする)
    // 左右
    if (player.x < 0) player.x = 0;
    if (player.x > WIDTH - player.width) player.x = WIDTH - player.width;
    // 上下 (画面下半分に固定する場合)
    const minH = HEIGHT * 0.5; // 画面上半分には行けない
    if (player.y < minH) player.y = minH; 
    if (player.y > HEIGHT - player.height) player.y = HEIGHT - player.height;

    // --- 2. クールダウンの更新 ---
    
    // シールドの持続時間とクールダウン
    if (player.isShielded) {
        player.shieldDuration--;
        if (player.shieldDuration <= 0) {
            player.isShielded = false;
            player.shieldCooldown = player.shieldCooldownMax; // クールダウン開始
            player.shieldDuration = 180; // 元に戻す
        }
    } else if (player.shieldCooldown > 0) {
        player.shieldCooldown--;
    }
    
    // --- 3. デバフタイマーの更新 ---
    
    // 燃焼デバフ
    if (player.debuff.burning > 0) {
        // ダメージを与えるロジックは player_ability.js や collision.js で実装される想定
        player.debuff.burning--;
    }
    // 凍結デバフ
    if (player.debuff.frozen > 0) {
        player.debuff.frozen--;
        if (player.debuff.frozen <= 0 && typeof addLog === 'function') {
            addLog("凍結デバフが切れました。");
        }
    }
    // 毒デバフ
    if (player.debuff.poison > 0) {
        player.debuff.poison--;
    }
}

/**
 * ユーザーの移動ボタン入力やキーボード入力を処理する
 * @param {string} direction - 'left', 'right', 'up', 'down', 'stopX', 'stopY'
 */
function handleInput(direction) {
    if (!player) return;

    switch (direction) {
        case 'left':
            player.moveX = -1;
            break;
        case 'right':
            player.moveX = 1;
            break;
        case 'up':
            player.moveY = -1;
            break;
        case 'down':
            player.moveY = 1;
            break;
        case 'stopX':
            player.moveX = 0;
            break;
        case 'stopY':
            player.moveY = 0;
            break;
        case 'shoot':
            // 射撃ロジックは collision.js や game.js で実装される想定
            if (typeof shootBullet === 'function') shootBullet(); 
            break;
        default:
            break;
    }
}

// ----------------------------------------------------
// ⚠️ DOMボタンへのリスナー登録 (game.jsの代わりにここで実行する想定)
// ----------------------------------------------------

// DOMボタンが state.js に定義されている場合は、ここでリスナーを登録する
document.addEventListener('DOMContentLoaded', () => {
    // 例: 左ボタンのリスナー
    const leftButton = document.getElementById('leftButton');
    if (leftButton) {
        leftButton.addEventListener('touchstart', () => handleInput('left'));
        leftButton.addEventListener('touchend', () => handleInput('stopX'));
        // マウス/キーボードイベントも追加する
    }
    // ... 他のボタン (right, up, down, shoot, shield, potion, magic) も同様に登録
});
