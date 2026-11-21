import React from 'react';
import { FlagSeal } from './Flags';

/**
 * A language is shown by a tile in its own script, never by a flag: flags name
 * countries, and most of these languages are spoken in many.
 */
const MARKS: Record<string, string> = {
  en: 'En',
  it: 'It',
  es: 'Es',
  fr: 'Fr',
  pt: 'Pt',
  pl: 'Pl',
  sw: 'Sw',
  vi: 'Vi',
  uk: 'Ук',
  zh: '中',
  ar: 'ع',
  ko: '한',
};

export function langMark(code: string): string {
  return MARKS[code] ?? code.slice(0, 2);
}

export function LangMark({
  code,
  active = false,
  size = 'md',
  flag = false,
  className = '',
}: {
  code: string;
  active?: boolean;
  size?: 'sm' | 'md' | 'lg';
  /** Pin the country flag to the tile's corner as a small round seal. */
  flag?: boolean;
  className?: string;
}) {
  const dims = size === 'lg' ? 'w-11 h-11 text-[1.35rem]' : size === 'sm' ? 'w-6 h-6 text-[0.8rem]' : 'w-8 h-8 text-[1rem]';
  const seal = size === 'lg' ? 'w-[18px] h-[18px]' : size === 'sm' ? 'w-[11px] h-[11px]' : 'w-[15px] h-[15px]';
  const tile = (
    <span
      aria-hidden
      className={`inline-flex shrink-0 items-center justify-center rounded-[2px] border font-serif font-semibold leading-none ${dims} ${
        active ? 'bg-rubric border-rubric text-vellum' : 'bg-vellum border-rule-strong text-ink'
      } ${flag ? '' : className}`}
    >
      {langMark(code)}
    </span>
  );
  if (!flag) return tile;
  return (
    <span className={`relative inline-flex shrink-0 me-1.5 ${className}`} aria-hidden>
      {tile}
      <FlagSeal code={code} className={`absolute -bottom-[5px] -right-[6px] ${seal}`} />
    </span>
  );
}
