// game.js

// ------------------------------------
// 1. 基本変数の定義
// ------------------------------------
let scene, camera, renderer;
const container = document.getElementById('game-container');

// ------------------------------------
// 2. 初期化関数 (init)
// ------------------------------------
function init() {
    // 🌍 シーンの作成 (ワールドを配置する場所)
    scene = new THREE.Scene();
    scene.background = new THREE.Color(0x87ceeb); // 空の色 (薄い青)

    // 💡 光源の追加 (オブジェクトが見えるようにする)
    const ambientLight = new THREE.AmbientLight(0x404040); // 環境光
    scene.add(ambientLight);
    
    const directionalLight = new THREE.DirectionalLight(0xffffff, 1); // 太陽光
    directionalLight.position.set(1, 1, 1).normalize();
    scene.add(directionalLight);

    // 📸 カメラの作成 (プレイヤーの視点)
    // PerspectiveCamera(視野角, アスペクト比, near, far)
    camera = new THREE.PerspectiveCamera(
        75, // 視野角 (FOV)
        window.innerWidth / window.innerHeight, // アスペクト比
        0.1, // near (この距離より近いものは描画しない)
        1000 // far (この距離より遠いものは描画しない)
    );
    camera.position.set(10, 10, 10); // 初期位置

    // 🖼️ レンダラーの作成 (画面に描画するエンジン)
    renderer = new THREE.WebGLRenderer({ antialias: true });
    renderer.setSize(window.innerWidth, window.innerHeight);
    
    // レンダラーのcanvasをコンテナに追加
    container.appendChild(renderer.domElement);

    // ウィンドウサイズ変更時のリサイズ処理
    window.addEventListener('resize', onWindowResize, false);
    
    // 最初のブロックを配置
    createVoxelWorld();
}

// ------------------------------------
// 3. ボクセル (ブロック) の作成
// ------------------------------------
function createVoxelWorld() {
    // 🟫 ブロックのジオメトリ (立方体の形状)
    const geometry = new THREE.BoxGeometry(1, 1, 1);
    
    // 🟢 ブロックのマテリアル (色や質感) - 緑色で作成
    const material = new THREE.MeshLambertMaterial({ color: 0x5aa743 }); 
    
    // 最初のブロックを配置する（デモ用）
    for (let x = -5; x <= 5; x++) {
        for (let z = -5; z <= 5; z++) {
            const block = new THREE.Mesh(geometry, material);
            block.position.set(x, 0, z); // Y=0 の地面に配置
            scene.add(block);
        }
    }
}

// ------------------------------------
// 4. ループ処理 (animate)
// ------------------------------------
// 毎秒60回など、画面を更新し続けるための関数
function animate() {
    requestAnimationFrame(animate); // ブラウザに次のフレームでの描画を要求
    
    // 例: カメラを少し回転させているように見せる
    // camera.rotation.y += 0.005;

    // シーンとカメラを使って画面を更新
    renderer.render(scene, camera);
}

// ------------------------------------
// 5. イベントハンドラ
// ------------------------------------
function onWindowResize() {
    camera.aspect = window.innerWidth / window.innerHeight;
    camera.updateProjectionMatrix(); // カメラ設定の更新
    renderer.setSize(window.innerWidth, window.innerHeight); // レンダラーのリサイズ
}

// ------------------------------------
// 6. 実行
// ------------------------------------
init();
animate();

//
