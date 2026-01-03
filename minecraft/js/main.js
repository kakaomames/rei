// 【main.js】
async function startGravityTest() {
    RenderBridge.init();

    // 1. 地面を設置 (grass block)
    const grassData = await AddonManager.loadBlock('grass'); 
    grassData.geometry.forEach(cube => RenderBridge.createMesh(cube, grassMaterial));

    // 2. スティーブを読み込んで召喚
    const response = await fetch('RP/models/entity/steve.geometry.json');
    const steveRaw = await response.json();
    const steveCubes = GeometryCore.parse(JSON.stringify(steveRaw));
    
    PlayerPhysics.init(steveCubes, steveSkinMaterial);

    // 3. ゲームループ（毎フレーム実行）
    function loop() {
        // 地面データの配列を渡して物理演算！
        PlayerPhysics.update(grassData.geometry); 
        requestAnimationFrame(loop);
    }
    loop();
}
