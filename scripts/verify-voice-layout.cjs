const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');
const http = require('node:http');
const { chromium } = require('playwright-core');
const root = path.resolve(__dirname, '..');
const publicRoot = path.join(root, 'public');
const output = process.env.VOICE_LAYOUT_REPORT || '/tmp/voice-layout-report.json';
const live = process.env.VOICE_LAYOUT_BASE;
const slugs = [...fs.readFileSync(path.join(root, 'data/interviews.ts'), 'utf8').matchAll(/slug: '([^']+)'/g)].map(x => x[1]);
const sizes = [[390,844],[844,390],[768,1024],[1024,900],[1280,900],[1600,1000],[1920,1200],[2304,1296]];
const results = [];
const failures = [];
const mime = {'.html':'text/html; charset=utf-8','.js':'text/javascript','.css':'text/css','.json':'application/json','.svg':'image/svg+xml'};
(async () => {
  const server = http.createServer((req,res) => {
    const pathname = decodeURIComponent(new URL(req.url, 'http://localhost').pathname);
    const file = path.resolve(publicRoot, '.' + pathname + (pathname.endsWith('/') ? 'index.html' : ''));
    if (!file.startsWith(publicRoot + path.sep)) { res.writeHead(403); res.end(); return; }
    fs.readFile(file,(err,data)=>{if(err){res.writeHead(404);res.end('Missing');return;}res.setHeader('Content-Type',mime[path.extname(file)] || 'application/octet-stream');res.end(data);});
  });
  await new Promise(resolve=>server.listen(0,'127.0.0.1',resolve));
  const browser = await chromium.launch({executablePath:'/Applications/Google Chrome.app/Contents/MacOS/Google Chrome',headless:true});
  try {
    for (const slug of slugs) {
      const page = await browser.newPage({reducedMotion:'reduce'});
      const errors=[];
      page.on('pageerror',e=>errors.push(e.message));
      // Third-party players are unrelated to local layout; retain real reader/data.
      if (!live) await page.route(/https:\/\/(www\.youtube\.com|player\.bilibili\.com)\//,r=>r.fulfill({body:'',contentType:'text/html'}));
      try {
        await page.goto(`${live || 'http://127.0.0.1:'+server.address().port}/voices/${slug}/${live ? '' : 'index.html'}`,{waitUntil:'domcontentloaded'});
        const frame = live ? await (async()=>{await page.locator('iframe').first().waitFor();const el=await page.locator('iframe').first().elementHandle();return el.contentFrame();})() : page.mainFrame();
        await frame.locator('#menuButton').waitFor();
        await frame.waitForFunction(()=>!document.querySelector('#transcript[aria-busy="true"]'),null,{timeout:15000});
        await frame.evaluate(()=>document.fonts.ready);
        for(const [width,height] of sizes){
          await page.setViewportSize({width,height});
          await frame.locator('#menuButton').click();
          await frame.waitForFunction(()=>document.querySelector('#menuButton').getAttribute('aria-expanded')==='true' && getComputedStyle(document.querySelector('#tocDrawer')).opacity==='1');
          const metrics = await frame.evaluate(()=>{
            const drawer=document.querySelector('#tocDrawer'), nav=drawer.querySelector('nav'), dr=drawer.getBoundingClientRect();
            const titles=[...drawer.querySelectorAll('.toc-chapter-link')].map(a=>{const el=a.querySelector('.toc-chapter-title')||a.lastElementChild;const r=el.getBoundingClientRect();return {text:el.textContent,width:r.width,height:r.height,targetExists:!!document.querySelector(a.getAttribute('href'))};});
            return {drawer:{x:dr.left,right:dr.right,width:dr.width,height:dr.height}, navWidth:nav.getBoundingClientRect().width, viewport:innerWidth, overflow:document.documentElement.scrollWidth-innerWidth,titles};
          });
          const issues=[];
          if(metrics.drawer.x < -1 || metrics.drawer.right > width+1) issues.push('drawer outside viewport');
          if(metrics.navWidth < Math.min(300,width-64)) issues.push('collapsed TOC width');
          if(metrics.overflow > 1) issues.push('page horizontal overflow');
          if(metrics.titles.some(t=>t.width < Math.min(220,width-118)||t.height>130)) issues.push('narrow/vertically-wrapped chapter title');
          if(metrics.titles.some(t=>!t.targetExists)) issues.push('missing chapter target');
          await frame.locator('#tocDrawer nav > a').last().scrollIntoViewIfNeeded();
          const reachable=await frame.locator('#tocDrawer nav > a').last().evaluate(a=>{const r=a.getBoundingClientRect(),d=document.querySelector('#tocDrawer').getBoundingClientRect();return r.top>=d.top-1&&r.bottom<=Math.min(d.bottom,innerHeight)+1;});
          if(!reachable) issues.push('last TOC entry unreachable');
          if(width===1920 || width===390){ await page.screenshot({path:path.join(path.dirname(output),`${slug}-${width}-toc.png`)}); }
          await page.keyboard.press('Escape');
          if(await frame.locator('#menuButton').getAttribute('aria-expanded')!=='false')issues.push('Escape failed');
          await frame.locator('#menuButton').click();
          await frame.locator('#tocDrawer .toc-chapter-link').last().click();
          if(await frame.locator('#menuButton').getAttribute('aria-expanded')!=='false')issues.push('chapter click did not close drawer');
          if(slug==='masayoshi-son-asi-economy'){
            const content=await frame.evaluate(()=>({count:document.querySelectorAll('.paragraph-text').length,times:document.querySelectorAll('.chapter-time').length,last:[...document.querySelectorAll('.paragraph-text')].at(-1).textContent,borders:['#chapter-8','#transcript'].map(sel=>({sel,width:parseFloat(getComputedStyle(document.querySelector(sel)).borderBottomWidth)})),bodyDisplay:getComputedStyle(document.querySelector('.paragraph-text')).display}));
            if(content.borders.some(b=>b.width!==0))issues.push('duplicate closing separators');
            if(content.count!==484||content.times!==8||!content.last.endsWith('감사합니다.')||content.bodyDisplay!=='inline')issues.push('Son content regression');
            metrics.son=content;
          }
          const row={slug,width,height,...metrics,issues}; results.push(row);
          if(issues.length)failures.push({slug,width,issues});
          fs.writeFileSync(output,JSON.stringify({mode:live?'live':'local',slugs,results,failures},null,2));
        }
        if(errors.length) failures.push({slug,errors});
      } catch(error){failures.push({slug,error:String(error)});} finally {await page.close();}
    }
  } finally {await browser.close(); await new Promise(r=>server.close(r));}
  fs.writeFileSync(output,JSON.stringify({mode:live?'live':'local',slugs,results,failures},null,2));
  console.log(JSON.stringify({readers:slugs.length,cases:results.length,failures,report:output},null,2));
  assert.equal(results.length,slugs.length*sizes.length,'Incomplete reader/viewport audit');
  assert.equal(failures.length,0,'Voice layout regression');
})().catch(e=>{console.error(e);process.exitCode=1;});
