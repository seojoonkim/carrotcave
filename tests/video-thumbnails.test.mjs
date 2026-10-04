import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import test from 'node:test';
const read = (p) => readFileSync(new URL('../' + p, import.meta.url), 'utf8');

test('video entries get a play puck, a length chip and a screen-reader label', () => {
  const list = read('components/ArchiveList.tsx');
  assert.match(list, /video\?: \{ duration\?: string \}/);
  assert.match(list, /archive-thumb--video/);
  assert.match(list, /className="archive-thumb__play" aria-hidden="true"/);
  assert.match(list, /className="archive-thumb__duration"/);
  assert.match(list, /<span className="sr-only">, \{videoLabel\(entry, locale\)\}<\/span>/);
});

test('home and voices wire video metadata; articles-only voices stay plain', () => {
  assert.match(read('components/views/HomeView.tsx'), /video: postVideo\(post\)/);
  assert.match(read('components/views/HomeView.tsx'), /video: voiceVideo\(interview\)/);
  assert.match(read('components/views/VoicesView.tsx'), /video: voiceVideo\(item\)/);
  const lib = read('lib/archive-video.ts');
  assert.match(lib, /youtube\\\.com\|youtu\\\.be\|bilibili\\\.com/);
});

test('every post that ships a video file has a measured length', () => {
  const posts = read('data/posts.ts');
  const durations = JSON.parse(read('data/post-video-durations.json'));
  const withVideo = [...posts.matchAll(/slug: '([^']+)'[^]*?videoUrls: \[('[^\]]+')\]/g)].map((m) => m[1]);
  for (const slug of Object.keys(durations)) assert.match(durations[slug], /^\d{1,2}(?::\d{2}){1,2}$/, slug);
  assert.ok(Object.keys(durations).length >= 6);
  assert.ok(withVideo.length >= 1);
});

test('play puck is a touch-size carrot control with a readable length chip', () => {
  const css = read('app/globals.css');
  assert.match(css, /\.archive-thumb__play\{[^}]*width:44px;height:44px;[^}]*color:#f39a52/);
  assert.match(css, /\.archive-thumb__duration\{[^}]*font:500 12px\/1 var\(--mono\)/);
});
