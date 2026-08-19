#!/usr/bin/env node
/**
 * Fail closed before a Rabbit Hole content-only release if the release commit
 * contains layout, styling, component, or page-structure changes.
 *
 * Usage: node scripts/assert-content-only-release.mjs [commit-ish]
 */
import { execFileSync } from 'node:child_process';

const commit = process.argv[2] ?? 'HEAD';
const forbidden = [
  /^app\/globals\.css$/,
  /^app\/page\.tsx$/,
  /^app\/voices\/page\.tsx$/,
  /^components\//,
  /^public\/(?!media\/)/,
  /^styles\//,
];
const allowed = [
  /^data\/(posts\.ts|posts\.ts\.bak|scraped-posts\.json|sync-state\.json|last-sync-report\.json|ontology\/.*\.json)$/,
  /^data\/sync-metadata-overrides\.json$/,
  /^public\/media\//,
  /^scripts\/audit-post-abstracts\.mjs$/,
  /^scripts\/auto-sync\.mjs$/,
  /^scripts\/publish-single-message\.mjs$/,
  /^tests\/auto-sync-fallback\.test\.mjs$/,
];

const output = execFileSync('git', ['diff-tree', '--no-commit-id', '--name-only', '-r', commit], { encoding: 'utf8' });
const files = output.split('\n').map((file) => file.trim()).filter(Boolean);
const forbiddenFiles = files.filter((file) => forbidden.some((pattern) => pattern.test(file)));
const unexpectedFiles = files.filter((file) => !forbidden.some((pattern) => pattern.test(file)) && !allowed.some((pattern) => pattern.test(file)));

if (forbiddenFiles.length || unexpectedFiles.length) {
  console.error('Content-only release blocked. Layout or unexpected files are present:');
  for (const file of [...forbiddenFiles, ...unexpectedFiles]) console.error(`- ${file}`);
  process.exit(1);
}

console.log(`Content-only release approved: ${files.length} changed file(s) in ${commit}`);
console.log(files.map((file) => `- ${file}`).join('\n'));
