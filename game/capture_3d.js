// capture_3d.js (Bedrock JSONモデル/アニメーション対応版)

// --- Three.js グローバル変数 ---
let scene, camera, renderer, targetMesh, ballMesh;
let animationId;
let isBallThrown = false;
let currentTargetData = null; 
let currentMarker = null;     

// アニメーション用変数
let mixer; 
let clock; 
let allClips = {}; 

// --- 捕獲モード開始 ---
function startCapture(data, marker) { 
    console.log(`[3D LOG] 1. 捕獲画面開始: モンスター (${data.name}) の表示を試みます。`); 
    
    // THREEオブジェクトの存在確認
    if (typeof THREE === 'undefined' || typeof THREE.Scene === 'undefined') {
        console.error('[3D CRITICAL ERROR] THREE.jsコアライブラリ(THREE)が見つからないか、不完全です。');
        return;
    }
    console.log('[3D LOG] 2. THREEオブジェクトの存在確認OK。初期化へ進みます。'); 
    
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

    console.log('[3D LOG] 4. モンスターメッシュ作成直前。'); 
    const geometry = new THREE.IcosahedronGeometry(1, 1);
    const material = new THREE.MeshStandardMaterial({ color: colorCode, roughness: 0.4, metalness: 0.3 });
    targetMesh = new THREE.Mesh(geometry, material);
    targetMesh.position.set(0, 0, -5); 
    scene.add(targetMesh);
    console.log('[3D LOG] 5. ターゲットのモンスター（球体）をシーンに追加しました。'); 

    // ボールのリセット
    if (ballMesh) scene.remove(ballMesh);
    isBallThrown = false;
    
    if (!clock) clock = new THREE.Clock();
    
    animate3D(); 
}

window.startCapture = startCapture; 


