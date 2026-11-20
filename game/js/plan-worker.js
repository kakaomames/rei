// 参謀の策を別の処理で考える（画面を止めない）
import { createBoard } from './sim.js?v=20261026a';
import { plan } from './planner.js?v=20261026a';
let B = null;
onmessage = e => {
  const d = e.data;
  if (d.idx) { B = createBoard(d.idx); return; }
  try { postMessage({ id: d.id, res: plan(d.st, B, d.fid, { light: !!d.light }) }); }
  catch (err) { postMessage({ id: d.id, error: String(err && err.message || err) }); }
};
