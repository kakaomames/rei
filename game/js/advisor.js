// 速報の帯に流す「四国のいま」。盤面から拾い、解説ではなく出来事として書く
//  level：alert（危ない）・good（好機）・info（ようす）。at があれば、押すとその市町村へ飛ぶ
import { crossK, income, defense, attackPower, isWinter, peaceful, pactOf, cards, brandSets, brandLv, BRAND_STEPS, BRANDS, MEISAN, DIPLO, ELECTION_EVERY, OPENING, power, officersOf, commanderAt, POLICY, shikiOf, riding, electionFestivals } from './sim.js?v=20261026a';

export function headlines(st, B) {
  const out = [];
  if (!st || st.player === null || st.over) return out;
  const me = st.player, f = st.factions[me];
  const name = id => B.info.get(id).name;
  const fname = id => st.factions[id].name;
  const mine = Object.values(st.munis).filter(m => m.owner === me);
  const n = v => Math.round(v).toLocaleString();

  // 申し出
  for (const p of st.proposals.filter(p => p.to === me)) out.push({ level: 'alert', text: `${fname(p.from)}勢から${DIPLO[p.kind].name}の申し出`, proposal: true });

  // 海から来る船団・出している船団
  for (const v of st.voyages || []) {
    const tgt = st.munis[v.to], left = v.eta - st.turn;
    if (v.f !== me && tgt && tgt.owner === me) out.push({ level: 'alert', text: `速報：${fname(v.f)}勢の船団（兵${n(v.troops)}）が${name(v.to)}へ・あと${left}か月`, at: v.to });
    else if (v.f === me) out.push({ level: 'info', text: `わが船団（兵${n(v.troops)}）は${name(v.to)}へ航海中・あと${left}か月`, at: v.to });
  }
  // 境の兵（脅威）
  const threats = [];
  for (const m of mine) {
    let t = 0, who = -1, big = 0;
    for (const id of B.landNb(m.id)) {
      const e = st.munis[id];
      if (!e || e.owner === me || peaceful(st, me, e.owner)) continue;
      t += e.troops;
      if (e.troops > big) { big = e.troops; who = e.owner; }
    }
    if (t > 0 && t > defense(st, B, m) * 1.1) threats.push({ m, t, who });
  }
  threats.sort((a, b) => b.t / (b.m.troops + 1) - a.t / (a.m.troops + 1));
  for (const x of threats.slice(0, 2)) out.push({ level: 'alert', text: `速報：${fname(x.who)}勢、${name(x.m.id)}との境に兵${n(x.t)}人`, at: x.m.id });

  // 手薄な敵地（好機）
  const chances = [];
  for (const m of mine) {
    const avail = m.troops * 0.75;
    if (avail < 800) continue;
    for (const id of B.landNb(m.id)) {
      const e = st.munis[id];
      if (!e || e.owner === me || peaceful(st, me, e.owner)) continue;
      const r = attackPower(st, f, avail, false, commanderAt(st, me, m.id)) * crossK(st, B, m.id, id) / Math.max(1, defense(st, B, e));
      if (r > 1.45) chances.push({ e, r, from: m.id });
    }
  }
  chances.sort((a, b) => b.r - a.r);
  const seen = new Set();
  for (const c of chances) {
    if (seen.has(c.e.id) || seen.size >= 2) continue;
    seen.add(c.e.id);
    out.push({ level: 'good', text: `${name(c.e.id)}（${fname(c.e.owner)}勢）の守りは手薄・兵${n(c.e.troops)}人`, at: c.e.id });
  }

  // 兵糧
  const inc = income(st, B, f);
  const toHarvest = (10 - st.date.m + 12) % 12;
  if (inc.food < 0) {
    const left = f.food / -inc.food;
    if (left < toHarvest + 1) out.push({ level: 'alert', text: `兵糧はあと${Math.max(0, Math.floor(left))}か月分・秋の収穫まで${toHarvest}か月` });
  }
  if (st.date.m === 9) out.push({ level: 'info', text: '来月は秋の収穫' });

  // 包囲網・宿敵・地方
  { const c = st.coalition;
    if (c && c.target === me) out.push({ level: 'alert', text: `${f.name}勢包囲網：${c.members.length}勢力に囲まれている。同盟か停戦で1つずつ崩せる` });
    else if (c && c.members.includes(me)) out.push({ level: 'info', text: `${fname(c.target)}勢包囲網に加わっている（なかまとは攻め合わない）` });
    else if (c) out.push({ level: 'info', text: `${fname(c.target)}勢包囲網ができている（${c.members.length}勢力）` });
    const rv = st.rival;
    if (rv >= 0 && st.factions[rv]?.alive) {
      const R = st.factions[rv], rn = Object.values(st.munis).filter(m => m.owner === rv).length;
      out.push({ level: 'alert', text: `宿敵 ${R.name}勢：${rn}市町村・兵${n(power(st, rv))}・士気${Math.round((R.shiki ?? 0.6) * 100)}${(R.streak || 0) >= 3 ? '・勢いに乗っている' : ''}`, at: R.capital });
    }
  }
  // 士気と勢い
  { const sk = Math.round(shikiOf(f) * 100);
    if (riding(f)) out.push({ level: 'good', text: `勢いに乗っている（士気${sk}）。攻めどき` });
    else if (sk < 40) out.push({ level: 'alert', text: `士気が下がっている（${sk}）。${sk < 30 ? '兵が逃げはじめた' : '勝ち戦か祭りで戻る'}` });
    else if ((f.streak || 0) === 2) out.push({ level: 'good', text: '町を取った月が2か月続く。もう1か月で勢いに乗る' }); }
  // 民心
  const low = mine.filter(m => m.morale < 0.42).sort((a, b) => a.morale - b.morale)[0];
  if (low) out.push({ level: 'alert', text: `${name(low.id)}の民心が冷えこむ（${Math.round(low.morale * 100)}）`, at: low.id });

  // 名産・ブランド
  { const bl = brandLv(st, B, me), near = new Set();
    for (const m of mine) for (const id of B.landNb(m.id)) if (st.munis[id] && st.munis[id].owner !== me) near.add(id);
    for (const [k, x] of Object.entries(bl)) {
      if (x.lv > 0) out.push({ level: 'good', text: `「${BRANDS[k].name}」Lv${x.lv}：${BRANDS[k].effect}${x.lv > 1 ? `×${x.lv}` : ''}` });
      const next = BRAND_STEPS.find(v => v > x.n);
      if (next && next - x.n === 1) {
        const cand = [...near].find(id => (B.meisan?.get(id) || []).some(y => y.cat === k));
        if (cand) out.push({ level: 'good', text: `あと1つで「${BRANDS[k].name}」Lv${x.lv + 1}：${name(cand)}の${B.meisan.get(cand).find(y => y.cat === k).name}`, at: cand });
      }
    }
  }

  // 知事選
  const left = ELECTION_EVERY - (st.turn % ELECTION_EVERY);
  if (st.poll !== null && st.poll !== undefined) {
    const p = Math.round(st.poll * 100);
    out.push({ level: st.poll < 0.5 ? 'alert' : left <= 6 ? 'info' : 'info', text: `知事選まで${left}か月・支持${p}%${st.poll < 0.5 ? '（このままでは落選）' : ''}` });    // 何をすれば戻るか：票は地元の人だけなので、地元の大きな町の祭りが一番効く（2026-10-20）
    if (left <= 12 && st.poll < 0.56) { const fe = electionFestivals(st, B, me, 1)[0]; if (fe) out.push({ level: st.poll < 0.5 ? 'alert' : 'info', text: `票は地元の人だけ。${name(fe.at)}で祭りを開くと支持が上がる（民心${Math.round(st.munis[fe.at].morale * 100)}%）`, at: fe.at }); }
  }

  // 約束の期限
  for (const p of st.pacts) {
    if (p.a !== me && p.b !== me) continue;
    const other = p.a === me ? p.b : p.a, rest = p.until - st.turn;
    if (rest <= 2) out.push({ level: 'info', text: `${fname(other)}勢との${DIPLO[p.type].name}はあと${rest}か月` });
  }

  // 人材・委任
  const idle = officersOf(st, me).filter(o => !o.at && !o.gov);
  if (idle.length) out.push({ level: 'info', text: `手すきの人材：${idle.slice(0, 3).map(o => o.name).join('・')}` });
  const bare = threats.find(x => !officersOf(st, me).some(o => o.at === x.m.id));
  if (bare && idle.length) out.push({ level: 'alert', text: `${name(bare.m.id)}には城代がいない`, at: bare.m.id });
  for (const [pc, d] of Object.entries(st.delegs || {})) {
    const o = officersOf(st, me).find(o => o.id === d.oid);
    if (o) out.push({ level: 'info', text: `${B.info.get(Object.values(st.munis).find(m => B.info.get(m.id).pref === pc)?.id)?.prefName || ''}は${o.name}に委任（${POLICY[d.policy]}・財布${Math.floor(d.purse)}）` });
  }
  // 情勢
  const alive = st.factions.filter(x => x.alive);
  // いちばん市町村を増やした勢力（はじめの数から。はじめから広い県が「のびている」と出ないように）
  const grew = alive.map(x => [x, Object.values(st.munis).filter(m => m.owner === x.id).length - (x.orig || 0)]).sort((a, b) => b[1] - a[1])[0];
  if (grew && grew[0].id !== me && grew[1] >= 3) out.push({ level: 'info', text: `${grew[0].name}勢がのびている（はじめより+${grew[1]}市町村）` });
  // 開幕の備え：どこも攻めてこないあいだにすること
  if ((st.turn || 0) < OPENING) out.push({ level: 'good', text: `開幕の備え：あと${OPENING - st.turn}か月はどこも攻めない。商業・開墾で地固めし、外交で背中を固める` });
  if (f.chaos > 0) out.push({ level: 'alert', text: `本拠を移した混乱が続く（あと${f.chaos}か月・行動力半分）` });
  if (isWinter(st) && f.ships > 0) out.push({ level: 'info', text: '冬の海は時化やすい' });
  if (f.gold > 150) out.push({ level: 'info', text: `予算に余裕（${n(f.gold)}）` });
  // 先月の出来事（ほかの勢力どうし）
  for (const e of st.log.filter(e => e.turn === st.turn && e.type === 'battle' && e.result === 'win' && e.f !== me && e.defOwner !== me).slice(-2)) {
    out.push({ level: 'info', text: `${fname(e.f)}勢が${name(e.to)}を奪う`, at: e.to });
  }
  const rank = { alert: 0, good: 1, info: 2 };
  return out.sort((a, b) => rank[a.level] - rank[b.level]).slice(0, 10);
}
