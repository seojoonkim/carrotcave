import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import test from 'node:test';
const css = readFileSync(new URL('../public/reading-end.css', import.meta.url), 'utf8');
const tail = css.slice(css.indexOf('Whole-card recommendation 2026.10'));

test('recommendation hover covers the whole card: rank, relation, read cue and post', () => {
  assert.ok(tail.length > 40, 'whole-card block present');
  assert.match(tail, /\.cave-constellation__recommendation article\{position:relative;[^}]*border-radius:4px/);
  assert.match(tail, /\.cave-constellation__recommendation article\{border-radius:16px!important\}/, 'soft-night rounded card');
  assert.match(tail, /article:is\(:hover,:focus-within\)\{background:/);
  assert.match(tail, /\.cave-constellation__thumbnail\{margin:0;[^}]*background:none!important/);
});

test('the read link stretches over the card, so any click on the card opens the post', () => {
  assert.match(tail, /\.cave-constellation__navigate::before\{content:"";position:absolute;inset:0;z-index:2/);
  // a transform on the link would trap the stretched overlay inside the link box
  assert.match(tail, /\.cave-constellation__navigate\{position:static;transform:none!important\}/);
});

test('card padding survives the global article side-padding reset', () => {
  assert.match(tail, /\.cave-constellation__recommendation article\{position:relative;margin:0 -16px;padding:14px 16px 16px!important/);
  assert.match(tail, /\.cave-constellation__recommendation article\{margin:0 -12px;padding:12px!important\}/);
});
