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
  const progressBar = document.getElementById('progressBar');
  const railPercent = document.getElementById('railPercent');
  const backToTop = document.getElementById('backToTop');
  const readerStatus = CarrotReader.createStatusController({ readerTitle: '손정의 특별강연' });
  const reduceMotion = matchMedia('(prefers-reduced-motion: reduce)').matches;
  const chapters = [...document.querySelectorAll('.transcript-chapter')];
  let lastFocus = null;
  const renderItems = data => {
    if (data.source !== sourceUrl || data.language !== 'ko' || !Array.isArray(data.items) || data.items.length !== 484) throw new Error('Unexpected Son Korean transcript');
    const fragments = chapters.map(() => document.createDocumentFragment());
    const ids = new Set();
    let previousStart = -1;
    let paragraph = null; let activeChapter = -1; let paragraphChars = 0; let previousText = "";
    data.items.forEach((item, index) => {
      if (!item || !Number.isInteger(item.id) || ids.has(item.id) || !Number.isFinite(item.start) || (!(index === data.items.length - 1 && item.end == null) && (!Number.isFinite(item.end) || item.start > item.end || (item.start === item.end && index !== data.items.length - 1))) || item.start < previousStart || typeof item.timestamp !== 'string' || !/^\d{1,2}:\d{2}(?::\d{2})?$/.test(item.timestamp) || typeof item.text !== 'string' || !item.text.trim() || item.speaker !== '손정의') throw new Error(`Invalid transcript item ${index}`);
      ids.add(item.id);
      previousStart = item.start;
      // The final boundary is the last supplied timestamp, not video duration.
      const chapterIndex = chapters.findIndex((section, i) => item.start >= Number(section.dataset.start) && (item.start < Number(section.dataset.end) || (i === chapters.length - 1 && item.start === Number(section.dataset.end))));
      if (chapterIndex < 0) throw new Error(`No chapter for transcript item ${index}`);
      const startsParagraph = chapterIndex !== activeChapter || (paragraphChars >= 180 && /[.!?。]$/.test(previousText.replace(/\[[^\]]*\]/g, '').trim()));
      if (startsParagraph) {
        paragraph = document.createElement('p'); paragraph.className = 'transcript-paragraph'; paragraph.dataset.start = String(item.start); fragments[chapterIndex].append(paragraph); paragraphChars = 0; activeChapter = chapterIndex;
      }
      const anchor = document.createElement('span');
      anchor.className = 'segment-anchor';
      anchor.id = `segment-${item.id}`;
      anchor.dataset.segmentId = String(item.id);
      anchor.dataset.start = String(item.start);
      if (Number.isFinite(item.end)) anchor.dataset.end = String(item.end);
      const time = document.createElement('a');
      time.className = 'transcript-timestamp';
      time.href = `${sourceUrl}&t=${Math.floor(item.start)}`;
      time.target = '_blank';
      time.rel = 'noopener noreferrer';
      time.textContent = startsParagraph ? `[${item.timestamp}]` : '';
      if (!startsParagraph) time.hidden = true;
      time.setAttribute('aria-label', `공식 영상 ${item.timestamp}에서 손정의 발언 듣기`);
      const speaker = document.createElement('span');
      speaker.className = 'transcript-speaker';
      speaker.dataset.speaker = item.speaker;
      speaker.textContent = item.speaker;
      const copy = document.createElement('span');
      copy.className = 'paragraph-text';
      copy.textContent = item.text;
      paragraph.append(anchor, time, document.createTextNode(' '));
      if (startsParagraph && !fragments[chapterIndex].querySelector('.transcript-speaker')) paragraph.append(speaker);
      paragraph.append(copy, document.createTextNode(' '));
      paragraphChars += item.text.length; previousText = item.text;
      if (item.uncertain) {
        const note = document.createElement('span');
        note.className = 'transcript-uncertain';
        note.textContent = ' [불명확 · 원음 확인 필요]';
        paragraph.append(note);
      }

    });
    const formatTime = seconds => {
      const n = Math.floor(seconds);
      const hours = Math.floor(n / 3600);
      const minutes = Math.floor(n % 3600 / 60);
      const secs = String(n % 60).padStart(2, '0');
      return hours ? `${hours}:${String(minutes).padStart(2, '0')}:${secs}` : `${minutes}:${secs}`;
    };
    fragments.forEach((fragment, i) => {
      fragment.querySelectorAll('.transcript-timestamp').forEach(node => node.remove());
      const heading = chapters[i].querySelector('.chapter-heading');
      heading.querySelector('.chapter-time')?.remove();
      const time = document.createElement('a');
      time.className = 'chapter-time';
      const start = Number(chapters[i].dataset.start);
      time.href = `${sourceUrl}&t=${start}`;
      time.target = '_blank'; time.rel = 'noopener noreferrer';
      time.textContent = `[${formatTime(start)}]`;
      heading.append(time);
    });
    if (fragments.some(fragment => !fragment.childNodes.length)) throw new Error('Transcript has an empty chapter');
    // Commit only after validating all segments; never show a partial success.
    chapters.forEach((chapter, i) => chapter.querySelector('.transcript-segments').replaceChildren(fragments[i]));
    return data.items.length;
  };
  const closeDrawer=({restoreFocus=true}={})=>{drawer.classList.remove('open');drawer.setAttribute('aria-hidden','true');menuButton.setAttribute('aria-expanded','false');menuButton.setAttribute('aria-label','목차 열기');backdrop.hidden=true;body.classList.remove('drawer-open');if(restoreFocus&&lastFocus instanceof HTMLElement)lastFocus.focus();};
  const openDrawer=()=>{lastFocus=document.activeElement;drawer.classList.add('open');drawer.setAttribute('aria-hidden','false');menuButton.setAttribute('aria-expanded','true');menuButton.setAttribute('aria-label','목차 닫기');backdrop.hidden=false;body.classList.add('drawer-open');};
  menuButton.addEventListener('click',()=>drawer.classList.contains('open')?closeDrawer():openDrawer()); backdrop.addEventListener('click',()=>closeDrawer()); addEventListener('keydown',e=>{if(e.key==='Escape')closeDrawer();}); drawer.addEventListener('click',e=>{if(e.target.closest('a'))closeDrawer({restoreFocus:false});});
  const update=()=>{const max=document.documentElement.scrollHeight-innerHeight;const percent=max>0?Math.min(100,Math.max(0,scrollY/max*100)):0;progressBar.style.transform=`scaleX(${percent/100})`;document.getElementById('readingProgress').setAttribute('aria-valuenow',String(Math.round(percent)));railPercent.textContent=`${Math.round(percent)}%`;backToTop.classList.toggle('visible',scrollY>innerHeight*.7);const probe=document.querySelector('.site-header').getBoundingClientRect().bottom+26;let current=null;chapters.forEach(ch=>{if(ch.getBoundingClientRect().top<=probe)current=ch;});const number=current?.dataset.chapter||null;const title=current?.querySelector('.chapter-heading h2')?.textContent||'';readerStatus.setChapter(number,title);document.querySelectorAll('[data-nav-chapter]').forEach(link=>{const active=link.dataset.navChapter===number;link.classList.toggle('active',active);if(active)link.setAttribute('aria-current','location');else link.removeAttribute('aria-current');});};
  let ticking=false;addEventListener('scroll',()=>{if(ticking)return;ticking=true;requestAnimationFrame(()=>{ticking=false;update();});},{passive:true});addEventListener('resize',update);backToTop.addEventListener('click',()=>scrollTo({top:0,behavior:reduceMotion?'auto':'smooth'}));
  fetch('transcript-ko.json').then(r=>{if(!r.ok)throw new Error(`transcript request failed (${r.status})`);return r.json();}).then(data=>{const count=renderItems(data);const populated=chapters.filter(ch=>ch.querySelector('.transcript-segments').children.length>0).length;if(populated!==chapters.length)throw new Error(`Only ${populated} chapters populated`);transcript.dataset.segmentCount=String(count);transcript.setAttribute('aria-busy','false');loading.hidden=true;error.hidden=true;update();}).catch(reason=>{console.error(reason);loading.hidden=true;error.hidden=false;transcript.setAttribute('aria-busy','false');transcript.classList.add('load-failed');});
})();
