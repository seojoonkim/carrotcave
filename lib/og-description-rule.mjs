// OG/meta description house rule: the description must open with the content,
// not by restating the title. A link preview already shows the title on the line
// above, so a description that starts with the same words wastes the first glance.
//
// A description fails when its first word is a word or name that also appears
// in the title. Generic openers (AI, In, How, The …) are allowed. — e.g. title
// "김종윤·최혁재·김서준 · AI는 콘텐츠의 주인을 바꾼다" with description
// "김종윤, 최혁재, 김서준은 AI가 …".

const KO_PARTICLE = /(?:은|는|이|가|을|를|의|와|과|도|로|으로|에서|에게|에|께서|이란|란|이라는|라는|처럼|만|까지|부터|조차|마저|이다|다)$/u;
const STOP = new Set([
  'the', 'a', 'an', 'of', 'and', 'in', 'on', 'for', 'to', 'with', 'by', 'at', 'from', 'as', 'is', 'are', 'how', 'why', 'what', 'when', 'who',
  'ai', '이', '그', '저', '더', '왜', '어떻게', '무엇', '누가', '나', '내', '우리', '것', '수', '한', '두', '첫', '새',
]);

const words = (text) => String(text ?? '')
  .normalize('NFC')
  .replace(/[“”"'‘’「」『』《》〈〉()[\]{}]/g, ' ')
  .split(/[\s·,:;—–\-/|!?.。，、…&]+/u)
  .map((w) => w.trim())
  .filter(Boolean);

export const stem = (word) => {
  let w = word.toLowerCase().replace(/[’']s$/u, '');
  if (/[가-힣]/u.test(w) && w.length > 1) {
    const s = w.replace(KO_PARTICLE, '');
    if (s.length >= 1) w = s;
  }
  return w;
};

const meaningful = (w) => {
  const s = stem(w);
  if (!s || STOP.has(s)) return false;
  if (/^\d+$/.test(s)) return s.length >= 3; // years like 2040 count, "2" does not
  return /[가-힣]/u.test(s) ? s.length >= 2 : s.length >= 3;
};

/** Returns the repeated opening word, or null when the description opens fresh. */
export function repeatedTitleOpening(title, description) {
  const titleStems = new Set(words(title).filter(meaningful).map(stem));
  if (!titleStems.size) return null;
  const first = words(description)[0];
  return first && meaningful(first) && titleStems.has(stem(first)) ? first : null;
}

export function assertDescriptionOpensFresh(title, description, label = '') {
  const hit = repeatedTitleOpening(title, description);
  if (hit) throw new Error(`OG description repeats title word "${hit}" at the start${label ? ` (${label})` : ''}`);
  return description;
}
