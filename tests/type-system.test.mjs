import test from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
const read = (p) => readFileSync(new URL('../' + p, import.meta.url), 'utf8');
test('mono stack falls back to Noto Sans KR for Hangul instead of system fonts', () => {
  assert.match(read('app/globals.css'), /--mono:var\(--font-mono\),var\(--font-sans\),monospace/);
  assert.match(read('public/voices/reader-system.css'), /--font-mono: "IBM Plex Mono", "Noto Sans KR", monospace;/);
});
test('site and voice readers share the field-notes mono', () => {
  assert.match(read('app/layout.tsx'), /IBM_Plex_Mono\(/);
  assert.doesNotMatch(read('app/layout.tsx'), /JetBrains/);
  assert.match(read('public/voices/reader-system.css'), /\/fonts\/ibm-plex-mono-500\.ttf/);
});
test('post title weight matches archive titles', () => {
  assert.match(read('app/globals.css'), /\.post-reader-header h1\{font-weight:600!important/);
});
