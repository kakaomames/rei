// 47国志のルール（画面に依存しない。ブラウザでも Node でも動く）
// 1ターン＝1か月。プレイヤーは行動力のぶんだけコマンドを出し、「月を進める」で CPU の手番・合戦・収入をまとめて解く
// 状態はすべて JSON にできる（セーブ・書き出し・不具合の再現に使う）
//
// 数値の単位（目安）：予算＝億円  兵糧＝俵（千）  装備＝点  兵＝人
// 元にしたデータ：人口（Wikidata）・土地利用の升目数（田・畑・建物用地・海浜）・平均標高・隣接・海路（港どうし32km以内）
// ※工業の重みは仮（統計に置きかえる）

export const SAVE_VERSION = 6;
const INDUSTRY = {
  '37203': 1.0, '37202': 0.6, '37404': 0.6, '37201': 0.35, '37205': 0.35,
  '38205': 1.0, '38202': 0.6, '38206': 0.7, '38214': 0.8, '38201': 0.4,
  '36204': 0.7, '36201': 0.4, '36202': 0.3, '39201': 0.3, '39206': 0.35
};
export const COMMANDS = {
  kaikon: { name: '開墾', desc: '田畑を広げる。秋の兵糧が増える', cost: { gold: 15 } },
  shokusan: { name: '殖産', desc: '工場を育てる。毎月の装備が増える', cost: { gold: 25 } },
  shogyo: { name: '商業', desc: '町をにぎわせる。毎月の予算が増える', cost: { gold: 15 } },
  hodokoshi: { name: '祭り', desc: '兵糧をふるまって祭りを開く。民心が上がる', cost: { food: 20 } },
  chikujo: { name: '築城', desc: '守りを固める', cost: { gold: 30, arms: 5 } },
  chohei: { name: '徴兵', desc: '兵を集める。民心が少し下がる', cost: {} },
  bohei: { name: '募兵', desc: '予算と兵糧で兵を雇う。民心は下がらない。町の人口に関係なく集まる', cost: { gold: 50, food: 60 } },
  ido: { name: '移動', desc: '隣の自領へ兵を動かす', cost: {} },
  shuketsu: { name: '集結', desc: '本拠とつながる奥の町（敵と接していない町）から、兵の6割をこの町へまとめて集める。兵1,500人につき予算1', cost: {} },
  shutsujin: { name: '出陣', desc: '隣の敵地へ攻めこむ', cost: {} },
  zosen: { name: '造船', desc: '港で船を造る。渡海に使う', cost: { gold: 35, arms: 10 } },
  tokai: { name: '渡海', desc: '船で海の向こうへ攻めこむ', cost: {} },
  toyo: { name: '登用', desc: 'この土地の人材を探す（浪人がいれば先に見つかる）', cost: { gold: 20 } },
  scout: { name: '引き抜き', desc: 'ほかの勢力の人材や浪人を味方に誘う', cost: {} }
};
const MAXLV = { agri: 5, ind: 5, com: 5, fort: 3 };

// 外交のコマンド（相手の勢力に向ける）
export const DIPLO = {
  domei: { name: '同盟', desc: '12か月、たがいに攻めない', cost: { gold: 20 }, months: 12 },
  teisen: { name: '停戦', desc: '6か月、たがいに攻めない', cost: { gold: 10 }, months: 6 },
  koeki: { name: '交易', desc: '12か月、相手の名産の数だけ毎月の予算が増える', cost: {}, months: 12 },
  okurimono: { name: '贈り物', desc: '予算30を贈って仲よくする', cost: { gold: 30 } },
  tegire: { name: '手切れ', desc: '同盟・停戦をやめる。ほかの県からの信用も落ちる', cost: {} },
  shinju: { name: '臣従', desc: 'その勢力がこちらに下る。領地も兵も人材もすべて加わる', cost: {}, months: 0 },
  houi: { name: '包囲網', desc: 'いちばん強い勢力を囲む勢力どうしで、攻め合わない約束。囲む相手が弱まるまで続く', cost: {}, months: 0 }
};

// 名産（※手作業の仮リスト。根拠は公開前に統計で確認して docs に記録する）。set がそろうとブランド
// ── 名産：特許庁「地域団体商標」に登録されたものだけ（data/munis.json の meisan・tools/build-meisan.mjs）──
//  ブランド：同じ種類の名産のある市町村をいくつ持つかで、Lv1（3）・Lv2（6）・Lv3（10）
export const MEISAN = {};   // 互換のため残す（名産は B.meisan から）
export const BRANDS = {
  men: { name: '麺どころ', effect: '予算 +4%', color: '#e8b04a' },
  kome: { name: '米どころ', effect: '秋の兵糧 +6%', color: '#d8c38a' },
  umi: { name: '海の幸', effect: '毎月の予算 +3', color: '#3f8fd2' },
  kajitsu: { name: '果物の国', effect: '秋の兵糧 +4%・民心が上がりやすい', color: '#f08a3c' },
  yasai: { name: '畑の恵み', effect: '兵糧の減り −5%', color: '#6bb35a' },
  niku: { name: '肉の国', effect: '士気のふだんの値 +3', color: '#c0504d' },
  sake: { name: '酒と茶', effect: '外交が通りやすい +5', color: '#7a5aa6' },
  craft: { name: '職人の技', effect: '毎月の装備 +10%', color: '#4a5a78' },
  aji: { name: '味の名品', effect: '毎月の予算 +2・民心が上がりやすい', color: '#d4697a' },
  yu: { name: '温泉と名所', effect: '知事選の支持 +1.5%', color: '#2fa39a' }
};
export const BRAND_STEPS = [3, 6, 10];
// 難易度（2026-10-20 本人要望）：ノーマルがこれまでの調整。効くのは遊ぶ人の勢力だけ（CPU どうしの戦いは変えない）
//  inc：自分の収入（予算・兵糧・装備・収穫）の倍率／atk：CPU が自分の町を攻めるのに要る有利さの倍率／coal：自分が包囲網に狙われる強さ（2位の何倍か）／poll：知事選の支持に足す
export const LEVELS = {
  easy: { name: 'イージー', note: '収入+25%。CPU はよほど有利でないと攻めてこず、包囲網も組まれにくい。知事選の支持+5%', inc: 1.25, atk: 1.3, coal: 1.9, poll: 0.05 },
  normal: { name: 'ノーマル', note: '標準の手ごたえ。県選びの★はノーマルでのむずかしさ', inc: 1, atk: 1, coal: 1.6, poll: 0 },
  hard: { name: 'ハード', note: '収入−10%。CPU は少しの有利でも攻めてきて、包囲網も早めに組まれる。知事選の支持−3%', inc: 0.9, atk: 0.85, coal: 1.4, poll: -0.03 }
};
export const levelOf = st => LEVELS[st && st.level] || LEVELS.normal;
export const ELECTION_EVERY = 48;
// 土地の特徴（都道府県）。水軍の国と米どころはデータから、雪国は県で決める
export const TRAITS_PREF = {
  suigun: { name: '水軍の国', desc: 'はじめから船があり、造船が3割安く、渡海が1割強い' },
  yuki: { name: '雪国', desc: '冬はこの土地の守りが3割強い（攻めにくい）' },
  kome: { name: '米どころ', desc: '秋の収穫が1割多い' }
};
const SNOW = ['01', '02', '03', '05', '06', '15', '16', '17', '18', '20'];
// ── CPU の気質（ゲームごとに決まる・だれにでも見える）──
//  atk：攻める見込みの下限（ふつう1.25） diplo：外交をもちかける割合 draft：力をためる割合
export const KISHITSU = {
  kosen: { name: '好戦的', desc: '少しでも勝てそうなら攻めてくる。停戦に応じにくい', atk: 1.1, diplo: 0.1, draft: 0.65 },
  shincho: { name: '慎重', desc: 'はっきり勝てるときしか攻めない。守りを固め、停戦に応じやすい', atk: 1.55, diplo: 0.2, draft: 0.4 },
  shonin: { name: '商人気質', desc: '戦より商い。交易をよくもちかけ、応じやすい', atk: 1.4, diplo: 0.32, draft: 0.35 },
  giri: { name: '義理堅い', desc: '約束を守り、同盟相手を攻めた勢力に加勢して攻める', atk: 1.25, diplo: 0.2, draft: 0.5 },
  yashin: { name: '野心家', desc: '弱った相手や混乱した勢力を狙い、得になれば約束を破る', atk: 1.2, diplo: 0.15, draft: 0.55 }
};
const KISHITSU0 = { atk: 1.25, diplo: 0.18, draft: 0.5 };
const kOf = f => (f && f.ai && KISHITSU[f.kishitsu]) || KISHITSU0;
// 県の特徴で少し寄せて、ゲームごとの乱数で決める（大きな町は商人、雪国は慎重、水軍は好戦的に寄りやすい）
function pickKishitsu(f, popOfPref, r) {
  const w = { kosen: 1, shincho: 1, shonin: 1, giri: 1, yashin: 1 };
  if ((f.traits || []).includes('suigun')) w.kosen += 1.2;
  if ((f.traits || []).includes('yuki')) w.shincho += 1.2;
  if ((f.traits || []).includes('kome')) w.giri += 0.8;
  if (popOfPref > 4e6) w.shonin += 1.5;
  let t = Object.values(w).reduce((a, b) => a + b, 0) * r();
  for (const [k, v] of Object.entries(w)) { t -= v; if (t <= 0) return k; }
  return 'giri';
}
// 県ごとの特徴とはじめの船（港・大港・島の数から）
export function prefTraits(idx) {
  const out = {};
  const major = new Set(idx.majorPorts || []);
  const land = new Map();
  for (const [a, b] of idx.adjacency) { (land.get(a) || land.set(a, []).get(a)).push(b); (land.get(b) || land.set(b, []).get(b)).push(a); }
  const byPref = {};
  for (const m of idx.munis) if (m.play) (byPref[m.pref] ||= []).push(m);
  const paddyPer = Object.fromEntries(Object.entries(byPref).map(([p, l]) => [p, l.reduce((a, m) => a + m.n.paddy, 0)]));
  const kome = new Set(Object.entries(paddyPer).sort((a, b) => b[1] - a[1]).slice(0, 10).map(x => x[0]));
  for (const [pc, list] of Object.entries(byPref)) {
    const ids = new Set(list.map(m => m.id));
    // 島：同じ県の中で陸づたいに4つ以下しかつながらない市町村
    const seen = new Map();
    for (const m of list) {
      if (seen.has(m.id)) continue;
      const comp = [m.id], st = [m.id]; seen.set(m.id, comp);
      while (st.length) { const x = st.pop(); for (const y of land.get(x) || []) if (ids.has(y) && !seen.has(y)) { seen.set(y, comp); comp.push(y); st.push(y); } }
    }
    const islands = list.filter(m => seen.get(m.id).length <= 4).length;
    const coastal = list.filter(m => m.port).length;
    const majors = list.filter(m => major.has(m.id)).length;
    const ships = Math.max(0, Math.min(6, Math.round(majors + coastal / 15 + islands / 4)));
    const t = [];
    if (ships >= 3) t.push('suigun');
    if (SNOW.includes(pc)) t.push('yuki');
    if (kome.has(pc)) t.push('kome');
    out[pc] = { ships, traits: t };
  }
  return out;
}

// 人材（架空。ありふれた名字と名前の組み合わせで、歴史上の人物と重ならないようにしている）
const SUR = ['青木', '石田', '井上', '上田', '大野', '岡本', '小川', '片山', '川口', '菊池', '木村', '久保', '小島', '近藤', '斉藤', '酒井', '桜井', '柴田', '島田', '杉山', '関口', '高木', '田村', '千葉', '土屋', '中西', '永井', '西村', '野口', '橋本', '服部', '原田', '平野', '福田', '藤井', '星野', '松尾', '丸山', '三浦', '宮本', '村上', '森田', '山口', '横山', '吉川', '和田', '今井', '安藤', '内田', '北村'];
const GIVEN = ['葵', '蓮', '湊', '陽菜', '結衣', '悠真', '颯', '千尋', '灯', '朔', '凛', '奏', '楓', '瑞希', '律', '透', '菫', '大和', '栞', '柚子', '慧', '環', '暁', '渚', '睦', '円香', '光希', '美空', '冬馬', '小春', '晴', '紬'];
export const TRAITS = {
  kaikon: { name: '開墾上手', desc: '開墾が半額・収穫+10%' },
  shosai: { name: '商才', desc: '商業が半額・予算+10%' },
  chikujo: { name: '築城名人', desc: '築城が半額・守り+10%' },
  suigun: { name: '水軍', desc: '渡海+20%・時化にあいにくい' },
  oni: { name: '鬼武者', desc: 'ここからの出陣+15%' },
  hitotarashi: { name: '人たらし', desc: '民心が上がりやすい・登用しやすい' },
  kosho: { name: '交渉上手', desc: '外交が通りやすい（勢力全体）' },
  heitan: { name: '兵站', desc: '兵の維持費-15%（勢力全体）' }
};
export const POLICY = { naisei: '内政', mamori: '守り', seme: '攻め' };
// 全国の人口のうち、その勢力が治める割合（遊ぶ県だけで数える）
export const TAIKA = 0.8;
export function nationalShare(st, B, fid) {
  let all = 0, own = 0;
  for (const m of Object.values(st.munis)) { const i = B.info.get(m.id); if (!i || !i.play) continue; all += i.pop; if (m.owner === fid) own += i.pop; }
  return all ? own / all : 0;
}
export const MAX_OFFICERS = 10;
// 人材の上限：はじめ10人、治める市町村100ごとに＋2、20人まで（2026-10-25 意見。広げても10人のままで城代が足りなかった）。
//  領地が減って上限を下回っても、いる人材はそのまま（新しく加えられないだけ）
export function officerCap(st, fid) {
  let n = 0; for (const m of Object.values(st.munis)) if (m.owner === fid) n++;
  return Math.min(20, MAX_OFFICERS + 2 * Math.floor(n / 100));
}

export function rng(seed) {
  let s = seed >>> 0 || 1;
  const r = () => { s ^= s << 13; s ^= s >>> 17; s ^= s << 5; return (s >>> 0) / 4294967296; };
  r.state = () => s; r.set = v => { s = v >>> 0 || 1; };
  return r;
}
const clamp = (v, a, b) => Math.max(a, Math.min(b, v));

// ── 始める ──
export function createGame(idx, { player = null, seed = 1, start = { y: 2027, m: 4 }, months = 144, level = 'normal' } = {}) {
  const play = idx.munis.filter(m => m.play);
  const prefs = Object.values(idx.prefs).filter(p => p.play);
  const factions = prefs.map((p, i) => ({ id: i, pref: p.code, name: p.name.replace(/[都府県]$/, ''), capital: p.capital, origCapital: p.capital,
    gold: 60, food: 160, arms: 30, ships: 0, alive: true, ai: true, chaos: 0, ap: 0, shiki: 0.6, streak: 0, orig: play.filter(m => m.pref === p.code).length }));
  const PT = prefTraits(idx);
  for (const f of factions) { f.ships = PT[f.pref]?.ships || 0; f.traits = PT[f.pref]?.traits || []; }
  { const kr = rng(seed ^ 0x5bd1e995), pp = {}; for (const m of play) pp[m.pref] = (pp[m.pref] || 0) + m.pop; for (const f of factions) f.kishitsu = pickKishitsu(f, pp[f.pref] || 0, kr); }
  const byPref = Object.fromEntries(factions.map(f => [f.pref, f.id]));
  const munis = {};
  for (const m of play) {
    const cap = factions.some(f => f.capital === m.id);
    munis[m.id] = { id: m.id, owner: byPref[m.pref], troops: Math.round(0.03 * Math.pow(m.pop, 0.85) + (cap ? 2500 : 50)), morale: 0.7,   // 大きな町ほど伸びはなだらかに
      agri: 0, ind: 0, com: 0, fort: cap ? 2 : 0 };
  }
  if (player !== null) factions[player].ai = false;
  const pop = Object.fromEntries(play.map(m => [m.id, m.pop]));
  const st = { v: SAVE_VERSION, seed, rs: seed, date: { ...start }, turn: 0, months, player, factions, munis, pop, orders: [], log: [], over: null,
    rel: {}, pacts: [], proposals: [], term: 1, poll: null, officers: null, voyages: [], regions: {}, coalition: null, feud: {}, rival: -1, level: LEVELS[level] ? level : 'normal' };
  for (const f of factions) f.ap = actionPoints(st, f);
  return st;
}

