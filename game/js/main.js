// 47国志 試作：全国（粗い層＋近くだけ細かいタイル）
import * as THREE from 'three';
import { loadWorld } from './world.js?v=20261026a';
import { createOwners } from './owners.js?v=20261026a';
import { createUniforms, createTileTerrain, createCoarseTerrain, setTileMask } from './terrain.js?v=20261026a';
import { createProps } from './props.js?v=20261026a';
import { createLandmarks, MEISAN } from './landmarks.js?v=20261026a';
import { createLife } from './life.js?v=20261026a';
import { createControls } from './controls.js?v=20261026a';
import { startGame } from './game.js?v=20261026a';
import { createCampaign } from './campaign.js?v=20261026a';
import { createAudio } from './audio.js?v=20261026a';
import { createFx } from './fx.js?v=20261026a';

const q = new URLSearchParams(location.search);
const DEV = q.get('dev') === '1';
const coarse = matchMedia('(pointer: coarse)').matches;
const LITE = q.get('lite') === '1' || (q.get('lite') !== '0' && coarse);
const opt = { lite: LITE, dev: DEV };
const T0 = performance.now(), lap = n => DEV && console.log('[k47]', n, Math.round(performance.now() - T0) + 'ms');
// ── 読み込みの演出：47の升が、進み具合に合わせて県の色で埋まる（2026-10-21）──
const LD = (() => {
  const box = document.getElementById('ldTiles'), msg = document.getElementById('ldMsg'), tiles = [];
  for (let k = 0; k < 47; k++) { const i = document.createElement('i'); i.style.setProperty('--k', k); i.style.setProperty('--c', `hsl(${(k * 137.5) % 360} 72% 62%)`); i.className = 'wait'; box?.appendChild(i); tiles.push(i); }
  let lit = 0;
  return {
    set(p, text) {   // p：0〜1
      const n = Math.round(Math.min(1, p) * 47);
      for (; lit < n; lit++) { tiles[lit].className = 'on'; }
      if (text && msg) msg.textContent = text;
    },
    tiles
  };
})();
LD.set(0.04, '地形を読みこんでいます…');

// iOS 26 の下のツールバーぶん持ち上げる（100% と 100svh の差）
(() => {
  const pr = document.createElement('div');
  pr.style.cssText = 'position:fixed;left:0;top:0;width:0;height:100svh;visibility:hidden;pointer-events:none';
  document.body.appendChild(pr);
  const f = () => document.documentElement.style.setProperty('--tb', Math.max(0, innerHeight - pr.getBoundingClientRect().height) + 'px');
  f(); addEventListener('resize', f);
})();

const canvas = document.getElementById('c');
const dpr = Math.min(devicePixelRatio || 1, LITE ? 1.6 : 2);
// 重いときは描画の解像度を自動で下げる（2026-10-21 本人要望）。段は dpr → 1.3 → 1.0（スマホは 0.85 まで）。軽くなれば20秒ようすを見て1段戻す。
//  下げた段は覚えておき、次に開いたときもそこから（発熱で落ちる前に軽く）
const Q_KEY = 'amix-47kokushi-japan-v1:quality';
const Q_STEPS = [...new Set([dpr, Math.min(dpr, 1.3), Math.min(dpr, 1.0), ...(LITE ? [Math.min(dpr, 0.85)] : [])])];
let qLv = 0;
try { qLv = Math.max(0, Math.min(Q_STEPS.length - 1, +(localStorage.getItem(Q_KEY) || 0))); } catch (e) { /* 保存できない環境 */ }
// 高精細の画面ではMSAAを切る（発熱対策・負荷の割に差が小さい）
const renderer = new THREE.WebGLRenderer({ canvas, antialias: dpr < 1.5, alpha: true, powerPreference: 'high-performance' });
renderer.setPixelRatio(Q_STEPS[qLv]);
renderer.shadowMap.enabled = true;
renderer.shadowMap.type = THREE.PCFShadowMap;
const scene = new THREE.Scene();
const camera = new THREE.PerspectiveCamera(32, 1, 1, 6000);
const hemi = new THREE.HemisphereLight('#dff3ff', '#ffe6c7', 1.25);
const sun = new THREE.DirectionalLight('#fff6e6', 2.3);
sun.castShadow = true;
sun.shadow.mapSize.set(LITE ? 1024 : 2048, LITE ? 1024 : 2048);
sun.shadow.bias = -0.0006; sun.shadow.normalBias = 0.04;
scene.add(hemi, sun, sun.target);

