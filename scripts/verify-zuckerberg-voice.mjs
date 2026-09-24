import assert from 'node:assert/strict';
import {readFileSync,writeFileSync,mkdirSync} from 'node:fs';
import {dirname} from 'node:path';
import {createHash} from 'node:crypto';
import {chromium} from 'playwright-core';
const base=process.env.APP_URL || 'http://127.0.0.1:3197';
const proof=process.env.PROOF_PATH || '/tmp/zuckerberg-voice-proof.json';
const slug='mark-zuckerberg-muse';
const asset=`public/voices/${slug}/`;
const data=JSON.parse(readFileSync(asset+'transcript-ko.json','utf8'));
const turns=data.items.flatMap(item=>item.turns);
const sha=b=>createHash('sha256').update(b).digest('hex');
const results=[];
const browser=await chromium.launch({channel:'chrome',headless:true});
try {
 for(const width of [390,1280]) {
  const page=await browser.newPage({viewport:{width,height:900},reducedMotion:'reduce'});
  const errors=[];page.on('pageerror',e=>errors.push(e.message));
  const list=await page.goto(`${base}/voices`,{waitUntil:'networkidle'});
  assert.equal(list.status(),200);
  const card=page.locator(`a[href='/voices/${slug}']`);
  assert.equal(await card.count(),1);await card.click();await page.waitForURL(`**/voices/${slug}`);
  const frame=await (await page.locator('iframe.voice-reader-frame').elementHandle()).contentFrame();
  await frame.locator('#transcript[aria-busy="false"]').waitFor({timeout:20000});
  assert.equal(await frame.locator('#transcriptLoading').isVisible(),false);
  assert.equal(await frame.locator('#transcriptError').isVisible(),false);
  const actual=await frame.locator('.transcript-paragraph .paragraph-text').allTextContents();
  assert.deepEqual(actual,turns.map(x=>x.text));
  assert.equal(await frame.locator('.transcript-timestamp').count(),0);
  assert.deepEqual(await frame.locator('.transcript-speaker').allTextContents(),turns.map(x=>x.speaker));
  const speakerColors=await frame.locator('.speaker-person').evaluateAll(nodes=>nodes.map(n=>({name:n.textContent,color:getComputedStyle(n).color})));
  assert.ok(speakerColors.length === turns.length, 'Every turn has person-specific colored tags');
  const expectedColors={'마크 저커버그':'rgb(141, 198, 255)','알렉스 히스':'rgb(240, 190, 112)'};
  assert.ok(speakerColors.every(x=>x.color===expectedColors[x.name]), 'Speaker colors are stable, including mixed turns');
  assert.equal(new Set(speakerColors.map(x=>x.color)).size,2);
  assert.equal(await frame.locator('.transcript-dialogue').count(),turns.length);
  assert.equal(await frame.locator('.transcript-chapter').count(),11);
  assert.ok(await frame.locator('.transcript-paragraph').evaluateAll(nodes=>nodes.every(n=>n.querySelectorAll('.speaker-person').length===1)), 'Exactly one person per turn');
  const chapterCounts=await frame.locator('.transcript-chapter').evaluateAll(nodes=>nodes.map(n=>n.querySelectorAll('.transcript-paragraph').length));
  assert.ok(chapterCounts.every(x=>x>0));
  assert.equal(await frame.locator('body').getAttribute('data-source-url'),data.source);
  const image=frame.locator('.hero-portrait img');await image.evaluate(i=>i.decode());
  assert.ok(await image.evaluate(i=>i.naturalWidth>0));
  await frame.locator('#menuButton').click();
  assert.equal(await frame.locator('#menuButton').getAttribute('aria-expanded'),'true');
  await frame.locator('.toc-chapter-link').first().click();
  assert.equal(await frame.locator('#menuButton').getAttribute('aria-expanded'),'false');
  const navigation=[];
  for(let i=1;i<=11;i++) {
   await frame.locator('#menuButton').click();
   await frame.locator(`.toc-chapter-link[href='#chapter-${i}']`).click();
   await frame.waitForTimeout(80);
   const position=await frame.locator(`#chapter-${i}`).evaluate(el=>({top:el.getBoundingClientRect().top,visible:el.getBoundingClientRect().top<innerHeight,paragraphs:el.querySelectorAll('.transcript-paragraph').length}));
   assert.ok(position.visible&&position.top>=0,`chapter ${i} navigation ${JSON.stringify(position)}`);
   navigation.push({chapter:i,...position});
  }
  const timeLinks=await frame.locator('.chapter-time').evaluateAll(ns=>ns.map(n=>({href:n.href,label:n.textContent.trim()})));
  assert.equal(timeLinks.length,11);
  assert.ok(timeLinks.every(x=>new URL(x.href).searchParams.get('v')==='Lx8lrn-cytc'));
  const overflow=await frame.evaluate(()=>document.documentElement.scrollWidth>innerWidth);
  assert.equal(overflow,false);assert.equal(await page.evaluate(()=>document.documentElement.scrollWidth>innerWidth),false);
  assert.deepEqual(errors,[]);
  const samples=[0,Math.floor(actual.length/2),actual.length-1].map(i=>({index:i,text:actual[i]}));
  results.push({width,paragraphs:actual.length,speakerTags:actual.length,paragraphTimestamps:0,chapters:chapterCounts,navigation,timeLinks,samples,overflow,errors});
  await frame.evaluate(()=>scrollTo(0,0));await page.screenshot({path:proof.replace('.json',`-${width}.png`)});
  await page.close();
 }
 const request=await browser.newPage();const assets=[];
 for(const file of ['transcript-ko.json','source-en.json','zuckerberg-muse.jpg','index.html','script.js','styles.css']) {
  const response=await request.request.get(`${base}/voices/${slug}/${file}`);assert.equal(response.status(),200);
  const bytes=await response.body();assert.equal(sha(bytes),sha(readFileSync(asset+file)));
  assets.push({file,sha256:sha(bytes),bytes:bytes.length});
 }
 mkdirSync(dirname(proof),{recursive:true});writeFileSync(proof,JSON.stringify({base,checkedAt:new Date().toISOString(),passed:true,results,assets},null,2));
 console.log(JSON.stringify({base,viewports:results.map(r=>r.width),paragraphs:turns.length,chapters:11,passed:true,proof}));
} finally {await browser.close();}
