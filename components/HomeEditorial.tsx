import Image from 'next/image';
import Link from 'next/link';
import type { Post } from '@/data/posts';
import { formatDate, localePath, type Locale } from '@/lib/i18n';
import { localizedPost } from '@/lib/i18n-content';
import { hubPosts, summarizeThreads, threadAround, threadName, threadPreviews, threadQuestion, threadsOf, latestDate } from '@/lib/threads';
import { archiveImageUrl } from '@/lib/social-metadata';
import { EDITORIAL_CARD_FALLBACK_IMAGE } from '@/components/EditorialCard';

const COPY = {
  ko: {
    threads: '계속 파는 질문',
    threadsWhy: '한 편으로 답이 끝나지 않아 계속 이어 쓰는 질문들이에요. 새 글이 붙은 질문이 위로 올라와요.',
    inCategory: (cat: string) => `${cat} 안의 줄기`,
    threadShort: (n: number, last: string) => `${n}편 · 최근 ${last}`,
    more: (n: number) => `${n}편 더 보기`,
    less: '접기',
    hubs: '처음 왔다면',
    hubsIn: (cat: string) => `${cat}, 여기서부터`,
    hubsWhy: (cat: string, n: number) => `${cat} 글 ${n}편 가운데, 뒤에 나온 글들이 가장 자주 다시 꺼내 쓴 글이에요. 이 글부터 읽으면 나머지가 서로 이어져 보여요.`,
    inbound: (n: number) => `이 글을 이어받은 글 ${n}편`,
    inboundLatest: (title: string, rest: number) => rest > 0 ? `최근: ${title} 외 ${rest}편` : `최근: ${title}`,
    inboundOpen: '이어받은 글 보기',
    inboundClose: '접기',
    inPost: '이 글이 이어가는 질문',
    here: '지금 읽은 글',
    newer: '다음 기록',
    older: '앞 기록',
  },
  en: {
    threads: 'Questions still being dug',
    threadsWhy: 'Questions one piece could not settle, so I keep writing about them. The one with the newest piece rises to the top.',
    inCategory: (cat: string) => `Threads in ${cat}`,
    threadShort: (n: number, last: string) => `${n} pieces · latest ${last}`,
    more: (n: number) => `${n} more`,
    less: 'Show less',
    hubs: 'New here?',
    hubsIn: (cat: string) => `Start ${cat} here`,
    hubsWhy: (cat: string, n: number) => `Of ${n} ${cat} pieces, these are the ones later writing returns to most. Start here and the rest connect.`,
    inbound: (n: number) => `${n} ${n === 1 ? 'follow-up' : 'follow-ups'}`,
    inboundLatest: (title: string, rest: number) => rest > 0 ? `Latest: ${title} + ${rest} more` : `Latest: ${title}`,
    inboundOpen: 'See which pieces',
    inboundClose: 'Show less',
    inPost: 'The question this piece keeps digging',
    here: 'You just read this',
    newer: 'Next record',
    older: 'Earlier record',
  },
} as const;

const short = (locale: Locale, date: string) => formatDate(locale, date);
const href = (locale: Locale, post: Post) => localePath(locale, `/posts/${post.slug}`);

const THREAD_PREVIEW = 3;

/** Every post list on the home page shows a thumbnail; posts without media fall back to the sketch card. */
function Thumb({ post, className, sizes }: { post: Post; className: string; sizes: string }) {
  const src = archiveImageUrl(post);
  return (
    <span className={`${className}${src ? '' : ` ${className}--sketch`}`} aria-hidden="true">
      <Image src={src ?? EDITORIAL_CARD_FALLBACK_IMAGE} alt="" width={480} height={300} sizes={sizes} />
    </span>
  );
}

/** 줄기 안에서 지금 글 바로 앞(더 오래된)·바로 뒤(더 새로운) 기록 표시 — 디자인 검수 아이디어 2 (2026-10-27) */
type Neighbor = 'newer' | 'older';

function ThreadPost({ post, locale, current, rel }: { post: Post; locale: Locale; current?: boolean; rel?: Neighbor }) {
  const p = localizedPost(post, locale);
  return (
    <li>
      <Link className="ccx-tpost" href={href(locale, p)} aria-current={current ? 'page' : undefined}>
        <Thumb post={post} className="ccx-tpost__img" sizes="96px" />
        <span className="ccx-tpost__t">{p.title}</span>
        {/* <time> must always hold an ISO date (verify-dates gate); the "you just read" label is a plain span */}
        {current
          ? <span className="ccx-tpost__d ccx-tpost__here">{COPY[locale].here}</span>
          : rel
            ? <span className="ccx-tpost__d ccx-tpost__nb" data-rel={rel}><span className="ccx-tpost__rel">{COPY[locale][rel]}</span> <time dateTime={p.date}>{short(locale, p.date)}</time></span>
            : <time className="ccx-tpost__d" dateTime={p.date}>{short(locale, p.date)}</time>}
      </Link>
    </li>
  );
}

/**
 * 2026-10-13 (Simon): 계속 파는 질문은 메인이 아니라, 그 질문에 속한 글을 다 읽은 뒤에만 보인다.
 * 지금 글을 줄기 안에 표시하고 앞뒤 글을 보여준다. 줄기에 속하지 않은 글에서는 아무것도 그리지 않는다.
 */
