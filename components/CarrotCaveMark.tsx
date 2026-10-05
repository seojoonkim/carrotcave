import { MARK_INNER } from '@/lib/brand-svg';

interface CarrotCaveMarkProps {
  className?: string;
}

// Brand v4 logo: the rabbit and carrot standing in the cave mouth, drawn from the shared glyph kit
// (scripts/brand/glyphs.py -> lib/brand-svg.ts). Faces are swappable layers: rest = cool + sparkle, hover = joy + love.
export default function CarrotCaveMark({ className = '' }: CarrotCaveMarkProps) {
  return (
    <svg
      className={`carrot-cave-mark ${className}`.trim()}
      viewBox="0 0 96 96"
      aria-hidden="true"
      focusable="false"
      dangerouslySetInnerHTML={{ __html: MARK_INNER }}
    />
  );
}
