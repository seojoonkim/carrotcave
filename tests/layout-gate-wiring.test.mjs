import assert from 'node:assert/strict';
import fs from 'node:fs';
import path from 'node:path';
import test from 'node:test';
import { fileURLToPath } from 'node:url';

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const read = (f) => fs.readFileSync(path.join(root, f), 'utf8');

test('production release runs the layout gate on the live site', () => {
  assert.match(read('scripts/release-production.mjs'), /scripts\/verify-layout\.mjs','https:\/\/carrotcave\.com'/);
});

test('layout gate covers narrow-to-wide widths and the breakages we have shipped before', () => {
  const src = read('scripts/verify-layout.mjs');
  for (const w of [320, 390, 768, 1280, 1440]) assert.match(src, new RegExp(`\\b${w}\\b`), `width ${w}`);
  for (const kind of ['page overflow-x', 'wrapped', 'clipped', 'overlap', 'hidden-child', 'broken img']) assert.ok(src.includes(kind), kind);
  assert.match(src, /\.ccx-fl/, 'the "줄기" label that wrapped vertically on 10-09 stays in the one-line set');
});

test('desktop thread filter wraps instead of hiding chips; mobile scroll shows a fade hint', () => {
  const css = read('app/globals.css');
  assert.match(css, /\.ccx-frow\{display:flex;flex-wrap:wrap;/);
  assert.match(css, /\.ccx-fl\{flex:0 0 auto;white-space:nowrap;/);
  assert.match(css, /\.ccx-frow\{flex-wrap:nowrap;overflow-x:auto;[^}]*mask-image:linear-gradient/);
});

test('layout gate checks breathing room (text vs thumbnail, filters vs list)', () => {
  const src = fs.readFileSync(path.join(root, 'scripts/verify-layout.mjs'), 'utf8');
  assert.match(src, /cramped text-thumb/);
  assert.match(src, /filters-list/);
  assert.match(src, /mobile \? 20 : 40/);
});

test('layout gate inspects filtered and search states for stacked overlap', () => {
  const src = fs.readFileSync(path.join(root, 'scripts/verify-layout.mjs'), 'utf8');
  assert.match(src, /\[filtered\]/);
  assert.match(src, /\[search\]/);
  assert.match(src, /stack-overlap/);
});

test('layout gate checks that labels never sit flush on the search box', () => {
  const s = fs.readFileSync(path.join(root, 'scripts/verify-layout.mjs'), 'utf8');
  assert.match(s, /label-hugs-box/);
  const css = fs.readFileSync(path.join(root, 'app/globals.css'), 'utf8');
  assert.match(css, /\.ccx-archive-k\{margin:34px 0 14px\}/);
});

test('production release runs the thread tail coordinate gate after deploy', () => {
  const rel = fs.readFileSync(path.join(root, 'scripts/release-production.mjs'), 'utf8');
  assert.match(rel, /verify-thread-tail\.mjs','https:\/\/carrotcave\.com'/);
  const gate = fs.readFileSync(path.join(root, 'scripts/verify-thread-tail.mjs'), 'utf8');
  assert.match(gate, /elbow-gap/); assert.match(gate, /rail break/); assert.match(gate, /process\.exit\(1\)/);
});
