// missionLog の定義（Saved Informationに基づき詳細に出力）
const missionLog = (type, message) => {
    console.log(`[${type}] ${message}`);
};

// 物理演算の開始！
PhysicsEngine.init('game-canvas', 1.2); // 重力を少し強めに設定

// 地面を作成
PhysicsEngine.createStaticRect(window.innerWidth / 2, window.innerHeight - 20, window.innerWidth, 40, "Ground");

// 壺男の「壺」に相当するオブジェクト
const pot = PhysicsEngine.createDynamicCircle(400, 100, 30, { 
    render: { fillStyle: '#ff5722' } 
});

// クリックでジャンプ（重力に逆らう力を加える）
document.addEventListener('click', (e) => {
    PhysicsEngine.applyForce(pot, pot.position, { x: 0.05, y: -0.1 });
    missionLog("ACTION", "隊員がジャンプ命令を送信！");
});
