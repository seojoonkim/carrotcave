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

function titleSize(title: string, hasImage: boolean) {
  const n = [...title].length;
  const base = hasImage ? 58 : 66;
  if (n > 44) return base - 14;
  if (n > 30) return base - 8;
  return base;
}

export interface OgCardInput {
  kicker: string; // category or "목소리"
  title: string;
  summary?: string;
  image?: string; // data URL
  byline?: string; // e.g. speaker name
}

export async function ogCard({ kicker, title, summary, image, byline }: OgCardInput) {
  const symbol = await localImage('/carrot-cave-symbol.png');
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
        {/* carrot rail on the left edge */}
        <div style={{ position: 'absolute', left: 0, top: 0, bottom: 0, width: 10, background: CARROT, display: 'flex' }} />

        <div style={{ display: 'flex', flexDirection: 'column', justifyContent: 'space-between', padding: '64px 0 60px 82px', width: image ? 700 : 820 }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 16 }}>
            <div style={{ display: 'flex', padding: '9px 16px 10px', borderRadius: 3, background: CARROT, color: INK, fontSize: 24, fontWeight: 700, letterSpacing: -0.3 }}>{kicker}</div>
            {byline ? <div style={{ display: 'flex', color: RABBIT, fontSize: 26, fontWeight: 600 }}>{byline}</div> : null}
          </div>

          <div style={{ display: 'flex', flexDirection: 'column', gap: 22 }}>
            <div style={{ display: 'block', color: TITLE, fontSize: size, fontWeight: 700, lineHeight: 1.2, letterSpacing: -1.6, lineClamp: 3, wordBreak: 'keep-all' }}>{title}</div>
            {summary ? (
              <div style={{ display: 'block', color: BODY, fontSize: 25, fontWeight: 500, lineHeight: 1.5, letterSpacing: -0.4, lineClamp: 2, wordBreak: 'keep-all' }}>{summary}</div>
            ) : null}
          </div>

          <div style={{ display: 'flex', alignItems: 'center', gap: 14 }}>
            {symbol ? <img src={symbol} width={46} height={46} style={{ borderRadius: 3 }} /> : null}
            <div style={{ display: 'flex', color: TITLE, fontSize: 25, fontWeight: 700, letterSpacing: -0.3 }}>CarrotCave</div>
            <div style={{ display: 'flex', color: CARROT, fontSize: 25, fontWeight: 700, marginLeft: -14 }}>.com</div>
          </div>
        </div>

        {image ? (
          <div style={{ position: 'absolute', right: 64, top: 118, width: 380, height: 394, display: 'flex' }}>
            {/* offset carrot block behind the picture = a small, playful lift */}
            <div style={{ position: 'absolute', left: 18, top: 18, width: 380, height: 394, borderRadius: 4, background: CARROT, display: 'flex' }} />
            <img src={image} width={380} height={394} style={{ position: 'absolute', left: 0, top: 0, width: 380, height: 394, objectFit: 'cover', borderRadius: 4, border: '2px solid #0b0e14' }} />
          </div>
        ) : (
          <div style={{ position: 'absolute', right: 96, top: 150, width: 280, height: 330, display: 'flex' }}>
            {/* cave mouth: a thick arch, open at the bottom */}
            <div style={{ position: 'absolute', left: 0, top: 0, width: 280, height: 330, borderTop: '22px solid rgba(214,221,230,.07)', borderLeft: '22px solid rgba(214,221,230,.07)', borderRight: '22px solid rgba(214,221,230,.07)', borderTopLeftRadius: 140, borderTopRightRadius: 140, display: 'flex' }} />
            {/* carrot waiting inside the cave (SVG: the renderer has no clip-path) */}
            <svg width="76" height="120" viewBox="0 0 76 120" style={{ position: 'absolute', left: 102, top: 188 }}>
              <path d="M34 30 C24 8 14 4 8 2 C18 14 24 22 30 32 Z" fill="#8fd18a" />
              <path d="M40 30 C44 10 52 2 62 0 C56 14 50 24 44 32 Z" fill="#6fbf6a" />
              <path d="M37 28 C37 14 38 8 38 4 C39 8 40 14 40 28 Z" fill="#8fd18a" />
              <path d="M18 34 Q38 24 58 34 L42 116 Q38 122 34 116 Z" fill="#f39a52" />
              <path d="M26 52 L36 50 M30 72 L41 70 M34 92 L42 91" stroke="#c8702e" stroke-width="3" stroke-linecap="round" />
            </svg>
          </div>
        )}
      </div>
    ),
    { ...OG_SIZE, fonts: fonts() },
  );
}
