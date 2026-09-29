import { getInterview, interviews } from '@/data/interviews';
import { siteName } from '@/lib/social-metadata';
import { dateEn, localImage, ogCard, OG_SIZE, TAGLINE_EN } from '@/lib/og-card';

export const size = OG_SIZE;
export const contentType = 'image/png';
export const alt = `${siteName} · Voices`;

export function generateStaticParams() {
  return interviews.map(({ slug }) => ({ slug }));
}

// English-only card: VOICES, the speaker's English name and the source's English topic line.
export default async function Image({ params }: { params: Promise<{ slug: string }> }) {
  const { slug } = await params;
  const voice = getInterview(slug);
  if (!voice) return ogCard({ label: 'VOICES', title: TAGLINE_EN });
  return ogCard({ label: 'VOICES', meta: dateEn(voice.sourcePublishedAt), title: voice.nameEn ?? TAGLINE_EN, sub: voice.eyebrow, image: await localImage(voice.thumbnailUrl) });
}