// 盤面の静的な情報（隣接など）。状態とは別に持つ（セーブに入れない）
export function createBoard(idx) {
  const info = new Map(idx.munis.map(m => [m.id, m]));
  const meisan = new Map();
  for (const [id, no, name, yomi, cat, wide, src = 'tm', major = 1] of idx.meisan || []) {
    if (!meisan.has(id)) meisan.set(id, []);
    const l = meisan.get(id), same = l.find(x => x.name === name);   // 商標と GI の両方にある同じ名前は1つに（重いほうの出典を残す）
    if (same) { if (major > same.major) Object.assign(same, { no, src, major }); continue; }
    l.push({ no, name, yomi, cat, wide: !!wide, src, major });
  }
  for (const l of meisan.values()) l.sort((a, b) => b.major - a.major);   // メジャーなもの（統計1位・GI）を先に
  const land = new Map(), sea = new Map();
  const add = (map, a, b, km) => { if (!map.has(a)) map.set(a, []); map.get(a).push([b, km]); };
  const passH = new Map();   // 隣どうしの境の峠の高さ（m）
  for (const [a, b, km, ph = 0] of idx.adjacency) { add(land, a, b, km); add(land, b, a, km); passH.set(a < b ? a * 4096 + b : b * 4096 + a, ph); }
  for (const [a, b, km, tier = 0] of idx.seaLinks || []) { add(sea, a, b, [km, tier]); add(sea, b, a, [km, tier]); }
  const routes = idx.seaRoutes || {};
  const landC = new Map(), seaC = new Map(), nearC = new Map();
  return {
    info,
    prefCapital: Object.fromEntries(Object.values(idx.prefs || {}).filter(p => p.play).map(p => [p.code, p.capital])),   // 県 → 県庁所在地
    // 隣どうしの一覧は一度作ったら使い回す（参謀の先読みで毎回作り直していて、計測の時間の2割近くを使っていた 2026-10-21）。
    //  使い回すので書きかえられないよう凍らせておく
    landNb: id => { let v = landC.get(id); if (!v) { v = Object.freeze((land.get(id) || []).map(x => x[0])); landC.set(id, v); } return v; },
    seaNb: id => { let v = seaC.get(id); if (!v) { v = Object.freeze((sea.get(id) || []).filter(([b]) => !(land.get(id) || []).some(x => x[0] === b)).map(x => x[0])); seaC.set(id, v); } return v; },
    // 陸か近い海で隣り合う町（孤立・補給線の判定に使う）
    nearNb: id => { let v = nearC.get(id); if (!v) { const sn = (sea.get(id) || []).filter(([b, i]) => i[1] === 0 && !(land.get(id) || []).some(x => x[0] === b)).map(x => x[0]); v = Object.freeze([...(land.get(id) || []).map(x => x[0]), ...sn]); nearC.set(id, v); } return v; },
    // 海路の種類（0 近海・1 外洋・2 遠洋）と距離
    seaInfo: (a, b) => { const l = (sea.get(a) || []).find(x => x[0] === b); return l ? { km: l[1][0], tier: l[1][1] } : null; },
    // 外洋・遠洋の道すじ（経度・緯度の列。a から b の向き）
    route: (a, b) => { const r = routes[a < b ? a + '-' + b : b + '-' + a]; return r ? (a < b ? r : r.slice().reverse()) : null; },
    industry: id => info.get(id).n.ind ?? INDUSTRY[info.get(id).code] ?? 0.12,
    meisan,   // 市町村 → その町の名産（地域団体商標）の一覧
    pass: (a, b) => passH.get(a < b ? a * 4096 + b : b * 4096 + a) || 0
  };
}

// ── 数値 ──
// 行動力は治めている人口で決まる（小さな村が多いだけでは増えない）
export function actionPoints(st, f, B) {
  let pop = 0;
  for (const m of Object.values(st.munis)) if (m.owner === f.id) pop += st.pop ? st.pop[m.id] : 0;
  // 人口の平方根で増やす（大きな県だけ手数が多すぎないように）：鳥取4・香川5・北海道8・大阪9・東京10、最大12
  const grown = Math.max(0, Object.values(st.munis).filter(m => m.owner === f.id).length - (f.orig || 0));
  let ap = Math.min(12, 3 + Math.round(2 * Math.sqrt(pop / 1e6)) + Math.min(3, Math.floor(grown / 15))) + Math.min(2, Object.values(st.regions || {}).filter(x => x === f.id).length);   // 増やした市町村15ごとに+1（3まで）・地方統一1つにつき+1
  if (f.chaos > 0) ap = Math.max(1, Math.floor(ap / 2));
  return ap;
}
export function income(st, B, f) {
  let gold = 0, food = 0, arms = 0, upkeep = 0, deleg = 0;
  for (const m of Object.values(st.munis)) {
    if (m.owner !== f.id) continue;
    const i = B.info.get(m.id), n = i.n;
    const o = st.officers ? officerAt(st, B, m.id) : null;
    const g = i.pop / 10000 * 0.5 * (0.6 + m.morale * 0.6) * (1 + m.com * 0.1) * (o && o.trait === 'shosai' ? 1.1 : 1);
    gold += g;
    if (st.player === f.id && st.delegs && st.delegs[i.pref]) deleg += g * 0.6;   // 委任した県の税の6割は知事代理の財布へ
    food += n.coast * 0.004;
    arms += (n.town * 0.0009 + 0.25) * B.industry(m.id) * (1 + m.ind * 0.3);   // 殖産1段 +30%（2026-10-20 に +15% から倍。効き目が弱く使われなかった）
    upkeep += m.troops / 1000 * 0.55;
  }
  if (hasTrait(st, f.id, 'heitan')) upkeep *= 0.85;
  let troopsAll = 0;
  for (const m of Object.values(st.munis)) if (m.owner === f.id) troopsAll += m.troops;
  const payroll = troopsAll / 1000 * 0.8;   // 兵の維持には予算もかかる（大軍ほど重い）
  // 治める人口が大きいほど、予算の伸びはなだらかに（1,500万人でおよそ半分）
  let fpop = 0;
  for (const m of Object.values(st.munis)) if (m.owner === f.id) fpop += B.info.get(m.id).pop;
  gold *= 1 / (1 + fpop / 15e6); deleg *= 1 / (1 + fpop / 15e6);
  const bl = brandLv(st, B, f.id), L = k => bl[k]?.lv || 0;
  const myCards = cards(st, B, f.id).length;
  gold += Math.min(30, myCards) * 1.2;   // 名産の町1つにつき（30まで）
  gold *= 1 + 0.04 * L('men');
  gold += 3 * L('umi') + 2 * L('aji');
  arms *= 1 + 0.1 * L('craft');
  upkeep *= 1 - 0.05 * L('yasai');
  let trade = 0;   // 交易：相手の名産の町の数だけ（6まで）
  for (const p of st.pacts || []) if (p.type === 'koeki' && (p.a === f.id || p.b === f.id)) trade += 3 + 1.5 * Math.min(6, cards(st, B, p.a === f.id ? p.b : p.a).length);
  gold += trade;
  const lk = st.player === f.id ? levelOf(st).inc : 1;   // 難易度（遊ぶ人だけ）
  return { gold: gold * lk - deleg - payroll, food: food * lk - upkeep, arms: arms * lk, upkeep, trade, deleg, payroll };
}
export function harvest(st, B, f) {
  let food = 0;
  for (const m of Object.values(st.munis)) if (m.owner === f.id) { const n = B.info.get(m.id).n, o = st.officers ? officerAt(st, B, m.id) : null; food += (n.paddy * 1.0 + n.farm * 0.55) / 230 * (1 + m.agri * 0.3) * (0.7 + m.morale * 0.4) * (o && o.trait === 'kaikon' ? 1.1 : 1); }
  if ((f.traits || []).includes('kome')) food *= 1.1;
  return food * (1 + 0.06 * lvOf(st, B, f.id, 'kome') + 0.04 * lvOf(st, B, f.id, 'kajitsu')) * (st.player === f.id ? levelOf(st).inc : 1);
}
// 孤立：本拠と陸（か近海）でつながっていない市町村は援軍が来ない（守り−15%）。同じ月のうちは覚えておく
const connCache = new WeakMap();
function seatLinked(st, B, fid) {
  let c = connCache.get(st);
  if (!c || c.turn !== st.turn) { c = { turn: st.turn, m: new Map() }; connCache.set(st, c); }
  let set = c.m.get(fid);
  if (set) return set;
  set = new Set();
  const f = st.factions[fid], start = f && st.munis[f.capital];
  if (start && start.owner === fid) {
    const q = [start.id]; set.add(start.id);
    while (q.length) {
      const id = q.pop();
      for (const n of nearNb(B, id)) { const x = st.munis[n]; if (x && x.owner === fid && !set.has(n)) { set.add(n); q.push(n); } }
    }
  }
  c.m.set(fid, set);
  return set;
}
// 孤立：本拠とつながっておらず（陸か近い海）、敵と陸か近い海で接している町（＝補給線を断たれた町）。
//  2026-10-19 本人指摘：離れた島は、近くの港を敵に押さえられない限り孤立にしない。港を押さえられた島は孤立する
//  地元の飛び地（北山村など、はじめから県庁とつながっていない町）は、元の県の勢力が持っている間は孤立にしない
const nearNb = (B, id) => B.nearNb ? B.nearNb(id) : [...B.landNb(id), ...B.seaNb(id).filter(x => B.seaInfo(id, x).tier === 0)];
export function foesAround(st, B, m) {   // 陸か近い海で接する敵：勢力 → まわりの兵
  const out = new Map();
  for (const n of nearNb(B, m.id)) { const x = st.munis[n]; if (x && x.owner >= 0 && x.owner !== m.owner && !peaceful(st, m.owner, x.owner)) out.set(x.owner, (out.get(x.owner) || 0) + x.troops); }
  return out;
}
const exclaves = new WeakMap();
function exclaveOf(B) {
  let set = exclaves.get(B);
  if (set) return set;
  set = new Set();
  const byPref = {};
  for (const [id, i] of B.info) if (i.play) (byPref[i.pref] ||= []).push(id);
  for (const ids of Object.values(byPref)) {
    const pref = B.info.get(ids[0]).pref, cap = B.prefCapital?.[pref];
    const start = cap !== undefined && B.info.has(cap) ? cap : ids.slice().sort((a, b) => B.info.get(b).pop - B.info.get(a).pop)[0];
    const seen = new Set([start]), q = [start];
    while (q.length) { const id = q.pop(); for (const n of nearNb(B, id)) if (!seen.has(n) && B.info.get(n)?.pref === pref && B.info.get(n)?.play) { seen.add(n); q.push(n); } }
    for (const id of ids) if (!seen.has(id)) set.add(id);
  }
  exclaves.set(B, set);
  return set;
}
export function isolated(st, B, id) {
  const m = st.munis[id];
  if (!m || m.owner < 0 || !st.factions[m.owner]?.alive) return false;
  if (exclaveOf(B).has(id) && st.factions[m.owner].pref === B.info.get(id).pref) return false;
  if (!foesAround(st, B, m).size) return false;
  return !seatLinked(st, B, m.owner).has(id);
}
// ── 士気（0.15〜1、ふだん0.6）と勢い ──
//  勝つと上がり（高いほど上がりにくい）、負ける・町を失う・本拠を失う・兵糧切れで下がる。毎月ふだんの値へ少し戻る。
//  攻めは ±25%、守りは ±16% ほど変わる。0.3を切ると兵が逃げる。
//  勢い：3か月続けて勝ち越すと「勢いに乗る」（攻め+10%・士気が上がる）。負け越すか町を2つ以上失うと止まる。
export const SHIKI0 = 0.6;
export const shikiOf = f => (f && f.shiki !== undefined ? f.shiki : SHIKI0);
export const riding = f => !!f && (f.streak || 0) >= 3;
function addShiki(f, d) { if (!f) return; const v = shikiOf(f); f.shiki = clamp(v + (d > 0 ? d * (1.15 - v) * 1.6 : d), 0.15, 1); }
const tally = new WeakMap();   // その月の勝ち負け（勢力ごと）。保存しない
const tallyOf = (st, fid) => { let t = tally.get(st); if (!t) { t = new Map(); tally.set(st, t); } if (!t.has(fid)) t.set(fid, { win: 0, lose: 0, fights: 0, lost: 0 }); return t.get(fid); };
// 陣（2026-10-19）：取ったばかりの町は、攻めた兵がそのまま陣を張る。次の月から4か月、守り×2.0→1.75→1.5→1.25
//  取ったり取られたりのくり返し（CPU どうしで、取った町の56%が半年以内にまた落ちていた。取り返しは2〜4か月後が多い）を減らし、線が前へ進むように
export const CAMP = 4;
export const campK = m => (m && m.camp > 0 ? 1 + 0.25 * Math.min(m.camp, CAMP) : 1);
export function defense(st, B, m) {
  const i = B.info.get(m.id), o = st.officers ? st.officers.find(o => o.f === m.owner && o.at === m.id) : null;
  const of = o ? (1 + o.war / 300) * (o.trait === 'chikujo' ? 1.1 : 1) : 1;
  const snow = (isWinter(st) && SNOW.includes(i.pref) ? 1.3 : 1) * (i.pref === '13' && i.code.startsWith('131') ? 1.3 : 1);   // 雪国の冬・東京23区の町の守り
  const df = st.factions[m.owner];
  const sk = 1 + (shikiOf(df) - SHIKI0) * 0.4;
  const haisui = df && df.capital !== df.origCapital && i.pref === df.pref ? 1.15 : 1;   // 背水：本拠を失った勢力は地元の県で粘る
  return m.troops * (1 + 0.25 * m.fort) * (1 + Math.min(0.45, i.n.hAvg / 1400)) * (0.7 + 0.6 * m.morale) * of * snow * (isolated(st, B, m.id) ? 0.85 : 1) * sk * haisui * campK(m);
}
// 攻め筋：陸で攻めるとき、境の峠が高いほど弱くなる（150m を超えた100mごとに−10%・最大−35%）。冬の600m超の峠は雪でさらに×0.85
//  大阪→奈良でも、生駒の尾根（東大阪→生駒 388m）は越えにくく、大和川の谷筋（柏原→王寺 74m）は攻めやすい
export function crossK(st, B, from, to) {
  if (!B.pass || !B.landNb(from).includes(to)) return 1;
  const h = B.pass(from, to);
  return (1 - clamp((h - 150) / 1000, 0, 0.35)) * (isWinter(st) && h > 600 ? 0.85 : 1);
}
// 占領できる見込み（0〜1）：合戦（battle）と同じ決まりを、乱れを均等にとって数える
//  A・D：攻める力と守る力  atk・def：攻める兵と守る兵
export function winChance(A, D, atk, def) {
  let win = 0, n = 0;
  const share = A / Math.max(1, A + D);
  for (let i = 0; i < 10; i++) for (let j = 0; j < 6; j++) for (let k = 0; k < 6; k++) {
    const u = 0.9 + (i + 0.5) / 10 * 0.2, ra = (j + 0.5) / 6, rd = (k + 0.5) / 6;
    const left = atk - atk * clamp(0.12 + 0.38 * (1 - share) + ra * 0.08, 0, 0.95);
    const rest = def - def * clamp(0.12 + 0.5 * share + rd * 0.08, 0, 1);
    n++; if (A * u > D * 1.1 && left > rest) win++;
  }
  return win / n;
}
// cmdr：出陣元にいる城代（いれば強くなる）
export function attackPower(st, f, troops, naval, cmdr) {
  const armsRatio = clamp(f.arms / Math.max(1, troops / 400), 0, 1);
  let k = (0.8 + armsRatio * 0.4) * (naval ? 0.8 * ((f.traits || []).includes('suigun') ? 1.1 : 1) : 1);
  k *= (1 + (shikiOf(f) - SHIKI0) * 0.6) * (riding(f) ? 1.1 : 1);
  if (cmdr) k *= (1 + cmdr.war / 250) * (cmdr.trait === 'oni' ? 1.15 : 1) * (naval && cmdr.trait === 'suigun' ? 1.2 : 1);
  return troops * k;
}
export const commanderAt = (st, fid, id) => st.officers ? st.officers.find(o => o.f === fid && o.at === id) || null : null;
const canPay = (f, c) => (f.gold >= (c.gold || 0)) && (f.food >= (c.food || 0)) && (f.arms >= (c.arms || 0));
const pay = (f, c) => { f.gold -= c.gold || 0; f.food -= c.food || 0; f.arms -= c.arms || 0; };
export const isWinter = st => st.date.m === 12 || st.date.m <= 2;
// 渡海：種類ごとの日数・要る船・天気の危うさ
export const SEA = [
  { name: '近海', months: 0, ships: 1, storm: [0.03, 0.35], typhoon: 0.15, intercept: 0.5, lose: 0 },
  { name: '外洋', months: 1, ships: 2, storm: [0.06, 0.45], typhoon: 0.3, intercept: 0.7, lose: 0.2 },
  { name: '遠洋', months: 2, ships: 4, storm: [0.10, 0.5], typhoon: 0.4, intercept: 0.9, lose: 0.35 }
];
export const isTyphoon = (st, B, to) => (st.date.m === 8 || st.date.m === 9) && ((B.info.get(to).port || B.info.get(to).seat || [0, 35])[1] < 33.8);
export function stormChance(st, B, tier, to, cmdr) {
  const S = SEA[tier];
  let p = S.storm[isWinter(st) ? 1 : 0] + (isTyphoon(st, B, to) ? S.typhoon : 0);
  if (cmdr && cmdr.trait === 'suigun') p *= 0.5;
  return Math.min(0.9, p);
}

