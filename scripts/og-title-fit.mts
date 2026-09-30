// Estimates whether each post's English OG title fits within its line clamp.
// Imports the card's own size/clamp/width rules so the check cannot drift from what production renders.
import titles from '../data/post-titles-en.json' with { type: 'json' };
import { posts } from '../data/posts.ts';
import { archiveImageUrl } from '../lib/social-metadata.ts';
import { titleSize, titleClamp, titleWidth, usableOgImage } from '../lib/og-rules.ts';
import { chromium } from 'playwright-core';

const browser = await chromium.launch({ executablePath: '/Applications/Google Chrome.app/Contents/MacOS/Google Chrome' });
const page = await browser.newPage();
await page.setContent(`<link rel="stylesheet" href="https://cdn.jsdelivr.net/gh/orioncactus/pretendard/dist/web/static/pretendard.css"><div id=t style="font-family:Pretendard;font-weight:700;line-height:1.06;letter-spacing:-2px;word-break:normal"></div>`);
await page.waitForTimeout(1500);
const bad = [];
for (const p of posts) {
  const t = (titles as Record<string, string>)[p.slug];
  const hasImage = usableOgImage(archiveImageUrl(p));
  const size = titleSize(t, hasImage);
  const clamp = titleClamp(size);
  const width = titleWidth(hasImage);
  const lines = await page.evaluate(([t, s, w]) => { const e = document.getElementById('t')!; e.style.fontSize = s + 'px'; e.style.width = w + 'px'; e.textContent = t; return Math.round(e.getBoundingClientRect().height / (s * 1.06)); }, [t, size, width] as const);
  if (lines > clamp) bad.push({ slug: p.slug, t, size, lines, clamp, hasImage });
}
await browser.close();
console.log(JSON.stringify({ checked: posts.length, overflow: bad }, null, 1));
if (bad.length) process.exit(1);
