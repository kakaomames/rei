// collision_lib.js
(function() {
    // 基地の内部に判定機能を隠す
    const CollisionSystem = {
        check: function(playerPos, boxOrigin, boxSize) {
            const hit = playerPos.x >= boxOrigin[0] && playerPos.x <= boxOrigin[0] + boxSize[0] &&
                        playerPos.y >= boxOrigin[1] && playerPos.y <= boxOrigin[1] + boxSize[1] &&
                        playerPos.z >= boxOrigin[2] && playerPos.z <= boxOrigin[2] + boxSize[2];
            
            // 隊長への報告（デバッグログ）
            // console.log(`hit_check: ${hit}`);
            return hit;
        }
    };

    // グローバル（window）に公開！これでどこからでも使える！
    window.MyCollisionLib = CollisionSystem;
    console.log("Collision Library Loaded! 🚀");
})();
