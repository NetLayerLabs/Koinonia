import React, { useEffect, useMemo, useState } from 'react';
import { Loader2 } from 'lucide-react';
import type { ChurchTraditionProfile } from '../types/koinonia';
import { SUPPORTED_LANGUAGES } from '../data/koinoniaData';
import { api } from '../lib/api';
import { SERVICE_ROSTER } from '../shared/roster';
import type { InsightsResponse } from '../shared/types';
import { IconDoor, IconInsights } from './brand/Icons';
import { LangMark } from './brand/LangMark';

interface Props {
  profile: ChurchTraditionProfile;
}

interface Suggestion {
  lang: string;
  text: string;
  detail: string;
}

function pctChange(now: number, before: number): number | null {
  if (before === 0) return now > 0 ? null : 0;
  return Math.round(((now - before) / before) * 100);
}

const ROMAN = ['I', 'II', 'III', 'IV', 'V', 'VI'];

export const LanguageInsights: React.FC<Props> = ({ profile }) => {
  const [data, setData] = useState<InsightsResponse | null>(null);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    setData(null);
    api
      .insights(profile.id)
      .then(setData)
      .catch((e) => setError(e instanceof Error ? e.message : 'Could not load insights'));
  }, [profile.id]);

  const roster = SERVICE_ROSTER[profile.id];

  const suggestions = useMemo<Suggestion[]>(() => {
    if (!data) return [];
    const out: Suggestion[] = [];
    for (const s of data.stats) {
      const meta = SUPPORTED_LANGUAGES.find((l) => l.code === s.lang);
      if (!meta) continue;
      const change = pctChange(s.last30, s.prev30);
      const share = data.totalLast30 ? s.last30 / data.totalLast30 : 0;
      const growing = change === null ? s.last30 >= 4 : change >= 25 && s.last30 >= 4;
      if (!growing && share < 0.08) continue;
      // Which service do these readers come to most?
      const topServiceId = Object.entries(s.byService).sort((a, b) => b[1] - a[1])[0]?.[0];
      const service = roster.find((r) => r.id === topServiceId);
      if (!service) continue;
      const covered = service.greeters.some((g) => g.languages.includes(s.lang));
      if (covered) continue;
      const trend = change === null ? 'new this month' : change > 0 ? `up ${change}% on the month before` : 'steady';
      out.push({
        lang: s.lang,
        text: `${meta.name} scans ${trend}, and no ${meta.name}-speaking greeter is scheduled at the ${service.label}.`,
        detail: `${s.last30} ${meta.name} readers in the last 30 days, ${s.byService[service.id] ?? 0} of them at the ${service.label}. Consider inviting a ${meta.name} speaker to greet, or starting a ${meta.name}-language table after the service.`,
      });
    }
    return out.slice(0, 3);
  }, [data, roster]);

  const max = data ? Math.max(1, ...data.stats.map((s) => Math.max(s.last30, s.prev30))) : 1;

  return (
    <section className="leaf p-6 max-[601px]:p-4 space-y-6">
      <header className="flex flex-col lg:flex-row lg:items-start lg:justify-between gap-4">
        <div className="flex gap-4 max-[601px]:gap-3">
          <IconInsights className="w-6 h-6 text-rubric shrink-0 mt-1 max-[601px]:hidden" />
          <div className="space-y-1.5 min-w-0">
            <p className="rubric">Language demand · counts only, no personal details</p>
            <h2 className="text-3xl max-[601px]:text-2xl leading-[1.1] text-ink">Who is in the pews, and who is there to welcome them?</h2>
            <p className="text-ink-2 max-w-3xl">
              Each pew scan records only a language and a time. Koinonia compares those counts with the greeter rota and tells leaders
              where a language group is growing without anyone to welcome them.
            </p>
          </div>
        </div>
        {data?.includesSampleHistory && (
          <span className="tag tag-gold self-start shrink-0 whitespace-normal">Sample history for the demo, plus every real scan</span>
        )}
      </header>

      {error && <p className="text-sm text-rubric-deep">{error}</p>}
      {!data && !error && (
        <p className="text-sm text-ink-3 flex items-center gap-2">
          <Loader2 className="w-4 h-4 animate-spin" /> Counting scans…
        </p>
      )}

      {data && (
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 max-[601px]:gap-6 double-rule pt-5">
          {/* The chart: one hairline row per language. */}
          <div className="lg:col-span-7 min-w-0">
            <div className="flex flex-wrap items-end justify-between gap-3 pb-2">
              <p className="rubric-ink">Pew scans by language</p>
              <div className="flex items-center gap-4 text-xs text-ink-3">
                <span className="flex items-center gap-1.5">
                  <span className="inline-block w-5 h-[2px] bg-rule-strong" /> previous 30 days
                </span>
                <span className="flex items-center gap-1.5">
                  <span className="inline-block w-5 h-[5px] bg-ink" /> last 30 days
                </span>
              </div>
            </div>
            <ul className="divide-y divide-rule border-y border-rule">
              {data.stats.map((s) => {
                const meta = SUPPORTED_LANGUAGES.find((l) => l.code === s.lang);
                const change = pctChange(s.last30, s.prev30);
                return (
                  <li key={s.lang} className="grid grid-cols-12 items-center gap-3 py-2.5">
                    <div className="col-span-4 sm:col-span-3 flex items-center gap-2 min-w-0">
                      <LangMark code={s.lang} size="sm" />
                      <span className="text-sm text-ink truncate">{meta?.name ?? s.lang}</span>
                    </div>
                    <div
                      className="col-span-5 sm:col-span-7 min-w-0 space-y-1"
                      role="img"
                      aria-label={`${meta?.name ?? s.lang}: ${s.last30} scans in the last 30 days, ${s.prev30} in the previous 30`}
                    >
                      <div className="h-[2px] bg-rule-strong" style={{ width: `${(s.prev30 / max) * 100}%` }} />
                      <div className="h-[5px] bg-ink" style={{ width: `${(s.last30 / max) * 100}%` }} />
                    </div>
                    <div className="col-span-3 sm:col-span-2 text-right font-serif num-lining leading-none">
                      <span className="text-lg text-ink">{s.last30}</span>
                      {change !== null && change !== 0 && (
                        <span className={`block text-xs mt-0.5 ${change > 0 ? 'text-rubric' : 'text-ink-3'}`}>
                          {change > 0 ? `+${change}` : change}%
                        </span>
                      )}
                      {change === null && <span className="block text-xs mt-0.5 text-rubric">new</span>}
                    </div>
                  </li>
                );
              })}
            </ul>
          </div>

          {/* Notes for the rota, then who is greeting. */}
          <div className="lg:col-span-5 min-w-0 space-y-5">
            <div className="space-y-3">
              <p className="rubric">Notes for the volunteer rota</p>
              {suggestions.length === 0 ? (
                <p className="text-ink-2">Every growing language group has a greeter who speaks it.</p>
              ) : (
                <ol className="space-y-4">
                  {suggestions.map((s, i) => (
                    <li key={s.lang} className="flex gap-3">
                      <span className="font-serif text-rubric text-lg leading-6 w-7 shrink-0 text-right">{ROMAN[i]}.</span>
                      <div className="space-y-1 min-w-0">
                        <p className="font-serif text-[1.05rem] leading-snug text-ink">{s.text}</p>
                        <p className="text-sm text-ink-2 num-lining">{s.detail}</p>
                      </div>
                    </li>
                  ))}
                </ol>
              )}
              {suggestions.length > 0 && (
                <p className="text-sm text-ink-3 ps-10">A leader decides; nothing is sent automatically.</p>
              )}
            </div>

            <div className="inset p-4 space-y-3">
              <p className="rubric-ink flex items-center gap-2">
                <IconDoor className="w-4 h-4" /> Greeters this Sunday (sample rota)
              </p>
              {roster.map((r) => (
                <div key={r.id} className="space-y-1.5">
                  <p className="text-sm font-semibold text-ink">{r.label}</p>
                  <ul className="space-y-1">
                    {r.greeters.map((g) => (
                      <li key={g.name} className="flex flex-wrap items-center gap-1.5 text-sm text-ink-2">
                        <span className="me-1">{g.name}</span>
                        {g.languages.map((code) => (
                          <span key={code} title={SUPPORTED_LANGUAGES.find((l) => l.code === code)?.name ?? code}>
                            <LangMark code={code} size="sm" />
                            <span className="sr-only">{SUPPORTED_LANGUAGES.find((l) => l.code === code)?.name ?? code}</span>
                          </span>
                        ))}
                      </li>
                    ))}
                  </ul>
                </div>
              ))}
            </div>
          </div>
        </div>
      )}
    </section>
  );
};
