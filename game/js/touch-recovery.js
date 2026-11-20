/* 拡大後の復帰だけを補助する。等倍ではタップ・スクロール・clickを変更しない（GAME_TOUCH_RULES.md）。 */
(() => {
  const root = document.documentElement, vv = window.visualViewport;
  if (!vv) return;
  let fingers = 0, recovering = false;
  const zoomed = () => vv.scale > 1.01;
  const sync = () => {
    if (zoomed() && fingers) recovering = true;
    root.classList.toggle('zoom-recovery', zoomed() || recovering);
  };
  const style = document.createElement('style');
  style.textContent = 'html.zoom-recovery,html.zoom-recovery body,html.zoom-recovery body *{touch-action:manipulation!important}';
  document.head.appendChild(style);
  document.addEventListener('touchstart', e => {
    if (e.touches.length === e.changedTouches.length) recovering = zoomed();
    fingers = e.touches.length; sync();
  }, { passive: true, capture: true });
  const end = e => {
    fingers = e.touches.length;
    if (!fingers) recovering = false;
    queueMicrotask(sync);
  };
  document.addEventListener('touchend', end, { passive: true, capture: true });
  document.addEventListener('touchcancel', end, { passive: true, capture: true });
  vv.addEventListener('resize', sync); vv.addEventListener('scroll', sync);
  addEventListener('resize', sync);
  const reset = () => { fingers = 0; recovering = false; sync(); };
  for (const ev of ['pageshow', 'pagehide', 'blur']) addEventListener(ev, reset);
  document.addEventListener('visibilitychange', () => { if (document.hidden) reset(); });
  sync();
})();
