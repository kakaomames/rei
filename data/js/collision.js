// game.jsで定義されたグローバル変数を使用:
// player, bullets, enemies, boss, golem, gameData, isGameOver, currentRebel, score, 
// WIDTH, HEIGHT, MAX_REBEL, checkLevelUp (enemy.js), resetGame (game.js), goToHome (game.js), 
// drawMessage (ui_draw.js), updateGolemButtonVisibility (ui_draw.js), updatePotionButton (ui_draw.js),
// calculateDamage (player.js), applyDebuff (player.js)


// ----------------------------------------------------
// 💥 衝突判定ロジック
// ----------------------------------------------------
function checkCollisions() {
    if (isGameOver) return;
    
    // 1. 弾(bullets)と敵(enemies) / ボス(boss)の衝突
    for (let i = bullets.length - 1; i >= 0; i--) {
        const b = bullets[i];
        let hit = false;
        
        // ボスとの衝突
        if (isBossPhase && boss) {
             if (b.x < boss.x + boss.width && b.x + b.width > boss.x && b.y < boss.y + boss.height && b.y > boss.y) {
                let damageToBoss = 10; 
                
                // 特定の特性を持つボスに通常弾が効かないようにする
                if (boss.trait === "magic_vulnerability") { 
                    damageToBoss = 0; 
                    drawMessage("PHYSICAL IMMUNE! Use GOLEM!"); 
                }
                
                if (damageToBoss > 0) {
                    boss.hp -= damageToBoss; 
                    score += 1; 
                }
                
                bullets.splice(i, 1); 
                hit = true;
                
                if (boss && boss.hp <= 0) { 
                    handleBossDefeat(); // ボス討伐処理へ
                    return; 
                }
            }
        }
        
        // 雑魚敵との衝突 (Mob Phase/Boss Phaseの雑魚)
        if (!hit) {
            for (let j = enemies.length - 1; j >= 0; j--) {
                const e = enemies[j];
                // ボスが発射した弾には当たらない
                if (e.isBoss) continue; 
                
                if (b.x < e.x + e.width && b.x + b.width > e.x && b.y < e.y + e.height && b.y > e.y) {
                    
                    e.hp -= 10; // 弾の固定ダメージ
                    
                    if (e.hp <= 0) {
                        enemies.splice(j, 1); 
                        score += e.score || 10; 
                        player.coins += e.coin_drop || 1; 
                        
                        if (isMobPhase) {
                            currentKills++; // enemy.js
                            // checkLevelUp()が次のフレームでボス出現をチェックする
                        }
                    }
                    bullets.splice(i, 1); 
                    break; 
                }
            }
        }
    }
    
    // 2. 敵/敵弾(enemies)とプレイヤー(player)の衝突
    for (let i = enemies.length - 1; i >= 0; i--) {
        const e = enemies[i];
        
        // 矩形の重なり判定
        if (player.x < e.x + e.width && player.x + player.width > e.x && player.y < e.y + e.height && player.y + player.height > e.y) {
            
            // 敵が発射した弾 or エリア攻撃の場合
            if (e.isBoss) {
                let baseDamage = e.damage || 10; 
                player.hp -= calculateDamage(baseDamage); // player.jsの関数を使用
                
                // デバフ効果
                if (e.debuff && e.debuff !== 'none') { 
                    applyDebuff(e.debuff, 180); // player.jsの関数を使用
                } 
                
                enemies.splice(i, 1); // 弾を削除
                
                if (player.hp <= 0) { 
                    isGameOver = true; 
                    alert(`ゲームオーバー！ 敵弾/攻撃に接触 スコア: ${score}`); 
                    resetGame(); 
                    goToHome(); 
                    return; 
                }
            } else {
                // 敵機本体に接触（即死）
                isGameOver = true; 
                alert(`ゲームオーバー！ 敵機に接触！ スコア: ${score}`); 
                resetGame(); 
                goToHome(); 
                return; 
            }
        }
    }
}

// ----------------------------------------------------
// 🛡️ ゴーレム関連ロジック
// ----------------------------------------------------

/**
 * ゴーレムを召喚する
 * @param {number} level - 召喚するゴーレムの素材レベル
 */
