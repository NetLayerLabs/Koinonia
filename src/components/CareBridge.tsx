import React, { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { ChevronLeft, Eye, EyeOff, Loader2, Phone, Plus, X } from 'lucide-react';
import type { ChurchTraditionProfile, SupportedLanguageCode } from '../types/koinonia';
import { SUPPORTED_LANGUAGES, scriptureFor } from '../data/koinoniaData';
import { api, useLiveEvents } from '../lib/api';
import { can, type StaffRole } from '../shared/staff';
import { PASTOR_LANGUAGES, sampleOriginal, seedRecords } from '../lib/careData';
import { originalForCode } from '../lib/local';
import { submitCareRequest } from '../lib/submitCare';
import { crisisLinesFor } from '../shared/crisis';
import type { CareRecord, DriftIssue, PIITokenCount } from '../shared/types';
import { GlossaryPanel } from './GlossaryPanel';
import {
  IconBridge,
  IconCare,
  IconCrook,
  IconGlossary,
  IconKey,
  IconLifebuoy,
  IconRoundTrip,
  IconScrub,
  IconSeal,
  IconTable,
  VesicaBullet,
} from './brand/Icons';
import { LangMark } from './brand/LangMark';

interface CareBridgeProps {
  profile: ChurchTraditionProfile;
  aiOn: boolean;
  role: StaffRole;
  onToast: (message: string) => void;
}

type Filter = 'ALL' | 'PENDING' | 'CRISIS' | 'APPROVED';

const VERDICT_STYLE: Record<string, { label: string; cls: string }> = {
  faithful: { label: 'Meaning kept', cls: 'tag-vine' },
  minor_drift: { label: 'Small shifts in meaning', cls: 'tag-gold' },
  major_drift: { label: 'Meaning changed: review before approving', cls: 'tag-rubric' },
  not_checked: { label: 'Not checked (AI off, sample translation)', cls: '' },
};

const PII_WORDS: Record<PIITokenCount['type'], [string, string]> = {
  NAME: ['name', 'names'],
  PHONE: ['phone number', 'phone numbers'],
  EMAIL: ['email address', 'email addresses'],
  STUDENT_ID: ['student ID', 'student IDs'],
  ADDRESS: ['street address', 'street addresses'],
};

function langMeta(code: string) {
  return SUPPORTED_LANGUAGES.find((l) => l.code === code) ?? SUPPORTED_LANGUAGES[0];
}

function timeAgo(iso: string): string {
  const mins = Math.round((Date.now() - Date.parse(iso)) / 60000);
  if (mins < 1) return 'just now';
  if (mins < 60) return `${mins} min ago`;
  const hours = Math.round(mins / 60);
  if (hours < 24) return `${hours} h ago`;
  return `${Math.round(hours / 24)} d ago`;
}

function escapeRe(s: string) {
  return s.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
}

/** Scrubbed text, with each redaction token set like a blacked-out word. */
function Redacted({ text }: { text: string }) {
  const parts = text.split(/(\[[A-Z_]+?_REDACTED(?:_\d+)?\])/g);
  return (
    <>
      {parts.map((part, i) =>
        /^\[[A-Z_]+?_REDACTED(?:_\d+)?\]$/.test(part) ? (
          <span
            key={i}
            title="Removed on the attendee's phone"
            className="inline-block bg-ink text-rule-strong px-1.5 mx-0.5 rounded-[1px] text-[0.78em] leading-[1.5] align-baseline select-all"
          >
            {part.slice(1, -1).replace(/_REDACTED/, '').replace(/_/g, ' ').toLowerCase()}
          </span>
        ) : (
          <React.Fragment key={i}>{part}</React.Fragment>
        )
      )}
    </>
  );
}

/** Marks the phrases the drift check flagged. */
function MarkPhrases({ text, marks }: { text: string; marks: { phrase: string; severity: DriftIssue['severity'] }[] }) {
  const usable = marks.filter((m) => m.phrase.trim().length > 0);
  if (usable.length === 0) return <>{text}</>;
  const parts = text.split(new RegExp(`(${usable.map((m) => escapeRe(m.phrase)).join('|')})`, 'g'));
  return (
    <>
      {parts.map((part, i) => {
        const hit = usable.find((m) => m.phrase === part);
        if (!hit) return <React.Fragment key={i}>{part}</React.Fragment>;
        return (
          <mark
            key={i}
            className={`px-0.5 rounded-[1px] text-ink underline decoration-1 underline-offset-[3px] ${
              hit.severity === 'major' ? 'bg-rubric-wash decoration-rubric' : 'bg-gold-wash decoration-gold'
            }`}
          >
            {part}
          </mark>
        );
      })}
    </>
  );
}

export const CareBridge: React.FC<CareBridgeProps> = ({ profile, aiOn, role, onToast }) => {
  const [items, setItems] = useState<CareRecord[]>([]);
  const [loading, setLoading] = useState(true);
  const [loadError, setLoadError] = useState<string | null>(null);
  const [selectedId, setSelectedId] = useState<string | null>(null);
  const [filter, setFilter] = useState<Filter>('ALL');
  const [showGlossary, setShowGlossary] = useState(false);

  const refresh = useCallback(async () => {
    try {
      let res = await api.careList(profile.id);
      if (!res.seeded) {
        await api.careSeed(profile.id, seedRecords(profile));
        res = await api.careList(profile.id);
      }
      setItems(res.items);
      setLoadError(null);
    } catch (e) {
      setLoadError(e instanceof Error ? e.message : 'Could not reach the Koinonia server.');
    } finally {
      setLoading(false);
    }
  }, [profile]);

  useEffect(() => {
    setLoading(true);
    setSelectedId(null);
    refresh();
  }, [refresh]);

  useLiveEvents(profile.id, 'staff', (e) => {
    if (e.type === 'care' || e.type === 'crisis') refresh();
  });

  const counts = useMemo(
    () => ({
      pending: items.filter((i) => i.status === 'pending').length,
      crisis: items.filter((i) => i.status === 'crisis').length,
      approved: items.filter((i) => i.status === 'approved').length,
      removed: items.reduce((n, i) => n + i.piiTokens.reduce((m, t) => m + t.redactedCount, 0), 0),
    }),
    [items]
  );

  const filtered = items.filter((i) => {
    if (filter === 'PENDING') return i.status === 'pending';
    if (filter === 'CRISIS') return i.status === 'crisis' || i.status === 'crisis-handled';
    if (filter === 'APPROVED') return i.status === 'approved';
    return true;
  });
  // Crisis items always float to the top.
  const ordered = [...filtered].sort((a, b) => Number(b.status === 'crisis') - Number(a.status === 'crisis'));
  const active = items.find((i) => i.id === selectedId) ?? ordered[0] ?? null;

  const updateRecord = (record: CareRecord) => setItems((prev) => prev.map((i) => (i.id === record.id ? record : i)));

  // On phones (<= 900px) the queue and the request take turns: picking a request shows it in place of the queue,
  // and "Back to the queue" clears the selection. Desktop keeps both panes; this only scrolls on phones.
  const panesRef = useRef<HTMLDivElement>(null);
  const showPanesTop = () => {
    if (typeof window !== 'undefined' && window.matchMedia('(max-width: 900px)').matches) {
      requestAnimationFrame(() => panesRef.current?.scrollIntoView({ block: 'start' }));
    }
  };
  const pick = (id: string | null) => {
    setSelectedId(id);
    showPanesTop();
  };

  return (
    <div className="space-y-8">
      {/* Heading */}
      <header className="flex flex-col lg:flex-row lg:items-end lg:justify-between gap-5">
        <div className="max-w-3xl space-y-2">
          <p className="rubric flex items-center gap-2">
            <IconCare className="w-4 h-4" />
            Care Bridge
            <span className="text-ink-3">·</span>
            <span className={aiOn ? 'text-vine' : 'text-gold'}>{aiOn ? 'live AI (Claude)' : 'AI off, sample output'}</span>
          </p>
          <h2 className="font-serif text-3xl sm:text-4xl max-[601px]:text-[1.75rem] leading-[1.05] text-ink">Every newcomer can be heard</h2>
          <p className="text-ink-2 leading-relaxed">
            Requests arrive in the attendee’s language with personal details already removed on their phone. You read a summary and write the
            reply in your own language. Koinonia translates it, translates it back independently, and shows you any change in meaning before
            you approve. The attendee reads the reply with their private pickup code.
          </p>
        </div>
        <button
          onClick={() => setShowGlossary((v) => !v)}
          className={`btn btn-sm self-start lg:self-auto ${showGlossary ? 'btn-ink' : 'btn-outline'}`}
        >
          <IconGlossary className="w-4 h-4" />
          {showGlossary ? 'Hide glossary' : 'Tradition glossary'}
        </button>
      </header>

      {/* Figures */}
      <dl className="grid grid-cols-2 lg:grid-cols-4 border-y border-rule">
        <Figure
          label="Details removed on phones"
          value={counts.removed}
          note="None of them reached this server"
          className="border-r border-b lg:border-b-0"
        />
        <Figure label="Waiting for a pastor" value={counts.pending} note="Nothing is sent without approval" className="border-b lg:border-b-0 lg:border-r" />
        <Figure
          label="Crisis lane, open"
          value={counts.crisis}
          note="Never answered by AI"
          tone={counts.crisis ? 'text-alarm' : 'text-ink'}
          className="border-r"
        />
        <Figure label="Replies ready for pickup" value={counts.approved} note="Read with a private code" />
      </dl>

      {!aiOn && (
        <div className="border-l-2 border-gold bg-gold-wash px-4 py-3 text-sm text-ink-2 leading-relaxed [overflow-wrap:anywhere]">
          <strong className="font-semibold text-ink">AI is off.</strong> Triage, translations and the meaning check show fixed sample output. To
          switch on live translation and drift checking, put a key in <code className="font-mono text-[0.85em]">ZEROG_API_KEY</code> or{' '}
          <code className="font-mono text-[0.85em]">ANTHROPIC_API_KEY</code> in <code className="font-mono text-[0.85em]">.env.local</code> and
          restart <code className="font-mono text-[0.85em]">npm run dev</code>. The privacy filter, crisis lane, pickup codes and approval step work
          either way.
        </div>
      )}

      {showGlossary && <GlossaryPanel profile={profile} aiOn={aiOn} canApprove={can(role, 'glossary:approve')} onToast={onToast} />}

      {counts.crisis > 0 && (
        <div className="border-2 border-alarm bg-alarm-wash px-5 py-4 max-[601px]:px-4 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div className="flex items-start gap-3">
            <IconLifebuoy className="w-6 h-6 text-alarm shrink-0 mt-0.5" />
            <div>
              <p className="font-serif text-lg leading-tight text-ink">
                {counts.crisis} urgent {counts.crisis === 1 ? 'request needs' : 'requests need'} a person now
              </p>
              <p className="text-sm text-ink-2 mt-0.5">Crisis signals were found. No AI reply was drafted. The attendee was shown local crisis lines.</p>
            </div>
          </div>
          <button
            onClick={() => {
              setFilter('CRISIS');
              const first = items.find((i) => i.status === 'crisis');
              if (first) pick(first.id);
            }}
            className="btn btn-sm bg-alarm text-white hover:bg-rubric-deep self-start sm:self-auto max-[601px]:w-full max-[601px]:min-h-[44px]!"
          >
            Open the crisis lane
          </button>
        </div>
      )}

      <TestRequestForm profile={profile} onCreated={refresh} onToast={onToast} />

      {loadError && (
        <div className="border-l-2 border-rubric bg-rubric-wash px-4 py-3 text-sm text-rubric-deep [overflow-wrap:anywhere]">
          {loadError} Start everything with <code className="font-mono text-[0.85em]">npm run dev</code> (it runs the website and the local server
          together).
        </div>
      )}

      <div ref={panesRef} className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start max-[901px]:scroll-mt-20">
        {/* Queue (on phones, hidden while a request is open) */}
        <section className={`lg:col-span-5 leaf ${selectedId ? 'max-[901px]:hidden' : ''}`}>
          <div className="px-5 pt-5 pb-3 flex items-baseline justify-between gap-2">
            <div>
              <p className="rubric">The queue</p>
              <h3 className="font-serif text-2xl leading-tight text-ink">
                Requests <span className="text-ink-3 num-old">{filtered.length}</span>
              </h3>
            </div>
          </div>
          <div role="tablist" className="px-3 flex flex-wrap border-b border-rule text-sm">
            {(
              [
                ['ALL', 'All', items.length],
                ['PENDING', 'Waiting', counts.pending],
                ['CRISIS', 'Crisis', counts.crisis],
                ['APPROVED', 'Sent', counts.approved],
              ] as const
            ).map(([key, label, n]) => {
              const on = filter === key;
              const alarm = key === 'CRISIS' && n > 0;
              return (
                <button
                  key={key}
                  role="tab"
                  aria-selected={on}
                  onClick={() => setFilter(key)}
                  className={`px-3 py-2 -mb-px border-b-2 cursor-pointer transition-colors max-[901px]:min-h-[40px] ${
                    on
                      ? 'border-rubric bg-parchment text-ink font-semibold'
                      : `border-transparent hover:text-ink ${alarm ? 'text-alarm' : 'text-ink-2'}`
                  }`}
                >
                  {label} <span className={`num-old ${alarm ? 'text-alarm' : 'text-ink-3'}`}>{n}</span>
                </button>
              );
            })}
          </div>

          {loading ? (
            <div className="text-sm text-ink-3 flex items-center gap-2 py-10 justify-center">
              <Loader2 className="w-4 h-4 animate-spin" /> Loading the queue…
            </div>
          ) : ordered.length === 0 ? (
            <div className="text-sm text-ink-3 py-10 text-center">Nothing here yet.</div>
          ) : (
            <ul className="divide-y divide-rule max-h-[760px] overflow-y-auto max-[901px]:max-h-none max-[901px]:overflow-visible">
              {ordered.map((item) => {
                const isSelected = item.id === active?.id;
                const meta = langMeta(item.language);
                const isCrisis = item.status === 'crisis';
                return (
                  <li key={item.id}>
                    <button
                      onClick={() => pick(item.id)}
                      aria-current={isSelected}
                      className={`relative w-full text-left px-5 py-4 space-y-1.5 cursor-pointer transition-colors ${
                        isSelected ? 'bg-parchment' : isCrisis ? 'bg-alarm-wash hover:bg-parchment' : 'hover:bg-parchment/60'
                      }`}
                    >
                      <span
                        aria-hidden
                        className={`absolute left-0 inset-y-0 w-[2px] ${isSelected ? 'bg-rubric' : isCrisis ? 'bg-alarm' : 'bg-transparent'}`}
                      />
                      <div className="flex items-center justify-between gap-2">
                        <StatusTag status={item.status} />
                        <span className="text-xs text-ink-3">{timeAgo(item.createdAt)}</span>
                      </div>
                      <div className="font-serif text-[1.05rem] leading-snug text-ink">
                        {isCrisis || item.status === 'crisis-handled' ? 'Urgent: needs a person' : item.category}
                      </div>
                      <div className="flex items-center gap-2 text-sm text-ink-3">
                        <LangMark code={item.language} size="sm" />
                        <span>
                          {meta.name} · {item.source} · {item.urgency}
                        </span>
                      </div>
                      <p dir={meta.rtl ? 'rtl' : 'ltr'} className="text-[0.8rem] leading-relaxed line-clamp-2 font-mono text-ink-2 [overflow-wrap:anywhere]">
                        <Redacted text={item.redactedText} />
                      </p>
                    </button>
                  </li>
                );
              })}
            </ul>
          )}
        </section>

        {/* Detail (on phones, shown only once a request is picked) */}
        <div className={`lg:col-span-7 min-w-0 ${selectedId ? '' : 'max-[901px]:hidden'}`}>
          <button
            type="button"
            onClick={() => pick(null)}
            className="btn btn-outline mb-3 w-full hidden max-[901px]:inline-flex"
          >
            <ChevronLeft className="w-4 h-4" /> Back to the queue
          </button>
          {active ? (
            active.status === 'crisis' || active.status === 'crisis-handled' ? (
              <CrisisDetail key={active.id} record={active} profile={profile} onUpdated={updateRecord} onToast={onToast} />
            ) : (
              <RequestDetail key={active.id} record={active} profile={profile} aiOn={aiOn} mayApprove={can(role, 'care:approve')} onUpdated={updateRecord} onToast={onToast} />
            )
          ) : (
            !loading && <div className="leaf p-10 text-center text-ink-3">Select a request.</div>
          )}
        </div>
      </div>
    </div>
  );
};

function Figure({
  label,
  value,
  note,
  tone = 'text-ink',
  className = '',
}: {
  label: string;
  value: number;
  note: string;
  tone?: string;
  className?: string;
}) {
  return (
    <div className={`px-5 py-4 max-[601px]:px-3 max-[601px]:py-3 min-w-0 border-rule ${className}`}>
      <dt className="rubric">{label}</dt>
      <dd className={`font-serif text-5xl max-[601px]:text-4xl leading-none num-old mt-2 ${tone}`}>{value}</dd>
      <dd className="text-sm text-ink-3 mt-2">{note}</dd>
    </div>
  );
}

function StatusTag({ status }: { status: CareRecord['status'] }) {
  switch (status) {
    case 'pending':
      return <span className="tag tag-gold">Needs your sign-off</span>;
    case 'approved':
      return (
        <span className="tag tag-vine">
          <IconSeal className="w-3.5 h-3.5" /> Ready for pickup
        </span>
      );
    case 'crisis':
      return (
        <span className="tag tag-alarm">
          <IconLifebuoy className="w-3.5 h-3.5" /> Crisis lane
        </span>
      );
    case 'crisis-handled':
      return (
        <span className="tag">
          <IconLifebuoy className="w-3.5 h-3.5" /> Handled by a person
        </span>
      );
  }
}

/** A numbered part of the document, like a line in an order of service. */
function Part({ n, children }: { n: string; children: React.ReactNode }) {
  return (
    <section className="grid grid-cols-[1.75rem_1fr] gap-x-3 max-[601px]:grid-cols-[1.25rem_1fr] max-[601px]:gap-x-2">
      <span aria-hidden className="font-serif text-lg leading-none text-rubric pt-[0.05rem]">
        {n}
      </span>
      <div className="space-y-3 min-w-0">{children}</div>
    </section>
  );
}

// ---------------------------------------------------------------- normal request

function RequestDetail({
  record,
  profile,
  aiOn,
  mayApprove,
  onUpdated,
  onToast,
}: {
  record: CareRecord;
  profile: ChurchTraditionProfile;
  aiOn: boolean;
  mayApprove: boolean;
  onUpdated: (r: CareRecord) => void;
  onToast: (m: string) => void;
}) {
  const meta = langMeta(record.language);
  const [pastorLang, setPastorLang] = useState<'en' | 'it'>(
    record.check?.pastorLang === 'it' ? 'it' : 'en'
  );
  const [text, setText] = useState(record.check?.pastorText ?? record.draftPastorText);
  const [busy, setBusy] = useState<'check' | 'approve' | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [ack, setAck] = useState(false);
  const [showOriginal, setShowOriginal] = useState(false);

  const group = profile.smallGroups.find((g) => g.id === record.groupId);
  const verse = scriptureFor(record.verseId, record.tradition);
  const check = record.check;
  const stale = Boolean(check && check.pastorText !== text);
  const original = originalForCode(record.pickupCode) ?? sampleOriginal(profile, record.redactedText);
  const approved = record.status === 'approved';
  const canApprove = Boolean(check) && !stale && !approved && (check?.verdict !== 'major_drift' || ack);

  const runCheck = async () => {
    setBusy('check');
    setError(null);
    setAck(false);
    try {
      const { record: updated } = await api.careCheck(record.id, {
        pastorText: text,
        pastorLanguage: pastorLang,
        groupName: group?.name ?? 'our welcome group',
      });
      onUpdated(updated);
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Check failed');
    } finally {
      setBusy(null);
    }
  };

  const approve = async () => {
    setBusy('approve');
    setError(null);
    try {
      const { record: updated } = await api.careApprove(record.id, { pastorText: text, approvedBy: profile.leaderName, acknowledgedDrift: ack });
      onUpdated(updated);
      onToast(`Approved. The attendee can read the reply with code ${updated.pickupCode}.`);
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Approval failed');
    } finally {
      setBusy(null);
    }
  };

  const verdict = check ? VERDICT_STYLE[check.verdict] : null;

  return (
    <article className="leaf p-6 sm:p-8 space-y-8 max-[601px]:p-4 max-[601px]:space-y-6">
      {/* Heading */}
      <header className="flex flex-wrap items-start justify-between gap-4 pb-5 border-b border-rule">
        <div className="flex items-start gap-3.5">
          <LangMark code={record.language} size="lg" />
          <div>
            <p className="rubric">{record.category}</p>
            <h3 className="font-serif text-2xl max-[601px]:text-xl leading-tight text-ink">
              Written in {meta.name} <span className="text-ink-3">({meta.nativeName})</span>
            </h3>
            <p className="text-sm text-ink-3 mt-1 flex flex-wrap items-center gap-x-2 gap-y-1">
              <span>
                {timeAgo(record.createdAt)} · {record.urgency}
              </span>
              {record.mode === 'sample' && <span className="tag tag-gold">Sample data</span>}
            </p>
          </div>
        </div>
        <span className="inline-flex items-center gap-2 text-sm text-ink-2">
          <IconKey className="w-4 h-4 text-rubric" />
          Pickup code <span className="font-mono text-ink">{record.pickupCode}</span>
        </span>
      </header>

      {/* I. The request */}
      <Part n="I">
        <div className="flex flex-wrap items-center justify-between gap-2">
          <p className="rubric flex items-center gap-1.5">
            <IconScrub className="w-4 h-4" /> What reached the care team
          </p>
          <button onClick={() => setShowOriginal((v) => !v)} className="btn btn-ghost btn-sm">
            {showOriginal ? <EyeOff className="w-3.5 h-3.5" /> : <Eye className="w-3.5 h-3.5" />}
            {showOriginal ? 'Hide original' : 'Original wording'}
          </button>
        </div>
        <p className="text-sm text-ink-2">Personal details were removed on the attendee’s phone, before anything was sent.</p>
        <div className="flex flex-wrap gap-1.5">
          {record.piiTokens.length === 0 ? (
            <span className="tag tag-vine">No personal details found</span>
          ) : (
            record.piiTokens.map((t, i) => {
              const [one, many] = PII_WORDS[t.type] ?? [t.type.toLowerCase(), t.type.toLowerCase()];
              return (
                <span key={i} className="tag">
                  <span className="num-old">{t.redactedCount}</span> {t.redactedCount === 1 ? one : many} removed
                </span>
              );
            })
          )}
        </div>
        <div className="flex items-start gap-3">
          <span className="vr-mark pt-3">℣</span>
          <div dir={meta.rtl ? 'rtl' : 'ltr'} className="inset flex-1 min-w-0 px-4 py-3.5 max-[601px]:px-3 font-mono text-[0.85rem] leading-relaxed text-ink [overflow-wrap:anywhere]">
            <Redacted text={record.redactedText} />
          </div>
        </div>
        {showOriginal && (
          <div className="ml-7 max-[601px]:ml-0 border-l-2 border-gold bg-gold-wash px-4 py-3 text-sm text-ink space-y-1.5 [overflow-wrap:anywhere]">
            {original ? (
              <>
                <p className="rubric-ink">
                  On this device only · {originalForCode(record.pickupCode) ? 'written in this browser' : 'bundled sample data'}. Never sent to the
                  server or the AI.
                </p>
                <p dir={meta.rtl ? 'rtl' : 'ltr'} className="leading-relaxed">
                  {original}
                </p>
              </>
            ) : (
              <p>The original wording stays on the attendee’s phone. It never reached this server, so it cannot be shown here.</p>
            )}
          </div>
        )}
      </Part>

      {/* II. Summary, group, passage */}
      <Part n="II">
        <div className="grid grid-cols-1 min-[901px]:grid-cols-2 gap-y-5 min-[901px]:divide-x divide-rule">
          <div className="space-y-2 min-w-0 min-[901px]:pr-5">
            <p className="rubric-ink">{record.mode === 'live' ? 'Summary for you · written by AI' : 'Summary for you · sample'}</p>
            <p className="text-[0.95rem] leading-relaxed text-ink">{record.summaryForLeader}</p>
            {group && (
              <p className="text-sm text-ink-2 flex items-start gap-2 pt-1">
                <IconTable className="w-4 h-4 shrink-0 mt-0.5 text-rubric" />
                <span>
                  <span className="font-semibold text-ink">Suggested group:</span> {group.name}, {group.schedule}
                </span>
              </p>
            )}
          </div>
          <div className="space-y-2 min-w-0 min-[901px]:pl-5">
            <p className="rubric">Passage attached to the reply</p>
            {verse ? (
              <>
                <p className="font-serif font-semibold text-ink">{verse.reference}</p>
                <p dir={meta.rtl ? 'rtl' : 'ltr'} className="font-serif italic text-ink-2 leading-relaxed">
                  {verse.texts[record.language as SupportedLanguageCode]}
                </p>
                <p className="text-xs text-ink-3 leading-relaxed">
                  Picked by id from the church’s stored passages; the AI never writes Bible text. These are demo passages: use a licensed Bible
                  source before real use.
                </p>
              </>
            ) : (
              <p className="text-sm text-ink-3">No passage attached.</p>
            )}
          </div>
        </div>
      </Part>

      {/* III. The reply */}
      <Part n="III">
        <div className="flex flex-wrap items-center justify-between gap-2">
          <p className="rubric">Your reply, in your language</p>
          <label className="text-sm text-ink-2 flex items-center gap-2">
            I write in
            <select
              value={pastorLang}
              disabled={approved}
              onChange={(e) => setPastorLang(e.target.value as 'en' | 'it')}
              className="field w-auto py-1 px-2 text-sm"
            >
              {PASTOR_LANGUAGES.map((l) => (
                <option key={l.code} value={l.code}>
                  {l.label}
                </option>
              ))}
            </select>
          </label>
        </div>

        <div className="flex items-start gap-3">
          <span className="vr-mark pt-3">℟</span>
          <div className="flex-1 min-w-0 space-y-1.5">
            <textarea
              rows={5}
              value={text}
              disabled={approved}
              onChange={(e) => setText(e.target.value)}
              className="field font-serif text-[1.05rem] leading-relaxed disabled:opacity-70"
            />
            <p className="text-xs text-ink-3">
              {record.mode === 'live' ? 'Starting draft written by AI from the request. ' : 'Sample starting draft. '}Edit it freely: it is your
              words that get translated.
            </p>
          </div>
        </div>

        {!approved && (
          <div className="pl-7 max-[901px]:pl-0">
            <button
              onClick={runCheck}
              disabled={busy !== null || !text.trim()}
              className="btn btn-ink max-[901px]:w-full max-[901px]:whitespace-normal max-[901px]:text-center max-[901px]:min-h-[44px]!"
            >
              {busy === 'check' ? <Loader2 className="w-4 h-4 animate-spin" /> : <IconRoundTrip className="w-4 h-4" />}
              {record.language === pastorLang
                ? check
                  ? 'Check again'
                  : 'Check reply (same language, no translation needed)'
                : check
                ? 'Re-translate and check meaning'
                : `Translate into ${meta.name} and check meaning`}
            </button>
          </div>
        )}
      </Part>

      {/* IV. The meaning check */}
      {check && verdict && (
        <Part n="IV">
          <div className={`space-y-5 ${stale ? 'opacity-50' : ''}`}>
            {stale && (
              <p className="border-l-2 border-gold bg-gold-wash px-3 py-2 text-sm font-semibold text-ink">
                You changed the reply after this check. Run the check again before approving.
              </p>
            )}

            <div className="flex flex-wrap items-center gap-2">
              <p className="rubric flex items-center gap-1.5 mr-1">
                <IconRoundTrip className="w-4 h-4" /> The meaning check
              </p>
              <span className={`tag ${verdict.cls}`}>{verdict.label}</span>
              {check.glossaryViolations.length === 0 ? (
                <span className="tag tag-vine">
                  <IconGlossary className="w-3.5 h-3.5" /> Tradition glossary followed
                </span>
              ) : (
                <span className="tag tag-rubric">
                  <IconGlossary className="w-3.5 h-3.5" />
                  {check.glossaryViolations.length} glossary {check.glossaryViolations.length === 1 ? 'problem' : 'problems'}
                </span>
              )}
            </div>

            {/* What the attendee will read */}
            <div className="space-y-2">
              <p className="rubric-ink flex items-center gap-1.5">
                <IconBridge className="w-4 h-4" />
                What {meta.name} readers will see{check.mode === 'sample' && ' (sample translation)'}
              </p>
              <div className="inset px-4 py-3.5 max-[601px]:px-3 flex items-start gap-3">
                <LangMark code={record.language} size="sm" className="mt-1" />
                <p dir={meta.rtl ? 'rtl' : 'ltr'} className="flex-1 min-w-0 [overflow-wrap:anywhere] font-serif text-[1.05rem] leading-relaxed text-ink">
                  {check.nativeText}
                </p>
              </div>
            </div>

            {/* Original against back-translation */}
            <div className="grid grid-cols-1 min-[901px]:grid-cols-2 border-y border-rule min-[901px]:divide-x divide-rule">
              <div className="py-4 min-w-0 min-[901px]:pr-5 space-y-2">
                <p className="rubric flex items-center gap-2">
                  <LangMark code={check.pastorLang} size="sm" /> What you wrote
                </p>
                <p className="font-serif leading-relaxed text-ink">
                  <MarkPhrases text={check.pastorText} marks={check.issues.map((i) => ({ phrase: i.originalPhrase, severity: i.severity }))} />
                </p>
              </div>
              <div className="py-4 min-w-0 min-[901px]:pl-5 space-y-2 border-t border-rule min-[901px]:border-t-0">
                <p className="rubric flex items-center gap-2">
                  <IconRoundTrip className="w-4 h-4" /> Translated back, independently
                </p>
                {check.backTranslation ? (
                  <p className="font-serif leading-relaxed text-ink-2">
                    <MarkPhrases
                      text={check.backTranslation}
                      marks={check.issues.map((i) => ({ phrase: i.backTranslatedPhrase, severity: i.severity }))}
                    />
                  </p>
                ) : (
                  <p className="text-sm text-ink-3 leading-relaxed">
                    {check.mode === 'sample'
                      ? 'Needs live AI. With a key, a second AI call translates the reply back without seeing your original, and a third compares the two.'
                      : 'Same language as yours, so no translation was needed.'}
                  </p>
                )}
              </div>
            </div>

            {check.issues.length > 0 && (
              <div className="space-y-2">
                <p className="rubric">Where the meaning shifted</p>
                <ol className="divide-y divide-rule border-y border-rule">
                  {check.issues.map((issue, i) => (
                    <li key={i} className="py-3 grid grid-cols-[auto_1fr] gap-x-3 gap-y-1 text-sm">
                      <span className={`tag self-start ${issue.severity === 'major' ? 'tag-rubric' : 'tag-gold'}`}>
                        {issue.severity === 'major' ? 'Major' : 'Minor'}
                      </span>
                      <div className="space-y-1 min-w-0 [overflow-wrap:anywhere]">
                        <p>
                          <span className="text-ink-3">You wrote</span>{' '}
                          <mark className="bg-rubric-wash text-ink px-0.5 rounded-[1px] underline decoration-rubric decoration-1 underline-offset-[3px]">
                            {issue.originalPhrase}
                          </mark>
                        </p>
                        <p>
                          <span className="text-ink-3">Came back as</span>{' '}
                          <mark className="bg-rubric-wash text-ink px-0.5 rounded-[1px] underline decoration-rubric decoration-1 underline-offset-[3px]">
                            {issue.backTranslatedPhrase}
                          </mark>
                        </p>
                        <p className="text-ink-2">{issue.explanation}</p>
                      </div>
                    </li>
                  ))}
                </ol>
              </div>
            )}

            {check.glossaryViolations.length > 0 && (
              <div className="border-l-2 border-rubric pl-4 space-y-1.5">
                <p className="rubric flex items-center gap-1.5">
                  <IconGlossary className="w-4 h-4" /> Tradition glossary
                </p>
                {check.glossaryViolations.map((v, i) => (
                  <p key={i} className="text-sm text-ink-2">
                    <span className="font-semibold text-ink">{v.concept}:</span> found “{v.found}”; this church says “{v.preferred}”.
                  </p>
                ))}
              </div>
            )}

            {check.verdict === 'major_drift' && !approved && (
              <label className="flex items-start gap-2.5 text-sm text-ink border border-rubric bg-rubric-wash px-4 py-3 cursor-pointer">
                <input type="checkbox" checked={ack} onChange={(e) => setAck(e.target.checked)} className="mt-1 accent-rubric max-[901px]:w-5 max-[901px]:h-5 shrink-0" />
                <span>I have read the flagged changes and still want to send this translation.</span>
              </label>
            )}
          </div>
        </Part>
      )}

      {error && <p className="border-l-2 border-rubric bg-rubric-wash px-3 py-2 text-sm text-rubric-deep">{error}</p>}

      {/* Sign-off */}
      <footer className="double-rule pt-5 flex flex-col min-[901px]:flex-row min-[901px]:items-center justify-between gap-4">
        <p className="text-sm text-ink-2 max-w-md">
          Nothing reaches the attendee until a pastor approves. The name you signed in with is recorded as the approver.
        </p>
        {approved ? (
          <span className="tag tag-vine !text-[0.85rem] !py-1.5 !px-3 shrink-0 max-[601px]:whitespace-normal">
            <IconSeal className="w-5 h-5" /> Approved · pickup code <span className="font-mono whitespace-nowrap normal-case">{record.pickupCode}</span>
          </span>
        ) : !mayApprove ? (
          <span className="inline-flex items-center gap-2 text-sm text-ink-2 border border-rule-strong px-3 py-2">
            <IconCrook className="w-4 h-4 text-rubric" />
            {check && !stale ? 'Checked. A pastor approves it next.' : 'Only a pastor can approve. Run the check so it is ready.'}
          </span>
        ) : (
          <button
            onClick={approve}
            disabled={!canApprove || busy !== null}
            title={!check ? 'Run the translation and meaning check first' : stale ? 'Run the check again' : ''}
            className="btn btn-vine max-[901px]:min-h-[44px]! max-[901px]:whitespace-normal max-[901px]:text-center"
          >
            {busy === 'approve' ? <Loader2 className="w-4 h-4 animate-spin" /> : <IconSeal className="w-4 h-4" />}
            Approve and release to pickup code
          </button>
        )}
      </footer>
    </article>
  );
}

// ---------------------------------------------------------------- crisis lane

function CrisisDetail({
  record,
  profile,
  onUpdated,
  onToast,
}: {
  record: CareRecord;
  profile: ChurchTraditionProfile;
  onUpdated: (r: CareRecord) => void;
  onToast: (m: string) => void;
}) {
  const meta = langMeta(record.language);
  const [note, setNote] = useState('');
  const [busy, setBusy] = useState(false);
  const lines = crisisLinesFor(profile.id);
  const handled = record.status === 'crisis-handled';
  const original = originalForCode(record.pickupCode);

  const markHandled = async () => {
    setBusy(true);
    try {
      const { record: updated } = await api.careHandled(record.id, note.trim());
      onUpdated(updated);
      onToast('Marked as handled by a person.');
    } finally {
      setBusy(false);
    }
  };

  return (
    <article className={`border-2 bg-vellum ${handled ? 'border-rule-strong' : 'border-alarm'}`}>
      <div className={`px-6 py-3 max-[601px]:px-4 flex items-center gap-2.5 ${handled ? 'bg-parchment text-ink' : 'bg-alarm text-white'}`}>
        <IconLifebuoy className="w-5 h-5 shrink-0" />
        <p className="font-serif text-lg leading-tight">
          {handled ? 'Crisis lane: handled by a person' : 'Crisis lane: a person must respond'}
        </p>
      </div>

      <div className="p-6 sm:p-8 max-[601px]:p-4 space-y-6">
        <header className="flex flex-wrap items-start justify-between gap-4 pb-5 border-b border-rule">
          <div className="flex items-start gap-3.5">
            <LangMark code={record.language} size="lg" />
            <div>
              <h3 className="font-serif text-2xl max-[601px]:text-xl leading-tight text-ink">Written in {meta.name}</h3>
              <p className="text-sm text-ink-3 mt-0.5">{timeAgo(record.createdAt)}</p>
              {record.crisisReason && <p className="text-sm text-alarm mt-1.5">{record.crisisReason}</p>}
            </div>
          </div>
          <span className="inline-flex items-center gap-2 text-sm text-ink-2">
            <IconKey className="w-4 h-4 text-rubric" />
            Code <span className="font-mono text-ink">{record.pickupCode}</span>
          </span>
        </header>

        <div className="space-y-3">
          <div className="flex items-start gap-3">
            <span className="vr-mark pt-3">℣</span>
            <div dir={meta.rtl ? 'rtl' : 'ltr'} className="inset flex-1 min-w-0 px-4 py-3.5 max-[601px]:px-3 font-mono text-[0.85rem] leading-relaxed text-ink [overflow-wrap:anywhere]">
              <Redacted text={record.redactedText} />
            </div>
          </div>
          {original && (
            <div className="ml-7 max-[601px]:ml-0 border-l-2 border-gold bg-gold-wash px-4 py-3 text-sm text-ink [overflow-wrap:anywhere]">
              <span className="rubric-ink">Original, this device only · </span>
              {original}
            </div>
          )}
        </div>

        <div className="grid grid-cols-1 min-[901px]:grid-cols-2 gap-y-5 min-[901px]:divide-x divide-rule">
          <div className="space-y-2 min-w-0 min-[901px]:pr-5">
            <p className="rubric">What happened automatically</p>
            <ul className="space-y-2 text-sm text-ink-2">
              {[
                'The request skipped the queue. The AI did not draft or send anything.',
                `The attendee’s phone is showing local crisis lines in ${meta.name}, and a “show this to an usher” screen.`,
                'Everyone on this dashboard was alerted at the same moment.',
              ].map((t) => (
                <li key={t} className="flex items-start gap-2.5">
                  <VesicaBullet className="w-2 h-3 shrink-0 mt-1.5 text-rubric" />
                  <span>{t}</span>
                </li>
              ))}
            </ul>
          </div>
          <div className="space-y-2 min-w-0 min-[901px]:pl-5">
            <p className="rubric">Lines the attendee sees</p>
            <ul className="divide-y divide-rule border-y border-rule">
              {lines.map((l) => (
                <li key={l.number} className="flex items-center justify-between gap-3 py-2 text-sm">
                  <span className="text-ink min-w-0">{l.label}</span>
                  <span className="font-mono font-semibold text-alarm shrink-0 whitespace-nowrap" dir="ltr">
                    {l.number}
                  </span>
                </li>
              ))}
            </ul>
          </div>
        </div>

        <div className="space-y-1.5">
          <p className="rubric flex items-center gap-1.5">
            <Phone className="w-3.5 h-3.5" /> Callback number
          </p>
          {record.callbackNumber ? (
            <p className="text-sm text-ink-2">
              The attendee chose to leave a number for a person to call:{' '}
              <span className="font-mono text-xl font-semibold text-ink" dir="ltr">
                {record.callbackNumber}
              </span>
              <span className="block text-ink-3 mt-1">Shared by them for this purpose only, and never sent to AI.</span>
            </p>
          ) : (
            <p className="text-sm text-ink-3 leading-relaxed">
              None left. The attendee can add one from their phone if they want a call. Otherwise, find them in person now: ushers can look for
              someone showing the red Koinonia screen.
            </p>
          )}
        </div>

        {handled ? (
          <p className="border-l-2 border-vine bg-vine-wash px-4 py-3 text-sm text-ink flex items-start gap-2">
            <IconSeal className="w-4 h-4 shrink-0 mt-0.5 text-vine" />
            <span>
              <span className="font-semibold">Handled by a person:</span> {record.handledNote}
            </span>
          </p>
        ) : (
          <div className="double-rule pt-5 space-y-3">
            <textarea
              rows={2}
              value={note}
              onChange={(e) => setNote(e.target.value)}
              placeholder="Short note for the team (no personal details), e.g. 'Sr. Chiara met them after Mass; follow-up Tuesday.'"
              className="field text-sm"
            />
            <button onClick={markHandled} disabled={busy || !note.trim()} title={!note.trim() ? 'Write what was done first' : undefined} className="btn btn-alarm max-[901px]:w-full max-[901px]:min-h-[44px]!">
              {busy && <Loader2 className="w-4 h-4 animate-spin" />}
              Mark as handled by a person
            </button>
          </div>
        )}
      </div>
    </article>
  );
}

// ---------------------------------------------------------------- test form

function TestRequestForm({ profile, onCreated, onToast }: { profile: ChurchTraditionProfile; onCreated: () => void; onToast: (m: string) => void }) {
  const [open, setOpen] = useState(false);
  const [lang, setLang] = useState<SupportedLanguageCode>('ar');
  const [text, setText] = useState(
    'أنا طالب جديد في الجامعة، رقمي +39 351 204 8876. أشعر بالوحدة الشديدة بعيدًا عن عائلتي وأحتاج إلى الصلاة. هل توجد مجموعة يمكنني الانضمام إليها؟'
  );
  const [busy, setBusy] = useState(false);

  const submit = async (e: React.FormEvent) => {
    e.preventDefault();
    setBusy(true);
    try {
      const res = await submitCareRequest({ profile, language: lang, rawText: text, source: 'Test request', pastorLanguage: 'en' });
      onToast(res.crisis ? 'Crisis signals found. Sent to the crisis lane.' : `Test request added (code ${res.pickup.code}).`);
      onCreated();
      setOpen(false);
    } catch (err) {
      onToast(err instanceof Error ? err.message : 'Could not add the request');
    } finally {
      setBusy(false);
    }
  };

  if (!open) {
    return (
      <button onClick={() => setOpen(true)} className="btn btn-ghost btn-sm text-rubric -ml-3">
        <Plus className="w-4 h-4" /> Add a test request in any language
      </button>
    );
  }
  return (
    <form onSubmit={submit} className="leaf p-5 sm:p-6 max-[601px]:p-4 space-y-4">
      <div className="flex items-start justify-between gap-3">
        <div className="space-y-1">
          <p className="rubric">For trying it out</p>
          <h3 className="font-serif text-xl leading-tight text-ink">Add a test request</h3>
        </div>
        <button type="button" onClick={() => setOpen(false)} className="btn btn-ghost btn-sm">
          <X className="w-4 h-4" /> Close
        </button>
      </div>
      <p className="text-sm text-ink-2 leading-relaxed">
        It takes the same path as a request from the pews: personal details removed in this browser, the crisis screen, then the queue. Try
        writing a phone number, or “I want to die”, to see the filter and the crisis lane work.
      </p>
      <div className="grid grid-cols-1 min-[901px]:grid-cols-4 gap-3">
        <div className="flex items-start gap-2 min-w-0">
          <LangMark code={lang} className="mt-1" />
          <select value={lang} onChange={(e) => setLang(e.target.value as SupportedLanguageCode)} className="field text-sm min-w-0">
            {SUPPORTED_LANGUAGES.map((l) => (
              <option key={l.code} value={l.code}>
                {l.name} · {l.nativeName}
              </option>
            ))}
          </select>
        </div>
        <textarea
          rows={2}
          value={text}
          onChange={(e) => setText(e.target.value)}
          dir={langMeta(lang).rtl ? 'rtl' : 'ltr'}
          className="min-[901px]:col-span-3 field text-sm"
        />
      </div>
      <div className="flex justify-end">
        <button type="submit" disabled={busy || !text.trim()} className="btn btn-ink max-[601px]:w-full max-[601px]:min-h-[44px]!">
          {busy ? <Loader2 className="w-4 h-4 animate-spin" /> : <IconScrub className="w-4 h-4" />}
          Send through the privacy filter
        </button>
      </div>
    </form>
  );
}
