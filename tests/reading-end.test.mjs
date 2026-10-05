import assert from 'node:assert/strict';
import { readFileSync, readdirSync, existsSync } from 'node:fs';
import test from 'node:test';

const read = (p) => readFileSync(new URL('../' + p, import.meta.url), 'utf8');
const voiceDirs = readdirSync(new URL('../public/voices/', import.meta.url), { withFileTypes: true })
  .filter((d) => d.isDirectory() && existsSync(new URL(`../public/voices/${d.name}/index.html`, import.meta.url)))
  .map((d) => d.name);

test('posts and voices share one reading-end stylesheet and the same block class', () => {
  assert.match(read('app/layout.tsx'), /<link rel="stylesheet" href="\/reading-end\.css" \/>/);
  assert.match(read('components/views/PostView.tsx'), /className="cc-reading-end"/);
  const runtime = read('public/voices/reading-end.js');
  assert.match(runtime, /end\.className = 'cc-reading-end'/);
  for (const cls of ['cc-reading-end__mark', 'post-next', 'post-reader-actions', 'post-reader-action--share', 'cave-constellation-shell', 'cave-constellation__thumbnail', 'cave-constellation__navigate']) {
    assert.ok(runtime.includes(cls), `voice ending is missing ${cls}`);
  }
});

test('every voice reader mounts the shared ending after its content', () => {
  assert.ok(voiceDirs.length >= 7, `voices: ${voiceDirs.length}`);
  for (const slug of voiceDirs) {
    const html = read(`public/voices/${slug}/index.html`);
    assert.match(html, /<link rel="stylesheet" href="\/reading-end\.css">/, `${slug}: stylesheet`);
    assert.equal((html.match(/<!-- READING-END:START -->/g) || []).length, 1, `${slug}: exactly one ending`);
    assert.match(html, new RegExp(`<div id="cc-reading-end" data-voice="${slug}"></div><script src="/voices/reading-end.js" defer></script>`), `${slug}: mount`);
    assert.ok(html.indexOf('READING-END:START') > html.indexOf('id="transcript"'), `${slug}: ending comes after the transcript`);
    assert.ok(html.indexOf('READING-END:END') < html.indexOf('</main>'), `${slug}: ending stays inside the reader`);
  }
});

test('voice ending links leave the iframe and cover every published voice', () => {
  const runtime = read('public/voices/reading-end.js');
  assert.ok(!/href="\/voices\/[^"]*"(?![^>]*target="_top")/.test(runtime.replace(/' \+ [^+]+ \+ '/g, 'X')), 'internal links open in the top window');
  for (const slug of voiceDirs) assert.ok(runtime.includes(`"slug":"${slug}"`), `${slug} missing from voice picks`);
  assert.match(runtime, /목소리로 돌아가기/);
  assert.match(runtime, /원본 영상 보기/);
  assert.match(runtime, /navigator\.share/);
});

test('text-only voice sources are not labelled as video', () => {
  const runtime = read('public/voices/reading-end.js');
  assert.match(runtime, /"slug":"shin-jeongkyu-astra"[^}]*"video":false/);
  assert.match(runtime, /"slug":"mark-zuckerberg-muse"[^}]*"video":true/);
  assert.match(runtime, /me\.video \? T\.video : T\.source/);
  assert.match(runtime, /video: '원본 영상 보기', videoShort: '원본 영상', source: '원본 보기'/);
  assert.match(runtime, /video: 'Watch original video', videoShort: 'Video', source: 'View original'/);
});

test('next-in-category card shows the next post thumbnail, falling back to the character art', () => {
  const page = readFileSync(new URL('../components/views/PostView.tsx', import.meta.url), 'utf8');
  const end = readFileSync(new URL('../public/reading-end.css', import.meta.url), 'utf8');
  assert.match(page, /className="post-next__thumb"[\s\S]*?archiveImageUrl\(nextPost\) \?\? EDITORIAL_CARD_FALLBACK_IMAGE/);
  assert.match(end, /\.post-next\{grid-template-columns:176px minmax\(0,1fr\) auto/);
  assert.match(end, /\.post-next__thumb\{[^}]*aspect-ratio:16\/10[^}]*border-radius:12px/);
  assert.match(end, /max-width:600px\)\{\.cc-reading-end \.post-next\{grid-template-columns:104px/);
});

test('reading end separates body, next panel and picks with generous section gaps', () => {
  const end = readFileSync(new URL('../public/reading-end.css', import.meta.url), 'utf8');
  const tail = end.slice(end.lastIndexOf('/* Section rhythm'));
  const px = (name, block) => Number(new RegExp(`${name}:(\\d+)px`).exec(block)?.[1]);
  const desk = tail.slice(0, tail.indexOf('@media'));
  const mob = tail.slice(tail.indexOf('@media'));
  for (const [scope, block, min] of [['desktop', desk, { body: 112, next: 64, picks: 104, in: 64 }], ['mobile', mob, { body: 80, next: 48, picks: 80, in: 48 }]]) {
    assert.ok(px('--re-gap-body', block) >= min.body, `${scope} body gap`);
    assert.ok(px('--re-gap-next', block) >= min.next, `${scope} next gap`);
    assert.ok(px('--re-gap-picks', block) >= min.picks, `${scope} picks gap`);
    assert.ok(px('--re-gap-picks-in', block) >= min.in, `${scope} picks inner gap`);
  }
  assert.match(tail, /\.cc-reading-end \.post-next\{margin-top:var\(--re-gap-next\)\}/);
  assert.match(tail, /\.cave-constellation-shell\{margin-top:var\(--re-gap-picks\);padding-top:var\(--re-gap-picks-in\)\}/);
});