// ── 外交・名産の数値 ──
const rk = (a, b) => a < b ? a + '-' + b : b + '-' + a;
export const getRel = (st, a, b) => st.rel[rk(a, b)] || 0;
const addRel = (st, a, b, d) => { st.rel[rk(a, b)] = clamp(getRel(st, a, b) + d, -100, 100); };
export const pactOf = (st, a, b) => st.pacts.find(p => (p.a === a && p.b === b) || (p.a === b && p.b === a));
export const OPENING = 6;   // 開幕の備え：はじめの6か月はどこも攻めない
export const peaceful = (st, a, b) => { if ((st.turn || 0) < OPENING && a >= 0 && b >= 0) return true; const c = st.coalition; if (c && a !== b && c.members.includes(a) && c.members.includes(b)) return true; const p = pactOf(st, a, b); return !!p && (p.type === 'domei' || p.type === 'teisen'); };
export function cards(st, B, fid) {   // 持っている名産の町（町ごとに1枚・名産の一覧つき）
  const out = [];
  for (const m of Object.values(st.munis)) if (m.owner === fid) { const l = B.meisan?.get(m.id); if (l) out.push({ id: m.id, list: l, name: l[0].name, cats: [...new Set(l.map(x => x.cat))] }); }
  return out;
}
// 種類ごとの、その名産のある町の数（盤面ぜんたい）
export function brandSets(B) {
  if (B.sets) return B.sets;
  const sets = {};
  for (const [id, l] of B.meisan || []) if (B.info.get(id)?.play) for (const c of new Set(l.map(x => x.cat))) (sets[c] ||= []).push(id);
  return (B.sets = sets);
}
// 種類ごとのレベル（0〜3）と、持っている数
export function brandLv(st, B, fid) {
  const n = {};
  for (const c of cards(st, B, fid)) for (const k of c.cats) n[k] = (n[k] || 0) + 1;
  const lv = {};
  for (const k of Object.keys(BRANDS)) { const v = n[k] || 0; lv[k] = { n: v, lv: BRAND_STEPS.filter(x => v >= x).length }; }
  return lv;
}
export function brands(st, B, fid) {   // Lv1 以上の種類（互換）
  const l = brandLv(st, B, fid);
  return Object.keys(l).filter(k => l[k].lv > 0);
}
const lvOf = (st, B, fid, k) => brandLv(st, B, fid)[k]?.lv || 0;
export function power(st, fid) { let p = 0; for (const m of Object.values(st.munis)) if (m.owner === fid) p += m.troops; return p; }
// 知事選の見込み：票を入れるのは地元の県の人だけ（2026-10-20。前は取った他県の町の民心も数えていて、取ったばかりの町は民心が低いので、
//  勝って領地を広げるほど落選しやすかった）。地元で持っている町の民心（人口平均）＋領地の伸び＋ブランド。地元の町を敵に取られている分だけ下がる
// ここ1年の合戦の数（勢力ごと）。記録を1年分残すようにしたら、支持の計算のたびに1,500件を数え直して重くなったので、記録が変わるまで覚えておく（2026-10-21）
const warsCache = new WeakMap();
function warsOf(st, fid) {
  const log = st.log || [], key = (st.turn || 0) + ':' + log.length + ':' + (log.length ? log[log.length - 1].turn : 0);
  let c = warsCache.get(st);
  if (!c || c.key !== key) {
    const n = new Map(), t0 = (st.turn || 0) - 12;
    for (const e of log) if (e.turn > t0 && e.type === 'battle') { n.set(e.f, (n.get(e.f) || 0) + 1); if (e.defOwner !== e.f) n.set(e.defOwner, (n.get(e.defOwner) || 0) + 1); }
    c = { key, n }; warsCache.set(st, c);
  }
  return c.n.get(fid) || 0;
}
export function pollOf(st, B, fid) {
  const f = st.factions[fid];
  let w = 0, s = 0, n = 0, home = 0;
  for (const m of Object.values(st.munis)) {
    const i = B.info.get(m.id);
    if (!i) continue;
    if (i.pref === f.pref) home += i.pop;
    if (m.owner !== fid) continue;
    n++;
    if (i.pref === f.pref) { w += i.pop; s += i.pop * m.morale; }
  }
  const held = home ? w / home : 0, mor = w ? s / w : 0.3, growth = clamp((n - f.orig) / f.orig, -1, 1);
  // 連戦の疲れ：ここ1年の自分の合戦（攻めた・攻められた）1回につき −0.03%（最大 −5%）。勝ち続けている人にも縛りが残るように（2026-10-20 評価）
  //  記録が1か月分しか残らない不具合を直したら、よく戦う人はほぼ全員が上限の −10% になり差がつかなかったので、これまで実際に効いていた大きさ（−1〜3%）に合わせた
  const wars = warsOf(st, fid), weary = Math.min(0.05, wars * 0.0003);
  const bl = brandLv(st, B, fid), sum = Object.values(bl).reduce((a, x) => a + x.lv, 0);
  return clamp(0.15 + mor * 0.6 - (1 - held) * 0.25 + growth * 0.06 - weary + sum * 0.01 + (bl.yu?.lv || 0) * 0.015 + (fid === st.player ? levelOf(st).poll : 0), 0.05, 0.95);
}

// 知事選に備える祭り：票を入れるのは地元の人だけなので、地元で持っている町のうち「人口×上げしろ」が大きい順に（2026-10-20。
//  祭りは民心50%未満の町にしか勧めておらず、地元の大きな町が60%前後のまま選挙を迎え、参謀どおりでも3回に1回は落選していた）
export function electionFestivals(st, B, fid, max = 3) {
  const f = st.factions[fid], left = ELECTION_EVERY - (st.turn % ELECTION_EVERY);
  return Object.values(st.munis).filter(m => m.owner === fid && B.info.get(m.id)?.pref === f.pref && m.morale < 0.88)
    .map(m => ({ m, g: B.info.get(m.id).pop * (Math.min(1, m.morale + 0.12) - m.morale) }))
    .sort((a, b) => b.g - a.g).slice(0, max)
    .map(x => ({ type: 'hodokoshi', at: x.m.id, why: `知事選まであと${left}か月。地元の大きな町の民心がそのまま票になる` }));
}

// ── 人材 ──
function makeOfficer(st, r, fid, skew = {}) {
  const roll = (b) => Math.round(clamp(35 + r() * 45 + (b || 0), 15, 99));
  let name;
  for (let k = 0; k < 20; k++) { name = SUR[Math.floor(r() * SUR.length)] + ' ' + GIVEN[Math.floor(r() * GIVEN.length)]; if (!st.officers.some(o => o.name === name)) break; }   // 名字と名前の間は半角スペース
  const keys = Object.keys(TRAITS);
  const trait = skew.trait && r() < 0.6 ? skew.trait : keys[Math.floor(r() * keys.length)];
  const o = { id: st.nextOfficer++, name, f: fid, pol: roll(skew.pol), war: roll(skew.war), int: roll(skew.int), trait, at: null, gov: null };
  st.officers.push(o);
  return o;
}
// 古いセーブにも人材を足す（なければ作る）
export function ensureOfficers(st, B) {
  if (st.officers) {   // 古いセーブの名前（間なし）を「名字 名前」に直す
    for (const o of st.officers) if (!o.name.includes(' ')) { const s = SUR.find(x => o.name.startsWith(x)); if (s) o.name = s + ' ' + o.name.slice(s.length); }
    if (!st.roninAdded) addRonin(st, B, rng((st.seed || 1) * 131 + st.turn));
    return;
  }
  st.officers = []; st.nextOfficer = 1; st.delegs = {};
  const r = rng((st.seed || 1) * 977 + 13);
  for (const f of st.factions) {
    const mine = Object.values(st.munis).filter(m => m.owner === f.id).sort((a, b) => B.info.get(b.id).pop - B.info.get(a.id).pop);
    const skews = [{ pol: 20 }, { war: 20 }, { int: 20 }, {}];
    skews.forEach((sk, k) => { const o = makeOfficer(st, r, f.id, sk); o.at = mine[k % Math.max(1, mine.length)]?.id ?? null; });
  }
  addRonin(st, B, r);
}
// 浪人（どこにも仕えていない人材）：県ごとに2人。いる市町村で「登用」すると先に見つかる
function addRonin(st, B, r) {
  const byPref = {};
  for (const m of Object.values(st.munis)) (byPref[B.info.get(m.id).pref] ||= []).push(m.id);
  for (const ids of Object.values(byPref)) for (let k = 0; k < 2; k++) {
    const o = makeOfficer(st, r, -1, [{ pol: 12 }, { war: 12 }, { int: 12 }][Math.floor(r() * 3)]);
    o.at = ids[Math.floor(r() * ids.length)];
  }
  st.roninAdded = true;
}
export const officersOf = (st, fid) => (st.officers || []).filter(o => o.f === fid);
// 解雇（2026-10-25 意見「10人以上になった人材を辞めさせる選択肢が欲しい」）：浪人に戻り、いた町（なければ本拠）に残る。
//  あとで登用すれば先に見つかる。ほかの勢力が引き抜くこともある。行動力は使わない
export function dismissOfficer(st, B, fid, oid) {
  const o = (st.officers || []).find(x => x.id === oid && x.f === fid);
  if (!o) return '人材がいません';
  if (o.gov && st.delegs?.[o.gov]) { st.factions[fid].gold += st.delegs[o.gov].purse; delete st.delegs[o.gov]; }
  const f = st.factions[fid];
  o.f = -1; o.gov = null; o.at = o.at ?? f.capital;
  if (st.sanbo === o.id) st.sanbo = null;
  return true;
}
// その市町村で効く人材（城代、なければその県の知事代理）
export function officerAt(st, B, id) {
  const m = st.munis[id];
  if (!m || !st.officers) return null;
  const here = st.officers.find(o => o.f === m.owner && o.at === id);
  if (here) return here;
  if (st.player === m.owner && st.delegs) { const d = st.delegs[B.info.get(id).pref]; if (d) return st.officers.find(o => o.id === d.oid && o.f === m.owner) || null; }
  return null;
}
const hasTrait = (st, fid, t) => (st.officers || []).some(o => o.f === fid && o.trait === t);
const bestInt = (st, fid) => Math.max(0, ...(st.officers || []).filter(o => o.f === fid).map(o => o.int));
// 城代を置く・外す（行動力は使わない）
export function assignOfficer(st, fid, oid, at) {
  const o = st.officers.find(o => o.id === oid && o.f === fid);
  if (!o) return '人材がいません';
  if (at !== null && (!st.munis[at] || st.munis[at].owner !== fid)) return '自領ではありません';
  if (at !== null) for (const x of st.officers) if (x.f === fid && x.at === at && x !== o) x.at = null;   // 1か所に1人
  o.at = at;
  return true;
}
// 委任（プレイヤーだけ）。県ごとに知事代理と方針を決める
export function setDelegation(st, B, pref, oid, policy) {
  st.delegs ||= {};
  if (oid === null) { const d = st.delegs[pref]; if (d) { st.factions[st.player].gold += d.purse; for (const o of st.officers) if (o.gov === pref) o.gov = null; } delete st.delegs[pref]; return true; }
  if (oid !== null && pref === st.factions[st.player]?.pref) return '地元の県はあなた（知事）が治めます';   // 地元は委任しない（2026-10-21 本人指摘。はじめは全部が地元なので、委任すると税の6割を渡して CPU に任せるだけになり、知事選の民心も握れない）
  const o = st.officers.find(o => o.id === oid && o.f === st.player);
  if (!o) return '人材がいません';
  for (const [k, d] of Object.entries(st.delegs)) if (d.oid === oid && k !== pref) return `${o.name}はほかの県を任されています`;
  for (const x of st.officers) if (x.gov === pref) x.gov = null;
  o.gov = pref;
  st.delegs[pref] = { oid, policy: policy || 'naisei', purse: st.delegs[pref]?.purse || 0 };
  return true;
}
const costOf = (st, B, at, c, type) => {
  // 大きな町ほど、商業・殖産の費用も高い（増える分のおよそ8か月分・40か月分。小さな町はこれまでどおり）
  const m = st.munis[at], i = B.info.get(at);
  if (m && i && type === 'shogyo') c = { ...c, gold: Math.max(c.gold, Math.round(i.pop / 10000 * 0.05 * (0.6 + m.morale * 0.6) * 8)) };
  if (m && i && type === 'shokusan') c = { ...c, gold: Math.max(c.gold, Math.round((i.n.town * 0.0009 + 0.25) * B.industry(at) * 0.15 * 40)) };
  const o = officerAt(st, B, at);
  if (!o) return c;
  let k = 1 - o.pol / 300;
  if ((type === 'kaikon' && o.trait === 'kaikon') || (type === 'shogyo' && o.trait === 'shosai') || (type === 'chikujo' && o.trait === 'chikujo')) k *= 0.5;
  return { gold: c.gold ? Math.ceil(c.gold * k) : 0, food: c.food ? Math.ceil(c.food * k) : 0, arms: c.arms ? Math.ceil(c.arms * k) : 0 };
};
export const commandCost = (st, B, at, type) => costOf(st, B, at, COMMANDS[type].cost, type);
// まとめて行う段数（上限まで）と、その費用
export function bulkSteps(st, at, type, x) { const m = st.munis[at], key = { kaikon: 'agri', shokusan: 'ind', shogyo: 'com', chikujo: 'fort' }[type]; return key ? Math.max(0, Math.min(x, 3, MAXLV[key] - m[key])) : 1; }
// 募兵：予算50・兵糧60・装備14で兵4,000人（兵糧も余りやすいので兵糧を多めに）。まとめて行うと3倍まで（2026-10-20。予算と兵糧が使いきれず貯まる一方だった）
export const BOHEI = 4000;
// 兵糧・装備が足りないぶんは予算で買い足す（兵糧1＝予算1・装備1＝予算2。市場より割高）。予算はあるのに兵糧がなくて雇えず、1.8万も貯まる勢力があった
export function boheiCost(f, k) {
  const food = Math.min(60 * k, Math.max(0, Math.floor((f ? f.food : 0) - 30))), arms = Math.min(Math.ceil(BOHEI / 300) * k, Math.max(0, Math.floor((f ? f.arms : 0) - 10)));
  return { gold: 50 * k + (60 * k - food) + (Math.ceil(BOHEI / 300) * k - arms) * 2, food, arms };
}
export function bulkCost(st, B, at, type, x) {
  if (type === 'bohei') return boheiCost(st.munis[at] && st.factions[st.munis[at].owner], clamp(x || 1, 1, 3));
  if (type === 'chohei') { const n = Math.round(clamp(B.info.get(at).pop * 0.012, 300, 6000)) * (x > 1 ? 2 : 1); return { gold: Math.ceil(n / 100) * 1.5, arms: Math.ceil(n / 300) }; }
  const c = costOf(st, B, at, COMMANDS[type].cost, type), k = ['shogyo', 'kaikon', 'shokusan', 'chikujo'].includes(type) ? Math.max(1, bulkSteps(st, at, type, x)) : 1;
  return { gold: (c.gold || 0) * k, food: (c.food || 0) * k, arms: (c.arms || 0) * k };
}
function previewBulk(st, B, fid, type, at, x) {
  const k = bulkSteps(st, at, type, x), one = commandPreview(st, B, fid, type, at, 1);
  if (!k) return one;
  if (type === 'chikujo') { const m = st.munis[at]; return `守り +${25 * k}%（城 ${m.fort}→${m.fort + k}）`; }
  return one.replace(/([+])([\d.]+)/, (_, s, v) => s + (parseFloat(v) * k).toFixed(v.includes('.') ? (v.split('.')[1].length) : 0)) + `（${k}段）`;
}
// コマンドの見込み（札に出す）
export function commandPreview(st, B, fid, type, at, x = 1) {
  if (x > 1 && ['shogyo', 'kaikon', 'shokusan', 'chikujo'].includes(type)) return previewBulk(st, B, fid, type, at, x);
  const m = st.munis[at], i = B.info.get(at), n = i.n;
  const o = officerAt(st, B, at);
  switch (type) {
    case 'shogyo': return m.com >= MAXLV.com ? 'これ以上は上がらない' : `予算 +${(i.pop / 10000 * 0.5 * (0.6 + m.morale * 0.6) * 0.1 * (o && o.trait === 'shosai' ? 1.1 : 1)).toFixed(1)}／月`;
    case 'kaikon': return m.agri >= MAXLV.agri ? 'これ以上は上がらない' : `秋の兵糧 +${((n.paddy + n.farm * 0.55) / 230 * 0.3 * (0.7 + m.morale * 0.4)).toFixed(1)}`;
    case 'shokusan': return m.ind >= MAXLV.ind ? 'これ以上は上がらない' : `装備 +${((n.town * 0.0009 + 0.25) * B.industry(at) * 0.3).toFixed(2)}／月`;
    case 'hodokoshi': { const v = shikiOf(st.factions[fid]); return `民心 ${Math.round(m.morale * 100)}→${Math.round(Math.min(1, m.morale + 0.12) * 100)}・士気 +${Math.max(1, Math.round(0.02 * (1.15 - v) * 1.6 * 100))}`; }   // 士気の上がり方は addShiki と同じ（数字が抜けていた）
    case 'chikujo': return m.fort >= MAXLV.fort ? 'これ以上は上がらない' : `守り +25%（城 ${m.fort}→${m.fort + 1}）`;
    case 'chohei': { const k = Math.round(clamp(i.pop * 0.012, 300, 6000)) * (x > 1 ? 2 : 1); return `兵 +${k.toLocaleString()}・民心 −${x > 1 ? 9 : 6}`; }
    case 'bohei': return `兵 +${(BOHEI * clamp(x || 1, 1, 3)).toLocaleString()}・民心そのまま`;
    case 'toyo': return `見つかる見込み ${Math.round(toyoChance(st, B, fid, at) * 100)}%`;
    case 'zosen': return `船 ${st.factions[fid].ships}→${st.factions[fid].ships + 1}`;
    default: return '';
  }
}

export const toyoChance = (st, B, fid, at) => {
  const ronin = (st.officers || []).some(o => o.f === -1 && o.at === at);
  return ronin ? Math.min(0.95, 0.75 + bestInt(st, fid) / 400) : Math.min(0.9, 0.3 + bestInt(st, fid) / 250 + (hasTrait(st, fid, 'hitotarashi') ? 0.1 : 0));
};
// 参謀（プレイヤーが選ぶ。選んでいなければ知のいちばん高い人）
export function sanboOf(st, fid) {
  const offs = officersOf(st, fid);
  if (st.player === fid && st.sanbo) { const o = offs.find(o => o.id === st.sanbo); if (o) return o; }
  return offs.slice().sort((a, b) => b.int - a.int)[0] || null;
}
// 引き抜き：費用と見込み
export function scoutTerms(st, B, fid, o) {
  const sb = sanboOf(st, fid), myInt = sb ? sb.int : 30;
  const gold = Math.round(20 + Math.max(o.pol, o.war, o.int) * (o.f < 0 ? 0.3 : 0.6));
  let p = 0.15 + (myInt - o.int) / 150 + (o.f < 0 ? 0.35 : 0);
  if (o.f >= 0) p += getRel(st, fid, o.f) < -20 ? 0.08 : 0;   // 仲の悪い勢力の家臣は寝返りやすい
  return { gold, chance: clamp(p, 0.05, 0.85) };
}
// 引き抜ける相手（浪人は自領と隣り、敵は隣り合う市町村の城代）
export function scoutTargets(st, B, fid) {
  const mine = new Set(Object.values(st.munis).filter(m => m.owner === fid).map(m => m.id));
  const near = new Set(mine);
  for (const id of mine) for (const n of [...B.landNb(id), ...B.seaNb(id)]) near.add(n);
  return (st.officers || []).filter(o => o.f !== fid && o.at && near.has(o.at) && (o.f < 0 || !peaceful(st, fid, o.f) || true))
    .sort((a, b) => Math.max(b.pol, b.war, b.int) - Math.max(a.pol, a.war, a.int)).slice(0, 10);
}

