import test from 'node:test';
import assert from 'node:assert/strict';
import { readFile } from 'node:fs/promises';

const root = new URL('../', import.meta.url);
const read = path => readFile(new URL(path, root), 'utf8');

async function loadSearch() {
  return import('../lib/search/archive-search.ts');
}

async function loadNavigation() {
  return import('../lib/search/navigation.ts');
}

test('archive search normalizes Korean composition, case, and whitespace', async () => {
  const { normalizeQuery } = await loadSearch();
  assert.equal(normalizeQuery('  AGI   에이전트  '), 'agi 에이전트');
  assert.equal(normalizeQuery('한글'.normalize('NFD')), '한글');
  assert.equal(normalizeQuery('   '), '');
  assert.equal(normalizeQuery('가'.repeat(200)).length, 120);
  assert.equal(normalizeQuery('하나 둘 셋 넷 다섯 여섯 일곱 여덟 아홉 열'), '하나 둘 셋 넷 다섯 여섯 일곱 여덟');
});

test('archive search matches Korean substrings and requires every query term', async () => {
  const { matchesArchiveDocument } = await loadSearch();
  const document = { searchText: '에이전트를 위한 범용 agi 시스템' };
  assert.equal(matchesArchiveDocument(document, '에이전트 agi'), true);
  assert.equal(matchesArchiveDocument(document, '에이전트 반도체'), false);
});

test('archive search indexes every post and all four voice bodies', async () => {
  const { getArchiveSearchDocuments, searchArchive } = await loadSearch();
  assert.equal(getArchiveSearchDocuments().length, 115);
  assert.ok(searchArchive('가방은 경력이 된다').some(entry => entry.slug === 'post-193'));
  assert.ok(searchArchive('녹음만 비어 있었다').some(entry => entry.slug === 'post-192'));
  assert.ok(searchArchive('마이크 버튼을 누른다').some(entry => entry.slug === 'post-191'));
  assert.ok(searchArchive('어센드 개발사').some(entry => entry.slug === 'liao-heng'));
  assert.ok(searchArchive('지속학습').some(entry => entry.slug === 'liang-wenfeng'));
  assert.ok(searchArchive('스타트업을 17초 만에').some(entry => entry.slug === 'sam-altman-startup-school-2026'));
  assert.ok(searchArchive('산꼭대기로 향하는 과정').some(entry => entry.slug === 'yang-zhilin'));
  assert.deepEqual(searchArchive('검색결과가절대없는문장'), []);
});

test('search ranks relevance first and newest publication first on ties', async () => {
  const { searchArchive } = await loadSearch();
  const voiceOrder = searchArchive('전체 한국어').filter(entry => entry.kind === 'voice').map(entry => entry.slug);
  assert.deepEqual(voiceOrder, ['sam-altman-startup-school-2026', 'liang-wenfeng', 'liao-heng', 'yang-zhilin']);
});

test('search navigation preserves raw text, the active axis, and rejects stale server resets', async () => {
  const { archiveSearchHref, isPendingQuerySettled, shouldAdoptServerQuery, shouldNavigateSearch } = await loadNavigation();
  assert.equal(archiveSearchHref(' OpenAI  에이전트 '), '/?q=OpenAI+%EC%97%90%EC%9D%B4%EC%A0%84%ED%8A%B8');
  assert.equal(archiveSearchHref(' OpenAI  에이전트 ', '빌딩'), '/?section=%EB%B9%8C%EB%94%A9&q=OpenAI+%EC%97%90%EC%9D%B4%EC%A0%84%ED%8A%B8');
  assert.equal(archiveSearchHref('   '), '/');
  assert.equal(archiveSearchHref('   ', '탐험'), '/?section=%ED%83%90%ED%97%98');
  assert.equal(shouldNavigateSearch('OpenAI', 'openai', false), false);
  assert.equal(shouldNavigateSearch('안녕', '안', true), false);
  assert.equal(shouldNavigateSearch('안녕', '안', false), true);
  assert.equal(shouldAdoptServerQuery('안', '안'), false);
  assert.equal(shouldAdoptServerQuery('openai', null), true);
  assert.equal(isPendingQuerySettled('ab', 'abcd'), false);
  assert.equal(isPendingQuerySettled('abcd', 'abcd'), true);
});

test('archive search UI is visible and direct GET search URLs remain functional', async () => {
  const [home, component] = await Promise.all([read('app/page.tsx'), read('components/ArchiveSearch.tsx')]);
  assert.match(home, /searchParams: Promise<\{ section\?: string; q\?: string \}>/);
  assert.match(home, /const displayQuery = typeof q !== 'string' \? '' : q\.trim\(\)/);
  assert.match(home, /import ArchiveSearch/);
  assert.match(home, /<ArchiveSearch query=\{query\} displayQuery=\{displayQuery\} statusId="archive-search-status" section=\{active\} \/>/);
  assert.doesNotMatch(home, /journeyStep|cave-depth-divider|Number\.POSITIVE_INFINITY/);
  assert.match(home, /id="archive-search-status"[^>]*role="status"/);
  assert.match(home, /검색 결과/);
  assert.match(home, /검색 결과가 없습니다/);
  assert.match(component, /<form[^>]*action="\/"[^>]*method="get"[^>]*role="search"/);
  assert.match(component, /section\?: string/);
  assert.match(component, /section && <input type="hidden" name="section" value=\{section\} \/>/);
  assert.match(component, /name="q"/);
  assert.match(component, /value=\{value\}/);
  assert.match(component, /if \(isPendingQuerySettled\(query, pendingQuery\.current\)\) pendingQuery\.current = null/);
  assert.match(component, /window\.setTimeout\(\(\) => navigate\(value\), 180\)/);
  assert.match(component, /onCompositionStart=\{\(\) => setComposing\(true\)\}/);
  assert.match(component, /router\.replace\(archiveSearchHref\(rawValue, section\)/);
  assert.match(component, /previousSection\.current !== section/);
  assert.match(component, /pendingQuery\.current = null;\s*setValue\(displayQuery\)/);
  assert.match(component, /\[composing, query, section, value\]/);
  assert.match(component, /href=\{archiveSearchHref\('', section\)\}/);
  assert.doesNotMatch(component, /params\.size|archiveSearchDocuments|voiceBody/);
});

test('search presentation stays accessible and mobile-safe', async () => {
  const [component, css] = await Promise.all([read('components/ArchiveSearch.tsx'), read('app/globals.css')]);
  assert.match(component, /<label[^>]*htmlFor="archive-q"[^>]*>기록 검색<\/label>/);
  assert.match(component, /type="search"/);
  assert.match(component, /aria-describedby=\{statusId\}/);
  assert.match(component, /placeholder="제목·요약·본문 검색"/);
  assert.match(css, /\.archive-search[^}]*max-width:var\(--site-container\)/);
  assert.match(css, /\.archive-search input\{[^}]*font:[^;}]*16px/);
  assert.match(css, /\.archive-search__status:empty\{margin:0;height:0;overflow:hidden\}/);
  assert.match(css, /@media\(max-width:520px\)[^\n]*\.archive-search/);
  assert.match(css, /\.archive-search\{[^}]*margin:0 auto 18px/);
});

test('main and ordinary post reading headers share one background declaration', async () => {
  const css = await read('app/globals.css');
  assert.match(css, /\.cc-header\{[^}]*background:var\(--cc-header-background\)/);
  assert.doesNotMatch(css, /\.cc-header--reading\{[^}]*background:/);
});
