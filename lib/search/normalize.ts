const MAX_QUERY_LENGTH = 120;
const MAX_QUERY_TOKENS = 8;

export function normalizeSearchText(raw: unknown) {
  return typeof raw === 'string'
    ? raw.normalize('NFC').trim().replace(/\s+/g, ' ').toLocaleLowerCase('ko-KR')
    : '';
}

export function normalizeQuery(raw: unknown) {
  if (typeof raw !== 'string') return '';
  return normalizeSearchText(raw.slice(0, 512).slice(0, MAX_QUERY_LENGTH))
    .split(' ')
    .filter(Boolean)
    .slice(0, MAX_QUERY_TOKENS)
    .join(' ');
}
