// 2026-10-10: verify-dates timed out on localhost because one /_next/image request never settled
// under waitUntil:'networkidle'. Text/geometry checks only need the DOM, so they wait for 'load'.
import assert from 'node:assert/strict';
import fs from 'node:fs';
import test from 'node:test';

for (const f of ['scripts/verify-dates.mjs', 'scripts/verify-thread-tail.mjs']) {
  test(`${f} does not depend on networkidle`, () => {
    const src = fs.readFileSync(new URL('../' + f, import.meta.url), 'utf8');
    assert.doesNotMatch(src, /networkidle/);
    assert.match(src, /waitUntil: 'load'/);
  });
}
