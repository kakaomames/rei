const canvas = document.getElementById('gameCanvas');
const ctx = canvas.getContext('2d');

// --- ゲーム定数 ---
const WIDTH = canvas.width;
const HEIGHT = canvas.height;
const INITIAL_ENEMY_SPAWN_INTERVAL = 60;
const INITIAL_ENEMY_BASE_SPEED = 1;
const INITIAL_LEVEL_THRESHOLD = 10;
const LEVEL_MULTIPLIER = 1.5;
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
    defenseLevel: 4, // 鉄装備 (初期値)
    hp: 100, 
    maxHp: 100,
    debuff: {
        burning: 0, 
        poison: 0,  
        frozen: 0   
    },
    unlockedGolemLevel: 1,
    // --- NEW: 盾とポーション ---
    inventory: {}, // 例: { 1: 3, 2: 0 } -> 回復ポーション3個、防御ポーション0個
    shieldCooldown: 0, // 盾のクールダウンタイマー
    isShielded: false, // 防御ポーション/盾の防御中フラグ
    shieldDuration: 0  // 防御ポーションの残り時間
};

// --- 弾 ---
const bullets = [];
const bulletSpeed = 7;
const bulletColor = 'yellow';

// --- 敵/ボス/ゴーレム ---
let enemies = [];
let boss = null;
let isBossPhase = false; 
let bossActionTimer = 0; 
const bossActionInterval = 120; 
let golem = null; 
let golemMaterialLevel = 1; 

// --- ゲームの状態とレベル管理 ---
let score = 0;
let level = 1; 
let currentRebel = 1; 
let nextLevelThreshold = INITIAL_LEVEL_THRESHOLD; 
let currentEnemySpawnInterval = INITIAL_ENEMY_SPAWN_INTERVAL; 
let baseEnemySpeed = INITIAL_ENEMY_BASE_SPEED; 
let isGameOver = false; 
let enemySpawnTimer = 0;

// --- 時間帯管理 ---
const TIME_CYCLE_DURATION = 600; // 600フレーム = 10秒で昼夜が切り替わる
let timeOfDayTimer = 0;
let isDay = true; // true: Day, false: Night

// --- ロードされたJSONデータ ---
let gameData = {
     bosses: [],
     items: [], // golem_materials
     debuffs: [],
     potions: [] // player_potions
};

// --- 防具データ ---
const DEFENSE_STATS = {
    0: { name: "素手", reduction: 0, speedPenalty: 0 },
    1: { name: "革", reduction: 1, speedPenalty: 0 },
    4: { name: "鉄", reduction: 5, speedPenalty: 0 },
    5: { name: "ダイヤ", reduction: 7, speedPenalty: 0 },
    6: { name: "ネザライト", reduction: 10, speedPenalty: 1 }
};

// --- ボタン操作の状態管理 ---
const keys = {
    ArrowLeft: false, ArrowRight: false, Space: false, Magic: false, Golem: false, Shield: false, Potion: false 
};

// --- DOM要素 ---
const leftButton = document.getElementById('leftButton');
const rightButton = document.getElementById('rightButton');
const shootButton = document.getElementById('shootButton');
const magicButton = document.getElementById('magicButton'); 
const golemButton = document.getElementById('golemButton'); 

// NEW: 盾とポーションのボタンを動的に作成
const shieldButton = document.createElement('div');
shieldButton.id = 'shieldButton';
shieldButton.className = 'control-button';
shieldButton.textContent = 'SHIELD';
document.querySelector('.controls').appendChild(shieldButton);

const potionButton = document.createElement('div');
potionButton.id = 'potionButton';
potionButton.className = 'control-button';
potionButton.textContent = 'POTION (0)';
document.querySelector('.controls').appendChild(potionButton);


// --- イベントリスナーの設定 ---
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

// 魔法ボタン: ゴーレム素材の切り替え
magicButton.addEventListener('click', () => {
     if (!isBossPhase && gameData.items.length > 0) {
         // アンロック済みの素材内でのみ循環
         golemMaterialLevel = (golemMaterialLevel % player.unlockedGolemLevel) + 1;
         const material = gameData.items.find(i => i.level === golemMaterialLevel);
         magicButton.textContent = `MAGIC: ${material ? material.name : `L${golemMaterialLevel}`}`;
     }
});

// ゴーレムボタン: ゴーレム召喚
golemButton.addEventListener('click', () => {
     if (!golem && isBossPhase && boss) {
         spawnGolem(golemMaterialLevel);
     }
});

// NEW: 盾ボタン
shieldButton.addEventListener('click', () => {
     if (player.shieldCooldown <= 0 && !player.isShielded) {
         keys.Shield = true;
     }
});

// NEW: ポーションボタン
potionButton.addEventListener('click', () => {
     keys.Potion = true;
});


