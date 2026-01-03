// input_state.js
const inputState = {
    forward: 0,
    backward: 0,
    left: 0,
    right: 0,
    jump: false,
    crouch: false
};

// キーボードイベント
window.addEventListener('keydown', (e) => {
    switch(e.code) {
        case 'KeyW': inputState.forward = 1; break;
        case 'KeyS': inputState.backward = 1; break;
        case 'KeyA': inputState.left = 1; break;
        case 'KeyD': inputState.right = 1; break;
        case 'Space': inputState.jump = true; break;
        case 'ShiftLeft': inputState.crouch = true; break;
    }
    console.log(`Input Update:`, inputState);
});

window.addEventListener('keyup', (e) => {
    switch(e.code) {
        case 'KeyW': inputState.forward = 0; break;
        case 'KeyS': inputState.backward = 0; break;
        case 'KeyA': inputState.left = 0; break;
        case 'KeyD': inputState.right = 0; break;
        case 'Space': inputState.jump = false; break;
        case 'ShiftLeft': inputState.crouch = false; break;
    }
});

// モバイルボタンイベント
const jumpBtn = document.getElementById('btn-jump');
jumpBtn.addEventListener('touchstart', () => { inputState.jump = true; });
jumpBtn.addEventListener('touchend', () => { inputState.jump = false; });

const crouchBtn = document.getElementById('btn-crouch');
crouchBtn.addEventListener('touchstart', () => { inputState.crouch = true; });
crouchBtn.addEventListener('touchend', () => { inputState.crouch = false; });
