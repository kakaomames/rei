// 町・森・工場をデータから並べる（遊ぶ県の市町村だけ）。40升のかたまりごとに、見ている辺りで必要になってから作る
//  建物：土地利用「建物用地」の升目。区画の外まわりは道と歩道なので、建物は区画の内側に置く
//        高さは人口の密度・駅や役所からの近さで決める
//  木　：土地利用「森林」の升目。季節で色を変える（桜・紅葉）
//  工場：海ぞいの低い建物用地（※仮：市町村ごとの工業の重み。製造品出荷額の統計に置きかえる）
import * as THREE from 'three';
import { LU, hash } from './world.js?v=20261026a';
import { toonMat, part, merge, M4, gableRoof } from './mat.js?v=20261026a';

const CH = 40;
const TMP = new THREE.Matrix4(), Q = new THREE.Quaternion(), V = new THREE.Vector3(), S = new THREE.Vector3(), E = new THREE.Euler(), COL = new THREE.Color();

// ※仮の工業の重み（市町村コード）。統計を入れるまでの目安
const INDUSTRY = {
  '37203': 1.0, '37202': 0.6, '37404': 0.6, '37201': 0.35, '37205': 0.35,
  '38205': 1.0, '38202': 0.6, '38206': 0.7, '38214': 0.8, '38201': 0.4,
  '36204': 0.7, '36201': 0.4, '36202': 0.3, '39201': 0.3, '39206': 0.35
};
const ROOFS = ['#ff6b6b', '#4d96ff', '#ff9f43', '#2ec4b6', '#a06cd5', '#ff7eb6', '#ffd23f', '#5c7cfa', '#e76f51'];
const TALL = ['#ffffff', '#e8f4ff', '#fff4e6', '#f0f0ff', '#e9fff6'];

function protos() {
  const box = new THREE.BoxGeometry(1, 1, 1).translate(0, 0.5, 0);
  return {
    house: merge([part(box, '#ffffff', M4(0, 0, 0, 1, 0.62, 1)), part(gableRoof(1.16, 1.2, 0.42), null, M4(0, 0.62, 0))]),
    shop: merge([part(box, '#ffffff', M4(0, 0, 0, 1, 0.5, 1)), part(box, null, M4(0, 0.5, 0, 1.08, 0.07, 1.08)), part(box, null, M4(0, 0.2, 0.52, 0.9, 0.08, 0.12))]),
    apart: merge([part(box, '#ffffff'), part(box, null, M4(0, 1, 0, 1.04, 0.04, 1.04))]),
    tower: merge([part(box, '#ffffff'), part(box, null, M4(0, 1, 0, 0.7, 0.06, 0.7)), part(new THREE.CylinderGeometry(0.02, 0.02, 0.25, 4).translate(0, 0.125, 0), '#ff5c5c', M4(0.2, 1.06, 0.2))]),
    treeR: merge([part(new THREE.CylinderGeometry(0.05, 0.07, 0.3, 5).translate(0, 0.15, 0), '#9a6b4f'), part(new THREE.IcosahedronGeometry(0.34, 0), null, M4(0, 0.52, 0, 1, 0.92, 1))]),
    treeC: merge([part(new THREE.CylinderGeometry(0.05, 0.06, 0.22, 5).translate(0, 0.11, 0), '#8a5e44'), part(new THREE.ConeGeometry(0.3, 0.8, 6).translate(0, 0.4, 0), null, M4(0, 0.18, 0))]),
    factory: merge([
      part(box, '#eef1f5', M4(0, 0, 0, 1.6, 0.55, 1)),
      ...[-0.55, 0, 0.55].map(x => part(new THREE.CylinderGeometry(0.3, 0.3, 1.0, 3, 1).rotateZ(Math.PI / 2).rotateX(Math.PI / 6), null, M4(x, 0.62, 0, 0.9, 1, 1))),
      part(new THREE.CylinderGeometry(0.09, 0.12, 1.5, 8).translate(0, 0.75, 0), '#f2f2f2', M4(0.55, 0, -0.32)),
      part(new THREE.CylinderGeometry(0.095, 0.095, 0.18, 8), '#ff5a4f', M4(0.55, 1.2, -0.32)),
      part(new THREE.CylinderGeometry(0.095, 0.095, 0.18, 8), '#ff5a4f', M4(0.55, 0.8, -0.32))
    ]),
    tank: merge([part(new THREE.CylinderGeometry(0.5, 0.5, 0.55, 12).translate(0, 0.275, 0), '#f6f7fa'), part(new THREE.CylinderGeometry(0.5, 0.5, 0.06, 12), null, M4(0, 0.58, 0))])
  };
}

