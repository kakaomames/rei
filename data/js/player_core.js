// ====================================================
// 🎮 プレイヤーコアデータ (player_core.js)
// ====================================================


// state.jsで定義されたグローバル変数を参照: WIDTH, HEIGHT
// settings.jsで定義された関数を参照: addLog

/**
 * 新しいプレイヤーオブジェクトを初期化して返す
 * ※ グローバルな player 変数に代入するのは game.js の役割
 * @returns {object} 初期化されたプレイヤーオブジェクト
 */
function initializePlayer() {
    // ⚠️ Playerオブジェクトの定義のみを行い、WIDTH/HEIGHTへの依存は最小限にする
    //    （参照はOKだが、ロジックは player_input.js に移す）
    const initialPlayer = {
        // --- 位置と外観 (初期値) ---
        x: 0, // ロード時には仮の0
        y: 0, // ロード時には仮の0
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
        defenseLevel: 1, 
        
        // --- 能力とクールダウン ---
        isShielded: false,
        shieldDuration: 180, 
        shieldCooldownMax: 600, 
        shieldCooldown: 0,
        
        // --- インベントリ ---
        inventory: {
            'potion_heal': 1, 
        },
        unlockedGolemLevel: 0, 
        
        // --- デバフ ---
        debuff: {
            burning: 0, 
            poison: 0, 
            frozen: 0, 
        },
        
        // プレイヤーの移動方向状態
        moveX: 0,
        moveY: 0,
    };
    
    if (typeof addLog === 'function') {
        addLog("プレイヤーコアデータを生成しました。");
    }
    
    return initialPlayer;
}
