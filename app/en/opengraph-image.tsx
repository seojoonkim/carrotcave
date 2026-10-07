import { siteName } from '@/lib/social-metadata';
import { ogCard, OG_SIZE, TAGLINE_EN } from '@/lib/og-card';

// 2026-10-05: /en, /en/voices and the English 404 had no og:image. app/en/layout.tsx sets its own `openGraph`
// (English locale/description), which replaces the root segment's file-based image. Declaring the image file at
// the /en segment level restores it for every /en page that does not ship its own card.
export const size = OG_SIZE;
export const contentType = 'image/png';
export const alt = `${siteName} · ${TAGLINE_EN}`;

export default async function Image() {
  return ogCard({ label: 'CARROT CAVE', title: TAGLINE_EN, sub: 'Technology, people, markets and the future.' });
}

// Card layout version (changes the og:image ?hash so Facebook/Kakao refetch): crop-safe centered v2, 2026-10-08