// ── データ ──
try { await document.fonts.load('900 40px "M PLUS Rounded 1c"'); } catch (e) { /* 字が読めなくても続ける */ }   // のぼりの文字を描く前に
LD.set(0.1, '1,754の市町村を読みこんでいます…');
const W = await loadWorld('data/');
LD.set(0.5, '県境に墨を引いています…');
await new Promise(r => setTimeout(r, 0));   // 升を描かせてから重い処理へ
const owners = createOwners(W);
const U = createUniforms(W, owners);
W.coarseFields(owners.ownerOf);
lap('coarse fields');
LD.set(0.66, '町並みを建てています…');
await new Promise(r => setTimeout(r, 0));
const coarseT = createCoarseTerrain(W, U);
scene.add(coarseT.group);
{
  // 遠くでも海と縞にならないよう、奥行きを書かずに一番先に描く
  const far = new THREE.Mesh(new THREE.PlaneGeometry(200000, 200000).rotateX(-Math.PI / 2), new THREE.MeshBasicMaterial({ color: new THREE.Color('#fff4e6'), depthWrite: false }));
  far.position.y = -1; far.renderOrder = -10;
  scene.add(far);
}
const C = W.coarse;
const bx0 = W.ccx(0), bx1 = W.ccx(C.w - 1), bz0 = W.ccz(0), bz1 = W.ccz(C.h - 1);
const marks = createLandmarks(W, U, owners);
scene.add(marks.group);
opt.blocked = (x, z) => marks.blocked(x, z);   // 名産の店のまわりに木や建物を置かない
const props = createProps(W, U, owners, opt);
scene.add(props.group);
const life = createLife(W, U, owners, marks, opt);
scene.add(life.group);
lap('scene');
LD.set(0.86, '人と電車を走らせています…');

