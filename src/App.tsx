import React, { useEffect, useState } from 'react';
import { X } from 'lucide-react';
import { Wordmark } from './components/brand/Logo';
import {
  IconBell,
  IconCare,
  IconChurch,
  IconCrook,
  IconDoor,
  IconLectern,
  IconLifebuoy,
  IconPew,
  IconPewCard,
  IconSeal,
  IconTable,
  VesicaBullet,
} from './components/brand/Icons';
import { ChurchTraditionId, SupportedLanguageCode, VolunteerRoleGap } from './types/koinonia';
import { CHURCH_PROFILES } from './data/koinoniaData';
import { LivePewCompanion } from './components/LivePewCompanion';
import { CareBridge } from './components/CareBridge';
import { CommunityAndVolunteerHub } from './components/CommunityAndVolunteerHub';
import { MinistryBridgeAndImpactStudio } from './components/MinistryBridgeAndImpactStudio';
import { PrintablePewQRAndRubricView } from './components/PrintablePewQRAndRubricView';
import { LiveServiceConsole } from './components/LiveServiceConsole';
import { Landing } from './components/Landing';
import { PickupPage } from './components/PickupPage';
import { api, SIGNED_OUT_EVENT, useLiveEvents, useStatus, type StaffMe } from './lib/api';
import { StaffLogin } from './components/StaffLogin';
import { StaffSidebar } from './components/StaffSidebar';
import { seedRecords } from './lib/careData';
import { TodayPage } from './components/TodayPage';
import { MorePage } from './components/MorePage';
import { VesicaMark } from './components/brand/Logo';
import { can, ROLE_META, type StaffRole } from './shared/staff';
import { useLocalState } from './lib/local';
import { go, useRoute } from './lib/router';
import { isLang, isTradition } from './shared/languages';
import { PEW_STRINGS } from './lib/pewStrings';

const TABS = [
  { id: 'today', label: 'Today', icon: IconChurch },
  { id: 'pew', label: 'Pew companion', icon: IconPew },
  { id: 'care', label: 'Care Bridge', icon: IconCare },
  { id: 'live', label: 'Live service', icon: IconBell },
  { id: 'groups', label: 'Groups & insights', icon: IconTable },
  { id: 'studio', label: 'Sunday notes', icon: IconLectern },
  { id: 'qrkit', label: 'Pew card', icon: IconPewCard },
] as const;

const ROLE_ICON: Record<StaffRole, typeof IconCrook> = { pastor: IconCrook, care: IconCare, welcome: IconDoor };

// Phones get a bottom tab bar (like a native app); the rest of the sections live under "More".
const PHONE_TABS: TabId[] = ['today', 'care', 'live', 'pew'];
const SHORT_LABEL: Record<string, string> = { today: 'Today', care: 'Care', live: 'Live', pew: 'Pew', more: 'More' };
const MORE_HINT: Record<string, string> = {
  groups: 'Language demand, greeters and groups',
  studio: "Write and publish this Sunday's notes",
  qrkit: 'Print the QR card for the pews',
  care: 'Requests, replies and the crisis lane',
  live: 'Move every phone through the service',
  pew: 'What a newcomer sees',
};

function usePhoneLayout() {
  const query = '(max-width: 900px)';
  const [phone, setPhone] = useState(() => window.matchMedia(query).matches);
  useEffect(() => {
    const mq = window.matchMedia(query);
    const on = () => setPhone(mq.matches);
    mq.addEventListener('change', on);
    return () => mq.removeEventListener('change', on);
  }, []);
  return phone;
}
type TabId = (typeof TABS)[number]['id'];

// Which dashboard tabs each role sees. The server enforces the same limits on every action.
const TABS_FOR_ROLE: Record<StaffRole, TabId[]> = {
  pastor: ['today', 'pew', 'care', 'live', 'groups', 'studio', 'qrkit'],
  care: ['today', 'pew', 'care', 'live', 'groups', 'studio', 'qrkit'],
  welcome: ['today', 'pew', 'live', 'groups', 'qrkit'],
};

const SIGNED_OUT: StaffMe = {
  signedIn: false,
  username: null,
  name: null,
  role: null,
  passcodeConfigured: true,
  demoLogin: false,
  accounts: [],
};

