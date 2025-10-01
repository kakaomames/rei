// game.jsで定義されたグローバル変数を使用:
// ctx, WIDTH, HEIGHT, enemies, boss, isBossPhase, currentRebel, level, 
// BOSS_TRIGGER_LEVEL, enemySpawnTimer, INITIAL_ENEMY_SPAWN_INTERVAL, 
// INITIAL_ENEMY_BASE_SPEED, requiredKills, currentKills, isMobPhase, 
// timeOfDayTimer, TIME_CYCLE_DURATION, isDay, gameData, player, resetGame, goToHome, 
// ENEMY_IDS, MAX_REBEL, applyDebuff (player.js), calculateDamage (player.js)

// --- Mobフェーズの初期化 ---
function initMobPhase() {
    isMobPhase = true;
    isBossPhase = false;
    enemies.length = 0;
    boss = null;
    
    // Mobフェーズでは、Rebelレベルに応じて必要な討伐数を設定
    requiredKills = currentRebel * 10; 
    currentKills = 0;
    
    // レベルに合った敵のIDを取得 (今回はレベル1のみ)
    const mobId = ENEMY_IDS[0]; // 現状 slime_mob のみ
    const mobData = gameData.enemies.get(mobId);
    if (mobData) {
        console.log(`REBEL ${currentRebel} Mob Phase: ${mobData.name}を${requiredKills}体討伐`);
    } else {
        console.error("Mobデータが見つかりません:", mobId);
    }
}

// --- ボスフェーズの初期化 ---
function initBossPhase() {
    isBossPhase = true;
    isMobPhase = false;
    enemies.length = 0;
    
    // currentRebel に対応するボスを探す
    const bossData = Array.from(gameData.bosses.values()).find(b => b.rebel === currentRebel);

    if (bossData) {
        boss = {
            id: bossData.id,
            x: WIDTH / 2 - 50,
            y: 50,
            width: 100,
            height: 100,
            color: bossData.color,
            hp: bossData.base_hp,
            maxHp: bossData.base_hp,
            speed: bossData.stats.speed,
            attackInterval: bossData.stats.attack_interval_frames,
            attackTimer: 0,
            bulletSpeed: bossData.stats.bullet_speed,
            trait: bossData.trait,
            traitData: bossData.trait_data,
            // 固有のボス状態
            phase: 1, 
            teleportTimer: 0,
            spawningTimer: 0 
        };
        console.log(`REBEL ${currentRebel} Boss Phase: ${bossData.name}出現!`);
        document.getElementById('golemButton').classList.remove('hidden'); // ゴーレムボタンを表示
    } else {
        // ボスデータが見つからない場合はレベルクリア
        console.warn(`REBEL ${currentRebel}のボスデータが見つかりません。`);
        levelClear(); // レベルクリア
    }
}

// --- レベルの進行チェック (gameLoop内で毎フレーム実行) ---
function checkLevelUp() {
    if (isGameOver) return;

    // Mobフェーズの開始
    if (!isMobPhase && !isBossPhase) {
        initMobPhase();
        return;
    }

    // Mob討伐完了
    if (isMobPhase && currentKills >= requiredKills) {
        initBossPhase();
        return;
    }
    
    // ボス討伐完了
    if (isBossPhase && boss === null) {
        levelClear();
        return;
    }

    // Mobフェーズ中の敵出現処理
    if (isMobPhase) {
        spawnEnemy();
    }
}

// --- 敵の出現 (Mobフェーズ時のみ) ---
function spawnEnemy() {
    if (!isMobPhase) return;
    
    enemySpawnTimer++;
    
    // レベルが上がるほど出現頻度が上がる（最低10フレーム間隔）
    const spawnInterval = Math.max(10, INITIAL_ENEMY_SPAWN_INTERVAL - currentRebel * 10);
    
    if (enemySpawnTimer >= spawnInterval) {
        enemySpawnTimer = 0;
        
        // 現状 slime_mob のみ
        const mobId = ENEMY_IDS[0]; 
        const mobData = gameData.enemies.get(mobId);

        if (!mobData) return;
        
        const enemy = {
            x: Math.random() * (WIDTH - mobData.width),
            y: -mobData.height,
            width: mobData.width,
            height: mobData.height,
            color: mobData.color,
            hp: mobData.hp,
            maxHp: mobData.maxHp,
            speed: INITIAL_ENEMY_BASE_SPEED * (1 + currentRebel * 0.2), // レベルごとに加速
            score: mobData.score,
            coin_drop: mobData.coin_drop,
            type: mobId,
            attackInterval: 120 + Math.random() * 60, // 2-3秒に1回
            attackTimer: 0
        };
        enemies.push(enemy);
    }
}

