import { existsSync } from 'node:fs';
import { join, extname } from 'node:path';
import hangulImages from '../data/og-image-hangul.json' with { type: 'json' };

// Share-card rules shared by the renderer (og-card.tsx) and the audits, so they cannot drift.
export function titleSize(title: string, _hasImage: boolean) {
  // Centered crop-safe column (SAFE.width 570 in og-card.tsx): every English title fits 3 lines at these tiers.
  const n = title.length;
  return n > 46 ? 60 : n > 40 ? 64 : n > 30 ? 70 : n > 20 ? 76 : 84;
}
export const titleClamp = (_size: number) => 3;
/** Title column width: the centered crop-safe column (same for picture and no-picture cards). */
export const titleWidth = (_hasImage: boolean) => 570;

const SUPPORTED = new Set(['.jpg', '.jpeg', '.png', '.webp', '.gif', '.avif']);
/** Pictures with Korean text inside them (OCR, scripts/og-image-hangul.swift). Never shown in share cards. */
export const HANGUL_IMAGES = new Set<string>(hangulImages as string[]);
/** Whether a local /public picture may appear in a share card. */
export function usableOgImage(publicPath: string | undefined, root = process.cwd()) {
  if (!publicPath || /^https?:/.test(publicPath)) return false;
  const clean = publicPath.split('?')[0];
  if (HANGUL_IMAGES.has(clean)) return false;
  return SUPPORTED.has(extname(clean).toLowerCase()) && existsSync(join(root, 'public', clean));
}
