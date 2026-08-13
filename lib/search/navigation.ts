import { normalizeQuery } from './normalize.ts';

export function archiveSearchHref(rawValue: string) {
  const params = new URLSearchParams();
  const displayValue = rawValue.normalize('NFC').trim().replace(/\s+/g, ' ');
  if (displayValue) params.set('q', displayValue);
  const queryString = params.toString();
  return queryString ? `/?${queryString}` : '/';
}

export function shouldAdoptServerQuery(_serverQuery: string, pendingQuery: string | null) {
  return pendingQuery === null;
}

export function isPendingQuerySettled(serverQuery: string, pendingQuery: string | null) {
  return pendingQuery !== null && pendingQuery === serverQuery;
}

export function shouldNavigateSearch(value: string, serverQuery: string, composing: boolean) {
  return !composing && normalizeQuery(value) !== serverQuery;
}
