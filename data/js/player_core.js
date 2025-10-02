// ====================================================
// 🎮 プレイヤーコアデータ (player_core.js)
// ====================================================

// state.jsで定義されたグローバル変数を参照: WIDTH, HEIGHT
// settings.jsで定義された関数を参照: addLog

/**
 * 新しいプレイヤーオブジェクトを初期化して返す
 * @returns {object} 初期化されたプレイヤーオブジェクト
 */
function initializePlayer() {
    const newPlayer = {
        // --- 位置と外観 ---
        x: WIDTH / 2 - 20, // 中央に配置
        y: HEIGHT - 50,
        width: 40,
        height: 40,
        color: 'cyan',
        
        // --- 基本ステータス ---
        maxHp: 100,
        hp: 100,
        baseSpeed: 5,
        speed: 5,
        
        // --- ゲーム進行ステータス ---
        coins: 0,
        score: 0, // スコアは state.js のグローバル変数を使用するが、念のため
        defenseLevel: 1, // 初期防具レベル (DEFENSE_STATS[1] = 木)
        
        // --- 能力とクールダウン ---
        isShielded: false,
        shieldDuration: 180, // シールド持続時間 (30FPSで6秒)
        shieldCooldownMax: 600, // シールドクールダウン最大値 (30FPSで20秒)
        shieldCooldown: 0,
        
        // --- インベントリ ---
        inventory: {
            'potion_heal': 1, // 回復ポーションを1つ所持
            // 他のアイテム...
        },
        unlockedGolemLevel: 0, // ゴーレムアンロックレベル
        
        // --- デバフ ---
        debuff: {
            burning: 0, // 燃焼の残り時間 (フレーム)
            poison: 0, // 毒の残り時間 (フレーム)
            frozen: 0, // 凍結の残り時間 (フレーム)
        },
        
        // プレイヤーの移動方向状態
        moveX: 0, // -1 (左), 0 (停止), 1 (右)
        moveY: 0, // -1 (上), 0 (停止), 1 (下)
    };
    
    if (typeof addLog === 'function') {
        addLog("プレイヤーコアデータを初期化しました。");
    }
    
    return newPlayer;
}

// player.js に依存していた他の関数が移動したことを示すコメント
// updatePlayer() は player_input.js へ
// useShield() や usePotion() は player_ability.js へ