function useJourney(traditionId: ChurchTraditionId) {
  const [completedDays, setCompletedDays] = useLocalState<number[]>(`koinonia.days.${traditionId}`, []);
  const [journalNotes, setJournalNotes] = useLocalState<Record<string, string>>('koinonia.journal', {});
  return {
    completedDays,
    journalNotes,
    toggleDay: (day: number) => setCompletedDays((prev) => (prev.includes(day) ? prev.filter((d) => d !== day) : [...prev, day])),
    saveNote: (key: string, note: string) => setJournalNotes((prev) => ({ ...prev, [key]: note })),
  };
}

export function App() {
  const route = useRoute();
  const status = useStatus();

  if (route.page === 'landing') return <Landing status={status} />;
  if (route.page === 'pickup') return <PickupPage code={route.code} />;
  if (route.page === 'pew') {
    const church = isTradition(route.church) ? route.church : 'san-venanzio-unicam';
    const lang = isLang(route.lang) ? route.lang : null;
    return <PewOnly traditionId={church} initialLang={lang} />;
  }
  return <StaffGate tab={route.tab} status={status} />;
}

/** What a phone opens from the pew QR code: the companion only, no staff tools. */
function PewOnly({ traditionId, initialLang }: { traditionId: ChurchTraditionId; initialLang: SupportedLanguageCode | null }) {
  const profile = CHURCH_PROFILES[traditionId];
  const [lang, setLang] = useLocalState<SupportedLanguageCode>('koinonia.pewLang', initialLang ?? 'en');
  useEffect(() => {
    if (initialLang) setLang(initialLang);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [initialLang]);
  const journey = useJourney(traditionId);
  const strings = PEW_STRINGS[lang];
  return (
    // The whole attendee page follows the chosen language's direction (Arabic: right to left).
    <div className="min-h-screen" dir={strings.dir}>
      {/* Desktop top bar. At <= 900px the companion draws its own app bar and bottom tab bar. */}
      <header className="sticky top-0 z-30 bg-paper border-b border-rule max-[900px]:hidden">
        <div className="page-header-container py-2.5 flex items-center justify-between gap-3">
          <button onClick={() => go('/')} aria-label={strings.home} className="cursor-pointer">
            <Wordmark size="sm" />
          </button>
          <button onClick={() => go('/pickup')} className="btn btn-outline btn-sm">
            {strings.enterCode}
          </button>
        </div>
      </header>
      <div className="page-container py-4 sm:py-6 max-[900px]:p-0!">
        <LivePewCompanion
          profile={profile}
          selectedLang={lang}
          onSelectLang={setLang}
          pewOnly
          completedDays={journey.completedDays}
          onToggleDayComplete={journey.toggleDay}
          journalNotes={journey.journalNotes}
          onSaveJournalNote={journey.saveNote}
        />
      </div>
    </div>
  );
}

/** The dashboard is for church staff only; everything an attendee uses stays open. */
function StaffGate({ tab, status }: { tab: string | null; status: ReturnType<typeof useStatus> }) {
  const [me, setMe] = useState<StaffMe | null>(null);

  useEffect(() => {
    let alive = true;
    api
      .me()
      .then((m) => alive && setMe(m))
      .catch(() => alive && setMe(SIGNED_OUT));
    const onSignedOut = () => setMe((m) => ({ ...(m ?? SIGNED_OUT), signedIn: false, username: null, name: null, role: null }));
    window.addEventListener(SIGNED_OUT_EVENT, onSignedOut);
    return () => {
      alive = false;
      window.removeEventListener(SIGNED_OUT_EVENT, onSignedOut);
    };
  }, []);

  if (!me) return <div className="min-h-screen" />;
  if (!me.signedIn || !me.role) return <StaffLogin me={me} onSignedIn={setMe} />;

  const signOut = async () => {
    await api.logout().catch(() => undefined);
    setMe({ ...me, signedIn: false, username: null, name: null, role: null });
  };
  return <Dashboard tab={tab} status={status} staffName={me.name ?? 'Staff'} role={me.role} onSignOut={signOut} />;
}

function Dashboard({
  tab,
  status,
  staffName,
  role,
  onSignOut,
}: {
  tab: string | null;
  status: ReturnType<typeof useStatus>;
  staffName: string;
  role: StaffRole;
  onSignOut: () => void;
}) {
  const [traditionId, setTraditionId] = useLocalState<ChurchTraditionId>('koinonia.tradition', 'san-venanzio-unicam');
  const [selectedLang, setSelectedLang] = useState<SupportedLanguageCode>('en');
  const [toast, setToast] = useState<string | null>(null);
  const [crisisAlert, setCrisisAlert] = useState<{ language: string; callback?: boolean } | null>(null);
  const [gapsByChurch, setGapsByChurch] = useState<Record<string, VolunteerRoleGap[]>>({});
  const allowedTabs = TABS.filter((t) => TABS_FOR_ROLE[role].includes(t.id));
  const phone = usePhoneLayout();
  const showMore = phone && tab === 'more';
  const activeTab: TabId = (allowedTabs.find((t) => t.id === tab)?.id ?? allowedTabs[0].id) as TabId;
  const phoneTabs = allowedTabs.filter((t) => PHONE_TABS.includes(t.id));
  const moreRows = allowedTabs.filter((t) => !PHONE_TABS.includes(t.id));
  const [cueIndex, setCueIndex] = useState(0);
  const profile = CHURCH_PROFILES[traditionId] ?? CHURCH_PROFILES['san-venanzio-unicam'];
  const journey = useJourney(traditionId);
  const aiOn = Boolean(status?.ai);

  useEffect(() => {
    if (!toast) return;
    const id = setTimeout(() => setToast(null), 4500);
    return () => clearTimeout(id);
  }, [toast]);

  // Waiting and urgent counts for the sidebar (only for roles that may read the queue).
  const [counts, setCounts] = useState<{ waiting: number; crisis: number } | null>(null);
  const [countsTick, setCountsTick] = useState(0);
  useEffect(() => {
    if (!can(role, 'care:read')) return;
    let alive = true;
    api
      .careList(profile.id)
      .then(async (res) => {
        // First visit after a reset: load the sample requests here, so Today's counts are right
        // even before anyone opens the Care tab (the server ignores a second seed).
        if (!res.seeded && can(role, 'care:read')) {
          await api.careSeed(profile.id, seedRecords(profile)).catch(() => undefined);
          res = await api.careList(profile.id);
        }
        return res;
      })
      .then(({ items }) => {
        if (!alive) return;
        setCounts({
          waiting: items.filter((c) => c.status === 'pending').length,
          crisis: items.filter((c) => c.status === 'crisis').length,
        });
      })
      .catch(() => undefined);
    return () => {
      alive = false;
    };
  }, [profile.id, role, countsTick, activeTab]);

  // Crisis alerts reach every open dashboard, whichever tab it is on.
  useLiveEvents(profile.id, 'staff', (e) => {
    if (e.type === 'crisis') setCrisisAlert({ language: e.data.language, callback: e.data.callback });
    if (e.type === 'care' || e.type === 'crisis') setCountsTick((n) => n + 1);
    if (e.type === 'hello') setCueIndex(e.data.cue.index ?? 0);
    if (e.type === 'cue') setCueIndex(e.data.index);
  });

  const setTab = (id: string) => go(`/app/${id}`);

  const resetDemo = async () => {
    await api.reset().catch(() => undefined);
    localStorage.removeItem('koinonia.myRequests');
    setToast('Demo data reset. Sample requests will reload.');
    setTimeout(() => window.location.reload(), 600);
  };

  const RoleIcon = ROLE_ICON[role];
  const churches: { id: ChurchTraditionId; short: string; name: string; note: string }[] = [
    { id: 'san-venanzio-unicam', short: 'SV', name: 'Basilica di San Venanzio', note: 'Catholic · Italy' },
    { id: 'grace-fellowship-us', short: 'GF', name: 'Grace Fellowship', note: 'Protestant · USA' },
  ];

  return (
    <div className="min-h-screen flex">
      {!phone && (
        <StaffSidebar
          tabs={allowedTabs}
          activeTab={activeTab}
          onSelect={setTab}
          churches={churches}
          traditionId={traditionId}
          onChurch={setTraditionId}
          aiOn={aiOn}
          aiLabel={status ? (aiOn ? 'Live AI' : 'Sample mode · AI off') : 'Connecting…'}
          aiTitle={status?.ai ? `${status.model} via ${status.provider}` : undefined}
          staffName={staffName}
          role={role}
          roleIcon={RoleIcon}
          canReset={can(role, 'demo:reset') && !status?.publicDemo}
          onReset={resetDemo}
          onSignOut={onSignOut}
          counts={counts}
        />
      )}

      <div className="flex-1 min-w-0 flex flex-col">
        {phone && (showMore || activeTab !== 'today') && (
          <header className="sticky top-0 z-30 bg-vellum/95 backdrop-blur border-b border-rule no-print" style={{ paddingTop: 'env(safe-area-inset-top)' }}>
            <div className="h-14 px-3 grid grid-cols-[44px_1fr_44px] items-center">
              <a href="#/" aria-label="Koinonia home page" className="w-11 h-11 flex items-center justify-center">
                <VesicaMark size={26} />
              </a>
              <h1 className="text-center font-serif text-[1.35rem] truncate">
                {showMore ? 'More' : TABS.find((t) => t.id === activeTab)?.label}
              </h1>
              <button onClick={() => setTab('more')} aria-label="Your account and more" className="w-11 h-11 flex items-center justify-center text-rubric">
                <span className="w-9 h-9 rounded-full border-2 border-rule-strong bg-paper flex items-center justify-center">
                  <RoleIcon className="w-5 h-5" />
                </span>
              </button>
            </div>
          </header>
        )}
        {crisisAlert && (
          <div className={`sticky z-30 bg-alarm text-white no-print ${phone ? 'top-14' : 'top-0'}`} role="alert">
            <div className="px-4 sm:px-6 lg:px-8 py-2.5 flex flex-wrap items-center justify-between gap-3">
              <span className="flex items-center gap-2.5 font-semibold">
                <IconLifebuoy className="w-6 h-6" />
                {crisisAlert.callback
                  ? 'An urgent request now has a callback number.'
                  : 'Urgent request: crisis signals detected. A person needs to respond now.'}
              </span>
              <span className="flex gap-2">
                <button
                  onClick={() => {
                    setCrisisAlert(null);
                    setTab('care');
                  }}
                  className="btn btn-sm bg-white !text-alarm hover:bg-alarm-wash"
                >
                  Open crisis lane
                </button>
                <button onClick={() => setCrisisAlert(null)} className="btn btn-sm !text-white hover:bg-[#a51309]" aria-label="Dismiss">
                  <X className="w-4 h-4" /> Dismiss
                </button>
              </span>
            </div>
          </div>
        )}

      {toast && (
        <div className={`fixed z-50 max-w-md bg-vellum border border-ink border-l-4 border-l-vine px-4 py-3 flex items-start gap-3 no-print ${phone ? 'left-3 right-3 bottom-[calc(80px+env(safe-area-inset-bottom))]' : 'bottom-5 right-5'}`} role="status">
          <IconSeal className="w-5 h-5 text-vine shrink-0 mt-0.5" />
          <p className="text-sm leading-relaxed text-ink">{toast}</p>
        </div>
      )}

      <main className={`flex-1 w-full max-w-[1500px] mx-auto ${phone ? 'px-4 sm:px-6 pt-5 pb-tabbar' : 'px-6 lg:px-10 py-8'}`} key={traditionId}>
        {showMore && (
          <MorePage
            rows={moreRows.map((t) => ({ id: t.id, label: t.label, hint: MORE_HINT[t.id] ?? '', icon: t.icon }))}
            onOpen={setTab}
            churches={churches}
            traditionId={traditionId}
            onChurch={setTraditionId}
            staffName={staffName}
            role={role}
            roleIcon={RoleIcon}
            aiOn={aiOn}
            aiLabel={status ? (aiOn ? 'Live AI' : 'Sample mode · AI off') : 'Connecting…'}
            canReset={can(role, 'demo:reset') && !status?.publicDemo}
            onReset={resetDemo}
            onSignOut={onSignOut}
          />
        )}
        {!showMore && activeTab === 'today' && (
          <TodayPage profile={profile} staffName={staffName} role={role} roleIcon={RoleIcon} counts={counts} cueIndex={cueIndex} onOpen={setTab} />
        )}
        {!showMore && activeTab === 'pew' && (
          <LivePewCompanion
            profile={profile}
            selectedLang={selectedLang}
            onSelectLang={setSelectedLang}
            onNavigateToTab={setTab}
            completedDays={journey.completedDays}
            onToggleDayComplete={journey.toggleDay}
            journalNotes={journey.journalNotes}
            onSaveJournalNote={journey.saveNote}
          />
        )}
        {!showMore && activeTab === 'care' && <CareBridge profile={profile} aiOn={aiOn} role={role} onToast={setToast} />}
        {!showMore && activeTab === 'live' && <LiveServiceConsole profile={profile} />}
        {!showMore && activeTab === 'groups' && (
          <CommunityAndVolunteerHub
            profile={profile}
            selectedLang={selectedLang}
            volunteerGaps={gapsByChurch[profile.id] ?? profile.volunteerGaps}
            onApproveVolunteerInvite={(gapId, candidateId) => {
              setGapsByChurch((prev) => ({
                ...prev,
                [profile.id]: (prev[profile.id] ?? profile.volunteerGaps).map((g) =>
                  g.id === gapId ? { ...g, status: 'Invite Approved & Sent', selectedCandidateId: candidateId } : g
                ),
              }));
              setToast('Invitation approved by a leader. (Demo: no message is actually sent.)');
            }}
          />
        )}
        {!showMore && activeTab === 'studio' && (
          <MinistryBridgeAndImpactStudio
            profile={profile}
            aiOn={aiOn}
            canPublish={can(role, 'sermon:publish')}
            onToast={setToast}
            onNavigateToPew={() => setTab('pew')}
          />
        )}
        {!showMore && activeTab === 'qrkit' && <PrintablePewQRAndRubricView profile={profile} status={status} />}
      </main>

      <footer className={`no-print ${phone ? 'hidden' : ''}`}>
        <div className="w-full max-w-[1500px] mx-auto px-6 lg:px-10 pb-8">
          <div className="double-rule pt-4 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 text-sm text-ink-3">
            <span>
              <span className="font-serif text-ink">Koinonia</span> · inspired by the Basilica di San Venanzio, Camerino · sample data
            </span>
            <span className="flex flex-wrap items-center gap-x-4 gap-y-1 rubric-ink">
              <span className="flex items-center gap-1.5">
                <VesicaBullet className="w-2 h-3 text-rubric" /> Details removed on the phone
              </span>
              <span className="flex items-center gap-1.5">
                <VesicaBullet className="w-2 h-3 text-rubric" /> A person approves every reply
              </span>
              <span className="flex items-center gap-1.5">
                <VesicaBullet className="w-2 h-3 text-rubric" /> Crisis lane: never AI
              </span>
            </span>
          </div>
        </div>
      </footer>

        {phone && (
          <nav
            className="fixed bottom-0 inset-x-0 z-40 bg-vellum border-t border-rule-strong no-print"
            style={{ paddingBottom: 'env(safe-area-inset-bottom)' }}
            aria-label="Sections"
          >
            <ul className="grid" style={{ gridTemplateColumns: `repeat(${phoneTabs.length + 1}, minmax(0, 1fr))` }}>
              {[...phoneTabs.map((t) => ({ id: t.id as string, icon: t.icon })), { id: 'more', icon: null }].map((t) => {
                const active = t.id === 'more' ? showMore : !showMore && activeTab === t.id;
                const urgent = t.id === 'care' ? counts?.crisis ?? 0 : 0;
                const waiting = t.id === 'care' ? counts?.waiting ?? 0 : 0;
                return (
                  <li key={t.id}>
                    <button
                      onClick={() => setTab(t.id)}
                      aria-current={active ? 'page' : undefined}
                      className={`relative w-full h-16 flex flex-col items-center justify-center gap-1 cursor-pointer ${active ? 'text-rubric' : 'text-ink-3'}`}
                    >
                      {active && <span aria-hidden className="absolute top-0 left-1/2 -translate-x-1/2 w-10 h-[3px] bg-rubric" />}
                      <span className="relative">
                        {t.icon ? (
                          <t.icon className="w-[26px] h-[26px]" />
                        ) : (
                          <svg viewBox="0 0 24 24" className="w-[26px] h-[26px]" fill="none" stroke="currentColor" strokeWidth={1.6} strokeLinecap="round" aria-hidden>
                            <path d="M4 7h16M4 12h16M4 17h16" />
                          </svg>
                        )}
                        {urgent > 0 ? (
                          <span className="absolute -top-1.5 -right-2.5 min-w-[18px] h-[18px] px-1 rounded-full bg-alarm text-white text-[11px] font-semibold flex items-center justify-center">{urgent}</span>
                        ) : waiting > 0 ? (
                          <span className="absolute -top-1.5 -right-2.5 min-w-[18px] h-[18px] px-1 rounded-full bg-ink text-vellum text-[11px] font-semibold flex items-center justify-center">{waiting}</span>
                        ) : null}
                      </span>
                      <span className="font-sc text-[0.74rem] tracking-[0.1em] font-semibold">{SHORT_LABEL[t.id]}</span>
                    </button>
                  </li>
                );
              })}
            </ul>
          </nav>
        )}
      </div>
    </div>
  );
}

export default App;
