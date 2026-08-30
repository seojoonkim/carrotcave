import test from 'node:test';
import assert from 'node:assert/strict';
import { readFile } from 'node:fs/promises';

import { posts } from '../data/posts.ts';
import { buildTopRecommendations } from '../lib/ontology/build-subgraph.ts';

const ontologyIndex = JSON.parse(
  await readFile(new URL('../data/ontology/index.json', import.meta.url), 'utf8'),
);

test('every published post has exactly three approved next-reading recommendations', () => {
  const failures = posts.flatMap((post) => {
    const recommendations = buildTopRecommendations(post.slug, ontologyIndex);
    const count = recommendations?.edges.length ?? 0;
    return count === 3 ? [] : [`${post.slug}: ${count}`];
  });

  assert.deepEqual(failures, [], `Recommendation coverage gaps:\n${failures.join('\n')}`);
});

test('production builds fail closed through the ontology audit before compiling', async () => {
  const pkg = JSON.parse(await readFile(new URL('../package.json', import.meta.url), 'utf8'));
  assert.match(pkg.scripts.prebuild, /audit:ontology/);
});
