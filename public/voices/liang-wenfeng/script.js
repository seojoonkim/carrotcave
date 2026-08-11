(() => {
  'use strict';
  const body = document.body;
  const sourceUrl = body.dataset.sourceUrl;
  const type = body.dataset.readerType;
  const transcript = document.getElementById('transcript');
  const loading = document.getElementById('transcriptLoading');
  const error = document.getElementById('transcriptError');
  const drawer = document.getElementById('tocDrawer');
  const backdrop = document.getElementById('drawerBackdrop');
  const menuButton = document.getElementById('menuButton');
  const closeButton = document.getElementById('closeDrawer');
  const progressBar = document.getElementById('progressBar');
  const railPercent = document.getElementById('railPercent');
  const backToTop = document.getElementById('backToTop');
  const chapterNumber = document.getElementById('currentChapterNumber');
  const mobileTitle = document.querySelector('.header-mobile-title');
  const readingStatus = document.getElementById('readingStatus');
  const reduceMotion = matchMedia('(prefers-reduced-motion: reduce)').matches;
  const chapters = [...document.querySelectorAll('.transcript-chapter')];
  let lastFocus = null;

  const formatTime = value => {
    const seconds = Math.max(0, Math.floor(Number(value) || 0));
    const hours = Math.floor(seconds / 3600);
    const minutes = Math.floor((seconds % 3600) / 60);
    const remainder = seconds % 60;
    return `${String(hours).padStart(2, '0')}:${String(minutes).padStart(2, '0')}:${String(remainder).padStart(2, '0')}`;
  };

  const sourceAt = seconds => sourceUrl.includes('youtube.com')
    ? `${sourceUrl}&t=${Math.floor(seconds)}s`
    : sourceUrl;

  const makeParagraph = (text, start, segments = []) => {
    const paragraph = document.createElement('p');
    paragraph.className = 'transcript-paragraph';
    paragraph.dataset.start = String(start || 0);
    segments.forEach(segment => {
      const anchor = document.createElement('span');
      anchor.className = 'segment-anchor';
      anchor.id = `segment-${segment.id}`;
      anchor.dataset.segmentId = String(segment.id);
      anchor.dataset.start = String(segment.start);
      anchor.dataset.end = String(segment.end);
      paragraph.append(anchor);
    });
    if (type === 'segments') {
      const timestamp = document.createElement('a');
      timestamp.className = 'segment-timestamp paragraph-timestamp';
      timestamp.href = sourceAt(start);
      timestamp.target = '_blank';
      timestamp.rel = 'noopener noreferrer';
      timestamp.textContent = formatTime(start);
      timestamp.setAttribute('aria-label', `${formatTime(start)} 원본 영상에서 보기`);
      paragraph.append(timestamp);
    }
    const copy = document.createElement('span');
    copy.className = 'paragraph-text';
    copy.textContent = text;
    paragraph.append(copy);
    return paragraph;
  };

  const renderBlocks = data => {
    if (!Array.isArray(data.items) || data.items.length !== 122) throw new Error('Unexpected block transcript');
    const containers = chapters.map(chapter => chapter.querySelector('.transcript-segments'));
    let chapterIndex = 0;
    let seenPart = false;
    data.items.forEach((item, index) => {
      if (!item || !['h1', 'p'].includes(item.tag) || typeof item.text !== 'string') throw new Error(`Invalid block ${index}`);
      if (item.tag === 'h1' && /^\d부:/.test(item.text)) {
        seenPart = true;
        const part = Number(item.text.match(/^(\d)부:/)?.[1]);
        chapterIndex = Math.max(0, Math.min(containers.length - 1, part - 1));
        return;
      }
      const paragraph = makeParagraph(item.text, 0, [{ id: index, start: 0, end: 0 }]);
      if (item.tag === 'h1') paragraph.classList.add('transcript-subheading');
      if (/^(Waves|량원펑|안융):/.test(item.text)) {
        const [speaker, ...rest] = item.text.split(':');
        paragraph.classList.add('transcript-dialogue');
        paragraph.querySelector('.paragraph-text').textContent = '';
        const label = document.createElement('strong');
        label.className = 'transcript-speaker';
        label.textContent = speaker;
        paragraph.querySelector('.paragraph-text').append(label, document.createTextNode(rest.join(':').trim()));
      }
      containers[seenPart ? chapterIndex : 0].append(paragraph);
    });
    return data.items.length;
  };

  const renderSegments = data => {
    if (!Array.isArray(data.segments) || data.segments.length !== 2531) throw new Error('Unexpected segment transcript');
    const groups = chapters.map(() => []);
    data.segments.forEach(segment => {
      const chapterIndex = chapters.findIndex(chapter => Number(segment.start) >= Number(chapter.dataset.start) && Number(segment.start) < Number(chapter.dataset.end));
      groups[Math.max(0, chapterIndex)].push(segment);
    });
    groups.forEach((segments, index) => {
      const container = chapters[index].querySelector('.transcript-segments');
      for (let offset = 0; offset < segments.length; offset += 6) {
        const part = segments.slice(offset, offset + 6);
        const text = part.map(segment => segment.text.trim()).filter(Boolean).join(' ');
        const paragraph = makeParagraph(text || '무음', part[0].start, part);
        if (!text) paragraph.classList.add('transcript-silence');
        container.append(paragraph);
      }
    });
    return data.segments.length;
  };

  const closeDrawer = ({ restoreFocus = true } = {}) => {
    drawer.classList.remove('open');
    drawer.setAttribute('aria-hidden', 'true');
    menuButton.setAttribute('aria-expanded', 'false');
    backdrop.hidden = true;
    body.classList.remove('drawer-open');
    if (restoreFocus && lastFocus instanceof HTMLElement) lastFocus.focus();
  };
  const openDrawer = () => {
    lastFocus = document.activeElement;
    drawer.classList.add('open');
    drawer.setAttribute('aria-hidden', 'false');
    menuButton.setAttribute('aria-expanded', 'true');
    backdrop.hidden = false;
    body.classList.add('drawer-open');
    closeButton.focus({ preventScroll: true });
  };
  menuButton.addEventListener('click', openDrawer);
  closeButton.addEventListener('click', () => closeDrawer());
  backdrop.addEventListener('click', () => closeDrawer());
  addEventListener('keydown', event => { if (event.key === 'Escape') closeDrawer(); });
  drawer.addEventListener('click', event => { if (event.target.closest('a')) closeDrawer({ restoreFocus: false }); });

  const update = () => {
    const max = document.documentElement.scrollHeight - innerHeight;
    const percent = max > 0 ? Math.min(100, Math.max(0, scrollY / max * 100)) : 0;
    progressBar.style.transform = `scaleX(${percent / 100})`;
    railPercent.textContent = `${Math.round(percent)}%`;
    backToTop.classList.toggle('visible', scrollY > innerHeight * .7);
    const probe = document.querySelector('.site-header').getBoundingClientRect().bottom + 26;
    let current = null;
    chapters.forEach(chapter => { if (chapter.getBoundingClientRect().top <= probe) current = chapter; });
    const number = current?.dataset.chapter || null;
    chapterNumber.textContent = number ? `CH ${String(number).padStart(2, '0')}` : '00';
    const name = document.querySelector('.header-site-title').textContent;
    mobileTitle.textContent = number ? `${name}: Chapter ${String(number).padStart(2, '0')}` : `${name}: Overview`;
    readingStatus.textContent = current?.querySelector('.chapter-heading h2')?.textContent || 'OVERVIEW';
    document.querySelectorAll('[data-nav-chapter]').forEach(link => {
      const active = link.dataset.navChapter === number;
      link.classList.toggle('active', active);
      if (active) link.setAttribute('aria-current', 'location'); else link.removeAttribute('aria-current');
    });
  };
  let ticking = false;
  addEventListener('scroll', () => {
    if (ticking) return;
    ticking = true;
    requestAnimationFrame(() => { ticking = false; update(); });
  }, { passive: true });
  addEventListener('resize', update);
  backToTop.addEventListener('click', () => scrollTo({ top: 0, behavior: reduceMotion ? 'auto' : 'smooth' }));

  fetch('transcript-ko.json').then(response => {
    if (!response.ok) throw new Error(`transcript request failed (${response.status})`);
    return response.json();
  }).then(data => {
    const count = type === 'blocks' ? renderBlocks(data) : renderSegments(data);
    const populated = chapters.filter(chapter => chapter.querySelector('.transcript-segments').children.length > 0).length;
    if (populated !== chapters.length) throw new Error(`Only ${populated} chapters populated`);
    transcript.dataset.segmentCount = String(count);
    transcript.setAttribute('aria-busy', 'false');
    loading.hidden = true;
    error.hidden = true;
    update();
  }).catch(reason => {
    console.error(reason);
    loading.hidden = true;
    error.hidden = false;
    transcript.setAttribute('aria-busy', 'false');
    transcript.classList.add('load-failed');
  });
})();
