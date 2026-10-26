import sharp from 'sharp';
// 캐릭터 없는 빈 동굴 입구 — 목록 대체 썸네일 (캐릭터는 로고·맨 아래 동굴 장면에만)
const s=2.6, w=96*s, x=(1200-w)/2, y=(800-w)/2+8;
const svg=`<svg xmlns="http://www.w3.org/2000/svg" width="1200" height="800" viewBox="0 0 1200 800">
<rect width="1200" height="800" fill="#252732"/>
<g transform="translate(${x} ${y}) scale(${s})">
<path d="M4 92 C4 36 22 4 48 4 C74 4 92 36 92 92 Z" fill="#363948"/>
<path d="M14 92 C14 46 29 18 48 18 C67 18 82 46 82 92 Z" fill="#1E2029"/>
<rect x="10" y="88.6" width="76" height="3.4" rx="1.7" fill="#1A1B23"/>
</g></svg>`;
await sharp(Buffer.from(svg)).png({compressionLevel:9,palette:true}).toFile('public/editorial-card-fallback-v7.png');
console.log('ok');
