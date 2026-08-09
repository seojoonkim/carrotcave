import Link from 'next/link';
import Image from 'next/image';
import SiteHeader from '@/components/SiteHeader';
import { posts, Post } from '@/data/posts';
import { interviews } from '@/data/interviews';

const axes = ['탐험', '빌딩', '낙서', '소설'] as const;
const axisNotes: Record<string, string> = {
  탐험: '기술과 시장, 낯선 미래를 오래 들여다본 기록',
  빌딩: '직접 만들고 부딪히며 남긴 개발과 조직의 기록',
  낙서: '아직 완성되지 않은 생각, 관찰과 짧은 메모',
  소설: '사실 밖으로 걸어나가 가능한 세계를 시험하는 글',
};

function axisOf(post: Post) {
  return post.category.replace(/^[^\p{L}]+/u, '');
}

function PostRow({ post, index }: { post: Post; index: number }) {
  return (
    <Link className="archive-row" href={`/posts/${post.slug}`}>
      <span className="archive-number">{String(index + 1).padStart(2, '0')}</span>
      <div className="archive-copy">
        <p>{axisOf(post)} · {post.date.replaceAll('-', '.')}</p>
        <h2>{post.title}</h2>
        <span>{post.summary}</span>
      </div>
      {post.mediaUrls?.[0] ? (
        <Image className="archive-thumb" src={post.mediaUrls[0]} alt="" width={240} height={150} />
      ) : <span className="archive-arrow" aria-hidden="true">↗</span>}
    </Link>
  );
}

export default async function Home({ searchParams }: { searchParams: Promise<{ section?: string }> }) {
  const { section } = await searchParams;
  const active = axes.includes(section as typeof axes[number]) ? section : undefined;
  const visiblePosts = active ? posts.filter((post) => axisOf(post) === active) : posts;
  const featured = visiblePosts[0];

  return (
    <main>
      <SiteHeader />
      <section className="cc-hero">
        <p className="cc-kicker"><span>PERSONAL ARCHIVE</span> SIMON KIM · SEOUL / EVERYWHERE</p>
        <div className="cc-hero-grid">
          <div>
            <h1>토끼를 따라왔는데,<br /><em>생각이 길을 잃었습니다.</em></h1>
            <p>Followed the rabbit. Lost in thought.</p>
          </div>
          <div className="cc-manifesto">
            <b>CARROT CAVE</b>
            <p>기술, 사람, 시장과 아직 오지 않은 세계를 탐험합니다. 완성된 답보다 오래 남은 질문을 모읍니다.</p>
            <span>{posts.length} WRITINGS · {interviews.length} VOICE ARCHIVE</span>
          </div>
        </div>
      </section>

      <section className="axis-grid" aria-label="편집 축">
        {axes.map((axis, index) => {
          const count = posts.filter((post) => axisOf(post) === axis).length;
          return <Link key={axis} className={active === axis ? 'active' : ''} href={`/?section=${axis}`}><small>0{index + 1}</small><h2>{axis}</h2><p>{axisNotes[axis]}</p><span>{count} NOTES</span></Link>;
        })}
        <Link href="/voices"><small>05</small><h2>목소리</h2><p>공개 인터뷰를 선별하고 번역해 다시 읽기 좋게 정리한 아카이브</p><span>{interviews.length} FIELD NOTE</span></Link>
      </section>

      <section className="archive-shell">
        <header className="archive-heading">
          <div><p>{active ? `SECTION / ${active}` : 'LATEST FIELD NOTES'}</p><h2>{active ? axisNotes[active] : '최근 기록'}</h2></div>
          {active && <Link href="/">전체 기록 보기</Link>}
        </header>
        {featured ? <Link className="featured-note" href={`/posts/${featured.slug}`}>
          <div><p>NEWEST / {axisOf(featured)}</p><h2>{featured.title}</h2><span>{featured.summary}</span><b>READ NOTE ↗</b></div>
          {featured.mediaUrls?.[0] && <Image src={featured.mediaUrls[0]} alt="" width={720} height={440} priority />}
        </Link> : <p className="archive-empty">이 분류에 공개된 기록이 아직 없습니다.</p>}
        <div className="archive-list">{visiblePosts.slice(featured ? 1 : 0).map((post, index) => <PostRow key={post.slug} post={post} index={index} />)}</div>
      </section>

      <footer className="cc-footer"><b>CARROT CAVE</b><p>글은 Telegram 토끼굴과 동기화됩니다.</p><a href="https://t.me/carrotcave">@carrotcave ↗</a></footer>
    </main>
  );
}
