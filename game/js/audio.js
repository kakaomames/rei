// 47国志の音（GAME_AUDIO_RULES.md・SOUND_LEVELS.md に沿う）
//  ・ページを開いただけでは鳴らさない。開始の操作（SOUND の切りかえ・県を選ぶ）の中で AudioContext を作り、playback を指定する
//  ・はじめは SOUND ON。OFF は保存して次回も守る。OFF ではすべての音を止める
//  ・長い BGM は <audio>（ループ点で2本を短く重ねてつなぐ）、効果音とジングルはデコードして鳴らす
//  ・隠れたら止め、戻ったら直前に鳴っていた曲だけ続きから
//  ・音量（ゲイン）は bgm/README.md・sound/README.md の実測値から。実効音量 = 素材の音量 + 20×log10(ゲイン)
const KEY = 'amix-47kokushi-sound';
const BGM = {   // ls・le：ループ始点・終点（秒）。whole：ファイル全体がそのまま頭につながる
  title: { file: 'title-1346607.mp3', gain: 0.389, ls: 4.066, le: 112.7453 },
  naisei: { file: 'naisei-1612291.mp3', gain: 0.495, whole: true },
  kassen: { file: 'kassen-791308.mp3', gain: 0.224, whole: true, fresh: true },   // 合戦のたびに頭から
  ressei: { file: 'ressei-1101430.mp3', gain: 0.543, ls: 4.598, le: 68.598 },
  yusei: { file: 'yusei-1414230.mp3', gain: 0.279, ls: 5.8871, le: 75.5645 },
  ending: { file: 'ending-1248605.mp3', gain: 0.412, once: true },
  result: { file: 'result-1304247.mp3', gain: 0.432, whole: true, fresh: true, gap: 2.5 }   // 期限で2位以下のクリア：ループ点がないので、終わったら2.5秒おいて頭から
};
const JINGLE = {   // 短い曲。鳴っている間は BGM を下げる
  fushime: { file: 'fushime-74513.mp3', gain: 0.380 },
  senkyo: { file: 'senkyo-221435.mp3', gain: 0.668 },
  metsubo: { file: 'metsubo-1137637.mp3', gain: 0.519 },
  clear: { file: 'clear-984752.mp3', gain: 1.13 }   // 期限まで治めきったクリア（2位以下）。地方統一より少し控えめ
};
const SE = {
  decide: ['decide-1101559.mp3', 0.295], cancel: ['cancel-1101558.mp3', 0.240], card: ['card-74514.mp3', 0.537], month: ['month-1222447.mp3', 0.292],
  horagai: ['horagai-1206564.mp3', 1.047], clash: ['clash-1178067.mp3', 0.178], gaya: ['gaya-117896.mp3', 0.385], win: ['win-1200908.mp3', 0.359],
  gon: ['gon-148856.mp3', 0.447], cutin: ['cutin-137550.mp3', 0.501], stamp: ['stamp-78024.mp3', 0.653], stampbig: ['stampbig-913549.mp3', 0.638],
  suzu: ['suzu-160035.mp3', 0.427], letter: ['letter-1687604.mp3', 1.012], kiteki: ['kiteki-1664526.mp3', 0.195], coin: ['coin-476782.mp3', 0.638],
  zaku: ['zaku-71599.mp3', 0.359], ashioto: ['ashioto-789747.mp3', 0.359], ou: ['ou-53197.mp3', 0.316], tonton: ['tonton-787168.mp3', 0.452],
  matsuri: ['matsuri-1447745.mp3', 0.610], koto: ['koto-205360.mp3', 0.447], taiko: ['taiko-127702.mp3', 0.367], kabuki: ['kabuki-1270117.mp3', 0.417],
  monomi: ['monomi-1554372.mp3', 0.214],
  toki: ['toki-117865.mp3', 0.495], hansho: ['hansho-53128.mp3', 0.437], hyoshigi: ['hyoshigi-110528.mp3', 0.583]
};
const XF = 0.12;   // ループの継ぎ目を重ねる長さ（秒）
const FADE = 1.2;  // 曲を切りかえるときのフェード（秒）

