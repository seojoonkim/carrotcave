import SiteHeader from '@/components/SiteHeader';
import AxisRail, { axisOf, editorialAxes } from '@/components/AxisRail';
import ArchiveList, { type ArchiveEntry } from '@/components/ArchiveList';
import SiteFooter from '@/components/SiteFooter';
import { axisMood } from '@/components/AxisRail';
import { posts } from '@/data/posts';
import { interviews } from '@/data/interviews';
import { archiveImageUrl } from '@/lib/social-metadata';
import { postVideo, voiceVideo } from '@/lib/archive-video';
import { AXIS_FROM_SLUG, axisLabel, localePath, t, type Locale } from '@/lib/i18n';
import { localizedPost, localizedVoice } from '@/lib/i18n-content';

type Axis = typeof editorialAxes[number];

/** ?section= accepts the Korean axis name (탐험) and the English slug (explore) in both languages. */
export function resolveSection(section: string | undefined): Axis | undefined {
  const ko = section ? AXIS_FROM_SLUG[section.toLowerCase()] ?? section : undefined;
  return editorialAxes.includes(ko as Axis) ? ko as Axis : undefined;
}

export default function HomeView({ section, locale }: { section?: string; locale: Locale }) {
  const L = t(locale);
  const active = resolveSection(section);
  const visiblePosts = (active ? posts.filter((post) => axisOf(post) === active) : [...posts])
    .sort((a, b) => b.date.localeCompare(a.date) || ((b.telegramMsgId ?? Number(b.id)) || 0) - ((a.telegramMsgId ?? Number(a.id)) || 0));
  const postEntries: ArchiveEntry[] = visiblePosts.map((source) => {
    const post = localizedPost(source, locale);
    return {
      key: `post-${post.slug}`,
      href: localePath(locale, `/posts/${post.slug}`),
      date: post.date,
      axis: axisOf(post),
      title: post.title,
      summary: post.summary,
      imageUrl: archiveImageUrl(post),
      video: postVideo(post),
    };
  });
  const voiceEntries: ArchiveEntry[] = interviews.map((source) => {
    const interview = localizedVoice(source, locale);
    return {
      key: `voice-${interview.slug}`,
      href: localePath(locale, `/voices/${interview.slug}`),
      date: interview.sourcePublishedAt,
      axis: '목소리',
      title: `${interview.name} · ${interview.title}`,
      summary: interview.summary,
      imageUrl: interview.thumbnailUrl,
      video: voiceVideo(interview),
    };
  });
  const visibleEntries = active
    ? postEntries
    : [...postEntries, ...voiceEntries].sort((a, b) => b.date.localeCompare(a.date));

  return (
    <main lang={locale}>
      <SiteHeader locale={locale}><AxisRail active={active} locale={locale} /></SiteHeader>
      <div className="cc-header-axis-mobile"><AxisRail active={active} locale={locale} /></div>

      <section className="wall-shell" data-mood={axisMood[active ?? '전체']} aria-labelledby="wall-heading">
        <header className="wall-heading wall-heading--bridge">
          <p className="wall-heading__kicker"><span className="wall-heading__axis">{axisLabel(locale, active ?? '전체')}</span><span className="wall-heading__count">{L.count(visibleEntries.length)}</span></p>
          <h1 id="wall-heading" className="wall-heading__menu-title">
            {active ? L.axisNotes[active] : L.wallAll}
          </h1>
        </header>
        {visibleEntries.length ? (
          <ArchiveList key={`${locale}-${active ?? 'all'}`} entries={visibleEntries} storageKey={`${locale === 'en' ? 'en-' : ''}${active ?? 'all'}`} locale={locale} />
        ) : <p className="archive-empty">{L.emptyAxis}</p>}
      </section>

      <SiteFooter locale={locale} mood={axisMood[active ?? '전체'] as 'all'} />
    </main>
  );
}
