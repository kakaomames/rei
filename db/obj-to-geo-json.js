// obj-to-geo-json.js

/**
 * OBJファイルのテキストデータを解析し、簡略化されたMinecraftジオメトリJSON（の元となるデータ）に変換します。
 * * @param {string} objText - OBJファイルの内容（文字列）
 * @returns {{vertices: number[][], indices: number[]}} 変換されたデータ
 */
export function convertObjToGeoData(objText) {
    const lines = objText.split('\n');
    const vertices = []; // 頂点座標 [ [x, y, z], ... ]
    const faces = [];    // 面データ [ [v1, v2, v3], ... ]

    let vertexCount = 0;
    let faceCount = 0;

    // 1. OBJデータをパース
    for (const line of lines) {
        // スペースや複数の空白文字で分割
        const parts = line.trim().split(/\s+/); 

        if (parts.length === 0) continue;

        const type = parts[0];
        
        // 頂点データ (v x y z)
        if (type === 'v' && parts.length >= 4) {
            // OBJの座標を読み込み
            const x = parseFloat(parts[1]);
            const y = parseFloat(parts[2]);
            const z = parseFloat(parts[3]);

            if (!isNaN(x) && !isNaN(y) && !isNaN(z)) {
                // 頂点座標を格納
                vertices.push([x, y, z]);
                vertexCount++;
            } else {
                // 不正な値の警告ログ
                console.warn(`[WARN] Invalid vertex data found: ${line}`);
            }
        } 
        
        // 面データ (f v1/vt1/vn1 v2/vt2/vn2 v3/vt3/vn3 ...)
        else if (type === 'f' && parts.length >= 4) {
            const face = [];
            
            // parts[1]から頂点インデックスを取得
            for (let i = 1; i < parts.length; i++) {
                // スラッシュで区切られた部分から頂点インデックスのみを取得
                const vertexIndexStr = parts[i].split('/')[0];
                const index = parseInt(vertexIndexStr, 10);

                if (!isNaN(index)) {
                    // OBJのインデックスは1から始まるため、0から始まるように調整
                    face.push(index - 1); 
                }
            }
            
            // 四角形以上の面（N-gons）を三角形に変換（ここでは簡易的に最初の3頂点のみ使用）
            if (face.length >= 3) {
                 faces.push(face.slice(0, 3)); // 最初の3点を使って三角形を構成
                 faceCount++;
            }
        }
    }
    
    // 2. ジオメトリJSONの形式に必要なインデックス配列を作成
    
    // OBJの面(faces)は頂点のインデックスの配列 [ [i1, i2, i3], [i4, i5, i6], ... ]
    // indicesはそれらを平坦化した一次元配列 [i1, i2, i3, i4, i5, i6, ...]
    const indices = []; 
    faces.forEach(face => {
        // 面のインデックスを順番に追加
        indices.push(face[0], face[1], face[2]);
    });


    console.log(`[INFO] OBJ解析完了。頂点数: ${vertexCount}, 面数: ${faceCount}`);
    
    return {
        // 頂点データ (二次元配列)
        vertices: vertices, 
        // インデックスデータ (一次元配列)
        indices: indices 
    };
}


/**
 * 変換されたデータとモデルIDを使って、統合版ジオメトリJSONを生成します。
 * * @param {object} geoData - convertObjToGeoDataから返されたデータ
 * @param {string} modelId - モデルの識別子（例: 'my_model'）
 * @returns {string} 統合版ジオメトリJSON形式の文字列
 */
export function generateMinecraftGeoJson(geoData, modelId) {
    const identifierId = modelId; 
    
    const geoJson = {
        "format_version": "1.12.0",
        "minecraft:geometry": [
            {
                "description": {
                    // ユーザー指定の形式 "geometry.${id}" に合わせた識別子
                    "identifier": `geometry.${identifierId}`, 
                    "texture_width": 64, // テクスチャサイズ（デフォルト値）
                    "texture_height": 64,
                    "visible_bounds_width": 2,
                    "visible_bounds_height": 2,
                    "visible_bounds_offset": [0.0, 1.0, 0.0]
                },
                "bones": [
                    {
                        "name": "root",
                        "pivot": [0, 0, 0],
                        "cubes": [], // キューブは使用せず、カスタムジオメトリデータを使用
                        "geometry_data": { 
                            "positions": geoData.vertices, // 抽出した頂点データを格納
                            "normals": [], // 法線データはOBJから正確に抽出していないため空
                            "uvs": [], // UVデータ（テクスチャ座標）はOBJから抽出していないため空
                            "indices": geoData.indices // 抽出したインデックスデータを格納
                        }
                    }
                ]
            }
        ]
    };
    
    // JSON文字列に整形して出力（バックスラッシュはそのまま残る形式）
    return JSON.stringify(geoJson, null, 2);
}