// ----------------------------------------------------
// 🌐 JSONデータロード関数
// ----------------------------------------------------
async function loadGameData() {
    try {
        const [bossRes, itemRes, portionRes] = await Promise.all([
            fetch('./data/boss.json'),
            fetch('./data/item.json'),
            fetch('./data/portion.json')
        ]);

        if (!bossRes.ok || !itemRes.ok || !portionRes.ok) {
            throw new Error('データの読み込みに失敗しました。ファイルを確認してください。');
        }

        const bossList = await bossRes.json();
        const itemData = await itemRes.json();
        const portionData = await portionRes.json();

        gameData.bosses = bossList;
        gameData.items = itemData.golem_materials;
        gameData.debuffs = portionData.debuff_effects;
        gameData.potions = portionData.player_potions; 

        // ポーションの初期在庫を設定
        gameData.potions.forEach(p => {
             player.inventory[p.id] = 0;
        });

        console.log("✅ ゲームデータの読み込みに成功しました。");
        
        updateGolemButtonVisibility();
        
        gameLoop(); 

    } catch (error) {
        console.error("データの取得中にエラーが発生しました:", error);
        alert("ゲームの初期データをロードできませんでした。コンソールを確認してください。");
    }
}

// ----------------------------------------------------
// 🌟 アイテム/UI更新ロジック
// ----------------------------------------------------
function updateGolemButtonVisibility() {
     if (player.unlockedGolemLevel > 0 && gameData.items.length > 0) {
         golemButton.classList.remove('hidden');
         const material = gameData.items.find(i => i.level === golemMaterialLevel);
         golemButton.textContent = `GOLEM: ${material ? material.name : `L${golemMaterialLevel}`}`;
         magicButton.textContent = `MAGIC: ${gameData.items.find(i => i.level === 1)?.name || 'L1'}`;

     } else {
         golemButton.classList.add('hidden');
         magicButton.textContent = 'MAGIC';
     }
}

// NEW: ポーションボタンのテキスト更新
function updatePotionButton() {
     const healPotion = gameData.potions.find(p => p.type === 'heal');
     if (healPotion) {
         potionButton.textContent = `POTION (${player.inventory[healPotion.id] || 0})`;
     }
}

// ----------------------------------------------------
// 🎨 描画関数 ---
// ----------------------------------------------------
function drawPlayer() {
    let pColor = player.color;
    if (player.debuff.burning > 0) pColor = 'red';
    else if (player.debuff.frozen > 0) pColor = 'lightblue';
    else if (player.debuffed) pColor = 'orange'; 

    ctx.fillStyle = pColor; 
    ctx.fillRect(player.x, player.y, player.width, player.height);

    // NEW: 盾の防御エフェクト
    if (player.isShielded) {
         ctx.strokeStyle = 'gold';
         ctx.lineWidth = 4;
         ctx.strokeRect(player.x - 2, player.y - 2, player.width + 4, player.height + 4);
    }
    
    // NEW: 盾のクールダウン表示
    if (player.shieldCooldown > 0) {
        const cdRatio = player.shieldCooldown / 180; // 3秒クールダウン (180フレーム)
        ctx.fillStyle = `rgba(100, 100, 100, 0.5)`;
        ctx.fillRect(player.x, player.y - 15, player.width * cdRatio, 5);
    }
}

function drawBullets() {
    ctx.fillStyle = bulletColor;
    bullets.forEach(b => {
        ctx.fillRect(b.x, b.y, 4, 10);
    });
}

function drawEnemies() {
    enemies.forEach(e => {
        ctx.fillStyle = e.color || 'red'; 
        ctx.fillRect(e.x, e.y, e.width, e.height);
    });
}

function drawBoss() {
    if (!boss) return;
    
    // 昼間は背景色で時間帯を表現 (ゾンビ戦のみ)
    if (isBossPhase && (boss.trait === "zombie_time" || boss.trait === "no_sun_damage")) {
         ctx.fillStyle = isDay ? '#333' : '#000033'; // 昼はグレー、夜は濃い青
         ctx.fillRect(0, 0, WIDTH, HEIGHT);
    }
    
    ctx.fillStyle = boss.color;
    ctx.fillRect(boss.x, boss.y, boss.width, boss.height);
    
    // HPバー
    const hpWidth = boss.width;
    const hpHeight = 5;
    const currentHpWidth = (boss.hp / boss.maxHp) * hpWidth;
    
    // シルバーフィッシュ (trait: "unknown_hp") の場合はHPバーを非表示
    if (boss.trait !== "unknown_hp") {
        ctx.fillStyle = '#660000';
        ctx.fillRect(boss.x, boss.y - hpHeight - 5, hpWidth, hpHeight);
        ctx.fillStyle = 'lime';
        ctx.fillRect(boss.x, boss.y - hpHeight - 5, currentHpWidth, hpHeight);
    }

    // ボスのステータス
    ctx.fillStyle = 'white';
    ctx.font = '16px Arial';
    ctx.textAlign = 'center';
    
    // シルバーフィッシュの場合はHPを「???」にする
    const hpText = boss.trait === "unknown_hp" ? '???' : boss.hp.toFixed(0);
    ctx.fillText(`${boss.name} HP: ${hpText}`, WIDTH / 2, 20);
    ctx.textAlign = 'left'; 
}

