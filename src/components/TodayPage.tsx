import React, { useEffect, useState } from 'react';
import type { ChurchTraditionProfile } from '../types/koinonia';
import type { InsightsResponse, PublishedSermon } from '../shared/types';
import { LANG_NAMES } from '../shared/languages';
import { api } from '../lib/api';
import { can, ROLE_META, type StaffRole } from '../shared/staff';
import type { IconProps } from './brand/Icons';
import { IconBell, IconCare, IconInsights, IconLectern, IconLifebuoy, IconSeal } from './brand/Icons';
import { LangMark } from './brand/LangMark';

interface Props {
  profile: ChurchTraditionProfile;
  staffName: string;
  role: StaffRole;
  roleIcon: (p: IconProps) => React.ReactElement;
  counts: { waiting: number; crisis: number } | null;
  cueIndex: number;
  onOpen: (tab: string) => void;
}

function greeting(): string {
  const h = new Date().getHours();
  return h < 12 ? 'Good morning' : h < 18 ? 'Good afternoon' : 'Good evening';
}

function firstName(name: string): string {
  // "Fr. Andrea Ricci" -> "Fr. Andrea"; "Grace Adeyemi" -> "Grace"
  const parts = name.split(' ');
  return /^(Fr|Sr|Rev|Br|Dr|Pastor)\.?$/i.test(parts[0]) && parts[1] ? `${parts[0]} ${parts[1]}` : parts[0];
}

/**
 * "Today": the first screen staff see. Modelled on a transit app's home screen:
 * a greeting, one card asking for the thing that needs you, a row for anything
 * urgent, then cards for what is happening at church.
 */
