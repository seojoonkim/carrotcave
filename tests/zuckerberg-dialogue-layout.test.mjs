import test from 'node:test';
import assert from 'node:assert/strict';
import {readFileSync} from 'node:fs';
const base='public/voices/mark-zuckerberg-muse/';
test('Zuckerberg uses archive speaker tags without paragraph timestamps',()=>{
 const script=readFileSync(base+'script.js','utf8');
 assert.ok(script.includes("speaker.className = 'transcript-speaker'"));
 assert.ok(script.includes("paragraph.className = 'transcript-paragraph transcript-dialogue'"));
 assert.ok(!script.includes('transcript-timestamp'));
 const data=JSON.parse(readFileSync(base+'transcript-ko.json','utf8'));
 assert.equal(data.items.length,264);
 for(const item of data.items) assert.ok(['마크 저커버그','알렉스 히스','마크 저커버그 · 알렉스 히스'].includes(item.speaker));
 assert.equal(data.items[0].speaker,'알렉스 히스');
 assert.equal(data.items[1].speaker,'마크 저커버그');
 assert.equal(data.items[100].speaker,'마크 저커버그 · 알렉스 히스');
 assert.equal((readFileSync(base+'index.html','utf8').match(/class="chapter-time"/g)||[]).length,11);
});