function drawGolem() {
    if (!golem) return;
    ctx.fillStyle = golem.color;
    ctx.fillRect(golem.x, golem.y, golem.width, golem.height);

    // 残り時間表示
    ctx.fillStyle = 'white';
    ctx.font = '12px Arial';
    ctx.textAlign = 'center';
    const material = gameData.items.find(i => i.level === golem.level);
    ctx.fillText(material ? material.name : `L${golem.level}`, golem.x + golem.width / 2, golem.y - 5);
    ctx.textAlign = 'left';
}

function drawScore() {
    ctx.fillStyle = 'white';
    ctx.font = '18px Arial';
    
    // プレイヤーHPバー
    const pbarWidth = 150;
    const pbarHeight = 10;
    const currentPBarWidth = (player.hp / player.maxHp) * pbarWidth;
    ctx.fillStyle = '#333';
    ctx.fillRect(WIDTH - pbarWidth - 10, 10, pbarWidth, pbarHeight);
    ctx.fillStyle = 'red';
    ctx.fillRect(WIDTH - pbarWidth - 10, 10, currentPBarWidth, pbarHeight);
    ctx.fillStyle = 'white';
    ctx.fillText(`HP: ${player.hp.toFixed(0)}`, WIDTH - pbarWidth - 50, 20);


    ctx.fillText(`REBEL: ${currentRebel} / ${MAX_REBEL}`, 10, 30); 
    ctx.fillText('SCORE: ' + score, 10, 55);
    ctx.fillText('LEVEL: ' + level, 10, 80);
    
    if (level < BOSS_TRIGGER_LEVEL) {
         ctx.fillText('NEXT: ' + nextLevelThreshold, 10, 105);
    } else if (!isBossPhase) {
         ctx.fillText(`READY FOR BOSS ${currentRebel}!`, 10, 105);
    }
    
    // 時間帯表示
    if (isBossPhase) {
        const timeStatus = isDay ? "🌞 DAY" : "🌑 NIGHT";
        ctx.fillText(`TIME: ${timeStatus}`, 10, 130);
    }
    
    // NEW: ポーション在庫表示
    const healPotion = gameData.potions.find(p => p.type === 'heal');
    if (healPotion) {
         ctx.fillText(`POTION: ${player.inventory[healPotion.id] || 0}`, 10, 155);
    }
    
    // NEW: 盾/ポーションの状態表示
    let statusText = '';
    if (player.isShielded) statusText += '🛡️';
    if (player.shieldCooldown > 0) statusText += '⏳';
    
    // デバフ情報
    let debuffText = '';
    if (player.debuff.burning > 0) debuffText += '🔥';
    if (player.debuff.poison > 0) debuffText += '🤢';
    if (player.debuff.frozen > 0) debuffText += '❄️(S)';
    if (player.debuffed) debuffText += '💨(S)';
    if (debuffText || statusText) {
        ctx.fillText(`Status: ${statusText}${debuffText}`, 10, 390);
    }
}

function drawMessage(text) {
    ctx.fillStyle = 'rgba(0, 0, 0, 0.6)';
    ctx.fillRect(0, HEIGHT / 2 - 30, WIDTH, 60);
    ctx.fillStyle = 'yellow';
    ctx.font = '30px Arial';
    ctx.textAlign = 'center';
    ctx.fillText(text, WIDTH / 2, HEIGHT / 2 + 10);
    ctx.textAlign = 'left';
}

function drawGameClear() {
    ctx.fillStyle = 'rgba(0, 0, 0, 0.7)';
    ctx.fillRect(0, 0, WIDTH, HEIGHT);
    ctx.fillStyle = 'gold';
    ctx.font = '40px Arial';
    ctx.textAlign = 'center';
    ctx.fillText('🏆 GAME MASTER! 🏆', WIDTH / 2, HEIGHT / 2 - 20);
    ctx.font = '24px Arial';
    ctx.fillText(`最終スコア: ${score}`, WIDTH / 2, HEIGHT / 2 + 30);
    ctx.font = '16px Arial';
    ctx.fillText('画面をリロードして再スタート', WIDTH / 2, HEIGHT / 2 + 80);
}

