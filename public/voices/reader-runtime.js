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

  window.CarrotReader = Object.freeze({ createStatusController });
})();
