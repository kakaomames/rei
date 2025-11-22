// capture_3d.js (最終アニメーション対応版)
import * as THREE from 'three'; 

// --- Three.js グローバル変数 ---
let scene, camera, renderer, targetMesh, ballMesh;
let animationId;
let isBallThrown = false;
let currentTargetData = null; // map_managerから渡されたJSONモンスター情報
let currentMarker = null;     // map_managerから渡されたLeafletマーカーオブジェクト

// アニメーション用変数
let mixer; 
let clock = new THREE.Clock(); 

// --- 捕獲モード開始 ---
// window.startCapture としてグローバルに公開
function startCapture(data, marker) { 
    currentTargetData = data;
    currentMarker = marker;

    document.getElementById('target-name').innerText = `${data.name} が現れた！`;
    document.getElementById('target-name').style.display = 'block';
    document.getElementById('throw-btn').disabled = false;
    document.getElementById('throw-btn').innerText = "ボールを投げる！";
    
    // 捕獲メッセージを非表示に
    hideCaptureMessage();

    if (!renderer) init3D();

    // ターゲットの再生成ロジック
    if (targetMesh) scene.remove(targetMesh);
    
    // JSONから色情報を取得
    const colorCode = parseInt(data.color, 16); 

    const geometry = new THREE.IcosahedronGeometry(1, 1);
    const material = new THREE.MeshStandardMaterial({ color: colorCode, roughness: 0.4, metalness: 0.3 });
    targetMesh = new THREE.Mesh(geometry, material);
    targetMesh.position.set(0, 0, -5); 
    scene.add(targetMesh);

    // ボールのリセット
    if (ballMesh) scene.remove(ballMesh);
    isBallThrown = false;
    
    // アニメーションループ開始
    animate3D(); 
}

// capture_3d.js の機能が必要なため、グローバルに公開
window.startCapture = startCapture; 


// --- 3D初期化 (初回一度だけ実行) ---
function init3D() {
    const container = document.getElementById('capture-container');

    scene = new THREE.Scene();
    camera = new THREE.PerspectiveCamera(75, window.innerWidth / window.innerHeight, 0.1, 1000);
    camera.position.z = 5;
    camera.position.y = 1;

    renderer = new THREE.WebGLRenderer({ alpha: true, antialias: true });
    renderer.setSize(window.innerWidth, window.innerHeight);
    container.appendChild(renderer.domElement);

    const ambientLight = new THREE.AmbientLight(0xffffff, 0.8);
    scene.add(ambientLight);
    const dirLight = new THREE.DirectionalLight(0xffffff, 1);
    dirLight.position.set(5, 10, 7);
    scene.add(dirLight);

    const gridHelper = new THREE.GridHelper(20, 20, 0xffffff, 0x555555);
    gridHelper.position.y = -1;
    scene.add(gridHelper);
    
    // アニメーションミキサーの初期化
    // mixerの初期化はsceneに依存するため、init3D内で行います
    mixer = new THREE.AnimationMixer(scene); 

    // リサイズ対応
    window.addEventListener('resize', () => {
        camera.aspect = window.innerWidth / window.innerHeight;
        camera.updateProjectionMatrix();
        renderer.setSize(window.innerWidth, window.innerHeight);
    });
}


// --- ボールを投げる処理 ---
document.getElementById('throw-btn').addEventListener('click', () => {
    if (isBallThrown) return;
    isBallThrown = true;
    document.getElementById('throw-btn').disabled = true; // 連打防止
    
    // 既存のボールがあれば削除
    if (ballMesh) scene.remove(ballMesh);
    
    // カカオボールのロードとアニメーションの開始
    loadCacaoBall(); 
});


