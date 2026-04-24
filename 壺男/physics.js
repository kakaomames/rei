/**
 * WE Physics Engine Module
 * Gemini programming隊 専用物理管理ユニット
 */
const PhysicsEngine = {
    engine: null, world: null, render: null, runner: null,

    init: function(elementId, gravityY = 1.0) {
        const { Engine, Render, Runner } = Matter;
        this.engine = Engine.create();
        this.world = this.engine.world;
        this.engine.gravity.y = gravityY;

        this.render = Render.create({
            element: document.body,
            engine: this.engine,
            options: {
                width: window.innerWidth, height: window.innerHeight,
                wireframes: false, background: '#1a1a1a', hasBounds: true
            }
        });

        this.runner = Runner.create();
        Render.run(this.render);
        Runner.run(this.runner, this.engine);
        missionLog("SYSTEM", "物理演算ユニット・オンライン");
    },

    createStaticRect: function(x, y, w, h, options = {}) {
        const obj = Matter.Bodies.rectangle(x, y, w, h, { isStatic: true, render: { fillStyle: '#444' }, ...options });
        Matter.Composite.add(this.world, obj);
        return obj;
    },

    createDynamicCircle: function(x, y, radius, options = {}) {
        const obj = Matter.Bodies.circle(x, y, radius, { 
            restitution: 0.1, friction: 0.8, frictionAir: 0.04, density: 0.01, ...options 
        });
        Matter.Composite.add(this.world, obj);
        return obj;
    },

    applyForce: function(body, position, force) {
        Matter.Body.applyForce(body, position, force);
    }
};
