import { siteName } from '@/lib/social-metadata';
import { ogCard, OG_SIZE, TAGLINE_EN } from '@/lib/og-card';

export const size = OG_SIZE;
export const contentType = 'image/png';
export const alt = `${siteName} · ${TAGLINE_EN}`;

export default async function Image() {
  return ogCard({ label: 'CARROT CAVE', title: TAGLINE_EN, sub: 'Technology, people, markets and the future.' });
}
