import SiteHeader from '@/components/SiteHeader';
import AxisRail, { axisNotes, axisOf, editorialAxes } from '@/components/AxisRail';
import EditorialCard from '@/components/EditorialCard';
import SiteFooter from '@/components/SiteFooter';
import CaveJourneyScene from '@/components/CaveJourneyScene';
import { posts, Post } from '@/data/posts';
import { interviews, InterviewArchive } from '@/data/interviews';
import ArchiveSearch from '@/components/ArchiveSearch';
import { normalizeQuery, searchArchive } from '@/lib/search/archive-search';
import { archiveImageUrl } from '@/lib/social-metadata';

function WallCard({ post, index, rhythm }: { post: Post; index: number; rhythm: number }) {
  const imageUrl = archiveImageUrl(post);
  const hasImage = Boolean(imageUrl);

  return (
    <EditorialCard
      href={`/posts/${post.slug}`}
      date={post.date}
      axis={axisOf(post)}
      title={post.title}
      summary={post.summary}
      imageUrl={imageUrl}
      className={`wall-card--uniform${hasImage ? '' : ' wall-card--generated'}`}
      priority={index < 4}
      rhythm={rhythm}
    />
  );
}

function VoiceWallCard({ interview, index, rhythm }: { interview: InterviewArchive; index: number; rhythm: number }) {
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
      rhythm={rhythm}
    />
  );
}

export default async function Home({ searchParams }: { searchParams: Promise<{ section?: string; q?: string }> }) {
  const { section, q } = await searchParams;
  const active = editorialAxes.includes(section as typeof editorialAxes[number]) ? section as typeof editorialAxes[number] : undefined;
  const displayQuery = active || typeof q !== 'string' ? '' : q.trim();
  const query = normalizeQuery(displayQuery);
  const visiblePosts = (active ? posts.filter((post) => axisOf(post) === active) : [...posts])
    .sort((a, b) => b.date.localeCompare(a.date) || ((b.telegramMsgId ?? Number(b.id)) || 0) - ((a.telegramMsgId ?? Number(a.id)) || 0));
  const allEntries = active
    ? visiblePosts.map((post) => ({ kind: 'post' as const, date: post.date, post }))
    : [
        ...visiblePosts.map((post) => ({ kind: 'post' as const, date: post.date, post })),
        ...interviews.map((interview) => ({ kind: 'voice' as const, date: interview.sourcePublishedAt, interview })),
      ].sort((a, b) => b.date.localeCompare(a.date));
  const entryByKey = new Map(allEntries.map(entry => [
    `${entry.kind}:${entry.kind === 'post' ? entry.post.slug : entry.interview.slug}`,
    entry,
  ]));
  const visibleEntries = query
    ? searchArchive(query).flatMap(result => {
        const entry = entryByKey.get(`${result.kind}:${result.slug}`);
        return entry ? [entry] : [];
      })
    : allEntries;
  const journeyStep = query ? Number.POSITIVE_INFINITY : active ? Math.max(8, Math.ceil(visibleEntries.length / 3)) : 19;

  return (
    <main>
      <SiteHeader />
      <AxisRail active={active} />

      <section className="wall-shell" aria-labelledby="wall-heading">
        {!active && <ArchiveSearch query={query} displayQuery={displayQuery} statusId="archive-search-status" />}
        <header className="wall-heading">
          <div>
            <p>{active ? `SECTION / ${active}` : 'THE CAVE WALL / NEWEST FIRST'}</p>
            <h1 id="wall-heading" className="wall-heading__menu-title">
              {active ? axisNotes[active] : '모든 기록은 서로 다른 입구입니다.'}
            </h1>
          </div>
          <span>{visibleEntries.length} ENTRIES</span>
        </header>
        {!active && (
          <p id="archive-search-status" className="archive-search__status" role="status" aria-live="polite">
            {query ? `‘${displayQuery}’ 검색 결과 ${visibleEntries.length}건` : ''}
          </p>
        )}
        {visibleEntries.length ? (
          <div className="editorial-wall">
            {visibleEntries.map((entry, index) => {
              const card = entry.kind === 'post'
                ? <WallCard key={`post-${entry.post.slug}`} post={entry.post} index={index} rhythm={index % 4} />
                : <VoiceWallCard key={`voice-${entry.interview.slug}`} interview={entry.interview} index={index} rhythm={index % 4} />;
              const depth = Math.floor((index + 1) / journeyStep);
              const showDivider = (index + 1) % journeyStep === 0 && index < visibleEntries.length - 1 && depth <= 5;

              return [
                card,
                showDivider ? (
                  <aside className="cave-depth-divider" data-depth={depth} key={`depth-${depth}`} aria-label={`토끼굴 심도 ${depth}`}>
                    <span className="cave-depth-divider__label">DEPTH 0{depth}</span>
                    <CaveJourneyScene depth={depth} />
                    <span className="cave-depth-divider__note">당근의 흔적을 따라 더 깊이</span>
                  </aside>
                ) : null,
              ];
            })}
          </div>
        ) : <p className="archive-empty">{query ? '검색 결과가 없습니다.' : '이 분류에 공개된 기록이 아직 없습니다.'}</p>}
      </section>

      <SiteFooter />
    </main>
  );
}
