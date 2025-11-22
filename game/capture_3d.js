// capture_3d.js

// Three.js 関連のグローバル変数
let scene, camera, renderer, monsterMesh;
let ballMesh, ballMixer, clock;
let currentAnimationClip;

// 定数
const BALL_SCALE_FACTOR = 6.0; // ボールのサイズを Three.js 空間で調整するための係数
const TARGET_Z_POSITION = -5.0; // モンスターの Z 座標 (奥)
const BALL_START_Z_POSITION = 2.0; // ボール開始位置の Z 座標 (手元)

// Blockbench Bedrock JSON の解析と Three.js ジオメトリ構築
function buildModelFromJson(json) {
    console.log('[3D LOG] JSON: ジオメトリ構築開始。');
    
    // 1. テクスチャの読み込み
    const texture = new THREE.TextureLoader().load('./texture.png');
    texture.flipY = false;

    // MeshStandardMaterialに変更
    const material = new THREE.MeshStandardMaterial({ 
        map: texture, 
        side: THREE.FrontSide, 
        transparent: true,
        roughness: 0.8, 
        metalness: 0.0  
    });

    // JSONのtexture_widthとtexture_heightを取得
    const textureWidth = json['minecraft:geometry'][0].description.texture_width;
    const textureHeight = json['minecraft:geometry'][0].description.texture_height;

    // ジオメトリ全体を保持する親グループ（アニメーションターゲット "ball" になる）
    const modelGroup = new THREE.Group();
    modelGroup.name = 'ball'; 

    const bones = json['minecraft:geometry'][0].bones;
    
    // 全てのボーンを処理
    bones.forEach(bone => {
        const boneGroup = new THREE.Group();
        boneGroup.name = bone.name;

        if (bone.cubes) {
            bone.cubes.forEach(cube => {
                
                // Yサイズ補正 (Y=0 の場合に最小厚さ 0.1 を適用)
                const rawSizeY = cube.size[1];
                const MIN_SIZE_BB_UNIT = 0.1; 
                
                const compensatedSizeY = (rawSizeY === 0) ? MIN_SIZE_BB_UNIT : rawSizeY;

                // スケールファクターを適用して Three.js のサイズを計算
                const boxWidth = cube.size[0] / 16 * BALL_SCALE_FACTOR;
                const boxHeight = compensatedSizeY / 16 * BALL_SCALE_FACTOR; 
                const boxDepth = cube.size[2] / 16 * BALL_SCALE_FACTOR;
                
                const geometry = new THREE.BoxGeometry(boxWidth, boxHeight, boxDepth);
                
                // UV マッピング (Blockbench 座標系から Three.js 座標系へ変換)
                const uvMap = cube.uv;
                if (uvMap) {
                    const u = uvMap[0];
                    const v = uvMap[1];
                    const w = cube.size[0];
                    const h = cube.size[1];
                    const d = cube.size[2];

                    const uvData = [
                        // 右面: +X
                        new THREE.Vector2((u + d) / textureWidth, 1 - (v + h) / textureHeight),
                        new THREE.Vector2((u + d + w) / textureWidth, 1 - (v + h) / textureHeight),
                        new THREE.Vector2((u + d + w) / textureWidth, 1 - v / textureHeight),
                        new THREE.Vector2((u + d) / textureWidth, 1 - v / textureHeight),
                        // 左面: -X
                        new THREE.Vector2((u + d + w + d) / textureWidth, 1 - (v + h) / textureHeight),
                        new THREE.Vector2((u + d + w) / textureWidth, 1 - (v + h) / textureHeight),
                        new THREE.Vector2((u + d + w) / textureWidth, 1 - v / textureHeight),
                        new THREE.Vector2((u + d + w + d) / textureWidth, 1 - v / textureHeight),
                        // 上面: +Y
                        new THREE.Vector2(u / textureWidth, 1 - (v + d) / textureHeight),
                        new THREE.Vector2((u + w) / textureWidth, 1 - (v + d) / textureHeight),
                        new THREE.Vector2((u + w) / textureWidth, 1 - v / textureHeight),
                        new THREE.Vector2(u / textureWidth, 1 - v / textureHeight),
                        // 下面: -Y
                        new THREE.Vector2((u + w) / textureWidth, 1 - (v + d) / textureHeight),
                        new THREE.Vector2((u + w + w) / textureWidth, 1 - (v + d) / textureHeight),
                        new THREE.Vector2((u + w + w) / textureWidth, 1 - v / textureHeight),
                        new THREE.Vector2((u + w) / textureWidth, 1 - v / textureHeight),
                        // 前面: +Z
                        new THREE.Vector2((u + d) / textureWidth, 1 - (v + h) / textureHeight),
                        new THREE.Vector2((u + d + w) / textureWidth, 1 - (v + h) / textureHeight),
                        new THREE.Vector2((u + d + w) / textureWidth, 1 - v / textureHeight),
                        new THREE.Vector2((u + d) / textureWidth, 1 - v / textureHeight),
                        // 背面: -Z
                        new THREE.Vector2((u + d + w + d) / textureWidth, 1 - (v + h) / textureHeight),
                        new THREE.Vector2((u + d + w + d + w) / textureWidth, 1 - (v + h) / textureHeight),
                        new THREE.Vector2((u + d + w + d + w) / textureWidth, 1 - v / textureHeight),
                        new THREE.Vector2((u + d + w + d) / textureWidth, 1 - v / textureHeight),
                    ];

                    geometry.attributes.uv.set(uvData.flatMap(v => [v.x, v.y]));
                }
                
                // メッシュの作成と位置調整
                const mesh = new THREE.Mesh(geometry, material);
                
                // origin はキューブの中心座標を決定
                const offsetX = cube.origin[0] / 16 * BALL_SCALE_FACTOR + boxWidth / 2;
                const offsetY = cube.origin[1] / 16 * BALL_SCALE_FACTOR + boxHeight / 2;
                const offsetZ = cube.origin[2] / 16 * BALL_SCALE_FACTOR + boxDepth / 2;

                mesh.position.set(offsetX, offsetY, offsetZ);

                // boneGroup (親) にメッシュ (子) を追加
                boneGroup.add(mesh);
            });
        }
        
        // boneGroupを親モデルに追加
        modelGroup.add(boneGroup);
    });

    console.log('[3D LOG] JSON: ジオメトリ構築完了。');
    return modelGroup;
}


