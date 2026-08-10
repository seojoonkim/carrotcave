import Link from 'next/link';
import Image from 'next/image';
import SiteHeader from '@/components/SiteHeader';
import AxisRail from '@/components/AxisRail';
import { interviews } from '@/data/interviews';

export default function VoicesPage() {
  return (
    <main>
      <SiteHeader />
      <AxisRail active="목소리" />

      <section className="wall-shell" aria-labelledby="wall-heading">
        <header className="wall-heading">
          <div>
            <p>SECTION / 목소리</p>
            <h1 id="wall-heading">좋은 대화를 다시 읽을 수 있도록 남겨둡니다.</h1>
          </div>
          <span>{interviews.length} ENTRIES</span>
        </header>
        <div className="editorial-wall editorial-wall--voices">
          {interviews.map((item, index) => (
            <Link
              key={item.slug}
              href={`/voices/${item.slug}`}
              className={`wall-card wall-card--voice${item.thumbnailUrl ? ' wall-card--with-image' : ''}`}
            >
              {item.thumbnailUrl && (
                <Image
                  className="wall-card__image wall-card__image--voice"
                  src={item.thumbnailUrl}
                  alt=""
                  width={658}
                  height={370}
                  sizes="(max-width: 520px) 100vw, 94vw"
                  priority={index === 0}
                />
              )}
              <div className="wall-card__body">
                <div className="wall-card__meta">
                  <span className="wall-card__axis">목소리</span>
                  <span>{item.eyebrow}</span>
                </div>
                <h2>{item.name} · {item.title}</h2>
                <p>{item.description}</p>
                <dl className="wall-card__facts">
                  <div><dt>러닝타임</dt><dd>{item.duration}</dd></div>
                  <div><dt>구성</dt><dd>{item.chapters} CHAPTERS</dd></div>
                  <div><dt>번역 전사</dt><dd>{item.segments.toLocaleString()} SEGMENTS</dd></div>
                </dl>
                <span className="wall-card__door" aria-hidden="true">OPEN FIELD NOTE ↗</span>
              </div>
            </Link>
          ))}
        </div>
      </section>

      <footer className="cc-footer"><b>CARROT CAVE</b><p>글은 Telegram 토끼굴과 동기화됩니다.</p><a href="https://t.me/carrotcave">@carrotcave ↗</a></footer>
    </main>
  );
}