export function TodayPage({ profile, staffName, role, roleIcon: RoleIcon, counts, cueIndex, onOpen }: Props) {
  const [sermon, setSermon] = useState<PublishedSermon | null>(null);
  const [insights, setInsights] = useState<InsightsResponse | null>(null);
  const [cardHidden, setCardHidden] = useState(() => sessionStorage.getItem('koinonia.today.card') === 'hidden');

  useEffect(() => {
    api.sermon(profile.id).then(setSermon).catch(() => setSermon(null));
    if (can(role, 'insights:read')) api.insights(profile.id).then(setInsights).catch(() => setInsights(null));
  }, [profile.id, role]);

  const mayCare = can(role, 'care:read');
  const waiting = counts?.waiting ?? 0;
  const crisis = counts?.crisis ?? 0;
  const step = profile.liturgicalSteps[Math.min(cueIndex, profile.liturgicalSteps.length - 1)];
  const sermonTitle = sermon?.translations.find((t) => t.lang === 'en')?.title ?? profile.currentMessageTitle.en;

  const growing = insights?.stats
    .filter((s) => s.last30 >= 4 && s.prev30 > 0)
    .map((s) => ({ ...s, growth: Math.round(((s.last30 - s.prev30) / s.prev30) * 100) }))
    .sort((a, b) => b.growth - a.growth)[0];

  const today = new Date().toLocaleDateString('en-GB', { weekday: 'long', day: 'numeric', month: 'long' });

  return (
    <div className="space-y-6 max-w-5xl">
      {/* Greeting */}
      <header className="flex items-start justify-between gap-4 pt-1">
        <div>
          <p className="rubric-ink">{today}</p>
          <h1 className="font-serif text-[2.4rem] sm:text-[2.9rem] leading-[1.05] mt-1">{greeting()}!</h1>
          <p className="text-ink-2 text-[1.05rem] mt-1">
            {firstName(staffName)} · {ROLE_META[role].label}, {profile.churchName}
          </p>
        </div>
        <span className="w-14 h-14 shrink-0 rounded-full border-2 border-rule-strong bg-vellum flex items-center justify-center text-rubric" aria-hidden>
          <RoleIcon className="w-7 h-7" />
        </span>
      </header>

      {/* The one thing that needs you (HSL-style card) */}
      {mayCare && waiting > 0 && !cardHidden && (
        <section className="rounded-[14px] border border-[#e6c9bd] bg-rubric-wash/70 p-5 space-y-3">
          <div>
            <h2 className="font-sans font-semibold text-[1.08rem] tracking-normal">
              {waiting} {waiting === 1 ? 'request is' : 'requests are'} waiting for a pastor
            </h2>
            <p className="text-ink-2 mt-0.5">
              {can(role, 'care:approve')
                ? 'Read the summary, check the translation, and approve the reply.'
                : 'Draft and check the replies; a pastor approves them.'}
            </p>
          </div>
          <div className="flex gap-2.5">
            <button
              onClick={() => {
                sessionStorage.setItem('koinonia.today.card', 'hidden');
                setCardHidden(true);
              }}
              className="rounded-full border border-rubric/60 text-rubric-deep px-5 py-2 font-semibold hover:bg-vellum cursor-pointer min-h-[42px]"
            >
              Not now
            </button>
            <button onClick={() => onOpen('care')} className="rounded-full bg-rubric text-vellum px-6 py-2 font-semibold hover:bg-rubric-deep cursor-pointer min-h-[42px]">
              Open the queue
            </button>
          </div>
        </section>
      )}

      {/* Urgent row (HSL "Changes and disruptions") */}
      {mayCare && (
        <button
          onClick={() => onOpen('care')}
          className="w-full flex items-center gap-3.5 py-4 border-y border-rule text-left hover:bg-vellum/70 cursor-pointer"
        >
          <IconLifebuoy className={`w-6 h-6 shrink-0 ${crisis > 0 ? 'text-alarm' : 'text-ink-3'}`} />
          <span className="flex-1">
            <span className="block font-semibold text-[1.08rem]">Urgent requests</span>
            <span className={`block text-sm ${crisis > 0 ? 'text-alarm' : 'text-ink-3'}`}>
              {crisis > 0 ? `${crisis} ${crisis === 1 ? 'person needs' : 'people need'} a person now. No AI reply was drafted.` : 'None right now. The crisis lane goes straight to a person.'}
            </span>
          </span>
          {crisis > 0 && <span className="tag tag-alarm num-lining">{crisis}</span>}
        </button>
      )}

      {/* What is happening at church */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <TodayCard
          onClick={() => onOpen('live')}
          icon={IconBell}
          kicker="Live service"
          title={step ? step.title.en : 'Order of service'}
          meta={step ? `Now · ${step.timestampLabel}` : undefined}
          body="Tap Next as the service moves on; every phone following along moves with you."
          band="nave"
        />
        <TodayCard
          onClick={() => onOpen(can(role, 'sermon:publish') ? 'studio' : 'pew')}
          icon={IconLectern}
          kicker={profile.serviceTerm}
          title={sermonTitle}
          meta={sermon ? `Published in ${sermon.translations.length} languages` : 'Notes not yet published this week'}
          body={sermon ? `By ${sermon.publishedBy}. Pew phones show it in the reader's language.` : 'Write them once in English; Koinonia translates them for the pews.'}
          band="rubric"
        />
        {growing && (
          <TodayCard
            onClick={() => onOpen('groups')}
            icon={IconInsights}
            kicker="Who is arriving"
            title={`${LANG_NAMES[growing.lang]} readers up ${growing.growth}% this month`}
            meta={`${growing.last30} scans in the last 30 days`}
            body="Counts only. See which service needs a greeter who speaks it."
            band="gold"
            mark={growing.lang}
          />
        )}
        {mayCare && (
          <TodayCard
            onClick={() => onOpen('care')}
            icon={IconCare}
            kicker="Care Bridge"
            title="Every newcomer can be heard"
            meta={waiting > 0 ? `${waiting} waiting · ${crisis} urgent` : 'Nothing waiting'}
            body="Requests arrive with personal details already removed. Nothing is sent without a person's approval."
            band="vine"
          />
        )}
      </div>

      <p className="flex items-center gap-2 text-sm text-ink-3">
        <IconSeal className="w-4 h-4 text-vine" /> A person approves every reply. Sample data.
      </p>
    </div>
  );
}

const BANDS = {
  nave: 'bg-nave text-vellum',
  rubric: 'bg-rubric text-vellum',
  gold: 'bg-gold-wash text-ink',
  vine: 'bg-vine text-vellum',
};

function TodayCard({
  onClick,
  icon: Icon,
  kicker,
  title,
  meta,
  body,
  band,
  mark,
}: {
  onClick: () => void;
  icon: (p: IconProps) => React.ReactElement;
  kicker: string;
  title: string;
  meta?: string;
  body: string;
  band: keyof typeof BANDS;
  mark?: string;
}) {
  return (
    <button onClick={onClick} className="text-left rounded-[14px] overflow-hidden border border-rule bg-vellum hover:border-rule-strong cursor-pointer group flex flex-col">
      {/* A typographic "photo": a coloured band with a large faint icon, standing in for an image */}
      <span className={`relative h-28 ${BANDS[band]} flex items-end p-4 overflow-hidden`}>
        <Icon className="absolute -right-4 -top-4 w-36 h-36 opacity-[0.14]" />
        {mark ? <LangMark code={mark} flag size="lg" /> : <Icon className="w-8 h-8" />}
      </span>
      <span className="p-4 space-y-1.5 flex-1">
        <span className="block text-ink-3">
          {kicker} | <span className="font-semibold text-ink">{title}</span>
        </span>
        {meta && <span className="block text-sm text-rubric">{meta}</span>}
        <span className="block text-sm text-ink-2 leading-relaxed">{body}</span>
      </span>
    </button>
  );
}
