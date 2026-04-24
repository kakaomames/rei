/**
 * Potman Web Edition: 10000m Mission - Final Integration
 * main.js - Gemini programming隊 
 * * 修正内容:
 * 1. マウス/タッチ操作の統合 (handleInput)
 * 2. 永久移動バグ修正 (摩擦と空気抵抗の活用)
 * 3. 10000m動的地質生成 (Chunkシステム)
 * 4. カメラ追従ロジック
 */

// --- ログ出力ユニット ---
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

// --- 定数・初期設定 ---
const WORLD_HEIGHT = 10000 * 100; // 100万px
const VIEW_WIDTH = window.innerWidth;
const VIEW_HEIGHT = window.innerHeight;
const CHUNK_SIZE = 1200;

// 物理エンジンの起動
PhysicsEngine.init('game-canvas', 1.0);

// --- プレイヤー生成 (PhysicsEngineの修正を反映) ---
// physics.js側のdefaultOptionsで frictionAir: 0.05 程度を推奨
const pot = PhysicsEngine.createDynamicCircle(VIEW_WIDTH / 2, WORLD_HEIGHT - 200, 30, { 
    render: { fillStyle: '#555' },
    frictionAir: 0.04, // 永久移動防止用の空気抵抗
    friction: 0.8,
    label: "PLAYER_POT"
});

// 鶴橋の状態管理
let hammerPos = { x: VIEW_WIDTH / 2, y: WORLD_HEIGHT - 300 };
const hammerLength = 130;

// --- 地質生成システム (Chunk.js Logic) ---
const chunks = {};

const generateChunk = (chunkY) => {
    if (chunks[chunkY]) return;
    chunks[chunkY] = true;

    const altitude = (WORLD_HEIGHT - (chunkY * CHUNK_SIZE)) / 100;
    
    // 1チャンクに12個のゴツゴツした岩を生成
    for (let i = 0; i < 12; i++) {
        const x = Math.random() * VIEW_WIDTH;
        const y = (chunkY * CHUNK_SIZE) + (Math.random() * CHUNK_SIZE);
        
        let w, h, angle, color, friction;

        if (altitude < 2000) { // 低層
            w = Math.random() * 250 + 100; h = 40;
            angle = (Math.random() - 0.5) * 0.3;
            color = '#d2b48c'; friction = 0.5;
        } else if (altitude < 7000) { // 中層
            w = Math.random() * 120 + 40; h = Math.random() * 80 + 40;
            angle = Math.random() * Math.PI;
            color = '#808080'; friction = 0.6;
        } else { // 高層 (氷山)
            w = Math.random() * 100 + 20; h = Math.random() * 200 + 50;
            angle = (Math.random() - 0.5) * 1.5;
            color = '#e0ffff'; friction = 0.02;
        }

        PhysicsEngine.createStaticRect(x, y, w, h, {
            angle: angle,
            friction: friction,
            render: { fillStyle: color }
        });
    }
};

// 初期の地面
PhysicsEngine.createStaticRect(VIEW_WIDTH / 2, WORLD_HEIGHT - 20, VIEW_WIDTH, 40, {
    render: { fillStyle: '#222' }
});

// --- 操作統合プロトコル (Mouse & Touch) ---
const canvas = PhysicsEngine.render.canvas;

const handleInput = (clientX, clientY) => {
    const rect = canvas.getBoundingClientRect();
    const x = clientX - rect.left;
    const y = clientY - rect.top;

    // ワールド座標換算
    const worldX = x + PhysicsEngine.render.bounds.min.x;
    const worldY = y + PhysicsEngine.render.bounds.min.y;

    const dx = worldX - pot.position.x;
    const dy = worldY - pot.position.y;
    const angle = Math.atan2(dy, dx);

    const newHammerX = pot.position.x + Math.cos(angle) * hammerLength;
    const newHammerY = pot.position.y + Math.sin(angle) * hammerLength;

    const moveX = newHammerX - hammerPos.x;
    const moveY = newHammerY - hammerPos.y;

    const staticBodies = Matter.Composite.allBodies(PhysicsEngine.world).filter(b => b.isStatic);
    const collisions = Matter.Query.point(staticBodies, { x: newHammerX, y: newHammerY });

    if (collisions.length > 0) {
        const forceMagnitude = 0.006; // 感度調整
        PhysicsEngine.applyForce(pot, pot.position, { 
            x: -moveX * forceMagnitude, 
            y: -moveY * forceMagnitude 
        });
    }
    hammerPos = { x: newHammerX, y: newHammerY };
};

// マウス移動
canvas.addEventListener('mousemove', (e) => {
    handleInput(e.clientX, e.clientY);
});

// タッチ移動 (スワイプ)
canvas.addEventListener('touchmove', (e) => {
    if (e.cancelable) e.preventDefault();
    const touch = e.touches[0];
    handleInput(touch.clientX, touch.clientY);
}, { passive: false });

// タッチ開始
canvas.addEventListener('touchstart', (e) => {
    if (e.cancelable) e.preventDefault();
    const touch = e.touches[0];
    handleInput(touch.clientX, touch.clientY); // 開始時に位置を同期
}, { passive: false });

// --- 更新・描画ループ ---
Matter.Events.on(PhysicsEngine.engine, 'beforeUpdate', () => {
    // カメラ追従
    const lookAtY = pot.position.y - VIEW_HEIGHT * 0.6;
    Matter.Render.lookAt(PhysicsEngine.render, {
        min: { x: 0, y: lookAtY },
        max: { x: VIEW_WIDTH, y: lookAtY + VIEW_HEIGHT }
    });

    // チャンク動的生成
    const currentChunkY = Math.floor(pot.position.y / CHUNK_SIZE);
    generateChunk(currentChunkY);
    generateChunk(currentChunkY - 1);
});

// 鶴橋の描画
Matter.Events.on(PhysicsEngine.render, 'afterRender', () => {
    const ctx = PhysicsEngine.render.context;
    const offsetX = PhysicsEngine.render.bounds.min.x;
    const offsetY = PhysicsEngine.render.bounds.min.y;

    ctx.beginPath();
    ctx.lineWidth = 6;
    ctx.strokeStyle = '#8b4513';
    ctx.moveTo(pot.position.x - offsetX, pot.position.y - offsetY);
    ctx.lineTo(hammerPos.x - offsetX, hammerPos.y - offsetY);
    ctx.stroke();

    ctx.fillStyle = '#aaa';
    ctx.save();
    ctx.translate(hammerPos.x - offsetX, hammerPos.y - offsetY);
    ctx.rotate(Math.atan2(hammerPos.y - pot.position.y, hammerPos.x - pot.position.x));
    ctx.fillRect(-10, -15, 20, 30);
    ctx.restore();
});

missionLog("ACTION", "全システム統合完了。10000mへの挑戦を開始せよ！⚒️");
