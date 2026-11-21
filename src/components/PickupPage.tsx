import React, { useEffect, useState } from 'react';
import { ChevronLeft, Loader2 } from 'lucide-react';
import { Wordmark } from './brand/Logo';
import { IconCandle, IconKey, IconLectern, IconSeal, IconTable } from './brand/Icons';
import { CHURCH_PROFILES, SUPPORTED_LANGUAGES, scriptureFor } from '../data/koinoniaData';
import { api } from '../lib/api';
import { loadMyRequests, originalForCode } from '../lib/local';
import { useT } from '../lib/i18n';
import { go } from '../lib/router';
import type { LangCode } from '../shared/languages';
import type { PickupView } from '../shared/types';
import type { SupportedLanguageCode } from '../types/koinonia';
import { CrisisPanel } from './CrisisPanel';
import { dropTokens, restoreOnDevice } from '../lib/restore';

export const PickupPage: React.FC<{ code: string | null }> = ({ code }) => {
  const [input, setInput] = useState(code ?? '');
  const [view, setView] = useState<PickupView | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const mine = loadMyRequests();
  const uiLang = (view?.language ?? (mine[0]?.language as LangCode | undefined) ?? 'en') as LangCode;
  const t = useT(uiLang, view?.tradition);
  const meta = SUPPORTED_LANGUAGES.find((l) => l.code === uiLang) ?? SUPPORTED_LANGUAGES[0];

  const lookup = async (c: string) => {
    if (!c.trim()) return;
    setLoading(true);
    setError(null);
    try {
      setView(await api.pickup(c.trim()));
    } catch (e) {
      setView(null);
      setError(e instanceof Error ? e.message : t('pickup.notFound'));
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (code) lookup(code);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [code]);

  // Gently re-check while waiting, so the reply appears without reloading.
  useEffect(() => {
    if (!view || view.status !== 'pending') return;
    const id = setInterval(() => api.pickup(view.code).then(setView).catch(() => undefined), 10_000);
    return () => clearInterval(id);
  }, [view]);

  const profile = view ? CHURCH_PROFILES[view.tradition] : null;
  const verse = view ? scriptureFor(view.verseId, view.tradition) : null;
  const group = profile?.smallGroups.find((g) => g.id === view?.groupId);
  const original = view ? originalForCode(view.code) : null;

  return (
    // The whole page follows the reading direction of the person's language (Arabic: right to left).
    <div className="min-h-screen" dir={meta.rtl ? 'rtl' : 'ltr'}>
      <header className="border-b border-rule">
        <div className="page-header-container py-2.5 flex items-center justify-between gap-3">
          <button onClick={() => go('/')} aria-label={t('nav.home')} className="cursor-pointer">
            <Wordmark size="sm" />
          </button>
          {view && (
            <button onClick={() => go(`/pew?church=${view.tradition}&lang=${view.language}`)} className="btn btn-outline btn-sm">
              <ChevronLeft className="w-4 h-4 rtl:-scale-x-100" />
              <span>{profile?.churchName ?? t('nav.back')}</span>
            </button>
          )}
        </div>
      </header>

      <div className="page-container py-8 grid grid-cols-1 lg:grid-cols-[22rem_1fr] gap-8 items-start">
        {/* The code */}
        <aside className="space-y-5 lg:sticky lg:top-6">
          <div className="leaf p-5 space-y-4">
            <div className="flex items-center gap-2">
              <IconKey className="w-5 h-5 text-rubric" />
              <h1 className="font-serif text-2xl">{t('code.enter')}</h1>
            </div>
            <form
              onSubmit={(e) => {
                e.preventDefault();
                go(`/pickup/${input.trim().toUpperCase()}`);
                lookup(input);
              }}
              className="space-y-2"
            >
              <input
                value={input}
                onChange={(e) => setInput(e.target.value.toUpperCase())}
                placeholder="ABC-123"
                maxLength={7}
                dir="ltr"
                aria-label={t('pickup.codeAria')}
                className="field !py-3 text-center font-mono !text-2xl font-semibold tracking-[0.25em]"
              />
              <button type="submit" className="btn btn-ink w-full">
                {loading ? <Loader2 className="w-4 h-4 animate-spin" /> : t('pickup.check')}
              </button>
            </form>
            {mine.length > 0 && !code && (
              <div className="rule pt-3 space-y-2">
                <p className="rubric-ink">{t('pickup.onPhone')}</p>
                <div className="flex flex-wrap gap-1.5" dir="ltr">
                  {mine.slice(0, 5).map((r) => (
                    <button key={r.code} onClick={() => go(`/pickup/${r.code}`)} className="tag font-mono !text-[0.8rem] hover:border-rubric cursor-pointer">
                      {r.code}
                    </button>
                  ))}
                </div>
              </div>
            )}
            {error && <p className="text-sm text-alarm">{error}</p>}
          </div>

          {original && (
            <details className="leaf p-4 text-sm">
              <summary className="cursor-pointer rubric-ink">
                <span className="vr-mark">℣</span> {t('pickup.whatIWrote')}
              </summary>
              <p className="mt-3 text-ink-2 leading-relaxed">{original}</p>
            </details>
          )}
        </aside>

        {/* The reply */}
        <section className="space-y-5 min-w-0">
          {view && (view.status === 'crisis' || view.status === 'crisis-handled') && (
            <CrisisPanel tradition={view.tradition} lang={view.language} code={view.code} rtl={meta.rtl} />
          )}

          {view && view.status === 'pending' && (
            <div className="leaf p-8 flex items-start gap-4">
              <IconCandle className="w-8 h-8 text-rubric shrink-0" />
              <p className="prose-missal text-ink-2">{t('pickup.waiting')}</p>
            </div>
          )}

          {view && view.status === 'approved' && (
            <article className="leaf px-6 sm:px-10 py-8 space-y-7">
              <div className="flex flex-wrap items-center justify-between gap-3">
                <p className="rubric">
                  <span className="vr-mark">℟</span> {t('common.approvedBy', { name: view.approvedBy ?? '' })}
                </p>
                <span className="tag tag-vine">
                  <IconSeal className="w-4 h-4" /> {profile?.churchName}
                </span>
              </div>
              <p className="prose-missal !text-[1.3rem] !leading-[1.7] drop-cap">{original ? restoreOnDevice(view.reply ?? '', original) : dropTokens(view.reply ?? '')}</p>

              {verse && (
                <div className="double-rule pt-5 space-y-2">
                  <p className="rubric flex items-center gap-1.5">
                    <IconLectern className="w-4 h-4" /> {verse.reference}
                  </p>
                  <p className="font-serif italic text-[1.15rem] leading-relaxed text-ink-2">{verse.texts[view.language as SupportedLanguageCode]}</p>
                </div>
              )}

              {group && (
                <div className="inset p-4 flex items-start gap-3">
                  <IconTable className="w-6 h-6 text-rubric shrink-0" />
                  <div>
                    <p className="font-serif text-lg">{group.name}</p>
                    <p className="text-sm text-ink-2">
                      {group.schedule} · {group.location}
                    </p>
                  </div>
                </div>
              )}
            </article>
          )}

          {!view && !loading && (
            <div className="border border-dashed border-rule-strong p-10 text-center space-y-2">
              <IconKey className="w-8 h-8 text-ink-3 mx-auto" />
              <p className="text-ink-2">{t('code.help')}</p>
            </div>
          )}
        </section>
      </div>
    </div>
  );
};
