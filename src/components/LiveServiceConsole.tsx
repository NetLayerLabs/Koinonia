import React, { useState } from 'react';
import { ChevronLeft, Wifi, WifiOff } from 'lucide-react';
import type { ChurchTraditionProfile, SupportedLanguageCode } from '../types/koinonia';
import { SUPPORTED_LANGUAGES } from '../data/koinoniaData';
import { api, useLiveEvents } from '../lib/api';
import { IPhoneFrame } from './brand/IPhoneFrame';
import { IconBell, IconCandle, IconPew } from './brand/Icons';
import { LangMark } from './brand/LangMark';

interface Props {
  profile: ChurchTraditionProfile;
}

const NUMERALS: [number, string][] = [
  [40, 'XL'],
  [10, 'X'],
  [9, 'IX'],
  [5, 'V'],
  [4, 'IV'],
  [1, 'I'],
];

/** Roman numerals for the order of service (enough for any service). */
function roman(n: number): string {
  let out = '';
  let rest = n;
  for (const [value, mark] of NUMERALS) {
    while (rest >= value) {
      out += mark;
      rest -= value;
    }
  }
  return out;
}

export const LiveServiceConsole: React.FC<Props> = ({ profile }) => {
  const [index, setIndex] = useState(0);
  const [followers, setFollowers] = useState(0);
  const [previewLang, setPreviewLang] = useState<SupportedLanguageCode>('ar');
  const [error, setError] = useState<string | null>(null);
  const steps = profile.liturgicalSteps;

  const connected = useLiveEvents(profile.id, 'staff', (e) => {
    if (e.type === 'hello') {
      setIndex(Math.min(e.data.cue.index, steps.length - 1));
      setFollowers(e.data.pewFollowers);
    }
    if (e.type === 'cue') setIndex(Math.min(e.data.index, steps.length - 1));
    if (e.type === 'presence') setFollowers(e.data.pewFollowers);
  });

  const goTo = async (next: number) => {
    const clamped = Math.max(0, Math.min(steps.length - 1, next));
    setIndex(clamped);
    try {
      await api.setCue(profile.id, clamped);
      setError(null);
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Could not send the cue');
    }
  };

  const step = steps[index];
  const lang = SUPPORTED_LANGUAGES.find((l) => l.code === previewLang) ?? SUPPORTED_LANGUAGES[0];
  // Some steps have no translation yet and fall back to English: keep those left-to-right.
  const isFallback = previewLang !== 'en' && step.whatHappens[previewLang] === step.whatHappens.en;
  const serviceWord = profile.id === 'san-venanzio-unicam' ? 'Mass' : 'service';

  return (
    <div className="space-y-6">
      <header className="flex flex-col lg:flex-row lg:items-end lg:justify-between gap-4">
        <div className="flex gap-4 max-[601px]:gap-3">
          <IconBell className="w-6 h-6 text-rubric shrink-0 mt-1 max-[601px]:hidden" />
          <div className="space-y-1.5 min-w-0">
            <p className="rubric">Live service cues</p>
            <h2 className="text-3xl sm:text-4xl max-[601px]:text-[1.75rem] leading-[1.05] text-ink">One tap here, and every phone in the pews follows along</h2>
            <p className="text-ink-2 max-w-3xl">
              A volunteer at the back taps “Next” as the {serviceWord} moves on. Every phone that turned on “Follow live” jumps to the
              same moment and explains it in the reader’s own language, including what visitors from other traditions can do.
            </p>
          </div>
        </div>
        <div className="flex flex-wrap items-center gap-2 self-start lg:self-auto" aria-live="polite">
          <span className={`tag ${connected ? 'tag-vine' : ''}`}>
            {connected ? <Wifi className="w-3.5 h-3.5" /> : <WifiOff className="w-3.5 h-3.5" />}
            {connected ? 'Connected' : 'Connecting…'}
          </span>
          <span className="tag">
            <IconPew className="w-3.5 h-3.5" />
            <span className="num-lining">{followers}</span> {followers === 1 ? 'phone' : 'phones'} following
          </span>
        </div>
      </header>

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
        {/* The order of service, set out like the Ordinary of a missal. */}
        <section className="lg:col-span-7 leaf p-6 max-[601px]:p-4 space-y-4">
          <div className="space-y-1">
            <p className="rubric">The order of the {serviceWord}</p>
            <h3 className="text-2xl leading-tight text-ink">Volunteer console</h3>
            <p className="text-sm text-ink-2">Tap any part to jump there, or use Next as the {serviceWord} moves on.</p>
          </div>

          <ol className="divide-y divide-rule border-y border-rule">
            {steps.map((s, i) => {
              const isNow = i === index;
              const isDone = i < index;
              return (
                <li key={s.id}>
                  <button
                    onClick={() => goTo(i)}
                    aria-current={isNow ? 'step' : undefined}
                    className={`w-full text-left flex items-center gap-4 max-[601px]:gap-3 py-3 pe-3 max-[901px]:min-h-[52px] border-l-2 cursor-pointer transition-colors ${
                      isNow
                        ? 'border-rubric bg-parchment ps-3'
                        : isDone
                          ? 'border-transparent ps-3 text-ink-3 hover:bg-parchment'
                          : 'border-transparent ps-3 text-ink hover:bg-parchment'
                    }`}
                  >
                    <span
                      className={`font-serif num-lining text-lg w-9 max-[601px]:w-8 shrink-0 text-right leading-none ${
                        isDone ? 'text-rubric/50' : 'text-rubric'
                      }`}
                    >
                      {roman(i + 1)}.
                    </span>
                    <span className="flex-1 min-w-0">
                      <span className="block text-xs text-ink-3">{s.timestampLabel}</span>
                      <span className={`block font-serif text-[1.1rem] leading-snug ${isDone ? 'text-ink-3' : 'text-ink'}`}>
                        {s.title.en}
                      </span>
                    </span>
                    {isNow && (
                      <span className="flex items-center gap-2 shrink-0">
                        <IconCandle className="w-5 h-5 text-rubric" />
                        <span className="tag tag-rubric">Now</span>
                      </span>
                    )}
                  </button>
                </li>
              );
            })}
          </ol>

          <div className="flex items-stretch gap-3 pt-1">
            <button onClick={() => goTo(index - 1)} disabled={index === 0} className="btn btn-outline btn-lg">
              <ChevronLeft className="w-4 h-4" /> Back
            </button>
            <button
              onClick={() => goTo(index + 1)}
              disabled={index === steps.length - 1}
              className="btn btn-rubric btn-lg flex-1 min-w-0"
            >
              <span className="truncate">Next: {steps[index + 1]?.title.en ?? 'end of service'}</span>
            </button>
          </div>
          {error && <p className="text-sm text-rubric-deep">{error}</p>}
        </section>

        {/* What a phone in the pews shows right now. */}
        <section className="lg:col-span-5 min-w-0 space-y-4">
          <div className="flex flex-wrap items-end justify-between gap-3">
            <div className="space-y-1">
              <p className="rubric">On the phones</p>
              <h3 className="text-xl leading-tight text-ink">What readers see right now</h3>
            </div>
            <label className="flex items-center gap-2">
              <span className="sr-only">Preview language</span>
              <LangMark code={previewLang} size="sm" />
              <select
                value={previewLang}
                onChange={(e) => setPreviewLang(e.target.value as SupportedLanguageCode)}
                className="field w-auto py-1.5 text-sm"
              >
                {SUPPORTED_LANGUAGES.map((l) => (
                  <option key={l.code} value={l.code}>
                    {l.nativeName}
                  </option>
                ))}
              </select>
            </label>
          </div>

          <IPhoneFrame className="mx-auto w-full max-w-[300px] max-[601px]:max-w-[250px]" screenClassName="bg-vellum">
            <div className="absolute inset-0 overflow-y-auto">
              <div className="px-5 pt-3 pb-8 space-y-3" dir={lang.rtl && !isFallback ? 'rtl' : 'ltr'}>
                <p className="rubric flex items-center gap-1.5">
                  <IconCandle className="w-4 h-4" /> {step.timestampLabel}
                </p>
                <p className="font-serif text-2xl leading-[1.15] text-ink">{step.title[previewLang]}</p>
                <p className="text-sm leading-relaxed text-ink-2">{step.whatHappens[previewLang]}</p>
                {isFallback && <p className="text-xs text-ink-3">Not yet translated into {lang.name}; shown in English.</p>}
                <p className="inset border-l-2 border-vine px-3 py-2.5 text-sm font-semibold text-ink">
                  {step.postureOrResponse[previewLang]}
                </p>
              </div>
            </div>
          </IPhoneFrame>

          <p className="text-sm text-ink-3 text-center max-w-[320px] mx-auto">
            Open the pew page on a phone (scan the QR code in the Pew QR Kit) and turn on “Follow live” to see it move.
          </p>
        </section>
      </div>
    </div>
  );
};
