// Date format gate (2026-10-10, Simon: "날짜를 저렇게 하지 말고(영미권 표기로 좀 이상하니, 글로벌한 표기법으로 바꾸자)").
// Every visible <time> on reader pages must read as ISO 8601 (2026-10-08), both locales.
// Usage: node scripts/verify-dates.mjs [baseUrl]   (exit 1 on any failure)
import { chromium } from 'playwright-core';

const base = process.argv[2] || 'http://localhost:3000';
const PAGES = ['/', '/?section=%ED%83%90%ED%97%98', '/en', '/en?section=%ED%83%90%ED%97%98'];

const b = await chromium.launch({ channel: 'chrome', headless: true });
const pg = await b.newPage({ viewport: { width: 1280, height: 900 } });
let bad = 0;
const targets = [...PAGES];
for (let i = 0; i < targets.length; i += 1) {
  const p = targets[i];
  await pg.goto(base + p, { waitUntil: 'networkidle' });
  // open every disclosure so collapsed rows are checked too
  await pg.evaluate(() => document.querySelectorAll('details').forEach((d) => { d.open = true; }));
  const res = await pg.evaluate(() => {
    const out = { times: 0, wrong: [], post: null };
    for (const t of document.querySelectorAll('time')) {
      const txt = (t.querySelector('[aria-hidden="true"]')?.textContent ?? t.textContent).trim();
      if (!txt) continue;
      out.times += 1;
      if (!/^\d{4}-\d{2}-\d{2}$/.test(txt)) out.wrong.push(txt);
    }
    const a = document.querySelector('a[href*="/posts/"]');
    out.post = a ? new URL(a.href).pathname : null;
    return out;
  });
  const wrong = [...new Set(res.wrong)];
  if (!res.times) { bad += 1; console.log(`FAIL ${p} no dates found`); }
  else if (wrong.length) { bad += 1; console.log(`FAIL ${p} ${wrong.length} non-ISO: ${wrong.slice(0, 4).join(' | ')}`); }
  else console.log(`ok   ${p} ${res.times} dates`);
  // also check one post page per locale (detail header date)
  if (res.post && i < PAGES.length && (p === '/' || p === '/en') && !targets.includes(res.post)) targets.push(res.post);
}
console.log('BAD', bad);
await b.close();
process.exit(bad ? 1 : 0);
