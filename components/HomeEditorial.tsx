import Link from 'next/link';
import type { Post } from '@/data/posts';
import { formatDate, localePath, type Locale } from '@/lib/i18n';
import { localizedPost } from '@/lib/i18n-content';
import { freshTags, hubPosts, leadThreadOf, summarizeThreads, threadName, type ThreadState } from '@/lib/threads';

const COPY = {
  ko: {
    leadKicker: '이 글이 잇는 줄기',
    position: (n: number) => `${n}번째 글`,
    gap: (d: number | null) => (d === null ? '새로 열린 줄기' : d === 0 ? '같은 날 이어짐' : `${d}일 만에 이어짐`),
    previous: '이전 글',
    threads: '계속 파는 질문',
    threadsHint: '새 글이 붙은 줄기가 위로 올라와요',
    inCategory: (cat: string) => `${cat} 안의 줄기`,
    state: { on: '방금 이어짐', mid: '이어지는 중', rest: '쉬는 중', off: '잠든 줄기' } as Record<ThreadState, string>,
    threadMeta: (n: number, from: string, last: string) => `${n}편 · ${from}부터 · 최근 ${last}`,
    hubs: '처음 왔다면',
    hubsIn: (cat: string) => `${cat}, 여기서부터`,
    inbound: (n: number) => `다른 글 ${n}편이 이어짐`,
    fresh: '새로 열린 굴',
    recent: '최근 소설 · 낙서',
    sparkLabel: '최근 10개월 동안 달마다 쓴 글',
  },
  en: {
    leadKicker: 'The thread this piece continues',
    position: (n: number) => `Piece ${n}`,
    gap: (d: number | null) => (d === null ? 'A new thread' : d === 0 ? 'Continued the same day' : `Continued after ${d} ${d === 1 ? 'day' : 'days'}`),
    previous: 'Previous',
    threads: 'Questions still being dug',
    threadsHint: 'Threads with new pieces rise to the top',
    inCategory: (cat: string) => `Threads in ${cat}`,
    state: { on: 'Just continued', mid: 'Ongoing', rest: 'Resting', off: 'Dormant' } as Record<ThreadState, string>,
    threadMeta: (n: number, from: string, last: string) => `${n} pieces · since ${from} · latest ${last}`,
    hubs: 'New here?',
    hubsIn: (cat: string) => `Start ${cat} here`,
    inbound: (n: number) => `${n} pieces lead here`,
    fresh: 'Newly opened tunnels',
    recent: 'Latest fiction · notes',
    sparkLabel: 'Pieces per month, last 10 months',
  },
} as const;

const short = (locale: Locale, date: string) => (locale === 'ko' ? `${Number(date.slice(5, 7))}.${Number(date.slice(8, 10))}` : formatDate(locale, date));
const href = (locale: Locale, post: Post) => localePath(locale, `/posts/${post.slug}`);

export function LeadThread({ lead, all, locale }: { lead: Post; all: Post[]; locale: Locale }) {
  const C = COPY[locale];
  const info = leadThreadOf(lead, all);
  if (!info) return null;
  const previous = info.previous ? localizedPost(info.previous, locale) : null;
  return (
    <aside className="ccx-leadthread" aria-label={C.leadKicker}>
      <span className="ccx-k">{C.leadKicker}</span>
      <b className="ccx-title">{threadName(info.key, locale)}</b>
      <span className="ccx-m">{C.position(info.position)} · {C.gap(info.gapDays)}</span>
      <span className="ccx-dots" aria-hidden="true">{info.dots.map((on, i) => <i key={i} className={on ? 'on' : undefined} />)}</span>
      {previous && <Link className="ccx-prev" href={href(locale, previous)}>{C.previous} · {previous.title}</Link>}
    </aside>
  );
}

function Spark({ months, label }: { months: number[]; label: string }) {
  return <span className="ccx-spark" role="img" aria-label={label}>{months.map((n, i) => <i key={i} data-n={Math.min(n, 3)} />)}</span>;
}

export function ThreadList({ all, now, locale, category, categoryLabel, limit }: { all: Post[]; now: string; locale: Locale; category?: string; categoryLabel?: string; limit?: number }) {
  const C = COPY[locale];
  const summaries = summarizeThreads(all, now, category ? (post) => post.category === category : undefined).slice(0, limit);
  if (!summaries.length) return null;
  return (
    <section className="ccx-sec" aria-label={category ? C.inCategory(categoryLabel ?? category) : C.threads}>
      <header className="ccx-h"><span className="ccx-k">{category ? C.inCategory(categoryLabel ?? category) : C.threads}</span><span className="ccx-hint">{C.threadsHint}</span></header>
      <ol className="ccx-threads">
        {summaries.map((summary) => {
          const latest = localizedPost(summary.posts[0], locale);
          const first = summary.posts[summary.posts.length - 1];
          return (
            <li key={summary.key} className="ccx-thread" data-state={summary.state}>
              <span className="ccx-state">{C.state[summary.state]}</span>
              <div>
                <b className="ccx-title">{threadName(summary.key, locale)}</b>
                <span className="ccx-m">{C.threadMeta(summary.posts.length, short(locale, first.date), short(locale, latest.date))}</span>
                <Link className="ccx-last" href={href(locale, latest)}>{latest.title}</Link>
              </div>
              <Spark months={summary.months} label={C.sparkLabel} />
            </li>
          );
        })}
      </ol>
    </section>
  );
}

export function DiscoveryGrid({ all, now, locale, category, categoryLabel }: { all: Post[]; now: string; locale: Locale; category?: string; categoryLabel?: string }) {
  const C = COPY[locale];
  const within = category ? (post: Post) => post.category === category : undefined;
  const hubs = hubPosts(all, 3, within);
  const hubList = (
    <ol className="ccx-hubs">
      {hubs.map(({ post, inbound }) => {
        const p = localizedPost(post, locale);
        return <li key={p.slug}><Link href={href(locale, p)}><b className="ccx-title">{p.title}</b><span className="ccx-m">{C.inbound(inbound)}</span></Link></li>;
      })}
    </ol>
  );
  if (category) {
    return hubs.length ? <section className="ccx-sec ccx-catgrid"><span className="ccx-k">{C.hubsIn(categoryLabel ?? category)}</span>{hubList}</section> : null;
  }
  const tags = locale === 'ko' ? freshTags(all, now) : [];
  const sorted = [...all].sort((a, b) => b.date.localeCompare(a.date));
  const recent = (['소설', '낙서'] as const)
    .map((cat) => sorted.find((post) => post.category === cat && !post.title.includes('사칭')))
    .filter((post): post is Post => Boolean(post))
    .map((post) => localizedPost(post, locale));
  return (
    <section className="ccx-sec ccx-grid">
      <div><span className="ccx-k">{C.hubs}</span>{hubList}</div>
      <div>
        {tags.length > 0 && <><span className="ccx-k">{C.fresh}</span><p className="ccx-tags">{tags.map((tag) => <span key={tag}>#{tag}</span>)}</p></>}
        {recent.length > 0 && <span className={`ccx-k${tags.length ? ' ccx-k2' : ''}`}>{C.recent}</span>}
        {recent.map((post) => (
          <Link key={post.slug} className="ccx-small" href={href(locale, post)}><b className="ccx-title">{post.title}</b><span className="ccx-m">{short(locale, post.date)}</span></Link>
        ))}
      </div>
    </section>
  );
}