// --- 敵の動作更新 ---
function updateEnemies() {
    for (let i = enemies.length - 1; i >= 0; i--) {
        const enemy = enemies[i];
        enemy.y += enemy.speed;
        
        // 画面外に出た敵を削除
        if (enemy.y > HEIGHT) {
            enemies.splice(i, 1);
            continue;
        }

        // 敵の攻撃ロジック (敵がプレイヤーのY座標よりも下に来たら攻撃)
        enemy.attackTimer++;
        if (enemy.attackTimer >= enemy.attackInterval) {
            if (enemy.y > player.y) {
                 // 敵の弾はここでは実装せず、接触のみとする
            } else {
                 // 弾発射 (敵の弾はbulletsとは別の配列に入れるのが望ましいが、今回は簡略化)
                 // ボスの攻撃ロジックを参照
            }
            enemy.attackTimer = 0;
        }
    }
}

// --- ボスの動作更新 ---
function updateBossAction() {
    if (!boss) return;

    // 基本的な移動ロジック（左右移動）
    if (boss.x + boss.width > WIDTH || boss.x < 0) {
        boss.speed *= -1; // 反転
    }
    boss.x += boss.speed;

    // 攻撃ロジック
    boss.attackTimer++;
    if (boss.attackTimer >= boss.attackInterval) {
        
        // Boss Trait: slime (通常弾)
        if (boss.trait === "slime") {
            // 単発弾
            bullets.push(createBossBullet(boss.x + boss.width / 2, boss.y + boss.height, boss.color, boss.bulletSpeed, 5));
            
        // Boss Trait: endermite (テレポート)
        } else if (boss.trait === "endermite") {
            boss.teleportTimer++;
            if (boss.teleportTimer >= boss.traitData.teleport_interval_frames) {
                // ランダムな位置にテレポート
                boss.x = Math.random() * (WIDTH - boss.width);
                boss.y = Math.random() * (HEIGHT * 0.4); 
                boss.teleportTimer = 0;
                drawMessage("Endermite Teleported!");
            }
            // テレポート後、全方位に弾発射
            for (let i = 0; i < 8; i++) {
                const angle = (i / 8) * 2 * Math.PI;
                bullets.push(createBossBullet(
                    boss.x + boss.width / 2, 
                    boss.y + boss.height / 2, 
                    boss.color, 
                    boss.bulletSpeed, 
                    5,
                    { vx: Math.cos(angle) * boss.bulletSpeed, vy: Math.sin(angle) * boss.bulletSpeed }
                ));
            }

        // Boss Trait: silverfish (雑魚召喚)
        } else if (boss.trait === "silverfish") {
            boss.spawningTimer++;
            if (boss.spawningTimer >= boss.traitData.spawn_interval_frames) {
                const mobId = ENEMY_IDS[0]; 
                const mobData = gameData.enemies.get(mobId);
                if (mobData) {
                    enemies.push(createSilverfishMob(mobData, boss));
                }
                boss.spawningTimer = 0;
            }
            
        // Boss Trait: zombie_time / husk (時間帯変化・サンダメージ無効)
        } else if (boss.trait === "zombie_time" || boss.trait === "no_sun_damage") {
             if (boss.attackTimer % 30 === 0) {
                 // プレイヤーに向かって弾
                 const dx = player.x + player.width / 2 - (boss.x + boss.width / 2);
                 const dy = player.y + player.height / 2 - (boss.y + boss.height / 2);
                 const angle = Math.atan2(dy, dx);
                 bullets.push(createBossBullet(
                    boss.x + boss.width / 2, 
                    boss.y + boss.height, 
                    boss.color, 
                    boss.bulletSpeed, 
                    7,
                    { vx: Math.cos(angle) * boss.bulletSpeed, vy: Math.sin(angle) * boss.bulletSpeed }
                 ));
             }
        }

        boss.attackTimer = 0;
    }
    
    // ボスのHPが半分を切ったらフェーズ2へ
    if (boss.hp < boss.maxHp / 2 && boss.phase === 1) {
        boss.phase = 2;
        boss.attackInterval = Math.max(30, Math.floor(boss.attackInterval * 0.6)); // 攻撃頻度アップ
        drawMessage("BOSS PHASE 2 ACTIVATED!"); 
    }
    
    // ボスが死亡した場合
    if (boss.hp <= 0) {
        score += boss.traitData.score_reward || 1000;
        player.coins += boss.traitData.coin_reward || 100;
        boss = null;
        document.getElementById('golemButton').classList.add('hidden');
    }
}

