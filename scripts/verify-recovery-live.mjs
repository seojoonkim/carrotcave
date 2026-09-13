import {chromium} from 'playwright-core';
import {writeFileSync,readFileSync} from 'node:fs';
import assert from 'node:assert/strict';
import {posts} from '../data/posts.ts';
import {interviews} from '../data/interviews.ts';
const base=process.env.APP_URL || 'http://127.0.0.1:3194';
const proof=process.env.PROOF_PATH || '/tmp/carrot-recovery-proof.json';
const results=[];
const browser=await chromium.launch({channel:'chrome',headless:true});
const persist=()=>writeFileSync(proof,JSON.stringify({base,results},null,2));
try {
 for(const width of [390,1280]) {
  const page=await browser.newPage({viewport:{width,height:900}});
  const response=await page.goto(base,{waitUntil:'domcontentloaded'});
  assert.equal(response.status(),200);
  const cards=page.locator('.editorial-wall > a.wall-card');
  await cards.first().waitFor();
  const rendered=await cards.evaluateAll(els=>els.map(e=>({href:e.getAttribute('href'),axis:e.dataset.axis,img:e.querySelector('img')?.getAttribute('src')})));
  for(const post of posts) {
   const card=rendered.find(r=>r.href===`/posts/${post.slug}`);
   assert(card,`missing card ${post.slug}`);
   assert.equal(card.axis,post.category,`category ${post.slug}`);
  }
  assert.equal(rendered.length,posts.length+interviews.length);
  const fallback=rendered.filter(r=>decodeURIComponent(r.img||'').includes('/editorial-card-fallback-v3.png'));
  assert(fallback.length>0,'restored fallback cards absent');
  const pic=await page.request.get(base+'/editorial-card-fallback-v3.png');
  assert.equal(pic.status(),200); assert((await pic.body()).length>1000);
  results.push({width,kind:'archive',cards:rendered.length,postCategories:posts.length,fallbackCards:fallback.length});persist();
  for(const section of ['빌딩','탐험']) {
   await page.goto(base+'/?section='+encodeURIComponent(section),{waitUntil:'domcontentloaded'});
   const axes=await page.locator('.editorial-wall > a.wall-card').evaluateAll(els=>els.map(e=>e.dataset.axis));
   assert.equal(axes.length,posts.filter(p=>p.category===section).length);
   assert(axes.every(a=>a===section));
  }
  await page.goto(base+'/posts/post-215',{waitUntil:'domcontentloaded'});
  assert(new URL(page.url()).pathname.endsWith('/the-right-to-turn-on-a-brain'),'legacy route must redirect');
  assert.equal((await page.locator('h1').innerText()).trim(),'뇌를 켜는 사람의 권한');
  assert.equal((await page.locator('.post-reader-category').innerText()).trim(),'탐험');
  const video=page.locator('article video').first();
  assert.equal(await page.locator('article .post-media-grid').count(),0,'video replaced by still image');
  await video.scrollIntoViewIfNeeded();
  await video.evaluate(async v=>{v.muted=true;await v.play();});
  await page.waitForTimeout(650);
  const playback=await video.evaluate(v=>({src:v.currentSrc,time:v.currentTime,width:v.videoWidth,height:v.videoHeight,frames:v.getVideoPlaybackQuality().totalVideoFrames,error:v.error?.code||null}));
  assert(playback.src.endsWith('/media/msg-215-v0.mp4')&&playback.time>0&&playback.frames>0&&playback.width>0&&!playback.error);
  assert(await page.evaluate(()=>document.documentElement.scrollWidth<=innerWidth+1));
  results.push({width,kind:'post215-video',playback});persist();
  await page.screenshot({path:proof.replace('.json',`-${width}-video.png`)});
  await page.goto(base+'/voices/masayoshi-son-asi-economy',{waitUntil:'domcontentloaded'});
  const handle=await page.locator('iframe').first().elementHandle();
  const frame=await handle.contentFrame();
  await frame.waitForFunction(()=>document.querySelectorAll('.paragraph-text').length===484);
  const text=await frame.locator('.hero-deck').innerText();
  assert(text.includes('ASI(Artificial Superintelligence, 인공초지능)'));
  assert.equal(await frame.locator('.chapter-time').count(),8);
  assert.equal(await frame.locator('.transcript-timestamp:visible').count(),0);
  const bodies=await frame.locator('.paragraph-text').allTextContents();
  const expected=JSON.parse(readFileSync(new URL('../public/voices/masayoshi-son-asi-economy/transcript-ko.json',import.meta.url),'utf8')).items.map(i=>i.text);
  assert.deepEqual(bodies,expected);
  assert(!/ASR 불명확|불명확.*원음 확인 필요|원음 대조 미완료/.test(await frame.locator('body').innerText()));
  for(const sel of ['#transcript','#chapter-8'])assert.equal(await frame.locator(sel).evaluate(e=>parseFloat(getComputedStyle(e).borderBottomWidth)),0);
  results.push({width,kind:'son-reader',segments:bodies.length,asiDefinition:true,chapterTimes:8});persist();
  await page.close();
 }
 console.log(JSON.stringify({status:'PASS',base,results,proof},null,2));
}finally{persist();await browser.close();}
