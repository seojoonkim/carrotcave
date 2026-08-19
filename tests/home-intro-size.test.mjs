import test from 'node:test';
import assert from 'node:assert/strict';
import { readFile } from 'node:fs/promises';

const root = new URL('../', import.meta.url);
const read = (path) => readFile(new URL(path, root), 'utf8');

test('only the default home archive introduction is thirty percent smaller', async () => {
  const [home, voices, css] = await Promise.all([
    read('app/page.tsx'),
    read('app/voices/page.tsx'),
    read('app/globals.css'),
  ]);
  assert.match(home, /<span className="wall-heading__home-title">모든 기록은 서로 다른 입구입니다\.<\/span>/);
  assert.match(css, /\.wall-heading__home-title\{display:block;font-size:calc\(\.7em - 1\.4px\)\}/);
  assert.doesNotMatch(voices, /wall-heading__home-title/);
  assert.doesNotMatch(home, /active \? <span className="wall-heading__home-title"/);
});
