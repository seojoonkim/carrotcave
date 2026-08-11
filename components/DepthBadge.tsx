'use client';

import { DepthLevel, depthLabel } from '@/data/posts';

interface DepthBadgeProps {
  depth: DepthLevel;
  className?: string;
}

const depthStyle: Record<DepthLevel, { color: string }> = {
  entry: {
    color: '#FFD166',
  },
  mid: {
    color: '#FFB15C',
  },
  deep: {
    color: '#FF8A65',
  },
};

export default function DepthBadge({ depth, className = '' }: DepthBadgeProps) {
  const s = depthStyle[depth];
  return (
    <span
      className={`inline-flex items-center text-xs ${className}`}
      style={{
        color: s.color,
        fontFamily: "var(--font-sans), 'Noto Sans KR', sans-serif",
        fontWeight: 650,
        letterSpacing: '0.02em',
      }}
    >
      {depthLabel(depth)}
    </span>
  );
}
