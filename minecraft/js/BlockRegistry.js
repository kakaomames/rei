// BlockRegistry.js
(function() {
    window.BlockRegistry = {
        // 隊員が「よし、これを使おう！」と決めたブロックたちのリスト
        activeBlocks: [
            "grass",
            "dirt",
            "stone"
            // 新しいブロックを作ったらここに足すだけ！
        ],

        // 全ブロックをロードする命令
        loadAll: async function() {
            for (const id of this.activeBlocks) {
                await AddonManager.loadBlock(id);
                // print(f"block_registered: {id}")
            }
        }
    };
})();
