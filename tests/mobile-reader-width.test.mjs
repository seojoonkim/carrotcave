import test from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
const css = readFileSync(new URL('../app/globals.css', import.meta.url), 'utf8');
test('mobile reader keeps a single 20px gutter instead of stacking margin and padding', () => {
  assert.match(css, /--reader-mobile-gutter:20px/);
  const rules = [...css.matchAll(/\.post-reader-article\{([^}]*)\}/g)].map(m => m[1]);
  for (const body of rules) {
    const pad = body.match(/padding:([^;}]+)/);
    if (!pad) continue;
    const parts = pad[1].trim().split(/\s+/);
    const horizontal = parts.length >= 2 ? parts[1] : parts[0];
    if (parts.length >= 2) assert.equal(horizontal, '0', `reader article adds horizontal padding: ${body}`);
  }
});
