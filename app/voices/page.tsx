import SiteHeader from '@/components/SiteHeader';
import AxisRail from '@/components/AxisRail';
import EditorialCard from '@/components/EditorialCard';
import SiteFooter from '@/components/SiteFooter';
import { interviews } from '@/data/interviews';

export default function VoicesPage() {
  return (
    <main>
      <SiteHeader />
      <AxisRail active="목소리" />

      <section className="wall-shell voices-wall" aria-labelledby="wall-heading">
        <header className="wall-heading">
          <div>
            <p>SECTION / 목소리</p>
            <h1 id="wall-heading">좋은 대화를 다시 읽을 수 있도록 남겨둡니다.</h1>
          </div>
          <span>{interviews.length} ENTRIES</span>
        </header>
        <div className="editorial-wall editorial-wall--voices">
          {interviews.map((item, index) => (
            <EditorialCard
              key={item.slug}
              href={`/voices/${item.slug}`}
              date={item.sourcePublishedAt}
              axis="목소리"
              title={`${item.name} · ${item.title}`}
              summary={item.summary}
              imageUrl={item.thumbnailUrl}
              className="wall-card--voice"
              priority={index === 0}
            />
          ))}
        </div>
      </section>

      <SiteFooter />
    </main>
  );
}
