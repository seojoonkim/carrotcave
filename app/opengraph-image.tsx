import { siteName } from '@/lib/social-metadata';
import { ogCard, OG_SIZE } from '@/lib/og-card';

export const size = OG_SIZE;
export const contentType = 'image/png';
export const alt = `${siteName} · 토끼를 따라 더 깊이`;

export default async function Image() {
  return ogCard({ kicker: '탐험 · 빌딩 · 낙서 · 소설 · 목소리', title: '토끼를 따라 더 깊이', summary: '기술, 사람, 시장과 미래에 관한 기록.' });
}
