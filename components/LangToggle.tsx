'use client';
import { usePathname } from 'next/navigation';
import { useEffect, useState } from 'react';
import { AXIS_FROM_SLUG, AXIS_SLUG, swapLocalePath, type Locale } from '@/lib/i18n';

/** Map ?section= between languages: 탐험 ⇄ explore. */
function swapQuery(search: string, to: Locale) {
  const params = new URLSearchParams(search);
  const section = params.get('section');
  if (section) {
    const ko = AXIS_FROM_SLUG[section] ?? section;
    params.set('section', to === 'en' ? AXIS_SLUG[ko as keyof typeof AXIS_SLUG] ?? section : ko);
  }
  const q = params.toString();
  return q ? `?${q}` : '';
}

// KO / EN switch shown in every header. Each language keeps its own URL (/posts/x ⇄ /en/posts/x),
// so links, search engines and shares always land on one language.
export default function LangToggle({ locale }: { locale: Locale }) {
  const pathname = usePathname() || '/';
  const pair = swapLocalePath(pathname);
  const [search, setSearch] = useState('');
  useEffect(() => { setSearch(window.location.search); }, [pathname]);
  const href = (to: Locale) => `${pair[to]}${swapQuery(search, to)}`;
  return (
    <nav className="cc-lang" aria-label={locale === 'en' ? 'Language' : '언어 선택'}>
      {(['ko', 'en'] as Locale[]).map((l) => (
        <a
          key={l}
          className="cc-lang__item"
          href={href(l)}
          hrefLang={l}
          lang={l}
          aria-current={l === locale ? 'true' : undefined}
          data-lang-switch=""
          onClick={(event) => {
            try { document.cookie = `cc-lang=${l};path=/;max-age=31536000;samesite=lax`; } catch {}
            if (l === locale) return;
            // Hard swap: the whole page changes language at once (no cross-fade of KO under EN).
            event.preventDefault();
            window.location.assign(href(l));
          }}
        >
          {l === 'ko' ? 'KO' : 'EN'}
          <span className="sr-only">{l === 'ko' ? ' 한국어' : ' English'}</span>
        </a>
      ))}
    </nav>
  );
}