// ★新規追加★ カカオボールのOBJとMTLを読み込む関数
function loadCacaoBall() {
    // MTLとOBJのローダーは、HTMLで外部スクリプトとして読み込まれていることを前提とする
    const mtlLoader = new THREE.MTLLoader();
    
    mtlLoader.load('./materials.mtl', function(materials) {
        materials.preload();
        
        const objLoader = new THREE.OBJLoader();
        objLoader.setMaterials(materials);

        objLoader.load('./model.obj', function(object) {
            ballMesh = object; // グローバル変数にセット
            ballMesh.position.set(0, 0, 2);
            ballMesh.scale.set(0.1, 0.1, 0.1); // スケールを調整
            scene.add(ballMesh);
            
            // アニメーションの読み込みと開始
            loadCacaoAnimation();

        }, undefined, function(error) {
            console.error('OBJの読み込み中にエラーが発生しました:', error);
            // デバッグのため、代替ボールを生成
            const ballGeo = new THREE.SphereGeometry(0.3, 32, 32);
            const ballMat = new THREE.MeshStandardMaterial({ color: 0xff0000 });
            ballMesh = new THREE.Mesh(ballGeo, ballMat);
            ballMesh.position.set(0, 0, 2); 
            scene.add(ballMesh);
        });
    }, undefined, function(error) {
         console.error('MTLの読み込み中にエラーが発生しました:', error);
         // MTLがなくてもOBJのロードを試みる（テクスチャなしの単色になる可能性）
         const objLoader = new THREE.OBJLoader();
         objLoader.load('./model.obj', function(object) {
            ballMesh = object;
            ballMesh.position.set(0, 0, 2);
            ballMesh.scale.set(0.1, 0.1, 0.1); 
            scene.add(ballMesh);
            loadCacaoAnimation();
         });
    });
}

// ★新規追加★ アニメーションJSONを読み込み、アニメーションを開始する関数
function loadCacaoAnimation() {
    fetch('./model.animation.json')
        .then(response => response.json())
        .then(data => {
            // THREE.AnimationClip.parse は、THREEをグローバルに持つ環境ではTHREE.AnimationClipが使える
            const clip = THREE.AnimationClip.parse(data);
            const action = mixer.clipAction(clip, ballMesh); // ボールメッシュにアクションを適用
            action.setLoop(THREE.LoopRepeat); // ループ設定
            action.play();
        })
        .catch(error => {
            console.error('アニメーションJSONの読み込みまたはパース中にエラーが発生しました:', error);
        });
}


// --- メッセージ表示ヘルパー関数 ---
function displayCaptureMessage(message) {
    const msgDiv = document.getElementById('capture-message-display');
    msgDiv.innerText = message;
    msgDiv.style.display = 'block';
    
    // 3D画面側のターゲット名表示は非表示にする
    document.getElementById('target-name').style.display = 'none';
    document.getElementById('throw-btn').style.display = 'none'; // ボール投げボタンも非表示に
    document.getElementById('capture-container').querySelector('.bottom-ui').style.display = 'none'; // ボールと逃げるボタン全体を非表示
}

function hideCaptureMessage() {
    document.getElementById('capture-message-display').style.display = 'none';
    document.getElementById('target-name').style.display = 'block';
    document.getElementById('throw-btn').style.display = 'block';
    document.getElementById('capture-container').querySelector('.bottom-ui').style.display = 'flex'; // 再表示
}


// --- 3Dアニメーションループ ---
function animate3D() {
    animationId = requestAnimationFrame(animate3D);

    const delta = clock.getDelta();
    if (mixer) mixer.update(delta); // ★アニメーションミキサーを更新★

    if (targetMesh) {
        targetMesh.rotation.y += 0.01;
        targetMesh.rotation.x += 0.005;
        targetMesh.position.y = Math.sin(Date.now() * 0.002) * 0.5;
    }

    if (isBallThrown && ballMesh) {
        // ボールの移動処理 
        ballMesh.position.z -= 0.3; 
        ballMesh.position.y += 0.05; 

        // 当たり判定
        if (ballMesh.position.z < -4) {
            isBallThrown = false;
            cancelAnimationFrame(animationId); // アニメーションを停止
            
            // --- 捕獲判定ロジック ---
            const captureRate = currentTargetData.capture_rate; // JSONから確率を取得
            const success = Math.random() < captureRate; // 乱数判定
            
            // シーンからボールを削除
            if (ballMesh) scene.remove(ballMesh);
            if (targetMesh) scene.remove(targetMesh);
            
            document.getElementById('throw-btn').disabled = true;

            if (success) {
                // 捕獲成功！
                currentMarker.remove(); // マップからモンスターを削除
                
                // メッセージを中央に表示
                displayCaptureMessage(`🎉 捕獲成功！${currentTargetData.name} を捕まえた！`);
                
                // 3秒後に自動でマップ画面に戻る
                setTimeout(() => {
                    hideCaptureMessage();
                    window.closeCapture(); 
                }, 3000); 

            } else {
                // 捕獲失敗/逃走！
                
                // メッセージを中央に表示
                displayCaptureMessage(`😢 逃げられた... ${currentTargetData.name} は遠くへ行ってしまった。`);

                // 3秒後に自動でマップ画面に戻る
                setTimeout(() => {
                    hideCaptureMessage();
                    window.closeCapture(); 
                }, 3000); 
            }
        }
    }

    if(renderer) renderer.render(scene, camera);
}
