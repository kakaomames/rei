// 地形（段々の陸）と海。タイルごとにかたまりへ分け、近い所だけ細かいメッシュを作る（必要になってから作る）
// 色は升目のデータテクスチャからシェーダーで決める
import * as THREE from 'three';

const CHUNK = 160;                       // 1かたまりの升目数（タイルは 5×5 かたまり）
const LODS = [[1, 0], [2, 120], [4, 260], [8, 520]];   // [間引き, この距離から]
const FAR_STEP = 16, FAR_DIST = 1100;    // タイル全体を1枚で描く距離

export function toonRamp(steps) {
  const d = new Uint8Array(steps.length * 4);
  steps.forEach((v, i) => { d[i * 4] = d[i * 4 + 1] = d[i * 4 + 2] = v; d[i * 4 + 3] = 255; });
  const t = new THREE.DataTexture(d, steps.length, 1, THREE.RGBAFormat);
  t.magFilter = t.minFilter = THREE.NearestFilter;
  t.needsUpdate = true;
  return t;
}

// 共有の uniform
export function createUniforms(W, owners) {
  return {
    uOwner: { value: owners.tex },
    uTime: { value: 0 },
    uSeason: { value: new THREE.Vector4(1, 0, 0, 0) },   // 春・夏・秋・冬の重み
    uTint: { value: 0.5 },
    uSel: { value: -1 },
    uMe: { value: -1 },        // 自分の勢力（-1＝まだ選んでいない）
    uStripe: { value: 20 },    // 自勢の斜めの帯の間隔（カメラの距離に合わせて毎フレーム変える）
    uCamD: { value: 400 },
    uCell: { value: new THREE.Vector2(W.CX, W.CZ) },
    uMask: { value: (() => { const t = new THREE.DataTexture(new Uint8Array(27 * 33), 27, 33, THREE.RedFormat); t.magFilter = t.minFilter = THREE.NearestFilter; t.needsUpdate = true; return t; })() },
    uGO: { value: new THREE.Vector4(W.cx(0) - W.CX / 2, W.cz(0) - W.CZ / 2, W.CX * W.TS, W.CZ * W.TS) }
  };
}
// 細かいタイルを読んだ所に印をつける（粗い層の地形はそこを描かない）。値は 0〜1 の入れかわりの進み（2026-10-21：一瞬で切りかえず溶かす）
export function setTileMask(U, W, loaded) {
  const d = U.uMask.value.image.data;
  d.fill(0);
  for (const e of loaded) { const t = e.t || e, f = e.fade ?? 1, tx = Math.floor(t.gx0 / W.TS), ty = Math.floor(t.gy0 / W.TS); if (tx >= 0 && ty >= 0 && tx < 27 && ty < 33) d[ty * 27 + tx] = Math.round(f * 255); }
  U.uMask.value.needsUpdate = true;
}

export const OWNER_GLSL = /* glsl */`
uniform sampler2D uOwner; uniform float uTime; uniform float uMe; uniform float uStripe; uniform float uCamD;
float isMine(int id) { return uMe >= 0.0 && abs(texelFetch(uOwner, ivec2(id % 4096, 3), 0).r - uMe) < 0.5 ? 1.0 : 0.0; }
vec3 ownerAt(int id, vec2 p) {
  vec3 cur = texelFetch(uOwner, ivec2(id % 4096, 0), 0).rgb;
  vec3 prev = texelFetch(uOwner, ivec2(id % 4096, 1), 0).rgb;
  vec4 cap = texelFetch(uOwner, ivec2(id % 4096, 2), 0);
  float r = (uTime - cap.x) * cap.w;
  return mix(cur, prev, smoothstep(r - 1.5, r, distance(p, cap.yz)));
}
float captureEdge(int id, vec2 p) {
  vec4 cap = texelFetch(uOwner, ivec2(id % 4096, 2), 0);
  float r = (uTime - cap.x) * cap.w;
  return (1.0 - smoothstep(0.0, 2.5, abs(distance(p, cap.yz) - r))) * (1.0 - smoothstep(60.0, 90.0, r));
}
float isPlay(int id) { return texelFetch(uOwner, ivec2(id % 4096, 3), 0).g; }
`;
const TILE_GLSL = /* glsl */`
uniform sampler2D uData; uniform sampler2D uDist; uniform sampler2D uOwnD;
uniform vec4 uSeason; uniform float uTint; uniform float uSel; uniform vec2 uCell; uniform vec2 uOrigin; uniform vec4 uEdge; uniform vec2 uDim; uniform float uCoarse;
uniform sampler2D uMask; uniform vec4 uGO;
varying vec3 vWPos;
float h21(vec2 p) { p = fract(p * vec2(123.34, 456.21)); p += dot(p, p + 45.32); return fract(p.x * p.y); }
vec3 seasonal(vec3 sp, vec3 su, vec3 au, vec3 wi) { return sp * uSeason.x + su * uSeason.y + au * uSeason.z + wi * uSeason.w; }
// 読みこんでいないタイルに面した縁は雲へ溶かす
float edgeFade(vec2 cc) {
  float f = 1.0;
  f = min(f, mix(1.0, smoothstep(0.0, 26.0, cc.y), uEdge.x));
  f = min(f, mix(1.0, smoothstep(0.0, 26.0, uDim.x - cc.x), uEdge.y));
  f = min(f, mix(1.0, smoothstep(0.0, 26.0, uDim.y - cc.y), uEdge.z));
  f = min(f, mix(1.0, smoothstep(0.0, 26.0, cc.x), uEdge.w));
  return f;
}
`;