export function createAudio(base = '') {
  let on = true;
  try { const v = localStorage.getItem(KEY); if (v === 'off') on = false; } catch (e) { /* 保存できない環境 */ }
  let ctx = null, master = null, bgmBus = null, seBus = null, duck = null;
  const buffers = new Map(), loading = new Map();
  let cur = null;          // いま鳴らしている曲 { name, decks:[a,b], gains:[g,g], act, timer }
  let want = null;         // 鳴らしたい曲の名前（OFF・隠れている間も覚えておく）
  let hidden = false;
  const listeners = new Set();
  const lastSe = new Map();
  const pos = {};   // 曲ごとに止めた位置（続きから鳴らす）

  function init() {   // 開始の操作の中で呼ぶ（await を挟まない）
    if (ctx) { if (ctx.state !== 'running') ctx.resume().catch(() => {}); return true; }
    try { if (navigator.audioSession) navigator.audioSession.type = 'playback'; } catch (e) { /* 対応していない環境 */ }
    try {
      ctx = new (window.AudioContext || window.webkitAudioContext)();
      master = ctx.createGain(); master.gain.value = on ? 1 : 0;
      const comp = ctx.createDynamicsCompressor();
      comp.threshold.value = -10; comp.ratio.value = 4; comp.attack.value = 0.004; comp.release.value = 0.2;
      bgmBus = ctx.createGain(); duck = ctx.createGain(); seBus = ctx.createGain();
      bgmBus.connect(duck); duck.connect(master); seBus.connect(master); master.connect(comp); comp.connect(ctx.destination);
      ctx.resume().catch(() => {});
      for (const n of Object.keys(SE)) loadBuf(base + 'sound/' + SE[n][0]);
      for (const n of Object.keys(JINGLE)) loadBuf(base + 'bgm/' + JINGLE[n].file);
      return true;
    } catch (e) { ctx = null; return false; }   // 音が使えなくてもゲームは続ける
  }
  function loadBuf(url) {
    if (buffers.has(url) || loading.has(url) || !ctx) return loading.get(url);
    const p = fetch(url).then(r => r.arrayBuffer()).then(b => new Promise((res, rej) => ctx.decodeAudioData(b, res, rej)))
      .then(buf => { buffers.set(url, buf); loading.delete(url); return buf; })
      .catch(() => { loading.delete(url); return null; });
    loading.set(url, p);
    return p;
  }

  // ── BGM ──
  function makeDeck(t) {
    const a = new Audio(base + 'bgm/' + t.file);
    a.preload = 'auto'; a.crossOrigin = 'anonymous';
    if (t.whole && !t.gap) a.loop = true;
    const g = ctx.createGain(); g.gain.value = 0;
    try { ctx.createMediaElementSource(a).connect(g); } catch (e) { /* 二度つないだとき */ }
    g.connect(bgmBus);
    return { a, g };
  }
  function ramp(param, to, sec) {
    const t0 = ctx.currentTime;
    if (param.cancelAndHoldAtTime) param.cancelAndHoldAtTime(t0); else { param.cancelScheduledValues(t0); param.setValueAtTime(param.value, t0); }
    param.linearRampToValueAtTime(to, t0 + Math.max(0.005, sec));
  }
  function stopTrack(tr, sec = FADE) {
    if (!tr) return;
    pos[tr.name] = tr.decks[tr.act].a.currentTime;
    clearInterval(tr.timer);
    for (const d of tr.decks) { ramp(d.g.gain, 0, sec); const a = d.a; setTimeout(() => { a.pause(); }, sec * 1000 + 60); }
  }
  function startTrack(name) {
    const t = BGM[name];
    const decks = [makeDeck(t)];
    if (!t.whole && !t.once) decks.push(makeDeck(t));
    const tr = { name, t, decks, act: 0, timer: 0, swapping: false };
    const d = decks[0];
    const at = t.fresh || t.once ? 0 : pos[name] || 0;
    d.a.currentTime = !t.whole && !t.once && at >= t.le - 1.5 ? t.ls : at;   // 続きから（ループ終点の近くなら始点へ）
    const p = d.a.play();
    if (p && p.catch) p.catch(() => {});
    ramp(d.g.gain, t.gain, FADE);
    if (t.gap) d.a.onended = () => setTimeout(() => {   // 終わったら間をおいて頭から（その時にまだこの曲で、鳴らしてよいときだけ）
      if (cur !== tr || hidden || !on) return;
      d.a.currentTime = 0; const q = d.a.play(); if (q && q.catch) q.catch(() => {});
    }, t.gap * 1000);
    // ループ点：終点の1.2秒前から控えを同じ流れで鳴らし始め、終点の手前で重ねて入れかえる
    if (!t.whole && !t.once) tr.timer = setInterval(() => {
      if (hidden || cur !== tr) return;
      const A = tr.decks[tr.act], B = tr.decks[1 - tr.act];
      const tA = A.a.currentTime;
      if (!tr.swapping && tA >= t.le - 1.2) {
        tr.swapping = true;
        B.g.gain.value = 0;
        B.a.currentTime = Math.max(0, t.ls - (t.le - tA));
        const q = B.a.play(); if (q && q.catch) q.catch(() => {});
      }
      if (tr.swapping && tA >= t.le - XF) {
        ramp(B.g.gain, t.gain, XF); ramp(A.g.gain, 0, XF);
        const old = A.a; setTimeout(() => old.pause(), XF * 1000 + 40);
        tr.act = 1 - tr.act; tr.swapping = false;
      }
    }, 30);
    return tr;
  }
  function bgm(name) {   // name：BGM の名前、null で止める
    want = name;
    if (!ctx || !on || hidden) return;
    if (cur && cur.name === name) return;
    stopTrack(cur); cur = null;
    if (name && BGM[name]) cur = startTrack(name);
  }

  // ── ジングル（BGM を下げて鳴らす） ──
  function jingle(name) {
    const j = JINGLE[name];
    if (!j || !ctx || !on || hidden) return;
    const url = base + 'bgm/' + j.file, buf = buffers.get(url);
    if (!buf) { loadBuf(url); return; }
    const s = ctx.createBufferSource(), g = ctx.createGain();
    s.buffer = buf; g.gain.value = j.gain; s.connect(g); g.connect(master);
    ramp(duck.gain, 0.2, 0.3);
    s.onended = () => { if (ctx) ramp(duck.gain, 1, 1.0); };
    s.start();
  }

  // ── 効果音 ──
  function se(name, opt = {}) {
    if (!ctx || !on || hidden) return;
    const e = SE[name]; if (!e) return;
    const now = performance.now(), gap = opt.gap ?? 60;
    if (now - (lastSe.get(name) || 0) < gap) return;   // 同じ音の重なりすぎを防ぐ
    lastSe.set(name, now);
    const buf = buffers.get(base + 'sound/' + e[0]);
    if (!buf) return;   // まだ読み込み中なら鳴らさない（あとでまとめて鳴らさない）
    const s = ctx.createBufferSource(), g = ctx.createGain();
    s.buffer = buf; s.playbackRate.value = opt.rate || 1;
    g.gain.value = e[1] * (opt.gain ?? 1);
    s.connect(g); g.connect(seBus);
    s.start(ctx.currentTime + (opt.delay || 0));
    if (opt.dur) { g.gain.setValueAtTime(g.gain.value, ctx.currentTime + opt.dur - 0.25); g.gain.linearRampToValueAtTime(0, ctx.currentTime + opt.dur); s.stop(ctx.currentTime + opt.dur + 0.05); }
  }

  // ── ON／OFF ──
  function setOn(v) {
    on = !!v;
    try { localStorage.setItem(KEY, on ? 'on' : 'off'); } catch (e) { /* 保存できない環境 */ }
    if (on) { init(); if (master) ramp(master.gain, 1, 0.05); const w = want; want = null; if (w) bgm(w); }
    else { if (master) ramp(master.gain, 0, 0.02); stopTrack(cur, 0.05); cur = null; }
    for (const f of listeners) f(on);
  }

  // ── 隠れたら止め、戻ったら続きから ──
  function onHide() {
    if (hidden) return; hidden = true;
    if (cur) for (const d of cur.decks) d.a.pause();
    if (ctx && ctx.state === 'running') ctx.suspend().catch(() => {});
  }
  function onShow() {
    if (!hidden) return; hidden = false;
    if (!ctx || !on) return;
    ctx.resume().catch(() => {});
    if (cur) { const d = cur.decks[cur.act]; const p = d.a.play(); if (p && p.catch) p.catch(() => {}); }
    else if (want) bgm(want);
  }
  document.addEventListener('visibilitychange', () => (document.hidden ? onHide() : onShow()));
  addEventListener('pagehide', onHide);
  addEventListener('pageshow', () => { if (!document.hidden) onShow(); });

  return {
    get on() { return on; },
    init, setOn, bgm, jingle, se,
    onChange: f => listeners.add(f),
    get current() { return cur ? cur.name : null; }
  };
}
