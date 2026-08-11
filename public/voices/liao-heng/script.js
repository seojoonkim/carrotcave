(() => {
  'use strict';

  const VIDEO_URL = 'https://www.bilibili.com/video/BV1nB3u6tERu/';
  const body = document.body;
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
  const mobileHeaderTitle = document.querySelector('.header-mobile-title');
  const readingStatus = document.getElementById('readingStatus');
  const railTopics = document.getElementById('railTopics');
  const searchApi = globalThis.TranscriptSearch;
  const searchForm = document.getElementById('transcriptSearch');
  const searchInput = document.getElementById('transcriptSearchInput');
  const searchStatus = document.getElementById('transcriptSearchStatus');
  const clearSearchButton = document.getElementById('clearTranscriptSearch');
  const previousResultButton = document.getElementById('previousSearchResult');
  const nextResultButton = document.getElementById('nextSearchResult');
  const readerActionStatus = document.getElementById('readerActionStatus');
  const reduceMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
  const modalSiblings = [...body.children].filter(element => element !== drawer && element !== backdrop);
  let lastFocus = null;
  let rendered = false;
  let scrollTicking = false;
  let chapterElements = [];
  let markerElements = [];
  let currentRailChapter = null;
  let activeChapter = null;
  let activeTopic = null;
  let initialHashPending = Boolean(location.hash);
  let paragraphRecords = new Map();
  let searchIndex = [];
  let searchResults = [];
  let currentSearchResult = -1;
  let searchTimer = 0;
  let composingSearch = false;
  const copyTimers = new WeakMap();
  const drawerDetails = [...drawer.querySelectorAll('details')];
  const topicNumber = (chapter, index) => `${chapter}-${index + 1}`;
  drawerDetails.forEach((details, chapterIndex) => {
    details.querySelectorAll('[data-nav-topic] > span').forEach((label, topicIndex) => {
      label.textContent = topicNumber(chapterIndex + 1, topicIndex);
    });
  });
  document.querySelectorAll('.transcript-chapter').forEach(chapter => {
    chapter.querySelectorAll('.transcript-highlights [data-nav-topic] > span').forEach((label, topicIndex) => {
      label.textContent = topicNumber(chapter.dataset.chapter, topicIndex);
    });
  });
  const syncDisclosureAria = details => details.querySelector('summary')?.setAttribute('aria-expanded', String(details.open));
  drawerDetails.forEach(details => {
    syncDisclosureAria(details);
    details.addEventListener('toggle', () => syncDisclosureAria(details));
  });

  const syncDrawerChapter = chapter => {
    drawerDetails.forEach((item, index) => {
      item.open = chapter !== null && index + 1 === Number(chapter);
      syncDisclosureAria(item);
    });
  };

  const renderRailTopics = chapter => {
    if (!railTopics || currentRailChapter === String(chapter)) return;
    currentRailChapter = String(chapter);
    railTopics.replaceChildren();
    if (chapter === null) return;
    const source = document.querySelector(`#chapter-${CSS.escape(String(chapter))} .transcript-highlights`);
    source?.querySelectorAll('a[data-nav-topic]').forEach(sourceLink => {
      const link = sourceLink.cloneNode(true);
      link.dataset.railTopic = link.dataset.navTopic;
      delete link.dataset.navTopic;
      railTopics.append(link);
    });
  };

  const formatTime = value => {
    const seconds = Math.max(0, Math.floor(Number(value) || 0));
    const hours = Math.floor(seconds / 3600);
    const minutes = Math.floor((seconds % 3600) / 60);
    const remainder = seconds % 60;
    return `${String(hours).padStart(2, '0')}:${String(minutes).padStart(2, '0')}:${String(remainder).padStart(2, '0')}`;
  };

  const openDrawer = () => {
    lastFocus = document.activeElement;
    updateViewportState();
    const hashTarget = location.hash ? resolveHashTarget(location.hash) : null;
    const fallbackChapter = hashTarget?.dataset.chapter || hashTarget?.closest('.transcript-chapter')?.dataset.chapter || null;
    const drawerChapter = initialHashPending ? fallbackChapter || activeChapter : activeChapter;
    const drawerTopic = initialHashPending ? hashTarget?.dataset.topic || activeTopic : activeTopic;
    initialHashPending = false;
    syncDrawerChapter(drawerChapter);
    setActiveLinks('[data-nav-topic]', 'navTopic', drawerTopic);

    drawer.classList.add('open');
    drawer.setAttribute('aria-hidden', 'false');
    menuButton.setAttribute('aria-expanded', 'true');
    const revealActiveTopic = () => {
      const activeLink = drawer.querySelector(`[data-nav-topic="${CSS.escape(String(drawerTopic))}"]`);
      if (!activeLink || !drawer.classList.contains('open')) return;
      const drawerBox = drawer.getBoundingClientRect();
      const linkBox = activeLink.getBoundingClientRect();
      drawer.scrollTop += linkBox.top - drawerBox.top - Math.max(88, drawer.clientHeight * .34);
    };
    requestAnimationFrame(revealActiveTopic);
    window.setTimeout(revealActiveTopic, reduceMotion ? 0 : 280);
    backdrop.hidden = false;
    body.classList.add('drawer-open');
    modalSiblings.forEach(element => element.setAttribute('inert', ''));
    const focusCloseButton = () => {
      if (drawer.classList.contains('open')) closeButton.focus({ preventScroll: true });
    };
    focusCloseButton();
    requestAnimationFrame(focusCloseButton);
    window.setTimeout(focusCloseButton, 320);
  };

  const closeDrawer = ({ restoreFocus = true } = {}) => {
    drawer.classList.remove('open');
    drawer.setAttribute('aria-hidden', 'true');
    menuButton.setAttribute('aria-expanded', 'false');
    backdrop.hidden = true;
    body.classList.remove('drawer-open');
    modalSiblings.forEach(element => element.removeAttribute('inert'));
    if (restoreFocus && lastFocus instanceof HTMLElement) lastFocus.focus();
  };

  const cancelInitialHashSettlement = () => { initialHashPending = false; };
  ['wheel', 'touchmove'].forEach(type => window.addEventListener(type, cancelInitialHashSettlement, { passive: true, once: true }));
  window.addEventListener('keydown', event => {
    if (['ArrowUp', 'ArrowDown', 'PageUp', 'PageDown', 'Home', 'End', ' '].includes(event.key)) cancelInitialHashSettlement();
  });

  menuButton.addEventListener('click', openDrawer);
  closeButton.addEventListener('click', () => closeDrawer());
  backdrop.addEventListener('click', () => closeDrawer());

  window.addEventListener('resize', () => {
    if (window.innerWidth >= 1000 && drawer.classList.contains('open')) {
      closeDrawer({ restoreFocus: false });
    }
  });
  document.addEventListener('keydown', event => {
    if (event.key === 'Escape' && drawer.classList.contains('open')) closeDrawer();
    if (event.key !== 'Tab' || !drawer.classList.contains('open')) return;
    const focusable = [...drawer.querySelectorAll('a, button, summary')].filter(element => {
      const style = window.getComputedStyle(element);
      const closedDetails = element.closest('details:not([open])');
      return !element.hidden
        && !element.hasAttribute('disabled')
        && (!closedDetails || element === closedDetails.querySelector('summary'))
        && style.display !== 'none'
        && style.visibility !== 'hidden'
        && element.getClientRects().length > 0;
    });
    if (!focusable.length) return;
    const currentIndex = focusable.indexOf(document.activeElement);
    const nextIndex = event.shiftKey
      ? (currentIndex <= 0 ? focusable.length - 1 : currentIndex - 1)
      : (currentIndex < 0 || currentIndex === focusable.length - 1 ? 0 : currentIndex + 1);
    event.preventDefault();
    focusable[nextIndex].focus({ preventScroll: true });
  });

  const headerOffset = () => {
    const header = document.querySelector('.site-header');
    return (header ? header.getBoundingClientRect().height : 64) + 18;
  };

  const resolveHashTarget = hash => {
    if (!hash || hash === '#') return null;
    const id = decodeURIComponent(hash.slice(1));
    if (/^topic-\d+$/.test(id) && rendered) {
      return document.querySelector(`.highlight-marker#${CSS.escape(id)}`);
    }
    return document.getElementById(id);
  };

  const moveToHash = (hash, { updateHistory = false, smooth = true } = {}) => {
    const target = resolveHashTarget(hash);
    if (!target) return false;
    const top = Math.max(0, window.scrollY + target.getBoundingClientRect().top - headerOffset());
    window.scrollTo({ top, behavior: smooth && !reduceMotion ? 'smooth' : 'auto' });
    if (updateHistory && location.hash !== hash) history.pushState(null, '', hash);
    document.querySelector('.transcript-paragraph.hash-target')?.classList.remove('hash-target');
    if (target.matches('.transcript-paragraph')) target.classList.add('hash-target');
    const focusTarget = target.matches('.segment-anchor') ? target.closest('.transcript-paragraph') : target;
    if (focusTarget?.matches('.highlight-marker, .transcript-chapter, .content-section, .transcript-paragraph')) {
      focusTarget.setAttribute('tabindex', '-1');
      window.setTimeout(() => focusTarget.focus({ preventScroll: true }), smooth && !reduceMotion ? 350 : 0);
    }
    return true;
  };

  document.addEventListener('click', event => {
    const link = event.target.closest('a[href^="#"]');
    if (!link) return;
    const hash = link.getAttribute('href');
    if (!resolveHashTarget(hash)) return;
    event.preventDefault();
    if (drawer.contains(link)) closeDrawer({ restoreFocus: false });
    moveToHash(hash, { updateHistory: true });
  });
  window.addEventListener('popstate', () => moveToHash(location.hash, { smooth: false }));

  const makeParagraphActions = paragraph => {
    const actions = document.createElement('span');
    actions.className = 'paragraph-actions';
    const permalink = document.createElement('a');
    permalink.className = 'paragraph-permalink';
    permalink.href = `#p-${paragraph.id}`;
    permalink.textContent = formatTime(paragraph.start);
    permalink.setAttribute('aria-label', `${formatTime(paragraph.start)} 문단으로 이동`);
    const source = document.createElement('a');
    source.className = 'paragraph-source';
    source.href = `${VIDEO_URL}?t=${Math.floor(paragraph.start)}`;
    source.target = '_blank';
    source.rel = 'noopener noreferrer';
    source.textContent = '원본 ↗';
    source.setAttribute('aria-label', `${formatTime(paragraph.start)} 원본 영상에서 보기, 새 창`);
    const copy = document.createElement('button');
    copy.className = 'paragraph-copy-link';
    copy.type = 'button';
    copy.dataset.copyParagraph = `p-${paragraph.id}`;
    copy.dataset.timestamp = formatTime(paragraph.start);
    copy.textContent = '링크 복사';
    copy.setAttribute('aria-label', `${formatTime(paragraph.start)} 문단 링크 복사`);
    actions.append(permalink, source, copy);
    return actions;
  };

  const makeSegmentAnchor = segment => {
    const span = document.createElement('span');
    span.className = 'segment-anchor';
    span.id = `segment-${segment.id}`;
    span.dataset.segmentId = String(segment.id);
    span.dataset.start = String(segment.start);
    span.dataset.end = String(segment.end);
    return span;
  };

  const makeMarker = (highlight, topicIndex) => {
    const marker = document.createElement('aside');
    marker.className = 'highlight-marker';
    marker.id = highlight.anchor;
    marker.dataset.topic = String(highlight.id);
    marker.dataset.chapter = String(highlight.chapter);
    marker.dataset.start = String(highlight.start);
    marker.dataset.end = String(highlight.end);
    marker.setAttribute('aria-labelledby', `${highlight.anchor}-title`);

    const index = document.createElement('span');
    index.className = 'highlight-index';
    index.textContent = topicNumber(highlight.chapter, topicIndex);
    const content = document.createElement('div');
    const title = document.createElement('h3');
    title.id = `${highlight.anchor}-title`;
    title.textContent = highlight.title;
    const time = document.createElement('a');
    time.className = 'highlight-time';
    time.href = `${VIDEO_URL}?t=${Math.floor(highlight.start)}`;
    time.target = '_blank';
    time.rel = 'noopener noreferrer';
    time.textContent = `${highlight.timestamp || formatTime(highlight.start)} ↗`;
    content.append(title, time);
    marker.append(index, content);
    return marker;
  };

  const renderParagraphText = (container, paragraphData, keyMatches, searchRanges = [], isCurrent = false) => {
    container.replaceChildren();
    const appendSearchText = (parent, text, absoluteStart, ranges) => {
      let cursor = 0;
      ranges.forEach(range => {
        const start = Math.max(0, range.start - absoluteStart);
        const end = Math.min(text.length, range.end - absoluteStart);
        if (end <= cursor || start >= text.length) return;
        parent.append(document.createTextNode(text.slice(cursor, start)));
        const mark = document.createElement('mark');
        mark.className = isCurrent ? 'search-hit search-hit-current' : 'search-hit';
        mark.textContent = text.slice(start, end);
        parent.append(mark);
        cursor = end;
      });
      parent.append(document.createTextNode(text.slice(cursor)));
    };
    let cursor = 0;
    keyMatches.forEach(({ exact_quote: quote, start, end }) => {
      appendSearchText(container, paragraphData.text.slice(cursor, start), cursor, searchRanges.filter(range => range.start < start && range.end > cursor));
      const mark = document.createElement('mark');
      mark.className = 'key-sentence';
      appendSearchText(mark, quote, start, searchRanges.filter(range => range.start < end && range.end > start));
      container.append(mark);
      cursor = end;
    });
    appendSearchText(container, paragraphData.text.slice(cursor), cursor, searchRanges.filter(range => range.end > cursor));
  };

  const renderGroup = (paragraphs, segmentsById, container, highlights, keySentences) => {
    const fragment = document.createDocumentFragment();
    const highlightsBySegment = new Map();
    highlights.forEach(highlight => {
      const containingParagraph = paragraphs.find(paragraph =>
        Number(paragraph.segmentStartId) <= Number(highlight.segmentStartId)
        && Number(highlight.segmentStartId) <= Number(paragraph.segmentEndId)
      );
      if (containingParagraph) highlightsBySegment.set(Number(containingParagraph.segmentStartId), highlight);
    });
    let activeHighlight = null;

    paragraphs.forEach(paragraphData => {
      const markerData = highlightsBySegment.get(Number(paragraphData.segmentStartId));
      if (markerData) {
        fragment.append(makeMarker(markerData, highlights.indexOf(markerData)));
        activeHighlight = markerData;
      }
      const paragraph = document.createElement('p');
      paragraph.className = 'transcript-paragraph';
      paragraph.id = `p-${paragraphData.id}`;
      paragraph.dataset.paragraphId = String(paragraphData.id);
      paragraph.dataset.start = String(paragraphData.start);
      paragraph.dataset.end = String(paragraphData.end);
      if (!activeHighlight || Number(paragraphData.start) >= Number(activeHighlight.end)) {
        activeHighlight = highlights.find(item => Number(paragraphData.start) >= Number(item.start) && Number(paragraphData.start) < Number(item.end)) || null;
      }
      if (activeHighlight) {
        paragraph.classList.add('highlighted');
        paragraph.dataset.highlight = String(activeHighlight.id);
      }
      paragraph.append(makeParagraphActions(paragraphData));
      for (let id = paragraphData.segmentStartId; id <= paragraphData.segmentEndId; id += 1) {
        const segment = segmentsById.get(Number(id));
        if (!segment) throw new Error(`Missing segment ${id}`);
        paragraph.append(makeSegmentAnchor(segment));
      }
      const text = document.createElement('span');
      text.className = 'paragraph-text';
      const paragraphKeyMatches = keySentences.get(Number(paragraphData.segmentStartId)) || [];
      renderParagraphText(text, paragraphData, paragraphKeyMatches);
      paragraph.append(text);
      paragraphRecords.set(Number(paragraphData.id), { element: paragraph, textElement: text, data: paragraphData, keyMatches: paragraphKeyMatches });
      fragment.append(paragraph);
    });
    container.append(fragment);
  };

  const renderTranscript = (data, editorialData) => {
    if (!data || !Array.isArray(data.segments) || !Array.isArray(data.paragraphs) || !Array.isArray(data.chapters) || !Array.isArray(data.highlights)) {
      throw new Error('Invalid transcript data');
    }
    if (data.segments.length !== 8142 || data.paragraphs.length <= 100 || data.highlights.length !== 35 || data.chapters.length !== 7) {
      throw new Error('Unexpected transcript metadata counts');
    }
    if (!Array.isArray(editorialData)) throw new Error('Invalid key sentence data');

    const keySentences = new Map();
    editorialData.forEach((item, index) => {
      if (!Number.isInteger(item.segmentStartId) || typeof item.exact_quote !== 'string' || !item.exact_quote) {
        throw new Error(`Invalid key sentence item ${index}`);
      }
      const paragraph = data.paragraphs.find(candidate => Number(candidate.segmentStartId) === item.segmentStartId);
      if (!paragraph) throw new Error(`Key sentence paragraph not found: ${item.segmentStartId}`);
      const first = paragraph.text.indexOf(item.exact_quote);
      const occurrences = first < 0 ? 0 : paragraph.text.split(item.exact_quote).length - 1;
      if (occurrences !== 1) throw new Error(`Key sentence must match exactly once: ${item.segmentStartId} (${occurrences})`);
      const matches = keySentences.get(item.segmentStartId) || [];
      const end = first + item.exact_quote.length;
      if (matches.some(match => first < match.end && end > match.start)) {
        throw new Error(`Overlapping key sentences: ${item.segmentStartId}`);
      }
      matches.push({ ...item, start: first, end });
      matches.sort((a, b) => a.start - b.start);
      keySentences.set(item.segmentStartId, matches);
    });

    document.querySelectorAll('.transcript-topic-anchor').forEach(anchor => {
      anchor.removeAttribute('id');
      anchor.hidden = true;
    });
    document.querySelectorAll('.transcript-segments').forEach(container => container.replaceChildren());

    const segmentsById = new Map(data.segments.map(segment => [Number(segment.id), segment]));

    const firstChapterSegment = Number(data.chapters[0].segmentStartId);
    const intro = data.paragraphs.filter(paragraph => Number(paragraph.segmentStartId) < firstChapterSegment);
    renderGroup(intro, segmentsById, document.querySelector('[data-transcript-intro]'), [], keySentences);

    data.chapters.forEach((chapter, chapterIndex) => {
      const nextStartId = Number(data.chapters[chapterIndex + 1]?.segmentStartId ?? data.segments.length);
      const chapterParagraphs = data.paragraphs.filter(paragraph => Number(paragraph.segmentStartId) >= Number(chapter.segmentStartId) && Number(paragraph.segmentStartId) < nextStartId);
      const container = document.querySelector(`[data-transcript-chapter="${chapter.id}"]`);
      renderGroup(chapterParagraphs, segmentsById, container, data.highlights.filter(item => Number(item.chapter) === Number(chapter.id)), keySentences);
    });

    const segmentCount = document.querySelectorAll('.segment-anchor').length;
    const markerCount = document.querySelectorAll('.highlight-marker').length;
    const populatedChapters = [...document.querySelectorAll('[data-transcript-chapter]')].filter(element => element.children.length > 0).length;
    const keySentenceCount = document.querySelectorAll('.key-sentence').length;
    if (segmentCount !== 8142 || markerCount !== 35 || populatedChapters !== 7 || keySentenceCount !== editorialData.length) {
      throw new Error(`Render verification failed: ${segmentCount} segments, ${markerCount} markers, ${populatedChapters} chapters`);
    }

    rendered = true;
    searchIndex = searchApi.buildIndex([...paragraphRecords.values()].map(record => record.data));
    searchInput.disabled = false;
    searchStatus.textContent = '검색어를 입력하세요.';
    chapterElements = [...document.querySelectorAll('.transcript-chapter')];
    markerElements = [...document.querySelectorAll('.highlight-marker')];
    loading.hidden = true;
    error.hidden = true;
    transcript.setAttribute('aria-busy', 'false');
    transcript.dataset.segmentCount = String(segmentCount);
    if (location.hash) moveToHash(location.hash, { smooth: false });
    updateViewportState();
    updateProgress();
    if (location.hash) {
      const settleHash = () => {
        if (!initialHashPending) return;
        moveToHash(location.hash, { smooth: false });
        updateViewportState();
      };
      requestAnimationFrame(() => requestAnimationFrame(settleHash));
      [120, 500, 1200].forEach(delay => window.setTimeout(settleHash, delay));
      window.setTimeout(() => { initialHashPending = false; }, 1250);
    }
  };

  const searchResultLabel = result => {
    const record = paragraphRecords.get(result.paragraphId);
    const chapter = record?.element.closest('.transcript-chapter')?.dataset.chapter;
    return `${chapter ? `${chapter}장 · ` : ''}${formatTime(record?.data.start)}`;
  };

  const renderSearchState = (previousResults = []) => {
    const currentById = new Map(searchResults.map((result, index) => [result.paragraphId, { result, index }]));
    const changedIds = new Set([...previousResults, ...searchResults].map(result => result.paragraphId));
    changedIds.forEach(id => {
      const record = paragraphRecords.get(id);
      if (!record) return;
      const match = currentById.get(id);
      record.element.classList.remove('search-match', 'search-current');
      if (!match) {
        renderParagraphText(record.textElement, record.data, record.keyMatches);
        return;
      }
      const current = match.index === currentSearchResult;
      record.element.classList.add(current ? 'search-current' : 'search-match');
      renderParagraphText(record.textElement, record.data, record.keyMatches, match.result.ranges, current);
    });
  };

  const announceSearch = () => {
    const query = searchInput.value.trim();
    if (!query) searchStatus.textContent = '검색어를 입력하세요.';
    else if (!searchResults.length) searchStatus.textContent = `“${query}”와 일치하는 문단이 없습니다.`;
    else if (currentSearchResult < 0) searchStatus.textContent = `“${query}” 검색 결과 ${searchResults.length}개 문단 · Enter로 첫 결과 이동`;
    else searchStatus.textContent = `“${query}” 검색 결과 ${searchResults.length}개 문단 중 ${currentSearchResult + 1}번째 · ${searchResultLabel(searchResults[currentSearchResult])}`;
  };

  const moveSearchResult = delta => {
    if (!searchResults.length) return;
    cancelInitialHashSettlement();
    currentSearchResult = currentSearchResult < 0
      ? (delta < 0 ? searchResults.length - 1 : 0)
      : (currentSearchResult + delta + searchResults.length) % searchResults.length;
    renderSearchState(searchResults);
    const record = paragraphRecords.get(searchResults[currentSearchResult].paragraphId);
    if (!record) return;
    const top = Math.max(0, window.scrollY + record.element.getBoundingClientRect().top - headerOffset());
    window.scrollTo({ top, behavior: reduceMotion ? 'auto' : 'smooth' });
    announceSearch();
  };

  const runSearch = () => {
    window.clearTimeout(searchTimer);
    const previousResults = searchResults;
    searchResults = searchApi.findMatches(searchIndex, searchInput.value);
    currentSearchResult = -1;
    clearSearchButton.disabled = !searchInput.value;
    previousResultButton.disabled = searchResults.length < 2;
    nextResultButton.disabled = searchResults.length < 2;
    renderSearchState(previousResults);
    announceSearch();
  };

  searchForm.addEventListener('submit', event => { event.preventDefault(); moveSearchResult(1); });
  searchInput.addEventListener('compositionstart', () => { composingSearch = true; });
  searchInput.addEventListener('compositionend', () => { composingSearch = false; runSearch(); });
  searchInput.addEventListener('input', () => {
    if (composingSearch) return;
    window.clearTimeout(searchTimer);
    searchTimer = window.setTimeout(runSearch, 150);
  });
  searchInput.addEventListener('keydown', event => {
    if (event.isComposing || composingSearch || event.keyCode === 229) return;
    if (event.key === 'Enter') { event.preventDefault(); moveSearchResult(event.shiftKey ? -1 : 1); }
    if (event.key === 'Escape') { event.preventDefault(); searchInput.value = ''; runSearch(); }
  });
  clearSearchButton.addEventListener('click', () => { searchInput.value = ''; runSearch(); searchInput.focus(); });
  previousResultButton.addEventListener('click', () => moveSearchResult(-1));
  nextResultButton.addEventListener('click', () => moveSearchResult(1));

  const copyText = async value => {
    if (navigator.clipboard?.writeText) return navigator.clipboard.writeText(value);
    const fallback = document.createElement('textarea');
    fallback.value = value;
    fallback.setAttribute('readonly', '');
    fallback.style.position = 'fixed';
    fallback.style.opacity = '0';
    body.append(fallback);
    fallback.select();
    const copied = document.execCommand('copy');
    fallback.remove();
    if (!copied) throw new Error('Clipboard fallback failed');
  };

  transcript.addEventListener('click', async event => {
    const button = event.target.closest('[data-copy-paragraph]');
    if (!button) return;
    const canonical = document.querySelector('link[rel="canonical"]')?.href || location.href;
    const url = new URL(canonical);
    url.hash = button.dataset.copyParagraph;
    try {
      await copyText(url.href);
      readerActionStatus.textContent = `${button.dataset.timestamp} 문단 링크를 복사했습니다.`;
      window.clearTimeout(copyTimers.get(button));
      button.textContent = '복사됨';
      copyTimers.set(button, window.setTimeout(() => { button.textContent = '링크 복사'; }, 1500));
    } catch (reason) {
      console.error(reason);
      readerActionStatus.textContent = '링크를 복사하지 못했습니다. 주소 표시줄의 문단 링크를 복사해 주세요.';
    }
  });

  const setActiveLinks = (selector, dataName, value) => {
    document.querySelectorAll(selector).forEach(link => {
      const active = value !== null && link.dataset[dataName] === String(value);
      link.classList.toggle('active', active);
      if (active) link.setAttribute('aria-current', 'location');
      else link.removeAttribute('aria-current');
    });
  };

  const updateViewportState = () => {
    scrollTicking = false;
    const header = document.querySelector('.site-header');
    const probe = (header ? header.getBoundingClientRect().bottom : 64) + 26;
    const readingLine = window.scrollY + probe;
    let currentChapter = null;
    for (const chapter of chapterElements) {
      if (chapter.getBoundingClientRect().top <= probe) currentChapter = chapter;
      else break;
    }
    if (!currentChapter || transcript.getBoundingClientRect().top > probe) {
      chapterNumber.textContent = '00';
      mobileHeaderTitle.textContent = '랴오헝 인터뷰: Overview';
      readingStatus.textContent = 'OVERVIEW';
      activeChapter = null;
      activeTopic = null;
      setActiveLinks('[data-nav-chapter]', 'navChapter', null);
      setActiveLinks('[data-nav-topic]', 'navTopic', null);
      renderRailTopics(null);
      return;
    }

    const number = currentChapter.dataset.chapter;
    activeChapter = number;
    chapterNumber.textContent = `CH ${String(number).padStart(2, '0')}`;
    mobileHeaderTitle.textContent = `랴오헝 인터뷰: Chapter ${String(number).padStart(2, '0')}`;
    readingStatus.textContent = currentChapter.querySelector('.chapter-heading h2')?.textContent || '';
    setActiveLinks('[data-nav-chapter]', 'navChapter', number);
    renderRailTopics(number);

    let currentMarker = null;
    for (const marker of markerElements) {
      if (marker.getBoundingClientRect().top <= probe) currentMarker = marker;
      else break;
    }
    const markerInChapter = currentMarker?.dataset.chapter === number ? currentMarker.dataset.topic : null;
    activeTopic = markerInChapter;
    setActiveLinks('[data-nav-topic]', 'navTopic', markerInChapter);
    setActiveLinks('[data-rail-topic]', 'railTopic', markerInChapter);
  };

  const updateProgress = () => {
    const height = document.documentElement.scrollHeight - window.innerHeight;
    const amount = height > 0 ? Math.min(100, Math.max(0, window.scrollY / height * 100)) : 0;
    progressBar.style.transform = `scaleX(${amount / 100})`;
    railPercent.textContent = `${Math.round(amount)}%`;
    backToTop.classList.toggle('visible', window.scrollY > window.innerHeight * 0.7);
  };

  const onScroll = () => {
    if (!scrollTicking) {
      scrollTicking = true;
      requestAnimationFrame(() => {
        updateProgress();
        updateViewportState();
      });
    }
  };
  window.addEventListener('scroll', onScroll, { passive: true });
  window.addEventListener('resize', onScroll);
  backToTop.addEventListener('click', () => window.scrollTo({ top: 0, behavior: reduceMotion ? 'auto' : 'smooth' }));
  updateProgress();

  Promise.all(['transcript-ko.json', 'key-sentences.json'].map(url => fetch(url).then(response => {
    if (!response.ok) throw new Error(`${url} request failed (${response.status})`);
    return response.json();
  })))
    .then(([data, editorialData]) => renderTranscript(data, editorialData))
    .catch(reason => {
      console.error(reason);
      loading.hidden = true;
      error.hidden = false;
      searchStatus.textContent = '전사를 불러오지 못해 검색을 사용할 수 없습니다.';
      transcript.setAttribute('aria-busy', 'false');
      transcript.classList.add('load-failed');
    });
})();
