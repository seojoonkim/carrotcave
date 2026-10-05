// Rendered check: the footer contact + copyright lines must be VISIBLE (not just present in markup)
// at mobile and desktop. 2026-10-05: a ≤480px rule `.cc-footer p:not(.cc-newsletter p){display:none}`
// hid the email/copyright on phones while source-level tests passed.
// Usage: node scripts/verify-footer-legal-visible.mjs [baseUrl]   (exit 1 on any failure)
import { chromium } from 'playwright-core';
import { readFileSync } from 'node:fs';

const base = process.argv[2] || 'http://localhost:3000';
const legal = JSON.parse(readFileSync(new URL('../data/site-legal.json', import.meta.url), 'utf8'));
const pages = ['/', '/en', '/posts/rabbit-hole-intro', '/voices', '/voices/liao-heng'];
const widths = [390, 1280];

const browser = await chromium.launch({ channel: 'chrome' });
const failures = [];
await Promise.all(widths.map(async (w) => {
  const ctx = await browser.newContext({ viewport: { width: w, height: 900 } });
  for (const p of pages) {
    const pg = await ctx.newPage();
    try {
      await pg.goto(base + p, { waitUntil: 'load', timeout: 30000 });
      const frame = pg.frames().find((f) => /\/voices\/[^/]+\/index(\.en)?\.html/.test(f.url())) ?? pg.mainFrame();
      await frame.waitForSelector('footer', { timeout: 15000 });
      const r = await frame.evaluate((email) => {
        const f = [...document.querySelectorAll('footer')].pop();
        const vis = (el) => { if (!el) return false; const b = el.getBoundingClientRect(); const cs = getComputedStyle(el); return b.width > 0 && b.height > 0 && cs.visibility !== 'hidden' && cs.opacity !== '0'; };
        const mail = f.querySelector(`a[href="mailto:${email}"]`);
        const leg = f.querySelector('.cc-footer__legal, .voice-shared-footer__legal');
        return { mail: vis(mail), legal: vis(leg), text: leg?.innerText ?? '' };
      }, legal.email);
      if (!r.mail) failures.push(`${w} ${p}: email not visible`);
      if (!r.legal) failures.push(`${w} ${p}: copyright not visible`);
      else if (!r.text.includes(legal.holder) || !r.text.startsWith('©')) failures.push(`${w} ${p}: copyright text wrong: ${r.text}`);
    } catch (e) { failures.push(`${w} ${p}: ${String(e).slice(0, 100)}`); }
    await pg.close();
  }
  await ctx.close();
}));
await browser.close();
console.log(JSON.stringify({ base, checked: pages.length * widths.length, failures }));
if (failures.length) process.exit(1);