// ── 細かいタイルの読みこみ・捨て（カメラの近くだけ）──
const available = new Set(W.idx.tiles);
const loaded = new Map();      // メッシュ → { t, terr }
const pending = new Set();
const tileMuni = new Map();
const tileCenter = mesh => { const lat0 = +mesh.slice(0, 2) / 1.5, lon0 = +mesh.slice(2, 4) + 100; return [W.lonX(lon0 + 0.5), W.latZ(lat0 + 1 / 3)]; };
let tilesChanged = false;
async function loadTileNow(mesh) {
  pending.add(mesh);
  try {
    const t = await W.loadTile(mesh);
    W.seaDistance(t); W.ownerDistance(t, owners.ownerOf);
    const set = new Set();
    for (let i = 0; i < W.TS * W.TS; i += 3) { const id = t.px[i * 4 + 2] | ((t.px[i * 4 + 1] >> 4) << 8); if (id) set.add(id); }
    tileMuni.set(mesh, set);
    const terr = createTileTerrain(W, t, U, new THREE.Vector4(0, 0, 0, 0));
    scene.add(terr.group);
    marks.addTile(t);
    loaded.set(mesh, { t, terr, fade: 0, target: 1 });
    tilesChanged = true;
  } finally { pending.delete(mesh); }
}
function unloadTileNow(mesh) {
  const L = loaded.get(mesh);
  if (!L) return;
  scene.remove(L.terr.group);
  L.terr.group.traverse(o => { if (o.geometry) o.geometry.dispose(); });
  L.terr.mat.dispose();
  marks.removeTile(mesh);
  W.unloadTile(mesh);
  loaded.delete(mesh);
  tileMuni.delete(mesh);
  tilesChanged = true;
}
let tileTimer = 0;
// 細かく描く高さ：寄ると近くだけ細かいタイル、引くと全部を粗い層に。境の高さで行ったり来たりしないよう、1,500で入り1,800で出る
//  （2026-10-21 本人指摘：前は1,800より引いても中心の700以内だけ細かいまま残り、まだらで段差が出ていた）
let detail = true;
const FADE = 0.4;   // 入れかえにかける秒
function manageTiles(dt, target, dist) {
  // 入れかわりを進める（細かいタイルは点を散らして溶けるように出入りする）
  let moved = false;
  for (const [m, L] of [...loaded]) {
    const f = THREE.MathUtils.clamp(L.fade + (L.target ? dt : -dt) / FADE, 0, 1);
    if (f !== L.fade) { L.fade = f; L.terr.mat.userData.fade.value = f; moved = true; }
    if (!L.target && f <= 0) unloadTileNow(m);
  }
  if (moved) setTileMask(U, W, [...loaded.values()]);
  tileTimer -= dt;
  if (tileTimer > 0) return;
  tileTimer = 0.25;
  if (detail && dist > 1800) detail = false; else if (!detail && dist < 1500) detail = true;
  const R = detail ? Math.max(650, dist * 1.4) : -1;
  const want = [...available].map(m => { const [x, z] = tileCenter(m); return { m, d: Math.hypot(x - target.x, z - target.z) }; }).filter(o => o.d < R).sort((a, b) => a.d - b.d);
  for (const o of want) if (!loaded.has(o.m) && !pending.has(o.m) && pending.size < 2) loadTileNow(o.m);
  for (const [m, L] of loaded) { const [x, z] = tileCenter(m); L.target = detail && Math.hypot(x - target.x, z - target.z) <= R + 700 ? 1 : 0; }
  if (tilesChanged && !pending.size) {
    tilesChanged = false;
    setTileMask(U, W, [...loaded.values()]);
    life.buildTrains(); life.buildShips();
  }
}

// 持ち主が変わったら、ふちどりを作り直す（粗い層は少しまとめて）
let coarseDirty = 0;
owners.onChange(id => {
  for (const [m, L] of loaded) if (tileMuni.get(m)?.has(id)) W.ownerDistance(L.t, owners.ownerOf);
  coarseDirty = 0.6;
});

// ── 季節（ゲームの月から。重みは春・夏・秋・冬）──
const seasonW = new THREE.Vector4(1, 0, 0, 0), seasonTo = seasonW.clone();
let treeSeason = -1;
function setSeason(w, main) {
  seasonTo.set(w[0], w[1], w[2], w[3]);
  if (main !== treeSeason) { treeSeason = main; setTimeout(() => props.setSeason(main), 350); }
}
setSeason([1, 0, 0, 0], 0);

