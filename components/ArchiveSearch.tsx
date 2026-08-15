'use client';

import { FormEvent, useEffect, useRef, useState } from 'react';
import { useRouter } from 'next/navigation';
import { normalizeQuery } from '@/lib/search/normalize';
import { archiveSearchHref, isPendingQuerySettled, shouldAdoptServerQuery, shouldNavigateSearch } from '@/lib/search/navigation';

type ArchiveSearchProps = {
  query: string;
  displayQuery: string;
  statusId: string;
  section?: string;
};

export default function ArchiveSearch({ query, displayQuery, statusId, section }: ArchiveSearchProps) {
  const router = useRouter();
  const [value, setValue] = useState(displayQuery);
  const [composing, setComposing] = useState(false);
  const pendingQuery = useRef<string | null>(null);
  const previousSection = useRef(section);

  useEffect(() => {
    if (previousSection.current !== section) {
      previousSection.current = section;
      pendingQuery.current = null;
      setValue(displayQuery);
      return;
    }
    if (!shouldAdoptServerQuery(query, pendingQuery.current)) {
      if (isPendingQuerySettled(query, pendingQuery.current)) pendingQuery.current = null;
      return;
    }
    setValue(displayQuery);
  }, [displayQuery, query, section]);

  function navigate(rawValue: string) {
    const nextQuery = normalizeQuery(rawValue);
    pendingQuery.current = nextQuery;
    router.replace(archiveSearchHref(rawValue, section), { scroll: false });
  }

  useEffect(() => {
    if (!shouldNavigateSearch(value, query, composing)) return;
    const timer = window.setTimeout(() => navigate(value), 180);
    return () => window.clearTimeout(timer);
  }, [composing, query, section, value]);

  function submit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    navigate(value);
  }

  return (
    <div className="archive-search">
      <form action="/" method="get" role="search" onSubmit={submit}>
        <label htmlFor="archive-q" className="sr-only">기록 검색</label>
        {section && <input type="hidden" name="section" value={section} />}
        <span className="archive-search__icon" aria-hidden="true" />
        <input
          id="archive-q"
          name="q"
          type="search"
          value={value}
          aria-describedby={statusId}
          onChange={(event) => setValue(event.currentTarget.value)}
          onCompositionStart={() => setComposing(true)}
          onCompositionEnd={(event) => {
            setComposing(false);
            setValue(event.currentTarget.value);
          }}
          placeholder="제목·요약·본문 검색"
          enterKeyHint="search"
          autoComplete="off"
        />
        <button type="submit">검색</button>
        {query && <a href={archiveSearchHref('', section)} aria-label="검색 지우기">지우기</a>}
      </form>
    </div>
  );
}
