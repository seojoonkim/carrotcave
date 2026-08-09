import Link from 'next/link';
import SiteHeader from '@/components/SiteHeader';
import { interviews } from '@/data/interviews';

export default function VoicesPage() {
  return <main><SiteHeader />
    <section className="voices-hero"><p><span>ARCHIVE 05</span> PUBLIC CONVERSATIONS / KOREAN EDITION</p><h1>목소리<br /><em>VOICES</em></h1><div><b>직접 묻지 않았더라도,<br />좋은 대화는 다시 읽힐 수 있습니다.</b><p>프론티어 기술 리더들의 공개 인터뷰를 선별하고 번역해 다시 읽기 좋게 정리한 아카이브입니다. 실제 발언과 번역, 편집자 요약과 검증 사실을 구분합니다.</p></div></section>
    <section className="voices-list">{interviews.map((item, index) => <Link key={item.slug} href={`/voices/${item.slug}`} className="voice-card"><span>0{index + 1}</span><div><p>{item.eyebrow}</p><h2>{item.name}</h2><h3>{item.title}</h3><p>{item.description}</p><dl><div><dt>러닝타임</dt><dd>{item.duration}</dd></div><div><dt>구성</dt><dd>{item.chapters} CHAPTERS</dd></div><div><dt>번역 전사</dt><dd>{item.segments.toLocaleString()} SEGMENTS</dd></div></dl></div><b>OPEN FIELD NOTE ↗</b></Link>)}</section>
    <footer className="cc-footer"><b>CARROT CAVE / VOICES</b><Link href="/">전체 아카이브로 돌아가기</Link></footer>
  </main>;
}
