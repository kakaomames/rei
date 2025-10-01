// game.jsで定義されたグローバル変数を使用:
// player, isGameOver, keys, bullets, WIDTH, HEIGHT, bulletSpeed, gameData, DEFENSE_STATS, 
// applyDebuff, calculateDamage, updatePotionButton (ui_draw.js)

// --- プレイヤーと弾の更新 ---
let lastShotTime = 0;
const shotDelay = 100; 

function updatePlayer() {
    if (isGameOver) return; 
    const actualSpeed = player.speed; 
    if (keys.ArrowLeft && player.x > 0) { player.x -= actualSpeed; }
    if (keys.ArrowRight && player.x < WIDTH - player.width) { player.x += actualSpeed; }
    if (keys.Space) { shootBullet(); }
}

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

// --- 盾の使用と更新 ---
function updateShield() {
    if (player.shieldCooldown > 0) {
        player.shieldCooldown--;
    }
    
    if (player.shieldDuration > 0) {
        player.shieldDuration--;
        if (player.shieldDuration <= 0) {
            player.isShielded = false;
        }
    }

    if (keys.Shield && player.shieldCooldown <= 0) {
        player.isShielded = true;
        player.shieldCooldown = 180; // 3秒クールダウン (60FPS想定)
        player.shieldDuration = 30; // 0.5秒間防御
        keys.Shield = false; 
        drawMessage("SHIELD UP!"); // ui_draw.js
    } else if (player.isShielded && player.shieldDuration <= 0) {
        player.isShielded = false;
    }
}

// --- ポーションの使用 ---
function usePotion() {
    // gameData.potionsはArrayなので、findで検索
    const healPotion = gameData.potions.find(p => p.type === 'heal');
    const shieldPotion = gameData.potions.find(p => p.type === 'shield');
    
    if (keys.Potion) {
        if (healPotion && player.inventory[healPotion.id] > 0) {
            // 回復ポーションの使用
            player.hp = Math.min(player.maxHp, player.hp + healPotion.effect_value);
            player.inventory[healPotion.id]--;
            drawMessage(`HEALED! (+${healPotion.effect_value}HP)`); // ui_draw.js
            updatePotionButton(); // ui_draw.js
        } else if (shieldPotion && player.inventory[shieldPotion.id] > 0 && !player.isShielded) {
            // シールドポーションの使用
            player.isShielded = true;
            player.shieldDuration = shieldPotion.effect_value; 
            player.inventory[shieldPotion.id]--;
            drawMessage(`SHIELD POTION! (${(shieldPotion.effect_value/60).toFixed(0)}s)`); // ui_draw.js
            updatePotionButton(); // ui_draw.js
        } else {
            drawMessage("NO POTION or ALREADY SHIELDED!"); // ui_draw.js
        }
        keys.Potion = false; 
    }
}

// --- デバフ処理 ---
function applyDebuff(type, durationFrames) {
    if (type === 'burning') player.debuff.burning = Math.max(player.debuff.burning, durationFrames);
    if (type === 'poison') player.debuff.poison = Math.max(player.debuff.poison, durationFrames);
    if (type === 'frozen') player.debuff.frozen = Math.max(player.debuff.frozen, durationFrames);
}

function updateDebuffs() {
    player.speed = player.baseSpeed - DEFENSE_STATS[player.defenseLevel].speedPenalty; 

    // デバフのダメージと効果
    const burningDebuff = gameData.debuffs.find(d => d.type === 'burning');
    const poisonDebuff = gameData.debuffs.find(d => d.type === 'poison');
    const frozenDebuff = gameData.debuffs.find(d => d.type === 'frozen');

    if (player.debuff.burning > 0) {
        if (player.debuff.burning % 60 === 0 && burningDebuff) { 
            // 毎秒ダメージ
            const damage = calculateDamage(burningDebuff.damage_per_sec); 
            player.hp -= damage; 
        }
        player.debuff.burning--;
    }

    if (player.debuff.poison > 0) {
        if (player.debuff.poison % 60 === 0 && poisonDebuff) { 
            // 毎秒ダメージ
            const damage = calculateDamage(poisonDebuff.damage_per_sec); 
            player.hp -= damage;
        }
        player.debuff.poison--;
    }

    if (player.debuff.frozen > 0) {
        if (player.debuff.frozen % 60 === 0 && frozenDebuff) { 
            // 毎秒ダメージ
            const damage = calculateDamage(frozenDebuff.damage_per_sec); 
            player.hp -= damage;
        }
        // スピード低下効果
        player.speed = Math.min(player.speed, 2); 
        player.debuff.frozen--;
    }

    if (player.hp <= 0) {
        isGameOver = true; 
        alert(`ゲームオーバー！ デバフによる死亡 スコア: ${score}`);
        resetGame(); // game.js
        goToHome(); // game.js
    }
}

// --- ダメージ計算 ---
function calculateDamage(baseDamage) {
    // シールド発動中はダメージを大幅軽減
    if (player.isShielded) {
        return Math.max(1, Math.floor(baseDamage * 0.1));
    }
    
    // 防御レベルに応じた軽減
    const defense = DEFENSE_STATS[player.defenseLevel].reduction;
    let finalDamage = Math.max(1, baseDamage - defense); 
    
    // ネザライト防具の特殊効果（炎上ダメージ軽減）
    if (player.defenseLevel === 6) {
         if (player.debuff.burning > 0) {
            finalDamage = Math.max(1, finalDamage - 1); 
         }
    }
    return finalDamage;
}
