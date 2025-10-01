const canvas = document.getElementById('gameCanvas');
const ctx = canvas.getContext('2d');

// --- グローバル共有変数 ---
const WIDTH = canvas.width;
const HEIGHT = canvas.height;
const INITIAL_ENEMY_SPAWN_INTERVAL = 60;
const INITIAL_ENEMY_BASE_SPEED = 1;
const BOSS_TRIGGER_LEVEL = 5; 
const MAX_REBEL = 5; 

// --- プレイヤー（自機） ---
const player = {
    x: WIDTH / 2 - 20,
    y: HEIGHT - 40,
    width: 40,
    height: 40,
    color: 'cyan',
    baseSpeed: 5, 
    speed: 5,
    debuffed: false, 
    defenseLevel: 4, 
    hp: 100, 
    maxHp: 100,
    debuff: {
        burning: 0, 
        poison: 0,  
        frozen: 0   
    },
    unlockedGolemLevel: 1,
    inventory: {}, 
    shieldCooldown: 0, 
    isShielded: false, 
    shieldDuration: 0,
    // --- NEW: 進行と通貨 ---
    coins: 0,              
    highestClearLevel: 0   
};

// --- 弾、敵、ボス、ゴーレム ---
const bullets = [];
const bulletSpeed = 7;
const bulletColor = 'yellow';
let enemies = [];
let boss = null;
let isBossPhase = false; 
let golem = null; 
let golemMaterialLevel = 1; 

// --- ゲーム状態とレベル ---
let score = 0;
let level = 1; 
let currentRebel = 1; 
let isGameOver = false; 
let enemySpawnTimer = 0;
let isGameLoopRunning = false; 

// --- NEW: レベル固有の変数 ---
let requiredKills = 0;   
let currentKills = 0;    
let isMobPhase = false;  

// --- 時間帯管理 ---
const TIME_CYCLE_DURATION = 600;
let timeOfDayTimer = 0;
let isDay = true; 

// --- ロードするJSONのIDリスト ---
const ENEMY_IDS = ["slime_mob", "silverfish_mob", "endermite_mob", "zombie_mob", "husk_mob"]; 
const BOSS_IDS = ["slime", "silverfish", "endermite", "zombie", "husk"];
const GOLEM_MATERIAL_IDS = ["oak_log", "cobblestone", "copper", "iron", "gold", "diamond", "netherite"];
const SPECIAL_ITEM_IDS = ["coin"]; 

// --- ロードされたJSONデータ (MapでIDをキーに保持) ---
let gameData = {
     enemies: new Map(), 
     bosses: new Map(), 
     items: new Map(),  
     specialItems: new Map(), 
     store: [], 
     debuffs: [],
     potions: [],
     settings: [] 
};

// --- 防具データ ---
const DEFENSE_STATS = {
    0: { name: "素手", reduction: 0, speedPenalty: 0 },
    1: { name: "革", reduction: 1, speedPenalty: 0 },
    4: { name: "鉄", reduction: 5, speedPenalty: 0 },
    5: { name: "ダイヤ", reduction: 7, speedPenalty: 0 },
    6: { name: "ネザライト", reduction: 10, speedPenalty: 1 }
};

// --- DOM要素と状態管理 ---
const gameContainer = document.querySelector('body'); 
const keys = {
    ArrowLeft: false, ArrowRight: false, Space: false, Magic: false, Golem: false, Shield: false, Potion: false 
};
const leftButton = document.getElementById('leftButton');
const rightButton = document.getElementById('rightButton');
const shootButton = document.getElementById('shootButton');
const magicButton = document.getElementById('magicButton'); 
const golemButton = document.getElementById('golemButton'); 
const shieldButton = document.createElement('div');
shieldButton.id = 'shieldButton';
shieldButton.className = 'control-button';
shieldButton.textContent = 'SHIELD';
const potionButton = document.createElement('div');
potionButton.id = 'potionButton';
potionButton.className = 'control-button';
potionButton.textContent = 'POTION (0)';

