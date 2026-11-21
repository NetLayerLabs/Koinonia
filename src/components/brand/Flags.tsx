import React from 'react';

/**
 * Flat, hand-drawn flags (no emoji), one for each pew language, in a 3:2 box.
 * A flag stands for a country, not a language, so always show the language name
 * next to it. Arabic uses Lebanon's flag and Portuguese Brazil's, as the original
 * language list did.
 */

function star(cx: number, cy: number, r: number, rotate = -90) {
  const pts: string[] = [];
  for (let i = 0; i < 10; i++) {
    const rad = ((rotate + i * 36) * Math.PI) / 180;
    const rr = i % 2 === 0 ? r : r * 0.382;
    pts.push(`${(cx + rr * Math.cos(rad)).toFixed(2)},${(cy + rr * Math.sin(rad)).toFixed(2)}`);
  }
  return pts.join(' ');
}

const FLAGS: Record<string, React.ReactNode> = {
  en: (
    <>
      <rect width="60" height="40" fill="#012169" />
      <path d="M0 0L60 40M60 0L0 40" stroke="#fff" strokeWidth="8" />
      <path d="M0 0L60 40M60 0L0 40" stroke="#C8102E" strokeWidth="2.6" />
      <path d="M30 0v40M0 20h60" stroke="#fff" strokeWidth="12" />
      <path d="M30 0v40M0 20h60" stroke="#C8102E" strokeWidth="7" />
    </>
  ),
  it: (
    <>
      <rect width="20" height="40" fill="#009246" />
      <rect x="20" width="20" height="40" fill="#fff" />
      <rect x="40" width="20" height="40" fill="#CE2B37" />
    </>
  ),
  es: (
    <>
      <rect width="60" height="40" fill="#AA151B" />
      <rect y="10" width="60" height="20" fill="#F1BF00" />
    </>
  ),
  fr: (
    <>
      <rect width="20" height="40" fill="#002395" />
      <rect x="20" width="20" height="40" fill="#fff" />
      <rect x="40" width="20" height="40" fill="#ED2939" />
    </>
  ),
  pt: (
    <>
      <rect width="60" height="40" fill="#009C3B" />
      <path d="M30 4L55 20L30 36L5 20Z" fill="#FFDF00" />
      <circle cx="30" cy="20" r="8.6" fill="#002776" />
      <path d="M21.8 18.2c5.4-1.4 11.6-.6 16.3 2.6" stroke="#fff" strokeWidth="1.6" fill="none" />
    </>
  ),
  pl: (
    <>
      <rect width="60" height="20" fill="#fff" />
      <rect y="20" width="60" height="20" fill="#DC143C" />
    </>
  ),
  uk: (
    <>
      <rect width="60" height="20" fill="#0057B7" />
      <rect y="20" width="60" height="20" fill="#FFD700" />
    </>
  ),
  sw: (
    <>
      <rect width="60" height="40" fill="#fff" />
      <rect width="60" height="12" fill="#000" />
      <rect y="14" width="60" height="12" fill="#BB0000" />
      <rect y="28" width="60" height="12" fill="#006600" />
      <path d="M24 9L36 31M36 9L24 31" stroke="#fff" strokeWidth="1.4" />
      <ellipse cx="30" cy="20" rx="5" ry="10" fill="#BB0000" stroke="#000" strokeWidth="1" />
      <path d="M30 11.5v17" stroke="#fff" strokeWidth="1.2" />
    </>
  ),
  vi: (
    <>
      <rect width="60" height="40" fill="#DA251D" />
      <polygon points={star(30, 20.5, 11)} fill="#FFFF00" />
    </>
  ),
  zh: (
    <>
      <rect width="60" height="40" fill="#EE1C25" />
      <polygon points={star(10, 10, 6)} fill="#FFFF00" />
      <polygon points={star(20, 4, 2, -60)} fill="#FFFF00" />
      <polygon points={star(24, 8, 2, -80)} fill="#FFFF00" />
      <polygon points={star(24, 14, 2, -100)} fill="#FFFF00" />
      <polygon points={star(20, 18, 2, -120)} fill="#FFFF00" />
    </>
  ),
  ko: (
    <>
      <rect width="60" height="40" fill="#fff" />
      <g transform="rotate(33.7 30 20)">
        <path d="M20 20a10 10 0 0 1 20 0a5 5 0 0 1-10 0a5 5 0 0 0-10 0Z" fill="#CD2E3A" />
        <path d="M20 20a10 10 0 0 0 20 0a5 5 0 0 0-10 0a5 5 0 0 1-10 0Z" fill="#0047A0" />
      </g>
      <g stroke="#000" strokeWidth="1.7">
        <path d="M8.5 9.5l5-7.5M10.5 11l5-7.5M12.5 12.5l5-7.5" transform="translate(-1 2)" />
        <path d="M42.5 31.5l5 -7.5M44.5 33l5-7.5M46.5 34.5l5-7.5" transform="translate(-1 -2)" />
        <path d="M44 3l5 7.5M46 1.5l5 7.5M48 0l5 7.5" transform="translate(-2 3)" />
        <path d="M7 27l5 7.5M9 25.5l5 7.5M11 24l5 7.5" transform="translate(1 0)" />
      </g>
    </>
  ),
  ar: (
    <>
      <rect width="60" height="40" fill="#fff" />
      <rect width="60" height="10" fill="#ED1C24" />
      <rect y="30" width="60" height="10" fill="#ED1C24" />
      <path d="M30 11.5l-5 6h3l-5 5.5h3.5l-5.5 5h18l-5.5-5H37l-5-5.5h3z" fill="#00A651" />
      <rect x="29" y="27" width="2" height="2.5" fill="#00A651" />
    </>
  ),
};

/** The same flag as a round seal (centre-cropped), for pinning to a corner. */
export function FlagSeal({ code, className = 'w-4 h-4' }: { code: string; className?: string }) {
  const body = FLAGS[code];
  if (!body) return null;
  return (
    <span className={`inline-block shrink-0 overflow-hidden rounded-full ring-2 ring-vellum shadow-[0_0_0_2.5px_var(--color-rule-strong)] ${className}`} aria-hidden>
      <svg viewBox="0 0 60 40" className="w-full h-full" preserveAspectRatio="xMidYMid slice">
        {body}
      </svg>
    </span>
  );
}

export function Flag({ code, className = 'w-7 h-[1.17rem]' }: { code: string; className?: string }) {
  const body = FLAGS[code];
  if (!body) return null;
  return (
    <svg viewBox="0 0 60 40" className={`shrink-0 rounded-[1.5px] ring-1 ring-ink/15 ${className}`} aria-hidden preserveAspectRatio="none">
      {body}
    </svg>
  );
}
