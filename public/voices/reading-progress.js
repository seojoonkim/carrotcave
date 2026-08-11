(() => {
  'use strict';

  const progress = document.getElementById('readingProgress');
  const progressFill = document.getElementById('progressBar');
  if (!progress || !progressFill) return;

  let frame = 0;
  const update = () => {
    frame = 0;
    const max = document.documentElement.scrollHeight - innerHeight;
    const percent = max > 0 ? Math.min(100, Math.max(0, scrollY / max * 100)) : 0;
    progressFill.style.width = '100%';
    progressFill.style.transform = `scaleX(${percent / 100})`;
    progress.setAttribute('aria-valuenow', String(Math.round(percent)));
  };

  const requestUpdate = () => {
    if (!frame) frame = requestAnimationFrame(update);
  };
  addEventListener('scroll', requestUpdate, { passive: true });
  addEventListener('resize', requestUpdate);
  addEventListener('load', requestUpdate);
  update();
})();
