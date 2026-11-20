// 地図のカメラ操作：1本指/左ドラッグで移動、2本指でつまんで拡大・ひねって回転、ホイールで拡大、右ドラッグで回転
// 指の解除は GAME_TOUCH_RULES.md 3節に合わせる（capture・window の pointerup・touchend の安全網）
import * as THREE from 'three';

export function createControls(canvas, camera, W, onTap, box) {
  const st = {
    target: new THREE.Vector3(0, 0, 0), dist: 500, yaw: 0,
    vel: new THREE.Vector2(), fly: null
  };
  const MIN = 9, MAX = 26000;
  const pitchOf = d => THREE.MathUtils.lerp(0.78, 1.2, THREE.MathUtils.smoothstep(d, 12, 6000));
  const ray = new THREE.Raycaster(), plane = new THREE.Plane(new THREE.Vector3(0, 1, 0), 0), ndc = new THREE.Vector2(), hit = new THREE.Vector3();

  function apply() {
    const p = pitchOf(st.dist);
    st.target.x = THREE.MathUtils.clamp(st.target.x, box.x0, box.x1);
    st.target.z = THREE.MathUtils.clamp(st.target.z, box.z0, box.z1);
    const gy = Math.max(0.3, W.heightAt(st.target.x, st.target.z));
    st.target.y += (gy - st.target.y) * 0.15;
    camera.position.set(
      st.target.x + Math.sin(st.yaw) * Math.cos(p) * st.dist,
      st.target.y + Math.sin(p) * st.dist,
      st.target.z + Math.cos(st.yaw) * Math.cos(p) * st.dist
    );
    camera.lookAt(st.target);
    camera.near = Math.max(0.2, st.dist * 0.02);
    camera.far = st.dist * 4 + 2000;
    camera.updateProjectionMatrix();
  }
  function ground(cx, cy, out) {
    const r = canvas.getBoundingClientRect();
    ndc.set((cx - r.left) / r.width * 2 - 1, -((cy - r.top) / r.height) * 2 + 1);
    ray.setFromCamera(ndc, camera);
    plane.constant = -st.target.y;
    return ray.ray.intersectPlane(plane, out);
  }

  const ptrs = new Map();
  let tap = null, last = null, pinch = null;
  const recovering = () => document.documentElement.classList.contains('zoom-recovery');

  function down(e) {
    if (recovering()) return;
    canvas.setPointerCapture?.(e.pointerId);
    ptrs.set(e.pointerId, { x: e.clientX, y: e.clientY, b: e.button });
    st.vel.set(0, 0); st.fly = null;
    if (ptrs.size === 1) tap = { x: e.clientX, y: e.clientY, t: performance.now() };
    else tap = null;
    pinch = null;
  }
  function move(e) {
    const p = ptrs.get(e.pointerId);
    if (!p) return;
    const prev = { x: p.x, y: p.y };
    p.x = e.clientX; p.y = e.clientY;
    if (tap && Math.hypot(p.x - tap.x, p.y - tap.y) > 8) tap = null;
    if (ptrs.size === 1) {
      if (p.b === 2 || e.ctrlKey) { st.yaw -= (p.x - prev.x) * 0.006; apply(); return; }
      const a = ground(prev.x, prev.y, new THREE.Vector3()), b = ground(p.x, p.y, new THREE.Vector3());
      if (a && b) {
        st.target.x += a.x - b.x; st.target.z += a.z - b.z;
        const now = performance.now();
        if (last) { const dtm = Math.max(1, now - last) / 1000; st.vel.set((a.x - b.x) / dtm, (a.z - b.z) / dtm); }
        last = now;
        apply();
      }
    } else if (ptrs.size === 2) {
      const [A, B] = [...ptrs.values()];
      const d = Math.hypot(A.x - B.x, A.y - B.y), ang = Math.atan2(B.y - A.y, B.x - A.x), mx = (A.x + B.x) / 2, my = (A.y + B.y) / 2;
      if (pinch) {
        // 前の中点の下にあった地面が、いまの中点の下に来るように
        const anchor = ground(pinch.mx, pinch.my, new THREE.Vector3());
        st.dist = THREE.MathUtils.clamp(st.dist * pinch.d / d, MIN, MAX);
        // 2本の指のひねりで地図を回さない（拡大・縮小だけ。2026-10-21 本人指摘：ピンチで角度まで変わる）
        apply();
        const now = ground(mx, my, new THREE.Vector3());
        if (anchor && now) { st.target.x += anchor.x - now.x; st.target.z += anchor.z - now.z; }
        apply();
      }
      pinch = { d, a: ang, mx, my };
    }
  }
  function up(e) {
    if (!ptrs.has(e.pointerId)) return;
    ptrs.delete(e.pointerId);
    if (e.type === 'pointerup' && tap && performance.now() - tap.t < 400) onTap(e.clientX, e.clientY);
    tap = null; pinch = null;
    if (!ptrs.size) last = null;
    else st.vel.set(0, 0);
  }
  canvas.addEventListener('pointerdown', down);
  // マウスで地図を引きずったとき、画面の文字が選択されないように（2026-10-20 本人指摘）。開いていた入力欄は閉じる
  canvas.addEventListener('mousedown', e => { e.preventDefault(); if (document.activeElement && document.activeElement !== document.body) document.activeElement.blur?.(); });
  canvas.addEventListener('pointermove', move);
  canvas.addEventListener('pointerup', up);
  canvas.addEventListener('pointercancel', up);
  canvas.addEventListener('lostpointercapture', up);
  addEventListener('pointerup', up);
  addEventListener('pointercancel', up);
  // 安全網：指がぜんぶ離れたら、残っている操作を離す
  const sweep = e => { if (!e.touches.length) { for (const id of [...ptrs.keys()]) ptrs.delete(id); pinch = null; tap = null; last = null; } };
  document.addEventListener('touchend', sweep, { passive: true });
  document.addEventListener('touchcancel', sweep, { passive: true });
  addEventListener('blur', () => { ptrs.clear(); pinch = null; tap = null; });
  canvas.addEventListener('contextmenu', e => e.preventDefault());
  canvas.addEventListener('wheel', e => {
    e.preventDefault();
    st.fly = null;
    const before = ground(e.clientX, e.clientY, new THREE.Vector3());
    st.dist = THREE.MathUtils.clamp(st.dist * Math.exp(e.deltaY * 0.0012), MIN, MAX);
    apply();
    const after = ground(e.clientX, e.clientY, new THREE.Vector3());
    if (before && after) { st.target.x += before.x - after.x; st.target.z += before.z - after.z; }
    apply();
  }, { passive: false });

  function flyTo(x, z, dist, dur = 1.1) {
    st.fly = { t: 0, dur, fx: st.target.x, fz: st.target.z, fd: st.dist, tx: x ?? st.target.x, tz: z ?? st.target.z, td: dist ?? st.dist };
    st.vel.set(0, 0);
  }
  function update(dt) {
    if (st.fly) {
      const f = st.fly;
      f.t = Math.min(1, f.t + dt / f.dur);
      const e = f.t < 0.5 ? 4 * f.t ** 3 : 1 - (-2 * f.t + 2) ** 3 / 2;
      st.target.x = f.fx + (f.tx - f.fx) * e;
      st.target.z = f.fz + (f.tz - f.fz) * e;
      st.dist = Math.exp(Math.log(f.fd) + (Math.log(f.td) - Math.log(f.fd)) * e);
      if (f.t >= 1) st.fly = null;
    } else if (!ptrs.size && st.vel.lengthSq() > 0.01) {
      st.target.x += st.vel.x * dt; st.target.z += st.vel.y * dt;
      st.vel.multiplyScalar(Math.exp(-dt * 4));
    }
    apply();
  }
  apply();
  return { st, update, flyTo, busy: () => ptrs.size > 0 || !!st.fly };
}
