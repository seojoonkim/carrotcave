'use client';

import { useState } from 'react';

type Props = { id: string; url: string; title?: string; author?: string; thumbnail?: string };

/** Lite YouTube: shows the stored thumbnail first, loads the player only when tapped. */
export default function YouTubeEmbed({ id, url, title, author, thumbnail }: Props) {
  const [playing, setPlaying] = useState(false);
  const label = title ?? 'YouTube 영상';

  return (
    <figure className="post-youtube" data-playing={playing ? 'true' : 'false'}>
      <div className="post-youtube__frame">
        {playing ? (
          <iframe
            src={`https://www.youtube-nocookie.com/embed/${id}?autoplay=1&rel=0&playsinline=1`}
            title={label}
            allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture; web-share"
            allowFullScreen
          />
        ) : (
          <button type="button" className="post-youtube__poster" onClick={() => setPlaying(true)} aria-label={`${label} 재생`}>
            <img src={thumbnail ?? `https://i.ytimg.com/vi/${id}/hqdefault.jpg`} alt="" loading="lazy" decoding="async" />
            <span className="post-youtube__play" aria-hidden="true">
              <svg viewBox="0 0 24 24" width="26" height="26"><path d="M8 5.5v13l11-6.5z" fill="currentColor" /></svg>
            </span>
          </button>
        )}
      </div>
      <figcaption className="post-youtube__caption">
        <a href={url} target="_blank" rel="noopener noreferrer">
          <span className="post-youtube__title">{label}</span>
          <span className="post-youtube__meta">
            <svg viewBox="0 0 24 24" width="14" height="14" aria-hidden="true"><rect x="2" y="5" width="20" height="14" rx="4" fill="#e3342f" /><path d="M10 9v6l5-3z" fill="#fff" /></svg>
            {author ? `${author} · YouTube` : 'YouTube'}
          </span>
        </a>
      </figcaption>
    </figure>
  );
}
