import React, { useEffect, useMemo, useRef, useState } from 'react';
import { Check, ChevronLeft, Ellipsis, Loader2, Send, Volume2, VolumeX, X } from 'lucide-react';
import type { TraditionId } from '../shared/languages';
import { ChurchTraditionProfile, SupportedLanguageCode } from '../types/koinonia';
import { SUPPORTED_LANGUAGES, VERIFIED_SCRIPTURE_CORPUS } from '../data/koinoniaData';
import { runZeroPIIShield } from '../utils/privacyShield';
import { api, useLiveEvents } from '../lib/api';
import { isMachineTranslated, tRich, useT, type UiKey } from '../lib/i18n';
import { useReadAloud } from '../lib/readAloud';
import { go } from '../lib/router';
import { useLocalState } from '../lib/local';
import { previewCrisis, submitCareRequest } from '../lib/submitCare';
import type { PublishedSermon } from '../shared/types';
import { CrisisPanel } from './CrisisPanel';
import { LangMark, langMark } from './brand/LangMark';
import { FlagSeal } from './brand/Flags';
import { VesicaMark } from './brand/Logo';
import { IconBell, IconCandle, IconCare, IconDoor, IconKey, IconLectern, IconScrub, IconSeal, IconTable } from './brand/Icons';

interface LivePewCompanionProps {
  profile: ChurchTraditionProfile;
  selectedLang: SupportedLanguageCode;
  onSelectLang: (lang: SupportedLanguageCode) => void;
  onNavigateToTab?: (tab: string) => void;
  /** Phone view opened from the pew QR code: hides links into the staff dashboard. */
  pewOnly?: boolean;
  completedDays: number[];
  onToggleDayComplete: (day: number) => void;
  journalNotes: Record<string, string>;
  onSaveJournalNote: (key: string, note: string) => void;
}

const ROMAN = ['I', 'II', 'III', 'IV', 'V', 'VI', 'VII', 'VIII', 'IX', 'X', 'XI', 'XII', 'XIII', 'XIV', 'XV'];
const roman = (n: number) => ROMAN[n - 1] ?? String(n);

/** Shows the redacted text with each redaction token set like blacked-out print. */
function RedactedText({ text }: { text: string }) {
  const parts = text.split(/(\[[A-Z_]+_REDACTED(?:_\d+)?\])/g);
  return (
    <>
      {parts.map((part, i) =>
        /^\[[A-Z_]+_REDACTED(?:_\d+)?\]$/.test(part) ? (
          <span
            key={i}
            className="bg-ink text-vellum px-1 mx-px rounded-[1px] text-[0.78em] align-[0.05em] whitespace-nowrap"
            dir="ltr"
          >
            {part}
          </span>
        ) : (
          <React.Fragment key={i}>{part}</React.Fragment>
        )
      )}
    </>
  );
}

/** The four sections a visitor can open on desktop (and in the staff dashboard preview). */
type DeskTab = 'message' | 'liturgy' | 'habit' | 'connect';
/** On phones the pew page also has a More tab, with groups and the church as their own screens. */
type PewView = DeskTab | 'more' | 'groups' | 'about';
type BarTab = 'message' | 'liturgy' | 'connect' | 'more';

const PHONE_QUERY = '(max-width: 900px)';

/** True at phone and small-tablet widths, where the pew page becomes a tab-bar app. */
function useIsPhone(): boolean {
  const [matches, setMatches] = useState(() => typeof window !== 'undefined' && window.matchMedia(PHONE_QUERY).matches);
  useEffect(() => {
    const mq = window.matchMedia(PHONE_QUERY);
    const onChange = () => setMatches(mq.matches);
    onChange();
    mq.addEventListener('change', onChange);
    return () => mq.removeEventListener('change', onChange);
  }, []);
  return matches;
}

/** One row of a grouped list on the phone More screen: icon, title, subtitle, chevron. */
function MoreRow({
  icon,
  title,
  subtitle,
  onClick,
}: {
  icon: React.ReactNode;
  title: string;
  subtitle: string;
  onClick: () => void;
}) {
  return (
    <li>
      <button
        type="button"
        onClick={onClick}
        className="w-full min-h-[64px] flex items-center gap-3.5 px-4 py-3 text-start cursor-pointer transition-colors hover:bg-parchment/60 active:bg-parchment"
      >
        <span className="w-9 h-9 shrink-0 inline-flex items-center justify-center text-rubric">{icon}</span>
        <span className="flex-1 min-w-0">
          <span className="block font-semibold text-ink leading-snug">{title}</span>
          <span className="block text-sm text-ink-3 truncate">
            <span dir="auto">{subtitle}</span>
          </span>
        </span>
      </button>
    </li>
  );
}

/** Reads public text aloud (never prayer requests): idle, preparing the voice, playing. */
function ListenButton({
  tradition,
  lang,
  text,
  t,
}: {
  tradition: TraditionId;
  lang: SupportedLanguageCode;
  text: string;
  t: (key: UiKey) => string;
}) {
  const { state, voice, toggle } = useReadAloud();
  return (
    <span className="inline-flex flex-col items-start gap-1">
      <button
        type="button"
        onClick={() => toggle({ tradition, lang, text })}
        className="btn btn-outline btn-sm"
        aria-pressed={state === 'playing'}
        aria-busy={state === 'loading'}
      >
        {state === 'loading' ? (
          <>
            <Loader2 className="w-4 h-4 text-rubric animate-spin" />
            <span>{t('listen.loading')}</span>
          </>
        ) : state === 'playing' ? (
          <>
            <VolumeX className="w-4 h-4 text-rubric" />
            <span>{t('listen.stop')}</span>
          </>
        ) : (
          <>
            <Volume2 className="w-4 h-4 text-rubric" />
            <span>{t('listen.start')}</span>
          </>
        )}
      </button>
      {state === 'playing' && voice === 'browser' && <span className="text-xs text-ink-3">{t('listen.browserVoice')}</span>}
    </span>
  );
}