// --- イベントリスナーの設定 ---
function setupEventListeners() {
    // 既に存在するボタンのリスナーを再設定
    leftButton.addEventListener('mousedown', () => { keys.ArrowLeft = true; });
    leftButton.addEventListener('mouseup', () => { keys.ArrowLeft = false; });
    leftButton.addEventListener('touchstart', (e) => { keys.ArrowLeft = true; e.preventDefault(); });
    leftButton.addEventListener('touchend', () => { keys.ArrowLeft = false; });
    rightButton.addEventListener('mousedown', () => { keys.ArrowRight = true; });
    rightButton.addEventListener('mouseup', () => { keys.ArrowRight = false; });
    rightButton.addEventListener('touchstart', (e) => { keys.ArrowRight = true; e.preventDefault(); });
    rightButton.addEventListener('touchend', () => { keys.ArrowRight = false; });
    shootButton.addEventListener('mousedown', () => { keys.Space = true; });
    shootButton.addEventListener('mouseup', () => { keys.Space = false; });
    shootButton.addEventListener('touchstart', (e) => { keys.Space = true; e.preventDefault(); });
    shootButton.addEventListener('touchend', () => { keys.Space = false; });

    magicButton.addEventListener('click', () => {
         if (!isBossPhase && gameData.items.size > 0) {
             golemMaterialLevel = (golemMaterialLevel % player.unlockedGolemLevel) + 1;
             const material = Array.from(gameData.items.values()).find(i => i.level === golemMaterialLevel);
             magicButton.textContent = `MAGIC: ${material ? material.name : `L${golemMaterialLevel}`}`;
         }
    });

    golemButton.addEventListener('click', () => {
         if (!golem && isBossPhase && boss) {
             spawnGolem(golemMaterialLevel); // collision.js
         }
    });

    shieldButton.addEventListener('click', () => {
         if (player.shieldCooldown <= 0 && !player.isShielded) {
             keys.Shield = true;
         }
    });

    potionButton.addEventListener('click', () => {
         keys.Potion = true;
    });
    
    // Shield/Potionボタンがまだ存在しなければ追加
    if (!document.getElementById('shieldButton')) {
        document.querySelector('.controls').appendChild(shieldButton);
    }
    if (!document.getElementById('potionButton')) {
        document.querySelector('.controls').appendChild(potionButton);
    }
}


