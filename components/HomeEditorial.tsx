import Link from 'next/link';
import type { Post } from '@/data/posts';
import { formatDate, localePath, type Locale } from '@/lib/i18n';
import { localizedPost } from '@/lib/i18n-content';
import { hubPosts, summarizeThreads, threadName } from '@/lib/threads';

const COPY = {
  ko: {
    threads: '계속 파는 질문',
    inCategory: (cat: string) => `${cat} 안의 줄기`,
    threadShort: (n: number, last: string) => `${n}편 · 최근 ${last}`,
    hubs: '처음 왔다면',
    hubsIn: (cat: string) => `${cat}, 여기서부터`,
    inbound: (n: number) => `다른 글 ${n}편이 이어짐`,
  },
  en: {
    threads: 'Questions still being dug',
    inCategory: (cat: string) => `Threads in ${cat}`,
    threadShort: (n: number, last: string) => `${n} pieces · latest ${last}`,
    hubs: 'New here?',
    hubsIn: (cat: string) => `Start ${cat} here`,
    inbound: (n: number) => `${n} pieces lead here`,
  },
} as const;

const short = (locale: Locale, date: string) => (locale === 'ko' ? `${Number(date.slice(5, 7))}.${Number(date.slice(8, 10))}` : formatDate(locale, date));
const href = (locale: Locale, post: Post) => localePath(locale, `/posts/${post.slug}`);

export function ThreadList({ all, now, locale, category, categoryLabel, limit }: { all: Post[]; now: string; locale: Locale; category?: string; categoryLabel?: string; limit?: number }) {
  const C = COPY[locale];
  const summaries = summarizeThreads(all, now, category ? (post) => post.category === category : undefined).slice(0, limit);
  if (!summaries.length) return null;
  const label = category ? C.inCategory(categoryLabel ?? category) : C.threads;
  return (
    <section className="ccx-sec" aria-label={label}>
      <span className="ccx-k">{label}</span>
      <ol className="ccx-threads">
        {summaries.map((summary) => {
          const latest = localizedPost(summary.posts[0], locale);
          return (
            <li key={summary.key} className="ccx-thread" data-state={summary.state}>
              <Link className="ccx-threadlink" href={href(locale, latest)}>
                <b className="ccx-title">{threadName(summary.key, locale)}</b>
                <span className="ccx-m">{C.threadShort(summary.posts.length, short(locale, latest.date))}</span>
                <span className="ccx-last">{latest.title}</span>
              </Link>
            </li>
          );
        })}
      </ol>
    </section>
  );
}

/** 카테고리 화면 맨 위: 다른 글이 가장 많이 이어지는 3편 */
export function DiscoveryGrid({ all, locale, category, categoryLabel }: { all: Post[]; locale: Locale; category: string; categoryLabel?: string }) {
  const C = COPY[locale];
  const hubs = hubPosts(all, 3, (post) => post.category === category);
  if (!hubs.length) return null;
  return (
    <section className="ccx-sec ccx-catgrid" aria-label={C.hubsIn(categoryLabel ?? category)}>
      <span className="ccx-k">{C.hubsIn(categoryLabel ?? category)}</span>
      <ol className="ccx-hubs">
        {hubs.map(({ post, inbound }) => {
          const p = localizedPost(post, locale);
          return <li key={p.slug}><Link href={href(locale, p)}><b className="ccx-title">{p.title}</b><span className="ccx-m">{C.inbound(inbound)}</span></Link></li>;
        })}
      </ol>
    </section>
  );
}
