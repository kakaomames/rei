// js/three_renderer.js

import * as THREE from 'https://cdnjs.cloudflare.com/ajax/libs/three.js/r128/three.module.js';
// OBJLoaderがインポートされていることを確認
import { OBJLoader } from 'https://cdn.jsdelivr.net/npm/three@0.128.0/examples/js/loaders/OBJLoader.js'; 
import { geometry } from './geo.js'; // ★ 新規追加
import { updateAnimations } from './animation.js'; // ★ 新規追加

let scene, camera, renderer;
let pokemonMesh; 
// 座標連携のためのターゲット位置情報を保持
let targetPokemonLocation = null;
let mapInstance = null;

// OBJファイルとテクスチャのパス
const MODEL_PATH = 'assets/models/bulbasaur.obj'; 
const TEXTURE_PATH = 'assets/textures/bulbasaur.png';
const MODEL_SCALE = 0.05; // ポケモンクエストモデルに合わせて調整が必要なスケール

// 1. Three.jsの初期化とモデル読み込み
export function initThree(map, modelLatLon) {
    // 外部から渡されたマップインスタンスと位置情報を保持
    mapInstance = map;
    targetPokemonLocation = modelLatLon;
    
    // A. シーン、カメラ、レンダラーのセットアップ
    scene = new THREE.Scene();
    camera = new THREE.PerspectiveCamera(75, window.innerWidth / window.innerHeight, 0.1, 1000);
    camera.position.z = 5;

    renderer = new THREE.WebGLRenderer({ alpha: true });
    renderer.setSize(window.innerWidth, window.innerHeight);
    renderer.domElement.style.pointerEvents = 'none'; 
    document.body.appendChild(renderer.domElement);
    
    // B. ライトの追加
    scene.add(new THREE.AmbientLight(0xffffff, 0.5));
    const directionalLight = new THREE.DirectionalLight(0xffffff, 1.0);
    directionalLight.position.set(5, 5, 5);
    scene.add(directionalLight);

    // C. OBJモデルの読み込み
    const loader = new OBJLoader();
    const textureLoader = new THREE.TextureLoader();
    
    const texture = textureLoader.load(TEXTURE_PATH);
    console.log(`texture loaded: ${TEXTURE_PATH}`);

    loader.load(
        MODEL_PATH,
        function (object) {
            // モデル内のすべてのメッシュにテクスチャを適用
            object.traverse(function (child) {
                if (child instanceof THREE.Mesh) {
                    child.material = new THREE.MeshLambertMaterial({ map: texture });
                }
            });

            pokemonMesh = object;
            scene.add(pokemonMesh);

            pokemonMesh.scale.set(MODEL_SCALE, MODEL_SCALE, MODEL_SCALE); 
            
            console.log(`OBJ Model loaded: ${MODEL_PATH}`);

            // モデルが読み込まれたら、Leafletの座標に位置を合わせる
            if (mapInstance && targetPokemonLocation) {
                updatePokemonPosition(mapInstance, targetPokemonLocation);
            }
        },
        undefined,
        function (error) {
            console.error('An error happened while loading the OBJ model', error);
        }
    );
    
    // D. リサイズ対応
    window.addEventListener('resize', onWindowResize, false);
    
    // アニメーションループ開始
    animate();
}

function onWindowResize() {
    camera.aspect = window.innerWidth / window.innerHeight;
    camera.updateProjectionMatrix();
    renderer.setSize(window.innerWidth, window.innerHeight);
    // リサイズ後も位置を更新
    if (mapInstance && targetPokemonLocation) {
        updatePokemonPosition(mapInstance, targetPokemonLocation);
    }
}

// 2. 座標変換とモデル配置のコアロジック (変更なし)
export function updatePokemonPosition(map, modelLatLon) {
    if (!map || !pokemonMesh) return;
    
    // Leafletの緯度経度から画面ピクセル座標への変換
    const latLng = L.latLng(modelLatLon.lat, modelLatLon.lon);
    const point = map.latLngToContainerPoint(latLng);
    
    // ピクセル座標をThree.jsのWebGL座標系に変換
    const vector = new THREE.Vector3(
        (point.x / window.innerWidth) * 2 - 1,
        -(point.y / window.innerHeight) * 2 + 1,
        0.5 
    );

    // 3D空間への投影
    vector.unproject(camera);
    
    // モデルの位置を更新
    const dir = vector.sub(camera.position).normalize();
    const distance = -camera.position.z / dir.z; 
    const pos = camera.position.clone().add(dir.multiplyScalar(distance));
    
    pokemonMesh.position.copy(pos);
    
    // 緯度経度に合わせてモデルが追従するように、常に正面を向くように調整しても良い
    // pokemonMesh.rotation.y = Math.atan2((camera.position.x - pos.x), (camera.position.z - pos.z)); 
}

// 3. アニメーションループ
function animate() {
    requestAnimationFrame(animate);
    
    // ★ アニメーションを更新
    updateAnimations(); 

    // マップ上のポケモンモデルの回転は、アニメーションを使わないならここで継続
    if (pokemonMesh) {
        pokemonMesh.rotation.y += 0.01; 
    }

    renderer.render(scene, camera);
}
