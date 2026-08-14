'use client';

import { useState, useCallback } from 'react';
import Link from 'next/link';
import { Post } from '@/data/posts';
import DepthBadge from './DepthBadge';

interface CardSwipeProps {
  posts: Post[];
}

const categoryShort: Record<string, string> = {
  '탐험': '토끼굴',
  '빌딩': '빌더일지',
  '📡 시그널': '시그널',
  '💭 단상': '단상',
};

export default function CardSwipe({ posts }: CardSwipeProps) {
  const [currentIndex, setCurrentIndex] = useState(0);
  const [dragStartX, setDragStartX] = useState<number | null>(null);
  const [dragDelta, setDragDelta] = useState(0);
  const [isAnimating, setIsAnimating] = useState(false);
  const [enterDir, setEnterDir] = useState<'left' | 'right' | null>(null);

  const goNext = useCallback(() => {
    if (isAnimating || currentIndex >= posts.length - 1) return;
    setIsAnimating(true);
    setEnterDir('left');
    setTimeout(() => {
      setCurrentIndex((i) => i + 1);
      setIsAnimating(false);
      setDragDelta(0);
    }, 220);
  }, [isAnimating, currentIndex, posts.length]);

  const goPrev = useCallback(() => {
    if (isAnimating || currentIndex <= 0) return;
    setIsAnimating(true);
    setEnterDir('right');
    setTimeout(() => {
      setCurrentIndex((i) => i - 1);
      setIsAnimating(false);
      setDragDelta(0);
    }, 220);
  }, [isAnimating, currentIndex]);

  /* ─── Touch handlers ─── */
  const handleTouchStart = (e: React.TouchEvent) => {
    setDragStartX(e.touches[0].clientX);
  };
  const handleTouchMove = (e: React.TouchEvent) => {
    if (dragStartX === null) return;
    setDragDelta(e.touches[0].clientX - dragStartX);
  };
  const handleTouchEnd = () => {
    if (Math.abs(dragDelta) > 55) {
      dragDelta < 0 ? goNext() : goPrev();
    } else {
      setDragDelta(0);
    }
    setDragStartX(null);
  };

  /* ─── Mouse handlers ─── */
  const handleMouseDown = (e: React.MouseEvent) => {
    setDragStartX(e.clientX);
  };
  const handleMouseMove = (e: React.MouseEvent) => {
    if (dragStartX === null) return;
    setDragDelta(e.clientX - dragStartX);
  };
  const handleMouseUp = () => {
    if (Math.abs(dragDelta) > 55) {
      dragDelta < 0 ? goNext() : goPrev();
    } else {
      setDragDelta(0);
    }
    setDragStartX(null);
  };

  const post = posts[currentIndex];
  if (!post) {
    return (
      <div
        className="h-full flex items-center justify-center text-sm"
        style={{
          color: '#8A7A5E',
          fontFamily: "var(--font-sans), 'Noto Sans KR', sans-serif",
          fontWeight: 300,
        }}
      >
        글이 없어요
      </div>
    );
  }

  const liveTransform =
    dragStartX !== null && !isAnimating
      ? `translateX(${dragDelta * 0.12}px)`
      : 'translateX(0)';

  const progress = ((currentIndex + 1) / posts.length) * 100;
  const catLabel = categoryShort[post.category] ?? post.category;

  return (
    <div className="h-full flex flex-col select-none">
      {/* ─── Main card area ─── */}
      <div
        className="flex-1 relative overflow-hidden card-bg-glow cursor-grab active:cursor-grabbing"
        onTouchStart={handleTouchStart}
        onTouchMove={handleTouchMove}
        onTouchEnd={handleTouchEnd}
        onMouseDown={handleMouseDown}
        onMouseMove={dragStartX !== null ? handleMouseMove : undefined}
        onMouseUp={handleMouseUp}
        onMouseLeave={handleMouseUp}
      >
        {/* Amber radial glow — decorative */}
        <div
          className="absolute inset-0 pointer-events-none"
          style={{
            background:
              'radial-gradient(ellipse 50% 40% at 15% 55%, rgba(212,146,42,0.05) 0%, transparent 70%)',
          }}
        />

        {/* Card content */}
        <div
          key={currentIndex}
          className={`h-full flex flex-col ${
            enterDir === 'left'
              ? 'card-enter-left'
              : enterDir === 'right'
              ? 'card-enter-right'
              : ''
          }`}
          style={{
            transform: liveTransform,
            transition: dragStartX !== null ? 'none' : undefined,
            padding: '1.5rem 1.5rem 1rem',
          }}
        >
          {/* ── Top row: category badge + counter ── */}
          <div
            style={{
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'space-between',
              marginBottom: '1.5rem',
            }}
          >
            {/* Category — amber underline pill */}
            <span
              className="text-xs"
              style={{
                color: '#D4922A',
                fontFamily: "var(--font-sans), 'Noto Sans KR', sans-serif",
                fontWeight: 400,
                borderBottom: '1px solid rgba(212,146,42,0.4)',
                paddingBottom: '1px',
              }}
            >
              {catLabel}
            </span>
            <span
              className="text-xs"
              style={{
                color: '#8A7A5E',
                fontFamily: "var(--font-sans), 'Noto Sans KR', sans-serif",
                fontWeight: 300,
              }}
            >
              {String(currentIndex + 1).padStart(2, '0')}&nbsp;/&nbsp;{String(posts.length).padStart(2, '0')}
            </span>
          </div>

          {/* ── Center: quote block ── */}
          <div className="flex-1 flex flex-col justify-center" style={{ paddingBottom: '20%' }}>
            {/* Amber decorative mark */}
            <div
              className="text-4xl leading-none select-none"
              style={{ color: 'rgba(212,146,42,0.2)', marginBottom: '1rem' }}
            >
              ❝
            </div>

            {/* Main summary */}
            <p
              style={{
                fontFamily: "var(--font-sans), 'Noto Sans KR', sans-serif",
                fontSize: 'clamp(1.2rem, 4vw, 1.8rem)',
                lineHeight: '1.7',
                color: '#F0E4CC',
                padding: '0 0.5rem',
              }}
            >
              {post.summary}
            </p>
          </div>

          {/* ── Bottom: meta row ── */}
          <div
            className="mt-auto"
            style={{ borderTop: '1px solid rgba(212,146,42,0.12)', paddingTop: '1.25rem' }}
          >
            {/* Title */}
            <p
              className="text-sm line-clamp-1"
              style={{
                color: '#8A7A5E',
                marginBottom: '1rem',
                fontFamily: "var(--font-sans), 'Noto Sans KR', sans-serif",
              }}
            >
              {post.title}
            </p>

            {/* Badges + CTA */}
            <div
              className="flex items-center justify-between flex-wrap"
              style={{ gap: '0.75rem' }}
            >
              <div className="flex items-center flex-wrap" style={{ gap: '0.75rem' }}>
                <DepthBadge depth={post.depth} />
                <span
                  className="text-xs"
                  style={{
                    color: '#8A7A5E',
                    fontFamily: "var(--font-sans), 'Noto Sans KR', sans-serif",
                    fontWeight: 300,
                  }}
                >
                  {post.date}
                </span>
                <span
                  className="text-xs"
                  style={{
                    color: '#8A7A5E',
                    fontFamily: "var(--font-sans), 'Noto Sans KR', sans-serif",
                    fontWeight: 300,
                  }}
                >
                  ❤ {post.reactions}
                </span>
              </div>
              <Link
                href={`/posts/${post.slug}`}
                className="text-sm transition-colors group flex items-center"
                style={{ color: '#D4922A', gap: '0.25rem' }}
                onMouseEnter={(e) => (e.currentTarget.style.color = '#F0E4CC')}
                onMouseLeave={(e) => (e.currentTarget.style.color = '#D4922A')}
                onClick={(e) => e.stopPropagation()}
              >
                전체 읽기
                <span className="inline-block transition-transform">→</span>
              </Link>
            </div>
          </div>
        </div>
      </div>

      {/* ─── Progress bar ─── */}
      <div style={{ height: '2px', background: '#0D1826' }}>
        <div
          className="h-full transition-all duration-300"
          style={{ width: `${progress}%`, background: '#D4922A' }}
        />
      </div>

      {/* ─── Bottom nav ─── */}
      <div
        className="flex items-center justify-between"
        style={{ borderTop: '1px solid #0D1826', padding: '0.75rem 1.5rem' }}
      >
        <button
          onClick={goPrev}
          disabled={currentIndex === 0}
          className="text-xs transition-colors disabled:opacity-20"
          style={{
            color: '#8A7A5E',
            fontFamily: "var(--font-sans), 'Noto Sans KR', sans-serif",
            fontWeight: 300,
            background: 'none',
            border: 'none',
            cursor: 'pointer',
          }}
          onMouseEnter={(e) => {
            if (!e.currentTarget.disabled) e.currentTarget.style.color = '#D4922A';
          }}
          onMouseLeave={(e) => (e.currentTarget.style.color = '#8A7A5E')}
        >
          ← prev
        </button>

        {/* Progress dots */}
        <div className="flex items-center" style={{ gap: '0.25rem' }}>
          {posts.slice(0, Math.min(posts.length, 9)).map((_, i) => (
            <button
              key={i}
              onClick={() => setCurrentIndex(i)}
              className="transition-all rounded-full"
              style={{
                width: i === currentIndex % 9 ? '16px' : '5px',
                height: '5px',
                background: i === currentIndex % 9 ? '#D4922A' : 'rgba(212,146,42,0.2)',
                border: 'none',
                cursor: 'pointer',
                padding: 0,
              }}
            />
          ))}
        </div>

        <button
          onClick={goNext}
          disabled={currentIndex >= posts.length - 1}
          className="text-xs transition-colors disabled:opacity-20"
          style={{
            color: '#8A7A5E',
            fontFamily: "var(--font-sans), 'Noto Sans KR', sans-serif",
            fontWeight: 300,
            background: 'none',
            border: 'none',
            cursor: 'pointer',
          }}
          onMouseEnter={(e) => {
            if (!e.currentTarget.disabled) e.currentTarget.style.color = '#D4922A';
          }}
          onMouseLeave={(e) => (e.currentTarget.style.color = '#8A7A5E')}
        >
          next →
        </button>
      </div>
    </div>
  );
}
