// Thread tail gate (2026-10-10, Simon: "계속 파는 질문이 제목 밑에 달려있는 것처럼 ... 꼬리를 물고").
// Usage: node scripts/verify-thread-tail.mjs [baseUrl]   (exit 1 on any failure)
import { chromium } from 'playwright-core';
// Coordinate check for the thread tail: every elbow must land just left of its thumbnail at the
// thumbnail's vertical centre, and the rail must be continuous from title to the last node.
const base = process.argv[2] || 'http://localhost:3000';
const b = await chromium.launch({ channel: 'chrome', headless: true });
let bad = 0;
const measure = () => [...document.querySelectorAll('.ccx-thread')].map((th) => {
  const px = (v) => parseFloat(v) || 0;
  const errs = [];
  const title = th.querySelector('.ccx-thead').getBoundingClientRect(); // title block incl. meta line (stacked on phones)
  const nodes = [];
  for (const li of th.querySelectorAll('.ccx-tposts > li')) {
    if (!li.getClientRects().length || li.closest('details:not([open])')) continue;
    const r = li.getBoundingClientRect();
    const a = getComputedStyle(li, '::after'); const bf = getComputedStyle(li, '::before');
    const img = li.querySelector('.ccx-tpost__img').getBoundingClientRect();
    // smoothness: opaque colour (no dark joints where strokes meet), one integer weight, no dashes
    const alpha = (c) => { const m = c.match(/\/\s*([\d.]+)\)|rgba\([^)]*,\s*([\d.]+)\)/); return m ? parseFloat(m[1] ?? m[2]) : 1; };
    for (const [k, v] of [['bend', a.borderLeftColor], ['bend-foot', a.borderBottomColor]]) if (alpha(v) < 0.999) errs.push(`translucent ${k} ${v}`);
    const wts = [a.borderLeftWidth, a.borderBottomWidth]; if (bf.content !== 'none' && bf.content !== 'normal') { wts.push(bf.borderLeftWidth || bf.width); if (alpha(bf.borderLeftColor) < 0.999) errs.push('translucent rail'); }
    if (new Set(wts.map(px)).size > 1 || wts.some((x) => px(x) % 1)) errs.push(`stroke weights ${wts.join('/')}`);
    if (a.borderLeftStyle !== 'solid' || a.borderBottomStyle !== 'solid') errs.push('non-solid bend');
    const endX = r.left + px(a.left) + px(a.width);
    const endY = r.top + px(a.top) + px(a.height);
    const railX = r.left + px(a.left);
    const gap = img.left - endX;
    if (gap < 2 || gap > 12) errs.push(`elbow-gap ${gap.toFixed(1)}`);
    if (Math.abs(endY - (img.top + img.height / 2)) > 2.5) errs.push(`elbow-y off ${(endY - img.top - img.height / 2).toFixed(1)}`);
    if (railX < title.left + 2 || railX > title.left + 16) errs.push('rail left of title');
    nodes.push({ top: r.top, bottom: r.bottom, cont: bf.content !== 'none' && bf.content !== 'normal' ? r.bottom : r.top + px(a.height) });
  }
  const sum = th.querySelector(':scope > .ccx-more summary');
  if (sum && getComputedStyle(sum, '::before').borderLeftStyle !== 'solid') errs.push('dashed more-node');
  if (sum) { const s = sum.getBoundingClientRect(); nodes.push({ top: s.top, bottom: s.bottom, cont: s.top + s.height / 2 }); }
  for (let i = 1; i < nodes.length; i++) if (nodes[i].top - nodes[i - 1].cont > 1.5) errs.push(`rail break before node ${i} (${(nodes[i].top - nodes[i - 1].cont).toFixed(1)}px)`);
  const last = nodes[nodes.length - 1];
  if (last && last.cont > last.bottom - 1 && sum) errs.push('rail runs past last node');
  if (nodes[0] && nodes[0].top - title.bottom > 14) errs.push(`first node far from title ${nodes[0].top - title.bottom}`);
  return { name: th.querySelector('.ccx-title').textContent, nodes: nodes.length, errs };
});
for (const w of [320, 393, 768, 1280]) {
  const pg = await b.newPage({ viewport: { width: w, height: 900 }, deviceScaleFactor: 2 });
  for (const path of ['/', '/en']) {
    await pg.goto(base + path, { waitUntil: 'load', timeout: 60000 });
    await pg.waitForTimeout(300);
    for (const state of ['closed', 'open']) {
      if (state === 'open') { for (const s of await pg.locator('.ccx-thread > .ccx-more summary').all()) await s.click(); await pg.waitForTimeout(200); }
      const res = await pg.evaluate(measure);
      const errs = res.filter((t) => t.errs.length);
      if (errs.length) { bad += errs.length; console.log('FAIL', w, path, state, JSON.stringify(errs).slice(0, 400)); }
      else console.log('ok  ', w, path, state, res.map((t) => t.nodes).join(','));
    }
  }
  await pg.close();
}
console.log('BAD', bad);
await b.close();
if (bad) process.exit(1);