// ── コマンド（成功で true／理由の文字列を返す）──
export function command(st, B, fid, cmd) { return commandRaw(st, B, fid, cmd); }
// 集結（2026-10-20 評価：奥の兵を前線へ運べず終盤に地図が固まる）：この町と自領だけでつながる（陸か近い海）、陸で敵と接していない町から兵の6割（500人は残す）
export function musterPlan(st, B, fid, at) {
  const t = st.munis[at];
  if (!t || t.owner !== fid) return { n: 0, gold: 0, srcs: [] };
  const hostile = id => B.landNb(id).some(n => { const x = st.munis[n]; return x && x.owner >= 0 && x.owner !== fid && !peaceful(st, fid, x.owner); });   // 奥かどうかは陸で接しているかで（海の向こうまで数えると、瀬戸内の町がみな前線になった）
  const pend = id => st.orders.filter(o => o.f === fid && o.from === id).reduce((a, o) => a + o.troops, 0);
  const seen = new Set([at]), q = [at], srcs = [];
  while (q.length) {
    const id = q.pop();
    for (const n of [...B.landNb(id), ...B.seaNb(id).filter(x => B.seaInfo(id, x).tier === 0)]) {
      const x = st.munis[n];
      if (!x || x.owner !== fid || seen.has(n)) continue;
      seen.add(n); q.push(n);
      if (hostile(n)) continue;
      const k = Math.floor((x.troops - pend(n) - 500) * 0.6);
      if (k >= 300) srcs.push([n, k]);
    }
  }
  srcs.sort((a, b) => b[1] - a[1]);
  const n = srcs.reduce((a, s) => a + s[1], 0);
  return { n, gold: Math.ceil(n / 1500), srcs };
}
// 総攻め（2026-10-19 テンポ）：前線の自領から「有利」以上（占領の見込み75%以上）の敵の町へ一斉に出陣。
//  行動力1につき2か所まで（使う行動力は攻める数の半分・切り上げ。2026-10-20 前は2か所でも全部使っていた）。出す町・攻める町は1回ずつ。
//  人口の多い町・本拠を先に。近い海の渡海も含める（島の県でも使えるように）。町ごとの合戦の決まりはふだんの出陣と同じ
export function sosemePlan(st, B, fid) {
  const f = st.factions[fid];
  if (!f || !f.alive || f.ap <= 0 || st.over) return [];
  const pend = id => st.orders.filter(o => o.f === fid && o.from === id).reduce((a, o) => a + o.troops, 0);
  const cand = [];
  for (const m of Object.values(st.munis)) {
    if (m.owner !== fid) continue;
    const avail = m.troops - pend(m.id) - 300;
    if (avail < 1200) continue;
    const n = Math.floor(avail * 0.8), cm = commanderAt(st, fid, m.id);
    const nbs = [...B.landNb(m.id).map(id => [id, false]), ...(f.ships > 0 ? B.seaNb(m.id).filter(id => B.seaInfo(m.id, id).tier === 0).map(id => [id, true]) : [])];
    for (const [id, naval] of nbs) {
      const e = st.munis[id];
      if (!e || e.owner === fid || e.owner < 0 || peaceful(st, fid, e.owner) || st.orders.some(o => o.f === fid && o.to === id)) continue;
      const k = naval ? Math.min(n, f.ships * 1500) : n;
      if (k < 1200) continue;
      const D = defense(st, B, e), at = t => { const A = attackPower(st, f, t, naval, cm) * (naval ? 1 : crossK(st, B, m.id, id)); return { p: winChance(A, D, t, e.troops), big: winChance(A, D, t, e.troops) >= 0.97 && A / Math.max(1, D) > 2 }; };
      let t = k, o = at(k);
      if (o.p < 0.75) continue;
      // 「大勝」に届くいちばん少ない兵で（2026-10-20 本人指摘。どこからも8割を送っていたので、どれも勝率100%で、町ががら空きになった）
      if (o.big) { let lo = 1200, hi = k; while (hi - lo > 100) { const mid = Math.round((lo + hi) / 200) * 100; if (at(mid).big) hi = mid; else lo = mid; } if (at(lo).big) hi = lo; t = hi; o = at(t); }
      cand.push({ from: m.id, at: id, troops: t, p: o.p, big: o.big, naval, val: o.p * (1 + B.info.get(id).pop / 200000) * (st.factions.some(x => x.capital === id) ? 1.5 : 1) });
    }
  }
  cand.sort((a, b) => b.val - a.val);
  const used = new Set(), hit = new Set(), out = [];
  for (const c of cand) {
    if (out.length >= f.ap * 2) break;
    if (used.has(c.from) || hit.has(c.at)) continue;
    used.add(c.from); hit.add(c.at); out.push(c);
  }
  return out;
}
export function soseme(st, B, fid) {
  const f = st.factions[fid], plan = sosemePlan(st, B, fid);
  if (!plan.length) return '「有利」以上で攻められる町がありません';
  const ap = f.ap;
  let n = 0;
  for (const c of plan) { f.ap = 1; if (commandRaw(st, B, fid, { type: c.naval ? 'tokai' : 'shutsujin', from: c.from, at: c.at, troops: c.troops }) === true) n++; }
  f.ap = Math.max(0, ap - Math.ceil(n / 2));
  return n || '出陣できませんでした';
}
function commandRaw(st, B, fid, cmd) {
  const f = st.factions[fid];
  if (st.over) return '決着がついています';
  if (f.ap <= 0) return '行動力がありません';
  if (DIPLO[cmd.type]) return diplomacy(st, B, fid, cmd);
  if (cmd.type === 'scout') {
    const o = (st.officers || []).find(x => x.id === cmd.target);
    if (!o || o.f === fid) return '相手がいません';
    if (officersOf(st, fid).length >= officerCap(st, fid)) return `人材は${officerCap(st, fid)}人までです（市町村100ごとに2人増える）`;
    const T = scoutTerms(st, B, fid, o);
    if (f.gold < T.gold) return '予算が足りません';
    f.gold -= T.gold;
    const r = rng(st.rs + st.turn * 97 + o.id * 13 + fid);
    if (r() < T.chance) {
      const from = o.f;
      o.f = fid; o.at = null; o.gov = null;
      if (from >= 0) addRel(st, fid, from, -10);
      cmd.result = { ok: true, name: o.name, from };
    } else { if (o.f >= 0) addRel(st, fid, o.f, -5); cmd.result = { ok: false, name: o.name }; }
    f.ap--;
    return true;
  }
  const m = st.munis[cmd.at];
  if (!m) return '対象がありません';
  const own = m.owner === fid;
  const C = COMMANDS[cmd.type];
  if (!C) return '不明なコマンド';
  const pend = st.orders.filter(o => o.f === fid && o.from === cmd.at).reduce((a, o) => a + o.troops, 0);
  switch (cmd.type) {
    case 'kaikon': case 'shokusan': case 'shogyo': case 'chikujo': {
      if (!own) return '自領ではありません';
      const key = { kaikon: 'agri', shokusan: 'ind', shogyo: 'com', chikujo: 'fort' }[cmd.type];
      if (m[key] >= MAXLV[key]) return 'これ以上は上げられません';
      const steps = Math.max(1, Math.min(cmd.x || 1, 3, MAXLV[key] - m[key]));   // まとめて行う段数
      const c1 = costOf(st, B, m.id, C.cost, cmd.type), c = { gold: (c1.gold || 0) * steps, food: (c1.food || 0) * steps, arms: (c1.arms || 0) * steps };
      if (!canPay(f, c)) return '足りません';
      pay(f, c); m[key] += steps; cmd.result = steps; break;
    }
    case 'hodokoshi':
      if (!own) return '自領ではありません';
      { const c = costOf(st, B, m.id, C.cost, cmd.type);
        if (!canPay(f, c)) return '兵糧が足りません';
        pay(f, c); m.morale = clamp(m.morale + 0.12, 0, 1); addShiki(f, 0.02); } break;
    case 'toyo': {
      if (!own) return '自領ではありません';
      if (officersOf(st, fid).length >= officerCap(st, fid)) return `人材は${officerCap(st, fid)}人までです（市町村100ごとに2人増える）`;
      if (!canPay(f, C.cost)) return '予算が足りません';
      pay(f, C.cost);
      const r = rng(st.rs + st.turn * 53 + m.id * 7 + fid);
      const ronin = st.officers.find(o => o.f === -1 && o.at === m.id);
      if (ronin && r() < 0.75 + bestInt(st, fid) / 400) { ronin.f = fid; ronin.at = officersOf(st, fid).some(x => x.at === m.id && x !== ronin) ? null : m.id; cmd.result = ronin; break; }
      const p = toyoChance(st, B, fid, m.id);
      if (r() < p) {
        const i = B.info.get(m.id), urban = i.n.town / Math.max(1, i.n.cells), mountain = i.n.hAvg > 250;
        const o = makeOfficer(st, r, fid, { pol: urban > 0.15 ? 15 : 0, war: mountain ? 15 : 0, int: 0, trait: i.port && r() < 0.5 ? 'suigun' : mountain ? 'oni' : urban > 0.15 ? 'shosai' : 'kaikon' });
        o.at = officersOf(st, fid).some(x => x.at === m.id && x !== o) ? null : m.id;
        cmd.result = o;
      } else cmd.result = null;
      break;
    }
    case 'chohei': {
      if (!own) return '自領ではありません';
      const big = (cmd.x || 1) >= 2 ? 2 : 1;   // まとめて：2倍集める（民心は1.5倍下がる）
      const pop = B.info.get(m.id).pop, n = Math.round(clamp(pop * 0.012, 300, 6000)) * big;
      const cost = { gold: Math.ceil(n / 100) * 1.5, arms: Math.ceil(n / 300) };
      if (!canPay(f, cost)) return '予算か装備が足りません';
      pay(f, cost); m.troops += n; m.morale = clamp(m.morale - (big === 2 ? 0.09 : 0.06), 0, 1);
      cmd.result = n; (st.month ||= []).push({ type: 'draft', f: fid, at: m.id, n }); break;
    }
    case 'bohei': {
      if (!own) return '自領ではありません';
      const k = clamp(cmd.x || 1, 1, 3), c = boheiCost(f, k);
      if (!canPay(f, c)) return '予算が足りません';
      pay(f, c); m.troops += BOHEI * k;
      cmd.result = BOHEI * k; (st.month ||= []).push({ type: 'draft', f: fid, at: m.id, n: BOHEI * k }); break;
    }
    case 'zosen':
      if (!own) return '自領ではありません';
      if (!B.info.get(m.id).port) return '港がありません';
      { const c = (f.traits || []).includes('suigun') ? { gold: Math.ceil(C.cost.gold * 0.7), arms: Math.ceil(C.cost.arms * 0.7) } : C.cost;
        if (!canPay(f, c)) return '足りません';
        pay(f, c); f.ships++; } break;
    case 'shuketsu': {
      if (!own) return '自領ではありません';
      const pl = musterPlan(st, B, fid, cmd.at);
      if (pl.n < 1000) return '集められる兵がいません（奥の町に兵が少ない）';
      if (f.gold < pl.gold) return `予算が足りません（${pl.gold}いる）`;
      f.gold -= pl.gold;
      for (const [id, k] of pl.srcs) st.munis[id].troops -= k;
      m.troops += pl.n;
      for (const [id, k] of pl.srcs.slice(0, 6)) (st.month ||= []).push({ type: 'move', f: fid, from: id, to: cmd.at, n: k });   // 大きい6つだけ地図で見せる
      cmd.result = pl.n;
      break;
    }
    case 'ido': case 'shutsujin': case 'tokai': {
      const src = st.munis[cmd.from];
      if (!src || src.owner !== fid) return '出す所が自領ではありません';
      const naval = cmd.type === 'tokai';
      const nb = naval ? B.seaNb(cmd.from) : B.landNb(cmd.from);
      if (!nb.includes(cmd.at)) return naval ? '海路でつながっていません' : '隣ではありません';
      if (cmd.type === 'ido' && !own) return '移動は自領へ';
      if (cmd.type !== 'ido' && peaceful(st, fid, m.owner)) { const pc = pactOf(st, fid, m.owner); return pc ? (pc.type === 'domei' ? '同盟' : '停戦') + '中の相手です' : `開幕の備えの間は攻められません（あと${OPENING - (st.turn || 0)}か月）`; }
      if (cmd.type !== 'ido' && own) return '自領には攻めこめません';
      const avail = src.troops - st.orders.filter(o => o.f === fid && o.from === cmd.from).reduce((a, o) => a + o.troops, 0);
      let n = Math.min(cmd.troops ?? Math.floor(avail * 0.75), avail - 100);
      const tier = naval ? B.seaInfo(cmd.from, cmd.at).tier : 0;
      if (naval && f.ships < SEA[tier].ships) return `${SEA[tier].name}には船が${SEA[tier].ships}隻いります`;
      if (naval) n = Math.min(n, f.ships * 1500);
      if (n < 200) return naval ? '兵か船が足りません' : '兵が足りません';
      if (cmd.type === 'ido') { src.troops -= n; m.troops += n; (st.month ||= []).push({ type: 'move', f: fid, from: cmd.from, to: cmd.at, n }); break; }
      if (naval && tier > 0) {   // 外洋・遠洋：兵はすぐ海へ出て、日数をかけて着く
        src.troops -= n;
        (st.voyages ||= []).push({ f: fid, from: cmd.from, to: cmd.at, troops: n, tier, start: st.turn, eta: st.turn + SEA[tier].months, cmdr: commanderAt(st, fid, cmd.from)?.id ?? null });
        (st.month ||= []).push({ type: 'sail', f: fid, from: cmd.from, to: cmd.at, n, tier });
        break;
      }
      st.orders.push({ f: fid, type: cmd.type, from: cmd.from, to: cmd.at, troops: n, cmdr: commanderAt(st, fid, cmd.from)?.id ?? null });
      break;
    }
  }
  f.ap--;
  return true;
}

