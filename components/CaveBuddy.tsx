import { BUDDY_INNER } from '@/lib/brand-svg';

// The rabbit-and-carrot pair, speaking in a soft bubble. Used for empty, done and lost states.
// Each mood shows its own expression pair from the shared glyph kit; both blink now and then.
export default function CaveBuddy({ children, mood = 'idle' }: { children: React.ReactNode; mood?: 'idle' | 'happy' | 'lost' }) {
  return (
    <div className={`cc-buddy cc-buddy--${mood}`}>
      <svg className="cc-buddy__mark" viewBox="0 0 132 96" aria-hidden="true" focusable="false" dangerouslySetInnerHTML={{ __html: BUDDY_INNER }} />
      <div className="cc-buddy__bubble">{children}</div>
    </div>
  );
}