// ----------------------------------------------------
// 🌐 JSONデータロード関数 (マイクラ形式 JSON対応)
// ----------------------------------------------------
async function loadGameData() {
    try {
        // 1. 固定ファイル (プレイヤー関連/設定)
        let loadedSettings = [];
        let loadedStore = [];
        let loadedPotions = [];
        let loadedDebuffs = [];
        
        try {
             // Promise.allで並行ロード
             const [potionRes, debuffRes, storeRes, settingsRes] = await Promise.all([ 
                 fetch('./data/player/potions.json'), 
                 fetch('./data/player/debuffs.json'),
                 fetch('./data/store/store.json'),  
                 fetch('./data/store/settings.json') 
             ]);
             
             // 成功したデータのみロード（失敗しても処理は継続）
             if (potionRes.ok) loadedPotions = await potionRes.json();
             else console.warn("Potions.jsonのロードに失敗しました。");
             
             if (debuffRes.ok) loadedDebuffs = await debuffRes.json();
             else console.warn("Debuffs.jsonのロードに失敗しました。");
             
             if (storeRes.ok) loadedStore = await storeRes.json();
             else console.warn("Store.jsonのロードに失敗しました。");
             
             if (settingsRes.ok) loadedSettings = await settingsRes.json();
             else console.warn("Settings.jsonのロードに失敗しました。");
             
        } catch (e) {
             // ネットワークエラーなど
             console.error("Fetch中に深刻なネットワークエラー:", e);
        }

        gameData.potions = loadedPotions;
        gameData.debuffs = loadedDebuffs;
        gameData.store = loadedStore;
        gameData.settings = loadedSettings; 

        gameData.potions.forEach(p => { player.inventory[p.id] = 0; });
        
        // 2. ボスファイルの動的ロード (entities/boss/)
        const bossPromises = BOSS_IDS.map(id => 
            fetch(`./data/entities/boss/${id}.json`).then(res => res.json())
        );
        const loadedBosses = await Promise.all(bossPromises);
        loadedBosses.forEach(data => {
             const components = data["minecraft:entity"].components;
             const bossId = data["minecraft:entity"].description.identifier;
             
             gameData.bosses.set(bossId, {
                id: bossId,
                rebel: components["shooter_data:rebel_level"],
                name: components["minecraft:type_name"],
                note: components["shooter_data:note"],
                color: components["shooter_data:visuals"].color,
                base_hp: components["minecraft:health"].value,
                stats: components["shooter_data:stats"],
                trait: components["shooter_data:trait"].type,
                trait_data: components["shooter_data:trait"].data 
             });
        });

        // 3. アイテムファイルの動的ロード (items/) 
        const itemPromises = GOLEM_MATERIAL_IDS.map(id => 
            fetch(`./data/items/${id}.json`).then(res => res.json())
        );
        const loadedItems = await Promise.all(itemPromises);
        loadedItems.forEach(data => gameData.items.set(data.id, data));
        
        // 4. 通常敵の動的ロード (entities/)
        const enemyPromises = ENEMY_IDS.map(id => 
            fetch(`./data/entities/${id}.json`).then(res => res.json())
        );
        const loadedEnemies = await Promise.all(enemyPromises);
        loadedEnemies.forEach(data => {
            const components = data["minecraft:entity"].components;
            const mobId = data["minecraft:entity"].description.identifier;
            
            gameData.enemies.set(mobId, {
                id: mobId,
                name: components["minecraft:type_name"],
                level: components["shooter_data:rebel_level"],
                color: components["shooter_data:visuals"].color,
                width: components["shooter_data:visuals"].width,
                height: components["shooter_data:visuals"].height,
                base_speed: components["minecraft:physics"].speed,
                hp: components["minecraft:health"].value,
                maxHp: components["minecraft:health"].max, 
                score: components["shooter_data:reward"].score,
                coin_drop: components["shooter_data:reward"].coin_drop
            });
        });
        
        // 5. 特殊アイテムの動的ロード (items/coin.jsonなど)
        const specialItemPromises = SPECIAL_ITEM_IDS.map(id => 
            fetch(`./data/items/${id}.json`).then(res => res.json())
        );
        const loadedSpecialItems = await Promise.all(specialItemPromises);
        loadedSpecialItems.forEach(data => gameData.specialItems.set(data.id, data));
        
        // --- 実行順序の調整 ---
        loadSettings(); // settings.js
        setupEventListeners();
        updateGolemButtonVisibility(); 
        updatePotionButton(); 
        
        console.log("✅ データロードが完了しました (一部失敗の可能性あり)。");

    } catch (error) {
        // Promise.all 外のJSON解析エラーなどが発生した場合
        console.error("JSON解析またはその他の致命的なエラー:", error);
        alert("データのロード中にエラーが発生しました。コンソールを確認してください。");
        // エラーが発生しても、Promiseは解決済みとして扱う
    }
}


