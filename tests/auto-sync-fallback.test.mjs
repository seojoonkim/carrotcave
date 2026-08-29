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
  assert.equal(
    metadata.summary,
    '멸망한 문명을 재현하는 시뮬레이션의 주민들이 자신들을 지켜보는 바깥을 의심하기 시작한다.',
  );
});

test('fiction summaries stay inside the synopsis and reject outside-the-work descriptions', () => {
  const content = '미나는 관찰실의 화면을 하나씩 껐다.';
  const title = '문이 열리는 쪽';

  assert.doesNotThrow(() => assertPublishableAbstract(
    '멸망한 문명을 재현하는 시뮬레이션의 주민들이 자신들을 지켜보는 바깥을 의심하기 시작한다.',
    content,
    title,
    '소설',
  ));

  for (const summary of [
    '시뮬레이션 속 주민들이 바깥의 관찰자를 의심하며 존재와 경계의 문제를 묻는 소설이다.',
    '한 연구자가 자신이 만든 세계의 주민들과 마주하며 의식의 의미를 찾는 이야기다.',
    '원본과 복제 사이의 경계를 통해 인간의 정체성과 존재의 조건을 다룬 작품이다.',
  ]) {
    assert.throws(
      () => assertPublishableAbstract(summary, content, title, '소설'),
      /fiction meta description/,
    );
  }
});
