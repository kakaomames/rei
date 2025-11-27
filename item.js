// item.js

// ⭐ ローカルストレージのキー ⭐
const INVENTORY_KEY = 'pokemon_go_inventory';

// ===========================================
// アイテム定義
// ===========================================

/**
 * ゲーム内のすべてのアイテムを定義
 */
export const ITEMS = {
    POKEBALL: {
        id: 'pokeball',
        name_ja: 'モンスターボール',
        description_ja: 'ポケモンを捕獲するための基本的なボール',
        rate: 0.7 // 出現率の重み (後述の抽選で利用)
    },
    POTION: {
        id: 'potion',
        name_ja: 'キズぐすり',
        description_ja: 'ポケモンのHPを回復する',
        rate: 0.2
    },
    REVIVE: {
        id: 'revive',
        name_ja: 'げんきのかけら',
        description_ja: 'ひんし状態のポケモンを復活させる',
        rate: 0.1
    }
};

// ===========================================
// インベントリ (道具箱) 管理関数
// ===========================================

/**
 * ローカルストレージからインベントリ（道具箱）の内容を取得する
 * @returns {Object<string, number>} { 'pokeball': 10, 'potion': 5, ... } の形式
 */
export function getInventory() {
    try {
        const storedData = localStorage.getItem(INVENTORY_KEY);
        // データがない場合は、初期状態でモンスターボールをいくつか持たせる
        return storedData ? JSON.parse(storedData) : { 
            pokeball: 20 
        };
    } catch (e) {
        console.error("[INVENTORY ERROR] ローカルストレージからの読み込みに失敗しました。", e);
        return { pokeball: 20 };
    }
}

/**
 * インベントリ全体をローカルストレージに保存する
 * @param {Object} inventory 保存するインベントリオブジェクト
 */
function saveInventory(inventory) {
    try {
        localStorage.setItem(INVENTORY_KEY, JSON.stringify(inventory));
    } catch (e) {
        console.error("[INVENTORY ERROR] ローカルストレージへの書き込みに失敗しました。", e);
    }
}

/**
 * 指定されたアイテムを指定された数だけインベントリに追加する
 * @param {string} itemId ITEMSオブジェクトに存在するアイテムID
 * @param {number} count 追加する数 (デフォルトは1)
 * @returns {Object} 更新後のインベントリ
 */
export function addItemToInventory(itemId, count = 1) {
    const inventory = getInventory();
    
    // アイテムIDが存在するか確認
    if (!ITEMS[itemId.toUpperCase()]) {
        console.warn(`[INVENTORY] 未定義のアイテムID: ${itemId}`);
        return inventory;
    }

    // 既存の数に加算
    const currentCount = inventory[itemId] || 0;
    inventory[itemId] = currentCount + count;
    
    saveInventory(inventory);
    console.log(`[INVENTORY] ${ITEMS[itemId.toUpperCase()].name_ja} を ${count} 個追加しました。合計: ${inventory[itemId]}`);
    return inventory;
}

/**
 * 指定されたアイテムを指定された数だけインベントリから減らす
 * @param {string} itemId ITEMSオブジェクトに存在するアイテムID
 * @param {number} count 減らす数 (デフォルトは1)
 * @returns {boolean} 成功/失敗
 */
export function removeItemFromInventory(itemId, count = 1) {
    const inventory = getInventory();
    
    const currentCount = inventory[itemId] || 0;
    
    if (currentCount < count) {
        console.warn(`[INVENTORY] ${ITEMS[itemId.toUpperCase()].name_ja} の数が不足しています。現在: ${currentCount}`);
        return false;
    }

    inventory[itemId] = currentCount - count;
    
    // 数が0になったらエントリを削除しても良い
    if (inventory[itemId] === 0) {
        delete inventory[itemId];
    }

    saveInventory(inventory);
    console.log(`[INVENTORY] ${ITEMS[itemId.toUpperCase()].name_ja} を ${count} 個消費しました。残り: ${inventory[itemId]}`);
    return true;
}


// ===========================================
// アイテム抽選ロジック
// ===========================================

/**
 * 定義された重みに基づいてアイテムをランダムに抽選する
 * @returns {string} 抽選されたアイテムID
 */
export function drawRandomItem() {
    let totalRate = 0;
    const itemRates = [];
    
    // 全アイテムの重みを合計し、抽選リストを作成
    for (const key in ITEMS) {
        if (ITEMS.hasOwnProperty(key)) {
            const item = ITEMS[key];
            totalRate += item.rate;
            itemRates.push({ id: item.id, rate: item.rate });
        }
    }

    let randomValue = Math.random() * totalRate;

    // 抽選
    for (const item of itemRates) {
        if (randomValue < item.rate) {
            return item.id;
        }
        randomValue -= item.rate;
    }
    
    // 保険 (通常は到達しない)
    return ITEMS.POKEBALL.id;
}
