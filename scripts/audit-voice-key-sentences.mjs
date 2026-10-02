// Counts rendered key-sentence highlights on every published voice page (live or local base).
import { chromium } from 'playwright-core';
import { readFile } from 'node:fs/promises';

const BASE = process.env.BASE || 'https://carrotcave.com';
const exe = process.env.CHROMIUM_BIN;
const src = await readFile(new URL('../data/interviews.ts', import.meta.url), 'utf8');
const slugs = [...src.matchAll(/slug: '([^']+)'[\s\S]*?status: '(published|draft)'/g)].filter((m) => m[2] === 'published').map((m) => m[1]);
const browser = await chromium.launch(exe ? { executablePath: exe } : {});
const out = {};
for (const slug of slugs) {
  const page = await browser.newPage({ viewport: { width: 1280, height: 900 } });
  await page.goto(`${BASE}/voices/${slug}/index.html`, { waitUntil: 'networkidle' });
  await page.waitForTimeout(800);
  out[slug] = await page.evaluate(() => {
    const marks = [...document.querySelectorAll('mark.key-sentence, .key-sentence')];
    const visible = marks.filter((m) => {
      const s = getComputedStyle(m);
      return m.textContent.trim() && s.display !== 'none' && s.visibility !== 'hidden';
    });
    const styled = visible.filter((m) => {
      const s = getComputedStyle(m);
      const bg = s.backgroundColor !== 'rgba(0, 0, 0, 0)' && s.backgroundColor !== 'transparent';
      const line = s.textDecorationLine !== 'none' || s.borderBottomStyle !== 'none' || s.boxShadow !== 'none' || s.backgroundImage !== 'none';
      const weight = Number(s.fontWeight) >= 600;
      return bg || line || weight;
    });
    return { marks: marks.length, visible: visible.length, styled: styled.length, sample: visible[0]?.textContent.trim().slice(0, 40) || null };
  });
  await page.close();
}
await browser.close();
console.log(JSON.stringify(out, null, 1));