// --- ダメージ処理関数 ---
function calculateDamage(baseDamage) {
    if (player.isShielded) {
        // 盾/防御ポーション中はダメージを大幅軽減
        return Math.max(1, Math.floor(baseDamage * 0.1));
    }
    
    const defense = DEFENSE_STATS[player.defenseLevel].reduction;
    let finalDamage = Math.max(1, baseDamage - defense); 
    
    if (player.defenseLevel === 6) {
         if (player.debuff.burning > 0) {
            finalDamage = Math.max(1, finalDamage - 1); 
         }
    }
    return finalDamage;
}

// --- NEW: 盾の使用と更新 ---
function updateShield() {
    // 盾のクールダウン更新
    if (player.shieldCooldown > 0) {
        player.shieldCooldown--;
    }
    
    // 盾/防御ポーションの効果時間更新
    if (player.shieldDuration > 0) {
        player.shieldDuration--;
        if (player.shieldDuration <= 0) {
            player.isShielded = false;
        }
    }

    if (keys.Shield && player.shieldCooldown <= 0) {
        // 盾使用開始
        player.isShielded = true;
        player.shieldCooldown = 180; // 3秒クールダウン
        player.shieldDuration = 30; // 0.5秒間防御
        keys.Shield = false; // フラグをリセット
        drawMessage("SHIELD UP!");
    } else if (player.isShielded && player.shieldDuration <= 0) {
        // 盾の自動解除
        player.isShielded = false;
    }
}

// --- NEW: ポーションの使用 ---
function usePotion() {
    const healPotion = gameData.potions.find(p => p.type === 'heal');
    const shieldPotion = gameData.potions.find(p => p.type === 'shield');
    
    if (keys.Potion) {
        if (player.inventory[healPotion.id] > 0) {
            // 1. 回復ポーションを使用
            player.hp = Math.min(player.maxHp, player.hp + healPotion.effect_value);
            player.inventory[healPotion.id]--;
            drawMessage(`HEALED! (+${healPotion.effect_value}HP)`);
            updatePotionButton();
        } else if (player.inventory[shieldPotion.id] > 0 && !player.isShielded) {
            // 2. 防御ポーションを使用
            player.isShielded = true;
            player.shieldDuration = shieldPotion.effect_value; 
            player.inventory[shieldPotion.id]--;
            drawMessage(`SHIELD POTION! (${(shieldPotion.effect_value/60).toFixed(0)}s)`);
            updatePotionButton();
        } else {
            drawMessage("NO POTION or ALREADY SHIELDED!");
        }
        keys.Potion = false; 
    }
}

// --- ゴーレムロジック ---
function spawnGolem(level) {
    const material = gameData.items.find(i => i.level === level);
    if (!material) return; 
    
    golem = {
        x: player.x,
        y: player.y - 50,
        width: 20,
        height: 30,
        color: material.color || 'brown', 
        level: level,
        damage: material.damage,
        duration: material.duration,
        timer: material.duration
    };
    drawMessage(`GOLEM LV.${level} SUMMONED! (${material.name})`);
}

function updateGolem() {
    if (!golem || !boss) return;

    golem.timer--;

    const dx = boss.x + boss.width / 2 - (golem.x + golem.width / 2);
    const dy = boss.y + boss.height - (golem.y + golem.height / 2);
    const dist = Math.sqrt(dx * dx + dy * dy);
    const speed = 2;

    if (dist > 1) {
        golem.x += (dx / dist) * speed;
        golem.y += (dy / dist) * speed;
    }

    if (golem.x < boss.x + boss.width &&
        golem.x + golem.width > boss.x &&
        golem.y < boss.y + boss.height &&
        golem.y + golem.height > boss.y || golem.timer <= 0) {
        
        if (golem.timer > 0) {
            let golemDamage = golem.damage; 

            // エンダーマイトの特性: 魔法特効
            if (boss.trait === "magic_vulnerability") {
                 golemDamage = golemDamage * (1 + (boss.stats.magic / 10)); 
                 drawMessage(`MAGIC CRIT! (-${golemDamage.toFixed(1)})`);
            }
            
            boss.hp -= golemDamage; 
            score += Math.floor(golemDamage);
            
        } else {
            drawMessage("GOLEM EXPIRED.");
        }
        golem = null;
        if (boss && boss.hp <= 0) {
            drawMessage(`BOSS ${currentRebel} DEFEATED!`);
            // ボス撃破時の処理にアイテムドロップを追加
            checkDropItem(); 
            setTimeout(nextRebel, 2000); 
        }
    }
}

