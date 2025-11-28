// game.js

// ------------------------------------
// 1. 基本定数とグローバル変数の定義
// ------------------------------------
let scene, camera, renderer, controls;
const container = document.getElementById('game-container');

// アドオン管理関連の定数
const ADDON_INDEX_KEY = 'custom-addon';
const ASSET_MANAGER = {}; // 読み込まれたテクスチャやモデルを格納
const textureLoader = new THREE.TextureLoader();

// プレイヤー移動用変数
let moveForward = false;
let moveBackward = false;
let moveLeft = false;
let moveRight = false;
let velocity = new THREE.Vector3(); // プレイヤーの移動速度
let direction = new THREE.Vector3(); // 移動方向
const speed = 15.0; // 移動速度
let prevTime = performance.now(); // 毎フレームのデルタタイム計算用

// ------------------------------------
// 2. ユーティリティ関数
// ------------------------------------

/**
 * ローカルストレージからJSONデータを安全に取得する
 * @param {string} key - ローカルストレージのキー
 * @returns {object} JSONデータ (存在しない場合は空のオブジェクト)
 */
function getStorageJson(key) {
    const data = localStorage.getItem(key);
    try {
        return data ? JSON.parse(data) : {};
    } catch (e) {
        console.error(`Local Storageのキー ${key} の解析エラー`, e);
        return {};
    }
}

/**
 * Base64文字列をThree.jsのテクスチャオブジェクトに変換する
 * @param {string} base64 - Base64データURL
 * @returns {THREE.Texture}
 */
function loadTextureFromBase64(base64) {
    const texture = textureLoader.load(base64);
    // マイクラ風の見た目を再現するため、ピクセル補間設定を適用
    texture.magFilter = THREE.NearestFilter;
    texture.minFilter = THREE.NearestFilter;
    return texture;
}

// ------------------------------------
// 3. アドオンの読み込みと適用
// ------------------------------------

/**
 * ローカルストレージに保存されたカスタムアドオンを読み込む
 */
async function loadCustomAddons() {
    console.log("カスタムアドオンの読み込みを開始...");
    
    const addonIndex = getStorageJson(ADDON_INDEX_KEY);
    const activeUUIDs = Object.keys(addonIndex);

    if (activeUUIDs.length === 0) {
        console.log("アクティブなカスタムアドオンは見つかりませんでした。");
        return;
    }

    for (const uuid of activeUUIDs) {
        const packData = getStorageJson(uuid);
        
        if (Object.keys(packData).length === 0) continue;

        console.log(`パック「${addonIndex[uuid]}」のデータを解析中...`);

        for (const filePath in packData) {
            if (filePath === 'manifest') {
                ASSET_MANAGER[uuid] = ASSET_MANAGER[uuid] || {};
                ASSET_MANAGER[uuid]['manifest'] = packData[filePath];
                continue;
            }
            
            const extension = filePath.split('.').pop().toLowerCase();
            const base64Data = packData[filePath];
            
            if (!base64Data.startsWith('data:')) continue;

            if (extension === 'png' || extension === 'jpg') {
                // テクスチャ（画像ファイル）の処理
                const texture = loadTextureFromBase64(base64Data);
                ASSET_MANAGER[filePath] = texture; // ASSET_MANAGER['textures/block/dirt.png']
                
            } else if (extension === 'json') {
                // JSONファイルの処理（モデル、ブロック定義など）
                const jsonBase64 = base64Data.split(',')[1];
                try {
                    const jsonString = atob(jsonBase64); // Base64デコード
                    const jsonData = JSON.parse(jsonString);
                    ASSET_MANAGER[filePath] = jsonData;
                } catch (e) {
                    console.error(`[${filePath}] JSON解析エラー:`, e);
                }
            } 
        }
    }

    console.log("全カスタムアドオンの読み込み完了。");
}

