import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import test from 'node:test';

const css = readFileSync(new URL('../app/globals.css', import.meta.url), 'utf8');
const system = css.slice(css.indexOf('LAYOUT SYSTEM — one gutter'));

test('one gutter, two widths: frame and reading measure', () => {
  assert.ok(system.length > 100, 'layout system block exists');
  assert.match(system, /--gutter:clamp\(20px,4vw,48px\)/);
  assert.match(system, /--measure:760px;--frame:var\(--measure\)/);
  assert.match(system, /--measure:760px/);
  assert.match(system, /\.cc-header__inner[^{]*\.cc-footer__inner[^{]*\{[^}]*max-width:var\(--frame\)/);
  assert.match(system, /\.cc-header--reading \.cc-header__inner\{max-width:var\(--measure\)/);
  assert.match(system, /\.post-reader-article\{[^}]*max-width:var\(--measure\)/);
  const end = readFileSync(new URL('../public/reading-end.css', import.meta.url), 'utf8');
  assert.match(end, /\.cc-reading-end\{[^}]*width:100%;max-width:760px;margin:64px auto 0/, 'reading end sits on the reading measure');
  assert.match(end, /\.cc-reading-end \.cave-constellation-shell\{position:static;left:auto;width:100%/, 'picks never widen past the body');
});

test('end of a read has a single separator line, shared by posts and voices', () => {
  const end = readFileSync(new URL('../public/reading-end.css', import.meta.url), 'utf8');
  assert.match(end, /\.cc-reading-end__mark\{[^}]*carrot-mark\.svg"\) center\/20px 20px no-repeat/, 'carrot only, no side rules');
  assert.doesNotMatch(end, /\.post-next\{[^}]*border(-top|-bottom)?:1px/);
  assert.equal((end.match(/border-top:1px solid var\(--re-line\)/g) || []).length, 1, 'one section separator: above the picks');
  assert.equal((end.match(/border-top:1px/g) || []).length, 2, 'plus only a faint hairline between ranked picks');
  assert.match(end, /\.cave-constellation__recommendation\+\.cave-constellation__recommendation\{[^}]*border-top:1px solid rgba\(217,220,232,\.08\)/);
  assert.doesNotMatch(css, /post-content::after|post-reader-action|cave-constellation|post-next/, 'no competing post-end rules in globals.css');
});

test('reading body text is 18px', () => {
  assert.match(css, /--reader-body-size:18px/);
  assert.doesNotMatch(css, /--reader-body-size:17px/);
});

test('voice readers use the same gutter, measure and frame as ordinary posts', () => {
  const voice = readFileSync(new URL('../public/voices/reader-system.css', import.meta.url), 'utf8');
  const sys = voice.slice(voice.indexOf('LAYOUT SYSTEM (shared with carrotcave.com'));
  assert.ok(sys.length > 100, 'voice layout block exists');
  assert.match(sys, /--gutter: clamp\(20px, 4vw, 48px\)/);
  assert.match(sys, /--measure: 760px/);
  assert.match(sys, /--measure: 760px; --frame: var\(--measure\);/);
  assert.match(sys, /\.site-header \{ padding-inline: max\(var\(--gutter\), calc\(\(100vw - var\(--measure\)\) \/ 2\)\) !important; \}/);
  assert.match(sys, /\.content-column, \.hero > \*[^{]*\{[^}]*max-width: var\(--measure\) !important/);
  assert.match(sys, /\.voice-shared-footer__inner \{ max-width: var\(--frame\) !important; \}/);
});

test('list pages and reading pages share one container width', () => {
  const g = readFileSync(new URL('../app/globals.css', import.meta.url), 'utf8');
  const v = readFileSync(new URL('../public/voices/reader-system.css', import.meta.url), 'utf8');
  for (const src of [g, v]) {
    assert.doesNotMatch(src, /--frame:\s*960px/, 'frame must not drift wider than the reading column');
    assert.match(src, /--frame:\s*var\(--measure\)/);
  }
});