// --- NEW: アイテムドロップ判定 ---
function checkDropItem() {
    // 1. ゴーレム素材のドロップ
    const potentialDrops = gameData.items.filter(i => i.drop_from === currentRebel);
    let droppedItem = null;

    potentialDrops.forEach(item => {
        if (Math.random() < item.drop_chance) {
            // ドロップ率に応じてアンロック済みのゴーレム素材をドロップ
            player.unlockedGolemLevel = Math.max(player.unlockedGolemLevel, item.level);
            droppedItem = item.name;
        }
    });

    // 2. ポーションのドロップ (常に回復ポーションか防御ポーションのどちらかがドロップする)
    const dropPotionId = Math.random() < 0.7 ? 1 : 2; // 回復ポーション(1)が70%、防御ポーション(2)が30%
    const droppedPotion = gameData.potions.find(p => p.id === dropPotionId);

    if (droppedPotion) {
        const currentCount = player.inventory[droppedPotion.id] || 0;
        if (currentCount < droppedPotion.inventory_max) {
             player.inventory[droppedPotion.id] = currentCount + 1;
             updatePotionButton();
             droppedItem = droppedItem ? `${droppedItem} & ${droppedPotion.name}` : droppedPotion.name;
        }
    }

    if (droppedItem) {
        drawMessage(`ITEM GET: ${droppedItem}!`);
    }
    
    updateGolemButtonVisibility(); // アンロックされた素材に合わせて更新
}

// --- デバフ処理 ---
function applyDebuff(type, durationFrames) {
    if (type === 'burning') player.debuff.burning = Math.max(player.debuff.burning, durationFrames);
    if (type === 'poison') player.debuff.poison = Math.max(player.debuff.poison, durationFrames);
    if (type === 'frozen') player.debuff.frozen = Math.max(player.debuff.frozen, durationFrames);
}

function updateDebuffs() {
    player.speed = player.baseSpeed - DEFENSE_STATS[player.defenseLevel].speedPenalty; 

    if (player.debuff.burning > 0) {
        if (player.debuff.burning % 60 === 0) { 
            const damage = calculateDamage(5); 
            player.hp -= damage; 
        }
        player.debuff.burning--;
    }

    if (player.debuff.poison > 0) {
        if (player.debuff.poison % 60 === 0) { 
            const damage = calculateDamage(2.5); 
            player.hp -= damage;
        }
        player.debuff.poison--;
    }

    if (player.debuff.frozen > 0) {
        if (player.debuff.frozen % 60 === 0) { 
            const damage = calculateDamage(4); 
            player.hp -= damage;
        }
        player.speed = Math.min(player.speed, 2); 
        player.debuff.frozen--;
    }

    if (player.hp <= 0) {
        isGameOver = true; 
        alert(`ゲームオーバー！ デバフによる死亡 スコア: ${score}`);
        resetGame();
    }
}

// --- 時間帯の更新 ---
function updateTimeOfDay() {
    if (!isBossPhase) {
        timeOfDayTimer = 0; 
        isDay = true; 
        return;
    }
    
    // 昼夜サイクル
    timeOfDayTimer++;
    if (timeOfDayTimer >= TIME_CYCLE_DURATION) {
        timeOfDayTimer = 0;
        isDay = !isDay; 
        
        // 昼夜が切り替わった時のメッセージ
        const timeMessage = isDay ? "🌞 DAY BREAKS!" : "🌑 MIDNIGHT FALLS!";
        drawMessage(timeMessage);
    }
    
    // ゾンビの昼間燃焼ダメージ処理
    if (isDay && boss && boss.trait === "zombie_time") {
        if (timeOfDayTimer % 60 === 0) { // 1秒ごとにダメージ
            const burnDamage = boss.trait_data.sun_damage || 5;
            boss.hp -= burnDamage;
            score += burnDamage;
            drawMessage(`ZOMBIE BURNS! (-${burnDamage})`);
            
            if (boss.hp <= 0) {
                 drawMessage(`BOSS ${currentRebel} DEFEATED!`);
                 // ボス撃破時の処理にアイテムドロップを追加
                 checkDropItem(); 
                 setTimeout(nextRebel, 2000); 
            }
        }
    }
}

// --- ボス戦ロジック ---
function spawnBoss() {
    isBossPhase = true;
    enemies.length = 0; 

    const bossData = gameData.bosses.find(b => b.rebel === currentRebel);
    if (!bossData) return;
    
    const bossMultiplier = currentRebel * currentRebel;
    const finalBossHP = bossData.base_hp * bossMultiplier; 

    boss = {
        x: WIDTH / 2 - 50,
        y: 50,
        width: 100,
        height: 100,
        maxHp: finalBossHP, 
        hp: finalBossHP,
        color: bossData.color,
        name: bossData.name,
        note: bossData.note,
        
        stats: bossData.stats,
        trait: bossData.trait,
        trait_data: bossData.trait_data,

        speed: 1.5 + (bossData.stats.speed - 1) * 0.1, 
        currentAction: 0,
        actionTimer: 0,
        debuffDuration: 0, 
        movingRight: true
    };
    drawMessage(`${boss.name} APPEARS! (${boss.note})`);
    
    updateGolemButtonVisibility(); 
    timeOfDayTimer = 0; // 時間をリセット
    isDay = true;
    
    setTimeout(() => {
        bossActionTimer = 0; 
    }, 1500);
}

