(() => {
  'use strict';

  const createStatusController = ({ readerTitle = '' } = {}) => {
    const status = document.getElementById('readingStatus');
    const numberNode = status?.querySelector('.reading-status-number');
    const titleNode = status?.querySelector('.reading-status-title');
    const chapterNumber = document.getElementById('currentChapterNumber');
    const mobileTitle = document.querySelector('.header-mobile-title');

    if (!status || !numberNode || !titleNode) {
      const noop = () => {};
      return Object.freeze({ set: noop, setChapter: noop });
    }

    const set = (number, title, isSubchapter = false) => {
      numberNode.textContent = number;
      titleNode.textContent = title;
      status.setAttribute('aria-label', `${number} ${title}`.trim());
      status.classList.toggle('is-subchapter', isSubchapter);
    };

    const setChapter = (chapter, title) => {
      const normalized = chapter ? String(chapter).padStart(2, '0') : '';
      if (chapterNumber) chapterNumber.textContent = normalized ? `CH ${normalized}` : '00';
      if (mobileTitle) mobileTitle.textContent = normalized
        ? `${readerTitle}: Chapter ${normalized}`
        : `${readerTitle}: Overview`;
      if (normalized) set(`CHAPTER ${normalized}`, title);
      else set('00', 'OVERVIEW');
    };

    return Object.freeze({ set, setChapter });
  };

  window.CarrotReader = Object.freeze({ createStatusController });
})();