// 細かいタイルを読みこんだ所か（粗い層はそこを描かない）
const MASK_GLSL = /* glsl */`
uniform float uFade;
// 画面の点ごとの散らし（細かいタイルと粗い層が、同じ点でちょうど入れかわる）
float ign() { return fract(52.9829189 * fract(dot(gl_FragCoord.xy, vec2(0.06711056, 0.00583715)))); }
float tileLoaded(vec2 p) {
  vec2 ti = floor((p - uGO.xy) / uGO.zw);
  if (ti.x < 0.0 || ti.y < 0.0 || ti.x > 26.0 || ti.y > 32.0) return 0.0;
  return texelFetch(uMask, ivec2(ti), 0).r;
}
`;
export function createTerrainMaterial(U, t, edge, opt = {}) {
  const mat = new THREE.MeshToonMaterial({ color: 0xffffff, gradientMap: toonRamp([150, 205, 255]) });
  mat.flatShading = true;
  const TU = {
    uData: { value: t.dataTex }, uDist: { value: t.distTex }, uOwnD: { value: t.ownTex },
    uOrigin: { value: new THREE.Vector2(t.x0, t.z0) }, uEdge: { value: edge },
    uDim: { value: new THREE.Vector2(t.w || 800, t.h || 800) }, uCoarse: { value: opt.coarse ? 1 : 0 },
    uCell: { value: new THREE.Vector2(t.cellX || U.uCell.value.x, t.cellZ || U.uCell.value.y) },
    uMask: { value: U.uMask.value }, uGO: { value: U.uGO.value },
    uFade: { value: opt.coarse ? 1 : 0 }   // 細かいタイルの入れかわりの進み（0＝粗い層、1＝細かいタイル）
  };
  mat.userData.fade = TU.uFade;
  mat.onBeforeCompile = sh => {
    Object.assign(sh.uniforms, U, TU);
    sh.vertexShader = 'varying vec3 vWPos;\n' + sh.vertexShader.replace('#include <project_vertex>', '#include <project_vertex>\n vWPos = (modelMatrix * vec4(transformed, 1.0)).xyz;');
    sh.fragmentShader = OWNER_GLSL + TILE_GLSL + MASK_GLSL + sh.fragmentShader.replace('vec4 diffuseColor = vec4( diffuse, opacity );', /* glsl */`
      // 粗い層と細かいタイルを、点を散らして溶かすように入れかえる（同じ散らしで片方だけが描かれる）
      if (uCoarse > 0.5) { if (ign() < tileLoaded(vWPos.xz)) discard; } else if (ign() >= uFade) discard;
      vec2 cc = (vWPos.xz - uOrigin) / uCell;
      ivec2 ci = ivec2(clamp(floor(cc), vec2(0.0), uDim - 1.0));
      vec4 dv = texelFetch(uData, ci, 0) * 255.0;
      int g8 = int(dv.g + 0.5);
      int lu = g8 % 16, ter = int(dv.b + 0.5) + (g8 / 16) * 256;
      // 粗い層：まわり4つの升の持ち主を重みづけして塗り分け、境と海岸をなめらかに。墨の線は画面で同じ太さに
      //  （2026-10-21 本人指摘：引くと境と海岸が升の階段どおりにギザギザで、墨の線がにじんで太かった）
      float inkC = 0.0, bandC = 0.0;
      if (uCoarse > 0.5) {
        vec2 q = cc - 0.5, b0 = floor(q), fr = q - b0;
        int ids[4]; float ws[4]; float ow[4]; float wsea = 0.0;
        for (int k = 0; k < 4; k++) {
          ivec2 c = clamp(ivec2(b0) + ivec2(k - (k / 2) * 2, k / 2), ivec2(0), ivec2(uDim) - 1);
          vec4 v = texelFetch(uData, c, 0) * 255.0;
          int gg = int(v.g + 0.5), id = int(v.b + 0.5) + (gg / 16) * 256;
          float w = (k - (k / 2) * 2 == 0 ? 1.0 - fr.x : fr.x) * (k / 2 == 0 ? 1.0 - fr.y : fr.y);
          ids[k] = id; ws[k] = w;
          ow[k] = id > 0 ? (isPlay(id) > 0.5 ? texelFetch(uOwner, ivec2(id % 4096, 3), 0).r : -2.0) : -1.0;
          if (id == 0) wsea += w;
        }
        if (wsea > 0.5) discard;                     // 海（升の中ほどで切る＝なめらかな海岸）
        float best = -1.0, bo = -9.0, second = 0.0;
        for (int a = 0; a < 4; a++) {
          if (ids[a] == 0) continue;
          float sum = 0.0;
          for (int c2 = 0; c2 < 4; c2++) if (ids[c2] > 0 && ow[c2] == ow[a]) sum += ws[c2];
          if (sum > best) { best = sum; bo = ow[a]; }
        }
        float bw = -1.0;
        for (int a = 0; a < 4; a++) {
          if (ids[a] == 0) continue;
          if (ow[a] == bo) { if (ws[a] > bw) { bw = ws[a]; ter = ids[a]; } }
          else { float sum = 0.0; for (int c2 = 0; c2 < 4; c2++) if (ids[c2] > 0 && ow[c2] == ow[a]) sum += ws[c2]; second = max(second, sum); }
        }
        // 線の太さは画面の上で測る（fwidth は分岐の外で。分岐の中だと値が出ず、線が消えた）
        float df = best - (second > 0.0 ? second : -1.0), fw = fwidth(df);
        if (second > 0.0 && bo > -1.5) { inkC = 1.0 - smoothstep(fw * 0.6, fw * 2.0, df); bandC = 1.0 - smoothstep(0.0, 0.45, df); }
      }
      vec2 f = fract(cc);
      float rnd = h21(vec2(ci));
      vec3 fn = normalize(cross(dFdx(vWPos), dFdy(vWPos)));
      float slope = 1.0 - abs(fn.y);
      float far = max(uCoarse, smoothstep(150.0, 700.0, distance(cameraPosition, vWPos)));   // 遠いほど模様を消す（粗い層は模様なし）
      vec3 col;
      if (lu == 1) {          // 田：畦で区切った区画
        vec2 g = fract(cc * vec2(2.0, 3.0));
        float aze = step(min(min(g.x, 1.0 - g.x), min(g.y, 1.0 - g.y)), 0.07) * (1.0 - far);
        col = seasonal(vec3(0.72, 0.85, 0.40), vec3(0.47, 0.82, 0.40), vec3(0.96, 0.78, 0.30), vec3(0.78, 0.64, 0.43));
        col *= 0.94 + rnd * 0.1 * (1.0 - far);
        col = mix(col, col * 0.78, aze);
      } else if (lu == 2) {   // 畑・果樹
        float row = step(0.5, fract((cc.x + cc.y) * 4.0)) * (1.0 - far);
        col = seasonal(vec3(0.66, 0.83, 0.44), vec3(0.55, 0.78, 0.40), vec3(0.85, 0.70, 0.36), vec3(0.72, 0.60, 0.42));
        col *= 0.92 + row * 0.08;
      } else if (lu == 3) {   // 森の地面
        col = seasonal(vec3(0.38, 0.68, 0.38), vec3(0.27, 0.58, 0.33), vec3(0.55, 0.55, 0.30), vec3(0.40, 0.52, 0.36));
        col *= 0.92 + rnd * 0.12 * (1.0 - far);
      } else if (lu == 4) { col = vec3(0.80, 0.77, 0.55); }
      else if (lu == 5) {     // 町：区画の外まわりに道、角に横断歩道
        vec2 e = min(f, 1.0 - f) * uCell;            // 区画の縁までの距離（世界）
        float road = 1.0 - step(0.075, min(e.x, e.y));
        float walk = 1.0 - step(0.13, min(e.x, e.y));
        float zebra = road * step(0.5, fract((f.x + f.y) * 9.0)) * step(min(f.x, 1.0 - f.x) + min(f.y, 1.0 - f.y), 0.32);
        col = mix(vec3(0.97, 0.92, 0.86), vec3(0.88, 0.87, 0.88), walk);
        col = mix(col, vec3(0.62, 0.65, 0.71), road * (1.0 - far));
        col = mix(col, vec3(0.98), zebra * 0.8 * (1.0 - far));
        col = mix(col, vec3(0.90, 0.84, 0.82), far);
      }
      else if (lu == 6) {     // 大きな道路：中央線
        vec2 e = abs(f - 0.5) * uCell;
        float line = (1.0 - step(0.02, min(e.x, e.y))) * step(0.5, fract((cc.x + cc.y) * 3.0));
        col = mix(vec3(0.58, 0.61, 0.67), vec3(1.0, 0.92, 0.55), line * (1.0 - far));
      }
      else if (lu == 7) { col = vec3(0.66, 0.60, 0.56); }
      else if (lu == 8) { col = vec3(0.90, 0.88, 0.78); }
      else if (lu == 9) {     // 池・川：きらきら
        float sp = step(0.985, h21(floor(cc * 6.0) + floor(uTime * 2.0)));
        col = mix(vec3(0.30, 0.74, 0.94), vec3(1.0), sp * 0.7 * (1.0 - far));
      }
      else if (lu == 10) { col = vec3(0.97, 0.89, 0.66); }
      else if (lu == 12) { col = mix(vec3(0.55, 0.88, 0.52), vec3(0.62, 0.93, 0.58), step(0.5, fract(cc.x * 3.0)) * (1.0 - far)); }
      else { col = vec3(0.85, 0.80, 0.60); }
      col = mix(col, vec3(0.80, 0.56, 0.38), smoothstep(0.35, 0.7, slope));      // 段の壁は粘土色
      col = mix(col, vec3(0.97, 0.98, 1.0), uSeason.w * smoothstep(9.0, 13.0, vWPos.y) * 0.85);   // 冬の高い所
      col = pow(col, vec3(2.2));      // 以下は線形の色で
      if (ter > 0) {
        float play = isPlay(ter);
        if (play < 0.5) {             // 遊ばない県：淡く
          float l = dot(col, vec3(0.3, 0.59, 0.11));
          col = mix(col, vec3(l), 0.55) * 0.5 + 0.38;
        } else {
          vec3 oc = ownerAt(ter, vWPos.xz);
          float od = texture2D(uOwnD, cc / uDim).r * 255.0 / 24.0;            // 持ち主の境からの距離（升）
          float lum = dot(col, vec3(0.3, 0.59, 0.11));
          // 遠くでは国の色で塗り、近くでは境の内側だけをふちどる
          col = mix(col, oc * (0.55 + 0.9 * lum), uTint * 0.75);
          float band = uCoarse > 0.5 ? bandC : 1.0 - smoothstep(0.4, 2.6 + far * 4.0, od);   // 粗い層は升が10倍なので、にじみを升の中だけに
          col = mix(col, oc, band * 0.55);
          // 勢力の境は墨の線（色が近くても境が分かるように）
          // 自勢の領地：かなり引いたときだけ斜めの淡い帯（画面の上で同じくらいの太さに見えるよう、間隔はカメラの距離で決める）
          float mine = isMine(ter);
          if (mine > 0.5) {
            float sd = fract((vWPos.x + vWPos.z) / uStripe);
            float aa = fwidth((vWPos.x + vWPos.z) / uStripe) * 1.5;
            float stripe = smoothstep(0.55 - aa, 0.55, sd) * (1.0 - smoothstep(0.9, 0.9 + aa, sd));
            col = mix(col, vec3(1.0), stripe * 0.22 * smoothstep(3000.0, 8000.0, uCamD));   // 帯はかなり引いたときだけ（近くは金の縁だけ）
          }
          col = mix(col, vec3(0.025, 0.03, 0.06), (uCoarse > 0.5 ? inkC : 1.0 - smoothstep(0.3, 0.75 + far * 1.4, od)) * 0.9);
          col = mix(col, vec3(1.0), captureEdge(ter, vWPos.xz) * 0.8);
          if (float(ter) == uSel) col += 0.06 + 0.04 * sin(uTime * 5.0);
        }
      }
      col = mix(vec3(1.0, 0.96, 0.9), col, edgeFade(cc));
      vec4 diffuseColor = vec4(col, opacity);
    `);
  };
  mat.customProgramCacheKey = () => 'terrain-tile-v2';
  return mat;
}

