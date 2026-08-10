import Link from 'next/link';
import Image from 'next/image';
import SiteHeader from '@/components/SiteHeader';
import AxisRail, { axisNotes, axisOf, editorialAxes } from '@/components/AxisRail';
import { posts, Post } from '@/data/posts';

const wallPatterns = [
  'portal', 'index', 'portrait', 'quote',
  'compact', 'landscape', 'index', 'deep',
  'quote', 'compact', 'portrait', 'index',
] as const;

function WallCard({ post, index }: { post: Post; index: number }) {
  const wallPattern = wallPatterns[index % wallPatterns.length];
  const hasImage = Boolean(post.mediaUrls?.[0]);
  const pattern = hasImage || !['portal', 'portrait', 'landscape'].includes(wallPattern)
    ? wallPattern
    : index % 2 === 0 ? 'quote' : 'deep';
  const number = String(index + 1).padStart(3, '0');
  const showSummary = hasImage || ['portal', 'quote', 'deep', 'landscape'].includes(pattern);

  return (
    <Link
      className={`wall-card wall-card--actual-${pattern}${hasImage ? ' wall-card--with-image' : ''}`}
      data-axis={axisOf(post)}
      href={`/posts/${post.slug}`}
    >
      {hasImage && (
        <Image
          className="wall-card__image"
          src={post.mediaUrls![0]}
          alt=""
          width={900}
          height={650}
          sizes="(max-width: 520px) 100vw, (max-width: 900px) 66vw, 58vw"
          priority={index < 4}
        />
      )}
      <div className="wall-card__body">
        <div className="wall-card__meta">
          <span>{number}</span>
          <span>{axisOf(post)}</span>
          <time dateTime={post.date}>{post.date.replaceAll('-', '.')}</time>
        </div>
        <h2>{post.title}</h2>
        {showSummary && <p>{post.summary}</p>}
        <span className="wall-card__door" aria-hidden="true">ENTER ↗</span>
      </div>
    </Link>
  );
}

export default async function Home({ searchParams }: { searchParams: Promise<{ section?: string }> }) {
  const { section } = await searchParams;
  const active = editorialAxes.includes(section as typeof editorialAxes[number]) ? section as typeof editorialAxes[number] : undefined;
  const visiblePosts = active ? posts.filter((post) => axisOf(post) === active) : posts;

  return (
    <main>
      <SiteHeader />
      <AxisRail active={active} />

      <section className="wall-shell" aria-labelledby="wall-heading">
        <header className="wall-heading">
          <div>
            <p>{active ? `SECTION / ${active}` : 'THE CAVE WALL / NEWEST FIRST'}</p>
            <h1 id="wall-heading">{active ? axisNotes[active] : '모든 기록은 서로 다른 입구입니다.'}</h1>
          </div>
          <span>{visiblePosts.length} ENTRIES</span>
        </header>
        {visiblePosts.length ? (
          <div className="editorial-wall">
            {visiblePosts.map((post, index) => <WallCard key={post.slug} post={post} index={index} />)}
          </div>
        ) : <p className="archive-empty">이 분류에 공개된 기록이 아직 없습니다.</p>}
      </section>

      <footer className="cc-footer"><b>CARROT CAVE</b><p>글은 Telegram 토끼굴과 동기화됩니다.</p><a href="https://t.me/carrotcave">@carrotcave ↗</a></footer>
    </main>
  );
}
