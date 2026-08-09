import { notFound } from 'next/navigation';
import Link from 'next/link';
import { interviews, getInterview } from '@/data/interviews';

export function generateStaticParams() { return interviews.map(({ slug }) => ({ slug })); }

export default async function VoiceReader({ params }: { params: Promise<{ slug: string }> }) {
  const { slug } = await params;
  const interview = getInterview(slug);
  if (!interview) notFound();
  return <main className="voice-reader-shell">
    <header className="voice-reader-header"><Link href="/voices">CARROT CAVE / 목소리</Link><span>{interview.name} · {interview.title}</span><a href={interview.sourceUrl} target="_blank" rel="noreferrer">원본 ↗</a></header>
    <iframe className="voice-reader-frame" src={interview.embedPath} title={`${interview.name} ${interview.title}`} />
  </main>;
}
