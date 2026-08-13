import { writeFileSync, readFileSync, mkdirSync } from 'node:fs';
import { posts } from '../data/posts.ts';
import { normalizeReadableText } from '../lib/content/normalize-readable-text.ts';

const root = new URL('../data/ontology/', import.meta.url);
const samplePath = new URL('../docs/eval/ontology-semantic-sample.json', import.meta.url);
mkdirSync(root, { recursive: true });
mkdirSync(new URL('../docs/eval/', import.meta.url), { recursive: true });
let legacy = {};
try { legacy = JSON.parse(readFileSync(new URL('../data/relations.json', import.meta.url), 'utf8')); } catch {}

const categories = { '탐험': 'exploration', '빌딩': 'building', '낙서': 'notes', '소설': 'fiction' };
const CONCEPT_LEXICONS = {
  agent: /(?:비서|에이전트|agent|assistant)/iu,
};
const conceptSignals = (post) => {
  const text = `${post.title}\n${post.summary}\n${normalizeReadableText(post.content, post.title)}\n${post.tags.join(' ')}`;
  return Object.entries(CONCEPT_LEXICONS).filter(([, pattern]) => pattern.test(text)).map(([id]) => `concept-${id}`);
};
// Category may be the only metadata signal only at this documented minimum.
export const CATEGORY_ONLY_MIN_LEXICAL_OVERLAP = 2;
const STOP_WORDS = new Set(`그리고 그러나 하지만 그래서 또는 대한 대해 위한 통해 있는 없는 있다 없다 같은 다른 것이 것은 이를 그 이 저 것 수 더 한 하는 했다 한다 되었다 된다 내가 나는 우리는 그동안 어느 함께 기록 생각 이야기 정말 다시 시작 오늘 지금 때 곳 안 뒤 중 점 글 말 사람 경우 정도 하나 이미 아직 가장 바로 매우 서로 먼저 이후 때문 속 위 새 잘 몇 번 전 후 듯 게 데 에게 에서 으로 로 을 를 은 는 이 가 와 과 의 도 만 에`.split(/\s+/));
const canonicalToken = (token) => {
  if (!/[가-힣]/.test(token) || token.length < 4) return token;
  const stem = token.replace(/(으로|에서|에게|까지|부터|처럼|보다|하고|이며|에는|에서는|이라는|라고|되고|하는|했다|한다|이다|였다|였다가|들의|이라|이라면|인가|은|는|이|가|을|를|와|과|의|도|만)$/u, '');
  return stem.length >= 2 ? stem : token;
};
const tokenize = (value) => (normalizeReadableText(value).toLocaleLowerCase('ko-KR').match(/[가-힣a-z0-9]{2,}/g) ?? [])
  .filter((token) => !STOP_WORDS.has(token) && !/^https?$/.test(token))
  .flatMap((token) => {
    const parts = token.match(/[가-힣]+|[a-z0-9]+/g) ?? [token];
    return [token, ...parts.filter((part) => part !== token && part.length >= 2)];
  })
  .map(canonicalToken);
const profile = (post) => {
  const titleTokens = tokenize(post.title);
  const summaryTokens = tokenize(post.summary);
  const bodyTokens = tokenize(normalizeReadableText(post.content, post.title).slice(0, 4000));
  const all = new Set([...titleTokens, ...summaryTokens, ...bodyTokens, ...post.tags.flatMap(tokenize)]);
  return { titleTokens: new Set(titleTokens), all };
};
const profiles = Object.fromEntries(posts.map((post) => [post.slug, profile(post)]));
const exactEvidence = (post) => {
  const body = normalizeReadableText(post.content, post.title);
  const sentences = body.split(/(?<=[.!?。！？])\s+/).map((item) => item.trim()).filter(Boolean);
  return (sentences.find((item) => item.length >= 20 && item.length <= 240) ?? sentences.find((item) => item.length >= 20) ?? sentences[0] ?? body).slice(0, 240).trim();
};
const evidenceFor = (post, overlapTokens, requireChallenge = false) => {
  const body = normalizeReadableText(post.content, post.title);
  const sentences = body.split(/(?<=[.!?。！？])\s+/).map((item) => item.trim()).filter((item) => item.length >= 12);
  const ranked = sentences.map((sentence) => {
    const normalized = sentence.toLocaleLowerCase('ko-KR');
    return {
      sentence,
      overlap: overlapTokens.filter((token) => normalized.includes(token)).length,
      challenge: false,
    };
  }).filter((item) => item.overlap > 0 && (!requireChallenge || item.challenge))
    .sort((a, b) => b.overlap - a.overlap || Number(b.challenge) - Number(a.challenge) || a.sentence.length - b.sentence.length);
  return ranked[0]?.sentence.slice(0, 240).trim() ?? null;
};
const annotations = {};
for (const post of posts) {
  const quote = exactEvidence(post);
  const topic = categories[post.category] ?? 'essay';
  annotations[post.slug] = {
    primaryTopics: [topic],
    secondaryTopics: [...new Set([`depth-${post.depth}`, ...post.tags.map((tag) => `tag-${tag.normalize('NFC')}`)])].slice(0, 4),
    questions: [`${topic}-reading-question`],
    claims: [{ id: `${post.slug}-c1`, text: quote, stance: 'asserts', evidence: quote }],
    entities: [], methods: ['close-reading'], motifs: post.tags.slice(0, 3),
    readerPrerequisites: [], readerOutcomes: [topic], reviewStatus: 'approved',
    provenance: { generator: 'deterministic-candidate-pipeline', signals: ['content', 'tags', 'category', 'relatedSlugs', 'legacy-relations'] },
  };
}

