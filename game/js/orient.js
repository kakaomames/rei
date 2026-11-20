/* 横向き案内（GAME_ORIENTATION_RULES.md／コピー元は common/SNIPPETS.md の orientGuard）
   スマホを横にしたら画面を案内で覆い、プレイ中なら作品の既存の一時停止をかける。
   縦に戻しても自動で再開しない（作品のポーズ画面のまま待つ）。ゲーム本体のコードは変えない。
   ?orient=1 で常に表示・?orient=0 で無効（検証用） */
(() => {
  /* ── 作品ごとに書きかえる所 ── */
  const TEXT = '縦向きにしてください';   // KIDS は「たてむきに してね」、英語版は 'Please rotate to portrait'
  // 一時停止。案内が出ている間はくり返し呼ぶので、何度呼んでも二重にならない形にする。
  // プレイ中でなければ何もしない入口を選び、どれを選んだかをここに書く（GAME_ORIENTATION_RULES.md 4）
  function pause() {
    // 試作の段階では一時停止がない（ターン制で、時間で進むものはない）ので覆うだけ。
    // ターン送りの演出を作ったら、その一時停止をここで呼ぶ
  }
  /* ── ここまで ── */

  const q = new URLSearchParams(location.search).get('orient');
  const coarse = matchMedia('(pointer: coarse)');
  // スマホだけ（短い辺が 600px 未満）。iPad・PC は対象外
  const phone = () => coarse.matches && Math.min(screen.width, screen.height) < 600;
  // 向きは画面そのものの向きで見る（入力中のキーボードで縦長が崩れても誤判定しない）
  const landscape = () => {
    const t = screen.orientation && screen.orientation.type;
    if (t) return t.indexOf('landscape') === 0;
    if (typeof window.orientation === 'number') return Math.abs(window.orientation) === 90;
    return innerWidth > innerHeight;
  };
  // ページに埋め込まれた表示（about の背景の iframe など）では出さない。向きの扱いは外側のページに任せる
  const framed = (() => { try { return window.self !== window.top; } catch (e) { return true; } })();
  const CSS = '#amix-orient{position:fixed;inset:0;z-index:2147483600;display:flex;flex-direction:column;align-items:center;justify-content:center;gap:14px;padding:16px;background:var(--amix-orient-bg,rgba(8,12,16,.94));color:var(--amix-orient-fg,#fff);font:600 17px/1.6 system-ui,-apple-system,"Hiragino Sans",sans-serif;letter-spacing:.06em;text-align:center;touch-action:none;user-select:none;-webkit-user-select:none}'
    + '#amix-orient[hidden]{display:none!important}'
    + '#amix-orient svg{width:84px;height:84px;fill:none;stroke:currentColor;stroke-width:4.5;stroke-linecap:round;stroke-linejoin:round}'
    + '#amix-orient .ph{transform-box:view-box;transform-origin:60px 60px;animation:amixOrient 2.4s ease-in-out infinite}'
    + '#amix-orient .ar{opacity:.55}'
    + '#amix-orient p{margin:0}'
    + '@keyframes amixOrient{0%,30%{transform:rotate(-90deg)}60%,100%{transform:rotate(0)}}'
    + '@media (prefers-reduced-motion:reduce){#amix-orient .ph{animation:none}}';
  let el = null, on = false, iv = 0;
  function tryPause() { try { pause(); } catch (e) { /* 止められなくても案内は出す */ } }
  function check() {
    const need = q === '1' || (q !== '0' && !framed && phone() && landscape());
    if (need === on) return;
    on = need;
    el.hidden = !need;
    document.documentElement.classList.toggle('amix-orient-on', need);
    clearInterval(iv);
    // 案内の間にカウントダウンからプレイへ移る作品もあるので、出ている間は呼びつづける
    if (need) { tryPause(); iv = setInterval(tryPause, 400); }
  }
  function init() {
    const st = document.createElement('style');
    st.textContent = CSS;
    document.head.appendChild(st);
    el = document.createElement('div');
    el.id = 'amix-orient';
    el.hidden = true;
    el.setAttribute('aria-live', 'polite');
    el.innerHTML = '<svg viewBox="0 0 120 120" aria-hidden="true"><path class="ar" d="M15 34A52 52 0 0 1 105 34M105 23v11h-10"/><g class="ph"><rect x="43" y="31" width="34" height="58" rx="6"/><path d="M55 38h10"/></g></svg><p></p>';
    el.querySelector('p').textContent = TEXT;
    document.body.appendChild(el);
    // 案内の上の指・マウス操作を下のゲームへ渡さない（window や document で入力を受ける作品がある）
    for (const t of ['pointerdown', 'pointerup', 'pointermove', 'pointercancel', 'touchstart', 'touchmove', 'touchend', 'touchcancel', 'mousedown', 'mouseup', 'mousemove', 'click', 'dblclick', 'contextmenu', 'wheel']) el.addEventListener(t, e => e.stopPropagation());
    check();
    addEventListener('resize', check);
    addEventListener('orientationchange', check);
    if (screen.orientation && screen.orientation.addEventListener) screen.orientation.addEventListener('change', check);
  }
  if (document.body) init(); else document.addEventListener('DOMContentLoaded', init);
})();
