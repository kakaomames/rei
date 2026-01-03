// 【main.js】
RenderBridge.init();

// 1. assets/textures/にあるファイル名を指定するだけ！
const grassMaterial = RenderBridge.createBlockMaterial('grass_side.png');

// 2. GeometryCoreで解析済みのデータを使う
const cubes = GeometryCore.parse(sampleJson);

// 3. 召喚！
cubes.forEach(cube => {
    RenderBridge.createMesh(cube, grassMaterial);
});
