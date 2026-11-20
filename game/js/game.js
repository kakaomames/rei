// ゲームの進行（ルール sim.js と画面をつなぐ）
//  県選び → 毎月コマンド → 月を進める（CPU・合戦を演出つきで見せる）→ 自動保存
//  セーブは版つきの JSON。ブラウザ内（localStorage）に毎月保存し、書き出し・読みこみもできる
import * as THREE from 'three';
import { createGame, createBoard, command, endMonth, income, defense, attackPower, isWinter, serialize, deserialize, COMMANDS, DIPLO, BRANDS, MEISAN, brandSets, getRel, pactOf, peaceful, respond, ELECTION_EVERY, OPENING, ensureOfficers, officersOf, assignOfficer, setDelegation, TRAITS, POLICY, commandCost, commanderAt, suggest, advise, SEA, stormChance, sanboOf, scoutTargets, scoutTerms, commandPreview, isolated, spy, aiPlan, shikiOf, riding, crossK, KISHITSU, winChance, gainOf, brandLv, BRAND_STEPS, bulkCost, bulkSteps, campK, sosemePlan, soseme, LEVELS, levelOf, musterPlan, pollOf, electionFestivals, dismissOfficer, officerCap, nationalShare, TAIKA } from './sim.js?v=20261026a';
import { headlines } from './advisor.js?v=20261026a';
import { RAMP } from './mat.js?v=20261026a';

const SAVE_KEY = 'amix-47kokushi-japan-v1';
// 外交の絞り込み用：読みがなと地方
const KANA = ['ほっかいどう', 'あおもり', 'いわて', 'みやぎ', 'あきた', 'やまがた', 'ふくしま', 'いばらき', 'とちぎ', 'ぐんま', 'さいたま', 'ちば', 'とうきょう', 'かながわ', 'にいがた', 'とやま', 'いしかわ', 'ふくい', 'やまなし', 'ながの', 'ぎふ', 'しずおか', 'あいち', 'みえ', 'しが', 'きょうと', 'おおさか', 'ひょうご', 'なら', 'わかやま', 'とっとり', 'しまね', 'おかやま', 'ひろしま', 'やまぐち', 'とくしま', 'かがわ', 'えひめ', 'こうち', 'ふくおか', 'さが', 'ながさき', 'くまもと', 'おおいた', 'みやざき', 'かごしま', 'おきなわ'];
const AREA = code => { const p = +code; return p === 1 ? '北海道 ほっかいどう' : p <= 7 ? '東北 とうほく' : p <= 14 ? '関東 かんとう' : p <= 23 ? '中部 ちゅうぶ' : p <= 30 ? '近畿 関西 きんき かんさい' : p <= 35 ? '中国 ちゅうごく' : p <= 39 ? '四国 しこく' : p <= 46 ? '九州 きゅうしゅう' : '沖縄 九州 おきなわ きゅうしゅう'; };
const toHira = t => t.replace(/[ァ-ン]/g, c => String.fromCharCode(c.charCodeAt(0) - 0x60));
// 県選びのむずかしさ（★1 やさしい〜★5 むずかしい）。人口の順ではなく、遊んだ結果から決める（docs/DESIGN.md）
// 2026-10-21 確定：陣・孤立・総攻め・知事選の祭り・記録の不具合の修正・勢い（取った町−失った町）・募兵・開墾殖産2倍を入れたルールで、
//  参謀どおり5年×3回（141本）＋CPU どうし10年×160回から（.claude/k47/out/v7）。ルールを大きく変えたら測り直す（.claude/k47/run-v7.sh）
const STARS = { '01': 1, '02': 4, '03': 4, '04': 3, '05': 5, '06': 5, '07': 1, '08': 1, '09': 3, '10': 2, '11': 3, '12': 4, '13': 5, '14': 2, '15': 4, '16': 1, '17': 2, '18': 5, '19': 2, '20': 5, '21': 5, '22': 1, '23': 5, '24': 1, '25': 3, '26': 3, '27': 2, '28': 1, '29': 3, '30': 2, '31': 4, '32': 4, '33': 4, '34': 1, '35': 3, '36': 2, '37': 4, '38': 2, '39': 4, '40': 2, '41': 5, '42': 1, '43': 4, '44': 3, '45': 5, '46': 3, '47': 2 };
const REGIONS = [['北海道・東北', 1, 7], ['関東', 8, 14], ['中部', 15, 23], ['近畿', 24, 30], ['中国', 31, 35], ['四国', 36, 39], ['九州・沖縄', 40, 47]];
const sleep = ms => new Promise(r => setTimeout(r, ms));

