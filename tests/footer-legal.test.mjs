// Simon 2026-10-05: "푸터에 simon@hashed.com 및 저작권 표시 공통으로 넣어".
// Every footer (React SiteFooter on all app pages + every static voice reader, ko/en) must show the
// contact email and the same copyright line, both sourced from data/site-legal.json.
import test from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import { copyrightLine, voiceFooterFiles, applyLegal } from '../scripts/sync-footer-legal.mjs';

const legal = JSON.parse(readFileSync(new URL('../data/site-legal.json', import.meta.url), 'utf8'));
const line = copyrightLine();

test('copyright line is built from site-legal.json', () => {
  assert.match(line, /^© 2026(–\d{4})? Simon Kim\. All rights reserved\.$/);
  assert.equal(copyrightLine(2026), '© 2026 Simon Kim. All rights reserved.');
  assert.equal(copyrightLine(2028), '© 2026–2028 Simon Kim. All rights reserved.');
});

test('SiteFooter renders email and copyright from the shared source', () => {
  const src = readFileSync(new URL('../components/SiteFooter.tsx', import.meta.url), 'utf8');
  assert.match(src, /from '@\/lib\/site-legal'/);
  assert.match(src, /className="cc-footer__legal"><small>\{copyrightLine\(\)\}<\/small>/);
  assert.ok(src.includes(`href="mailto:${legal.email}">${legal.email}</a>`), 'footer email must match data/site-legal.json');
});

test('every voice reader footer (ko+en) has the email and the current copyright line', () => {
  const files = voiceFooterFiles();
  assert.ok(files.length >= 16, `expected >=16 voice pages, got ${files.length}`);
  for (const f of files) {
    const html = readFileSync(f, 'utf8');
    const footer = html.match(/<footer class="voice-shared-footer">[\s\S]*?<\/footer>/)?.[0] ?? '';
    assert.ok(footer.includes(`mailto:${legal.email}`), `${f}: email missing`);
    assert.equal((footer.match(/voice-shared-footer__legal/g) ?? []).length, 1, `${f}: copyright line missing or duplicated`);
    assert.ok(footer.includes(`<small>${line}</small>`), `${f}: copyright line out of date — run node scripts/sync-footer-legal.mjs`);
  }
});

test('applyLegal is idempotent and replaces a stale year', () => {
  const base = '<footer class="voice-shared-footer"><p class="voice-shared-footer__links"><a>x</a></p></footer>';
  const once = applyLegal(base, line);
  assert.equal(applyLegal(once, line), once);
  const stale = applyLegal(base, '© 2020 Old.');
  assert.equal(applyLegal(stale, line), once);
});

test('both footers style the copyright line', () => {
  assert.match(readFileSync(new URL('../app/globals.css', import.meta.url), 'utf8'), /\.cc-footer__legal\{/);
  assert.match(readFileSync(new URL('../public/voices/reader-system.css', import.meta.url), 'utf8'), /\.voice-shared-footer__legal \{/);
});

test('release runs rendered footer gates (visibility + TOP overlap) against production', () => {
  const rel = readFileSync(new URL('../scripts/release-production.mjs', import.meta.url), 'utf8');
  assert.match(rel, /verify-footer-legal-visible\.mjs','https:\/\/carrotcave\.com'/);
  assert.match(rel, /verify-footer-overlap\.mjs','https:\/\/carrotcave\.com'/);
  const css = readFileSync(new URL('../public/voices/reader-system.css', import.meta.url), 'utf8');
  assert.match(css, /\.voice-shared-footer \{ padding-bottom: 88px !important; \}/);
});
