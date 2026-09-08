import test from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
const source = readFileSync(new URL('../components/TweetEmbed.tsx', import.meta.url), 'utf8');
test('video tweet media uses the checked-in msg 210 fallback and video element', () => {
  assert.match(source, /id === '2095975490708291948'.*\/media\/msg-210-v0\.mp4/);
  assert.match(source, /tweet\.media\[0\]\.type === 'video'/);
  assert.match(source, /<video/);
  assert.match(source, /poster=\{tweet\.media\[0\]\.thumbnail_url\}/);
});

test('tweet media proof harness checks decoded playback', () => {
  const probe = readFileSync(new URL('../scripts/verify-tweet-media.mjs', import.meta.url), 'utf8');
  assert.match(probe, /videoWidth/);
  assert.match(probe, /totalVideoFrames/);
});
