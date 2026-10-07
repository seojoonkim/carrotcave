import test from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';

// The og:image ?hash is the content hash of each route file, not of lib/og-card.tsx. A card layout change must
// also stamp the routes, or Facebook/Kakao keep showing the old cached picture under the unchanged URL.
const routes = ['app/opengraph-image.tsx', 'app/en/opengraph-image.tsx', 'app/posts/[slug]/opengraph-image.tsx', 'app/en/posts/[slug]/opengraph-image.tsx', 'app/voices/[slug]/opengraph-image.tsx', 'app/en/voices/[slug]/opengraph-image.tsx'];
test('every share-card route carries the current card layout version', () => {
  for (const r of routes) assert.match(readFileSync(new URL('../' + r, import.meta.url), 'utf8'), /Card layout version .*crop-safe centered v2/, r);
});
