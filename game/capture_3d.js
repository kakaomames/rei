// capture_3d.js (アニメーションクリップ対応版 - 最終統合)
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
let allClips = {}; // 全アニメーションクリップを格納するオブジェクト

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
            // デバッグのため、代替ボールを生成 (OBJエラー時)
            const ballGeo = new THREE.SphereGeometry(0.3, 32, 32);
            const ballMat = new THREE.MeshStandardMaterial({ color: 0xff0000 });
            ballMesh = new THREE.Mesh(ballGeo, ballMat);
            ballMesh.position.set(0, 0, 2); 
            scene.add(ballMesh);
        });
    }, undefined, function(error) {
         console.error('MTLの読み込み中にエラーが発生しました:', error);
         // MTLがなくてもOBJのロードを試みる
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

// ★修正・統合★ アニメーションJSONを読み込み、アニメーションを開始する関数
function loadCacaoAnimation() {
    // mixerがまだ初期化されていない場合は処理しない
    if (!mixer) {
        console.warn("AnimationMixer not initialized. Skipping animation load.");
        return;
    }
    
    fetch('./model.animation.json')
        .then(response => response.json())
        .then(data => {
            // JSONから全てのアニメーションクリップを抽出し、allClipsに格納
            for (const clipName in data.animations) {
                if (data.animations.hasOwnProperty(clipName)) {
                    const animationData = data.animations[clipName];
                    const tracks = [];
                    
                    // Ballの回転トラックを処理 (最も重要な修正点)
                    if (animationData.bones && animationData.bones.ball && animationData.bones.ball.rotation) {
                        const times = Object.keys(animationData.bones.ball.rotation).map(t => parseFloat(t) * animationData.animation_length);
                        
                        const values = [];
                        for (const timeKey in animationData.bones.ball.rotation) {
                            const [x, y, z] = animationData.bones.ball.rotation[timeKey];
                            // ★Blockbenchの角度(deg)をThree.jsのラジアン(rad)に変換★
                            values.push(
                                THREE.MathUtils.degToRad(x), 
                                THREE.MathUtils.degToRad(y), 
                                THREE.MathUtils.degToRad(z)
                            );
                        }
                        
                        // ここで 'ballMesh.rotation' ではなく 'ball.rotation' を使うのは、Blockbenchのエクスポート形式に合わせるためです
                        const rotationTrack = new THREE.VectorKeyframeTrack(
                            'ball.rotation', 
                            times, 
                            values, 
                            THREE.InterpolateSmooth
                        );
                        tracks.push(rotationTrack);
                    }
                    
                    // Blockbench JSONをThree.jsのクリップとして生成
                    const clip = new THREE.AnimationClip(clipName, animationData.animation_length, tracks);
                    allClips[clipName] = clip;
                }
            }

            // 待機アニメーション (taiki) の実行
            if (allClips['animation.taiki']) {
                mixer.stopAllAction();
                // ターゲットをballMesh (OBJLoaderが読み込んだGroup) に設定
                const action = mixer.clipAction(allClips['animation.taiki'], ballMesh); 
                action.setLoop(THREE.LoopRepeat);
                action.play();
            }
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
    
    // 3D画面側のUIを非表示にする
    document.getElementById('target-name').style.display = 'none';
    document.getElementById('throw-btn').style.display = 'none'; 
    document.getElementById('capture-container').querySelector('.bottom-ui').style.display = 'none';
}

function hideCaptureMessage() {
    document.getElementById('capture-message-display').style.display = 'none';
    // 3D画面側のUIを再表示する
    document.getElementById('target-name').style.display = 'block';
    // throw-btnとbottom-uiはstartCaptureで再有効化されるため、ここでは非表示解除のみ
    document.getElementById('capture-container').querySelector('.bottom-ui').style.display = 'flex'; 
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
        // ボールの移動処理 (アニメーションJSONの"nageru"は使わず、手動で制御)
        ballMesh.position.z -= 0.3; 
        ballMesh.position.y += 0.05; 

        // 当たり判定
        if (ballMesh.position.z < -4) {
            isBallThrown = false;
            cancelAnimationFrame(animationId); // アニメーションを停止
            
            // --- 捕獲判定ロジック ---
            const captureRate = currentTargetData.capture_rate; 
            const success = Math.random() < captureRate; 
            
            // シーンからボールとモンスターを削除
            if (ballMesh) scene.remove(ballMesh);
            if (targetMesh) scene.remove(targetMesh);
            
            document.getElementById('throw-btn').disabled = true;

            if (success) {
                // 捕獲成功！
                currentMarker.remove(); 
                
                displayCaptureMessage(`🎉 捕獲成功！${currentTargetData.name} を捕まえた！`);
                
                setTimeout(() => {
                    hideCaptureMessage();
                    window.closeCapture(); 
                }, 3000); 

            } else {
                // 捕獲失敗/逃走！
                displayCaptureMessage(`😢 逃げられた... ${currentTargetData.name} は遠くへ行ってしまった。`);

                setTimeout(() => {
                    hideCaptureMessage();
                    window.closeCapture(); 
                }, 3000); 
            }
        }
    }

    if(renderer) renderer.render(scene, camera);
}
