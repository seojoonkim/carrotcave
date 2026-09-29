import { getInterview, interviews } from '@/data/interviews';
import { siteName } from '@/lib/social-metadata';
import { localImage, ogCard, OG_SIZE } from '@/lib/og-card';

export const size = OG_SIZE;
export const contentType = 'image/png';
export const alt = siteName;

export function generateStaticParams() {
  return interviews.map(({ slug }) => ({ slug }));
}

export default async function Image({ params }: { params: Promise<{ slug: string }> }) {
  const { slug } = await params;
  const voice = getInterview(slug);
  if (!voice) return ogCard({ kicker: '목소리', title: siteName });
  return ogCard({ kicker: '목소리', byline: voice.name, title: voice.title, summary: voice.summary, image: await localImage(voice.thumbnailUrl) });
}
