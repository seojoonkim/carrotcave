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

  window.CarrotReader = Object.freeze({ createStatusController, markKeySentences });
})();