// ── 外交 ──
function aiAccepts(st, B, from, to, kind, r) {
  const rel = getRel(st, from, to), pf = power(st, from), pt = power(st, to);
  const alive = st.factions.filter(x => x.alive).map(x => x.id);
  const pwA = new Map(alive.map(id => [id, power(st, id)]));   // 並べ替えのたびに数え直さない
  const top = alive.slice().sort((a, b) => pwA.get(b) - pwA.get(a))[0];
  const common = top !== from && top !== to && power(st, top) > 1.25 * Math.max(pf, pt) ? 35 : 0;   // 共通の強敵がいる
  const wit = (bestInt(st, from) - 50) / 3 + (hasTrait(st, from, 'kosho') ? 15 : 0) + 5 * lvOf(st, B, from, 'sake');   // 使者の知略・酒と茶
  const k = st.factions[to]?.ai ? st.factions[to].kishitsu : null;
  const kd = k === 'giri' ? 10 : k === 'yashin' ? -5 : 0, kt = k === 'shincho' ? 15 : k === 'kosen' ? -15 : 0, kk = k === 'shonin' ? 20 : 0;
  // 弱い側が受けやすいのは、いま攻めてきている相手（ここ3か月の合戦）からだけ。約束を多く抱える相手からは受けにくい（停戦の連打で戦線を1つに絞る手が強すぎた 2026-10-20 評価）
  const pressed = st.log.some(e => e.turn >= st.turn - 3 && e.type === 'battle' && e.f === from && e.defOwner === to);
  const many = st.pacts.filter(p => (p.type === 'teisen' || p.type === 'domei') && (p.a === from || p.b === from)).length;
  // 包囲網のなかまは、囲む相手と同盟しない。停戦は自分が攻められて押されているときだけ（書状1枚で包囲網が崩れていた。叩いてから和睦すれば1つずつ崩せる）
  const co = st.coalition;
  if (co && co.target === from && co.members.includes(to)) return kind === 'teisen' && pt < pf * 0.9 && pressed && r() > 0.3;
  if (kind === 'domei') return rel + common + wit + 10 + kd >= 25 + r() * 25;
  if (kind === 'teisen') return (pt < pf * 0.9 && k !== 'kosen' && pressed && r() > many * 0.15) || rel + wit + kt - many * 6 > 10 + r() * 20;
  if (kind === 'koeki') return rel + wit + kk >= -15 + r() * 10;
  return true;
}
function diplomacy(st, B, fid, cmd) {
  const f = st.factions[fid], t = st.factions[cmd.target], D = DIPLO[cmd.type];
  if (!t || !t.alive || t.id === fid) return '相手がいません';
  const pact = pactOf(st, fid, t.id);
  if (cmd.type === 'tegire') {
    if (!pact || pact.type === 'koeki') return '同盟・停戦をしていません';
    st.pacts = st.pacts.filter(p => p !== pact);
    addRel(st, fid, t.id, -40);
    for (const x of st.factions) if (x.id !== fid && x.id !== t.id) addRel(st, fid, x.id, -10);
    cmd.result = 'done';
  } else if (cmd.type === 'okurimono') {
    if (!canPay(f, D.cost)) return '予算が足りません';
    pay(f, D.cost); t.gold += D.cost.gold; addRel(st, fid, t.id, 15); cmd.result = 'done';
  } else {
    if (pact && pact.type === cmd.type) return `もう${D.name}しています`;
    if (cmd.type !== 'koeki' && pact && (pact.type === 'domei' || pact.type === 'teisen')) return 'すでに約束があります';
    if (!canPay(f, D.cost)) return '予算が足りません';
    const r = rng(st.rs + st.turn * 31 + fid * 7 + t.id);
    const ok = t.ai ? aiAccepts(st, B, fid, t.id, cmd.type, r) : null;
    if (ok === null) {   // 相手がプレイヤー：返事待ち
      st.proposals.push({ from: fid, to: t.id, kind: cmd.type, turn: st.turn });
      cmd.result = 'asked';
    } else if (ok) {
      pay(f, D.cost);
      makePact(st, fid, t.id, cmd.type);
      cmd.result = 'accepted';
    } else { addRel(st, fid, t.id, -3); cmd.result = 'declined'; }
  }
  f.ap--;
  return true;
}
function makePact(st, a, b, type) {
  if (type !== 'koeki') st.pacts = st.pacts.filter(p => !((p.a === a && p.b === b) || (p.a === b && p.b === a)) || p.type === 'koeki');
  st.pacts.push({ a, b, type, until: st.turn + DIPLO[type].months });
  addRel(st, a, b, type === 'domei' ? 20 : 8);
}
// プレイヤーへの申し出に答える
// 臣従：弱い勢力が強い勢力に下る（領地・兵・人材がすべて移る）
function merge(st, loser, winner, ev) {
  for (const m of Object.values(st.munis)) if (m.owner === loser) { m.owner = winner; m.morale = Math.max(m.morale, 0.55); }
  const lf = st.factions[loser], wf = st.factions[winner];
  wf.gold += Math.max(0, lf.gold); wf.food += Math.max(0, lf.food); wf.arms += lf.arms; wf.ships += lf.ships;
  for (const o of st.officers || []) if (o.f === loser) { o.f = officersOf(st, winner).length < officerCap(st, winner) ? winner : -1; o.at = null; o.gov = null; }
  lf.alive = false; lf.vassalOf = winner; lf.vassalTurn = st.turn;   // 県名の札に「臣従」と出すため
  st.pacts = st.pacts.filter(p => p.a !== loser && p.b !== loser);
  ev && ev.push({ type: 'vassal', f: loser, to: winner });
  retake(st, winner, loser, wf.origCapital, ev);
}
export function respond(st, B, accept) {
  const p = st.proposals.shift();
  if (!p) return null;
  if (p.kind === 'shinju') { if (accept && st.factions[p.from].alive) merge(st, p.from, p.to, null); return p; }
  if (p.kind === 'houi') { const c = st.coalition; if (accept && c && !c.members.includes(p.to)) c.members.push(p.to); else if (!accept) addRel(st, p.from, p.to, -5); return p; }
  const from = st.factions[p.from];
  if (accept) { if (canPay(from, DIPLO[p.kind].cost)) pay(from, DIPLO[p.kind].cost); makePact(st, p.from, p.to, p.kind); }
  else addRel(st, p.from, p.to, -8);
  return p;
}

// ── CPU ──
// opt.only：この市町村だけで動く（委任）  opt.policy：naisei / mamori / seme  opt.log：した事の記録
function aiTurn(st, B, f, r, opt = {}) {
  const mine = Object.values(st.munis).filter(m => m.owner === f.id && (!opt.only || opt.only.has(m.id)));
  if (!mine.length) return;
  const policy = opt.policy || 'ai';
  const command = (st, B, fid, cmd) => {
    // 予算に余裕があるときは、内政と徴兵をまとめて行う（貯めこまない）
    if (!cmd.x && ['shogyo', 'kaikon', 'shokusan', 'chikujo', 'chohei', 'bohei'].includes(cmd.type) && st.munis[cmd.at]) {
      const one = bulkCost(st, B, cmd.at, cmd.type, 1).gold || 1, spare = f.gold - 120;
      cmd.x = cmd.type === 'chohei' ? (spare > one * 4 ? 2 : 1) : cmd.type === 'bohei' ? clamp(Math.floor(spare / Math.max(50, one)), 1, 3) : spare > one * 6 ? 3 : spare > one * 3 ? 2 : 1;
    }
    const res = commandRaw(st, B, fid, cmd); if (res === true && opt.log) opt.log.push({ type: cmd.type, at: cmd.at, from: cmd.from, target: cmd.target, troops: cmd.troops, x: cmd.x, n: cmd.type === 'chohei' ? cmd.result : cmd.troops }); return res; };
  // 人材：強い者を危ない境へ、内政の得意な者を大きな町へ
  if (!opt.only && !opt.keepOfficers && st.officers) {
    const offs = officersOf(st, f.id);
    const thr = m => B.landNb(m.id).map(id => st.munis[id]).filter(x => x && x.owner !== f.id && !peaceful(st, f.id, x.owner)).reduce((a, e) => a + e.troops, 0);
    const front = mine.filter(m => thr(m) > 0).sort((a, b) => thr(b) - thr(a));
    const big = mine.slice().sort((a, b) => B.info.get(b.id).pop - B.info.get(a.id).pop);
    for (const o of offs) o.at = null;
    const byWar = offs.slice().sort((a, b) => b.war - a.war), used = new Set();
    for (const o of byWar.slice(0, Math.ceil(offs.length / 2))) { const m = front.find(m => !used.has(m.id)) || big.find(m => !used.has(m.id)); if (m) { o.at = m.id; used.add(m.id); } }
    for (const o of offs.filter(o => o.at === null)) { const m = big.find(m => !used.has(m.id)); if (m) { o.at = m.id; used.add(m.id); } }
    if (offs.length < 6 && f.gold > 60 && r() < 0.25) command(st, B, f.id, { type: 'toyo', at: big[0].id });
  }
  const enemyNb = m => B.landNb(m.id).map(id => st.munis[id]).filter(x => x && x.owner !== f.id && !peaceful(st, f.id, x.owner));
  // 外交：ときどき同盟・停戦・交易をもちかける
  const K = kOf(f);
  // 野心家：弱った相手との約束は、得になれば破る
  if (!opt.only && f.ai && f.kishitsu === 'yashin' && f.ap > 1 && r() < 0.06) {
    const p = st.pacts.find(p => p.type !== 'koeki' && (p.a === f.id || p.b === f.id) && power(st, p.a === f.id ? p.b : p.a) < power(st, f.id) * 0.5);
    if (p) command(st, B, f.id, { type: 'tegire', target: p.a === f.id ? p.b : p.a });
  }
  if (!opt.only && !opt.noDiplo && r() < K.diplo && f.ap > 1) {
    const others = st.factions.filter(x => x.alive && x.id !== f.id);
    const pw = new Map(st.factions.filter(x => x.alive).map(x => [x.id, power(st, x.id)]));   // 並べ替えのたびに数え直さない
    const top = st.factions.filter(x => x.alive).sort((a, b) => pw.get(b.id) - pw.get(a.id))[0];
    let kind = null, tgt = null;
    if (top.id !== f.id && power(st, top.id) > power(st, f.id) * 1.3) { kind = 'domei'; tgt = others.filter(x => x.id !== top.id).sort((a, b) => getRel(st, f.id, b.id) - getRel(st, f.id, a.id))[0]; }
    const hurt = st.log.filter(e => e.turn >= st.turn - 2 && e.type === 'battle' && e.result === 'win' && e.defOwner === f.id).map(e => e.f);
    if (!kind && hurt.length && power(st, hurt[0]) > power(st, f.id)) { kind = 'teisen'; tgt = st.factions[hurt[0]]; }
    if (!kind && r() < (f.kishitsu === 'shonin' && f.ai ? 0.9 : 0.5)) { kind = 'koeki'; tgt = others[Math.floor(r() * others.length)]; }
    if (kind && tgt && !pactOf(st, f.id, tgt.id) && !st.proposals.some(p => p.from === f.id)) command(st, B, f.id, { type: kind, target: tgt.id });
  }
  const threat = m => enemyNb(m).reduce((a, e) => a + e.troops, 0);
  // 包囲網のなかまは囲む相手を狙う（使っていなかった全勢力の兵の順位づけは、重いだけなので外した 2026-10-19）
  const topId = st.coalition && st.coalition.members.includes(f.id) ? st.coalition.target : -1;
  // 地形の読み（知40で0、知90で1）：包囲している所・孤立した敵・自分の飛地をつなぐ所を狙う
  const wit = clamp(((sanboOf(st, f.id)?.int ?? 40) - 40) / 50, 0, 1);
  const comp = new Map();   // 自領のかたまり番号（陸続き）
  { let k = 0; for (const m of mine) { if (comp.has(m.id)) continue; const q = [m.id]; comp.set(m.id, k); while (q.length) { const id = q.pop(); for (const n of B.landNb(id)) if (st.munis[n]?.owner === f.id && !comp.has(n)) { comp.set(n, k); q.push(n); } } k++; } }
  const shape = e => {
    const nb = B.landNb(e.id);
    const own = nb.filter(id => st.munis[id]?.owner === f.id);
    const ring = nb.length ? own.length / nb.length : 0;   // まわりのうち自領の割合
    const joins = new Set(own.map(id => comp.get(id))).size > 1;   // 自分の飛地どうしをつなぐ
    return (1 + 0.8 * ring) * (isolated(st, B, e.id) ? 1.5 : 1) * (joins ? 1.6 : 1);
  };
  // 気質の好み：義理堅いは同盟相手を攻めた勢力を、野心家は弱った勢力（混乱・士気が低い）を狙う
  const allyFoes = new Set();
  if (f.ai && f.kishitsu === 'giri') for (const p of st.pacts) if (p.type === 'domei' && (p.a === f.id || p.b === f.id)) { const al = p.a === f.id ? p.b : p.a; for (const e of st.log) if (e.turn >= st.turn - 3 && e.type === 'battle' && e.defOwner === al) allyFoes.add(e.f); }
  const prefer = e => {
    if (!f.ai) return 1;
    const o = st.factions[e.owner];
    if (f.kishitsu === 'giri' && allyFoes.has(e.owner)) return 1.6;
    if (f.kishitsu === 'yashin' && o && (o.chaos > 0 || shikiOf(o) < 0.45)) return 1.5;
    return 1;
  };
  const tries = 40;
  let drafted = false;
  for (let k = 0; k < tries && f.ap > 0; k++) {
    // 1) 攻める：勝てそうな隣を探す（委任は「攻め」のときだけ）
    let best = null, bs = 0;
    if (policy === 'ai' || policy === 'seme') for (const m of mine) {
      const avail = m.troops - 300 - st.orders.filter(o => o.from === m.id).reduce((a, o) => a + o.troops, 0);
      if (avail < 1200) continue;
      for (const e of enemyNb(m)) {
        if (st.orders.some(o => o.f === f.id && o.from === m.id && o.to === e.id)) continue;   // 同じ所から同じ相手へはくり返さない
        const A = attackPower(st, f, avail * 0.8, false, commanderAt(st, f.id, m.id)) * crossK(st, B, m.id, e.id), D = defense(st, B, e);
        const capBonus = st.factions.some(x => x.capital === e.id) ? 2.0 : 1;
        // 知が低いほど見立てがぶれる
        const score = (A / Math.max(1, D)) * capBonus * (e.owner === topId ? 1.5 : 1) * (1 + wit * (shape(e) - 1)) * (1 - 0.2 - 0.25 * (1 - wit) + r() * (0.4 + 0.5 * (1 - wit)));
        if (A > D * K.atk * (e.owner === st.player ? levelOf(st).atk : 1) && score * prefer(e) > bs) { bs = score * prefer(e); best = { from: m.id, at: e.id, troops: Math.floor(avail * 0.8), type: 'shutsujin' }; }
      }
      // 渡海（冬と台風の季節は控える・船があるとき）。外洋・遠洋は船団が1つ出ているあいだは出さない
      if (f.ships > 0 && !isWinter(st)) for (const id of B.seaNb(m.id)) {
        const e = st.munis[id];
        if (!e || e.owner === f.id || peaceful(st, f.id, e.owner)) continue;
        if (st.orders.some(o => o.f === f.id && o.from === m.id && o.to === id)) continue;   // 同じ所から同じ相手へはくり返さない（参謀が同じ渡海を5回勧めていた）
        const tier = B.seaInfo(m.id, id).tier;
        if (f.ships < SEA[tier].ships) continue;
        if (tier > 0 && ((st.voyages || []).some(v => v.f === f.id) || isTyphoon(st, B, id) || f.gold < 40 * tier)) continue;
        const n = Math.min(Math.floor(avail * 0.7), f.ships * 1500);
        if (n < 1200) continue;
        const A = attackPower(st, f, n, true, commanderAt(st, f.id, m.id)), D = defense(st, B, e);
        const need = [1.6, 1.9, 2.3][tier] * (e.owner === topId ? 0.85 : 1), sc = A / D * [0.8, 0.7, 0.6][tier] * (st.factions.some(x => x.capital === id) ? 1.6 : 1) * (e.owner === topId ? 1.5 : 1);
        if (A > D * need * K.atk / 1.25 * (e.owner === st.player ? levelOf(st).atk : 1) && sc * prefer(e) > bs) { bs = sc * prefer(e); best = { from: m.id, at: id, troops: n, type: 'tokai' }; }
      }
    }
    if (best && command(st, B, f.id, best) === true) {
      // 挟み撃ち：同じ相手に隣り合うほかの自領からも、余った兵で加わる
      if (best.type === 'shutsujin' && r() < 0.35 + 0.65 * wit) for (const m of mine) {
        if (f.ap <= 0) break;
        if (m.id === best.from || !B.landNb(m.id).includes(best.at)) continue;
        const sp = m.troops - 600 - st.orders.filter(o => o.from === m.id).reduce((a, o) => a + o.troops, 0) - (enemyNb(m).length > 1 ? 800 : 0);
        if (sp >= 800) command(st, B, f.id, { type: 'shutsujin', from: m.id, at: best.at, troops: Math.floor(sp * 0.8) });
      }
      continue;
    }
    // 2) 守る：脅かされている所で徴兵、なければ奥から前へ動かす
    const front = mine.filter(m => threat(m) > 0).sort((a, b) => threat(b) / (b.troops + 1) - threat(a) / (a.troops + 1));
    // 内政方針の知事代理は、かなり危ないときに月1回だけ兵を集める
    const danger = policy === 'naisei' ? 1.6 : 1.1, mayDraft = policy !== 'naisei' || !drafted;
    if (front.length && threat(front[0]) > front[0].troops * danger) {
      if (mayDraft && f.gold > 25 && f.arms > 8 && command(st, B, f.id, { type: 'chohei', at: front[0].id }) === true) { drafted = true; continue; }
      const back = mine.filter(m => !threat(m) && m.troops > 1500 && B.landNb(m.id).includes(front[0].id));
      if (back.length && command(st, B, f.id, { type: 'ido', from: back[0].id, at: front[0].id, troops: back[0].troops - 500 }) === true) continue;
    }
    // 3) 戦力をためる（委任の「内政」はしない）
    // 募兵：予算と兵糧が余っていれば、前線の町で兵を雇う。徴兵より先に（徴兵が行動力を使いきって、予算が1万を超えて貯まっていた 2026-10-20）
    if (!opt.only && policy !== 'naisei' && f.gold > 200 + boheiCost(f, 1).gold) {
      const border = mine.filter(m => B.landNb(m.id).some(id => st.munis[id] && st.munis[id].owner >= 0 && st.munis[id].owner !== f.id && !peaceful(st, f.id, st.munis[id].owner)));
      const tgt = front[0] || border.sort((a, b) => b.troops - a.troops)[0];
      if (tgt && command(st, B, f.id, { type: 'bohei', at: tgt.id }) === true) continue;
    }
    if (policy === 'mamori' && f.gold > 30) { const m = (front[0] || mine[0]); if (m.fort < MAXLV.fort && command(st, B, f.id, { type: 'chikujo', at: m.id }) === true) continue; }
    if (policy !== 'naisei' && f.gold > (policy === 'ai' ? 70 : 35) && f.arms > 15 && r() < (policy === 'ai' ? K.draft : 0.7)) {
      // 脅かされている町がなければ、よその勢力と接する町のうち大きい町（開幕の備えの間も。奥の本拠に兵がたまって前へ出せなかった）
      const border = mine.filter(m => B.landNb(m.id).some(id => st.munis[id] && st.munis[id].owner !== f.id)).sort((a, b) => B.info.get(b.id).pop - B.info.get(a.id).pop);
      const tgt = (front[0] || border[0] || mine.sort((a, b) => B.info.get(b.id).pop - B.info.get(a.id).pop)[0]);
      if (command(st, B, f.id, { type: 'chohei', at: tgt.id }) === true) continue;
    }
    // 4) 内政
    if (f.food > 60 && mine.some(m => m.morale < 0.5)) { const m = mine.filter(m => m.morale < 0.5)[0]; if (command(st, B, f.id, { type: 'hodokoshi', at: m.id }) === true) continue; }
    // 海の向こうに弱い敵がいれば船を造る（島は船でしか取れない）
    // 海の向こうに敵がいれば船を造る（島は船でしか取れない。遠洋なら4隻まで）
    if (!opt.only && f.gold > 45 && f.arms > 12) {
      let want = 0, port = null;
      for (const m of mine) { if (!B.info.get(m.id).port) continue; for (const id of B.seaNb(m.id)) { const e = st.munis[id]; if (e && e.owner !== f.id) { const t = B.seaInfo(m.id, id).tier; if (SEA[t].ships > want) { want = SEA[t].ships; port = m; } } } }
      if (port && f.ships < Math.min(6, want + 1) && r() < 0.35 && command(st, B, f.id, { type: 'zosen', at: port.id }) === true) continue;
    }
    if (f.gold > (opt.only ? 18 : 40)) {
      const big = mine.slice().sort((a, b) => B.info.get(b.id).pop - B.info.get(a.id).pop);
      const t = ['shogyo', 'kaikon', 'shokusan'][Math.floor(r() * 3)];
      const key = { shogyo: 'com', kaikon: 'agri', shokusan: 'ind' }[t];
      const cand = big.filter(m => m[key] < MAXLV[key]).slice(0, 4);
      const m = cand[Math.floor(r() * cand.length)];
      if (m && command(st, B, f.id, { type: t, at: m.id }) === true) continue;
    }
    break;
  }
  // 兵を前へ：奥の兵を、境（陸の敵）か海の向こうを狙う港へ一歩ずつ寄せる
  if (f.ap > 0 && !opt.only && policy !== 'naisei') {
    const goal = new Set();
    for (const m of mine) {
      if (enemyNb(m).length) goal.add(m.id);
      else if (f.ships > 0 && B.info.get(m.id).port && B.seaNb(m.id).some(id => { const e = st.munis[id]; return e && e.owner !== f.id && !peaceful(st, f.id, e.owner); })) goal.add(m.id);
    }
    if (goal.size) {
      const own = new Set(mine.map(m => m.id)), dist = new Map([...goal].map(id => [id, 0])), q = [...goal];
      for (let h = 0; h < q.length; h++) for (const n of B.landNb(q[h])) if (own.has(n) && !dist.has(n)) { dist.set(n, dist.get(q[h]) + 1); q.push(n); }
      // 奥に大軍がたまっていたら、いちばん敵の兵が迫る（なければ敵と多く接する）境の町へ集結（月1回）
      const fronts = mine.filter(m => goal.has(m.id) && enemyNb(m).length).sort((a, b) => (threat(b) - threat(a)) || (enemyNb(b).length - enemyNb(a).length));
      if (fronts.length && f.ap > 0) {
        const pl = musterPlan(st, B, f.id, fronts[0].id);
        if (pl.n >= Math.max(3000, fronts[0].troops * 0.5) && f.gold >= pl.gold + 30) command(st, B, f.id, { type: 'shuketsu', at: fronts[0].id });
      }
      const movers = mine.filter(m => (dist.get(m.id) || 0) > 0 && m.troops > 1500).sort((a, b) => b.troops - a.troops).slice(0, 2);
      for (const m of movers) {
        if (f.ap <= 0) break;
        const d = dist.get(m.id), next = B.landNb(m.id).find(n => own.has(n) && dist.get(n) === d - 1);
        if (next) command(st, B, f.id, { type: 'ido', from: m.id, at: next, troops: Math.floor((m.troops - 300) * 0.7) });
      }
    }
  }
}

