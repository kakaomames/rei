/**
 * WE Physics Engine Module (物理演算.js)
 * Gemini programming隊 専用地質・物理管理ユニット
 */

const PhysicsEngine = {
    engine: null,
    world: null,
    render: null,
    runner: null,

    // 物理世界の初期化
    init: function(elementId, gravityY = 1.0) {
        const { Engine, Render, Runner } = Matter;

        this.engine = Engine.create();
        this.world = this.engine.world;
        
        // 重力の設定
        this.engine.gravity.y = gravityY;

        this.render = Render.create({
            element: document.body,
            engine: this.engine,
            options: {
                width: window.innerWidth,
                height: window.innerHeight,
                wireframes: false,
                background: '#1a1a1a',
                hasBounds: true // カメラ（境界）移動を有効にする
            }
        });

        this.runner = Runner.create();
        
        Render.run(this.render);
        Runner.run(this.runner, this.engine);

        missionLog("SYSTEM", `物理世界を生成。重力設定: ${gravityY}`);
    },

    // 静的オブジェクト（地面・壁・岩）の作成
    createStaticRect: function(x, y, w, h, options = {}) {
        const defaultOptions = { 
            isStatic: true,
            render: { fillStyle: '#444' }
        };
        const obj = Matter.Bodies.rectangle(x, y, w, h, { ...defaultOptions, ...options });
        Matter.Composite.add(this.world, obj);
        return obj;
    },

    // 動的オブジェクト（壺・ポケモン等）の作成
    createDynamicCircle: function(x, y, radius, options = {}) {
        const defaultOptions = {
            restitution: 0.1, // 跳ね返り（壺男はあまり跳ねない）
            friction: 0.5,    // 摩擦
            density: 0.01     // 密度
        };
        const obj = Matter.Bodies.circle(x, y, radius, { ...defaultOptions, ...options });
        Matter.Composite.add(this.world, obj);
        
        missionLog("ACTION", `動的オブジェクト生成: radius ${radius} at [${x.toFixed(0)}, ${y.toFixed(0)}]`);
        return obj;
    },

    // 外力を加える
    applyForce: function(body, position, force) {
        Matter.Body.applyForce(body, position, force);
    }
};