function spawnGolem(level) {
    const material = Array.from(gameData.items.values()).find(i => i.level === level);
    if (!material || !boss) return; 
    
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

/**
 * ゴーレムの動作更新とボスへの衝突判定
 */
function updateGolem() {
    if (!golem || !boss) return;

    golem.timer--;

    // 1. ボスに向かって移動
    const dx = boss.x + boss.width / 2 - (golem.x + golem.width / 2);
    const dy = boss.y + boss.height / 2 - (golem.y + golem.height / 2); // ボスの中心Yに向かう
    const dist = Math.sqrt(dx * dx + dy * dy);
    const speed = 2;

    if (dist > 1) {
        golem.x += (dx / dist) * speed;
        golem.y += (dy / dist) * speed;
    }

    // 2. ボスとの衝突または時間切れ
    const collidedWithBoss = golem.x < boss.x + boss.width &&
                             golem.x + golem.width > boss.x &&
                             golem.y < boss.y + boss.height &&
                             golem.y + golem.height > boss.y;
                             
    if (collidedWithBoss || golem.timer <= 0) {
        
        if (collidedWithBoss) {
            let golemDamage = golem.damage; 

            // ボスの特性に応じたダメージ計算
            if (boss.trait === "magic_vulnerability") {
                 // 魔法ダメージに脆弱な場合、ゴーレム（魔法攻撃）のダメージが増加
                 const multiplier = (boss.stats.magic / 5) || 1.5; 
                 golemDamage = golemDamage * multiplier; 
                 drawMessage(`GOLEM CRIT! (-${golemDamage.toFixed(1)})`);
            } else {
                 drawMessage(`GOLEM HIT! (-${golemDamage.toFixed(1)})`);
            }
            
            boss.hp -= golemDamage; 
            score += Math.floor(golemDamage);
        } else {
            drawMessage("GOLEM EXPIRED.");
        }
        
        golem = null; // ゴーレムを削除
        
        if (boss && boss.hp <= 0) {
            handleBossDefeat(); // ボス討伐処理へ
        }
    }
}

// ----------------------------------------------------
// 🎉 レベル進行・ドロップ関連
// ----------------------------------------------------

/**
 * ボス討伐後の処理を実行する
 */
function handleBossDefeat() {
    drawMessage(`BOSS ${currentRebel} DEFEATED!`);
    
    // アイテムドロップと次のレベルへの準備
    checkDropItem(); 
    
    // 次のレベルへ
    setTimeout(nextRebel, 2000); 
}

/**
 * アイテムドロップ判定とポーション在庫処理
 */
function checkDropItem() {
    // 1. ゴーレム素材のドロップ
    const potentialDrops = Array.from(gameData.items.values()).filter(i => i.drop_from === currentRebel);
    let droppedItemNames = [];

    potentialDrops.forEach(item => {
        if (Math.random() < item.drop_chance) {
            player.unlockedGolemLevel = Math.max(player.unlockedGolemLevel, item.level);
            droppedItemNames.push(item.name);
        }
    });
    
    // 2. ポーションのドロップ
    const dropPotionId = Math.random() < 0.7 ? "healing_potion" : "shielding_potion";
    const droppedPotion = gameData.potions.find(p => p.id === dropPotionId);

    if (droppedPotion) {
        const max = droppedPotion.inventory_max;
        const currentCount = player.inventory[droppedPotion.id] || 0;
        
        if (currentCount < max) {
             player.inventory[droppedPotion.id] = currentCount + 1;
             updatePotionButton();
             droppedItemNames.push(droppedPotion.name);
        }
    }

    if (droppedItemNames.length > 0) {
        drawMessage(`ITEM GET: ${droppedItemNames.join(' & ')}!`);
    }
    
    updateGolemButtonVisibility(); 
}

/**
 * 次のレベルに進む、またはゲームクリア処理
 */
function nextRebel() {
    isMobPhase = false;
    isBossPhase = false;
    
    // ボス討伐報酬のコイン
    player.coins += 10 + currentRebel * 5; 
    
    // 最高クリアレベルを更新 (今回クリアしたレベル)
    player.highestClearLevel = Math.max(player.highestClearLevel, currentRebel);
    
    currentRebel++; // 次のレベルへ
    
    if (currentRebel > MAX_REBEL) {
         isGameOver = true; 
         drawMessage(`GAME MASTER CLEARED!`);
         setTimeout(goToHome, 3000);
    } else {
         drawMessage(`REBEL ${currentRebel - 1} CLEARED! GOING HOME...`);
         setTimeout(goToHome, 3000); // ボス撃破後、ホーム画面へ遷移
    }
    
    // ホームに戻るためにリセットではなく、goToHome内でリセットを促す
    // UIを更新
    updateGolemButtonVisibility();
}
