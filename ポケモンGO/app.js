// ... (app.js の他の関数や変数は変更なし) ...

// **********************************
// 4. データロード関数
// **********************************

// ... (loadGymsAndPokestops 関数は変更なし) ...

// 野生ポケモンのロード
let wildPokemonLayer = L.layerGroup();

function loadWildPokemon(lat, lng) {
    wildPokemonLayer.clearLayers();
    wildPokemonLayer.addTo(map);
    
    console.log(`野生ポケモンを現在地付近にロード (lat:${lat}, lng:${lng})`); // 値を出力
    
    // デモ: 現在地から少し離れた場所にピカチュウを配置
    const pikaId = 25; 
    const pikaLat = lat + 0.0005;
    const pikaLng = lng - 0.0005;
    
    // ポケモンアイコン (assets/button_icon_M{p-id}.png を使用)
    // ⬇️ 修正箇所 1: パスを ../assets/ に変更 ⬇️
    const pikaIcon = L.icon({
        iconUrl: `../assets/button_icon_M${pikaId}.png`,
        iconSize: [40, 40],
        iconAnchor: [20, 20]
    });
    // ⬆️ 修正箇所 1 終わり ⬆️

    const pikaMarker = L.marker([pikaLat, pikaLng], {icon: pikaIcon}).addTo(wildPokemonLayer)
        .bindPopup('野生のピカチュウ！');
        
    pikaMarker.on('click', () => {
        // ポケモンアイコンクリックで捕獲画面に遷移
        window.navigate('/capture');
    });
}

// ポケモンリストのロード (静的JSON使用)
async function loadPokemonList() {
    const container = document.getElementById('pokemon-list-content');
    container.innerHTML = '<p style="text-align: center;">...ロード中...</p>';
    
    try {
        const response = await fetch('../pokemon.json');
        const masterData = await response.json();
        
        // ユーザーが捕まえたポケモンデータ (デモ)
        const userPokemon = [
            { id: 25, cp: 850 }, // ピカチュウ
            { id: 1, cp: 420 },  // フシギダネ
            { id: 4, cp: 710 },  // ヒトカゲ
        ];
        
        const getPokemonInfo = (id) => masterData.pokemonList.find(p => p.id === id);


        let html = '<h3>所持ポケモン (' + userPokemon.length + '匹)</h3><div style="display: flex; flex-wrap: wrap; gap: 10px;">';
        
        userPokemon.forEach(p => {
            const info = getPokemonInfo(p.id);
            const name = info ? info.japanese : '不明なポケモン';
            
            // ポケモンアイコン (assets/button_icon_M{p-id}.png を使用)
            // ⬇️ 修正箇所 2: パスを ../assets/ に変更 ⬇️
            const iconPath = `../assets/button_icon_M${p.id}.png`;
            // ⬆️ 修正箇所 2 終わり ⬆️
            
            html += `<div style="border: 1px solid #ccc; padding: 10px; border-radius: 5px; width: 100px; text-align: center;">
                        <img src="${iconPath}" alt="${name}" style="width: 50px; height: 50px;"><br>
                        <strong>${name}</strong><br>
                        CP: ${p.cp}
                    </div>`;
        });
        html += '</div>';

        container.innerHTML = html;
        console.log(`Pokemon Master Data Loaded: ${masterData.comment}`); // 値を出力
        
    } catch (error) {
        container.innerHTML = `<p style="color: red;">ポケモンデータのロードに失敗しました: ${error}</p>`;
    }
}

// 道具バッグのロード (静的JSON使用)
async function loadInventory() {
    const container = document.getElementById('inventory-content');
    container.innerHTML = '<p style="text-align: center;">...ロード中...</p>';
    
    try {
        const response = await fetch('../item.json');
        const itemData = await response.json();
        
        // ユーザーの所持アイテムデータ (デモ: item.id または itemKey で管理)
        const userItemCounts = {
            "POKEBALL": 50,
            "SUPERBALL": 20,
            "POTION": 15,
            "REVIVE": 5
        };

        let html = '<h3>バッグの中身</h3><ul>';
        
        for (const categoryKey in itemData) {
            html += `<h4>${categoryKey}</h4>`;
            for (const itemKey in itemData[categoryKey]) {
                const item = itemData[categoryKey][itemKey];
                const count = userItemCounts[itemKey] || 0; // 所持数を取得
                
                if (count > 0) {
                    // アイテムアイコン (assets/item/{id}.png を使用)
                    // ⬇️ 修正箇所 3: パスを ../assets/ に変更 ⬇️
                    const iconPath = `../assets/item/${item.id}.png`;
                    // ⬆️ 修正箇所 3 終わり ⬆️
                    
                    html += `<li style="margin-bottom: 8px; display: flex; align-items: center;">
                                <img src="${iconPath}" alt="${item.japanese}" style="width: 30px; height: 30px; margin-right: 10px;">
                                <div>
                                    <strong>${item.japanese}</strong>: ${count} 個 <br>
                                    <small>(${item.description_ja})</small>
                                </div>
                            </li>`;
                }
            }
        }
        html += '</ul>';

        container.innerHTML = html;
        console.log(`itemData keys: ${Object.keys(itemData).join(', ')}`); // 値を出力

    } catch (error) {
        container.innerHTML = `<p style="color: red;">アイテムデータのロードに失敗しました: ${error}</p>`;
    }
}

// ... (アプリケーション起動部分は変更なし) ...