// ボスの行動パターン
function updateBossAction() {
    if (!boss) return;
    
    const bulletSpeedBossBase = 3 + boss.stats.magic * 0.2; 

    bossActionTimer++;
    if (bossActionTimer < 100) return; 

    if (boss.debuffDuration > 0) {
         boss.debuffDuration--;
         if (boss.debuffDuration === 0) {
            const bossData = gameData.bosses.find(b => b.rebel === currentRebel);
            boss.color = bossData.color; 
         }
    }

    boss.actionTimer++;

    // 左右移動
    if (boss.movingRight) {
        boss.x += boss.speed;
        if (boss.x > WIDTH - boss.width) boss.movingRight = false;
    } else {
        boss.x -= boss.speed;
        if (boss.x < 0) boss.movingRight = true;
    }
    
    // ゾンビタイム特性の処理 (夜間のみ)
    if (boss.trait === "zombie_time" && !isDay && boss.trait_data) {
        if (boss.actionTimer % boss.trait_data.summon_interval === 0) {
            const [min, max] = boss.trait_data.summon_amount;
            const count = Math.floor(Math.random() * (max - min + 1)) + min;
            drawMessage(`ZOMBIE TIME! CALLING ${count} FRIENDS!`);
            for (let i = 0; i < count; i++) {
                enemies.push({ 
                    x: boss.x + boss.width / 2, 
                    y: boss.y + boss.height, 
                    width: 30, 
                    height: 30, 
                    color: boss.color, 
                    speed: baseEnemySpeed * 1.5, 
                    isBossBullet: false 
                });
            }
        }
    }

    if (boss.actionTimer >= bossActionInterval) {
        boss.actionTimer = 0;
        
        const pattern = Math.floor(Math.random() * 5) + 1; 

        // ハスク特性: デバフなしはそのまま
        if (boss.trait === "no_sun_damage") { 
             if (pattern > 2) bossAttackBullet(bulletSpeedBossBase, 'none');
             else bossAttackBigBullet(bulletSpeedBossBase * 0.5, 'none');
             return;
        }

        let debuffType = 'none';
        if (Math.random() < 0.4) { 
            const debuffs = gameData.debuffs.map(d => d.type);
            debuffType = debuffs[Math.floor(Math.random() * debuffs.length)];
        }


        switch (pattern) {
            case 1: 
                bossAttackBullet(bulletSpeedBossBase, debuffType);
                break;
            case 2: 
                bossAttackBigBullet(bulletSpeedBossBase * 0.5, debuffType); 
                break;
            case 3: 
                bossMagicDebuff();
                break;
            case 4: 
                bossMagicBuff();
                break;
            case 5: 
                if (boss.name === "ゾンビ") {
                     bossAttackArea('burning'); 
                } else {
                     bossAttackBullet(bulletSpeedBossBase, debuffType);
                }
                break;
        }
    }
}

function bossAttackArea(debuffType) {
    drawMessage("BOSS: AREA ATTACK!");
    setTimeout(() => {
        enemies.push({
            x: player.x - 20,
            y: player.y - 20,
            width: player.width + 40,
            height: player.height + 40,
            color: debuffType === 'burning' ? 'red' : 'purple',
            speedX: 0,
            speedY: 0,
            isBossBullet: true,
            isArea: true, 
            debuff: debuffType
        });
    }, 500);
}

function bossAttackBullet(baseSpeed, debuffType) {
    const angle = Math.atan2(player.y - boss.y, player.x - boss.x);
    enemies.push({ 
        x: boss.x + boss.width / 2,
        y: boss.y + boss.height,
        width: 10,
        height: 10,
        color: 'yellowgreen',
        speedX: Math.cos(angle) * baseSpeed,
        speedY: Math.sin(angle) * baseSpeed,
        isBossBullet: true,
        debuff: debuffType
    });
}

function bossAttackBigBullet(baseSpeed, debuffType) {
    drawMessage("BOSS: CHARGING BIG!");
    setTimeout(() => {
        const angle = Math.atan2(player.y - boss.y, player.x - boss.x);
        enemies.push({
            x: boss.x + boss.width / 2,
            y: boss.y + boss.height,
            width: 20,
            height: 20,
            color: 'orange',
            speedX: Math.cos(angle) * baseSpeed,
            speedY: Math.sin(angle) * baseSpeed,
            isBossBullet: true,
            debuff: debuffType
        });
        drawMessage("BOSS: FIRE!");
    }, 500);
}

