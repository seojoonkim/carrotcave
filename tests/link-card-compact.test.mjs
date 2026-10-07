import test from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';

// 2026-10-08 (Simon): "모바일뷰에서 링크가 너무 커서 글읽기에 방해돼. 훨씬 컴팩트하게 바꾸자"
// Phones get a one-row link card (small square thumb + title), never the full-width 1.91:1 hero.
const css = readFileSync(new URL('../app/globals.css', import.meta.url), 'utf8');
const compact = css.slice(css.lastIndexOf('Compact link cards on phones'));

test('phone link cards are a compact single row', () => {
  assert.match(compact, /@media \(max-width:600px\)/);
  assert.match(compact, /\.post-link-card--media\{flex-direction:row/);
  assert.match(compact, /flex:0 0 64px;width:64px;height:64px/);
  assert.match(compact, /\.post-link-card__desc,\.post-link-card__cta\{display:none\}/);
  assert.match(compact, /-webkit-line-clamp:2/);
});

test('footer copy grid cannot outgrow narrow phones', () => {
  assert.match(css, /\.cc-footer__copy\{grid-template-columns:minmax\(0,1fr\)\}/);
});

test('web link cards stay slim: tight body, one-line description, OG-ratio thumb', () => {
  const css = readFileSync('app/globals.css', 'utf8');
  const block = css.slice(css.indexOf('Slimmer link cards on web'));
  assert.match(block, /@media \(min-width:601px\)/);
  assert.match(block, /\.post-link-card__body\{gap:4px;padding:12px 18px\}/);
  assert.match(block, /\.post-link-card__desc\{-webkit-line-clamp:1/);
  assert.match(block, /\.post-link-card--media \.post-link-card__media\{[^}]*min-height:108px/);
});

