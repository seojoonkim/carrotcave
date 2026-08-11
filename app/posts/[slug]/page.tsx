import { notFound } from 'next/navigation';
import Link from 'next/link';
import { posts, getPostBySlug, getRelatedPosts, Post } from '@/data/posts';
import DepthBadge from '@/components/DepthBadge';
import TimelineView from '@/components/TimelineView';
import KnowledgeGraphWrapper from '@/components/KnowledgeGraphWrapper';
import AutoPlayVideo from '@/components/AutoPlayVideo';
import TweetEmbed from '@/components/TweetEmbed';
import SiteHeader from '@/components/SiteHeader';
import { axisDestinationLabel, axisOf } from '@/components/AxisRail';
import relationsData from '@/data/relations.json';

export async function generateStaticParams() {
  return posts.map((post) => ({ slug: post.slug }));
}

function stripTrailingReactionSignature(content: string) {
  return content.replace(/(?:^|\n)\s*(?:\p{Extended_Pictographic}[\uFE0F\u200D\p{Extended_Pictographic}]*\s*\d+\s*)+\s*$/u, '').trimEnd();
}

function renderContent(content: string, relatedPosts: Post[]) {
  const lines = content.split('\n');

  return lines.map((line, i) => {
    if (!line.trim()) return <br key={i} />;

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

function getScoreColor(score: number): string {
  if (score >= 90) return '#D4922A';
  if (score >= 70) return '#8A7A5E';
  return '#5A4A3E';
}

export default async function PostPage({ params }: PostPageProps) {
  const { slug } = await params;
  const post = getPostBySlug(slug);

  if (!post) notFound();

  // AI 연관도 데이터 로드 (relations.json)
  const relationsMap = relationsData as Record<string, Array<{ slug: string; score: number }>>;
  const aiRelations = relationsMap[slug] || [];

  // AI 연관도 기반 related 포스트 (없으면 기존 태그 기반 fallback)
  const aiRelatedPosts = aiRelations
    .map((r) => {
      const p = posts.find((po) => po.slug === r.slug);
      return p ? { ...p, score: r.score } : null;
    })
    .filter(Boolean) as (Post & { score: number })[];

  const related = aiRelatedPosts.length > 0 ? aiRelatedPosts : getRelatedPosts(post).map((p) => ({ ...p, score: 0 }));

  // 그래프용 포스트 메타 목록
  const postsMeta = posts.map((p) => ({ slug: p.slug, title: p.title }));

  const sameTagPosts = posts.filter(
    (p) =>
      p.slug !== post.slug &&
      p.tags.some((t) => post.tags.includes(t))
  ).slice(0, 4);

  const topTag = post.tags[0] || '';

  return (
    <div className="post-reader-page min-h-screen">
      <SiteHeader readingTitle={post.title} readingMeta={post.category.replace(/^[^\p{L}]+/u, '')} />

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
          {renderContent(stripTrailingReactionSignature(post.content), related)}
        </div>

        {/* videos rendered at top — see above */}

        {/* Tags */}
        <div
          className="flex flex-wrap"
          style={{
            gap: '0.5rem',
            marginTop: '2rem',
            paddingTop: '2rem',
            borderTop: '1px solid rgba(212,146,42,0.12)',
          }}
        >
          {post.tags.map((tag) => (
            <span
              key={tag}
              className="rounded-full text-xs"
              style={{
                background: 'rgba(212,146,42,0.05)',
                border: '1px solid rgba(212,146,42,0.15)',
                color: 'rgba(240,228,204,0.45)',
                padding: '0.25rem 0.625rem',
              }}
            >
              #{tag}
            </span>
          ))}
        </div>

        {/* Telegram reactions */}
        <div
          className="flex items-center text-sm"
          style={{ marginTop: '1.5rem', gap: '0.75rem', color: 'rgba(240,228,204,0.3)' }}
        >
          <span>텔레그램 반응</span>
          <a
            href={post.telegramMsgId ? `https://t.me/carrotcave/${post.telegramMsgId}` : 'https://t.me/carrotcave'}
            target="_blank"
            rel="noopener noreferrer"
            className="ml-auto text-xs hover-amber"
            style={{ color: 'rgba(212,146,42,0.55)' }}
          >
            채널에서 보기 →
          </a>
        </div>

        {/* Timeline */}
        {sameTagPosts.length > 1 && (
          <div
            style={{
              marginTop: '2.5rem',
              paddingTop: '2rem',
              borderTop: '1px solid rgba(212,146,42,0.12)',
            }}
          >
            <TimelineView
              posts={[post, ...sameTagPosts]}
              tag={topTag}
            />
          </div>
        )}

        {/* Related posts — AI 연관도 */}
        {related.length > 0 && (
          <div
            style={{
              marginTop: '2.5rem',
              paddingTop: '2rem',
              borderTop: '1px solid rgba(212,146,42,0.12)',
            }}
          >
            <div style={{ display: 'flex', alignItems: 'baseline', marginBottom: '1rem', gap: '0.5rem' }}>
              <h2
                className="text-sm flex items-center"
                style={{
                  gap: '0.5rem',
                  color: 'rgba(240,228,204,0.45)',
                  fontFamily: "var(--font-sans), 'Noto Sans KR', sans-serif",
                  fontWeight: 300,
                }}
              >
                <span style={{ color: 'rgba(212,146,42,0.5)' }}>∿</span>
                연관 글
              </h2>
              {aiRelations.length > 0 && (
                <span
                  style={{
                    fontSize: '10px',
                    color: 'rgba(212,146,42,0.4)',
                    fontFamily: "var(--font-sans), 'Noto Sans KR', sans-serif",
                    fontWeight: 300,
                  }}
                >
                  AI가 분석한 연관도
                </span>
              )}
            </div>
            <div style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem' }}>
              {related.map((r) => (
                <Link
                  key={r.slug}
                  href={`/posts/${r.slug}`}
                  className="block rounded-xl card-hover-border"
                  style={{
                    background: '#0D1826',
                    border: '1px solid rgba(212,146,42,0.1)',
                    padding: '1rem',
                    position: 'relative',
                  }}
                >
                  <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', gap: '0.75rem' }}>
                    <div style={{ flex: 1, minWidth: 0 }}>
                      <div
                        className="text-sm font-medium"
                        style={{
                          color: 'rgba(240,228,204,0.8)',
                          marginBottom: '0.25rem',
                          fontFamily: "var(--font-serif), 'Noto Serif KR', serif",
                        }}
                      >
                        {r.title}
                      </div>
                      <div
                        className="text-xs line-clamp-2"
                        style={{ color: 'rgba(240,228,204,0.38)', marginBottom: '0.5rem' }}
                      >
                        {r.summary}
                      </div>
                      <div className="flex items-center" style={{ gap: '0.5rem' }}>
                        <DepthBadge depth={r.depth} />
                        <span
                          className="text-xs"
                          style={{
                            color: 'rgba(240,228,204,0.28)',
                            fontFamily: "var(--font-sans), 'Noto Sans KR', sans-serif",
                            fontWeight: 300,
                          }}
                        >
                          {r.category}
                        </span>
                      </div>
                    </div>
                    {r.score > 0 && (
                      <div
                        style={{
                          flexShrink: 0,
                          display: 'flex',
                          flexDirection: 'column',
                          alignItems: 'center',
                          justifyContent: 'center',
                          borderRadius: '6px',
                          padding: '4px 8px',
                          border: `1px solid ${getScoreColor(r.score)}40`,
                          background: `${getScoreColor(r.score)}12`,
                          minWidth: '44px',
                        }}
                      >
                        <span
                          style={{
                            fontSize: '13px',
                            fontWeight: 600,
                            color: getScoreColor(r.score),
                            lineHeight: 1.2,
                            fontFamily: "var(--font-sans), 'Noto Sans KR', sans-serif",
                          }}
                        >
                          {r.score}%
                        </span>
                        <span
                          style={{
                            fontSize: '9px',
                            color: `${getScoreColor(r.score)}99`,
                            fontFamily: "var(--font-sans), 'Noto Sans KR', sans-serif",
                            letterSpacing: '0.02em',
                          }}
                        >
                          연관도
                        </span>
                      </div>
                    )}
                  </div>
                </Link>
              ))}
            </div>
          </div>
        )}

        {/* 지식 그래프 */}
        {aiRelations.length > 0 && (
          <div
            style={{
              marginTop: '2.5rem',
              paddingTop: '2rem',
              borderTop: '1px solid rgba(212,146,42,0.12)',
            }}
          >
            <h2
              className="text-sm flex items-center"
              style={{
                marginBottom: '1rem',
                gap: '0.5rem',
                color: 'rgba(240,228,204,0.45)',
                fontFamily: "var(--font-sans), 'Noto Sans KR', sans-serif",
                fontWeight: 300,
              }}
            >
              <span style={{ color: 'rgba(212,146,42,0.5)' }}>⬡</span>
              지식 그래프
            </h2>
            <div
              className="rounded-xl"
              style={{
                background: '#0D1826',
                border: '1px solid rgba(212,146,42,0.1)',
                padding: '0.5rem',
                overflow: 'hidden',
              }}
            >
              <KnowledgeGraphWrapper
                currentSlug={post.slug}
                relations={aiRelations}
                posts={postsMeta}
              />
            </div>
          </div>
        )}

        {/* Back */}
        <div style={{ marginTop: '2.5rem', textAlign: 'center' }}>
          <Link
            href={`/?section=${encodeURIComponent(axisOf(post))}`}
            className="inline-flex items-center text-sm hover-amber"
            style={{ color: 'rgba(212,146,42,0.55)', gap: '0.5rem' }}
          >
            {axisDestinationLabel(post)}
          </Link>
        </div>
      </article>
    </div>
  );
}
