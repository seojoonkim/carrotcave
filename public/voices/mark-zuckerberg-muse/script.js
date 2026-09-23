(() => {
  'use strict';
  const body = document.body;
  const sourceUrl = body.dataset.sourceUrl;
  const transcript = document.getElementById('transcript');
  const loading = document.getElementById('transcriptLoading');
  const error = document.getElementById('transcriptError');
  const drawer = document.getElementById('tocDrawer');
  const backdrop = document.getElementById('drawerBackdrop');
  const menuButton = document.getElementById('menuButton');
  const backToTop = document.getElementById('backToTop');
  const chapters = [...document.querySelectorAll('.transcript-chapter')];
  const navLinks = [...document.querySelectorAll('[data-nav-chapter]')];
  const readerStatus = CarrotReader.createStatusController({ readerTitle: '마크 저커버그 인터뷰' });
  const boundaries = [0, 514, 903, 1154, 1500, 1831, 2466, 2671, 3249, 3711, 3950, 4210];
  const reduceMotion = matchMedia('(prefers-reduced-motion: reduce)').matches;
  let lastFocus = null;
  let loaded = false;

  const formatTime = seconds => {
    const total = Math.floor(seconds);
    const hours = Math.floor(total / 3600);
    const minutes = Math.floor(total % 3600 / 60);
    const secs = String(total % 60).padStart(2, '0');
    return hours ? `${hours}:${String(minutes).padStart(2, '0')}:${secs}` : `${String(minutes).padStart(2, '0')}:${secs}`;
  };

  const renderItems = data => {
    if (!data || sourceUrl !== 'https://www.youtube.com/watch?v=Lx8lrn-cytc' || data.source !== sourceUrl || data.language !== 'ko' || data.durationSeconds !== 4210 || !Array.isArray(data.items) || data.items.length !== 264) {
      throw new Error('Unexpected Zuckerberg Korean transcript');
    }
    if (chapters.length !== 11 || chapters.some((chapter, i) => Number(chapter.dataset.chapter) !== i + 1 || Number(chapter.dataset.start) !== boundaries[i] || Number(chapter.dataset.end) !== boundaries[i + 1])) {
      throw new Error('Unexpected official chapter boundaries');
    }
    const fragments = chapters.map(() => document.createDocumentFragment());
    let previousStart = -1;
    let nextCueId = 0;
    data.items.forEach((item, index) => {
      if (!item || item.id !== index || !Number.isFinite(item.start) || !Number.isFinite(item.end) || item.start < 0 || item.end <= item.start || item.end > 4210 || item.start < previousStart || typeof item.text !== 'string' || !item.text.trim() || !/[가-힣]/.test(item.text) || item.speaker !== undefined) {
        throw new Error(`Invalid Korean transcript paragraph ${index}`);
      }
      previousStart = item.start;
      const chapterIndex = boundaries.findIndex((start, i) => i < chapters.length && item.start >= start && item.start < boundaries[i + 1]);
      if (chapterIndex < 0 || item.chapter !== chapterIndex + 1) throw new Error(`Invalid chapter for paragraph ${index}`);
      if (!Array.isArray(item.sourceCueIds) || !item.sourceCueIds.length) throw new Error(`Missing source cues for paragraph ${index}`);
      item.sourceCueIds.forEach(cueId => {
        if (cueId !== nextCueId) throw new Error(`Source cue gap or duplicate in paragraph ${index}`);
        nextCueId += 1;
      });
      const paragraph = document.createElement('p');
      paragraph.className = 'transcript-paragraph';
      paragraph.dataset.start = String(item.start);
      const anchor = document.createElement('span');
      anchor.className = 'segment-anchor';
      anchor.id = `segment-${item.id}`;
      anchor.dataset.segmentId = String(item.id);
      anchor.dataset.start = String(item.start);
      anchor.dataset.end = String(item.end);
      const time = document.createElement('a');
      time.className = 'transcript-timestamp';
      time.href = `${sourceUrl}&t=${Math.floor(item.start)}s`;
      time.target = '_blank';
      time.rel = 'noopener noreferrer';
      time.textContent = `[${formatTime(item.start)}]`;
      time.setAttribute('aria-label', `공식 영상 ${formatTime(item.start)}부터 듣기`);
      const copy = document.createElement('span');
      copy.className = 'paragraph-text';
      copy.textContent = item.text;
      paragraph.append(anchor, time, copy);
      if (item.editorNote) {
        const note = document.createElement('small');
        note.className = 'transcript-editor-note';
        note.textContent = `편집자 주: ${item.editorNote}`;
        paragraph.append(note);
      }
      fragments[chapterIndex].append(paragraph);
    });
    if (nextCueId !== 2145 || data.items[0].start !== 0.32 || data.items[data.items.length - 1].end !== 4192.799 || fragments.some(fragment => !fragment.childNodes.length)) {
      throw new Error('Incomplete transcript or empty chapter');
    }
    // Commit only after every paragraph and source-cue reference has validated.
    chapters.forEach((chapter, i) => chapter.querySelector('.transcript-segments').replaceChildren(fragments[i]));
    return data.items.length;
  };

  const closeDrawer = ({ restoreFocus = true } = {}) => {
    if (!drawer.classList.contains('open')) return;
    drawer.classList.remove('open');
    drawer.setAttribute('aria-hidden', 'true');
    drawer.inert = true;
    menuButton.setAttribute('aria-expanded', 'false');
    menuButton.setAttribute('aria-label', '목차 열기');
    backdrop.hidden = true;
    body.classList.remove('drawer-open');
    if (restoreFocus && lastFocus instanceof HTMLElement) lastFocus.focus();
  };
  const openDrawer = () => {
    lastFocus = document.activeElement;
    drawer.inert = false;
    drawer.classList.add('open');
    drawer.setAttribute('aria-hidden', 'false');
    menuButton.setAttribute('aria-expanded', 'true');
    menuButton.setAttribute('aria-label', '목차 닫기');
    backdrop.hidden = false;
    body.classList.add('drawer-open');
    drawer.querySelector('a').focus();
  };
  menuButton.addEventListener('click', () => drawer.classList.contains('open') ? closeDrawer() : openDrawer());
  backdrop.addEventListener('click', () => closeDrawer());
  drawer.addEventListener('click', event => {
    const link = event.target.closest('a[href^="#"]');
    if (!link) return;
    closeDrawer({ restoreFocus: false });
    document.getElementById(link.getAttribute('href').slice(1))?.focus({ preventScroll: true });
  });
  addEventListener('keydown', event => {
    if (!drawer.classList.contains('open')) return;
    if (event.key === 'Escape') {
      event.preventDefault();
      closeDrawer();
    }
    if (event.key === 'Tab') {
      const focusable = [menuButton, ...drawer.querySelectorAll('a[href]')];
      const index = focusable.indexOf(document.activeElement);
      if (index < 0 || (event.shiftKey && index === 0) || (!event.shiftKey && index === focusable.length - 1)) {
        event.preventDefault();
        focusable[event.shiftKey ? focusable.length - 1 : 0].focus();
      }
    }
  });

  const update = () => {
    const visible = scrollY > innerHeight * 0.7;
    backToTop.hidden = !visible;
    backToTop.classList.toggle('visible', visible);
    const probe = document.querySelector('.site-header').getBoundingClientRect().bottom + 26;
    let current = null;
    if (loaded) chapters.forEach(chapter => {
      if (chapter.getBoundingClientRect().top <= probe) current = chapter;
    });
    const number = current?.dataset.chapter || null;
    readerStatus.setChapter(number, current?.querySelector('.chapter-heading h2')?.textContent || '');
    navLinks.forEach(link => {
      const active = link.dataset.navChapter === number;
      link.classList.toggle('active', active);
      if (active) link.setAttribute('aria-current', 'location');
      else link.removeAttribute('aria-current');
    });
  };
  let ticking = false;
  addEventListener('scroll', () => {
    if (ticking) return;
    ticking = true;
    requestAnimationFrame(() => { ticking = false; update(); });
  }, { passive: true });
  addEventListener('resize', update);
  backToTop.addEventListener('click', () => {
    document.getElementById('main-content').focus({ preventScroll: true });
    scrollTo({ top: 0, behavior: reduceMotion ? 'auto' : 'smooth' });
  });

  fetch('transcript-ko.json')
    .then(response => {
      if (!response.ok) throw new Error(`Transcript request failed (${response.status})`);
      return response.json();
    })
    .then(data => {
      transcript.dataset.segmentCount = String(renderItems(data));
      loaded = true;
      loading.hidden = true;
      error.hidden = true;
      transcript.setAttribute('aria-busy', 'false');
      if (/^#(?:chapter-\d+|segment-\d+|transcript)$/.test(location.hash)) {
        document.getElementById(location.hash.slice(1))?.scrollIntoView({ behavior: 'instant' });
      }
      update();
      // Refresh the shared progress controller after async transcript layout.
      dispatchEvent(new Event('resize'));
    })
    .catch(reason => {
      console.error('Zuckerberg transcript load failed:', reason);
      chapters.forEach(chapter => chapter.querySelector('.transcript-segments').replaceChildren());
      delete transcript.dataset.segmentCount;
      loaded = false;
      loading.hidden = true;
      error.hidden = false;
      transcript.setAttribute('aria-busy', 'false');
      transcript.classList.add('load-failed');
      update();
    });
})();
