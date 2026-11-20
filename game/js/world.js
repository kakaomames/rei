// 世界（全国共通の座標と升目）。データはタイル（1次メッシュ・800×800升）で必要な所だけ読む
// 世界座標：1 = 100m。x は東、z は南。原点は 東経137度・北緯36度（全国で同じ）
// 升目は全国共通の番号（gx：東経122度から東へ、gy：北緯46度から南へ）で数える
import * as THREE from 'three';

export const LU = { SEA: 0, PADDY: 1, FARM: 2, FOREST: 3, WASTE: 4, TOWN: 5, ROAD: 6, RAIL: 7, OTHER: 8, WATER: 9, BEACH: 10, SEAW: 11, GOLF: 12 };
export const VEX = 2.5;          // 高さの強調（20m で 0.5）
export const STEP_M = 20;        // 段々の高さ（m）
const LON_O = 122, LAT_O = 46, TS = 800;

export function hash(n) {
  n = (n ^ 61) ^ (n >>> 16); n = n + (n << 3); n = n ^ (n >>> 4); n = Math.imul(n, 0x27d4eb2d); n = n ^ (n >>> 15);
  return (n >>> 0) / 4294967296;
}
export function rng(seed) {
  let s = seed >>> 0 || 1;
  return () => { s ^= s << 13; s ^= s >>> 17; s ^= s << 5; return (s >>> 0) / 4294967296; };
}

