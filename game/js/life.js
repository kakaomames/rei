// 動くもの：人・車・バス・電車・フェリー・小舟
//  道は「町の区画の縁」。全国共通の升目の角を交差点として、見ている辺りだけ道の網を作る
//  人：歩道を歩く。駅・役所・名産へ向かう流れと、そこから帰る流れ（行き先までの道のりを幅優先で数えておく）
//  車：左側通行。前の車との間をあけ、信号のある交差点では止まる。大きな道路を好んで走る
import * as THREE from 'three';
import { LU, hash, rng } from './world.js?v=20261026a';
import { toonMat, part, merge } from './mat.js?v=20261026a';

const COL = new THREE.Color();
const SHIRTS = ['#ff6b6b', '#4d96ff', '#ffd23f', '#2ec4b6', '#a06cd5', '#ff9f43', '#ff7eb6', '#ffffff', '#5c7cfa', '#43aa8b'];
const CARS = ['#ff6b6b', '#4d96ff', '#ffd23f', '#ffffff', '#2ec4b6', '#ff9f43', '#9aa5b1', '#a06cd5', '#ffffff', '#3b3b4f'];

// 港（だいたいの位置。いちばん近い海の升目へ寄せる）と航路
const PORTS = {
  takamatsu: [134.0478, 34.3532], tonosho: [134.1853, 34.4828], miyanoura: [133.9690, 34.4575], uno: [133.9535, 34.4925],
  ikeda: [134.2595, 34.4575], matsuyama: [132.7010, 33.8820], hiroshima: [132.4670, 34.3510], imabari: [133.0085, 34.0680], onomichi: [133.2020, 34.4050]
};
const ROUTES = [['takamatsu', 'tonosho'], ['takamatsu', 'miyanoura'], ['takamatsu', 'ikeda'], ['uno', 'miyanoura'], ['uno', 'tonosho'], ['matsuyama', 'hiroshima'], ['imabari', 'onomichi']];

function writeM(a, k, x, y, z, yaw, s, pitch = 0) {
  const c = Math.cos(yaw), sn = Math.sin(yaw), o = k * 16, cp = Math.cos(pitch), sp = Math.sin(pitch);
  a[o] = c * cp * s; a[o + 1] = sp * s; a[o + 2] = -sn * cp * s; a[o + 3] = 0;
  a[o + 4] = -c * sp * s; a[o + 5] = cp * s; a[o + 6] = sn * sp * s; a[o + 7] = 0;
  a[o + 8] = sn * s; a[o + 9] = 0; a[o + 10] = c * s; a[o + 11] = 0;
  a[o + 12] = x; a[o + 13] = y; a[o + 14] = z; a[o + 15] = 1;
}

