// pokemon.js

// データを格納するグローバル変数
let POKEMON_DATA = { typeBoosts: {}, pokemonList: [] };

// ⭐ 福島市役所の緯度 (これより北を寒い場所と定義)
const FUKUSHIMA_CITY_HALL_LAT = 37.7505;

// ===========================================
// データのロード (非同期)
// ===========================================
/**
 * 外部の pokemon.json ファイルからデータを非同期でロードする
 */
async function loadPokemonData() {
    try {
        // ⭐ 開発環境に合わせてパスを調整してください ⭐
        const response = await fetch('./pokemon.json');
        if (!response.ok) {
            throw new Error(`HTTP error! status: ${response.status}`);
        }
        POKEMON_DATA = await response.json();
        console.log("[POKEMON_JS] ポケモンデータとブースト値をロードしました。");
        
    } catch (error) {
        console.error("[POKEMON_JS ERROR] ポケモンデータのロードに失敗しました:", error);
    }
}

// データの初期ロードを実行
loadPokemonData();

// ===========================================
// 環境判定ロジック
// ===========================================

/**
 * 緯度・経度に基づいて周辺の環境を判定する
 * 実際には周辺のPOI(Point of Interest)データを参照する必要がある
 * @param {number} lat 緯度
 * @param {number} lng 経度
 * @returns {string[]} 適用される環境キーの配列 (例: ['PARK', 'COLD'])
 */
function determineEnvironment(lat, lng) {
    const environments = [];

    // 1. 温度判定 (緯度ベース)
    if (lat > FUKUSHIMA_CITY_HALL_LAT) {
        // 福島市役所よりも北側 = 寒い
        environments.push('COLD');
        console.log(`[ENV] 寒い地域 (緯度: ${lat}) が適用されます。`);
    } else if (lat < 30) { 
        // 緯度30度を下回る = 暖かい (例: 九州南部、沖縄方面)
        environments.push('HOT');
        console.log(`[ENV] 暖かい地域 (緯度: ${lat}) が適用されます。`);
    }

    // 2. ランドマーク判定 (シミュレーション)
    // lngが特定の値の範囲内であれば公園とする (皇居周辺のシミュレーション)
    if (lng > 139.75 && lng < 139.77 && lat > 35.68 && lat < 35.69) { 
        environments.push('PARK');
        console.log(`[ENV] 公園エリアが適用されます。`);
    } else if (lng > 139.76 && lng < 139.765) {
         environments.push('BUILDING');
         console.log(`[ENV] 建物エリアが適用されます。`);
    }
    
    // キャンプ場のシミュレーション
    if (lat > 35.65 && lat < 35.66 && lng > 139.7 && lng < 139.71) {
        environments.push('CAMP');
        console.log(`[ENV] キャンプ場エリアが適用されます。`);
    }
    
    return environments;
}

// ===========================================
// ポケモン出現ロジック
// ===========================================

/**
 * 指定された座標で出現しやすいポケモンを抽選する
 * 緯度・経度から環境を判定し、タイプブーストを適用して重み付き抽選を行う。
 * @param {number} lat 緯度
 * @param {number} lng 経度
 * @returns {object | null} 抽選されたポケモンオブジェクト (name, japanese, types, idを含む)
 */
export function spawnPokemonByType(lat, lng) {
    // データが未ロードの場合は抽選をスキップ
    if (!POKEMON_DATA.pokemonList || POKEMON_DATA.pokemonList.length === 0) {
        console.warn("[SPAWN] ポケモンデータがまだロードされていません。");
        return null;
    }

    const environments = determineEnvironment(lat, lng);
    // デフォルトブースト (DEFAULTのブースト値は1.0) を初期値とする
    const boosts = { ...POKEMON_DATA.typeBoosts.DEFAULT }; 

    // 環境に基づいてブースト値を合成する (ブースト値を乗算して効果を累積)
    environments.forEach(env => {
        const envBoosts = POKEMON_DATA.typeBoosts[env];
        if (envBoosts) {
            for (const type in envBoosts) {
                // 既存のブースト値に乗算
                boosts[type] = (boosts[type] || 1.0) * envBoosts[type];
            }
        }
    });
    
    console.log("計算されたタイプブースト:", boosts);
    
    // 2. 重み付きリストの作成 (複合タイプ対応)
    const weightedPokemonList = [];
    let totalWeight = 0;

    POKEMON_DATA.pokemonList.forEach(pokemon => {
        let finalWeight = 0; // このポケモンの最終的な重み
        
        // 複合タイプの場合、該当するすべてのタイプのブースト値を加算して重みとする
        pokemon.types.forEach(type => {
            // タイプごとのブースト値を取得。ブーストが未定義の場合は1.0を使用。
            finalWeight += boosts[type] || 1.0; 
        });

        // 重みが0の場合は最低値1.0を保証
        finalWeight = Math.max(1.0, finalWeight); 
        
        weightedPokemonList.push({
            pokemon: pokemon,
            weight: finalWeight, // 最終的な重みをセット
            startRange: totalWeight // 抽選範囲の開始位置
        });
        totalWeight += finalWeight; // 合計重みの更新
    });

    // 3. 乱数で抽選
    const randomNumber = Math.random() * totalWeight;
    console.log(`[SPAWN] 総重み: ${totalWeight}, 抽選値: ${randomNumber}`);

    // 抽選を実行
    for (const item of weightedPokemonList) {
        if (randomNumber >= item.startRange && randomNumber < item.startRange + item.weight) {
            console.log(`[SPAWN] ポケモンを抽選: ${item.pokemon.japanese} (タイプ: ${item.pokemon.types.join('/')}, 重み: ${item.weight})`);
            return item.pokemon;
        }
    }
    
    // 念のため、抽選に失敗した場合のフォールバック (リストからランダムに選択)
    return POKEMON_DATA.pokemonList[Math.floor(Math.random() * POKEMON_DATA.pokemonList.length)];
}
