// game.js

// ------------------------------------
// 1. 基本変数の定義とゲーム状態
// ------------------------------------
let scene, camera, renderer, controls;
const container = document.getElementById('game-container');

// プレイヤー移動用変数
let moveForward = false;
let moveBackward = false;
let moveLeft = false;
let moveRight = false;
let velocity = new THREE.Vector3(); // プレイヤーの移動速度
let direction = new THREE.Vector3(); // 移動方向
const speed = 15.0; // 移動速度 (調整可能)

let prevTime = performance.now(); // 毎フレームのデルタタイム計算用

// ------------------------------------
// 2. 初期化関数 (init)
// ------------------------------------
function init() {
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
    camera.position.set(0, 10, 0); // 初期位置をY=10 (地面より上)に設定

    // 🖼️ レンダラーの作成
    renderer = new THREE.WebGLRenderer({ antialias: true });
    renderer.setSize(window.innerWidth, window.innerHeight);
    container.appendChild(renderer.domElement);

    // 🕹️ PointerLockControlsのセットアップ
    controls = new THREE.PointerLockControls(camera, document.body);

    // マウスをクリックするとポインターロックが有効になるロジック
    container.addEventListener('click', function () {
        // ロック要求は必ずユーザー操作から行われる必要がある
        controls.lock(); 
    });

    // ポインターロックのイベントを監視 (ESCで解除される)
    controls.addEventListener('lock', function() {
        console.log("Pointer Locked: WASDで移動、マウスで視点操作");
    });
    controls.addEventListener('unlock', function() {
        console.log("Pointer Unlocked: ESCキーが押されました");
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
    
    // MCAddon/JSZip機能はここではスキップし、移動機能に集中
    // loadMCAddon('my_resource_pack.mcaddon'); 
}

// ------------------------------------
// 3. ボクセル (ブロック) の作成
// ------------------------------------
function createVoxelWorld() {
    // 🟫 ブロックのジオメトリ
    const geometry = new THREE.BoxGeometry(1, 1, 1);
    
    // 🟢 ブロックのマテリアル (ここでは全て緑の単色)
    const material = new THREE.MeshLambertMaterial({ color: 0x5aa743 }); 
    
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
// 4. JSZipとMCAddonの読み込み (将来的な拡張用)
// ------------------------------------
/*
async function loadMCAddon(addonUrl) {
    console.log(`MCAddonファイル ${addonUrl} の読み込みを開始...`);
    
    try {
        const response = await fetch(addonUrl);
        if (!response.ok) {
            throw new Error('MCAddonファイルの読み込みに失敗しました。');
        }
        
        const zipData = await response.blob();
        const jszip = new JSZip();
        
        // ZIPファイルを解凍
        const zip = await jszip.loadAsync(zipData);
        console.log(`ファイル ${addonUrl} を解凍しました。含まれるファイル数: ${Object.keys(zip.files).length}`);

        // 例: テクスチャファイルを読み込むロジック
        // const dirtTextureFile = zip.file("textures/blocks/dirt.png");
        // if (dirtTextureFile) {
        //     const textureBlob = await dirtTextureFile.async("blob");
        //     // ここでBlobをThree.jsのテクスチャとして読み込む処理を行う
        // }

    } catch (error) {
        console.error("MCAddon処理エラー:", error);
    }
}
*/

// ------------------------------------
// 5. イベントハンドラ (キー入力)
// ------------------------------------
function onKeyDown(event) {
    if (!controls.isLocked) return; // ロックされていない場合は無視
    
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
// 6. ループ処理 (animate)
// ------------------------------------
function animate() {
    requestAnimationFrame(animate); 

    const time = performance.now();
    // デルタタイム (前フレームからの経過時間) を取得。スムーズな移動に必須。
    const delta = (time - prevTime) / 1000; 

    if (controls.isLocked === true) {

        // 減速処理 (移動を止めると滑らかに止まるように)
        velocity.x -= velocity.x * 10.0 * delta;
        velocity.z -= velocity.z * 10.0 * delta;

        // 移動方向の計算
        direction.z = Number(moveForward) - Number(moveBackward);
        direction.x = Number(moveRight) - Number(moveLeft);
        direction.normalize(); 

        // 速度の加算
        if (moveForward || moveBackward) velocity.z -= direction.z * speed * delta;
        if (moveLeft || moveRight) velocity.x -= direction.x * speed * delta;

        // 実際にカメラを移動させる
        controls.moveForward(-velocity.z * delta);
        controls.moveRight(velocity.x * delta);
    }
    
    prevTime = time;

    renderer.render(scene, camera);
}

// ------------------------------------
// 7. 実行
// ------------------------------------
init();
