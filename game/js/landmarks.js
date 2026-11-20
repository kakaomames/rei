// 境界・のぼり・役所と旗・県庁・名産の大きなオブジェ・線路と橋・駅・縁の雲
// 境界の線は持ち主しだいで形を変える（シェーダーで毎コマ判定するので、占領してもすぐ変わる）
//   勢力どうしの境：太い二色（それぞれの側を自分の色で）  同じ勢力の県境：中くらいのクリーム色  同じ勢力の市町村境：細い破線
import * as THREE from 'three';
import { hash } from './world.js?v=20261026a';
import { toonMat, part, merge, M4, RAMP } from './mat.js?v=20261026a';
import { OWNER_GLSL } from './terrain.js?v=20261026a';

// 名産の表はデータ（data/munis.json の meisan・特許庁の地域団体商標）。ここは店先の形だけ
import { MEISAN } from './sim.js?v=20261026a';
export { MEISAN };

// ── 名産の店先：商品そのものは形にしない（実在の名産を似せて作ると失礼になりうるので）──
//  白壁の小さな店・瓦の切妻屋根・種類の色の暖簾・名前を縦書きしたのぼり（最大3本）・種類を示す小物ひとつ
//  小物は種類の目じるしだけ（酒樽・米俵・魚箱・果物かご・野菜かご・菓子の箱・陳列棚・提灯・湯けむり）
const CAT_COLOR = { men: '#e8b04a', kome: '#d8c38a', umi: '#3f8fd2', kajitsu: '#f08a3c', yasai: '#6bb35a', niku: '#c0504d', sake: '#7a5aa6', craft: '#4a5a78', aji: '#d4697a', yu: '#2fa39a' };
const mats = new Map();
const mt = c => { if (!mats.has(c)) mats.set(c, new THREE.MeshToonMaterial({ color: c, gradientMap: RAMP })); return mats.get(c); };
// のぼりの文字：縦書きの札を1枚ずつ小さな canvas に描く（同じ名前は使い回す）
const banners = new Map();
function bannerTex(text, color) {
  const key = text + color;
  if (banners.has(key)) return banners.get(key);
  const W = 128, H = 512, cv = document.createElement('canvas');
  cv.width = W; cv.height = H;
  const g = cv.getContext('2d');
  const chars = [...text.replace(/[\s　]/g, '')];
  const cols = chars.length > 9 ? 2 : 1, per = Math.ceil(chars.length / cols);
  const size = Math.min(84, Math.floor((H - 60) / per), cols === 2 ? 54 : 84);
  const font = `900 ${size}px "M PLUS Rounded 1c"`;
  const draw = () => {
    g.clearRect(0, 0, W, H);
    g.fillStyle = color; g.fillRect(0, 0, W, H);
    g.fillStyle = 'rgba(255,255,255,.9)'; g.fillRect(0, 0, W, 26); g.fillRect(0, H - 10, W, 10);   // 上の白い帯
    g.font = `${font}, "Hiragino Maru Gothic ProN", sans-serif`;
    g.textAlign = 'center'; g.textBaseline = 'middle';
    g.lineJoin = 'round'; g.lineWidth = Math.max(4, size * 0.14); g.strokeStyle = 'rgba(20,28,44,.85)'; g.fillStyle = '#fff';
    for (let c = 0; c < cols; c++) {
      const part = chars.slice(c * per, (c + 1) * per);
      const x = cols === 1 ? W / 2 : (c === 0 ? W * 0.72 : W * 0.28);   // 縦書きは右の列から
      const y0 = 40 + (H - 60 - part.length * size) / 2 + size / 2;
      part.forEach((ch, i) => {
        const y = y0 + i * size;
        const rot = /[ー〜～\-－・…]/.test(ch);   // のばす棒は縦向きに
        g.save(); g.translate(x, y); if (rot) g.rotate(Math.PI / 2);
        g.strokeText(ch, 0, 0); g.fillText(ch, 0, 0); g.restore();
      });
    }
  };
  draw();
  const t = new THREE.CanvasTexture(cv);
  t.colorSpace = THREE.SRGBColorSpace; t.anisotropy = 4;
  // 書体は文字の範囲ごとに分けて配られるので、この文字の分を読みこんでから描き直す（太さがそろう）
  if (document.fonts && document.fonts.load) document.fonts.load(font, chars.join('')).then(() => { draw(); t.needsUpdate = true; }).catch(() => {});
  banners.set(key, t);
  return t;
}
function noboriMesh(text, color) {
  const n = new THREE.Group();
  const pole = new THREE.Mesh(new THREE.CylinderGeometry(0.035, 0.035, 3.4, 6).translate(0, 1.7, 0), mt('#6b5038'));
  const top = new THREE.Mesh(new THREE.BoxGeometry(0.62, 0.04, 0.04).translate(0.3, 3.25, 0), mt('#6b5038'));
  const mat = new THREE.MeshBasicMaterial({ map: bannerTex(text, color) });
  const cloth = new THREE.Group();
  cloth.add(new THREE.Mesh(new THREE.PlaneGeometry(0.6, 2.4).translate(0.3, 0, 0.004), mat), new THREE.Mesh(new THREE.PlaneGeometry(0.6, 2.4).rotateY(Math.PI).translate(0.3, 0, -0.004), mat));
  cloth.position.set(0.03, 2.0, 0);
  cloth.userData.cloth = true;
  n.add(pole, top, cloth);
  return n;
}
function propOf(cat, name = '') {
  const g = new THREE.Group();
  const add = (geo, c, x, y, z, ry = 0) => { const m = new THREE.Mesh(geo, mt(c)); m.position.set(x, y, z); m.rotation.y = ry; g.add(m); return m; };
  // 茶の店に酒樽、花の店に野菜かごは合わないので分ける（2026-10-19）
  if (cat === 'sake' && /茶|玉露|煎茶|抹茶|碾茶/.test(name)) {   // 茶箱と茶壺
    add(new THREE.BoxGeometry(0.5, 0.42, 0.4), '#c9a46a', 0, 0.21, 0); add(new THREE.BoxGeometry(0.52, 0.06, 0.42), '#5b7a3a', 0, 0.44, 0);
    add(new THREE.BoxGeometry(0.36, 0.2, 0.02), '#f3ead8', 0, 0.24, 0.205);
    add(new THREE.SphereGeometry(0.2, 14, 10).scale(1, 1.15, 1), '#4f6b3a', 0.62, 0.23, 0.05); add(new THREE.CylinderGeometry(0.1, 0.12, 0.08, 12), '#3e5530', 0.62, 0.48, 0.05);
    return g;
  }
  if (cat === 'yasai' && /花(?!穂)|草|りんどう|菊|丹頂/.test(name)) {   // 花桶に切花
    add(new THREE.CylinderGeometry(0.3, 0.24, 0.34, 14), '#8a6a4a', 0.2, 0.17, 0);
    const c = ['#f4f1ff', '#c58ae0', '#ff8fb1', '#ffd36b'];
    for (let i = 0; i < 9; i++) { const a = i * 2.4, r = i ? 0.1 + (i % 3) * 0.05 : 0, x = 0.2 + Math.cos(a) * r, z = Math.sin(a) * r, h = 0.62 + (i % 3) * 0.08;
      add(new THREE.CylinderGeometry(0.012, 0.012, h - 0.3, 4), '#4f9a45', x, 0.3 + (h - 0.3) / 2, z); add(new THREE.IcosahedronGeometry(0.07, 0), c[i % 4], x, h, z); }
    return g;
  }
  switch (cat) {
    case 'sake':   // 酒樽
      add(new THREE.CylinderGeometry(0.32, 0.32, 0.5, 14), '#c9a46a', 0, 0.25, 0); add(new THREE.CylinderGeometry(0.335, 0.335, 0.06, 14), '#5b4636', 0, 0.12, 0); add(new THREE.CylinderGeometry(0.335, 0.335, 0.06, 14), '#5b4636', 0, 0.4, 0);
      add(new THREE.CylinderGeometry(0.32, 0.32, 0.5, 14), '#c9a46a', 0.66, 0.25, 0.1); add(new THREE.CylinderGeometry(0.335, 0.335, 0.06, 14), '#5b4636', 0.66, 0.12, 0.1); add(new THREE.CylinderGeometry(0.335, 0.335, 0.06, 14), '#5b4636', 0.66, 0.4, 0.1); break;
    case 'kome':   // 米俵
      for (const [x, y] of [[0, 0.22], [0.5, 0.22], [0.25, 0.6]]) { const m = add(new THREE.CylinderGeometry(0.22, 0.22, 0.55, 12).rotateZ(Math.PI / 2), '#d9c48a', x, y, 0); for (const dx of [-0.17, 0, 0.17]) { const r = new THREE.Mesh(new THREE.TorusGeometry(0.225, 0.018, 4, 14).rotateY(Math.PI / 2), mt('#8a6a3a')); r.position.x = dx; m.add(r); } } break;
    case 'umi':   // 魚箱
      for (const [x, y] of [[0, 0.13], [0.6, 0.13], [0.3, 0.39]]) { add(new THREE.BoxGeometry(0.55, 0.24, 0.38), '#3f8fd2', x, y, 0); add(new THREE.BoxGeometry(0.47, 0.03, 0.3), '#dbeefc', x, y + 0.11, 0); } break;
    case 'kajitsu': case 'yasai': {   // かごに盛った実・葉もの（種類の色の丸い粒）
      add(new THREE.CylinderGeometry(0.42, 0.32, 0.26, 14), '#b88a52', 0.2, 0.13, 0);
      const c = cat === 'kajitsu' ? ['#f08a3c', '#f3b23a', '#e2533f'] : ['#6bb35a', '#4f9a45', '#9ccc65'];
      for (let i = 0; i < 9; i++) { const a = i * 2.4, r = i ? 0.18 + (i % 3) * 0.06 : 0; add(new THREE.SphereGeometry(0.11, 10, 8), c[i % 3], 0.2 + Math.cos(a) * r, 0.3 + (i % 2) * 0.05, Math.sin(a) * r); }
      break;
    }
    case 'aji':   // 包んだ菓子の箱
      add(new THREE.BoxGeometry(0.5, 0.18, 0.36), '#d4697a', 0, 0.09, 0); add(new THREE.BoxGeometry(0.44, 0.16, 0.32), '#fff5e6', 0.05, 0.26, 0.02, 0.2); add(new THREE.BoxGeometry(0.06, 0.19, 0.37), '#f3c34a', 0, 0.09, 0); break;
    case 'craft':   // 陳列棚
      add(new THREE.BoxGeometry(0.9, 0.06, 0.34), '#7a5a3c', 0.2, 0.42, 0); add(new THREE.BoxGeometry(0.9, 0.06, 0.34), '#7a5a3c', 0.2, 0.12, 0);
      for (const x of [-0.22, 0.62]) add(new THREE.BoxGeometry(0.05, 0.5, 0.05), '#5b4636', x, 0.25, 0);
      for (const [x, c] of [[0.0, '#4a5a78'], [0.22, '#b5482f'], [0.44, '#d8b25a']]) add(new THREE.BoxGeometry(0.16, 0.16, 0.16), c, x, 0.53, 0); break;
    case 'yu':   // 湯けむり（ゆっくり上る）
      for (let i = 0; i < 3; i++) { const m = add(new THREE.IcosahedronGeometry(0.22, 1), '#ffffff', 0.1 + i * 0.18, 0.4, 0); m.material = new THREE.MeshToonMaterial({ color: '#ffffff', gradientMap: RAMP, transparent: true, opacity: 0.8 }); m.userData.steam = i; }
      break;
    default: {   // 麺・肉など：提灯ふたつ（商品の形はつくらない）
      for (const x of [0, 0.5]) { add(new THREE.CylinderGeometry(0.16, 0.16, 0.32, 12), '#e0393e', x, 0.75, 0); add(new THREE.CylinderGeometry(0.11, 0.11, 0.05, 10), '#2b2f3f', x, 0.93, 0); add(new THREE.CylinderGeometry(0.11, 0.11, 0.05, 10), '#2b2f3f', x, 0.57, 0); add(new THREE.CylinderGeometry(0.02, 0.02, 0.55, 5), '#6b5038', x, 0.28, 0); }
    }
  }
  return g;
}
// 店先ひとつ：items＝その町の名産（最大3つの名前をのぼりに）
function meisanShop(items) {
  const root = new THREE.Group();
  const cat = items[0].cat, col = CAT_COLOR[cat] || '#d4697a';
  const shop = new THREE.Group();
  const body = new THREE.Mesh(new THREE.BoxGeometry(1.8, 0.95, 1.1).translate(0, 0.475, 0), mt('#f3ead8')); body.castShadow = true;
  const base = new THREE.Mesh(new THREE.BoxGeometry(1.86, 0.14, 1.16).translate(0, 0.07, 0), mt('#7d7468'));
  const beam = new THREE.Mesh(new THREE.BoxGeometry(1.86, 0.1, 1.16).translate(0, 0.95, 0), mt('#6b5038'));
  for (const x of [-0.86, 0.86]) { const p2 = new THREE.Mesh(new THREE.BoxGeometry(0.09, 0.95, 0.09).translate(x, 0.475, 0.56), mt('#6b5038')); shop.add(p2); }
  const roof = new THREE.Mesh(gableRoof(2.3, 1.6, 0.6).translate(0, 1.0, 0), mt('#3d4a5c')); roof.castShadow = true;
  const ridge = new THREE.Mesh(new THREE.BoxGeometry(2.36, 0.07, 0.1).translate(0, 1.6, 0), mt('#2b3442'));
  const door = new THREE.Mesh(new THREE.BoxGeometry(1.2, 0.62, 0.02).translate(0, 0.45, 0.561), mt('#4a3a2c'));
  shop.add(body, base, beam, roof, ridge, door);
  // 暖簾：三枚、種類の色。真ん中に白い丸
  for (let i = 0; i < 3; i++) {
    const n = new THREE.Mesh(new THREE.PlaneGeometry(0.4, 0.42).translate(0, -0.21, 0), mt(col)); n.material = n.material.clone(); n.material.side = THREE.DoubleSide;
    n.position.set(-0.42 + i * 0.42, 0.9, 0.6); n.userData.noren = i; shop.add(n);
  }
  const maru = new THREE.Mesh(new THREE.CircleGeometry(0.1, 16), mt('#ffffff')); maru.position.set(0, 0.73, 0.605); shop.add(maru);
  root.add(shop);
  // のぼり（店の右前に並べる）
  items.slice(0, 3).forEach((it, i) => { const nb = noboriMesh(it.name, CAT_COLOR[it.cat] || col); nb.position.set(1.15 + i * 0.42, 0, 0.75 - i * 0.18); nb.rotation.y = -0.35; root.add(nb); });
  // 種類の小物（店の左前）
  const pr = propOf(cat, items[0].name); pr.position.set(-1.45, 0, 0.55); root.add(pr);
  return root;
}
const gableRoof = (w, d, h) => {
  const x = w / 2, z = d / 2;
  const p = [-x, 0, -z, x, h, 0, x, 0, -z, -x, 0, -z, -x, h, 0, x, h, 0, -x, 0, z, x, 0, z, x, h, 0, -x, 0, z, x, h, 0, -x, h, 0, -x, 0, -z, -x, 0, z, -x, h, 0, x, 0, -z, x, h, 0, x, 0, z];
  const g = new THREE.BufferGeometry(); g.setAttribute('position', new THREE.Float32BufferAttribute(p, 3)); g.computeVertexNormals(); return g;
};

