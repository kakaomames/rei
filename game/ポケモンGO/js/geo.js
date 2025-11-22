// js/geo.js

import * as THREE from 'https://cdnjs.cloudflare.com/ajax/libs/three.js/r128/three.module.js';

/**
 * Minecraft Bedrock Geometry JSONファイルからThree.jsのメッシュを生成する関数
 * @param {string} geometryJsonPath - Bedrock Geometry JSONファイルへのパス (例: assets/models/poke_ball.geometry.json)
 * @param {THREE.Texture} texture - 適用するテクスチャ
 * @returns {Promise<THREE.Mesh>} - 生成されたメッシュオブジェクト (グループ)
 */
export async function loadBedrockGeometry(geometryJsonPath, texture) {
    console.log(`Loading Bedrock Geometry from: ${geometryJsonPath}`);
    
    try {
        // 1. JSONファイルをフェッチ
        const response = await fetch(geometryJsonPath);
        if (!response.ok) {
            throw new Error(`Failed to fetch JSON: ${response.statusText}`);
        }
        const json = await response.json();
        
        // 2. Geometryデータの抽出
        // Bedrock JSONはトップレベルに "minecraft:geometry" 配列を持つことが多い
        const modelData = json['minecraft:geometry'][0]; 
        
        // 3. メッシュの生成
        const mesh = createMeshFromBedrockJson(modelData, texture);
        return mesh;
        
    } catch (error) {
        console.error('Error loading Bedrock Geometry:', error);
        // エラー時はフォールバックとしてダミーの立方体を返す
        const dummyGeometry = new THREE.BoxGeometry(1, 1, 1);
        const dummyMaterial = new THREE.MeshLambertMaterial({ color: 0xff0000 });
        return new THREE.Mesh(dummyGeometry, dummyMaterial);
    }
}

/**
 * Bedrock JSONデータからThree.jsのメッシュを生成する内部コア関数
 * ここにキューブの定義を THREE.BoxGeometry に変換するロジックを記述します。
 */
// js/geo.js (コアロジック部分の修正)

// ... (import文、loadBedrockGeometry関数は前回のコードでOK) ...

/**
 * Bedrock JSONデータからThree.jsのメッシュを生成するコア関数
 * @param {object} modelData - 'minecraft:geometry' の単一の要素
 * @param {THREE.Texture} texture - 適用するテクスチャ
 * @returns {THREE.Group} - 生成されたグループオブジェクト (ルートボーン)
 */
function createMeshFromBedrockJson(modelData, texture) {
    
    // 全てのキューブに適用するマテリアル
    const material = new THREE.MeshLambertMaterial({ map: texture, transparent: true }); 
    const textureWidth = modelData.description.texture_width || 64; 
    const textureHeight = modelData.description.texture_height || 64; 

    // ルートボーンを見つけるためのマップを作成
    const boneMap = new Map();
    modelData.bones.forEach(bone => {
        boneMap.set(bone.name, bone);
    });

    // 親を持たないボーン (ルートボーン) を探す
    const rootBones = modelData.bones.filter(bone => !bone.parent);

    const rootGroup = new THREE.Group();
    
    // 複数のルートボーンを処理
    rootBones.forEach(rootBone => {
        // 再帰的にボーンとキューブをThree.jsのグループに変換
        const boneGroup = processBone(rootBone, material, textureWidth, textureHeight);
        rootGroup.add(boneGroup);
    });
    
    // 最終的なスケール調整
    // このモデルでは [0, 10, 0] が中心のようで、原点に戻す調整が必要です。
    rootGroup.position.set(0, -10 * 0.1, 0); // スケールに合わせて位置を戻す
    rootGroup.scale.set(0.1, 0.1, 0.1); 
    rootGroup.rotation.x = -Math.PI / 2; // Y-up から Three.jsの標準に調整

    return rootGroup;
}


/**
 * ボーンとその子を再帰的に処理する関数
 */
