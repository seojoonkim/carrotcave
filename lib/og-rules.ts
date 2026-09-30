import { existsSync } from 'node:fs';
import { join, extname } from 'node:path';
import hangulImages from '../data/og-image-hangul.json' with { type: 'json' };

// Share-card rules shared by the renderer (og-card.tsx) and the audits, so they cannot drift.
export function titleSize(title: string, hasImage: boolean) {
  const n = title.length;
  if (hasImage) return n > 26 ? 76 : n > 18 ? 80 : 88;
  return n > 34 ? 76 : n > 24 ? 88 : 100;
}
export const titleClamp = (_size: number) => 3;
/** Title column inner width: card column minus left padding. */
export const titleWidth = (hasImage: boolean) => (hasImage ? 660 : 780) - 80;

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
