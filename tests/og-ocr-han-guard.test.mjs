// Live OCR gate regression (2026-10-05 release EXIT 1): the "央视网" logo in the liang-wenfeng photo was OCR'd as
// Hangul ("끗쉿ㅭ", conf 0.30) and blocked a correct deploy. Real Korean (large title, small caption) must still fail.
import test from 'node:test';
import assert from 'node:assert/strict';
import { spawnSync } from 'node:child_process';

const fixtures = ['/han-logo-false-positive.png', '/real-korean.png', '/small-korean-with-han-photo.png'];

test('share-card Hangul OCR ignores Chinese logo misreads but still catches real Korean', { skip: process.platform !== 'darwin' }, () => {
  const r = spawnSync('swift', ['scripts/og-image-hangul.swift', 'tests/fixtures/og-ocr', ...fixtures], { encoding: 'utf8' });
  assert.equal(r.status, 0, r.stderr);
  const hits = JSON.parse(r.stdout);
  assert.ok(!hits.includes('/han-logo-false-positive.png'), 'Chinese broadcaster logo counted as Korean');
  assert.ok(hits.includes('/real-korean.png'), 'large Korean title missed');
  assert.ok(hits.includes('/small-korean-with-han-photo.png'), 'small Korean caption missed');
});
