import Link from 'next/link';
import Image from 'next/image';
import SiteHeader from '@/components/SiteHeader';
import { posts, Post } from '@/data/posts';
import { interviews } from '@/data/interviews';

const axes = ['탐험', '빌딩', '낙서', '소설'] as const;
const axisNotes: Record<string, string> = {
  탐험: '기술과 시장, 낯선 미래',
  빌딩: '직접 만들고 부딪힌 기록',
  낙서: '완성 전의 생각과 관찰',
  소설: '사실 밖의 가능한 세계',
};

const wallPatterns = [
  'portal', 'index', 'portrait', 'quote',
  'compact', 'landscape', 'index', 'deep',
  'quote', 'compact', 'portrait', 'index',
] as const;

function axisOf(post: Post) {
  return post.category.replace(/^[^\p{L}]+/u, '');
}

function WallCard({ post, index }: { post: Post; index: number }) {
  const wallPattern = wallPatterns[index % wallPatterns.length];
  const hasImage = Boolean(post.mediaUrls?.[0]);
  const pattern = hasImage || !['portal', 'portrait', 'landscape'].includes(wallPattern)
    ? wallPattern
    : index % 2 === 0 ? 'quote' : 'deep';
  const number = String(index + 1).padStart(3, '0');
  const showSummary = ['portal', 'quote', 'deep', 'landscape'].includes(pattern);

  return (
    <Link
      className={`wall-card wall-card--actual-${pattern}`}
      data-axis={axisOf(post)}
      href={`/posts/${post.slug}`}
    >
      {hasImage && ['portal', 'portrait', 'landscape'].includes(pattern) && (
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
  const active = axes.includes(section as typeof axes[number]) ? section : undefined;
  const visiblePosts = active ? posts.filter((post) => axisOf(post) === active) : posts;

  return (
    <main>
      <SiteHeader />

      <section className="cc-intro">
        <div>
          <p><span>PERSONAL ARCHIVE</span> SIMON KIM · SEOUL / EVERYWHERE</p>
          <h1>토끼를 따라왔는데, <em>생각이 길을 잃었습니다.</em></h1>
        </div>
        <div className="cc-intro__note">
          <p>기술, 사람, 시장과 아직 오지 않은 세계를 탐험합니다. 완성된 답보다 오래 남은 질문을 모읍니다.</p>
          <span>{posts.length} WRITINGS · {interviews.length} VOICE ARCHIVE</span>
        </div>
      </section>

      <nav className="axis-rail" aria-label="편집 축">
        <Link className={!active ? 'active' : ''} href="/" aria-current={!active ? 'page' : undefined}>
          <small>00</small><b>전체</b><span>{posts.length}</span>
        </Link>
        {axes.map((axis, index) => {
          const count = posts.filter((post) => axisOf(post) === axis).length;
          return (
            <Link
              key={axis}
              className={active === axis ? 'active' : ''}
              href={`/?section=${axis}`}
              aria-current={active === axis ? 'page' : undefined}
              title={axisNotes[axis]}
            >
              <small>0{index + 1}</small><b>{axis}</b><span>{count}</span>
            </Link>
          );
        })}
        <Link href="/voices"><small>05</small><b>목소리</b><span>{interviews.length}</span></Link>
      </nav>

      <section className="wall-shell" aria-labelledby="wall-heading">
        <header className="wall-heading">
          <div>
            <p>{active ? `SECTION / ${active}` : 'THE CAVE WALL / NEWEST FIRST'}</p>
            <h2 id="wall-heading">{active ? axisNotes[active] : '모든 기록은 서로 다른 입구입니다.'}</h2>
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
