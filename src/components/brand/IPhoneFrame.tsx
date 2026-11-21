import React from 'react';

/**
 * A phone frame in the shape of an iPhone 15 Pro (393 × 852 pt screen): a thin titanium
 * band, a black bezel, the Dynamic Island, the status bar, the home indicator, and the
 * action, volume and side buttons. Everything scales with the width you give it.
 *
 * `screen="auto"` (default) keeps the 393:852 screen shape; pass `screen="fit"` to let
 * the content decide the height (for live previews).
 */
export function IPhoneFrame({
  children,
  className = '',
  screen = 'auto',
  screenClassName = 'bg-paper',
}: {
  children: React.ReactNode;
  className?: string;
  screen?: 'auto' | 'fit';
  screenClassName?: string;
}) {
  return (
    <div className={`relative ${className}`} style={{ containerType: 'inline-size' }}>
      {/* side buttons, in titanium */}
      <span aria-hidden className="absolute left-[-1.1%] top-[13.5%] h-[3.6%] w-[1.6%] rounded-l-[2px] iphone-titanium" />
      <span aria-hidden className="absolute left-[-1.1%] top-[20.5%] h-[7.4%] w-[1.6%] rounded-l-[2px] iphone-titanium" />
      <span aria-hidden className="absolute left-[-1.1%] top-[29.6%] h-[7.4%] w-[1.6%] rounded-l-[2px] iphone-titanium" />
      <span aria-hidden className="absolute right-[-1.1%] top-[23%] h-[11.5%] w-[1.6%] rounded-r-[2px] iphone-titanium" />

      {/* titanium band */}
      <div className="iphone-titanium p-[1.15%]" style={{ borderRadius: '16.2% / 7.6%' }}>
        {/* black bezel */}
        <div className="bg-[#0a0a0b] p-[3.1%]" style={{ borderRadius: '15.4% / 7.2%' }}>
          {/* screen */}
          <div
            className={`relative overflow-hidden flex flex-col ${screenClassName} ${screen === 'auto' ? 'aspect-[393/852]' : ''}`}
            style={{ borderRadius: '13.8% / 6.4%' }}
          >
            {/* status bar with the Dynamic Island */}
            <div className="relative shrink-0 flex items-center justify-between px-[8.5%] text-[#111] font-semibold" style={{ height: '12.6cqw', fontSize: '3.9cqw' }}>
              <span className="tracking-[-0.01em]" style={{ fontFamily: '-apple-system, BlinkMacSystemFont, "SF Pro Text", system-ui, sans-serif' }}>
                9:41
              </span>
              <span
                aria-hidden
                className="absolute left-1/2 -translate-x-1/2 bg-black rounded-full"
                style={{ top: '20%', width: '32%', height: '64%' }}
              />
              <StatusIcons />
            </div>

            <div className="relative flex-1 min-h-0">{children}</div>

            {/* home indicator */}
            <span aria-hidden className="absolute bottom-[1.1%] left-1/2 -translate-x-1/2 w-[34%] h-[0.6%] min-h-[3px] rounded-full bg-[#111]/85" />
          </div>
        </div>
      </div>

      <style>{`
        .iphone-titanium {
          background:
            linear-gradient(90deg, rgba(255,255,255,.18), rgba(255,255,255,0) 18%, rgba(0,0,0,0) 82%, rgba(255,255,255,.14)),
            linear-gradient(180deg, #a19d95 0%, #7d7a74 45%, #8d8a83 100%);
        }
      `}</style>
    </div>
  );
}

function StatusIcons() {
  return (
    <span className="flex items-center gap-[0.35em]" aria-hidden>
      {/* signal */}
      <svg viewBox="0 0 18 12" className="h-[0.85em] w-auto" fill="currentColor">
        <rect x="0" y="8" width="3" height="4" rx="0.8" />
        <rect x="5" y="5.5" width="3" height="6.5" rx="0.8" />
        <rect x="10" y="3" width="3" height="9" rx="0.8" />
        <rect x="15" y="0" width="3" height="12" rx="0.8" />
      </svg>
      {/* wi-fi */}
      <svg viewBox="0 0 16 12" className="h-[0.85em] w-auto" fill="currentColor">
        <path d="M8 2.2c2.4 0 4.6.9 6.3 2.5l1.2-1.3A10.6 10.6 0 0 0 8 .4C5.2.4 2.5 1.5.5 3.4l1.2 1.3A8.9 8.9 0 0 1 8 2.2Z" />
        <path d="M8 5.6c1.5 0 2.9.6 3.9 1.5l1.2-1.3A7.3 7.3 0 0 0 8 3.8c-1.9 0-3.7.7-5.1 2l1.2 1.3c1-.9 2.4-1.5 3.9-1.5Z" />
        <path d="M8 9.1c.6 0 1.1.2 1.5.6L8 11.4 6.5 9.7c.4-.4.9-.6 1.5-.6Z" />
      </svg>
      {/* battery */}
      <svg viewBox="0 0 27 13" className="h-[0.95em] w-auto">
        <rect x="0.5" y="0.5" width="23" height="12" rx="3.6" fill="none" stroke="currentColor" strokeOpacity=".4" />
        <rect x="2.2" y="2.2" width="19.6" height="8.6" rx="2.2" fill="currentColor" />
        <path d="M25 4.2v4.6c.9-.3 1.5-1.2 1.5-2.3s-.6-2-1.5-2.3Z" fill="currentColor" fillOpacity=".4" />
      </svg>
    </span>
  );
}
