// game.jsで定義されたグローバル変数を使用: gameData, gameContainer, goToHome

// --- グローバル変数 ---
let debugLog = [];
const MAX_LOG_COUNT = 10;
let settings = {};

// ----------------------------------------------------
// 💾 設定のロード・保存
// ----------------------------------------------------

function loadSettings() {
    try {
        const storedSettings = localStorage.getItem('shooterSettings');
        if (storedSettings) {
            settings = JSON.parse(storedSettings);
            console.log("設定をロードしました。", settings);
        } else {
            // デフォルト設定を適用
            gameData.settings.forEach(item => {
                settings[item.id] = item.default_value;
            });
        }
    } catch (e) {
        console.error("設定のロード中にエラーが発生しました:", e);
        // ロード失敗時もデフォルトを設定
        gameData.settings.forEach(item => {
            settings[item.id] = item.default_value;
        });
    }
}

function saveSettings() {
    try {
        localStorage.setItem('shooterSettings', JSON.stringify(settings));
        console.log("設定を保存しました。");
    } catch (e) {
        console.error("設定の保存中にエラーが発生しました:", e);
    }
}


// ----------------------------------------------------
// 💬 ログ管理
// ----------------------------------------------------

/**
 * デバッグログにメッセージを追加し、コンソールにも出力
 * @param {string} msg - ログメッセージ
 */
function addLog(msg) {
    const timestamp = new Date().toLocaleTimeString('ja-JP', { hour: '2-digit', minute: '2-digit', second: '2-digit' });
    const logEntry = `[${timestamp}] ${msg}`;
    debugLog.unshift(logEntry); // 配列の先頭に追加
    
    // 最大ログ数を超えたら古いものを削除
    if (debugLog.length > MAX_LOG_COUNT) {
        debugLog.pop();
    }
    
    // コンソールには常にログを出力
    console.log(logEntry);
}

// ----------------------------------------------------
// ⚙️ 設定画面の描画
// ----------------------------------------------------

function goToSettings() {
    const homeScreen = document.getElementById('homeScreen');
    homeScreen.innerHTML = `
        <h2>設定 ⚙️</h2>
        <hr style="border-color: #555; width: 80%;">
        
        <h3 id="creatorButton" style="cursor: pointer; color: orange;">開発者・クリエイタータブ 💻</h3>
        
        <hr style="border-color: #555; width: 80%;">
        <button onclick="goToHome()" style="padding: 10px 20px; font-size: 18px; cursor: pointer;">🏠 ホームに戻る</button>
    `;
    
    document.getElementById('creatorButton').addEventListener('click', goToCreatorTab);
}

function goToCreatorTab() {
    const homeScreen = document.getElementById('homeScreen');
    
    const creatorItems = gameData.settings.filter(item => item.type === 'creator');
    
    homeScreen.innerHTML = `
        <h2>クリエイタータブ 💻</h2>
        <p style="color: red;">ここではデバッグ・開発用設定を変更します。</p>
        <hr style="border-color: #555; width: 80%;">
        
        <div id="settingsItems" style="text-align: center; margin-top: 20px;">
            ${creatorItems.map(item => `
                <div style="border: 1px solid #444; padding: 10px; margin: 10px auto; width: 90%; max-width: 400px; background-color: #222;">
                    <h4>${item.name}</h4>
                    <p style="font-size: 14px; color: #aaa;">${item.description}</p>
                    <label style="font-size: 16px;">
                        <input 
                            type="checkbox" 
                            id="${item.id}Checkbox" 
                            onchange="toggleSetting('${item.id}', this.checked); goToCreatorTab();"
                            ${settings[item.id] ? 'checked' : ''}
                        >
                        ${settings[item.id] ? 'ON' : 'OFF'}
                    </label>
                    
                    ${item.id === 'show_log' && settings[item.id] ? 
                        `<div style="margin-top: 10px;">
                            <button onclick="copyLog();" style="padding: 5px 10px; margin-right: 10px;">ログをコピー</button>
                            <button onclick="clearLog(); goToCreatorTab();" style="padding: 5px 10px;">ログをクリア</button>
                        </div>` : ''}
                </div>
            `).join('')}
        </div>
        
        <hr style="border-color: #555; width: 80%;">
        <button onclick="goToSettings()" style="padding: 10px 20px; font-size: 18px; cursor: pointer;">← 設定に戻る</button>
    `;
}

function toggleSetting(id, value) {
    settings[id] = value;
    saveSettings();
}

function copyLog() {
    const logText = debugLog.join('\n');
    navigator.clipboard.writeText(logText).then(() => {
        alert('ログをクリップボードにコピーしました。');
    }).catch(err => {
        console.error('ログのコピーに失敗:', err);
        alert('ログのコピーに失敗しました。コンソールを確認してください。');
    });
}

function clearLog() {
    debugLog = [];
    addLog("ログをクリアしました。");
}
