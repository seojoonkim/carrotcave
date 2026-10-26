import test from 'node:test';
import assert from 'node:assert/strict';
import { readFile } from 'node:fs/promises';

const page = await readFile(new URL('../components/views/PostView.tsx', import.meta.url), 'utf8');
const gallery = await readFile(new URL('../components/PostGallery.tsx', import.meta.url), 'utf8');
const caption = await readFile(new URL('../components/FigureCaption.tsx', import.meta.url), 'utf8');
const i18n = await readFile(new URL('../lib/i18n.ts', import.meta.url), 'utf8');
const css = await readFile(new URL('../app/globals.css', import.meta.url), 'utf8');

test('design idea 3: every post image has a numbered caption, then the original source link', () => {
  assert.match(page, /<FigureCaption index=\{1\} total=\{1\} locale=\{locale\} sourceMsgId=\{post\.telegramMsgId\} \/>/);
  assert.match(page, /<PostGallery urls=\{post\.mediaUrls\} locale=\{locale\} sourceMsgId=\{post\.telegramMsgId\} \/>/);
  assert.match(gallery, /<FigureCaption index=\{active \+ 1\} total=\{urls\.length\}/, 'gallery caption follows the active slide');
  assert.match(caption, /<figcaption className="post-figcaption">/);
  assert.ok(caption.indexOf('post-figcaption__label') < caption.indexOf('post-figcaption__source'), 'label comes before source');
  assert.match(caption, /https:\/\/t\.me\/carrotcave\/\$\{sourceMsgId\}/);
  assert.match(i18n, /figureLabel: \(n: number\) => `자료 \$\{String\(n\)\.padStart\(2, '0'\)\}`/);
  assert.match(i18n, /figureLabel: \(n: number\) => `Figure \$\{String\(n\)\.padStart\(2, '0'\)\}`/);
  assert.match(css, /\.post-figcaption__label\{color:var\(--leaf-pop\)/, 'caption label uses the leaf label colour, not orange');
  assert.doesNotMatch(css.match(/\.post-figcaption[^{]*\{[^}]*\}/g).join(''), /border-left|border-bottom/, 'no accent rule lines on captions');
});
