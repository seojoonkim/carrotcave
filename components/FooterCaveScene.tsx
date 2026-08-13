export default function FooterCaveScene() {
  return (
    <svg className="footer-cave-scene" viewBox="0 0 1100 260" role="img" aria-label="빛나는 당근을 발견한 토끼가 있는 깊은 동굴">
      <defs>
        <radialGradient id="footer-carrot-glow" cx="69%" cy="65%" r="31%">
          <stop offset="0" stopColor="#ffc96a" stopOpacity=".34" />
          <stop offset=".46" stopColor="#dc873c" stopOpacity=".12" />
          <stop offset="1" stopColor="#d86e2e" stopOpacity="0" />
        </radialGradient>
        <linearGradient id="footer-rock-face" x1="0" y1="0" x2="0" y2="1">
          <stop offset="0" stopColor="#15181e" />
          <stop offset=".55" stopColor="#23242a" />
          <stop offset="1" stopColor="#34312d" />
        </linearGradient>
        <linearGradient id="footer-rock-rim" x1="0" y1="0" x2="1" y2="1">
          <stop offset="0" stopColor="#5a554e" stopOpacity=".76" />
          <stop offset=".52" stopColor="#34383f" stopOpacity=".48" />
          <stop offset="1" stopColor="#7d6247" stopOpacity=".62" />
        </linearGradient>
        <linearGradient id="footer-carrot-body" x1="0" y1="0" x2="1" y2="1">
          <stop offset="0" stopColor="#ffad4f" />
          <stop offset=".45" stopColor="#ed7d31" />
          <stop offset="1" stopColor="#b94b24" />
        </linearGradient>
        <filter id="footer-soft-glow" x="-80%" y="-80%" width="260%" height="260%">
          <feGaussianBlur stdDeviation="8" />
        </filter>
        <filter id="footer-rabbit-shadow" x="-40%" y="-40%" width="180%" height="180%">
          <feGaussianBlur stdDeviation="3" />
        </filter>
      </defs>

      <ellipse cx="755" cy="169" rx="245" ry="118" fill="url(#footer-carrot-glow)" />

      <g className="footer-cave-scene__cave">
        <path d="M0 0h1100v260H984C954 102 820 28 550 24 280 28 146 102 116 260H0Z" fill="url(#footer-rock-face)" />
        <path d="M0 0h1100v37c-55 3-101 12-143 27l-28-18-20 39-47-13-25 45-54-20-34 48-62-15-51 42H455l-47-42-62 15-34-48-54 20-25-45-47 13-20-39-28 18C96 49 51 40 0 37Z" fill="#101319" opacity=".92" />
        <path d="M48 260C80 72 246 3 550 8c304-5 470 64 502 252" fill="none" stroke="url(#footer-rock-rim)" strokeWidth="21" strokeLinecap="round" opacity=".82" />
        <path d="M116 260C145 100 276 28 550 24c274 4 405 76 434 236" fill="none" stroke="#806c56" strokeWidth="4" strokeOpacity=".62" />
        <path d="M132 255C169 116 299 49 550 45c251 4 381 71 418 210" fill="none" stroke="#242830" strokeWidth="9" strokeOpacity=".7" />

        <g fill="#1b1e24">
          <path d="M95 0h86l-24 65-21-31-18 55-19-33-29 48Z" />
          <path d="M905 0h91l-29 90-24-40-18 60-21-37-25 36Z" />
          <path d="M263 0h70l-16 54-18-25-17 58-18-38-20 30Z" />
          <path d="M741 0h72l-18 61-18-31-19 58-17-37-21 29Z" />
        </g>

        <g fill="none" stroke="#62605c" strokeLinecap="round" opacity=".42">
          <path d="m185 113 24 18-13 29 31 20" strokeWidth="4" />
          <path d="m287 58 20 21-8 29 26 18" strokeWidth="3" />
          <path d="m879 108-27 19 11 29-32 21" strokeWidth="4" />
          <path d="m798 59-19 24 9 28-27 17" strokeWidth="3" />
          <path d="m382 44 14 18-10 22" strokeWidth="2" />
          <path d="m704 43-14 19 11 24" strokeWidth="2" />
        </g>

        <path d="M91 242c83-19 158-21 230-8 92 17 171 10 249-4 104-19 235-14 441 20v10H91Z" fill="#292925" />
        <path d="M135 244c78-12 143-9 218 2 81 12 159 7 239-5 99-15 205-12 371 10" fill="none" stroke="#77716a" strokeWidth="3" strokeOpacity=".34" />
        <g fill="#4d4a46">
          <ellipse cx="179" cy="231" rx="23" ry="10" /><ellipse cx="217" cy="238" rx="12" ry="6" />
          <ellipse cx="895" cy="231" rx="27" ry="11" /><ellipse cx="936" cy="239" rx="14" ry="6" />
          <ellipse cx="342" cy="245" rx="18" ry="7" /><ellipse cx="651" cy="243" rx="13" ry="6" />
        </g>
        <g fill="#8d704f" opacity=".48">
          <circle cx="204" cy="205" r="4" /><circle cx="870" cy="203" r="5" />
          <circle cx="318" cy="226" r="3" /><circle cx="679" cy="222" r="3" /><circle cx="776" cy="228" r="4" />
        </g>
      </g>

      <ellipse cx="501" cy="222" rx="70" ry="12" fill="#090b0f" opacity=".48" filter="url(#footer-rabbit-shadow)" />
      <g className="footer-cave-scene__rabbit-position" transform="translate(478 139)">
        <g className="footer-cave-scene__rabbit">
          <ellipse cx="0" cy="49" rx="42" ry="31" fill="#dedbd4" />
          <ellipse cx="-8" cy="37" rx="31" ry="25" fill="#eeeae3" />
          <circle cx="31" cy="23" r="28" fill="#f4f0e9" />
          <ellipse cx="18" cy="-13" rx="10" ry="35" fill="#f4f0e9" transform="rotate(-10 18 -13)" />
          <ellipse cx="42" cy="-15" rx="10" ry="37" fill="#f4f0e9" transform="rotate(8 42 -15)" />
          <ellipse cx="18" cy="-13" rx="4" ry="27" fill="#d9a09d" opacity=".62" transform="rotate(-10 18 -13)" />
          <ellipse cx="42" cy="-15" rx="4" ry="29" fill="#d9a09d" opacity=".62" transform="rotate(8 42 -15)" />
          <circle cx="41" cy="18" r="4" fill="#20242d" />
          <circle cx="42" cy="17" r="1.2" fill="#fff" opacity=".88" />
          <ellipse cx="56" cy="27" rx="3.5" ry="2.7" fill="#b87c78" />
          <path d="M57 30c4 2 5 5 1 7M58 31c-3 3-3 6 0 8" fill="none" stroke="#9c7772" strokeWidth="1.6" strokeLinecap="round" />
          <circle cx="46" cy="31" r="6" fill="#e9a29b" opacity=".2" />
          <path d="m58 28 19-3m-19 7 20 3m-22 1 17 8" fill="none" stroke="#d9d4cc" strokeWidth="1.2" strokeLinecap="round" />
          <circle cx="-42" cy="43" r="16" fill="#f4f0e9" />
          <path d="M-23 60c8-4 17 1 20 9" fill="none" stroke="#c9c5be" strokeWidth="3" strokeLinecap="round" />
          <ellipse cx="-23" cy="74" rx="24" ry="9" fill="#e5e1da" />
          <ellipse cx="29" cy="76" rx="25" ry="9" fill="#e5e1da" />
        </g>
      </g>

      <g className="footer-cave-scene__carrot-position" transform="translate(727 157) rotate(-11)">
        <g className="footer-cave-scene__carrot">
          <ellipse cx="15" cy="31" rx="66" ry="49" fill="#e89139" opacity=".15" filter="url(#footer-soft-glow)" />
          <path d="M0 0c31 3 46 25 25 82C6 61-8 27 0 0Z" fill="url(#footer-carrot-body)" />
          <path d="M3 6c17 5 27 20 26 39-1 13-5 25-10 34" fill="none" stroke="#ffc06a" strokeWidth="4" strokeLinecap="round" opacity=".58" />
          <path d="m4 18 25 6M7 37l18 4M11 55l10 2" stroke="#7f361e" strokeWidth="2.6" strokeLinecap="round" opacity=".48" />
          <path d="M10 2C-1-22 2-45 13-60M16 2c15-25 31-41 49-50M14 1c25-14 44-17 61-13" fill="none" stroke="#75b77a" strokeWidth="11" strokeLinecap="round" />
          <path d="M12 0C7-23 9-41 15-55M18 0c14-22 28-36 45-45" fill="none" stroke="#a1d09a" strokeWidth="3" strokeLinecap="round" opacity=".62" />
        </g>
      </g>

      <path d="M594 214c25 2 46 2 69-1m-47-13 12 2m58 5 8-2m22 9 19-5" fill="none" stroke="#efb55f" strokeWidth="3" strokeLinecap="round" strokeOpacity=".48" />
    </svg>
  );
}
