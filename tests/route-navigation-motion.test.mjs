import test from 'node:test';
import assert from 'node:assert/strict';
import { readFile } from 'node:fs/promises';

const css = await readFile(new URL('../app/globals.css', import.meta.url), 'utf8');

test('route changes jump directly to the next page instead of smooth-scrolling to its top', () => {
  assert.match(css, /html\{[^}]*scroll-behavior:auto/);
  assert.doesNotMatch(css, /html\{[^}]*scroll-behavior:smooth/);
});
