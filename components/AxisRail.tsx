import Link from 'next/link';
import { posts, Post } from '@/data/posts';
import { interviews } from '@/data/interviews';

export const editorialAxes = ['탐험', '빌딩', '낙서', '소설'] as const;
export type EditorialAxis = typeof editorialAxes[number] | '목소리';

export const axisNotes: Record<typeof editorialAxes[number], string> = {
  탐험: '기술과 시장, 낯선 미래',
  빌딩: '직접 만들고 부딪힌 기록',
  낙서: '완성 전의 생각과 관찰',
  소설: '사실 밖의 가능한 세계',
};

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

export default function AxisRail({ active }: { active?: EditorialAxis }) {
  return (
    <nav className="axis-rail" aria-label="편집 축">
      <Link className={!active ? 'active' : ''} href="/" aria-current={!active ? 'page' : undefined}>
        <b>전체</b><span>{posts.length}</span>
      </Link>
      {editorialAxes.map((axis) => (
        <Link
          key={axis}
          className={active === axis ? 'active' : ''}
          href={`/?section=${axis}`}
          aria-current={active === axis ? 'page' : undefined}
          title={axisNotes[axis]}
        >
          <b>{axis}</b><span>{posts.filter((post) => axisOf(post) === axis).length}</span>
        </Link>
      ))}
      <Link className={active === '목소리' ? 'active' : ''} href="/voices" aria-current={active === '목소리' ? 'page' : undefined}>
        <b>목소리</b><span>{interviews.length}</span>
      </Link>
    </nav>
  );
}
