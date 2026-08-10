import { notFound } from 'next/navigation';
import { interviews, getInterview } from '@/data/interviews';

export function generateStaticParams() { return interviews.map(({ slug }) => ({ slug })); }

export default async function VoiceReader({ params }: { params: Promise<{ slug: string }> }) {
  const { slug } = await params;
  const interview = getInterview(slug);
  if (!interview) notFound();
  return <main className="voice-reader-shell">
    <iframe className="voice-reader-frame" src={interview.embedPath} title={`${interview.name} ${interview.title}`} />
  </main>;
}