// ------------------------------------
// 4. 初期化関数 (init)
// ------------------------------------
async function init() {
    // 🚀 アドオン読み込みを最初に行う
    await loadCustomAddons(); 

    // 🌍 シーンの作成
    scene = new THREE.Scene();
    scene.background = new THREE.Color(0x87ceeb); // 空の色

    // 💡 光源の追加
    const ambientLight = new THREE.AmbientLight(0x404040); 
    scene.add(ambientLight);
    const directionalLight = new THREE.DirectionalLight(0xffffff, 1); 
    directionalLight.position.set(1, 1, 1).normalize();
    scene.add(directionalLight);

    // 📸 カメラの作成
    camera = new THREE.PerspectiveCamera(
        75, 
        window.innerWidth / window.innerHeight, 
        0.1, 
        1000 
    );
    camera.position.set(0, 10, 0);

    // 🖼️ レンダラーの作成
    renderer = new THREE.WebGLRenderer({ antialias: true });
    renderer.setSize(window.innerWidth, window.innerHeight);
    container.appendChild(renderer.domElement);

    // 🕹️ PointerLockControlsのセットアップ
    controls = new THREE.PointerLockControls(camera, document.body);

    container.addEventListener('click', function () {
        controls.lock(); 
    });

    controls.addEventListener('lock', function() {
        console.log("Pointer Locked");
    });
    controls.addEventListener('unlock', function() {
        console.log("Pointer Unlocked");
    });

    scene.add(controls.getObject()); 

    // キーボードイベントリスナーの追加
    document.addEventListener('keydown', onKeyDown, false);
    document.addEventListener('keyup', onKeyUp, false);
    
    // ウィンドウサイズ変更時のリサイズ処理
    window.addEventListener('resize', onWindowResize, false);
    
    // 初期ワールド生成とアニメーション開始
    createVoxelWorld();
    animate();
}

// ------------------------------------
// 5. ボクセル (ブロック) の作成
// ------------------------------------
function createVoxelWorld() {
    const geometry = new THREE.BoxGeometry(1, 1, 1);
    
    // 🌳 アドオンからテクスチャを取得、なければデフォルトの緑色
    const DIRT_PATH = 'textures/block/dirt.png'; 
    let material;
    
    if (ASSET_MANAGER[DIRT_PATH]) {
        const dirtTexture = ASSET_MANAGER[DIRT_PATH];
        material = new THREE.MeshLambertMaterial({ map: dirtTexture });
        console.log("カスタムテクスチャ (Dirt) を適用しました。");
    } else {
        material = new THREE.MeshLambertMaterial({ color: 0x5aa743 });
        console.log("カスタムテクスチャが見つかりません。デフォルトの緑色を使用します。");
    }

    // 地面を生成 (11x11の範囲)
    for (let x = -5; x <= 5; x++) {
        for (let z = -5; z <= 5; z++) {
            const block = new THREE.Mesh(geometry, material);
            block.position.set(x, 0, z); // Y=0 の地面に配置
            scene.add(block);
        }
    }
}

// ------------------------------------
// 6. イベントハンドラ (キー入力とリサイズ)
// ------------------------------------
function onKeyDown(event) {
    if (!controls.isLocked) return;
    
    switch (event.code) {
        case 'KeyW':
            moveForward = true;
            break;
        case 'KeyA':
            moveLeft = true;
            break;
        case 'KeyS':
            moveBackward = true;
            break;
        case 'KeyD':
            moveRight = true;
            break;
    }
}

function onKeyUp(event) {
    switch (event.code) {
        case 'KeyW':
            moveForward = false;
            break;
        case 'KeyA':
            moveLeft = false;
            break;
        case 'KeyS':
            moveBackward = false;
            break;
        case 'KeyD':
            moveRight = false;
            break;
    }
}

function onWindowResize() {
    camera.aspect = window.innerWidth / window.innerHeight;
    camera.updateProjectionMatrix(); 
    renderer.setSize(window.innerWidth, window.innerHeight); 
}

// ------------------------------------
// 7. ループ処理 (animate)
// ------------------------------------
function animate() {
    requestAnimationFrame(animate); 

    const time = performance.now();
    const delta = (time - prevTime) / 1000; 

    if (controls.isLocked === true) {

        // 減速処理
        velocity.x -= velocity.x * 10.0 * delta;
        velocity.z -= velocity.z * 10.0 * delta;

        // 移動方向の計算
        direction.z = Number(moveForward) - Number(moveBackward);
        direction.x = Number(moveRight) - Number(moveLeft);
        direction.normalize(); 

        // 速度の加算
        if (moveForward || moveBackward) velocity.z -= direction.z * speed * delta;
        if (moveLeft || moveRight) velocity.x -= direction.x * speed * delta;

        // カメラを移動
        controls.moveForward(-velocity.z * delta);
        controls.moveRight(velocity.x * delta);
    }
    
    prevTime = time;

    renderer.render(scene, camera);
}

// ------------------------------------
// 8. 実行
// ------------------------------------
init();
