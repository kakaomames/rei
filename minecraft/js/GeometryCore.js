// GeometryCore.js
(function() {
    window.GeometryCore = {
        // JSONを解析して「使いやすい箱のリスト」を生成する関数
        parse: function(jsonString) {
            const data = JSON.parse(jsonString);
            const geometry = data["minecraft:geometry"] || data["geometry.static"];
            const bones = geometry[0].bones;
            
            let allCubes = [];

            bones.forEach(bone => {
                if (bone.cubes) {
                    bone.cubes.forEach(cube => {
                        // 必要な情報だけを抽出して整形
                        allCubes.push({
                            boneName: bone.name,
                            origin: cube.origin, // [x, y, z]
                            size: cube.size,     // [w, h, d]
                            uv: cube.uv          // 面ごとのUVデータ
                        });
                    });
                }
            });

            // 隊長への報告
            console.log(`GeometryCore: ${allCubes.length}個のパーツを格納完了！📦`);
            return allCubes; // これを返り値にするのがポイント！
        }
    };
})();