// ── 地名（県名47＋見ている辺りの市町村。重なる所は大きい順に残す）──
const labelsEl = document.getElementById('labels');
const capitals = new Set(Object.values(W.idx.prefs).map(p => p.capital));
const prefLabels = [];
const origFaction = Object.fromEntries(owners.factions.map(f => [f.pref, f.id]));   // 県 → その県の勢力
for (const p of Object.values(W.idx.prefs)) {
  const src = p.label || p.office;
  if (!src) continue;
  const el = document.createElement('div');
  el.className = 'lb pref';
  el.textContent = p.name;
  el.addEventListener('click', () => ctx.onPref(p.code));   // 県名を押すと物見の札
  labelsEl.appendChild(el);
  prefLabels.push({ el, p, x: W.lonX(src[0]), z: W.latZ(src[1]), len: p.name.length, short: p.name.length > 2 ? p.name.replace(/[都府県]$/, '') : p.name, ruler: -2 });
}
// 所属未定地（どの市町村に属するか決まっていない埋立地など）は札を出さない。位置と人口が県のものになっていて、県庁のあたりに一番大きく出てしまう
const muniPts = [...W.munis.values()].filter(m => m.seat && !/所属未定地/.test(m.name)).map(m => {
  const cap = capitals.has(m.id), src = cap ? (W.idx.prefs[m.pref].office || m.seat) : m.seat;
  // 都道府県庁の呼び名（道庁・都庁・府庁・県庁）
  const office = cap ? (m.prefName.endsWith('道') ? '道庁' : m.prefName.slice(-1) + '庁') : '';
  return { id: m.id, name: m.name, pop: m.pop, cap, office, port: !!m.port, x: W.lonX(src[0]), z: W.latZ(src[1]), len: m.name.length };
}).sort((a, b) => b.pop - a.pop);
const pool = Array.from({ length: 150 }, () => { const el = document.createElement('div'); el.className = 'lb'; el.style.opacity = '0'; labelsEl.appendChild(el); return { el, id: -1 }; });
const ANCHOR = '<svg class="anc" viewBox="0 0 24 24" aria-label="港" role="img"><circle cx="12" cy="5" r="2.4" fill="none" stroke="currentColor" stroke-width="2.4"/><path d="M12 7.5V21M7 11h10M4.5 14c.5 4 3.6 7 7.5 7s7-3 7.5-7" fill="none" stroke="currentColor" stroke-width="2.4" stroke-linecap="round"/></svg>';
const V = new THREE.Vector3();
const placed = [];
// 画面の上の UI（上の欄・速報・左の札・下のボタン・開いている札）。地名はこの下に入れない
const isLight = hex => { const h = String(hex).replace('#', ''); const v = n => parseInt(h.slice(n, n + 2), 16); return h.length >= 6 && (0.299 * v(0) + 0.587 * v(2) + 0.114 * v(4)) / 255 > 0.66; };   // 淡い色の上は白い字が読みにくいので墨の字に
const UI_SEL = '.top-row > *, #res, #ticker, #sidetabs, #zoom, #nextBtn, #skipBtn, #panel, .sidepanel, #news > *';
let uiRects = [], uiTick = 0;
function updateLabels(dist) {
  const r = canvas.getBoundingClientRect();
  const mini = dist > 300;
  placed.length = 0;
  if (uiTick-- <= 0) {   // 毎フレーム測ると重いので、ときどき測り直す
    uiTick = 15;
    uiRects = [];
    for (const e of document.querySelectorAll(UI_SEL)) {
      if (e.hidden || e.closest('[hidden]')) continue;
      const b = e.getBoundingClientRect();
      if (b.width && b.height) uiRects.push([b.left - r.left - 4, b.top - r.top - 4, b.right - r.left + 4, b.bottom - r.top + 4]);
    }
  }
  placed.push(...uiRects);
  const fits = (x, y, w, h) => { const b = [x - w / 2, y - h, x + w / 2, y]; if (placed.some(q => b[0] < q[2] && b[2] > q[0] && b[1] < q[3] && b[3] > q[1])) return false; placed.push(b); return true; };
  // 県名（遠くで）
  for (const L of prefLabels) {
    let on = dist > 900;
    if (on) {
      V.set(L.x, Math.max(0.3, W.heightAt(L.x, L.z)) + 6, L.z).project(camera);
      on = V.z < 1 && Math.abs(V.x) < 1.05 && Math.abs(V.y) < 1.05;
      const x = (V.x + 1) / 2 * r.width, y = (1 - V.y) / 2 * r.height;
      // 県庁をほかの勢力が持っていたら、県名の下に小さく「〇〇勢」
      const capOwner = owners.owner[L.p.capital];
      const orig = origFaction[L.p.code];
      const ruler = capOwner >= 0 && capOwner !== orig ? capOwner : -1;
      // もとの勢力がまだ残って抵抗していれば、札はもとの色のまま「〇〇勢 占領下」（点は占領した勢力の色）。降伏・臣従・滅亡のあとは新しい持ち主の色と勢力名
      const resisting = ruler >= 0 && !!game?.state?.factions[orig]?.alive;
      const vassal = ruler >= 0 && !resisting && game?.state?.factions[orig]?.vassalOf === ruler;   // 臣従した県
      const key = ruler * 3 + (resisting ? 1 : vassal ? 2 : 0);
      const co0 = game?.state?.coalition, houi = !!co0 && co0.target === game?.state?.player && co0.members.includes(capOwner);
      // 引いたときは札を小さく短く（「福井」「京都」）。重なったら消さずに、上下左右へずらして置く（2026-10-21 本人指摘：引くと県名が間引かれがち）
      const compact = dist > 4500, nm = compact ? L.short : L.p.name;
      const w = (compact ? 12 : 16) * (nm.length + 1) + (compact ? 12 : 20), h = (compact ? (ruler >= 0 ? 32 : 20) : (ruler >= 0 ? 42 : 28)) + (houi ? 22 : 0);
      let ox = 0, oy = 0;
      if (on) {
        on = false;
        for (const [dx, dy] of [[0, 0], [0, -(h + 4)], [0, h + 4], [w * 0.6, 0], [-w * 0.6, 0], [w * 0.5, -(h + 4)], [-w * 0.5, -(h + 4)], [w * 0.5, h + 4], [-w * 0.5, h + 4]]) {
          if (fits(x + dx, y + dy + (houi ? 22 : 0), w, h)) { on = true; ox = dx; oy = dy; break; }   // 包囲網の札の分も場所をとる
        }
      }
      if (on) {
        if (L.ruler !== key + (compact ? 0.5 : 0)) {
          L.ruler = key + (compact ? 0.5 : 0);
          L.el.classList.toggle('compact', compact);
          L.el.classList.toggle('ruled', ruler >= 0);
          if (ruler >= 0) {
            L.el.textContent = ''; const a = document.createElement('span'), b = document.createElement('small'); a.textContent = nm; b.textContent = owners.factions[ruler].name + '勢' + (resisting ? ' 占領下' : vassal ? '（臣従）' : '');
            if (resisting) { b.className = 'occ'; b.style.setProperty('--oc', owners.factions[ruler].color); }
            L.el.append(a, b);
          }
          else L.el.textContent = nm;
        }
        L.el.style.transform = `translate(${x + ox}px, ${y + oy}px) translate(-50%, -100%)`;
        const bg = resisting ? owners.factions[orig].color : capOwner >= 0 ? owners.factions[capOwner].color : '#bbbbbb';
        if (L.bg !== bg) { L.bg = bg; L.el.style.background = bg; L.el.classList.toggle('light', isLight(bg)); }
        L.el.classList.toggle('houi', houi);   // 自分を囲む包囲網のなかま
      }
    }
    L.el.style.opacity = on ? '1' : '0';
    L.el.style.pointerEvents = on ? 'auto' : 'none';
  }
  // 市町村（見ている辺りだけ・人口の多い順）
  let k = 0;
  if (dist < 4200) {
    const rad = dist * 1.3 + 40;
    for (const m of muniPts) {
      if (k >= pool.length) break;
      if (Math.abs(m.x - ctl.st.target.x) > rad || Math.abs(m.z - ctl.st.target.z) > rad) continue;
      // 自分の港には錨のマーク（2026-10-20 本人要望。港は652か所あるので、全部に出すと海岸がマークだらけになる。自分の領地の港だけ、寄ったときだけ）
      const myPort = m.port && !mini && game?.state && !game.state.over && owners.owner[m.id] === game.state.player;
      if (!mini && !m.cap && dist > 150 && !/市$/.test(m.name) && !myPort) continue;
      V.set(m.x, Math.max(0.3, W.heightAt(m.x, m.z)) + (mini ? 1.5 : m.cap ? 8 : 4), m.z).project(camera);
      if (V.z >= 1 || Math.abs(V.x) > 1.05 || Math.abs(V.y) > 1.05) continue;
      const x = (V.x + 1) / 2 * r.width, y = (1 - V.y) / 2 * r.height;
      if (!fits(x, y, (mini ? 11 : 13) * (m.len + 1) + 16 + (myPort ? 16 : 0), mini ? 14 : 24)) continue;
      const P = pool[k++], c = owners.color(m.id), key = m.id * 2 + (myPort ? 1 : 0);
      if (P.id !== key) { P.id = key; P.el.innerHTML = (m.cap ? `<span class="k">${m.office}</span>` : '') + (myPort ? ANCHOR : '') + m.name; P.el.className = 'lb' + (m.cap ? ' cap' : ''); }
      P.el.classList.toggle('mini', mini);
      if (P.bg !== c) { P.bg = c; P.el.style.background = c; P.el.style.setProperty('--dot', c); P.el.classList.toggle('light', isLight(c)); }
      P.el.style.transform = `translate(${x}px, ${y}px) translate(-50%, -100%)`;
      P.el.style.opacity = '1';
    }
  }
  for (; k < pool.length; k++) { pool[k].el.style.opacity = '0'; }
}

