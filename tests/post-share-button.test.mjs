import test from 'node:test';
import assert from 'node:assert/strict';
import { readFile } from 'node:fs/promises';

const root = new URL('../', import.meta.url);
const read = (path) => readFile(new URL(path, root), 'utf8');

test('ordinary post actions place an accessible share control between return and Telegram', async () => {
  const [page, share, css] = await Promise.all([
    read('app/posts/[slug]/page.tsx'),
    read('components/PostShareButton.tsx'),
    read('app/globals.css'),
  ]);
  const returnAt = page.indexOf('axisDestinationLabel(post)');
  const shareAt = page.indexOf('<PostShareButton');
  const telegramAt = page.indexOf('텔레그램 채널에서 보기');
  assert.ok(returnAt > 0 && shareAt > returnAt && telegramAt > shareAt);
  assert.match(page, /<PostShareButton title=\{post\.title\} path=\{`\/posts\/\$\{post\.slug\}`\} \/>/);
  assert.match(share, /navigator\.share/);
  assert.match(share, /navigator\.clipboard\?\.writeText/);
  assert.match(share, /document\.execCommand\('copy'\)/);
  assert.match(share, /AbortError/);
  assert.match(share, /링크 복사됨/);
  assert.match(share, /aria-live="polite"/);
  assert.match(css, /\.post-reader-actions\{[^}]*grid-template-columns:repeat\(3,minmax\(0,1fr\)\)/);
  assert.match(css, /\.post-reader-action--share\{/);
});
