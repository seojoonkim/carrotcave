import test from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import { execFileSync } from 'node:child_process';
import { posts } from '../data/posts.ts';
import { normalizeReadableText } from '../lib/content/normalize-readable-text.ts';
import { buildSubgraph, buildTopRecommendations } from '../lib/ontology/build-subgraph.ts';

const readJson = (path) => JSON.parse(readFileSync(new URL(path, import.meta.url), 'utf8'));
const annotations = readJson('../data/ontology/posts.json');
const edges = readJson('../data/ontology/edges.json');
const index = readJson('../data/ontology/index.json');
const vocabulary = readJson('../data/ontology/vocabulary.json');
const semanticSample = readJson('../docs/eval/ontology-semantic-sample.json');
const allowedTypes = new Set(['DEEPENS', 'CHALLENGES', 'APPLIES', 'REFRAMES', 'RESONATES']);
const relationLanguage = {
  DEEPENS: /깊이 파고든다/,
  CHALLENGES: /반문한다/,
  APPLIES: /적용한다/,
  REFRAMES: /다시 바라본다/,
  RESONATES: /맞닿는다/,
};
const slugs = new Set(posts.map((post) => post.slug));

function assertSlice(slice, firstLimit, secondLimit) {
  assert.ok(slice && slice.center);
  assert.ok(slice.nodes.filter((node) => node.hop === 1).length <= firstLimit);
  assert.ok(slice.nodes.filter((node) => node.hop === 2).length <= secondLimit);
  assert.ok(slice.nodes.length <= 1 + firstLimit + secondLimit);
  assert.equal(new Set(slice.nodes.map((node) => node.slug)).size, slice.nodes.length);
  assert.ok(slice.edges.every((edge) => edge.status === 'approved'));
  assert.equal(new Set(slice.edges.map((edge) => `${edge.from}>${edge.to}`)).size, slice.edges.length);
  const visible = new Set(slice.nodes.map((node) => node.slug));
  assert.ok(slice.edges.every((edge) => visible.has(edge.from) && visible.has(edge.to)));
}

test('normalizer produces the readable body contract', () => {
  assert.equal(normalizeReadableText(' 제목\n“인용”  문장\n👍2❤1', '제목'), '"인용" 문장');
  assert.equal(normalizeReadableText('A\r\n B  C', 'A와 다름'), 'A B C');
});

test('every current ordinary post has an approved ontology annotation', () => {
  assert.equal(Object.keys(annotations).length, posts.length);
  for (const post of posts) {
    const item = annotations[post.slug];
    assert.ok(item, post.slug);
    assert.equal(item.reviewStatus, 'approved');
    assert.ok(item.primaryTopics.length >= 1 && item.primaryTopics.length <= 2);
    assert.ok(item.secondaryTopics.length <= 4);
    assert.ok(item.claims.length >= 1 && item.claims.length <= 3);
    const body = normalizeReadableText(post.content, post.title);
    assert.ok(item.claims.every((claim) => body.includes(normalizeReadableText(claim.evidence))));
  }
  assert.ok(vocabulary.topics.length >= 1);
});

test('approved edges are valid, evidenced, unique and sufficiently cover every post', () => {
  const outgoing = new Map(posts.map((post) => [post.slug, []]));
  const seen = new Set();
  for (const edge of edges) {
    assert.equal(edge.status, 'approved');
    assert.equal(edge.source, 'deterministic-candidate-pipeline');
    assert.ok(slugs.has(edge.from) && slugs.has(edge.to));
    assert.notEqual(edge.from, edge.to);
    assert.ok(allowedTypes.has(edge.type));
    assert.doesNotMatch(edge.label, /함께 읽는 연결|생각을 .*기록과/);
    const key = `${edge.from}>${edge.to}`;
    assert.ok(!seen.has(key), `duplicate ${key}`);
    seen.add(key);
    const source = posts.find((post) => post.slug === edge.from);
    const target = posts.find((post) => post.slug === edge.to);
    assert.ok(edge.label.includes(source.title), `${key}: label omits source title`);
    assert.ok(edge.label.includes(target.title), `${key}: label omits target title`);
    assert.match(edge.label, relationLanguage[edge.type], `${key}: relation-specific language`);
    assert.ok(Array.isArray(edge.signals) && edge.signals.length >= 2, `${key}: needs two substantive signals`);
    assert.ok(edge.signals.includes('content'), `${key}: content must support the edge`);
    assert.ok(!edge.signals.includes('content-rank-fallback'), `${key}: rank fallback is forbidden`);
    assert.ok(edge.signalDetails?.lexicalOverlap >= 1, `${key}: lexical overlap must be recorded`);
    const semanticSupport = edge.signals.filter((signal) => signal !== 'content' && signal !== 'category');
    assert.ok(semanticSupport.length > 0 || edge.signalDetails.lexicalOverlap >= 2, `${key}: category-only support requires >=2 lexical tokens`);
    assert.ok(normalizeReadableText(source.content, source.title).includes(normalizeReadableText(edge.sourceEvidence)), key);
    assert.ok(normalizeReadableText(target.content, target.title).includes(normalizeReadableText(edge.targetEvidence)), key);
    outgoing.get(edge.from).push(edge);
  }
  for (const [slug, list] of outgoing) {
    assert.ok(list.length >= 3, `${slug}: ${list.length} outgoing`);
    assert.ok(new Set(list.map((edge) => edge.type)).size >= 2, `${slug}: relation diversity`);
  }
});

