import * as THREE from 'https://unpkg.com/three@0.126.0/build/three.module.js';

// シーン、カメラ、レンダラーのセットアップ
const scene = new THREE.Scene();
const camera = new THREE.PerspectiveCamera(75, window.innerWidth / window.innerHeight, 0.1, 1000);
const renderer = new THREE.WebGLRenderer();

// 1. レンダラーの初期設定
renderer.setSize(window.innerWidth, window.innerHeight);
document.body.appendChild(renderer.domElement);
console.log("Renderer element added to the DOM."); // a:Renderer element added to the DOM.

// 2. カメラ位置の設定 (少し後ろに引いて立方体が見えるようにする)
camera.position.z = 5;
console.log(`camera.position.z:${camera.position.z}`); // a:camera.position.z:5

// 3. 基本となる立方体（ブロック）の作成
const geometry = new THREE.BoxGeometry();
// 明るい緑色のマテリアルを作成 (Three.jsではライティングが必要なため、光を当てます)
const material = new THREE.MeshLambertMaterial({ color: 0x00ff00 }); 
const cube = new THREE.Mesh(geometry, material);
scene.add(cube);
console.log("Cube added to the scene."); // a:Cube added to the scene.

// 4. 環境光と指向性ライトの追加 (LambertMaterialを使うため、光が必要)
const ambientLight = new THREE.AmbientLight(0x404040); // 柔らかな光
scene.add(ambientLight);
console.log("Ambient light added."); // a:Ambient light added.

const directionalLight = new THREE.DirectionalLight(0xffffff, 1.0); // 太陽光のような光
directionalLight.position.set(5, 10, 7.5);
scene.add(directionalLight);
console.log("Directional light added."); // a:Directional light added.

// 5. ウィンドウリサイズ時のレスポンシブ対応
function onWindowResize() {
    camera.aspect = window.innerWidth / window.innerHeight;
    camera.updateProjectionMatrix();
    renderer.setSize(window.innerWidth, window.innerHeight);
    console.log("Window resized and renderer updated."); // a:Window resized and renderer updated.
}
window.addEventListener('resize', onWindowResize, false);

// 6. アニメーションループ (毎フレーム描画を繰り返す)
function animate() {
    requestAnimationFrame(animate);

    // 立方体を回転させる
    cube.rotation.x += 0.01;
    cube.rotation.y += 0.01;

    renderer.render(scene, camera);
}

// アニメーション開始
animate();
console.log("Animation loop started."); // a:Animation loop started.
