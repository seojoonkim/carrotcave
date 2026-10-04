import Link from 'next/link';
import SiteHeader from '@/components/SiteHeader';
import SiteFooter from '@/components/SiteFooter';
import CaveBuddy from '@/components/CaveBuddy';

export default function NotFound() {
  return (
    <main>
      <SiteHeader />
      <section className="cc-lost">
        <p className="cc-lost__code">404</p>
        <CaveBuddy mood="lost">
          <strong>여기는 아직 아무도 파지 않은 굴이에요.</strong>
          <span>토끼가 길을 잃었나 봐요. 입구로 돌아가 볼까요?</span>
        </CaveBuddy>
        <Link className="cc-pill-button" href="/">입구로 돌아가기</Link>
      </section>
      <SiteFooter />
    </main>
  );
}
