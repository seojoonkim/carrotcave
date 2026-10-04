import SiteHeader from '@/components/SiteHeader';
import AxisRail, { axisNotes, axisOf, editorialAxes } from '@/components/AxisRail';
import ArchiveList, { type ArchiveEntry } from '@/components/ArchiveList';
import SiteFooter from '@/components/SiteFooter';
import { axisMood } from '@/components/AxisRail';
import { posts } from '@/data/posts';
import { interviews } from '@/data/interviews';
import { archiveImageUrl } from '@/lib/social-metadata';
import { postVideo, voiceVideo } from '@/lib/archive-video';

export default async function Home({ searchParams }: { searchParams: Promise<{ section?: string }> }) {
  const { section } = await searchParams;
  const active = editorialAxes.includes(section as typeof editorialAxes[number]) ? section as typeof editorialAxes[number] : undefined;
  const visiblePosts = (active ? posts.filter((post) => axisOf(post) === active) : [...posts])
    .sort((a, b) => b.date.localeCompare(a.date) || ((b.telegramMsgId ?? Number(b.id)) || 0) - ((a.telegramMsgId ?? Number(a.id)) || 0));
  const postEntries: ArchiveEntry[] = visiblePosts.map((post) => ({
    key: `post-${post.slug}`,
    href: `/posts/${post.slug}`,
    date: post.date,
    axis: axisOf(post),
    title: post.title,
    summary: post.summary,
    imageUrl: archiveImageUrl(post),
    video: postVideo(post),
  }));
  const voiceEntries: ArchiveEntry[] = interviews.map((interview) => ({
    key: `voice-${interview.slug}`,
    href: `/voices/${interview.slug}`,
    date: interview.sourcePublishedAt,
    axis: '목소리',
    title: `${interview.name} · ${interview.title}`,
    summary: interview.summary,
    imageUrl: interview.thumbnailUrl,
    video: voiceVideo(interview),
  }));
  const visibleEntries = active
    ? postEntries
    : [...postEntries, ...voiceEntries].sort((a, b) => b.date.localeCompare(a.date));

  return (
    <main>
      <SiteHeader><AxisRail active={active} /></SiteHeader>
      <div className="cc-header-axis-mobile"><AxisRail active={active} /></div>

      <section className="wall-shell" data-mood={axisMood[active ?? '전체']} aria-labelledby="wall-heading">
        <header className="wall-heading wall-heading--bridge">
          <p className="wall-heading__kicker"><span className="wall-heading__axis">{active ?? '전체'}</span><span className="wall-heading__count">{visibleEntries.length}편</span></p>
          <h1 id="wall-heading" className="wall-heading__menu-title">
            {active ? axisNotes[active] : '모든 기록은 서로 다른 입구입니다.'}
          </h1>
        </header>
        {visibleEntries.length ? (
          <ArchiveList key={active ?? 'all'} entries={visibleEntries} storageKey={active ?? 'all'} />
        ) : <p className="archive-empty">이 분류에 공개된 기록이 아직 없습니다.</p>}
      </section>

      <SiteFooter mood={axisMood[active ?? '전체'] as 'all'} />
    </main>
  );
}
