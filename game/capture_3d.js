// capture_3d.js (構文エラー修正・JSON対応版)
import * as THREE from 'three'; 

// --- Three.js グローバル変数 ---
let scene, camera, renderer, targetMesh, ballMesh;
let animationId;
let isBallThrown = false;
let currentTargetData = null; // map_managerから渡されたJSONモンスター情報
let currentMarker = null;     // map_managerから渡されたLeafletマーカーオブジェクト

// --- 捕獲モード開始 ---
// window.startCapture としてグローバルに公開
function startCapture(data, marker) { 
    currentTargetData = data;
    currentMarker = marker;

    document.getElementById('target-name').innerText = `${data.name} が現れた！`;
    document.getElementById('throw-btn').disabled = false;
    document.getElementById('throw-btn').innerText = "ボールを投げる！";

    if (!renderer) init3D();

    // ターゲットの再生成ロジック
    if (targetMesh) scene.remove(targetMesh);
    
    // JSONから色情報を取得
    const colorCode = parseInt(data.color, 16); 

    const geometry = new THREE.IcosahedronGeometry(1, 1);
    const material = new THREE.MeshStandardMaterial({ color: colorCode, roughness: 0.4, metalness: 0.3 });
    targetMesh = new THREE.Mesh(geometry, material);
    targetMesh.position.set(0, 0, -5); 
    scene.add(targetMesh);

    // ボールのリセット
    if (ballMesh) scene.remove(ballMesh);
    isBallThrown = false;
    
    // アニメーションループ開始
    animate3D(); 
}

// capture_3d.js の機能が必要なため、グローバルに公開
window.startCapture = startCapture; 


// --- 3D初期化 (初回一度だけ実行) ---
function init3D() {
    const container = document.getElementById('capture-container');

    scene = new THREE.Scene();
    camera = new THREE.PerspectiveCamera(75, window.innerWidth / window.innerHeight, 0.1, 1000);
    camera.position.z = 5;
    camera.position.y = 1;

    renderer = new THREE.WebGLRenderer({ alpha: true, antialias: true });
    renderer.setSize(window.innerWidth, window.innerHeight);
    container.appendChild(renderer.domElement);

    const ambientLight = new THREE.AmbientLight(0xffffff, 0.8);
    scene.add(ambientLight);
    const dirLight = new THREE.DirectionalLight(0xffffff, 1);
    dirLight.position.set(5, 10, 7);
    scene.add(dirLight);

    const gridHelper = new THREE.GridHelper(20, 20, 0xffffff, 0x555555);
    gridHelper.position.y = -1;
    scene.add(gridHelper);

    // リサイズ対応
    window.addEventListener('resize', () => {
        camera.aspect = window.innerWidth / window.innerHeight;
        camera.updateProjectionMatrix();
        renderer.setSize(window.innerWidth, window.innerHeight);
    });
}


// --- ボールを投げる処理 ---
document.getElementById('throw-btn').addEventListener('click', () => {
    if (isBallThrown) return;
    isBallThrown = true;

    const ballGeo = new THREE.SphereGeometry(0.3, 32, 32);
    const ballMat = new THREE.MeshStandardMaterial({ color: 0xff0000 });
    ballMesh = new THREE.Mesh(ballGeo, ballMat);
    ballMesh.position.set(0, 0, 2); 
    scene.add(ballMesh);
});

// --- 3Dアニメーションループ ---
function animate3D() {
    animationId = requestAnimationFrame(animate3D);

    if (targetMesh) {
        targetMesh.rotation.y += 0.01;
        targetMesh.rotation.x += 0.005;
        targetMesh.position.y = Math.sin(Date.now() * 0.002) * 0.5;
    }

    if (isBallThrown && ballMesh) {
        ballMesh.position.z -= 0.3; 
        ballMesh.position.y += 0.05; 

        // 当たり判定
        if (ballMesh.position.z < -4) {
            isBallThrown = false;
            cancelAnimationFrame(animationId); // アニメーションを停止
            
            // --- 捕獲判定ロジック ---
            const captureRate = currentTargetData.capture_rate; // JSONから確率を取得
            const success = Math.random() < captureRate; // 乱数判定
            
            scene.remove(ballMesh);
            scene.remove(targetMesh);
            
            document.getElementById('throw-btn').disabled = true;

            if (success) {
                // 捕獲成功！
                currentMarker.remove(); // マップからモンスターを削除
                document.getElementById('target-name').innerText = `🎉 捕獲成功！${currentTargetData.name} を捕まえた！`;
                document.getElementById('throw-btn').innerText = "SUCCESS!";
                
                // 3秒後に自動でマップ画面に戻る
                setTimeout(() => {
                    window.closeCapture(); 
                }, 3000); 

            } else {
                // 捕獲失敗/逃走！
                document.getElementById('target-name').innerText = `😢 逃げられた... ${currentTargetData.name} は遠くへ行ってしまった。`;
                document.getElementById('throw-btn').innerText = "ESCAPE!";

                // 3秒後に自動でマップ画面に戻る
                setTimeout(() => {
                    window.closeCapture(); 
                }, 3000); 
            }
        }
    }

    if(renderer) renderer.render(scene, camera);
}
