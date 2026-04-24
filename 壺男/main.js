/**
 * Potman Web Edition: 10000m Mission - Final Tech
 * main.js - Gemini programming隊 
 */

const missionLog = (type, message) => {
    const consoleEl = document.getElementById('mission-console');
    if (consoleEl) {
        const entry = document.createElement('div');
        entry.className = 'log-entry';
        entry.innerText = `[${type}] ${message}`;
        consoleEl.prepend(entry);
    }
    console.log(`[${type}] ${message}`);
};

const WORLD_HEIGHT = 10000 * 100; 
const VIEW_WIDTH = window.innerWidth;
const VIEW_HEIGHT = window.innerHeight;
const CHUNK_SIZE = 1200;

PhysicsEngine.init('game-canvas', 1.0);

// --- プレイヤー & 鶴橋センサー ---
const pot = PhysicsEngine.createDynamicCircle(VIEW_WIDTH / 2, WORLD_HEIGHT - 200, 30, { 
    render: { fillStyle: '#555' }
});

const hammerHead = PhysicsEngine.createDynamicCircle(VIEW_WIDTH / 2, WORLD_HEIGHT - 350, 15, {
    isSensor: true,
    render: { fillStyle: '#aaa' },
    gravityScale: 0 // 鶴橋自体の重力を無視
});

const hammerLength = 140;
const chunks = {};
let isGrip = false;

// --- GRIP UI制御 ---
const gripBtn = document.getElementById('grip-btn');
const setGrip = (val) => {
    isGrip = val;
    gripBtn.classList.toggle('active', val);
};

gripBtn.addEventListener('mousedown', () => setGrip(true));
window.addEventListener('mouseup', () => setGrip(false));
gripBtn.addEventListener('touchstart', (e) => { e.preventDefault(); setGrip(true); }, {passive: false});
window.addEventListener('touchend', () => setGrip(false));

// --- 地質生成 (Chunkシステム) ---
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
        else if (altitude < 7000) { w = 120; h = 70; angle = Math.random()*Math.PI; color = '#808080'; friction = 0.6; }
        else { w = 60; h = 180; angle = (Math.random()-0.5)*1.5; color = '#e0ffff'; friction = 0.02; }

        PhysicsEngine.createStaticRect(x, y, w, h, { angle: angle, friction: friction, render: { fillStyle: color } });
    }
};

PhysicsEngine.createStaticRect(VIEW_WIDTH / 2, WORLD_HEIGHT - 20, VIEW_WIDTH * 10, 40, { render: { fillStyle: '#222' } });

// --- 入力・物理ロジック ---
const canvas = PhysicsEngine.render.canvas;

const handleInput = (clientX, clientY) => {
    const x = clientX - canvas.getBoundingClientRect().left + PhysicsEngine.render.bounds.min.x;
    const y = clientY - canvas.getBoundingClientRect().top + PhysicsEngine.render.bounds.min.y;

    const dx = x - pot.position.x;
    const dy = y - pot.position.y;
    const angle = Math.atan2(dy, dx);

    const targetX = pot.position.x + Math.cos(angle) * hammerLength;
    const targetY = pot.position.y + Math.sin(angle) * hammerLength;

    const moveX = targetX - hammerHead.position.x;
    const moveY = targetY - hammerHead.position.y;

    // 鶴橋をマウスに追従（物理速度を無視して配置）
    Matter.Body.setPosition(hammerHead, { x: targetX, y: targetY });

    if (isGrip) {
        const staticBodies = Matter.Composite.allBodies(PhysicsEngine.world).filter(b => b.isStatic);
        const collisions = Matter.Query.collides(hammerHead, staticBodies);

        if (collisions.length > 0) {
            const forceMagnitude = 0.012; 
            PhysicsEngine.applyForce(pot, pot.position, { 
                x: -moveX * forceMagnitude, 
                y: -moveY * forceMagnitude 
            });
            if(Math.abs(moveX) > 10) missionLog("PHYSICS", "Climbing...");
        }
    }
};

canvas.addEventListener('mousemove', (e) => handleInput(e.clientX, e.clientY));
canvas.addEventListener('touchmove', (e) => { 
    if (e.cancelable) e.preventDefault(); 
    handleInput(e.touches[0].clientX, e.touches[0].clientY); 
}, { passive: false });

// --- 更新ループ ---
Matter.Events.on(PhysicsEngine.engine, 'beforeUpdate', () => {
    Matter.Body.setVelocity(hammerHead, { x: 0, y: 0 }); // センサーが勝手に動かないように固定

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
    const offX = PhysicsEngine.render.bounds.min.x;
    const offY = PhysicsEngine.render.bounds.min.y;

    ctx.beginPath();
    ctx.lineWidth = 6;
    ctx.strokeStyle = isGrip ? '#00ff00' : '#8b4513'; 
    ctx.moveTo(pot.position.x - offX, pot.position.y - offY);
    ctx.lineTo(hammerHead.position.x - offX, hammerHead.position.y - offY);
    ctx.stroke();
});

missionLog("ACTION", "10000m絶壁、攻略開始！⚒️");