// 季節ごとの木の色（0 春・1 夏・2 秋・3 冬）
function treeColor(t, season, out) {
  const r = t.r;
  if (t.kind === 1) return out.setHSL(0.36 + r * 0.04, 0.45, 0.28 + r * 0.06);
  if (season === 0) return t.sakura ? out.setHSL(0.94 + r * 0.03, 0.75, 0.82) : out.setHSL(0.24 + r * 0.06, 0.55, 0.48 + r * 0.08);
  if (season === 1) return out.setHSL(0.30 + r * 0.06, 0.55, 0.36 + r * 0.08);
  if (season === 2) return t.momiji > 0.55 ? out.setHSL([0.0, 0.03, 0.08, 0.12][Math.floor(r * 4)], 0.8, 0.52) : out.setHSL(0.17 + r * 0.08, 0.5, 0.4);
  return out.setHSL(0.22 + r * 0.08, 0.25, 0.36 + r * 0.06);
}

function smokeMesh(U, pts) {
  const puffs = 4;
  const im = new THREE.InstancedMesh(new THREE.IcosahedronGeometry(1, 1), new THREE.ShaderMaterial({
    uniforms: { uTime: U.uTime },
    vertexShader: /* glsl */`
      uniform float uTime; varying vec3 vN;
      void main() {
        vec3 base = instanceMatrix[3].xyz;
        float t = fract(uTime * 0.16 + instanceMatrix[0].x);   // 位相を拡大率の欄にしまってある
        float s = mix(0.12, 0.5, t) * (1.0 - smoothstep(0.75, 1.0, t));
        vN = normal;
        gl_Position = projectionMatrix * viewMatrix * vec4(base + vec3(t * 1.4, t * 3.2, t * 0.5) + position * s, 1.0);
      }`,
    fragmentShader: /* glsl */`
      varying vec3 vN;
      void main() { float l = 0.86 + 0.14 * step(0.2, dot(normalize(vN), normalize(vec3(-0.3, 1.0, 0.4)))); gl_FragColor = vec4(vec3(l), 1.0);
        #include <colorspace_fragment>
      }`
  }), pts.length * puffs);
  pts.forEach((p, k) => { for (let j = 0; j < puffs; j++) { TMP.makeTranslation(p[0], p[1], p[2]); TMP.elements[0] = j / puffs + hash(k) * 0.1; im.setMatrixAt(k * puffs + j, TMP); } });
  im.frustumCulled = false;
  return im;
}

