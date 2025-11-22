// item.js

const ITEM_DATA_CONFIG_PATH = './item.json';
let itemDataCache = null;

// ★★★ Pythonの出力形式に従って、確定した値を出力します ★★★
function printValue(name, value) {
    console.log(`${name}:${value}`);
}

async function loadItemData() {
    if (itemDataCache) {
        printValue('[ITEM LOG] item.json', 'cached');
        return itemDataCache;
    }

    try {
        const response = await fetch(ITEM_DATA_CONFIG_PATH);
        if (!response.ok) {
            throw new Error(`HTTP Error status: ${response.status}`);
        }
        const data = await response.json();
        
        itemDataCache = data.items;
        printValue('[ITEM LOG] item.json load success', Object.keys(itemDataCache).length + ' items');
        return itemDataCache;
        
    } catch (error) {
        console.error(`[ITEM ERROR] item.json のロード中にエラーが発生しました:`, error);
        return {}; 
    }
}

/**
 * 指定されたアイテムIDのデータと、対象モンスターに効果を適用する関数
 * @param {string} itemId - 使用するアイテムのID (item.jsonのキー)
 * @param {object} targetMonster - 効果を適用するモンスターオブジェクト（例: {hp: 80, max_hp: 150, ...}）
 * @returns {object|null} 処理後のモンスターオブジェクト、または失敗時にnull
 */
async function useItem(itemId, targetMonster) {
    if (!targetMonster || !itemId) {
        console.error('[ITEM ERROR] アイテムIDまたは対象モンスターが指定されていません。');
        return null;
    }

    const itemData = (await loadItemData())[itemId];
    printValue('itemData', itemData ? itemData.id : 'null');
    
    if (!itemData) {
        console.error(`[ITEM ERROR] ID '${itemId}' のアイテムデータが見つかりません。`);
        return null;
    }

    let resultMonster = { ...targetMonster }; // モンスターデータをコピー
    let success = true;

    // ★★★ アイテムタイプごとの処理分岐 ★★★
    switch (itemData.item_type) {
        case 'recovery':
            switch (itemData.effect_type) {
                case 'fixed_value':
                    let newHP = Math.min(resultMonster.hp + itemData.value, resultMonster.max_hp);
                    printValue('targetMonster.hp', resultMonster.hp);
                    printValue('newHP', newHP); 
                    
                    if (newHP === resultMonster.hp) {
                        console.log(`[ITEM LOG] ❌ 回復不要 (HP: ${resultMonster.hp} / ${resultMonster.max_hp})`);
                        success = false;
                    } else {
                        resultMonster.hp = newHP;
                        console.log(`[ITEM LOG] ✅ HPを ${itemData.value} 回復しました。`);
                    }
                    break;
                
                case 'full_heal':
                    if (resultMonster.hp === resultMonster.max_hp) {
                        console.log(`[ITEM LOG] ❌ 満タンのため回復不要。`);
                        success = false;
                    } else {
                        resultMonster.hp = resultMonster.max_hp;
                        console.log(`[ITEM LOG] ✅ HPを満タンにしました。`);
                    }
                    break;
                
                default:
                    console.warn(`[ITEM WARNING] 未知の回復タイプ: ${itemData.effect_type}`);
                    success = false;
            }
            break;

        case 'tech_machine':
            // 技マシンは対象モンスターがその技を習得できるか、などのロジックが追加で必要
            console.log(`[ITEM LOG] 💡 技マシン（タイプ: ${itemData.effect_type}）のロジックは未実装です。`);
            success = false;
            break;

        case 'candy':
            // スペシャル飴はゲーム内UIでどのモンスターの飴にするか選択後に使用されるロジック
            console.log(`[ITEM LOG] 💡 スペシャル飴（${itemData.candy_amount}個）のロジックは未実装です。`);
            success = false;
            break;

        case 'berry_capture':
        case 'berry_escape':
        case 'berry_reward':
        case 'berry_multi':
            // きのみは捕獲ロジックで使用するための情報提供が主
            // useItemが呼ばれた場合は、捕獲画面での「きのみ使用フラグ」を立てる処理になる
            console.log(`[ITEM LOG] 🍓 きのみ ${itemData.name} は捕獲ロジックでのフラグ立てに使用されます。`);
            success = true; // フラグ立ては成功と見なす
            break;

        default:
            console.warn(`[ITEM WARNING] 未知のアイテムタイプ: ${itemData.item_type}`);
            success = false;
    }
    
    // 成功した場合のみ、更新されたモンスターデータを返す
    return success ? resultMonster : null;
}

// グローバル公開
window.useItem = useItem;
