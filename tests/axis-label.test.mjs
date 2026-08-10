import test from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';

const axisSource = readFileSync(new URL('../components/AxisRail.tsx', import.meta.url), 'utf8');

function particleFor(axis) {
  const finalCode = axis.charCodeAt(axis.length - 1) - 0xac00;
  const jongseong = finalCode >= 0 && finalCode <= 11171 ? finalCode % 28 : 0;
  return jongseong === 0 || jongseong === 8 ? '로' : '으로';
}

test('category return labels use 로 after vowels and ㄹ, otherwise 으로', () => {
  assert.match(axisSource, /jongseong === 0 \|\| jongseong === 8 \? '로' : '으로'/);
  assert.match(axisSource, /return `\$\{post\.category\}\$\{particle\} 돌아가기`/);
  assert.equal(particleFor('탐험'), '으로');
  assert.equal(particleFor('빌딩'), '으로');
  assert.equal(particleFor('낙서'), '로');
  assert.equal(particleFor('소설'), '로');
});