export function createProps(W, U, owners, opt) {
  const P = protos();
  const mats = { house: toonMat(U), apart: toonMat(U, { windows: true }), tree: toonMat(U, { flat: true }) };
  const group = new THREE.Group();
  const dens = new Map();
  for (const m of W.munis.values()) dens.set(m.id, m.pop / Math.max(1, m.n.town));
  const play = id => { const m = W.munis.get(id); return m && m.play; };
  let season = 0;

  // 駅・役所（読みこんだタイルから）
  const stationsNear = (x, z, r) => {
    const out = [];
    for (const t of W.tiles.values()) for (const s of t.json.stations) {
      const sx = W.lonX(s.p[0]), sz = W.latZ(s.p[1]);
      if (Math.abs(sx - x) < r && Math.abs(sz - z) < r) out.push([sx, sz]);
    }
    return out;
  };
  const seats = [...W.munis.values()].filter(m => m.seat && m.play).map(m => [W.lonX(m.seat[0]), W.latZ(m.seat[1])]);
  const offices = Object.values(W.idx.prefs).filter(p => p.play && p.office).map(p => [W.lonX(p.office[0]), W.latZ(p.office[1])]);

  // 7×7 の建物用地の割合
  const townFrac = (gx, gy, r) => { let n = 0, a = 0; for (let y = -r; y <= r; y++) for (let x = -r; x <= r; x++) { a++; if (W.luAt(gx + x, gy + y) === LU.TOWN) n++; } return n / a; };
  function minSeaCells(gx, gy) { let m = 99; for (let dy = -3; dy <= 3; dy++) for (let dx = -3; dx <= 3; dx++) if (!W.idAt(gx + dx, gy + dy)) m = Math.min(m, Math.hypot(dx, dy)); return m; }

  function buildChunk(cgx, cgy) {
    const list = { house: [], shop: [], apart: [], tower: [], factory: [], tank: [] }, trees = [], smoke = [];
    const cxw = W.cx(cgx * CH + CH / 2), czw = W.cz(cgy * CH + CH / 2);
    const sts = stationsNear(cxw, czw, CH * 1.2 + 8);
    const near = (pts, x, z) => { let d = 1e9; for (const p of pts) d = Math.min(d, Math.hypot(p[0] - x, p[1] - z)); return d; };
    const push = (kind, x, z, sx, sy, sz, ry, color) => list[kind].push({ m: M4(x, W.heightAt(x, z) - 0.02, z, sx, sy, sz, ry), color });
    const addTree = (x, z, seed, s, forest, gx, gy) => {
      const r = hash(seed * 7 + 3), hm = W.hmAt(gx, gy);
      const nearTown = hm < 60 && townFrac(gx, gy, 2) > 0.05;
      const kind = forest && hm > 120 && r < 0.45 ? 1 : 0;
      trees.push({ kind, r, x, y: W.heightAt(x, z), z, s: s * (0.8 + hash(seed + 11) * 0.6),
        sakura: kind === 0 && (nearTown || !forest) && hash(seed + 23) < 0.35, momiji: kind === 0 ? hash(seed + 29) * (hm > 80 ? 1.2 : 0.7) : 0 });
    };
    const maxPer = opt.lite ? 2 : 4;
    for (let gy = cgy * CH; gy < cgy * CH + CH; gy++) for (let gx = cgx * CH; gx < cgx * CH + CH; gx++) {
      const id = W.idAt(gx, gy);
      if (!id || !play(id)) continue;
      const L = W.luAt(gx, gy), seed = (gx * 73856093) ^ (gy * 19349663), r0 = hash(seed);
      const wx = W.cx(gx), wz = W.cz(gy);
      if (opt.blocked && opt.blocked(wx, wz)) continue;   // 名産の店のまわりはあける
      if (L === LU.TOWN) {
        const local = townFrac(gx, gy, 3);
        const st = near(sts, wx, wz), se = near(seats, wx, wz), off = near(offices, wx, wz);
        const urban = local * 0.55 + Math.min(1, dens.get(id) / 70) * 0.35 + Math.exp(-st / 5) * 0.35 + Math.exp(-se / 6) * 0.25 + Math.exp(-off / 3.5) * 0.7;
        const ind = Math.max(0, (W.munis.get(id).n.ind ?? INDUSTRY[W.munis.get(id).code] ?? 0) - 0.08) * 1.6;   // 製造品出荷額等（経済構造実態調査）から
        if (ind && W.hmAt(gx, gy) <= 6 && minSeaCells(gx, gy) <= 3 && r0 < ind * 0.55) {
          const ry = Math.floor(hash(seed + 3) * 2) * Math.PI;
          if (hash(seed + 9) < 0.3) { push('tank', wx, wz, 0.8, 1, 0.8, 0, '#9fb3c8'); continue; }
          push('factory', wx, wz, 0.55, 0.62, 0.55, ry, ['#5c7cfa', '#2ec4b6', '#ff9f43'][Math.floor(hash(seed + 4) * 3)]);
          V.set(0.55 * 0.55, 0, -0.32 * 0.55).applyAxisAngle(new THREE.Vector3(0, 1, 0), ry);
          smoke.push([wx + V.x, W.heightAt(wx, wz) + 1.5 * 0.62, wz + V.z]);
          continue;
        }
        // 区画の内側（外まわり 0.15 は道と歩道）
        const ix = W.CX / 2 - 0.15, iz = W.CZ / 2 - 0.15;
        const n = Math.min(maxPer, urban > 1.5 ? 1 : 1 + Math.floor(urban * 2 + r0 * 1.2));
        const slots = n === 1 ? [[0, 0, ix * 1.7, iz * 1.7]] : n === 2 ? [[-ix / 2, 0, ix * 0.85, iz * 1.6], [ix / 2, 0, ix * 0.85, iz * 1.6]]
          : [[-ix / 2, -iz / 2, ix * 0.85, iz * 0.85], [ix / 2, -iz / 2, ix * 0.85, iz * 0.85], [-ix / 2, iz / 2, ix * 0.85, iz * 0.85], [ix / 2, iz / 2, ix * 0.85, iz * 0.85]].slice(0, n === 3 ? 3 : 4);
        slots.forEach(([sx, sz, fw, fd], k) => {
          const rr = hash(seed * 13 + k * 101);
          const px = wx + sx, pz = wz + sz;
          const u = urban + (rr - 0.5) * 0.35;
          const w0 = fw * (0.82 + rr * 0.15), d0 = fd * (0.82 + rr * 0.15);
          if (u > 1.5 && n === 1) push('tower', px, pz, w0 * 0.8, 1.3 + rr * 1.4 + Math.exp(-off / 3) * 1.6, d0 * 0.8, 0, TALL[Math.floor(rr * TALL.length)]);
          else if (u > 1.05) push('apart', px, pz, w0, 0.6 + rr * 0.6, d0, 0, ROOFS[Math.floor(rr * ROOFS.length)]);
          else if (u > 0.72 && rr < 0.5) push('shop', px, pz, w0, 0.7, d0, (rr < 0.25 ? 0 : Math.PI), ROOFS[Math.floor(rr * ROOFS.length)]);
          else push('house', px, pz, Math.min(w0, 0.42), 0.5 + rr * 0.15, Math.min(d0, 0.36), (rr < 0.5 ? 0 : Math.PI / 2) * (n > 1 ? 0 : 1), ROOFS[Math.floor(rr * ROOFS.length)]);
        });
        if (urban < 0.9 && r0 > 0.7 && n < 4) addTree(wx + ix * 0.7, wz + iz * 0.7, seed, 0.5, false, gx, gy);
      } else if (L === LU.FOREST) {
        const n = r0 < 0.12 ? 0 : (!opt.lite && r0 > 0.8 ? 2 : 1);
        for (let k = 0; k < n; k++) addTree(wx + (hash(seed * 3 + k) - 0.5) * W.CX * 0.85, wz + (hash(seed * 5 + k) - 0.5) * W.CZ * 0.85, seed * 3 + k, 1, true, gx, gy);
      } else if ((L === LU.WASTE || L === LU.FARM) && r0 < 0.18) {
        addTree(wx + (r0 - 0.09) * 4, wz, seed, 0.8, false, gx, gy);
      }
    }
    const g = new THREE.Group();
    const shadows = !opt.lite;
    for (const kind of Object.keys(list)) {
      const L = list[kind];
      if (!L.length) continue;
      const im = new THREE.InstancedMesh(P[kind], kind === 'apart' || kind === 'tower' ? mats.apart : mats.house, L.length);
      L.forEach((b, k) => { im.setMatrixAt(k, b.m); im.setColorAt(k, COL.set(b.color)); });
      im.castShadow = shadows; im.receiveShadow = true;
      im.computeBoundingSphere();
      g.add(im);
    }
    for (let i = trees.length - 1; i > 0; i--) { const j = Math.floor(hash(i * 31 + cgx * 7 + cgy) * (i + 1)); [trees[i], trees[j]] = [trees[j], trees[i]]; }   // 先頭から間引けるように混ぜる
    [trees.filter(t => t.kind === 0), trees.filter(t => t.kind === 1)].forEach((ls, kind) => {
      if (!ls.length) return;
      const im = new THREE.InstancedMesh(kind ? P.treeC : P.treeR, mats.tree, ls.length);
      ls.forEach((t, k) => { im.setMatrixAt(k, TMP.compose(V.set(t.x, t.y - 0.02, t.z), Q.setFromEuler(E.set(0, t.r * 6.28, 0)), S.set(t.s, t.s * (0.9 + t.r * 0.3), t.s))); im.setColorAt(k, treeColor(t, season, COL)); });
      im.castShadow = shadows; im.receiveShadow = true;
      im.computeBoundingSphere();
      im.userData.trees = ls; im.userData.full = ls.length;
      g.add(im);
    });
    if (smoke.length) g.add(smokeMesh(U, smoke));
    return g;
  }

  const chunks = new Map();
  let built = 0;
  function update(camPos, target, dist) {
    const R = Math.min(opt.lite ? 95 : 150, Math.max(26, dist * 1.25));
    const show = dist < (opt.lite ? 150 : 230);
    const cgx0 = Math.floor((W.gxOf(target.x - R)) / CH), cgx1 = Math.floor((W.gxOf(target.x + R)) / CH);
    const cgy0 = Math.floor((W.gyOf(target.z - R)) / CH), cgy1 = Math.floor((W.gyOf(target.z + R)) / CH);
    // 1コマに作るのは少しずつ（カクつかないように）
    let budget = 3;
    if (show) for (let cy = cgy0; cy <= cgy1; cy++) for (let cx = cgx0; cx <= cgx1; cx++) {
      const k = cy * 100000 + cx;
      if (chunks.has(k)) continue;
      if (Math.hypot(W.cx(cx * CH + CH / 2) - target.x, W.cz(cy * CH + CH / 2) - target.z) > R) continue;
      if (!W.tileAt(cx * CH, cy * CH)) continue;
      if (budget-- <= 0) continue;
      const g = buildChunk(cx, cy);
      g.userData.center = new THREE.Vector3(W.cx(cx * CH + CH / 2), 0, W.cz(cy * CH + CH / 2));
      chunks.set(k, g); group.add(g); built++;
    }
    for (const [k, g] of chunks) {
      const d = Math.hypot(g.userData.center.x - target.x, g.userData.center.z - target.z);
      g.visible = show && d < R + 20;
      if (g.visible) for (const im of g.children) if (im.userData.full) {   // 遠いほど木を間引き、影も落とさない
        im.count = Math.max(1, Math.floor(im.userData.full * Math.min(1, Math.max(0.3, 55 / dist))));
        im.castShadow = !opt.lite && dist < 70;
      }
      if (d > R * 2 + 120) {   // 遠くへ離れたら捨てる
        group.remove(g);
        for (const c of g.children) { c.dispose?.(); }
        chunks.delete(k);
      }
    }
  }
  function setSeason(si) {
    season = si;
    for (const g of chunks.values()) for (const im of g.children) {
      const ls = im.userData && im.userData.trees;
      if (!ls) continue;
      ls.forEach((t, k) => im.setColorAt(k, treeColor(t, si, COL)));
      im.instanceColor.needsUpdate = true;
    }
  }
  return { group, update, setSeason, stats: () => ({ chunks: chunks.size, built }) };
}
