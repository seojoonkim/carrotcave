'use client';

import { useEffect, useRef, useState } from 'react';

interface PostShareButtonProps {
  title: string;
  path: string;
}

async function copyLink(url: string) {
  if (navigator.clipboard?.writeText) {
    await navigator.clipboard.writeText(url);
    return;
  }

  const input = document.createElement('textarea');
  input.value = url;
  input.setAttribute('readonly', '');
  input.style.position = 'fixed';
  input.style.opacity = '0';
  document.body.appendChild(input);
  input.select();
  const copied = document.execCommand('copy');
  input.remove();
  if (!copied) throw new Error('copy failed');
}

export default function PostShareButton({ title, path }: PostShareButtonProps) {
  const [status, setStatus] = useState<'idle' | 'copied' | 'failed'>('idle');
  const resetTimer = useRef<ReturnType<typeof setTimeout> | null>(null);

  useEffect(() => () => {
    if (resetTimer.current) clearTimeout(resetTimer.current);
  }, []);

  const showStatus = (next: 'copied' | 'failed') => {
    setStatus(next);
    if (resetTimer.current) clearTimeout(resetTimer.current);
    resetTimer.current = setTimeout(() => setStatus('idle'), 1800);
  };

  const share = async () => {
    const url = new URL(path, window.location.origin).href;
    try {
      if (navigator.share) {
        await navigator.share({ title, url });
        return;
      }
      await copyLink(url);
      showStatus('copied');
    } catch (error) {
      if (error instanceof DOMException && error.name === 'AbortError') return;
      try {
        await copyLink(url);
        showStatus('copied');
      } catch {
        showStatus('failed');
      }
    }
  };

  const label = status === 'copied' ? '링크 복사됨' : status === 'failed' ? '복사 실패' : '공유하기';

  return (
    <button type="button" className="post-reader-action post-reader-action--share" onClick={share} aria-live="polite">
      {status === 'copied' ? (
        <span className="post-share-icon" aria-hidden="true">✓</span>
      ) : (
        <svg className="post-share-icon" viewBox="0 0 20 20" aria-hidden="true">
          <path d="M10 13V3m0 0L6.5 6.5M10 3l3.5 3.5M4 10.5v4A1.5 1.5 0 0 0 5.5 16h9a1.5 1.5 0 0 0 1.5-1.5v-4" />
        </svg>
      )}
      <span>{label}</span>
    </button>
  );
}