// ── 参謀の進言：CPU と同じ考え方で、写しの盤面に今月の手を打たせてみる ──
export function suggest(st, B, fid, salt = 0) {
  const c = JSON.parse(JSON.stringify(st));
  const f = c.factions[fid];
  if (!f || f.ap <= 0) return [];
  const log = [];
  aiTurn(c, B, f, rng((st.rs ^ (salt * 2654435761)) + 77), { log, keepOfficers: true });
  return log.slice(0, 3);
}

// 方針つきで、写しの盤面に今月の手を全部打たせてみる（策の候補）
export function aiPlan(st, B, fid, salt = 0, policy = 'ai') {
  const c = JSON.parse(JSON.stringify(st));
  const f = c.factions[fid];
  if (!f || f.ap <= 0) return [];
  const log = [];
  aiTurn(c, B, f, rng((st.rs ^ (salt * 2654435761)) + 91), { log, keepOfficers: true, policy, noDiplo: policy !== 'ai' });
  return log;
}

// 参謀の進言を「戦・外交・産業」に分けて、それぞれ見込みの数字つきで返す
export function advise(st, B, fid, salt = 0) {
  const f = st.factions[fid];
  const out = { war: [], diplo: [], econ: [], people: [] };
  if (!f || !f.alive) return out;
  // 戦：CPU と同じ見立て
  out.war = suggest(st, B, fid, salt).filter(a => ['shutsujin', 'tokai', 'chohei', 'ido', 'chikujo', 'zosen'].includes(a.type)).slice(0, 2);
  // 外交
  const alive = st.factions.filter(x => x.alive && x.id !== fid);
  const pw = id => power(st, id);
  const border = new Map();   // 隣り合う勢力 → 境の数
  for (const m of Object.values(st.munis)) if (m.owner === fid) for (const id of B.landNb(m.id)) { const e = st.munis[id]; if (e && e.owner !== fid) border.set(e.owner, (border.get(e.owner) || 0) + 1); }
  const top = alive.slice().sort((a, b) => pw(b.id) - pw(a.id))[0];
  if (top && border.has(top.id) && pw(top.id) > pw(fid) * 1.2) {
    // 強敵と接している：その強敵と隣り合うほかの勢力と組む
    const cand = alive.filter(x => x.id !== top.id && !pactOf(st, fid, x.id)).sort((a, b) => getRel(st, fid, b.id) - getRel(st, fid, a.id))[0];
    if (cand) out.diplo.push({ type: 'domei', target: cand.id, why: `${top.name}勢が強い（兵${Math.round(pw(top.id)).toLocaleString()}）。${cand.name}勢と組んで背中を守る`, rel: Math.round(getRel(st, fid, cand.id)) });
  }
  const hurt = st.log.filter(e => e.turn >= st.turn - 3 && e.type === 'battle' && e.result === 'win' && e.defOwner === fid).map(e => e.f);
  const attacker = hurt.length ? st.factions[hurt[hurt.length - 1]] : null;
  if (attacker && attacker.alive && !peaceful(st, fid, attacker.id) && pw(attacker.id) > pw(fid) * 0.8) out.diplo.push({ type: 'teisen', target: attacker.id, why: `${attacker.name}勢に押されている。6か月の停戦で立て直す` });
  const tradeTo = alive.filter(x => !pactOf(st, fid, x.id) && getRel(st, fid, x.id) > -15).map(x => ({ x, c: cards(st, B, x.id).length })).sort((a, b) => b.c - a.c)[0];
  if (tradeTo && tradeTo.c > 0) out.diplo.push({ type: 'koeki', target: tradeTo.x.id, why: `${tradeTo.x.name}勢は名産の町を${tradeTo.c}つ持つ。毎月の予算 +${(3 + 1.5 * Math.min(6, tradeTo.c)).toFixed(1)}` });
  const warm = alive.filter(x => !pactOf(st, fid, x.id) && border.has(x.id)).map(x => ({ x, r: getRel(st, fid, x.id) })).filter(o => o.r > -5 && o.r < 25).sort((a, b) => b.r - a.r)[0];
  if (warm && f.gold > 60) out.diplo.push({ type: 'okurimono', target: warm.x.id, why: `${warm.x.name}勢とはあと少しで組める（関係${Math.round(warm.r)}）。贈り物で仲を深める` });
  // 背中を固める：敵が2つ以上いて、いちばん強い相手が自分より強ければ、そこと停戦して弱い方を攻める
  const hostile = [...border.keys()].filter(g => !peaceful(st, fid, g) && st.factions[g].alive);
  if (hostile.length >= 2) {
    const strong = hostile.slice().sort((a, b) => pw(b) - pw(a))[0], weak = hostile.slice().sort((a, b) => pw(a) - pw(b))[0];
    if (pw(strong) > pw(fid) * 0.9 && !pactOf(st, fid, strong)) out.diplo.unshift({ type: getRel(st, fid, strong) > 0 ? 'domei' : 'teisen', target: strong, why: `${st.factions[strong].name}勢（兵${Math.round(pw(strong)).toLocaleString()}）と組んで背中を固めれば、${st.factions[weak].name}勢に兵を回せる` });
  }
  // 同盟相手が攻められている：その敵を一緒に叩く
  for (const p of st.pacts) {
    if (p.type !== 'domei' || (p.a !== fid && p.b !== fid)) continue;
    const ally = p.a === fid ? p.b : p.a;
    const foe = st.log.filter(e => e.turn >= st.turn - 1 && e.type === 'battle' && e.defOwner === ally && e.result === 'win').map(e => e.f).find(g => g !== fid && border.has(g) && !peaceful(st, fid, g));
    if (foe !== undefined) out.diplo.push({ type: 'note', target: foe, why: `同盟の${st.factions[ally].name}勢が${st.factions[foe].name}勢に攻められている。隣り合う所から挟めば有利` });
  }
  // まわりの同盟：自分を囲む組がないか
  const ring = st.pacts.filter(p => p.type === 'domei' && border.has(p.a) && border.has(p.b) && !peaceful(st, fid, p.a) && !peaceful(st, fid, p.b));
  if (ring.length) { const p = ring[0]; out.diplo.push({ type: 'note', target: p.a, why: `${st.factions[p.a].name}勢と${st.factions[p.b].name}勢が同盟している。両方を相手にしないよう、どちらかと約束を` }); }
  for (const p of st.pacts) if ((p.a === fid || p.b === fid) && p.type !== 'koeki' && p.until - st.turn <= 2) { const o = p.a === fid ? p.b : p.a; out.diplo.push({ type: 'note', target: o, why: `${st.factions[o].name}勢との${DIPLO[p.type].name}はあと${p.until - st.turn}か月。切れたら結び直す` }); }
  out.diplo = out.diplo.slice(0, 3);
  // 産業：毎月の増え方を比べる
  const mine = Object.values(st.munis).filter(m => m.owner === fid);
  const cands = [];
  for (const m of mine) {
    const i = B.info.get(m.id), n = i.n;
    if (m.com < MAXLV.com) { const g = i.pop / 10000 * 0.5 * (0.6 + m.morale * 0.6) * 0.1; const c = commandCost(st, B, m.id, 'shogyo').gold || 1; cands.push({ type: 'shogyo', at: m.id, gain: g, per: g / c, why: `予算 +${g.toFixed(1)}／月` }); }
    if (m.agri < MAXLV.agri) { const h = (n.paddy + n.farm * 0.55) / 230 * 0.3 * (0.7 + m.morale * 0.4); const c = commandCost(st, B, m.id, 'kaikon').gold || 1; const soon = st.date.m >= 4 && st.date.m <= 9; cands.push({ type: 'kaikon', at: m.id, gain: h, per: h / 12 / c * (soon ? 1.3 : 1), why: `秋の兵糧 +${h.toFixed(1)}${soon ? '（今年の秋から）' : ''}` }); }
    if (m.ind < MAXLV.ind) { const a = (n.town * 0.0009 + 0.25) * B.industry(m.id) * 0.3; const c = commandCost(st, B, m.id, 'shokusan').gold || 1; cands.push({ type: 'shokusan', at: m.id, gain: a, per: a * 0.6 / c, why: `装備 +${a.toFixed(1)}／月` }); }
    if (m.morale < 0.5) cands.push({ type: 'hodokoshi', at: m.id, gain: 0.12, per: 1, why: `民心${Math.round(m.morale * 100)}→${Math.round((m.morale + 0.12) * 100)}。収入と知事選に効く` });
  }
  // 予算と兵糧が余っているときは募兵を先頭に（使いきれずに貯まる一方だった 2026-10-20）
  if (f.gold > 200 + boheiCost(f, 1).gold) {
    const border = mine.filter(m => B.landNb(m.id).some(id => st.munis[id] && st.munis[id].owner >= 0 && st.munis[id].owner !== fid && !peaceful(st, fid, st.munis[id].owner))).sort((a, b) => b.troops - a.troops);
    let k = 3; while (k > 1 && f.gold - boheiCost(f, k).gold < 120) k--;
    if (border[0]) cands.push({ type: 'bohei', at: border[0].id, x: k, gain: BOHEI * k, per: 50, why: `予算${Math.round(f.gold)}が余っている。兵 +${(BOHEI * k).toLocaleString()}（民心は下がらない）` });
  }
  // 知事選が近く、支持が危ういときは地元の大きな町の祭りを先頭に
  if (fid === st.player && ELECTION_EVERY - (st.turn % ELECTION_EVERY) <= 12 && (st.poll ?? pollOf(st, B, fid)) < 0.58) {
    const fe = electionFestivals(st, B, fid, 1)[0];
    if (fe) { const m = st.munis[fe.at]; for (let k = cands.length - 1; k >= 0; k--) if (cands[k].type === 'hodokoshi') cands.splice(k, 1); cands.push({ ...fe, gain: 0.12, per: 99, why: `民心${Math.round(m.morale * 100)}→${Math.round(Math.min(1, m.morale + 0.12) * 100)}。${fe.why}` }); }
  }
  cands.sort((a, b) => b.per - a.per);
  const seen = new Set();
  for (const c of cands) { if (seen.has(c.type)) continue; seen.add(c.type); out.econ.push(c); if (out.econ.length >= 2) break; }
  // 人材：向き不向きで置き場所・委任・登用
  {
    const offs = officersOf(st, fid);
    const mineAll = Object.values(st.munis).filter(m => m.owner === fid);
    const threatOf = m => B.landNb(m.id).map(id => st.munis[id]).filter(e => e && e.owner !== fid && !peaceful(st, fid, e.owner)).reduce((a, e) => a + e.troops, 0);
    const fronts = mineAll.map(m => ({ m, t: threatOf(m) })).filter(o => o.t > 0).sort((a, b) => b.t / (b.m.troops + 1) - a.t / (a.m.troops + 1));
    const taken = new Set(offs.filter(o => o.at).map(o => o.at));
    const idle = offs.filter(o => !o.at && !o.gov);
    const big = mineAll.slice().sort((a, b) => B.info.get(b.id).pop - B.info.get(a.id).pop);
    const seaTarget = m => B.info.get(m.id).port && B.seaNb(m.id).some(id => st.munis[id] && st.munis[id].owner !== fid);
    for (const o of idle.slice().sort((a, b) => Math.max(b.war, b.pol) - Math.max(a.war, a.pol))) {
      let at = null, why = '';
      if (o.trait === 'suigun') { const m = mineAll.find(m => !taken.has(m.id) && seaTarget(m)); if (m) { at = m.id; why = `水軍。海の向こうを攻める港に置くと渡海+20%`; } }
      if (!at && (o.war >= o.pol || o.trait === 'oni' || o.trait === 'chikujo')) { const fr = fronts.find(x => !taken.has(x.m.id)); if (fr) { at = fr.m.id; why = `武${o.war}${o.trait === 'chikujo' ? '・築城名人' : o.trait === 'oni' ? '・鬼武者' : ''}。境の兵${Math.round(fr.t).toLocaleString()}人に備える`; } }
      if (!at && o.trait === 'kaikon') { const m = mineAll.filter(m => !taken.has(m.id)).sort((a, b) => (B.info.get(b.id).n.paddy + B.info.get(b.id).n.farm) - (B.info.get(a.id).n.paddy + B.info.get(a.id).n.farm))[0]; if (m) { at = m.id; why = '開墾上手。田畑の多い所で収穫+10%・開墾が半額'; } }
      if (!at) { const m = big.find(m => !taken.has(m.id)); if (m) { at = m.id; why = `政${o.pol}${o.trait === 'shosai' ? '・商才' : ''}。大きな町の内政が安くなる`; } }
      if (at) { taken.add(at); out.people.push({ type: 'haichi', oid: o.id, name: o.name, at, why }); }
      if (out.people.length >= 2) break;
    }
    // 委任：取った県を任せる
    if (st.player === fid) {
      const prefs = {};
      for (const m of mineAll) { const p = B.info.get(m.id).pref; prefs[p] = (prefs[p] || 0) + 1; }
      const home = st.factions[fid].pref;
      const cand = Object.entries(prefs).filter(([p, n]) => p !== home && n >= 3 && !(st.delegs || {})[p]).sort((a, b) => b[1] - a[1])[0];
      const gov = offs.filter(o => !o.gov && o.pol >= 55).sort((a, b) => b.pol - a.pol)[0];
      if (cand && gov) out.people.push({ type: 'deleg', oid: gov.id, name: gov.name, pref: cand[0], why: `${cand[1]}市町村。政${gov.pol}の${gov.name}に内政を任せれば、行動力を戦に回せる` });
    }
    if (offs.length < 5 && f.gold >= 20 && big[0]) out.people.push({ type: 'toyo', at: big[0].id, why: `人材は${offs.length}人。大きな町ほど見つかりやすい` });
    // 捕らえられそうな城代
    const near = new Set();
    for (const m of mineAll) for (const id of B.landNb(m.id)) { const e = st.munis[id]; if (e && e.owner !== fid && !peaceful(st, fid, e.owner)) near.add(id); }
    const prize = (st.officers || []).filter(o => o.f >= 0 && o.f !== fid && o.at && near.has(o.at)).sort((a, b) => Math.max(b.pol, b.war, b.int) - Math.max(a.pol, a.war, a.int))[0];
    if (prize && Math.max(prize.pol, prize.war, prize.int) >= 75) out.people.push({ type: 'prize', at: prize.at, name: prize.name, why: `${B.info.get(prize.at).name}の城代・${prize.name}（政${prize.pol}・武${prize.war}・知${prize.int}）。落とせば捕らえられるかも` });
    out.people = out.people.slice(0, 3);
  }
  // 名産：あと1枚
  // 名産：あと1つで次のレベルになる種類があれば、隣の敵地でその名産のある町を勧める
  { const bl = brandLv(st, B, fid), near = new Set();
    for (const m of Object.values(st.munis)) if (m.owner === fid) for (const id of B.landNb(m.id)) if (st.munis[id] && st.munis[id].owner !== fid) near.add(id);
    for (const [k, x] of Object.entries(bl)) {
      const next = BRAND_STEPS.find(v => v > x.n);
      if (!next || next - x.n !== 1) continue;
      const cand = [...near].find(id => (B.meisan?.get(id) || []).some(y => y.cat === k));
      if (cand) { const ms = B.meisan.get(cand).find(y => y.cat === k); out.econ.push({ type: 'meisan', at: cand, name: ms.name, why: `${ms.name}の町を取ると「${BRANDS[k].name}」がLv${x.lv + 1}に：${BRANDS[k].effect}×${x.lv + 1}` }); break; }
    }
  }
  return out;
}

