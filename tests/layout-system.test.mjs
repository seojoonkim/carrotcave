import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import test from 'node:test';

const css = readFileSync(new URL('../app/globals.css', import.meta.url), 'utf8');
const system = css.slice(css.indexOf('LAYOUT SYSTEM — one gutter'));

test('one gutter, two widths: frame and reading measure', () => {
  assert.ok(system.length > 100, 'layout system block exists');
  assert.match(system, /--gutter:clamp\(20px,4vw,48px\)/);
  assert.match(system, /--frame:960px/);
  assert.match(system, /--measure:760px/);
  assert.match(system, /\.cc-header__inner[^{]*\.cc-footer__inner[^{]*\{[^}]*max-width:var\(--frame\)/);
  assert.match(system, /\.cc-header--reading \.cc-header__inner\{max-width:var\(--measure\)/);
  assert.match(system, /\.post-reader-article\{[^}]*max-width:var\(--measure\)/);
  const end = css.slice(css.indexOf('POST END — recommendations share the reading measure'));
  assert.ok(end.length > 100, 'post-end block exists');
  assert.match(end, /\.cave-constellation-shell[^{]*\{width:min\(var\(--measure\)/);
  assert.doesNotMatch(css.slice(css.indexOf('LAYOUT SYSTEM')), /\.cave-constellation-shell[^{]*\{width:min\(var\(--frame\)/);
});

test('end of a post has a single separator line', () => {
  assert.match(system, /\.post-content::after\{[^}]*center\/20px 20px no-repeat!important/, 'fleuron is carrot only, no side rules');
  assert.match(system, /\.post-next\{[^}]*border:0!important/);
  assert.match(system, /\.post-reader-action[^{]*\{[^}]*border:0!important[^}]*box-shadow:none!important/);
  assert.match(system, /\.cave-constellation-shell[^{]*\{[^}]*border-top:1px solid var\(--hairline\)/);
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
  assert.match(sys, /--frame: 960px/);
  assert.match(sys, /\.site-header \{ padding-inline: max\(var\(--gutter\), calc\(\(100vw - var\(--measure\)\) \/ 2\)\) !important; \}/);
  assert.match(sys, /\.content-column, \.hero > \*[^{]*\{[^}]*max-width: var\(--measure\) !important/);
  assert.match(sys, /\.voice-shared-footer__inner \{ max-width: var\(--frame\) !important; \}/);
});