// --- メインゲームループ ---
function gameLoop() {
    // 致命的なエラーが発生した場合、ログに追加し、ループを停止
    try {
        ctx.clearRect(0, 0, WIDTH, HEIGHT);
        
        // ... (背景、ゲームオーバーチェックのロジックはそのまま) ...
        if (!isGameOver && isGameLoopRunning) {
            
            // ゾンビ/ハスク戦ではない場合、背景は黒 (ui_draw.jsのdrawBossに依存)
            if (!isBossPhase || (boss && boss.trait !== "zombie_time" && boss.trait !== "no_sun_damage")) {
                ctx.fillStyle = 'black';
                ctx.fillRect(0, 0, WIDTH, HEIGHT);
            }
            
            if (isGameOver && currentRebel > MAX_REBEL) { 
                drawGameClear(); 
                isGameLoopRunning = false; 
                return; 
            } else if (isGameOver) { 
                drawGameOver(); // ui_draw.js
                isGameLoopRunning = false; 
                return; 
            }
    
            updateTimeOfDay();  // enemy.js
            updateDebuffs();    // player.js
            updateShield();     // player.js
            usePotion();        // player.js
            updatePlayer();     // player.js
            updateBullets();    // player.js
            updateEnemies();    // enemy.js
            updateBossAction(); // enemy.js
            updateGolem();      // collision.js
    
            checkCollisions();  // collision.js
            checkLevelUp();     // collision.js
    
            drawPlayer();       // ui_draw.js
            drawBullets();      // ui_draw.js
            drawEnemies();      // ui_draw.js
            drawBoss();         // ui_draw.js
            drawGolem();        // ui_draw.js
            drawScore();        // ui_draw.js
            drawMessageOverlay(); // ui_draw.js
            
            // 🐞 デバッグログの描画
            drawDebugLogOverlay(); // ui_draw.js
    
            requestAnimationFrame(gameLoop);
        }
    } catch (e) {
        // 致命的なエラーが発生した場合、ログに追加し、ループを停止
        if (typeof addLog === 'function') {
            addLog(`FATAL ERROR: ${e.message}`); 
        }
        console.error("FATAL GAME LOOP ERROR:", e);
        isGameLoopRunning = false;
        isGameOver = true; 
        alert(`致命的なゲームエラーが発生しました: ${e.message}。ログを確認してください。`);
        return;
    }
}

// --- ゲームのリセット ---
function resetGame() {
    player.x = WIDTH / 2 - 20; player.y = HEIGHT - 40; bullets.length = 0; enemies.length = 0;
    score = 0; level = 1; 
    
    isGameOver = false; isBossPhase = false; boss = null; golem = null; player.hp = player.maxHp; 
    player.debuff = { burning: 0, poison: 0, frozen: 0 }; player.debuffed = false;
    player.speed = player.baseSpeed - DEFENSE_STATS[player.defenseLevel].speedPenalty; 
    
    golemMaterialLevel = 1;
    enemySpawnTimer = 0;
    timeOfDayTimer = 0; 
    isDay = true;      
    player.shieldCooldown = 0; 
    player.isShielded = false; 
    player.shieldDuration = 0; 
    
    // Mob討伐フェーズ変数
    requiredKills = 0;
    currentKills = 0;
    isMobPhase = false; 
    
    updateGolemButtonVisibility(); // ui_draw.js
    updatePotionButton(); // ui_draw.js
    const firstMaterial = Array.from(gameData.items.values()).find(i => i.level === 1);
    magicButton.textContent = `MAGIC: ${firstMaterial ? firstMaterial.name : 'L1'}`;

    if (typeof addLog === 'function') {
        addLog(`REBEL ${currentRebel} ゲームをリセットしました。`); // settings.js
    }
}