export const LivePewCompanion: React.FC<LivePewCompanionProps> = ({
  profile,
  selectedLang,
  onSelectLang,
  onNavigateToTab,
  pewOnly = false,
  completedDays,
  onToggleDayComplete,
  journalNotes,
  onSaveJournalNote,
}) => {
  const [pewSubTab, setPewSubTab] = useState<PewView>('message');
  const [activeHabitDay, setActiveHabitDay] = useState<number>(1);
  const [activeLiturgyIdx, setActiveLiturgyIdx] = useState<number>(1);

  // Live Pew Care Request Form State
  const [visitorRawText, setVisitorRawText] = useState<string>(
    profile.id === 'san-venanzio-unicam'
      ? 'My name is Emmanuel Mensah (matricola 119304, phone +39 349 771 2088, Via Antica Rocca 9). I am a first-year UNICAM student from Ghana. I am struggling with homesickness and exam anxiety, and I would love prayer and an English-speaking student fellowship group.'
      : 'Me llamo Sofia Morales (tel 512-555-0149, email sofia.m@gmail.com). Es mi primer domingo aquí y me gustaría oración por la salud de mi madre y unirme a un grupo pequeño en español.'
  );
  const [submitting, setSubmitting] = useState(false);
  const [submitError, setSubmitError] = useState<string | null>(null);
  const [submitted, setSubmitted] = useState<{ code: string | null; crisis: boolean; removed: number } | null>(null);
  const [followLive, setFollowLive] = useState(false);
  const [liveIdx, setLiveIdx] = useState<number | null>(null);
  const [sermon, setSermon] = useState<PublishedSermon | null>(null);
  const t = useT(selectedLang, profile.id);
  const term = t(profile.sermonTerm === 'Homily' ? 'term.homily' : 'term.sermon');
  const termLower = term.toLocaleLowerCase(selectedLang);

  // Count this scan: only the language and the time are recorded, once per language per visit.
  useEffect(() => {
    const key = `koinonia.scanned.${profile.id}.${selectedLang}`;
    if (sessionStorage.getItem(key)) return;
    sessionStorage.setItem(key, '1');
    api.scan(profile.id, selectedLang).catch(() => undefined);
  }, [profile.id, selectedLang]);

  // The pastor's latest published message, translated into every pew language.
  useEffect(() => {
    api.sermon(profile.id).then(setSermon).catch(() => setSermon(null));
  }, [profile.id]);

  useLiveEvents(
    profile.id,
    'pew',
    (e) => {
      if (e.type === 'hello' || e.type === 'cue') {
        const idx = e.type === 'hello' ? e.data.cue.index : e.data.index;
        const clamped = Math.min(idx, profile.liturgicalSteps.length - 1);
        setLiveIdx(clamped);
        setActiveLiturgyIdx(clamped);
      }
      if (e.type === 'sermon') api.sermon(profile.id).then(setSermon).catch(() => undefined);
    },
    followLive
  );

  const sermonText = sermon?.translations.find((tr) => tr.lang === selectedLang);
  const messageTitle = sermonText?.title ?? profile.currentMessageTitle[selectedLang];
  const messageSummary = sermonText?.summary ?? profile.currentMessageSummary[selectedLang];
  const messageTakeaways = sermonText?.takeaways ?? profile.keyTakeaways[selectedLang] ?? profile.keyTakeaways.en;
  const scripture = (sermon && VERIFIED_SCRIPTURE_CORPUS[sermon.scriptureId]) || profile.primaryScripture;

  const currentLangMeta =
    SUPPORTED_LANGUAGES.find((l) => l.code === selectedLang) || SUPPORTED_LANGUAGES[0];
  const dir = currentLangMeta.rtl ? 'rtl' : 'ltr';

  const liveShieldPreview = useMemo(() => runZeroPIIShield(visitorRawText), [visitorRawText]);

  const currentHabitItem =
    profile.sevenDayJourney.find((d) => d.day === activeHabitDay) || profile.sevenDayJourney[0];

  const journalKey = `${profile.id}-day-${activeHabitDay}`;

  const handlePewCareSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!visitorRawText.trim() || submitting) return;
    setSubmitError(null);
    // Crisis lines appear instantly, before the network answers.
    const crisisNow = previewCrisis(visitorRawText).isCrisis;
    setSubmitted(crisisNow ? { code: null, crisis: true, removed: liveShieldPreview.totalEntitiesRedacted } : null);
    setSubmitting(true);
    try {
      const res = await submitCareRequest({
        profile,
        language: selectedLang,
        rawText: visitorRawText,
        source: 'Pew QR Scan',
        pastorLanguage: 'en',
      });
      setSubmitted({ code: res.pickup.code, crisis: res.crisis || crisisNow, removed: res.removedCount });
    } catch (err) {
      setSubmitError(err instanceof Error ? err.message : t('care.sendError'));
    } finally {
      setSubmitting(false);
    }
  };

  const tabs: { id: DeskTab; label: string; Icon: typeof IconLectern }[] = [
    { id: 'message', label: term, Icon: IconLectern },
    { id: 'liturgy', label: t('tab.serviceGuide'), Icon: IconBell },
    { id: 'habit', label: t('tab.habitCount', { done: completedDays.length }), Icon: IconCandle },
    { id: 'connect', label: t('tab.prayerCare'), Icon: IconCare },
  ];

  // Phone app layout (pew page only, <= 900px): bottom tab bar, greeting, More screen, language sheet.
  const isPhone = useIsPhone();
  const mobileApp = pewOnly && isPhone;
  const [langSheet, setLangSheet] = useState(false);
  const [careCardDismissed, setCareCardDismissed] = useLocalState<boolean>('koinonia.pew.careCardDismissed', false);
  const sheetCloseRef = useRef<HTMLButtonElement>(null);

  // Desktop only knows the four original sections.
  const deskTab: DeskTab =
    pewSubTab === 'more' || pewSubTab === 'groups' || pewSubTab === 'about' ? 'message' : pewSubTab;

  // Phone primary buttons get a 44px touch target; desktop keeps its sizes.
  const tap = mobileApp ? ' min-h-11' : '';

  const openView = (view: PewView) => {
    setPewSubTab(view);
    if (mobileApp) window.scrollTo({ top: 0 });
  };

  useEffect(() => {
    if (!langSheet) return;
    const prevOverflow = document.documentElement.style.overflow;
    document.documentElement.style.overflow = 'hidden';
    sheetCloseRef.current?.focus();
    const onKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape') setLangSheet(false);
    };
    window.addEventListener('keydown', onKey);
    return () => {
      document.documentElement.style.overflow = prevOverflow;
      window.removeEventListener('keydown', onKey);
    };
  }, [langSheet]);

  useEffect(() => {
    if (!mobileApp) setLangSheet(false);
  }, [mobileApp]);

  const activeStep = profile.liturgicalSteps[activeLiturgyIdx];
  const dayDone = completedDays.includes(currentHabitItem.day);


  // The building blocks, shared by the desktop layout and the phone app layout.
  const languageSection = (
    // In the staff preview this block is staff-facing English, so it keeps reading left to right.
    <section className="leaf p-5 sm:p-6" dir={pewOnly ? undefined : 'ltr'}>
      <div className="flex flex-col lg:flex-row lg:items-end lg:justify-between gap-4 mb-5">
        <div className="max-w-2xl">
          <p className="rubric mb-1.5">
            {pewOnly ? profile.churchName : `Pew companion · ${SUPPORTED_LANGUAGES.length} languages · nothing to install`}
          </p>
          <h2 className="text-3xl sm:text-4xl leading-[1.05] text-ink mb-2">
            {pewOnly ? t('lang.welcomeChoose') : 'What a newcomer sees after scanning the pew card'}
          </h2>
          <p className="text-ink-2 leading-relaxed">
            {pewOnly ? (
              t('lang.intro', { term: termLower })
            ) : (
              <>
                After scanning the card at <span className="font-semibold text-ink">{profile.churchName}</span> ({profile.cityCountry}), a visitor follows today’s {profile.sermonTerm.toLowerCase()}, the service and a 7-day reading plan in their own language.
              </>
            )}
          </p>
        </div>
        <div className="flex items-center gap-2.5 self-start lg:self-auto">
          <span className="rubric-ink">{pewOnly ? t('lang.readingIn') : 'Reading in'}</span>
          <LangMark code={currentLangMeta.code} active size="md" flag />
          <span className="font-semibold text-ink">{currentLangMeta.nativeName}</span>
        </div>
      </div>

      <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 xl:grid-cols-6 border-t border-s border-rule">
        {SUPPORTED_LANGUAGES.map((lang) => {
          const active = lang.code === selectedLang;
          return (
            <button
              key={lang.code}
              type="button"
              onClick={() => onSelectLang(lang.code)}
              aria-pressed={active}
              className={`relative flex items-center gap-2.5 px-3 py-2.5 text-start border-e border-b border-rule transition-colors cursor-pointer ${
                active ? 'bg-parchment' : 'bg-vellum hover:bg-parchment/60'
              }`}
            >
              {active && <span aria-hidden className="absolute inset-y-0 start-0 w-[2px] bg-rubric" />}
              <LangMark code={lang.code} active={active} flag />
              <span className="min-w-0 flex-1">
                <span className="block font-semibold text-[0.95rem] text-ink truncate" dir={lang.rtl ? 'rtl' : undefined}>
                  {lang.nativeName}
                </span>
                <span className="block text-xs text-ink-3 truncate">{lang.name}</span>
              </span>
            </button>
          );
        })}
      </div>
    </section>
  );

  const companionHeader = (
    <header className="bg-nave text-vellum px-5 py-5 sm:px-6 sm:py-6">
      <div className="flex flex-wrap items-center justify-between gap-2 mb-3">
        <span className="font-sc text-[0.8125rem] tracking-[0.07em] text-rubric-wash">{profile.serviceTerm}</span>
        <span className="tag tag-vine">
          <IconSeal className="w-3.5 h-3.5" />
          {t('common.approvedBy', { name: profile.leaderName })}
        </span>
      </div>

      <div>
        <p className="text-sm text-vellum/70 mb-1">{profile.currentSeriesTitle}</p>
        <h3 className="text-2xl sm:text-3xl leading-[1.1] text-vellum mb-2.5">{messageTitle}</h3>
        <p className="text-sm text-vellum/70 leading-snug">
          {profile.churchName}, {profile.cityCountry}
          <span className="mx-2 text-vellum/40">·</span>
          {profile.campusOrNeighborhood}
        </p>
      </div>
    </header>
  );

  const sectionNav = (
    <nav className="border-b border-rule overflow-x-auto" aria-label={t('nav.sections')}>
      <div className="flex min-w-max px-2 sm:px-4">
        {tabs.map(({ id, label, Icon }) => {
          const active = deskTab === id;
          return (
            <button
              key={id}
              type="button"
              onClick={() => setPewSubTab(id)}
              aria-current={active ? 'page' : undefined}
              className={`flex items-center gap-2 px-3 py-3.5 -mb-px border-b-2 text-[0.95rem] whitespace-nowrap transition-colors cursor-pointer ${
                active
                  ? 'border-rubric text-ink font-semibold'
                  : 'border-transparent text-ink-3 hover:text-ink'
              }`}
            >
              <Icon className={`w-[18px] h-[18px] ${active ? 'text-rubric' : ''}`} />
              <span>{label}</span>
            </button>
          );
        })}
      </div>
    </nav>
  );

  const messagePanel = (
    <div className="p-5 sm:p-7 space-y-8">
      <section>
        <p className="rubric text-base mb-3">{scripture.reference}</p>
        <blockquote className="font-serif text-xl sm:text-2xl leading-[1.5] text-ink">
          {scripture.texts[selectedLang]}
        </blockquote>
        <p className="rubric-ink mt-3">{t('message.storedPassage')}</p>
        <div className="mt-4 pt-3 rule flex flex-wrap items-center justify-between gap-3">
          <p className="text-sm text-ink-3">{t('message.demoPassage')}</p>
          <ListenButton
            key={selectedLang}
            tradition={profile.id}
            lang={selectedLang}
            text={`${messageTitle}. ${scripture.texts[selectedLang]}. ${messageSummary}`}
            t={t}
          />
        </div>
      </section>

      <section className="double-rule pt-6">
        <div className="flex flex-wrap items-baseline justify-between gap-2 mb-3">
          <p className="rubric">{t('message.today', { term: termLower, language: currentLangMeta.nativeName })}</p>
          <p className="text-sm text-ink-3">
            {tRich(selectedLang, 'message.preachedBy', {
              name: <span className="text-ink font-semibold">{profile.leaderName}</span>,
            })}
          </p>
        </div>
        <p className={`prose-missal ${currentLangMeta.rtl ? '' : 'drop-cap'}`}>{messageSummary}</p>
        {sermon && (
          <p className="text-sm text-ink-3 mt-3">
            {sermonText
              ? `${t('message.publishedBy', { name: sermon.publishedBy })}${sermon.mode === 'live' && sermonText.lang !== 'en' ? ` · ${t('message.translatedNote')}` : ''}`
              : t('message.needsLiveAi', { name: sermon.publishedBy, language: currentLangMeta.nativeName })}
          </p>
        )}
      </section>

      <section className="rule pt-6">
        <p className="rubric mb-3">{t('message.carry')}</p>
        <ol className="divide-y divide-rule">
          {messageTakeaways.map((point, idx) => (
            <li key={idx} className="flex items-baseline gap-4 py-3">
              <span className="font-serif text-rubric text-lg w-8 shrink-0 text-end">{roman(idx + 1)}.</span>
              <p className="font-serif text-[1.05rem] leading-relaxed text-ink">{point}</p>
            </li>
          ))}
        </ol>
      </section>

      <div className="rule pt-5 flex flex-col sm:flex-row sm:flex-wrap gap-3">
        <button type="button" onClick={() => openView('connect')} className={`btn btn-rubric${tap}`}>
          <IconCare className="w-[18px] h-[18px]" />
          <span>{t('message.askPrayer')}</span>
        </button>
        <button type="button" onClick={() => openView('habit')} className={`btn btn-outline${tap}`}>
          <IconCandle className="w-[18px] h-[18px]" />
          <span>{t('message.openPlan')}</span>
        </button>
      </div>
    </div>
  );

  const liturgyPanel = (
    <div className="p-5 sm:p-7 space-y-6">
      <section className="inset p-4 sm:p-5">
        <h4 className="text-xl leading-snug text-ink mb-1.5">{t('service.firstTime', { church: profile.churchName })}</h4>
        <p className="text-ink-2 leading-relaxed">{t('service.firstTimeBody')}</p>
      </section>

      <button
        type="button"
        onClick={() => setFollowLive((v) => !v)}
        aria-pressed={followLive}
        className={`btn btn-lg w-full ${followLive ? 'btn-rubric' : 'btn-outline'}`}
      >
        <IconCandle className={`w-5 h-5 ${followLive ? 'animate-pulse' : 'text-rubric'}`} />
        {followLive ? `${t('live.now')} · ${t('live.follow')}` : t('live.follow')}
      </button>

      <section>
        <p className="rubric mb-2">{t('service.order')}</p>
        <ol className="divide-y divide-rule border-y border-rule">
          {profile.liturgicalSteps.map((step, index) => {
            const isCurrent = index === activeLiturgyIdx;
            const isLive = followLive && liveIdx === index;
            return (
              <li key={step.id}>
                <button
                  type="button"
                  onClick={() => setActiveLiturgyIdx(index)}
                  aria-current={isCurrent ? 'step' : undefined}
                  className={`w-full flex items-center gap-3 py-3 pe-3 ps-3 text-start border-s-2 transition-colors cursor-pointer ${
                    isCurrent ? 'bg-parchment border-rubric' : 'border-transparent hover:bg-parchment/50'
                  }`}
                >
                  <span className="font-serif text-rubric w-8 shrink-0 text-end">{roman(step.order)}</span>
                  {mobileApp ? (
                    // Phone: the time goes under the title so the title keeps the width.
                    <span className="flex-1 min-w-0">
                      <span className={`block leading-snug ${isCurrent ? 'font-semibold text-ink' : 'text-ink-2'}`}>
                        {step.title[selectedLang] || step.title.en}
                      </span>
                      {isLive ? (
                        <span className="tag tag-rubric mt-1">
                          <IconCandle className="w-3.5 h-3.5" /> {t('live.now')}
                        </span>
                      ) : (
                        <span className="block mt-0.5 text-sm text-ink-3 num-lining">{step.timestampLabel}</span>
                      )}
                    </span>
                  ) : (
                    <>
                      <span className={`flex-1 min-w-0 ${isCurrent ? 'font-semibold text-ink' : 'text-ink-2'}`}>
                        {step.title[selectedLang] || step.title.en}
                      </span>
                      {isLive ? (
                        <span className="tag tag-rubric shrink-0">
                          <IconCandle className="w-3.5 h-3.5" /> {t('live.now')}
                        </span>
                      ) : (
                        <span className="text-sm text-ink-3 num-lining shrink-0">{step.timestampLabel}</span>
                      )}
                    </>
                  )}
                </button>
              </li>
            );
          })}
        </ol>
      </section>

      {activeStep && (
        <section className="double-rule pt-5 space-y-5">
          <div>
            <div className="flex flex-wrap items-center gap-3 mb-1.5">
              <span className="rubric">
                {t('service.part', { n: activeStep.order, total: profile.liturgicalSteps.length, time: activeStep.timestampLabel })}
              </span>
              {followLive && liveIdx === activeLiturgyIdx && (
                <span className="tag tag-rubric">
                  <IconCandle className="w-3.5 h-3.5 animate-pulse" /> {t('live.now')}
                </span>
              )}
            </div>
            <h4 className="text-2xl sm:text-3xl leading-[1.1] text-ink">{activeStep.title[selectedLang]}</h4>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
            <div>
              <p className="rubric-ink mb-1">{t('service.whatHappens')}</p>
              <p className="text-ink leading-relaxed">{activeStep.whatHappens[selectedLang]}</p>
            </div>
            <div>
              <p className="rubric mb-1">{t('service.whyMatters')}</p>
              <p className="font-serif text-[1.05rem] text-ink leading-relaxed">
                {activeStep.spiritualMeaning[selectedLang]}
              </p>
            </div>
          </div>
          <div className="inset p-4">
            <p className="rubric-ink mb-1">{t('service.posture')}</p>
            <p className="text-ink">{activeStep.postureOrResponse[selectedLang]}</p>
          </div>
          <ListenButton
            key={`${activeStep.id}-${selectedLang}`}
            tradition={profile.id}
            lang={selectedLang}
            text={`${activeStep.title[selectedLang] || activeStep.title.en}. ${activeStep.whatHappens[selectedLang]}. ${activeStep.postureOrResponse[selectedLang]}`}
            t={t}
          />
        </section>
      )}
    </div>
  );

  const habitPanel = (
    <div className="p-5 sm:p-7 space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-end sm:justify-between gap-3">
        <div>
          <p className="rubric mb-1">{t('habit.rubric')}</p>
          <h4 className="text-2xl leading-[1.1] text-ink mb-1">{t('habit.title')}</h4>
          <p className="text-ink-2">{t('habit.intro', { term: termLower })}</p>
        </div>
        <span className={`tag self-start sm:self-auto ${completedDays.length === 7 ? 'tag-vine' : ''}`}>
          {t('habit.progress', { done: completedDays.length })}
        </span>
      </div>

      <div className="grid grid-cols-7 border-t border-s border-rule">
        {profile.sevenDayJourney.map((item) => {
          const isDone = completedDays.includes(item.day);
          const isSelected = item.day === activeHabitDay;
          return (
            <button
              key={item.day}
              type="button"
              onClick={() => setActiveHabitDay(item.day)}
              aria-pressed={isSelected}
              aria-label={t(isDone ? 'habit.dayDoneAria' : 'habit.day', { day: item.day })}
              className={`relative flex flex-col items-center justify-center gap-0.5 py-2.5 border-e border-b border-rule transition-colors cursor-pointer ${
                isSelected ? 'bg-parchment' : 'bg-vellum hover:bg-parchment/60'
              }`}
            >
              {isSelected && <span aria-hidden className="absolute inset-x-0 bottom-0 h-[2px] bg-rubric" />}
              <span className="font-sc text-[0.7rem] tracking-[0.05em] text-ink-3">{t('habit.dayShort')}</span>
              <span className={`font-serif text-lg leading-none ${isSelected ? 'text-rubric' : 'text-ink'}`}>
                {item.day}
              </span>
              <span className="h-3.5 flex items-center">
                {isDone && <Check className="w-3.5 h-3.5 text-vine" strokeWidth={2.5} />}
              </span>
            </button>
          );
        })}
      </div>

      <section className="space-y-5">
        <div className="flex flex-wrap items-center justify-between gap-2">
          <span className="rubric">
            {t('habit.dayLabel', { day: currentHabitItem.day, label: currentHabitItem.dayLabel })}
          </span>
          <span className={`tag tag-vine${mobileApp ? ' whitespace-normal leading-snug' : ''}`}>
            <IconSeal className="w-3.5 h-3.5 shrink-0" />
            {t('common.approvedBy', { name: currentHabitItem.approvedBy })}
          </span>
        </div>

        <h5 className="text-2xl sm:text-3xl leading-[1.1] text-ink">{currentHabitItem.title[selectedLang]}</h5>

        <div className="border-s-2 border-rubric ps-4">
          <p className="rubric mb-1.5">{currentHabitItem.scriptureRef}</p>
          <p className="font-serif text-lg leading-relaxed text-ink">{currentHabitItem.scriptureText[selectedLang]}</p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-5 rule pt-5">
          <div>
            <p className="rubric mb-1">{t('habit.reflect')}</p>
            <p className="font-serif text-[1.05rem] text-ink leading-relaxed">
              {currentHabitItem.reflectionPrompt[selectedLang]}
            </p>
          </div>
          <div className="space-y-3">
            <div>
              <p className="rubric-ink mb-1">{t('habit.todo')}</p>
              <p className="text-ink leading-relaxed">{currentHabitItem.actionStep[selectedLang]}</p>
            </div>
            <div>
              <p className="rubric-ink mb-1">{t('habit.prayFor')}</p>
              <p className="text-ink-2 leading-relaxed">{currentHabitItem.prayerFocus[selectedLang]}</p>
            </div>
          </div>
        </div>

        <div className="space-y-1.5">
          <label htmlFor={`journal-${journalKey}`} className="flex flex-wrap items-baseline justify-between gap-x-3 gap-y-0.5">
            <span className="rubric-ink">{t('habit.notes')}</span>
            <span className="text-xs text-ink-3">{t('habit.notesPrivate')}</span>
          </label>
          <textarea
            id={`journal-${journalKey}`}
            rows={3}
            value={journalNotes[journalKey] || ''}
            onChange={(e) => onSaveJournalNote(journalKey, e.target.value)}
            placeholder={t('habit.notesPlaceholder', { day: currentHabitItem.day })}
            className="field font-serif text-base"
          />
        </div>

        <div className="flex flex-wrap items-center justify-between gap-3 pt-1">
          <button
            type="button"
            onClick={() => onToggleDayComplete(currentHabitItem.day)}
            aria-pressed={dayDone}
            className={`btn ${dayDone ? 'btn-vine' : 'btn-ink'}${tap}`}
          >
            <Check className="w-4 h-4" />
            <span>{t(dayDone ? 'habit.dayDone' : 'habit.markDone', { day: currentHabitItem.day })}</span>
          </button>
          {currentHabitItem.day < 7 && (
            <button
              type="button"
              onClick={() => setActiveHabitDay(currentHabitItem.day + 1)}
              className="btn btn-ghost"
            >
              <span>{t('habit.day', { day: currentHabitItem.day + 1 })}</span>
            </button>
          )}
        </div>
      </section>
    </div>
  );

  const connectPanel = (
    <div className="p-5 sm:p-7 space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-end sm:justify-between gap-3">
        <div>
          <p className="rubric mb-1">{t('care.rubric')}</p>
          <h4 className="text-2xl leading-[1.1] text-ink mb-1">{t('care.title')}</h4>
          <p className="text-ink-2">{t('care.intro', { language: currentLangMeta.nativeName })}</p>
        </div>
        <span className="tag self-start sm:self-auto">
          <IconScrub className="w-3.5 h-3.5" />
          {t('care.removedTag')}
        </span>
      </div>

      {submitted?.crisis && (
        <CrisisPanel tradition={profile.id} lang={selectedLang} code={submitted.code} rtl={currentLangMeta.rtl} />
      )}

      {submitted && !submitted.crisis && submitted.code && (
        <section className="border border-rule-strong bg-paper">
          <div className="flex items-center gap-2 px-5 pt-4 pb-3">
            <IconKey className="w-5 h-5 text-rubric" />
            <span className="rubric">{t('code.title')}</span>
          </div>
          <div className="double-rule mx-5" />
          <div className="py-5 text-center font-mono text-4xl sm:text-5xl font-semibold tracking-[0.18em] text-ink" dir="ltr">
            {submitted.code}
          </div>
          <div className="double-rule mx-5" />
          <div className="px-5 pt-4 pb-5 space-y-4">
            <p className="text-ink leading-relaxed">{t('code.help')}</p>
            <div className="flex flex-col sm:flex-row sm:flex-wrap gap-2">
              <button type="button" onClick={() => go(`/pickup/${submitted.code}`)} className={`btn btn-ink${tap}`}>
                <span>{t('code.openReply')}</span>
              </button>
              {!pewOnly && onNavigateToTab && (
                <button type="button" onClick={() => onNavigateToTab('care')} className="btn btn-outline">
                  See it arrive in the Care Bridge
                </button>
              )}
            </div>
            <p className="flex items-center gap-1.5 text-sm text-vine">
              <IconScrub className="w-4 h-4 shrink-0" />
              {t(submitted.removed === 1 ? 'care.removedSent.one' : 'care.removedSent.other', { n: submitted.removed })}
            </p>
          </div>
        </section>
      )}

      <form onSubmit={handlePewCareSubmit} className="space-y-5">
        <div>
          <label htmlFor="pew-care-text" className="block mb-2">
            <span className="rubric block mb-0.5">{t('care.yourRequest')}</span>
            <span className="text-sm text-ink-2">{t('care.requestHelp')}</span>
          </label>
          <div className="flex items-start gap-3">
            <span className="vr-mark text-2xl pt-2 shrink-0" aria-hidden>
              ℣
            </span>
            <textarea
              id="pew-care-text"
              rows={4}
              value={visitorRawText}
              dir={dir}
              onChange={(e) => {
                setVisitorRawText(e.target.value);
                setSubmitted(null);
              }}
              className="field flex-1 font-serif text-base leading-relaxed"
              placeholder={t('care.placeholder')}
            />
          </div>
        </div>

        <section className="inset p-4 space-y-2.5">
          <div className="flex flex-wrap items-center justify-between gap-2">
            <span className="rubric-ink flex items-center gap-1.5">
              <IconScrub className="w-4 h-4 text-ink-2" />
              {t('care.leaves')}
            </span>
            <span className="tag">
              {t(liveShieldPreview.totalEntitiesRedacted === 1 ? 'care.removed.one' : 'care.removed.other', {
                n: liveShieldPreview.totalEntitiesRedacted,
              })}
            </span>
          </div>
          <p
            dir={dir}
            aria-live="polite"
            className="font-mono text-[0.85rem] leading-[1.75] text-ink bg-vellum border border-rule px-3 py-2.5 break-words"
          >
            {liveShieldPreview.redactedText ? (
              <RedactedText text={liveShieldPreview.redactedText} />
            ) : (
              <span className="text-ink-3">{t('care.previewEmpty')}</span>
            )}
          </p>
          <p className="text-xs text-ink-3 leading-relaxed">{t('care.filterNote')}</p>
        </section>

        <div className="flex flex-col sm:flex-row sm:flex-wrap sm:items-center sm:justify-between gap-3">
          <div className="space-y-1">
            <button
              type="submit"
              disabled={submitting || !visitorRawText.trim()}
              className="btn btn-rubric btn-lg w-full sm:w-auto"
            >
              {submitting ? <Loader2 className="w-4 h-4 animate-spin" /> : <Send className="w-4 h-4 rtl:-scale-x-100" />}
              <span>{t('care.send')}</span>
            </button>
            <p className="text-sm text-ink-3">{t('care.personReads')}</p>
          </div>
          <button type="button" onClick={() => go('/pickup')} className="btn btn-ghost self-start sm:self-auto">
            <IconKey className="w-4 h-4 text-rubric" />
            <span>{t('code.enter')}</span>
          </button>
        </div>
        {submitError && <p className="text-sm text-rubric-deep">{submitError}</p>}
      </form>
    </div>
  );

  const churchSection = (
    <section className="leaf p-5 space-y-3">
      <span className="tag tag-gold lowercase whitespace-normal leading-snug" dir="auto">{profile.badgeText}</span>
      <h3 className="text-xl leading-snug text-ink" dir="auto">{profile.heritageBannerTitle}</h3>
      <p className="text-sm text-ink-2 leading-relaxed" dir="auto">{profile.heritageBannerStory}</p>
      <dl className="rule pt-3 divide-y divide-rule text-sm">
        <div className="pb-2">
          <dt className="rubric-ink">{t('church.leads')}</dt>
          <dd className="font-semibold text-ink">{profile.leaderName}</dd>
        </div>
        <div className="pt-2">
          <dt className="rubric-ink">{t('church.careLead')}</dt>
          <dd className="font-semibold text-ink">{profile.coLeaderName}</dd>
        </div>
      </dl>
    </section>
  );

  const groupsSection = (limit?: number) => (
    <section className="leaf p-5 space-y-3">
      <p className="rubric flex items-center gap-1.5">
        <IconTable className="w-4 h-4" />
        {t('title.groups')}
      </p>
      <h3 className="text-xl leading-snug text-ink">{t('groups.title')}</h3>
      <p className="text-sm text-ink-2">{t('groups.langFirst', { language: currentLangMeta.nativeName })}</p>

      <ul className="divide-y divide-rule border-y border-rule">
        {[...profile.smallGroups]
          .sort((a, b) => Number(b.languages.includes(selectedLang)) - Number(a.languages.includes(selectedLang)))
          .slice(0, limit)
          .map((grp) => (
            <li key={grp.id} className="py-3 space-y-1.5">
              <div className="flex items-start justify-between gap-2">
                <span className="font-semibold text-ink leading-snug">{grp.name}</span>
                {grp.languages.includes(selectedLang) && (
                  <span className="tag tag-vine shrink-0">{t('groups.inLang', { language: currentLangMeta.nativeName })}</span>
                )}
              </div>
              <dl className="grid grid-cols-[auto_1fr] gap-x-3 gap-y-0.5 text-sm">
                <dt className="rubric-ink">{t('groups.when')}</dt>
                <dd className="text-ink-2">{grp.schedule}</dd>
                <dt className="rubric-ink">{t('groups.where')}</dt>
                <dd className="text-ink-2">{grp.location}</dd>
              </dl>
              <div className="flex flex-wrap gap-1 pt-0.5">
                {grp.languageLabels.map((lbl) => (
                  <span key={lbl} className="tag">
                    {lbl}
                  </span>
                ))}
              </div>
            </li>
          ))}
      </ul>

      {!pewOnly && onNavigateToTab && (
        <button type="button" onClick={() => onNavigateToTab('groups')} className="btn btn-outline w-full">
          <span>Explore all groups</span>
        </button>
      )}
    </section>
  );

  if (!mobileApp) {
    return (
      <div className="space-y-6" dir={dir}>
        {/* Language chooser */}
        {languageSection}

        <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
          {/* Main column: the companion itself */}
          <div className="lg:col-span-8 leaf overflow-hidden">
            {/* Header strip */}
            {companionHeader}

            {/* Section tabs */}
            {sectionNav}

            {/* I. The homily / sermon and its Scripture */}
            {deskTab === 'message' && messagePanel}

            {/* II. Service guide: what is happening now */}
            {deskTab === 'liturgy' && liturgyPanel}

            {/* III. The 7-day take-home habit */}
            {deskTab === 'habit' && habitPanel}

            {/* IV. Prayer, care and groups: details are removed on the phone before sending */}
            {deskTab === 'connect' && connectPanel}
          </div>

          {/* Side column: the church and groups in this language */}
          <aside className="lg:col-span-4 space-y-6">
            {churchSection}
            {groupsSection(2)}
          </aside>
        </div>
      </div>
    );
  }

  // ---------------------------------------------------------------------------
  // Phone app layout (pew page only): a bottom tab bar, like a transit app.
  // ---------------------------------------------------------------------------
  const barTab: BarTab =
    pewSubTab === 'habit' || pewSubTab === 'groups' || pewSubTab === 'about' || pewSubTab === 'more' ? 'more' : pewSubTab;
  const isSubView = pewSubTab === 'habit' || pewSubTab === 'groups' || pewSubTab === 'about';

  const viewTitle: Record<PewView, string> = {
    message: term,
    liturgy: t('tab.service'),
    connect: t('tab.prayer'),
    more: t('tab.more'),
    habit: t('title.habit'),
    groups: t('title.groups'),
    about: t('title.about'),
  };

  const barTabs: { id: BarTab; label: string; Icon: React.ComponentType<{ className?: string }> }[] = [
    { id: 'message', label: term, Icon: IconLectern },
    { id: 'liturgy', label: t('tab.service'), Icon: IconBell },
    { id: 'connect', label: t('tab.prayer'), Icon: IconCare },
    { id: 'more', label: t('tab.more'), Icon: Ellipsis },
  ];

  const openAiSection = () => {
    go('/');
    window.setTimeout(() => document.getElementById('ai')?.scrollIntoView(), 250);
  };

  const card = (content: React.ReactNode) => <div className="mx-3 leaf overflow-hidden">{content}</div>;

  return (
    // The whole phone app follows the reading direction (Arabic: right to left), bars and sheet included.
    <div className="min-h-[100dvh]" dir={dir}>
      {/* Slim top bar: logo (or back), centred section title */}
      <header className="fixed inset-x-0 top-0 z-30 bg-paper border-b border-rule pt-[env(safe-area-inset-top)]">
        <div className="mx-auto max-w-[40rem] h-[52px] grid grid-cols-[3rem_minmax(0,1fr)_3rem] items-center px-1">
          {isSubView ? (
            <button
              type="button"
              onClick={() => openView('more')}
              aria-label={t('nav.backToMore')}
              className="w-11 h-11 inline-flex items-center justify-center text-ink-2 hover:text-ink cursor-pointer"
            >
              <ChevronLeft className="w-6 h-6 rtl:-scale-x-100" />
            </button>
          ) : (
            <button
              type="button"
              onClick={() => go('/')}
              aria-label={t('nav.home')}
              className="w-11 h-11 inline-flex items-center justify-center cursor-pointer"
            >
              <VesicaMark size={28} />
            </button>
          )}
          <h1 className="text-center text-[1.15rem] leading-none text-ink truncate">{viewTitle[pewSubTab]}</h1>
          <span aria-hidden />
        </div>
      </header>

      <div className="pt-[calc(52px+env(safe-area-inset-top))] pb-tabbar">
        <div className="mx-auto max-w-[40rem]">
          {/* Home: greeting, first-visit card, today's message */}
          {pewSubTab === 'message' && (
            <div className="pt-6 space-y-5">
              <section className="px-4 flex items-center justify-between gap-4">
                <div className="min-w-0">
                  <h2 className="text-[2.6rem] leading-none text-ink">{t('home.welcome')}</h2>
                  <p className="mt-2 text-ink-2 leading-snug">{profile.churchName}</p>
                </div>
                <button
                  type="button"
                  onClick={() => setLangSheet(true)}
                  aria-label={t('lang.change', { language: currentLangMeta.nativeName })}
                  className="relative shrink-0 w-14 h-14 rounded-full bg-vellum border border-rule-strong inline-flex items-center justify-center font-serif font-semibold text-[1.45rem] leading-none text-ink cursor-pointer hover:bg-parchment transition-colors"
                >
                  <span aria-hidden>{langMark(selectedLang)}</span>
                  <FlagSeal code={selectedLang} className="absolute -bottom-0.5 -end-0.5 w-5 h-5" />
                </button>
              </section>

              {!careCardDismissed && (
                <section
                  className="mx-3 rounded-[14px] bg-rubric-wash border border-rubric/20 p-4"
                  aria-label={t('card.aria')}
                >
                  <div className="flex items-start gap-3">
                    <IconCare className="w-7 h-7 shrink-0 text-rubric" />
                    <div className="min-w-0">
                      <h3 className="text-[1.2rem] leading-snug text-ink">{t('card.title')}</h3>
                      <p className="mt-1 text-ink-2 leading-relaxed">{t('card.body')}</p>
                    </div>
                  </div>
                  <div className="mt-4 flex flex-wrap justify-end gap-2">
                    <button
                      type="button"
                      onClick={() => setCareCardDismissed(true)}
                      className="min-h-11 px-5 rounded-full border border-rubric/40 text-rubric-deep font-semibold cursor-pointer hover:bg-vellum/60 transition-colors"
                    >
                      {t('card.notNow')}
                    </button>
                    <button
                      type="button"
                      onClick={() => openView('connect')}
                      className="min-h-11 px-5 rounded-full bg-rubric text-[#fff8f0] font-semibold cursor-pointer hover:bg-rubric-deep transition-colors"
                    >
                      {t('card.write')}
                    </button>
                  </div>
                </section>
              )}

              {card(
                <>
                  {companionHeader}
                  {messagePanel}
                </>
              )}
            </div>
          )}

          {pewSubTab === 'liturgy' && <div className="pt-3">{card(liturgyPanel)}</div>}
          {pewSubTab === 'connect' && <div className="pt-3">{card(connectPanel)}</div>}
          {pewSubTab === 'habit' && <div className="pt-3">{card(habitPanel)}</div>}
          {pewSubTab === 'groups' && <div className="pt-3 px-3">{groupsSection()}</div>}
          {pewSubTab === 'about' && <div className="pt-3 px-3">{churchSection}</div>}

          {/* More: grouped list rows */}
          {pewSubTab === 'more' && (
            <div className="pt-5 space-y-6">
              <section>
                <p className="rubric-ink px-4 mb-1.5">{t('more.reading')}</p>
                <ul className="bg-vellum border-y border-rule divide-y divide-rule">
                  <MoreRow
                    icon={<LangMark code={selectedLang} size="sm" flag className="me-0!" />}
                    title={t('more.language')}
                    subtitle={
                      currentLangMeta.nativeName === currentLangMeta.name
                        ? currentLangMeta.name
                        : `${currentLangMeta.name} · ${currentLangMeta.nativeName}`
                    }
                    onClick={() => setLangSheet(true)}
                  />
                </ul>
              </section>

              <section>
                <p className="rubric-ink px-4 mb-1.5">{t('more.week')}</p>
                <ul className="bg-vellum border-y border-rule divide-y divide-rule">
                  <MoreRow
                    icon={<IconCandle className="w-6 h-6" />}
                    title={t('title.habit')}
                    subtitle={t('habit.progress', { done: completedDays.length })}
                    onClick={() => openView('habit')}
                  />
                  <MoreRow
                    icon={<IconKey className="w-6 h-6" />}
                    title={t('more.replies')}
                    subtitle={t('code.enter')}
                    onClick={() => go('/pickup')}
                  />
                </ul>
              </section>

              <section>
                <p className="rubric-ink px-4 mb-1.5">{t('more.church')}</p>
                <ul className="bg-vellum border-y border-rule divide-y divide-rule">
                  <MoreRow
                    icon={<IconTable className="w-6 h-6" />}
                    title={t('title.groups')}
                    subtitle={t('groups.title')}
                    onClick={() => openView('groups')}
                  />
                  <MoreRow
                    icon={<IconDoor className="w-6 h-6" />}
                    title={t('title.about')}
                    subtitle={`${profile.churchName}, ${profile.cityCountry}`}
                    onClick={() => openView('about')}
                  />
                </ul>
              </section>

              <footer className="px-4 pt-2 text-center space-y-1">
                <p className="flex flex-wrap items-center justify-center gap-x-3 text-sm">
                  <button type="button" onClick={openAiSection} className="min-h-11 px-2 text-rubric hover:underline cursor-pointer">
                    {t('more.howAi')}
                  </button>
                  <span aria-hidden className="text-ink-3">
                    ·
                  </span>
                  <button type="button" onClick={() => go('/')} className="min-h-11 px-2 text-rubric hover:underline cursor-pointer">
                    {t('nav.home')}
                  </button>
                </p>
                <p className="text-xs text-ink-3">{t('more.sample')}</p>
                {isMachineTranslated(selectedLang) && (
                  <p className="pt-2 text-xs text-ink-3 leading-relaxed max-w-[22rem] mx-auto">{t('more.machineNote')}</p>
                )}
              </footer>
            </div>
          )}
        </div>
      </div>

      {/* Bottom tab bar */}
      <nav
        aria-label={t('nav.sections')}
        className="fixed inset-x-0 bottom-0 z-40 bg-vellum border-t border-rule pb-[env(safe-area-inset-bottom)]"
      >
        <div className="mx-auto max-w-[40rem] h-16 grid grid-cols-4">
          {barTabs.map(({ id, label, Icon }) => {
            const active = barTab === id;
            return (
              <button
                key={id}
                type="button"
                onClick={() => openView(id)}
                aria-current={active ? 'page' : undefined}
                className={`relative flex flex-col items-center justify-center gap-1 cursor-pointer transition-colors ${
                  active ? 'text-rubric' : 'text-ink-3 hover:text-ink'
                }`}
              >
                {active && <span aria-hidden className="absolute top-0 left-1/2 -translate-x-1/2 h-[2px] w-9 rounded-full bg-rubric" />}
                <Icon className="w-6 h-6" />
                <span className="font-sc text-[0.8rem] tracking-[0.06em] leading-none lowercase">{label}</span>
              </button>
            );
          })}
        </div>
      </nav>

      {/* Language chooser: a full-screen sheet on phones */}
      {langSheet && (
        <div role="dialog" aria-modal="true" aria-label={t('lang.choose')} className="fixed inset-0 z-50 bg-paper flex flex-col">
          <div className="shrink-0 border-b border-rule pt-[env(safe-area-inset-top)]">
            <div className="mx-auto max-w-[40rem] h-[52px] grid grid-cols-[3rem_minmax(0,1fr)_3rem] items-center px-1">
              <span aria-hidden />
              <h2 className="text-center text-[1.15rem] leading-none text-ink">{t('lang.title')}</h2>
              <button
                ref={sheetCloseRef}
                type="button"
                onClick={() => setLangSheet(false)}
                aria-label={t('common.close')}
                className="w-11 h-11 inline-flex items-center justify-center text-ink-2 hover:text-ink cursor-pointer"
              >
                <X className="w-6 h-6" />
              </button>
            </div>
          </div>
          <div className="flex-1 overflow-y-auto overscroll-contain">
            <div className="mx-auto max-w-[40rem] pt-4 pb-[calc(1.5rem+env(safe-area-inset-bottom))]">
              <p className="px-4 mb-3 text-ink-2">{t('lang.chooseHelp')}</p>
              <ul className="bg-vellum border-y border-rule divide-y divide-rule">
                {SUPPORTED_LANGUAGES.map((lang) => {
                  const active = lang.code === selectedLang;
                  return (
                    <li key={lang.code}>
                      <button
                        type="button"
                        onClick={() => {
                          onSelectLang(lang.code);
                          setLangSheet(false);
                        }}
                        aria-pressed={active}
                        className={`relative w-full min-h-[60px] flex items-center gap-3.5 px-4 py-2.5 text-start cursor-pointer transition-colors ${
                          active ? 'bg-parchment' : 'hover:bg-parchment/60'
                        }`}
                      >
                        {active && <span aria-hidden className="absolute inset-y-0 start-0 w-[2px] bg-rubric" />}
                        <LangMark code={lang.code} active={active} flag />
                        <span className="flex-1 min-w-0">
                          <span className="block font-semibold text-ink truncate">
                            <span dir={lang.rtl ? 'rtl' : undefined}>{lang.nativeName}</span>
                          </span>
                          <span className="block text-sm text-ink-3 truncate">{lang.name}</span>
                        </span>
                        {active && <Check className="w-5 h-5 shrink-0 text-rubric" strokeWidth={2.25} />}
                      </button>
                    </li>
                  );
                })}
              </ul>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
