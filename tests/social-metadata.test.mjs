import test from 'node:test';
import assert from 'node:assert/strict';
import { readFile } from 'node:fs/promises';

const root = new URL('../', import.meta.url);
const read = path => readFile(new URL(path, root), 'utf8');

test('ordinary posts publish their own title, abstract, canonical URL, and card image', async () => {
  const [page, helper] = await Promise.all([read('app/posts/[slug]/page.tsx'), read('lib/social-metadata.ts')]);
  assert.match(page, /export async function generateMetadata/);
  assert.match(page, /post\.summary/);
  assert.match(page, /archiveImageUrl\(post\)/);
  assert.match(page, /alternates: \{ canonical \}/);
  assert.match(page, /openGraph:/);
  assert.match(page, /twitter:/);
  assert.match(helper, /post\.mediaUrls\?\.\[0\]/);
  assert.match(helper, /post\.videoUrls\?\.\[0\]/);
  assert.match(helper, /\/media\/posters\/\$\{post\.slug\}\.jpg/);
});

test('voice pages publish interview-specific title, summary, canonical URL, and portrait', async () => {
  const page = await read('app/voices/[slug]/page.tsx');
  assert.match(page, /export async function generateMetadata/);
  assert.match(page, /interview\.summary/);
  assert.match(page, /interview\.thumbnailUrl/);
  assert.match(page, /alternates: \{ canonical \}/);
  assert.match(page, /openGraph:/);
  assert.match(page, /twitter:/);
});

test('site fallback retains the 1200 by 630 root social card and description', async () => {
  const [layout, helper] = await Promise.all([read('app/layout.tsx'), read('lib/social-metadata.ts')]);
  assert.match(helper, /siteDescription = '토끼를 따라 더 깊이\. 기술, 사람, 시장과 미래에 관한 기록\.'/);
  assert.match(helper, /siteOgImage = '\/carrotcave-og-20260814\.png'/);
  assert.match(layout, /images: \[\{ url: siteOgImage, width: 1200, height: 630, type: 'image\/png'/);
  assert.match(layout, /url: '\/'/);
  assert.match(layout, /siteName,/);
  assert.match(layout, /locale: 'ko_KR'/);
  assert.match(layout, /card: 'summary_large_image'/);
});
