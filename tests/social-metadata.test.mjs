import test from 'node:test';
import assert from 'node:assert/strict';
import { readFile } from 'node:fs/promises';

const root = new URL('../', import.meta.url);
const read = path => readFile(new URL(path, root), 'utf8');

test('ordinary posts publish their own title, abstract, canonical URL, and card image', async () => {
  const [page, helper] = await Promise.all([read('app/posts/[slug]/page.tsx'), read('lib/social-metadata.ts')]);
  assert.match(page, /export async function generateMetadata/);
  assert.match(page, /post\.summary/);
  assert.match(await read('app/posts/[slug]/opengraph-image.tsx'), /archiveImageUrl\(post\)/);
  assert.match(page, /alternates: \{ canonical \}/);
  assert.match(page, /openGraph:/);
  assert.match(page, /twitter:/);
  assert.match(page, /const title = post\.title;/);
  assert.doesNotMatch(page, /`\$\{post\.title\} · \$\{siteName\}`/);
  assert.match(helper, /post\.mediaUrls\?\.\[0\]/);
  assert.match(helper, /post\.videoUrls\?\.\[0\]/);
  assert.match(helper, /\/media\/posters\/\$\{post\.slug\}\.jpg/);
});

test('voice pages publish interview-specific title, summary, canonical URL, and portrait', async () => {
  const page = await read('app/voices/[slug]/page.tsx');
  assert.match(page, /export async function generateMetadata/);
  assert.match(page, /interview\.summary/);
  assert.match(await read('app/voices/[slug]/opengraph-image.tsx'), /voice\.thumbnailUrl/);
  assert.match(page, /alternates: \{ canonical \}/);
  assert.match(page, /openGraph:/);
  assert.match(page, /twitter:/);
  assert.match(page, /const title = `\$\{interview\.name\} · \$\{interview\.title\}`;/);
  assert.doesNotMatch(page, /`\$\{interview\.name\} · \$\{interview\.title\} · \$\{siteName\}`/);
});

test('site fallback retains the 1200 by 630 root social card and description', async () => {
  const [layout, helper] = await Promise.all([read('app/layout.tsx'), read('lib/social-metadata.ts')]);
  assert.match(helper, /siteDescription = '토끼를 따라 더 깊이\. 기술, 사람, 시장과 미래에 관한 기록\.'/);
  assert.match(helper, /siteOgImage = '\/carrotcave-og-20260814\.png'/);
  assert.match(await read('app/opengraph-image.tsx'), /ogCard\(/);
  assert.match(layout, /url: '\/'/);
  assert.match(layout, /siteName,/);
  assert.match(layout, /locale: 'ko_KR'/);
  assert.match(layout, /card: 'summary_large_image'/);
});

test('static fallback share images are the soft-slate mascot card, not the old blue-silhouette art', async () => {
  const { createHash } = await import('node:crypto');
  const OLD_BLUE_SILHOUETTE = 'c7477ac23cbdbc5a53945157f2b6e148bd7c0c6551050a585dee284e2d57f220';
  for (const f of ['public/carrotcave-og-20260814.png', 'public/opengraph-image.png']) {
    const buf = await readFile(new URL(`../${f}`, import.meta.url));
    assert.equal(buf.readUInt32BE(16), 1200, f);
    assert.equal(buf.readUInt32BE(20), 630, f);
    assert.notEqual(createHash('sha256').update(buf).digest('hex'), OLD_BLUE_SILHOUETTE, `${f} is still the pre-redesign card`);
  }
});
