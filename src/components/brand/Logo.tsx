import React from 'react';

/**
 * Koinonia's logo: an arched stained-glass window around the vesica piscis (two circles,
 * two people or two languages, and the shared space between them, with a cross).
 * The artwork lives in /public/brand as transparent PNGs, drawn on paper and cut out:
 *   koinonia-header(-light).png  - the window with the "Koinonia" wordmark (headers, footers)
 *   koinonia-mark(-light).png    - the window alone (tight spaces, the pew card, the rail)
 * Use the "light" versions on dark backgrounds.
 */

const MARK_RATIO = 851 / 924; // width / height of the window artwork

/** The window mark alone. `size` is its height in pixels. */
export function VesicaMark({
  size = 32,
  tone = 'ink',
  className = '',
}: {
  size?: number;
  tone?: 'ink' | 'light';
  className?: string;
}) {
  return (
    <img
      src={tone === 'ink' ? '/brand/koinonia-mark.png' : '/brand/koinonia-mark-light.png'}
      alt=""
      aria-hidden
      width={Math.round(size * MARK_RATIO)}
      height={size}
      className={`inline-block shrink-0 select-none ${className}`}
      draggable={false}
    />
  );
}

const HEADER_HEIGHT = { sm: 36, md: 46, lg: 60 } as const;

/** The full logo: the window and the "Koinonia" wordmark. */
export function Wordmark({
  tone = 'ink',
  size = 'md',
  greek = false,
  className = '',
}: {
  tone?: 'ink' | 'light';
  size?: 'sm' | 'md' | 'lg';
  greek?: boolean;
  className?: string;
}) {
  const h = HEADER_HEIGHT[size];
  return (
    <span className={`inline-flex flex-col items-start leading-none ${className}`}>
      <img
        src={tone === 'ink' ? '/brand/koinonia-header.png' : '/brand/koinonia-header-light.png'}
        alt="Koinonia"
        height={h}
        width={Math.round(h * (600 / 173))}
        style={{ height: h, width: 'auto' }}
        className="block select-none"
        draggable={false}
      />
      {greek && (
        <span
          className={`font-serif italic text-[0.8rem] tracking-[0.02em] mt-1 ${tone === 'ink' ? 'text-rubric' : 'text-[#e3a593]'}`}
          style={{ marginLeft: Math.round(h * 1.14) }}
        >
          κοινωνία · fellowship
        </span>
      )}
    </span>
  );
}
