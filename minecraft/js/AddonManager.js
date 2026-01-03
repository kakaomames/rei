// AddonManager.js
(function() {
    window.AddonManager = {
        // ブロックID（例: "grass"）を渡すと、BPとRPを両方読み込む
        loadBlock: async function(blockId) {
            console.log(`--- 📦 Block [${blockId}] のロード開始 ---`);

            // 1. BPから設定を読み込む（破壊耐性とか）
            const bpResponse = await fetch(`BP/blocks/${blockId}.json`);
            const bpData = await bpResponse.json();

            // 2. RPからモデル(Geometry)を読み込む
            const modelName = bpData["minecraft:block"].description.identifier;
            const rpResponse = await fetch(`RP/models/${modelName}.json`);
            const rpData = await rpResponse.json();

            // 3. データを整理して返す
            return {
                id: blockId,
                settings: bpData,
                geometry: GeometryCore.parse(JSON.stringify(rpData)), // ここで前の部隊と連携！
                textures: bpData["minecraft:block"].components["minecraft:material_instances"] 
                          // ↑本当のマイクラBPはここに画像名が書いてあることが多いです
            };
        }
    };
    console.log("AddonManager: 配備完了！📂");
})();