const related = new Map(posts.map((post) => [post.slug, new Set(post.relatedSlugs)]));
const legacyPairs = new Set(Object.entries(legacy).flatMap(([from, list]) => list.map((item) => `${from}>${item.slug}`)));
function candidate(from, to) {
  const a = profiles[from.slug];
  const b = profiles[to.slug];
  const overlapTokens = [...a.all].filter((token) => b.all.has(token)).sort();
  const titleOverlap = overlapTokens.filter((token) => a.titleTokens.has(token) || b.titleTokens.has(token));
  const sharedTags = from.tags.filter((tag) => to.tags.includes(tag)).sort();
  const signals = [];
  if (overlapTokens.length) signals.push('content');
  if (sharedTags.length) signals.push('tags');
  if (from.category === to.category) signals.push('category');
  if (related.get(from.slug).has(to.slug) || related.get(to.slug)?.has(from.slug)) signals.push('relatedSlugs');
  if (legacyPairs.has(`${from.slug}>${to.slug}`) || legacyPairs.has(`${to.slug}>${from.slug}`)) signals.push('legacy-relations');
  const sharedConcepts = conceptSignals(from).filter((signal) => conceptSignals(to).includes(signal));
  signals.push(...sharedConcepts);
  const nonCategorySupport = signals.some((signal) => ['tags', 'relatedSlugs', 'legacy-relations'].includes(signal));
  const eligible = signals.includes('content') && (nonCategorySupport || (signals.includes('category') && overlapTokens.length >= CATEGORY_ONLY_MIN_LEXICAL_OVERLAP));
  const lexicalScore = overlapTokens.length / Math.max(1, Math.sqrt(a.all.size * b.all.size));
  const score = lexicalScore + Math.min(titleOverlap.length, 3) * 0.08 + sharedTags.length * 0.22
    + signals.includes('relatedSlugs') * 0.42 + signals.includes('legacy-relations') * 0.36 + signals.includes('category') * 0.03;
  return { to, score, signals, eligible, signalDetails: { lexicalOverlap: overlapTokens.length, overlapTokens: overlapTokens.slice(0, 12), titleOverlap: titleOverlap.slice(0, 8), sharedTags, sharedConcepts } };
}

const depthRank = { entry: 0, mid: 1, deep: 2 };
function classify(from, candidateItem) {
  const to = candidateItem.to;
  const signals = candidateItem.signals;
  let type;
  const dateGapDays = Math.round((new Date(to.date).getTime() - new Date(from.date).getTime()) / 86400000);

  if ((signals.includes('relatedSlugs') && from.category === '빌딩') || (from.category !== to.category && to.category === '빌딩')) type = 'APPLIES';
  else if (signals.includes('relatedSlugs') && from.category === to.category) type = 'DEEPENS';
  else if (from.category !== to.category || Math.abs(dateGapDays) >= 180) type = 'REFRAMES';
  else if (depthRank[to.depth] > depthRank[from.depth]) type = candidateItem.signalDetails.lexicalOverlap >= 40 ? 'DEEPENS' : 'REFRAMES';
  else if (candidateItem.signalDetails.titleOverlap.length > 0 || signals.includes('relatedSlugs') || signals.includes('legacy-relations') || candidateItem.signalDetails.sharedTags.length > 0 || candidateItem.signalDetails.sharedConcepts.length > 0) type = 'DEEPENS';
  else type = 'RESONATES';
  const dateDirection = to.date === from.date ? 'same' : to.date > from.date ? 'newer' : 'older';
  const typeBasis = `signals=${signals.join('+')};sourceCategory=${from.category};targetCategory=${to.category};sourceDepth=${from.depth};targetDepth=${to.depth};dateDirection=${dateDirection};lexicalOverlap=${candidateItem.signalDetails.lexicalOverlap};titleOverlap=${candidateItem.signalDetails.titleOverlap.length};challengeSignal=false`;
  return { ...candidateItem, type, typeBasis };
}
const relationPhrase = {
  DEEPENS: '의 문제를 더 깊이 파고든다',
  CHALLENGES: '의 결론을 새로운 시점에서 반문한다',
  APPLIES: '의 원리를 구체적인 구축 과정에 적용한다',
  REFRAMES: '의 주제를 다른 맥락에서 다시 바라본다',
  RESONATES: '의 핵심 문제와 맞닿는다',
};
function chooseThree(from) {
  const ranked = posts.filter((to) => to.slug !== from.slug).map((to) => classify(from, candidate(from, to)))
    .filter((item) => item.eligible).sort((a, b) => b.score - a.score || a.to.slug.localeCompare(b.to.slug));
  if (ranked.length < 3) throw new Error(`${from.slug}: only ${ranked.length} semantically eligible candidates`);
  const chosen = [ranked[0]];
  const diverse = ranked.find((item) => item.type !== chosen[0].type);
  if (!diverse) throw new Error(`${from.slug}: no semantically justified second relation type (${ranked.slice(0, 8).map((item) => `${item.to.slug}:${item.type}:${item.to.date}:${item.signalDetails.lexicalOverlap}`).join(', ')})`);
  chosen.push(diverse);
  chosen.push(ranked.find((item) => !chosen.includes(item)));
  return chosen.sort((a, b) => b.score - a.score || a.to.slug.localeCompare(b.to.slug));
}

