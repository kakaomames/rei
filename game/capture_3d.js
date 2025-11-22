// capture_3d.js

// Three.js 関連のグローバル変数
let scene, camera, renderer, monsterMesh;
let ballMesh, ballMixer, clock;
let currentAnimationClip;

// 定数
const BALL_SCALE_FACTOR = 6.0; // ボールのサイズを Three.js 空間で調整するための係数 (Blockbench 1/16 単位をこの値でスケール)
const TARGET_Z_POSITION = -5.0; // モンスターの Z 座標 (奥)
const BALL_START_Z_POSITION = 2.0; // ボール開始位置の Z 座標 (手元)

// Blockbench Bedrock JSON の解析と Three.js ジオメトリ構築
function buildModelFromJson(json) {
    console.log('[3D LOG] JSON: ジオメトリ構築開始。');
    
    // 1. テクスチャの読み込み
    const texture = new THREE.TextureLoader().load('./texture.png');
    texture.flipY = false; // Bedrock JSON の UV 座標は通常、Y軸を反転させる必要がある

    // ★ 変更点1: MeshStandardMaterialに変更
    // ライトの影響を受け、立体的に描画されるマテリアルを使用
    const material = new THREE.MeshStandardMaterial({ 
        map: texture, 
        side: THREE.FrontSide, 
        transparent: true,
        roughness: 0.8, // 光沢の強さ (0.0=鏡面反射, 1.0=拡散反射)
        metalness: 0.0  // 金属感 (非金属)
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
        
        // ピボットポイントは Bedrock の座標そのまま (通常は 1/16 単位ではない)
        // Three.js ではピボットは Group の position に反映される
        if (bone.pivot) {
             // 座標系変換は複雑なため、ここでは一旦ピボットの移動はスキップし、
             // アニメーションローダー（loadCacaoAnimation）に任せる
        }
        
        if (bone.cubes) {
            bone.cubes.forEach(cube => {
                
                // ★ 変更点2: Yサイズ補正 (Y=0 の場合に最小厚さ 0.1 を適用)
                const rawSizeY = cube.size[1];
                const MIN_SIZE_BB_UNIT = 0.1; // Blockbench単位 (16分の1) での最小厚さ
                
                // Yサイズが0の場合、最小厚さ 0.1 を使用する
                const compensatedSizeY = (rawSizeY === 0) ? MIN_SIZE_BB_UNIT : rawSizeY;

                // スケールファクターを適用して Three.js のサイズを計算
                const boxWidth = cube.size[0] / 16 * BALL_SCALE_FACTOR;
                const boxHeight = compensatedSizeY / 16 * BALL_SCALE_FACTOR; // ここに補正を適用
                const boxDepth = cube.size[2] / 16 * BALL_SCALE_FACTOR;
                
                // ジオメトリの生成
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
                
                // origin はキューブの中心座標を決定。Blockbenchの原点はキューブの最小X, 最小Y, 最小Z
                const offsetX = cube.origin[0] / 16 * BALL_SCALE_FACTOR + boxWidth / 2;
                const offsetY = cube.origin[1] / 16 * BALL_SCALE_FACTOR + boxHeight / 2;
                const offsetZ = cube.origin[2] / 16 * BALL_SCALE_FACTOR + boxDepth / 2;

                mesh.position.set(offsetX, offsetY, offsetZ);

                // boneGroup (親) にメッシュ (子) を追加
                boneGroup.add(mesh);
            });
        }
        
        // Blockbench座標系では、Yは上、Zは奥、Xは右
        // Three.jsはYは上、Zは手前、Xは右（右手座標系）
        // アニメーションで調整されるため、ここでは最低限の変換のみ行う
        
        // boneGroupを親モデルに追加
        modelGroup.add(boneGroup);
    });

    console.log('[3D LOG] JSON: ジオメトリ構築完了。');
    return modelGroup;
}