// かたまり（i0,j0 は升目のタイル内番号）・間引き step のメッシュ
function chunkGeometry(W, t, i0, j0, size, step, G) {
  G ||= { y: (gx, gy) => W.yAt(gx, gy), sea: (gx, gy) => W.seaDist(gx, gy), x: gx => W.cx(gx), z: gy => W.cz(gy) };
  const i1 = i0 + size, j1 = j0 + size;
  const nx = Math.floor((i1 - i0) / step) + 1, nz = Math.floor((j1 - j0) / step) + 1;
  const pos = [], idx = [];
  const vid = new Int32Array(nx * nz).fill(-1);
  const gx0 = t.gx0, gy0 = t.gy0;
  const near = (i, j) => G.sea(gx0 + i, gy0 + j) < 3;
  const vert = (a, b) => {
    const k = b * nx + a;
    if (vid[k] < 0) {
      const gx = gx0 + i0 + a * step, gy = gy0 + j0 + b * step;
      vid[k] = pos.length / 3;
      pos.push(G.x(gx), G.y(gx, gy), G.z(gy));
    }
    return vid[k];
  };
  for (let b = 0; b + 1 < nz; b++) for (let a = 0; a + 1 < nx; a++) {
    const i = i0 + a * step, j = j0 + b * step, ie = i + step, je = j + step;
    if (!near(i, j) && !near(ie, j) && !near(i, je) && !near(ie, je)) continue;
    const A = vert(a, b), B = vert(a + 1, b), C = vert(a, b + 1), D = vert(a + 1, b + 1);
    idx.push(A, D, B, A, C, D);
  }
  if (!idx.length) return null;
  const skirt = list => {
    for (let k = 0; k + 1 < list.length; k++) {
      const p = list[k], q = list[k + 1];
      if (p < 0 || q < 0) continue;
      const p2 = pos.length / 3; pos.push(pos[p * 3], pos[p * 3 + 1] - 1.6, pos[p * 3 + 2]);
      const q2 = pos.length / 3; pos.push(pos[q * 3], pos[q * 3 + 1] - 1.6, pos[q * 3 + 2]);
      idx.push(p, q, p2, q, q2, p2, p, p2, q, q, p2, q2);
    }
  };
  const top = [], bot = [], lef = [], rig = [];
  for (let a = 0; a < nx; a++) { top.push(vid[a]); bot.push(vid[(nz - 1) * nx + a]); }
  for (let b = 0; b < nz; b++) { lef.push(vid[b * nx]); rig.push(vid[b * nx + nx - 1]); }
  [top, bot, lef, rig].forEach(skirt);
  const g = new THREE.BufferGeometry();
  g.setAttribute('position', new THREE.Float32BufferAttribute(pos, 3));
  g.setIndex(idx);
  g.computeBoundingSphere();
  return g;
}

