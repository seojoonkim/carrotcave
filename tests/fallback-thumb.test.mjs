import test from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import { inflateSync } from 'node:zlib';

const css = readFileSync(new URL('../app/globals.css', import.meta.url), 'utf8');

test('fallback thumbnail is the logo-toned v5 art on the exact site background', () => {
  for (const f of ['components/ArchiveList.tsx', 'components/EditorialCard.tsx']) {
    assert.match(readFileSync(new URL('../' + f, import.meta.url), 'utf8'), /editorial-card-fallback-v5\.png/);
  }
  assert.match(css, /--graphite:#0b0e14/);
  assert.match(css, /\.archive-thumb--sketch\{background:#0b0e14\}/);
  assert.match(css, /\.archive-thumb--sketch::after\{box-shadow:none\}/, 'no outline: art melts into the page');
  assert.match(css, /\.archive-thumb--sketch img\{filter:none\}/, 'no dimming filter on the fallback art');
  const buf = readFileSync(new URL('../public/editorial-card-fallback-v5.png', import.meta.url));
  assert.equal(buf.subarray(1, 4).toString(), 'PNG');
  assert.equal(buf.readUInt32BE(16), 1200);
  assert.equal(buf.readUInt32BE(20), 800);
  assert.ok(buf.length < 120_000, 'logo-based fallback stays light');
});
