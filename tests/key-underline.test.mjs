import test from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';

// 2026-10-08 Simon: "밑줄의 높이를 조금만 더 얇게" — key-sentence underline is the bottom 30% band, not 42%.
test('key-sentence underline stays a thin bottom band (<=32% of the glyph box)', () => {
  const css = readFileSync('public/reading-end.css', 'utf8');
  const m = css.match(/mark\.post-key\{[^}]*linear-gradient\(transparent (\d+)%/);
  assert.ok(m, 'post-key underline gradient missing');
  assert.ok(Number(m[1]) >= 68, `underline starts at ${m[1]}% — too thick`);
});
