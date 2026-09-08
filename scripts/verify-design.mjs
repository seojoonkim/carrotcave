import { chromium } from 'playwright-core';
import assert from 'node:assert/strict';
import { writeFileSync } from 'node:fs';
const base=process.env.APP_URL || 'http://127.0.0.1:3193';
const proof=process.env.PROOF_PATH || '/tmp/carrot-design-proof.json';
const browser=await chromium.launch({channel:'chrome',headless:true});
const results=[];
try {
 for(const width of [390,1280]) {
  const page=await browser.newPage({viewport:{width,height:900}});
  const errors=[];page.on('pageerror', e=>errors.push(e.message));
  for(const route of ['/', '/?section=빌딩','/voices','/posts/brain-files-minecraft-flies']) {
   const response=await page.goto(base+route,{waitUntil:'networkidle'});
   assert.equal(response.status(),200);
   await page.evaluate(()=>document.fonts.ready);
   const state=await page.evaluate(()=>{
    const rect=e=>{const r=e.getBoundingClientRect();return {x:r.x,y:r.y,width:r.width,height:r.height,bottom:r.bottom}};
    return {overflow:document.documentElement.scrollWidth>innerWidth,bodyColor:getComputedStyle(document.body).backgroundColor,
     header:document.querySelectorAll('.cc-header').length,
     cards:[...document.querySelectorAll('.editorial-wall .wall-card')].slice(0,6).map(c=>({border:getComputedStyle(c).borderTopWidth,box:rect(c),title:rect(c.querySelector('h2')),summary:c.querySelector('.wall-card__abstract')?rect(c.querySelector('.wall-card__abstract')):null})),
     rabbit:!!document.querySelector('.footer-rabbit-carrot')};
   });
   assert.equal(state.overflow,false,`overflow ${width} ${route}`);
   assert.equal(state.header,1);
   assert.equal(state.rabbit,true);
   for(const c of state.cards){assert.equal(c.border,'0px');if(width===390 && c.summary)assert.ok(c.summary.y>=c.title.bottom-1,'mobile summary must follow title');}
   if(route==='/') {
    const nav=page.locator('a[href="/?section=빌딩"]:visible').first();
    await nav.click();await page.waitForURL('**section=*');
    assert.equal(new URL(page.url()).searchParams.get('section'),'빌딩');
    await page.goto(base,{waitUntil:'networkidle'});
    await page.screenshot({path:proof.replace('.json',`-home-${width}.png`)});
    await page.locator('.wall-card').first().click();await page.waitForURL('**/posts/**');
    assert.ok(await page.locator('h1').innerText());
   }
   if(route==='/posts/brain-files-minecraft-flies') {
    const video=page.locator('[data-tweet-embed] video');await video.scrollIntoViewIfNeeded();
    await video.evaluate(async v=>{v.muted=true;await v.play()});await page.waitForTimeout(800);
    state.playback=await video.evaluate(v=>({time:v.currentTime,width:v.videoWidth,error:v.error?.code||null}));
    assert.ok(state.playback.time>0 && state.playback.width>0 && !state.playback.error);
    await page.evaluate(()=>scrollTo(0,0));await page.screenshot({path:proof.replace('.json',`-reader-${width}.png`)});
   }
   results.push({width,route,...state});
  }
  await page.goto(base,{waitUntil:'networkidle'});
  await page.emulateMedia({reducedMotion:'reduce'});
  const rabbit=page.locator('.footer-rabbit-carrot');await rabbit.scrollIntoViewIfNeeded();
  await rabbit.evaluate(img=>img.decode());
  assert.ok((await rabbit.getAttribute('src')).includes('footer-rabbit-carrot-v2.svg'));
  await page.locator('.wall-card').first().hover();
  assert.equal(await page.locator('.wall-card').first().evaluate(el=>getComputedStyle(el).transform),'none','reduced-motion card');
  await page.keyboard.press('Tab');
  assert.equal(errors.length,0,errors.join('\n'));
  results.push({width,reducedMotion:true,errors});await page.close();
 }
} finally {writeFileSync(proof,JSON.stringify({base,results},null,2));await browser.close()}
console.log(JSON.stringify({base,checked:results.length,passed:true}));
