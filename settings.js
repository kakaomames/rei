// settings.js

// ⭐ 設定値を保存するローカルストレージのキー ⭐
const SETTING_KEY_LANG = 'setting_lang';
const SETTING_KEY_THEME = 'setting_theme';

/**
 * 初期設定をロードし、テーマを適用する
 */
export function loadAndApplySettings() {
    // 1. 設定値をローカルストレージから取得（デフォルト値設定）
    const theme = localStorage.getItem(SETTING_KEY_THEME) || 'light';
    const lang = localStorage.getItem(SETTING_KEY_LANG) || '日本語';
    
    // 2. テーマを適用 (<body>タグのクラスを切り替える)
    applyTheme(theme);
    
    console.log(`[SETTINGS] 設定をロードしました。テーマ: ${theme}, 言語: ${lang}`);
}

/**
 * テーマを適用する
 * @param {string} theme 'light' または 'dark'
 */
export function applyTheme(theme) {
    const body = document.body;
    if (theme === 'dark') {
        body.classList.remove('light-mode');
        body.classList.add('dark-mode');
    } else {
        body.classList.remove('dark-mode');
        body.classList.add('light-mode');
    }
    // ローカルストレージにも保存
    localStorage.setItem(SETTING_KEY_THEME, theme);
    console.log(`[SETTINGS] テーマを ${theme} に切り替えました。`);
}

/**
 * 設定値を更新し、テーマ切り替えが必要なら実行する
 * @param {string} key 'lang' または 'theme'
 * @param {string} value 新しい設定値
 */
export function updateSetting(key, value) {
    if (key === 'theme') {
        applyTheme(value);
    }
    localStorage.setItem(`setting_${key}`, value);
    console.log(`[SETTINGS] ${key} を ${value} に更新しました。`);
}

/**
 * 現在のテーマ設定を取得する
 * @returns {string} 'light' または 'dark'
 */
export function getCurrentTheme() {
    return localStorage.getItem(SETTING_KEY_THEME) || 'light';
}

// ページロード時にテーマを適用
document.addEventListener('DOMContentLoaded', loadAndApplySettings);