// アニメーション JSON を読み込み、アニメーションミキサーを設定
function loadCacaoAnimation(animPath) { // パスを引数で受け取る
    console.log(`[3D LOG] loadCacaoAnimation: アニメーションJSON (${animPath}) のフェッチ開始。`);

    fetch(animPath) // 引数のパスを使用
        .then(response => response.json())
        .then(data => {
            console.log('[3D LOG] アニメーションJSONレスポンス受信。');
            const clipData = data['minecraft:animations'];
            
            ballMixer = new THREE.AnimationMixer(ballMesh);
            console.log('[3D LOG] クリップ解析開始。');
            let validClipCount = 0;

            for (const key in clipData) {
                const animation = clipData[key];
                
                const tracks = [];
                if (animation.bones) {
                    for (const boneName in animation.bones) {
                        const boneAnim = animation.bones[boneName];
                        const bone = ballMesh.getObjectByName(boneName);
                        
                        if (bone) {
                            if (boneAnim.position) {
                                const times = [];
                                const values = [];
                                
                                for (const time in boneAnim.position) {
                                    times.push(parseFloat(time));
                                    const pos = boneAnim.position[time];
                                    
                                    const factor = BALL_SCALE_FACTOR / 16;
                                    
                                    values.push(pos[0] * factor);  // X
                                    values.push(pos[1] * factor);  // Y
                                    values.push(pos[2] * factor);  // Z 
                                }
                                
                                if (times.length > 1 || (times.length === 1 && (boneAnim.position["0.0"] && boneAnim.position["0.0"].length === 3))) {
                                    const track = new THREE.VectorKeyframeTrack(
                                        `${boneName}.position`, times, values
                                    );
                                    tracks.push(track);
                                    console.log(`[3D LOG] クリップ ${key}: Position Track (${times.length}キー) を追加。`);
                                }
                            }

                            if (boneAnim.rotation) {
                                const times = [];
                                const values = [];
                                
                                for (const time in boneAnim.rotation) {
                                    times.push(parseFloat(time));
                                    const rot = boneAnim.rotation[time];
                                    
                                    const radX = THREE.MathUtils.degToRad(rot[0]);
                                    const radY = THREE.MathUtils.degToRad(rot[1]);
                                    const radZ = THREE.MathUtils.degToRad(rot[2]);

                                    const quaternion = new THREE.Quaternion().setFromEuler(
                                        new THREE.Euler(radX, radY, radZ, 'ZYX')
                                    );
                                    
                                    values.push(quaternion.x, quaternion.y, quaternion.z, quaternion.w);
                                }
                                
                                if (times.length > 1) {
                                    const track = new THREE.QuaternionKeyframeTrack(
                                        `${boneName}.quaternion`, times, values
                                    );
                                    tracks.push(track);
                                    console.log(`[3D LOG] クリップ ${key}: Rotation Track (${times.length}キー) を追加。`);
                                }
                            }
                        }
                    }
                }

                if (tracks.length > 0) {
                    const clip = new THREE.AnimationClip(key, animation.animation_length, tracks);
                    ballMixer.clipAction(clip).setLoop(THREE.LoopOnce, 0); 
                    validClipCount++;

                    // 待機アニメーションを自動で再生
                    if (key === 'animation.taiki') {
                        currentAnimationClip = ballMixer.clipAction(clip);
                        currentAnimationClip.setDuration(animation.animation_length);
                        currentAnimationClip.setEffectiveTimeScale(0.2); // 待機アニメーションを遅くする
                        currentAnimationClip.play();
                        console.log(`[LOG] [3D LOG] animation.taiki をボールに適用し再生開始 (速度: 0.2)。`);
                    }
                }
            }
            console.log(`[LOG] [3D LOG] 最終的な有効クリップ数: ${validClipCount}個。`);
        })
        .catch(error => console.error('[ERROR] アニメーションJSONのロードエラー:', error));
}


