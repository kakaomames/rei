// main.js
async function startMission() {
    const statusEl = document.getElementById('status');
    
    try {
        statusEl.innerText = "Status: 3D基地を初期化中...";
        RenderBridge.init();
        console.log("RenderBridge: OK");

        statusEl.innerText = "Status: BP/RPデータを取得中...";
        // 🚩 ここでパスが正しいかチェック！
        // https://kakaomames.github.io/rei/minecraft/BP/blocks/grass.json にあるか？
        const grassBlock = await AddonManager.loadBlock('grass');
        console.log("AddonManager: OK", grassBlock);

        statusEl.innerText = "Status: スティーブを召喚中...";
        const response = await fetch('RP/models/entity/steve.geometry.json');
        if (!response.ok) throw new Error("SteveのJSONが見つかりません！");
        const steveData = await response.json();
        const steveCubes = GeometryCore.parse(JSON.stringify(steveData));
        
        // 仮のマテリアル
        const steveMat = new THREE.MeshStandardMaterial({ color: 0x00ffaa });
        PlayerPhysics.init(steveCubes, steveMat);

        statusEl.innerText = "Status: 重力テスト開始！";
        
        function animate() {
            requestAnimationFrame(animate);
            PlayerPhysics.update(grassBlock.geometry);
            RenderBridge.render();
        }
        animate();

    } catch (error) {
        console.error("作戦失敗:", error);
        statusEl.innerText = "Error: " + error.message;
        statusEl.style.color = "red";
    }
}

// 実行！
startMission();