export function createLife(W, U, owners, marks, opt) {
  const group = new THREE.Group();
  const R = rng(20271);
  const play = id => { const m = W.munis.get(id); return m && m.play; };
  const dens = new Map();
  for (const m of W.munis.values()) dens.set(m.id, m.pop / Math.max(1, m.n.town));
  const cornerX = gx => W.cx(gx) - W.CX / 2, cornerZ = gy => W.cz(gy) - W.CZ / 2;
  const walkCell = (gx, gy) => { const L = W.luAt(gx, gy); return (L === LU.TOWN || L === LU.ROAD) && play(W.idAt(gx, gy)); };
  const bigRoad = (gx, gy) => W.luAt(gx, gy) === LU.ROAD;

  // ── 見ている辺りの道の網 ──
  const NR = opt.lite ? 34 : 50, WN = NR * 2 + 1;
  const net = { x0: 0, y0: 0, cx: 1e9, cz: 1e9, h: new Uint8Array(WN * WN), v: new Uint8Array(WN * WN), big: new Uint8Array(WN * WN * 2), dist: new Int16Array(WN * WN), corners: [], cum: [], total: 0, sources: [] };
  const inNet = (x, y) => x >= net.x0 && y >= net.y0 && x < net.x0 + WN && y < net.y0 + WN;
  const li = (x, y) => (y - net.y0) * WN + (x - net.x0);
  // 角 (x,y) から出る道（隣の角を x,y の順に並べる）
  function exits(x, y, out) {
    out.length = 0;
    if (!inNet(x, y)) return out;
    const k = li(x, y);
    if (net.h[k]) out.push(x + 1, y);
    if (x - 1 >= net.x0 && net.h[k - 1]) out.push(x - 1, y);
    if (net.v[k]) out.push(x, y + 1);
    if (y - 1 >= net.y0 && net.v[k - WN]) out.push(x, y - 1);
    return out;
  }
  function rebuildNet(tx, tz) {
    const gx = W.gxOf(tx), gy = W.gyOf(tz);
    net.x0 = gx - NR; net.y0 = gy - NR; net.cx = tx; net.cz = tz;
    net.corners = []; net.cum = []; net.total = 0;
    for (let y = 0; y < WN; y++) for (let x = 0; x < WN; x++) {
      const X = net.x0 + x, Y = net.y0 + y, k = y * WN + x;
      net.h[k] = (walkCell(X, Y - 1) || walkCell(X, Y)) ? 1 : 0;   // (X,Y)→(X+1,Y)
      net.v[k] = (walkCell(X - 1, Y) || walkCell(X, Y)) ? 1 : 0;   // (X,Y)→(X,Y+1)
      net.big[k * 2] = (bigRoad(X, Y - 1) || bigRoad(X, Y)) ? 1 : 0;
      net.big[k * 2 + 1] = (bigRoad(X - 1, Y) || bigRoad(X, Y)) ? 1 : 0;
      if (net.h[k] || net.v[k]) {
        const id = W.idAt(X, Y) || W.idAt(X - 1, Y - 1);
        const w = id && play(id) ? Math.min(3, dens.get(id) / 25) * Math.pow(owners.morale[id], 1.6) : 0;
        if (w > 0) { net.total += w; net.corners.push(k); net.cum.push(net.total); }
      }
    }
    // 行き先（駅・役所・名産）から道のりを数える
    net.dist.fill(-1);
    const q = [];
    net.sources = [];
    const addSrc = (wx, wz) => {
      const X = Math.round((wx - cornerX(0)) / W.CX), Y = Math.round((wz - cornerZ(0)) / W.CZ);
      let best = -1, bd = 1e9;
      for (let dy = -2; dy <= 2; dy++) for (let dx = -2; dx <= 2; dx++) {
        const x = X + dx, y = Y + dy;
        if (!inNet(x, y)) continue;
        const k = li(x, y), e = net.h[k] || net.v[k] || (x > net.x0 && net.h[k - 1]) || (y > net.y0 && net.v[k - WN]);
        if (e && dx * dx + dy * dy < bd) { bd = dx * dx + dy * dy; best = k; }
      }
      if (best >= 0 && net.dist[best] < 0) { net.dist[best] = 0; q.push(best); net.sources.push(best); }
    };
    for (const t of W.tiles.values()) for (const s of t.json.stations) addSrc(W.lonX(s.p[0]), W.latZ(s.p[1]));
    for (const s of marks.seats) addSrc(s.x, s.z + 1.3);
    for (const m of marks.meisan) addSrc(m.root.position.x, m.root.position.z);
    const ex = [];
    for (let h = 0; h < q.length; h++) {
      const k = q[h], x = net.x0 + k % WN, y = net.y0 + Math.floor(k / WN);
      exits(x, y, ex);
      for (let e = 0; e < ex.length; e += 2) { const n = li(ex[e], ex[e + 1]); if (net.dist[n] < 0) { net.dist[n] = net.dist[k] + 1; q.push(n); } }
    }
  }
  function pickCorner() {
    if (!net.total) return -1;
    const r = R() * net.total;
    let lo = 0, hi = net.cum.length - 1;
    while (lo < hi) { const m = (lo + hi) >> 1; if (net.cum[m] < r) lo = m + 1; else hi = m; }
    return net.corners[lo];
  }
  const EX = [], CAND = [];
  // 次の角を選ぶ。mode 1：行き先へ近づく  -1：遠ざかる  0：ぶらぶら
  function nextCorner(a, mode, carPref) {
    exits(a.bx, a.by, EX);
    if (!EX.length) return false;
    const here = net.dist[li(a.bx, a.by)];
    CAND.length = 0;
    let wsum = 0;
    for (let e = 0; e < EX.length; e += 2) {
      const x = EX[e], y = EX[e + 1];
      if (x === a.ax && y === a.ay && EX.length > 2) continue;   // 引き返さない
      const d = inNet(x, y) ? net.dist[li(x, y)] : -1;
      let w = 1;
      if (mode === 1 && here > 0) w = d >= 0 && d < here ? 6 : 0.3;
      else if (mode === -1) w = d > here ? 5 : 0.4;
      if (carPref) { const k = li(Math.min(a.bx, x), Math.min(a.by, y)); if (net.big[k * 2 + (y !== a.by ? 1 : 0)]) w *= 5; }
      CAND.push(x, y, w); wsum += w;
    }
    if (!CAND.length) { CAND.push(a.ax, a.ay, 1); wsum = 1; }
    let r = R() * wsum;
    for (let i = 0; i < CAND.length; i += 3) {
      r -= CAND[i + 2];
      if (r <= 0 || i + 3 >= CAND.length) { a.ax = a.bx; a.ay = a.by; a.bx = CAND[i]; a.by = CAND[i + 1]; return true; }
    }
    return false;
  }

  // ── 人 ──
  const MAXP = opt.lite ? 1300 : 3600;
  const pgeo = merge([
    part(new THREE.CylinderGeometry(0.06, 0.085, 0.22, 6).translate(0, 0.13, 0), null),
    part(new THREE.IcosahedronGeometry(0.075, 0).translate(0, 0.31, 0), '#ffe0c2'),
    part(new THREE.CylinderGeometry(0.025, 0.025, 0.06, 4).translate(0.035, 0.02, 0), '#3b3b4f'),
    part(new THREE.CylinderGeometry(0.025, 0.025, 0.06, 4).translate(-0.035, 0.02, 0), '#3b3b4f')
  ]);
  const people = new THREE.InstancedMesh(pgeo, toonMat(U), MAXP);
  people.count = 0; people.frustumCulled = false; people.castShadow = !opt.lite;
  for (let k = 0; k < MAXP; k++) people.setColorAt(k, COL.set(SHIRTS[Math.floor(hash(k * 7) * SHIRTS.length)]));
  group.add(people);
  const P = Array.from({ length: MAXP }, (_, k) => ({ ax: 0, ay: 0, bx: 0, by: 0, t: 0, side: hash(k) < 0.5 ? 1 : -1, mode: 0, sp: 0.5, ph: hash(k * 3) * 6.28, flee: 0, fx: 0, fz: 0, alive: false, id: 0 }));
  function spawnP(p) {
    let k;
    if (net.sources.length && R() < 0.25) { k = net.sources[Math.floor(R() * net.sources.length)]; p.mode = -1; }   // 駅や役所から出てくる
    else { k = pickCorner(); p.mode = R() < 0.55 ? 1 : 0; }
    if (k < 0 || k === undefined) { p.alive = false; return; }
    p.bx = net.x0 + k % WN; p.by = net.y0 + Math.floor(k / WN); p.ax = p.bx; p.ay = p.by;
    p.sp = 0.42 + R() * 0.3; p.flee = 0; p.alive = nextCorner(p, p.mode, false); p.t = R();
    p.id = W.idAt(p.bx, p.by);
  }

  // ── 車・バス ──
  const MAXC = opt.lite ? 160 : 460;
  const cgeo = merge([
    part(new THREE.BoxGeometry(0.34, 0.11, 0.17).translate(0, 0.09, 0), null),
    part(new THREE.BoxGeometry(0.19, 0.09, 0.15).translate(-0.02, 0.18, 0), '#dff3ff'),
    part(new THREE.BoxGeometry(0.06, 0.05, 0.19).translate(0.1, 0.035, 0), '#333344'),
    part(new THREE.BoxGeometry(0.06, 0.05, 0.19).translate(-0.1, 0.035, 0), '#333344')
  ]);
  const bgeo = merge([
    part(new THREE.BoxGeometry(0.62, 0.2, 0.19).translate(0, 0.14, 0), null),
    part(new THREE.BoxGeometry(0.6, 0.06, 0.195).translate(0, 0.17, 0), '#cfeaff'),
    part(new THREE.BoxGeometry(0.62, 0.03, 0.19).translate(0, 0.255, 0), '#ffffff')
  ]);
  const NBUS = Math.ceil(MAXC / 8);
  const cars = new THREE.InstancedMesh(cgeo, toonMat(U), MAXC), buses = new THREE.InstancedMesh(bgeo, toonMat(U), NBUS);
  for (const m of [cars, buses]) { m.count = 0; m.frustumCulled = false; m.castShadow = !opt.lite; group.add(m); }
  for (let k = 0; k < MAXC; k++) cars.setColorAt(k, COL.set(CARS[Math.floor(hash(k * 13) * CARS.length)]));
  for (let k = 0; k < NBUS; k++) buses.setColorAt(k, COL.set(['#2ec4b6', '#ff9f43', '#4d96ff'][k % 3]));
  const C = Array.from({ length: MAXC }, (_, k) => ({ ax: 0, ay: 0, bx: 0, by: 0, t: 0, v: 0, alive: false, bus: k % 8 === 0 }));
  function spawnC(c) {
    const k = pickCorner();
    if (k < 0 || k === undefined) { c.alive = false; return; }
    c.bx = net.x0 + k % WN; c.by = net.y0 + Math.floor(k / WN); c.ax = c.bx; c.ay = c.by;
    c.alive = nextCorner(c, 0, true); c.t = R() * 0.6; c.v = 0;
  }
  // 信号：4方向に道が出る交差点の一部。東西と南北を交互に青にする
  const EX2 = [];
  function signalRed(x, y, horiz, t) {
    const hs = hash(x * 7919 + y * 104729);
    if (hs > 0.45) return false;
    if (exits(x, y, EX2).length < 8) return false;
    const ph = ((t + hs * 20) / 7) % 2;
    return horiz ? !(ph < 0.85) : !(ph >= 1 && ph < 1.85);
  }

  // ── 電車 ──
  const tgeo = merge([
    part(new THREE.BoxGeometry(0.86, 0.26, 0.3).translate(0, 0.17, 0), null),
    part(new THREE.BoxGeometry(0.8, 0.08, 0.31).translate(0, 0.22, 0), '#253043'),
    part(new THREE.BoxGeometry(0.86, 0.05, 0.28).translate(0, 0.32, 0), '#e8ecf2')
  ]);
  let trains = [], tm = null;
  function buildTrains() {
    trains = [];
    for (const r of marks.rails) {
      const cum = [0];
      for (let k = 1; k < r.pts.length; k++) cum.push(cum[k - 1] + Math.hypot(r.pts[k][0] - r.pts[k - 1][0], r.pts[k][2] - r.pts[k - 1][2]));
      const L = cum[cum.length - 1];
      if (L < 6) continue;
      const n = Math.max(1, Math.round(L / 70)), cs = r.op === '四国旅客鉄道' || r.op === '西日本旅客鉄道' ? 3 : 2;
      for (let k = 0; k < n; k++) trains.push({ r, cum, L, s: (k + 0.3) / n * L, dir: k % 2 ? -1 : 1, cars: cs, sp: 2.6 + R() * 0.8, wait: 0 });
    }
    if (tm) group.remove(tm);
    const total = Math.max(1, trains.reduce((a, t) => a + t.cars, 0));
    tm = new THREE.InstancedMesh(tgeo, toonMat(U), total);
    tm.frustumCulled = false; tm.castShadow = true;
    let k = 0; for (const t of trains) for (let j = 0; j < t.cars; j++) tm.setColorAt(k++, COL.set(t.r.color));
    group.add(tm);
  }
  function railAt(t, s) {
    s = Math.max(0, Math.min(t.L - 0.001, s));
    let lo = 0, hi = t.cum.length - 1;
    while (lo < hi - 1) { const m = (lo + hi) >> 1; if (t.cum[m] <= s) lo = m; else hi = m; }
    const a = t.r.pts[lo], b = t.r.pts[lo + 1], f = (s - t.cum[lo]) / ((t.cum[lo + 1] - t.cum[lo]) || 1);
    return [a[0] + (b[0] - a[0]) * f, a[1] + (b[1] - a[1]) * f, a[2] + (b[2] - a[2]) * f];
  }

  // ── フェリー（海の升目を A* でたどる。2点を囲む範囲だけで探す）──
  let shipsVersion = 0;
  const NB8 = [[1, 0], [-1, 0], [0, 1], [0, -1], [1, 1], [1, -1], [-1, 1], [-1, -1]];
  const portCell = ([lon, lat]) => {
    const X = W.gxOf(W.lonX(lon)), Y = W.gyOf(W.latZ(lat));
    let best = null, bd = 1e9;
    for (let dy = -14; dy <= 14; dy++) for (let dx = -14; dx <= 14; dx++) {
      const x = X + dx, y = Y + dy;
      if (!W.tileAt(x, y) || W.idAt(x, y) || W.seaDist(x, y) < 1.0) continue;
      if (dx * dx + dy * dy < bd) { bd = dx * dx + dy * dy; best = [x, y]; }
    }
    return best;
  };
  function seaPath(a, b) {
    const pad = 60, x0 = Math.min(a[0], b[0]) - pad, y0 = Math.min(a[1], b[1]) - pad, w = Math.abs(a[0] - b[0]) + pad * 2 + 1, h = Math.abs(a[1] - b[1]) + pad * 2 + 1;
    const N = w * h, g = new Float64Array(N).fill(1e9), from = new Int32Array(N).fill(-1), heap = [];
    const L = (x, y) => (y - y0) * w + (x - x0);
    const sea = new Uint8Array(N), near = new Uint8Array(N);
    for (let y = 0; y < h; y++) for (let x = 0; x < w; x++) { const X = x0 + x, Y = y0 + y; if (W.tileAt(X, Y) && !W.idAt(X, Y)) { sea[y * w + x] = 1; near[y * w + x] = W.seaDist(X, Y) < 2 ? 1 : 0; } }
    const H = (x, y) => Math.hypot(x - b[0], y - b[1]);
    const push = (k, f) => { heap.push([f, k]); let i = heap.length - 1; while (i) { const p = (i - 1) >> 1; if (heap[p][0] <= heap[i][0]) break; [heap[p], heap[i]] = [heap[i], heap[p]]; i = p; } };
    const pop = () => { const top = heap[0], last = heap.pop(); if (heap.length) { heap[0] = last; let i = 0; for (;;) { const l = i * 2 + 1, r = l + 1; let m = i; if (l < heap.length && heap[l][0] < heap[m][0]) m = l; if (r < heap.length && heap[r][0] < heap[m][0]) m = r; if (m === i) break; [heap[m], heap[i]] = [heap[i], heap[m]]; i = m; } } return top; };
    const s0 = L(a[0], a[1]), goal = L(b[0], b[1]);
    g[s0] = 0; push(s0, H(a[0], a[1]));
    while (heap.length) {
      const [f, k] = pop();
      if (k === goal) break;
      const x = x0 + k % w, y = y0 + Math.floor(k / w);
      if (f > g[k] + H(x, y) + 1e-6) continue;   // 古い候補は飛ばす
      for (const [dx, dy] of NB8) {
        const nx = x + dx, ny = y + dy;
        if (nx < x0 || ny < y0 || nx >= x0 + w || ny >= y0 + h) continue;
        const n = L(nx, ny);
        if (!sea[n]) continue;
        const c = (dx && dy ? 1.414 : 1) * (near[n] ? 3 : 1);
        if (g[k] + c < g[n]) { g[n] = g[k] + c; from[n] = k; push(n, g[n] + H(nx, ny)); }
      }
    }
    if (from[goal] < 0) return null;
    const cells = [];
    for (let k = goal; k >= 0; k = from[k]) cells.push([x0 + k % w, y0 + Math.floor(k / w)]);
    cells.reverse();
    const clear = (p, q) => {
      const n = Math.ceil(Math.hypot(q[0] - p[0], q[1] - p[1]) * 2);
      for (let k = 0; k <= n; k++) { const X = Math.round(p[0] + (q[0] - p[0]) * k / n), Y = Math.round(p[1] + (q[1] - p[1]) * k / n); if (W.idAt(X, Y) || W.seaDist(X, Y) < 1.5) return false; }
      return true;
    };
    const out = [cells[0]];
    let i = 0;
    while (i < cells.length - 1) { let j = cells.length - 1; while (j > i + 1 && !clear(cells[i], cells[j])) j--; out.push(cells[j]); i = j; }
    return out.map(([x, y]) => [W.cx(x), W.cz(y)]);
  }
  const ships = [], boats = [];
  const sgeo = merge([
    part(new THREE.BoxGeometry(1.7, 0.28, 0.6).translate(0, 0.1, 0), '#ffffff'),
    part(new THREE.ConeGeometry(0.3, 0.5, 4).rotateZ(-Math.PI / 2).rotateX(Math.PI / 4).translate(1.08, 0.1, 0), '#ffffff'),
    part(new THREE.BoxGeometry(1.72, 0.07, 0.62).translate(0, 0.0, 0), null),
    part(new THREE.BoxGeometry(0.9, 0.28, 0.5).translate(-0.1, 0.38, 0), '#f4f7fb'),
    part(new THREE.BoxGeometry(0.92, 0.07, 0.52).translate(-0.1, 0.38, 0), '#23324a'),
    part(new THREE.CylinderGeometry(0.08, 0.1, 0.3, 8).translate(-0.4, 0.66, 0), null)
  ]);
  const smallBoat = merge([part(new THREE.BoxGeometry(0.5, 0.1, 0.2).translate(0, 0.05, 0), null), part(new THREE.BoxGeometry(0.14, 0.14, 0.14).translate(-0.08, 0.16, 0), '#ffffff')]);
  let sm = null, bm = null;
  const WAKE = 14;   // 航跡（船のうしろの白い泡）
  const wakeM = new THREE.InstancedMesh(new THREE.CircleGeometry(1, 10).rotateX(-Math.PI / 2), new THREE.MeshBasicMaterial({ color: '#ffffff', transparent: true, opacity: 0.5, depthWrite: false }), ROUTES.length * WAKE);
  wakeM.frustumCulled = false; wakeM.count = 0; group.add(wakeM);
  function buildShips() {
    // 読みこんだタイルが変わるたびに作り直す（港が両方ある航路だけ）
    ships.length = 0; boats.length = 0;
    if (sm) { group.remove(sm); sm.dispose(); sm = null; }
    if (bm) { group.remove(bm); bm.dispose(); bm = null; }
    if (!W.tiles.size) return;
    for (const [a, b] of ROUTES) {
      const pa = portCell(PORTS[a]), pb = portCell(PORTS[b]);
      if (!pa || !pb) continue;
      const pts = seaPath(pa, pb);
      if (!pts || pts.length < 2) continue;
      const cum = [0];
      for (let k = 1; k < pts.length; k++) cum.push(cum[k - 1] + Math.hypot(pts[k][0] - pts[k - 1][0], pts[k][1] - pts[k - 1][1]));
      ships.push({ pts, cum, L: cum[cum.length - 1], s: R() * cum[cum.length - 1], dir: 1, wait: 0, sp: 2.2, trail: [] });
    }
    sm = new THREE.InstancedMesh(sgeo, toonMat(U), Math.max(1, ships.length));
    sm.frustumCulled = false; sm.castShadow = true;
    ships.forEach((s, k) => sm.setColorAt(k, COL.set(['#2f6fd6', '#ff5a4f', '#2ec4b6', '#ff9f43', '#a06cd5'][k % 5])));
    group.add(sm);
    const tiles = [...W.tiles.values()];
    for (let k = 0; k < 600 && boats.length < (opt.lite ? 24 : 60); k++) {
      const t = tiles[Math.floor(R() * tiles.length)], x = t.gx0 + Math.floor(R() * W.TS), y = t.gy0 + Math.floor(R() * W.TS);
      const d = W.seaDist(x, y);
      if (W.idAt(x, y) || d < 1.2 || d > 6) continue;
      boats.push({ x: W.cx(x), z: W.cz(y), a: R() * 6.28, sp: 0.3 + R() * 0.3 });
    }
    bm = new THREE.InstancedMesh(smallBoat, toonMat(U), Math.max(1, boats.length));
    bm.frustumCulled = false;
    boats.forEach((b, k) => bm.setColorAt(k, COL.set(['#ff6b6b', '#4d96ff', '#ffd23f', '#ffffff'][k % 4])));
    group.add(bm);
  }

  function scatter(id, x, z) {
    for (const p of P) if (p.alive && p.id === id) { p.flee = 2.5 + R(); p.fx = x; p.fz = z; }
  }

  const occ = new Map();   // 道ごとに走っている車（前の車との間をみる）
  function update(t, dt, target, dist) {
    dt = Math.min(dt, 0.1);
    const show = dist < 80;
    if (show && Math.hypot(net.cx - target.x, net.cz - target.z) > NR * 0.35) rebuildNet(target.x, target.z);
    const radius = (NR - 4) * Math.min(W.CX, W.CZ);
    const farAway = (x, y) => Math.hypot(cornerX(x) - target.x, cornerZ(y) - target.z) > radius;

    // 人
    const want = show ? Math.floor(MAXP * Math.min(1, 1.4 - dist / 80) * Math.min(1, net.total / 900)) : 0;
    const arr = people.instanceMatrix.array;
    let n = 0;
    for (let k = 0; k < MAXP; k++) {
      const p = P[k];
      if (k >= want) { p.alive = false; continue; }
      if (!p.alive || farAway(p.bx, p.by)) { spawnP(p); if (!p.alive) continue; }
      const len = Math.hypot((p.bx - p.ax) * W.CX, (p.by - p.ay) * W.CZ) || 1;
      if (p.flee > 0) p.flee -= dt;
      p.t += p.sp * (p.flee > 0 ? 3.0 : 1) * dt / len;
      if (p.t >= 1) {
        p.t -= 1;
        const here = inNet(p.bx, p.by) ? net.dist[li(p.bx, p.by)] : -1;
        if (p.mode === 1 && here === 0) { spawnP(p); if (!p.alive) continue; }   // 着いた（駅に入った）
        else {
          if (!nextCorner(p, p.flee > 0 ? 0 : p.mode, false)) { spawnP(p); if (!p.alive) continue; }
          if (p.flee > 0) {   // 散るときは起点から遠ざかる
            const d0 = Math.hypot(cornerX(p.ax) - p.fx, cornerZ(p.ay) - p.fz), d1 = Math.hypot(cornerX(p.bx) - p.fx, cornerZ(p.by) - p.fz);
            if (d1 < d0) { const tx = p.ax, ty = p.ay; p.ax = p.bx; p.ay = p.by; p.bx = tx; p.by = ty; }
          }
          if (R() < dt * (1 - owners.morale[p.id || 0]) * 2) { spawnP(p); if (!p.alive) continue; }   // 民心が低いと出歩かない
        }
      }
      const ax = cornerX(p.ax), az = cornerZ(p.ay), bx = cornerX(p.bx), bz = cornerZ(p.by);
      const dx = bx - ax, dz = bz - az, l = Math.hypot(dx, dz) || 1;
      const x = ax + dx * p.t + (dz / l) * 0.105 * p.side, z = az + dz * p.t - (dx / l) * 0.105 * p.side;   // 歩道
      const bob = Math.abs(Math.sin(t * (p.flee > 0 ? 22 : 11) + p.ph)) * 0.045 + (p.flee > 0 ? 0.06 : 0);
      writeM(arr, n++, x, W.heightAt(x, z) + bob, z, Math.atan2(-dz, dx), 1);
    }
    people.count = n;
    people.instanceMatrix.needsUpdate = true;

    // 車
    const wantC = dist < 110 ? Math.min(MAXC, Math.floor(net.corners.length * 0.12)) : 0;
    occ.clear();
    for (const c of C) if (c.alive) { const key = c.ax * 1e7 + c.ay * 13 + c.bx * 7e5 + c.by; let l = occ.get(key); if (!l) occ.set(key, l = []); l.push(c.t); }
    const ca = cars.instanceMatrix.array, ba = buses.instanceMatrix.array;
    let nc = 0, nb = 0;
    for (let k = 0; k < MAXC; k++) {
      const c = C[k];
      if (k >= wantC) { c.alive = false; continue; }
      if (!c.alive || farAway(c.bx, c.by)) { spawnC(c); if (!c.alive) continue; }
      const len = Math.hypot((c.bx - c.ax) * W.CX, (c.by - c.ay) * W.CZ) || 1;
      let limit = c.bus ? 1.2 : 1.6;
      const list = occ.get(c.ax * 1e7 + c.ay * 13 + c.bx * 7e5 + c.by) || [];
      for (const ot of list) if (ot > c.t && (ot - c.t) * len < (c.bus ? 0.75 : 0.5)) limit = 0;   // 前の車
      if (c.t > 0.55 && c.t < 0.8 && signalRed(c.bx, c.by, c.by === c.ay, t)) limit = 0;            // 赤信号
      c.v += (limit - c.v) * Math.min(1, dt * (limit > c.v ? 1.5 : 5));
      c.t += c.v * dt / len;
      if (c.t >= 1) { c.t -= 1; if (!nextCorner(c, 0, true)) { spawnC(c); if (!c.alive) continue; } }
      const ax = cornerX(c.ax), az = cornerZ(c.ay), bx = cornerX(c.bx), bz = cornerZ(c.by);
      const dx = bx - ax, dz = bz - az, l = Math.hypot(dx, dz) || 1;
      const x = ax + dx * c.t + (dz / l) * 0.04, z = az + dz * c.t - (dx / l) * 0.04;   // 左側通行
      if (c.bus) { if (nb < NBUS) writeM(ba, nb++, x, W.heightAt(x, z), z, Math.atan2(-dz, dx), 1); }
      else writeM(ca, nc++, x, W.heightAt(x, z), z, Math.atan2(-dz, dx), 1);
    }
    cars.count = nc; buses.count = nb;
    cars.instanceMatrix.needsUpdate = true; buses.instanceMatrix.needsUpdate = true;

    // 電車（終点で少し止まる）
    if (tm) {
      const ta = tm.instanceMatrix.array;
      let k = 0;
      for (const tr of trains) {
        if (tr.wait > 0) tr.wait -= dt;
        else {
          tr.s += tr.dir * tr.sp * dt;
          if (tr.s > tr.L - 0.5) { tr.s = tr.L - 0.5; tr.dir = -1; tr.wait = 3; }
          if (tr.s < tr.cars * 0.95) { tr.s = tr.cars * 0.95; tr.dir = 1; tr.wait = 3; }
        }
        for (let j = 0; j < tr.cars; j++) {
          const s = tr.s - j * 0.95 * tr.dir, a = railAt(tr, s - 0.3), b = railAt(tr, s + 0.3);
          writeM(ta, k++, (a[0] + b[0]) / 2, (a[1] + b[1]) / 2, (a[2] + b[2]) / 2, Math.atan2(-(b[2] - a[2]), b[0] - a[0]), 1, Math.atan2(b[1] - a[1], Math.hypot(b[0] - a[0], b[2] - a[2])));
        }
      }
      tm.count = k; tm.instanceMatrix.needsUpdate = true;
    }

    // フェリー（港で少し止まる）と航跡・小舟
    if (sm) {
      const sa = sm.instanceMatrix.array, wa = wakeM.instanceMatrix.array;
      let nw = 0;
      ships.forEach((s, i) => {
        if (s.wait > 0) s.wait -= dt;
        else { s.s += s.dir * s.sp * dt; if (s.s >= s.L) { s.s = s.L; s.dir = -1; s.wait = 4; } if (s.s <= 0) { s.s = 0; s.dir = 1; s.wait = 4; } }
        let j = 0;
        while (j < s.cum.length - 2 && s.cum[j + 1] < s.s) j++;
        const a = s.pts[j], b = s.pts[j + 1], f = (s.s - s.cum[j]) / ((s.cum[j + 1] - s.cum[j]) || 1);
        const x = a[0] + (b[0] - a[0]) * f, z = a[1] + (b[1] - a[1]) * f;
        writeM(sa, i, x, 0.02 + Math.sin(t * 1.5 + i) * 0.03, z, Math.atan2(-(b[1] - a[1]) * s.dir, (b[0] - a[0]) * s.dir), 1, Math.sin(t * 1.1 + i) * 0.02);
        if (s.wait <= 0 && (!s.trail.length || Math.hypot(s.trail[0][0] - x, s.trail[0][1] - z) > 0.6)) { s.trail.unshift([x, z, t]); if (s.trail.length > WAKE) s.trail.pop(); }
        for (const [wx, wz, wt] of s.trail) { const age = t - wt; if (age < 4 && nw < ROUTES.length * WAKE) writeM(wa, nw++, wx, 0.03, wz, 0, 0.25 + age * 0.35); }
      });
      sm.count = ships.length; sm.instanceMatrix.needsUpdate = true;
      wakeM.count = nw; wakeM.instanceMatrix.needsUpdate = true;
      const bA = bm.instanceMatrix.array;
      boats.forEach((b, i) => {
        b.a += (hash(Math.floor(t * 0.2) * 97 + i) - 0.5) * dt * 0.8;
        const nx = b.x + Math.cos(b.a) * b.sp * dt, nz = b.z - Math.sin(b.a) * b.sp * dt, gx = W.gxOf(nx), gy = W.gyOf(nz);
        if (!W.tileAt(gx, gy) || W.idAt(gx, gy) || W.seaDist(gx, gy) < 1.0) b.a += Math.PI * 0.7; else { b.x = nx; b.z = nz; }
        writeM(bA, i, b.x, 0.02 + Math.sin(t * 2 + i) * 0.03, b.z, b.a, 1, Math.sin(t * 1.7 + i) * 0.05);
      });
      bm.count = boats.length; bm.instanceMatrix.needsUpdate = true;
    }
  }

  // 2つの港を結ぶ海の道（世界座標の点の列）。渡海の演出に使う
  function seaRoute(lonlatA, lonlatB) {
    const a = portCell(lonlatA), b = portCell(lonlatB);
    if (!a || !b) return null;
    return seaPath(a, b);
  }
  return { group, update, scatter, buildTrains, buildShips, seaRoute, stats: () => ({ people: people.count, cars: cars.count + buses.count, trains: trains.length, ships: ships.length }) };
}