const edges = [];
for (const from of posts) {
  for (const item of chooseThree(from)) {
    const to = item.to;
    edges.push({
      from: from.slug, to: to.slug, type: item.type,
      strength: Number(Math.max(0.35, Math.min(0.99, item.score)).toFixed(4)),
      sourceClaimId: `${from.slug}-c1`,
      sourceEvidence: evidenceFor(from, item.signalDetails.overlapTokens) ?? exactEvidence(from),
      targetEvidence: evidenceFor(to, item.signalDetails.overlapTokens) ?? exactEvidence(to),
      label: `「${to.title}」은 「${from.title}」${relationPhrase[item.type]}`,
      source: 'deterministic-candidate-pipeline', signals: item.signals, signalDetails: item.signalDetails,
      typeBasis: item.typeBasis, status: 'approved',
    });
  }
}
const vocabulary = {
  topics: Object.entries(categories).map(([axis, id]) => ({ id, label: axis.replace(/^\S+\s*/, ''), aliases: [axis], status: 'approved' })),
  questions: Object.values(categories).map((id) => ({ id: `${id}-reading-question`, label: `${id} 독해 질문`, aliases: [], status: 'approved' })),
  methods: [{ id: 'close-reading', label: '근접 읽기', aliases: [], status: 'approved' }], motifs: [],
};
const stable = (value) => `${JSON.stringify(value, null, 2)}\n`;
writeFileSync(new URL('posts.json', root), stable(annotations));
writeFileSync(new URL('edges.json', root), stable(edges));
writeFileSync(new URL('vocabulary.json', root), stable(vocabulary));

const sample = [];
const strata = [...new Set(edges.map((edge) => `${edge.type}|${posts.find((post) => post.slug === edge.from).category}`))].sort();
let round = 0;
while (sample.length < 24) {
  let added = false;
  for (const stratum of strata) {
    if (sample.length === 24) break;
    const candidates = edges.filter((edge) => `${edge.type}|${posts.find((post) => post.slug === edge.from).category}` === stratum)
      .sort((a, b) => a.from.localeCompare(b.from) || a.to.localeCompare(b.to));
    if (candidates[round]) { sample.push(candidates[round]); added = true; }
  }
  if (!added) break;
  round++;
}
if (sample.length !== 24) throw new Error(`semantic sample has ${sample.length}, expected 24`);
const sampleProjection = sample.map((edge) => {
  const from = posts.find((post) => post.slug === edge.from);
  const to = posts.find((post) => post.slug === edge.to);
  return { from: edge.from, to: edge.to, sourceTitle: from.title, targetTitle: to.title, sourceCategory: from.category, targetCategory: to.category, sourceEvidence: edge.sourceEvidence, targetEvidence: edge.targetEvidence, signals: edge.signals, signalDetails: edge.signalDetails, type: edge.type, label: edge.label };
});
writeFileSync(samplePath, stable({ version: 1, selection: 'deterministic-stratified-by-type-and-source-category', categoryOnlyMinimumLexicalOverlap: CATEGORY_ONLY_MIN_LEXICAL_OVERLAP, edges: sampleProjection }));
console.log(`drafted posts=${posts.length} edges=${edges.length} sample=${sample.length}; approval requires deterministic semantic audit`);
