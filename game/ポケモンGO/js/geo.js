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
function createMeshFromBedrockJson(modelData, texture) {
    // Bedrock Geometryのパーツを格納するグループ
    const group = new THREE.Group();
    
    // 全てのキューブに適用するマテリアル
    const material = new THREE.MeshLambertMaterial({ map: texture, transparent: true }); 
    
    // Geometryのボーン/パーツ (cubes) を解析
    modelData.bones.forEach(bone => {
        // ボーンがキューブを持つ場合
        if (bone.cubes) {
            bone.cubes.forEach(cubeDef => {
                
                // --- Bedrock Geometry の Cube 定義を Three.js の BoxGeometry に変換 ---
                
                // 1. サイズ (dimensions) と原点 (origin)
                const [dimX, dimY, dimZ] = cubeDef.size;
                const [origX, origY, origZ] = cubeDef.origin;

                // 2. BoxGeometryの作成
                const geometry = new THREE.BoxGeometry(dimX, dimY, dimZ);
                
                // 3. UV座標の適用
                // ここで最も複雑なテクスチャマッピング (UV) の計算が入ります。
                // Bedrock JSONの "uv" 配列 ([u, v]) を Three.js の UVマップに変換します。
                // *注: UVマッピングは非常に複雑なため、今回はThree.jsの標準UVを仮に使います。
                // 実際の変換には、BedrockのUVを計算し直す詳細なロジックが必要です。
                
                // 4. キューブの位置調整
                const mesh = new THREE.Mesh(geometry, material);
                
                // Bedrockの原点とサイズからThree.jsでの中央位置を計算
                // (原点 + サイズ/2) が Three.jsでの中心座標になります
                mesh.position.set(
                    origX + dimX / 2,
                    origY + dimY / 2,
                    origZ + dimZ / 2
                );

                // Three.jsはY軸が上向き、BedrockもY軸が上向きですが、
                // マインクラフトの座標系はThree.jsと異なり、スケールや回転の調整が必要です。
                // 例: マインクラフトの 1 unit は Three.jsの 1 unit とは限らない。
                
                group.add(mesh);
            });
        }
        
        // *注: ボーンの回転 ('rotation') や親ボーンとの関連付けは、Three.jsのボーン構造（Skeleton）に変換する必要がありますが、今回は省略します。
    });
    
    // スケールを調整 (マインクラフトのモデルは通常非常に大きく、Y軸を反転させる調整が必要な場合が多い)
    group.scale.set(0.01, 0.01, 0.01); // 大きすぎる場合は縮小
    group.rotation.x = -Math.PI / 2; // Y-up から Z-front に調整が必要な場合
    
    return group;
}