// タイル1枚の地形と海
export function createTileTerrain(W, t, U, edge) {
  const mat = createTerrainMaterial(U, t, edge);
  const group = new THREE.Group();
  const chunks = [];
  for (let j0 = 0; j0 < W.TS; j0 += CHUNK) for (let i0 = 0; i0 < W.TS; i0 += CHUNK) {
    // 陸が無いかたまりは作らない
    let land = false;
    for (let j = j0; j < j0 + CHUNK && !land; j += 4) for (let i = i0; i < i0 + CHUNK; i += 4) if (W.seaDist(t.gx0 + i, t.gy0 + j) < 3) { land = true; break; }
    if (!land) continue;
    const c = { i0, j0, center: new THREE.Vector3(W.cx(t.gx0 + i0 + CHUNK / 2), 0, W.cz(t.gy0 + j0 + CHUNK / 2)), levels: [], cur: -1 };
    chunks.push(c);
  }
  // タイル全体の粗いメッシュ（遠くから見るとき）
  const farG = chunkGeometry(W, t, 0, 0, W.TS, FAR_STEP);   // 隣のタイルの最初の升までつなぐ（継ぎ目を出さない）
  const farM = farG ? new THREE.Mesh(farG, mat) : null;
  if (farM) group.add(farM);
  // 海（このタイルの範囲）
  const seaG = new THREE.PlaneGeometry(W.TS * W.CX, W.TS * W.CZ, 1, 1).rotateX(-Math.PI / 2).translate(t.x0 + W.TS * W.CX / 2, 0, t.z0 + W.TS * W.CZ / 2);
  const sea = new THREE.Mesh(seaG, seaMaterial(U, t, edge));
  sea.renderOrder = -1;
  group.add(sea);
  const center = new THREE.Vector3(t.x0 + W.TS * W.CX / 2, 0, t.z0 + W.TS * W.CZ / 2);

  function update(cam) {
    const dTile = center.distanceTo(cam);
    const useFar = dTile > FAR_DIST;
    if (farM) farM.visible = useFar;
    for (const c of chunks) {
      let k = -1;
      if (!useFar) {
        const d = c.center.distanceTo(cam);
        k = 0;
        for (let n = 1; n < LODS.length; n++) if (d >= LODS[n][1]) k = n;
      }
      if (k === c.cur) continue;
      if (c.cur >= 0 && c.levels[c.cur]) c.levels[c.cur].visible = false;
      c.cur = k;
      if (k < 0) continue;
      if (c.levels[k] === undefined) {
        const g = chunkGeometry(W, t, c.i0, c.j0, CHUNK, LODS[k][0]);
        c.levels[k] = g ? new THREE.Mesh(g, mat) : null;
        if (c.levels[k]) { c.levels[k].receiveShadow = k <= 1; group.add(c.levels[k]); }
      }
      if (c.levels[k]) c.levels[k].visible = true;
      // 遠く離れた細かい段階は捨てる（メモリ）
      for (let n = 0; n < 2; n++) if (n !== k && c.levels[n] && Math.abs(n - k) >= 2) { group.remove(c.levels[n]); c.levels[n].geometry.dispose(); c.levels[n] = undefined; }
    }
  }
  return { group, update, mat };
}