// ボールを投げるアニメーションを開始
function throwBall() {
    console.log('[LOG] [3D LOG] ボール投げ関数呼び出し！');

    if (ballMixer) {
        if (currentAnimationClip) {
            currentAnimationClip.stop();
        }

        const throwClip = ballMixer.existingAction('animation.nageru-curb'); 
        
        if (throwClip) {
            ballMesh.position.set(0, -0.5, BALL_START_Z_POSITION);
            
            throwClip.reset();
            throwClip.setLoop(THREE.LoopOnce);
            throwClip.setEffectiveTimeScale(1.0); 
            throwClip.clampWhenFinished = true; 
            throwClip.play();
            currentAnimationClip = throwClip;

            console.log('[LOG] [3D LOG] animation.nageru-curb を適用し再生開始。');

            ballMixer.addEventListener('finished', (e) => {
                if (e.action === throwClip) {
                    console.log('[LOG] [3D LOG] ボールがターゲット位置に到達しました。');
                    
                    if (Math.random() < 1) { 
                        console.log('[LOG] [3D LOG] 捕獲判定: 成功。');
                        
                        const successClip = ballMixer.existingAction('animation.hokaku');
                        if (successClip) {
                            successClip.reset();
                            successClip.setLoop(THREE.LoopOnce);
                            successClip.clampWhenFinished = true;
                            successClip.play();
                        }
                    }

                    console.log('[LOG] [3D LOG] 3秒後: マップ画面へ自動復帰。');
                }
            });
        } else {
            console.error('[ERROR] アニメーション clip.nageru-curb が見つかりません。');
        }
    } else {
        console.error('[ERROR] [throwBall] ballMixerが未定義です。startCapture()が実行されていません。');
    }
}


