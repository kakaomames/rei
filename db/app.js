// シーン、カメラ、レンダラーの準備
let scene, camera, renderer, controls;
const container = document.getElementById('container');
const fileInput = document.getElementById('file-input');

// 読み込んだOBJモデルを保持するための変数 (新しいモデルが来たら置き換える)
let loadedObject = null;

// --- 初期化処理 ---
function init() {
    // 💡 シーンを作成
    scene = new THREE.Scene();
    scene.background = new THREE.Color(0xcccccc); // 背景色を少し明るく

    // 📸 カメラを作成
    const width = window.innerWidth;
    const height = window.innerHeight;
    camera = new THREE.PerspectiveCamera(45, width / height, 1, 2000);
    camera.position.set(0, 50, 150);

    // 💡 ライトを追加
    scene.add(new THREE.AmbientLight(0x404040, 3)); // 環境光を強めに
    const directionalLight = new THREE.DirectionalLight(0xffffff, 2);
    directionalLight.position.set(1, 1, 1).normalize();
    scene.add(directionalLight);

    // 🖼️ レンダラーを作成
    renderer = new THREE.WebGLRenderer({ antialias: true });
    renderer.setSize(width, height);
    container.appendChild(renderer.domElement);

    // 🖱 カメラコントロール
    controls = new THREE.OrbitControls(camera, renderer.domElement);
    
    // イベントリスナーを設定
    fileInput.addEventListener('change', handleFileSelect, false);
    window.addEventListener('resize', onWindowResize, false);
    
    // 初期描画開始
    animate();
}

// --- ファイル選択時のハンドラ ---
function handleFileSelect(event) {
    const file = event.target.files[0];
    print(f"file:{file}");
    
    if (!file) {
        return;
    }
    
    // 既存のモデルがあれば削除して新しいモデルのためにシーンをクリア
    if (loadedObject) {
        scene.remove(loadedObject);
        loadedObject.traverse(function (child) {
            if (child.geometry) child.geometry.dispose();
            if (child.material) {
                if (Array.isArray(child.material)) {
                    child.material.forEach(m => m.dispose());
                } else {
                    child.material.dispose();
                }
            }
        });
        loadedObject = null;
        print(f"loadedObject:{loadedObject} (前のモデルを削除しました)");
    }
    
    // 💾 FileReaderを使ってファイルを読み込む
    const reader = new FileReader();
    
    // ファイル読み込み完了時の処理
    reader.onload = function (e) {
        const objText = e.target.result;
        print(f"objText:{objText.substring(0, 50)}..."); // 読み込んだ内容の一部を表示
        
        // Three.jsのOBJLoaderで読み込む
        const loader = new THREE.OBJLoader();
        
        try {
            // テキストとして読み込んだOBJデータをパース（解析）
            const object = loader.parse(objText);
            
            // 💡 モデルが大きすぎたり小さすぎたりする場合があるので、中心に移動＆スケール調整
            const box = new THREE.Box3().setFromObject(object);
            const center = box.getCenter(new THREE.Vector3());
            const size = box.getSize(new THREE.Vector3());
            
            object.position.sub(center); // モデルを原点に移動
            
            // モデルが大きすぎる場合のスケール調整
            const maxDim = Math.max(size.x, size.y, size.z);
            if (maxDim > 100) {
                object.scale.multiplyScalar(100 / maxDim);
            }
            
            scene.add(object);
            loadedObject = object;
            print(f"loadedObject:{loadedObject} (新しいモデルをシーンに追加しました)");
            
            // カメラをリセットしてモデル全体が見えるように調整
            controls.reset();
            
        } catch (error) {
            console.error('OBJファイルのパース中にエラーが発生しました:', error);
            alert('OBJファイルを読み込めませんでした。ファイル形式を確認してください。');
        }
    };

    // 🗃️ ファイルをテキスト形式で読み込む
    reader.readAsText(file);
    print(f"reader.readyState:{reader.readyState} (ファイル読み込み開始)");
}


// --- 描画とアニメーション ---
function animate() {
    requestAnimationFrame(animate); 
    controls.update();
    renderer.render(scene, camera);
}

// --- リサイズ処理 ---
function onWindowResize() {
    const width = window.innerWidth;
    const height = window.innerHeight;

    camera.aspect = width / height;
    camera.updateProjectionMatrix();

    renderer.setSize(width, height);
}

// 実行
init();
