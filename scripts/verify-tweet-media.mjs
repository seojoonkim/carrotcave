import { chromium } from 'playwright-core';
import { writeFileSync, mkdirSync } from 'node:fs';
import assert from 'node:assert/strict';
const base = process.env.APP_URL || 'http://127.0.0.1:3189';
const proof = process.env.PROOF_PATH || '/tmp/tweet-media-proof.json';
const browser = await chromium.launch({ channel: 'chrome', headless: true });
const results = [];
try {
  for (const width of [390, 1280]) {
    const page = await browser.newPage({ viewport: { width, height: 900 } });
    const failures = [];
    page.on('requestfailed', r => failures.push({ url: r.url(), error: r.failure()?.errorText }));
    page.on('response', r => { if (r.status() >= 400) failures.push({url:r.url(),status:r.status()}); });
    await page.goto(`${base}/posts/brain-files-minecraft-flies`, {waitUntil:'networkidle'});
    await page.getByText('@evnsnclr', {exact:true}).waitFor({timeout:20000});
    const state = await page.evaluate(() => ({
      images: [...document.images].filter(i => /twimg|msg-210/.test(i.src)).map(i=>({src:i.src,complete:i.complete,width:i.naturalWidth})),
      videos: [...document.querySelectorAll('video')].map(v=>({src:v.currentSrc || v.src,width:v.videoWidth,error:v.error?.code})),
      overflow: document.documentElement.scrollWidth > innerWidth,
    }));
    const video = page.locator('[data-tweet-embed] video');
    const count = await video.count();
    results.push({width,state,embedVideoCount:count,failures});
    writeFileSync(proof, JSON.stringify({base,results},null,2));
    if (process.env.DIAGNOSE) { await page.close(); continue; }
    assert.equal(count,1,'X embed must render a playable video, not an MP4 image');
    await video.scrollIntoViewIfNeeded();
    await video.evaluate(async v => { v.muted=true; await v.play(); });
    await page.waitForTimeout(1200);
    const playback = await video.evaluate(v=>({src:v.currentSrc,time:v.currentTime,width:v.videoWidth,height:v.videoHeight,readyState:v.readyState,error:v.error?.code || null,frames:v.getVideoPlaybackQuality().totalVideoFrames,insideLink:!!v.closest('a')}));
    Object.assign(results.at(-1),{playback});
    assert.ok(playback.time>0 && playback.frames>0 && playback.width>0 && !playback.error);
    assert.equal(playback.insideLink,false);
    assert.equal(state.overflow,false);
    assert.ok(!state.images.some(i=>i.src.includes('.mp4') || !i.width));
    assert.ok(playback.src.endsWith('/media/msg-210-v0.mp4'));
    await page.screenshot({path:proof.replace('.json',`-${width}.png`)});
    await page.close();
  }
} finally { writeFileSync(proof,JSON.stringify({base,results},null,2)); await browser.close(); }
console.log(JSON.stringify({base,results},null,2));
