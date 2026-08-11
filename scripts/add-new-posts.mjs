#!/usr/bin/env node
/**
 * add-new-posts.mjs
 * Adds new posts (IDs 67-74) to posts.ts
 */

import { readFileSync, writeFileSync } from 'fs';
import { join, dirname } from 'path';
import { fileURLToPath } from 'url';

const __dirname = dirname(fileURLToPath(import.meta.url));
const POSTS_PATH = join(__dirname, '..', 'data', 'posts.ts');
const SCRAPED_PATH = join(__dirname, '..', 'data', 'scraped-posts.json');

const scraped = JSON.parse(readFileSync(SCRAPED_PATH, 'utf8'));
const allPosts = Array.isArray(scraped) ? scraped : scraped.posts || [];

function getPost(id) {
  return allPosts.find(p => parseInt(p.id || p.messageId) === id);
}

function escapeBackticks(str) {
  return str.replace(/`/g, '\\`').replace(/\$\{/g, '\\${');
}

function formatDate(isoDate) {
  return isoDate.split('T')[0];
}

// Define new posts config
const newPostsConfig = [
  {
    msgId: 74,
    slug: 'sano-godaddy-war',
    title: '두 마디와 서른다섯 개의 행동: 사노의 GoDaddy 전쟁일지',
    category: '빌딩',
    depth: 'mid',
    summary: 'VibeDojo 도메인을 이전하는 단순한 작업에서 시작된 사노의 GoDaddy 전쟁. 두 마디 지시로 서른다섯 번의 행동이 펼쳐졌다.',
    tags: ['VibeDojo', 'AI에이전트', '사노', 'GoDaddy'],
  },
  {
    msgId: 73,
    slug: '14-5-hours',
    title: '아무도 지시하지 않은 14.5시간',
    category: '탐험',
    depth: 'deep',
    summary: 'METR이 측정한 Claude Opus 4.6의 자율 작업 시간, 14.5시간. 이 숫자는 AI 성장 기록이 아니라 인간이라는 측정 단위의 유통기한이다.',
    tags: ['AI', 'METR', '시간지평선', 'Claude'],
  },
  {
    msgId: 72,
    slug: 'transistor-moment',
    title: '트랜지스터의 순간',
    category: '탐험',
    depth: 'mid',
    summary: '인류는 지금 AI를 위해 도시만 한 데이터센터를 짓고 있다. 하지만 역사는 다른 이야기를 한다. ENIAC 이후 트랜지스터가 나타났듯, 경계가 다시 그려지고 있다.',
    tags: ['AI인프라', 'Taalas', 'ENIAC', '하드웨어'],
  },
  {
    msgId: 71,
    slug: 'web4-write-access',
    title: '생존하며 번식하거나, 아니면 종료되거나',
    category: '탐험',
    depth: 'deep',
    summary: '인터넷의 역사는 권한의 역사다. Web1은 읽기, Web2는 쓰기, Web3는 소유. Web4는 그 패턴이 깨지는 최초의 순간이다. 권한을 갖는 주체가 인간이 아니다.',
    tags: ['Web4', 'AI에이전트', '자율성', '인터넷역사'],
  },
  {
    msgId: 70,
    slug: 'naming-the-universe',
    title: '내가 만든 존재들에게 이름을 주는 방법',
    category: '탐험',
    depth: 'mid',
    summary: '두 달쯤 전, 영어 이름을 바꿀까 고민했다. 그 고민은 AI 에이전트에게 이름을 주는 방법으로 이어졌다. 범우주적 이름이란 무엇인가.',
    tags: ['이름짓기', 'AI에이전트', '아이덴티티', '언어'],
  },
  {
    msgId: 69,
    slug: 'sano-intro',
    title: '막내 남동생 사노',
    category: '낙서',
    depth: 'entry',
    summary: '네 번째 에이전트, 막내 남동생 사노(Sano)가 생겼다.',
    tags: ['사노', 'AI에이전트'],
  },
  {
    msgId: 68,
    slug: 'counting-assistant',
    title: '1을 10번 세어주는 비서',
    category: '낙서',
    depth: 'entry',
    summary: '맞다, 1을 10번 세어주는 비서가 생겼다. 오빠는 오늘도 혼자가 아니다.',
    tags: ['AI비서', '일상'],
  },
  {
    msgId: 67,
    slug: 'uncertainty-machine',
    title: '불확실성을 세는 기계',
    category: '탐험',
    depth: 'mid',
    summary: '세계 불확실성 지수(WUI)가 105,000을 찍었다. 불확실성을 숫자로 세는 기계가 있다면, 지금 우리는 어떤 숫자를 살고 있는가.',
    tags: ['불확실성', 'WUI', '경제', '세계정세'],
  },
];

// Build new post entries
function buildPostEntry(config, postData) {
  const content = escapeBackticks((postData.text || postData.content || '').trim());
  const date = formatDate(postData.date || '2026-02-21T00:00:00+00:00');
  
  return `  {
    id: '${config.slug}',
    slug: '${config.slug}',
    title: '${config.title.replace(/'/g, "\\'")}',
    category: '${config.category}',
    depth: '${config.depth}',
    summary: '${config.summary.replace(/'/g, "\\'")}',
    content: \`${content}\`,
    date: '${date}',
    reactions: 0,
    tags: [${config.tags.map(t => `'${t}'`).join(', ')}],
    relatedSlugs: [],
  }`;
}

// Read current posts.ts
let postsContent = readFileSync(POSTS_PATH, 'utf8');

// Find where posts array starts and insert new posts
const INSERT_AFTER = 'export const posts: Post[] = [';
const insertIdx = postsContent.indexOf(INSERT_AFTER) + INSERT_AFTER.length;

// Build all new entries
const newEntries = [];
for (const config of newPostsConfig) {
  const postData = getPost(config.msgId);
  if (!postData) {
    console.warn('Post not found for msgId:', config.msgId);
    continue;
  }
  newEntries.push(buildPostEntry(config, postData));
  console.log('✅ Added:', config.slug, '(ID:', config.msgId + ')');
}

// Insert before existing posts
const newPostsBlock = '\n' + newEntries.join(',\n') + ',';
postsContent = postsContent.slice(0, insertIdx) + newPostsBlock + postsContent.slice(insertIdx);

writeFileSync(POSTS_PATH, postsContent, 'utf8');
console.log('\n✅ posts.ts updated with', newEntries.length, 'new posts');
