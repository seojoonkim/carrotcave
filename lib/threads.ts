import type { Post } from '@/data/posts';
import type { Locale } from '@/lib/i18n';

/**
 * 줄기(thread) — 한 편으로 끝나지 않고 계속 이어지는 질문.
 * 새 글은 제목·태그가 규칙(kw)에 맞으면 자동으로 합류한다. THREAD_OVERRIDES가 있으면 그게 우선이다.
 * 홈의 모든 줄기 블록은 렌더 시점의 글 목록에서 계산되므로, 글이 올라올 때마다 순서와 문구가 바뀐다.
 */
export interface ThreadDef {
  key: string;
  name: Record<Locale, string>;
  kw: string[];
  /** 기간이 정해진 현장 연재 */
  series?: boolean;
}

export const THREADS: ThreadDef[] = [
  { key: 'moat', name: { ko: '해자는 어디로 갔나', en: 'Where did the moat go?' }, kw: ['해자', '수동변속기', '어도비', '피그마', '정답지', '소프트웨어를', '바이브 코딩이', '벽 위에'] },
  { key: 'agents', name: { ko: '에이전트들의 사회', en: 'A society of agents' }, kw: ['에이전트 사회', '몰트북', 'SwarmWorld', '에이전트 인터넷', '에이전트 커머스', '그래프 엔지니어링', '노마드', '700개', '상석'] },
  { key: 'money', name: { ko: '돈이 타는 새 배관', en: 'New pipes for money' }, kw: ['달러', '화폐', '스테이블', '크립토', '국민 지분', '자본주의', '비트코인', 'BTC', '증권형', '국가를 만든'] },
  { key: 'life', name: { ko: '생명의 스위치', en: 'The switch of life' }, kw: ['뇌를', '뇌는', '디지털 생명', '의식', '재귀적'] },
  { key: 'east', name: { ko: '이스트포인트 2026 현장', en: 'Live from Eastpoint 2026' }, kw: ['이스트포인트'], series: true },
];

/** 글별 수동 지정 (slug → thread keys). 규칙보다 우선한다. */
export const THREAD_OVERRIDES: Record<string, string[]> = {};

const BY_KEY = new Map(THREADS.map((thread) => [thread.key, thread]));
export const threadName = (key: string, locale: Locale) => BY_KEY.get(key)?.name[locale] ?? key;

export function threadsOf(post: Pick<Post, 'slug' | 'title' | 'tags'>): string[] {
  const manual = THREAD_OVERRIDES[post.slug];
  if (manual) return manual.filter((key) => BY_KEY.has(key));
  const blob = `${post.title} ${post.tags.join(' ')}`;
  return THREADS.filter((thread) => thread.kw.some((word) => blob.includes(word))).map((thread) => thread.key);
}

const DAY = 86_400_000;
const days = (from: string, to: string) => Math.round((Date.parse(to) - Date.parse(from)) / DAY);
const byNewest = (a: Post, b: Post) => b.date.localeCompare(a.date) || ((b.telegramMsgId ?? 0) - (a.telegramMsgId ?? 0));

export type ThreadState = 'on' | 'mid' | 'rest' | 'off';
export function threadState(lastDate: string, now: string): ThreadState {
  const gap = days(lastDate, now);
  return gap <= 14 ? 'on' : gap <= 45 ? 'mid' : gap <= 90 ? 'rest' : 'off';
}

export interface ThreadSummary {
  key: string;
  posts: Post[]; // newest first
  state: ThreadState;
  /** 최근 10개월, 달마다 글 수 (오래된 달 → 이번 달) */
  months: number[];
}

function monthBuckets(list: Post[], now: string, span = 10) {
  const end = new Date(`${now.slice(0, 7)}-01T00:00:00Z`);
  const keys = Array.from({ length: span }, (_, i) => {
    const d = new Date(Date.UTC(end.getUTCFullYear(), end.getUTCMonth() - (span - 1 - i), 1));
    return d.toISOString().slice(0, 7);
  });
  return keys.map((key) => list.filter((post) => post.date.startsWith(key)).length);
}

export function summarizeThreads(all: Post[], now: string, within?: (post: Post) => boolean): ThreadSummary[] {
  const pool = [...all].filter((post) => post.date <= now && (!within || within(post))).sort(byNewest);
  return THREADS.map((thread) => {
    const list = pool.filter((post) => threadsOf(post).includes(thread.key));
    return list.length ? { key: thread.key, posts: list, state: threadState(list[0].date, now), months: monthBuckets(list, now) } : null;
  })
    .filter((summary): summary is ThreadSummary => summary !== null)
    // 가장 최근에 새 글이 붙은 줄기가 위로
    .sort((a, b) => byNewest(a.posts[0], b.posts[0]));
}

export interface LeadThread {
  key: string;
  position: number;
  total: number;
  gapDays: number | null;
  previous: Post | null;
  /** 줄기 안 글 순서(오래된 → 최신), true = 이 글 */
  dots: boolean[];
}

export function leadThreadOf(post: Post, all: Post[]): LeadThread | null {
  const key = threadsOf(post)[0];
  if (!key) return null;
  const list = all.filter((item) => item.date <= post.date && threadsOf(item).includes(key)).sort(byNewest);
  const index = list.findIndex((item) => item.slug === post.slug);
  const previous = list[index + 1] ?? null;
  return {
    key,
    position: list.length - index,
    total: list.length,
    gapDays: previous ? days(previous.date, post.date) : null,
    previous,
    dots: [...list].reverse().map((item) => item.slug === post.slug),
  };
}

/** 다른 글의 relatedSlugs가 가리키는 수 = 여러 글이 이어지는 '허브' 글 */
export function inboundCounts(all: Post[]) {
  const counts = new Map<string, number>();
  for (const post of all) for (const slug of post.relatedSlugs) counts.set(slug, (counts.get(slug) ?? 0) + 1);
  return counts;
}

/** 이 글을 relatedSlugs로 가리키는 글들(최신순) — '어떤 글이 이어지는지'를 보여 줄 때 쓴다. */
export function inboundPosts(all: Post[], slug: string) {
  return all.filter((post) => post.slug !== slug && post.relatedSlugs.includes(slug)).sort(byNewest);
}

export function hubPosts(all: Post[], limit = 3, within?: (post: Post) => boolean) {
  const counts = inboundCounts(all);
  return all
    .filter((post) => (!within || within(post)) && (counts.get(post.slug) ?? 0) > 0)
    .sort((a, b) => (counts.get(b.slug) ?? 0) - (counts.get(a.slug) ?? 0) || byNewest(a, b))
    .slice(0, limit)
    .map((post) => {
      const from = inboundPosts(all, post.slug);
      return { post, inbound: from.length, from };
    });
}

/** 최근 windowDays 안에 처음 등장한 태그(최근 등장 순) */
export function freshTags(all: Post[], now: string, windowDays = 60, limit = 5) {
  const first = new Map<string, string>();
  for (const post of [...all].sort((a, b) => a.date.localeCompare(b.date))) {
    for (const tag of post.tags) if (!first.has(tag)) first.set(tag, post.date);
  }
  return [...first.entries()]
    .filter(([, date]) => date <= now && days(date, now) <= windowDays)
    .sort((a, b) => b[1].localeCompare(a[1]))
    .slice(0, limit)
    .map(([tag]) => tag);
}

export function latestDate(all: Post[]) {
  return all.reduce((max, post) => (post.date > max ? post.date : max), '0000-00-00');
}