export async function loadWorld(base) {
  const idx = await fetch(base + 'munis.json?v=20261019a').then(r => r.json());
  const { lon0, lat0, kx, ky } = idx.proj;
  const CL = idx.cell.lon, CT = idx.cell.lat;
  const CX = CL * kx, CZ = CT * ky;              // 1升の大きさ（世界）
  const XO = (LON_O - lon0) * kx, ZO = -(LAT_O - lat0) * ky;   // 升目の原点の世界座標
  const hMax = idx.heightMax;

  const munis = new Map(idx.munis.map(m => [m.id, m]));
  // 粗い層（全国・3次メッシュ＝細かい升の10倍）
  const C = idx.coarse, CF = C.factor;
  const cbmp = await fetch(base + 'japan.png?v=20261016c').then(r => r.blob()).then(b => createImageBitmap(b, { premultiplyAlpha: 'none', colorSpaceConversion: 'none' }));
  const ccv = document.createElement('canvas');
  ccv.width = C.w; ccv.height = C.h;
  const cc2 = ccv.getContext('2d', { willReadFrequently: true });
  cc2.drawImage(cbmp, 0, 0);
  const cpx = new Uint8Array(cc2.getImageData(0, 0, C.w, C.h).data.buffer);
  const tiles = new Map();                     // メッシュ → { px, gx0, gy0, ... }
  const meshOf = (tx, ty) => `${68 - ty}${22 + tx}`;
  let lastTx = -1e9, lastTy = -1e9, lastT;   // 直前に引いたタイル（同じタイルを続けて引くことが多い）

  const cIn = (cx, cy) => cx >= 0 && cy >= 0 && cx < C.w && cy < C.h;
  const cId = (cx, cy) => { if (!cIn(cx, cy)) return 0; const o = (cy * C.w + cx) * 4; return cpx[o + 2] | ((cpx[o + 1] >> 4) << 8); };
  const cY = (cx, cy) => {
    if (!cIn(cx, cy)) return -0.9;
    const o = (cy * C.w + cx) * 4, id = cpx[o + 2] | ((cpx[o + 1] >> 4) << 8);
    if (!id) return -0.9;
    const r = cpx[o] / 255, q = r * r * hMax / STEP_M, f = q - Math.floor(q), s = f < 0.75 ? 0 : (f - 0.75) / 0.25;
    return 0.16 + (Math.floor(q) + s * s * (3 - 2 * s)) * STEP_M / 100 * VEX;   // 細かい地形より少し低く（継ぎ目で前に出ない）
  };
  const W = {
    idx, munis, tiles, CX, CZ, TS,
    coarse: { ...C, px: cpx, CX: CX * CF, CZ: CZ * CF, id: cId, y: cY, inside: cIn },
    // 粗い升の中心（世界）
    ccx: cx => XO + (cx * CF + CF / 2) * CX,
    ccz: cy => ZO + (cy * CF + CF / 2) * CZ,
    lonX: lon => (lon - lon0) * kx,
    latZ: lat => -(lat - lat0) * ky,
    // 世界 → 全国の升目番号
    gxOf: x => Math.floor((x - XO) / CX),
    gyOf: z => Math.floor((z - ZO) / CZ),
    cx: gx => XO + (gx + 0.5) * CX,
    cz: gy => ZO + (gy + 0.5) * CZ,
    meshOf,
    tileAt(gx, gy) {
      const tx = Math.floor(gx / TS), ty = Math.floor(gy / TS);
      if (tx === lastTx && ty === lastTy) return lastT;
      lastTx = tx; lastTy = ty; lastT = tiles.get(meshOf(tx, ty));
      return lastT;
    },
    // 升目の生データ（RGBA の先頭）。タイルが無ければ -1
    luAt(gx, gy) { const t = W.tileAt(gx, gy); if (!t) return LU.SEA; const i = ((gy - t.gy0) * TS + gx - t.gx0) * 4; return t.px[i + 1] & 15; },
    idAt(gx, gy) { const t = W.tileAt(gx, gy); if (!t) return 0; const i = ((gy - t.gy0) * TS + gx - t.gx0) * 4; return t.px[i + 2] | ((t.px[i + 1] >> 4) << 8); },
    hmAt(gx, gy) { const t = W.tileAt(gx, gy); if (!t) return 0; const r = t.px[((gy - t.gy0) * TS + gx - t.gx0) * 4] / 255; return r * r * hMax; },
    seaDist(gx, gy) {
      const t = W.tileAt(gx, gy);
      if (t) return t.sd[(gy - t.gy0) * TS + gx - t.gx0] / 12;
      const cx = Math.floor(gx / CF), cy = Math.floor(gy / CF);
      return W.coarse.sd && cIn(cx, cy) ? W.coarse.sd[cy * C.w + cx] / 24 * CF : 30;
    },
    // 頂点の高さ（升目の中心）。平地はまっ平ら、山は段々
    yAt(gx, gy) {
      const t = W.tileAt(gx, gy);
      if (!t) return cY(Math.floor(gx / CF), Math.floor(gy / CF));
      const i = (gy - t.gy0) * TS + gx - t.gx0, o = i * 4;
      const id = t.px[o + 2] | ((t.px[o + 1] >> 4) << 8);
      if (!id) return -0.9;
      const r = t.px[o] / 255, hm = r * r * hMax;
      const q = hm / STEP_M, f = q - Math.floor(q), s = f < 0.75 ? 0 : (f - 0.75) / 0.25;
      let y = 0.28 + (Math.floor(q) + s * s * (3 - 2 * s)) * STEP_M / 100 * VEX;
      if ((t.px[o + 1] & 15) === LU.WATER) y -= 0.05;
      return y;
    },
    // 地形の面に合わせた高さ（メッシュの三角形の分け方に合わせる）
    heightAt(x, z) {
      const fx = (x - XO) / CX - 0.5, fz = (z - ZO) / CZ - 0.5;
      const i = Math.floor(fx), j = Math.floor(fz), ax = fx - i, az = fz - j;
      if (!W.tileAt(i, j) || !W.tileAt(i + 1, j + 1)) return W.coarseHeightAt(x, z);
      const a = W.yAt(i, j), b = W.yAt(i + 1, j), c = W.yAt(i, j + 1), d = W.yAt(i + 1, j + 1);
      if (ax >= az) return a + (b - a) * ax + (d - b) * az;
      return a + (d - c) * ax + (c - a) * az;
    },
    // 粗い層の面の高さ（升の中心を頂点にした三角形）
    coarseHeightAt(x, z) {
      const fx = (x - XO) / (CX * CF) - 0.5, fz = (z - ZO) / (CZ * CF) - 0.5;
      const i = Math.floor(fx), j = Math.floor(fz), ax = fx - i, az = fz - j;
      const a = cY(i, j), b = cY(i + 1, j), c = cY(i, j + 1), d = cY(i + 1, j + 1);
      if (ax >= az) return a + (b - a) * ax + (d - b) * az;
      return a + (d - c) * ax + (c - a) * az;
    },
    // 市町村番号（細かいタイルがあればそこから、なければ粗い層から）
    sampleId(x, z) {
      const gx = W.gxOf(x), gy = W.gyOf(z);
      return W.tileAt(gx, gy) ? W.idAt(gx, gy) : cId(Math.floor(gx / CF), Math.floor(gy / CF));
    },
    sampleLu(x, z) { return W.luAt(W.gxOf(x), W.gyOf(z)); },
    // 地図に光線を当てる（地形を少しずつ進む）
    raycast(ray) {
      const o = ray.origin, d = ray.direction;
      if (d.y >= 0) return null;
      let t = Math.max(0, (o.y - 90) / -d.y), prev = t;
      const tEnd = (o.y + 2) / -d.y;
      const step = Math.max(0.15, (tEnd - t) / 1500);
      for (; t <= tEnd; t += step) {
        const x = o.x + d.x * t, z = o.z + d.z * t, y = o.y + d.y * t;
        if (y <= Math.max(0, W.heightAt(x, z))) {
          let lo = prev, hi = t;
          for (let k = 0; k < 10; k++) { const m = (lo + hi) / 2; const yy = o.y + d.y * m; if (yy <= Math.max(0, W.heightAt(o.x + d.x * m, o.z + d.z * m))) hi = m; else lo = m; }
          return new THREE.Vector3(o.x + d.x * hi, o.y + d.y * hi, o.z + d.z * hi);
        }
        prev = t;
      }
      return null;
    },

    // タイルを読む
    async loadTile(mesh) {
      if (tiles.has(mesh)) return tiles.get(mesh);
      const [json, bmp] = await Promise.all([
        fetch(base + `tiles/${mesh}.json?v=20261016b`).then(r => r.json()),
        fetch(base + `tiles/${mesh}.png?v=20261016b`).then(r => r.blob()).then(b => createImageBitmap(b, { premultiplyAlpha: 'none', colorSpaceConversion: 'none' }))
      ]);
      const cv = document.createElement('canvas');
      cv.width = TS; cv.height = TS;
      const c2 = cv.getContext('2d', { willReadFrequently: true });
      c2.drawImage(bmp, 0, 0);
      const px = new Uint8Array(c2.getImageData(0, 0, TS, TS).data.buffer);
      const latTop = (+mesh.slice(0, 2) + 1) / 1.5, lonL = +mesh.slice(2, 4) + 100;
      const gx0 = Math.round((lonL - LON_O) / CL), gy0 = Math.round((LAT_O - latTop) / CT);
      const t = { mesh, json, px, gx0, gy0, x0: XO + gx0 * CX, z0: ZO + gy0 * CZ, sd: new Uint8Array(TS * TS), od: new Uint8Array(TS * TS) };
      tiles.set(mesh, t);
      lastTx = -1e9;
      const tex = new THREE.DataTexture(px, TS, TS, THREE.RGBAFormat);
      tex.magFilter = tex.minFilter = THREE.NearestFilter; tex.needsUpdate = true;
      t.dataTex = tex;
      return t;
    },
    unloadTile(mesh) {
      const t = tiles.get(mesh);
      if (!t) return;
      t.dataTex?.dispose(); t.distTex?.dispose(); t.ownTex?.dispose();
      tiles.delete(mesh);
      lastTx = -1e9;
    },
    // 粗い層の海からの距離・持ち主の境からの距離（全国で1枚）
    coarseFields(ownerOf) {
      const N = C.w * C.h;
      if (!W.coarse.sd) {
        const d = new Float32Array(N);
        for (let i = 0; i < N; i++) d[i] = (cpx[i * 4 + 2] | ((cpx[i * 4 + 1] >> 4) << 8)) ? 0 : 1e4;
        chamfer(d, C.w, C.h);
        const sd = new Uint8Array(N);
        for (let i = 0; i < N; i++) sd[i] = Math.min(255, Math.round(d[i] * 24));
        W.coarse.sd = sd;
        W.coarse.distTex = new THREE.DataTexture(sd, C.w, C.h, THREE.RedFormat);
        W.coarse.distTex.magFilter = W.coarse.distTex.minFilter = THREE.LinearFilter;
        W.coarse.distTex.needsUpdate = true;
        const tex = new THREE.DataTexture(cpx, C.w, C.h, THREE.RGBAFormat);
        tex.magFilter = tex.minFilter = THREE.NearestFilter; tex.needsUpdate = true;
        W.coarse.dataTex = tex;
      }
      const own = new Int16Array(N), d = new Float32Array(N).fill(1e4);
      for (let i = 0; i < N; i++) { const id = cpx[i * 4 + 2] | ((cpx[i * 4 + 1] >> 4) << 8); own[i] = id ? ownerOf(id) : -1; }
      const w = C.w;
      for (let y = 1; y < C.h - 1; y++) for (let x = 1; x < w - 1; x++) {
        const k = y * w + x, o = own[k];
        if (o < 0) continue;
        if ((own[k - 1] >= 0 && own[k - 1] !== o) || (own[k + 1] >= 0 && own[k + 1] !== o) || (own[k - w] >= 0 && own[k - w] !== o) || (own[k + w] >= 0 && own[k + w] !== o)) d[k] = 0.5;
      }
      chamfer(d, w, C.h);
      if (!W.coarse.od) { W.coarse.od = new Uint8Array(N); W.coarse.ownTex = new THREE.DataTexture(W.coarse.od, w, C.h, THREE.RedFormat); W.coarse.ownTex.magFilter = W.coarse.ownTex.minFilter = THREE.LinearFilter; }
      for (let i = 0; i < N; i++) W.coarse.od[i] = Math.min(255, Math.round(d[i] * 24));
      W.coarse.ownTex.needsUpdate = true;
    },
    // 海からの距離（タイル単位・隣のタイルも見る）。読み込みがそろってから呼ぶ
    seaDistance(t) {
      const N = TS * TS, d = new Float32Array(N);
      for (let j = 0; j < TS; j++) for (let i = 0; i < TS; i++) d[j * TS + i] = (t.px[(j * TS + i) * 4 + 2] | ((t.px[(j * TS + i) * 4 + 1] >> 4) << 8)) ? 0 : 1e4;
      chamfer(d, TS, TS);
      for (let i = 0; i < N; i++) t.sd[i] = Math.min(255, Math.round(d[i] * 12));
      if (!t.distTex) { t.distTex = new THREE.DataTexture(t.sd, TS, TS, THREE.RedFormat); t.distTex.magFilter = t.distTex.minFilter = THREE.LinearFilter; }
      t.distTex.needsUpdate = true;
    },
    // 持ち主の境からの距離（領土の内側のふちどりに使う）
    ownerDistance(t, ownerOf) {
      const N = TS * TS, d = new Float32Array(N).fill(1e4), own = new Int16Array(N);
      for (let j = 0; j < TS; j++) for (let i = 0; i < TS; i++) { const id = t.px[(j * TS + i) * 4 + 2] | ((t.px[(j * TS + i) * 4 + 1] >> 4) << 8); own[j * TS + i] = id ? ownerOf(id) : -1; }
      for (let j = 0; j < TS; j++) for (let i = 0; i < TS; i++) {
        const k = j * TS + i, o = own[k];
        if (o < 0) continue;
        if ((i > 0 && own[k - 1] >= 0 && own[k - 1] !== o) || (i < TS - 1 && own[k + 1] >= 0 && own[k + 1] !== o) ||
            (j > 0 && own[k - TS] >= 0 && own[k - TS] !== o) || (j < TS - 1 && own[k + TS] >= 0 && own[k + TS] !== o)) d[k] = 0.5;
      }
      chamfer(d, TS, TS);
      for (let i = 0; i < N; i++) t.od[i] = Math.min(255, Math.round(d[i] * 24));
      if (!t.ownTex) { t.ownTex = new THREE.DataTexture(t.od, TS, TS, THREE.RedFormat); t.ownTex.magFilter = t.ownTex.minFilter = THREE.LinearFilter; }
      t.ownTex.needsUpdate = true;
    }
  };
  return W;
}

function chamfer(d, w, h) {
  const pass = (y0, y1, dy, x0, x1, dx) => {
    for (let y = y0; y !== y1; y += dy) for (let x = x0; x !== x1; x += dx) {
      const i = y * w + x;
      let v = d[i];
      const xi = x - dx, yi = y - dy, xo = x + dx;
      if (xi >= 0 && xi < w) v = Math.min(v, d[i - dx] + 1);
      if (yi >= 0 && yi < h) {
        v = Math.min(v, d[i - dy * w] + 1);
        if (xi >= 0 && xi < w) v = Math.min(v, d[i - dy * w - dx] + 1.414);
        if (xo >= 0 && xo < w) v = Math.min(v, d[i - dy * w + dx] + 1.414);
      }
      d[i] = v;
    }
  };
  pass(0, h, 1, 0, w, 1); pass(h - 1, -1, -1, w - 1, -1, -1);
}
