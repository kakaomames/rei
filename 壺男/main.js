/**
 * Potman Web Edition: 10000m Mission - Hammer Collision Fix
 * main.js - Gemini programming隊 
 */

const missionLog = (type, message) => {
    console.log(`[${type}] ${message}`);
    const consoleEl = document.getElementById('mission-console');
    if (consoleEl) {
        const entry = document.createElement('div');
        entry.className = 'log-entry';
        entry.innerText = `[${type}] ${message}`;
        consoleEl.prepend(entry);
    }
};

const WORLD_HEIGHT = 10000 * 100;
const VIEW_WIDTH = window.innerWidth;
const VIEW_HEIGHT = window.innerHeight;
const CHUNK_SIZE = 1200;

PhysicsEngine.init('game-canvas', 1.0);

// --- プレイヤー生成 ---
const pot = PhysicsEngine.createDynamicCircle(VIEW_WIDTH / 2, WORLD_HEIGHT - 200, 30, { 
    render: { fillStyle: '#555' },
    frictionAir: 0.04, 
    friction: 0.8,
    label: "PLAYER_POT"
});

// 【新設】鶴橋の先端センサー（物理体として作成）
const hammerHead = PhysicsEngine.createDynamicCircle(VIEW_WIDTH / 2, WORLD_HEIGHT - 300, 15, {
    isSensor: true, // 他の物体を弾き飛ばさないが、衝突は検知する
    render: { fillStyle: '#aaa' },
    label: "HAMMER_HEAD"
});

const hammerLength = 130;
const chunks = {};

// --- 地質生成 ---
const generateChunk = (chunkY) => {
    if (chunks[chunkY]) return;
    chunks[chunkY] = true;
    const altitude = (WORLD_HEIGHT - (chunkY * CHUNK_SIZE)) / 100;
    const spawnRange = VIEW_WIDTH * 3;
    const offsetLeft = -VIEW_WIDTH;

    for (let i = 0; i < 20; i++) {
        const x = Math.random() * spawnRange + offsetLeft;
        const y = (chunkY * CHUNK_SIZE) + (Math.random() * CHUNK_SIZE);
        let w, h, angle, color, friction;
        if (altitude < 2000) { w = 200; h = 40; angle = (Math.random()-0.5)*0.3; color = '#d2b48c'; friction = 0.5; }
        else if (altitude < 7000) { w = 100; h = 60; angle = Math.random()*Math.PI; color = '#808080'; friction = 0.6; }
        else { w = 50; h = 150; angle = (Math.random()-0.5)*1.5; color = '#e0ffff'; friction = 0.02; }

        PhysicsEngine.createStaticRect(x, y, w, h, { angle: angle, friction: friction, render: { fillStyle: color }, label: "ROCK" });
    }
};

PhysicsEngine.createStaticRect(VIEW_WIDTH / 2, WORLD_HEIGHT - 20, VIEW_WIDTH * 10, 40, { render: { fillStyle: '#222' }, label: "GROUND" });

// --- 操作統合プロトコル ---
const canvas = PhysicsEngine.render.canvas;

const handleInput = (clientX, clientY) => {
    const rect = canvas.getBoundingClientRect();
    const x = clientX - rect.left + PhysicsEngine.render.bounds.min.x;
    const y = clientY - rect.top + PhysicsEngine.render.bounds.min.y;

    const dx = x - pot.position.x;
    const dy = y - pot.position.y;
    const angle = Math.atan2(dy, dx);

    // 鶴橋の目標座標
    const targetX = pot.position.x + Math.cos(angle) * hammerLength;
    const targetY = pot.position.y + Math.sin(angle) * hammerLength;

    // 前回の位置からの移動量（反動計算用）
    const moveX = targetX - hammerHead.position.x;
    const moveY = targetY - hammerHead.position.y;

    // センサー（hammerHead）を強制移動
    Matter.Body.setPosition(hammerHead, { x: targetX, y: targetY });

    // 【重要】センサーが静止物体と衝突しているかチェック
    const staticBodies = Matter.Composite.allBodies(PhysicsEngine.world).filter(b => b.isStatic);
    const collisions = Matter.Query.collides(hammerHead, staticBodies);

    if (collisions.length > 0) {
        // 当たっている場合、移動量の逆方向に力を加える
        const forceMagnitude = 0.008; 
        PhysicsEngine.applyForce(pot, pot.position, { 
            x: -moveX * forceMagnitude, 
            y: -moveY * forceMagnitude 
        });
    }
};

canvas.addEventListener('mousemove', (e) => handleInput(e.clientX, e.clientY));
canvas.addEventListener('touchmove', (e) => { if (e.cancelable) e.preventDefault(); handleInput(e.touches[0].clientX, e.touches[0].clientY); }, { passive: false });
canvas.addEventListener('touchstart', (e) => { if (e.cancelable) e.preventDefault(); handleInput(e.touches[0].clientX, e.touches[0].clientY); }, { passive: false });

// --- 更新・描画ループ ---
Matter.Events.on(PhysicsEngine.engine, 'beforeUpdate', () => {
    const lookAtX = pot.position.x - VIEW_WIDTH / 2;
    const lookAtY = pot.position.y - VIEW_HEIGHT * 0.6;
    Matter.Render.lookAt(PhysicsEngine.render, {
        min: { x: lookAtX, y: lookAtY },
        max: { x: lookAtX + VIEW_WIDTH, y: lookAtY + VIEW_HEIGHT }
    });

    const currentChunkY = Math.floor(pot.position.y / CHUNK_SIZE);
    generateChunk(currentChunkY);
    generateChunk(currentChunkY - 1);
});

Matter.Events.on(PhysicsEngine.render, 'afterRender', () => {
    const ctx = PhysicsEngine.render.context;
    const offsetX = PhysicsEngine.render.bounds.min.x;
    const offsetY = PhysicsEngine.render.bounds.min.y;

    // 持ち手（線）の描画
    ctx.beginPath();
    ctx.lineWidth = 6;
    ctx.strokeStyle = '#8b4513';
    ctx.moveTo(pot.position.x - offsetX, pot.position.y - offsetY);
    ctx.lineTo(hammerHead.position.x - offsetX, hammerHead.position.y - offsetY);
    ctx.stroke();
    
    // 先端の描画は PhysicsEngine 側で自動で行われる（dynamicCircleのため）
});

missionLog("ACTION", "ガチ当たり判定センサー実装完了。岩を掴め！⚒️");
