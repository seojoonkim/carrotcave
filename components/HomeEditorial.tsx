import Image from 'next/image';
import Link from 'next/link';
import type { Post } from '@/data/posts';
import { formatDate, localePath, type Locale } from '@/lib/i18n';
import { localizedPost } from '@/lib/i18n-content';
import { hubPosts, summarizeThreads, threadName, threadPreviews, threadQuestion } from '@/lib/threads';
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

function ThreadPost({ post, locale }: { post: Post; locale: Locale }) {
  const p = localizedPost(post, locale);
  return (
    <li>
      <Link className="ccx-tpost" href={href(locale, p)}>
        <Thumb post={post} className="ccx-tpost__img" sizes="96px" />
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
