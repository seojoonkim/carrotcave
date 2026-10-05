import Link from 'next/link';
import Image from 'next/image';
import { archiveImageUrl } from '@/lib/social-metadata';
import { EDITORIAL_CARD_FALLBACK_IMAGE } from '@/components/EditorialCard';
import { posts, type Post } from '@/data/posts';
import CaveConstellation from '@/components/CaveConstellation';
import AutoPlayVideo from '@/components/AutoPlayVideo';
import TweetEmbed from '@/components/TweetEmbed';
import YouTubeEmbed from '@/components/YouTubeEmbed';
import LinkCard from '@/components/LinkCard';
import linkPreviews from '@/data/link-previews.json';
import { INLINE_URL_RE, cleanUrl, findPreviewBlocks, normalizeTitle, prettyUrl, standaloneLinkOf, unwrapTelegramLinkPreview, youTubeIdOf, type LinkPreview, type PreviewBlock } from '@/lib/link-preview';
import SiteHeader from '@/components/SiteHeader';
import LangToggle from '@/components/LangToggle';
import SiteFooter from '@/components/SiteFooter';
import { axisDestinationLabel, axisMood, axisOf } from '@/components/AxisRail';
import PostShareButton from '@/components/PostShareButton';
import ontologyIndex from '@/data/ontology/index.json';
import { buildTopRecommendations } from '@/lib/ontology/build-subgraph';
import type { OntologyIndex } from '@/lib/ontology/types';
import PostGallery from '@/components/PostGallery';
import { axisHref, axisLabel, depthLabelFor, formatDate, localePath, t, type Locale } from '@/lib/i18n';
import { localizedPost } from '@/lib/i18n-content';
import readingAids from '@/data/reading-aids.json';
import ReadingDepth from '@/components/ReadingDepth';
import { BUDDY_INNER } from '@/lib/brand-svg';

// The reading page for one post, in either language. Korean: /posts/<slug>. English: /en/posts/<slug>.

function stripTrailingReactionSignature(content: string) {
  return content.replace(/(?:^|\n)\s*(?:\p{Extended_Pictographic}[\uFE0F\u200D\p{Extended_Pictographic}]*\s*\d+\s*)+\s*$/u, '').trimEnd();
}

