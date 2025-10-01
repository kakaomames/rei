// game.jsで定義された gameData.settings を使用します

// --- グローバルデバッグ・設定変数 ---
window.debugLog = [];
window.settings = {}; // 現在有効な設定をキーと値のペアで保持

const MAX_LOG_LINES = 8; // ログに残す最大行数

/**
 * ログメッセージを追加し、最大行数を超えたら古い行を削除する。
 * @param {string} message - 追加するログメッセージ
 */
function addLog(message) {
    const timestamp = new Date().toLocaleTimeString('ja-JP', { hour: '2-digit', minute: '2-digit', second: '2-digit' });
    const logMessage = `[${timestamp}] ${message}`;
    
    window.debugLog.push(logMessage);
    
    // ログが多すぎるとパフォーマンスに影響するため、古いログを削除
    if (window.debugLog.length > MAX_LOG_LINES) {
        window.debugLog.shift(); // 配列の先頭（最も古いログ）を削除
    }
    
    // 開発者コンソールにも出力
    console.log(logMessage);
}

/**
 * gameData.settings に基づいて、現在の設定状態を初期化する。
 * (game.js の loadGameData() 成功後に呼ばれる)
 */
function loadSettings() {
    gameData.settings.forEach(item => {
        // デフォルト値または保存された値があればそれを設定
        window.settings[item.id] = item.default_value;
        // 🚨 NEW: ここでローカルストレージから設定を読み込むロジックを追加予定
    });
    
    addLog("設定システムをロードしました。");
}

/**
 * 設定値をトグル（反転）する
 * @param {string} settingId - 設定のID
 */
function toggleSetting(settingId) {
    if (window.settings.hasOwnProperty(settingId)) {
        window.settings[settingId] = !window.settings[settingId];
        
        // 🚨 NEW: 設定をローカルストレージに保存するロジックを追加予定
        
        addLog(`設定 [${settingId}] を ${window.settings[settingId] ? 'ON' : 'OFF'} に切り替えました。`);
        
        // UIを再描画
        goToSettings();
    }
}

// ----------------------------------------------------
// ⚙️ 設定画面表示関数 (router.jsから呼ばれる)
// ----------------------------------------------------
function goToSettings() {
    // ハッシュ変更が目的の場合
    if (window.location.hash !== '#settings') {
        // router.js の navigate 関数を介して呼び出すため、ハッシュ変更を行う
        window.location.hash = '#settings';
        return; 
    }
    
    // ハッシュが#settingsの場合（ルーターから呼ばれた場合）
    const homeScreen = document.getElementById('homeScreen');
    
    // 設定アイテムのリストを生成
    const settingsList = gameData.settings.map(item => {
        const currentValue = window.settings[item.id];
        const buttonColor = currentValue ? '#28a745' : '#dc3545';
        const buttonText = currentValue ? 'ON' : 'OFF';

        return `
            <div style="border: 1px solid #444; padding: 10px; margin: 10px auto; width: 90%; max-width: 400px; background-color: #222; text-align: left;">
                <h4 style="margin-top: 0;">${item.name}</h4>
                <p style="font-size: 14px; color: #aaa; margin-bottom: 10px;">${item.description}</p>
                <button 
                    onclick="toggleSetting('${item.id}')"
                    style="padding: 8px 15px; font-size: 16px; cursor: pointer; background-color: ${buttonColor}; color: white; border: none; border-radius: 4px;"
                >
                    ${buttonText}
                </button>
            </div>
        `;
    }).join('');

    homeScreen.innerHTML = `
        <h2>⚙️ ゲーム設定</h2>
        <hr style="border-color: #555; width: 80%;">
        
        <div id="settingsList" style="text-align: center; margin-top: 20px;">
            ${settingsList}
        </div>
        
        <hr style="border-color: #555; width: 80%;">
        <button onclick="window.location.hash = '#home'" style="padding: 10px 20px; font-size: 18px; cursor: pointer;">🏠 ホームに戻る</button>
    `;
    
    addLog("設定画面に遷移しました。"); 
}