export function startGame(ctx) {
  const { W, owners, marks, life, ctl, scene, U, campaign, fx } = ctx;
  const B = createBoard(W.idx);
  const $ = id => document.getElementById(id);
  let st = null, sel = -1, busy = false, speed = 1;
  try { speed = +(localStorage.getItem(SAVE_KEY + ':speed') ?? 1); } catch (e) { /* 保存できない環境 */ }
  const fc = f => owners.factions[f];
  const me = () => st && st.player !== null ? st.factions[st.player] : null;
  const seat = id => marks.seatPos(id);
  const info = id => W.munis.get(id);

  // ── 盤面を画面へそろえる ──
  function syncAll() {
    for (const m of Object.values(st.munis)) { owners.setNow(m.id, m.owner); owners.setMorale(m.id, m.morale); }
    for (const t of W.tiles.values()) W.ownerDistance(t, owners.ownerOf);
  }
  function seasonOf(m) {   // 月 → 春夏秋冬の重み（境目の月はまぜる）
    const c = [4, 7, 10, 1], w = c.map(x => { let d = Math.abs(m - x); d = Math.min(d, 12 - d); return Math.max(0, 1 - d / 3); });
    const s = w.reduce((a, b) => a + b, 0);
    return w.map(v => v / s);
  }
  function applyDate() {
    $('date').textContent = `${st.date.y}年${st.date.m}月`;
    const w = seasonOf(st.date.m);
    ctx.setSeason(w, w.indexOf(Math.max(...w)));
  }

  // ── 上の帯 ──
  function updateHud() {
    const f = me();
    $('res').hidden = !f;
    if (!f) return;
    const left = st.months > 0 ? Math.max(0, Math.ceil((st.months - st.turn) / 12)) : 0;
    const rk = ranking().order.indexOf(f.id) + 1, mv = prevRank ? prevRank.indexOf(f.id) + 1 - rk : 0;   // 前の月からの上下
    $('me').innerHTML = `<b><span class="fchip" style="background:${fc(f.id).color}"></span>${f.name}勢<em class="rank-no" title="はじめより増やした市町村の数で順位（同じなら治める人口）">${rk}位<small>/${st.factions.length}</small>${mv ? `<i class="${mv > 0 ? 'up' : 'down'}">${mv > 0 ? '▲' + mv : '▼' + -mv}</i>` : ''}</em></b><span>${levelOf(st).name}・${st.months > 0 ? `あと${left}年` : '期限なし'}</span>`;
    $('me').setAttribute('aria-label', `${f.name}勢 ${st.factions.length}勢力中${rk}位。押すと順位表`);
    if (!$('rank').hidden) openRank();
    const inc = income(st, B, f);
    const n = v => Math.floor(v).toLocaleString();
    $('rGold').textContent = n(f.gold); $('rGoldD').textContent = '+' + n(inc.gold);
    // 足りているかを一言で（2026-10-21 本人指摘「兵糧や装備の数字は足りているのかピンとこない」）
    //  兵糧：毎月の増減と、秋の収穫（10月）まで持つか。持たないときだけ赤で「あと◯か月」
    const toHarvest = st.date.m <= 10 ? 10 - st.date.m : 22 - st.date.m;
    const foodShort = inc.food < 0 && f.food + inc.food * toHarvest < 0;
    $('rFood').textContent = n(f.food);
    $('rFoodD').textContent = foodShort ? `あと${Math.max(0, Math.floor(f.food / -inc.food))}か月` : (inc.food >= 0 ? '+' : '') + n(inc.food);
    $('rFoodD').className = foodShort ? 'neg' : inc.food < 0 ? 'dim' : '';
    $('rFood').parentElement.title = `兵糧：毎月 ${inc.food >= 0 ? '+' : ''}${n(inc.food)}。${foodShort ? '秋の収穫まで持たない。祭りを控えるか、兵を減らすか、開墾で収穫を増やす' : '秋の収穫（10月）まで持つ'}`;
    //  装備：1回の出陣で兵400人につき1が要る（足りないと攻めが弱い）。いまの装備で何人ぶんの出陣をまかなえるか
    const armsFor = f.arms * 400, bigFront = Math.max(0, ...Object.values(st.munis).filter(m => m.owner === f.id && B.landNb(m.id).some(id => st.munis[id] && st.munis[id].owner >= 0 && st.munis[id].owner !== f.id)).map(m => m.troops));
    $('rArms').textContent = n(f.arms);
    $('rArmsD').textContent = (armsFor >= 1e4 ? `${(armsFor / 1e4).toFixed(armsFor < 1e5 ? 1 : 0)}万` : n(armsFor)) + '人分';
    $('rArmsD').className = armsFor < bigFront * 0.8 ? 'neg' : 'dim';
    $('rArmsPill').title = `装備：出陣1回で兵400人につき1を使う。いまは兵${n(armsFor)}人ぶん${armsFor < bigFront * 0.8 ? '。前線の大きな町の兵より少なく、攻めが弱くなる。殖産か、予算で買い入れ（月末に自動）' : ''}`;
    $('rTroops').textContent = n(Object.values(st.munis).filter(m => m.owner === f.id).reduce((a, m) => a + m.troops, 0));
    $('rShips').textContent = f.ships;
    const sk = Math.round(shikiOf(f) * 100);
    $('rShiki').textContent = sk;
    $('rShikiPill').classList.toggle('low', sk < 40); $('rShikiPill').classList.toggle('high', sk >= 80);
    $('rRide').hidden = !riding(f);
    // 知事選の支持（2026-10-20 本人要望）。52%を切ると赤、知事選まで12か月を切ると残りの月数も
    const poll = Math.round((st.poll ?? pollOf(st, B, f.id)) * 100), pLeft = ELECTION_EVERY - (st.turn % ELECTION_EVERY);
    $('rPoll').textContent = poll + '%';
    $('rPollPill').classList.toggle('low', poll < 52);
    $('rPollLeft').hidden = pLeft > 12; $('rPollLeft').textContent = `選挙まで${pLeft}か月`;
    const max = Math.max(f.ap, ctx.apMax || f.ap);
    ctx.apMax = max;
    $('ap').innerHTML = '<small style="font-size:10px;font-weight:800;opacity:.6;margin-right:2px">行動</small>' + Array.from({ length: max }, (_, i) => `<i class="${i < f.ap ? '' : 'used'}"></i>`).join('');
    $('nextBtn').hidden = !!st.over;
    $('nextBtn').disabled = busy;
    $('sidetabs').hidden = false;
    updateTicker();
  }

  // 支持の札を押すと、祭りがいちばん効く地元の町へ
  $('rPollPill').addEventListener('click', () => {
    if (!st || st.over) return;
    const fe = electionFestivals(st, B, st.player, 1)[0];
    if (!fe) { toast('地元の町の民心は十分に高い'); return; }
    const s = seat(fe.at); if (s) ctl.flyTo(s.x, s.z + 1, Math.min(Math.max(ctl.st.dist, 60), 140));
    openPanel(fe.at);
  });
  // ── 速報の帯 ──
  let tickerSig = '';
  function updateTicker() {
    const items = st && !st.over ? headlines(st, B) : [];
    $('ticker').hidden = !items.length;
    const sig = items.map(i => i.text).join('|');
    if (sig === tickerSig) return;
    tickerSig = sig;
    const tr = $('tickerTrack');
    tr.innerHTML = '';
    for (let rep = 0; rep < 2; rep++) for (const it of items) {   // 2回並べて切れ目なく流す
      const b = document.createElement('button');
      b.type = 'button'; b.className = it.level; b.textContent = it.text;
      if (rep) b.setAttribute('aria-hidden', 'true'), b.tabIndex = -1;
      b.addEventListener('click', () => {
        if (it.proposal) { showProposal(); return; }
        if (it.at) { const s = seat(it.at); if (s) ctl.flyTo(s.x, s.z + 1, Math.min(Math.max(ctl.st.dist, 60), 140)); openPanel(it.at); }
      });
      tr.appendChild(b);
    }
    requestAnimationFrame(() => tr.style.setProperty('--dur', Math.max(18, tr.scrollWidth / 2 / 55) + 's'));
  }
  $('ticker').addEventListener('pointerdown', () => $('ticker').classList.add('hold'));
  for (const ev of ['pointerup', 'pointercancel', 'pointerleave']) $('ticker').addEventListener(ev, () => setTimeout(() => $('ticker').classList.remove('hold'), 1500));

  // ── 順位：はじめより増やした市町村の数（同じなら治めている人口）。10年・20年の決着と同じ数え方 ──
  let prevRank = null;   // 前の月の順位（上がった・下がったを出す）
  function ranking() {
    const g = gainOf(st);
    return { g, order: st.factions.map(f => f.id).sort((a, b) => g[b].n - g[a].n || g[b].pop - g[a].pop) };
  }
  function openRank() {
    const { g, order } = ranking(), box = $('rankList'), N = st.factions.length;
    const cnt = new Array(N).fill(0);
    for (const m of Object.values(st.munis)) if (m.owner >= 0) cnt[m.owner]++;
    $('rankNote').textContent = st.months > 0 ? `はじめより増やした市町村の数で順位（同じなら治めている人口）。${Math.round(st.months / 12)}年たった時の順位が結果になる。` : 'はじめより増やした市町村の数で順位（同じなら治めている人口）。期限なしでは目安。';
    const sg = v => (v > 0 ? '+' : v < 0 ? '−' : '±') + Math.abs(v);
    box.innerHTML = order.map((id, i) => {
      const t = st.factions[id], was = prevRank ? prevRank.indexOf(id) : i, mv = was - i;
      const tag = !t.alive ? (t.vassalOf !== undefined ? '臣従' : '滅亡') : '';
      return `<li class="rk${id === st.player ? ' me' : ''}${t.alive ? '' : ' gone'}"><b class="rk-no">${i + 1}</b><span class="dot" style="background:${fc(id).color}"></span><span class="rk-name">${t.name}勢${tag ? `<small>${tag}</small>` : ''}</span><span class="rk-n">${sg(g[id].n)}<small>${cnt[id]}市町村</small></span><span class="rk-mv${mv > 0 ? ' up' : mv < 0 ? ' down' : ''}">${mv > 0 ? '▲' + mv : mv < 0 ? '▼' + -mv : ''}</span></li>`;
    }).join('');
    const mine = box.querySelector('.me');
    if (mine) box.scrollTop = Math.max(0, mine.offsetTop - box.clientHeight / 2 + mine.offsetHeight / 2);   // 自分の行を真ん中に（見出しは動かさない）
  }
  $('me').addEventListener('click', () => {
    if (!st || st.over || !me()) return;
    const show = $('rank').hidden;
    for (const p of Object.keys(SIDE)) $(p).hidden = true;
    $('intel').hidden = true;
    if (show) { sfx('card', { gap: 120 }); closePanel(); $('rank').hidden = false; openRank(); } else $('rank').hidden = true;
    syncTabs();
  });

  // ── 戦果：月末の合戦で、どこを取って、どこを取られたか（st.warlog に24か月分。文字でも残す）──
  const WAR_KIND = {
    take: ['取った', 'take'], lost: ['取られた', 'lost'], held: ['守った', 'held'], fail: ['攻めきれず', 'fail'], storm: ['引き返す', 'storm']
  };
  function warRows(ev, before) {
    const P = st.player, rows = [];
    for (const e of ev) {
      if (e.type === 'battle' && (e.result === 'win' || e.result === 'lose')) {
        if (e.f === P) rows.push({ k: e.result === 'win' ? 'take' : 'fail', at: e.to, o: e.defOwner, n: e.troops, naval: !!e.naval, pass: e.pass || 0 });
        else if (e.defOwner === P) rows.push({ k: e.result === 'win' ? 'lost' : 'held', at: e.to, o: e.f, n: e.troops, naval: !!e.naval });
      } else if (e.type === 'battle' && e.result === 'storm' && e.f === P) rows.push({ k: 'storm', at: e.to, o: e.defOwner, typhoon: !!e.typhoon });
      else if (e.type === 'defect' && (e.to === P || e.from === P)) rows.push({ k: e.to === P ? 'take' : 'lost', at: e.id, o: e.to === P ? e.from : e.to, how: e.why === 'cut' ? '孤立' : '寝返り' });
      else if ((e.type === 'surrender' || e.type === 'vassal') && e.to === P) {
        const cnt = Object.values(st.munis).filter(m => before[m.id] === e.f && m.owner === P).length;
        rows.push({ k: 'take', at: null, o: e.f, how: e.type === 'surrender' ? '降伏' : '臣従', cnt });
      }
    }
    return rows;
  }
  function warText(r) {
    const town = r.at !== null && r.at !== undefined ? info(r.at).name : '', who = r.o >= 0 ? fc(r.o).name + '勢' : '空き地';
    if (r.how === '降伏' || r.how === '臣従') return [`${who}が${r.how}`, `${r.cnt}市町村が加わった`];
    if (r.how === '寝返り') return r.k === 'take' ? [`${town}が寝返った`, `${who}から`] : [`${town}が寝返った`, `${who}へ`];
    if (r.how === '孤立') return r.k === 'take' ? [`${town}が孤立して降った`, `${who}から`] : [`${town}が孤立して降った`, `${who}へ`];
    const troops = r.n ? `兵${r.n.toLocaleString()}${r.naval ? '・渡海' : ''}${r.pass ? `・峠${r.pass}m` : ''}` : '';
    if (r.k === 'take') return [town, `${who}から　${troops}`];
    if (r.k === 'lost') return [town, `${who}に　攻め手の${troops}`];
    if (r.k === 'held') return [town, `${who}を退けた　攻め手の${troops}`];
    if (r.k === 'fail') return [town, `${who}　${troops}`];
    return [town, `${r.typhoon ? '台風' : '時化'}で船団が引き返した`];
  }
  function openWarlog() {
    const box = $('warList'), log = (st.warlog || []).slice(0, 24);
    if (!log.length) { box.innerHTML = '<p class="note">まだ合戦はありません。月末の合戦で取った町・取られた町が、ここに残ります。</p>'; return; }
    box.innerHTML = '';
    log.forEach((w, i) => {
      const sec = document.createElement('section');
      sec.className = 'war-month' + (i === 0 && w.turn === st.turn - 1 ? ' latest' : '');
      const c = k => w.rows.filter(r => r.k === k).reduce((a, r) => a + (r.cnt || 1), 0);
      const sum = ['take', 'lost', 'held', 'fail'].filter(k => c(k)).map(k => `<span class="wk ${k}">${WAR_KIND[k][0]} ${c(k)}</span>`).join('');
      sec.innerHTML = `<h4>${w.y}年${w.m}月<span class="war-sum">${sum}</span></h4>`;
      for (const r of w.rows) {
        const [main, sub] = warText(r), b = document.createElement('button');
        b.type = 'button'; b.className = 'war-row';
        b.innerHTML = `<span class="wk ${r.k}">${WAR_KIND[r.k][0]}</span><span class="wt"><b>${main}</b><small>${sub}</small></span>`;
        if (r.at !== null && r.at !== undefined) b.addEventListener('click', () => { const s = seat(r.at); if (s) ctl.flyTo(s.x, s.z + 1, Math.min(Math.max(ctl.st.dist, 60), 140)); openPanel(r.at); });
        else b.disabled = true;
        sec.appendChild(b);
      }
      box.appendChild(sec);
    });
    box.scrollTop = 0;
  }
  $('warBtn').addEventListener('click', () => toggleSide('warlog', openWarlog));

  // ── 外交 ──
  function openDiplo() {
    const f = me(), box = $('diploList');
    box.innerHTML = '';
    // 隣り合う勢力・約束のある勢力を先に、ほかは強い順
    const border = new Set();
    for (const m of Object.values(st.munis)) if (m.owner === f.id) for (const id of [...B.landNb(m.id), ...B.seaNb(m.id)]) { const e = st.munis[id]; if (e && e.owner !== f.id) border.add(e.owner); }
    const order = st.factions.filter(t => t.id !== f.id && t.alive).sort((a, b) => (border.has(b.id) || !!pactOf(st, f.id, b.id)) - (border.has(a.id) || !!pactOf(st, f.id, a.id)) || Object.values(st.munis).filter(m => m.owner === b.id).length - Object.values(st.munis).filter(m => m.owner === a.id).length);
    const q = toHira(($('diploSearch').value || '').trim());
    const hit = t => !q || t.name.includes(q) || KANA[+t.pref - 1].includes(q) || AREA(t.pref).includes(q) || W.idx.prefs[t.pref].name.includes(q);
    const shown = order.filter(hit);
    if (!shown.length) box.innerHTML = '<p class="note">見つからない。</p>';
    for (const t of shown) {
      const div = document.createElement('div');
      div.className = 'fac';
      const pact = pactOf(st, f.id, t.id), rel = getRel(st, f.id, t.id);
      const co = st.coalition, rv = st.rival === t.id;
      const tag = !t.alive ? '滅亡' : [pact ? `${DIPLO[pact.type].name} あと${pact.until - st.turn}か月` : '', co && co.target === t.id ? '包囲網の的' : co && co.members.includes(t.id) ? '包囲網' : '', rv ? '宿敵' : ''].filter(Boolean).join('・');
      const n = Object.values(st.munis).filter(m => m.owner === t.id).length;
      const ks = KISHITSU[t.kishitsu];
      div.innerHTML = `<div class="fac-head"><span class="dot" style="width:14px;height:14px;border-radius:50%;border:2px solid var(--ink);background:${fc(t.id).color}"></span>${t.name}勢<small style="font-weight:700;opacity:.6">${n}市町村</small>${ks ? `<span class="kishitsu" title="${ks.desc}">${ks.name}</span>` : ''}${tag ? `<span class="tag">${tag}</span>` : ''}</div>` +
        `<div class="relbar" title="関係 ${Math.round(rel)}"><i style="left:${50 + rel / 2}%"></i></div><div class="fac-btns"></div>`;
      const btns = div.querySelector('.fac-btns');
      for (const k of ['domei', 'teisen', 'koeki', 'okurimono', 'tegire']) {
        const D = DIPLO[k], b = document.createElement('button');
        b.type = 'button';
        b.textContent = D.name + (D.cost.gold ? ` 予算${D.cost.gold}` : '');
        b.title = D.desc;
        const peace = pact && (pact.type === 'domei' || pact.type === 'teisen');
        b.disabled = !t.alive || f.ap <= 0 || busy || (k === 'tegire' ? !peace : k === 'okurimono' ? false : k === 'koeki' ? (pact && pact.type === 'koeki') : peace);
        b.addEventListener('click', async () => {
          if (judging) return;
          b.disabled = true;
          await diploAct(k, t.id);
          updateHud(); openDiplo();
        });
        btns.appendChild(b);
      }
      box.appendChild(div);
    }
  }
  const SIDE = { diplo: 'diploBtn', cards: 'cardBtn', people: 'peopleBtn', advice: 'adviceBtn', warlog: 'warBtn' };
  function syncTabs() { for (const [p, b] of Object.entries(SIDE)) $(b).setAttribute('aria-pressed', String(!$(p).hidden)); }
  function toggleSide(id, open) {
    const show = $(id).hidden;
    if (show) sfx('card', { gap: 120 });
    for (const p of Object.keys(SIDE)) $(p).hidden = true;
    $('intel').hidden = true; $('rank').hidden = true;
    if (show) { open(); $(id).hidden = false; closePanel(); }
    syncTabs();
  }
  $('diploBtn').addEventListener('click', () => toggleSide('diplo', openDiplo));
  $('diploSearch').addEventListener('input', () => openDiplo());

  const srcText = x => x.src === 'stat' ? '作物統計 収穫量 全国上位' : x.src === 'gi' ? `地理的表示（GI）${x.no.replace('GI', '第')}号` : `地域団体商標 第${x.no}号`;
  // ── 名産：種類ごとのレベル（持っている名産の町の数：3・6・10）と、近くでまだ持っていない名産 ──
  function openCards() {
    const f = me(), box = $('cardList'), bl = brandLv(st, B, f.id);
    box.innerHTML = '';
    const home = seat(f.capital);
    const dist = id => { const s = seat(id); return s && home ? Math.hypot(s.x - home.x, s.z - home.z) : 1e9; };
    const mineIds = Object.values(st.munis).filter(m => m.owner === f.id).map(m => m.id);
    for (const [k, Bk] of Object.entries(BRANDS)) {
      const x = bl[k], next = BRAND_STEPS.find(v => v > x.n);
      const have = mineIds.filter(id => (B.meisan?.get(id) || []).some(y => y.cat === k));
      const others = [...B.meisan.entries()].filter(([id, l]) => st.munis[id] && st.munis[id].owner !== f.id && l.some(y => y.cat === k)).map(([id]) => id).sort((p, q) => dist(p) - dist(q)).slice(0, 4);
      const div = document.createElement('div');
      div.className = 'set' + (x.lv ? ' done' : '');
      div.style.setProperty('--bc', Bk.color);
      div.innerHTML = `<div class="set-head"><span><i class="bdot"></i>${Bk.name} <b class="lv">Lv${x.lv}</b></span><small>${x.n}か所${next ? `・次は${next}か所` : '・最大'}　${Bk.effect}${x.lv > 1 ? `×${x.lv}` : ''}</small></div><div class="cardrow"></div>`;
      const row = div.querySelector('.cardrow');
      const card = (id, mine) => {
        const m = st.munis[id], l = B.meisan.get(id).filter(y => y.cat === k), c = document.createElement('button');
        c.type = 'button'; c.className = 'mcard' + (mine ? ' mine' : '');
        c.title = l.map(y => `${y.name}（${srcText(y)}）`).join('\n');
        c.innerHTML = `${l[0].name}${l.length > 1 ? `<em>ほか${l.length - 1}</em>` : ''}<small>${info(id).name}${l[0].wide ? '（県の名産）' : ''}${mine ? '' : '・' + fc(m.owner).name + '勢'}</small>`;
        c.addEventListener('click', () => { const s = seat(id); if (s) ctl.flyTo(s.x, s.z + 1, 90); openPanel(id); });
        row.appendChild(c);
      };
      for (const id of have) card(id, true);
      for (const id of others) card(id, false);
      box.appendChild(div);
    }
    const note = document.createElement('p');
    note.className = 'note';
    note.textContent = '名産は、特許庁の「地域団体商標」、農林水産省の「地理的表示（GI）」に登録されたものと、作物統計で収穫量が全国上位の米・果物です。町の名前の入ったものはその町に、県の名前の入ったものと統計の名産は県庁のある町に置いています。';
    box.appendChild(note);
  }
  $('cardBtn').addEventListener('click', () => toggleSide('cards', openCards));
  $('peopleBtn').addEventListener('click', () => toggleSide('people', openPeople));
  $('adviceBtn').addEventListener('click', () => { adviceSalt = 0; toggleSide('advice', openAdvice); });
  $('adviceMore').addEventListener('click', () => { adviceSalt++; openAdvice(); });

  // ── 参謀の進言（自分で開いたときだけ）──
  let adviceSalt = 0;
  function adviceText(a) {
    const f = me(), nm = id => info(id).name, n = v => Math.round(v).toLocaleString();
    switch (a.type) {
      case 'shutsujin': case 'tokai': {
        const e = st.munis[a.at], cm = commanderAt(st, f.id, a.from);
        const [lab] = odds(attackPower(st, f, a.troops, a.type === 'tokai', cm) * crossK(st, B, a.from, a.at), defense(st, B, e), a.troops, e.troops);
        return [`${nm(a.from)}から${nm(a.at)}へ${a.type === 'tokai' ? '渡海' : '出陣'}`, `${fc(e.owner).name}勢の守りは${n(e.troops)}人${isolated(st, B, a.at) ? '（孤立して援軍が来ない）' : ''}。兵${n(a.troops)}人で勝算は「${lab}」${cm ? `・大将${cm.name}` : ''}`];
      }
      case 'chohei': return [`${nm(a.at)}で徴兵`, `境の向こうの兵が多い。民心は少し下がる`];
      case 'bohei': return [`${nm(a.at)}で募兵`, a.why || '余った予算と兵糧で兵を雇う。民心は下がらない'];
      case 'ido': return [`${nm(a.from)}から${nm(a.at)}へ兵を移す`, '奥の兵を前に出して、境を厚くする'];
      case 'shuketsu': { const pl = musterPlan(st, B, f.id, a.at); return [`${nm(a.at)}へ集結`, `奥の町から兵 ${n(pl.n)}人を集める（予算${pl.gold}）。攻め口を厚くする`]; }
      case 'shogyo': return [`${nm(a.at)}で商業`, '町がにぎわい、毎月の予算が増える'];
      case 'kaikon': return [`${nm(a.at)}で開墾`, `秋の収穫が増える${st.date.m >= 4 && st.date.m <= 9 ? '（今年の秋から）' : ''}`];
      case 'shokusan': return [`${nm(a.at)}で殖産`, '毎月の装備が増え、戦が強くなる'];
      case 'hodokoshi': return [`${nm(a.at)}で祭り`, a.why || '民心が冷えている。知事選にも効く'];
      case 'chikujo': return [`${nm(a.at)}で築城`, '攻められやすい所の守りを固める'];
      case 'zosen': return [`${nm(a.at)}で造船`, '海の向こうへ攻めるには船がいる'];
      case 'toyo': return [`${nm(a.at)}で登用`, '人材が増えると城代や知事代理を任せられる'];
      case 'domei': case 'teisen': case 'koeki': return [`${fc(a.target).name}勢と${DIPLO[a.type].name}`, DIPLO[a.type].desc];
      case 'okurimono': return [`${fc(a.target).name}勢へ贈り物`, a.why || DIPLO.okurimono.desc];
      case 'tegire': return [`${fc(a.target).name}勢と手切れ`, a.why || DIPLO.tegire.desc];
      case 'scout': { const o = (st.officers || []).find(x => x.id === a.target); return [o ? `${o.name}を誘う` : '人材を誘う', a.why || '']; }
      default: {   // 内部の名前（英字）は画面に出さない
        const d = DIPLO[a.type], c = COMMANDS[a.type];
        if (d) return [a.target !== undefined ? `${fc(a.target).name}勢と${d.name}` : d.name, a.why || d.desc];
        return [c ? (a.at ? `${nm(a.at)}で${c.name}` : c.name) : '策', a.why || ''];
      }
    }
  }
  // 参謀の策は別の処理（Web Worker）で考える
  let worker = null, planId = 0;
  try { worker = new Worker(new URL('./plan-worker.js?v=20261026a', import.meta.url), { type: 'module' }); worker.postMessage({ idx: W.idx }); } catch (e) { worker = null; }
  function askPlan() {
    return new Promise(resolve => {
      if (!worker) { resolve(null); return; }
      const id = ++planId;
      const h = e => { if (e.data.id !== id) return; worker.removeEventListener('message', h); resolve(e.data.res || null); };
      worker.addEventListener('message', h);
      worker.postMessage({ id, st: JSON.parse(JSON.stringify(st)), fid: st.player, light: !!ctx.lite });   // スマホは先読みを軽く
    });
  }
  function stepText(a) { const t = adviceText(a)[0]; return a.x > 1 && ['shogyo', 'kaikon', 'shokusan', 'chikujo', 'chohei', 'bohei'].includes(a.type) ? `${t}（まとめて${a.type === 'chohei' ? '2倍' : a.type === 'bohei' ? a.x + '倍' : a.x + '段'}）` : t; }
  async function renderPlan(box) {
    const f = me();
    const sec = document.createElement('div');
    sec.className = 'plan';
    const who = sanboOf(st, f.id)?.name || '参謀';
    sec.innerHTML = `<div class="adv-sec">今月の策</div><div class="thinking"><div class="tk-face"><span>策</span></div><div class="tk-body"><b><span class="tk-who"></span>が考え中<span class="tk-dots"><i></i><i></i><i></i></span></b><small class="tk-msg"></small><div class="tk-bar"><i></i></div></div></div>`;
    sec.querySelector('.tk-who').textContent = who;
    box.prepend(sec);
    const plain = t => { sec.querySelector('.thinking').outerHTML = `<p class="note">${t}</p>`; };
    if (f.ap <= 0) { plain('今月の行動力は使い切った。'); return; }
    // 考えている中身を順に見せる（待ち時間に気づいてもらう）
    const msgs = ['兵糧と予算を数えている', '隣の兵の数を見ている', '同盟と停戦を確かめている', '知事選の支持を読んでいる', 'いくつもの策を先まで試している', '一番よい策を選んでいる'];
    let mi = 0;
    const msgEl = sec.querySelector('.tk-msg');
    msgEl.textContent = msgs[0];
    const tick = setInterval(() => { mi = (mi + 1) % msgs.length; msgEl.textContent = msgs[mi]; msgEl.classList.remove('in'); void msgEl.offsetWidth; msgEl.classList.add('in'); }, 700);
    $('adviceBtn').classList.add('busy');
    const res = await askPlan();
    clearInterval(tick);
    $('adviceBtn').classList.remove('busy');
    if (!res || !sec.isConnected) { if (sec.isConnected) plain('考えられなかった。'); return; }
    const best = res.results[0], pass = res.pass;
    const n = v => Math.round(v).toLocaleString();
    const diff = (a, b, unit = '') => { const d = Math.round(a - b); return (d >= 0 ? '+' : '') + d.toLocaleString() + unit; };
    const lines = [];
    lines.push(`${res.months}か月後の見込み：予算 ${n(best.gold)}（何もしないと${n(pass ? pass.gold : 0)}）・兵糧 ${n(best.food)}`);
    lines.push(`領地 ${best.terr >= 0 ? '+' : ''}${best.terr.toFixed(1)}・支持 ${Math.round(best.poll * 100)}%`);
    if (best.starve > 0) lines.push('<b style="color:#d64545">兵糧が尽きる心配がある</b>');
    if (best.capLost > 0) lines.push(`<b style="color:#d64545">本拠を失う見込み ${Math.round(best.capLost * 100)}%</b>`);
    // 手順ごとにチェック。外した手は「この策でいく」で行わない
    const steps = best.cmds.map((a, i) => `<li><label class="step"><input type="checkbox" checked data-i="${i}"><span>${stepText(a)}</span></label></li>`).join('') || '<li>今月は動かず、力をためる</li>';
    const level = ['ざっくり', 'ひととおり', 'じっくり', '深く'][res.level];
    sec.innerHTML = `<div class="adv-sec">今月の策</div><div class="plan-card"><b>${best.label}</b><ol>${steps}</ol><small>${lines.join('<br>')}</small><small class="how">${res.sanbo ? res.sanbo.name : '参謀'}が${res.results.length}つの策を${res.months}か月先まで${res.tries}回ずつ試した（${level}）</small></div>`;
    if (best.cmds.length) {
      const go = document.createElement('button');
      go.type = 'button'; go.className = 'btn';
      const card = sec.querySelector('.plan-card'), boxes = [...card.querySelectorAll('input[type=checkbox]')];
      const note = document.createElement('small');
      note.className = 'skip-note';
      const sync = () => {
        const n = boxes.filter(b => b.checked).length;
        go.textContent = n === boxes.length ? 'この策でいく' : `選んだ${n}つでいく`;
        go.disabled = !n;
        note.textContent = n < boxes.length ? '外した手があるので、上の見込みとは変わる。' : '';
        for (const b of boxes) b.closest('li').classList.toggle('skipped', !b.checked);
      };
      for (const b of boxes) b.addEventListener('change', sync);
      go.addEventListener('click', async () => {
        go.disabled = true;
        for (const b of boxes) b.disabled = true;
        const pick = new Set(boxes.filter(b => b.checked).map(b => +b.dataset.i));
        for (const [i, a] of best.cmds.entries()) {
          if (!pick.has(i)) continue;
          const cmd = { type: a.type, at: a.at, from: a.from, target: a.target, troops: a.troops, x: a.x };
          if (DIPLO[a.type]) await diploAct(a.type, a.target);
          else await doCmd(cmd);
          updateHud();
          await sleep(350);
        }
        save(); openAdvice();
      });
      card.appendChild(note);
      card.appendChild(go);
      sync();
    }
    // ほかの策（くらべる）
    const alt = res.results.slice(1, 3).map(r => `${r.label}（${r.score - best.score >= 0 ? '+' : ''}${(r.score - best.score).toFixed(1)}）`).join('・');
    if (alt) { const p = document.createElement('p'); p.className = 'note'; p.textContent = 'ほかの策：' + alt; sec.appendChild(p); }
  }
  function openAdvice() {
    const f = me(), box = $('adviceList');
    const sage = sanboOf(st, f.id);
    box.innerHTML = sage ? `<div class="adv-who"><span class="off-face" style="background:${fc(f.id).color}">${sage.name[0]}</span>参謀 ${sage.name}（知${sage.int}）の見立て</div>` : '';
    renderPlan(box).then(() => { const who = box.querySelector('.adv-who'); if (who) box.prepend(who); const so = box.querySelector('.soseme'); if (so) box.prepend(so); });
    // 総攻め：残りの行動力で、前線から「有利」以上の町へ一斉に（2か所以上あるときだけ）
    const sp = sosemePlan(st, B, f.id);
    if (sp.length >= 2) {
      const so = document.createElement('div');
      so.className = 'soseme';
      so.innerHTML = `<div class="so-head"><b>総攻め</b><small>行動力 ${Math.ceil(sp.length / 2)} を使い、${sp.length}か所へ一斉に出陣</small></div><ul>${sp.slice(0, 5).map(c => `<li><span class="so-t">${info(c.from).name} → <b>${info(c.at).name}</b>（${fc(st.munis[c.at].owner).name}勢）</span><span class="so-n">兵${c.troops.toLocaleString()}</span><em class="${c.big ? 'big' : ''}">${c.big ? '大勝' : '有利'}</em></li>`).join('')}${sp.length > 5 ? `<li class="more">ほか${sp.length - 5}か所</li>` : ''}</ul>`;
      const b = document.createElement('button');
      b.type = 'button'; b.className = 'btn so-go'; b.textContent = '総攻め！';
      b.disabled = busy;
      b.addEventListener('click', () => {
        const r = soseme(st, B, f.id);
        if (typeof r === 'string') { toast(r); return; }
        sfx('horagai', { gain: 0.6 }); sfx('toki', { delay: 0.5 });
        toast(`${r}か所へ出陣を命じた。月末に合戦`);
        drawOrders(); updateHud(); save();
        $('advice').hidden = true; syncTabs();
        // 命じた弧が見えるように引く
        const pts = sp.flatMap(c => [seat(c.from), seat(c.at)]).filter(Boolean);
        if (pts.length) { const xs = pts.map(q => q.x), zs = pts.map(q => q.z); ctl.flyTo((Math.min(...xs) + Math.max(...xs)) / 2, (Math.min(...zs) + Math.max(...zs)) / 2 + 4, Math.max(120, Math.min(2400, Math.max(Math.max(...xs) - Math.min(...xs), Math.max(...zs) - Math.min(...zs)) * 2)), 0.8); }
      });
      so.appendChild(b);
      box.prepend(so);
    }
    if (f.ap <= 0) box.innerHTML += '<p class="note">今月の行動力は使い切った。「月を進める」で次の月へ。</p>';
    const adv = advise(st, B, f.id, adviceSalt);
    const nm = id => info(id).name;
    const sections = [['戦', adv.war.map(a => { const [h, w] = adviceText(a); return { a, head: h, why: w }; })],
      ['外交', adv.diplo.map(a => ({ a, head: a.type === 'note' ? `${fc(a.target).name}勢との約束` : `${fc(a.target).name}勢と${DIPLO[a.type].name}`, why: a.why }))],
      ['産業', adv.econ.map(a => ({ a, head: a.type === 'meisan' ? `${nm(a.at)}の${a.name}` : `${nm(a.at)}で${COMMANDS[a.type].name}`, why: a.why }))],
      ['人材', adv.people.map(a => ({ a, head: a.type === 'haichi' ? `${a.name}を${nm(a.at)}の城代に` : a.type === 'deleg' ? `${W.idx.prefs[a.pref].name}を${a.name}に任せる` : a.type === 'toyo' ? `${nm(a.at)}で登用` : `${a.name}を狙う`, why: a.why }))]];
    for (const [title, items] of sections) {
      const h = document.createElement('div');
      h.className = 'adv-sec'; h.textContent = title;
      box.appendChild(h);
      if (!items.length) { const p = document.createElement('p'); p.className = 'note'; p.textContent = title === '戦' ? '急ぐ戦はない' : title === '外交' ? 'いまは動かなくてよい' : title === '人材' ? '人の置き方は今のままでよい' : '目立った伸びしろはない'; box.appendChild(p); continue; }
      for (const it of items) {
        const div = document.createElement('div');
        div.className = 'adv';
        div.innerHTML = `<b>${it.head}</b><small>${it.why}</small>`;
        const b = document.createElement('button');
        b.type = 'button';
        const a = it.a;
        if (a.type === 'note' || a.type === 'meisan' || a.type === 'prize') {
          b.textContent = '見る';
          b.addEventListener('click', () => { if (a.type === 'note') toggleSide('diplo', openDiplo); else { const s = seat(a.at); if (s) ctl.flyTo(s.x, s.z + 1, 90); openPanel(a.at); } });
        } else if (a.type === 'haichi' || a.type === 'deleg') {
          b.textContent = 'そうする';   // 配置と委任は行動力を使わない
          b.addEventListener('click', () => {
            const r = a.type === 'haichi' ? assignOfficer(st, f.id, a.oid, a.at) : setDelegation(st, B, a.pref, a.oid, 'naisei');
            if (r !== true) { toast(r); return; }
            sfx('stamp');   // 任命の判子（2026-10-20 本人指摘：城代・委任の「そうする」に音がなかった）
            toast(a.type === 'haichi' ? `${a.name}を${nm(a.at)}の城代に` : `${W.idx.prefs[a.pref].name}を${a.name}に任せた（内政）`);
            fx.play(a.type, { at: a.type === 'haichi' ? a.at : bigIn(a.pref), f: f.id, name: a.name });
            updateHud(); save(); openAdvice();
          });
        } else {
          b.textContent = 'そうする';
          b.disabled = f.ap <= 0;
          b.addEventListener('click', async () => {
            if (judging) return;
            b.disabled = true;
            const cmd = { type: a.type, at: a.at, from: a.from, target: a.target, troops: a.troops, x: a.x };
            if (DIPLO[a.type]) await diploAct(a.type, a.target);
            else await doCmd(cmd);
            updateHud(); openAdvice();
          });
        }
        div.appendChild(b);
        box.appendChild(div);
      }
    }
  }

  document.querySelectorAll('[data-close]').forEach(b => b.addEventListener('click', () => { $(b.dataset.close).hidden = true; syncTabs(); }));

  // その県で持っているいちばん大きな市町村（委任の演出の場所）
  const bigIn = pc => Object.values(st.munis).filter(m => m.owner === st.player && info(m.id).pref === pc).sort((a, b) => info(b.id).pop - info(a.id).pop)[0]?.id;

  // ── 人材と委任 ──
  const ABIL = [['pol', '政', '#2ec4b6'], ['war', '武', '#ff5a5f'], ['int', '知', '#4d96ff']];
  function officerCard(o, f) {
    const div = document.createElement('div');
    div.className = 'off';
    const post = o.gov ? `${W.idx.prefs[o.gov]?.name || ''} 知事代理` : o.at ? `${info(o.at).name} 城代` : '手すき';
    div.innerHTML = `<div class="off-head"><span class="off-face" style="background:${fc(f).color}">${o.name[0]}</span><span>${o.name}<br><small>${post}</small></span><span class="off-trait" title="${TRAITS[o.trait].desc}">${TRAITS[o.trait].name}</span></div>` +
      `<div class="abil">${ABIL.map(([k, l, c]) => `<span>${l} ${o[k]}</span><span class="b"><i style="width:${o[k]}%;background:${c}"></i></span>`).join('')}</div>`;
    return div;
  }
  function openPeople() {
    const f = me(), box = $('peopleList'), offs = officersOf(st, f.id);
    box.innerHTML = '';
    if (!offs.length) box.innerHTML = '<p class="note">人材がいません。自領で「登用」すると探せます。</p>';
    const mine = Object.values(st.munis).filter(m => m.owner === f.id).sort((a, b) => info(b.id).pop - info(a.id).pop);
    const sb = sanboOf(st, f.id);
    for (const o of offs) {
      const div = officerCard(o, f.id);
      if (sb && sb.id === o.id) div.querySelector('.off-head span:nth-child(2) small').textContent += '・参謀';
      else {
        const b = document.createElement('button');
        b.type = 'button'; b.className = 'mini'; b.textContent = '参謀にする';
        b.addEventListener('click', () => { st.sanbo = o.id; toast(`${o.name}を参謀にした（知${o.int}）`); save(); openPeople(); });
        div.appendChild(b);
      }
      if (!o.gov) {
        const sel = document.createElement('select');
        sel.setAttribute('aria-label', `${o.name}の置き場所`);
        sel.innerHTML = '<option value="">手すき（置かない）</option>' + mine.map(m => { const h = offs.find(x => x.at === m.id && x !== o); return `<option value="${m.id}" ${o.at === m.id ? 'selected' : ''}>${info(m.id).name}${h ? `（${h.name}と交代）` : ''}</option>`; }).join('');
        sel.addEventListener('change', () => { const r = assignOfficer(st, f.id, o.id, sel.value ? +sel.value : null); if (r !== true) toast(r); else { sfx(sel.value ? 'stamp' : 'cancel'); toast(sel.value ? `${o.name}を${info(+sel.value).name}の城代に` : `${o.name}を手すきに`); if (sel.value) fx.play('haichi', { at: +sel.value, f: f.id, name: o.name }); } openPeople(); updateHud(); save(); });
        div.appendChild(sel);
      }
      const fire = document.createElement('button');   // 解雇（浪人に戻る。いた町で、あとで登用すれば先に見つかる）
      fire.type = 'button'; fire.className = 'mini ghost fire'; fire.textContent = '解雇';
      fire.addEventListener('click', () => {
        if (!confirm(`${o.name}を解雇しますか？（浪人に戻り、${info(o.at ?? f.capital)?.name || '本拠'}に残ります。ほかの勢力に引き抜かれることもあります）`)) return;
        const r = dismissOfficer(st, B, f.id, o.id); if (r !== true) { toast(r); return; }
        sfx('cancel'); toast(`${o.name}を解雇した`); updateHud(); save(); openPeople();
      });
      div.appendChild(fire);
      box.appendChild(div);
    }
    $('peopleCount') && ($('peopleCount').textContent = (cap => `${offs.length} / ${cap}人${offs.length >= cap ? '（いっぱい。解雇するか、市町村100ごとに2人増える）' : ''}`)(officerCap(st, f.id)));
    // スカウト（浪人と、隣り合う勢力の城代）
    const sc = $('scoutList');
    sc.innerHTML = '';
    const targets = scoutTargets(st, B, f.id);
    if (!targets.length) sc.innerHTML = '<p class="note">近くに引き抜ける人材がいない。</p>';
    for (const o of targets) {
      const T = scoutTerms(st, B, f.id, o), div = officerCard(o, o.f >= 0 ? o.f : f.id);
      div.querySelector('.off-head span:nth-child(2) small').textContent = o.f < 0 ? `浪人・${info(o.at).name}` : `${fc(o.f).name}勢・${info(o.at).name} 城代`;
      if (o.f < 0) div.querySelector('.off-face').style.background = '#9aa5b1';
      const b = document.createElement('button');
      b.type = 'button'; b.className = 'mini'; b.textContent = `引き抜く（予算${T.gold}・見込み${Math.round(T.chance * 100)}%）`;
      b.disabled = f.ap <= 0 || f.gold < T.gold;
      b.addEventListener('click', async () => {
        if (judging || busy) return;
        b.disabled = true;
        const from = o.f, at = o.at;
        const cmd = { type: 'scout', target: o.id }, r = command(st, B, f.id, cmd);
        if (r !== true) { toast(r); b.disabled = false; return; }
        updateHud(); save();
        await verdict({
          face: o.name[0], color: from >= 0 ? fc(from).color : '#9aa5b1',
          wait: `${o.name}を口説いている`, ok: cmd.result.ok, stamp: cmd.result.ok ? '仕官' : 'お断り',
          line: cmd.result.ok ? `${o.name}が仕えることになった` : `${o.name}に断られた${from >= 0 ? `（${fc(from).name}勢との関係が下がる）` : ''}`
        });
        if (cmd.result.ok) fx.play('toyo', { at: at || me().capital, name: o.name });
        openPeople();
      });
      div.appendChild(b);
      sc.appendChild(div);
    }
    // 委任：自分が持っている県ごと
    const dl = $('delegList');
    dl.innerHTML = '';
    const prefs = {};
    for (const m of mine) { const p = info(m.id).pref; prefs[p] = (prefs[p] || 0) + 1; }
    for (const [pc, n] of Object.entries(prefs)) {
      const d = st.delegs[pc], div = document.createElement('div');
      div.className = 'dl';
      div.innerHTML = `<div class="dl-head"><span>${W.idx.prefs[pc].name}</span><small>${n}市町村${d ? `・財布 ${Math.floor(d.purse)}` : ''}</small></div>`;
      const last = st.delegLast?.[pc];   // 先月の知事代理の手
      if (d && last && st.turn - last.turn <= 1 && last.acts.length) {
        const nameOf = t => (COMMANDS[t] || DIPLO[t])?.name || t;
        div.insertAdjacentHTML('beforeend', `<p class="note dl-last" style="margin:4px 0 0">先月：${last.acts.slice(0, 4).map(a => a.at ? `${info(a.at).name}で${nameOf(a.type)}` : nameOf(a.type)).join('・')}${last.acts.length > 4 ? ` ほか${last.acts.length - 4}` : ''}</p>`);
      }
      if (pc === me().pref) {   // 地元は知事のあなたが治める（委任しない）
        div.insertAdjacentHTML('beforeend', '<p class="note" style="margin:4px 0 0">地元の県は、知事のあなたが治めます。知事選の民心もここで決まります。</p>');
        dl.appendChild(div); continue;
      }
      const sel = document.createElement('select');
      sel.setAttribute('aria-label', `${W.idx.prefs[pc].name}の知事代理`);
      sel.innerHTML = '<option value="">自分で治める</option>' + offs.filter(o => !o.gov || o.gov === pc).map(o => `<option value="${o.id}" ${d && d.oid === o.id ? 'selected' : ''}>${o.name}（政${o.pol}）</option>`).join('');
      sel.addEventListener('change', () => {
        const r = setDelegation(st, B, pc, sel.value ? +sel.value : null, d ? d.policy : 'naisei');
        if (r !== true) toast(r); else { sfx(sel.value ? 'stamp' : 'cancel'); toast(sel.value ? `${W.idx.prefs[pc].name}を任せた` : `${W.idx.prefs[pc].name}を自分で治める（財布は戻る）`); if (sel.value) fx.play('deleg', { at: bigIn(pc), f: f.id, name: officersOf(st, f.id).find(o => o.id === +sel.value)?.name || '' }); }
        openPeople(); updateHud(); save();
      });
      div.appendChild(sel);
      if (d) {
        const seg = document.createElement('div');
        seg.className = 'seg tiny';
        seg.innerHTML = Object.entries(POLICY).map(([k, v]) => `<button type="button" data-p="${k}" aria-pressed="${d.policy === k}">${v}</button>`).join('');
        seg.addEventListener('click', e => { const b = e.target.closest('button'); if (!b) return; d.policy = b.dataset.p; toast(`${W.idx.prefs[pc].name}：${POLICY[d.policy]}重視`); openPeople(); save(); });
        div.appendChild(seg);
      }
      dl.appendChild(div);
    }
  }

  // ── 申し出（CPU からプレイヤーへ）──
  //  はじめて届いた申し出は、相手の都からこちらの都へ使者が弧を描いて来てから、書状が開く
  const seenAsk = new Set();
  let envoyBusy = false;
  const askKey = p => `${p.from}-${p.kind}-${p.turn}`;
  // 申し出の使者を見せる前のカメラ（答え終わったら、ここへ戻す。続けて来たときは最初の位置）
  let askHome = null;
  // 県がまるごと入るカメラの位置。本拠から陸続きの市町村の役所の広がりで測る（離島まで入れると東京・鹿児島・沖縄が海ばかりになる）
  function prefView(pref, cap) {
    const ok = id => B.info.get(id)?.pref === pref;
    const set = new Set(ok(cap) ? [cap] : []), q = [...set];
    while (q.length) for (const n of B.landNb(q.pop())) if (!set.has(n) && ok(n)) { set.add(n); q.push(n); }
    let x0 = Infinity, x1 = -Infinity, z0 = Infinity, z1 = -Infinity;
    for (const id of set) { const s = seat(id); if (!s) continue; x0 = Math.min(x0, s.x); x1 = Math.max(x1, s.x); z0 = Math.min(z0, s.z); z1 = Math.max(z1, s.z); }
    if (x0 > x1) { const s = seat(cap); return s ? { x: s.x, z: s.z + 2, d: 600 } : null; }
    return { x: (x0 + x1) / 2, z: (z0 + z1) / 2, d: Math.max(600, Math.min(12000, Math.max(x1 - x0, (z1 - z0) * 1.4) * 1.3)) };
  }
  async function showProposal() {
    const p = st && st.proposals.find(p => p.to === st.player);
    if (!p) {
      $('ask').hidden = true;
      if (askHome && st && !st.over) ctl.flyTo(askHome.x, askHome.z, askHome.d, 0.9);
      askHome = null;
      return;
    }
    if (envoyBusy || !$('ask').hidden) return;
    const t = fc(p.from), f = me();
    if (!seenAsk.has(askKey(p))) {
      seenAsk.add(askKey(p));
      envoyBusy = true;
      // 相手の県を画面いっぱいに映す（2026-10-20 本人指摘。前は両方の本拠の中ほどを遠くから映していて、遠い相手だと日本の半分が入り、相手がどこか分からなかった）
      const tf = st.factions[p.from], v = prefView(tf.pref, tf.origCapital);
      if (v && speed > 0) {
        if (!askHome) askHome = { x: ctl.st.target.x, z: ctl.st.target.z, d: ctl.st.dist };
        ctl.flyTo(v.x, v.z, v.d, 0.8);
        await sleep(850);
        fx.play('envoy', { f: p.from, target: st.player }); sfx('suzu');
        await sleep(1500);
      }
      envoyBusy = false;
      if (!st || !st.proposals.includes(p)) return;
    }
    const n = Object.values(st.munis).filter(m => m.owner === p.from).length, rel = Math.round(getRel(st, f.id, p.from));
    $('askSeal').textContent = t.name[0];
    $('askSeal').style.background = t.color;
    $('askSeal').classList.toggle('light', isLight(t.color));
    $('askTitle').textContent = `${t.name}勢から${DIPLO[p.kind].name}の申し出`;
    $('askWho').textContent = `${t.name}勢（${n}市町村）・関係 ${rel >= 0 ? '+' : ''}${rel}`;
    $('askText').textContent = DIPLO[p.kind].desc + '。';
    const card = $('askCard');
    card.classList.remove('open'); void card.offsetWidth; card.classList.add('open'); sfx('letter');
    $('ask').hidden = false;
  }
  let answering = false;
  const answer = async yes => {
    if (answering) return;
    const i = st.proposals.findIndex(p => p.to === st.player);
    if (i < 0) { $('ask').hidden = true; return; }
    answering = true;
    const [p] = st.proposals.splice(i, 1);
    st.proposals.unshift(p);
    respond(st, B, yes);
    $('ask').hidden = true;
    updateHud(); save();
    const t = fc(p.from), D = DIPLO[p.kind];
    if (yes && p.kind === 'shinju') { await cutin({ kicker: '臣従', title: `${t.name}勢が臣下に`, sub: '領地も兵も人材もすべて加わった', color: me().color }); await vassalWave(p.from, st.player); syncAll(); }
    else {
      await verdict({ face: t.name[0], color: t.color, wait: `${t.name}勢へ返書を届けている`, ok: yes, stamp: yes ? `${D.name}成立` : 'お断り', line: yes ? `${t.name}勢と${D.name}を結んだ` : `${t.name}勢の申し出を断った（関係が少し下がる）` });
      if (yes) { fx.play(p.kind, { f: st.player, target: p.from, ok: true }); if (askHome) await sleep(1200); }   // 結んだ演出を見せてから戻す
    }
    answering = false;
    setTimeout(showProposal, 300);
  };
  $('askYes').addEventListener('click', () => answer(true));
  $('askNo').addEventListener('click', () => { sfx('cancel'); answer(false); });
  function toast(text) {
    const t = $('toast');
    t.textContent = text; t.hidden = false;
    clearTimeout(toast.t); toast.t = setTimeout(() => { t.hidden = true; }, 1800);
  }
  function news(text) {
    const el = document.createElement('div');
    el.textContent = text;
    $('news').prepend(el);
    while ($('news').children.length > 4) $('news').lastChild.remove();
    setTimeout(() => el.remove(), 6000);
  }

  // ── 市町村の札とコマンド ──
  // 勝算：占領できる見込み（合戦と同じ決まり）で分ける。3つめに見込みの割合
  function odds(A, D, atk, def) {
    const r = A / Math.max(1, D), p = winChance(A, D, atk, def);
    if (p >= 0.97 && r > 2) return ['大勝', '#2ec4b6', p];
    if (p >= 0.75) return ['有利', '#4d96ff', p];
    if (p >= 0.35) return ['五分', '#ff9f43', p];
    return ['不利', '#ff5a5f', p];
  }
  function pendingFrom(id) { return st.orders.filter(o => o.from === id).reduce((a, o) => a + o.troops, 0); }
  function openPanel(id) {
    const m = st && st.munis[id];
    if (!m) { closePanel(); return; }
    document.querySelectorAll('.targets[data-tmp]').forEach(e => e.remove());   // 前の町の攻め先一覧を残さない
    if (id !== sel) sfx('card', { gap: 120 });
    sel = id; U.uSel.value = id;
    for (const p of ['diplo', 'cards', 'people', 'advice', 'intel', 'rank', 'warlog']) $(p).hidden = true;
    syncTabs();
    const i = info(id), f = me(), own = f && m.owner === f.id;
    $('panel').hidden = false;
    $('pName').textContent = i.name;
    $('pOwnerChip').textContent = fc(m.owner).name + '勢' + (isolated(st, B, m.id) ? '・孤立' : '') + (m.camp > 0 ? '・陣' : '');
    $('pOwnerChip').style.background = fc(m.owner).color;
    $('pOwnerChip').classList.toggle('light', isLight(fc(m.owner).color));
    $('pPop').textContent = i.pop.toLocaleString() + '人';
    // 補給線・陣の知らせ（2026-10-19 本人要望：囲まれた町を押したら分かるように）
    { const al = $('pAlert'), mine = f && m.owner === f.id, iso = isolated(st, B, id), notes = [];
      if (iso && mine) {
        const when = (m.cut || 0) >= 1 ? 'この月の終わりから' : '来月の終わりから';
        notes.push(['bad', '補給線が絶たれています', `本拠とつながっていません。守り−15%、民心が毎月下がり、${when}まわりの敵に降るおそれ。まわりの町を取るか、近くの港を押さえてつなぎ直そう。`]);
      } else if (iso) notes.push(['chance', '補給線が絶たれた町', `${fc(m.owner).name}勢の本拠とつながっていません。守り−15%。囲み続けると、まわりで兵の多い勢力へ降ることがある${(m.cut || 0) >= 1 ? '（もう降り始める頃）' : ''}。`]);
      if (m.camp > 0) notes.push(['camp', '陣を張ったばかり', `守り+${Math.round((campK(m) - 1) * 100)}%（あと${m.camp}か月、だんだん弱まる）。取ってすぐは取り返されにくい。`]);
      al.hidden = !notes.length;
      al.innerHTML = notes.map(([k, h, t]) => `<p class="${k}"><b>${h}</b>${t}</p>`).join(''); }
    const pend = pendingFrom(id);
    $('pTroops').textContent = m.troops.toLocaleString() + '人' + (pend ? `（出陣待ち ${pend.toLocaleString()}）` : '');
    $('pMorale').style.width = Math.round(m.morale * 100) + '%';
    { const ml = B.meisan?.get(id) || [];
      $('pMeisan').textContent = ml.length ? ml.slice(0, 2).map(x => x.name + (x.wide ? '（県）' : '')).join('・') + (ml.length > 2 ? ` ほか${ml.length - 2}` : '') : '―';
      $('pMeisan').title = ml.map(x => `${x.name}（${srcText(x)}）`).join('\n'); }
    const cast = (st.officers || []).find(o => o.f === m.owner && o.at === id), dg = st.delegs && m.owner === st.player && st.delegs[i.pref];
    $('pLv').innerHTML = `<span>農 ${m.agri}</span><span>工 ${m.ind}</span><span>商 ${m.com}</span><span>城 ${m.fort}</span>` + (i.port ? '<span>港</span>' : '') + (st.factions.some(x => x.capital === id) ? '<span>本拠</span>' : '') +
      (cast ? `<span>城代 ${cast.name}（武${cast.war}）</span>` : '') + (dg ? `<span>委任中・${POLICY[dg.policy]}</span>` : '');
    const box = $('pCmds');
    box.innerHTML = '';
    $('pNote').textContent = '';
    if (!f || st.over) return;
    const add = (type, label, sub, onClick, war, cost, short) => {
      const b = document.createElement('button');
      b.type = 'button'; b.className = 'cmd' + (war ? ' war' : '') + (short ? ' short' : '');
      b.title = COMMANDS[type]?.desc || '';
      b.innerHTML = `<b>${label}</b><small class="eff">${sub}</small>` + (short ? `<small class="lack">${short}</small>` : cost ? `<small>${cost}</small>` : '');
      b.disabled = f.ap <= 0 || busy || !!short;
      b.addEventListener('click', onClick);
      box.appendChild(b);
    };
    const costText = c => [c.gold && `予算${c.gold}`, c.food && `兵糧${c.food}`, c.arms && `装備${c.arms}`].filter(Boolean).join('・') || '―';
    const lackText = c => [c.gold > f.gold && `予算が${Math.ceil(c.gold - f.gold)}`, c.food > f.food && `兵糧が${Math.ceil(c.food - f.food)}`, c.arms > f.arms && `装備が${Math.ceil(c.arms - f.arms)}`].filter(Boolean).join('・');
    if (own) {
      // まとめて行う：予算を使って1手で大きく（商業・開墾・殖産・築城は最大3段、徴兵は2倍）。行動力は1のまま
      const tg = document.createElement('button');
      tg.type = 'button'; tg.className = 'bulk' + (bulk ? ' on' : '');
      tg.setAttribute('aria-pressed', String(bulk));
      tg.innerHTML = `<b>まとめて行う</b><small>${bulk ? '内政は最大3段・徴兵は2倍・募兵は3倍（費用もそのぶん）' : '予算を使って、1手で大きく'}</small>`;
      tg.addEventListener('click', () => { bulk = !bulk; refreshPanel(); });
      box.appendChild(tg);
      for (const t of ['shogyo', 'kaikon', 'shokusan', 'hodokoshi', 'chikujo', 'chohei', 'bohei', 'toyo']) {
        const C = COMMANDS[t], canBulk = ['shogyo', 'kaikon', 'shokusan', 'chikujo', 'chohei', 'bohei'].includes(t);
        const x = bulk && canBulk ? (t === 'chohei' ? 2 : 3) : 1;
        const co = t === 'toyo' || t === 'hodokoshi' ? (t === 'toyo' ? C.cost : commandCost(st, B, id, t)) : bulkCost(st, B, id, t, x), lack = lackText(co);
        add(t, C.name, commandPreview(st, B, f.id, t, id, x), () => doCmd({ type: t, at: id, x }), false, costText(co), lack ? lack + '足りない' : '');
      }
      if (i.port) { const lk = lackText(COMMANDS.zosen.cost); add('zosen', '造船', commandPreview(st, B, f.id, 'zosen', id), () => doCmd({ type: 'zosen', at: id }), false, costText(COMMANDS.zosen.cost), lk ? lk + '足りない' : ''); }
      const nbOwn = B.landNb(id).filter(n => st.munis[n] && st.munis[n].owner === f.id);
      if (nbOwn.length) add('ido', '移動', '隣の自領から呼ぶ', () => openSheet('ido', id));
      // 集結：奥の町から兵をまとめて（2026-10-20）
      { const pl = musterPlan(st, B, f.id, id);
        if (pl.n >= 1000) add('shuketsu', '集結', `兵 +${pl.n.toLocaleString()}（${pl.srcs.length}町から）`, () => doCmd({ type: 'shuketsu', at: id }), false, `予算${pl.gold}`, f.gold < pl.gold ? `予算が${Math.ceil(pl.gold - f.gold)}足りない` : ''); }
      $('pNote').textContent = '行動力を1つ使います。数字はこの市町村での見込みです。';
    } else {
      const land = B.landNb(id).filter(n => st.munis[n] && st.munis[n].owner === f.id);
      const sea = B.seaNb(id).filter(n => st.munis[n] && st.munis[n].owner === f.id);
      const peace = peaceful(st, f.id, m.owner);
      if (peace) { const pc = pactOf(st, f.id, m.owner); $('pNote').textContent = pc ? `${fc(m.owner).name}勢とは${DIPLO[pc.type].name}中です。` : `開幕の備えの間（あと${OPENING - st.turn}か月）は、どこも攻めこめません。`; return; }
      if (land.length) add('shutsujin', '出陣', '隣の自領から攻める', () => openSheet('shutsujin', id), true);
      if (sea.length) {
        const tiers = [...new Set(sea.map(n => B.seaInfo(n, id).tier))].sort();
        add('tokai', '渡海', `${tiers.map(t => SEA[t].name).join('・')}・船${f.ships}隻`, () => openSheet('tokai', id), true);
      }
      $('pNote').textContent = land.length || sea.length ? (isWinter(st) && sea.length ? '冬の海は時化で引き返すことがあります。' : '') : '隣に自領がないので攻められません。';
    }
    // 攻められる隣の一覧（自領を選んだとき）
    if (own) {
      const targets = [...new Set([...B.landNb(id), ...B.seaNb(id)])].filter(n => st.munis[n] && st.munis[n].owner !== f.id && !peaceful(st, f.id, st.munis[n].owner));
      if (targets.length) {
        const list = document.createElement('div');
        list.className = 'targets';
        for (const n of targets.slice(0, 6)) {
          const e = st.munis[n], naval = !B.landNb(id).includes(n);
          const nA = Math.max(0, (m.troops - pendingFrom(id)) * 0.75);
          const A = attackPower(st, f, nA, naval, commanderAt(st, f.id, id)) * crossK(st, B, id, n), [lab, col] = odds(A, defense(st, B, e), nA, e.troops);
          const b = document.createElement('button');
          b.type = 'button';
          b.innerHTML = `<span><span class="dot" style="background:${fc(e.owner).color};display:inline-block;margin-right:6px;vertical-align:-1px"></span>${info(n).name}${naval ? '（海）' : ''}</span><span class="odds-tag" style="background:${col}">${lab}</span>`;
          b.addEventListener('click', () => { const s = seat(n); if (s) ctl.flyTo(s.x, s.z + 1, Math.min(ctl.st.dist, 120)); openPanel(n); });
          list.appendChild(b);
        }
        box.after(list);
        list.dataset.tmp = '1';
      }
    }
  }
  function closePanel() { sel = -1; U.uSel.value = -1; $('panel').hidden = true; document.querySelectorAll('.targets[data-tmp]').forEach(e => e.remove()); }
  function refreshPanel() { document.querySelectorAll('.targets[data-tmp]').forEach(e => e.remove()); if (sel > 0) openPanel(sel); }
  $('panelClose').addEventListener('click', closePanel);

  let bulk = false;   // 町の札の「まとめて行う」
  let armsNoted = false;   // 装備の自動買い入れの説明は最初の1回だけ
  async function doCmd(cmd) {
    if (busy || judging) return;
    const r = command(st, B, st.player, cmd);
    if (r !== true) { toast(r); return; }
    const C = COMMANDS[cmd.type], name = info(cmd.at).name;
    sfx({ shogyo: 'coin', kaikon: 'zaku', shokusan: 'tonton', chikujo: 'tonton', hodokoshi: 'matsuri', chohei: 'ashioto', bohei: 'ashioto', zosen: 'kiteki', ido: 'ashioto', shuketsu: 'ashioto', shutsujin: 'ashioto', tokai: 'kiteki' }[cmd.type] || 'decide');
    if (cmd.type === 'chohei' || cmd.type === 'shuketsu' || cmd.type === 'bohei') sfx('ou', { delay: 0.35 });
    if (cmd.type === 'shuketsu') toast(`${name}へ ${cmd.result.toLocaleString()}人 を集めた（月末に地図で動く）`);
    else if (cmd.type === 'chohei') toast(`${name}で ${cmd.result.toLocaleString()}人 を集めた`);
    else if (cmd.type === 'bohei') toast(`${name}で ${cmd.result.toLocaleString()}人 を雇った`);
    else if (cmd.type === 'toyo') {
      updateHud(); save();
      const o = cmd.result;
      await verdict({ face: o ? o.name[0] : '？', color: o ? me().color : '#9aa5b1', wait: `${name}で人材を探している`, ok: !!o, stamp: o ? '仕官' : '見つからず', line: o ? `${o.name}（${TRAITS[o.trait].name}）が仕えることになった` : `${name}では見つからなかった` });
    }
    else if (cmd.type === 'shutsujin' || cmd.type === 'tokai') toast(`${name}へ${C.name}の命令（月末に合戦）`);
    else toast(`${name}：${C.name}${cmd.result > 1 && cmd.type !== 'chohei' && cmd.type !== 'bohei' ? `（${cmd.result}段）` : ''}`);
    if (cmd.type === 'ido' || cmd.type === 'shuketsu' || cmd.type === 'shutsujin' || cmd.type === 'tokai') drawOrders();
    else fx.play(cmd.type, { at: cmd.at, f: st.player, n: cmd.result, name: cmd.type === 'toyo' && cmd.result ? cmd.result.name : null });
    if (cmd.type === 'hodokoshi') owners.setMorale(cmd.at, st.munis[cmd.at].morale);
    updateHud(); refreshPanel(); save();
  }

  // ── 出陣・移動・渡海のシート ──
  let sheetCtx = null;
  function openSheet(type, at) {
    const f = me(), naval = type === 'tokai';
    const srcs = (naval ? B.seaNb(at) : B.landNb(at)).filter(n => st.munis[n] && st.munis[n].owner === f.id && st.munis[n].troops - pendingFrom(n) > 300);
    if (!srcs.length) { toast('出せる兵がいません'); return; }
    srcs.sort((a, b) => st.munis[b].troops - st.munis[a].troops);
    sheetCtx = { type, at };
    $('sTitle').textContent = `${info(at).name}へ${COMMANDS[type].name}`;
    $('sFrom').innerHTML = srcs.map(n => { const t = naval ? B.seaInfo(n, at).tier : -1; return `<option value="${n}">${info(n).name}（${(st.munis[n].troops - pendingFrom(n)).toLocaleString()}人${t >= 0 ? '・' + SEA[t].name + (SEA[t].months ? SEA[t].months + 'か月' : '') : ''}）</option>`; }).join('');
    $('sheet').hidden = false;
    sheetSrc();
  }
  function sheetSrc() {
    const f = me(), from = +$('sFrom').value, src = st.munis[from];
    let max = src.troops - pendingFrom(from) - 100;
    if (sheetCtx.type === 'tokai') max = Math.min(max, f.ships * 1500);
    const r = $('sTroops');
    r.max = Math.max(200, Math.floor(max / 100) * 100);
    r.value = Math.max(200, Math.floor(max * 0.75 / 100) * 100);
    // はじめの兵の数：「大勝」に届くいちばん少ない数（届かなければ「有利」、それも無理なら75%）。守り155人に1万人以上を送らないように
    if (sheetCtx.type !== 'ido') {
      const e = st.munis[sheetCtx.at], cm = commanderAt(st, f.id, from), ck = sheetCtx.type === 'tokai' ? 1 : crossK(st, B, from, sheetCtx.at), D = defense(st, B, e);
      const labAt = n => odds(attackPower(st, f, n, sheetCtx.type === 'tokai', cm) * ck, D, n, e.troops)[0];
      for (const want of ['大勝', '有利']) { let hit = 0; for (let n = 200; n <= +r.max; n += 100) if (labAt(n) === want) { hit = n; break; } if (hit) { r.value = hit; break; } }
    }
    sheetOdds();
  }
  function sheetOdds() {
    const f = me(), n = +$('sTroops').value;
    $('sTroopsV').textContent = n.toLocaleString() + '人';
    if (sheetCtx.type === 'ido') { $('sOdds').textContent = ''; return; }
    const cm = commanderAt(st, f.id, +$('sFrom').value);
    const ck = crossK(st, B, +$('sFrom').value, sheetCtx.at), ph = B.pass(+$('sFrom').value, sheetCtx.at);
    const [lab, col, pw] = odds(attackPower(st, f, n, sheetCtx.type === 'tokai', cm) * ck, defense(st, B, st.munis[sheetCtx.at]), n, st.munis[sheetCtx.at].troops);
    const passNote = ck < 0.97 ? `<br><small>峠越え（${ph}m）・攻め ${Math.round((ck - 1) * 100)}%${isWinter(st) && ph > 600 ? '（雪）' : ''}</small>` : ph < 120 && sheetCtx.type === 'shutsujin' ? '<br><small>平地の道</small>' : '';
    let seaNote = '';
    if (sheetCtx.type === 'tokai') {
      const t = B.seaInfo(+$('sFrom').value, sheetCtx.at).tier, S = SEA[t];
      const pStorm = Math.round(stormChance(st, B, t, sheetCtx.at, cm) * 100);
      seaNote = `<br><small>${S.name}（${Math.round(B.seaInfo(+$('sFrom').value, sheetCtx.at).km)}km）・${S.months ? `着くまで${S.months}か月` : 'この月のうちに上陸'}・時化や台風 ${pStorm}%${S.lose ? `（あえば兵の${Math.round(S.lose * 100)}%を失う）` : ''}${f.ships < S.ships ? `<br><b style="color:#d64545">船が${S.ships}隻いります（いま${f.ships}隻）</b>` : ''}</small>`;
      $('sOk').disabled = f.ships < S.ships;
    } else $('sOk').disabled = false;
    $('sOdds').innerHTML = `勝算 <span class="odds-tag" style="background:${col}">${lab}</span> 占領の見込み ${pw >= 0.97 ? 'ほぼ確実' : Math.round(pw * 100) + '%'}${lab === '有利' && pw >= 0.97 ? '<small>（力が2倍に届かず、兵の減りは多め）</small>' : ''}${pw >= 0.97 ? '<br><small>いまの守りでの見込み。月末までに守りが増えると負けることも</small>' : ''}　守り ${st.munis[sheetCtx.at].troops.toLocaleString()}人${isolated(st, B, sheetCtx.at) ? '（孤立・守り−15%）' : ''}${st.munis[sheetCtx.at].camp > 0 ? `（陣を張ったばかり・守り+${Math.round((campK(st.munis[sheetCtx.at]) - 1) * 100)}%）` : ''}` + (cm ? `<br><small>大将 ${cm.name}（武${cm.war}・${TRAITS[cm.trait].name}）</small>` : '') + passNote + seaNote ;
  }
  $('sFrom').addEventListener('change', sheetSrc);
  $('sTroops').addEventListener('input', sheetOdds);
  $('sCancel').addEventListener('click', () => { $('sheet').hidden = true; });
  $('sOk').addEventListener('click', () => {
    $('sheet').hidden = true;
    doCmd({ type: sheetCtx.type, at: sheetCtx.at, from: +$('sFrom').value, troops: +$('sTroops').value });
  });

  // ── 命令の矢印（月末まで地図に出す）──
  const orderLayer = new THREE.Group();
  scene.add(orderLayer);
  function arc(a, b, h) {
    const mid = new THREE.Vector3((a.x + b.x) / 2, Math.max(a.y, b.y) + h, (a.z + b.z) / 2);
    return new THREE.QuadraticBezierCurve3(a, mid, b);
  }
  // 外洋・遠洋の道すじ（世界座標の点）。近海は細かいタイルの海で探す
  function seaPath(from, to, tier) {
    const r = tier > 0 ? B.route(from, to) : null;
    if (r) return r.map(([lon, lat]) => [W.lonX(lon), W.latZ(lat)]);
    const a = info(from).port, b = info(to).port;
    return a && b ? life.seaRoute(a, b) : null;
  }
  function drawOrders() {
    for (const c of [...orderLayer.children]) { orderLayer.remove(c); c.geometry?.dispose(); if (c.userData.order) c.material?.dispose(); }
    // 海を渡っている船団（着くまで地図に出したまま）
    for (const v of st.voyages || []) {
      const pts = seaPath(v.from, v.to, v.tier);
      if (!pts || pts.length < 2) continue;
      const curve = new THREE.CatmullRomCurve3(pts.map(([x, z]) => new THREE.Vector3(x, 0.4, z)));
      const mine = v.f === st.player, col = fc(v.f).color;
      const line = new THREE.Mesh(new THREE.TubeGeometry(curve, 80, 1, 5), new THREE.MeshBasicMaterial({ color: col, transparent: true, opacity: 0.55 }));
      line.userData.curve = curve; line.userData.r = 1;
      const k = (st.turn - v.start + 0.5) / (v.eta - v.start + 1);
      const p = curve.getPoint(Math.min(0.95, k)), q = curve.getPoint(Math.min(1, k + 0.02));
      const ship = new THREE.Group();
      const hull = new THREE.Mesh(new THREE.BoxGeometry(14, 3, 5), new THREE.MeshBasicMaterial({ color: '#ffffff' }));
      const sail = new THREE.Mesh(new THREE.BoxGeometry(0.8, 10, 9), new THREE.MeshBasicMaterial({ color: col }));
      sail.position.y = 6; ship.add(hull, sail);
      ship.position.copy(p); ship.rotation.y = Math.atan2(-(q.z - p.z), q.x - p.x);
      ship.userData.voyage = true; line.userData.voyage = true;
      orderLayer.add(line, ship);
    }
    orderTagsEl.innerHTML = ''; orderTags.length = 0; orderRings.length = 0; orderDist = ctl.st.dist;
    for (const o of st.orders) {
      const s0 = seat(o.from), s1 = seat(o.to);
      if (!s0 || !s1) continue;
      const atk = o.type !== 'ido', col = new THREE.Color(fc(o.f).color);
      const a = new THREE.Vector3(s0.x, s0.y + 1.5, s0.z), b = new THREE.Vector3(s1.x, s1.y + 1.2, s1.z);
      const d = a.distanceTo(b), curve = arc(a, b, Math.min(d * (atk ? 0.32 : 0.2) + 2.5, ctl.st.dist * 0.1 + 2));   // 寄っているときは低く（画面をふさがない）
      const r = Math.max((atk ? 0.42 : 0.3) + d * 0.004, ctl.st.dist * (atk ? 0.0042 : 0.003));   // 引いても画面の上で細くなりすぎない
      // 弧：墨の縁取り（裏面を少し太く）＋ 勢力の色に行き先へ流れる光（移動は点線）
      const ink = new THREE.MeshBasicMaterial({ color: INK, side: THREE.BackSide });
      const line = new THREE.Mesh(new THREE.TubeGeometry(curve, 48, r, 8), new THREE.ShaderMaterial({
        uniforms: { uC: { value: col }, uT: U.uTime, uL: { value: Math.max(3, curve.getLength() / (r * 7)) }, uMove: { value: atk ? 0 : 1 } },
        vertexShader: ORDER_V, fragmentShader: ORDER_F, transparent: true
      }));
      const edge = new THREE.Mesh(new THREE.TubeGeometry(curve, 48, r * 1.55, 8), ink);
      // 矢じり（墨の縁取りつき）
      const p = curve.getPoint(atk ? 0.955 : 0.965), tg = curve.getTangent(atk ? 0.955 : 0.965);
      const q = new THREE.Quaternion().setFromUnitVectors(new THREE.Vector3(0, 1, 0), tg);
      const hr = r * (atk ? 3.4 : 2.6), hl = hr * 2.2;
      const tip = new THREE.Mesh(new THREE.ConeGeometry(hr, hl, 12), new THREE.MeshBasicMaterial({ color: col }));
      const tipEdge = new THREE.Mesh(new THREE.ConeGeometry(hr * 1.35, hl * 1.25, 12), ink);
      for (const t of [tip, tipEdge]) { t.position.copy(p); t.quaternion.copy(q); }
      // 地面の影（出発地から行き先へ、まっすぐ薄く）
      const g0 = new THREE.Vector3(s0.x, Math.max(0.3, s0.y) + 0.35, s0.z), g1 = new THREE.Vector3(s1.x, Math.max(0.3, s1.y) + 0.35, s1.z);
      const shadow = new THREE.Mesh(new THREE.TubeGeometry(new THREE.LineCurve3(g0, g1), 2, r * 0.7, 4), new THREE.MeshBasicMaterial({ color: INK, transparent: true, opacity: 0.18, depthWrite: false }));
      for (const m of [line, edge, tip, tipEdge, shadow]) m.userData.order = true;
      orderLayer.add(shadow, edge, line, tipEdge, tip);
      if (atk) {
        // 行き先の的：地面に勢力の色の輪と、外へ広がる波紋
        const R = 1.6 + r * 3.2, y = Math.max(0.3, s1.y) + 0.45;
        const ring = new THREE.Mesh(new THREE.RingGeometry(R * 0.78, R, 40).rotateX(-Math.PI / 2), new THREE.MeshBasicMaterial({ color: col, transparent: true, opacity: 0.95, depthWrite: false, side: THREE.DoubleSide }));
        const ringInk = new THREE.Mesh(new THREE.RingGeometry(R * 0.7, R * 1.1, 40).rotateX(-Math.PI / 2), new THREE.MeshBasicMaterial({ color: INK, transparent: true, opacity: 0.85, depthWrite: false, side: THREE.DoubleSide }));
        const wave = new THREE.Mesh(new THREE.RingGeometry(R * 0.92, R, 40).rotateX(-Math.PI / 2), new THREE.MeshBasicMaterial({ color: col, transparent: true, opacity: 0.6, depthWrite: false, side: THREE.DoubleSide }));
        ringInk.position.set(s1.x, y - 0.02, s1.z); ring.position.set(s1.x, y, s1.z); wave.position.set(s1.x, y + 0.02, s1.z);
        for (const m of [ring, ringInk, wave]) { m.userData.order = true; m.renderOrder = 2; }
        orderLayer.add(ringInk, ring, wave);
        orderRings.push({ wave, k: orderRings.length * 0.37 });
      }
      // 頂点の札（自分の命令だけ）：出陣 兵数 勝算
      if (o.f === st.player) {
        const el = document.createElement('div');
        el.className = 'order-tag' + (atk ? '' : ' move');
        let odd = '';
        if (atk) {
          const e = st.munis[o.to], f = me(), cm = commanderAt(st, f.id, o.from);
          if (e) { const [lab, oc] = odds(attackPower(st, f, o.troops, o.type === 'tokai', cm) * crossK(st, B, o.from, o.to), defense(st, B, e), o.troops, e.troops); odd = `<em style="background:${oc}">${lab}</em>`; }
        }
        el.innerHTML = `<b>${atk ? (o.type === 'tokai' ? '渡海' : '出陣') : '移動'}</b>${o.troops.toLocaleString()}${odd}`;
        el.style.setProperty('--c', fc(o.f).color);
        orderTagsEl.appendChild(el);
        orderTags.push({ el, p: curve.getPoint(0.5).add(new THREE.Vector3(0, r * 2 + 0.8, 0)) });
      }
    }
  }
  const INK = new THREE.Color('#23324a');
  const ORDER_V = 'varying vec2 vUv; void main() { vUv = uv; gl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1.0); }';
  // 出陣：勢力の色に、行き先へ流れる白い光の帯（出発地のそばは淡く）。移動：流れる点線
  const ORDER_F = `uniform vec3 uC; uniform float uT; uniform float uL; uniform float uMove; varying vec2 vUv;
    void main() {
      float s = fract(vUv.x * uL - uT * 1.6);
      float band = smoothstep(0.0, 0.1, s) * (1.0 - smoothstep(0.32, 0.4, s));
      float rim = 1.0 - abs(fract(vUv.y * 2.0) - 0.5) * 2.0;   // 管の正面ほど明るく（立体に見せる）
      vec3 c = uMove > 0.5 ? mix(uC, vec3(1.0), 0.15) : mix(uC * (0.82 + 0.3 * rim), vec3(1.0), band * 0.85);
      float a = uMove > 0.5 ? (step(0.45, s) * 0.85 + 0.15) : 1.0;
      gl_FragColor = vec4(c, a * mix(0.35, 1.0, smoothstep(0.0, 0.12, vUv.x)));
    }`;
  const orderTagsEl = $('orderTags'), orderTags = [], orderRings = [];
  let orderDist = 0;   // 弧を描いたときのカメラの距離（大きく変わったら描き直して太さをそろえる）
  const TV = new THREE.Vector3();
  function frameOrders() {
    if (st && !busy && st.orders.length && orderDist && Math.abs(Math.log(ctl.st.dist / orderDist)) > 0.4) drawOrders();
    const t = U.uTime.value;
    for (const o of orderRings) { const k = (t * 0.7 + o.k) % 1; o.wave.scale.setScalar(1 + k * 1.1); o.wave.material.opacity = 0.75 * (1 - k); }
    const cam = ctx.camera, hide = !st || busy || !$('cutin').hidden;
    const placed = [];   // 札どうしが重なったら上へずらす（総攻めで多く並んだとき）
    for (const o of orderTags) {
      if (hide || !cam) { o.el.style.opacity = '0'; continue; }
      TV.copy(o.p).project(cam);
      const on = TV.z < 1 && Math.abs(TV.x) < 1.1 && Math.abs(TV.y) < 1.1;
      o.el.style.opacity = on ? '1' : '0';
      if (!on) continue;
      o.w ||= o.el.offsetWidth; o.h ||= o.el.offsetHeight;
      const x = (TV.x + 1) / 2 * innerWidth;
      let y = (1 - TV.y) / 2 * innerHeight;
      for (let k = 0; k < 4; k++) {
        const hitR = placed.find(r => Math.abs(r.x - x) < (r.w + o.w) / 2 + 2 && Math.abs(r.y - y) < (r.h + o.h) / 2 + 2);
        if (!hitR) break;
        y = hitR.y - (hitR.h + o.h) / 2 - 3;
      }
      placed.push({ x, y, w: o.w, h: o.h });
      o.el.style.transform = `translate(${x.toFixed(1)}px, ${y.toFixed(1)}px) translate(-50%, -100%)`;
    }
  }

  // 航海中の船団：引いても見える太さ・大きさにそろえる（毎コマ）
  function scaleVoyages(dist) {
    const k = Math.max(0.15, Math.min(6, dist / 600));
    for (const o of orderLayer.children) {
      if (!o.userData.voyage) continue;
      if (o.isGroup) o.scale.setScalar(k);
      else {
        const want = Math.max(0.8, Math.min(40, dist * 0.004));
        if (Math.abs(want / o.userData.r - 1) > 0.35) { o.geometry.dispose(); o.geometry = new THREE.TubeGeometry(o.userData.curve, 80, want, 5); o.userData.r = want; }
      }
    }
  }

  // ── 合戦の演出 ──
  const soldierGeo = (() => {
    const g = new THREE.CylinderGeometry(0.25, 0.32, 0.9, 6).translate(0, 0.45, 0);
    return g;
  })();
  function armyMarker(f, naval) {
    const g = new THREE.Group();
    const col = new THREE.MeshToonMaterial({ color: fc(f).color, gradientMap: RAMP });
    const white = new THREE.MeshToonMaterial({ color: '#ffffff', gradientMap: RAMP });
    if (naval) {
      const hull = new THREE.Mesh(new THREE.BoxGeometry(3.2, 0.6, 1.2), white); hull.position.y = 0.3; g.add(hull);
      const sail = new THREE.Mesh(new THREE.BoxGeometry(0.1, 2.2, 1.8), col); sail.position.set(0, 1.7, 0); g.add(sail);
    } else {
      for (let k = 0; k < 3; k++) { const s = new THREE.Mesh(soldierGeo, col); s.position.set((k - 1) * 0.8, 0, (k % 2) * 0.6); g.add(s); const h = new THREE.Mesh(new THREE.IcosahedronGeometry(0.28, 1), new THREE.MeshToonMaterial({ color: '#ffe0c2', gradientMap: RAMP })); h.position.set((k - 1) * 0.8, 1.15, (k % 2) * 0.6); g.add(h); }
      const pole = new THREE.Mesh(new THREE.CylinderGeometry(0.05, 0.05, 3, 5), white); pole.position.set(1.4, 1.5, 0); g.add(pole);
      const flag = new THREE.Mesh(new THREE.BoxGeometry(0.06, 1.6, 0.8), col); flag.position.set(1.4, 2.2, 0.42); g.add(flag);
    }
    g.scale.setScalar(1.4);
    g.traverse(o => { o.castShadow = true; });
    scene.add(g);
    return g;
  }
  function dust(x, y, z) {
    const g = new THREE.Group();
    const mat = new THREE.MeshToonMaterial({ color: '#fff7ea', gradientMap: RAMP, transparent: true });
    for (let k = 0; k < 9; k++) { const p = new THREE.Mesh(new THREE.IcosahedronGeometry(1, 1), mat); const a = k / 9 * Math.PI * 2; p.position.set(Math.cos(a) * 1.4, 0.6, Math.sin(a) * 1.4); g.add(p); }
    g.position.set(x, y, z);
    scene.add(g);
    return { g, mat };
  }
  function animate(dur, fn) {
    return new Promise(res => {
      const t0 = performance.now();
      const step = () => { const k = Math.min(1, (performance.now() - t0) / dur); fn(k); if (k < 1) requestAnimationFrame(step); else res(); };
      requestAnimationFrame(step);
    });
  }
  async function showBattle(e) {
    const s0 = seat(e.from), s1 = seat(e.to);
    const mine = st.player !== null && (e.f === st.player || e.defOwner === st.player);
    const doAnim = speed > 0 && s0 && s1;
    if (doAnim && mine && speed === 1) { ctl.flyTo(s1.x, s1.z + 2, Math.max(60, Math.min(160, Math.hypot(s1.x - s0.x, s1.z - s0.z) * 1.4)), 0.7); await sleep(650); }
    if (doAnim) {
      const mk = armyMarker(e.f, e.naval);
      let path = null;
      if (e.naval) {
        const pa = info(e.from).port, pb = info(e.to).port;
        path = pa && pb ? life.seaRoute(pa, pb) : null;
      }
      const a = new THREE.Vector3(s0.x, s0.y + 0.2, s0.z), b = new THREE.Vector3(s1.x, s1.y + 0.2, s1.z);
      const curve = path && path.length > 1 ? new THREE.CatmullRomCurve3(path.map(([x, z]) => new THREE.Vector3(x, 0.1, z))) : arc(a, b, a.distanceTo(b) * 0.08);
      const dur = (speed === 2 ? 600 : 1100) * (e.naval ? 1.5 : 1);
      await animate(dur, k => {
        const p = curve.getPoint(k), q = curve.getPoint(Math.min(1, k + 0.02));
        mk.position.copy(p);
        if (!e.naval) mk.position.y = W.heightAt(p.x, p.z) + Math.abs(Math.sin(k * 30)) * 0.3;
        mk.rotation.y = Math.atan2(-(q.z - p.z), q.x - p.x);
      });
      if (e.result === 'storm') { news(`${info(e.from).name}の船団が時化で引き返した`); scene.remove(mk); return; }
      const d = dust(s1.x, s1.y, s1.z);
      await animate(speed === 2 ? 350 : 700, k => { d.g.scale.setScalar(0.5 + k * 1.8); d.g.rotation.y = k * 2; d.mat.opacity = 1 - k * 0.7; mk.position.y += Math.sin(k * 40) * 0.05; });
      scene.remove(d.g); scene.remove(mk);
    }
    const who = fc(e.f).name, where = info(e.to).name;
    if (e.result === 'storm') { news(`${info(e.from).name}の船団が時化で引き返した`); return; }
    if (e.intercepted) news(`${who}勢の船団が海で襲われ ${e.intercepted.toLocaleString()}人を失った`);
    if (e.result === 'win') {
      if (s1) { owners.capture(e.to, e.f, U.uTime.value, s1.x, s1.z); marks.hop(e.to, U.uTime.value); life.scatter(e.to, s1.x, s1.z); }
      else owners.setNow(e.to, e.f);
      news(`${where}を${who}勢が占領${e.naval ? '（渡海）' : ''}`);
    } else if (e.result === 'lose') news(`${who}勢、${where}を攻めきれず`);
    if (doAnim) await sleep(speed === 2 ? 120 : 350);
  }
  function banner(text, good) {
    const b = $('banner');
    b.hidden = true; void b.offsetWidth;
    b.textContent = text; b.className = 'banner' + (good ? ' good' : ''); b.hidden = false;
    clearTimeout(banner.t); banner.t = setTimeout(() => { b.hidden = true; }, 1850);
  }

  // ── 物見：県名を押すと、その県庁を持つ勢力のようすを見る。くわしく探るのは行動力1 ──
  //  数字は参謀の知が高いほど幅がせまい。来月の動きは CPU と同じ考え方で見立てる（外れることもある）
  const man = v => v >= 10000 ? `${(v / 10000).toFixed(v >= 100000 ? 0 : 1)}万` : `${Math.max(100, Math.round(v / 100) * 100).toLocaleString()}`;
  function intelReport(tid) {
    const f = me(), t = st.factions[tid], sb = sanboOf(st, f.id), wit = sb ? sb.int : 40;
    const err = Math.max(0.04, (100 - wit) / 100 * 0.5);
    const rnd = () => 0.4 + Math.random() * 0.6;
    // 兵は百人単位、予算・兵糧・装備は十単位（小さい数がつぶれないように）
    const res = v => v >= 10000 ? man(v) : Math.round(v / 10) * 10 + '';
    const range = (v, fm = res) => { const lo = fm(v * (1 - err * rnd())), hi = fm(v * (1 + err * rnd())); return wit >= 90 || lo === hi ? `約${fm(v)}` : `${lo}〜${hi}`; };
    const mine = Object.values(st.munis).filter(m => m.owner === tid);
    const troops = mine.reduce((a, m) => a + m.troops, 0);
    const offs = officersOf(st, tid);
    const stats = [['士気', `${range(shikiOf(t) * 100, v => Math.round(v) + '')}${riding(t) ? '・勢いに乗っている' : ''}`], ['兵', range(troops, man) + '人'], ['予算', range(Math.max(0, t.gold))], ['兵糧', range(Math.max(0, t.food))], ['装備', range(Math.max(0, t.arms))], ['船', wit >= 60 ? `${t.ships}隻` : t.ships > 0 ? 'ある' : 'ない'], ['人材', `${offs.length}人`]];
    if (wit >= 60 && offs.length) { const w = offs.slice().sort((a, b) => b.war - a.war)[0]; stats.push(['猛将', `${w.name}（武${w.war}）`]); }
    // 来月の動き
    const log = t.chaos > 0 && t.ap <= 1 ? [] : aiPlan(st, B, tid, (st.turn * 31 + tid) % 97);
    const plans = [];
    const atk = {};
    for (const a of log) if (a.type === 'shutsujin' || a.type === 'tokai') { const k = a.at; (atk[k] ||= { at: k, n: 0, naval: false }); atk[k].n += a.troops || 0; atk[k].naval ||= a.type === 'tokai'; }
    const byOwner = {};
    for (const x of Object.values(atk)) { const o = st.munis[x.at].owner; (byOwner[o] ||= []).push(x); }
    for (const [o, xs] of Object.entries(byOwner)) {
      const who = +o === f.id ? 'こちら' : `${fc(+o).name}勢`, danger = +o === f.id;
      if (wit < 50) plans.push({ danger, text: `${who}の領地へ${xs.some(x => x.naval) ? '海から' : ''}攻めこむ気配` });
      else for (const x of xs) plans.push({ danger, text: `${info(x.at).name}（${who}）へ${x.naval ? '渡海' : '出陣'}${wit >= 80 ? `・兵およそ${man(x.n)}` : x.n > 8000 ? '・大軍' : ''}` });
    }
    const cnt = k => log.filter(a => a.type === k || (k === 'chohei' && a.type === 'bohei')).length;
    if (cnt('chohei')) plans.push({ text: wit >= 50 ? `兵を集める（${cnt('chohei')}か所）` : '兵を集めている' });
    if (cnt('ido')) plans.push({ text: '奥の兵を前へ動かす' });
    if (cnt('zosen')) plans.push({ text: '船を造る' });
    if (cnt('chikujo')) plans.push({ text: '守りを固める' });
    for (const a of log) if (DIPLO[a.type] && a.target !== undefined && wit >= 50) plans.push({ text: `${a.target === f.id ? 'こちら' : fc(a.target).name + '勢'}と${DIPLO[a.type].name}をもちかける` });
    if (!plans.length) plans.push({ text: t.chaos > 0 ? '本拠を失った混乱で動けない' : '目立った動きはない（力をためている）' });
    return { turn: st.turn, wit, by: sb ? sb.name : null, stats, plans };
  }
  // 県名の札：その県にかかわる勢力（県庁を持つ勢力と、抵抗しているもとの勢力）を1つずつ並べ、自勢でないものだけ物見を出せる
  function openIntel(code) {
    if (!st || busy || judging) return;
    const p = W.idx.prefs[code], f = me();
    const cap = st.munis[p.capital], holder = cap ? cap.owner : -1;
    const orig = st.factions.find(x => x.pref === code);
    const body = $('intelBody');
    const nm = id => id === f.id ? `${fc(id).name}勢（自勢）` : `${fc(id).name}勢`;
    let h = `<h3>${p.name}</h3>`;
    if (holder < 0) { body.innerHTML = h + '<p class="note">この県には遊べる勢力がない。</p>'; showIntel(); return; }
    const resisting = orig && orig.alive && orig.id !== holder;
    if (resisting) h += `<p class="note">県庁は${nm(holder)}が占領中。${nm(orig.id)}は${info(orig.capital).name}で抵抗している。</p>`;
    if (st.rival === holder) h += `<p class="note"><b>${fc(holder).name}勢は宿敵。</b></p>`;
    if (st.coalition && (st.coalition.target === holder || st.coalition.members.includes(holder))) h += `<p class="note">${st.coalition.target === holder ? `${fc(holder).name}勢は包囲網に囲まれている` : `${fc(holder).name}勢は${fc(st.coalition.target).name}勢包囲網に加わっている`}。</p>`;
    else if (orig && !orig.alive && orig.vassalOf === holder) h += `<p class="note">${orig.name}勢は${nm(holder)}に臣従した（臣下）。</p>`;
    else h += `<p class="note">県庁は${nm(holder)}が持っている。</p>`;
    const ids = [holder, ...(resisting ? [orig.id] : [])].filter(id => id !== f.id);
    body.innerHTML = h + (ids.length ? '' : '<p class="note">自勢の県。くわしい数字は上の欄と人材の札で見られる。</p>');
    for (const tid of ids) body.appendChild(intelSection(tid, code));
    showIntel();
  }
  function intelSection(tid, code) {
    const f = me(), t = st.factions[tid];
    const div = document.createElement('div');
    div.className = 'intel-fac';
    const n = Object.values(st.munis).filter(m => m.owner === tid).length;
    const pact = pactOf(st, f.id, tid), rel = getRel(st, f.id, tid);
    const allies = st.pacts.filter(x => x.type === 'domei' && (x.a === tid || x.b === tid)).map(x => fc(x.a === tid ? x.b : x.a).name + '勢');
    const ks = KISHITSU[t.kishitsu];
    let h = `<div class="fac-head"><span class="dot" style="width:14px;height:14px;border-radius:50%;border:2px solid var(--ink);background:${fc(tid).color}"></span>${t.name}勢<small style="font-weight:700;opacity:.6">${n}市町村</small>${ks ? `<span class="kishitsu">${ks.name}</span>` : ''}</div>`;
    if (ks) h += `<p class="note">${ks.name}：${ks.desc}。</p>`;
    h += `<div class="relbar" title="関係 ${Math.round(rel)}"><i style="left:${50 + rel / 2}%"></i></div>`;
    h += `<p class="note">${pact ? `${DIPLO[pact.type].name}中（あと${pact.until - st.turn}か月）・` : ''}${allies.length ? `同盟：${allies.join('・')}` : '同盟なし'}</p>`;
    const rep = st.intel && st.intel[tid] && st.intel[tid].turn === st.turn ? st.intel[tid] : null;
    if (rep) {
      h += `<div class="adv-sec">物見の報告</div><dl class="intel-stats">${rep.stats.map(([k, v]) => `<dt>${k}</dt><dd>${v}</dd>`).join('')}</dl>`;
      h += `<div class="adv-sec">来月の動き（見立て）</div><ul class="intel-plans">${rep.plans.map(x => `<li${x.danger ? ' class="danger"' : ''}>${x.text}</li>`).join('')}</ul>`;
      h += `<p class="note">${rep.by ? `${rep.by}（知${rep.wit}）` : '参謀なし'}の見立て。知が高いほど数字の幅がせまく、動きもくわしく分かる。外れることもある。</p>`;
      div.innerHTML = h;
      return div;
    }
    div.innerHTML = h + `<button type="button" class="btn spy-btn">${t.name}勢に物見を出す（行動力1）</button>`;
    const b = div.querySelector('.spy-btn');
    b.disabled = f.ap <= 0;
    b.addEventListener('click', async () => {
      if (judging || busy) return;
      b.disabled = true;
      const r = spy(st, f.id, tid);
      if (r === true) sfx('monomi');
      if (r !== true) { toast(r); b.disabled = false; return; }
      (st.intel ||= {})[tid] = intelReport(tid);
      for (const k of Object.keys(st.intel)) if (st.intel[k].turn !== st.turn) delete st.intel[k];
      updateHud(); save();
      await verdict({ face: t.name[0], color: t.color, wait: `物見が${t.name}勢を探っている`, ok: true, stamp: '報告', line: `${t.name}勢のようすが分かった` });
      openIntel(code);
    });
    return div;
  }
  function showIntel() {
    for (const p of Object.keys(SIDE)) $(p).hidden = true;
    syncTabs(); closePanel();
    $('intel').hidden = false;
  }
  ctx.onPref = code => openIntel(code);

  // カットイン・判子を押して飛ばしたとき、その押下に続く click は捨てる（下の地図や次の札に届かないように）
  let swallowUntil = 0;
  addEventListener('click', e => { if (performance.now() < swallowUntil) { e.stopPropagation(); e.preventDefault(); } }, true);
  const swallowClick = () => { swallowUntil = performance.now() + 450; };
  // 押しっぱなしのキー（自動のくり返し）では飛ばさない
  const skipKey = e => !e.repeat && ['Enter', ' ', 'Escape'].includes(e.key);

  // 結果の判子：交渉・引き抜き・登用の「受けた／断られた」を、少し待たせてから判子で見せる。
  //  出ている間は画面を覆うので、うっかり続けて押しても二度は通らない
  let judging = false;
  function verdict({ face, color = '#9aa5b1', wait, ok, stamp, line }) {
    judging = true;
    const el = $('verdict'), card = el.querySelector('.vd-card');
    $('vdFace').textContent = face; $('vdFace').style.background = color;
    $('vdWait').textContent = wait; $('vdStamp').textContent = stamp; $('vdLine').textContent = line;
    card.className = 'vd-card';
    el.hidden = false;
    const t0 = performance.now();
    return new Promise(res => {
      let phase = 0, t;
      const close = () => { phase = 2; clearTimeout(t); el.removeEventListener('pointerdown', tap); removeEventListener('keydown', key); card.classList.add('out'); setTimeout(() => { el.hidden = true; judging = false; res(); }, 160); };
      const reveal = () => { phase = 1; clearTimeout(t); card.classList.add('shown', ok ? 'ok' : 'bad'); if (ok) sfx('stamp'); else { sfx('stampbig'); sfx('cancel', { delay: 0.12 }); } t = setTimeout(close, 1700); };
      // 待っている間に押すと結果へ、結果が出てから押すと閉じる（出てすぐの0.3秒は受けない）
      const tap = e => { e.preventDefault(); if (e.type === 'pointerdown') swallowClick(); if (phase === 0 && performance.now() - t0 > 400) reveal(); else if (phase === 1 && performance.now() - t0 > 700) close(); };
      const key = e => { if (skipKey(e)) tap(e); };
      t = setTimeout(reveal, 950);
      el.addEventListener('pointerdown', tap);
      addEventListener('keydown', key);
    });
  }
  // 外交をひとつ行う（外交の札・参謀の「そうする」・「この策でいく」から）。true＝行えた
  async function diploAct(k, tid) {
    if (judging || busy) return false;
    const f = me(), t = fc(tid), D = DIPLO[k];
    const cmd = { type: k, target: tid }, r = command(st, B, f.id, cmd);
    if (r !== true) { toast(r); return false; }
    updateHud(); save();
    const ok = cmd.result !== 'declined';
    const res = {
      domei: ['同盟成立', `${t.name}勢と同盟を結んだ`], teisen: ['停戦成立', `${t.name}勢と停戦した`], koeki: ['交易成立', `${t.name}勢と交易を始めた`],
      okurimono: ['贈呈', `${t.name}勢へ贈り物が届いた（関係が深まる）`], tegire: ['手切れ', `${t.name}勢との約束を断った`]
    }[k] || [D.name, ''];
    await verdict({
      face: t.name[0], color: t.color,
      wait: k === 'okurimono' ? `${t.name}勢へ贈り物を届けている` : k === 'tegire' ? `${t.name}勢へ手切れを伝えている` : `${t.name}勢へ${D.name}を申し入れている`,
      ok: ok && k !== 'tegire', stamp: ok ? res[0] : 'お断り', line: ok ? res[1] : `${t.name}勢に断られた（関係が少し下がる）`
    });
    fx.play(k, { f: f.id, target: tid, ok: cmd.result === 'accepted' || cmd.result === 'done' });
    return true;
  }

  // 臣従の色の波：主君の都に近い市町村から順に、臣従した勢力の領地を主君の色へ塗り替える（カメラも寄せる）
  async function vassalWave(loser, lord, camera = true) {
    const ids = Object.values(st.munis).filter(m => m.owner === lord && owners.owner[m.id] === loser).map(m => m.id);
    if (!ids.length) return;
    const from = seat(fc(lord).capital) || seat(ids[0]);
    const pts = ids.map(id => ({ id, s: seat(id) })).filter(x => x.s);
    if (camera && speed > 0 && pts.length) {
      let x0 = 1e9, x1 = -1e9, z0 = 1e9, z1 = -1e9;
      for (const { s } of pts) { x0 = Math.min(x0, s.x); x1 = Math.max(x1, s.x); z0 = Math.min(z0, s.z); z1 = Math.max(z1, s.z); }
      ctl.flyTo((x0 + x1) / 2, (z0 + z1) / 2 + 4, Math.max(160, Math.min(3000, Math.max(x1 - x0, z1 - z0) * 1.8)), 0.7);
      await sleep(750);
    }
    pts.sort((a, b) => (from ? Math.hypot(a.s.x - from.x, a.s.z - from.z) - Math.hypot(b.s.x - from.x, b.s.z - from.z) : 0));
    const total = speed === 0 ? 0 : speed === 2 ? 700 : 1400, step = pts.length > 1 ? total / (pts.length - 1) : 0;
    const lc = seat(fc(loser).capital) || pts[0]?.s;
    if (lc && speed > 0 && camera) fx.play('vassal', { at: fc(loser).capital, f: lord });
    pts.forEach((x, i) => setTimeout(() => { owners.capture(x.id, lord, U.uTime.value, x.s.x, x.s.z); marks.hop(x.id, U.uTime.value); }, i * step));
    for (const id of ids) if (!seat(id)) owners.setNow(id, lord);
    if (camera) await sleep(total + (speed ? 900 : 0));   // ほかの勢力どうしは待たない（月の進みを止めない）
  }

  // カットイン：重要な出来事を、勢力の色の斜めの帯で見せる（タップで飛ばせる）
  const CUT_SE = { '大勝利': 'win', '本拠陥落': 'gon', '包囲網': 'taiko', '宿敵': 'kabuki', '破竹の勢い': 'koto', '急報': 'horagai', '奪還': 'win', '臣従': 'cutin', '降伏': 'cutin', '速報': 'cutin' };
  const CUT_JINGLE = { '地方統一': 'fushime', '知事選': 'senkyo' };
  function cutin({ kicker, title, sub = '', color = '#ff4d5e' }) {
    if (CUT_JINGLE[kicker]) { if (kicker === '知事選' && title.startsWith('落選')) A.jingle('metsubo'); else A.jingle(CUT_JINGLE[kicker]); }
    else if (kicker !== '天下統一') sfx(CUT_SE[kicker] || 'cutin', { gap: 400 });
    // 文の長さに合わせて長めに出す（読みきれるように）。タップ・クリック・キーで次へ
    const read = Math.min(5600, 2600 + (title.length + sub.length) * 95);
    const el = $('cutin'), dur = Math.round(speed === 2 ? Math.min(2600, read * 0.8) : speed === 0 ? Math.min(2000, read * 0.65) : read);   // はやい・省略では待たせない
    $('ciKicker').textContent = kicker; $('ciTitle').textContent = title; $('ciSub').textContent = sub;
    $('ciSkip').textContent = matchMedia('(hover: hover)').matches ? 'クリックで次へ' : 'タップで次へ';
    const band = el.querySelector('.ci-band');
    band.style.setProperty('--c', color);
    const c = new THREE.Color(color), lum = 0.299 * c.r + 0.587 * c.g + 0.114 * c.b;
    el.classList.toggle('light', lum > 0.72);
    el.classList.remove('out');
    el.style.setProperty('--ci', dur / 1000 + 's');
    el.hidden = true; void el.offsetWidth; el.hidden = false;
    const t0 = performance.now();
    return new Promise(res => {
      let done = false;
      const end = () => {
        if (done) return; done = true;
        clearTimeout(t); el.removeEventListener('pointerdown', skip); removeEventListener('keydown', key);
        el.classList.add('out');
        setTimeout(() => { el.hidden = true; el.classList.remove('out'); res(); }, 180);
      };
      // 1つ飛ばしても次のカットインまで飛ばないよう、出てから0.5秒は受けない・押しっぱなしのキーは受けない
      const skip = e => { e.preventDefault(); if (e.type === 'pointerdown') swallowClick(); if (performance.now() - t0 > 500) end(); };
      const key = e => { if (skipKey(e)) skip(e); };
      const t = setTimeout(end, dur);
      el.addEventListener('pointerdown', skip);
      addEventListener('keydown', key);
    });
  }
  const isLight = hex => { const h = String(hex).replace('#', ''); const v = n => parseInt(h.slice(n, n + 2), 16); return h.length >= 6 && (0.299 * v(0) + 0.587 * v(2) + 0.114 * v(4)) / 255 > 0.66; };   // 淡い色の上は白い字が読みにくいので墨の字に
  const lastCut = new Map();   // 場所 → 最後にカットインを出した月
  const offices = new Set(Object.values(W.idx.prefs).map(p => p.capital));
  const isOffice = id => offices.has(id);
  const bigFactions = () => new Set(st.factions.filter(f => f.alive).map(f => [f.id, Object.values(st.munis).filter(m => m.owner === f.id).length]).sort((a, b) => b[1] - a[1]).slice(0, 3).map(a => a[0]));

  // ── 天下の大勢：統一を宣言する ──
  function declareUnify() {
    st.over = { type: 'unify', winner: st.player, by: 'taika', share: nationalShare(st, B, st.player) };
    save(); updateHud();
  }
  function askTaika(first) {
    return new Promise(res => {
      const pct = Math.round(nationalShare(st, B, st.player) * 100), left = st.factions.filter(f => f.alive && f.id !== st.player).length;
      const box = document.createElement('div'); box.className = 'coach taika'; box.setAttribute('role', 'dialog'); box.setAttribute('aria-label', '天下の大勢');
      box.innerHTML = `<div class="coach-card c-center"><small>天下の大勢</small><b>${first ? '戦いはほぼ決しました' : '天下統一を宣言しますか？'}</b><p>全国の人口の${pct}%を治めています（残り${left}勢力）。ここで天下統一とするか、最後の1勢力まで戦うかを選べます。${first ? '続けたあとも、メニューからいつでも宣言できます。' : ''}</p><div class="coach-btns"><button type="button" class="btn ghost" data-c="no">最後まで戦う</button><button type="button" class="btn" data-c="yes">天下統一とする</button></div></div>`;
      document.body.appendChild(box);
      box.addEventListener('click', e => { const c = e.target.closest('[data-c]')?.dataset.c; if (!c) return; box.remove(); res(c === 'yes'); });
    });
  }
  // ── 月を進める ──
  let monthTouched = false;
  for (const ev of ['pointerdown', 'wheel']) $('c')?.addEventListener(ev, () => { if (busy) monthTouched = true; }, { passive: true });
  async function nextMonth(force) {
    if (busy || !st || st.over) return;
    // 行動力が残っていたら、本当に進めるか聞く
    if (!force && me().ap > 0) { $('confirmText').textContent = `行動力があと${me().ap}残っています。月を進めますか？`; $('confirm').hidden = false; return; }
    // 開いている札は閉じて、地図を見やすく
    for (const p of ['diplo', 'cards', 'people', 'advice', 'intel', 'rank', 'warlog']) $(p).hidden = true;
    syncTabs();
    busy = true; closePanel(); $('sheet').hidden = true; updateHud();
    // 月送りのカメラ（2026-10-25 意見「月を進めた後のカメラワークがよく分からない」）：合戦のある所へ寄って見せ、終わったら元の場所へ戻す。
    //  途中で地図をさわったら、戻さない（自分で見たい所を見ている）
    const camHome = { x: ctl.st.target.x, z: ctl.st.target.z, d: ctl.st.dist };
    monthTouched = false;
    sfx('month');
    const before = Object.fromEntries(Object.values(st.munis).map(m => [m.id, m.owner]));
    prevRank = ranking().order;
    const when = { y: st.date.y, m: st.date.m, turn: st.turn };
    $('warlog').hidden = true; syncTabs();
    const big = bigFactions();
    const ev = endMonth(st, B);
    for (const c of [...orderLayer.children]) orderLayer.remove(c);
    // 画面の持ち主は、月の進行の中で塗り替える
    for (const [id, o] of Object.entries(before)) owners.setNow(+id, o);
    const P = st.player;
    // 寄せるのは自分の合戦だけ（前は兵の移動・徴兵も入れていて、遠く離れた町どうしを収めようと大きく引き、何を見せたいのか分からなかった）
    const mineEv = ev.filter(e => e.type === 'battle' && e.result !== 'cancel' && e.result !== 'joined' && (e.f === P || e.defOwner === P));
    // 自分の合戦が収まるようにカメラを寄せる（ふつう・はやい。はやいは短く）。上の欄・速報の帯に隠れないよう少し引く
    if (speed > 0 && mineEv.length) {
      let x0 = 1e9, x1 = -1e9, z0 = 1e9, z1 = -1e9;
      for (const e of mineEv) for (const id of [e.from, e.to, e.at]) { const s = id ? seat(id) : null; if (s) { x0 = Math.min(x0, s.x); x1 = Math.max(x1, s.x); z0 = Math.min(z0, s.z); z1 = Math.max(z1, s.z); } }
      const fast = speed === 2;
      if (x0 < 1e9) { ctl.flyTo((x0 + x1) / 2, (z0 + z1) / 2 + 4, Math.max(120, Math.min(1900, Math.max(x1 - x0, z1 - z0) * 2.0)), fast ? 0.45 : 0.8); banner('今月の合戦'); await sleep(fast ? 480 : 850); }
    }
    $('nextBtn').hidden = true; $('skipBtn').hidden = !speed;
    const myWar = ev.some(e => e.type === 'battle' && e.result !== 'cancel' && e.result !== 'joined' && (e.f === P || e.defOwner === P));
    const warBgm = myWar && speed > 0;   // 省略のときは曲を変えない
    if (warBgm) { sfx('horagai'); sfx('gaya', { delay: 1.2, gain: 0.8 }); A.bgm('kassen'); }
    await campaign.play(ev, { player: P, speed, pacts: st.pacts, route: seaPath, voyages: st.voyages, onApply: e => {
      if (speed && (e.f === P || e.defOwner === P)) {
        sfx('clash', { gap: 260, rate: 0.92 + Math.random() * 0.16 });
        if (e.result === 'win') { if (e.f === P) sfx('ou', { gap: 500, delay: 0.15 }); else sfx('gon', { gap: 800, gain: 0.45, delay: 0.15 }); }   // 取った・取られたを音でも分ける
      }
      const s = seat(e.to);
      if (s) { owners.capture(e.to, e.f, U.uTime.value, s.x, s.z); marks.hop(e.to, U.uTime.value); life.scatter(e.to, s.x, s.z); } else owners.setNow(e.to, e.f);
    } });
    $('skipBtn').hidden = true;
    if (warBgm) bgmUpdate(true);   // 合戦が終わったら、すぐ情勢の曲へ
    // 合戦の報せ：自分のものだけ。月の最後に出す（あとから出る報せに押し出されないように。ほかの合戦の数は戦果・順位で分かる）
    const myNews = [];
    for (const e of ev) {
      if (e.type !== 'battle' || e.result === 'cancel' || e.result === 'joined') continue;
      if (e.f !== P && e.defOwner !== P) continue;
      const who = fc(e.f).name, where = info(e.to).name;
      if (e.result === 'storm') myNews.push(`${info(e.from).name}の船団が${e.typhoon ? '台風' : '時化'}で引き返した${e.lost ? `（${e.lost.toLocaleString()}人を失う）` : ''}`);
      else if (e.result === 'win') myNews.push(e.f === P ? `${where}を占領${e.naval ? '（渡海）' : ''}` : `${where}を${who}勢に奪われた`);
      else myNews.push(e.f === P ? `${where}を攻めきれず` : `${where}で${who}勢を退けた`);
      if (e.intercepted) myNews.push(`${who}勢の船団が海で襲われ ${e.intercepted.toLocaleString()}人を失った`);
    }
    let cuts = 0;   // 1か月に見せるカットインは3つまで
    // must：自分の本拠が落ちた・取り返したは、数の上限やくり返しの省略にかかわらず必ず見せる
    const cut = async (o, must) => { if (cuts++ < 3 || must) await cutin(o); };
    // 同じ場所の陥落・奪還は、半年のうちにくり返したら報せだけにする（取ったり取られたりで続かないように）
    const placeCut = async (id, o, must) => { const last = lastCut.get(id); lastCut.set(id, st.turn); if (!must && last !== undefined && st.turn - last < 6) return; await cut(o, must); };
    for (const e of ev) if (e.type === 'sail' && e.f !== P) {
      const tgt = st.munis[e.to];
      if (!tgt || tgt.owner !== P) continue;
      news(`${fc(e.f).name}勢の船団（兵${e.n.toLocaleString()}）が${info(e.to).name}へ向けて出た`);
      if (e.n >= 4000) await cut({ kicker: '急報', title: `${fc(e.f).name}勢の船団が迫る`, sub: `兵${e.n.toLocaleString()}が${info(e.to).name}へ。${SEA[e.tier || 0].name}${SEA[e.tier || 0].months ? `、${SEA[e.tier || 0].months}か月ほどで着く` : '、すぐに着く'}`, color: fc(e.f).color });
    }
    for (const e of ev) {
      if (e.type === 'battle' || e.type === 'move' || e.type === 'draft') continue;
      if (e.type === 'capital') {
        const involved = e.f === P || e.by === P;
        // 本当の県庁か、移った先の本拠かで言い分ける
        const office = isOffice(e.at), place = office ? `${info(e.at).prefName}庁` : info(e.at).name;
        if (involved || (e.home && big.has(e.f))) await placeCut(e.at, { kicker: e.by === P ? '大勝利' : e.f === P ? '本拠陥落' : '速報', title: `${place} 陥落！`, sub: `${fc(e.by).name}勢が${office ? info(e.at).name : `${fc(e.f).name}勢の本拠`}を奪った。${fc(e.f).name}勢は${info(e.moveTo).name}へ移る`, color: fc(e.by).color }, e.f === P);
        news(`${fc(e.f).name}勢の本拠 ${place}が落ち、${info(e.moveTo).name}へ移った`);
      } else if (e.type === 'retake') {
        const office = isOffice(e.at), place = office ? `${info(e.at).prefName}庁` : info(e.at).name;
        if (e.f === P || e.from === P || big.has(e.f)) await placeCut(e.at, { kicker: e.f === P ? '奪還' : '速報', title: `${place} 奪還！`, sub: `${fc(e.f).name}勢が${info(e.at).name}を取り返し、本拠を戻した`, color: fc(e.f).color }, e.f === P);
        news(`${fc(e.f).name}勢が${place}を奪還した`);
      } else if (e.type === 'defect') {
        const s = seat(e.id);
        if (s) owners.capture(e.id, e.to, U.uTime.value, s.x, s.z); else owners.setNow(e.id, e.to);
        if (e.from === P || e.to === P) sfx('hyoshigi', { gap: 400 });
        if (e.from === P || e.to === P) news(e.why === 'cut' ? `${info(e.id).name}が孤立し、${fc(e.to).name}勢に降った` : `${info(e.id).name}が${fc(e.to).name}勢へ寝返った`);
      } else if (e.type === 'cutoff') {
        sfx('hansho', { gap: 2000 });
        news(`${info(e.id).name}が孤立した。本拠とつなぎ直さないと、来月から敵に降るおそれ`);
      } else if (e.type === 'surrender') {
        for (const m of Object.values(st.munis)) if (m.owner === e.to && owners.owner[m.id] !== e.to) { const s = seat(m.id); if (s) owners.capture(m.id, e.to, U.uTime.value, s.x, s.z); else owners.setNow(m.id, e.to); }
        if (e.f === P || e.to === P || big.has(e.f)) await cut({ kicker: e.to === P ? '降伏' : '速報', title: `${fc(e.f).name}勢、降伏`, sub: `${fc(e.f).name}勢の領地はすべて${fc(e.to).name}勢のものに`, color: fc(e.to).color });
        news(`${fc(e.f).name}勢が${fc(e.to).name}勢に降伏`);
      } else if (e.type === 'vassal') {
        if (e.f === P || e.to === P || big.has(e.f)) { await cut({ kicker: '臣従', title: `${fc(e.f).name}勢が${fc(e.to).name}勢の下に`, sub: '領地も兵も人材もすべて加わる', color: fc(e.to).color }); await vassalWave(e.f, e.to); }
        else await vassalWave(e.f, e.to, false);
        news(`${fc(e.f).name}勢が${fc(e.to).name}勢に臣従した`);
      } else if (e.type === 'coalition') {
        const names = e.members.map(id => fc(id).name + '勢');
        const list = names.length > 3 ? `${names.slice(0, 3).join('・')}ほか${names.length - 3}勢` : names.join('・');
        if (e.target === P) await cut({ kicker: '包囲網', title: `${fc(P).name}勢包囲網！`, sub: `${list}が手を組んだ。同盟か停戦を結べば1つずつ崩せる`, color: fc(e.members[0]).color });
        else if (e.members.includes(P) || big.has(e.target)) await cut({ kicker: '速報', title: `${fc(e.target).name}勢包囲網`, sub: `${list}が${fc(e.target).name}勢を囲む`, color: fc(e.members[0]).color });
        news(`${list}が${fc(e.target).name}勢包囲網をつくった`);
      } else if (e.type === 'coalitionEnd') {
        if (e.target === P) await cut({ kicker: '包囲網', title: '包囲網が崩れた', sub: '囲んでいた勢力どうしが、また攻め合うようになる', color: me().color });
        news(`${fc(e.target).name}勢包囲網が解けた`);
      } else if (e.type === 'region') {
        if (e.f === P) await cut({ kicker: '地方統一', title: `${e.region}統一！`, sub: '予算と兵糧+150・士気+15。毎月の行動力が1つ増える', color: me().color });
        else if (big.has(e.f)) await cut({ kicker: '速報', title: `${fc(e.f).name}勢、${e.region}を統一`, sub: '地方の主になった', color: fc(e.f).color });
        news(`${fc(e.f).name}勢が${e.region}を統一`);
      } else if (e.type === 'rival') {
        await cut({ kicker: '宿敵', title: `宿敵 ${fc(e.f).name}勢`, sub: `${e.score >= 12 ? '本拠を奪い合った' : '何度もぶつかった'}因縁の相手。動きは速報で目立って届く`, color: fc(e.f).color });
      } else if (e.type === 'rivalDown') {
        await cut({ kicker: '宿敵', title: `宿敵 ${fc(e.f).name}勢、滅ぶ`, sub: '長い因縁に決着がついた', color: me().color });
      } else if (e.type === 'momentum') {
        if (e.f === P) await cut({ kicker: '破竹の勢い', title: `${fc(e.f).name}勢、勢いに乗る！`, sub: '士気が上がり、勢いが止まるまで攻めが強い', color: fc(e.f).color });
        else if (big.has(e.f) || Object.values(st.munis).some(m => m.owner === P && B.landNb(m.id).some(id => st.munis[id]?.owner === e.f))) news(`${fc(e.f).name}勢が勢いに乗っている`);   // 上位か隣の勢力だけ
      } else if (e.type === 'momentumEnd') {
        if (e.f === P) news('勢いが止まった');
      } else if (e.type === 'shiki') {
        news(`士気 ${Math.round(e.from * 100)}→${Math.round(e.to * 100)}`);
      } else if (e.type === 'desert') {
        news('士気が低く、兵が逃げている');
      } else if (e.type === 'buyFood') news(`兵糧が足りず、${e.food.toLocaleString()}を買い入れた（予算 −${e.gold.toLocaleString()}）`);
      else if (e.type === 'buyArms') { news(`装備を${e.arms.toLocaleString()}買い入れた（予算 −${e.gold.toLocaleString()}）${armsNoted ? '' : '。兵の数に見合う分を、予算の3割まで毎月自動で買う'}`); armsNoted = true; }
      else if (e.type === 'fall') news(`${fc(e.f).name}勢が滅びた`);
      else if (e.type === 'harvest' && e.f === st.player) news(`秋の収穫 兵糧 +${e.food.toLocaleString()}`);
      else if (e.type === 'deleg') {
        const cnt = {};
        for (const a of e.acts) cnt[a.type] = (cnt[a.type] || 0) + 1;
        news(`${e.name}（${W.idx.prefs[e.pref].name}代理）：${Object.entries(cnt).map(([k, v]) => (COMMANDS[k] || DIPLO[k])?.name + (v > 1 ? '×' + v : '')).join('・')}`);
        // 知事代理が打った手を、地図の上でも見せる（出陣・渡海は月末の合戦として出る 2026-10-21 本人「委任者の行動は見える？」）
        (st.delegLast ||= {})[e.pref] = { turn: st.turn, name: e.name, acts: e.acts.map(a => ({ type: a.type, at: a.at, n: a.n })) };
        if (speed > 0) e.acts.filter(a => a.at && !['shutsujin', 'tokai', 'ido'].includes(a.type)).slice(0, 6).forEach((a, i) => setTimeout(() => fx.play(a.type, { at: a.at, f: st.player, n: a.n, by: e.name.split(' ')[0] }), i * 220));
      }
      else if (e.type === 'officer') {
        if (e.joined && e.to === st.player) news(`${e.name}を捕らえ、味方に加えた`);
        else if (e.from === st.player) news(e.joined ? `城代の${e.name}が捕らわれ、${fc(e.to).name}勢に下った` : `城代の${e.name}が落ちのびた`);
      }
      else if (e.type === 'pactEnd' && (e.a === st.player || e.b === st.player)) news(`${fc(e.a === st.player ? e.b : e.a).name}勢との${DIPLO[e.kind].name}が終わった`);
      else if (e.type === 'election') {
        cuts = 0;
        await cut({ kicker: '知事選', title: e.win ? '再選！' : '落選…', sub: `得票 ${Math.round(e.vote * 100)}%${e.win ? `　${e.term + 1}期目へ。もう4年` : ''}`, color: e.win ? me().color : '#5b6577' });
        if (e.win) news(`${e.term + 1}期目へ。もう4年`);
      }
      else if (e.type === 'starve' && e.f === st.player) news('兵糧が尽きた！ 兵が逃げている');
    }
    for (const t of myNews.slice(-4)) news(t);   // 自分の合戦の報せは最後に（いちばん上に残る）
    syncAll();
    drawOrders();
    applyDate();
    // 戦果を残し、あれば札を開く（ほかの横の札は閉じる）
    const wr = warRows(ev, before);
    if (wr.length) {
      (st.warlog ||= []).unshift({ ...when, rows: wr });
      st.warlog.length = Math.min(st.warlog.length, 24);
      if (!st.over) { for (const p of Object.keys(SIDE)) $(p).hidden = true; $('intel').hidden = true; $('rank').hidden = true; openWarlog(); $('warlog').hidden = false; syncTabs(); }
    }
    if (st.date.m === 4) banner(`${st.date.y}年度`, true);
    // 開幕の備えが明ける前の月：境の向こうに集まる兵を知らせる（明けた月にいっせいに攻めが来ていた 2026-10-20 評価）
    // 知事選の前触れ（2026-10-20 本人案）：1年前と3か月前に報せ。3か月前で支持が危ういときは急報のカットイン（知事選のジングルは本番だけ）
    const eLeft = ELECTION_EVERY - (st.turn % ELECTION_EVERY);
    if (!st.over && (eLeft === 12 || eLeft === 3)) {
      const pv = Math.round((st.poll ?? pollOf(st, B, P)) * 100);
      if (eLeft === 3 && pv < 52) await cut({ kicker: '急報', title: '知事選まであと3か月', sub: `支持${pv}%。このままでは落選する。地元の大きな町で祭りを`, color: '#5b6577' }, true);
      else news(`知事選まであと${eLeft === 12 ? '1年' : '3か月'}・支持${pv}%`);
    }
    if (st.turn === OPENING - 1 && !st.over) {
      const by = new Map();
      for (const m of Object.values(st.munis)) if (m.owner === P) for (const id of B.landNb(m.id)) { const e = st.munis[id]; if (e && e.owner >= 0 && e.owner !== P && !pactOf(st, P, e.owner)) by.set(e.owner, (by.get(e.owner) || 0) + e.troops); }
      const top = [...by].sort((a, b) => b[1] - a[1]).slice(0, 3);
      if (top.length) await cut({ kicker: '急報', title: '来月から合戦が始まる', sub: '境の向こうの兵：' + top.map(([g, t]) => `${fc(g).name}勢 ${t.toLocaleString()}人`).join('・'), color: fc(top[0][0]).color }, true);
    }
    if (speed && ev.some(e => e.type === 'battle' && e.f === P && e.result === 'lose')) sfx('gon', { gain: 0.6 });
    bgmUpdate();
    // 元の場所へ戻す（月送りのあいだに地図をさわっていなければ）
    if (speed > 0 && !monthTouched && !st.over && Math.hypot(ctl.st.target.x - camHome.x, ctl.st.target.z - camHome.z) + Math.abs(Math.log(ctl.st.dist / camHome.d)) * 50 > 2) ctl.flyTo(camHome.x, camHome.z, camHome.d, speed === 2 ? 0.5 : 0.9);
    busy = false;
    updateHud();
    save();
    // 天下の大勢は決した：統一とするか、最後まで戦うかを選ぶ
    if (!st.over && ev.some(e => e.type === 'taika')) {
      await cutin({ kicker: '天下の大勢', title: '天下の大勢は決した', sub: `全国の人口の${Math.round(nationalShare(st, B, P) * 100)}%を治めた`, color: me().color });
      if (await askTaika(true)) { declareUnify(); }
    }
    if (st.over && st.over.type === 'unify') await cutin({ kicker: '天下統一', title: st.over.winner === P ? '天下統一！' : `${fc(st.over.winner).name}勢が統一`, sub: `${st.date.y}年${st.date.m}月`, color: fc(st.over.winner).color });
    if (st.over) showResult(); else showProposal();
  }
  $('nextBtn').addEventListener('click', () => nextMonth(false));
  $('confirmYes').addEventListener('click', () => { $('confirm').hidden = true; nextMonth(true); });
  $('confirmNo').addEventListener('click', () => sfx('cancel'));
  $('confirmNo').addEventListener('click', () => { $('confirm').hidden = true; });
  $('skipBtn').addEventListener('click', () => campaign.skip());

  // ── 決着 ──
  function showResult() {
    const o = st.over, f = me();
    // 決着の音：統一（自分）・期限で1位はエンディング。期限まで治めきったら順位に関係なくクリアの音（本人「統一できなくてもクリアはクリア」）。
    //  ずっこけは滅亡・ほかの勢力の統一だけ（落選は知事選の札で鳴らし済み）
    const tRank = o.type === 'time' && o.rank ? o.rank.indexOf(st.player) + 1 : 0;
    if ((o.type === 'unify' && o.winner === st.player) || tRank === 1) A.bgm('ending');
    else if (tRank) { A.bgm('result'); A.jingle('clear'); }   // ジングルの間は曲を下げて重ねる
    else { A.bgm(null); if (o.type !== 'election') A.jingle('metsubo'); }
    let h, p;
    if (o.type === 'unify') { const w = fc(o.winner); h = o.winner === st.player ? '天下統一！' : `${w.name}勢が天下を統一`; p = o.by === 'taika' ? `${st.date.y}年${st.date.m}月。全国の人口の${Math.round((o.share || 0) * 100)}%を治め、天下の大勢を決しました。${st.turn}か月でした。` : `${st.date.y}年${st.date.m}月。${st.turn}か月でした。`; }
    else if (o.type === 'lost') { h = '滅亡…'; p = `${f.name}勢は姿を消しました。`; }
    else if (o.type === 'election') { h = '落選…'; p = `${st.date.y}年${st.date.m}月の知事選で、得票は${Math.round(o.vote * 100)}%でした。民心を上げると支持が戻ります。`; }
    else {
      const rank = o.rank.indexOf(st.player) + 1, g = o.gain || gainOf(st), sg = v => (v >= 0 ? '+' : '') + v;
      h = `${Math.round(st.months / 12)}年 治めきった！`;
      p = `<b class="clear-rank">${rank}位でクリア</b>（${levelOf(st).name}・はじめより${sg(g[st.player].n)}市町村）<br>はじめより増やした市町村の数で順位。<br>` + o.rank.slice(0, 10).map((id, i) => `${i + 1}位 ${fc(id).name}（${sg(g[id].n)}）`).join('　') + (rank > 10 ? `<br>${rank}位 ${me().name}（${sg(g[st.player].n)}）` : '');
    }
    $('resultCard').innerHTML = `<h1>${h}</h1><p class="lead">${p}</p><div class="title-btns"><button type="button" class="btn" id="againBtn">もう一度</button><button type="button" class="btn ghost" id="lookBtn">地図を見る</button></div>`;
    $('result').hidden = false;
    $('againBtn').addEventListener('click', () => { $('result').hidden = true; clearSave(); showTitle(); });
    $('lookBtn').addEventListener('click', () => { $('result').hidden = true; });
  }

  // ── セーブ ──
  function save() { try { localStorage.setItem(SAVE_KEY, serialize(st)); } catch (e) { /* 保存できない環境でも遊べる */ } }
  function clearSave() { try { localStorage.removeItem(SAVE_KEY); } catch (e) { /* なにもしない */ } }
  function loadSaved() { try { const t = localStorage.getItem(SAVE_KEY); return t ? deserialize(t) : null; } catch (e) { return null; } }
  function exportSave() {
    const blob = new Blob([JSON.stringify(st, null, 1)], { type: 'application/json' });
    const a = document.createElement('a');
    a.href = URL.createObjectURL(blob);
    a.download = `47kokushi-${st.date.y}-${String(st.date.m).padStart(2, '0')}.json`;
    document.body.appendChild(a); a.click(); a.remove();
    setTimeout(() => URL.revokeObjectURL(a.href), 2000);
  }
  async function importSave(file) {
    try {
      const s = deserialize(await file.text());
      begin(s);
      toast('セーブを読みこみました');
    } catch (e) { toast('このファイルは読めません'); }
  }

  // ── はじめの画面 ──
  // 遊ぶ長さ：10年・20年・期限なし（統一か滅亡まで）。前に選んだものを覚えておく
  let playMonths = 120;   // はじめは10年（2026-10-20 本人決定。前は20年）
  try { const v = localStorage.getItem(SAVE_KEY + ':months'); if (v !== null && [0, 120, 240].includes(+v)) playMonths = +v; } catch (e) { /* 保存できない環境 */ }
  const MODE_NOTE = { 120: '10年たった時、はじめより増やした市町村の数で順位がつく。標準の長さ', 240: '20年で決着（統一できなければ、増やした市町村の数で順位）。じっくり天下統一をめざす長さ', 0: '期限なし。天下統一か、滅びるか、落選するまで続く' };
  function syncMode() {
    for (const b of document.querySelectorAll('.mode:not(.level) button')) b.setAttribute('aria-pressed', String(+b.dataset.months === playMonths));
    $('modeNote').textContent = MODE_NOTE[playMonths];
    for (const b of document.querySelectorAll('.mode.level button')) b.setAttribute('aria-pressed', String(b.dataset.level === playLevel));
    $('levelNote').textContent = LEVELS[playLevel].note;
  }
  // 難易度（2026-10-20）：イージー・ノーマル・ハード。前に選んだものを覚えておく
  let playLevel = 'normal';
  try { const v = localStorage.getItem(SAVE_KEY + ':level'); if (v && LEVELS[v]) playLevel = v; } catch (e) { /* 保存できない環境 */ }
  for (const b of document.querySelectorAll('.mode.level button')) b.addEventListener('click', () => { playLevel = b.dataset.level; try { localStorage.setItem(SAVE_KEY + ':level', playLevel); } catch (e) { /* 保存できない環境 */ } syncMode(); });
  for (const b of document.querySelectorAll('.mode:not(.level) button')) b.addEventListener('click', () => { playMonths = +b.dataset.months; try { localStorage.setItem(SAVE_KEY + ':months', String(playMonths)); } catch (e) { /* 保存できない環境 */ } syncMode(); });
  function showTitle() {
    syncMode(); syncSound();
    if (A.current) A.bgm('title');
    st = null; updateHud();
    $('sidetabs').hidden = true; $('ticker').hidden = true; for (const p of ['diplo', 'cards', 'people', 'advice', 'intel', 'rank', 'warlog']) $(p).hidden = true;
    const box = $('picks');
    box.innerHTML = '';
    const pops = owners.factions.map(f => ({ f, pop: W.idx.munis.filter(m => m.play && m.pref === f.pref).reduce((a, m) => a + m.pop, 0) }));
    const popOf = new Map(pops.map(o => [o.f.id, o.pop]));
    for (const [name, a0, a1] of REGIONS) {
      const h = document.createElement('div');
      h.className = 'region'; h.textContent = name;
      box.appendChild(h);
      for (const f of owners.factions.filter(f => +f.pref >= a0 && +f.pref <= a1)) {
        const b = document.createElement('button');
        b.type = 'button'; b.className = 'pick small' + (isLight(f.color) ? ' light' : ''); b.style.background = f.color;
        const s5 = STARS[f.pref] || 3;
        b.innerHTML = `<b>${f.name}</b><small>${Math.round(popOf.get(f.id) / 10000)}万人</small><small class="star" title="むずかしさ ${s5}（5段階）">${'★'.repeat(s5)}${'☆'.repeat(5 - s5)}</small>`;
        b.setAttribute('aria-label', `${f.name}　むずかしさ ${s5}（5段階）`);
        b.addEventListener('click', () => begin(createGame(W.idx, { player: f.id, seed: (Date.now() & 0xffffff) | 1, months: playMonths, level: playLevel })));
        box.appendChild(b);
      }
    }
    const saved = loadSaved();
    $('continueBtn').hidden = !saved || !!saved.over;
    $('continueBtn').onclick = () => begin(saved);
    $('title').hidden = false;
  }
  // ── はじめての案内（2026-10-21 本人要望「まずは参謀に聞きながら進めてみましょう」）。1回だけ・とばせる・説明は3枚まで ──
  const COACH_KEY = SAVE_KEY + ':coached';
  function showCoach(force) {
    try { if (!force && localStorage.getItem(COACH_KEY)) return; } catch (e) { /* 保存できない環境は毎回出さない */ return; }
    if (!st || st.over || busy || !$('cutin').hidden) { setTimeout(() => showCoach(force), 800); return; }
    const steps = [
      { el: 'adviceBtn', side: 'c-right', h: 'まずは参謀に聞いてみよう', p: '迷ったら左の「参謀」。今月の策をいくつも試して勧めてくれます。そのまま「この策でいく」でも大丈夫。' },
      { el: null, side: 'c-center', h: '町を押すと手が打てる', p: '地図の町を押すと、商業・徴兵・出陣など、その町でできることが出ます。行動力（上の欄の●）の数だけ打てます。' },
      { el: 'nextBtn', side: 'c-top', h: '打ち終えたら「月を進める」', p: '月の終わりに、合戦と収穫がまとめて動きます。4年ごとの知事選で落選しないように。' }
    ];
    let k = 0;
    const box = document.createElement('div'); box.className = 'coach'; box.setAttribute('role', 'dialog'); box.setAttribute('aria-label', 'はじめての案内');
    document.body.appendChild(box);
    const done = () => { try { localStorage.setItem(COACH_KEY, '1'); } catch (e) { /* なにもしない */ } box.remove(); document.querySelectorAll('.coach-hl, .coach-hl-up').forEach(e => e.classList.remove('coach-hl', 'coach-hl-up')); };
    const show = () => {
      document.querySelectorAll('.coach-hl, .coach-hl-up').forEach(e => e.classList.remove('coach-hl', 'coach-hl-up'));
      const S = steps[k], last = k === steps.length - 1, t = S.el && $(S.el);
      if (t) { t.classList.add('coach-hl'); const up = t.closest('.sidetabs, .dock, nav'); if (up) up.classList.add('coach-hl-up'); }   // 固定の入れ物ごと案内の上へ
      box.innerHTML = `<div class="coach-card ${S.side}"><small>${k + 1} / ${steps.length}</small><b>${S.h}</b><p>${S.p}</p><div class="coach-btns">${last ? '<button type="button" class="btn ghost" data-c="self">自分で進める</button><button type="button" class="btn" data-c="advice">参謀を開く</button>' : '<button type="button" class="btn ghost" data-c="skip">とばす</button><button type="button" class="btn" data-c="next">つぎへ</button>'}</div></div>`;
      const card = box.firstChild;
      if (t) {
        const r = t.getBoundingClientRect(), cw = card.offsetWidth, ch = card.offsetHeight;
        let x, y;
        if (S.side === 'c-right') { x = r.right + 14; y = r.top + r.height / 2 - ch / 2; }
        else { x = r.left + r.width / 2 - cw / 2; y = r.top - ch - 16; }
        card.style.left = Math.max(10, Math.min(innerWidth - cw - 10, x)) + 'px'; card.style.top = Math.max(10, Math.min(innerHeight - ch - 10, y)) + 'px';
        card.style.setProperty('--ax', (r.left + r.width / 2 - Math.max(10, Math.min(innerWidth - cw - 10, x))) + 'px');
      }
    };
    box.addEventListener('click', e => {
      const c = e.target.closest('[data-c]')?.dataset.c; if (!c) return;
      if (c === 'next') { k++; show(); }
      else if (c === 'advice') { done(); if ($('advice').hidden) $('adviceBtn').click(); }
      else done();
    });
    show();
  }
  function begin(s) {
    if (A.on) A.init();   // 開始の操作の中で
    st = s;
    ensureOfficers(st, B);
    $('title').hidden = true; $('result').hidden = true;
    syncAll(); applyDate(); drawOrders();
    ctx.apMax = 0;
    updateHud();
    save();
    const cap = seat(me().capital);
    if (cap) ctl.flyTo(cap.x, cap.z + 2, 420, 2.2);
    $('diplo').hidden = $('cards').hidden = $('people').hidden = true;
    tickerSig = '';
    updateTicker();
    bgmUpdate(true);
    if (st.turn === 0) setTimeout(() => showCoach(), 2400);   // はじめて遊ぶときだけ、3枚の案内（カメラが本拠へ寄り終わってから）
    if (st.over) showResult(); else showProposal();
  }
  $('loadFile').addEventListener('change', e => { if (e.target.files[0]) importSave(e.target.files[0]); e.target.value = ''; });

  // ── 音（js/audio.js）──
  const A = ctx.audio;
  let clickSfx = false;
  const sfx = (n, o) => { clickSfx = true; return A && A.se(n, o); };
  // ボタンの決定音（2026-10-20 本人指摘「決定音が鳴っていない」。前は外交などごく一部のコマンドだけで、県選び・メニュー・札の切りかえは無音だった）
  //  押したボタンの処理がその場で自分の音（月送り・コマンドの音・札をめくる音など）を鳴らしたら重ねない。閉じる・やめるは取り消しの音。
  //  音の初期化はしない（OFF のときや、まだ音を始めていないときは A.se が何もしない）
  //  押す前に決める（押したあとは札が閉じて [hidden] の中になり、県選び・×・閉じるが無音だった）
  let clickKind = null;
  addEventListener('click', e => {
    clickSfx = false; clickKind = null;
    const b = e.target.closest('button, a.btn, label.btn, .pick');
    if (!b || b.disabled || b.closest('[hidden]')) return;
    // 札やメニューを閉じるのは、札をめくる音を小さく低めに（取り消しの音は主張が強すぎる 2026-10-20 本人指摘）。「やめる」は取り消しの音
    const close = b.matches('.panel-close, #menuClose') || (b.closest('#sidetabs') && b.getAttribute('aria-pressed') === 'true');
    // 切りかえ（まとめて行う・速さ・距離・遊ぶ長さ・難易度など、押すたびにオン／オフや選択が変わるもの）は、決定音ではなく小さく短い音（2026-10-21 本人指摘：オンオフのたびに決定音は鬱陶しい）
    const toggle = !close && (b.matches('.bulk, .seg button, .mode button, #speed button, .seg.tiny button') || (b.hasAttribute('aria-pressed') && !b.closest('#sidetabs')));
    clickKind = close ? 'close' : b.matches('#sCancel') ? 'cancel' : toggle ? 'toggle' : 'decide';
  }, true);
  addEventListener('click', () => {
    if (clickKind && !clickSfx) { if (clickKind === 'close') sfx('card', { gap: 80, gain: 0.45, rate: 0.9 }); else if (clickKind === 'toggle') sfx('card', { gap: 80, gain: 0.3, rate: 1.3, dur: 0.18 }); else sfx(clickKind, { gap: 80 }); }
    clickKind = null;
  });
  function syncSound() {
    const b = $('soundBtn'); if (b) { b.textContent = A.on ? 'SOUND ON' : 'SOUND OFF'; b.setAttribute('aria-pressed', String(A.on)); }
    for (const x of document.querySelectorAll('#soundSeg button')) x.setAttribute('aria-pressed', String((x.dataset.v === '1') === A.on));
  }
  // タイトルの SOUND：押した操作の中で音を始める（ON ならタイトル曲）
  $('soundBtn').addEventListener('click', () => { A.setOn(!A.on); if (A.on) { A.init(); A.bgm('title'); sfx('decide'); } syncSound(); });
  $('soundSeg').addEventListener('click', e => { const b = e.target.closest('button'); if (!b) return; A.setOn(b.dataset.v === '1'); if (A.on) { A.init(); bgmUpdate(true); } syncSound(); });
  syncSound();
  A.onChange?.(() => syncSound());   // はじめの画面で切りかえても、タイトルの札をそろえる
  // その時の情勢で曲を選ぶ：滅亡・統一＞劣勢（自分が包囲網の的・本拠を失った混乱・士気40未満）＞勢い＞内政
  //  合戦の曲は、自分の合戦がある月の月送り（陣が動いて会敵している間）だけ鳴らす
  let bgmAt = 0;
  function bgmWant() {
    if (!st) return 'title';
    if (st.over) return (st.over.type === 'unify' && st.over.winner === st.player) || (st.over.type === 'time' && st.over.rank?.[0] === st.player) ? 'ending' : st.over.type === 'time' ? 'result' : null;
    const f = me();
    if ((st.coalition && st.coalition.target === st.player) || f.chaos > 0 || (f.shiki ?? 0.6) < 0.4) return 'ressei';
    if ((f.streak || 0) >= 3) return 'yusei';
    return 'naisei';
  }
  function bgmUpdate(force) {
    const w = bgmWant(), now = performance.now();
    const urgent = w === 'ressei' || w === 'ending' || w === null;
    if (!force && !urgent && A.current && A.current !== w && now - bgmAt < 25000) return;   // 曲がころころ変わらないように
    if (A.current !== w) bgmAt = now;
    A.bgm(w);
  }

  // ── メニュー ──
  const syncSpeed = () => { for (const b of document.querySelectorAll('#speed button')) b.setAttribute('aria-pressed', String(+b.dataset.s === speed)); };
  syncSpeed();
  $('menuBtn').addEventListener('click', () => { $('menu').hidden = !$('menu').hidden; syncTaikaBtn(); });
  // 天下統一を宣言する（全国の人口の8割を治めているあいだだけ出す）
  const syncTaikaBtn = () => { const b = $('taikaBtn'); if (b) b.hidden = !st || !!st.over || busy || nationalShare(st, B, st.player) < TAIKA; };
  $('taikaBtn')?.addEventListener('click', async () => {
    $('menu').hidden = true;
    if (!st || st.over || busy || !(await askTaika(false))) return;
    declareUnify();
    await cutin({ kicker: '天下統一', title: '天下統一！', sub: `${st.date.y}年${st.date.m}月`, color: me().color });
    showResult();
  });
  $('menuClose').addEventListener('click', () => { $('menu').hidden = true; });
  $('speed').addEventListener('click', e => { const b = e.target.closest('button'); if (!b) return; speed = +b.dataset.s; syncSpeed(); try { localStorage.setItem(SAVE_KEY + ':speed', speed); } catch (er) { /* なにもしない */ } });
  $('saveBtn').addEventListener('click', () => { if (st) exportSave(); else toast('まだ始まっていません'); });
  $('loadFile2').addEventListener('change', e => { if (e.target.files[0]) importSave(e.target.files[0]); e.target.value = ''; $('menu').hidden = true; });
  $('restartBtn').addEventListener('click', () => { if (confirm('はじめから遊びますか？（いまのセーブは消えます）')) { clearSave(); $('menu').hidden = true; for (const c of [...orderLayer.children]) orderLayer.remove(c); showTitle(); } });

  // 地図のタップ
  ctx.onTap = id => { if (id && st && st.munis[id]) openPanel(id); else closePanel(); };
  showTitle();
  return { get state() { return st; }, get busy() { return busy || !$('cutin').hidden; }, nextMonth, begin, B, cutin, showProposal, redrawOrders: () => drawOrders(), frame: dist => { U.uMe.value = st && !st.over ? st.player : -1; scaleVoyages(dist); frameOrders(); } };
}
