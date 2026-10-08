import assert from 'node:assert/strict';
import { execFileSync } from 'node:child_process';
import path from 'node:path';
import test from 'node:test';
import { fileURLToPath } from 'node:url';

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');

// 2026-10-09: two .pyc files were committed by mistake. The release preflight deletes
// Python caches, so the release worktree became "dirty" and release:production refused to deploy.
test('no Python bytecode caches are tracked in git (they break the clean-worktree release gate)', () => {
  const tracked = execFileSync('git', ['ls-files'], { cwd: root, encoding: 'utf8' }).split('\n');
  const caches = tracked.filter((file) => /(^|\/)__pycache__\/|\.pyc$/.test(file));
  assert.deepEqual(caches, []);
});
