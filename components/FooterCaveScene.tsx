export default function FooterCaveScene() {
  return (
    <svg className="footer-cave-scene" viewBox="0 0 1100 260" role="img" aria-label="빛나는 당근을 발견한 토끼가 있는 깊은 동굴">
      <defs>
        <linearGradient id="footer-cave-sky" x1="0" y1="0" x2="0" y2="1">
          <stop offset="0" stopColor="#1d2027" />
          <stop offset="1" stopColor="#292a2d" />
        </linearGradient>
        <radialGradient id="footer-carrot-glow" cx="69%" cy="64%" r="30%">
          <stop offset="0" stopColor="#f6c55c" stopOpacity=".42" />
          <stop offset=".45" stopColor="#d98636" stopOpacity=".14" />
          <stop offset="1" stopColor="#d86e2e" stopOpacity="0" />
        </radialGradient>
        <filter id="footer-soft-glow" x="-80%" y="-80%" width="260%" height="260%">
          <feGaussianBlur stdDeviation="7" />
        </filter>
      </defs>
      <rect width="1100" height="260" fill="url(#footer-cave-sky)" />
      <ellipse cx="755" cy="165" rx="230" ry="125" fill="url(#footer-carrot-glow)" />
      <g className="footer-cave-scene__cave">
        <path d="M0 0h1100v260H0Z M116 260C145 100 276 28 550 24c274 4 405 76 434 236Z" fill="#11141a" fillRule="evenodd" />
        <path d="M55 260C88 70 250 5 550 8c300-3 462 62 495 252" fill="none" stroke="#41434a" strokeWidth="18" strokeOpacity=".48" />
        <path d="M116 260C145 100 276 28 550 24c274 4 405 76 434 236" fill="none" stroke="#5a5146" strokeWidth="5" strokeOpacity=".55" />
        <path d="M170 218c80-19 134-12 202 3 73 16 142 8 214-5 98-18 188-17 335 13" fill="none" stroke="#77716a" strokeWidth="3" strokeOpacity=".38" />
        <path d="M236 82l24 35 21-45 30 31 31-54M822 79l-25 37-23-42-29 30-34-51" fill="none" stroke="#34373e" strokeWidth="8" strokeLinecap="round" strokeLinejoin="round" />
        <g fill="#5e5a55" opacity=".65">
          <circle cx="207" cy="185" r="7"/><circle cx="231" cy="196" r="3"/><circle cx="878" cy="188" r="8"/><circle cx="902" cy="201" r="4"/>
          <circle cx="326" cy="225" r="5"/><circle cx="620" cy="226" r="4"/><circle cx="679" cy="218" r="3"/>
        </g>
      </g>
      <g className="footer-cave-scene__rabbit-position" transform="translate(478 139)">
        <g className="footer-cave-scene__rabbit">
        <ellipse cx="0" cy="49" rx="42" ry="31" fill="#e9e6df" />
        <circle cx="31" cy="23" r="28" fill="#f1eee7" />
        <ellipse cx="18" cy="-13" rx="10" ry="35" fill="#f1eee7" transform="rotate(-10 18 -13)" />
        <ellipse cx="42" cy="-15" rx="10" ry="37" fill="#f1eee7" transform="rotate(8 42 -15)" />
        <ellipse cx="18" cy="-13" rx="4" ry="27" fill="#d7a3a1" opacity=".58" transform="rotate(-10 18 -13)" />
        <ellipse cx="42" cy="-15" rx="4" ry="29" fill="#d7a3a1" opacity=".58" transform="rotate(8 42 -15)" />
        <circle cx="40" cy="19" r="3" fill="#252832" />
        <path d="M54 28c5 2 6 5 1 7" fill="none" stroke="#9c7772" strokeWidth="2" strokeLinecap="round" />
        <circle cx="-42" cy="43" r="16" fill="#f1eee7" />
        <ellipse cx="-23" cy="74" rx="24" ry="9" fill="#e9e6df" />
        <ellipse cx="29" cy="76" rx="25" ry="9" fill="#e9e6df" />
        </g>
      </g>
      <g className="footer-cave-scene__carrot-position" transform="translate(727 157) rotate(-11)">
        <g className="footer-cave-scene__carrot">
        <ellipse cx="15" cy="31" rx="60" ry="45" fill="#e89139" opacity=".13" filter="url(#footer-soft-glow)" />
        <path d="M0 0c31 3 46 25 25 82C6 61-8 27 0 0Z" fill="#ed7d31" />
        <path d="m4 18 25 6M7 37l18 4M11 55l10 2" stroke="#f5b05a" strokeWidth="4" strokeLinecap="round" opacity=".7" />
        <path d="M10 2C-1-22 2-45 13-60M16 2c15-25 31-41 49-50M14 1c25-14 44-17 61-13" fill="none" stroke="#75b77a" strokeWidth="11" strokeLinecap="round" />
        </g>
      </g>
      <path d="M594 214c25 2 46 2 69-1m-47-13 12 2m58 5 8-2" fill="none" stroke="#d3aa61" strokeWidth="3" strokeLinecap="round" strokeOpacity=".42" />
    </svg>
  );
}
