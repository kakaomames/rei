// ====================================================
// 🎮 グローバル・ゲーム状態管理ファイル (state.js)
// ====================================================

// --- キャンバスと描画コンテキスト ---
const canvas = document.getElementById('gameCanvas');
const ctx = canvas.getContext('2d');
const WIDTH = canvas.width;
const HEIGHT = canvas.height;

// --- ゲーム状態 ---
let isGameLoopRunning = false; // ゲームループが動作中か
let isGameOver = false; // ゲームオーバー状態か
let isGameClear = false; // 全レベルクリア状態か

// --- スコアと通貨 ---
let score = 0;
let coins = 0; // プレイヤーの所持金 (player.coinsと連携するが、一時的なグローバル変数)

// --- レベル進行 ---
const MAX_REBEL = 5; // 総レベル数 (仮)
let currentRebel = 1; // 現在の挑戦レベル

// --- ゲームデータ (JSONロード後に入る) ---
let gameData = {
    settings: [],
    potions: [],
    // 他のデータ（mob, boss, defenseなど）は game.js で処理される想定
};

// --- エンティティ（他のファイルで参照・更新される） ---
let player = null; 
let bullets = [];
let enemies = []; // enemy.js と連携
let boss = null;
let golem = null;

// --- 防御ステータス (Store.jsやgame.jsから参照される) ---
const DEFENSE_STATS = new Map([
    [1, { name: "木", reduction: 0.1, cost: 0 }],
    [2, { name: "鉄", reduction: 0.2, cost: 50 }],
    [3, { name: "ダイヤ", reduction: 0.4, cost: 200 }],
]);

// --- 時間帯/天候 (もしあれば) ---
let isDay = true;
let timeOfDayTimer = 0;
const TIME_CYCLE_DURATION = 1800; // 30FPSで60秒 (昼夜サイクル)

// --- DOM要素 ---
// Controls
const controlButtons = {
    up: document.getElementById('upButton'),
    down: document.getElementById('downButton'),
    left: document.getElementById('leftButton'),
    right: document.getElementById('rightButton'),
    fire: document.getElementById('fireButton'),
    shield: document.getElementById('shieldButton'),
    potion: document.getElementById('potionButton'),
    magic: document.getElementById('magicButton'), // ゴーレム召喚ボタンなど
};