// ── タップで市町村を選ぶ ──
const ray = new THREE.Raycaster(), ndc = new THREE.Vector2();
function onTap(cx, cy) {
  const r = canvas.getBoundingClientRect();
  ndc.set((cx - r.left) / r.width * 2 - 1, -((cy - r.top) / r.height) * 2 + 1);
  ray.setFromCamera(ndc, camera);
  const hit = W.raycast(ray.ray);
  const id = hit ? W.sampleId(hit.x, hit.z) : 0;
  ctx.onTap(id && W.munis.get(id)?.play ? id : 0);
}
const ctl = createControls(canvas, camera, W, onTap, { x0: bx0, x1: bx1, z0: bz0, z1: bz1 });

// 距離のボタン
const home = { x: W.lonX(136.8), z: W.latZ(36.6) };
const ZOOM = { far: 21000, mid: 140, near: 26 };
document.getElementById('zoom').addEventListener('click', e => {
  const b = e.target.closest('button');
  if (!b) return;
  const z = b.dataset.z;
  if (z === 'far') ctl.flyTo(home.x, home.z, ZOOM.far);
  else if (z === 'near') { const s = U.uSel.value > 0 ? marks.seatPos(U.uSel.value) : null; ctl.flyTo(s ? s.x : null, s ? s.z + 1 : null, ZOOM[z]); }
  else ctl.flyTo(null, null, ZOOM[z]);
});
document.querySelector('#zoom [data-z="far"]').textContent = '全国';
function syncZoomButtons(d) {
  const cur = d > 3000 ? 'far' : d > 50 ? 'mid' : 'near';
  for (const b of document.querySelectorAll('#zoom button')) b.setAttribute('aria-pressed', String(b.dataset.z === cur));
}

