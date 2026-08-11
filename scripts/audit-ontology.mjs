import { readFileSync } from 'node:fs';
import { spawnSync } from 'node:child_process';
import { posts } from '../data/posts.ts';
import { normalizeReadableText } from '../lib/content/normalize-readable-text.ts';

const errors = [];
const root = new URL('../data/ontology/', import.meta.url);
const CATEGORY_ONLY_MIN_LEXICAL_OVERLAP = 2;
const relationLanguage = {
  DEEPENS: /깊이 파고든다/,
  CHALLENGES: /반문한다/,
  APPLIES: /적용한다/,
  REFRAMES: /다시 바라본다/,
  RESONATES: /맞닿는다/,
};

function load(name, base = root) {
  try { return JSON.parse(readFileSync(new URL(name, base), 'utf8')); }
  catch (error) { errors.push(`${name}: unreadable (${error.message})`); return null; }
}
const annotations = load('posts.json') ?? {};
const edges = load('edges.json') ?? [];
const index = load('index.json');
const sample = load('ontology-semantic-sample.json', new URL('../docs/eval/', import.meta.url));
const allowed = new Set(Object.keys(relationLanguage));
const bySlug = new Map(posts.map((post) => [post.slug, post]));
const outgoing = new Map(posts.map((post) => [post.slug, []]));
const seen = new Set();

for (const post of posts) {
  const annotation = annotations[post.slug];
  if (!annotation || annotation.reviewStatus !== 'approved') errors.push(`${post.slug}: missing approved annotation`);
  const body = normalizeReadableText(post.content, post.title);
  for (const claim of annotation?.claims ?? []) {
    if (!body.includes(normalizeReadableText(claim.evidence))) errors.push(`${post.slug}: claim evidence mismatch`);
  }
}
for (const slug of Object.keys(annotations)) if (!bySlug.has(slug)) errors.push(`${slug}: stale annotation`);
for (const edge of edges) {
  const key = `${edge.from}>${edge.to}`;
  const source = bySlug.get(edge.from);
  const target = bySlug.get(edge.to);
  if (!source || !target) errors.push(`${key}: invalid slug`);
  if (edge.from === edge.to) errors.push(`${key}: self edge`);
  if (seen.has(key)) errors.push(`${key}: duplicate`);
  seen.add(key);
  if (edge.status !== 'approved') errors.push(`${key}: not approved`);
  if (edge.source !== 'deterministic-candidate-pipeline') errors.push(`${key}: missing deterministic provenance`);
  if (!allowed.has(edge.type)) errors.push(`${key}: invalid type`);
  if (!Array.isArray(edge.signals) || edge.signals.length < 2 || !edge.signals.includes('content')) errors.push(`${key}: fewer than two substantive signals`);
  if (edge.signals?.includes('content-rank-fallback')) errors.push(`${key}: forbidden content-rank fallback`);
  const nonCategorySupport = edge.signals?.some((signal) => !['content', 'category'].includes(signal));
  if (!nonCategorySupport && (edge.signalDetails?.lexicalOverlap ?? 0) < CATEGORY_ONLY_MIN_LEXICAL_OVERLAP) errors.push(`${key}: category-only support below lexical minimum ${CATEGORY_ONLY_MIN_LEXICAL_OVERLAP}`);
  if (!edge.typeBasis || !/signals=.*sourceCategory=.*targetCategory=.*sourceDepth=.*targetDepth=.*dateDirection=/.test(edge.typeBasis)) errors.push(`${key}: relation type lacks deterministic semantic basis`);
  if (edge.type === 'CHALLENGES') errors.push(`${key}: CHALLENGES requires a manually reviewed claim-to-rebuttal override; automatic approval is forbidden`);
  if (/함께 읽는 연결|생각을 .*기록과/.test(edge.label ?? '')) errors.push(`${key}: generic label`);
  if (source && !edge.label?.includes(source.title)) errors.push(`${key}: label omits source title`);
  if (target && !edge.label?.includes(target.title)) errors.push(`${key}: label omits target title`);
  if (allowed.has(edge.type) && !relationLanguage[edge.type].test(edge.label ?? '')) errors.push(`${key}: label lacks ${edge.type} language`);
  const sourceQuote = normalizeReadableText(edge.sourceEvidence ?? '');
  const targetQuote = normalizeReadableText(edge.targetEvidence ?? '');
  if (!sourceQuote || sourceQuote.length < 8 || (source && !normalizeReadableText(source.content, source.title).includes(sourceQuote))) errors.push(`${key}: source evidence mismatch`);
  if (!targetQuote || targetQuote.length < 8 || (target && !normalizeReadableText(target.content, target.title).includes(targetQuote))) errors.push(`${key}: target evidence mismatch`);
  if (outgoing.has(edge.from)) outgoing.get(edge.from).push(edge);
}
let legacyRotations = 0;
for (const [slug, list] of outgoing) {
  if (list.length < 3) errors.push(`${slug}: outgoing ${list.length} < 3`);
  if (new Set(list.map((edge) => edge.type)).size < 2) errors.push(`${slug}: fewer than 2 relation types`);
  if (list.length >= 3 && list.slice(0, 3).map((edge) => edge.type).join(',') === 'DEEPENS,REFRAMES,RESONATES') legacyRotations++;
}
if (legacyRotations >= posts.length * 0.1) errors.push(`mechanical relation type rotation across ${legacyRotations} sources`);
if (!sample || sample.edges?.length !== 24) errors.push('semantic sample must contain exactly 24 edges');
else {
  const edgePairs = new Set(edges.map((edge) => `${edge.from}>${edge.to}`));
  if (new Set(sample.edges.map((edge) => edge.type)).size < 4) errors.push('semantic sample is not type-stratified');
  if (new Set(sample.edges.map((edge) => edge.sourceCategory)).size < 3) errors.push('semantic sample is not category-stratified');
  for (const item of sample.edges) if (!edgePairs.has(`${item.from}>${item.to}`)) errors.push(`${item.from}>${item.to}: stale semantic sample edge`);
}
if (!index) errors.push('index missing');
else {
  if (Object.keys(index.nodes ?? {}).length !== posts.length) errors.push('index node count mismatch');
  if ((index.edges ?? []).some((edge) => edge.status !== 'approved')) errors.push('index exposes unapproved edge');
}
const indexCheck = spawnSync(process.execPath, ['scripts/build-ontology-index.mjs', '--check'], { cwd: new URL('..', import.meta.url), encoding: 'utf8' });
if (indexCheck.status !== 0) errors.push('generated index is not byte-consistent with ontology sources');
const typeCounts = Object.fromEntries([...allowed].map((type) => [type, edges.filter((edge) => edge.type === type).length]));
console.log(`posts: ${posts.length}`);
console.log(`annotations: ${Object.keys(annotations).length}`);
console.log(`edges: ${edges.length}`);
console.log(`approved edges: ${edges.filter((edge) => edge.status === 'approved').length}`);
console.log(`types: ${Object.entries(typeCounts).map(([type, count]) => `${type}=${count}`).join(' ')}`);
console.log(`semantic sample: ${sample?.edges?.length ?? 0}`);
console.log(`errors: ${errors.length}`);
for (const error of errors) console.error(`- ${error}`);
if (errors.length) process.exit(1);