function seaMaterial(U, t, edge) {
  return new THREE.ShaderMaterial({
    uniforms: { ...U, uDist: { value: t.distTex }, uOrigin: { value: new THREE.Vector2(t.x0, t.z0) }, uEdge: { value: edge },
      uDim: { value: new THREE.Vector2(t.w || 800, t.h || 800) }, uCell: { value: new THREE.Vector2(t.cellX || U.uCell.value.x, t.cellZ || U.uCell.value.y) }, uDS: { value: t.distScale || 12 }, uCF: { value: t.cellX ? t.cellX / U.uCell.value.x : 1 }, uCoarse: { value: t.distScale ? 1 : 0 } },
    vertexShader: /* glsl */`varying vec3 vWPos; void main(){ vec4 wp = modelMatrix * vec4(position, 1.0); vWPos = wp.xyz; gl_Position = projectionMatrix * viewMatrix * wp; }`,
    fragmentShader: TILE_GLSL.replace('uniform sampler2D uData;', 'uniform float uTime; uniform float uDS; uniform float uCF; uniform sampler2D uData;') + /* glsl */`
      void main() {
        vec2 cc = (vWPos.xz - uOrigin) / uCell;
        float d = texture2D(uDist, cc / uDim).r * 255.0 / uDS;   // 陸からの距離（升）
        // 粗い層は細かい升に直して、海岸（升の中ほど）からの距離に（浅瀬と白いふちがにじんで太かった 2026-10-21）
        if (uCoarse > 0.5) d = max(0.0, d - 0.5) * uCF;
        vec3 deep = vec3(0.16, 0.55, 0.86), shallow = vec3(0.36, 0.84, 0.93);
        vec3 col = mix(shallow, deep, smoothstep(0.5, 9.0, d));
        vec2 q = vWPos.xz * 0.35;
        float wv = sin(q.x * 1.3 + uTime * 0.6 + sin(q.y * 0.9 + uTime * 0.3) * 1.5) * sin(q.y * 1.1 - uTime * 0.5);
        float far = max(uCoarse * 0.6, smoothstep(150.0, 700.0, distance(cameraPosition, vWPos)));
        col += step(0.93, wv) * 0.08 * (1.0 - far);
        float foam = step(0.72, sin(d * 4.2 + uTime * 1.6)) * (1.0 - smoothstep(0.8, 2.4, d)) * (1.0 - far);
        col = mix(col, vec3(1.0), max(foam * 0.6, (1.0 - smoothstep(0.0, max(0.9 + far * 1.5, fwidth(d) * 1.6), d)) * 0.6));
        col = mix(vec3(1.0, 0.96, 0.9), col, edgeFade(cc));
        gl_FragColor = vec4(pow(col, vec3(2.2)), 1.0);
        #include <colorspace_fragment>
      }`
  });
}

