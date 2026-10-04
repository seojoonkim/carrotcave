import Link from 'next/link';
import AxisRailInstant from './AxisRailInstant';
import { posts, Post } from '@/data/posts';
import { interviews } from '@/data/interviews';
import { axisHref, axisLabel, localePath, t, type Locale } from '@/lib/i18n';

export const editorialAxes = ['탐험', '빌딩', '낙서', '소설'] as const;
export type EditorialAxis = typeof editorialAxes[number] | '목소리';

export const axisNotes: Record<typeof editorialAxes[number], string> = {
  탐험: '기술과 시장, 낯선 미래',
  빌딩: '직접 만들고 부딪힌 기록',
  낙서: '완성 전의 생각과 관찰',
  소설: '사실 밖의 가능한 세계',
};

export const axisMood: Record<EditorialAxis | '전체', string> = { 전체: 'all', 탐험: 'explore', 빌딩: 'build', 낙서: 'doodle', 소설: 'fiction', 목소리: 'voices' };

export function axisOf(post: Post) {
  return post.category;
}

export function axisDestinationLabel(post: Post) {
  const axis = axisOf(post);
  const finalCode = axis.charCodeAt(axis.length - 1) - 0xac00;
  const jongseong = finalCode >= 0 && finalCode <= 11171 ? finalCode % 28 : 0;
  const particle = jongseong === 0 || jongseong === 8 ? '로' : '으로';
  return `${post.category}${particle} 돌아가기`;
}

export default function AxisRail({ active, locale = 'ko' }: { active?: EditorialAxis; locale?: Locale }) {
  const L = t(locale);
  return (
    <nav className="axis-rail" aria-label={L.axisRailAria}>
      <div className="axis-rail__inner">
      <Link prefetch data-mood="all" className={!active ? 'active' : ''} href={localePath(locale, '/')} aria-current={!active ? 'page' : undefined}>
        <b>{axisLabel(locale, '전체')}<i className="axis-rail__carrot" aria-hidden="true" /></b><span>{posts.length + interviews.length}</span>
      </Link>
      {editorialAxes.map((axis) => (
        <Link
          prefetch
          key={axis}
          data-mood={axisMood[axis]}
          className={active === axis ? 'active' : ''}
          href={axisHref(locale, axis)}
          aria-current={active === axis ? 'page' : undefined}
          title={L.axisNotes[axis]}
        >
          <b>{axisLabel(locale, axis)}<i className="axis-rail__carrot" aria-hidden="true" /></b><span>{posts.filter((post) => axisOf(post) === axis).length}</span>
        </Link>
      ))}
      <Link prefetch data-mood="voices" className={active === '목소리' ? 'active' : ''} href={localePath(locale, '/voices')} aria-current={active === '목소리' ? 'page' : undefined}>
        <b>{axisLabel(locale, '목소리')}<i className="axis-rail__carrot" aria-hidden="true" /></b><span>{interviews.length}</span>
      </Link>
      </div>
      <AxisRailInstant />
    </nav>
  );
}
