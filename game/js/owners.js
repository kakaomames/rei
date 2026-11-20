// 勢力と市町村の持ち主。色は「市町村番号 × 1px」のテクスチャで引く（全国 4095 まで）
// 塗り替えはその1px と演出用の行を書き換えるだけ
//  0行目：いまの色  1行目：前の色  2行目：塗り替えの開始時刻・起点x・起点z・速さ  3行目：勢力番号・遊ぶ県か・民心・県コード
import * as THREE from 'three';

// 勢力は県ごと。色は、隣り合う都道府県どうしがいちばん離れた色になるよう、パレットから順に選ぶ（隣接はデータから）
const PALETTE = ['#e6194b', '#3cb44b', '#ffb000', '#4363d8', '#f58231', '#911eb4', '#2ec4c6', '#f032e6', '#9bd318', '#ff8fa3', '#008080', '#c39bff',
  '#9a6324', '#7fd4ff', '#ffa69e', '#55e0a0', '#808000', '#ffd8b1', '#80ed99', '#ff5a5f', '#1d9bf0', '#ffe119', '#6a4c93', '#00a676',
  '#d4a017', '#b5179e', '#3a86ff', '#fb5607', '#8ac926', '#ff006e', '#06d6a0', '#118ab2', '#ef476f', '#7b2cbf', '#43aa8b', '#f8961e',
  '#577590', '#f94144', '#90be6d', '#c77dff', '#277da1', '#ff7b00', '#2b9348', '#9d4edd', '#e76f51', '#4cc9f0', '#bc6c25', '#d00000'];
const PREF_COLOR = {};
function assignColors(idx) {
  const prefOf = new Map(idx.munis.map(m => [m.id, m.pref]));
  const nb = {};
  const link = (a, b) => { if (a === b) return; (nb[a] ||= new Set()).add(b); (nb[b] ||= new Set()).add(a); };
  for (const [x, y] of idx.adjacency) link(prefOf.get(x), prefOf.get(y));
  for (const [x, y, , tier] of idx.seaLinks || []) if (!tier) link(prefOf.get(x), prefOf.get(y));
  const lab = hex => { const c = new THREE.Color(hex); const r = c.r, g = c.g, b = c.b; return [0.2126 * r + 0.7152 * g + 0.0722 * b, r - g, (r + g) / 2 - b]; };
  const dist = (a, b) => { const p = lab(a), q = lab(b); return Math.hypot((p[0] - q[0]) * 1.6, p[1] - q[1], p[2] - q[2]); };
  const codes = Object.keys(idx.prefs).sort((a, b) => (nb[b]?.size || 0) - (nb[a]?.size || 0));
  const used = new Set();
  for (const pc of codes) {
    let best = null, bs = -1;
    for (const c of PALETTE) {
      if (used.has(c)) continue;
      const near = [...(nb[pc] || [])].map(n => PREF_COLOR[n]).filter(Boolean);
      const sc = near.length ? Math.min(...near.map(x => dist(c, x))) : 1;
      if (sc > bs) { bs = sc; best = c; }
    }
    PREF_COLOR[pc] = best || '#888888';
    used.add(best);
  }
}
export const prefColor = code => PREF_COLOR[code] || '#888888';
const SIZE = 4096;

export function createOwners(W) {
  assignColors(W.idx);
  const data = new Float32Array(SIZE * 4 * 4);
  const tex = new THREE.DataTexture(data, SIZE, 4, THREE.RGBAFormat, THREE.FloatType);
  tex.magFilter = tex.minFilter = THREE.NearestFilter;
  const factions = [];
  for (const p of Object.values(W.idx.prefs)) if (p.play) factions.push({ id: factions.length, pref: p.code, name: p.name.replace(/[都府県]$/, ''), color: PREF_COLOR[p.code] || '#888888', capital: p.capital });
  const byPref = Object.fromEntries(factions.map(f => [f.pref, f.id]));
  const owner = new Int16Array(SIZE).fill(-1);
  const morale = new Float32Array(SIZE).fill(0.7);
  const col = new THREE.Color();
  const set = (row, id, r, g, b, a) => { const o = (row * SIZE + id) * 4; data[o] = r; data[o + 1] = g; data[o + 2] = b; data[o + 3] = a; };

  for (const m of W.munis.values()) {
    const f = m.play ? byPref[m.pref] : -1;
    owner[m.id] = f;
    col.set(f >= 0 ? factions[f].color : '#bbbbbb');
    set(0, m.id, col.r, col.g, col.b, 1);
    set(1, m.id, col.r, col.g, col.b, 1);
    set(2, m.id, -1e4, 0, 0, 1);
    set(3, m.id, f, m.play ? 1 : 0, morale[m.id], +m.pref);
  }
  tex.needsUpdate = true;
  const listeners = [];

  return {
    tex, owner, morale, factions,
    // 持ち主を変える。起点（世界座標）から円く塗り広がる
    capture(id, f, now, x, z) {
      if (owner[id] === f) return false;
      const o0 = id * 4, o1 = (SIZE + id) * 4;
      data[o1] = data[o0]; data[o1 + 1] = data[o0 + 1]; data[o1 + 2] = data[o0 + 2];
      col.set(factions[f].color);
      set(0, id, col.r, col.g, col.b, 1);
      set(2, id, now, x, z, 22);
      data[(3 * SIZE + id) * 4] = f;
      owner[id] = f;
      tex.needsUpdate = true;
      for (const fn of listeners) fn(id, f);
      return true;
    },
    // 演出なしで持ち主をそろえる（セーブの読みこみ・はじめ）。ふちどりの作り直しは呼ぶ側でまとめて
    setNow(id, f) {
      owner[id] = f;
      col.set(f >= 0 ? factions[f].color : '#bbbbbb');
      set(0, id, col.r, col.g, col.b, 1); set(1, id, col.r, col.g, col.b, 1); set(2, id, -1e4, 0, 0, 1);
      data[(3 * SIZE + id) * 4] = f;
      tex.needsUpdate = true;
    },
    onChange(fn) { listeners.push(fn); },
    setMorale(id, v) { morale[id] = v; data[(3 * SIZE + id) * 4 + 2] = v; tex.needsUpdate = true; },
    color(id) { return owner[id] >= 0 ? factions[owner[id]].color : '#bbbbbb'; },
    ownerOf: id => owner[id]
  };
}