// 3D 環境の初期化
function init3D() {
    scene = new THREE.Scene();
    console.log('[LOG] [3D LOG] 3d. THREE.Scene作成成功。');
    
    const container = document.getElementById('threejs-container');
    if (!container) {
        console.error('[ERROR] DOM要素 #threejs-container が見つかりません。');
        return; 
    }
    console.log('[LOG] [3D LOG] 3b. コンテナ要素の取得OK。');

    const aspectRatio = container.clientWidth / container.clientHeight;
    camera = new THREE.PerspectiveCamera(75, aspectRatio, 0.1, 1000);
    camera.position.set(0, 3, BALL_START_Z_POSITION + 1.5);
    camera.lookAt(0, 0, 0);

    renderer = new THREE.WebGLRenderer({ antialias: true, alpha: true });
    renderer.setSize(container.clientWidth, container.clientHeight);
    if (!container.querySelector('canvas')) {
         container.appendChild(renderer.domElement);
    }
    console.log('[LOG] [3D LOG] 3e. レンダラーをDOMに追加しました。');
    
    function addLight() {
        const ambientLight = new THREE.AmbientLight(0xffffff, 1.0); 
        scene.add(ambientLight);

        const directionalLight = new THREE.DirectionalLight(0xffffff, 1.5); 
        directionalLight.position.set(5, 10, 5);
        scene.add(directionalLight);
    }
    addLight();

    // モンスターの配置 (仮の球体)
    const monsterGeometry = new THREE.SphereGeometry(1.5, 32, 32); 
    const monsterMaterial = new THREE.MeshBasicMaterial({ color: 0xff0000, wireframe: true });
    monsterMesh = new THREE.Mesh(monsterGeometry, monsterMaterial);
    monsterMesh.position.set(0, -0.5, TARGET_Z_POSITION);
    scene.add(monsterMesh);
    console.log('[LOG] [3D LOG] 5. ターゲットのモンスター（球体）をシーンに追加しました。');

    clock = new THREE.Clock();
    
    console.log('[LOG] [3D LOG] 3z. init3D: 3D初期化完了。');
}


// ボールモデルのロードとアニメーションの開始
function loadCacaoBall(geoPath, animPath) { // パスを引数で受け取る
    console.log(`[LOG] [3D LOG] loadCacaoBall: GeoJSON (${geoPath}) のロード処理開始。`);
    
    fetch(geoPath) // 引数のGeoJSONパスを使用
        .then(response => response.json())
        .then(data => {
            console.log(`[LOG] [3D LOG] JSON: ${geoPath} ロード成功。`);
            
            ballMesh = buildModelFromJson(data);
            
            ballMesh.position.set(0, -0.5, BALL_START_Z_POSITION);
            scene.add(ballMesh);
            console.log('[LOG] [3D LOG] JSON: ボールをシーンに追加しました。');
            
            loadCacaoAnimation(animPath); // AnimationJSONパスを渡す
            
            animate();
        })
        .catch(error => console.error('[ERROR] ジオメトリJSONのロードエラー:', error));
}


// 外部（HTML）から呼ばれるエントリポイント
/**
 * 捕獲シーン（3Dビュー）の初期化を開始する関数。
 * HTMLのクリックイベントなどから呼び出されます。
 * @param {object} monsterData - 捕獲対象のモンスター情報を含むデータオブジェクト。
 */
function startCapture(monsterData) { // monsterDataを引数で受け取る
    console.log('[LOG] [3D LOG] startCapture() 呼び出し: 3Dシーンの初期化を開始します。');
    
    if (typeof THREE === 'undefined') {
        console.error('[ERROR] THREE.js ライブラリがロードされていません。初期化をスキップします。');
        return;
    }

    init3D();
    
    const container = document.getElementById('threejs-container');
    if (container) {
        
        // monsterDataからパスを抽出し、ない場合はデフォルト値を使用
        // GeoJSONのデフォルトパスは、以前の会話の流れから 'model.geo.json' とします。
        const geoPath = monsterData?.ball_model_paths?.geo_json || './model.geo.json'; 
        const animPath = monsterData?.ball_model_paths?.animation_json || './model.animation.json';

        console.log(`[LOG] [3D LOG] ロードパス: GeoJSON=${geoPath}, AnimationJSON=${animPath}`);
        
        loadCacaoBall(geoPath, animPath);
    } else {
        // init3Dで既にログ出力されていますが、再度注意喚起
        console.warn('[WARNING] #threejs-container が見つからなかったため、3D描画はスキップされました。');
    }
}

// グローバル公開
window.throwBall = throwBall; 
window.startCapture = startCapture;
