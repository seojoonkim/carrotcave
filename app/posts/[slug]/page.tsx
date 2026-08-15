import type { Metadata } from 'next';
import { notFound } from 'next/navigation';
import Link from 'next/link';
import { archiveImageUrl, siteName, siteOgImage } from '@/lib/social-metadata';
import { posts, getPostBySlug } from '@/data/posts';
import DepthBadge from '@/components/DepthBadge';
import CaveConstellation from '@/components/CaveConstellation';
import AutoPlayVideo from '@/components/AutoPlayVideo';
import TweetEmbed from '@/components/TweetEmbed';
import SiteHeader from '@/components/SiteHeader';
import SiteFooter from '@/components/SiteFooter';
import PostShareButton from '@/components/PostShareButton';
import { axisDestinationLabel, axisOf } from '@/components/AxisRail';
import ontologyIndex from '@/data/ontology/index.json';
import { buildTopRecommendations } from '@/lib/ontology/build-subgraph';
import type { OntologyIndex } from '@/lib/ontology/types';

export async function generateStaticParams() {
  return posts.map((post) => ({ slug: post.slug }));
}

export async function generateMetadata({ params }: { params: Promise<{ slug: string }> }): Promise<Metadata> {
  const { slug } = await params;
  const post = getPostBySlug(slug);
  if (!post) return {};
  const title = post.title;
  const canonical = `/posts/${post.slug}`;
  const image = archiveImageUrl(post) ?? siteOgImage;
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
      images: [{ url: image, alt: post.title }],
    },
    twitter: {
      card: 'summary_large_image',
      title,
      description: post.summary,
      images: [image],
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
  const lines = content.split('\n');

  return lines.map((line, i) => {
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

    // Twitter/X embed: standalone URL or markdown link on its own line
    const tweetUrlMatch = line.trim().match(/^(?:\[.*?\]\()?(https?:\/\/(?:twitter\.com|x\.com)\/[^/]+\/status\/\d+[^\s)]*)\)?$/);
    if (tweetUrlMatch) {
      return <TweetEmbed key={i} url={tweetUrlMatch[1].replace(/\)$/, '')} />;
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
    return <span key={i}>{part}</span>;
  });
}

interface PostPageProps {
  params: Promise<{ slug: string }>;
}

export default async function PostPage({ params }: PostPageProps) {
  const { slug } = await params;
  const post = getPostBySlug(slug);

  if (!post) notFound();

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

      <article className="post-reader-article">
        <header className="post-reader-header">
        {/* Category */}
        <div className="post-reader-category">
          {post.category.replace(/^[^\p{L}]+/u, '')}
        </div>

        {/* Title */}
        <h1>
          {post.title}
        </h1>

        {/* Meta row */}
        <div className="post-reader-meta flex flex-wrap items-center">
          <DepthBadge depth={post.depth} />
          <span className="text-sm">
            {new Date(post.date).toLocaleDateString('ko-KR', {
              year: 'numeric',
              month: 'long',
              day: 'numeric',
            })}
          </span>
        </div>
        </header>

        {/* Media section — images (top, skip if video exists) */}
        {post.mediaUrls && post.mediaUrls.length > 0 && !(post.videoUrls && post.videoUrls.length > 0) && (
          <div
            className="post-media-grid"
            data-count={post.mediaUrls.length}
            style={{ marginBottom: '2.5rem' }}
          >
            {post.mediaUrls.map((url, i) => (
              <img
                key={i}
                src={url}
                alt=""
                style={{
                  width: '100%',
                  aspectRatio: post.mediaUrls!.length === 1 ? 'auto' : '1 / 1',
                  objectFit: 'cover',
                  borderRadius: '0.5rem',
                  display: 'block',
                }}
              />
            ))}
          </div>
        )}

        {/* Media section — videos (top) */}
        {post.videoUrls && post.videoUrls.length > 0 && (
          <div style={{ marginBottom: '1.5rem', display: 'flex', flexDirection: 'column', gap: '1rem' }}>
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

        <nav className="post-reader-actions post-reader-actions--after-content" aria-label="글 이동">
          <Link
            href={`/?section=${encodeURIComponent(axisOf(post))}`}
            className="post-reader-action"
          >
            <span aria-hidden="true">←</span>
            {axisDestinationLabel(post)}
          </Link>
          <PostShareButton title={post.title} path={`/posts/${post.slug}`} />
          <a
            href={post.telegramMsgId ? `https://t.me/carrotcave/${post.telegramMsgId}` : 'https://t.me/carrotcave'}
            target="_blank"
            rel="noopener noreferrer"
            className="post-reader-action post-reader-action--telegram"
          >
            텔레그램 채널에서 보기
            <span aria-hidden="true">↗</span>
          </a>
        </nav>

        {constellation && (
          <div className="cave-constellation-shell cave-constellation-shell--after-actions">
            <p className="cave-constellation-kicker">CAVE CONSTELLATION</p>
            <h2 className="cave-constellation-heading">다음으로 읽기 좋은 글 3개</h2>
            <p className="cave-constellation-intro">지금 읽은 글과 생각이 이어지는 순서대로 골랐습니다.</p>
            <CaveConstellation subgraph={constellation} />
          </div>
        )}

      </article>
      <SiteFooter />
    </div>
  );
}