// ----------------------------------------------------
// 🏠 ホーム画面切り替え関数 (ハッシュルーティング対応)
// ----------------------------------------------------
function goToHome() {
    // ハッシュ変更が目的の場合
    if (window.location.hash !== '#home') {
        window.location.hash = '#home';
        return; 
    }
    
    // ハッシュが#homeの場合（ルーターから呼ばれた場合）
    let homeScreen = document.getElementById('homeScreen');
    if (!homeScreen) {
        homeScreen = document.createElement('div');
        homeScreen.id = 'homeScreen';
        homeScreen.style.cssText = 'color: white; text-align: center; padding: 50px;';
        gameContainer.appendChild(homeScreen);
    }
    
    // コンテンツを描画
    homeScreen.innerHTML = `
        <h2>マイクラ・アドベンチャーホーム 🏡</h2>
        <p>所持コイン: 💰 ${player.coins}</p>
        <p>最高クリアレベル: ${player.highestClearLevel}</p>
        <hr style="border-color: #555; width: 80%;">
        
        <h3 id="treasureButton" style="cursor: pointer; color: gold;">💰 商人との取引 (#store)</h3>
        <h3 id="settingsButton" style="cursor: pointer; color: white;">⚙️ 設定 (#settings)</h3>
        <hr style="border-color: #555; width: 80%;">
        
        <h3>レベル選択 (REBEL)</h3>
        ${Array.from({ length: MAX_REBEL }, (_, i) => i + 1).map(r => `
            <button 
                onclick="window.location.hash = '#level${r}'" 
                style="padding: 10px 20px; margin: 5px; font-size: 18px; cursor: pointer; background-color: ${r <= player.highestClearLevel + 1 ? '#28a745' : '#555'}; color: white;"
                ${r > player.highestClearLevel + 1 ? 'disabled' : ''}
            >
                REBEL ${r} - ${r <= player.highestClearLevel ? 'CLEARED' : (r === player.highestClearLevel + 1 ? 'CHALLENGE' : 'LOCKED')}
            </button><br>
        `).join('')}
    `;
    
    // イベントリスナーはハッシュ変更に置き換え
    document.getElementById('treasureButton').addEventListener('click', () => { window.location.hash = '#store'; });
    document.getElementById('settingsButton').addEventListener('click', () => { window.location.hash = '#settings'; }); 
    
    if (typeof addLog === 'function') {
        addLog("ホーム画面に遷移しました。"); 
    }
}

// ----------------------------------------------------
// 🛒 ストア画面表示関数 (ハッシュルーティング対応)
// ----------------------------------------------------
function goToStore() {
    // ハッシュ変更が目的の場合
    if (window.location.hash !== '#store') {
        window.location.hash = '#store';
        return; 
    }
    
    // ハッシュが#storeの場合（ルーターから呼ばれた場合）
    const homeScreen = document.getElementById('homeScreen');
    
    homeScreen.innerHTML = `
        <h2>商人との取引 🛒</h2>
        <p>所持コイン: 💰 ${player.coins}</p>
        <hr style="border-color: #555; width: 80%;">
        
        <div id="storeItems" style="text-align: center; margin-top: 20px;">
            ${gameData.store.map(item => {
                const isMax = item.current_purchases >= item.max_purchases;
                const buttonText = isMax ? 'MAX' : `購入 (${item.cost} コイン)`;
                
                let isAlreadyOwned = false;
                if (item.type === 'defense_upgrade' && player.defenseLevel >= item.target_level) {
                     isAlreadyOwned = true;
                } else if (item.type === 'golem_unlock' && player.unlockedGolemLevel >= item.target_level) {
                     isAlreadyOwned = true;
                }
                
                const isDisabled = isMax || player.coins < item.cost || isAlreadyOwned;
                
                return `
                    <div style="border: 1px solid #444; padding: 10px; margin: 10px auto; width: 90%; max-width: 400px; background-color: #222;">
                        <h4>${item.name} (${item.current_purchases}/${item.max_purchases})</h4>
                        <p style="font-size: 14px; color: #aaa;">${item.description}</p>
                        <button 
                            onclick="purchaseItem('${item.id}')"
                            style="padding: 8px 15px; margin-top: 10px; font-size: 16px; cursor: pointer; background-color: ${isDisabled ? '#880000' : '#008800'}; color: white;"
                            ${isDisabled ? 'disabled' : ''}
                        >
                            ${isAlreadyOwned ? 'OWNED' : buttonText}
                        </button>
                    </div>
                `;
            }).join('')}
        </div>
        
        <hr style="border-color: #555; width: 80%;">
        <button onclick="window.location.hash = '#home'" style="padding: 10px 20px; font-size: 18px; cursor: pointer;">🏠 ホームに戻る</button>
    `;
    
    if (typeof addLog === 'function') {
        addLog("ストア画面に遷移しました。"); 
    }
}

