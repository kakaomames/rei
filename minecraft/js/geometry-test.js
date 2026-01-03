// geometry_test.js
(function() {
    window.MyGeometryTester = {
        // テスト実行関数
        runTest: function(jsonString) {
            console.log("--- 🕵️ Geometry JSON 偵察開始 ---");
            
            try {
                const data = JSON.parse(jsonString);
                // Minecraft Bedrock版の標準的な構造を辿る
                const geometry = data["minecraft:geometry"] || data["geometry.static"]; 
                const bones = geometry[0].bones;

                let cubeCount = 0;

                bones.forEach((bone, bIdx) => {
                    if (bone.cubes) {
                        bone.cubes.forEach((cube, cIdx) => {
                            cubeCount++;
                            
                            // 必要なデータ（起点とサイズ）を抽出
                            const origin = cube.origin;
                            const size = cube.size;

                            // 隊員への報告（ログ出力）
                            console.log(`[Cube ${cubeCount}] Name: ${bone.name || 'unknown'}`);
                            console.log(`   📍 origin: [${origin}]`);
                            console.log(`   📦 size:   [${size}]`);
                            
                            // ここで「当たり判定ライブラリ」に渡す準備ができる！
                            // print(f"cube_{cubeCount}_origin:{origin}")
                            // print(f"cube_{cubeCount}_size:{size}")
                        });
                    }
                });

                console.log(`--- ✅ 偵察完了: 合計 ${cubeCount} 個のCubeを捕捉しました ---`);
            } catch (e) {
                console.error("🚨 JSON解析エラーだ！設計図が壊れているかも！", e);
            }
        }
    };
})();
