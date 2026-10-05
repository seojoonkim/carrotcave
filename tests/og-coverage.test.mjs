// 2026-10-05: /en, /en/voices, /en/newsletter and the English 404 shipped with no og:image / twitter:image.
// Cause: app/en/layout.tsx declares its own `openGraph` (English locale + description) without `images`, and in Next's
// metadata merge a segment's `openGraph` object replaces the parent's — so the root app/opengraph-image.tsx no longer
// reached any /en page that did not ship its own card. Fix: app/en/opengraph-image.tsx.
// Rule enforced here: any layout that declares `openGraph` must sit next to an opengraph-image file (or declare images).
import { test } from 'node:test';
import assert from 'node:assert/strict';
import { readdirSync, readFileSync, statSync, existsSync } from 'node:fs';
import { join, relative } from 'node:path';

const APP = new URL('../app/', import.meta.url).pathname;

function layouts(dir) {
  const out = [];
  for (const name of readdirSync(dir)) {
    const p = join(dir, name);
    if (statSync(p).isDirectory()) out.push(...layouts(p));
    else if (/^layout\.(tsx|ts|jsx|js)$/.test(name)) out.push(p);
  }
  return out;
}

test('every layout that overrides openGraph also provides a share image', () => {
  const offenders = [];
  for (const file of layouts(APP)) {
    const src = readFileSync(file, 'utf8');
    if (!/\bopenGraph\s*:/.test(src)) continue;
    const dir = join(file, '..');
    const hasFile = ['tsx', 'ts', 'jsx', 'js', 'png', 'jpg'].some((ext) => existsSync(join(dir, `opengraph-image.${ext}`)));
    const hasImages = /openGraph\s*:\s*\{[^}]*\bimages\s*:/.test(src);
    if (!hasFile && !hasImages) offenders.push(relative(APP, file));
  }
  assert.deepEqual(offenders, [], `layouts with openGraph but no share image: ${offenders.join(', ')}`);
});

test('the post-deploy release gate checks share-image coverage on every page', () => {
  const rel = readFileSync(new URL('../scripts/release-production.mjs', import.meta.url), 'utf8');
  assert.match(rel, /verify-og-coverage\.mjs/);
});
