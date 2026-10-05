// Release worktree guard: a broken or /tmp release folder must never silently fail a deploy again.
import test from 'node:test';
import assert from 'node:assert/strict';
import { readFile } from 'node:fs/promises';
import { spawnSync } from 'node:child_process';

const script = new URL('../scripts/release-worktree.sh', import.meta.url).pathname;
const src = await readFile(script, 'utf8');

test('refuses a /tmp release folder (macOS cleans it)', () => {
  const r = spawnSync('bash', [script, 'HEAD'], { env: { ...process.env, RELEASE_DIR: '/tmp/cc-release-guard-test', PREFLIGHT_ONLY: '1' }, encoding: 'utf8' });
  assert.equal(r.status, 2, r.stderr);
  assert.match(r.stderr, /refusing/);
});

test('detects a folder whose git link is gone and recreates it', () => {
  assert.match(src, /rev-parse --show-toplevel/);
  assert.match(src, /worktree prune/);
  assert.match(src, /worktree add -q --detach/);
});

test('keeps the real exit code of the release', () => {
  assert.match(src, /rc=\$\?\necho "EXIT \$rc" >> "\$LOG"\nexit \$rc/);
  assert.doesNotMatch(src, /; echo EXIT \$\?/);
});

test('never symlinks node_modules and reinstalls when the lockfile changes', () => {
  assert.match(src, /-L "\$DIR\/node_modules"/);
  assert.match(src, /package-lock\.json/);
});

test('carries the git-ignored Vercel project link into a fresh worktree', () => {
  assert.match(src, /cp "\$REPO\/\.vercel\/project\.json" "\$DIR\/\.vercel\/project\.json"/);
  assert.match(src, /Vercel link missing/);
});

test('stops in seconds when the commit is not pushed (HEAD must equal origin/main)', async () => {
  const { spawnSync } = await import('node:child_process');
  const repo = new URL('..', import.meta.url).pathname;
  const parent = spawnSync('git', ['-C', repo, 'rev-parse', 'origin/main~1'], { encoding: 'utf8' }).stdout.trim();
  const r = spawnSync('bash', [repo + 'scripts/release-worktree.sh', parent, '/dev/null'], {
    encoding: 'utf8', env: { ...process.env, PREFLIGHT_ONLY: '1', RELEASE_DIR: repo + '../cc-never-created' }, timeout: 60000,
  });
  assert.equal(r.status, 9, r.stderr);
  assert.match(r.stderr, /git push origin main/);
});
