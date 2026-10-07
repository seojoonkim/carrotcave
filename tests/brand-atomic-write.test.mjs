import test from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';

// Release 8b81767 failed because tests/brand-v4 runs build_brand.py while content-contract
// reads public/voices/*/index.html in parallel. Path.write_text truncates first, so a reader
// could see an empty file. The generator must write atomically and skip identical content.
const src = readFileSync(new URL('../scripts/brand/build_brand.py', import.meta.url), 'utf8');

test('build_brand.py writes generated files atomically and only when content changes', () => {
  assert.match(src, /def write_if_changed\(path, text\):/);
  assert.match(src, /path\.read_text\(\) == text/);
  assert.match(src, /os\.replace\(tmp, path\)/);
  const main = src.slice(src.indexOf('def main():'));
  assert.doesNotMatch(main, /\.write_text\(/, 'main() must not truncate files in place');
});
