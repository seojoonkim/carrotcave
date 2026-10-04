// Pure helpers for the footer scene (tested in tests/footer-scene-moods.test.mjs).
export type SceneMood = 'all' | 'explore' | 'build' | 'doodle' | 'fiction' | 'voices';
export type Daypart = 'day' | 'dusk' | 'night';

export const CARROT_LINES = ['들켰다!', '간지러워요', '당근 아니에요', '쉿, 숨는 중', '또 놀러 와요'];

/** KST hour → time of day. The scene follows the reader's own clock. */
export function daypartOf(hour: number): Daypart {
  if (hour >= 6 && hour < 17) return 'day';
  if (hour >= 17 && hour < 19) return 'dusk';
  return 'night';
}
/** A post dated today or yesterday (KST) raises the NEW flag. */
export function isFresh(latest: string | undefined, now = Date.now()) {
  if (!latest) return false;
  const t = Date.parse(`${latest}T00:00:00+09:00`);
  return Number.isFinite(t) && now >= t && now - t < 2 * 86400000;
}
