// game.jsで定義されたグローバル変数を使用:
// ctx, WIDTH, HEIGHT, player, score, enemies, boss, isBossPhase, 
// isDay, currentRebel, MAX_REBEL, isGameLoopRunning, 
// DEFENSE_STATS, golem, timeOfDayTimer, TIME_CYCLE_DURATION, gameData,
// settings (settings.js), debugLog (settings.js), 

// --- プレイヤー描画 ---
function drawPlayer() {
    // 凍結デバフ中は水色に点滅
    if (player.debuff.frozen > 0 && Math.floor(Date.now() / 100) % 2 === 0) {
        ctx.fillStyle = 'lightblue';
    } else {
        ctx.fillStyle = player.color;
    }
    
    // プレイヤーの本体を描画
    ctx.fillRect(player.x, player.y, player.width, player.height);
    
    // シールドの描画
    if (player.isShielded) {
        ctx.strokeStyle = 'gold';
        ctx.lineWidth = 4;
        ctx.beginPath();
        ctx.arc(player.x + player.width / 2, player.y + player.height / 2, player.width * 0.7, 0, Math.PI * 2);
        ctx.stroke();
    }
    
    // HPバーの描画
    const hpBarWidth = player.width * 1.5;
    const hpBarHeight = 5;
    const hpX = player.x + player.width / 2 - hpBarWidth / 2;
    const hpY = player.y - 10;
    
    // HPバーの背景
    ctx.fillStyle = 'gray';
    ctx.fillRect(hpX, hpY, hpBarWidth, hpBarHeight);
    
    // HPの減少に応じて色を変化
    const hpRatio = player.hp / player.maxHp;
    if (hpRatio > 0.6) {
        ctx.fillStyle = 'lime';
    } else if (hpRatio > 0.3) {
        ctx.fillStyle = 'yellow';
    } else {
        ctx.fillStyle = 'red';
    }
    
    // 実際のHPの描画
    ctx.fillRect(hpX, hpY, hpBarWidth * hpRatio, hpBarHeight);

    // デバフの描画
    const debuffIcons = [];
    if (player.debuff.burning > 0) debuffIcons.push({ color: 'red', icon: '🔥' });
    if (player.debuff.poison > 0) debuffIcons.push({ color: 'green', icon: '💀' });
    if (player.debuff.frozen > 0) debuffIcons.push({ color: 'blue', icon: '❄️' });
    
    let iconX = player.x + player.width / 2 - (debuffIcons.length * 15) / 2;
    debuffIcons.forEach(debuff => {
        ctx.font = '15px Arial';
        ctx.textAlign = 'center';
        ctx.fillText(debuff.icon, iconX, player.y + player.height + 20);
        iconX += 15;
    });

}

// --- 弾丸描画 ---
function drawBullets() {
    bullets.forEach(bullet => {
        ctx.fillStyle = bullet.color;
        ctx.fillRect(bullet.x, bullet.y, bullet.width, bullet.height);
    });
}

// --- 敵 Mob描画 ---
function drawEnemies() {
    enemies.forEach(enemy => {
        // 敵の本体
        ctx.fillStyle = enemy.color;
        ctx.fillRect(enemy.x, enemy.y, enemy.width, enemy.height);
        
        // HPバー
        const hpBarWidth = enemy.width * 1.2;
        const hpBarHeight = 3;
        const hpX = enemy.x + enemy.width / 2 - hpBarWidth / 2;
        const hpY = enemy.y - 5;
        
        ctx.fillStyle = 'gray';
        ctx.fillRect(hpX, hpY, hpBarWidth, hpBarHeight);
        
        const hpRatio = enemy.hp / enemy.maxHp;
        ctx.fillStyle = hpRatio > 0.5 ? 'lime' : 'orange';
        ctx.fillRect(hpX, hpY, hpBarWidth * hpRatio, hpBarHeight);
    });
}

