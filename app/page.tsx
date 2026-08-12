import SiteHeader from '@/components/SiteHeader';
import AxisRail, { axisNotes, axisOf, editorialAxes } from '@/components/AxisRail';
import EditorialCard from '@/components/EditorialCard';
import SiteFooter from '@/components/SiteFooter';
import { posts, Post } from '@/data/posts';
import { interviews, InterviewArchive } from '@/data/interviews';

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

function VoiceWallCard({ interview, index }: { interview: InterviewArchive; index: number }) {
  return (
    <EditorialCard
      href={`/voices/${interview.slug}`}
      date={interview.sourcePublishedAt}
      axis="목소리"
      title={`${interview.name} · ${interview.title}`}
      summary={interview.summary}
      imageUrl={interview.thumbnailUrl}
      className="wall-card--voice"
      priority={index < 4}
    />
  );
}

export default async function Home({ searchParams }: { searchParams: Promise<{ section?: string }> }) {
  const { section } = await searchParams;
  const active = editorialAxes.includes(section as typeof editorialAxes[number]) ? section as typeof editorialAxes[number] : undefined;
  const visiblePosts = (active ? posts.filter((post) => axisOf(post) === active) : [...posts])
    .sort((a, b) => b.date.localeCompare(a.date) || ((b.telegramMsgId ?? Number(b.id)) || 0) - ((a.telegramMsgId ?? Number(a.id)) || 0));
  const visibleEntries = active
    ? visiblePosts.map((post) => ({ kind: 'post' as const, date: post.date, post }))
    : [
        ...visiblePosts.map((post) => ({ kind: 'post' as const, date: post.date, post })),
        ...interviews.map((interview) => ({ kind: 'voice' as const, date: interview.sourcePublishedAt, interview })),
      ].sort((a, b) => b.date.localeCompare(a.date));

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
          <span>{visibleEntries.length} ENTRIES</span>
        </header>
        {visibleEntries.length ? (
          <div className="editorial-wall">
            {visibleEntries.map((entry, index) => entry.kind === 'post'
              ? <WallCard key={`post-${entry.post.slug}`} post={entry.post} index={index} />
              : <VoiceWallCard key={`voice-${entry.interview.slug}`} interview={entry.interview} index={index} />)}
          </div>
        ) : <p className="archive-empty">이 분류에 공개된 기록이 아직 없습니다.</p>}
      </section>

      <SiteFooter />
    </main>
  );
}
