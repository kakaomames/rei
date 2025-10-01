// game.jsで定義されたグローバル変数を使用:
// ctx, WIDTH, HEIGHT, player, bullets, enemies, boss, golem, isBossPhase, 
// score, currentRebel, isGameOver, gameData, TIME_CYCLE_DURATION, timeOfDayTimer, isDay, 
// DEFENSE_STATS, shieldButton, potionButton

// --- 描画ユーティリティ ---

/**
 * プレイヤー（自機）の描画
 */
function drawPlayer() {
    ctx.fillStyle = player.color;
    ctx.fillRect(player.x, player.y, player.width, player.height);

    // HPバーの描画
    const hpRatio = player.hp / player.maxHp;
    const hpBarWidth = player.width;
    const hpBarHeight = 5;
    ctx.fillStyle = 'red';
    ctx.fillRect(player.x, player.y - 10, hpBarWidth, hpBarHeight);
    ctx.fillStyle = 'lime';
    ctx.fillRect(player.x, player.y - 10, hpBarWidth * hpRatio, hpBarHeight);
    
    // シールド状態の描画
    if (player.isShielded) {
        ctx.strokeStyle = 'cyan';
        ctx.lineWidth = 3;
        ctx.beginPath();
        ctx.arc(player.x + player.width / 2, player.y + player.height / 2, player.width * 0.8, 0, 2 * Math.PI);
        ctx.stroke();
    }
    
    // デバフ状態の描画
    drawDebuffIndicators();
}

/**
 * デバフインジケーターの描画
 */
function drawDebuffIndicators() {
    let offset = 0;
    
    if (player.debuff.burning > 0) {
        ctx.fillStyle = 'orange';
        ctx.fillText(`🔥 ${Math.ceil(player.debuff.burning / 60)}s`, player.x + player.width + 5, player.y + 10 + offset);
        offset += 15;
    }
    if (player.debuff.poison > 0) {
        ctx.fillStyle = 'green';
        ctx.fillText(`🦠 ${Math.ceil(player.debuff.poison / 60)}s`, player.x + player.width + 5, player.y + 10 + offset);
        offset += 15;
    }
    if (player.debuff.frozen > 0) {
        ctx.fillStyle = 'blue';
        ctx.fillText(`❄️ ${Math.ceil(player.debuff.frozen / 60)}s`, player.x + player.width + 5, player.y + 10 + offset);
        offset += 15;
    }
}

/**
 * 弾の描画
 */
function drawBullets() {
    bullets.forEach(b => {
        ctx.fillStyle = b.isBoss ? b.color : bulletColor;
        ctx.fillRect(b.x, b.y, b.width, b.height);
    });
}

/**
 * 敵の描画
 */
function drawEnemies() {
    enemies.forEach(e => {
        ctx.fillStyle = e.color;
        ctx.fillRect(e.x, e.y, e.width, e.height);
        
        // MobのHPバー
        const hpRatio = e.hp / e.maxHp;
        const hpBarWidth = e.width;
        const hpBarHeight = 3;
        ctx.fillStyle = 'red';
        ctx.fillRect(e.x, e.y - 5, hpBarWidth, hpBarHeight);
        ctx.fillStyle = 'yellow';
        ctx.fillRect(e.x, e.y - 5, hpBarWidth * hpRatio, hpBarHeight);
    });
}

/**
 * ボスの描画
 */
function drawBoss() {
    if (!boss) return;

    // 時間帯による背景変化 (ZOMBIE/HUSK戦の場合のみ)
    if (boss.trait === "zombie_time" || boss.trait === "no_sun_damage") {
        const timeRatio = timeOfDayTimer / TIME_CYCLE_DURATION;
        const colorVal = Math.floor(255 * timeRatio * (isDay ? 1 : 0.5));
        const bgColor = `rgb(${colorVal}, ${colorVal}, ${colorVal})`;
        ctx.fillStyle = bgColor;
        ctx.fillRect(0, 0, WIDTH, HEIGHT);
        
        // 太陽/月の描画
        ctx.fillStyle = isDay ? 'yellow' : 'white';
        ctx.beginPath();
        ctx.arc(WIDTH - 50, 50, 20, 0, 2 * Math.PI);
        ctx.fill();
    }


    ctx.fillStyle = boss.color;
    ctx.fillRect(boss.x, boss.y, boss.width, boss.height);

    // ボスHPバーの描画 (画面上部全体)
    const hpRatio = boss.hp / boss.maxHp;
    ctx.fillStyle = 'darkred';
    ctx.fillRect(10, 10, WIDTH - 20, 15);
    ctx.fillStyle = 'crimson';
    ctx.fillRect(10, 10, (WIDTH - 20) * hpRatio, 15);
    
    ctx.fillStyle = 'white';
    ctx.font = '12px Arial';
    ctx.textAlign = 'center';
    ctx.fillText(`${boss.hp.toFixed(0)} / ${boss.maxHp.toFixed(0)}`, WIDTH / 2, 22);
    ctx.textAlign = 'left'; 
}

