// js/storage.js (新規作成)

const POKEMON_STORAGE_KEY = 'webPogoCapturedPokemon';

/**
 * プレイヤーが捕獲したポケモンをLocalStorageからロードします。
 * @returns {Array<Object>} 捕獲したポケモンのリスト。データがない場合は空の配列。
 */
export function loadCapturedPokemon() {
    try {
        const data = localStorage.getItem(POKEMON_STORAGE_KEY);
        if (data) {
            console.log("Captured Pokemon loaded from storage.");
            // JSON文字列をパースして返す
            return JSON.parse(data);
        }
        console.log("No captured Pokemon found in storage. Starting with an empty collection.");
        return [];
    } catch (e) {
        console.error("Error loading captured Pokemon from localStorage:", e);
        return []; // エラー時は空の配列を返す
    }
}

/**
 * 新しく捕獲したポケモンをリストに追加し、LocalStorageに保存します。
 * @param {Object} newPokemon - 新しく捕獲したポケモンのデータ (id, name_ja, cpなど)
 */
export function addCapturedPokemon(newPokemon) {
    const currentList = loadCapturedPokemon();
    currentList.push(newPokemon);
    
    try {
        // JavaScriptオブジェクトをJSON文字列に変換して保存
        localStorage.setItem(POKEMON_STORAGE_KEY, JSON.stringify(currentList));
        console.log(`Successfully saved ${currentList.length} Pokemon to storage.`);
    } catch (e) {
        console.error("Error saving captured Pokemon to localStorage:", e);
    }
}
