// capture_3d.js (THREE存在チェック版)

// --- Three.js グローバル変数 ---
let scene, camera, renderer, targetMesh, ballMesh;
let animationId;
let isBallThrown = false;
let currentTargetData = null; 
let currentMarker = null;     

// アニメーション用変数
let mixer; 
let clock = new THREE.Clock(); 
let allClips = {}; 

// --- 捕獲モード開始 ---
function startCapture(data, marker) { 
    console.log(`[3D LOG] 1. 捕獲画面開始: モンスター (${data.name}) の表示を試みます。`); // LOG 1
    
    // ★★★ クリティカルチェック ★★★
    if (typeof THREE === 'undefined') {
        // THREEオブジェクトが見つからない場合、すぐにエラーを表示して終了
        console.error('[3D CRITICAL ERROR] THREE.jsコアライブラリ(THREE)が見つかりません。HTMLの読み込み順/パスを再確認してください。');
        return;
    }
    console.log('[3D LOG] 2. THREEオブジェクトの存在確認OK。初期化へ進みます。'); // LOG 2
    
    currentTargetData = data;
    currentMarker = marker;

    document.getElementById('target-name').innerText = `${data.name} が現れた！`;
    document.getElementById('target-name').style.display = 'block';
    document.getElementById('throw-btn').disabled = false;
    document.getElementById('throw-btn').innerText = "ボールを投げる！";
    
    hideCaptureMessage();

    if (!renderer) {
        init3D();
    } else {
        console.log('[3D LOG] init3Dはスキップ。既にレンダラーが存在します。');
    }

    // ターゲットの再生成ロジック
    if (targetMesh) scene.remove(targetMesh);
    
    // JSONから色情報を取得
    const colorCode = parseInt(data.color, 16); 

    const geometry = new THREE.IcosahedronGeometry(1, 1);
    const material = new THREE.MeshStandardMaterial({ color: colorCode, roughness: 0.4, metalness: 0.3 });
    targetMesh = new THREE.Mesh(geometry, material);
    targetMesh.position.set(0, 0, -5); 
    scene.add(targetMesh);
    console.log('[3D LOG] 4. ターゲットのモンスター（球体）をシーンに追加しました。'); // LOG 4

    // ボールのリセット
    if (ballMesh) scene.remove(ballMesh);
    isBallThrown = false;
    
    animate3D(); 
}

window.startCapture = startCapture; 


// --- 3D初期化 (初回一度だけ実行) ---
function init3D() {
    console.log('[3D LOG] 3. init3D: 3D初期化開始。'); // LOG 3
    const container = document.getElementById('capture-container');

    scene = new THREE.Scene();
    camera = new THREE.PerspectiveCamera(75, window.innerWidth / window.innerHeight, 0.1, 1000);
    camera.position.z = 5;
    camera.position.y = 1;

    renderer = new THREE.WebGLRenderer({ alpha: true, antialias: true });
    renderer.setSize(window.innerWidth, window.innerHeight);
    container.appendChild(renderer.domElement);
    console.log('[3D LOG] init3D: レンダラーをDOMに追加しました。');

    const ambientLight = new THREE.AmbientLight(0xffffff, 0.8);
    scene.add(ambientLight);
    const dirLight = new THREE.DirectionalLight(0xffffff, 1);
    dirLight.position.set(5, 10, 7);
    scene.add(dirLight);

    const gridHelper = new THREE.GridHelper(20, 20, 0xffffff, 0x555555);
    gridHelper.position.y = -1;
    scene.add(gridHelper);
    
    mixer = new THREE.AnimationMixer(scene); 
    console.log('[3D LOG] init3D: 3D初期化完了。');
    
    window.addEventListener('resize', () => {
        camera.aspect = window.innerWidth / window.innerHeight;
        camera.updateProjectionMatrix();
        renderer.setSize(window.innerWidth, window.innerHeight);
    });
}


// --- ボールを投げる処理 ---
document.getElementById('throw-btn').addEventListener('click', () => {
    if (isBallThrown) return;
    console.log('[3D LOG] ボール投げボタンクリック！');
    isBallThrown = true;
    document.getElementById('throw-btn').disabled = true; 
    
    if (ballMesh) scene.remove(ballMesh);
    
    loadCacaoBall(); 
});


// カカオボールのOBJとMTLを読み込む関数
function loadCacaoBall() {
    console.log('[3D LOG] loadCacaoBall: ボールのロード処理開始。');
    const mtlLoader = new THREE.MTLLoader();
    
    mtlLoader.load('./materials.mtl', function(materials) {
        console.log('[3D LOG] MTLロード成功。OBJロードへ移行。');
        materials.preload();
        
        const objLoader = new THREE.OBJLoader();
        objLoader.setMaterials(materials);

        objLoader.load('./model.obj', function(object) {
            ballMesh = object; 
            ballMesh.position.set(0, 0, 2);
            ballMesh.scale.set(0.1, 0.1, 0.1); 
            scene.add(ballMesh);
            console.log('[3D LOG] OBJロード成功。ボールをシーンに追加しました。');
            
            loadCacaoAnimation();

        }, undefined, function(error) {
            console.error('[3D ERROR] OBJの読み込み中にエラーが発生しました:', error);
            // 代替ボールを生成 (OBJエラー時)
            const ballGeo = new THREE.SphereGeometry(0.3, 32, 32);
            const ballMat = new THREE.MeshStandardMaterial({ color: 0xff0000 });
            ballMesh = new THREE.Mesh(ballGeo, ballMat);
            ballMesh.position.set(0, 0, 2); 
            scene.add(ballMesh);
            console.log('[3D LOG] OBJロード失敗のため、代替の赤い球体をシーンに追加しました。');
        });
    }, undefined, function(error) {
         console.error('[3D ERROR] MTLの読み込み中にエラーが発生しました:', error);
         // MTLがなくてもOBJのロードを試みる
         const objLoader = new THREE.OBJLoader();
         objLoader.load('./model.obj', function(object) {
            ballMesh = object;
            ballMesh.position.set(0, 0, 2);
            ballMesh.scale.set(0.1, 0.1, 0.1); 
            scene.add(ballMesh);
            console.log('[3D LOG] MTL失敗。テクスチャなしでOBJロード成功。');
            loadCacaoAnimation();
         });
    });
}