/**
 * ゴーレムの描画
 */
function drawGolem() {
    if (!golem) return;
    
    ctx.fillStyle = golem.color;
    ctx.fillRect(golem.x, golem.y, golem.width, golem.height);

    // タイマー表示
    ctx.fillStyle = 'white';
    ctx.font = '10px Arial';
    ctx.fillText(Math.ceil(golem.timer / 60), golem.x + golem.width / 2 - 5, golem.y - 5);
}

/**
 * スコアとレベル情報の描画
 */
function drawScore() {
    ctx.fillStyle = 'white';
    ctx.font = '16px Arial';
    ctx.textAlign = 'left';
    ctx.fillText(`SCORE: ${score}`, 10, HEIGHT - 10);
    ctx.fillText(`REBEL: ${currentRebel}`, WIDTH - 90, HEIGHT - 10);

    // HP表示
    const defenseName = DEFENSE_STATS[player.defenseLevel].name;
    const defenseReduction = DEFENSE_STATS[player.defenseLevel].reduction;
    ctx.fillText(`HP: ${player.hp.toFixed(0)} / ${player.maxHp} (${defenseName} D:${defenseReduction})`, 10, 20);

    // Mob討伐フェーズの進捗
    if (isMobPhase) {
        ctx.fillText(`MOBS: ${currentKills} / ${requiredKills}`, WIDTH / 2 - 50, 20);
    }
}

// ----------------------------------------------------
// 💻 UIコントローラーの更新
// ----------------------------------------------------

/**
 * ゴーレムボタンの表示/非表示を更新
 */
function updateGolemButtonVisibility() {
    const material = Array.from(gameData.items.values()).find(i => i.level === player.unlockedGolemLevel);
    const materialName = material ? material.name : `L${player.unlockedGolemLevel}`;
    
    golemButton.textContent = `GOLEM: ${materialName}`;
    
    if (isBossPhase && boss) {
        golemButton.classList.remove('hidden');
    } else {
        golemButton.classList.add('hidden');
    }
}

/**
 * ポーションボタンの在庫表示を更新
 */
function updatePotionButton() {
    const healPotion = gameData.potions.find(p => p.type === 'heal');
    const shieldPotion = gameData.potions.find(p => p.type === 'shield');
    
    let text = "POTION (0)";
    if (healPotion && shieldPotion) {
        const hCount = player.inventory[healPotion.id] || 0;
        const sCount = player.inventory[shieldPotion.id] || 0;
        
        // ヒーリングポーションとシールドポーションの合計を表示
        text = `POTION (${hCount + sCount})`;
    }
    
    potionButton.textContent = text;
}


// ----------------------------------------------------
// 💬 メッセージ表示
// ----------------------------------------------------

let message = "";
let messageTimer = 0;

/**
 * 画面中央に一時的なメッセージを表示
 * @param {string} msg - 表示するメッセージ
 */
function drawMessage(msg) {
    message = msg;
    messageTimer = 180; // 3秒間表示
}

/**
 * メッセージの描画
 */
function drawMessageOverlay() {
    if (messageTimer > 0) {
        ctx.fillStyle = 'rgba(0, 0, 0, 0.7)';
        ctx.fillRect(0, HEIGHT / 2 - 30, WIDTH, 60);

        ctx.fillStyle = 'yellow';
        ctx.font = '24px Arial';
        ctx.textAlign = 'center';
        ctx.fillText(message, WIDTH / 2, HEIGHT / 2 + 10);

        messageTimer--;
    }
}

/**
 * ゲームクリア画面の描画
 */
function drawGameClear() {
    ctx.fillStyle = 'rgba(0, 0, 0, 0.9)';
    ctx.fillRect(0, 0, WIDTH, HEIGHT);

    ctx.fillStyle = 'gold';
    ctx.font = '36px Arial';
    ctx.textAlign = 'center';
    ctx.fillText("✨ ALL REBELS CLEARED! ✨", WIDTH / 2, HEIGHT / 2 - 50);
    
    ctx.font = '24px Arial';
    ctx.fillText(`最終スコア: ${score}`, WIDTH / 2, HEIGHT / 2 + 10);
    ctx.fillText(`獲得コイン: 💰 ${player.coins}`, WIDTH / 2, HEIGHT / 2 + 50);

    ctx.font = '18px Arial';
    ctx.fillText("ホームに戻っています...", WIDTH / 2, HEIGHT / 2 + 120);
}