// --- ボス弾の作成ヘルパー関数 ---
function createBossBullet(x, y, color, speed, size, vector = { vx: 0, vy: 0 }) {
    if (vector.vx === 0 && vector.vy === 0) {
        // デフォルトは下向き
        vector.vy = speed;
    }
    return {
        x: x - size / 2, y: y, width: size, height: size, 
        color: color, isBoss: true, 
        vx: vector.vx, vy: vector.vy,
        damage: 10 + currentRebel * 2 // レベルに応じたダメージ
    };
}

// --- Silverfish Mobの作成ヘルパー関数 ---
function createSilverfishMob(mobData, boss) {
    const enemy = {
        x: boss.x + boss.width / 2 - mobData.width / 2,
        y: boss.y + boss.height,
        width: mobData.width,
        height: mobData.height,
        color: mobData.color,
        hp: mobData.hp * 0.5, // HP半減
        maxHp: mobData.maxHp * 0.5, 
        speed: 3 + currentRebel * 0.5, 
        score: 0, // 雑魚召喚によるスコアなし
        coin_drop: 0,
        type: mobData.id,
        attackInterval: 10000,
        attackTimer: 0
    };
    return enemy;
}


// --- レベルクリア処理 ---
function levelClear() {
    player.highestClearLevel = Math.max(player.highestClearLevel, currentRebel);
    
    if (currentRebel < MAX_REBEL) {
        alert(`REBEL ${currentRebel}クリア！🎉 報酬: 💰 ${player.coins}コイン`);
        
    } else {
        alert("全レベルクリア！おめでとうございます！🏆");
    }
    
    // ホーム画面に戻る
    resetGame();
    goToHome();
}


// --- 時間帯の更新 (ZOMBIE/HUSK戦に必要) ---
function updateTimeOfDay() {
    if (!isBossPhase || (boss.trait !== "zombie_time" && boss.trait !== "no_sun_damage")) {
        // 通常の戦闘では時間帯変化なし
        isDay = true; 
        timeOfDayTimer = 0;
        return;
    }

    timeOfDayTimer++;
    
    if (timeOfDayTimer >= TIME_CYCLE_DURATION) {
        isDay = !isDay;
        timeOfDayTimer = 0;
        drawMessage(isDay ? "DAYTIME ☀️" : "NIGHTTIME 🌙");
    }

    // プレイヤーへのサンダメージ処理
    if (isBossPhase && boss.trait === "zombie_time" && !player.isShielded) {
        if (isDay && player.debuff.frozen <= 0) { // 凍結中はサンダメージを受けないという設定
            if (timeOfDayTimer % 60 === 0) {
                const sunDamage = calculateDamage(5); // 5ダメージ
                player.hp -= sunDamage;
                if (player.hp <= 0) {
                    isGameOver = true;
                    alert(`ゲームオーバー！日中の太陽による死亡 スコア: ${score}`);
                    resetGame(); // game.js
                    goToHome(); // game.js
                }
            }
        }
    }
}
