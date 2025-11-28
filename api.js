// api.js

const LANDMARK_API_BASE_URL = 'https://xeroxapp032.vercel.app/api/listget';

/**
 * 外部APIからジムとポケストップのデータを取得し、それぞれの配列に分離して返す。
 * @param {number} lat プレイヤーの現在の緯度
 * @param {number} lng プレイヤーの現在の経度
 * @returns {{gyms: Array<Object>, pokestops: Array<Object>}} ジムとポケストップのデータオブジェクト
 */
export async function fetchLandmarkDataFromApi(lat, lng) {
    const apiEndpoint = `${LANDMARK_API_BASE_URL}?lat=${lat}&lng=${lng}`;
    
    try {
        console.log(`[API:FETCH] ランドマークデータを取得中: ${apiEndpoint}`);

        const response = await fetch(apiEndpoint);

        if (!response.ok) {
            throw new Error(`APIからのデータ取得に失敗しました: ${response.status}`);
        }

        let rawData = await response.json();
        
        // データが配列の配列になっている可能性があるため、フラット化
        const allLandmarks = rawData.flat(Infinity).filter(item => item && item.pm_type);

        const gyms = [];
        const pokestops = [];

        // pm_typeに基づいてデータを振り分け (pm_type: "2"がジム、"3"がポケストップ)
        allLandmarks.forEach(item => {
            if (item.pm_type === "2") {
                gyms.push(item);
            } else if (item.pm_type === "3") {
                pokestops.push(item);
            }
        });
        
        console.log(`[API:SUCCESS] APIからデータを取得: ジム ${gyms.length} 件、ポケストップ ${pokestops.length} 件。`);
        return { gyms, pokestops };

    } catch (error) {
        console.error("[API:ERROR] ランドマークデータの取得・処理中にエラー:", error);
        return { gyms: [], pokestops: [] };
    }
}