// アニメーション JSON を読み込み、アニメーションミキサーを設定
function loadCacaoAnimation() {
    console.log('[3D LOG] loadCacaoAnimation: アニメーションJSONのフェッチ開始。');

    // model.animation.json をフェッチ
    fetch('./model.animation.json')
        .then(response => response.json())
        .then(data => {
            console.log('[3D LOG] アニメーションJSONレスポンス受信。');
            const clipData = data['minecraft:animations'];
            
            // アニメーションミキサーを設定
            ballMixer = new THREE.AnimationMixer(ballMesh);
            console.log('[3D LOG] クリップ解析開始。');
            let validClipCount = 0;

            // アニメーションクリップを生成
            for (const key in clipData) {
                const animation = clipData[key];
                
                // BoneAnimationTrack を作成するためのキーフレームを収集
                const tracks = [];
                if (animation.bones) {
                    for (const boneName in animation.bones) {
                        const boneAnim = animation.bones[boneName];
                        const bone = ballMesh.getObjectByName(boneName);
                        
                        if (bone) {
                            if (boneAnim.position) {
                                const times = [];
                                const values = [];
                                
                                // position キーフレームを処理
                                for (const time in boneAnim.position) {
                                    times.push(parseFloat(time));
                                    const pos = boneAnim.position[time];
                                    
                                    // Z軸を Blockbench の「奥 (Z-)」から Three.js のワールド座標に合うように変換
                                    // Blockbench Z値 (1/16 単位) の移動量を Z に適用し、スケールをかける
                                    // BlockbenchのZ+が手前(Three.jsのZ+)なので、値を反転させずに適用
                                    
                                    // ⚠️ 注意: Bedrock JSONのPosition値は 1/16 単位で、そのまま移動量として使用
                                    // Blockbenchで「北側(手元)から南へ飛ぶ」ようにZ値をマイナス補正済み
                                    const factor = BALL_SCALE_FACTOR / 16;
                                    
                                    values.push(pos[0] * factor);  // X
                                    values.push(pos[1] * factor);  // Y
                                    values.push(pos[2] * factor);  // Z (すでに負の方向に補正済み)
                                }
                                
                                if (times.length > 1 || (times.length === 1 && (boneAnim.position["0.0"] && boneAnim.position["0.0"].length === 3))) {
                                    // Positionトラック
                                    const track = new THREE.VectorKeyframeTrack(
                                        `${boneName}.position`, times, values
                                    );
                                    tracks.push(track);
                                    console.log(`[3D LOG] クリップ ${key}: Position Track (${times.length}キー) を追加。`);
                                } else {
                                    console.log(`[3D LOG] クリップ ${key}: Positionデータは単一値 ([x,y,z]) のためアニメーショントラックはスキップ。`);
                                }
                            }

                            if (boneAnim.rotation) {
                                const times = [];
                                const values = [];
                                
                                for (const time in boneAnim.rotation) {
                                    times.push(parseFloat(time));
                                    const rot = boneAnim.rotation[time];
                                    
                                    // 度数をラジアンに変換
                                    const radX = THREE.MathUtils.degToRad(rot[0]);
                                    const radY = THREE.MathUtils.degToRad(rot[1]);
                                    const radZ = THREE.MathUtils.degToRad(rot[2]);

                                    // Three.js の Quaternion に変換 (順序は ZYX を仮定)
                                    const quaternion = new THREE.Quaternion().setFromEuler(
                                        new THREE.Euler(radX, radY, radZ, 'ZYX')
                                    );
                                    
                                    values.push(quaternion.x, quaternion.y, quaternion.z, quaternion.w);
                                }
                                
                                if (times.length > 1) {
                                    // Rotationトラック
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
                    ballMixer.clipAction(clip).setLoop(THREE.LoopOnce, 0); // 基本は1回再生
                    validClipCount++;

                    // 待機アニメーションを自動で再生
                    if (key === 'animation.taiki') {
                        currentAnimationClip = ballMixer.clipAction(clip);
                        currentAnimationClip.setDuration(animation.animation_length);
                        currentAnimationClip.setEffectiveTimeScale(0.2); // ★ 修正点3: 待機アニメーションを遅くする
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
    console.log('[LOG] [3D LOG] ボール投げボタンクリック！');

    // 待機アニメーションを停止
    if (currentAnimationClip) {
        currentAnimationClip.stop();
    }

    // 投げるアニメーションを取得
    const throwClip = ballMixer.existingAction('animation.nageru-curb'); 
    
    if (throwClip) {
        // Z軸の位置を初期位置にリセット
        ballMesh.position.set(0, -0.5, BALL_START_Z_POSITION);
        
        throwClip.reset();
        throwClip.setLoop(THREE.LoopOnce);
        throwClip.setEffectiveTimeScale(1.0); // 速度は通常に戻す
        throwClip.clampWhenFinished = true; // 最後のフレームで停止
        throwClip.play();
        currentAnimationClip = throwClip;

        console.log('[LOG] [3D LOG] animation.nageru-curb を適用し再生開始。');

        // アニメーション完了後に捕獲判定
        ballMixer.addEventListener('finished', (e) => {
            if (e.action === throwClip) {
                console.log('[LOG] [3D LOG] ボールがターゲット位置に到達しました。');
                
                // 簡易的な捕獲判定（ここでは常に成功とする）
                if (Math.random() < 1) { 
                    console.log('[LOG] [3D LOG] 捕獲判定: 成功。');
                    
                    // 成功後のアニメーション (ここでは 'animation.hokaku')
                    const successClip = ballMixer.existingAction('animation.hokaku');
                    if (successClip) {
                         successClip.reset();
                         successClip.setLoop(THREE.LoopOnce);
                         successClip.clampWhenFinished = true;
                         successClip.play();
                    }
                }

                // 3秒後にマップ画面へ自動復帰するログ
                console.log('[LOG] [3D LOG] 3秒後: マップ画面へ自動復帰。');
            }
        });
    } else {
        console.error('[ERROR] アニメーション clip.nageru-curb が見つかりません。');
    }
}


// 3D 環境の初期化
function init3D() {
    // 1. シーンの作成
    scene = new THREE.Scene();
    console.log('[LOG] [3D LOG] 3d. THREE.Scene作成成功。');
    
    // 2. カメラの作成 (視野角, アスペクト比, near, far)
    const container = document.getElementById('threejs-container');
    if (!container) {
        console.error('[ERROR] DOM要素 #threejs-container が見つかりません。');
        return;
    }
    console.log('[LOG] [3D LOG] 3b. コンテナ要素の取得OK。');

    const aspectRatio = container.clientWidth / container.clientHeight;
    camera = new THREE.PerspectiveCamera(75, aspectRatio, 0.1, 1000);
    // カメラはボールのやや後ろ、プレイヤーの視点に配置
    camera.position.set(0, 3, BALL_START_Z_POSITION + 1.5); // (X, Y, Z)
    camera.lookAt(0, 0, 0);

    // 3. レンダラーの作成
    renderer = new THREE.WebGLRenderer({ antialias: true, alpha: true }); // alpha: trueで背景を透明にする
    renderer.setSize(container.clientWidth, container.clientHeight);
    container.appendChild(renderer.domElement);
    console.log('[LOG] [3D LOG] 3e. レンダラーをDOMに追加しました。');
    
    // ★ 変更点4: MeshStandardMaterialが機能するためにライトを追加
    function addLight() {
        // 環境光 (全体を柔らかく照らす)
        const ambientLight = new THREE.AmbientLight(0xffffff, 1.0); 
        scene.add(ambientLight);

        // 平行光源 (太陽のように影を作る主光源)
        const directionalLight = new THREE.DirectionalLight(0xffffff, 1.5); 
        directionalLight.position.set(5, 10, 5); // 光源の位置
        scene.add(directionalLight);
    }
    addLight();

    // 4. モンスターの配置 (仮の球体)
    const monsterGeometry = new THREE.SphereGeometry(1.5, 32, 32); 
    const monsterMaterial = new THREE.MeshBasicMaterial({ color: 0xff0000, wireframe: true });
    monsterMesh = new THREE.Mesh(monsterGeometry, monsterMaterial);
    monsterMesh.position.set(0, -0.5, TARGET_Z_POSITION); // Z=-5 の位置に配置
    scene.add(monsterMesh);
    console.log('[LOG] [3D LOG] 5. ターゲットのモンスター（球体）をシーンに追加しました。');

    // 5. アニメーションクロックを初期化
    clock = new THREE.Clock();
    
    console.log('[LOG] [3D LOG] 3z. init3D: 3D初期化完了。');
}


// ボールモデルのロードとアニメーションの開始
function loadCacaoBall() {
    console.log('[LOG] [3D LOG] loadCacaoBall: Bedrock JSONのロード処理開始。');
    
    // ball.geo.json をフェッチ
    fetch('./ball.geo.json')
        .then(response => response.json())
        .then(data => {
            console.log('[LOG] [3D LOG] JSON: ball.geo.json ロード成功。');
            
            // モデルを構築
            ballMesh = buildModelFromJson(data);
            
            // モデルの位置を設定
            ballMesh.position.set(0, -0.5, BALL_START_Z_POSITION);
            scene.add(ballMesh);
            console.log('[LOG] [3D LOG] JSON: ボールをシーンに追加しました。');
            
            // アニメーションをロード
            loadCacaoAnimation();
            
            // レンダリングループを開始
            animate();
        })
        .catch(error => console.error('[ERROR] ジオメトリJSONのロードエラー:', error));
}


// レンダリングループ
function animate() {
    requestAnimationFrame(animate);

    // アニメーションミキサーの更新
    if (ballMixer) {
        const delta = clock.getDelta();
        ballMixer.update(delta);
    }

    renderer.render(scene, camera);
}


// ページロード時とボタンクリックのイベントリスナー設定 (環境依存のため、ここではロジックのみ)

// THREE.js が読み込まれていることを確認してから初期化を開始
if (typeof THREE !== 'undefined') {
    init3D();
    loadCacaoBall();
} else {
    console.error('[ERROR] THREE.js ライブラリがロードされていません。');
}

// 投げるボタンのダミーイベント（実際のHTML構造に合わせて調整してください）
// document.getElementById('throw-button').addEventListener('click', throwBall);
