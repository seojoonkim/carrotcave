import type { Metadata } from 'next';
import { notFound } from 'next/navigation';
import Link from 'next/link';
import { siteName } from '@/lib/social-metadata';
import { posts, getPostBySlug, depthLabel } from '@/data/posts';
import CaveConstellation from '@/components/CaveConstellation';
import AutoPlayVideo from '@/components/AutoPlayVideo';
import TweetEmbed from '@/components/TweetEmbed';
import YouTubeEmbed from '@/components/YouTubeEmbed';
import LinkCard from '@/components/LinkCard';
import linkPreviews from '@/data/link-previews.json';
import { INLINE_URL_RE, cleanUrl, findPreviewBlocks, normalizeTitle, prettyUrl, standaloneLinkOf, unwrapTelegramLinkPreview, youTubeIdOf, type LinkPreview, type PreviewBlock } from '@/lib/link-preview';
import SiteHeader from '@/components/SiteHeader';
import SiteFooter from '@/components/SiteFooter';
import { axisMood } from '@/components/AxisRail';
import PostShareButton from '@/components/PostShareButton';
import { axisDestinationLabel, axisOf } from '@/components/AxisRail';
import ontologyIndex from '@/data/ontology/index.json';
import { buildTopRecommendations } from '@/lib/ontology/build-subgraph';
import type { OntologyIndex } from '@/lib/ontology/types';
import PostGallery from '@/components/PostGallery';

export async function generateStaticParams() {
  return posts.map((post) => ({ slug: post.slug }));
}

export async function generateMetadata({ params }: { params: Promise<{ slug: string }> }): Promise<Metadata> {
  const { slug } = await params;
  const post = getPostBySlug(slug);
  if (!post) return {};
  const title = post.title;
  const canonical = `/posts/${post.slug}`;
  return {
    title,
    description: post.summary,
    alternates: { canonical },
    openGraph: {
      title,
      description: post.summary,
      url: canonical,
      siteName,
      locale: 'ko_KR',
      type: 'article',
      publishedTime: post.date,
    },
    twitter: {
      card: 'summary_large_image',
      title,
      description: post.summary,
    },
  };
}

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
    .toLocaleLowerCase('ko-KR');
}