// --- 3D初期化 (初回一度だけ実行) ---
function init3D() {
    console.log('[3D LOG] 3. init3D: 3D初期化開始。'); 
    
    const container = document.getElementById('capture-container');
    if (!container) {
        console.error('[3D CRITICAL ERROR] 3a. HTMLにID="capture-container"の要素が見つかりません。描画できません。');
        return; 
    }
    console.log('[3D LOG] 3b. コンテナ要素の取得OK。'); 

    console.log('[3D LOG] 3c. THREE.Scene() 実行直前。'); 
    scene = new THREE.Scene();
    console.log('[3D LOG] 3d. THREE.Scene作成成功。'); 
    
    camera = new THREE.PerspectiveCamera(75, window.innerWidth / window.innerHeight, 0.1, 1000);
    camera.position.z = 5;
    camera.position.y = 1;

    renderer = new THREE.WebGLRenderer({ alpha: true, antialias: true });
    renderer.setSize(window.innerWidth, window.innerHeight);
    container.appendChild(renderer.domElement);
    console.log('[3D LOG] 3e. レンダラーをDOMに追加しました。');

    const ambientLight = new THREE.AmbientLight(0xffffff, 0.8);
    scene.add(ambientLight);
    const dirLight = new THREE.DirectionalLight(0xffffff, 1);
    dirLight.position.set(5, 10, 7);
    scene.add(dirLight);

    const gridHelper = new THREE.GridHelper(20, 20, 0xffffff, 0x555555);
    gridHelper.position.y = -1;
    scene.add(gridHelper);
    
    mixer = new THREE.AnimationMixer(scene); 
    
    window.addEventListener('resize', () => {
        camera.aspect = window.innerWidth / window.innerHeight;
        camera.updateProjectionMatrix();
        renderer.setSize(window.innerWidth, window.innerHeight);
    });
    console.log('[3D LOG] 3z. init3D: 3D初期化完了。');
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


/**
 * Bedrock JSONデータからThree.jsのジオメトリとメッシュを構築する関数。
 * @param {object} json - ball.geo.json のパースされたデータ
 * @returns {THREE.Group} 構築されたモデルのグループ
 */
function buildModelFromJson(json) {
    console.log('[3D LOG] JSON: ジオメトリ構築開始。');
    
    const texture = new THREE.TextureLoader().load('./texture.png');
    texture.flipY = false; 

    // JSONのtexture_widthとtexture_heightを取得
    const description = json['minecraft:geometry'][0].description;
    const texWidth = description.texture_width;
    const texHeight = description.texture_height;

    // ジオメトリ全体を保持する親グループ（これがアニメーションターゲット "ball" になる）
    const modelGroup = new THREE.Group();
    modelGroup.name = 'ball'; 

    // マテリアル（テクスチャを使用）
    const material = new THREE.MeshBasicMaterial({ map: texture, side: THREE.FrontSide, transparent: true });

    const bones = json['minecraft:geometry'][0].bones;
    
    // JSONのすべてのボーンをループ
    for (const bone of bones) {
        if (!bone.cubes) continue;

        // ボーン用のグループを作成し、pivotを設定
        const boneGroup = new THREE.Group();
        boneGroup.name = bone.name; 
        
        // Bedrockのピボットと位置を設定 (1/16単位を考慮)
        if (bone.pivot) {
             boneGroup.position.set(bone.pivot[0] / 16, bone.pivot[1] / 16, bone.pivot[2] / 16);
        }

        // キューブ（BoxGeometry）を構築
        for (const cube of bone.cubes) {
            const size = cube.size;
            const origin = cube.origin;
            const uv = cube.uv;

            const boxWidth = size[0] / 16;
            const boxHeight = size[1] / 16;
            const boxDepth = size[2] / 16;
            
            const geometry = new THREE.BoxGeometry(boxWidth, boxHeight, boxDepth);

            // UV座標をBedrock形式からThree.js形式に変換
            const uvData = [
                // Right Face (+X)
                [uv[0] / texWidth, (uv[1] + size[2]) / texHeight], [uv[0] / texWidth, uv[1] / texHeight], 
                [(uv[0] + size[2]) / texWidth, uv[1] / texHeight], [(uv[0] + size[2]) / texWidth, (uv[1] + size[2]) / texHeight],
                // Left Face (-X)
                [(uv[0] + size[2] + size[0]) / texWidth, (uv[1] + size[2]) / texHeight], [(uv[0] + size[2] + size[0]) / texWidth, uv[1] / texHeight], 
                [(uv[0] + size[2] + size[0] + size[0]) / texWidth, uv[1] / texHeight], [(uv[0] + size[2] + size[0] + size[0]) / texWidth, (uv[1] + size[2]) / texHeight],
                // Top Face (+Y)
                [(uv[0] + size[2]) / texWidth, uv[1] / texHeight], [uv[0] / texWidth, uv[1] / texHeight], 
                [uv[0] / texWidth, (uv[1] + size[2]) / texHeight], [(uv[0] + size[2]) / texWidth, (uv[1] + size[2]) / texHeight],
                // Bottom Face (-Y)
                [(uv[0] + size[2] + size[0]) / texWidth, uv[1] / texHeight], [(uv[0] + size[2] + size[0] + size[2]) / texWidth, uv[1] / texHeight], 
                [(uv[0] + size[2] + size[0] + size[2]) / texWidth, (uv[1] + size[2]) / texHeight], [(uv[0] + size[2] + size[0]) / texWidth, (uv[1] + size[2]) / texHeight],
                // Front Face (+Z)
                [(uv[0] + size[2] + size[0]) / texWidth, (uv[1] + size[2]) / texHeight], [(uv[0] + size[2] + size[0]) / texWidth, uv[1] / texHeight], 
                [(uv[0] + size[2]) / texWidth, uv[1] / texHeight], [(uv[0] + size[2]) / texWidth, (uv[1] + size[2]) / texHeight],
                // Back Face (-Z)
                [(uv[0] + size[2] + size[0] + size[2] + size[0]) / texWidth, (uv[1] + size[2]) / texHeight], [(uv[0] + size[2] + size[0] + size[2] + size[0]) / texWidth, uv[1] / texHeight], 
                [(uv[0] + size[2] + size[0] + size[2]) / texWidth, uv[1] / texHeight], [(uv[0] + size[2] + size[0] + size[2]) / texWidth, (uv[1] + size[2]) / texHeight],
            ];
            
            // UV属性をジオメトリに設定
            const uvAttribute = new THREE.BufferAttribute(new Float32Array(uvData.flat()), 2);
            geometry.setAttribute('uv', uvAttribute);

            const mesh = new THREE.Mesh(geometry, material);
            
            // 原点を調整してメッシュを配置
            const offsetX = (origin[0] + size[0] / 2) / 16 - boneGroup.position.x;
            const offsetY = (origin[1] + size[1] / 2) / 16 - boneGroup.position.y;
            const offsetZ = (origin[2] + size[2] / 2) / 16 - boneGroup.position.z;

            mesh.position.set(offsetX, offsetY, offsetZ);

            boneGroup.add(mesh);
        }
        
        // 全キューブを構築後、ボーングループをモデルグループに追加
        modelGroup.add(boneGroup);
    }
    
    console.log('[3D LOG] JSON: ジオメトリ構築完了。');
    
    // モデルを中央揃えするために、原点からのオフセットを適用
    modelGroup.position.y = 0.5; // ボールを地面に浮かせたい場合

    return modelGroup;
}


// JSONファイルからモデルをロードする関数
function loadCacaoBall() {
    console.log('[3D LOG] loadCacaoBall: Bedrock JSONのロード処理開始。');
    
    // ファイル名: ball.geo.json
    fetch('./ball.geo.json')
        .then(response => {
            if (!response.ok) {
                throw new Error(`JSONファイルのロードに失敗: ${response.status}`);
            }
            return response.json();
        })
        .then(data => {
            console.log('[3D LOG] JSON: ball.geo.json ロード成功。');
            
            // JSONデータから直接Three.jsオブジェクトを構築
            ballMesh = buildModelFromJson(data); 

            // Bedrockモデルのスケールを調整
            ballMesh.scale.set(0.5, 0.5, 0.5); // サイズを調整
            ballMesh.position.set(0, 0, 2); 
            scene.add(ballMesh);
            
            console.log('[3D LOG] JSON: ボールをシーンに追加しました。');
            
            // アニメーションを適用
            loadCacaoAnimation();
            
        })
        .catch(error => {
            console.error('[3D ERROR] Bedrock JSONの読み込み中にエラーが発生しました:', error);
            // 代替ボールを生成 (JSONエラー時)
            const ballGeo = new THREE.SphereGeometry(0.3, 32, 32);
            const ballMat = new THREE.MeshStandardMaterial({ color: 0xff0000 });
            ballMesh = new THREE.Mesh(ballGeo, ballMat);
            ballMesh.position.set(0, 0, 2); 
            scene.add(ballMesh);
            console.log('[3D LOG] JSONロード失敗のため、代替の赤い球体をシーンに追加しました。');
        });
}


// アニメーションJSONを読み込み、アニメーションを開始する関数 (ロバスト化済み)
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
                    console.log(`[3D LOG] クリップ解析中: ${clipName}`);
                    const animationData = data.animations[clipName];
                    const tracks = [];
                    
                    // --- 1. Rotation Trackの解析 ---
                    if (animationData.bones && animationData.bones.ball && animationData.bones.ball.rotation) {
                        try {
                            const rotationKeys = Object.keys(animationData.bones.ball.rotation);
                            const times = rotationKeys.map(t => parseFloat(t) * animationData.animation_length);
                            
                            const values = [];
                            for (const timeKey of rotationKeys) {
                                const [x, y, z] = animationData.bones.ball.rotation[timeKey];
                                values.push(
                                    THREE.MathUtils.degToRad(x), 
                                    THREE.MathUtils.degToRad(y), 
                                    THREE.MathUtils.degToRad(z)
                                );
                            }
                            
                            if (times.length > 0) {
                                const rotationTrack = new THREE.VectorKeyframeTrack(
                                    '.rotation', 
                                    times, 
                                    values, 
                                    THREE.InterpolateSmooth
                                );
                                tracks.push(rotationTrack);
                                console.log(`[3D LOG] クリップ ${clipName}: Rotation Track (${times.length}キー) を追加。`);
                            }
                        } catch (e) {
                             console.error(`[3D ERROR] Rotation Track解析エラー (${clipName}): `, e);
                        }
                    }
                    
                    // --- 2. Position Trackの解析 ---
                    if (animationData.bones && animationData.bones.ball && animationData.bones.ball.position) {
                        const positionData = animationData.bones.ball.position;
                        
                        // 配列でない (つまりキーフレームオブジェクトである) 場合のみ解析
                        if (!Array.isArray(positionData)) { 
                            try {
                                const positionKeys = Object.keys(positionData);
                                const times = positionKeys.map(t => parseFloat(t) * animationData.animation_length);
                                
                                const values = [];
                                for (const timeKey of positionKeys) {
                                    const [x, y, z] = positionData[timeKey];
                                    // Bedrock JSONのpositionは通常単位が1/16ブロック。Three.jsスケールに合わせる。
                                    values.push(
                                        x / 16, 
                                        y / 16, 
                                        z / 16
                                    );
                                }
                                
                                if (times.length > 0) {
                                    const positionTrack = new THREE.VectorKeyframeTrack(
                                        '.position', 
                                        times, 
                                        values, 
                                        THREE.InterpolateSmooth
                                    );
                                    tracks.push(positionTrack);
                                    console.log(`[3D LOG] クリップ ${clipName}: Position Track (${times.length}キー) を追加。`);
                                }
                            } catch (e) {
                                 console.error(`[3D ERROR] Position Track解析エラー (${clipName}): `, e);
                            }
                        } else {
                            console.log(`[3D LOG] クリップ ${clipName}: Positionデータは単一値 ([x,y,z]) のためアニメーショントラックはスキップ。`);
                        }
                    }
                    
                    if (tracks.length > 0) {
                        const clip = new THREE.AnimationClip(clipName, animationData.animation_length, tracks);
                        allClips[clipName] = clip;
                    } else {
                        console.warn(`[3D WARN] クリップ ${clipName} は有効なトラックを含みませんでした。`);
                    }
                }
            }
            
            console.log(`[3D LOG] 最終的な有効クリップ数: ${Object.keys(allClips).length}個。`);

            // 待機アニメーション (taiki) の実行
            if (allClips['animation.taiki']) {
                mixer.stopAllAction();
                // ballMesh自体が 'ball'という名前を持つグループになったため、これがターゲットになる
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
    const bottomUi = document.getElementById('capture-container').querySelector('.bottom-ui');
    if(bottomUi) bottomUi.style.display = 'none';
}

function hideCaptureMessage() {
    const msgDiv = document.getElementById('capture-message-display');
    if(msgDiv) msgDiv.style.display = 'none';
    
    document.getElementById('target-name').style.display = 'block';
    const bottomUi = document.getElementById('capture-container').querySelector('.bottom-ui');
    if(bottomUi) bottomUi.style.display = 'flex'; 
}


// --- 3Dアニメーションループ ---
function animate3D() {
    animationId = requestAnimationFrame(animate3D);

    const delta = clock ? clock.getDelta() : 0;
    if (mixer) mixer.update(delta); 

    // ターゲットモンスターの浮遊と回転
    if (targetMesh) {
        targetMesh.rotation.y += 0.01;
        targetMesh.rotation.x += 0.005;
        targetMesh.position.y = Math.sin(Date.now() * 0.002) * 0.5;
    }

    if (isBallThrown && ballMesh) {
        // ボール投げアニメーションが適用されている場合は、この位置の変更はアニメーションによって上書きされます。
        
        // 当たり判定 (アニメーションの終了をトリガーとするか、位置で判定する)
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
