// js/animation.js

import * as THREE from 'https://cdnjs.cloudflare.com/ajax/libs/three.js/r128/three.module.js';

let mixer; // アニメーションミキサー
const clock = new THREE.Clock(); // アニメーションの時間管理

/**
 * BedrockアニメーションJSONをThree.jsのAnimationClipに変換します。
 * @param {object} animationJson - Bedrockアニメーションデータ全体
 * @param {string} animationName - 実行したいアニメーション名 (例: 'animation.taiki')
 * @returns {THREE.AnimationClip}
 */
export function createAnimationClip(animationJson, animationName) {
    const animationDef = animationJson.animations[animationName];
    if (!animationDef) {
        console.error(`Animation not found: ${animationName}`);
        return null;
    }
    
    const tracks = [];
    const length = animationDef.animation_length;

    // ボーンごとのアニメーションを処理
    for (const boneName in animationDef.bones) {
        const boneDef = animationDef.bones[boneName];

        // 1. 回転 (Rotation) トラックの処理
        if (boneDef.rotation) {
            const times = [];
            const values = []; // Quaternionの4要素 (x, y, z, w) を格納
            
            const euler = new THREE.Euler();
            const quaternion = new THREE.Quaternion();

            // JSONのキーフレームを解析
            for (const time in boneDef.rotation) {
                times.push(parseFloat(time));
                const rotationDegrees = boneDef.rotation[time]; // [Rx, Ry, Rz] (度数法)

                // 度数法をラジアンに変換し、Euler (オイラー角) に設定
                euler.set(
                    THREE.MathUtils.degToRad(rotationDegrees[0]),
                    THREE.MathUtils.degToRad(rotationDegrees[1]),
                    THREE.MathUtils.degToRad(rotationDegrees[2]),
                    'ZYX' // Minecraft Bedrockのボーン回転順序に合わせて調整が必要な場合があります
                );
                
                // オイラー角をQuaternionに変換
                quaternion.setFromEuler(euler);

                // 値の配列に Quaternion の要素を追加
                values.push(quaternion.x, quaternion.y, quaternion.z, quaternion.w);
            }
            
            // QuaternionKeyframeTrackを作成
            const rotationTrack = new THREE.QuaternionKeyframeTrack(
                `${boneName}.rotation`, // トラック名: "ボーン名.rotation"
                times,
                values
            );
            tracks.push(rotationTrack);
        }
        
        // 2. 位置 (Position) トラックの処理 (今回はtaikiアニメーションでは使用しないが汎用的に実装)
        if (boneDef.position) {
            // ... (positionトラックの処理ロジックも同様に実装可能) ...
        }
    }

    // アニメーションクリップを作成
    const clip = new THREE.AnimationClip(animationName, length, tracks);
    return clip;
}

/**
 * モデルにアニメーションミキサーを設定し、アニメーションを開始します。
 * @param {THREE.Object3D} model - アニメーションを適用するルートオブジェクト (ボールモデルのグループ)
 * @param {THREE.AnimationClip} clip - 実行するアニメーションクリップ
 */
export function startAnimation(model, clip) {
    // ミキサーがなければ初期化
    if (!mixer || mixer.getRoot() !== model) {
        mixer = new THREE.AnimationMixer(model);
    }
    
    // 既存のアクションを停止し、新しいアクションを再生
    mixer.stopAllAction();
    const action = mixer.clipAction(clip);
    action.setLoop(THREE.LoopRepeat, Infinity); // ループ設定
    action.play();
    
    console.log(`Animation '${clip.name}' started.`);
}

/**
 * アニメーションを停止します。
 */
export function stopAnimation() {
    if (mixer) {
        mixer.stopAllAction();
        console.log("All animations stopped.");
    }
}

/**
 * 毎フレーム呼ばれるアニメーション更新関数
 */
export function updateAnimations() {
    if (mixer) {
        // 前回のフレームからの経過時間を取得
        const delta = clock.getDelta();
        mixer.update(delta);
    }
}
