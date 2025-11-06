// app.js

import { logInfo, logWarn, logError, getLogsAsCopyableText } from './log.js';

logInfo('アプリケーション起動'); // 起動時のINFOログ

// シーン、カメラ、レンダラーの準備
let scene, camera, renderer, controls;
const container = document.getElementById('container');
const fileInput = document.getElementById('file-input');
const showLogsButton = document.getElementById('show-logs-button'); // ログボタンの要素を取得

let loadedObject = null;

// --- 初期化処理 ---
function init() {
    logInfo('Three.js初期設定開始');
    
    // 💡 シーンを作成
    scene = new THREE.Scene();
    scene.background = new THREE.Color(0xcccccc); // 背景色を少し明るく

    // 📸 カメラを作成
    const width = window.innerWidth;
    const height = window.innerHeight;
    camera = new THREE.PerspectiveCamera(45, width / height, 1, 2000);
    camera.position.set(0, 50, 150);

    // 💡 ライトを追加
    scene.add(new THREE.AmbientLight(0x404040, 3)); // 環境光を強めに
    const directionalLight = new THREE.DirectionalLight(0xffffff, 2);
    directionalLight.position.set(1, 1, 1).normalize();
    scene.add(directionalLight);

    // 🖼️ レンダラーを作成
    renderer = new THREE.WebGLRenderer({ antialias: true });
    renderer.setSize(width, height);
    container.appendChild(renderer.domElement);

    // 🖱 カメラコントロール
    controls = new THREE.OrbitControls(camera, renderer.domElement);
    
    // イベントリスナーを設定
    fileInput.addEventListener('change', handleFileSelect, false);
    window.addEventListener('resize', onWindowResize, false);
    
    // ログ表示ボタンのクリックイベントを設定
    showLogsButton.addEventListener('click', displayLogs);

    logInfo('初期化完了', '200 OK');
    
    // 初期描画開始
    animate();
}

// --- ファイル選択時のハンドラ ---
function handleFileSelect(event) {
    const file = event.target.files[0];
    // Pythonのprint(f"file:{file}"); を修正
    console.log(`file: ${file.name}`);
    
    if (!file) {
        logWarn('ファイル選択がキャンセルされました。');
        return;
    }
    
    // 既存モデルの削除 (ログ追加)
    if (loadedObject) {
        logInfo('既存モデルを削除', {name: loadedObject.name || 'Unnamed Object'});
        scene.remove(loadedObject);
        // メモリ解放処理
        loadedObject.traverse(function (child) {
            if (child.geometry) child.geometry.dispose();
            if (child.material) {
                if (Array.isArray(child.material)) {
                    child.material.forEach(m => m.dispose());
                } else {
                    child.material.dispose();
                }
            }
        });
        loadedObject = null;
        // Pythonのprint(f"loadedObject:{loadedObject} (前のモデルを削除しました)"); を修正
        console.log(`loadedObject: ${loadedObject} (前のモデルを削除しました)`);
    }
    
    logInfo('新しいファイル読み込み開始', { fileName: file.name, fileSize: file.size });

    // 💾 FileReaderを使ってファイルを読み込む
    const reader = new FileReader();
    
    reader.onload = function (e) {
        const objText = e.target.result;
        // Pythonのprint(f"objText:{objText.substring(0, 50)}..."); を修正
        console.log(`objText: ${objText.substring(0, 50)}...`); 
        
        const loader = new THREE.OBJLoader();
        
        try {
            // テキストとして読み込んだOBJデータをパース（解析）
            const object = loader.parse(objText);
            
            // 💡 モデルが大きすぎたり小さすぎたりする場合があるので、中心に移動＆スケール調整
            const box = new THREE.Box3().setFromObject(object);
            const center = box.getCenter(new THREE.Vector3());
            const size = box.getSize(new THREE.Vector3());
            
            object.position.sub(center); // モデルを原点に移動
            
            // モデルが大きすぎる場合のスケール調整
            const maxDim = Math.max(size.x, size.y, size.z);
            if (maxDim > 100) {
                object.scale.multiplyScalar(100 / maxDim);
                logWarn('モデルサイズが大きすぎるためスケール調整を実行しました。');
            }
            
            scene.add(object);
            loadedObject = object;
            // Pythonのprint(f"loadedObject:{loadedObject} (新しいモデルをシーンに追加しました)"); を修正
            console.log(`loadedObject: ${loadedObject} (新しいモデルをシーンに追加しました)`);
            
            controls.reset();
            
            // ⭐ 成功ログ (200 OK相当)
            logInfo('OBJモデルの読み込みと描画に成功', { fileName: file.name, modelScale: object.scale.x });
            
        } catch (error) {
            // 🔥 エラーログ
            logError('OBJファイルのパース中にエラーが発生', error);
            alert('OBJファイルを読み込めませんでした。ファイル形式を確認してください。エラーはコンソールまたはログ詳細を確認してください。');
        }
    };

    reader.onerror = function(error) {
        // 🔥 エラーログ (ファイルの読み込み自体に失敗した場合)
        logError('FileReaderでファイルを読み込めませんでした。', error);
    }

    reader.readAsText(file);
    // Pythonのprint(f"reader.readyState:{reader.readyState} (ファイル読み込み開始)"); を修正
    console.log(`reader.readyState: ${reader.readyState} (ファイル読み込み開始)`);
}

// --- ログ表示機能 ---
function displayLogs() {
    const logsText = getLogsAsCopyableText();
    
    if (logsText) {
        // ポップアップウィンドウでコピー可能な詳細ログを表示
        const logWindow = window.open("", "ApplicationLogs", "width=800,height=600,scrollbars=yes");
        logWindow.document.write('<!DOCTYPE html><html lang="ja"><head><title>アプリケーションログ詳細</title><style>body{white-space:pre-wrap; font-family:monospace; padding:10px;} button{margin-bottom: 10px;}</style></head><body>');
        logWindow.document.write('<button onclick="copyToClipboard(this)">ログをクリップボードにコピー</button>');
        logWindow.document.write(`<pre>${logsText}</pre>`);
        logWindow.document.write('<script>function copyToClipboard(button){const text=document.querySelector("pre").innerText;navigator.clipboard.writeText(text).then(() => {button.textContent="コピーしました! ✅";setTimeout(() => button.textContent="ログをクリップボードにコピー", 2000);}).catch(err => {console.error("コピー失敗", err); button.textContent="コピー失敗 ❌"});}</script>');
        logWindow.document.write('</body></html>');
        logWindow.document.close();
        logInfo('ログ詳細を表示しました。');
    } else {
        logWarn('記録されたログがありません。');
        alert('記録されたログがありません。');
    }
}

// --- 描画とアニメーション ---
function animate() {
    requestAnimationFrame(animate); 
    controls.update();
    renderer.render(scene, camera);
}

// --- リサイズ処理 ---
function onWindowResize() {
    const width = window.innerWidth;
    const height = window.innerHeight;

    camera.aspect = width / height;
    camera.updateProjectionMatrix();

    renderer.setSize(width, height);
}

// 実行
init();
