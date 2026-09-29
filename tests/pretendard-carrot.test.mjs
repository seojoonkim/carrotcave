import test from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync, readdirSync, existsSync } from 'node:fs';
const read = (p) => readFileSync(new URL('../' + p, import.meta.url), 'utf8');
test('Pretendard is self-hosted with every dynamic-subset file present', () => {
  const css = read('public/fonts/pretendard/pretendardvariable-dynamic-subset.css');
  const urls = [...css.matchAll(/url\(\.\/(woff2-dynamic-subset\/[^)]+\.woff2)\)/g)].map((m) => m[1]);
  assert.ok(urls.length >= 90, `subset faces: ${urls.length}`);
  for (const u of urls) assert.ok(existsSync(new URL('../public/fonts/pretendard/' + u, import.meta.url)), u);
  assert.doesNotMatch(read('app/layout.tsx') + read('app/globals.css'), /cdn\.jsdelivr|fonts\.googleapis\.com\/css2\?family=Pretendard/);
});
test('site and voice sans stacks lead with Pretendard and keep Noto as fallback', () => {
  assert.match(read('app/globals.css'), /--sans:"Pretendard Variable",Pretendard,var\(--font-sans\)/);
  assert.match(read('public/voices/reader-system.css'), /--font-sans: "Pretendard Variable", "Noto Sans KR"/);
});
test('carrot accents stay sparse, shared, and motion-safe', () => {
  const css = read('app/globals.css');
  assert.ok(existsSync(new URL('../public/carrot-mark.svg', import.meta.url)));
  for (const hook of ['.wall-heading #wall-heading::after', '.archive-lead .archive-meta::before', '.archive-more::before', '.post-content::after', '.archive-empty::before']) {
    assert.ok(css.includes(hook), `missing carrot accent ${hook}`);
  }
  assert.doesNotMatch(css, /\.archive-row\b[^{}]*::before\{content:""[^}]*carrot-mark/, 'no always-on carrot on every list row');
  assert.match(css, /@media\(prefers-reduced-motion:reduce\)\{\.wall-heading #wall-heading::after,\.archive-more::before/);
});
