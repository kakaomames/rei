// app.js

import { logInfo, logWarn, logError, getLogsAsCopyableText } from './log.js';
import { convertObjToGeoData, generateMinecraftGeoJson } from './obj-to-geo-json.js';

logInfo('アプリケーション起動'); 

// シーン、カメラ、レンダラーの準備
let scene, camera, renderer, controls;
const container = document.getElementById('container');
const fileInput = document.getElementById('file-input');
const showLogsButton = document.getElementById('show-logs-button'); 

// ⭐ 新しく追加したDOM要素 (HTML側もinputに変更されています)
const downloadJsonButton = document.getElementById('download-json-button'); 
const downloadLink = document.getElementById('download-link');
const modelIdInput = document.getElementById('model-id-input');     // 編集可能なID入力欄
const fileNameInput = document.getElementById('file-name-input');   // 編集可能なファイル名入力欄

let loadedObject = null;
let generatedJsonData = null; // 生成されたJSONデータを保持する変数

// --- 初期化処理 ---
function init() {
    logInfo('Three.js初期設定開始');
    
    // 💡 シーンを作成
    scene = new THREE.Scene();
    scene.background = new THREE.Color(0xcccccc); 

    // 📸 カメラを作成
    const width = window.innerWidth * 0.75; // 75%の幅に合わせる
    const height = window.innerHeight;
    camera = new THREE.PerspectiveCamera(45, width / height, 1, 2000);
    camera.position.set(0, 50, 150);

    // 💡 ライトを追加
    scene.add(new THREE.AmbientLight(0x404040, 3)); 
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

    // ダウンロードボタンのクリックイベントを設定
    downloadJsonButton.addEventListener('click', downloadJson);
    downloadJsonButton.disabled = true; // 初期状態では無効

    logInfo('初期化完了', '200 OK');
    
    // 初期描画開始
    animate();
}

// --- ファイル選択時のハンドラ ---
function handleFileSelect(event) {
    const file = event.target.files[0];
    
    // -----------------------------------------------------
    // ⭐ 右側パネルのファイル情報を生成・更新
    // -----------------------------------------------------
    const baseName = file ? file.name.replace(/\.obj$/i, '') : 'N_A';
    // ファイル名からMinecraftで使用できるクリーンなIDを生成（小文字、数字、アンダーバーのみ）
    const initialModelId = baseName.toLowerCase().replace(/[^a-z0-9_]/g, ''); 
    
    // 編集可能なinputタグに値を設定
    modelIdInput.value = initialModelId;
    fileNameInput.value = file ? file.name : 'N/A';
    // -----------------------------------------------------

    console.log(`file: ${file ? file.name : 'N/A (キャンセル)'}`);
    
    if (!file) {
        logWarn('ファイル選択がキャンセルされました。');
        downloadJsonButton.disabled = true;
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
        console.log(`loadedObject: ${loadedObject} (前のモデルを削除しました)`);
    }
    
    logInfo('新しいファイル読み込み開始', { fileName: file.name, fileSize: file.size });

    // 💾 FileReaderを使ってファイルを読み込む
    const reader = new FileReader();
    
    reader.onload = function (e) {
        const objText = e.target.result;
        console.log(`objText: ${objText.substring(0, 50)}...`); 
        
        const loader = new THREE.OBJLoader();
        
        try {
            // -----------------------------------------------------
            // ⭐ OBJ解析とJSONデータ生成
            // -----------------------------------------------------
            // 編集可能なinputから現在のIDを取得
            const currentModelId = modelIdInput.value; 

            logInfo('OBJファイルをJSONデータへ変換開始...');
            const geoData = convertObjToGeoData(objText); // 解析実行
            generatedJsonData = generateMinecraftGeoJson(geoData, currentModelId); // IDを渡してJSON文字列を生成

            // 編集可能なinputから現在のファイル名を取得し、ダウンロードファイル名を決定
            const currentFileName = fileNameInput.value;
            const downloadBaseName = currentFileName.endsWith('.obj') ? currentFileName.slice(0, -4) : currentFileName;
            
            downloadLink.download = `${downloadBaseName}.geo.json`; // aタグのdownload属性を更新
            downloadJsonButton.disabled = false;
            logInfo('JSONデータ生成成功', { id: `geometry.${currentModelId}`, vertices: geoData.vertices.length });
            // -----------------------------------------------------
            
            // Three.jsでOBJを表示
            const object = loader.parse(objText);
            
            // (NaNエラー回避のため、モデルのセンタリングとスケール調整は無効化されたまま)

            scene.add(object);
            loadedObject = object;
            console.log(`loadedObject: ${loadedObject} (新しいモデルをシーンに追加しました)`);
            
            controls.reset();
            
            logInfo('OBJモデルの読み込みと描画に成功', { fileName: file.name, loadedScale: object.scale.x });
            
        } catch (error) {
            // エラーが発生した場合
            logError('OBJファイルのパースまたはJSON変換中にエラーが発生', error);
            alert('処理中にエラーが発生しました。ログ詳細を確認してください。');
            downloadJsonButton.disabled = true;
        }
    };

    reader.onerror = function(error) {
        // FileReaderでファイルを読み込めなかった場合
        logError('FileReaderでファイルを読み込めませんでした。', error);
    }

    reader.readAsText(file);
    console.log(`reader.readyState: ${reader.readyState} (ファイル読み込み開始)`);
}

// --- JSONダウンロード機能 ---
function downloadJson() {
    if (!generatedJsonData) {
        logWarn('ダウンロードするJSONデータがありません。');
        return;
    }
    
    // Blobを作成し、ダウンロードリンクを生成
    const blob = new Blob([generatedJsonData], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    
    // downloadLink要素のhrefを更新し、click()を実行してダウンロードを開始
    downloadLink.href = url;
    downloadLink.click();
    
    // ダウンロード後、URLを解放
    setTimeout(() => {
        URL.revokeObjectURL(url);
        downloadLink.href = "#"; // hrefをリセット
    }, 100);

    logInfo('JSONファイルをダウンロードしました。');
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
    // 75%の幅に合わせる
    const width = window.innerWidth * 0.75; 
    const height = window.innerHeight;

    camera.aspect = width / height;
    camera.updateProjectionMatrix();

    renderer.setSize(width, height);
}

// 実行
init();
