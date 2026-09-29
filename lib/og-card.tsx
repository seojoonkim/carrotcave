import { readFileSync, existsSync } from 'node:fs';
import { join, extname } from 'node:path';
import { ImageResponse } from 'next/og';

// One share-card template for every page: ink-navy cave, carrot accent, bright title.
// Rendered at build time (static params), so fonts/images are read from disk.

export const OG_SIZE = { width: 1200, height: 630 };

const ROOT = process.cwd();
const INK = '#0b0e14';
const CARROT = '#f39a52';
const RABBIT = '#7fd6e8';
const TITLE = '#f4f6fa';
const BODY = '#aab4c2';

let fontCache: { name: string; data: Buffer; weight: 500 | 600 | 700; style: 'normal' }[] | null = null;
function fonts() {
  if (!fontCache) {
    fontCache = ([['Medium', 500], ['SemiBold', 600], ['Bold', 700]] as const).map(([file, weight]) => ({
      name: 'Pretendard',
      data: readFileSync(join(ROOT, 'assets/og', `Pretendard-${file}.otf`)),
      weight,
      style: 'normal' as const,
    }));
  }
  return fontCache;
}

const DIRECT: Record<string, string> = { '.jpg': 'image/jpeg', '.jpeg': 'image/jpeg', '.png': 'image/png' };
const CONVERT = new Set(['.webp', '.gif', '.avif']);

/**
 * Local /public path → data URL. The OG renderer only decodes JPEG/PNG, so WebP/GIF/AVIF
 * are converted to JPEG with sharp first. Missing, remote, or undecodable → undefined
 * (the card then uses its no-picture layout instead of failing the build).
 */
export async function localImage(publicPath?: string) {
  if (!publicPath || /^https?:/.test(publicPath)) return undefined;
  const file = join(ROOT, 'public', publicPath.split('?')[0]);
  const ext = extname(file).toLowerCase();
  if (!existsSync(file)) return undefined;
  try {
    if (DIRECT[ext]) return `data:${DIRECT[ext]};base64,${readFileSync(file).toString('base64')}`;
    if (CONVERT.has(ext)) {
      const { default: sharp } = await import('sharp');
      const jpeg = await sharp(file, { animated: false }).resize(800, 800, { fit: 'inside', withoutEnlargement: true }).jpeg({ quality: 86 }).toBuffer();
      return `data:image/jpeg;base64,${jpeg.toString('base64')}`;
    }
  } catch {
    return undefined;
  }
  return undefined;
}

// The site's original header icon (components/CarrotCaveMark.tsx), as a static SVG.
// Same paths and colors; tests keep the two in sync.
const MARK_SVG = `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 96 96">
<defs><radialGradient id="g" cx="50%" cy="50%" r="50%"><stop offset="0" stop-color="#f7d46a" stop-opacity=".7"/><stop offset=".55" stop-color="#d98c36" stop-opacity=".24"/><stop offset="1" stop-color="#d06f2d" stop-opacity="0"/></radialGradient></defs>
<circle cx="48" cy="49" r="43" fill="url(#g)"/>
<path d="M12 82C15 38 28 15 48 12c20 3 33 26 36 70H69C67 50 60 31 48 28 36 31 29 50 27 82Z" fill="#090c11"/>
<path d="M20 82c3-31 12-51 28-57 16 6 25 26 28 57" fill="none" stroke="#e1a247" stroke-opacity=".5" stroke-width="2"/>
<path d="M9 83h78" stroke="#f0c15d" stroke-opacity=".34" stroke-width="2" stroke-linecap="round"/>
<ellipse cx="43" cy="57" rx="11" ry="13" fill="#e6ebf2"/><circle cx="43" cy="43" r="9" fill="#e6ebf2"/>
<ellipse cx="38" cy="30" rx="3.5" ry="11" fill="#e6ebf2" transform="rotate(-9 38 30)"/><ellipse cx="47" cy="29" rx="3.5" ry="12" fill="#e6ebf2" transform="rotate(7 47 29)"/>
<circle cx="39" cy="42" r="1.8" fill="#11151c"/><circle cx="47" cy="42" r="1.8" fill="#11151c"/>
<ellipse cx="34" cy="66" rx="6" ry="3" fill="#e6ebf2"/><ellipse cx="50" cy="67" rx="6" ry="3" fill="#e6ebf2"/>
<g transform="translate(61 54) rotate(-14)"><path d="M0 0c9 1 13 7 8 24C2 17-2 8 0 0Z" fill="#f39a52"/>
<path d="M3 1C0-7 1-13 4-17M5 1c4-8 8-12 12-14M4 0c7-5 12-6 16-5" fill="none" stroke="#79a85b" stroke-width="3.5" stroke-linecap="round"/>
<path d="m2 7 6 2m-5 5 4 1" stroke="#ffad4d" stroke-width="1.2" stroke-linecap="round"/></g>
</svg>`;
export const MARK_DATA_URL = `data:image/svg+xml;base64,${Buffer.from(MARK_SVG).toString('base64')}`;

