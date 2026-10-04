import SiteHeader from '@/components/SiteHeader';
import AxisRail from '@/components/AxisRail';
import ArchiveList, { type ArchiveEntry } from '@/components/ArchiveList';
import SiteFooter from '@/components/SiteFooter';
import { interviews } from '@/data/interviews';
import { voiceVideo } from '@/lib/archive-video';
import { axisLabel, localePath, t, type Locale } from '@/lib/i18n';
import { localizedVoice } from '@/lib/i18n-content';

export default function VoicesView({ locale }: { locale: Locale }) {
  const L = t(locale);
  const entries: ArchiveEntry[] = interviews.map((source) => {
    const item = localizedVoice(source, locale);
    return {
      key: `voice-${item.slug}`,
      href: localePath(locale, `/voices/${item.slug}`),
      date: item.sourcePublishedAt,
      axis: '목소리',
      title: `${item.name} · ${item.title}`,
      summary: item.summary,
      imageUrl: item.thumbnailUrl,
      video: voiceVideo(item),
    };
  });

  return (
    <main lang={locale}>
      <SiteHeader locale={locale}><AxisRail active="목소리" locale={locale} /></SiteHeader>
      <div className="cc-header-axis-mobile"><AxisRail active="목소리" locale={locale} /></div>

      <section className="wall-shell voices-wall" data-mood="voices" aria-labelledby="wall-heading">
        <header className="wall-heading wall-heading--bridge">
          <p className="wall-heading__kicker"><span className="wall-heading__axis">{axisLabel(locale, '목소리')}</span><span className="wall-heading__count">{L.count(entries.length)}</span></p>
          <h1 id="wall-heading" className="wall-heading__menu-title">{L.wallVoices}</h1>
        </header>
        <ArchiveList entries={entries} storageKey={locale === 'en' ? 'en-voices' : 'voices'} locale={locale} />
      </section>

      <SiteFooter locale={locale} mood="voices" />
    </main>
  );
}
