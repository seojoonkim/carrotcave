import test from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';

const read = (p) => readFileSync(new URL('../' + p, import.meta.url), 'utf8');
const titles = JSON.parse(read('data/post-titles-en.json'));
const postsSrc = read('data/posts.ts');
const slugs = [...postsSrc.matchAll(/^    slug: '([^']+)',$/gm)].map((m) => m[1]);

test('every post has its own English share-card title', () => {
  assert.ok(slugs.length >= 100, 'posts parsed');
  const missing = slugs.filter((s) => !titles[s]);
  assert.deepEqual(missing, [], 'posts without English title');
  for (const [slug, t] of Object.entries(titles)) {
    assert.ok(!/[\u3131-\uD79D]/.test(t), `${slug} title has Hangul`);
    assert.ok(t.length <= 80, `${slug} title too long for the card`);
  }
  const values = Object.values(titles);
  assert.ok(new Set(values).size >= values.length - 2, 'titles are per-post, not one shared tagline');
});

test('post share card uses the per-post English title', () => {
  const route = read('app/posts/[slug]/opengraph-image.tsx');
  assert.match(route, /post-titles-en/);
  assert.ok(!/title: TAGLINE_EN, image/.test(route), 'post card must not fall back to the shared tagline');
});

test('titles fit the card at full size instead of shrinking', () => {
  const rules = read('lib/og-rules.ts');
  assert.ok(!/n > 60/.test(rules), 'no tiny-title size tier');
  assert.match(rules, /titleClamp = \(_size: number\) => 3/);
  assert.match(read('lib/og-card.tsx'), /lineClamp: titleClamp\(size\)/);
  const fit = read('scripts/og-title-fit.mts');
  assert.match(fit, /from '\.\.\/lib\/og-rules\.ts'/, 'fit check must reuse the card rules');
  assert.match(fit, /process\.exit\(1\)/, 'fit check must fail on overflow');
  assert.match(read('package.json'), /npm run audit:og-titles/, 'fit check runs in verify');
});

test('pictures with Korean text never reach a share card', () => {
  const rules = read('lib/og-rules.ts');
  const card = read('lib/og-card.tsx');
  const list = JSON.parse(read('data/og-image-hangul.json'));
  assert.ok(list.includes('/media/msg-163-0.jpg'), 'known Korean-text picture stays excluded');
  assert.match(rules, /HANGUL_IMAGES\.has\(clean\)\) return false/);
  assert.match(card, /if \(!usableOgImage\(publicPath, ROOT\)\) return undefined/);
  assert.match(read('package.json'), /npm run audit:og-image-text/, 'OCR audit runs in verify');
});
