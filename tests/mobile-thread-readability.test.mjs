// 2026-10-10 Simon: "모바일에서 조금만 더 가독성 좋게 줄간격 등 조절하자"
import assert from 'node:assert/strict';
import fs from 'node:fs';
import test from 'node:test';
const css = fs.readFileSync(new URL('../app/globals.css', import.meta.url), 'utf8');
const i = css.indexOf('/* Mobile thread readability');
const block = i < 0 ? '' : css.slice(i);

test('phone thread block exists and is phone-only', () => {
  assert.match(block, /^\/\* Mobile thread readability[^\n]*\n(?:[^\n]*\n)*?@media\(max-width:640px\)\{/);
});

test('post titles get 2 lines at a comfortable size instead of a one-line cut', () => {
  assert.match(block, /\.ccx-thread \.ccx-tpost__t\{[^}]*font-size:15px[^}]*line-height:1\.5[^}]*white-space:normal[^}]*-webkit-line-clamp:2/);
});

test('breathing room: title-date gap, row padding, head-to-list gap', () => {
  assert.match(block, /row-gap:4px/);
  assert.match(block, /\.ccx-thread \.ccx-tpost\{padding:9px 0\}/);
  assert.match(block, /\.ccx-thread > \.ccx-thead\{gap:4px;margin-bottom:8px\}/);
});
