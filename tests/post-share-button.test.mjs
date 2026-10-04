import test from 'node:test';
import assert from 'node:assert/strict';
import { readFile } from 'node:fs/promises';

const root = new URL('../', import.meta.url);
const read = (path) => readFile(new URL(path, root), 'utf8');

test('ordinary post actions place an accessible share control between return and Telegram', async () => {
  const [page, share, css] = await Promise.all([
    read('components/views/PostView.tsx'),
    read('components/PostShareButton.tsx'),
    read('app/globals.css'),
  ]);
  const returnAt = page.indexOf('axisDestinationLabel(post)');
  const shareAt = page.indexOf('<PostShareButton');
  const telegramAt = page.indexOf('L.telegramLong');
  assert.ok(returnAt > 0 && shareAt > returnAt && telegramAt > shareAt);
  assert.match(page, /<PostShareButton title=\{post\.title\} path=\{postHref\(post\.slug\)\} locale=\{locale\} \/>/);
  assert.match(share, /navigator\.share/);
  assert.match(share, /navigator\.clipboard\?\.writeText/);
  assert.match(share, /document\.execCommand\('copy'\)/);
  assert.match(share, /AbortError/);
  assert.match(await read('lib/i18n.ts'), /shareCopied: '링크 복사됨'/);
  assert.match(share, /L\.shareCopied/);
  assert.match(share, /aria-live="polite"/);
  const endCss = await read('public/reading-end.css');
  assert.match(endCss, /\.cc-reading-end \.post-reader-actions\{display:grid;grid-template-columns:repeat\(3,minmax\(0,1fr\)\)/);
  assert.match(endCss, /\.cc-reading-end \.post-reader-action__short\{display:none\}/);
});
