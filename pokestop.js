// pokestop.js

import { addItemToInventory, drawRandomItem, ITEMS } from './item.js';
import { renderPokemonBoxUI } from './pokemongo-UI.js';
import { POKESTOP_DATA } from './map_logic.js'; // ⭐ POKESTOP_DATAにアクセスするためimport ⭐

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
    renderPokemonBoxUI(); // 道具箱の内容表示は pokemongo-UI.js の担当だが、暫定的に呼ぶ

    const itemsMessage = itemsGained.join(', ');
    return `✅ ポケストップを回しました！\n獲得アイテム (${numItems}個): ${itemsMessage}`;
}

// ===========================================
// グローバル登録 (Leaflet Popupから呼び出すため)
// ===========================================

window.spinPokestop = spinPokestop;


// ===========================================
// マップ関連ロジック (map_logic.js への補足)
// ===========================================

/**
 * map_logic.js のポケストップマーカー設定時に、クールダウン表示を更新するための関数
 * (この関数は map_logic.js から呼び出されることを想定)
 * @param {string} stopId ポケストップID
 * @param {string} name_ja ポケストップ名
 * @returns {string} LeafletのPopupに表示するHTMLコンテンツ
 */
export function getPokestopPopupContent(stopId, name_ja) {
    const isCooldown = isPokestopOnCooldown(stopId);
    let buttonHtml;
    let statusText;
    
    if (isCooldown) {
        const remainingSeconds = getRemainingCooldown(stopId);
        const minutes = Math.ceil(remainingSeconds / 60);
        statusText = `<p style="color: red;">クールダウン中 (残り約 ${minutes} 分)</p>`;
        buttonHtml = `<button disabled style="background-color: #ccc;">クールダウン中...</button>`;
    } else {
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
// ポップアップを開いたときに動的に生成されるため、結果表示のために必要
window.pokestopSpinHandler = (stopId) => {
    const result = spinPokestop(stopId);
    alert(result); // 簡易的な結果表示
    
    // ポップアップの内容を即座に更新 (クールダウン状態を反映)
    // このロジックは map_logic.js 側で制御されるべきだが、簡易的に
    const stopData = POKESTOP_DATA.find(p => p.id === stopId);
    if (stopData) {
        const marker = window.getPokestopMarkerById(stopId); // map_logic.js に実装を依頼
        if (marker) {
             const newContent = getPokestopPopupContent(stopId, stopData.name_ja);
             marker.setPopupContent(newContent).openPopup();
        }
    }
};