// --- ボス描画 ---
function drawBoss() {
    if (!boss) return;
    
    // 背景の描画 (ZOMBIE/HUSK戦専用)
    if (boss.trait === "zombie_time" || boss.trait === "no_sun_damage") {
        // 時間帯に応じた背景
        const dayColor = '#4e7b8a'; // 薄い青 (昼)
        const nightColor = '#1f2430'; // 濃い青/黒 (夜)
        const currentProgress = timeOfDayTimer / TIME_CYCLE_DURATION;
        
        let r1, g1, b1, r2, g2, b2;
        
        // 昼と夜の色をRGBで取得
        const hexToRgb = hex => {
            const bigint = parseInt(hex.slice(1), 16);
            return [(bigint >> 16) & 255, (bigint >> 8) & 255, bigint & 255];
        };
        [r1, g1, b1] = hexToRgb(dayColor);
        [r2, g2, b2] = hexToRgb(nightColor);

        // 昼夜の切り替わりアニメーション
        let ratio = isDay ? currentProgress : (1 - currentProgress);
        if (boss.trait === "zombie_time") {
             // Zombie戦では昼から夜へ
             ratio = isDay ? (1 - currentProgress) : currentProgress;
        } else if (boss.trait === "no_sun_damage") {
             // Husk戦では夜から昼へ
             ratio = isDay ? currentProgress : (1 - currentProgress);
        }
        
        // 色を補間
        const r = Math.round(r1 * ratio + r2 * (1 - ratio));
        const g = Math.round(g1 * ratio + g2 * (1 - ratio));
        const b = Math.round(b1 * ratio + b2 * (1 - ratio));

        ctx.fillStyle = `rgb(${r},${g},${b})`;
        ctx.fillRect(0, 0, WIDTH, HEIGHT);
    }
    
    // ボスの本体を描画
    ctx.fillStyle = boss.color;
    ctx.fillRect(boss.x, boss.y, boss.width, boss.height);
    
    // ボスのHPバー
    const hpBarWidth = WIDTH * 0.8;
    const hpBarHeight = 10;
    const hpX = WIDTH * 0.1;
    const hpY = 20;
    
    // HPバーの背景
    ctx.fillStyle = 'darkred';
    ctx.fillRect(hpX, hpY, hpBarWidth, hpBarHeight);
    
    // 実際のHPの描画
    const hpRatio = boss.hp / boss.maxHp;
    ctx.fillStyle = hpRatio > 0.5 ? 'red' : 'orange';
    ctx.fillRect(hpX, hpY, hpBarWidth * hpRatio, hpBarHeight);

    // HPテキスト
    ctx.fillStyle = 'white';
    ctx.font = '16px Arial';
    ctx.textAlign = 'center';
    const bossData = Array.from(gameData.bosses.values()).find(b => b.id === boss.id);
    const bossName = bossData ? bossData.name : 'BOSS';
    ctx.fillText(`${bossName} HP: ${Math.max(0, boss.hp)} / ${boss.maxHp} (P${boss.phase})`, WIDTH / 2, hpY - 5);
}

// --- ゴーレム描画 ---
function drawGolem() {
    if (!golem) return;
    
    // ゴーレムの本体を描画
    ctx.fillStyle = golem.color;
    ctx.fillRect(golem.x, golem.y, golem.width, golem.height);
    
    // HPバー (簡易版)
    const hpBarWidth = golem.width * 1.5;
    const hpBarHeight = 3;
    const hpX = golem.x + golem.width / 2 - hpBarWidth / 2;
    const hpY = golem.y - 5;
    
    ctx.fillStyle = 'gray';
    ctx.fillRect(hpX, hpY, hpBarWidth, hpBarHeight);
    
    const hpRatio = golem.hp / golem.maxHp;
    ctx.fillStyle = 'cyan';
    ctx.fillRect(hpX, hpY, hpBarWidth * hpRatio, hpBarHeight);
}

// --- スコア・UI描画 ---
function drawScore() {
    ctx.fillStyle = 'white';
    ctx.font = '18px Arial';
    ctx.textAlign = 'left';
    
    const defenseName = DEFENSE_STATS[player.defenseLevel].name;
    const reduction = DEFENSE_STATS[player.defenseLevel].reduction;
    
    let infoText = `SCORE: ${score} | COINS: ${player.coins} | REBEL ${currentRebel} / ${MAX_REBEL}`;
    
    // Mobフェーズの進行状況
    if (isMobPhase) {
        infoText += ` | KILLS: ${currentKills} / ${requiredKills}`;
    }
    
    ctx.fillText(infoText, 10, 30);
    
    // 防具情報
    ctx.fillText(`ARMOR: ${defenseName} (減:${reduction})`, 10, 50);

    // シールドクールダウン
    if (player.shieldCooldown > 0) {
        const cooldownSec = (player.shieldCooldown / 60).toFixed(1);
        ctx.fillStyle = 'red';
        ctx.fillText(`SHIELD CD: ${cooldownSec}s`, 10, 70);
    }
    
    // ボタンのテキスト更新 (player.jsにも依存)
    document.getElementById('shieldButton').textContent = player.isShielded ? 'SHIELDING' : (player.shieldCooldown > 0 ? `CD (${Math.ceil(player.shieldCooldown/60)}s)` : 'SHIELD');
    updatePotionButton();
}

