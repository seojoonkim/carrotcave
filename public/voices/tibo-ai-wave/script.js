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
  const readerStatus = CarrotReader.createStatusController({ readerTitle: '티보 인터뷰' });
  const reduceMotion = matchMedia('(prefers-reduced-motion: reduce)').matches;
  const chapters = [...document.querySelectorAll('.transcript-chapter')];
  let lastFocus = null;
  const renderItems = data => {
    if (data.language !== 'ko' || !Array.isArray(data.items) || data.items.length < 100) throw new Error('Unexpected Korean transcript');
    let previousSpeaker = null;
    data.items.forEach((item, index) => {
      if (!item || item.id !== index || !Number.isFinite(item.start) || !Number.isFinite(item.end) || item.start >= item.end || typeof item.text !== 'string' || !/[가-힣]/.test(item.text) || !['Tibo', 'Matthew Berman'].includes(item.speaker)) throw new Error(`Invalid transcript item ${index}`);
      const chapter = chapters.find(section => item.start >= Number(section.dataset.start) && item.start < Number(section.dataset.end));
      if (!chapter) throw new Error(`No chapter for transcript item ${index}`);
      const paragraph = document.createElement('p');
      paragraph.className = 'transcript-paragraph';
      paragraph.dataset.start = String(item.start);
      const anchor = document.createElement('span');
      anchor.className = 'segment-anchor';
      anchor.id = `segment-${item.id}`;
      anchor.dataset.segmentId = String(item.id);
      anchor.dataset.start = String(item.start);
      anchor.dataset.end = String(item.end);
      if (item.speaker !== previousSpeaker) {
        const speaker = document.createElement('span');
        speaker.className = 'transcript-speaker';
        speaker.dataset.speaker = item.speaker;
        speaker.textContent = item.speaker;
        paragraph.append(speaker);
        previousSpeaker = item.speaker;
      }
      const copy = document.createElement('span');
      copy.className = 'paragraph-text';
      copy.textContent = item.text;
      paragraph.append(anchor, copy);
      chapter.querySelector('.transcript-segments').append(paragraph);
    });
    return data.items.length;
  };
  const closeDrawer=({restoreFocus=true}={})=>{drawer.classList.remove('open');drawer.setAttribute('aria-hidden','true');menuButton.setAttribute('aria-expanded','false');menuButton.setAttribute('aria-label','목차 열기');backdrop.hidden=true;body.classList.remove('drawer-open');if(restoreFocus&&lastFocus instanceof HTMLElement)lastFocus.focus();};
  const openDrawer=()=>{lastFocus=document.activeElement;drawer.classList.add('open');drawer.setAttribute('aria-hidden','false');menuButton.setAttribute('aria-expanded','true');menuButton.setAttribute('aria-label','목차 닫기');backdrop.hidden=false;body.classList.add('drawer-open');};
  menuButton.addEventListener('click',()=>drawer.classList.contains('open')?closeDrawer():openDrawer()); backdrop.addEventListener('click',()=>closeDrawer()); addEventListener('keydown',e=>{if(e.key==='Escape')closeDrawer();}); drawer.addEventListener('click',e=>{if(e.target.closest('a'))closeDrawer({restoreFocus:false});});
  const update=()=>{const max=document.documentElement.scrollHeight-innerHeight;const percent=max>0?Math.min(100,Math.max(0,scrollY/max*100)):0;progressBar.style.transform=`scaleX(${percent/100})`;document.getElementById('readingProgress').setAttribute('aria-valuenow',String(Math.round(percent)));railPercent.textContent=`${Math.round(percent)}%`;backToTop.classList.toggle('visible',scrollY>innerHeight*.7);const probe=document.querySelector('.site-header').getBoundingClientRect().bottom+26;let current=null;chapters.forEach(ch=>{if(ch.getBoundingClientRect().top<=probe)current=ch;});const number=current?.dataset.chapter||null;const title=current?.querySelector('.chapter-heading h2')?.textContent||'';readerStatus.setChapter(number,title);document.querySelectorAll('[data-nav-chapter]').forEach(link=>{const active=link.dataset.navChapter===number;link.classList.toggle('active',active);if(active)link.setAttribute('aria-current','location');else link.removeAttribute('aria-current');});};
  let ticking=false;addEventListener('scroll',()=>{if(ticking)return;ticking=true;requestAnimationFrame(()=>{ticking=false;update();});},{passive:true});addEventListener('resize',update);backToTop.addEventListener('click',()=>scrollTo({top:0,behavior:reduceMotion?'auto':'smooth'}));
  fetch('transcript-ko.json').then(r=>{if(!r.ok)throw new Error(`transcript request failed (${r.status})`);return r.json();}).then(data=>{const count=renderItems(data);const populated=chapters.filter(ch=>ch.querySelector('.transcript-segments').children.length>0).length;if(populated!==chapters.length)throw new Error(`Only ${populated} chapters populated`);transcript.dataset.segmentCount=String(count);transcript.setAttribute('aria-busy','false');loading.hidden=true;error.hidden=true;update();}).catch(reason=>{console.error(reason);loading.hidden=true;error.hidden=false;transcript.setAttribute('aria-busy','false');transcript.classList.add('load-failed');});
})();
