import { readFileSync } from 'node:fs';
import { join } from 'node:path';
import { posts } from '../../data/posts.ts';
import { interviews } from '../../data/interviews.ts';
import { normalizeQuery, normalizeSearchText } from './normalize.ts';

export { normalizeQuery } from './normalize.ts';

export type ArchiveSearchDocument = {
  kind: 'post' | 'voice';
  slug: string;
  searchText: string;
  titleText: string;
  summaryText: string;
  axisText: string;
  dateText: string;
};

function collectStrings(value: unknown, output: string[]) {
  if (typeof value === 'string') output.push(value);
  else if (Array.isArray(value)) value.forEach(item => collectStrings(item, output));
  else if (value && typeof value === 'object') Object.values(value).forEach(item => collectStrings(item, output));
}

const voiceSearchFiles: Record<string, string[]> = {
  'liang-wenfeng': ['long-reader-ko.json', 'key-sentences.json'],
  'liao-heng': ['transcript-ko.json', 'key-sentences.json'],
  'sam-altman-startup-school-2026': ['transcript-ko.json'],
  'yang-zhilin': ['transcript-ko.json'],
};

function voiceBody(slug: string) {
  const directory = join(process.cwd(), 'public', 'voices', slug);
  const values: string[] = [];
  for (const filename of voiceSearchFiles[slug] ?? ['transcript-ko.json', 'long-reader-ko.json', 'key-sentences.json']) {
    try {
      collectStrings(JSON.parse(readFileSync(join(directory, filename), 'utf8')), values);
    } catch (error) {
      const code = error && typeof error === 'object' && 'code' in error ? error.code : undefined;
      if (code !== 'ENOENT') console.warn(`Archive search skipped ${slug}/${filename}:`, error);
    }
  }
  return values.join(' ');
}

function makeDocument(kind: 'post' | 'voice', slug: string, title: string, summary: string, axis: string, date: string, body: string): ArchiveSearchDocument {
  const titleText = normalizeSearchText(title);
  const summaryText = normalizeSearchText(summary);
  const axisText = normalizeSearchText(axis);
  return {
    kind,
    slug,
    titleText,
    summaryText,
    axisText,
    dateText: date,
    searchText: normalizeSearchText(`${title} ${summary} ${axis} ${body}`),
  };
}

let cachedDocuments: ArchiveSearchDocument[] | undefined;

export function getArchiveSearchDocuments() {
  return cachedDocuments ??= [
    ...posts.map(post => makeDocument('post', post.slug, post.title, post.summary, post.category, post.date, `${post.content} ${post.tags.join(' ')}`)),
    ...interviews.map(interview => makeDocument(
      'voice',
      interview.slug,
      `${interview.name} · ${interview.title}`,
      interview.summary,
      '목소리',
      interview.sourcePublishedAt,
      `${interview.description} ${interview.eyebrow} ${voiceBody(interview.slug)}`,
    )),
  ];
}

export function matchesArchiveDocument(document: Pick<ArchiveSearchDocument, 'searchText'>, rawQuery: unknown) {
  const tokens = normalizeQuery(rawQuery).split(' ').filter(Boolean);
  return tokens.length > 0 && tokens.every(token => document.searchText.includes(token));
}

function rank(document: ArchiveSearchDocument, tokens: string[]) {
  return tokens.reduce((score, token) => score + (document.titleText.includes(token) ? 8 : 0) + (document.summaryText.includes(token) ? 4 : 0) + (document.axisText.includes(token) ? 2 : 0), 0);
}

export function searchArchive(rawQuery: unknown) {
  const query = normalizeQuery(rawQuery);
  if (!query) return [];
  const tokens = query.split(' ');
  return getArchiveSearchDocuments()
    .filter(document => tokens.every(token => document.searchText.includes(token)))
    .map(document => ({ document, score: rank(document, tokens) }))
    .sort((a, b) => b.score - a.score || b.document.dateText.localeCompare(a.document.dateText))
    .map(({ document }) => document);
}
