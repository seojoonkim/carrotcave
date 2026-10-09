// 2026-10-10 Simon: "메인 썸네일은 이미지와 글씨가 4:6 정도로 글씨가 조금 더 크게 보이게 하고, 중간 여백 간격도 약간 줄이자"
import assert from 'node:assert/strict';
import fs from 'node:fs';
import test from 'node:test';
const css = fs.readFileSync(new URL('../app/globals.css', import.meta.url), 'utf8');
const block = css.slice(css.indexOf('/* Lead card 4:6'));

test('lead card is image 4 : text 6 with a tighter middle gap on desktop', () => {
  assert.ok(block.length > 20, 'lead 4:6 block exists');
  const m = block.match(/\.archive-lead\{grid-template-columns:minmax\(0,4fr\) minmax\(0,6fr\);column-gap:(\d+)px\}/);
  assert.ok(m, '4fr/6fr grid');
  const gap = Number(m[1]);
  // tighter than the old 48px, never under the 40px desktop text-thumb minimum (verify-layout)
  assert.ok(gap < 48 && gap >= 40, `gap ${gap}`);
});

test('lead text reads larger than before (title > 32px, summary > 17px)', () => {
  const t = Number(block.match(/\.archive-lead h2\{font-size:(\d+)px/)?.[1]);
  const s = Number(block.match(/\.archive-lead__summary\{font-size:(\d+)px/)?.[1]);
  assert.ok(t > 32 && t <= 40, `title ${t}`);
  assert.ok(s > 17 && s <= 19, `summary ${s}`);
});

test('phone/tablet keep the stacked lead (4:6 is desktop only)', () => {
  assert.match(block, /^\/\* Lead card 4:6[^\n]*\n@media\(min-width:901px\)\{/);
});
