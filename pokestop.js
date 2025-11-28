// pokestop.js

import { addItemToInventory, drawRandomItem, ITEMS, removeItemFromInventory } from './item.js'; // ⭐ removeItemFromInventoryを追加 ⭐
import { renderPokemonBoxUI } from './pokemongo-UI.js';
// import { POKESTOP_DATA } from './map_logic.js'; // 循環参照を避けるため、データの直接インポートはしない

// ⭐ ローカルストレージのキー ⭐
const POKESTOP_COOLDOWN_KEY = 'pokestop_cooldowns';
const COOLDOWN_DURATION_MS = 5 * 60 * 1000; // 5分 = 300,000ミリ秒

// ===========================================
// クールダウン管理関数
// ===========================================

/**
 * ローカルストレージからポケストップのクールダウン情報を取得する
 * @returns {Object<string, number>} { 'stop_101': 1735689600000, ... } の形式
 */
function getCooldowns() {
    try {
        const storedData = localStorage.getItem(POKESTOP_COOLDOWN_KEY);
        return storedData ? JSON.parse(storedData) : {};
    } catch (e) {
        console.error("[COOLDOWN ERROR] クールダウン情報の読み込みに失敗しました。", e);
        return {};
    }
}

/**
 * クールダウン情報をローカルストレージに保存する
 * @param {Object} cooldowns クールダウン情報のオブジェクト
 */
function saveCooldowns(cooldowns) {
    try {
        localStorage.setItem(POKESTOP_COOLDOWN_KEY, JSON.stringify(cooldowns));
    } catch (e) {
        console.error("[COOLDOWN ERROR] クールダウン情報の書き込みに失敗しました。", e);
    }
}

/**
 * ポケストップがクールダウン中かチェックする
 * @param {string} stopId ポケストップのID
 * @returns {boolean} クールダウン中であれば true
 */
export function isPokestopOnCooldown(stopId) {
    const cooldowns = getCooldowns();
    const lastSpunTime = cooldowns[stopId] || 0;
    const currentTime = Date.now();
    
    return (currentTime - lastSpunTime) < COOLDOWN_DURATION_MS;
}

/**
 * 残りクールダウン時間を計算する (秒単位)
 * @param {string} stopId ポケストップのID
 * @returns {number} 残り秒数。クールダウン中でなければ 0
 */
export function getRemainingCooldown(stopId) {
    const cooldowns = getCooldowns();
    const lastSpunTime = cooldowns[stopId] || 0;
    const currentTime = Date.now();
    
    if (currentTime - lastSpunTime >= COOLDOWN_DURATION_MS) {
        return 0;
    }
    
    const remainingMs = COOLDOWN_DURATION_MS - (currentTime - lastSpunTime);
    return Math.ceil(remainingMs / 1000);
}


// ===========================================
// ポケストップ操作ロジック
// ===========================================

/**
 * ポケストップを回すメインロジック
 * @param {string} stopId ポケストップのID
 * @returns {string} 結果メッセージ
 */
export function spinPokestop(stopId) {
    if (isPokestopOnCooldown(stopId)) {
        const remainingSeconds = getRemainingCooldown(stopId);
        const minutes = Math.ceil(remainingSeconds / 60);
        return `❌ このポケストップはクールダウン中です。残り ${minutes} 分待ってください。`;
    }

    // 1. クールダウンを更新
    const cooldowns = getCooldowns();
    cooldowns[stopId] = Date.now();
    saveCooldowns(cooldowns);
    
    // 2. アイテムを抽選し、付与する
    const itemsGained = [];
    const numItems = Math.floor(Math.random() * 3) + 1; // 1〜3個のアイテムを付与
    
    for (let i = 0; i < numItems; i++) {
        const itemId = drawRandomItem();
        addItemToInventory(itemId, 1);
        itemsGained.push(ITEMS[itemId.toUpperCase()].name_ja);
    }
    
    // 3. 経験値（XP）を付与 (簡易版ではコンソールログのみ)
    const xpGained = 50; 
    console.log(`[POKESTOP] ポケストップXP ${xpGained} を獲得しました。`);

    // 4. UI（道具箱）の更新をトリガー
    // ⭐ renderInventoryUI関数が pokemongo-UI.js にあることを想定して呼び出しを変更するのが理想だが、
    // ⭐ 今回はrenderPokemonBoxUIが道具箱も含めて更新する前提で残す
    renderPokemonBoxUI();

    const itemsMessage = itemsGained.join(', ');
    return `✅ ポケストップを回しました！\n獲得アイテム (${numItems}個): ${itemsMessage}`;
}

// ===========================================
// マップ関連ロジック (map_logic.js への補足)
// ===========================================

/**
 * map_logic.js のポケストップマーカー設定時に、クールダウン表示を更新するための関数
 * @param {string} stopId ポケストップID
 * @param {string} name_ja ポケストップ名
 * @param {boolean} isAccessible ⭐ アクセス圏内かどうかのフラグを受け取るように修正 ⭐
 * @returns {string} LeafletのPopupに表示するHTMLコンテンツ
 */
export function getPokestopPopupContent(stopId, name_ja, isAccessible) {
    const isCooldown = isPokestopOnCooldown(stopId);
    let buttonHtml;
    let statusText;
    
    if (!isAccessible) {
        statusText = `<p style="color: orange;">❌ ポケストップに近付いてください。</p>`;
        buttonHtml = `<button disabled style="background-color: #ccc;">アクセス圏外</button>`;
    } else if (isCooldown) {
        const remainingSeconds = getRemainingCooldown(stopId);
        const minutes = Math.ceil(remainingSeconds / 60);
        statusText = `<p style="color: red;">クールダウン中 (残り約 ${minutes} 分)</p>`;
        buttonHtml = `<button disabled style="background-color: #ccc;">クールダウン中...</button>`;
    } else { // アクセス可能 AND クールダウン中でない
        statusText = `<p style="color: green;">スピン可能です！</p>`;
        buttonHtml = `<button onclick="window.pokestopSpinHandler('${stopId}')">ポケストップを回す</button>`;
    }

    return `
        <b>${name_ja}</b>
        ${statusText}
        ${buttonHtml}
    `;
}

// ユーザーがポップアップ内でボタンをクリックしたときに実行されるグローバルハンドラ
window.pokestopSpinHandler = (stopId) => {
    const result = spinPokestop(stopId);
    alert(result); // 簡易的な結果表示
    
    // ポップアップの内容を即座に更新 (クールダウン状態を反映)
    // map_logic.js に定義されたグローバル関数を使ってマーカーを更新
    if (window.getPokestopMarkerById) {
        const marker = window.getPokestopMarkerById(stopId); 
        if (marker && marker.getPopup().isOpen()) {
            // ⭐ map_logic.js が pokestop のデータを保持していることを前提として、
            // ⭐ name_ja を取得するロジックは割愛し、そのまま閉じるか再表示を促す
            
            // ポケストップは回した後にアクセス圏外にはならないので、isAccessibleはtrueと仮定
            const newContent = getPokestopPopupContent(stopId, "ポケストップ", true); 
            marker.setPopupContent(newContent).openPopup();
        }
    }
};

// ===========================================
// グローバル登録 (Leaflet Popupから呼び出すため)
// ===========================================

window.spinPokestop = spinPokestop;
