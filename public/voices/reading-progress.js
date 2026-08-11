(() => {
  'use strict';

  const progress = document.getElementById('readingProgress');
  const progressFill = document.getElementById('progressBar');
  const chapterTrack = document.getElementById('chapterTrack');
  const chapters = [...document.querySelectorAll('.transcript-chapter')];
  if (!progress || !progressFill || !chapterTrack || !chapters.length) return;

  const segments = chapters.map((chapter, index) => {
    const segment = document.createElement('span');
    segment.className = 'chapter-track-segment';
    const fill = document.createElement('span');
    fill.className = 'chapter-track-fill';
    segment.append(fill);
    segment.setAttribute('aria-hidden', 'true');
    segment.dataset.chapter = chapter.dataset.chapter || String(index + 1);
    chapterTrack.append(segment);
    return { segment, fill };
  });

  let frame = 0;
  const update = () => {
    frame = 0;
    const max = document.documentElement.scrollHeight - innerHeight;
    const percent = max > 0 ? Math.min(100, Math.max(0, scrollY / max * 100)) : 0;
    progressFill.style.width = '100%';
    progressFill.style.transform = `scaleX(${percent / 100})`;
    progress.setAttribute('aria-valuenow', String(Math.round(percent)));

    const header = document.querySelector('.site-header');
    const probe = (header?.getBoundingClientRect().bottom || 64) + 26;
    const readingLine = scrollY + probe;
    let currentIndex = -1;
    chapters.forEach((chapter, index) => {
      if (chapter.getBoundingClientRect().top <= probe) currentIndex = index;
    });

    segments.forEach(({ segment, fill }, index) => {
      segment.classList.toggle('is-current', index === currentIndex);
      let amount = index < currentIndex ? 1 : 0;
      if (index === currentIndex) {
        const start = scrollY + chapters[index].getBoundingClientRect().top;
        const next = chapters[index + 1];
        const end = next
          ? scrollY + next.getBoundingClientRect().top
          : document.documentElement.scrollHeight - innerHeight + probe;
        amount = end > start ? Math.min(1, Math.max(0, (readingLine - start) / (end - start))) : 0;
      }
      fill.style.transform = `scaleX(${amount})`;
    });

    const chapterLabel = currentIndex >= 0
      ? `${currentIndex + 1}/${chapters.length}장`
      : `0/${chapters.length}장`;
    chapterTrack.setAttribute('aria-label', `챕터 읽기 진행 ${chapterLabel}`);
  };

  const requestUpdate = () => {
    if (!frame) frame = requestAnimationFrame(update);
  };
  addEventListener('scroll', requestUpdate, { passive: true });
  addEventListener('resize', requestUpdate);
  addEventListener('load', requestUpdate);
  update();
})();
