import assert from 'node:assert/strict';
import { readFileSync, readdirSync } from 'node:fs';
import test from 'node:test';
const read = (p) => readFileSync(new URL('../' + p, import.meta.url), 'utf8');

test('every voice episode puts Pretendard first; no Noto-first stack remains', () => {
  for (const slug of readdirSync(new URL('../public/voices/', import.meta.url), { withFileTypes: true }).filter(d => d.isDirectory()).map(d => d.name)) {
    const css = read(`public/voices/${slug}/styles.css`);
    assert.doesNotMatch(css, /--font-sans:\s*"Noto Sans KR"/, `${slug} still Noto-first`);
    assert.match(css, /--font-sans:\s*"Pretendard Variable"/, `${slug} missing Pretendard`);
  }
});

test('voice transcripts break Korean between words and keep Hangul labels tightly tracked', () => {
  const css = read('public/voices/reader-system.css');
  assert.match(css, /#transcript \.paragraph-text[^{]*\{[^}]*word-break: keep-all;[^}]*line-break: strict;/);
  assert.ok(css.includes('.header-site-title, .hero .kicker, .hero > .kicker, .kicker,') && /letter-spacing: \.03em !important;/.test(css), 'Hangul labels must use tight tracking');
});

test('main site Hangul labels use tight tracking and strict Korean line breaking', () => {
  const css = read('app/globals.css');
  assert.match(css, /\.cc-reading-info small,\.cc-brand small\{letter-spacing:\.03em\}/);
  assert.match(css, /\.post-content p,\.post-content li\{line-break:strict;overflow-wrap:anywhere\}/);
  assert.ok(css.includes('.cave-constellation__thumbnail-category{letter-spacing:.03em!important}'));
});
