import CarrotCaveMark from './CarrotCaveMark';

// The rabbit-and-carrot pair, speaking in a soft bubble. Used for empty, done and lost states.
export default function CaveBuddy({ children, mood = 'idle' }: { children: React.ReactNode; mood?: 'idle' | 'happy' | 'lost' }) {
  return (
    <div className={`cc-buddy cc-buddy--${mood}`}>
      <CarrotCaveMark className="cc-buddy__mark" />
      <div className="cc-buddy__bubble">{children}</div>
    </div>
  );
}
