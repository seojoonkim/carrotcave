((root) => {
  'use strict';

  const terminalPunctuation = /[.!?。！？…][”’)]?$/;
  const terminalEnding = /(?:가요|나요|네요|대요|데요|래요|까요|군요|어요|아요|예요|이에요|해요|돼요|죠|거죠|게요|겁니다|습니다|입니다|랍니다|합니다|됩니다|했습니다|이었다|였다|있다|없다|된다|한다|했다|됐다)$/;
  const paragraphTransition = /^(?:하지만|그러나|그런데|반면|동시에|그러니까|따라서|그래서|예컨대|예를 들어|한편|결국|다만)(?:\s|$)/;

  const isSentenceEnd = text => terminalPunctuation.test(text.trim()) || terminalEnding.test(text.trim());

  const punctuate = text => {
    const clean = text.trim();
    if (!clean || terminalPunctuation.test(clean)) return clean;
    return `${clean}.`;
  };

  const groupSegments = segments => {
    const sentences = [];
    let current = [];
    const maxSentenceSegments = 24;
    const maxSentenceCharacters = 360;

    const closeSentence = (hardBoundary = false) => {
      if (!current.length) return;
      sentences.push({
        start: current[0].start,
        segments: current,
        text: punctuate(current.map(segment => segment.text.trim()).filter(Boolean).join(' ')),
        hardBoundary,
      });
      current = [];
    };

    segments.forEach(segment => {
      if (!segment) return;
      if (!segment.text || !segment.text.trim()) {
        closeSentence();
        sentences.push({
          start: segment.start,
          segments: [segment],
          text: '무음',
          silence: true,
        });
        return;
      }
      current.push(segment);
      const characterCount = current.reduce((sum, item) => sum + item.text.trim().length, 0);
      const exceedsSafetyLimit = current.length >= maxSentenceSegments || characterCount >= maxSentenceCharacters;
      if (isSentenceEnd(segment.text) || exceedsSafetyLimit) closeSentence(exceedsSafetyLimit);
    });
    closeSentence();

    const paragraphs = [];
    let paragraph = null;
    sentences.forEach(sentence => {
      const startsTransition = paragraphTransition.test(sentence.text);
      if (!paragraph || sentence.silence || paragraph.silence || sentence.hardBoundary || paragraph.hardBoundary || startsTransition || /[?？][”’)]?$/.test(paragraph.text) || paragraph.sentenceCount >= 2) {
        if (paragraph) paragraphs.push(paragraph);
        paragraph = { ...sentence, sentenceCount: 1 };
        return;
      }
      paragraph.text = `${paragraph.text} ${sentence.text}`;
      paragraph.segments = paragraph.segments.concat(sentence.segments);
      paragraph.sentenceCount += 1;
    });
    if (paragraph) paragraphs.push(paragraph);

    return paragraphs.map(({ sentenceCount, hardBoundary, ...paragraphItem }) => paragraphItem);
  };

  root.TranscriptFormatting = { groupSegments, isSentenceEnd, punctuate };
})(globalThis);
