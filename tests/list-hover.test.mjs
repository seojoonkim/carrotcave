import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import test from 'node:test';
const css = readFileSync(new URL('../app/globals.css', import.meta.url), 'utf8');
test('list rows get a soft, motion-safe hover wash only on fine pointers', () => {
  assert.match(css, /\.archive-row__link::before\{content:""[^}]*opacity:0/);
  assert.match(css, /@media\(hover:hover\) and \(pointer:fine\)\{\s*\.archive-lead:hover::before,\.archive-row__link:hover::before\{opacity:1/);
  assert.match(css, /prefers-reduced-motion:reduce\)\{\.archive-lead::before,\.archive-row__link::before\{transition:none/);
});
test('body ink is the slightly brighter cool gray', () => {
  assert.doesNotMatch(css, /#c9d1dc/i);
  assert.match(css, /\.post-content p\{margin:0 0 24px;color:#eceef5/);
});
