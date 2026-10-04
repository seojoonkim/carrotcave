import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import test from 'node:test';
import { posts } from '../data/posts.ts';
import { standaloneLinkOf, unwrapTelegramLinkPreview, INLINE_URL_RE } from '../lib/link-preview.ts';

const previews = JSON.parse(readFileSync(new URL('../data/link-previews.json', import.meta.url), 'utf8'));
const card = readFileSync(new URL('../components/LinkCard.tsx', import.meta.url), 'utf8');
const css = readFileSync(new URL('../app/globals.css', import.meta.url), 'utf8');

test('short labels without a colon still make a standalone link card', () => {
  assert.deepEqual(standaloneLinkOf('한국어 https://optimists-of-the-east.vercel.app/ko'), { url: 'https://optimists-of-the-east.vercel.app/ko', label: '한국어', isTweet: false });
  assert.equal(standaloneLinkOf('English https://optimists-of-the-east.vercel.app/en')?.label, 'English');
  assert.equal(standaloneLinkOf('🔗 GitHub https://github.com/a/b')?.label, '🔗 GitHub');
  // a real sentence that ends with a URL stays inline
  assert.equal(standaloneLinkOf('자세한 내용은 아래 링크에서 확인할 수 있다. https://example.com'), null);
  assert.equal(standaloneLinkOf('이번 행사에 대한 내 생각을 길게 정리해 두었다 https://example.com'), null);
});

test('every link line that is only a label + URL renders as a card, never an underlined bare URL', () => {
  const misses = [];
  for (const post of posts) {
    for (const line of unwrapTelegramLinkPreview(post.content).split('\n')) {
      const urls = line.match(INLINE_URL_RE) || [];
      if (urls.length !== 1) continue;
      const t = line.trim();
      const prefix = t.slice(0, t.indexOf(urls[0])).trim().replace(/^[-*•]\s*/, '');
      const tail = t.slice(t.indexOf(urls[0]) + urls[0].length).trim();
      if (tail || prefix.length > 24 || /[*\[\]]/.test(prefix) || /[.!?。]$/.test(prefix)) continue;
      if (!standaloneLinkOf(line)) misses.push(`${post.slug}: ${t}`);
    }
  }
  assert.deepEqual(misses, []);
});

test('every standalone non-tweet link has collected preview metadata', () => {
  const missing = [];
  for (const post of posts) for (const line of unwrapTelegramLinkPreview(post.content).split('\n')) {
    const hit = standaloneLinkOf(line);
    if (hit && !hit.isTweet && !previews[hit.url]) missing.push(`${post.slug}: ${hit.url}`);
  }
  assert.deepEqual(missing, [], 'run node --experimental-strip-types scripts/update-link-previews.mjs');
});

test('link cards always render a thumbnail: OG image or a branded host tile', () => {
  assert.match(card, /className="post-link-card post-link-card--media"/);
  assert.match(card, /post-link-card__media--tile/);
  assert.match(css, /\.post-link-card__media--tile\{[^}]*background:#2c2e3a/);
  assert.match(card, /monogramOf\(site \?\? host\)/);
  assert.doesNotMatch(card, /image \? \(\s*<span className="post-link-card__media"[\s\S]{0,200}\) : null\}/);
});

test('post reading-end kicker uses the rabbit-hole theme word', () => {
  const page = readFileSync(new URL('../components/views/PostView.tsx', import.meta.url), 'utf8');
  assert.match(page, /className="cave-constellation-kicker">\{L\.picksKicker\}</);
  assert.equal((readFileSync(new URL('../lib/i18n.ts', import.meta.url), 'utf8').match(/picksKicker: 'DOWN THE RABBIT HOLE'/g) ?? []).length, 2, 'same kicker in both languages');
  assert.doesNotMatch(page, /CAVE CONSTELLATION/);
});
