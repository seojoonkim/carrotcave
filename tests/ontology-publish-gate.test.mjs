import test from 'node:test';
import assert from 'node:assert/strict';
import { mkdtempSync, readFileSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { join } from 'node:path';

import { gitCommitAndPush } from '../scripts/auto-sync.mjs';

test('ontology audit runs before commit and push, including reaction-only updates', () => {
  const commands = [];
  const gitCommands = [];
  const reportPath = join(mkdtempSync(join(tmpdir(), 'rabbitcrypt-gate-')), 'report.json');
  const run = (command) => commands.push(command);
  const runGit = (args) => gitCommands.push(args);

  const published = gitCommitAndPush([], 1, [], { run, runGit, reportPath });

  assert.equal(published, true);
  assert.deepEqual(commands, ['npm run audit:ontology']);
  assert.deepEqual(gitCommands[0], ['add', '-A']);
  assert.deepEqual(gitCommands[1].slice(0, 2), ['commit', '-m']);
  assert.deepEqual(gitCommands[2], ['push', 'origin', 'main']);
});

test('ontology audit failure emits a machine-readable review report and prevents publication', () => {
  const commands = [];
  const reportPath = join(mkdtempSync(join(tmpdir(), 'rabbitcrypt-gate-')), 'report.json');
  const auditError = Object.assign(new Error('missing approved annotation'), { status: 1 });
  const run = (command) => {
    commands.push(command);
    if (command === 'npm run audit:ontology') throw auditError;
  };

  assert.throws(
    () => gitCommitAndPush(['new-post'], 0, [], { run, reportPath }),
    (error) => error.code === 'ONTOLOGY_REVIEW_REQUIRED',
  );
  assert.deepEqual(commands, ['npm run audit:ontology']);
  const report = JSON.parse(readFileSync(reportPath, 'utf8'));
  assert.equal(report.status, 'ontology_review_required');
  assert.deepEqual(report.newPostSlugs, ['new-post']);
  assert.match(report.auditError, /missing approved annotation/);
});

test('commit message is passed as one git argument, not interpolated into a shell command', () => {
  const gitCommands = [];
  const hostileSlug = 'post-$(touch should-not-exist)-`whoami`';
  gitCommitAndPush([hostileSlug], 0, [], {
    run: () => {},
    runGit: (args) => gitCommands.push(args),
  });

  assert.deepEqual(gitCommands[0], ['add', '-A']);
  assert.equal(gitCommands[1][0], 'commit');
  assert.equal(gitCommands[1][1], '-m');
  assert.match(gitCommands[1][2], /\$\(touch should-not-exist\).*`whoami`/);
});
