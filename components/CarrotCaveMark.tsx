interface CarrotCaveMarkProps {
  className?: string;
}

export default function CarrotCaveMark({ className = '' }: CarrotCaveMarkProps) {
  return (
    <svg className={`carrot-cave-mark ${className}`.trim()} viewBox="0 0 96 96" aria-hidden="true" focusable="false">
      <defs>
        <radialGradient id="cc-mark-glow" cx="50%" cy="54%" r="48%">
          <stop offset="0" stopColor="#f7d46a" stopOpacity=".7" />
          <stop offset=".55" stopColor="#d98c36" stopOpacity=".24" />
          <stop offset="1" stopColor="#d06f2d" stopOpacity="0" />
        </radialGradient>
      </defs>
      <g className="carrot-cave-mark__cave">
        <circle cx="48" cy="49" r="43" fill="url(#cc-mark-glow)" />
        <path d="M12 82C15 38 28 15 48 12c20 3 33 26 36 70H69C67 50 60 31 48 28 36 31 29 50 27 82Z" fill="#171b23" />
        <path d="M20 82c3-31 12-51 28-57 16 6 25 26 28 57" fill="none" stroke="#e1a247" strokeOpacity=".5" strokeWidth="2" />
        <path d="M9 83h78" stroke="#f0c15d" strokeOpacity=".34" strokeWidth="2" strokeLinecap="round" />
      </g>
      <g className="carrot-cave-mark__rabbit-position">
        <g className="carrot-cave-mark__rabbit">
        <ellipse cx="43" cy="57" rx="11" ry="13" fill="#f1eee7" />
        <circle cx="43" cy="43" r="9" fill="#f1eee7" />
        <ellipse cx="38" cy="30" rx="3.5" ry="11" fill="#f1eee7" transform="rotate(-9 38 30)" />
        <ellipse cx="47" cy="29" rx="3.5" ry="12" fill="#f1eee7" transform="rotate(7 47 29)" />
        <circle cx="47" cy="42" r="1.4" fill="#252832" />
        <ellipse cx="34" cy="66" rx="6" ry="3" fill="#f1eee7" />
        <ellipse cx="50" cy="67" rx="6" ry="3" fill="#f1eee7" />
        </g>
      </g>
      <g className="carrot-cave-mark__carrot-position" transform="translate(61 54) rotate(-14)">
        <g className="carrot-cave-mark__carrot">
        <path d="M0 0c9 1 13 7 8 24C2 17-2 8 0 0Z" fill="#ed7d31" />
        <path d="M3 1C0-7 1-13 4-17M5 1c4-8 8-12 12-14M4 0c7-5 12-6 16-5" fill="none" stroke="#71b77a" strokeWidth="3" strokeLinecap="round" />
        <path d="m2 7 6 2m-5 5 4 1" stroke="#f6b45f" strokeWidth="1.2" strokeLinecap="round" />
        </g>
      </g>
    </svg>
  );
}