function bossMagicDebuff() {
    player.debuffed = true;
    player.speed = 2; 
    drawMessage("BOSS: CURSE! (Speed Down)");
    
    setTimeout(() => {
        player.debuffed = false;
        player.speed = player.baseSpeed; 
        drawMessage("CURSE LIFTED.");
    }, 3000); 
}

function bossMagicBuff() {
    boss.debuffDuration = 180; 
    const bossData = gameData.bosses.find(b => b.rebel === currentRebel);
    boss.color = 'red'; 
    boss.speed *= 1.5; 
    drawMessage("BOSS: BUFF! (Speed Up)");

    setTimeout(() => {
        boss.speed /= 1.5; 
        boss.color = bossData.color;
        drawMessage("BUFF END.");
    }, 3000);
}

// --- レベルアップ/Rebel進行関連 ---
function checkLevelUp() {
    if (isGameOver || isBossPhase) return;
    if (score >= nextLevelThreshold) { levelUp(); }
    if (level >= BOSS_TRIGGER_LEVEL && !isBossPhase) { spawnBoss(); }
}
function levelUp() {
    if (level >= BOSS_TRIGGER_LEVEL) return; 
    level++;
    nextLevelThreshold = Math.ceil(nextLevelThreshold * LEVEL_MULTIPLIER); 
    currentEnemySpawnInterval = Math.max(20, currentEnemySpawnInterval * 0.9); 
    baseEnemySpeed += 0.4; 
}
function nextRebel() {
    currentRebel++;
    
    // アイテムドロップはcheckDropItem()で処理されるため、ここではレベルアンロックのみ
    // player.unlockedGolemLevel = Math.max(player.unlockedGolemLevel, currentRebel); // ドロップでアンロックするためコメントアウト

    if (currentRebel > MAX_REBEL) {
         isGameOver = true; 
    } else {
         level = 1;
         nextLevelThreshold = INITIAL_LEVEL_THRESHOLD;
         currentEnemySpawnInterval = INITIAL_ENEMY_SPAWN_INTERVAL;
         baseEnemySpeed = INITIAL_ENEMY_BASE_SPEED;
         isBossPhase = false;
         boss = null;
         golem = null; 
         player.hp = player.maxHp; 
         score += 100 * currentRebel; 
         drawMessage(`REBEL ${currentRebel} START!`);
    }
    
    updateGolemButtonVisibility();
}


// --- 更新関数 ---
function updatePlayer() {
    if (isGameOver) return; 
    const actualSpeed = player.speed; 
    if (keys.ArrowLeft && player.x > 0) { player.x -= actualSpeed; }
    if (keys.ArrowRight && player.x < WIDTH - player.width) { player.x += actualSpeed; }
    if (keys.Space) { shootBullet(); }
}
let lastShotTime = 0;
const shotDelay = 100; 
function shootBullet() {
    if (isGameOver) return;
    const currentTime = Date.now();
    if (currentTime - lastShotTime > shotDelay) {
        bullets.push({ x: player.x + player.width / 2 - 2, y: player.y, width: 4, height: 10 });
        lastShotTime = currentTime;
    }
}
function updateBullets() {
    for (let i = bullets.length - 1; i >= 0; i--) {
        bullets[i].y -= bulletSpeed;
        if (bullets[i].y < 0) { bullets.splice(i, 1); }
    }
}
function updateEnemies() {
    // ボス戦中、ボス弾とゾンビタイム召喚された仲間は残す
    if (isBossPhase) { enemies = enemies.filter(e => e.isBossBullet || e.y < HEIGHT); } 
    else {
        enemySpawnTimer++;
        if (enemySpawnTimer >= currentEnemySpawnInterval) { 
            enemies.push({ x: Math.random() * (WIDTH - 30), y: -30, width: 30, height: 30, color: 'red', speed: baseEnemySpeed + Math.random() * 2, isBossBullet: false });
            enemySpawnTimer = 0;
        }
    }
    for (let i = enemies.length - 1; i >= 0; i--) {
        const e = enemies[i];
        if (e.isBossBullet && !e.isArea) { e.x += e.speedX; e.y += e.speedY; } else if (!e.isArea) { e.y += e.speed; }
        if (e.y > HEIGHT || e.y < -e.height || e.x < -e.width || e.x > WIDTH) { if (e.isArea) enemies.splice(i, 1); }
    }
}

