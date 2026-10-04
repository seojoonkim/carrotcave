import test from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
const css = readFileSync(new URL('../app/globals.css', import.meta.url), 'utf8');
test('selected header menu is emphasized in carrot orange (last word in the cascade)', () => {
  const tail = css.slice(css.lastIndexOf('/* Active menu orange 2026.10 */'));
  assert.match(tail, /a\.active b\{color:var\(--carrot-orange\)!important/);
  assert.match(tail, /a\.active::after[^{]*\{height:3px!important/);
  const after = css.slice(css.lastIndexOf('/* Active menu orange 2026.10 */') + 10);
  assert.doesNotMatch(after.replace(tail.slice(10), ''), /a\.active b\{color:var\(--ink-1\)/);
});
