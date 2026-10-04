import { readFileSync, existsSync } from 'node:fs';
import { join, extname } from 'node:path';
import { ImageResponse } from 'next/og';
import { titleClamp, titleSize, usableOgImage } from './og-rules';

export { titleClamp, titleSize, titleWidth } from './og-rules';

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
  if (!usableOgImage(publicPath, ROOT)) return undefined; // remote, missing, or has Korean text
  if (!publicPath) return undefined;
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
const MARK_SVG = `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 96 96"><defs><radialGradient id="og-mark-glow" cx="50%" cy="62%" r="52%"><stop offset="0" stop-color="#ffd27a" stop-opacity=".85"/><stop offset=".5" stop-color="#e8923e" stop-opacity=".32"/><stop offset="1" stop-color="#d06f2d" stop-opacity="0"/></radialGradient></defs><g data-part="cave"><circle cx="48" cy="54" r="40" fill="url(#og-mark-glow)"/><path d="M5 90C7 40 23 9 48 7c25 2 41 33 43 83H76C74 52 64 30 48 27 32 30 22 52 20 90Z" fill="#0b0f16"/><path d="M14 90c2-38 15-61 34-67 19 6 32 29 34 67" fill="none" stroke="#f0b04f" stroke-opacity=".6" stroke-width="2.2"/><path d="M3 90h90" stroke="#f0c15d" stroke-opacity=".45" stroke-width="2.4" stroke-linecap="round"/></g><g data-part="rabbit-position"><g data-part="rabbit"><ellipse cx="35" cy="33" rx="5.2" ry="13.5" fill="#f6f8fb" transform="rotate(-12 35 33)"/><ellipse cx="35" cy="34" rx="2.3" ry="9" fill="#f4a9b6" transform="rotate(-12 35 34)"/><ellipse cx="49" cy="32" rx="5.2" ry="14" fill="#f6f8fb" transform="rotate(10 49 32)"/><ellipse cx="49" cy="33" rx="2.3" ry="9.5" fill="#f4a9b6" transform="rotate(10 49 33)"/><ellipse cx="42" cy="79" rx="13" ry="10.5" fill="#e3e9f1"/><circle cx="42" cy="56" r="14.5" fill="#f6f8fb"/><circle data-part="eye" cx="36.6" cy="56" r="2.5" fill="#11151c"/><circle data-part="eye" cx="47.4" cy="56" r="2.5" fill="#11151c"/><circle cx="37.5" cy="55" r=".85" fill="#fff"/><circle cx="48.3" cy="55" r=".85" fill="#fff"/><ellipse cx="31.8" cy="61.4" rx="3" ry="1.8" fill="#f4a0a8" opacity=".85"/><ellipse cx="52.2" cy="61.4" rx="3" ry="1.8" fill="#f4a0a8" opacity=".85"/><ellipse cx="42" cy="59.6" rx="1.3" ry="1" fill="#e8909b"/><path d="M40.4 61.4q1.6 1.3 3.2 0" fill="none" stroke="#c27b84" stroke-width="1.1" stroke-linecap="round"/><ellipse cx="35" cy="88" rx="5.6" ry="2.5" fill="#e3e9f1"/><ellipse cx="49" cy="88" rx="5.6" ry="2.5" fill="#e3e9f1"/><ellipse cx="53.5" cy="74" rx="3.4" ry="2.8" fill="#f6f8fb"/></g></g><g data-part="carrot-position" transform="translate(62 62) rotate(16)"><g data-part="carrot"><path d="M-3 -4C-6 -11 -5 -16 -2 -19M0 -4c0-8 2-13 5-15M2 -3c5-6 9-8 13-7" fill="none" stroke="#79a85b" stroke-width="3.2" stroke-linecap="round"/><path d="M-7 -4h14c1.2 7-2.2 16-7 24-4.8-8-8.2-17-7-24Z" fill="#f39a52" stroke="#c96a26" stroke-width="1" stroke-linejoin="round"/><path d="M-4 4h3M2 9h3M-2 13h2.4" stroke="#ffad4d" stroke-width="1.3" stroke-linecap="round"/><circle cx="-2.4" cy="1.2" r="1" fill="#5a2a0e"/><circle cx="2.4" cy="1.2" r="1" fill="#5a2a0e"/><path d="M-1.2 3.4q1.2.9 2.4 0" fill="none" stroke="#5a2a0e" stroke-width=".9" stroke-linecap="round"/></g></g></svg>`;
export const MARK_DATA_URL = `data:image/svg+xml;base64,${Buffer.from(MARK_SVG).toString('base64')}`;

/** English-only card copy. Hangul in any field is a bug (tests check the inputs). */
export const CATEGORY_EN: Record<string, string> = { 탐험: 'EXPLORE', 빌딩: 'BUILD', 낙서: 'DOODLE', 소설: 'FICTION', 목소리: 'VOICES' };
export const TAGLINE_EN = 'Followed the rabbit. Lost the thread.';

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
            <div style={{ display: 'block', color: TITLE, fontSize: size, fontWeight: 700, lineHeight: 1.06, letterSpacing: -2, lineClamp: titleClamp(size) }}>{title}</div>
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
