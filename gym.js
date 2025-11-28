// gym.js

import { getMyPokemonList, updatePokemonHp } from './pokemon.js'; // ポケモンリストとHP更新
import { renderBattleUI, renderGymInfoUI } from './pokemongo-UI.js'; // UI関数

// ⭐ ローカルストレージのキー ⭐
const GYM_DEFENDERS_KEY = 'gym_defenders';

// ===========================================
// ジムの防衛ポケモン定義 (暫定的なダミーデータ)
// ===========================================

/**
 * すべてのジムの防衛ポケモンデータを保持する
 * キーはジムID、値は防衛ポケモンの配列
 * 例: { 'gym_101': [{id: 4, cp: 1500, currentHp: 100}, ...], ... }
 */
let GYM_DEFENDERS_DATA = {};

// ===========================================
// バトル関連の定数
// ===========================================
const BASE_DAMAGE = 10;
const CP_MULTIPLIER = 0.05; // CPが高いほどダメージボーナス

// ===========================================
// ジムデータ管理関数
// ===========================================

/**
 * ローカルストレージからすべてのジムの防衛データをロードする
 */
function loadGymDefenders() {
    try {
        const storedData = localStorage.getItem(GYM_DEFENDERS_KEY);
        // データがなければ初期データを設定（ここではダミー）
        if (storedData) {
            GYM_DEFENDERS_DATA = JSON.parse(storedData);
        } else {
            // 初期ダミーデータ (カビゴンが防衛していると仮定)
            GYM_DEFENDERS_DATA = {
                // gym_101はmap_logic.jsで使われるダミーAPIデータに基づいています
                'gym_101': [
                    { id: 143, japanese: 'カビゴン', cp: 2500, maxHp: 150, currentHp: 150, uniqueId: 'g101_d1' }
                ],
                // 他のジムIDも追加可能
            };
            saveGymDefenders();
        }
    } catch (e) {
        console.error("[GYM DEFENDERS ERROR] ジム防衛データの読み込みに失敗しました。", e);
    }
}

/**
 * すべてのジムの防衛データをローカルストレージに保存する
 */
function saveGymDefenders() {
    try {
        localStorage.setItem(GYM_DEFENDERS_KEY, JSON.stringify(GYM_DEFENDERS_DATA));
    } catch (e) {
        console.error("[GYM DEFENDERS ERROR] ジム防衛データの書き込みに失敗しました。", e);
    }
}

/**
 * 指定されたジムの防衛ポケモンリストを取得する
 * @param {string} gymId ジムのID
 * @returns {Array<Object>} 防衛ポケモン配列
 */
export function getGymDefenders(gymId) {
    return GYM_DEFENDERS_DATA[gymId] || [];
}

/**
 * ダメージを与えた後、ジムの防衛ポケモンのHPを更新する
 * @param {string} gymId ジムのID
 * @param {string} defenderUniqueId 防衛ポケモンのユニークID
 * @param {number} damage 与えるダメージ量
 */
function applyDamageToDefender(gymId, defenderUniqueId, damage) {
    const defenders = GYM_DEFENDERS_DATA[gymId];
    if (!defenders) return;

    const defender = defenders.find(d => d.uniqueId === defenderUniqueId);
    if (defender) {
        defender.currentHp = Math.max(0, defender.currentHp - damage);
        saveGymDefenders();
        console.log(`[GYM BATTLE] 防衛ポケモン ${defender.japanese} に ${damage} ダメージ。残りHP: ${defender.currentHp}`);
    }
}

// ===========================================
// バトルロジック
// ===========================================

/**
 * 簡易的なバトルシミュレーションを実行する
 * @param {Object} attacker プレイヤー側のポケモン
 * @param {Object} defender ジム側のポケモン
 * @returns {number} プレイヤーが与えたダメージ
 */
function simulateAttack(attacker, defender) {
    // 簡易ダメージ計算 (CP差を考慮)
    const baseAttack = BASE_DAMAGE + (attacker.cp * CP_MULTIPLIER);
    
    // タイプ相性、技などの複雑な要素は省略
    let damage = Math.floor(baseAttack * (Math.random() * 0.5 + 0.75)); // 乱数によるブレ
    
    // ジム側の防御力などを考慮する場合、ここでダメージを減算するロジックを追加可能
    
    return damage;
}

/**
 * ジムバトル開始トリガー (UIから呼び出される)
 * @param {string} gymId バトルを仕掛けるジムのID
 */
window.openGymUI = (gymId) => {
    // 1. ジムの防衛ポケモンを取得
    const defenders = getGymDefenders(gymId);
    if (defenders.length === 0) {
        alert("このジムには防衛ポケモンがいません。");
        return;
    }
    
    // 2. プレイヤーのポケモンリストを取得
    const playerTeam = getMyPokemonList();
    if (playerTeam.length === 0) {
        alert("戦えるポケモンがいません！");
        return;
    }

    // 3. UIを切り替え、最初のバトルを開始
    console.log(`[GYM BATTLE] ジム ${gymId} へのバトル準備を開始。`);
    
    // ⭐ pokemongo-UI.js の renderBattleUI に処理を委譲
    renderBattleUI(gymId, defenders, playerTeam); 
};

/**
 * バトル画面内で実際に攻撃ボタンが押されたときの処理 (pokemongo-UI.jsから呼び出される)
 * @param {string} gymId ジムID
 * @param {Object} playerPokemon 攻撃を行うプレイヤー側のポケモン
 * @param {Object} defenderPokemon 防衛側のポケモン
 * @returns {Object} バトルの結果情報
 */
export function executeAttack(gymId, playerPokemon, defenderPokemon) {
    // 1. プレイヤーが防衛ポケモンにダメージを与える
    const playerDamage = simulateAttack(playerPokemon, defenderPokemon);
    applyDamageToDefender(gymId, defenderPokemon.uniqueId, playerDamage);

    // 2. 防衛ポケモンがプレイヤーに反撃 (簡易版)
    const defenderDamage = simulateAttack(defenderPokemon, playerPokemon);
    // プレイヤーのポケモンのHPを更新 (pokemon.jsに更新ロジックがあることを想定)
    updatePokemonHp(playerPokemon.uniqueId, -defenderDamage); 

    let battleStatus = 'CONTINUE';

    if (defenderPokemon.currentHp <= 0) {
        battleStatus = 'DEFEATED'; // 勝利！
    } else if (playerPokemon.currentHp <= 0) {
        battleStatus = 'FAINTED'; // プレイヤーのポケモンがひんし
    }
    
    // バトルログの表示
    console.log(`[BATTLE LOG] ${playerPokemon.japanese} が ${defenderPokemon.japanese} に ${playerDamage} ダメージ!`);
    
    return {
        playerDamage: playerDamage,
        defenderDamage: defenderDamage,
        defenderCurrentHp: defenderPokemon.currentHp,
        playerCurrentHp: playerPokemon.currentHp,
        status: battleStatus
    };
}

// ページロード時に防衛データをロード
document.addEventListener('DOMContentLoaded', loadGymDefenders);
console.log("🔥 [GYM] gym.js の定義が完了しました。ジム防衛データ初期ロード済み。");