// ── 粗い層（全国）──
const CCHUNK = 120;
const CLODS = [[1, 0], [2, 1700], [4, 3800], [8, 7600]];
export function createCoarseTerrain(W, U) {
  const C = W.coarse;
  const t = { dataTex: C.dataTex, distTex: C.distTex, ownTex: C.ownTex, x0: W.ccx(0) - C.CX / 2, z0: W.ccz(0) - C.CZ / 2, w: C.w, h: C.h, cellX: C.CX, cellZ: C.CZ, gx0: 0, gy0: 0 };
  const mat = createTerrainMaterial(U, t, new THREE.Vector4(1, 1, 1, 1), { coarse: true });
  // 陸に接する海の升は水面の少し上に置き、シェーダーで升の中ほどで切る（なめらかな海岸。2026-10-21）
  const G = { y: (cx, cy) => { const y = C.y(cx, cy); return y < 0 && C.inside(cx, cy) && C.sd[cy * C.w + cx] / 24 <= 1.5 ? 0.05 : y; }, sea: (cx, cy) => (C.inside(cx, cy) ? C.sd[cy * C.w + cx] / 24 : 30), x: cx => W.ccx(cx), z: cy => W.ccz(cy) };
  const group = new THREE.Group();
  const chunks = [];
  for (let j0 = 0; j0 < C.h - 1; j0 += CCHUNK) for (let i0 = 0; i0 < C.w - 1; i0 += CCHUNK) {
    let land = false;
    for (let j = j0; j < Math.min(C.h, j0 + CCHUNK) && !land; j += 2) for (let i = i0; i < Math.min(C.w, i0 + CCHUNK); i += 2) if (G.sea(i, j) < 3) { land = true; break; }
    if (!land) continue;
    chunks.push({ i0, j0, center: new THREE.Vector3(W.ccx(i0 + CCHUNK / 2), 0, W.ccz(j0 + CCHUNK / 2)), levels: [], cur: -1 });
  }
  function update(cam) {
    for (const c of chunks) {
      const d = c.center.distanceTo(cam);
      let k = 0;
      for (let n = 1; n < CLODS.length; n++) if (d >= CLODS[n][1]) k = n;
      if (k === c.cur) continue;
      if (c.cur >= 0 && c.levels[c.cur]) c.levels[c.cur].visible = false;
      c.cur = k;
      if (c.levels[k] === undefined) {
        const size = Math.min(CCHUNK, C.w - 1 - c.i0, C.h - 1 - c.j0);
        const g = chunkGeometry(W, t, c.i0, c.j0, size, CLODS[k][0], G);
        c.levels[k] = g ? new THREE.Mesh(g, mat) : null;
        if (c.levels[k]) { c.levels[k].receiveShadow = true; group.add(c.levels[k]); }
      }
      if (c.levels[k]) c.levels[k].visible = true;
    }
  }
  // 全国の海（細かいタイルの海の少し下）
  const sea = new THREE.Mesh(new THREE.PlaneGeometry(C.w * C.CX, C.h * C.CZ, 1, 1).rotateX(-Math.PI / 2).translate(t.x0 + C.w * C.CX / 2, -0.03, t.z0 + C.h * C.CZ / 2),
    seaMaterial(U, { distTex: C.distTex, x0: t.x0, z0: t.z0, w: C.w, h: C.h, cellX: C.CX, cellZ: C.CZ, distScale: 24 }, new THREE.Vector4(1, 1, 1, 1)));
  sea.renderOrder = -1;
  group.add(sea);
  return { group, update, mat };
}
