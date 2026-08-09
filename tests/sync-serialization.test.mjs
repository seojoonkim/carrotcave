import test from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';

const source = readFileSync(new URL('../scripts/auto-sync.mjs', import.meta.url), 'utf8');

test('generated post metadata uses JSON string serialization', () => {
  assert.match(source, /title: \$\{JSON\.stringify\(title\)\}/);
  assert.match(source, /summary: \$\{JSON\.stringify\(summary\)\}/);
  assert.doesNotMatch(source, /summary: '\$\{summary\.replace/);
});