// ── 合戦 ──
function battle(st, B, o, r, ev) {
  const f = st.factions[o.f], src = st.munis[o.from], dst = st.munis[o.to];
  const e = { type: 'battle', f: o.f, from: o.from, to: o.to, troops: o.troops, naval: o.type === 'tokai', defOwner: dst.owner, defTroops: dst.troops, flank: o.flank || 0, froms: o.froms || [] };
  const tier = e.naval ? (o.voyage ?? 0) : 0;
  e.tier = tier;
  const goHome = n => { if (src.owner === o.f) src.troops += n; };   // 帰る所が取られていたら散る
  if (o.voyage === undefined) {
    if (src.owner !== o.f) { e.result = 'cancel'; ev.push(e); return; }   // 出陣元を先に取られた（兵は散る）
    // 主力の町から出すのは自分の分だけ（合同攻めのほかの隊は、まとめるときに引いてある）。先に攻められて兵が減っていたら、いる分だけ
    const own = o.parts ? o.parts[0][1] : o.troops, sent = Math.min(own, Math.max(0, src.troops));
    src.troops -= sent;
    if (sent < own) { o = { ...o, troops: o.troops - (own - sent) }; e.troops = o.troops; }
    if (o.troops < 200) { goHome(o.troops); e.result = 'cancel'; ev.push(e); return; }
  }
  if (dst.owner === o.f) { dst.troops += o.troops; e.result = 'joined'; ev.push(e); return; }
  if (peaceful(st, o.f, dst.owner)) { goHome(o.troops); e.result = 'cancel'; ev.push(e); return; }   // 渡るあいだに約束ができた
  addRel(st, o.f, dst.owner, -20);
  let troops = o.troops;
  if (e.naval) {
    const cm = o.cmdr ? st.officers.find(x => x.id === o.cmdr && x.f === o.f) : null;
    if (r() < stormChance(st, B, tier, o.to, cm)) {   // 時化・台風で引き返す（外洋・遠洋は船も兵も失う）
      const lost = Math.round(troops * SEA[tier].lose);
      goHome(troops - lost);
      e.result = 'storm'; e.lost = lost; e.typhoon = isTyphoon(st, B, o.to); ev.push(e); return;
    }
    const df = st.factions[dst.owner];
    if (df.ships > 0) {
      const p = df.ships / (df.ships + f.ships) * SEA[tier].intercept;
      if (r() < p) { const lost = Math.round(troops * 0.3); troops -= lost; e.intercepted = lost; f.ships = Math.max(0, f.ships - 1); }
    }
  }
  f.arms = Math.max(0, f.arms - troops / 500);
  const cmdr = o.cmdr && st.officers ? st.officers.find(x => x.id === o.cmdr && x.f === o.f) : null;
  if (cmdr) e.cmdr = cmdr.id;
  const parts = o.parts || [[o.from, o.troops]], pt = parts.reduce((a, p) => a + p[1], 0) || 1;
  const cross = e.naval ? 1 : parts.reduce((a, p) => a + p[1] * crossK(st, B, p[0], o.to), 0) / pt;   // 峠越えの重み（合同攻めは兵の数で平均）
  if (cross < 0.9) e.pass = B.pass(o.from, o.to);
  const A = attackPower(st, f, troops, e.naval, cmdr) * (1 + 0.15 * (o.flank || 0)) * cross, D = defense(st, B, dst);
  const ta = tallyOf(st, o.f), defF = st.factions[dst.owner];
  if (++ta.fights > 3) addShiki(f, -0.02);   // 連戦の疲れ
  const share = A / (A + D);
  const attLoss = Math.round(troops * clamp(0.12 + 0.38 * (1 - share) + r() * 0.08, 0, 0.95));
  const defLoss = Math.round(dst.troops * clamp(0.12 + 0.5 * share + r() * 0.08, 0, 1));
  const left = troops - attLoss;
  dst.troops -= defLoss;
  e.attLoss = attLoss; e.defLoss = defLoss;
  if (A * (0.9 + r() * 0.2) > D * 1.1 && left > dst.troops) {
    // 占領。残った守備兵は隣の味方へ退く（いなければ散る）
    const prevOwner = dst.owner;
    // 城代は捕まる。こちらに付くか、本拠へ逃げる
    const capt = st.officers ? st.officers.find(x => x.f === prevOwner && x.at === dst.id) : null;
    if (capt) {
      const join = r() < 0.4 + (bestInt(st, o.f) - capt.int) / 200 && officersOf(st, o.f).length < officerCap(st, o.f);
      if (join) { capt.f = o.f; capt.at = null; capt.gov = null; ev.push({ type: 'officer', oid: capt.id, name: capt.name, joined: true, to: o.f, from: prevOwner }); }
      else { capt.at = null; ev.push({ type: 'officer', oid: capt.id, name: capt.name, joined: false, from: prevOwner }); }
    }
    const retreat = B.landNb(dst.id).map(id => st.munis[id]).find(x => x && x.owner === prevOwner);
    if (retreat) retreat.troops += dst.troops;
    dst.owner = o.f; dst.troops = left; dst.morale = Math.min(dst.morale, 0.4); dst.fort = Math.max(0, dst.fort - 1);
    dst.camp = CAMP + 1;   // 陣を張る（この月の終わりに1減り、次の月から守り×2.0→1.75→1.5→1.25）
    e.result = 'win';
    ev.push(e);
    feud(st, o.f, prevOwner, 1);
    ta.win++; addShiki(f, 0.05);
    if (defF) { tallyOf(st, prevOwner).lost++; addShiki(defF, -0.025); }
    onCapture(st, B, dst, prevOwner, o.f, r, ev);
  } else {
    goHome(left);   // 引きあげる
    e.result = 'lose';
    ev.push(e);
    ta.lose++; addShiki(f, -0.05);
    if (defF) addShiki(defF, 0.03);   // 守りきった
  }
}

// 奪還：もとの県庁を取り返したら、本拠をそこへ戻す（合戦でも、寝返り・降伏・臣従で戻ってきても）
function retake(st, winner, loser, id, ev) {
  const wf = st.factions[winner], m = st.munis[id];
  if (!wf || !m || id !== wf.origCapital || m.owner !== winner || wf.capital === id) return;
  wf.capital = id; addShiki(wf, 0.15);
  if (ev) ev.push({ type: 'retake', f: winner, from: loser, at: id });
}
function onCapture(st, B, m, loser, winner, r, ev) {
  retake(st, winner, loser, m.id, ev);
  const lf = st.factions[loser];
  const left = Object.values(st.munis).filter(x => x.owner === loser);
  if (!left.length) { lf.alive = false; ev.push({ type: 'fall', f: loser, by: winner }); if (st.officers) st.officers = st.officers.filter(o => o.f !== loser); return; }
  if (lf.capital !== m.id) return;
  // 本拠陥落：移る先は、地元の県で前線から離れた大きな町を選ぶ（取ったばかりの前線の町へ移って、すぐまた落ちるのを防ぐ）
  //  もとの県庁なら3か月、移った先の本拠なら2か月の混乱・寝返り・降伏
  const home = B.info.get(lf.origCapital)?.pref;
  const front = x => B.landNb(x.id).some(id => st.munis[id] && st.munis[id].owner !== loser && !peaceful(st, loser, st.munis[id].owner));
  const seatScore = x => B.info.get(x.id).pop * (B.info.get(x.id).pref === home ? 4 : 1) * (front(x) ? 0.25 : 1);
  const next = left.slice().sort((a, b) => seatScore(b) - seatScore(a))[0];
  const wasHome = m.id === lf.origCapital;
  lf.capital = next.id; lf.chaos = wasHome ? 3 : 2;
  feud(st, winner, loser, wasHome ? 4 : 2);
  addShiki(lf, wasHome ? -0.2 : -0.12);
  ev.push({ type: 'capital', f: loser, by: winner, at: m.id, moveTo: next.id, home: wasHome });
  // 寝返り：勝った側と接していて民心の低い町。もとの県庁が落ちたとき（2026-10-19）は、その県の町が広く揺らぐ
  //  （県庁に近い町ほど・勝った側と接するほど・民心が低いほど降りやすい。山場で領地がまとまって動くように）
  const hub = B.info.get(m.id), hx = hub.seat?.[0] ?? 0, hy = hub.seat?.[1] ?? 0;
  for (const x of left) {
    if (x.id === next.id) continue;
    const touching = B.landNb(x.id).some(id => st.munis[id] && st.munis[id].owner === winner);
    let p = touching && x.morale < 0.5 ? 0.35 : 0;
    if (wasHome && B.info.get(x.id).pref === home) {
      const xi = B.info.get(x.id), km = xi.seat ? Math.hypot((xi.seat[0] - hx) * 91, (xi.seat[1] - hy) * 111) : 99;
      p = Math.max(p, (touching ? 0.45 : 0.2) * (km < 25 ? 1 : km < 50 ? 0.6 : 0.3) * (x.morale < 0.6 ? 1 : 0.5));
    }
    if (p && r() < p) { x.owner = winner; x.morale = 0.45; ev.push({ type: 'defect', id: x.id, from: loser, to: winner }); retake(st, winner, loser, x.id, ev); }
  }
  const now = Object.values(st.munis).filter(x => x.owner === loser);
  const power = fid => Object.values(st.munis).filter(x => x.owner === fid).reduce((a, x) => a + x.troops, 0);
  // 降伏：もとの半分を切っていて、相手が1.5倍以上強い（CPU だけ。プレイヤーは最後まで戦える）
  // 降伏：もとの半分（大きくなった勢力は、いちばん広かったときの4割）を切っていて、相手が1.5倍以上強い
  const aliveN = st.factions.filter(x => x.alive).length;   // 残りが12勢力以下なら、大きな差で下りやすい（8年目からの膠着 2026-10-20）
  if (lf.ai && (now.length <= 3 || (now.length < Math.max(lf.orig * 0.5, (lf.peak || 0) * 0.4) && power(winner) > power(loser) * 1.5) || (aliveN <= 12 && now.length < lf.orig * 0.8 && power(winner) > power(loser) * 3))) {
    for (const x of now) x.owner = winner;
    lf.alive = false;
    if (st.officers) for (const o of st.officers.filter(o => o.f === loser)) { if (officersOf(st, winner).length < officerCap(st, winner)) { o.f = winner; o.at = null; } else o.f = -1; }
    ev.push({ type: 'surrender', f: loser, to: winner });
    retake(st, winner, loser, st.factions[winner].origCapital, ev);
  }
}

// ── 包囲網：いちばん強い勢力が2位の1.6倍を超えると、隣り合う勢力が手を組む（なかまどうしは攻め合わない）──
//  囲まれた側は、なかまと同盟・停戦を結ぶと1つずつ崩せる。相手が2位の1.2倍まで弱まるか、3年たつか、なかまが1つになると解ける
const popHeld = (st, fid) => { let p = 0; for (const m of Object.values(st.munis)) if (m.owner === fid) p += st.pop ? st.pop[m.id] || 0 : 0; return p; };
function updateCoalition(st, B, ev) {
  // 強さは治めている人口で見る（兵の数だと、はじめから兵の多い北海道ばかりが狙われた）
  const alive = st.factions.filter(x => x.alive).map(x => [x.id, popHeld(st, x.id)]).sort((a, b) => b[1] - a[1]);
  const c = st.coalition;
  if (c) {
    const t = st.factions[c.target];
    c.members = c.members.filter(id => st.factions[id]?.alive && id !== c.target && !(pactOf(st, id, c.target) && ['domei', 'teisen'].includes(pactOf(st, id, c.target).type)));
    const second = alive.find(x => x[0] !== c.target);
    if (!t || !t.alive || (second && popHeld(st, c.target) < second[1] * 1.2) || c.members.length < 2 || st.turn - c.since > 36) {
      ev.push({ type: 'coalitionEnd', target: c.target, members: c.members.slice() });
      st.coalition = null;
    }
    return;
  }
  // はじめの2.5倍以上に広げた勢力は、2位の1.3倍でも的にする（勝っている側がそのまま進んでいた 2026-10-20）
  const grownTop = alive.length && Object.values(st.munis).filter(m => m.owner === alive[0][0]).length >= (st.factions[alive[0][0]].orig || 1) * 2.5;
  if ((st.turn || 0) < OPENING + 12 || alive.length < 4 || (alive[0][1] < alive[1][1] * (alive[0][0] === st.player ? levelOf(st).coal : 1.6) && !(grownTop && alive[0][1] >= alive[1][1] * 1.3))) return;
  const target = alive[0][0];
  // はじめから大きい県ではなく、広げた勢力を囲む（はじめの人口の1.5倍以上に伸びたとき）
  const startPop = Object.values(st.munis).reduce((a, m) => a + (B.info.get(m.id)?.pref === st.factions[target].pref ? st.pop?.[m.id] || 0 : 0), 0);
  if (alive[0][1] < startPop * 1.5) return;
  const nb = new Set();
  for (const m of Object.values(st.munis)) if (m.owner === target) for (const id of [...B.landNb(m.id), ...B.seaNb(m.id).filter(n => B.seaInfo(m.id, n).tier === 0)]) { const o = st.munis[id]?.owner; if (o !== undefined && o >= 0 && o !== target) nb.add(o); }
  const members = [...nb].filter(id => st.factions[id].alive && st.factions[id].ai && !peaceful(st, id, target));
  if (members.length < 2) return;
  st.coalition = { target, members, since: st.turn };
  ev.push({ type: 'coalition', target, members: members.slice() });
  // プレイヤーが囲む側にいれば、誘いが来る
  if (st.player !== null && st.player !== target && nb.has(st.player) && st.factions[st.player].alive && !st.proposals.some(p => p.kind === 'houi'))
    st.proposals.push({ from: members[0], to: st.player, kind: 'houi', turn: st.turn + 1 });
}

// ── 地方統一：1つの勢力が地方の市町村をすべて持つと、その地方の主に（その勢力にだけ1度）──
//  ごほうび：予算+150・兵糧+150・士気+15、行動力が毎月+1（2つまで）
export const REGIONS = [['北海道・東北', 1, 7], ['関東', 8, 14], ['中部', 15, 23], ['近畿', 24, 30], ['中国', 31, 35], ['四国', 36, 39], ['九州・沖縄', 40, 47]];
// 地方の県庁をすべて持ち、地方の人口の85%以上を治めると、その地方の主（離れ島まで全部はいらない）
function updateRegions(st, B, ev) {
  st.regions ||= {};
  REGIONS.forEach(([name, a, b], r) => {
    const fs = st.factions.filter(f => +f.pref >= a && +f.pref <= b);
    const holder = st.munis[fs[0]?.origCapital]?.owner;
    if (holder === undefined || holder < 0 || st.regions[r] === holder) return;
    if (!fs.every(f => st.munis[f.origCapital]?.owner === holder)) return;
    let all = 0, mine = 0;
    for (const m of Object.values(st.munis)) { const pc = +(B.info.get(m.id)?.pref || 0); if (pc >= a && pc <= b) { const p = st.pop?.[m.id] || 0; all += p; if (m.owner === holder) mine += p; } }
    if (mine < all * 0.85) return;
    const f = st.factions[holder];
    if (!f || !f.alive) return;
    st.regions[r] = holder;
    f.gold += 150; f.food += 150; addShiki(f, 0.15);
    ev.push({ type: 'region', f: holder, region: name });
  });
}

// ── 宿敵（プレイヤーだけ）：いちばん多くぶつかった勢力。本拠を奪い合うと点が多い ──
function feud(st, a, b, n) {
  if (st.player === null || a === b || b < 0) return;
  const other = a === st.player ? b : b === st.player ? a : -1;
  if (other < 0) return;
  (st.feud ||= {})[other] = (st.feud[other] || 0) + n;
}
function updateRival(st, ev) {
  if (st.player === null || !st.feud) return;
  let best = -1, bs = 0;
  for (const [id, v] of Object.entries(st.feud)) if (st.factions[id]?.alive && v > bs) { bs = v; best = +id; }
  let cur = st.rival ?? -1;
  if (cur >= 0 && !st.factions[cur].alive) { ev.push({ type: 'rivalDown', f: cur }); st.rival = cur = -1; }
  if (best >= 0 && bs >= 5 && best !== cur && (cur < 0 || (st.turn - (st.rivalSince ?? -99) >= 24 && bs >= (st.feud[cur] || 0) * 1.5 + 3))) {
    st.rivalSince = st.turn;
    st.rival = best;
    ev.push({ type: 'rival', f: best, score: bs });
  }
}

