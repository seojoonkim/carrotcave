import assert from 'node:assert/strict';
import { readFileSync, existsSync } from 'node:fs';
import test from 'node:test';
import { standaloneLinkOf, youTubeIdOf, prettyUrl, findPreviewBlocks, unwrapTelegramLinkPreview } from '../lib/link-preview.ts';

const previews = JSON.parse(readFileSync(new URL('../data/link-previews.json', import.meta.url), 'utf8'));
const page = readFileSync(new URL('../app/posts/[slug]/page.tsx', import.meta.url), 'utf8');
const css = readFileSync(new URL('../app/globals.css', import.meta.url), 'utf8');

test('standalone link parsing covers bare URLs, labels, bullets and markdown links', () => {
  assert.equal(standaloneLinkOf('https://youtu.be/sN1JnyCQvfw?si=gxnrauzmhk-pnqFx')?.url, 'https://youtu.be/sN1JnyCQvfw?si=gxnrauzmhk-pnqFx');
  assert.deepEqual(standaloneLinkOf('- 공고: https://across.career.greetinghr.com/ko/o/208861'), { url: 'https://across.career.greetinghr.com/ko/o/208861', label: '공고', isTweet: false });
  assert.equal(standaloneLinkOf('🔗 GitHub: https://github.com/seojoonkim/prompt-guard')?.label, '🔗 GitHub');
  assert.equal(standaloneLinkOf('[원문](https://avc.com/x)')?.label, '원문');
  assert.equal(standaloneLinkOf('https://x.com/a/status/1')?.isTweet, true);
  assert.equal(standaloneLinkOf('이 글은 https://avc.com 에서 봤다'), null, 'links inside sentences stay inline');
});

test('YouTube ids are parsed from every common URL shape', () => {
  for (const u of ['https://youtu.be/sN1JnyCQvfw?si=x', 'https://www.youtube.com/watch?v=Wx0C42-S5z4', 'https://youtube.com/shorts/Wx0C42-S5z4', 'https://www.youtube.com/watch?t=3&v=Wx0C42-S5z4']) {
    assert.match(youTubeIdOf(u) ?? '', /^[\w-]{11}$/, u);
  }
});

test('every standalone YouTube link in posts has a stored local thumbnail and title', async () => {
  const { posts } = await import('../data/posts.ts');
  const missing = [];
  for (const post of posts) for (const line of post.content.split('\n')) {
    const hit = standaloneLinkOf(line);
    if (!hit || hit.isTweet) continue;
    const p = previews[hit.url];
    if (!p) { missing.push(`${post.slug}: no preview for ${hit.url}`); continue; }
    if (youTubeIdOf(hit.url)) {
      if (!p.title) missing.push(`${post.slug}: youtube without title`);
      if (!p.thumbnail || !existsSync(new URL(`../public${p.thumbnail}`, import.meta.url))) missing.push(`${post.slug}: youtube thumbnail file missing ${p.thumbnail}`);
    }
  }
  assert.deepEqual(missing, [], 'run: npx tsx scripts/update-link-previews.mjs');
});

test('post body routes standalone links to YouTube/link cards and prettifies inline URLs', () => {
  assert.match(page, /standaloneLinkOf\(line\)/);
  assert.match(page, /<YouTubeEmbed /);
  assert.match(page, /<LinkCard /);
  assert.match(page, /linkifyBareUrls/);
  assert.equal(prettyUrl('https://www.github.com/seojoonkim/prompt-guard/'), 'github.com/seojoonkim/prompt-guard');
});

test('link cards meet touch size and use the carrot accent on neutral surfaces', () => {
  assert.match(css, /\.post-link-card\{[^}]*min-height:44px/);
  assert.match(css, /\.post-youtube__caption a\{[^}]*min-height:44px/);
  assert.match(css, /\.post-link-card:hover\{[^}]*border-color:rgba\(243,154,82/);
  assert.match(css, /\.post-link-card\{[^}]*background:#232323/);
  assert.match(css, /\.post-link-card\{[^}]*cursor:pointer/);
});

test('Telegram preview leftovers are detected without touching list continuations', () => {
  const lines = ['https://avc.com/x', '', '  AVC', '', '  What Bear Markets Look Like', '  It is hard…', '', '- 근무 기간: 6개월  ', '  희망하면 연장', '- 모집 기한:', '  - 1차: 5/25'];
  const blocks = findPreviewBlocks(lines);
  assert.equal(blocks.length, 1);
  assert.deepEqual([blocks[0].start, blocks[0].end, blocks[0].site, blocks[0].title], [2, 5, 'AVC', 'What Bear Markets Look Like']);
});

test('broken Telegram markdown link wrapping a preview is unwrapped to a bare link', () => {
  const u = 'https://medium.com/hashed-kr/monetization-of-energy-4a79d7d71381?postPublishedType=repub';
  const out = unwrapTelegramLinkPreview(`[${u}](${u})[\n\n  Medium\n\n  제목\n](${u})`);
  assert.equal(out.split('\n')[0], u);
  assert.ok(!out.includes(`](${u})`));
});

test('post pages hide duplicated preview text next to cards', () => {
  assert.match(page, /unwrapTelegramLinkPreview\(content\)/);
  assert.match(page, /findPreviewBlocks\(lines\)/);
  assert.match(page, /post-link-card--static/);
});

test('link cards are one clickable anchor that includes the OG image and an explicit open cue', () => {
  const card = readFileSync(new URL('../components/LinkCard.tsx', import.meta.url), 'utf8');
  const anchorOpen = card.indexOf('<a className=');
  const anchorClose = card.lastIndexOf('</a>');
  assert.ok(anchorOpen > -1 && anchorClose > anchorOpen);
  const inside = card.slice(anchorOpen, anchorClose);
  assert.match(inside, /post-link-card__media/, 'OG image must sit inside the link');
  assert.match(inside, /post-link-card__cta/, 'visible "열기" affordance');
  assert.match(card, /target="_blank" rel="noopener noreferrer"/);
});

test('most standalone links carry a locally stored OG image', () => {
  const entries = Object.values(previews).filter((p) => p.kind === 'link');
  const withImage = entries.filter((p) => p.image && existsSync(new URL(`../public${p.image}`, import.meta.url)));
  assert.ok(withImage.length / entries.length >= 0.8, `${withImage.length}/${entries.length} link cards have images`);
  for (const p of entries) if (p.image) assert.ok(existsSync(new URL(`../public${p.image}`, import.meta.url)), `missing file ${p.image}`);
  for (const p of Object.values(previews)) assert.ok(p.title, 'every preview has a title (override if the site blocks fetching)');
});