function chaikin(pts, n) {
  for (let it = 0; it < n; it++) {
    const out = [pts[0]];
    for (let i = 0; i + 1 < pts.length; i++) {
      const [ax, az] = pts[i], [bx, bz] = pts[i + 1];
      out.push([ax * 0.75 + bx * 0.25, az * 0.75 + bz * 0.25], [ax * 0.25 + bx * 0.75, az * 0.25 + bz * 0.75]);
    }
    out.push(pts[pts.length - 1]);
    pts = out;
  }
  return pts;
}

export function createLandmarks(W, U, owners) {
  const shopAt = [];   // 名産の店の位置（まわりに木や建物を置かない）
  const MS = new Map();   // 市町村 → 名産（地域団体商標）
  for (const [id, no, name, yomi, cat, wide, src = 'tm', major = 1] of W.idx.meisan || []) { if (!MS.has(id)) MS.set(id, []); MS.get(id).push({ no, name, yomi, cat, wide, src, major }); }
  for (const l of MS.values()) l.sort((a, b) => b.major - a.major);   // のぼりはメジャーなものから
  const group = new THREE.Group();
  const play = id => W.munis.get(id)?.play;

  // ── 境界のリボン（タイルごと）──
  const borderMat = new THREE.ShaderMaterial({
    uniforms: { uOwner: U.uOwner, uTime: U.uTime, uBW: { value: 0.3 } },
    vertexShader: /* glsl */`
      uniform sampler2D uOwner; uniform float uBW;
      attribute vec2 aSide; attribute vec2 aTer; attribute float aEdge; attribute float aLen;
      varying float vTer; varying float vEdge; varying vec2 vP; varying float vStyle; varying float vLen;
      void main() {
        vec4 a = texelFetch(uOwner, ivec2(int(aTer.x + 0.5), 3), 0), b = texelFetch(uOwner, ivec2(int(aTer.y + 0.5), 3), 0);
        // 0：隠す  1：同じ勢力の市町村境（細い破線）  2：同じ勢力の県境  3：勢力どうしの境
        float st = (a.g < 0.5 && b.g < 0.5) ? 0.0 : (a.r != b.r ? 3.0 : (a.a != b.a ? 2.0 : 1.0));
        float wd = st == 3.0 ? 1.0 : st == 2.0 ? 0.45 : st == 1.0 ? 0.16 : 0.0;
        vec3 p = position + vec3(aSide.x, 0.0, aSide.y) * uBW * wd * aEdge;
        p.y += uBW * 0.12;
        vTer = aTer.x; vEdge = aEdge; vP = p.xz; vStyle = st; vLen = aLen;
        gl_Position = projectionMatrix * viewMatrix * vec4(p, 1.0);
      }`,
    fragmentShader: OWNER_GLSL + /* glsl */`
      uniform float uBW;
      varying float vTer; varying float vEdge; varying vec2 vP; varying float vStyle; varying float vLen;
      void main() {
        if (vStyle < 0.5) discard;
        vec3 c;
        if (vStyle > 2.5) {
          c = ownerAt(int(vTer + 0.5), vP);
          c = mix(vec3(0.05, 0.06, 0.1), c, smoothstep(0.18, 0.26, vEdge));   // 真ん中は墨の線
          c = mix(c, vec3(1.0), smoothstep(0.26, 0.32, vEdge) * (1.0 - smoothstep(0.32, 0.4, vEdge)) * 0.9);   // 墨のきわに白い縁   // 墨のきわに白い縁
        } else if (vStyle > 1.5) { c = vec3(1.0, 0.95, 0.82); }
        else {
          if (fract(vLen / max(0.6, uBW * 3.0)) > 0.55) discard;     // 破線
          c = vec3(1.0, 0.98, 0.92);
        }
        gl_FragColor = vec4(c, 1.0);
        #include <colorspace_fragment>
      }`,
    side: THREE.DoubleSide
  });
  const noboriMat = toonMat(U, { owner: true, sway: 0.18, flat: true, noboriVis: true });
  const noboriGeo = merge([
    part(new THREE.CylinderGeometry(0.025, 0.025, 1.1, 4).translate(0, 0.55, 0), '#ffffff'),
    part(new THREE.BoxGeometry(0.3, 0.7, 0.02, 1, 3, 1).translate(0.17, 0.62, 0), null),
    part(new THREE.BoxGeometry(0.34, 0.04, 0.04).translate(0.17, 1.0, 0), '#ffffff')
  ]);

  function buildBorders(t) {
    const pos = [], side = [], terA = [], edge = [], len = [], idx = [], nob = [];
    for (const b of t.json.borders) {
      if (!play(b.a) && !play(b.b)) continue;
      // 細かく割ってからなめらかに
      let pts = b.pts.map(([lon, lat]) => [W.lonX(lon), W.latZ(lat)]);
      const fine = [];
      for (let k = 0; k + 1 < pts.length; k++) {
        const [ax, az] = pts[k], [bx, bz] = pts[k + 1], n = Math.max(1, Math.ceil(Math.hypot(bx - ax, bz - az) / 0.6));
        for (let s = 0; s < n; s++) fine.push([ax + (bx - ax) * s / n, az + (bz - az) * s / n]);
      }
      fine.push(pts[pts.length - 1]);
      pts = chaikin(fine, 2);
      if (pts.length < 2) continue;
      const mid = Math.floor(pts.length / 2), p0 = pts[Math.max(0, mid - 1)], p1 = pts[Math.min(pts.length - 1, mid + 1)];
      let nx = -(p1[1] - p0[1]), nz = p1[0] - p0[0];
      const nl = Math.hypot(nx, nz) || 1; nx /= nl; nz /= nl;
      const leftIsA = W.sampleId(pts[mid][0] + nx * 0.8, pts[mid][1] + nz * 0.8) === b.a;
      const L = leftIsA ? b.a : b.b, R = leftIsA ? b.b : b.a;
      const base = pos.length / 3;
      let acc = 0, nAcc = 0;
      for (let k = 0; k < pts.length; k++) {
        const q0 = pts[Math.max(0, k - 1)], q1 = pts[Math.min(pts.length - 1, k + 1)];
        let tx = q1[0] - q0[0], tz = q1[1] - q0[1];
        const tl = Math.hypot(tx, tz) || 1; tx /= tl; tz /= tl;
        const [x, z] = pts[k];
        if (k) { const d = Math.hypot(x - pts[k - 1][0], z - pts[k - 1][1]); acc += d; nAcc += d; }
        const y = Math.max(W.heightAt(x, z), W.heightAt(x - tz * 0.4, z + tx * 0.4), W.heightAt(x + tz * 0.4, z - tx * 0.4), 0.3) + 0.06;
        for (const [sx, e, own, oth] of [[1, 0, L, R], [1, 1, L, R], [-1, 0, R, L], [-1, 1, R, L]]) {
          pos.push(x, y, z); side.push(-tz * sx, tx * sx); terA.push(own, oth); edge.push(e); len.push(acc);
        }
        if (k) { const p = base + (k - 1) * 4, q = base + k * 4; idx.push(p, q + 1, q, p, p + 1, q + 1, p + 2, q + 2, q + 3, p + 2, q + 3, p + 3); }
        // のぼり（両側に。勢力が違うときだけ立つ）
        if (nAcc > 2.6) {
          nAcc = 0;
          for (const [sg, own, oth] of [[1, L, R], [-1, R, L]]) {
            const px = x - tz * 0.5 * sg, pz = z + tx * 0.5 * sg;
            if (W.sampleId(px, pz) === own) nob.push([px, W.heightAt(px, pz), pz, own, oth]);
          }
        }
      }
    }
    const out = new THREE.Group();
    if (idx.length) {
      const g = new THREE.BufferGeometry();
      g.setAttribute('position', new THREE.Float32BufferAttribute(pos, 3));
      g.setAttribute('aSide', new THREE.Float32BufferAttribute(side, 2));
      g.setAttribute('aTer', new THREE.Float32BufferAttribute(terA, 2));
      g.setAttribute('aEdge', new THREE.Float32BufferAttribute(edge, 1));
      g.setAttribute('aLen', new THREE.Float32BufferAttribute(len, 1));
      g.setIndex(idx);
      g.computeBoundingSphere();
      const m = new THREE.Mesh(g, borderMat);
      m.renderOrder = 2;
      out.add(m);
    }
    if (nob.length) {
      const geo = noboriGeo.clone();
      const im = new THREE.InstancedMesh(geo, noboriMat, nob.length);
      const ter = new Float32Array(nob.length * 2);
      nob.forEach((p, k) => { im.setMatrixAt(k, M4(p[0], p[1], p[2], 1, 1, 1, hash(k) * 6.28)); ter[k * 2] = p[3]; ter[k * 2 + 1] = p[4]; });
      geo.setAttribute('aTer2', new THREE.InstancedBufferAttribute(ter, 2));
      im.castShadow = true;
      im.computeBoundingSphere();
      im.userData.nobori = true;
      out.add(im);
    }
    return out;
  }

  // ── 線路・橋・駅（タイルごと）──
  const OP = { '四国旅客鉄道': '#3fb6ff', '高松琴平電気鉄道': '#ffd23f', '西日本旅客鉄道': '#7bd389', '伊予鉄道': '#ff9f43', '土佐くろしお鉄道': '#ff6b6b', 'とさでん交通': '#a06cd5', '阿佐海岸鉄道': '#2ec4b6' };
  const railMat = new THREE.ShaderMaterial({
    vertexShader: 'void main(){ gl_Position = projectionMatrix * viewMatrix * vec4(position + vec3(0.0, 0.02, 0.0), 1.0); }',
    fragmentShader: 'void main(){ gl_FragColor = vec4(vec3(0.45, 0.41, 0.42), 1.0); \n#include <colorspace_fragment>\n }',
    side: THREE.DoubleSide, polygonOffset: true, polygonOffsetFactor: -2
  });
  const pierGeo = merge([part(new THREE.CylinderGeometry(0.12, 0.16, 1, 6).translate(0, -0.5, 0), '#e8ecf2'), part(new THREE.BoxGeometry(0.5, 0.12, 0.42), '#d64545')]);
  const towerGeo = merge([
    part(new THREE.BoxGeometry(0.22, 6, 0.22).translate(-0.5, 3, 0), '#e9eef5'), part(new THREE.BoxGeometry(0.22, 6, 0.22).translate(0.5, 3, 0), '#e9eef5'),
    part(new THREE.BoxGeometry(1.25, 0.25, 0.3).translate(0, 5.6, 0), '#d64545'), part(new THREE.BoxGeometry(1.25, 0.2, 0.3).translate(0, 3.6, 0), '#d64545')
  ]);
  const stGeo = merge([
    part(new THREE.BoxGeometry(1.1, 0.14, 0.32).translate(0, 0.07, 0.34), '#f2e9da'), part(new THREE.BoxGeometry(1.1, 0.14, 0.32).translate(0, 0.07, -0.34), '#f2e9da'),
    part(new THREE.BoxGeometry(0.9, 0.05, 0.36).translate(0, 0.5, 0.34), null), part(new THREE.BoxGeometry(0.9, 0.05, 0.36).translate(0, 0.5, -0.34), null),
    part(new THREE.CylinderGeometry(0.02, 0.02, 0.36, 4).translate(0, 0.32, 0.34), '#ffffff')
  ]);
  const smallToon = toonMat(U);
  const rails = [];
  function buildRails(t) {
    const out = new THREE.Group();
    const bal = [], ix = [], piers = [], mine = [];
    for (const r of t.json.rails) {
      const raw = r.pts.map(([lon, lat]) => [W.lonX(lon), W.latZ(lat)]);
      const pts = [];
      for (let k = 0; k + 1 < raw.length; k++) {
        const [ax, az] = raw[k], [bx, bz] = raw[k + 1], n = Math.max(1, Math.ceil(Math.hypot(bx - ax, bz - az) / 0.6));
        for (let s = 0; s < n; s++) pts.push([ax + (bx - ax) * s / n, az + (bz - az) * s / n]);
      }
      pts.push(raw[raw.length - 1]);
      const ys = pts.map(([x, z]) => Math.max(W.heightAt(x, z) + 0.08, 2.2 * Math.min(1, W.seaDist(W.gxOf(x), W.gyOf(z)) / 1.5), 0.36));
      for (let it = 0; it < 6; it++) for (let k = 1; k + 1 < ys.length; k++) ys[k] = Math.max(ys[k], (ys[k - 1] + ys[k + 1]) / 2 - 0.05);
      const base = bal.length / 3;
      let lastPier = -99;
      for (let k = 0; k < pts.length; k++) {
        const q0 = pts[Math.max(0, k - 1)], q1 = pts[Math.min(pts.length - 1, k + 1)];
        let tx = q1[0] - q0[0], tz = q1[1] - q0[1];
        const tl = Math.hypot(tx, tz) || 1; tx /= tl; tz /= tl;
        const [x, z] = pts[k], y = ys[k];
        bal.push(x - tz * 0.16, y, z + tx * 0.16, x + tz * 0.16, y, z - tx * 0.16);
        if (k) { const p = base + (k - 1) * 2, q = base + k * 2; ix.push(p, q, p + 1, p + 1, q, q + 1); }
        if (!W.sampleId(x, z) && k - lastPier >= 4) { piers.push([x, y, z]); lastPier = k; }
      }
      const rr = { op: r.op, line: r.line, color: OP[r.op] || '#ff7a45', pts: pts.map((p, k) => [p[0], ys[k], p[1]]) };
      rr.mesh = t.mesh;
      rails.push(rr); mine.push(rr);
    }
    if (ix.length) {
      const g = new THREE.BufferGeometry();
      g.setAttribute('position', new THREE.Float32BufferAttribute(bal, 3));
      g.setIndex(ix);
      g.computeBoundingSphere();
      const m = new THREE.Mesh(g, railMat); m.renderOrder = 1; out.add(m);
    }
    if (piers.length) {
      const pm = new THREE.InstancedMesh(pierGeo, smallToon, piers.length);
      piers.forEach((p, k) => pm.setMatrixAt(k, M4(p[0], p[1] - 0.04, p[2], 1, p[1] + 1, 1)));
      pm.castShadow = true; pm.computeBoundingSphere(); out.add(pm);
      const towers = piers.filter((_, k) => k % 7 === 3);
      if (towers.length) {
        const tm = new THREE.InstancedMesh(towerGeo, smallToon, towers.length);
        towers.forEach((p, k) => tm.setMatrixAt(k, M4(p[0], p[1] - 0.6, p[2])));
        tm.castShadow = true; tm.computeBoundingSphere(); out.add(tm);
      }
    }
    const sts = t.json.stations;
    if (sts.length) {
      const sm = new THREE.InstancedMesh(stGeo, smallToon, sts.length);
      const c = new THREE.Color();
      sts.forEach((s, k) => {
        const x = W.lonX(s.p[0]), z = W.latZ(s.p[1]);
        let best = null, bd = 1e9;
        for (const r of mine) for (let i = 0; i + 1 < r.pts.length; i += 2) { const d = Math.hypot(r.pts[i][0] - x, r.pts[i][2] - z); if (d < bd) { bd = d; best = [r.pts[i], r.pts[i + 1], r.color]; } }
        const ry = best ? Math.atan2(-(best[1][2] - best[0][2]), best[1][0] - best[0][0]) : 0;
        sm.setMatrixAt(k, M4(x, (best && bd < 2 ? best[0][1] : W.heightAt(x, z)) - 0.06, z, 1, 1, 1, ry));
        sm.setColorAt(k, c.set(best ? best[2] : '#ff7a45'));
      });
      sm.castShadow = true; sm.computeBoundingSphere(); out.add(sm);
    }
    return out;
  }

  // ── 役所・県庁と旗 ──
  const flagMat = new THREE.ShaderMaterial({
    uniforms: { uOwner: U.uOwner, uTime: U.uTime },
    vertexShader: /* glsl */`
      uniform float uTime; attribute float aTer; varying float vTer; varying vec2 vUv; varying vec2 vP;
      void main() { vec3 p = position; float w = uv.x;
        p.z += sin(uTime * 4.0 + uv.x * 5.0) * 0.12 * w; p.y += sin(uTime * 3.0 + uv.x * 4.0) * 0.04 * w;
        vec4 wp = modelMatrix * vec4(p, 1.0); vTer = aTer; vUv = uv; vP = wp.xz; gl_Position = projectionMatrix * viewMatrix * wp; }`,
    fragmentShader: OWNER_GLSL + /* glsl */`
      varying float vTer; varying vec2 vUv; varying vec2 vP;
      void main() { vec3 c = ownerAt(int(vTer + 0.5), vP);
        float r = length((vUv - vec2(0.42, 0.5)) * vec2(1.6, 1.0));
        c = mix(c, vec3(1.0), smoothstep(0.27, 0.24, r) - smoothstep(0.17, 0.14, r));
        gl_FragColor = vec4(c, 1.0);
        #include <colorspace_fragment>
      }`,
    side: THREE.DoubleSide
  });
  const hallMat = toonMat(U, { flat: true });
  const hallGeo = merge([
    part(new THREE.BoxGeometry(1.4, 0.9, 1.0).translate(0, 0.45, 0), '#fff6e8'), part(new THREE.BoxGeometry(1.5, 0.1, 1.1).translate(0, 0.95, 0), '#ff8a65'),
    part(new THREE.BoxGeometry(0.5, 1.4, 0.5).translate(0, 0.7, 0), '#fff6e8'), part(new THREE.BoxGeometry(0.56, 0.08, 0.56).translate(0, 1.42, 0), '#ff8a65'),
    part(new THREE.CylinderGeometry(1.0, 1.1, 0.12, 20).translate(0, 0.0, 1.3), '#f1e6d6')
  ]);
  const capGeo = merge([
    part(new THREE.BoxGeometry(2.2, 0.6, 1.8).translate(0, 0.3, 0), '#f5efe6'), part(new THREE.BoxGeometry(1.2, 4.2, 1.2).translate(0, 2.1, 0), '#f7f7f2'),
    part(new THREE.BoxGeometry(1.3, 0.14, 1.3).translate(0, 4.25, 0), '#ffcf3f'), part(new THREE.BoxGeometry(0.9, 0.5, 0.9).translate(0, 4.55, 0), '#ffffff'),
    part(new THREE.CylinderGeometry(1.8, 2.0, 0.14, 24).translate(0, 0.0, 2.2), '#efe3cf')
  ]);
  const flagGeo = new THREE.PlaneGeometry(1.2, 0.75, 8, 2).translate(0.6, 0, 0);
  for (const g of [hallGeo, capGeo, pierGeo, towerGeo, stGeo]) g.userData.shared = true;   // タイルを捨てても消さない
  const poleMat = new THREE.MeshToonMaterial({ color: '#ffffff', gradientMap: RAMP });
  const seats = [];
  const capitalIds = new Set(Object.values(W.idx.prefs).filter(p => p.play).map(p => p.capital));
  function placeOnLand(id, lon, lat) {
    let x = W.lonX(lon), z = W.latZ(lat);
    if (W.sampleId(x, z) === id) return [x, z];
    for (let r = 0; r < 80; r++) {
      const a = r * 2.4, d = 0.3 + r * 0.3, xx = x + Math.cos(a) * d, zz = z + Math.sin(a) * d;
      if (W.sampleId(xx, zz) === id) return [xx, zz];
    }
    return null;
  }
  function buildSeat(m, parent) {
    const isCap = capitalIds.has(m.id);
    const src = isCap ? (W.idx.prefs[m.pref].office || m.seat) : m.seat;
    if (!src) return;
    const p = placeOnLand(m.id, src[0], src[1]);
    if (!p) return;
    const [x, z] = p, y = W.heightAt(x, z), s = isCap ? 1.0 : 0.85;
    const hall = new THREE.Mesh(isCap ? capGeo : hallGeo, hallMat);
    hall.position.set(x, y - 0.05, z); hall.scale.setScalar(s); hall.castShadow = true; hall.receiveShadow = true;
    const poleH = isCap ? 7.2 : 3.2, px = x + (isCap ? 1.3 : 0.95) * s, pz = z + 0.6 * s;
    const pole = new THREE.Mesh(new THREE.CylinderGeometry(0.05, 0.06, poleH, 6), poleMat);
    pole.position.set(px, y + poleH / 2, pz); pole.castShadow = true;
    const fg = flagGeo.clone();
    fg.setAttribute('aTer', new THREE.Float32BufferAttribute(new Array(fg.attributes.position.count).fill(m.id), 1));
    const flag = new THREE.Mesh(fg, flagMat);
    flag.position.set(px, y + poleH - 0.45, pz); flag.scale.setScalar(isCap ? 2.0 : 1.2);
    const g = new THREE.Group(); g.add(hall, pole, flag);
    parent.add(g);
    seats.push({ id: m.id, x, y, z, isCap, top: y + poleH + 0.3, obj: g });
  }

  // ── 名産の大きなオブジェ ──
  const meisan = [];
  function buildMeisan(m, parent) {
    const ms = MS.get(m.id);
    const st = seats.find(s => s.id === m.id);
    if (!ms || !st) return;
    let best = null, bs = -1e9;
    for (let k = 0; k < 140; k++) {
      const a = k * 2.399, d = 3 + (k % 14) * 0.45, x = st.x + Math.cos(a) * d, z = st.z + Math.sin(a) * d;
      if (W.sampleId(x, z) !== m.id) continue;
      const h0 = W.heightAt(x, z), flat = -Math.abs(W.heightAt(x + 1, z) - h0) - Math.abs(W.heightAt(x, z + 1) - h0), L = W.sampleLu(x, z);
      const sc = flat * 4 - d * 0.15 + (L === 1 || L === 2 || L === 8 ? 1 : 0) - (L === 3 ? 1 : 0);
      if (sc > bs) { bs = sc; best = [x, h0, z]; }
    }
    if (!best) return;
    const root = new THREE.Group();
    const bg = merge([part(new THREE.CylinderGeometry(2.6, 2.8, 0.3, 28).translate(0, 0.15, 0), null), part(new THREE.CylinderGeometry(2.25, 2.25, 0.32, 28).translate(0, 0.16, 0), '#fffaf0')]);
    bg.setAttribute('aTer', new THREE.Float32BufferAttribute(new Array(bg.attributes.position.count).fill(m.id), 1));
    const base = new THREE.Mesh(bg, toonMat(U, { owner: true, flat: true }));
    base.receiveShadow = true;
    const model = meisanShop(ms);
    model.position.y = 0.3;
    root.add(base, model);
    root.position.set(best[0], best[1] - 0.05, best[2]);
    root.rotation.y = 0.35;
    parent.add(root);
    shopAt.push({ id: m.id, x: best[0], z: best[2] });
    meisan.push({ id: m.id, root, model, kind: ms[0].cat, hop: -10 });
  }

  // タイルを足したとき・捨てたとき（境界・線路・駅・役所・名産をまとめて）
  const tileParts = new Map();
  const meshOfLonLat = (lon, lat) => `${Math.floor(lat * 1.5)}${Math.floor(lon) - 100}`;
  function addTile(t) {
    const g = new THREE.Group();
    g.add(buildBorders(t), buildRails(t));
    for (const m of W.munis.values()) {
      if (!m.play) continue;
      const isCap = capitalIds.has(m.id), src = isCap ? (W.idx.prefs[m.pref].office || m.seat) : m.seat;
      if (src && meshOfLonLat(src[0], src[1]) === t.mesh) { buildSeat(m, g); buildMeisan(m, g); }
    }
    group.add(g);
    tileParts.set(t.mesh, g);
  }
  function removeTile(mesh) {
    const g = tileParts.get(mesh);
    if (!g) return;
    group.remove(g);
    g.traverse(o => { if (o.geometry && !o.geometry.userData.shared) o.geometry.dispose(); });
    tileParts.delete(mesh);
    for (let i = seats.length - 1; i >= 0; i--) if (!seats[i].obj.parent || seats[i].obj.parent === g) seats.splice(i, 1);
    for (let i = meisan.length - 1; i >= 0; i--) if (meisan[i].root.parent === g) { const id = meisan[i].id; meisan.splice(i, 1); for (let j = shopAt.length - 1; j >= 0; j--) if (shopAt[j].id === id) shopAt.splice(j, 1); }
    for (let i = rails.length - 1; i >= 0; i--) if (rails[i].mesh === mesh) rails.splice(i, 1);
  }
  // 役所の位置（作っていなければ、データの座標と地面の高さから）
  function seatPos(id) {
    const s = seats.find(s => s.id === id);
    if (s) return s;
    const m = W.munis.get(id);
    if (!m) return null;
    const isCap = capitalIds.has(id), src = isCap ? (W.idx.prefs[m.pref].office || m.seat) : m.seat;
    if (!src) return null;
    const x = W.lonX(src[0]), z = W.latZ(src[1]), y = Math.max(0.2, W.heightAt(x, z));
    return { id, x, y, z, isCap, top: y + (isCap ? 7.5 : 3.5) };
  }
  function addSeats() { /* タイルごとに作る（addTile） */ }

  // ── 読みこんだ範囲の縁の雲（隣のタイルが無い辺だけ）──
  function addClouds() {
    const pts = [];
    for (const t of W.tiles.values()) {
      const tx = Math.floor(t.gx0 / W.TS), ty = Math.floor(t.gy0 / W.TS);
      const sides = [[0, -1], [1, 0], [0, 1], [-1, 0]];
      sides.forEach(([dx, dy], si) => {
        if (W.tiles.has(W.meshOf(tx + dx, ty + dy))) return;
        for (let k = 0; k < 18; k++) {
          const f = (k + 0.5) / 18, Wd = W.TS * W.CX, Hd = W.TS * W.CZ;
          const x = t.x0 + (si === 1 ? Wd : si === 3 ? 0 : f * Wd), z = t.z0 + (si === 2 ? Hd : si === 0 ? 0 : f * Hd);
          for (let j = 0; j < 3; j++) pts.push([x + (hash(k * 3 + j + si * 97 + tx * 7) - 0.5) * 40, hash(k * 7 + j + ty) * 4 + 1, z + (hash(k * 5 + j + si * 31 + ty * 3) - 0.5) * 40, 10 + hash(k * 11 + j + tx) * 16]);
        }
      });
    }
    const cm = new THREE.InstancedMesh(new THREE.IcosahedronGeometry(1, 1), new THREE.MeshToonMaterial({ color: '#ffffff', gradientMap: RAMP }), pts.length);
    pts.forEach((p, k) => cm.setMatrixAt(k, M4(p[0], p[1], p[2], p[3], p[3] * 0.5, p[3])));
    cm.computeBoundingSphere();
    group.add(cm);
  }

  function update(t, dist) {
    for (const m of meisan) {
      const k = t - m.hop;
      m.model.position.y = 0.3 + (k >= 0 && k < 0.9 ? Math.sin(k / 0.9 * Math.PI) * 0.9 : 0);   // 持ち主が変わったときだけ少し跳ねる
      m.model.traverse(c => {
        if (c.userData.noren !== undefined) c.rotation.x = Math.sin(t * 1.8 + c.userData.noren * 0.8 + m.id) * 0.12;
        else if (c.userData.cloth) c.rotation.y = Math.sin(t * 1.3 + m.id) * 0.12;
        else if (c.userData.steam !== undefined) { const f = (t * 0.35 + c.userData.steam / 3) % 1; c.position.y = 0.4 + f * 1.4; c.scale.setScalar(0.6 + f * 0.9); c.material.opacity = 0.8 * (1 - f); }
      });
    }
    borderMat.uniforms.uBW.value = Math.min(3.0, Math.max(0.2, dist * 0.0042));
    for (const g of tileParts.values()) for (const c of g.children[0]?.children || []) if (c.userData.nobori) c.visible = dist < 90;
  }
  function hop(id, t) { for (const m of meisan) if (m.id === id) m.hop = t; }

  const blocked = (x, z) => shopAt.some(s => (x - s.x) ** 2 + (z - s.z) ** 2 < 3.6 * 3.6);
  return { group, seats, meisan, rails, addTile, removeTile, seatPos, addSeats, addClouds, update, hop, blocked };
}