// ── 月を進める ──
export function endMonth(st, B) {
  const r = rng(st.rs);
  const ev = [];
  ensureOfficers(st, B);
  tally.set(st, new Map());
  const shiki0 = shikiOf(st.factions[st.player]);
  // CPU の手番
  for (const f of st.factions) if (f.alive && f.ai) aiTurn(st, B, f, r);
  // 委任した県（知事代理が自分の財布で動く。プレイヤーの行動力は使わない）
  if (st.player !== null && st.delegs) for (const [pref, d] of Object.entries(st.delegs)) {
    const f = st.factions[st.player], o = st.officers.find(x => x.id === d.oid && x.f === f.id);
    if (pref === f.pref) { f.gold += d.purse; if (o) o.gov = null; delete st.delegs[pref]; continue; }   // 前の版で地元を委任していたセーブは、財布を戻して解く
    if (!o) { delete st.delegs[pref]; continue; }
    const only = new Set(Object.values(st.munis).filter(m => m.owner === f.id && B.info.get(m.id).pref === pref).map(m => m.id));
    if (!only.size) continue;
    const keep = { gold: f.gold, ap: f.ap };
    f.gold = d.purse; f.ap = 1 + Math.floor(o.pol / 35);
    const log = [];
    aiTurn(st, B, f, r, { only, policy: d.policy, log });
    d.purse = f.gold; f.gold = keep.gold; f.ap = keep.ap;
    if (log.length) ev.push({ type: 'deleg', pref, oid: o.id, name: o.name, acts: log });
  }
  // この月の移動・徴兵（プレイヤーの分と CPU の分）を演出用に出す
  for (const e of st.month || []) ev.push(e);
  st.month = [];
  // 合戦（順番はくじ）。外洋・遠洋の船団は着いた月に加わる
  const orders = st.orders.slice();
  st.orders = [];
  st.voyages ||= [];
  for (const v of st.voyages.filter(v => v.eta <= st.turn)) orders.push({ f: v.f, type: 'tokai', from: v.from, to: v.to, troops: v.troops, cmdr: v.cmdr, voyage: v.tier });
  st.voyages = st.voyages.filter(v => v.eta > st.turn && st.factions[v.f].alive);
  for (let i = orders.length - 1; i > 0; i--) { const j = Math.floor(r() * (i + 1)); [orders[i], orders[j]] = [orders[j], orders[i]]; }
  // 挟み撃ち：同じ月に同じ相手を複数の隣から攻めたら1つの合戦にまとめる（攻め口1つにつき+15%、最大+45%）
  const joint = new Map();
  for (const o of orders) {
    if (o.type !== 'shutsujin' || o.voyage !== undefined) continue;
    const k = o.f + ':' + o.to;
    (joint.get(k) || joint.set(k, []).get(k)).push(o);
  }
  const merged = [];
  for (const o of orders) {
    if (o.type !== 'shutsujin' || o.voyage !== undefined) { merged.push(o); continue; }
    const g = joint.get(o.f + ':' + o.to);
    if (g[0] !== o) continue;
    if (g.length === 1) { merged.push(o); continue; }
    // 出陣元ごとに兵を引いてから、いちばん大きい隊を主にまとめる
    const main = g.slice().sort((a, b) => b.troops - a.troops)[0];
    const extra = g.filter(x => x !== main);
    let add = 0;
    const sent = [];
    for (const x of extra) { const src = st.munis[x.from]; if (src.owner === x.f) { const n = Math.min(x.troops, Math.max(0, src.troops)); src.troops -= n; add += n; sent.push([x.from, n]); } }
    merged.push({ ...main, troops: main.troops + add, flank: Math.min(3, sent.length), froms: sent.map(x => x[0]), parts: [[main.from, main.troops], ...sent] });
  }
  orders.length = 0; orders.push(...merged);
  for (const o of orders) battle(st, B, o, r, ev);
  updateCoalition(st, B, ev);
  updateRegions(st, B, ev);
  updateRival(st, ev);
  // 臣従：攻められて追いこまれた CPU が、隣り合う4倍以上強い勢力へ自分から下ることがある（プレイヤーへは申し出）
  //  はじめの1年は起きない。本拠を失ったか、領地がはじめの6割・いちばん広かった時の5割を切ったときだけ
  for (const f of st.factions) {
    if (!f.alive || !f.ai || st.turn < OPENING + 12) continue;
    const nOwn = Object.values(st.munis).filter(m => m.owner === f.id).length;
    if (f.capital === f.origCapital && nOwn >= Math.max((f.orig || 0) * 0.6, (f.peak || 0) * 0.5)) continue;
    const pf = power(st, f.id);
    const nbs = new Set();
    // 隣（陸か近海）の勢力だけ。同盟相手なら3倍、ほかは4倍の差で下る
    for (const m of Object.values(st.munis)) if (m.owner === f.id) for (const id of [...B.landNb(m.id), ...B.seaNb(m.id).filter(n => B.seaInfo(m.id, n).tier === 0)]) { const e = st.munis[id]; if (e && e.owner !== f.id) nbs.add(e.owner); }
    let best = null;
    const allies = new Set();
    for (const p of st.pacts) if (p.type === 'domei' && (p.a === f.id || p.b === f.id)) allies.add(p.a === f.id ? p.b : p.a);
    let pBest = 0;
    const late = st.factions.filter(x => x.alive).length <= 12;   // 終盤は差が少し小さくても、少し起きやすく
    for (const g of nbs) { const pg = power(st, g); if (st.factions[g].alive && pg > pf * (allies.has(g) ? (late ? 2.5 : 3) : (late ? 3 : 4)) && getRel(st, f.id, g) > -30 && (best === null || pg > pBest)) { best = g; pBest = pg; } }
    if (best === null || r() > (late ? 0.08 : 0.04)) continue;
    if (best === st.player) { if (!st.proposals.some(p => p.from === f.id)) st.proposals.push({ from: f.id, to: best, kind: 'shinju', turn: st.turn + 1 }); }
    else merge(st, f.id, best, ev);
  }
  // 収入と維持
  for (const f of st.factions) {
    if (!f.alive) continue;
    const inc = income(st, B, f);
    f.gold += inc.gold; f.food += inc.food; f.arms += inc.arms;
    if (inc.deleg && st.delegs) {   // 知事代理の財布へ（県ごとの税の割合で分ける）
      const by = {};
      for (const m of Object.values(st.munis)) if (m.owner === f.id) { const i = B.info.get(m.id); if (st.delegs[i.pref]) by[i.pref] = (by[i.pref] || 0) + i.pop * (0.6 + m.morale * 0.6) * (1 + m.com * 0.1); }
      const tot = Object.values(by).reduce((a, b) => a + b, 0) || 1;
      for (const [p, v] of Object.entries(by)) st.delegs[p].purse += inc.deleg * v / tot;
    }
    if (st.date.m === 10) { const h = harvest(st, B, f); f.food += h; ev.push({ type: 'harvest', f: f.id, food: Math.round(h) }); }
    // 兵糧が3か月分を切りそうなら、予算で買い足す（市場。1俵＝予算0.6）
    const need = inc.upkeep * 3 - f.food;
    if (need > 0 && f.gold > 20) {
      const buy = Math.min(need + inc.upkeep, (f.gold - 10) / 0.6);
      if (buy > 1) { f.food += buy; f.gold -= buy * 0.6; if (f.id === st.player) ev.push({ type: 'buyFood', f: f.id, food: Math.round(buy), gold: Math.round(buy * 0.6) }); }
    }
    // 装備も市場で買える（1点＝予算2）。兵の数に見合う分まで、予算の3割を上限に
    const wantArms = power(st, f.id) / 400 + 20 - f.arms;
    if (wantArms > 0 && f.gold > 80) {
      const buy = Math.min(wantArms, f.gold * 0.3 / 2);
      if (buy > 1) { f.arms += buy; f.gold -= buy * 2; if (f.id === st.player) ev.push({ type: 'buyArms', f: f.id, arms: Math.round(buy), gold: Math.round(buy * 2) }); }
    }
    if (f.food < 0) {   // 兵糧が尽きると兵が逃げ、民心が下がる
      for (const m of Object.values(st.munis)) if (m.owner === f.id) { m.troops = Math.round(m.troops * 0.93); m.morale = clamp(m.morale - 0.05, 0, 1); }
      f.food = 0; addShiki(f, -0.1); ev.push({ type: 'starve', f: f.id });
    }
    if (f.chaos > 0) f.chaos--;
    // 勢い：取った町が失った町より多い月が3か月続くと乗る。失った町のほうが多いと止まる。動かない月は少しずつ冷める
    //  （2026-10-20 本人指摘。前は「負け越すか町を2つ以上失うと止まる」で、前線の長い大きな勢力はどこかで毎月2つは失うので、
    //   参謀どおりに遊んで1位になった千葉でも5年間いちども勢いに乗れず、「優勢」の曲も流れなかった）
    const t = tallyOf(st, f.id), was = riding(f), net = t.win - t.lost;
    if (net < 0) f.streak = 0;
    else if (net > 0) f.streak = (f.streak || 0) + 1;
    else if (!t.fights) f.streak = Math.max(0, (f.streak || 0) - 1);
    if (!was && riding(f)) { addShiki(f, 0.1); ev.push({ type: 'momentum', f: f.id }); }
    else if (was && !riding(f)) ev.push({ type: 'momentumEnd', f: f.id });
    // 士気はふだんの値へ少し戻る。0.3を切ると兵が逃げる
    f.shiki = shikiOf(f) + (SHIKI0 + 0.03 * lvOf(st, B, f.id, 'niku') - shikiOf(f)) * 0.12;
    if (f.shiki < 0.3) { for (const m of Object.values(st.munis)) if (m.owner === f.id) m.troops = Math.round(m.troops * 0.98); if (f.id === st.player) ev.push({ type: 'desert', f: f.id }); }
  }
  { const pf = st.factions[st.player]; if (pf && Math.abs(shikiOf(pf) - shiki0) >= 0.05) ev.push({ type: 'shiki', f: pf.id, from: shiki0, to: shikiOf(pf) }); }
  // 民心は 0.7 へゆっくり戻る（ブランドで少し上がりやすい）
  const brandOf = {};
  for (const f of st.factions) if (f.alive) brandOf[f.id] = brands(st, B, f.id);
  const sizeOf = {};
  for (const m of Object.values(st.munis)) sizeOf[m.owner] = (sizeOf[m.owner] || 0) + 1;
  for (const m of Object.values(st.munis)) {
    const b = brandOf[m.owner] || [];
    const oc = officerAt(st, B, m.id);
    const over = Math.min(0.15, (sizeOf[m.owner] || 0) / 3300);   // 広がりすぎると民心が戻りにくい
    const goal = 0.7 - over + (b.includes('kajitsu') ? 0.04 : 0) + (b.includes('aji') ? 0.03 : 0) + (oc && oc.trait === 'hitotarashi' ? 0.06 : 0);
    m.morale += (goal - m.morale) * 0.06;
    if (m.camp) m.camp--;
  }
  // 孤立した町は降る（2026-10-19）：補給線を断たれた町（isolated）は、毎月民心が下がり、
  //  2か月目からは陸か近い海で接する勢力のうち、まわりの兵がいちばん多いところへ降ることがある
  connCache.delete(st);
  for (const m of Object.values(st.munis)) {
    const f = m.owner >= 0 ? st.factions[m.owner] : null;
    if (!f || !f.alive) continue;
    if (!isolated(st, B, m.id)) { if (m.cut) m.cut = 0; continue; }
    const around = foesAround(st, B, m);
    m.cut = (m.cut || 0) + 1;
    m.morale = clamp(m.morale - 0.05, 0, 1);
    if (m.owner === st.player && m.cut === 1) ev.push({ type: 'cutoff', id: m.id, f: m.owner });
    if (m.cut < 2) continue;
    let to = -1, bt = 0;
    for (const [g, t] of around) if (t > bt) { bt = t; to = g; }
    if (to < 0 || bt < m.troops * 1.2 || r() > (0.2 + 0.1 * (m.cut - 2)) * (f.chaos > 0 ? 0.3 : 1)) continue;   // 本拠を失った混乱の間は粘る（崩れが一気に進んでいた）
    const from = m.owner;
    m.owner = to; m.morale = Math.max(m.morale, 0.45); m.cut = 0; m.camp = 0;
    ev.push({ type: 'defect', id: m.id, from, to, why: 'cut' });
    retake(st, to, from, m.id, ev);
  }
  // 約束の期限
  for (const p of st.pacts.filter(p => p.until <= st.turn + 1)) ev.push({ type: 'pactEnd', a: p.a, b: p.b, kind: p.type });
  st.pacts = st.pacts.filter(p => p.until > st.turn + 1 && st.factions[p.a].alive && st.factions[p.b].alive);
  for (const k of Object.keys(st.rel)) st.rel[k] *= 0.97;
  st.proposals = st.proposals.filter(p => st.turn - p.turn < 1);
  // 日付
  st.turn++;
  st.date.m++; if (st.date.m > 12) { st.date.m = 1; st.date.y++; }
  for (const f of st.factions) {
    f.ap = f.alive ? actionPoints(st, f) : 0;
    if (f.alive) { const n = Object.values(st.munis).filter(m => m.owner === f.id).length; if (n > (f.peak || 0)) f.peak = n; }
  }
  // 知事選（4年ごと。プレイヤーだけ）
  const alive = st.factions.filter(f => f.alive);
  if (st.player !== null && st.factions[st.player].alive && alive.length > 1) {
    st.poll = pollOf(st, B, st.player);
    if (st.turn % ELECTION_EVERY === 0) {
      const vote = clamp(st.poll + (r() - 0.5) * 0.06, 0, 1), win = vote >= 0.5;
      ev.push({ type: 'election', vote, win, term: st.term });
      if (win) st.term++; else st.over = { type: 'election', vote };
    }
  }
  // 決着
  if (st.over) { /* 落選 */ }
  else if (alive.length === 1) st.over = { type: 'unify', winner: alive[0].id };
  else if (st.player !== null && !st.factions[st.player].alive) st.over = { type: 'lost' };
  else if (st.months > 0 && st.turn >= st.months) {   // months 0 は期限なし（統一か滅亡まで）
    // 順位は「はじめより増やした市町村の数」（はじめから広い北海道などが有利にならないように）。同じなら治めている人口
    const gain = gainOf(st);
    const rank = st.factions.map(f => f.id).sort((a, b) => gain[b].n - gain[a].n || gain[b].pop - gain[a].pop);
    st.over = { type: 'time', rank, gain };
  }
  // 天下の大勢（2026-10-26 遊んだ人の意見「残り3、4国になった後が長い」）：遊ぶ人が全国の人口の8割を治めたら、一度だけ知らせる。
  //  統一とするか、最後まで戦うかは遊ぶ人が選ぶ（game.js）。続けたあとも、メニューからいつでも統一を宣言できる
  if (!st.over && st.player !== null && !st.taikaAsked && nationalShare(st, B, st.player) >= TAIKA) { st.taikaAsked = true; ev.push({ type: 'taika', share: nationalShare(st, B, st.player) }); }
  st.rs = r.state();
  st.log.push(...ev.map(e => ({ ...e, turn: st.turn })));
  // 出来事の記録は、合戦を13か月・ほかを2か月残す（2026-10-20。前は全勢力あわせて300件で切っていて、1か月分ほどしか残らず、
  //  「ここ1年の連戦の疲れ」「3か月以内に攻められた（停戦）」「やられた相手への仕返し」が直近1か月しか数えていなかった）
  { const t = st.turn; st.log = st.log.filter(e => e.turn > t - (e.type === 'battle' ? 13 : 2)); }
  return ev;
}

// ── セーブ ──
// 物見：ほかの勢力のようすを探る（行動力1）。報告はその月のあいだ st.intel に覚えておく
export function spy(st, fid, tid) {
  const f = st.factions[fid], t = st.factions[tid];
  if (st.over) return '決着がついています';
  if (!t || !t.alive || tid === fid) return '探れる相手ではありません';
  if (f.ap <= 0) return '行動力がありません';
  f.ap--;
  return true;
}
// はじめより増やした市町村の数（はじめの領地はその県の市町村）と、いま治めている人口（同じ数のときの順位に使う）
export function gainOf(st) {
  const out = st.factions.map(f => ({ n: -(f.orig || 0), pop: 0 }));
  for (const m of Object.values(st.munis)) if (m.owner >= 0) { out[m.owner].n++; out[m.owner].pop += st.pop ? st.pop[m.id] || 0 : 0; }
  return out;
}
export function serialize(st) { return JSON.stringify(st); }
export function deserialize(text) {
  const st = JSON.parse(text);
  if (!st || typeof st !== 'object' || !st.munis || !st.factions) throw new Error('このセーブは読めません');
  if (st.v === 1) { Object.assign(st, { rel: {}, pacts: [], proposals: [], term: 1, poll: null, months: 144 }); st.v = 2; }   // 版1 → 版2（外交・知事選を足した）
  if (st.v === 2) st.v = 3;   // 版2 → 版3（人材・委任。人材は ensureOfficers で足す）
  if (st.v === 3) { st.voyages = []; st.v = 4; }   // 版3 → 版4（外洋・遠洋の航海）
  if (st.v === 4) st.v = 5;   // 版4 → 版5（参謀・浪人・引き抜き。浪人は ensureOfficers で足す）
  if (st.v === 5) { for (const f of st.factions) { if (f.shiki === undefined) f.shiki = SHIKI0; if (f.streak === undefined) f.streak = 0; } st.v = 6; }   // 版5 → 版6（士気・勢い）
  if (st.v !== SAVE_VERSION) throw new Error('このセーブは読めません');
  if (!LEVELS[st.level]) st.level = 'normal';   // 難易度より前のセーブはノーマル
  if (st.factions.some(f => !f.kishitsu)) { const kr = rng((st.seed || 1) ^ 0x5bd1e995); for (const f of st.factions) if (!f.kishitsu) f.kishitsu = pickKishitsu(f, 0, kr); }
  return st;
}
