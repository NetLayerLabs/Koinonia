import React from 'react';

/**
 * The Koinonia mark: a vesica piscis - two equal circles, each passing through the
 * other's centre. One of the oldest Christian symbols; here it is two people (or two
 * languages) and the shared space between them, which is what koinonia means.
 */
export function VesicaMark({
  size = 32,
  tone = 'ink',
  className = '',
}: {
  size?: number;
  tone?: 'ink' | 'light';
  className?: string;
}) {
  const stroke = tone === 'ink' ? 'var(--color-ink)' : 'var(--color-vellum)';
  return (
    <svg width={size} height={size} viewBox="0 0 32 32" fill="none" aria-hidden className={className}>
      <circle cx="12" cy="16" r="8" stroke={stroke} strokeWidth="1.7" />
      <circle cx="20" cy="16" r="8" stroke={stroke} strokeWidth="1.7" />
      <path d="M16 9.07A8 8 0 0 1 16 22.93 8 8 0 0 1 16 9.07Z" fill="var(--color-rubric)" />
      <path d="M16 12.6v6.8M13.9 14.8h4.2" stroke={tone === 'ink' ? 'var(--color-vellum)' : 'var(--color-nave)'} strokeWidth="1.2" strokeLinecap="round" />
    </svg>
  );
}

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
  const mark = size === 'lg' ? 40 : size === 'sm' ? 26 : 32;
  const text = size === 'lg' ? 'text-[1.9rem]' : size === 'sm' ? 'text-[1.3rem]' : 'text-[1.55rem]';
  return (
    <span className={`inline-flex items-center gap-2.5 ${className}`}>
      <VesicaMark size={mark} tone={tone} />
      <span className="flex flex-col leading-none">
        <span className={`font-serif font-semibold tracking-[-0.01em] ${text} ${tone === 'ink' ? 'text-ink' : 'text-vellum'}`}>Koinonia</span>
        {greek && (
          <span className={`font-serif italic text-[0.8rem] tracking-[0.02em] mt-0.5 ${tone === 'ink' ? 'text-rubric' : 'text-[#e3a593]'}`}>κοινωνία · fellowship</span>
        )}
      </span>
    </span>
  );
}
