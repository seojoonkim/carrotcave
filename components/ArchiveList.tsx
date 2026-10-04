'use client';

import Image from 'next/image';
import Link from 'next/link';
import { useEffect, useMemo, useRef, useState, type CSSProperties } from 'react';
import CaveBuddy from './CaveBuddy';
import { axisLabel, formatDate, t, type Locale } from '@/lib/i18n';

export const ARCHIVE_PAGE_SIZE = 12;
export const ARCHIVE_FALLBACK_IMAGE = '/editorial-card-fallback-v6.png';

export interface ArchiveEntry {
  key: string;
  href: string;
  date: string;
  axis: string;
  title: string;
  summary?: string;
  imageUrl?: string;
  /** Set when the entry is (or is built around) a video; shown as a play badge + length. */
  video?: { duration?: string };
}

function normalize(value: string) {
  return value.normalize('NFKC').toLocaleLowerCase('ko-KR').replace(/\s+/g, ' ').trim();
}

function ArchiveMeta({ axis, date, locale }: { axis: string; date: string; locale: Locale }) {
  const visual = formatDate(locale, date);
  return (
    <p className="archive-meta">
      <span className="archive-meta__axis">{axisLabel(locale, axis)}</span>
      <span className="archive-meta__dot" aria-hidden="true">·</span>
      <time dateTime={date}>{visual}</time>
    </p>
  );
}

function ArchiveThumb({ entry, priority, sizes }: { entry: ArchiveEntry; priority: boolean; sizes: string }) {
  const isFallback = !entry.imageUrl;
  const video = entry.video;
  return (
    <span className={`archive-thumb${isFallback ? ' archive-thumb--sketch' : ''}${video ? ' archive-thumb--video' : ''}`}>
      <Image
        src={entry.imageUrl ?? ARCHIVE_FALLBACK_IMAGE}
        alt=""
        width={960}
        height={600}
        sizes={sizes}
        priority={priority}
      />
      {video && (
        <>
          <span className="archive-thumb__play" aria-hidden="true">
            <svg viewBox="0 0 24 24" focusable="false"><path d="M8.5 6.3v11.4c0 .8.9 1.3 1.6.9l9.1-5.7c.6-.4.6-1.3 0-1.7l-9.1-5.7c-.7-.5-1.6 0-1.6.8Z" /></svg>
          </span>
          {video.duration && <span className="archive-thumb__duration">{video.duration}</span>}
        </>
      )}
    </span>
  );
}

function videoLabel(entry: ArchiveEntry, locale: Locale) {
  if (!entry.video) return '';
  const word = t(locale).video;
  return entry.video.duration ? `${word}, ${entry.video.duration}` : word;
}