// ポーションボタンのUI更新
function updatePotionButton() {
    // 回復ポーションのIDは 'potion_heal' と仮定
    const healPotion = gameData.potions.find(p => p.id === 'potion_heal');
    if (healPotion) {
         const count = player.inventory[healPotion.id] || 0;
         const max = healPotion.inventory_max || 0;
         potionButton.textContent = `POTION (${count}/${max})`;
    } else {
         potionButton.textContent = `POTION (0)`;
    }
}

// ゴーレムボタンのUI更新
function updateGolemButtonVisibility() {
    // プレイヤーのアンロックレベルに基づいてゴーレムボタンを表示/非表示
    if (player.unlockedGolemLevel > 1) {
        magicButton.style.display = 'block';
    } else {
        magicButton.style.display = 'none';
    }
    // ボス戦中のみゴーレム召喚ボタンを表示
    if (isBossPhase) {
        golemButton.style.display = 'block';
    } else {
        golemButton.style.display = 'none';
    }
}

// --- メッセージオーバーレイ描画 ---
let currentMessage = null;
let messageTimer = 0;

function drawMessage(msg, durationFrames = 120) {
    currentMessage = msg;
    messageTimer = durationFrames;
}

function drawMessageOverlay() {
    if (messageTimer > 0 && currentMessage) {
        ctx.fillStyle = 'rgba(0, 0, 0, 0.7)';
        ctx.fillRect(0, HEIGHT / 3 - 30, WIDTH, 60);
        
        ctx.fillStyle = 'white';
        ctx.font = '30px Arial';
        ctx.textAlign = 'center';
        ctx.fillText(currentMessage, WIDTH / 2, HEIGHT / 3 + 10);
        
        messageTimer--;
    } else {
        currentMessage = null;
    }
}

// --- ゲームオーバー画面の描画 (簡易) ---
function drawGameOver() {
    ctx.fillStyle = 'rgba(0, 0, 0, 0.9)';
    ctx.fillRect(0, 0, WIDTH, HEIGHT);
    
    ctx.fillStyle = 'red';
    ctx.font = '40px Arial';
    ctx.textAlign = 'center';
    ctx.fillText("GAME OVER 💀", WIDTH / 2, HEIGHT / 2 - 20);
    
    ctx.fillStyle = 'white';
    ctx.font = '24px Arial';
    ctx.fillText(`SCORE: ${score}`, WIDTH / 2, HEIGHT / 2 + 20);
    ctx.fillText(`COINS: ${player.coins}`, WIDTH / 2, HEIGHT / 2 + 50);

    // ホームに戻るボタンはDOMで表示することを想定
}

/**
 * ゲームクリア画面の描画
 */
function drawGameClear() {
    ctx.fillStyle = 'rgba(0, 0, 0, 0.9)';
    ctx.fillRect(0, 0, WIDTH, HEIGHT);
    
    ctx.fillStyle = 'gold';
    ctx.font = '40px Arial';
    ctx.textAlign = 'center';
    ctx.fillText("ALL REBELS CLEARED! 🏆", WIDTH / 2, HEIGHT / 2 - 20);
    
    ctx.fillStyle = 'white';
    ctx.font = '24px Arial';
    ctx.fillText(`FINAL SCORE: ${score}`, WIDTH / 2, HEIGHT / 2 + 20);
    ctx.fillText(`TOTAL COINS: ${player.coins}`, WIDTH / 2, HEIGHT / 2 + 50);
}

// ----------------------------------------------------
// 🐞 デバッグログオーバーレイの描画
// ----------------------------------------------------
function drawDebugLogOverlay() {
    // settings.jsで定義されたsettingsとdebugLogを使用
    if (!window.settings || !window.settings.show_log) return; 

    // 背景
    ctx.fillStyle = 'rgba(0, 0, 0, 0.8)';
    ctx.fillRect(0, HEIGHT - 150, WIDTH, 150); 

    // ヘッダー
    ctx.fillStyle = 'red';
    ctx.font = '12px Arial';
    ctx.textAlign = 'left';
    ctx.fillText("DEBUG LOG (Creator Mode)", 10, HEIGHT - 135);

    // ログを表示
    ctx.fillStyle = 'white';
    window.debugLog.forEach((log, index) => {
        const y = HEIGHT - 120 + (index * 15);
        ctx.fillText(log, 10, y);
    });
}
