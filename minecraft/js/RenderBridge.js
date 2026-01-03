// RenderBridge.js の init 部分
init: function() {
    const canvas = document.getElementById('game-canvas');
    this.scene = new THREE.Scene();
    
    // HTMLのcanvasを指定してレンダラーを作成
    this.renderer = new THREE.WebGLRenderer({ canvas: canvas, antialias: true });
    this.renderer.setSize(window.innerWidth, window.innerHeight);
    this.renderer.setPixelRatio(window.devicePixelRatio);
    
    // カメラ（これがないと何も見えない！）
    this.camera = new THREE.PerspectiveCamera(75, window.innerWidth / window.innerHeight, 0.1, 1000);
    this.camera.position.set(0, 35, 50); // スティーブが落ちるのを見守る位置
    this.camera.lookAt(0, 0, 0);

    // 光源（これがないと真っ暗！）
    const light = new THREE.DirectionalLight(0xffffff, 1);
    light.position.set(10, 20, 10);
    this.scene.add(light);
    this.scene.add(new THREE.AmbientLight(0x404040));

    console.log("RenderBridge: Canvas接続完了！モニター点灯！📺");
},

render: function() {
    this.renderer.render(this.scene, this.camera);
}
