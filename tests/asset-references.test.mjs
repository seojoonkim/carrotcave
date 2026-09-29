import assert from 'node:assert/strict';
import { existsSync, readFileSync, readdirSync } from 'node:fs';
import test from 'node:test';
const root = new URL('../', import.meta.url);
const read = (p) => readFileSync(new URL(p, root), 'utf8');

test('every root-relative img/src asset referenced by voice pages and components exists', () => {
  const sources = [
    ...readdirSync(new URL('public/voices/', root), { withFileTypes: true }).filter((d) => d.isDirectory()).map((d) => `public/voices/${d.name}/index.html`),
    ...readdirSync(new URL('components/', root)).filter((f) => f.endsWith('.tsx')).map((f) => `components/${f}`),
    'public/voices/reader-system.css', 'app/globals.css',
  ];
  const missing = [];
  for (const file of sources) {
    const text = read(file);
    for (const [, ref] of text.matchAll(/(?:src=|url\()["']?(\/[\w./-]+\.(?:svg|png|jpe?g|webp|gif|mp4|woff2?|ttf))/g)) {
      if (!existsSync(new URL(`public${ref}`, root))) missing.push(`${file} -> ${ref}`);
    }
  }
  assert.deepEqual(missing, []);
});
