// Footer overlap gate: at scroll end, the fixed TOP button must not cover footer links or the copyright line.
// Usage: node scripts/verify-footer-overlap.mjs [baseUrl]  (exit 1 on overlap)
import { chromium } from 'playwright-core';

const base = process.argv[2] || 'http://localhost:3000';
const pages = ['/', '/posts/rabbit-hole-intro', '/voices/liao-heng', '/voices/liang-wenfeng'];
const widths = [390, 1280];
const browser = await chromium.launch({ channel: 'chrome' });
const failures = [];
for (const w of widths) {
  for (const p of pages) {
    const pg = await browser.newPage({ viewport: { width: w, height: 844 } });
    try {
      await pg.goto(base + p, { waitUntil: 'load', timeout: 30000 });
      const fr = pg.frames().find((f) => /\/voices\/[^/]+\/index(\.en)?\.html/.test(f.url())) ?? pg.mainFrame();
      await fr.waitForSelector('footer', { timeout: 15000 });
      await fr.evaluate(() => window.scrollTo(0, document.documentElement.scrollHeight));
      await pg.waitForTimeout(700);
      const hits = await fr.evaluate(() => {
        const btns = [...document.querySelectorAll('.back-to-top, [class*="top-button"], [aria-label*="맨 위"], [aria-label*="top" i]')]
          .filter((b) => getComputedStyle(b).position === 'fixed' && b.getBoundingClientRect().width > 0 && getComputedStyle(b).visibility !== 'hidden' && getComputedStyle(b).opacity !== '0');
        const f = [...document.querySelectorAll('footer')].pop();
        const targets = [...f.querySelectorAll('a, .cc-footer__legal, .voice-shared-footer__legal')];
        const out = [];
        for (const b of btns) {
          const r = b.getBoundingClientRect();
          for (const t of targets) {
            const q = t.getBoundingClientRect();
            if (q.width && r.left < q.right && r.right > q.left && r.top < q.bottom && r.bottom > q.top) out.push((t.innerText || t.className).trim().slice(0, 30));
          }
        }
        return out;
      });
      if (hits.length) failures.push(`${w} ${p}: TOP covers ${hits.join(', ')}`);
    } catch (e) { failures.push(`${w} ${p}: ${String(e).slice(0, 100)}`); }
    await pg.close();
  }
}
await browser.close();
console.log(JSON.stringify({ base, checked: pages.length * widths.length, failures }));
if (failures.length) process.exit(1);
