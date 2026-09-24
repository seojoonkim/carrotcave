import test from 'node:test';
import assert from 'node:assert/strict';
import {readFileSync} from 'node:fs';
const base='public/voices/mark-zuckerberg-muse/';
test('Every Zuckerberg dialogue turn has exactly one person and preserves the source text',()=>{
 const script=readFileSync(base+'script.js','utf8');
 assert.ok(!script.includes('transcript-timestamp'));
 const data=JSON.parse(readFileSync(base+'transcript-ko.json','utf8'));
 assert.equal(data.items.length,264);
 for(const item of data.items){
  assert.ok(Array.isArray(item.turns)&&item.turns.length>0,`Missing turns ${item.id}`);
  assert.equal(item.turns.map(t=>t.text).join(''),item.text,`Text preservation ${item.id}`);
  for(const turn of item.turns) assert.ok(['마크 저커버그','알렉스 히스'].includes(turn.speaker),`Single speaker ${item.id}`);
 }
 assert.deepEqual(data.items[100].turns.map(t=>t.speaker),['알렉스 히스','마크 저커버그']);
 assert.deepEqual(data.items[251].turns.map(t=>t.speaker),['마크 저커버그','알렉스 히스']);
 assert.equal((readFileSync(base+'index.html','utf8').match(/class="chapter-time"/g)||[]).length,11);
});