function stripLeadingDuplicateTitle(content: string, title: string) {
  const lines = content.split('\n');
  const firstContentLine = lines.findIndex((line) => line.trim());
  if (firstContentLine < 0) return content;

  const firstLine = lines[firstContentLine].normalize('NFKC').trim().replace(/^#{1,6}\s+/, '');
  const titlePrefix = title.normalize('NFKC').trim().replace(/^#{1,6}\s+/, '');
  if (normalizeTitleLine(firstLine) === normalizeTitleLine(titlePrefix)) {
    lines.splice(firstContentLine, 1);
  } else if (firstLine.toLocaleLowerCase('ko-KR').startsWith(titlePrefix.toLocaleLowerCase('ko-KR'))) {
    const remainder = firstLine.slice(titlePrefix.length);
    if (!/^(?:\s+|[.!?。！？:：]\s+)/.test(remainder)) return content;
    lines[firstContentLine] = remainder.replace(/^[.!?。！？:：]?\s+/, '');
  } else {
    return content;
  }

  while (lines.length > 0 && !lines[0].trim()) lines.shift();
  return lines.join('\n');
}

function renderContent(content: string) {
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
        return <YouTubeEmbed key={i} id={youTubeId} url={standalone.url} title={preview?.title} author={preview?.author} thumbnail={preview?.thumbnail} />;
      }
      return <LinkCard key={i} url={standalone.url} label={standalone.label} preview={preview} />;
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

    return (
      <p key={i}>
        {renderInline(line)}
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

interface PostPageProps {
  params: Promise<{ slug: string }>;
}

export default async function PostPage({ params }: PostPageProps) {
  const { slug } = await params;
  const post = getPostBySlug(slug);

  if (!post) notFound();

  const axisPosts = posts
    .filter((item) => item.category === post.category)
    .sort((a, b) => b.date.localeCompare(a.date) || ((b.telegramMsgId ?? 0) - (a.telegramMsgId ?? 0)));
  const nextPost = axisPosts[axisPosts.findIndex((item) => item.slug === post.slug) + 1];

  const rawConstellation = buildTopRecommendations(slug, ontologyIndex as OntologyIndex);
  const postDetails = new Map(posts.map((item) => [item.slug, {
    summary: item.summary,
    imageUrl: item.mediaUrls?.find((url) => /^\/media\/[^?#]+\.(?:avif|gif|jpe?g|png|webp)(?:[?#].*)?$/i.test(url)),
  }]));
  const constellation = rawConstellation
    ? {
        ...rawConstellation,
        nodes: rawConstellation.nodes.map((node) => ({ ...node, ...postDetails.get(node.slug) })),
      }
    : null;

  return (
    <div className="post-reader-page min-h-screen">
      <SiteHeader
        readingTitle={post.title}
        readingMeta={post.category.replace(/^[^\p{L}]+/u, '')}
        readingBackHref={`/?section=${encodeURIComponent(post.category)}`}
        readingBackLabel={`${post.category} 목록으로 돌아가기`}
      />

      <article className="post-reader-article" data-mood={axisMood[post.category as keyof typeof axisMood] ?? 'all'}>
        <header className="post-reader-header">
          <h1>
            {post.title}
          </h1>
          <p className="post-reader-meta">
            <span className="post-reader-meta__axis">{post.category.replace(/^[^\p{L}]+/u, '')}</span>
            <span aria-hidden="true">·</span>
            <span>{depthLabel(post.depth)}</span>
            <span aria-hidden="true">·</span>
            <time dateTime={post.date}>{post.date.replaceAll('-', '.')}</time>
          </p>
        </header>

        {/* Media section — images (top, skip if video exists) */}
        {post.mediaUrls && post.mediaUrls.length > 0 && !(post.videoUrls && post.videoUrls.length > 0) && (
          post.mediaUrls.length > 1 ? (
            <PostGallery urls={post.mediaUrls} />
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
                  🎬 영상 보기 (텔레그램)
                </a>
              )
            ))}
          </div>
        )}

        {/* Summary removed — content speaks for itself */}

        {/* Content */}
        <div className="post-content">
          {renderContent(stripLeadingDuplicateTitle(stripTrailingReactionSignature(post.content), post.title))}
        </div>

        <section className="cc-reading-end" aria-label="다 읽은 뒤">
          <div className="cc-reading-end__mark" aria-hidden="true" />

          {nextPost && (
            <Link className="post-next" href={`/posts/${nextPost.slug}`}>
              <span className="post-next__label">{post.category.replace(/^[^\p{L}]+/u, '')}의 다음 글</span>
              <span className="post-next__title">{nextPost.title}</span>
              <span className="post-next__arrow" aria-hidden="true">→</span>
            </Link>
          )}

          <nav className="post-reader-actions post-reader-actions--after-content" aria-label="글 이동">
            <Link
              href={`/?section=${encodeURIComponent(axisOf(post))}`}
              className="post-reader-action"
            >
              <svg viewBox="0 0 20 20" aria-hidden="true"><path d="M16 10H4m0 0 5-5m-5 5 5 5" /></svg>
              <span className="post-reader-action__long">{axisDestinationLabel(post)}</span>
              <span className="post-reader-action__short">돌아가기</span>
            </Link>
            <PostShareButton title={post.title} path={`/posts/${post.slug}`} />
            <a
              href={post.telegramMsgId ? `https://t.me/carrotcave/${post.telegramMsgId}` : 'https://t.me/carrotcave'}
              target="_blank"
              rel="noopener noreferrer"
              className="post-reader-action post-reader-action--telegram"
            >
              <svg viewBox="0 0 20 20" aria-hidden="true"><path d="M17.5 3.5 2.8 9.2c-.7.3-.7.8.1 1l3.7 1.2 1.4 4.3c.2.5.5.6.9.2l2-1.9 3.9 2.9c.5.3.9.1 1-.5l2.3-11.4c.2-.8-.3-1.2-.6-1.5ZM7 11.2l7.4-4.7" /></svg>
              <span className="post-reader-action__long">텔레그램 채널에서 보기</span>
              <span className="post-reader-action__short">텔레그램</span>
            </a>
          </nav>

          {constellation && (
            <div className="cave-constellation-shell cave-constellation-shell--after-actions">
              <p className="cave-constellation-kicker">DOWN THE RABBIT HOLE</p>
              <h2 className="cave-constellation-heading">다음으로 읽기 좋은 글 3개</h2>
              <p className="cave-constellation-intro">지금 읽은 글과 생각이 이어지는 순서대로 골랐습니다.</p>
              <CaveConstellation subgraph={constellation} />
            </div>
          )}
        </section>

      </article>
      <SiteFooter mood={(axisMood[post.category as keyof typeof axisMood] ?? 'all') as 'all'} />
    </div>
  );
}
