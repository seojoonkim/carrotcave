((root) => {
  'use strict';

  const normalize = value => String(value ?? '').normalize('NFC').toLocaleLowerCase('ko-KR');

  const buildIndex = paragraphs => paragraphs.map(paragraph => ({
    id: Number(paragraph.id),
    text: String(paragraph.text ?? ''),
    normalizedText: normalize(paragraph.text),
  }));

  const findMatches = (index, query) => {
    const needle = normalize(query).trim();
    if (!needle) return [];
    const results = [];
    for (const entry of index) {
      const ranges = [];
      let cursor = 0;
      while (cursor <= entry.normalizedText.length - needle.length) {
        const start = entry.normalizedText.indexOf(needle, cursor);
        if (start < 0) break;
        ranges.push({ start, end: start + needle.length });
        cursor = start + needle.length;
      }
      if (ranges.length) results.push({ paragraphId: entry.id, ranges });
    }
    return results;
  };

  root.TranscriptSearch = Object.freeze({ normalize, buildIndex, findMatches });
})(globalThis);
