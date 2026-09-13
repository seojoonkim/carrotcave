#!/usr/bin/env node
import {execFileSync,spawnSync} from 'node:child_process';
import {mkdirSync,rmSync,writeFileSync,readFileSync} from 'node:fs';
import {homedir} from 'node:os';
import {fileURLToPath} from 'node:url';
import path from 'node:path';
import {checkReleaseBaseline,checkEditorialBaseline} from './verify-release-baseline.mjs';

const root=path.resolve(path.dirname(fileURLToPath(import.meta.url)),'..');
const git=args=>execFileSync('git',args,{cwd:root,encoding:'utf8'}).trim();
const project=JSON.parse(readFileSync(path.join(root,'.vercel/project.json'),'utf8'));
if(project.projectId!=='prj_AM4KJ0bokdOUDxaqzqrfvFl6seul' || project.projectName!=='carrotcave') throw new Error('Unexpected Vercel project; refusing production release.');
const lockRoot=path.join(homedir(),'.hermes/shared/release-locks');
mkdirSync(lockRoot,{recursive:true});
const lock=path.join(lockRoot,`${project.projectId}.lock`);
let locked=false;
function run(bin,args,env={}) {
 const r=spawnSync(bin,args,{cwd:root,stdio:'inherit',env:{...process.env,...env}});
 if(r.status!==0)throw new Error(`${bin} ${args.join(' ')} failed (${r.status ?? r.error})`);
}
try {
 try {mkdirSync(lock);locked=true;}catch{throw new Error('Another production release owns the shared lock. Do not remove a live lock.');}
 writeFileSync(path.join(lock,'owner.json'),JSON.stringify({pid:process.pid,root,started:new Date().toISOString()}));
 if(git(['status','--porcelain']))throw new Error('Release requires a clean, committed worktree. Preserve unrelated work in a separate worktree.');
 const baseline=checkReleaseBaseline({cwd:root});
 if(baseline.head!==baseline.remoteTip)throw new Error('Push the reviewed release commit without force before deploying. HEAD must equal origin/main.');
 await checkEditorialBaseline(root);
 run('npm',['run','verify']);
 run(process.execPath,['scripts/verify-voice-layout.cjs']);
 const latest=checkReleaseBaseline({cwd:root});
 if(latest.head!==baseline.head || latest.remoteTip!==baseline.remoteTip)throw new Error('Remote changed during verification; integrate and reverify.');
 if(git(['status','--porcelain']))throw new Error('Verification modified source files; commit/review before release.');
 if(process.argv.includes('--check-only'))console.log('Release preflight PASS; deployment not requested.');
 else {
  run('vercel',['--prod','--yes']);
  run(process.execPath,['scripts/verify-voice-layout.cjs'],{VOICE_LAYOUT_BASE:'https://carrotcave.com',VOICE_LAYOUT_REPORT:'/tmp/carrot-voice-production.json'});
  run(process.execPath,['scripts/verify-recovery-live.mjs'],{APP_URL:'https://carrotcave.com',PROOF_PATH:'/tmp/carrot-recovery-production.json'});
  console.log(`VERIFIED_RELEASE ${baseline.head}`);
 }
} catch(e){console.error(e.message);process.exitCode=1;}
finally {if(locked)rmSync(lock,{recursive:true});}
