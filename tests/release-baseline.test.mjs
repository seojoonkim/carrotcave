import test from 'node:test';
import assert from 'node:assert/strict';
import {mkdtempSync,writeFileSync,rmSync} from 'node:fs';
import {tmpdir} from 'node:os';
import path from 'node:path';
import {execFileSync} from 'node:child_process';
import {checkReleaseBaseline,checkEditorialBaseline} from '../scripts/verify-release-baseline.mjs';

test('release refuses a stale checkout even when local edits are ahead on another branch',()=>{
 const root=mkdtempSync(path.join(tmpdir(),'carrot-stale-'));
 const git=(...args)=>execFileSync('git',args,{cwd:root,encoding:'utf8',stdio:['ignore','pipe','pipe']}).trim();
 try {
  git('init');git('config','user.name','test');git('config','user.email','test@example.invalid');
  writeFileSync(path.join(root,'a'),'v1');git('add','.');git('commit','-m','first');const first=git('rev-parse','HEAD');
  writeFileSync(path.join(root,'a'),'v2');git('commit','-am','teammate thumbnail and classification');const second=git('rev-parse','HEAD');
  git('update-ref','refs/remotes/origin/main',second);
  assert.equal(checkReleaseBaseline({cwd:root,fetch:false}).remoteTip,second);
  git('checkout','-b','old-content',first);writeFileSync(path.join(root,'b'),'new content');git('add','.');git('commit','-m','voice only from old base');
  assert.throws(()=>checkReleaseBaseline({cwd:root,fetch:false}),/STALE_RELEASE/);
  assert.throws(()=>checkReleaseBaseline({cwd:path.join(root,'.git'),fetch:false}));
 }finally{rmSync(root,{recursive:true,force:true});}
});
test('archive categories, restored fallback and video assets are retained',async()=>{
 const result=await checkEditorialBaseline();
 assert(result.preservedCategories>100);
 assert(result.requiredAssets>=3);
});