// --- 衝突判定 ---
function checkCollisions() {
    if (isGameOver) return;
    // 1. 弾と敵/ボスの衝突
    for (let i = bullets.length - 1; i >= 0; i--) {
        const b = bullets[i];
        let hit = false;
        if (isBossPhase && boss) {
            if (b.x < boss.x + boss.width && b.x + b.width > boss.x && b.y < boss.y + boss.height && b.y + boss.height > boss.y) {
                let damageToBoss = 10; 
                if (boss.trait === "magic_vulnerability") { damageToBoss = 0; drawMessage("PHYSICAL IMMUNE! Use GOLEM!"); }
                boss.hp -= damageToBoss; 
                score += damageToBoss > 0 ? 1 : 0; 
                bullets.splice(i, 1); hit = true;
                if (boss && boss.hp <= 0) { 
                    drawMessage(`BOSS ${currentRebel} DEFEATED!`); 
                    // ボス撃破時の処理にアイテムドロップを追加
                    checkDropItem(); 
                    setTimeout(nextRebel, 2000); 
                    return; 
                }
            }
        }
        if (!hit) {
            for (let j = enemies.length - 1; j >= 0; j--) {
                const e = enemies[j];
                if (e.isBossBullet) continue; 
                if (b.x < e.x + e.width && b.x + b.width > e.x && b.y < e.y + e.height && b.y + e.height > e.y) {
                    enemies.splice(j, 1); bullets.splice(i, 1); score += 10; break; 
                }
            }
        }
    }
    // 2. 敵/敵弾とプレイヤーの衝突
    for (let i = enemies.length - 1; i >= 0; i--) {
        const e = enemies[i];
        if (player.x < e.x + e.width && player.x + player.width > e.x && player.y < e.y + e.height && player.y + player.height > e.y) {
            if (e.isBossBullet) {
                let baseDamage = e.isArea ? 15 : 10;
                player.hp -= calculateDamage(baseDamage); 
                if (e.debuff && e.debuff !== 'none') { applyDebuff(e.debuff, 180); }
                enemies.splice(i, 1); 
                if (player.hp <= 0) { isGameOver = true; alert(`ゲームオーバー！ 敵弾/攻撃に接触 スコア: ${score}`); resetGame(); return; }
            } else {
                isGameOver = true; alert(`ゲームオーバー！ 敵機に接触！ スコア: ${score}`); resetGame(); return;
            }
        }
    }
}

// --- ゲームのリセット ---
function resetGame() {
    player.x = WIDTH / 2 - 20; player.y = HEIGHT - 40; bullets.length = 0; enemies.length = 0;
    score = 0; level = 1; currentRebel = 1; nextLevelThreshold = INITIAL_LEVEL_THRESHOLD;
    currentEnemySpawnInterval = INITIAL_ENEMY_SPAWN_INTERVAL; baseEnemySpeed = INITIAL_ENEMY_BASE_SPEED;
    isGameOver = false; isBossPhase = false; boss = null; golem = null; player.hp = player.maxHp; 
    player.debuff = { burning: 0, poison: 0, frozen: 0 }; player.debuffed = false;
    player.speed = player.baseSpeed - DEFENSE_STATS[player.defenseLevel].speedPenalty; 
    player.unlockedGolemLevel = 1; 
    golemMaterialLevel = 1;
    enemySpawnTimer = 0;
    timeOfDayTimer = 0; 
    isDay = true;      
    player.shieldCooldown = 0; 
    player.isShielded = false; 
    player.shieldDuration = 0; 

    // ポーション在庫のリセット
    gameData.potions.forEach(p => {
         player.inventory[p.id] = 0;
    });

    updateGolemButtonVisibility(); 
    updatePotionButton();
    magicButton.textContent = `MAGIC: ${gameData.items.find(i => i.level === 1)?.name || 'L1'}`;
}


// --- メインゲームループ ---
function gameLoop() {
    ctx.clearRect(0, 0, WIDTH, HEIGHT);
    
    // ゾンビ/ハスク戦ではない場合、背景は黒
    if (!isBossPhase || (boss && boss.trait !== "zombie_time" && boss.trait !== "no_sun_damage")) {
        ctx.fillStyle = 'black';
        ctx.fillRect(0, 0, WIDTH, HEIGHT);
    }
    
    if (isGameOver && currentRebel > MAX_REBEL) { drawGameClear(); return; } else if (isGameOver) { return; }

    updateTimeOfDay(); // 時間帯の更新
    updateDebuffs(); 
    updateShield(); // 盾の更新
    usePotion();    // ポーションの使用
    updatePlayer();
    updateBullets();
    updateEnemies();
    updateBossAction(); 
    updateGolem(); 

    checkCollisions();
    checkLevelUp(); 

    drawPlayer();
    drawBullets();
    drawEnemies();
    drawBoss(); 
    drawGolem(); 
    drawScore();

    requestAnimationFrame(gameLoop);
}

// ゲーム開始はJSONのロードから
loadGameData();
