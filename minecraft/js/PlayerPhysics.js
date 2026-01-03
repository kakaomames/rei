// PlayerPhysics.js
(function() {
    window.PlayerPhysics = {
        pos: { x: 0, y: 30, z: 0 }, // 高いところからスタート！
        velY: 0,
        gravity: -0.05,
        terminalVelocity: -1.0, // 落下速度の限界
        
        // スティーブのメッシュを保持
        meshGroup: new THREE.Group(),

        init: function(steveCubes, material) {
            // GeometryCoreで解析したスティーブのパーツを組み立てる
            steveCubes.forEach(cube => {
                const geometry = new THREE.BoxGeometry(cube.size[0], cube.size[1], cube.size[2]);
                const mesh = new THREE.Mesh(geometry, material);
                
                // pivotを考慮せずにまずは配置（簡易版）
                mesh.position.set(
                    cube.origin[0] + cube.size[0]/2,
                    cube.origin[1] + cube.size[1]/2,
                    cube.origin[2] + cube.size[2]/2
                );
                this.meshGroup.add(mesh);
            });
            RenderBridge.scene.add(this.meshGroup);
        },

        update: function(groundBlocks) {
            // 重力加速
            this.velY = Math.max(this.terminalVelocity, this.velY + this.gravity);
            this.pos.y += this.velY;

            // 当たり判定：地面（groundBlocks）との衝突
            groundBlocks.forEach(block => {
                // 簡易足元判定：スティーブの足(y=0)がブロックの上面(origin.y + size.y)に触れたか
                if (this.pos.y <= block.origin[1] + block.size[1] && 
                    this.pos.y > block.origin[1]) {
                    
                    this.pos.y = block.origin[1] + block.size[1]; // 着地！
                    this.velY = 0;
                }
            });

            // メッシュの位置を更新
            this.meshGroup.position.set(this.pos.x, this.pos.y, this.pos.z);
            
            print(f"player_pos_y:{this.pos.y}");
            print(f"velocity_y:{this.velY}");
        }
    };
})();
