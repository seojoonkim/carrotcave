import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import test from 'node:test';
const read = (p) => readFileSync(new URL('../' + p, import.meta.url), 'utf8');

test('every page family gets a generated 1200x630 share card from one template', () => {
  const card = read('lib/og-card.tsx');
  assert.match(card, /OG_SIZE = \{ width: 1200, height: 630 \}/);
  assert.match(card, /Pretendard/);
  for (const f of ['app/opengraph-image.tsx', 'app/posts/[slug]/opengraph-image.tsx', 'app/voices/[slug]/opengraph-image.tsx']) {
    const src = read(f);
    assert.match(src, /ogCard\(/, f);
    assert.match(src, /export const size = OG_SIZE/, f);
  }
  assert.match(read('app/posts/[slug]/opengraph-image.tsx'), /generateStaticParams/);
  assert.match(read('app/voices/[slug]/opengraph-image.tsx'), /generateStaticParams/);
});

test('pages do not override the generated card with raw thumbnails', () => {
  for (const f of ['app/layout.tsx', 'app/posts/[slug]/page.tsx', 'app/voices/[slug]/page.tsx']) {
    assert.doesNotMatch(read(f), /images: \[/, f);
  }
});

test('card keeps the cave palette: ink navy, carrot accent, sharp corners', () => {
  const card = read('lib/og-card.tsx');
  assert.match(card, /INK = '#0b0e14'/);
  assert.match(card, /CARROT = '#f39a52'/);
  const radii = [...card.matchAll(/borderRadius: (\d+)/g)].map((m) => Number(m[1]));
  assert.ok(radii.every((r) => r <= 4), `radii ${radii}`);
});

test('non-JPEG/PNG pictures are converted and a bad picture never breaks the build', () => {
  const card = read('lib/og-card.tsx');
  assert.match(card, /CONVERT = new Set\(\['\.webp', '\.gif', '\.avif'\]\)/);
  assert.match(card, /import\('sharp'\)/);
  assert.match(card, /catch \{\s*return undefined;/);
  assert.match(read('package.json'), /"sharp":/);
});

test('no-picture card draws the carrot as SVG and the file stays syntactically closed', () => {
  const card = read('lib/og-card.tsx');
  assert.match(card, /<svg width="76" height="120"/);
  assert.doesNotMatch(card, /clipPath/, 'the OG renderer ignores clip-path');
  assert.doesNotMatch(card, /\)\s*:\s*\(\s*[\s\S]*?\)\s*:\s*null\}/, 'no dangling second ternary branch');
});
