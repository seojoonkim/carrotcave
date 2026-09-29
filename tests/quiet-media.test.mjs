import test from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
const video = readFileSync(new URL('../components/AutoPlayVideo.tsx', import.meta.url), 'utf8');
test('lead video has no heavy orange frame', () => {
  assert.doesNotMatch(video, /rgba\(212,146,42,0\.15\)/);
  assert.match(video, /borderRadius: '4px'/);
});

const release = readFileSync(new URL('../scripts/release-production.mjs', import.meta.url), 'utf8');
const liveCheck = readFileSync(new URL('../scripts/verify-recovery-live.mjs', import.meta.url), 'utf8');
test('production release rebuilds CSS without stale cache and proves archive styles are live', () => {
  assert.match(release, /run\('vercel',\['--prod','--yes','--force'\]\)/);
  assert.match(liveCheck, /archive stylesheet missing in production/);
});
