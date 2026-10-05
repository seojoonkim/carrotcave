import { readFileSync, existsSync } from 'node:fs';
import { join, extname } from 'node:path';
import { ImageResponse } from 'next/og';
import { titleClamp, titleSize, usableOgImage } from './og-rules';

export { titleClamp, titleSize, titleWidth } from './og-rules';

// One share-card template for every page: dark cave (#1e1f28), glyph-kit rabbit + carrot in the cave arch, carrot accent.
// Rendered at build time (static params), so fonts/images are read from disk.

export const OG_SIZE = { width: 1200, height: 630 };

const ROOT = process.cwd();
const INK = '#1e1f28';
const CARROT = '#ff7a3d';
const RABBIT = '#14d3a0';
const TITLE = '#f2f3f8';
const BODY = '#b7bccf';
const PANEL = '#2e3142';

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

// Brand v4 art from the shared glyph kit (scripts/brand -> lib/brand-svg.ts). Tests keep it in sync.
import { MARK_SVG, OG_ART_SVG } from './brand-svg';
export const MARK_DATA_URL = `data:image/svg+xml;base64,${Buffer.from(MARK_SVG).toString('base64')}`;
export const OG_ART_DATA_URL = `data:image/svg+xml;base64,${Buffer.from(OG_ART_SVG).toString('base64')}`;

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
          backgroundImage: 'radial-gradient(circle at 82% 120%, rgba(58,62,82,.9) 0%, rgba(30,31,40,0) 62%), radial-gradient(circle at 0% 0%, rgba(20,211,160,.07) 0%, rgba(30,31,40,0) 40%)',
          fontFamily: 'Pretendard',
          overflow: 'hidden',
        }}
      >
        <div style={{ position: 'absolute', left: 0, top: 0, bottom: 0, width: 12, background: CARROT, display: 'flex' }} />

        <div style={{ display: 'flex', flexDirection: 'column', justifyContent: 'space-between', padding: '60px 0 56px 80px', width: image ? 660 : 780 }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 22 }}>
            <div style={{ display: 'flex', padding: '10px 24px 11px', borderRadius: 999, background: CARROT, color: INK, fontSize: 34, fontWeight: 700, letterSpacing: 2 }}>{label}</div>
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
            <div style={{ position: 'absolute', left: 18, top: 18, width: 400, height: 410, borderRadius: 28, background: PANEL, display: 'flex' }} />
            <img src={image} width={400} height={410} style={{ position: 'absolute', left: 0, top: 0, width: 400, height: 410, objectFit: 'cover', borderRadius: 24, border: '2px solid #3a3e52' }} />
          </div>
        ) : (
          <div style={{ position: 'absolute', right: 40, bottom: 0, width: 380, height: 400, display: 'flex' }}><img src={OG_ART_DATA_URL} width={380} height={400} /></div>
        )}
      </div>
    ),
    { ...OG_SIZE, fonts: fonts() },
  );
}