test('relation types are signal-derived rather than an array-position rotation', () => {
  let legacyRotations = 0;
  for (const post of posts) {
    const list = edges.filter((edge) => edge.from === post.slug);
    if (list.map((edge) => edge.type).join(',') === 'DEEPENS,REFRAMES,RESONATES') legacyRotations++;
    for (const edge of list) {
      assert.equal(typeof edge.typeBasis, 'string');
      assert.match(edge.typeBasis, /signals=.*sourceCategory=.*targetCategory=.*sourceDepth=.*targetDepth=.*dateDirection=/);
    }
  }
  assert.ok(legacyRotations < posts.length * 0.1, `mechanical pattern appears for ${legacyRotations} sources`);
});

test('semantic review sample is a stratified, exact 24-edge projection', () => {
  assert.equal(semanticSample.version, 1);
  assert.equal(semanticSample.selection, 'deterministic-stratified-by-type-and-source-category');
  assert.equal(semanticSample.edges.length, 24);
  assert.ok(new Set(semanticSample.edges.map((edge) => edge.type)).size >= 4);
  assert.ok(new Set(semanticSample.edges.map((edge) => edge.sourceCategory)).size >= 3);
  const byPair = new Map(edges.map((edge) => [`${edge.from}>${edge.to}`, edge]));
  for (const item of semanticSample.edges) {
    const edge = byPair.get(`${item.from}>${item.to}`);
    assert.ok(edge, `${item.from}>${item.to}`);
    const source = posts.find((post) => post.slug === item.from);
    const target = posts.find((post) => post.slug === item.to);
    assert.deepEqual(item, {
      from: edge.from, to: edge.to,
      sourceTitle: source.title, targetTitle: target.title,
      sourceCategory: source.category, targetCategory: target.category,
      sourceEvidence: edge.sourceEvidence, targetEvidence: edge.targetEvidence,
      signals: edge.signals, signalDetails: edge.signalDetails,
      type: edge.type, label: edge.label,
    });
  }
});

test('subgraph slices are deterministic, bounded, and contain no unapproved or duplicate destinations', () => {
  for (const post of posts) {
    const mobileA = buildSubgraph(post.slug, index, { viewport: 'mobile' });
    const mobileB = buildSubgraph(post.slug, index, { viewport: 'mobile' });
    assert.equal(JSON.stringify(mobileA), JSON.stringify(mobileB));
    assertSlice(mobileA, 6, 6);
    assertSlice(buildSubgraph(post.slug, index, { viewport: 'desktop' }), 8, 12);
  }
  assert.equal(buildSubgraph('not-a-post', index, { viewport: 'mobile' }), null);
});

test('top recommendations are the exact three strongest approved direct edges', () => {
  for (const post of posts) {
    const recommendations = buildTopRecommendations(post.slug, index);
    assert.ok(recommendations);
    const expected = (index.outgoing[post.slug] ?? []).map((edgeIndex) => index.edges[edgeIndex])
      .filter((edge) => edge?.status === 'approved')
      .sort((a, b) => b.strength - a.strength || a.type.localeCompare(b.type) || a.to.localeCompare(b.to))
      .slice(0, 3);
    assert.deepEqual(recommendations.edges.map((edge) => edge.to), expected.map((edge) => edge.to), post.slug);
    assert.equal(recommendations.edges.length, 3, post.slug);
    assert.ok(recommendations.edges.every((edge) => edge.from === post.slug), post.slug);
  }
});

test('generated index is byte-consistent and ontology audit passes closed', () => {
  execFileSync(process.execPath, ['scripts/build-ontology-index.mjs', '--check'], { cwd: new URL('..', import.meta.url), stdio: 'pipe' });
  const output = execFileSync(process.execPath, ['scripts/audit-ontology.mjs'], { cwd: new URL('..', import.meta.url), encoding: 'utf8' });
  assert.match(output, new RegExp(`posts: ${posts.length}`));
  assert.match(output, /errors: 0/);
});
