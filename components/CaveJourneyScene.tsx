interface CaveJourneySceneProps {
  depth: number;
  className?: string;
}

const carrotX = [100, 108, 116, 124, 132, 140];

export default function CaveJourneyScene({ depth, className = '' }: CaveJourneySceneProps) {
  const final = depth >= 6;
  const x = 30 + Math.min(depth, 5) * 11;
  const y = 45 + Math.min(depth, 5) * 2;

  return (
    <svg
      className={`cave-journey-scene ${className}`.trim()}
      viewBox="0 0 180 88"
      aria-hidden="true"
      focusable="false"
    >
      <path className="cave-journey-scene__tunnel" d="M4 78C24 19 57 8 91 8s67 16 85 70" />
      <path className="cave-journey-scene__ground" d="M7 78c35-5 65 2 97-2 24-3 43-1 69 2" />
      {!final && (
        <g className="cave-journey-scene__rabbit" transform={`translate(${x} ${y}) rotate(${depth * 3})`}>
          <ellipse cx="0" cy="12" rx="13" ry="8" />
          <circle cx="11" cy="6" r="7" />
          <path d="M8 0 5-17c8 2 10 10 9 18M14 0l5-16c5 6 4 12 1 18" />
          <circle cx="14" cy="5" r="1.2" className="cave-journey-scene__eye" />
          <circle cx="-13" cy="9" r="4" />
          <path d="M-7 18c-4 5-8 6-12 4M8 18c4 5 9 5 13 2" />
        </g>
      )}
      {final && (
        <g className="cave-journey-scene__rabbit cave-journey-scene__rabbit--rest" transform="translate(79 43)">
          <ellipse cx="0" cy="15" rx="14" ry="10" />
          <circle cx="2" cy="3" r="8" />
          <path d="M-2-3-6-20c7 3 9 10 9 17M5-4l4-17c6 7 5 13 2 18" />
          <circle cx="5" cy="2" r="1.2" className="cave-journey-scene__eye" />
        </g>
      )}
      <g className="cave-journey-scene__carrot" transform={`translate(${carrotX[Math.min(depth, 5)]} ${final ? 48 : 55}) rotate(${final ? -10 : 16})`}>
        <path d="M0 0c7 2 10 9 5 22C0 15-3 8 0 0Z" />
        <path d="M1 0c-5-7-4-12-2-15M2 0c5-7 7-11 6-15M1-1c0-8 2-13 4-16" />
      </g>
      {final && <path className="cave-journey-scene__crumbs" d="M114 71h4m5 0h3m5 0h2" />}
    </svg>
  );
}
