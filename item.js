// item.js
console.log("🔥 [ITEM_JS] ファイルの実行を開始しました。");

// データを格納するグローバル変数
let ITEMS = {}; // アイテム情報 (JSONからロード)

// ⭐ ローカルストレージのキー ⭐
const INVENTORY_KEY = 'player_inventory';

// ===========================================
// アイテムデータのロード (非同期)
// ===========================================

/**
 * 外部の item.json ファイルからデータを非同期でロードする
 */
async function loadItemData() {
    try {
        // ⭐ 開発環境に合わせてパスを調整してください ⭐
        const response = await fetch('./item.json');
        if (!response.ok) {
            throw new Error(`HTTP error! status: ${response.status}`);
        }
        // JSONをオブジェクトとして展開
        const data = await response.json(); 
        
        // ITEMS グローバル変数にセット
        // アイテムIDをキーとしてアクセスできるように変換する
        data.items.forEach(item => {
            ITEMS[item.id.toUpperCase()] = item;
        });
        
        console.log("✅ [ITEM_JS] アイテムデータをロードしました。");
        // アイテムデータのロード後にインベントリもロード
        loadInventory(); 
        
    } catch (error) {
        console.error("🚨 [ITEM_JS ERROR] アイテムデータのロードに失敗しました:", error);
    }
}

// データの初期ロードを実行
loadItemData();

// ===========================================
// インベントリ管理ロジック
// ===========================================

/**
 * ローカルストレージからインベントリ（道具箱）を取得する
 * @returns {Object<string, number>} インベントリの内容 { ITEM_ID: count, ... }
 */
export function getInventory() {
    try {
        const storedData = localStorage.getItem(INVENTORY_KEY);
        return storedData ? JSON.parse(storedData) : {};
    } catch (e) {
        console.error("[INVENTORY ERROR] インベントリの読み込みに失敗しました。", e);
        return {};
    }
}

/**
 * インベントリをローカルストレージに保存する
 * @param {Object} inventory 保存するインベントリデータ
 */
function saveInventory(inventory) {
    try {
        localStorage.setItem(INVENTORY_KEY, JSON.stringify(inventory));
    } catch (e) {
        console.error("[INVENTORY ERROR] インベントリの書き込みに失敗しました。", e);
    }
}

/**
 * ページロード時にインベントリをロードし、初期アイテムを付与する
 */
function loadInventory() {
    let inventory = getInventory();

    // 初回ロード時、またはインベントリが空の場合、初期アイテムを付与
    if (Object.keys(inventory).length === 0) {
        // ⭐ 初期アイテム: モンスターボール 50個
        if (ITEMS['POKEBALL']) {
             inventory['POKEBALL'] = 50;
        } else {
             // データロードエラーの場合のフォールバック
             inventory['POKEBALL'] = 50; 
        }
        
        saveInventory(inventory);
        console.log("[INVENTORY] 初期アイテムを付与しました。");
    }
    
    // UIの道具箱も更新 (pokemongo-UI.jsでグローバル登録されていることを前提)
    if (window.renderPokemonBoxUI) {
        window.renderPokemonBoxUI();
    }
}

/**
 * インベントリにアイテムを追加する
 * @param {string} itemId アイテムのID (大文字)
 * @param {number} count 追加する数
 */
export function addItemToInventory(itemId, count = 1) {
    if (!ITEMS[itemId]) {
        console.warn(`[ITEM] 不明なアイテムID: ${itemId}`);
        return;
    }
    
    const inventory = getInventory();
    
    const currentCount = inventory[itemId] || 0;
    inventory[itemId] = currentCount + count;
    
    saveInventory(inventory);
    console.log(`[INVENTORY] ${ITEMS[itemId].name_ja} を ${count} 個追加しました。合計: ${inventory[itemId]}`);
}

/**
 * インベントリからアイテムを消費/削除する
 * @param {string} itemId アイテムのID (大文字)
 * @param {number} count 消費する数
 * @returns {boolean} 消費が成功したかどうか
 */
export function useItem(itemId, count = 1) {
    const inventory = getInventory();

    if (!inventory[itemId] || inventory[itemId] < count) {
        console.warn(`[INVENTORY] ${ITEMS[itemId] ? ITEMS[itemId].name_ja : itemId} が足りません。所持: ${inventory[itemId] || 0}`);
        return false;
    }

    // ⭐ NEW: 毎回値を決定時に出力 ⭐
    inventory[itemId] -= count;
    print(`inventory[${itemId}]:${inventory[itemId]}`);

    if (inventory[itemId] <= 0) {
        delete inventory[itemId];
    }

    saveInventory(inventory);
    
    // UIの道具箱も更新 (pokemongo-UI.jsでグローバル登録されていることを前提)
    if (window.renderPokemonBoxUI) {
        window.renderPokemonBoxUI();
    }
    
    return true;
}


// ===========================================
// アイテム抽選ロジック
// ===========================================

/**
 * ポケストップで手に入るアイテムを重み付き抽選で決定する
 * @returns {string} 抽選されたアイテムのID
 */
export function drawRandomItem() {
    if (Object.keys(ITEMS).length === 0) {
        console.warn("[DRAW] アイテムデータがロードされていません。デフォルトでモンスターボールを返します。");
        return 'POKEBALL';
    }
    
    // 抽選対象となるアイテムのリストを作成 (タイプ:'BALL' または 'HEAL' のアイテムを対象とする)
    const availableItems = Object.values(ITEMS).filter(item => 
        item.type === 'BALL' || item.type === 'HEAL'
    );
    
    if (availableItems.length === 0) return 'POKEBALL';
    
    let totalWeight = 0;
    
    // 重み付きリストを作成（JSONデータに weight があることを前提とする）
    const weightedList = availableItems.map(item => {
        const weight = item.weight || 1; // weightが未定義の場合は1とする
        const startRange = totalWeight;
        totalWeight += weight;
        return { item, weight, startRange };
    });
    
    const randomNumber = Math.random() * totalWeight;

    // 抽選を実行
    for (const itemEntry of weightedList) {
        if (randomNumber >= itemEntry.startRange && randomNumber < itemEntry.startRange + itemEntry.weight) {
            return itemEntry.item.id.toUpperCase();
        }
    }
    
    // フォールバック
    return availableItems[0].id.toUpperCase();
}


// ===========================================
// アイテム情報取得 (外部参照用)
// ===========================================

/**
 * アイテムの情報を取得する
 * @returns {Object} 全アイテム情報のオブジェクト
 */
export function getAllItems() {
    return ITEMS;
}

/**
 * アイテムIDから日本語名を取得する
 * @param {string} itemId アイテムID
 * @returns {string} 日本語名
 */
export function getPokemonName(itemId) {
    const item = ITEMS[itemId];
    return item ? item.name_ja : '不明なアイテム';
}

/**
 * アイテムIDからアイテムオブジェクト全体を取得する
 * @param {string} itemId アイテムID
 * @returns {Object | undefined} アイテムオブジェクト
 */
export function getPokemonById(itemId) {
    return ITEMS[itemId];
}
