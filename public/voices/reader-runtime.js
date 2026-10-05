(() => {
  'use strict';

  const createStatusController = ({ readerTitle = '' } = {}) => {
    const status = document.getElementById('readingStatus');
    const numberNode = status?.querySelector('.reading-status-number');
    const separatorNode = status?.querySelector('.reading-status-separator');
    const titleNode = status?.querySelector('.reading-status-title');
    const chapterNumber = document.getElementById('currentChapterNumber');
    const mobileTitle = document.querySelector('.header-mobile-title');

    if (!status || !numberNode || !separatorNode || !titleNode) {
      const noop = () => {};
      return Object.freeze({ set: noop, setChapter: noop });
    }

    const set = (number, title, isSubchapter = false) => {
      numberNode.textContent = number;
      separatorNode.textContent = number ? '.\u00a0' : '';
      titleNode.textContent = title;
      status.setAttribute('aria-label', `${number} ${title}`.trim());
      status.classList.toggle('is-overview', !number);
      status.classList.toggle('is-subchapter', isSubchapter);
    };

    const setChapter = (chapter, title) => {
      const normalized = chapter ? String(Number(chapter)) : '';
      if (chapterNumber) chapterNumber.textContent = normalized ? `CH ${normalized}` : '00';
      if (mobileTitle) mobileTitle.textContent = normalized
        ? `${readerTitle}: Chapter ${normalized}`
        : `${readerTitle}: Overview`;
      if (normalized) set(`Ch${normalized}`, title);
      else set('', 'OVERVIEW');
    };

    return Object.freeze({ set, setChapter });
  };

  // Shared key-sentence emphasis: episodes that ship key-sentences.json as
  // [{ id, exact_quote }] get the same quiet highlight without per-episode code.
  const markKeySentences = (items) => {
    let marked = 0;
    items.forEach(({ id, exact_quote: quote }) => {
      if (!Number.isInteger(id) || typeof quote !== 'string' || !quote) return;
      const anchor = document.getElementById(`segment-${id}`);
      const scope = anchor?.closest('.transcript-paragraph');
      if (!scope) return;
      const walker = document.createTreeWalker(scope, NodeFilter.SHOW_TEXT, {
        acceptNode: (node) => node.parentElement?.closest('.transcript-speaker, .transcript-turn-meta, .transcript-timestamp, mark')
          ? NodeFilter.FILTER_REJECT : NodeFilter.FILTER_ACCEPT,
      });
      for (let node = walker.nextNode(); node; node = walker.nextNode()) {
        const at = node.nodeValue.indexOf(quote);
        if (at < 0) continue;
        const target = node.splitText(at);
        target.splitText(quote.length);
        const mark = document.createElement('mark');
        mark.className = 'key-sentence';
        target.replaceWith(mark);
        mark.append(target);
        marked += 1;
        break;
      }
    });
    document.getElementById('transcript')?.setAttribute('data-key-sentences', String(marked));
    return marked;
  };

  const autoKeySentences = () => {
    const transcript = document.getElementById('transcript');
    if (!transcript) return;
    let started = false;
    const run = () => {
      if (started || transcript.getAttribute('aria-busy') !== 'false') return;
      if (document.querySelector('.key-sentence, .transcript-highlight')) return;
      if (document.documentElement?.lang === 'en') return; // key-sentences.json quotes the Korean text
      started = true;
      fetch('key-sentences.json')
        .then((response) => (response.ok ? response.json() : []))
        .then((items) => {
          if (!Array.isArray(items) || !items.length || !items.every((item) => Number.isInteger(item?.id))) return;
          markKeySentences(items);
        })
        .catch(() => {});
    };
    new MutationObserver(run).observe(transcript, { attributes: true, attributeFilter: ['aria-busy'] });
    run();
  };
  if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', autoKeySentences, { once: true });
  else autoKeySentences();

  // Page language: an English reader page is <html lang="en">; a Korean-only reader framed by the
  // English site gets ?lang=en so its chrome (toggle, reading end) stays on the English site.
  const loc = typeof location === 'undefined' ? { search: '', pathname: '' } : location;
  const queryLang = typeof URLSearchParams === 'undefined' ? null : new URLSearchParams(loc.search).get('lang');
  const pageLang = queryLang === 'en' || document.documentElement?.lang === 'en' ? 'en' : 'ko';
  const voiceSlug = (loc.pathname.match(/\/voices\/([^/]+)\//) || [])[1] || '';

  // KO / EN switch at the right end of the date line — the same place as on ordinary posts.
  const mountLangToggle = () => {
    const line = document.querySelector('.hero > .hero-date');
    if (!line || !voiceSlug || line.querySelector('.cc-lang')) return;
    const nav = document.createElement('nav');
    nav.className = 'cc-lang cc-lang--inline';
    nav.setAttribute('aria-label', pageLang === 'en' ? 'Language' : '언어 선택');
    [['ko', 'KO', ' 한국어', `/voices/${voiceSlug}`], ['en', 'EN', ' English', `/en/voices/${voiceSlug}`]].forEach(([lang, label, full, href]) => {
      const a = document.createElement('a');
      a.className = 'cc-lang__item';
      a.href = href;
      a.target = '_top';
      a.hreflang = lang;
      a.lang = lang;
      a.dataset.langSwitch = '';
      if (lang === pageLang) a.setAttribute('aria-current', 'true');
      a.append(label);
      const sr = document.createElement('span');
      sr.className = 'sr-only';
      sr.textContent = full;
      a.append(sr);
      a.addEventListener('click', () => {
        try { document.cookie = `cc-lang=${lang};path=/;max-age=31536000;samesite=lax`; } catch {}
      });
      nav.append(a);
    });
    const text = document.createElement('span');
    text.className = 'hero-date__text';
    text.append(...line.childNodes);
    line.append(text, nav);
  };
  if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', mountLangToggle, { once: true });
  else mountLangToggle();

  // English readers render transcript-en-reader.json (original English captions) into the same
  // chapters/anchors as the Korean reader. Returns the number of paragraphs rendered.
  const renderEnglishTranscript = (data, chapters) => {
    if (!data || data.language !== 'en' || !Array.isArray(data.items) || !data.items.length) throw new Error('Unexpected English transcript');
    let previous = null;
    data.items.forEach((item, index) => {
      if (!item || item.id !== index || typeof item.text !== 'string' || !item.text.trim() || !item.speaker) throw new Error(`Invalid English paragraph ${index}`);
      const chapter = chapters.find((section) => item.start >= Number(section.dataset.start) && item.start < Number(section.dataset.end)) || chapters[chapters.length - 1];
      const paragraph = document.createElement('p');
      paragraph.className = 'transcript-paragraph transcript-dialogue';
      paragraph.dataset.start = String(item.start);
      const anchor = document.createElement('span');
      anchor.className = 'segment-anchor';
      anchor.id = `segment-${item.id}`;
      anchor.dataset.segmentId = String(item.id);
      anchor.dataset.start = String(item.start);
      anchor.dataset.end = String(item.end);
      const copy = document.createElement('span');
      copy.className = 'paragraph-text';
      if (item.speaker !== previous) {
        const meta = document.createElement('span');
        meta.className = 'transcript-turn-meta';
        const speaker = document.createElement('strong');
        speaker.className = 'transcript-speaker';
        speaker.dataset.role = item.role || 'host';
        speaker.textContent = item.speaker;
        meta.append(speaker);
        copy.append(meta);
        previous = item.speaker;
      }
      copy.append(document.createTextNode(item.text));
      paragraph.append(anchor, copy);
      chapter.querySelector('.transcript-segments').append(paragraph);
    });
    return data.items.length;
  };

  window.CarrotReader = Object.freeze({ createStatusController, markKeySentences, renderEnglishTranscript, pageLang, voiceSlug });
})();
