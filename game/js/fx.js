// コマンドを出したときの、地図の上の小さな演出（1秒ほど。操作は止めない）
//  商業：小判がはねる  開墾：緑の輪が広がり芽が出る  殖産：煙と歯車  施し：米俵が降る  築城：石垣がせり上がる
//  徴兵：のぼりが集まる  造船：港に船が浮かぶ  登用：人材の札が返る
//  同盟：都どうしを光の弧で結ぶ  停戦：白旗  交易：荷車が走る  贈り物：箱が弧を描いて飛ぶ  手切れ：弧がぷつっと切れる
//  配置・委任：しるしが落ちて輪が光る
import * as THREE from 'three';
import { RAMP } from './mat.js?v=20261026a';

export function createFx({ scene, camera, ctl, marks, owners }) {
  const group = new THREE.Group();
  scene.add(group);
  const live = [];
  const toon = c => new THREE.MeshToonMaterial({ color: c, gradientMap: RAMP, transparent: true });
  const labels = document.getElementById('labels');
  const V = new THREE.Vector3();
  const sc = () => Math.max(1, Math.min(40, ctl.st.dist / 60));

  function add(obj, dur, step, done) { group.add(obj); live.push({ obj, t: 0, dur, step, done }); }
  function burst(pos, n, geo, color, opt = {}) {
    const s = sc();
    for (let i = 0; i < n; i++) {
      const m = new THREE.Mesh(geo, toon(color));
      const a = i / n * Math.PI * 2 + Math.random() * 0.5, sp = (opt.spread || 1.2) * (0.6 + Math.random() * 0.6);
      const vx = Math.cos(a) * sp, vz = Math.sin(a) * sp, vy = (opt.up ?? 3) * (0.7 + Math.random() * 0.6);
      const y0 = opt.from === 'sky' ? 5 : 0.4;
      m.scale.setScalar(s);
      add(m, opt.dur || 1.2, k => {
        const t = k * (opt.dur || 1.2);
        const y = opt.from === 'sky' ? y0 - t * 5 : y0 + vy * t - 4.5 * t * t;
        m.position.set(pos.x + vx * t * s, pos.y + Math.max(0, y) * s, pos.z + vz * t * s);
        m.rotation.set(t * 6, t * 4, 0);
        m.material.opacity = 1 - Math.max(0, (k - 0.7) / 0.3);
      });
    }
  }
  function ring(pos, color, opt = {}) {
    const s = sc();
    const m = new THREE.Mesh(new THREE.TorusGeometry(1, 0.12, 6, 40).rotateX(Math.PI / 2), new THREE.MeshBasicMaterial({ color, transparent: true }));
    add(m, opt.dur || 1.0, k => { const r = (0.5 + k * (opt.r || 3)) * s; m.scale.set(r, s, r); m.position.set(pos.x, pos.y + 0.3 * s + (opt.rise || 0) * k * s, pos.z); m.material.opacity = 1 - k; }, () => m.geometry.dispose());
  }
  function arc(a, b, color, opt = {}) {
    const h = Math.max(4, a.distanceTo(b) * 0.25);
    const curve = new THREE.QuadraticBezierCurve3(a.clone().setY(a.y + 1), new THREE.Vector3((a.x + b.x) / 2, Math.max(a.y, b.y) + h, (a.z + b.z) / 2), b.clone().setY(b.y + 1));
    const r = Math.max(0.3, sc() * 0.35);
    const geo = new THREE.TubeGeometry(curve, 48, r, 6);
    const m = new THREE.Mesh(geo, new THREE.MeshBasicMaterial({ color, transparent: true }));
    geo.setDrawRange(0, 0);
    const total = geo.index.count;
    add(m, opt.dur || 1.6, k => {
      const grow = Math.min(1, k / 0.5);
      geo.setDrawRange(0, Math.floor(total * grow / 6) * 6);
      if (opt.cut && k > 0.6) { m.position.y = -(k - 0.6) * 20 * sc() * 0.2; }
      m.material.opacity = k < 0.7 ? 1 : 1 - (k - 0.7) / 0.3;
    }, () => geo.dispose());
    return curve;
  }
  function rider(curve, geo, color, dur = 1.4) {
    const m = new THREE.Mesh(geo, toon(color));
    m.scale.setScalar(sc());
    add(m, dur, k => { const p = curve.getPoint(Math.min(1, k)); m.position.copy(p); m.rotation.y = k * 8; m.material.opacity = k > 0.9 ? (1 - k) * 10 : 1; });
  }
  function text(pos, str, cls = 'good', dur = 1.4) {
    const el = document.createElement('div');
    el.className = 'float ' + cls + ' fx';
    el.textContent = str;
    labels.appendChild(el);
    const r = () => document.getElementById('c').getBoundingClientRect();
    live.push({ obj: null, t: 0, dur, step: k => {
      V.set(pos.x, pos.y + 4 * sc() + k * 3 * sc(), pos.z).project(camera);
      const R = r();
      el.style.opacity = String(k < 0.8 ? 1 : (1 - k) * 5);
      el.style.transform = `translate(${(V.x + 1) / 2 * R.width}px, ${(1 - V.y) / 2 * R.height}px) translate(-50%, -100%) scale(${0.8 + Math.min(1, k * 4) * 0.2})`;
    }, done: () => el.remove() });
  }
  const P = id => { const s = marks.seatPos(id); return s ? new THREE.Vector3(s.x, s.y, s.z) : null; };
  const G = {
    coin: new THREE.CylinderGeometry(0.28, 0.28, 0.08, 14).rotateX(Math.PI / 2),
    sprout: new THREE.ConeGeometry(0.18, 0.5, 5),
    puff: new THREE.IcosahedronGeometry(0.45, 1),
    gear: new THREE.TorusGeometry(0.35, 0.12, 4, 8),
    bale: new THREE.CylinderGeometry(0.25, 0.25, 0.5, 10).rotateZ(Math.PI / 2),
    stone: new THREE.BoxGeometry(0.5, 0.35, 0.35),
    flag: new THREE.BoxGeometry(0.06, 0.5, 0.7).translate(0, 0.9, 0.35),
    box: new THREE.BoxGeometry(0.6, 0.6, 0.6),
    cart: new THREE.BoxGeometry(0.9, 0.45, 0.55),
    badge: new THREE.CylinderGeometry(0.5, 0.5, 0.12, 20),
    scroll: new THREE.CylinderGeometry(0.22, 0.22, 0.9, 10).rotateZ(Math.PI / 2)
  };

  // type：コマンドの種類  a：市町村（または勢力の都）  b：相手の都（外交）
  function play(type, o) {
    const p = o.at ? P(o.at) : null;
    const fa = o.f !== undefined ? owners.factions[o.f] : null, fb = o.target !== undefined ? owners.factions[o.target] : null;
    const pa = fa ? P(fa.capital) : null, pb = fb ? P(fb.capital) : null;
    const col = fa ? fa.color : '#ffd23f';
    const T = (pos, str, cls, dur) => text(pos, (o.by ? o.by + '：' : '') + str, cls, dur);   // 知事代理の手は「名前：」を前に（2026-10-21）
    switch (type) {
      case 'shogyo': burst(p, 10, G.coin, '#ffcf3f', { up: 4 }); T(p, '商い ↑'); break;
      case 'kaikon': ring(p, '#4caf50', { r: 4 }); burst(p, 8, G.sprout, '#6fcf5a', { up: 2, spread: 2 }); T(p, '田畑 ↑'); break;
      case 'shokusan': burst(p, 6, G.puff, '#eeeeee', { up: 5, spread: 0.5 }); burst(p, 2, G.gear, '#9aa5b1', { up: 4, spread: 0.3 }); T(p, '工場 ↑'); break;
      case 'hodokoshi': burst(p, 8, G.bale, '#e8c27a', { from: 'sky', spread: 1.5 }); ring(p, '#ff7eb6', { r: 2.5 }); T(p, '民心 ↑'); break;
      case 'chikujo': {
        const s = sc();
        for (let i = 0; i < 12; i++) {
          const m = new THREE.Mesh(G.stone, toon('#c9c2b4')), a = i / 12 * Math.PI * 2;
          m.scale.setScalar(s); m.rotation.y = -a;
          add(m, 1.4, k => { m.position.set(p.x + Math.cos(a) * 1.8 * s, p.y + (Math.min(1, k * 2) - 1) * 0.6 * s + 0.2 * s, p.z + Math.sin(a) * 1.8 * s); m.material.opacity = k > 0.85 ? (1 - k) / 0.15 : 1; });
        }
        T(p, '守り ↑'); break;
      }
      case 'chohei': burst(p, 6, G.flag, col, { up: 1.5, spread: 2.5 }); ring(p, col, { r: 2.5 }); T(p, `+${(o.n || 0).toLocaleString()}人`); break;
      case 'zosen': { const m = new THREE.Mesh(new THREE.BoxGeometry(1.4, 0.4, 0.5), toon('#ffffff')), s = sc(); m.scale.setScalar(s); add(m, 1.4, k => { m.position.set(p.x + 2 * s, -0.6 * s + Math.min(1, k * 2) * 0.7 * s, p.z + 2 * s); m.rotation.z = Math.sin(k * 12) * 0.1; m.material.opacity = k > 0.85 ? (1 - k) / 0.15 : 1; }); ring(new THREE.Vector3(p.x + 2 * s, 0, p.z + 2 * s), '#ffffff', { r: 2 }); T(p, '船 +1'); break; }
      case 'toyo': T(p, o.name ? `${o.name} 仕官！` : '見つからず', o.name ? 'good card' : 'bad'); if (o.name) ring(p, '#ffd23f', { r: 2 }); break;
      case 'domei': if (pa && pb) { arc(pa, pb, '#ffd23f'); ring(pa, '#ffd23f'); ring(pb, '#ffd23f'); T(pb, o.ok ? '同盟！' : '断られた', o.ok ? 'good' : 'bad'); } break;
      case 'teisen': if (pa && pb) { if (o.ok) { burst(pa, 1, G.flag, '#ffffff', { up: 2, spread: 0 }); burst(pb, 1, G.flag, '#ffffff', { up: 2, spread: 0 }); } arc(pa, pb, '#ffffff'); T(pb, o.ok ? '停戦' : '断られた', o.ok ? 'good' : 'bad'); } break;
      case 'koeki': if (pa && pb) { const c = arc(pa, pb, '#ff9f43'); if (o.ok) rider(c, G.cart, '#ff9f43'); T(pb, o.ok ? '交易！' : '断られた', o.ok ? 'good' : 'bad'); } break;
      case 'okurimono': if (pa && pb) { const c = arc(pa, pb, '#ff7eb6', { dur: 1.2 }); rider(c, G.box, '#ff7eb6', 1.2); T(pb, '贈り物'); } break;
      case 'tegire': if (pa && pb) { arc(pa, pb, '#ff5a5f', { cut: true }); T(pb, '手切れ', 'bad'); } break;
      case 'haichi': if (p) { burst(p, 1, G.badge, col, { from: 'sky', spread: 0, dur: 1.0 }); ring(p, col, { r: 2 }); T(p, `${o.name} 着任`); } break;
      case 'vassal': if (p) { burst(p, 9, G.flag, col, { up: 1.8, spread: 3 }); ring(p, col, { r: 6, dur: 1.6 }); ring(p, '#ffffff', { r: 4, dur: 1.3 }); T(p, '臣従', 'good card', 1.8); } break;
      case 'envoy': if (pa && pb) { const c = arc(pa, pb, col, { dur: 1.7 }); rider(c, G.scroll, '#f3e2c7', 1.5); ring(pb, col, { r: 3, dur: 1.6 }); } break;
      case 'deleg': if (p) { ring(p, col, { r: 8, dur: 1.4 }); ring(p, col, { r: 5, dur: 1.2 }); T(p, `${o.name}に任せた`); } break;
    }
  }
  function update(dt) {
    for (let i = live.length - 1; i >= 0; i--) {
      const L = live[i];
      L.t += dt;
      const k = Math.min(1, L.t / L.dur);
      L.step(k);
      if (k >= 1) { if (L.obj) { group.remove(L.obj); L.obj.material?.dispose?.(); } L.done && L.done(); live.splice(i, 1); }
    }
  }
  return { play, update };
}
