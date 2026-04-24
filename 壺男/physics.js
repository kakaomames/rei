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
                background: '#1a1a1a'
            }
        });

        this.runner = Runner.create();
        
        Render.run(this.render);
        Runner.run(this.runner, this.engine);

        missionLog("SYSTEM", `物理世界を生成。重力設定: ${gravityY}`);
    },

    // 静的オブジェクト（地面・壁）の作成
    createStaticRect: function(x, y, w, h, label = "StaticObject") {
        const obj = Matter.Bodies.rectangle(x, y, w, h, { 
            isStatic: true,
            render: { fillStyle: '#444' }
        });
        Matter.Composite.add(this.world, obj);
        missionLog("GEOLOGY", `${label}を配置: [${x}, ${y}]`);
        return obj;
    },

    // 動的オブジェクト（壺・岩・ポケモン等）の作成
    createDynamicCircle: function(x, y, radius, options = {}) {
        const defaultOptions = {
            restitution: 0.5, // 跳ね返り
            friction: 0.1,    // 摩擦
            density: 0.001    // 密度
        };
        const obj = Matter.Bodies.circle(x, y, radius, { ...defaultOptions, ...options });
        Matter.Composite.add(this.world, obj);
        
        // 値の変化を監視する簡易的な仕組み（y座標が大きく動いた時など）
        missionLog("ACTION", `動的オブジェクト生成: radius ${radius}`);
        return obj;
    },

    // 外力を加える
    applyForce: function(body, position, force) {
        Matter.Body.applyForce(body, position, force);
        missionLog("PHYSICS", `外力適用: Force(${force.x.toFixed(2)}, ${force.y.toFixed(2)})`);
    }
};