function processBone(boneDef, material, textureWidth, textureHeight) {
    const boneGroup = new THREE.Group();
    boneGroup.name = boneDef.name;

    // 1. ボーンのピボット (中心座標) を設定
    // Three.jsはジオメトリの中心を原点とするため、ピボットを考慮して位置を調整します。
    if (boneDef.pivot) {
        const [pX, pY, pZ] = boneDef.pivot;
        // マインクラフトのピボットはThree.jsのローカル原点として扱います
        boneGroup.position.set(pX, pY, pZ); 
    }

    // 2. ボーンの回転を設定
    if (boneDef.rotation) {
        const [rX, rY, rZ] = boneDef.rotation;
        // Bedrockの回転角度は度数法（Degree）なので、ラジアンに変換
        boneGroup.rotation.set(
            THREE.MathUtils.degToRad(rX), 
            THREE.MathUtils.degToRad(rY), 
            THREE.MathUtils.degToRad(rZ)
        );
    }

    // 3. キューブの処理
    if (boneDef.cubes) {
        boneDef.cubes.forEach(cubeDef => {
            const cubeMesh = createCubeMesh(cubeDef, material, textureWidth, textureHeight);
            // キューブのピボットと回転が定義されている場合
            if (cubeDef.pivot || cubeDef.rotation) {
                // キューブをラップする一時グループを作成し、キューブ自体の回転とピボットを適用
                const wrapper = new THREE.Group();
                
                if (cubeDef.pivot) {
                    const [pX, pY, pZ] = cubeDef.pivot;
                    wrapper.position.set(pX, pY, pZ);
                    cubeMesh.position.set(-pX, -pY, -pZ); // ジオメトリ位置を逆補正
                }
                
                if (cubeDef.rotation) {
                    const [rX, rY, rZ] = cubeDef.rotation;
                    wrapper.rotation.set(
                        THREE.MathUtils.degToRad(rX), 
                        THREE.MathUtils.degToRad(rY), 
                        THREE.MathUtils.degToRad(rZ)
                    );
                }
                wrapper.add(cubeMesh);
                boneGroup.add(wrapper);
            } else {
                boneGroup.add(cubeMesh);
            }
        });
    }

    // 4. 子ボーンの処理
    // このモデルでは親子関係はparentフィールドで定義されているため、
    // ここでは modelData.bones を探して、parentがboneDef.nameと一致するものを再帰的に処理します。
    const childBones = modelData.bones.filter(b => b.parent === boneDef.name);
    childBones.forEach(childBone => {
        const childGroup = processBone(childBone, material, textureWidth, textureHeight);
        boneGroup.add(childGroup);
    });

    return boneGroup;
}

/**
 * 単一のキューブ定義からThree.jsのメッシュを生成する関数 (UV計算ロジックを含む)
 */
function createCubeMesh(cubeDef, material, textureWidth, textureHeight) {
    const [dimX, dimY, dimZ] = cubeDef.size;
    const [origX, origY, origZ] = cubeDef.origin;
    const [uvU, uvV] = cubeDef.uv;

    const geometry = new THREE.BoxGeometry(dimX, dimY, dimZ);
    const mesh = new THREE.Mesh(geometry, material);

    // UV座標の計算と適用 (前回の複雑なUVロジックをここに移植)
    const uvAttribute = geometry.attributes.uv;

    const calculateFaceUV = (faceIndex, w, h, d, u, v) => {
        // 
        let u_start, v_start, u_end, v_end;
        
        const TW = textureWidth;
        const TH = textureHeight;
        
        if (faceIndex === 0) { // Right (+X)
            u_start = (u + d) / TW; v_start = (v) / TH;
            u_end = (u + d + w) / TW; v_end = (v + h) / TH;
        } else if (faceIndex === 1) { // Left (-X)
            u_start = (u) / TW; v_start = (v) / TH;
            u_end = (u + d) / TW; v_end = (v + h) / TH;
        } else if (faceIndex === 2) { // Top (+Y)
            u_start = (u + d) / TW; v_start = (v + d) / TH;
            u_end = (u + d + w) / TW; v_end = (v + d + h) / TH;
        } else if (faceIndex === 3) { // Bottom (-Y)
            u_start = (u + d + w) / TW; v_start = (v + d) / TH;
            u_end = (u + d + w + w) / TW; v_end = (v + d + h) / TH;
        } else if (faceIndex === 4) { // Front (+Z)
            u_start = (u + d + w) / TW; v_start = (v + d) / TH;
            u_end = (u + d + w + w) / TW; v_end = (v + d + h) / TH;
        } else if (faceIndex === 5) { // Back (-Z)
            u_start = (u) / TW; v_start = (v + d) / TH;
            u_end = (u + w) / TW; v_end = (v + d + h) / TH;
        }

        // Three.jsのUVアレイに適用
        // 頂点0: (u_start, v_end), 頂点1: (u_end, v_end), 頂点2: (u_start, v_start), 頂点3: (u_end, v_start)
        uvAttribute.setXY(faceIndex * 4 + 0, u_start, v_end);
        uvAttribute.setXY(faceIndex * 4 + 1, u_end, v_end);
        uvAttribute.setXY(faceIndex * 4 + 2, u_start, v_start);
        uvAttribute.setXY(faceIndex * 4 + 3, u_end, v_start);
    };
    
    for (let i = 0; i < 6; i++) {
        calculateFaceUV(i, dimX, dimY, dimZ, uvU, uvV);
    }
    uvAttribute.needsUpdate = true;
    
    // キューブの位置調整 (Three.jsのBoxGeometryは中央が原点)
    mesh.position.set(
        origX + dimX / 2,
        origY + dimY / 2,
        origZ + dimZ / 2
    );
    
    return mesh;
}
