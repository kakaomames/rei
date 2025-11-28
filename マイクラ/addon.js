// addon.js

// ------------------------------------
// 定数
// ------------------------------------
const ADDON_INDEX_KEY = 'custom-addon'; // アドオン一覧のローカルストレージキー
const STATUS_ELEMENT = document.getElementById('addon-status');

// ------------------------------------
// ユーティリティ関数
// ------------------------------------

/**
 * PromiseでファイルをBase64文字列に変換する
 * @param {Blob} blob - ファイルのBlobデータ
 * @returns {Promise<string>} Base64文字列
 */
function blobToBase64(blob) {
    return new Promise((resolve, reject) => {
        const reader = new FileReader();
        reader.onloadend = () => resolve(reader.result);
        reader.onerror = reject;
        reader.readAsDataURL(blob);
    });
}

/**
 * ローカルストレージからJSONデータを安全に取得する
 * @param {string} key - ローカルストレージのキー
 * @returns {object} JSONデータ (存在しない場合は空のオブジェクト)
 */
function getStorageJson(key) {
    const data = localStorage.getItem(key);
    try {
        return data ? JSON.parse(data) : {};
    } catch (e) {
        console.error(`Local Storageのキー ${key} の解析エラー`, e);
        return {};
    }
}

/**
 * ローカルストレージにJSONデータを安全に保存する
 * @param {string} key - ローカルストレージのキー
 * @param {object} data - 保存するJSONオブジェクト
 */
function setStorageJson(key, data) {
    try {
        localStorage.setItem(key, JSON.stringify(data));
    } catch (e) {
        console.error(`Local Storageへのキー ${key} の保存エラー`, e);
    }
}

// ------------------------------------
// メインロジック
// ------------------------------------

/**
 * ユーザーが選択したMCAddon/MCPackファイルを処理する
 * @param {File} file - ユーザーが選択したファイルオブジェクト
 */
async function processAddonFile(file) {
    if (!file) return;

    STATUS_ELEMENT.textContent = `ファイルを解析中: ${file.name}...`;

    try {
        const jszip = new JSZip();
        // 1. ファイルをJSZipで読み込み解凍
        const zip = await jszip.loadAsync(file);
        
        // 2. manifest.jsonを取得し解析
        const manifestFile = zip.file('manifest.json');
        if (!manifestFile) {
            throw new Error('manifest.jsonが見つかりません。これは有効なMinecraft Packではありません。');
        }

        const manifestText = await manifestFile.async('string');
        const manifest = JSON.parse(manifestText);

        const header = manifest.header;
        if (!header || !header.uuid || !header.name) {
            throw new Error('manifest.jsonのHeader情報（UUIDまたは名前）が不正です。');
        }

        const uuid = header.uuid;
        const packName = header.name;

        // 3. アドオンの実データを収集し、Base64にエンコード
        const packData = {
            manifest: manifest, // manifest.json自体も保存
        };
        
        // manifest.json以外のすべてのファイルを処理
        const filePromises = [];
        zip.forEach((relativePath, zipEntry) => {
            if (relativePath === 'manifest.json' || zipEntry.dir) {
                return;
            }
            
            // ファイルをBlobとして取得し、Base64に変換してパックデータに追加
            filePromises.push(
                zipEntry.async('blob')
                    .then(blob => blobToBase64(blob))
                    .then(base64Data => {
                        packData[relativePath] = base64Data;
                    })
            );
        });

        // 全てのファイル変換が終わるのを待つ
        await Promise.all(filePromises);

        // 4. Local Storageに保存
        
        // A. 実データをUUIDをキーとして保存
        setStorageJson(uuid, packData);
        
        // B. インデックス（一覧）を更新
        const addonIndex = getStorageJson(ADDON_INDEX_KEY);
        addonIndex[uuid] = packName;
        setStorageJson(ADDON_INDEX_KEY, addonIndex);

        STATUS_ELEMENT.textContent = `✅ アドオン「${packName}」を保存しました！ (UUID: ${uuid})`;
        console.log(`アドオン保存完了: ${uuid}`);

    } catch (error) {
        STATUS_ELEMENT.textContent = `❌ アドオン処理エラー: ${error.message}`;
        console.error('アドオン処理中にエラーが発生しました:', error);
    }
}


// ------------------------------------
// 初期設定 (イベントリスナー)
// ------------------------------------
document.addEventListener('DOMContentLoaded', () => {
    const fileInput = document.getElementById('addon-file-input');
    if (fileInput) {
        fileInput.addEventListener('change', (event) => {
            const file = event.target.files[0];
            if (file) {
                processAddonFile(file);
            }
        });
    } else {
        console.warn('ファイル入力要素 #addon-file-input が見つかりません。');
    }
    
    // 起動時に既存のアドオンを読み込む関数を呼び出す（後で実装）
    // loadExistingAddons();
});
