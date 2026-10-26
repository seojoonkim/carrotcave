// 2026-10-27 three-model design review, approved item 7 (part): voice hero deck has no one-sided accent rule.
import test from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';

const css = readFileSync(new URL('../public/voices/reader-system.css', import.meta.url), 'utf8');

test('item 7: voice hero deck drops the left accent rule in the shared reader system', () => {
  const rules = [...css.matchAll(/^\.hero-deck\s*\{([^}]*)\}/gm)].map((m) => m[1]);
  assert.ok(rules.length > 0, 'shared .hero-deck rule missing');
  const last = rules[rules.length - 1];
  assert.match(last, /border-left:\s*0\s*!important/);
  assert.match(last, /padding-left:\s*0\s*!important/);
  for (const r of rules) assert.doesNotMatch(r, /border-left:\s*\d+px\s+solid/);
});
