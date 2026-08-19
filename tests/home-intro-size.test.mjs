import test from 'node:test';
import assert from 'node:assert/strict';
import { readFile } from 'node:fs/promises';

const root = new URL('../', import.meta.url);
const read = (path) => readFile(new URL(path, root), 'utf8');

test('default home archive introduction matches category archive title sizing', async () => {
  const [home, voices, css] = await Promise.all([
    read('app/page.tsx'),
    read('app/voices/page.tsx'),
    read('app/globals.css'),
  ]);
  assert.match(home, /<h1 id="wall-heading" className="wall-heading__menu-title">[\s\S]*모든 기록은 서로 다른 입구입니다\./);
  assert.doesNotMatch(css, /wall-heading__home-title|font-size:70%/);
  assert.match(css, /\.wall-heading :is\(h1,h2\)\{[^}]*font:500 clamp\(16\.1px,2\.1vw,26\.6px\) var\(--sans\)/);
  assert.doesNotMatch(voices, /wall-heading__home-title/);
});
