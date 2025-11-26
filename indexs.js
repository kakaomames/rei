/**
 * @license
 * Copyright 2019 Google LLC. All Rights Reserved.
 * SPDX-License-Identifier: Apache-2.0
 */

// ===========================================
// Google Maps 初期化とグローバル変数
// ===========================================
let map;
let playerMarker;
let pokemonMarkers = [];
let landmarkMarkers = [];

// ⭐ ポケストップとジムのデータ
const LANDMARKS = [
    // 緯度、経度、タイプをここに設定
    {"lat": 35.6816, "lng": 139.766, "type": "gym"},
    {"lat": 35.6808, "lng": 139.7675, "type": "pokestop"},
];
const LANDMARK_ICONS = {
    'gym': 'https://example.com/gym.png', // ⭐ 実際の画像URL/Base64に置き換えてください
    'pokestop': 'https://example.com/pokestop.png' // ⭐ 実際の画像URL/Base64に置き換えてください
};
const POKEMON_ICONS = {
    'pikachu': 'https://example.com/pikachu.png', // ⭐ 実際の画像URL/Base64に置き換えてください
};

// ===========================================
// [START maps_aerial_simple] - Google Maps APIのコールバック関数
// ===========================================
function initMap() {
    const initialCoords = { lat: 35.681236, lng: 139.767125 };

    map = new google.maps.Map(document.getElementById("map"), {
        center: initialCoords,
        zoom: 17, 
        mapId: 'DEMO_MAP_ID', 
        disableDefaultUI: true, 
        
        // ⭐ 3D表示設定
        mapTypeId: "satellite", // 衛星写真
    });
    
    // ⭐ 傾斜角度を設定 (ポケモンGOライクな65度を推奨)
    map.setTilt(65); 

    // プレイヤーマーカーの初期化
    playerMarker = new google.maps.Marker({
        position: initialCoords,
        map: map,
        title: "Player Sprite",
        icon: {
            url: 'data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAQAAAC1HAwCAAAAC0lEQVR42mNkYAAAAAYAAjCB0C8AAAAASUVORK5CYII=', // 透明画像
            scaledSize: new google.maps.Size(64, 64) 
        }
    });
    
    loadLandmarks();
    // 5分ごとにポケモンを自動生成するタイマーを開始
    setInterval(() => {
        if(playerMarker && map) {
            const pos = playerMarker.getPosition();
            spawnRandomPokemon(pos.lat(), pos.lng());
        }
    }, 5 * 60 * 1000); 

    console.log("[Map] Google Map initialized (3D Enabled, Dynamic Ready).");
}

// ===========================================
// ランドマーク/ポケモン配置ロジック
// ===========================================

function loadLandmarks() {
    LANDMARKS.forEach(landmark => {
        const icon = {
            url: LANDMARK_ICONS[landmark.type] || 'https://developers.google.com/maps/documentation/javascript/load-maps-js-api',
            scaledSize: new google.maps.Size(48, 48)
        };
        const marker = new google.maps.Marker({
            position: { lat: landmark.lat, lng: landmark.lng },
            map: map,
            icon: icon,
            title: landmark.type
        });
        landmarkMarkers.push(marker);
    });
}

function spawnRandomPokemon(centerLat, centerLng) {
    // 50m程度のランダムな距離を計算
    const randomAngle = Math.random() * 2 * Math.PI;
    const randomDistance = Math.random() * 0.0005; 
    
    const lat = centerLat + randomDistance * Math.cos(randomAngle);
    const lng = centerLng + randomDistance * Math.sin(randomAngle);
    
    const pokemonNames = Object.keys(POKEMON_ICONS);
    const chosenPokemon = pokemonNames[Math.floor(Math.random() * pokemonNames.length)];

    const icon = {
        url: POKEMON_ICONS[chosenPokemon],
        scaledSize: new google.maps.Size(40, 40)
    };
    
    const marker = new google.maps.Marker({
        position: { lat: lat, lng: lng },
        map: map,
        icon: icon,
        title: chosenPokemon
    });
    pokemonMarkers.push(marker);

    // 15分後に自動消滅するタイマーを設定
    setTimeout(() => {
        marker.setMap(null); 
        pokemonMarkers = pokemonMarkers.filter(m => m !== marker); 
        console.log(`[Pokemon] ${chosenPokemon} despawned.`);
    }, 15 * 60 * 1000); 

    console.log(`[Pokemon] ${chosenPokemon} spawned.`);
}

// ===========================================
// マーカー/マップ更新ロジック (postMessage受信時)
// ===========================================

function updateSpriteMarker(lat, lng, imageData) {
    const newPos = { lat: lat, lng: lng };
    
    if (playerMarker) {
        playerMarker.setPosition(newPos);
        
        if (imageData && imageData.length > 50) { 
            playerMarker.setIcon({
                url: imageData, 
                scaledSize: new google.maps.Size(64, 64) 
            });
        }
        
        map.panTo(newPos); // マップをセンタリング
    }
}

function updateMapView(lat, lng, radius) {
     const newCenter = { lat: lat, lng: lng };
     map.panTo(newCenter);

     const zoomLevel = Math.max(12, Math.min(20, Math.floor(-Math.log2(radius) + 11)));
     map.setZoom(zoomLevel);
}

// ===========================================
// postMessage リスナー (Scratch拡張機能からの通信を受け取る)
// ===========================================
window.addEventListener('message', (event) => {
    // Scratch側とIframe側が同一サーバーなら event.originをチェックすべきだが、開発用に * を使用
    // if (event.origin !== "YOUR_SCRATCH_EXTENSION_HOST") return; 
    
    const data = event.data;
    if (!data || !data.type) return;

    switch (data.type) {
        case 'UPDATE_SPRITE':
            updateSpriteMarker(data.latitude, data.longitude, data.imageData);
            break;
        case 'UPDATE_MAP_VIEW':
            updateMapView(data.latitude, data.longitude, data.radius);
            break;
    }
});

// [END maps_aerial_simple]
window.initMap = initMap; // ⭐ これがGoogle Maps APIからのコールバックを可能にします
