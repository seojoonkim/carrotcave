import { notFound } from 'next/navigation';
import Link from 'next/link';
import { interviews, getInterview } from '@/data/interviews';

export function generateStaticParams() { return interviews.map(({ slug }) => ({ slug })); }

export default async function VoiceReader({ params }: { params: Promise<{ slug: string }> }) {
  const { slug } = await params;
  const interview = getInterview(slug);
  if (!interview) notFound();
  return <main className="voice-reader-shell">
    <header className="voice-reader-header">
      <nav className="voice-reader-nav" aria-label="CARROT CAVE와 목소리 탐색">
        <Link className="voice-reader-brand" href="/">CARROT CAVE</Link>
        <Link className="voice-reader-back" href="/voices">목소리 목록</Link>
      </nav>
      <span className="voice-reader-context"><b>{interview.name}</b><i aria-hidden="true">/</i>{interview.title}</span>
      <a className="voice-reader-source" href={interview.sourceUrl} target="_blank" rel="noreferrer">원본 ↗</a>
    </header>
    <iframe className="voice-reader-frame" src={interview.embedPath} title={`${interview.name} ${interview.title}`} />
  </main>;
}
