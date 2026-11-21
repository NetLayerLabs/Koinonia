import React from 'react';

/**
 * Koinonia's own icon set. One drawing style: 24px grid, 1.6 stroke, round ends,
 * no fills except small solid details. Use these for anything that names a part of
 * the product; use lucide only for plain controls (arrows, close, copy, spinner).
 */

export interface IconProps {
  className?: string;
  size?: number;
  title?: string;
}

function Svg({ className = 'w-5 h-5', size, title, children }: IconProps & { children: React.ReactNode }) {
  return (
    <svg
      viewBox="0 0 24 24"
      width={size}
      height={size}
      fill="none"
      stroke="currentColor"
      strokeWidth={1.6}
      strokeLinecap="round"
      strokeLinejoin="round"
      className={className}
      role={title ? 'img' : undefined}
      aria-hidden={title ? undefined : true}
    >
      {title && <title>{title}</title>}
      {children}
    </svg>
  );
}

/** A pew seen from the side: the attendee's place. */
export const IconPew = (p: IconProps) => (
  <Svg {...p}>
    <path d="M5 4.5v14.5M5 11.5h13.5a1 1 0 0 1 1 1V14H5" />
    <path d="M7.5 14v5M17.5 14v5M5 4.5h2.5v7" />
  </Svg>
);

/** A hand holding a heart: pastoral care. */
export const IconCare = (p: IconProps) => (
  <Svg {...p}>
    <path d="M12.5 4.6c-.9-1.3-3.3-1.1-3.3.8 0 1.5 2 2.8 3.3 3.7 1.3-.9 3.3-2.2 3.3-3.7 0-1.9-2.4-2.1-3.3-.8Z" />
    <path d="M3 14.5 6 12h3.2l2.8 2h2.5a1.4 1.4 0 0 1 0 2.8H11" />
    <path d="M3 20.5 6 18h6.5l6.2-4.1a1.5 1.5 0 0 1 2 2.2L14 21" />
  </Svg>
);

/** A bell: the live service. */
export const IconBell = (p: IconProps) => (
  <Svg {...p}>
    <path d="M12 3v1.6M6.5 16.5V11a5.5 5.5 0 0 1 11 0v5.5l1.6 2H4.9l1.6-2Z" />
    <path d="M10.2 20.6a1.9 1.9 0 0 0 3.6 0" />
  </Svg>
);

/** An open book on a lectern: the Sunday message. */
export const IconLectern = (p: IconProps) => (
  <Svg {...p}>
    <path d="M12 6.2C10 4.9 7 4.6 4 5.3v8.2c3-.7 6-.4 8 .9 2-1.3 5-1.6 8-.9V5.3c-3-.7-6-.4-8 .9Z" />
    <path d="M12 6.2v8.2M12 14.4V21M8.5 21h7" />
  </Svg>
);

/** A round table with places: groups and fellowship. */
export const IconTable = (p: IconProps) => (
  <Svg {...p}>
    <circle cx="12" cy="12" r="4.2" />
    <circle cx="12" cy="3.9" r="1.4" />
    <circle cx="12" cy="20.1" r="1.4" />
    <circle cx="3.9" cy="12" r="1.4" />
    <circle cx="20.1" cy="12" r="1.4" />
  </Svg>
);

/** The printed pew card with its code. */
export const IconPewCard = (p: IconProps) => (
  <Svg {...p}>
    <rect x="5" y="3" width="14" height="18" rx="1" />
    <path d="M8.2 6.5h2.6v2.6H8.2zM13.2 6.5h2.6v2.6h-2.6zM8.2 11.5h2.6v2.6H8.2z" />
    <path d="M13.4 12h.01M15.6 14h.01M13.4 14.2h.01M8.5 17.5h7" />
  </Svg>
);

/** A key: the private pickup code. */
export const IconKey = (p: IconProps) => (
  <Svg {...p}>
    <circle cx="8" cy="15" r="3.6" />
    <path d="m10.6 12.4 8.4-8.4M16.2 6.8l2.2 2.2M13.9 9.1l1.6 1.6" />
  </Svg>
);

/** A phone whose text is blacked out: details removed on the phone. */
export const IconScrub = (p: IconProps) => (
  <Svg {...p}>
    <rect x="6.5" y="2.5" width="11" height="19" rx="1.8" />
    <path d="M9.3 7h5.4M9.3 13.2h2" />
    <rect x="9.3" y="9.4" width="5.4" height="1.9" fill="currentColor" stroke="none" />
    <rect x="12.4" y="12.3" width="2.3" height="1.9" fill="currentColor" stroke="none" />
    <path d="M11 18.5h2" />
  </Svg>
);

