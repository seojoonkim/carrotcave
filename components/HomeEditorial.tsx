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
    more: (n: number) => `${n}편 더 보기`,
    less: '접기',
    hubs: '처음 왔다면',
    hubsIn: (cat: string) => `${cat}, 여기서부터`,
    inbound: (n: number) => `다른 글 ${n}편이 이어짐`,
  },
  en: {
    threads: 'Questions still being dug',
    inCategory: (cat: string) => `Threads in ${cat}`,
    threadShort: (n: number, last: string) => `${n} pieces · latest ${last}`,
    more: (n: number) => `${n} more`,
    less: 'Show less',
    hubs: 'New here?',
    hubsIn: (cat: string) => `Start ${cat} here`,
    inbound: (n: number) => `${n} pieces lead here`,
  },
} as const;

const short = (locale: Locale, date: string) => (locale === 'ko' ? `${Number(date.slice(5, 7))}.${Number(date.slice(8, 10))}` : formatDate(locale, date));
const href = (locale: Locale, post: Post) => localePath(locale, `/posts/${post.slug}`);

const THREAD_PREVIEW = 3;

function ThreadPost({ post, locale }: { post: Post; locale: Locale }) {
  const p = localizedPost(post, locale);
  return (
    <li>
      <Link className="ccx-tpost" href={href(locale, p)}>
        <span className="ccx-tpost__t">{p.title}</span>
        <time className="ccx-tpost__d" dateTime={p.date}>{short(locale, p.date)}</time>
      </Link>
    </li>
  );
}

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
          const head = summary.posts.slice(0, THREAD_PREVIEW);
          const rest = summary.posts.slice(THREAD_PREVIEW);
          const name = threadName(summary.key, locale);
          return (
            <li key={summary.key} className="ccx-thread" data-state={summary.state}>
              <div className="ccx-thead">
                <h3 className="ccx-title">{name}</h3>
                <span className="ccx-m">{C.threadShort(summary.posts.length, short(locale, summary.posts[0].date))}</span>
              </div>
              <ol className="ccx-tposts" aria-label={name}>
                {head.map((post) => <ThreadPost key={post.slug} post={post} locale={locale} />)}
              </ol>
              {rest.length ? (
                <details className="ccx-more">
                  <summary><span className="ccx-more__open">{C.more(rest.length)}</span><span className="ccx-more__close">{C.less}</span></summary>
                  <ol className="ccx-tposts" start={THREAD_PREVIEW + 1}>
                    {rest.map((post) => <ThreadPost key={post.slug} post={post} locale={locale} />)}
                  </ol>
                </details>
              ) : null}
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
