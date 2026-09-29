import test from 'node:test';
import assert from 'node:assert/strict';
import { execFileSync } from 'node:child_process';
import { fileURLToPath } from 'node:url';
const cwd = fileURLToPath(new URL('..', import.meta.url));
// These audits run inside `npm run verify` during production release. Running them in
// `npm test` too means a category move or abstract edit fails locally, not at deploy time.
for (const script of ['scripts/audit-post-abstracts.mjs', 'scripts/audit-post-titles.mjs']) {
  test(`release audit passes locally: ${script}`, () => {
    try {
      execFileSync(process.execPath, [script], { cwd, stdio: 'pipe', encoding: 'utf8' });
    } catch (error) {
      assert.fail(`${script} failed\n${(error.stdout || '') + (error.stderr || '')}`.slice(0, 2000));
    }
  });
}
