// Live hydration gate: load key pages in Chrome and fail on any React runtime error (e.g. #418 hydration mismatch).
// 2026-10-05: post pages shipped with #418 for weeks because no gate watched the browser console.
// Usage: node scripts/verify-no-react-errors.mjs [baseUrl]   (exit 1 on any page error)
import { chromium } from 'playwright-core';

const base = (process.argv[2] || process.env.APP_URL || 'https://carrotcave.com').replace(/\/$/, '');
const pages = ['/', '/en', '/posts/rabbit-hole-intro', '/en/posts/rabbit-hole-intro', '/posts/the-right-to-turn-on-a-brain', '/voices', '/voices/liao-heng', '/this-page-does-not-exist'];
const b = await chromium.launch({ channel: 'chrome' });
const failures = [];
try {
  for (const p of pages) {
    const pg = await b.newPage({ viewport: { width: 1280, height: 900 } });
    pg.on('pageerror', (e) => failures.push(`${p}: ${String(e.message).slice(0, 160)}`));
    await pg.goto(base + p, { waitUntil: 'load' });
    await pg.waitForTimeout(1200);
    await pg.close();
  }
} finally {
  await b.close();
}
console.log(JSON.stringify({ base, checked: pages.length, failures }));
if (failures.length) process.exitCode = 1;