export default function ArchiveList({
  entries,
  storageKey,
  featured = true,
  locale = 'ko',
}: {
  entries: ArchiveEntry[];
  storageKey: string;
  featured?: boolean;
  locale?: Locale;
}) {
  const L = t(locale);
  const [visible, setVisible] = useState(ARCHIVE_PAGE_SIZE);
  const [query, setQuery] = useState('');
  const [revealFrom, setRevealFrom] = useState<number | null>(null);
  const inputRef = useRef<HTMLInputElement>(null);
  const moreRef = useRef<HTMLButtonElement>(null);

  useEffect(() => {
    const saved = Number(window.sessionStorage.getItem(`archive:${storageKey}`));
    if (Number.isFinite(saved) && saved > ARCHIVE_PAGE_SIZE) setVisible(Math.min(saved, entries.length));
  }, [storageKey, entries.length]);

  useEffect(() => {
    const onKey = (event: KeyboardEvent) => {
      const target = event.target as HTMLElement | null;
      if (event.key !== '/' || event.metaKey || event.ctrlKey || event.altKey) return;
      if (target && (target.isContentEditable || /^(INPUT|TEXTAREA|SELECT)$/.test(target.tagName))) return;
      event.preventDefault();
      inputRef.current?.focus();
    };
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, []);

  const searchIndex = useMemo(
    () => entries.map((entry) => normalize(`${entry.title} ${entry.summary ?? ''} ${entry.axis} ${axisLabel(locale, entry.axis)}`)),
    [entries, locale],
  );
  const trimmed = normalize(query);
  const matches = useMemo(() => {
    if (!trimmed) return null;
    const terms = trimmed.split(' ');
    return new Set(entries.flatMap((entry, index) => (terms.every((term) => searchIndex[index].includes(term)) ? [entry.key] : [])));
  }, [entries, searchIndex, trimmed]);

  const searching = matches !== null;
  const showFeatured = featured && !searching && entries.length > 0;
  const lead = showFeatured ? entries[0] : null;
  const rows = showFeatured ? entries.slice(1) : entries;
  const limit = searching ? Number.POSITIVE_INFINITY : Math.max(0, visible - (showFeatured ? 1 : 0));
  let shown = 0;

  const showMore = () => {
    const next = Math.min(visible + ARCHIVE_PAGE_SIZE, entries.length);
    setRevealFrom(visible - (showFeatured ? 1 : 0));
    setVisible(next);
    window.sessionStorage.setItem(`archive:${storageKey}`, String(next));
  };

  const remaining = entries.length - Math.min(visible, entries.length);

  return (
    <div className="archive" data-searching={searching ? 'true' : 'false'}>
      <div className="archive-search" role="search">
        <label className="sr-only" htmlFor={`archive-search-${storageKey}`}>{L.searchLabel}</label>
        <svg className="archive-search__icon" viewBox="0 0 20 20" aria-hidden="true" focusable="false">
          <circle cx="8.5" cy="8.5" r="5.75" fill="none" stroke="currentColor" strokeWidth="1.5" />
          <path d="m13 13 4.5 4.5" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" />
        </svg>
        <input
          ref={inputRef}
          id={`archive-search-${storageKey}`}
          className="archive-search__input"
          type="search"
          value={query}
          placeholder={L.searchPlaceholder}
          autoComplete="off"
          enterKeyHint="search"
          onChange={(event) => setQuery(event.target.value)}
          onKeyDown={(event) => { if (event.key === 'Escape') setQuery(''); }}
        />
        <kbd className="archive-search__hint" aria-hidden="true">/</kbd>
      </div>
      <p className="archive-status" role="status" aria-live="polite">
        {searching ? (matches.size ? L.searchFound(matches.size) : L.searchNone) : ''}
      </p>

      {lead && (
        <Link className="archive-lead" href={lead.href} data-axis={lead.axis}>
          <ArchiveThumb entry={lead} priority sizes="(max-width: 900px) 100vw, 640px" />
          <span className="archive-lead__copy">
            <ArchiveMeta axis={lead.axis} date={lead.date} locale={locale} />
            <h2>{lead.title}{lead.video && <span className="sr-only">, {videoLabel(lead, locale)}</span>}</h2>
            {lead.summary && <span className="archive-lead__summary">{lead.summary}</span>}
          </span>
        </Link>
      )}

      <ol className="archive-list">
        {rows.map((entry, index) => {
          const hidden = searching ? !matches.has(entry.key) : index >= limit;
          if (!hidden) shown += 1;
          const reveal = !searching && revealFrom !== null && index >= revealFrom && index < limit;
          return (
            <li
              key={entry.key}
              className={`archive-row${reveal ? ' archive-row--reveal' : ''}`}
              data-axis={entry.axis}
              hidden={hidden}
              style={reveal ? ({ '--reveal-index': index - (revealFrom ?? 0) } as CSSProperties) : undefined}
            >
              <Link className="archive-row__link" href={entry.href}>
                <ArchiveThumb entry={entry} priority={false} sizes="(max-width: 900px) 112px, 208px" />
                <span className="archive-row__copy">
                  <ArchiveMeta axis={entry.axis} date={entry.date} locale={locale} />
                  <h2>{entry.title}{entry.video && <span className="sr-only">, {videoLabel(entry, locale)}</span>}</h2>
                  {entry.summary && <span className="archive-row__summary">{entry.summary}</span>}
                </span>
              </Link>
            </li>
          );
        })}
      </ol>

      {!searching && remaining > 0 && (
        <button ref={moreRef} type="button" className="archive-more" onClick={showMore}>
          {L.more}
          <span className="archive-more__count">{Math.min(visible, entries.length)} / {entries.length}</span>
        </button>
      )}
      {searching && shown === 0 && <div className="archive-empty"><CaveBuddy mood="lost"><strong>{L.searchEmptyTitle}</strong><span>{L.searchEmptyBody}</span></CaveBuddy></div>}
    </div>
  );
}
