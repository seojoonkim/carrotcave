import test from 'node:test';
import assert from 'node:assert/strict';
await import('../public/voices/yang-zhilin/transcript-format.js');
const formatting = globalThis.TranscriptFormatting;

const excerpt = [
  { id: 64, start: 174, end: 178, text: '그래서 물산을 오르는 과정에 있는 것 같아요' },
  { id: 65, start: 178, end: 180, text: '그러면서 몇 가지를 해금했고' },
  { id: 66, start: 180, end: 184, text: '몇 가지 새로운 상황을 해금했어요' },
  { id: 67, start: 184, end: 187, text: '중간의 이 길이 어떤지는 대략 알게 된 거죠' },
  { id: 68, start: 187, end: 189, text: '하지만 동시에 위로 올라가는 과정에서' },
  { id: 69, start: 189, end: 192, text: '여전히 비슷한 풍경을 보게 될 수도 있어요' },
  { id: 70, start: 192, end: 195, text: '그러니까 다음의' },
  { id: 71, start: 195, end: 199, text: '위로 올라가는 과정에는 여전히 수많은 미지의' },
  { id: 72, start: 199, end: 202, text: '예컨대 해결해야 할 기술적 문제가 있을 겁니다' },
];

test('Korean transcript paragraphs close on sentences instead of arbitrary six-segment chunks', () => {
  const paragraphs = formatting.groupSegments(excerpt);
  assert.deepEqual(paragraphs.map(({ start, text }) => ({ start, text })), [
    { start: 174, text: '그래서 물산을 오르는 과정에 있는 것 같아요. 그러면서 몇 가지를 해금했고 몇 가지 새로운 상황을 해금했어요.' },
    { start: 184, text: '중간의 이 길이 어떤지는 대략 알게 된 거죠.' },
    { start: 187, text: '하지만 동시에 위로 올라가는 과정에서 여전히 비슷한 풍경을 보게 될 수도 있어요.' },
    { start: 192, text: '그러니까 다음의 위로 올라가는 과정에는 여전히 수많은 미지의 예컨대 해결해야 할 기술적 문제가 있을 겁니다.' },
  ]);
  assert.ok(paragraphs.every(paragraph => /[.!?…]$/.test(paragraph.text)));
  assert.equal(paragraphs.some(paragraph => paragraph.text.endsWith('해금했고.')), false);
  assert.equal(paragraphs.some(paragraph => paragraph.text.endsWith('수많은 미지의.')), false);
});

test('existing terminal punctuation is preserved without duplication', () => {
  const paragraphs = formatting.groupSegments([
    { id: 1, start: 0, end: 1, text: '더 명확해졌나요, 아니면 더 막막해졌나요?' },
    { id: 2, start: 1, end: 2, text: '네' },
  ]);
  assert.equal(paragraphs[0].text, '더 명확해졌나요, 아니면 더 막막해졌나요?');
  assert.equal(paragraphs[1].text, '네.');
});

test('silent source segments keep their timestamp anchors and stay separate', () => {
  const silence = { id: 2, start: 1, end: 2, text: '' };
  const paragraphs = formatting.groupSegments([
    { id: 1, start: 0, end: 1, text: '첫 문장입니다' },
    silence,
    { id: 3, start: 2, end: 3, text: '다음 문장입니다' },
  ]);
  assert.deepEqual(paragraphs.map(item => ({ start: item.start, text: item.text, silence: item.silence || false })), [
    { start: 0, text: '첫 문장입니다.', silence: false },
    { start: 1, text: '무음', silence: true },
    { start: 2, text: '다음 문장입니다.', silence: false },
  ]);
  assert.equal(paragraphs[1].segments[0], silence);
});

test('a malformed ASR run without sentence endings remains bounded', () => {
  const segments = Array.from({ length: 30 }, (_, index) => ({
    id: index,
    start: index,
    end: index + 1,
    text: `연결 중인 조각 ${index}`,
  }));
  const paragraphs = formatting.groupSegments(segments);
  assert.ok(paragraphs.length >= 2);
  assert.ok(paragraphs.every(item => item.segments.length <= 24));
  assert.ok(paragraphs.every(item => /\.$/.test(item.text)));
});