export function PostThreads({ post, all, locale }: { post: Post; all: Post[]; locale: Locale }) {
  const C = COPY[locale];
  const keys = threadsOf(post);
  if (!keys.length) return null;
  const summaries = summarizeThreads(all, latestDate(all))
    .filter((summary) => keys.includes(summary.key) && summary.posts.length > 1);
  if (!summaries.length) return null;
  return (
    <section className="ccx-sec ccx-post-threads" aria-label={C.inPost}>
      <span className="ccx-k">{C.inPost}</span>
      <ol className="ccx-threads">
        {summaries.map((summary) => {
          const name = threadName(summary.key, locale);
          const { head, rest } = threadAround(summary.posts, post.slug, THREAD_PREVIEW);
          const at = summary.posts.findIndex((item) => item.slug === post.slug);
          const relOf = (slug: string): Neighbor | undefined =>
            summary.posts[at - 1]?.slug === slug ? 'newer' : summary.posts[at + 1]?.slug === slug ? 'older' : undefined;
          return (
            <li key={summary.key} className="ccx-thread" data-state={summary.state}>
              <div className="ccx-thead">
                <h3 className="ccx-title">{name}</h3>
                <p className="ccx-q">{threadQuestion(summary.key, locale)}</p>
                <span className="ccx-m">{C.threadShort(summary.posts.length, short(locale, summary.posts[0].date))}</span>
              </div>
              <ol className={`ccx-tposts${rest.length ? ' ccx-tposts--cont' : ''}`} aria-label={name}>
                {head.map((item) => <ThreadPost key={item.slug} post={item} locale={locale} current={item.slug === post.slug} rel={relOf(item.slug)} />)}
              </ol>
              {rest.length ? (
                <details className="ccx-more">
                  <summary><span className="ccx-more__open">{C.more(rest.length)}</span><span className="ccx-more__close">{C.less}</span></summary>
                  <ol className="ccx-tposts ccx-tposts--cont">
                    {rest.map((item) => <ThreadPost key={item.slug} post={item} locale={locale} />)}
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

export function ThreadList({ all, now, locale, category, categoryLabel, limit }: { all: Post[]; now: string; locale: Locale; category?: string; categoryLabel?: string; limit?: number }) {
  const C = COPY[locale];
  const summaries = summarizeThreads(all, now, category ? (post) => post.category === category : undefined).slice(0, limit);
  if (!summaries.length) return null;
  const label = category ? C.inCategory(categoryLabel ?? category) : C.threads;
  return (
    <section className="ccx-sec" aria-label={label}>
      <span className="ccx-k">{label}</span>
      {!category && <p className="ccx-why">{C.threadsWhy}</p>}
      <ol className="ccx-threads">
        {threadPreviews(summaries, THREAD_PREVIEW).map(({ summary, head, rest }) => {
          const name = threadName(summary.key, locale);
          return (
            <li key={summary.key} className="ccx-thread" data-state={summary.state}>
              <div className="ccx-thead">
                <h3 className="ccx-title">{name}</h3>
                <p className="ccx-q">{threadQuestion(summary.key, locale)}</p>
                <span className="ccx-m">{C.threadShort(summary.posts.length, short(locale, summary.posts[0].date))}</span>
              </div>
              <ol className={`ccx-tposts${rest.length ? ' ccx-tposts--cont' : ''}`} aria-label={name}>
                {head.map((post) => <ThreadPost key={post.slug} post={post} locale={locale} />)}
              </ol>
              {rest.length ? (
                <details className="ccx-more">
                  <summary><span className="ccx-more__open">{C.more(rest.length)}</span><span className="ccx-more__close">{C.less}</span></summary>
                  <ol className="ccx-tposts ccx-tposts--cont" start={THREAD_PREVIEW + 1}>
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
      <p className="ccx-why">{C.hubsWhy(categoryLabel ?? category, all.filter((post) => post.category === category).length)}</p>
      <ol className="ccx-hubs">
        {hubs.map(({ post, inbound, from }) => {
          const p = localizedPost(post, locale);
          const latest = localizedPost(from[0], locale);
          return (
            <li key={p.slug} className="ccx-hub">
              <Link className="ccx-hub__main" href={href(locale, p)}>
                <Thumb post={post} className="ccx-hub__img" sizes="(max-width: 640px) 112px, 340px" />
                <span className="ccx-hub__body">
                  <b className="ccx-title">{p.title}</b>
                  <span className="ccx-m">{C.inbound(inbound)}</span>
                </span>
              </Link>
              <details className="ccx-more ccx-hub__from">
                <summary><span className="ccx-more__open">{C.inboundLatest(latest.title, inbound - 1)}</span><span className="ccx-more__close">{C.inboundClose}</span></summary>
                <ol className="ccx-tposts" aria-label={C.inbound(inbound)}>
                  {from.map((item) => <ThreadPost key={item.slug} post={item} locale={locale} />)}
                </ol>
              </details>
            </li>
          );
        })}
      </ol>
    </section>
  );
}
