// RenderBridge.js (強化版)
(function() {
    window.RenderBridge = {
        scene: null,
        loader: new THREE.TextureLoader(),

        init: function() {
            this.scene = new THREE.Scene();
            // 背景を空っぽっぽく青くしてみる（任意）
            this.scene.background = new THREE.Color(0x87CEEB);
            console.log("RenderBridge: 3D基地、アドオン対応完了！🔭");
        },

        // assets/textures/ から画像を読み込む専用関数
        createBlockMaterial: function(fileName) {
            const texture = this.loader.load(`assets/textures/${fileName}`);
            
            // 重要：マイクラのドット感を出すための「魔法の呪文」
            texture.magFilter = THREE.NearestFilter;
            texture.minFilter = THREE.NearestFilter;
            texture.colorSpace = THREE.SRGBColorSpace; // 色味を正しく出す

            return new THREE.MeshStandardMaterial({ 
                map: texture,
                transparent: true, // ガラスや草のために透明度も許可
                alphaTest: 0.5     // 境界線をクッキリさせる
            });
        },

        createMesh: function(cube, material) {
            const size = cube.size;
            const origin = cube.origin;
            const geometry = new THREE.BoxGeometry(size[0], size[1], size[2]);
            const mesh = new THREE.Mesh(geometry, material);

            // 中心座標へのオフセット計算
            mesh.position.set(
                origin[0] + size[0] / 2,
                origin[1] + size[1] / 2,
                origin[2] + size[2] / 2
            );

            this.scene.add(mesh);
        }
    };
})();
