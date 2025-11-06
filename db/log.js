// log.js

/**
 * ログメッセージを格納する配列
 * @type {Array<{timestamp: string, level: string, message: string, details?: string}>}
 */
const logs = [];

/**
 * 現在の時刻を "YYYY-MM-DD HH:MM:SS" 形式で取得
 * @returns {string} タイムスタンプ
 */
function getTimestamp() {
    const now = new Date();
    const date = now.toLocaleDateString('ja-JP', { year: 'numeric', month: '2-digit', day: '2-digit' }).replace(/\//g, '-');
    const time = now.toLocaleTimeString('ja-JP', { hour: '2-digit', minute: '2-digit', second: '2-digit', hour12: false });
    return `${date} ${time}`;
}

/**
 * ログを記録する汎用関数
 * @param {string} level - ログレベル (ERROR, WARN, INFO)
 * @param {string} message - 簡潔なメッセージ
 * @param {any} [details=''] - 詳細情報 (オブジェクトやスタックトレースなど)
 */
function recordLog(level, message, details = '') {
    const logEntry = {
        timestamp: getTimestamp(),
        level: level,
        message: message,
        details: (typeof details === 'object' && details !== null) ? JSON.stringify(details, null, 2) : String(details)
    };
    logs.push(logEntry);

    // コンソールにも出力 (視認性向上のため色付け)
    switch (level) {
        case 'ERROR':
            console.error(`[${logEntry.timestamp}] [${level}] ${message}`, details);
            break;
        case 'WARN':
            console.warn(`[${logEntry.timestamp}] [${level}] ${message}`, details);
            break;
        case 'INFO':
            console.info(`[${logEntry.timestamp}] [${level}] ${message}`);
            break;
        default:
            console.log(`[${logEntry.timestamp}] [${level}] ${message}`, details);
    }
}

/**
 * エラーログを記録
 * @param {string} message 
 * @param {any} [error]
 */
export function logError(message, error) {
    recordLog('ERROR', message, error);
}

/**
 * 警告ログを記録
 * @param {string} message 
 * @param {any} [details]
 */
export function logWarn(message, details) {
    recordLog('WARN', message, details);
}

/**
 * 情報ログ (ステータス200 OK相当) を記録
 * @param {string} message 
 * @param {any} [details]
 */
export function logInfo(message, details = '200 OK') {
    recordLog('INFO', message, details);
}

/**
 * 格納されているログの全てをコピー可能なテキスト形式で取得
 * @returns {string} 全ログの詳細なテキスト
 */
export function getLogsAsCopyableText() {
    let output = "=== アプリケーションログ詳細 ===\n\n";
    
    logs.forEach((log, index) => {
        output += `--- ログ #${index + 1} ---\n`;
        output += `[${log.level}]\t${log.timestamp}\n`;
        output += `メッセージ:\t${log.message}\n`;
        
        // 詳細情報があれば追加
        if (log.details && log.details !== 'undefined') {
            output += `詳細:\n${log.details}\n`;
        }
        output += '\n';
    });

    output += `=== ログ終了 (${logs.length}件) ===`;
    return output;
}

/**
 * ログの件数を取得
 * @returns {number}
 */
export function getLogCount() {
    return logs.length;
}