function normalizeTitleLine(value: string) {
  return value
    .normalize('NFKC')
    .trim()
    .replace(/^#{1,6}\s+/, '')
    .replace(/\s+/g, ' ')
    .replace(/[.!?。！？]+$/, '')
    .trim()
    .toLocaleLowerCase();
}

function stripLeadingDuplicateTitle(content: string, title: string) {
  const lines = content.split('\n');
  const firstContentLine = lines.findIndex((line) => line.trim());
  if (firstContentLine < 0) return content;

  const firstLine = lines[firstContentLine].normalize('NFKC').trim().replace(/^#{1,6}\s+/, '');
  const titlePrefix = title.normalize('NFKC').trim().replace(/^#{1,6}\s+/, '');
  if (normalizeTitleLine(firstLine) === normalizeTitleLine(titlePrefix)) {
    lines.splice(firstContentLine, 1);
  } else if (firstLine.toLocaleLowerCase().startsWith(titlePrefix.toLocaleLowerCase())) {
    const remainder = firstLine.slice(titlePrefix.length);
    if (!/^(?:\s+|[.!?。！？:：]\s+)/.test(remainder)) return content;
    lines[firstContentLine] = remainder.replace(/^[.!?。！？:：]?\s+/, '');
  } else {
    return content;
  }

  while (lines.length > 0 && !lines[0].trim()) lines.shift();
  return lines.join('\n');
}

type Aid = { highlights: string[]; takeaways: { text: string; anchor: string }[] };
type Aids = Record<string, { ko: Aid; en: Aid }>;

// Interview posts: lines like "김서준: ..." / "Simon Kim: ...". A post counts as a dialogue only when
// at least two speakers each have two or more turns, so a stray "Note: ..." never turns into a speaker.
const TURN_RE = /^(?:\*\*)?([^\s:：*]{2,12}(?: [A-Z][a-z]+(?:-[a-z]+)?)?)(?:\*\*)?\s?[:：]\s+(.+)$/;
const HOSTS = new Set(['김서준', 'Simon', 'Simon Kim', '서준']);
export function dialogueSpeakers(content: string): string[] {
  const count = new Map<string, number>();
  for (const line of content.split('\n')) {
    const m = line.trim().match(TURN_RE);
    if (m) count.set(m[1], (count.get(m[1]) ?? 0) + 1);
  }
  const speakers = [...count].filter(([, n]) => n >= 2).map(([name]) => name);
  return speakers.length >= 2 ? speakers : [];
}

type Reading = { highlights: string[]; anchors: string[]; speakers: string[] };

// Wrap a verbatim key sentence in <mark>, but only when the cut does not split inline markdown.
function renderWithHighlight(line: string, highlights: string[]) {
  for (const h of highlights) {
    const at = line.indexOf(h);
    if (at < 0) continue;
    const before = line.slice(0, at);
    const after = line.slice(at + h.length);
    const safe = (x: string) => (x.split('**').length - 1) % 2 === 0 && (x.split('`').length - 1) % 2 === 0;
    if (!safe(before) || !safe(h) || /\[[^\]]*$/.test(before)) continue;
    return (
      <>
        {renderInline(before)}
        <mark className="post-key">{renderInline(h)}</mark>
        {renderInline(after)}
      </>
    );
  }
  return renderInline(line);
}

function renderContent(content: string, locale: Locale, reading: Reading = { highlights: [], anchors: [], speakers: [] }) {
  const speakerIndex = new Map(reading.speakers.map((name, k) => [name, k]));
  const anchorIds = new Map<number, string>();
  const lines = unwrapTelegramLinkPreview(content).split('\n');
  const previewMap = linkPreviews as Record<string, LinkPreview>;

  // Telegram link-preview leftovers: hide when a card already shows them, otherwise render one quiet card
  const cardTitles = new Set<string>();
  const linkLines = new Set<number>();
  lines.forEach((line, i) => {
    const hit = standaloneLinkOf(line);
    if (!hit) return;
    linkLines.add(i);
    const t = previewMap[hit.url]?.title;
    if (t) cardTitles.add(normalizeTitle(t.replace(/^GitHub - /, '')));
  });
  const hidden = new Set<number>();
  const staticCards = new Map<number, PreviewBlock>();
  for (const block of findPreviewBlocks(lines)) {
    let prev = block.start - 1;
    while (prev >= 0 && !lines[prev].trim()) prev--;
    const title = normalizeTitle(block.title?.replace(/^GitHub - /, ''));
    const duplicate = linkLines.has(prev) || [...cardTitles].some((t) => t && title && (t.includes(title) || title.includes(t)));
    for (let k = block.start; k <= block.end; k++) hidden.add(k);
    if (!duplicate) staticCards.set(block.start, block);
  }

  return lines.map((line, i) => {
    const staticCard = staticCards.get(i);
    if (staticCard) {
      return (
        <div key={i} className="post-link-card post-link-card--static">
          <span className="post-link-card__body">
            {staticCard.title ? <span className="post-link-card__title">{staticCard.title}</span> : null}
            {staticCard.description ? <span className="post-link-card__desc">{staticCard.description}</span> : null}
            {staticCard.site ? <span className="post-link-card__host">{staticCard.site}</span> : null}
          </span>
        </div>
      );
    }
    if (hidden.has(i)) return null;
    if (!line.trim()) return null;

    if (line.startsWith('### ')) {
      return (
        <h3 key={i}>
          {line.slice(4)}
        </h3>
      );
    }
    if (line.startsWith('## ')) {
      return (
        <h2 key={i}>
          {line.slice(3)}
        </h2>
      );
    }
    if (line.startsWith('# ')) {
      return (
        <h2 key={i}>
          {line.slice(2)}
        </h2>
      );
    }

    // Standalone link on its own line: tweet embed, YouTube thumbnail player, or link card
    const standalone = standaloneLinkOf(line);
    if (standalone) {
      if (standalone.isTweet) return <TweetEmbed key={i} url={standalone.url} />;
      const preview = (linkPreviews as Record<string, LinkPreview>)[standalone.url];
      const youTubeId = youTubeIdOf(standalone.url);
      if (youTubeId) {
        return <YouTubeEmbed key={i} id={youTubeId} url={standalone.url} title={preview?.title} author={preview?.author} thumbnail={preview?.thumbnail} locale={locale} />;
      }
      return <LinkCard key={i} url={standalone.url} label={standalone.label} preview={preview} locale={locale} />;
    }

    if (line.trim() === '---') {
      return <hr key={i} />;
    }

    if (line.startsWith('```')) {
      return null;
    }

    if (line.startsWith('- ') || line.startsWith('* ')) {
      const text = line.slice(2);
      return (
        <li key={i}>
          {renderInline(text)}
        </li>
      );
    }

    const anchorAt = reading.anchors.findIndex((a, k) => a && line.includes(a) && ![...anchorIds.values()].includes(`take-${k + 1}`));
    const id = anchorAt >= 0 ? `take-${anchorAt + 1}` : undefined;
    if (id) anchorIds.set(i, id);

    const turn = speakerIndex.size ? line.trim().match(TURN_RE) : null;
    if (turn && speakerIndex.has(turn[1])) {
      const who = turn[1];
      const host = HOSTS.has(who);
      return (
        <p key={i} id={id} className="post-turn" data-host={host ? 'true' : 'false'} data-voice={speakerIndex.get(who)! % 4}>
          <span className="post-turn__who">
            <span className="post-turn__dot" aria-hidden="true">{[...who][0]}</span>
            {who}
          </span>
          <span className="post-turn__line">{renderWithHighlight(turn[2], reading.highlights)}</span>
        </p>
      );
    }

    return (
      <p key={i} id={id}>
        {renderWithHighlight(line, reading.highlights)}
      </p>
    );
  });
}

function renderInline(text: string) {
  const parts = text.split(/(\*\*[^*]+\*\*|\*[^*]+\*|`[^`]+`|\[[^\]]+\]\([^)]+\))/g);
  return parts.map((part, i) => {
    if (part.startsWith('**') && part.endsWith('**')) {
      return (
        <strong key={i}>
          {part.slice(2, -2)}
        </strong>
      );
    }
    if (part.startsWith('*') && part.endsWith('*') && !part.startsWith('**') && part.length > 2) {
      return (
        <em key={i}>
          {part.slice(1, -1)}
        </em>
      );
    }
    if (part.startsWith('`') && part.endsWith('`')) {
      return (
        <code key={i}>
          {part.slice(1, -1)}
        </code>
      );
    }
    // Markdown link: [text](url)
    const linkMatch = part.match(/^\[([^\]]+)\]\(([^)]+)\)$/);
    if (linkMatch) {
      return (
        <a
          key={i}
          href={linkMatch[2]}
          target="_blank"
          rel="noopener noreferrer"
        >
          {linkMatch[1]}
        </a>
      );
    }
    return <span key={i}>{linkifyBareUrls(part)}</span>;
  });
}

/** Bare URLs inside a sentence become short, readable links (host + path) instead of raw strings. */
function linkifyBareUrls(text: string) {
  if (!/https?:\/\//.test(text)) return text;
  return text.split(INLINE_URL_RE).map((chunk, j) => {
    if (!/^https?:\/\//.test(chunk)) return chunk;
    const url = cleanUrl(chunk);
    const rest = chunk.slice(url.length);
    return (
      <span key={j}>
        <a className="post-inline-url" href={url} target="_blank" rel="noopener noreferrer" title={url}>
          {prettyUrl(url)}
        </a>
        {rest}
      </span>
    );
  });
}

export default function PostView({ post: source, locale }: { post: Post; locale: Locale }) {
  const L = t(locale);
  const post = localizedPost(source, locale);
  const axisName = axisLabel(locale, post.category.replace(/^[^\p{L}]+/u, ''));
  const postHref = (slug: string) => localePath(locale, `/posts/${slug}`);

  const axisPosts = posts
    .filter((item) => item.category === post.category)
    .sort((a, b) => b.date.localeCompare(a.date) || ((b.telegramMsgId ?? 0) - (a.telegramMsgId ?? 0)));
  const nextSource = axisPosts[axisPosts.findIndex((item) => item.slug === post.slug) + 1];
  const nextPost = nextSource ? localizedPost(nextSource, locale) : undefined;

  const aid = (readingAids as Aids)[post.slug]?.[locale];
  const reading: Reading = {
    highlights: aid?.highlights ?? [],
    anchors: aid?.takeaways?.map((x) => x.anchor) ?? [],
    speakers: dialogueSpeakers(post.content),
  };
  const takeaways = aid?.takeaways?.length === 3 ? aid.takeaways : [];

  const rawConstellation = buildTopRecommendations(post.slug, ontologyIndex as OntologyIndex);
  const postDetails = new Map(posts.map((item) => {
    const shown = localizedPost(item, locale);
    return [item.slug, {
      summary: shown.summary,
      ...(locale === 'en' ? { title: shown.title, category: axisLabel(locale, item.category) } : {}),
      imageUrl: item.mediaUrls?.find((url) => /^\/media\/[^?#]+\.(?:avif|gif|jpe?g|png|webp)(?:[?#].*)?$/i.test(url)),
    }];
  }));
  const constellation = rawConstellation
    ? {
        ...rawConstellation,
        nodes: rawConstellation.nodes.map((node) => ({ ...node, ...postDetails.get(node.slug) })),
      }
    : null;

  return (
    <div className="post-reader-page min-h-screen" lang={locale}>
      <SiteHeader
        locale={locale}
        readingTitle={post.title}
        readingMeta={axisName}
        readingBackHref={axisHref(locale, post.category)}
        readingBackLabel={L.backToAxis(axisName)}
      />

      <article className="post-reader-article" data-mood={axisMood[post.category as keyof typeof axisMood] ?? 'all'}>
        <header className="post-reader-header">
          <h1>
            {post.title}
          </h1>
          <div className="post-reader-meta">
            <span className="post-reader-meta__axis">{axisName}</span>
            <span aria-hidden="true">·</span>
            <span>{depthLabelFor(locale, post.depth)}</span>
            <span aria-hidden="true">·</span>
            <time dateTime={post.date}>{formatDate(locale, post.date)}</time>
            <LangToggle locale={locale} variant="inline" />
          </div>
        </header>

        {/* Media section — images (top, skip if video exists) */}
        {post.mediaUrls && post.mediaUrls.length > 0 && !(post.videoUrls && post.videoUrls.length > 0) && (
          post.mediaUrls.length > 1 ? (
            <PostGallery urls={post.mediaUrls} locale={locale} />
          ) : (
            <div
              className="post-media-grid"
              data-count={post.mediaUrls.length}
            >
              <img src={post.mediaUrls[0]} alt="" loading="eager" decoding="async" />
            </div>
          )
        )}

        {/* Media section — videos (top) */}
        {post.videoUrls && post.videoUrls.length > 0 && (
          <div className="post-media-videos">
            {post.videoUrls.map((url, i) => (
              url.startsWith('/') || (url.startsWith('http') && !url.includes('t.me')) ? (
                <AutoPlayVideo key={i} src={url} />
              ) : (
                <a
                  key={i}
                  href={url}
                  target="_blank"
                  rel="noopener noreferrer"
                  style={{
                    display: 'inline-flex',
                    alignItems: 'center',
                    gap: '0.5rem',
                    color: '#D4922A',
                    fontSize: '0.875rem',
                  }}
                >
                  {L.telegramVideo}
                </a>
              )
            ))}
          </div>
        )}

        {/* Summary removed — content speaks for itself */}

        {/* Content */}
        {takeaways.length > 0 && (
          <details className="post-takeaways" open>
            <summary className="post-takeaways__title">{L.takeawaysTitle}</summary>
            <ol className="post-takeaways__list">
              {takeaways.map((item, k) => (
                <li key={k}>
                  <a href={`#take-${k + 1}`} aria-label={`${item.text} — ${L.takeawaysJump}`}>
                    <span className="post-takeaways__num" aria-hidden="true">{k + 1}</span>
                    <span className="post-takeaways__text">{item.text}</span>
                    <span className="post-takeaways__go" aria-hidden="true">↓</span>
                  </a>
                </li>
              ))}
            </ol>
          </details>
        )}

        <div className="post-content" data-dialogue={reading.speakers.length ? 'true' : undefined}>
          {renderContent(stripLeadingDuplicateTitle(stripTrailingReactionSignature(post.content), post.title), locale, reading)}
        </div>

        <section className="cc-reading-end" aria-label={L.readingEndAria}>
          <div className="cc-reading-end__mark" aria-hidden="true" />

          <ReadingDepth slug={post.slug} locale={locale} />

          {nextPost && (
            <Link className="post-next post-next--hole" href={postHref(nextPost.slug)} data-has-image={archiveImageUrl(nextPost) ? 'true' : 'false'}>
              <span className="post-hole__ask">
                <svg className="post-hole__buddy" viewBox="0 0 132 96" aria-hidden="true" focusable="false" dangerouslySetInnerHTML={{ __html: BUDDY_INNER }} />
                <span className="post-hole__bubble">{L.nextHole}</span>
              </span>
              <span className="post-next__thumb" aria-hidden="true">
                <Image src={archiveImageUrl(nextPost) ?? EDITORIAL_CARD_FALLBACK_IMAGE} alt="" width={960} height={600} sizes="(max-width: 600px) 100vw, 680px" />
              </span>
              <span className="post-next__label">{L.nextHoleSub(axisName)}</span>
              <span className="post-next__title">{nextPost.title}</span>
              {nextPost.summary ? <span className="post-hole__summary">{nextPost.summary}</span> : null}
              <span className="post-next__arrow" aria-hidden="true">→</span>
            </Link>
          )}

          <nav className="post-reader-actions post-reader-actions--after-content" aria-label={L.postNavAria}>
            <Link
              href={axisHref(locale, axisOf(post))}
              className="post-reader-action"
            >
              <svg viewBox="0 0 20 20" aria-hidden="true"><path d="M16 10H4m0 0 5-5m-5 5 5 5" /></svg>
              <span className="post-reader-action__long">{locale === 'ko' ? axisDestinationLabel(post) : L.backToAxisLong(axisName)}</span>
              <span className="post-reader-action__short">{L.backToAxisShort}</span>
            </Link>
            <PostShareButton title={post.title} path={postHref(post.slug)} locale={locale} />
            <a
              href={post.telegramMsgId ? `https://t.me/carrotcave/${post.telegramMsgId}` : 'https://t.me/carrotcave'}
              target="_blank"
              rel="noopener noreferrer"
              className="post-reader-action post-reader-action--telegram"
            >
              <svg viewBox="0 0 20 20" aria-hidden="true"><path d="M17.5 3.5 2.8 9.2c-.7.3-.7.8.1 1l3.7 1.2 1.4 4.3c.2.5.5.6.9.2l2-1.9 3.9 2.9c.5.3.9.1 1-.5l2.3-11.4c.2-.8-.3-1.2-.6-1.5ZM7 11.2l7.4-4.7" /></svg>
              <span className="post-reader-action__long">{L.telegramLong}</span>
              <span className="post-reader-action__short">{L.telegramShort}</span>
            </a>
          </nav>

          {constellation && (
            <div className="cave-constellation-shell cave-constellation-shell--after-actions">
              <p className="cave-constellation-kicker">{L.picksKicker}</p>
              <h2 className="cave-constellation-heading">{L.picksHeading}</h2>
              <p className="cave-constellation-intro">{L.picksIntro}</p>
              <CaveConstellation subgraph={constellation} locale={locale} hrefForSlug={postHref} />
            </div>
          )}
        </section>

      </article>
      <SiteFooter locale={locale} mood={(axisMood[post.category as keyof typeof axisMood] ?? 'all') as 'all'} />
    </div>
  );
}
