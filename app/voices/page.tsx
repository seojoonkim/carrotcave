import SiteHeader from '@/components/SiteHeader';
import AxisRail from '@/components/AxisRail';
import ArchiveList, { type ArchiveEntry } from '@/components/ArchiveList';
import SiteFooter from '@/components/SiteFooter';
import { interviews } from '@/data/interviews';
import { voiceVideo } from '@/lib/archive-video';

export default function VoicesPage() {
  const entries: ArchiveEntry[] = interviews.map((item) => ({
    key: `voice-${item.slug}`,
    href: `/voices/${item.slug}`,
    date: item.sourcePublishedAt,
    axis: '목소리',
    title: `${item.name} · ${item.title}`,
    summary: item.summary,
    imageUrl: item.thumbnailUrl,
    video: voiceVideo(item),
  }));

  return (
    <main>
      <SiteHeader><AxisRail active="목소리" /></SiteHeader>
      <div className="cc-header-axis-mobile"><AxisRail active="목소리" /></div>

      <section className="wall-shell voices-wall" data-mood="voices" aria-labelledby="wall-heading">
        <header className="wall-heading wall-heading--bridge">
          <span className="wall-heading__axis" aria-hidden="true">목소리</span>
          <h1 id="wall-heading" className="wall-heading__menu-title">좋은 대화를 다시 읽을 수 있도록 남겨둡니다.</h1>
          <span className="wall-heading__count">{entries.length}개의 대화</span>
        </header>
        <ArchiveList entries={entries} storageKey="voices" />
      </section>

      <SiteFooter mood="voices" />
    </main>
  );
}
