// js/three_renderer.js (利用例)

// import の追加
import { loadBedrockGeometry } from './geo.js'; 

// ... (initThree 関数内) ...

// モンスターボールの読み込み（OBJの読み込みとは別に行います）
const BALL_MODEL_PATH = 'assets/models/poke_ball.geometry.json'; 
const BALL_TEXTURE_PATH = 'assets/textures/poke_ball.png';

const ballTexture = textureLoader.load(BALL_TEXTURE_PATH);

loadBedrockGeometry(BALL_MODEL_PATH, ballTexture).then(ballMesh => {
    // ボールをThree.jsのシーンに追加
    ballMesh.position.set(0, 0, 0); // マップとは別に、特定のUI位置に表示することも可能
    scene.add(ballMesh);
    console.log("Bedrock Ball Model added to scene.");
});
