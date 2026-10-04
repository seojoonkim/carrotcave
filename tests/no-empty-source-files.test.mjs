import assert from 'node:assert/strict';
import { execFileSync } from 'node:child_process';
import { statSync } from 'node:fs';
import test from 'node:test';

// Regression guard (2026-10-05): a bulk edit script opened files for writing before reading them,
// silently truncating the logo component and all 8 voice readers to 0 bytes. Tests that only
// grep for strings missed it, so this check fails fast on any emptied tracked source file.
const root = new URL('..', import.meta.url);
const tracked = execFileSync('git', ['ls-files', 'app', 'components', 'lib', 'public'], { cwd: root, encoding: 'utf8' })
  .split('\n').filter((f) => /\.(tsx?|css|html|svg|js|mjs|json)$/.test(f));

test('no tracked source, style or page file is empty', () => {
  const empty = tracked.filter((f) => { try { return statSync(new URL(f, root)).size === 0; } catch { return false; } });
  assert.deepEqual(empty, []);
});