// アニメーションJSONを読み込み、アニメーションを開始する関数
function loadCacaoAnimation() {
    console.log('[3D LOG] loadCacaoAnimation: アニメーションJSONのフェッチ開始。');
    if (!mixer) {
        console.warn("[3D WARN] AnimationMixer not initialized. Skipping animation load.");
        return;
    }
    
    fetch('./model.animation.json')
        .then(response => {
            console.log('[3D LOG] アニメーションJSONレスポンス受信。');
            if (!response.ok) {
                throw new Error(`HTTP error! status: ${response.status}`);
            }
            return response.json();
        })
        .then(data => {
            console.log('[3D LOG] アニメーションJSONデータ受信成功。クリップ解析開始。');
            
            for (const clipName in data.animations) {
                if (data.animations.hasOwnProperty(clipName)) {
                    const animationData = data.animations[clipName];
                    const tracks = [];
                    
                    if (animationData.bones && animationData.bones.ball && animationData.bones.ball.rotation) {
                        const times = Object.keys(animationData.bones.ball.rotation).map(t => parseFloat(t) * animationData.animation_length);
                        
                        const values = [];
                        for (const timeKey in animationData.bones.ball.rotation) {
                            const [x, y, z] = animationData.bones.ball.rotation[timeKey];
                            values.push(
                                THREE.MathUtils.degToRad(x), 
                                THREE.MathUtils.degToRad(y), 
                                THREE.MathUtils.degToRad(z)
                            );
                        }
                        
                        const rotationTrack = new THREE.VectorKeyframeTrack(
                            'ball.rotation', 
                            times, 
                            values, 
                            THREE.InterpolateSmooth
                        );
                        tracks.push(rotationTrack);
                    }
                    
                    const clip = new THREE.AnimationClip(clipName, animationData.animation_length, tracks);
                    allClips[clipName] = clip;
                }
            }
            console.log(`[3D LOG] ${Object.keys(allClips).length}個のアニメーションクリップを解析完了。`);

            // 待機アニメーション (taiki) の実行
            if (allClips['animation.taiki']) {
                mixer.stopAllAction();
                const action = mixer.clipAction(allClips['animation.taiki'], ballMesh); 
                action.setLoop(THREE.LoopRepeat);
                action.play();
                console.log('[3D LOG] animation.taiki をボールに適用し再生開始。');
            } else {
                console.warn('[3D WARN] animation.taiki クリップが見つかりませんでした。');
            }
        })
        .catch(error => {
            console.error('[3D ERROR] アニメーションJSONのフェッチまたはパース中にエラーが発生しました:', error);
        });
}


// --- メッセージ表示ヘルパー関数 ---
function displayCaptureMessage(message) {
    const msgDiv = document.getElementById('capture-message-display');
    msgDiv.innerText = message;
    msgDiv.style.display = 'block';
    
    document.getElementById('target-name').style.display = 'none';
    document.getElementById('throw-btn').style.display = 'none'; 
    document.getElementById('capture-container').querySelector('.bottom-ui').style.display = 'none';
}

function hideCaptureMessage() {
    document.getElementById('capture-message-display').style.display = 'none';
    document.getElementById('target-name').style.display = 'block';
    document.getElementById('capture-container').querySelector('.bottom-ui').style.display = 'flex'; 
}


// --- 3Dアニメーションループ ---
function animate3D() {
    animationId = requestAnimationFrame(animate3D);

    const delta = clock.getDelta();
    if (mixer) mixer.update(delta); 

    if (targetMesh) {
        targetMesh.rotation.y += 0.01;
        targetMesh.rotation.x += 0.005;
        targetMesh.position.y = Math.sin(Date.now() * 0.002) * 0.5;
    }

    if (isBallThrown && ballMesh) {
        ballMesh.position.z -= 0.3; 
        ballMesh.position.y += 0.05; 

        // 当たり判定
        if (ballMesh.position.z < -4) {
            console.log('[3D LOG] ボールがターゲット位置に到達しました。');
            isBallThrown = false;
            cancelAnimationFrame(animationId); 
            
            // --- 捕獲判定ロジック ---
            const captureRate = currentTargetData.capture_rate; 
            const success = Math.random() < captureRate; 
            
            if (ballMesh) scene.remove(ballMesh);
            if (targetMesh) scene.remove(targetMesh);
            
            document.getElementById('throw-btn').disabled = true;

            if (success) {
                console.log('[3D LOG] 捕獲判定: 成功。');
                currentMarker.remove(); 
                
                displayCaptureMessage(`🎉 捕獲成功！${currentTargetData.name} を捕まえた！`);
                
                setTimeout(() => {
                    window.closeCapture(); 
                    console.log('[3D LOG] 3秒後: マップ画面へ自動復帰。');
                }, 3000); 

            } else {
                console.log('[3D LOG] 捕獲判定: 失敗/逃走。');
                displayCaptureMessage(`😢 逃げられた... ${currentTargetData.name} は遠くへ行ってしまった。`);

                setTimeout(() => {
                    window.closeCapture(); 
                    console.log('[3D LOG] 3秒後: マップ画面へ自動復帰。');
                }, 3000); 
            }
        }
    }

    if(renderer) renderer.render(scene, camera);
}
