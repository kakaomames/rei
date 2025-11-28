// settings.js
console.log("🔥 [SETTINGS_JS] ファイルの実行を開始しました。");

// ⭐ 設定値を保存するローカルストレージのキー ⭐
const SETTING_KEY_LANG = 'setting_lang';
const SETTING_KEY_THEME = 'setting_theme';

// ===========================================
// 設定のロードと適用
// ===========================================

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
    
    // UIを再レンダリングする関数があれば呼び出す（例: メニューの色変更など）
}

/**
 * 現在のテーマ設定を取得する
 * @returns {string} 'light' または 'dark'
 */
export function getCurrentTheme() {
    return localStorage.getItem(SETTING_KEY_THEME) || 'light';
}

// ===========================================
// 設定の更新
// ===========================================

/**
 * 設定値を更新し、テーマ切り替えが必要なら実行する
 * @param {string} key 'lang' または 'theme'
 * @param {string} value 新しい設定値
 */
export function updateSetting(key, value) {
    if (key === 'theme') {
        applyTheme(value);
    }
    // キーをSETTING_KEYに合わせて調整して保存
    const storageKey = key === 'theme' ? SETTING_KEY_THEME : SETTING_KEY_LANG;
    localStorage.setItem(storageKey, value);
    console.log(`[SETTINGS] ${key} を ${value} に更新しました。`);
}

// ===========================================
// UI連携 (pokemongo-UI.js から呼び出される想定)
// ===========================================

/**
 * メインメニュー内に設定画面を表示する
 */
window.showSettings = () => {
    // pokemongo-UI.js の showSubMenu が動作することを前提とする
    if (window.showSubMenu) window.showSubMenu(document.getElementById('settings-container'));
    
    const currentTheme = getCurrentTheme();
    const currentLang = localStorage.getItem(SETTING_KEY_LANG) || '日本語';

    const html = `
        <h2>⚙️ 設定</h2>
        <button onclick="window.closeSubMenu()">戻る</button>
        <div style="margin-top: 20px;">
            <h3>テーマ設定 (現在の設定: ${currentTheme})</h3>
            <button onclick="window.changeTheme('light')" ${currentTheme === 'light' ? 'disabled' : ''}>ライトモード</button>
            <button onclick="window.changeTheme('dark')" ${currentTheme === 'dark' ? 'disabled' : ''}>ダークモード</button>
        </div>
        <div style="margin-top: 20px;">
            <h3>言語設定 (現在の設定: ${currentLang})</h3>
            <button onclick="window.changeLang('日本語')" ${currentLang === '日本語' ? 'disabled' : ''}>日本語</button>
            <button onclick="window.changeLang('English')" ${currentLang === 'English' ? 'disabled' : ''}>English</button>
        </div>
    `;
    
    document.getElementById('settings-container').innerHTML = html;
};

/**
 * テーマ変更ボタンハンドラ
 * @param {string} theme 'light' または 'dark'
 */
window.changeTheme = (theme) => {
    updateSetting('theme', theme);
    window.showSettings(); // 設定画面をリロードしてボタンの状態を更新
    
    // ⭐ UIの再レンダリングも必要 (pokemongo-UI.js 内のポケモンリストや道具箱など) ⭐
    if(window.showPokemonList) window.showPokemonList();
    if(window.showInventory) window.showInventory();
};

/**
 * 言語変更ボタンハンドラ
 * @param {string} lang 言語コード
 */
window.changeLang = (lang) => {
    updateSetting('lang', lang);
    window.showSettings(); // 設定画面をリロードしてボタンの状態を更新
    alert(`言語を ${lang} に変更しましたが、アプリ内の表示言語変更は未実装です。`);
};

// ページロード時にテーマを適用
document.addEventListener('DOMContentLoaded', loadAndApplySettings);
console.log("🔥 [SETTINGS_JS] 定義と初期設定の適用が完了しました。");// settings.js
console.log("🔥 [SETTINGS_JS] ファイルの実行を開始しました。");

// ⭐ 設定値を保存するローカルストレージのキー ⭐
const SETTING_KEY_LANG = 'setting_lang';
const SETTING_KEY_THEME = 'setting_theme';

// ===========================================
// 設定のロードと適用
// ===========================================

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
    
    // UIを再レンダリングする関数があれば呼び出す（例: メニューの色変更など）
}

/**
 * 現在のテーマ設定を取得する
 * @returns {string} 'light' または 'dark'
 */
export function getCurrentTheme() {
    return localStorage.getItem(SETTING_KEY_THEME) || 'light';
}

// ===========================================
// 設定の更新
// ===========================================

/**
 * 設定値を更新し、テーマ切り替えが必要なら実行する
 * @param {string} key 'lang' または 'theme'
 * @param {string} value 新しい設定値
 */
export function updateSetting(key, value) {
    if (key === 'theme') {
        applyTheme(value);
    }
    // キーをSETTING_KEYに合わせて調整して保存
    const storageKey = key === 'theme' ? SETTING_KEY_THEME : SETTING_KEY_LANG;
    localStorage.setItem(storageKey, value);
    console.log(`[SETTINGS] ${key} を ${value} に更新しました。`);
}

// ===========================================
// UI連携 (pokemongo-UI.js から呼び出される想定)
// ===========================================

/**
 * メインメニュー内に設定画面を表示する
 */
window.showSettings = () => {
    // pokemongo-UI.js の showSubMenu が動作することを前提とする
    if (window.showSubMenu) window.showSubMenu(document.getElementById('settings-container'));
    
    const currentTheme = getCurrentTheme();
    const currentLang = localStorage.getItem(SETTING_KEY_LANG) || '日本語';

    const html = `
        <h2>⚙️ 設定</h2>
        <button onclick="window.closeSubMenu()">戻る</button>
        <div style="margin-top: 20px;">
            <h3>テーマ設定 (現在の設定: ${currentTheme})</h3>
            <button onclick="window.changeTheme('light')" ${currentTheme === 'light' ? 'disabled' : ''}>ライトモード</button>
            <button onclick="window.changeTheme('dark')" ${currentTheme === 'dark' ? 'disabled' : ''}>ダークモード</button>
        </div>
        <div style="margin-top: 20px;">
            <h3>言語設定 (現在の設定: ${currentLang})</h3>
            <button onclick="window.changeLang('日本語')" ${currentLang === '日本語' ? 'disabled' : ''}>日本語</button>
            <button onclick="window.changeLang('English')" ${currentLang === 'English' ? 'disabled' : ''}>English</button>
        </div>
    `;
    
    document.getElementById('settings-container').innerHTML = html;
};

/**
 * テーマ変更ボタンハンドラ
 * @param {string} theme 'light' または 'dark'
 */
window.changeTheme = (theme) => {
    updateSetting('theme', theme);
    window.showSettings(); // 設定画面をリロードしてボタンの状態を更新
    
    // ⭐ UIの再レンダリングも必要 (pokemongo-UI.js 内のポケモンリストや道具箱など) ⭐
    if(window.showPokemonList) window.showPokemonList();
    if(window.showInventory) window.showInventory();
};

/**
 * 言語変更ボタンハンドラ
 * @param {string} lang 言語コード
 */
window.changeLang = (lang) => {
    updateSetting('lang', lang);
    window.showSettings(); // 設定画面をリロードしてボタンの状態を更新
    alert(`言語を ${lang} に変更しましたが、アプリ内の表示言語変更は未実装です。`);
};

// ページロード時にテーマを適用
document.addEventListener('DOMContentLoaded', loadAndApplySettings);
console.log("🔥 [SETTINGS_JS] 定義と初期設定の適用が完了しました。");