/** English-only card copy. Hangul in any field is a bug (tests check the inputs). */
export const CATEGORY_EN: Record<string, string> = { 탐험: 'EXPLORE', 빌딩: 'BUILD', 낙서: 'DOODLE', 소설: 'FICTION', 목소리: 'VOICES' };
export const TAGLINE_EN = 'Field Notes from the Rabbit Hole';

const MONTHS = ['JAN', 'FEB', 'MAR', 'APR', 'MAY', 'JUN', 'JUL', 'AUG', 'SEP', 'OCT', 'NOV', 'DEC'];
export function dateEn(iso?: string) {
  const m = iso && /^(\d{4})-(\d{2})-(\d{2})/.exec(iso);
  return m ? `${MONTHS[Number(m[2]) - 1]} ${Number(m[3])}, ${m[1]}` : undefined;
}

const HANGUL = /[\u1100-\u11ff\u3130-\u318f\uac00-\ud7af]/;
function englishOnly(v?: string) {
  return v && !HANGUL.test(v) ? v : undefined;
}

export interface OgCardInput {
  label: string; // EXPLORE / VOICES …
  title: string; // big line
  sub?: string; // one supporting line
  meta?: string; // date
  image?: string; // data URL
}

function titleSize(title: string, hasImage: boolean) {
  const n = title.length;
  if (hasImage) return n > 26 ? 76 : n > 18 ? 80 : 88;
  return n > 34 ? 76 : n > 24 ? 88 : 100;
}

export async function ogCard(input: OgCardInput) {
  const label = englishOnly(input.label) ?? 'CARROTCAVE';
  const title = englishOnly(input.title) ?? TAGLINE_EN;
  const sub = englishOnly(input.sub);
  const meta = englishOnly(input.meta);
  const { image } = input;
  const size = titleSize(title, Boolean(image));
  return new ImageResponse(
    (
      <div
        style={{
          width: '100%',
          height: '100%',
          display: 'flex',
          position: 'relative',
          backgroundColor: INK,
          backgroundImage: 'radial-gradient(circle at 100% 0%, rgba(127,214,232,.10) 0%, rgba(11,14,20,0) 50%), radial-gradient(circle at 0% 100%, rgba(127,214,232,.07) 0%, rgba(11,14,20,0) 45%)',
          fontFamily: 'Pretendard',
          overflow: 'hidden',
        }}
      >
        <div style={{ position: 'absolute', left: 0, top: 0, bottom: 0, width: 12, background: CARROT, display: 'flex' }} />

        <div style={{ display: 'flex', flexDirection: 'column', justifyContent: 'space-between', padding: '60px 0 56px 80px', width: image ? 660 : 780 }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 22 }}>
            <div style={{ display: 'flex', padding: '10px 20px 11px', borderRadius: 4, background: CARROT, color: INK, fontSize: 34, fontWeight: 700, letterSpacing: 2 }}>{label}</div>
            {meta ? <div style={{ display: 'flex', color: BODY, fontSize: 32, fontWeight: 600, letterSpacing: 1 }}>{meta}</div> : null}
          </div>

          <div style={{ display: 'flex', flexDirection: 'column', gap: 18 }}>
            <div style={{ display: 'block', color: TITLE, fontSize: size, fontWeight: 700, lineHeight: 1.06, letterSpacing: -2, lineClamp: 3 }}>{title}</div>
            {sub ? <div style={{ display: 'block', color: RABBIT, fontSize: 34, fontWeight: 600, lineHeight: 1.3, letterSpacing: 0.5, lineClamp: 2 }}>{sub}</div> : null}
          </div>

          <div style={{ display: 'flex', alignItems: 'center' }}>
            <div style={{ display: 'flex', color: TITLE, fontSize: 40, fontWeight: 700, letterSpacing: -0.5 }}>carrotcave</div>
            <div style={{ display: 'flex', color: CARROT, fontSize: 40, fontWeight: 700 }}>.com</div>
          </div>
        </div>

        {image ? (
          <div style={{ position: 'absolute', right: 60, top: 104, width: 400, height: 410, display: 'flex' }}>
            <div style={{ position: 'absolute', left: 18, top: 18, width: 400, height: 410, borderRadius: 4, background: CARROT, display: 'flex' }} />
            <img src={image} width={400} height={410} style={{ position: 'absolute', left: 0, top: 0, width: 400, height: 410, objectFit: 'cover', borderRadius: 4, border: '2px solid #0b0e14' }} />
          </div>
        ) : (
          <img src={MARK_DATA_URL} width={360} height={360} style={{ position: 'absolute', right: 40, top: 120, opacity: 0.9 }} />
        )}
      </div>
    ),
    { ...OG_SIZE, fonts: fonts() },
  );
}