/** A lifebuoy: the crisis lane. */
export const IconLifebuoy = (p: IconProps) => (
  <Svg {...p}>
    <circle cx="12" cy="12" r="8.6" />
    <circle cx="12" cy="12" r="3.6" />
    <path d="m5.9 5.9 3.6 3.6M14.5 14.5l3.6 3.6M18.1 5.9l-3.6 3.6M9.5 14.5l-3.6 3.6" />
  </Svg>
);

/** Aa beside a mark: the tradition glossary. */
export const IconGlossary = (p: IconProps) => (
  <Svg {...p}>
    <path d="m3.5 18.5 4.2-12 4.2 12M5 14.5h5.4" />
    <path d="M17 11.2a2.6 2.6 0 1 0 0 5.2 2.6 2.6 0 0 0 0-5.2ZM19.6 11.2v7.3" />
    <path d="M15 5.5h5" />
  </Svg>
);

/** Rising bars: language-demand insights. */
export const IconInsights = (p: IconProps) => (
  <Svg {...p}>
    <path d="M3.5 20h17M6 20v-6M10.3 20V9.5M14.6 20v-4M19 20V6" />
    <path d="m16.5 3.8 2.5 1.7-1.6 2.6" />
  </Svg>
);

/** A wax seal with ribbons: approved by a person. */
export const IconSeal = (p: IconProps) => (
  <Svg {...p}>
    <circle cx="12" cy="9.5" r="5.8" />
    <path d="m9.6 9.6 1.7 1.7 3.2-3.3" />
    <path d="m8.6 14.3-1.4 6.4 4.8-2.4 4.8 2.4-1.4-6.4" />
  </Svg>
);

/** Two speech shapes, overlapping: translation between two languages. */
export const IconBridge = (p: IconProps) => (
  <Svg {...p}>
    <path d="M3.5 4.5h10v7h-5L5.5 14v-2.5h-2z" />
    <path d="M13.5 9.5h7v7h-1.5V19L16 16.5h-5.5v-3" />
  </Svg>
);

/** Text going out and coming back: the meaning-drift check. */
export const IconRoundTrip = (p: IconProps) => (
  <Svg {...p}>
    <path d="M4 8.5h13.5l-3-3" />
    <path d="M20 15.5H6.5l3 3" />
    <path d="M7 12h3M14 12h3" />
  </Svg>
);

/** A shepherd's crook: the pastor role. */
export const IconCrook = (p: IconProps) => (
  <Svg {...p}>
    <path d="M9 21V8.5a4.5 4.5 0 1 1 9 0c0 1.7-1.1 2.8-2.5 2.8" />
  </Svg>
);

/** An arched double door: the welcome volunteer. */
export const IconDoor = (p: IconProps) => (
  <Svg {...p}>
    <path d="M6 21V10a6 6 0 0 1 12 0v11M3.5 21h17M12 4v17" />
    <path d="M10.2 14.5h.01M13.8 14.5h.01" />
  </Svg>
);

/** A candle: something happening now. */
export const IconCandle = (p: IconProps) => (
  <Svg {...p}>
    <path d="M12 3.2c1.3 1.4 1.8 2.5 1.8 3.4a1.8 1.8 0 0 1-3.6 0c0-.9.5-2 1.8-3.4Z" />
    <path d="M9.5 10.5h5V21h-5zM7 21h10" />
  </Svg>
);

/** A small vesica: used as a bullet. */
export const VesicaBullet = ({ className = 'w-2.5 h-3.5' }: { className?: string }) => (
  <svg viewBox="0 0 10 14" className={className} aria-hidden>
    <path d="M5 0A7 7 0 0 1 5 14 7 7 0 0 1 5 0Z" fill="currentColor" />
  </svg>
);

/** A small church with a cross: "Today", the staff home. */
export const IconChurch = (p: IconProps) => (
  <Svg {...p}>
    <path d="M12 2.8v3.4M10.4 4.3h3.2" />
    <path d="M6.5 11 12 6.6l5.5 4.4V21h-11z" />
    <path d="M3.5 21h17M10.3 21v-3.6a1.7 1.7 0 0 1 3.4 0V21" />
    <path d="M12 11.6h.01" />
  </Svg>
);