// ----------------------------------------------------
// 🛒 アイテム購入ロジック 
// ----------------------------------------------------
function purchaseItem(itemId) {
    const item = gameData.store.find(i => i.id === itemId);
    
    // 再チェック
    let isAlreadyOwned = false;
    if (item.type === 'defense_upgrade' && player.defenseLevel >= item.target_level) { isAlreadyOwned = true; } 
    else if (item.type === 'golem_unlock' && player.unlockedGolemLevel >= item.target_level) { isAlreadyOwned = true; }

    if (!item || item.current_purchases >= item.max_purchases || player.coins < item.cost || isAlreadyOwned) {
        alert("購入できません。");
        if (typeof addLog === 'function') {
            addLog(`購入失敗: ${item.name} (${isAlreadyOwned ? 'Owned' : 'Cost/Max'})`);
        }
        return;
    }
    
    player.coins -= item.cost;
    item.current_purchases++;
    
    let message = `${item.name} を購入しました!`;
    
    // タイプに応じた効果の適用
    if (item.type === 'upgrade') {
        const targetPotion = gameData.potions.find(p => p.id === item.target_id);
        if (targetPotion) {
            targetPotion.inventory_max += item.effect;
            message += ` (${targetPotion.name}の最大所持数が${targetPotion.inventory_max}になりました)`;
        }
    } else if (item.type === 'golem_unlock') {
        player.unlockedGolemLevel = Math.max(player.unlockedGolemLevel, item.target_level);
        updateGolemButtonVisibility(); 
        message += ` (ゴーレムLV.${item.target_level}が使用可能になりました)`;
    } else if (item.type === 'defense_upgrade') {
        player.defenseLevel = Math.max(player.defenseLevel, item.target_level);
        player.speed = player.baseSpeed - DEFENSE_STATS[player.defenseLevel].speedPenalty; 
        message += ` (防御レベルが${item.target_level}になりました)`;
    }
    
    alert(message);
    if (typeof addLog === 'function') {
        addLog(`購入成功: ${message}`); 
    }
    
    // UIを更新
    goToStore(); // ハッシュ変更により、ルーター経由で画面を再描画
}


// ----------------------------------------------------
// 🚀 レベルスタート関数 (ハッシュルーティング対応)
// ----------------------------------------------------
function startLevel(rebelNum) {
    const targetHash = `#level${rebelNum}`;
    
    // ハッシュ変更が目的の場合
    if (window.location.hash !== targetHash) {
        window.location.hash = targetHash;
        return; 
    }
    
    // ハッシュが#levelXの場合（ルーターから呼ばれた場合）
    currentRebel = rebelNum;
    resetGame();
    
    // Mobフェーズの初期化をトリガー
    isMobPhase = false; 
    isBossPhase = false;
    
    // ゲームループがまだ開始されていない場合に開始する
    if (!isGameLoopRunning) {
        isGameLoopRunning = true;
        gameLoop(); 
    }
    
    if (typeof addLog === 'function') {
        addLog(`REBEL ${currentRebel}を開始しました。`);
    }
}


// ゲーム開始はJSONのロードから
loadGameData().then(() => {
    // loadGameDataが成功しても失敗しても、最後に必ず実行される
    // router.jsのnavigate関数（settings.jsの後にロードされている想定）が画面を決定する
    if (typeof navigate === 'function') {
        navigate(window.location.hash);
    } else {
        // router.jsのロードに失敗した場合の最終フォールバック
        console.error("Router.js がロードされていません。ハッシュルーティングなしで起動します。");
        goToHome();
    }
});