// はじまり：日本全体を見せて、県選びへ
ctl.st.target.set(home.x, 0, home.z); ctl.st.dist = 21000;
const campaign = createCampaign({ W, scene, owners, marks, life, U, camera, ctl });
const fx = createFx({ scene, camera, ctl, marks, owners });
const audio = createAudio();   // 鳴らし始めるのは開始の操作から（GAME_AUDIO_RULES.md）
const ctx = { W, owners, marks, life, ctl, scene, camera, U, setSeason, campaign, fx, audio, lite: LITE, onTap: () => {}, onPref: () => {} };
const game = startGame(ctx);

function resize() {
  renderer.setSize(innerWidth, innerHeight, false);
  camera.aspect = innerWidth / innerHeight;
  camera.fov = innerWidth < innerHeight ? 40 : 32;
  camera.updateProjectionMatrix();
}
addEventListener('resize', resize);
resize();

// ── 描画 ──
const devEl = document.getElementById('dev');
devEl.hidden = !DEV;
let lastT = performance.now(), acc = 0, frames = 0, fpsT = 0;
let FRAME = LITE ? 1 / 30 : 0;   // スマホは 30fps まで
// 長く遊ぶときの発熱対策：スマホで20秒さわらず、カメラも月送りも止まっていたら15コマに落とす（さわればすぐ30に戻す 2026-10-21）
let idleT = performance.now();
for (const ev of ['pointerdown', 'pointermove', 'wheel', 'keydown']) addEventListener(ev, () => { idleT = performance.now(); }, { passive: true });
// 速報の帯の下端を測って、左の札をその下に置く（スマホ）
{
  const tk = document.getElementById('ticker');
  const put = () => { const r = tk && !tk.hidden ? tk.getBoundingClientRect() : null; document.documentElement.style.setProperty('--tick-b', (r && r.height ? r.bottom : 200) + 'px'); };
  put(); addEventListener('resize', put);
  if (tk && window.ResizeObserver) new ResizeObserver(put).observe(tk);
  if (tk) new MutationObserver(put).observe(tk, { attributes: true, attributeFilter: ['hidden'] });
}
function frame(now) {
  const dt = Math.min(0.1, (now - lastT) / 1000);
  acc += dt; lastT = now;
  const idle = LITE && now - idleT > 20000 && !ctl.busy() && !game.busy;   // 月送り・カットインの間は落とさない
  const fr = idle ? 1 / 15 : FRAME;
  if (fr && acc < fr - 0.002 && !ctl.busy()) return;
  const step = acc; acc = 0;
  U.uTime.value += step;
  const t = U.uTime.value;
  seasonW.lerp(seasonTo, 1 - Math.exp(-step * 3));
  U.uSeason.value.copy(seasonW);
  ctl.update(step);
  const d = ctl.st.dist, tg = ctl.st.target;
  U.uTint.value = THREE.MathUtils.smoothstep(d, 90, 700) * 0.85;
  U.uCamD.value = d; U.uStripe.value = Math.max(1.2, d * 0.007);   // 自勢の帯：画面で同じくらいの間隔に
  coarseT.update(camera.position);
  for (const L of loaded.values()) L.terr.update(camera.position);
  manageTiles(step, tg, d);
  if (coarseDirty > 0) { coarseDirty -= step; if (coarseDirty <= 0) W.coarseFields(owners.ownerOf); }
  props.update(camera.position, tg, d);
  marks.update(t, d);
  life.update(t, step, tg, d);
  campaign.update(step);
  fx.update(step);
  game.frame(d);
  const sr = Math.min(120, Math.max(14, d * 0.75));
  Object.assign(sun.shadow.camera, { left: -sr, right: sr, top: sr, bottom: -sr, near: 1, far: 400 });
  sun.shadow.camera.updateProjectionMatrix();
  sun.target.position.copy(tg);
  sun.position.set(tg.x - 70, tg.y + 140, tg.z + 90);
  sun.castShadow = d < 260;
  renderer.render(scene, camera);
  watchSpeed(now);
  updateLabels(d);
  syncZoomButtons(d);
  frames++; fpsT += step;
  if (fpsT > 0.5) {
    const fps = frames / fpsT; frames = 0; fpsT = 0;
    if (DEV) { const i = renderer.info.render, s = life.stats(), ps = props.stats();
      devEl.textContent = `${fps.toFixed(0)} fps  解像度×${Q_STEPS[qLv]}  dist ${d.toFixed(0)}  tiles ${loaded.size}\ncalls ${i.calls}  tris ${(i.triangles / 1000).toFixed(0)}k\n人 ${s.people}  車 ${s.cars}  電車 ${s.trains}  船 ${s.ships}\n小物かたまり ${ps.chunks}  lite ${LITE}\nmem geo ${renderer.info.memory.geometries}`; }
  }
}
// 描けた回数を4秒ごとに数え、ねらい（スマホ30・PC60）の75%を2回続けて下回ったら1段下げる。90%以上が20秒続いたら1段戻す
const Q_AIM = LITE ? 30 : 60, qSince = performance.now();
let qT0 = 0, qN = 0, qSlow = 0, qFast = 0;
function watchSpeed(now) {
  if (now - qSince < 6000) return;                 // 読みこみ直後は数えない
  if (!qT0) { qT0 = now; qN = 0; return; }
  qN++;
  if (now - qT0 < 4000) return;
  const fps = qN * 1000 / (now - qT0); qT0 = now; qN = 0;
  qSlow = fps < Q_AIM * 0.75 ? qSlow + 1 : 0;
  qFast = fps > Q_AIM * 0.9 && qLv > 0 ? qFast + 1 : 0;
  let to = qLv;
  if (qSlow >= 2 && qLv < Q_STEPS.length - 1) to = qLv + 1;
  else if (qFast >= 5) to = qLv - 1;
  if (to === qLv) return;
  qLv = to; qSlow = qFast = 0;
  renderer.setPixelRatio(Q_STEPS[qLv]);
  try { localStorage.setItem(Q_KEY, String(qLv)); } catch (e) { /* 保存できない環境 */ }
}
renderer.setAnimationLoop(frame);
document.addEventListener('visibilitychange', () => { qT0 = 0; renderer.setAnimationLoop(document.hidden ? null : frame); });
lap('ready');
// ── はじめの画面：読みこめたら「タップしてはじめる」。この押下で音を始め、タイトルの曲を流す（GAME_AUDIO_RULES 2.1：開いただけでは鳴らさない・
//  開始前に音の ON/OFF が分かり切りかえられる）。自動の検証（navigator.webdriver）と ?gate=0 では出さない
{
  const ld = document.getElementById('loading'), gate = document.getElementById('ldGate'), start = document.getElementById('ldStart'), snd = document.getElementById('ldSound');
  LD.set(1, '日本ができました');
  const skip = q.get('gate') === '0' || (navigator.webdriver && q.get('gate') !== '1');
  const syncS = () => { snd.textContent = audio.on ? 'SOUND ON' : 'SOUND OFF'; snd.setAttribute('aria-pressed', String(audio.on)); start.textContent = audio.on ? 'タップしてはじめる' : 'タップしてはじめる（音なし）'; };
  const go = (x, y) => {
    if (ld.classList.contains('go')) return;
    if (audio.on) { audio.init(); audio.bgm('title'); audio.se('decide'); }
    ld.style.setProperty('--gx', x + 'px'); ld.style.setProperty('--gy', y + 'px');
    ld.classList.add('go');
    setTimeout(() => { ld.classList.add('done'); ld.hidden = true; }, 720);
  };
  if (skip) ld.classList.add('done');
  else {
    syncS(); gate.hidden = false; ld.classList.add('ready');
    snd.addEventListener('click', e => { e.stopPropagation(); audio.setOn(!audio.on); syncS(); });   // 切りかえるだけ（鳴らし始めるのは「はじめる」）
    ld.addEventListener('click', e => go(e.clientX || innerWidth / 2, e.clientY || innerHeight * 0.6));
    addEventListener('keydown', function k(e) { if (ld.classList.contains('go')) { removeEventListener('keydown', k); return; } if (e.key === 'Enter' || e.key === ' ') { e.preventDefault(); const r = start.getBoundingClientRect(); go(r.left + r.width / 2, r.top + r.height / 2); } });
  }
}
// ── タップの演出：はじめの画面とタイトルで、押した所に墨の輪と県の色の粒 ──
addEventListener('pointerdown', e => {
  if (!e.isPrimary) return;
  const onTitle = !document.getElementById('title').hidden && e.target.closest('#title');
  const onGate = !document.getElementById('loading').hidden && e.target.closest('#loading') && document.getElementById('loading').classList.contains('ready');
  if (!onTitle && !onGate) return;
  const el = document.createElement('div');
  el.className = 'tap-ink'; el.style.transform = `translate(${e.clientX}px, ${e.clientY}px)`;
  for (let k = 0; k < 6; k++) { const a = k / 6 * Math.PI * 2 + Math.random() * 0.5, r = 34 + Math.random() * 16, d = document.createElement('i'); d.style.setProperty('--dx', Math.cos(a) * r + 'px'); d.style.setProperty('--dy', Math.sin(a) * r + 'px'); d.style.setProperty('--c', `hsl(${Math.random() * 360} 75% 60%)`); el.appendChild(d); }
  document.body.appendChild(el);
  setTimeout(() => el.remove(), 650);
}, { passive: true });
window.__k47 = { W, owners, ctl, game, renderer, scene, camera, life, props, marks, fx, audio, tap: id => ctx.onTap(id) };
