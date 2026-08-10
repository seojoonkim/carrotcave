import SiteHeader from '@/components/SiteHeader';
import AxisRail, { axisNotes, axisOf, editorialAxes } from '@/components/AxisRail';
import EditorialCard from '@/components/EditorialCard';
import { posts, Post } from '@/data/posts';

function WallCard({ post, index }: { post: Post; index: number }) {
  const hasImage = Boolean(post.mediaUrls?.[0]);

  return (
    <EditorialCard
      href={`/posts/${post.slug}`}
      date={post.date}
      axis={axisOf(post)}
      title={post.title}
      summary={post.summary}
      imageUrl={post.mediaUrls?.[0]}
      className={`wall-card--uniform${hasImage ? '' : ' wall-card--generated'}`}
      priority={index < 4}
    />
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
