// PlayerController.js
(function() {
    window.PlayerController = {
        position: { x: 0, y: 10, z: 0 }, // 最初は空中にスポーン！
        velocity: { y: 0 },
        gravity: -0.01, // 重力の強さ
        isGrounded: false,

        update: function(blocks) {
            // 1. 重力を適用
            this.velocity.y += this.gravity;
            this.position.y += this.velocity.y;
            print(f"player_y:{this.position.y}");

            // 2. 地面との当たり判定（簡易版）
            this.isGrounded = false;
            blocks.forEach(block => {
                // ここで GeometryCore のデータと照合！
                if (this.checkCollision(this.position, block)) {
                    this.position.y = block.origin[1] + block.size[1]; // 上に乗る
                    this.velocity.y = 0;
                    this.isGrounded = true;
                }
            });
        },

        checkCollision: function(pos, block) {
            // プレイヤーの足元がブロックの範囲内か判定するロジック
            return pos.x >= block.origin[0] && pos.x <= block.origin[0] + block.size[0] &&
                   pos.y >= block.origin[1] && pos.y <= block.origin[1] + block.size[1] &&
                   pos.z >= block.origin[2] && pos.z <= block.origin[2] + block.size[2];
        }
    };
})();
