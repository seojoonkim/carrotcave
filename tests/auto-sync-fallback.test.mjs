import test from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import { assertPublishableAbstract, generateFallbackMetadata } from '../scripts/auto-sync.mjs';

const scrapedPosts = JSON.parse(readFileSync(new URL('../data/scraped-posts.json', import.meta.url), 'utf8'));
const sample = scrapedPosts.find((item) => item.id === 201);

test('fallback metadata generates a publishable summary for a new Telegram writing without OpenAI', () => {
  assert.ok(sample, 'expected scraped post #201 to exist');
  const metadata = generateFallbackMetadata(sample);

  assert.equal(metadata.category, '소설');
  assert.equal(metadata.slug, 'post-201');
  assert.equal(metadata.title, '문이 열리는 쪽');
  assert.equal(metadata.depth, 'deep');
  assert.equal(metadata.tags.length, 0);
  assertPublishableAbstract(metadata.summary, sample.content || sample.fullText, metadata.title, metadata.category);
  assert.match(metadata.summary, /소설이다\.$/);
});
