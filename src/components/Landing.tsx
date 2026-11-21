import React, { useEffect, useState } from 'react';
import { go } from '../lib/router';
import type { StatusResponse } from '../shared/types';
import { PewQrCode, pewUrl } from './PewQrCode';
import { Wordmark } from './brand/Logo';
import { LangMark } from './brand/LangMark';
import { RoseWindow } from './brand/RoseWindow';
import { Reveal } from './brand/Reveal';
import { IPhoneFrame } from './brand/IPhoneFrame';
import { Flag } from './brand/Flags';
import { SUPPORTED_LANGUAGES } from '../data/koinoniaData';
import {
  IconBell,
  IconBridge,
  IconCare,
  IconCrook,
  IconDoor,
  IconGlossary,
  IconInsights,
  IconKey,
  IconLifebuoy,
  IconPew,
  IconPewCard,
  IconRoundTrip,
  IconScrub,
  IconSeal,
  VesicaBullet,
} from './brand/Icons';

const ALL_LANGS = ['en', 'it', 'es', 'fr', 'pt', 'pl', 'uk', 'sw', 'vi', 'zh', 'ko', 'ar'];
const STEP_WORDS = ['First', 'Then', 'Then', 'Finally'];

/** A real screenshot of the app, framed like a plate in a book. */
function Plate({ src, alt, caption, className = '', delay }: { src: string; alt: string; caption?: string; className?: string; delay?: number }) {
  const [missing, setMissing] = useState(false);
  const Wrap = delay === undefined ? 'figure' : Reveal;
  return (
    <Wrap {...(delay === undefined ? {} : { as: 'figure' as const, delay })} className={`space-y-2.5 ${className}`}>
      <div className="leaf p-2 sm:p-2.5">
        {missing ? (
          <div className="aspect-[16/10] inset flex items-center justify-center text-sm text-ink-3">{alt}</div>
        ) : (
          <img src={src} alt={alt} loading="lazy" onError={() => setMissing(true)} className="block w-full h-auto border border-rule" />
        )}
      </div>
      {caption && (
        <figcaption className="text-sm text-ink-3">
          {caption}
        </figcaption>
      )}
    </Wrap>
  );
}

/** A real phone screenshot, shown in an iPhone 15 Pro-style frame. */
function Phone({ src, alt, className = '' }: { src: string; alt: string; className?: string }) {
  const [missing, setMissing] = useState(false);
  return (
    <IPhoneFrame className={className}>
      {missing ? (
        <div className="absolute inset-0 flex items-center justify-center p-6 text-center text-sm text-ink-3">{alt}</div>
      ) : (
        <img src={src} alt={alt} loading="lazy" onError={() => setMissing(true)} className="absolute inset-0 block w-full h-full object-cover object-top" />
      )}
    </IPhoneFrame>
  );
}

function SectionHead({ kicker, title, children, tone = 'ink' }: { kicker: string; title: React.ReactNode; children?: React.ReactNode; tone?: 'ink' | 'light' }) {
  const accent = tone === 'ink' ? 'text-rubric' : 'text-[#e08a72]';
  return (
    <Reveal className="space-y-4 max-w-3xl">
      <p className={`flex items-center gap-2.5 font-sc text-[0.85rem] tracking-[0.12em] ${accent}`}>
        <VesicaBullet className="w-2 h-3" />
        {kicker}
        <span className={`h-px w-12 ${tone === 'ink' ? 'bg-rubric/50' : 'bg-[#e08a72]/50'}`} />
      </p>
      <h2 className="text-[2.2rem] sm:text-[2.9rem] leading-[1.05]">{title}</h2>
      {children && <div className={`text-[1.08rem] leading-relaxed ${tone === 'ink' ? 'text-ink-2' : 'text-[#d9cfbf]'}`}>{children}</div>}
    </Reveal>
  );
}

const STEPS = [
  {
    icon: IconPewCard,
    title: 'Scan the card',
    body: 'No app and no account. The pew page opens in the browser; the visitor chooses one of 12 languages.',
    shot: '/shots/phone-languages.png',
    alt: 'The pew page on a phone, choosing a language',
  },
  {
    icon: IconScrub,
    title: 'Ask, in your own words',
    body: 'A prayer or care request in their own language. Names, numbers and addresses are removed on the phone as they type.',
    shot: '/shots/phone-request.png',
    alt: 'Writing a request on the phone, with personal details removed',
  },
  {
    icon: IconRoundTrip,
    title: 'The pastor answers',
    body: 'A summary and a draft in the pastor’s language; the reply is translated, translated back and checked before approval.',
    shot: '/shots/phone-code.png',
    alt: 'The private pickup code the attendee keeps',
  },
  {
    icon: IconKey,
    title: 'Read the reply',
    body: 'With the private pickup code: the approved reply, a passage from the church’s Bible text, and an invitation to a group.',
    shot: '/shots/phone-reply.png',
    alt: 'The approved reply on the pickup page',
  },
];

export const Landing: React.FC<{ status: StatusResponse | null }> = ({ status }) => {
  const tryUrl = pewUrl(status, 'san-venanzio-unicam');
  const [menu, setMenu] = useState(false);
  useEffect(() => {
    if (!menu) return;
    const onKey = (e: KeyboardEvent) => e.key === 'Escape' && setMenu(false);
    window.addEventListener('keydown', onKey);
    document.body.style.overflow = 'hidden';
    return () => {
      window.removeEventListener('keydown', onKey);
      document.body.style.overflow = '';
    };
  }, [menu]);
  const jump = (id: string) => {
    setMenu(false);
    setTimeout(() => document.getElementById(id)?.scrollIntoView({ behavior: 'smooth', block: 'start' }), 260);
  };
  const SECTIONS: [string, string][] = [
    ['why', 'Why'],
    ['how', 'How it works'],
    ['inside', 'Inside the app'],
    ['ai', 'How we use AI'],
    ['try', 'Try it'],
  ];

  return (
    <div className="min-h-screen">
      {/* Nav */}
      <header className="sticky top-0 z-30 bg-paper border-b border-rule">
        <div className="page-header-container py-2.5 flex items-center justify-between gap-4">
          <button onClick={() => window.scrollTo({ top: 0, behavior: 'smooth' })} className="cursor-pointer" aria-label="Koinonia, top of page">
            <Wordmark greek />
          </button>
          <nav className="hidden md:flex items-center gap-1 text-[0.95rem]">
            {[
              ['#why', 'Why'],
              ['#how', 'How it works'],
              ['#inside', 'Inside the app'],
              ['#ai', 'How we use AI'],
              ['#try', 'Try it'],
            ].map(([href, label]) => (
              <a key={href} href={href} className="px-3 py-2 text-ink-2 hover:text-rubric">
                {label}
              </a>
            ))}
          </nav>
          <button
            className={`burger md:hidden w-11 h-11 border border-rule-strong flex flex-col items-center justify-center gap-[5px] cursor-pointer ${menu ? 'open' : ''}`}
            aria-label={menu ? 'Close the menu' : 'Open the menu'}
            aria-expanded={menu}
            aria-controls="landing-menu"
            onClick={() => setMenu((m) => !m)}
          >
            <span />
            <span />
            <span />
          </button>
        </div>
      </header>

      {/* Phone menu: a drawer from the left */}
      <button aria-label="Close the menu" tabIndex={menu ? 0 : -1} className={`md:hidden fixed inset-0 z-40 bg-nave/50 transition-opacity ${menu ? 'opacity-100' : 'opacity-0 pointer-events-none'}`} onClick={() => setMenu(false)} />
      <aside
        id="landing-menu"
        role="dialog"
        aria-label="Menu"
        aria-hidden={!menu}
        className={`md:hidden fixed inset-y-0 left-0 z-50 w-[min(88vw,320px)] h-[100dvh] bg-paper border-r border-rule flex flex-col transition-transform duration-300 ease-[cubic-bezier(.2,.7,.2,1)] ${menu ? 'translate-x-0' : '-translate-x-full'}`}
      >
        <div className="flex items-center justify-between px-4 h-16 border-b border-rule">
          <Wordmark size="sm" />
          <button onClick={() => setMenu(false)} className="w-11 h-11 flex items-center justify-center text-2xl text-ink-2 cursor-pointer" aria-label="Close the menu">
            ×
          </button>
        </div>
        <nav className="flex-1 overflow-y-auto py-3">
          {SECTIONS.map(([id, label]) => (
            <button key={id} onClick={() => jump(id)} className="w-full text-left px-5 py-3.5 font-serif text-[1.35rem] border-b border-rule/60 cursor-pointer active:bg-parchment">
              {label}
            </button>
          ))}
        </nav>
        <div className="p-4 space-y-2.5 border-t border-rule" style={{ paddingBottom: 'calc(16px + env(safe-area-inset-bottom))' }}>
          <button onClick={() => go('/pew?church=san-venanzio-unicam')} className="btn btn-rubric btn-lg w-full">
            <IconPew className="w-5 h-5" /> I’m visiting - open the pew page
          </button>
          <button onClick={() => go('/app')} className="btn btn-outline btn-lg w-full">
            <IconCrook className="w-5 h-5" /> Church staff sign in
          </button>
        </div>
      </aside>
      <style>{`
        .burger span { display:block; width:18px; height:1.6px; background: var(--color-ink); transition: transform .22s, opacity .2s; }
        .burger.open span:nth-child(1) { transform: translateY(6.6px) rotate(45deg); }
        .burger.open span:nth-child(2) { opacity: 0; }
        .burger.open span:nth-child(3) { transform: translateY(-6.6px) rotate(-45deg); }
      `}</style>

      {/* Hero */}
      <section className="page-container pt-12 sm:pt-16 pb-16 grid grid-cols-1 lg:grid-cols-[1.05fr_1fr] gap-12 lg:gap-16 items-center">
        <Reveal className="space-y-8">
          <p className="rubric !text-[0.95rem]">A pastoral care bridge for multilingual churches</p>
          <h1 className="text-[3.1rem] sm:text-[4.4rem] xl:text-[5.2rem] leading-[0.98] tracking-[-0.02em]">
            Every newcomer in the pew can be <em className="text-rubric">heard.</em>
          </h1>
          <p className="text-[1.2rem] sm:text-[1.3rem] leading-relaxed text-ink-2 max-w-xl font-serif">
            Someone who doesn’t speak the church’s language asks for prayer or help in their own. The pastor reads it and answers in theirs. A
            person approves every word, personal details never leave the phone, and a cry for help goes straight to a human.
          </p>
          <div className="flex flex-wrap gap-3">
            <button onClick={() => go('/pew?church=san-venanzio-unicam')} className="btn btn-rubric btn-lg">
              <IconPew className="w-5 h-5" /> I’m visiting - open the pew page
            </button>
            <button onClick={() => go('/app')} className="btn btn-outline btn-lg">
              <IconCrook className="w-5 h-5" /> Church staff sign in
            </button>
          </div>
          <p className="text-ink-2">
            Visitors never need an account.{' '}
            <button onClick={() => go('/pickup')} className="text-rubric underline underline-offset-4 decoration-1 hover:text-rubric-deep cursor-pointer">
              Have a pickup code? Read your reply
            </button>
          </p>
          <div className="double-rule pt-5 grid grid-cols-3 gap-4 max-w-xl">
            {[
              ['12', 'languages, Arabic right-to-left included'],
              ['2', 'traditions’ vocabularies, Catholic and Protestant'],
              ['0', 'apps to install or accounts for visitors'],
            ].map(([n, label]) => (
              <div key={label}>
                <div className="font-serif text-[2.4rem] leading-none text-ink num-lining">{n}</div>
                <div className="text-sm text-ink-3 mt-1.5 leading-snug">{label}</div>
              </div>
            ))}
          </div>
        </Reveal>

        <Reveal as="figure" delay={200}>
          <RoseWindow className="max-w-[560px] mx-auto" />
          <figcaption className="text-center mt-4 rubric-ink">Twelve languages, one table - requests travel in, replies travel back</figcaption>
        </Reveal>
      </section>

      {/* Language strip: one line, sliding slowly right to left; pauses on hover */}
      <div className="border-y border-rule bg-vellum">
        <div className="page-container py-4 flex items-center gap-6">
          <span className="rubric shrink-0">In the pew today</span>
          <div className="lang-marquee relative flex-1 overflow-hidden" aria-label="Languages in the pew today">
            <div className="lang-marquee-track flex w-max">
              {[0, 1].map((copy) => (
                <ul key={copy} className="flex shrink-0 items-center gap-x-8 pr-8" aria-hidden={copy === 1 || undefined}>
                  {ALL_LANGS.map((c) => (
                    <li key={c} className="inline-flex items-center gap-2 text-[0.95rem] text-ink-2 whitespace-nowrap" dir="ltr">
                      <Flag code={c} />
                      <span dir="auto">{SUPPORTED_LANGUAGES.find((l) => l.code === c)?.nativeName ?? c}</span>
                    </li>
                  ))}
                </ul>
              ))}
            </div>
          </div>
        </div>
        <style>{`
          .lang-marquee {
            -webkit-mask-image: linear-gradient(90deg, transparent, #000 6%, #000 94%, transparent);
            mask-image: linear-gradient(90deg, transparent, #000 6%, #000 94%, transparent);
          }
          .lang-marquee-track { animation: lang-marquee 45s linear infinite; }
          .lang-marquee:hover .lang-marquee-track,
          .lang-marquee:focus-within .lang-marquee-track { animation-play-state: paused; }
          @keyframes lang-marquee { from { transform: translateX(0); } to { transform: translateX(-50%); } }
          @media (prefers-reduced-motion: reduce) { .lang-marquee-track { animation: none; } }
        `}</style>
      </div>

      {/* Why */}
      <section id="why" className="page-container py-20 sm:py-24 space-y-12 scroll-mt-20">
        <SectionHead kicker="Why" title="The silent pew" />
        <div className="grid grid-cols-1 lg:grid-cols-[1fr_20rem] gap-x-16 gap-y-8">
          <Reveal className="prose-missal !text-[1.25rem] space-y-5 max-w-3xl">
            <p className="drop-cap">
              Every Sunday, international students, immigrants and quiet seekers sit through a service they can’t fully follow, then walk out
              without anyone knowing they needed prayer, a meal, or simply a friend. Translation apps help them hear the sermon. Nothing helps
              them <em>be heard</em>.
            </p>
            <p>
              The care team would gladly help, but often can’t read the request - or, trying to, pastes someone’s private details into a public
              AI tool. Koinonia closes both gaps: the newcomer writes in their language, the pastor answers in theirs, and nothing private leaves
              the phone.
            </p>
          </Reveal>
          <Reveal as="aside" delay={150} className="border-l-2 border-rubric pl-5 space-y-3 self-start">
            <p className="rubric">Where it started</p>
            <p className="text-ink-2 leading-relaxed">
              Inspired by the Basilica di San Venanzio in Camerino, Italy, where university students from many countries worship alongside local
              families. The parish shown in the app is sample data, not an official parish tool.
            </p>
          </Reveal>
        </div>
      </section>

      {/* How it works */}
      <section id="how" className="bg-vellum border-y border-rule scroll-mt-20">
        <div className="page-container py-20 sm:py-24 space-y-14">
          <SectionHead kicker="How it works" title="An order of care, in four movements">
            From a card in the pew to a reply the newcomer can read - with a person deciding at every step that matters.
          </SectionHead>

          <ol className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-4 gap-x-8 gap-y-14">
            {STEPS.map((s, i) => (
              <Reveal as="li" delay={i * 120} key={s.title} className="space-y-5">
                <Phone src={s.shot} alt={s.alt} className="max-w-[250px] mx-auto sm:mx-0" />
                <div className="space-y-2">
                  <p className="flex items-center gap-2">
                    <s.icon className="w-5 h-5 text-rubric" />
                    <span className="font-sc text-[0.85rem] tracking-[0.12em] text-rubric">{STEP_WORDS[i]}</span>
                  </p>
                  <h3 className="text-[1.6rem] leading-tight">{s.title}</h3>
                  <p className="text-ink-2 leading-relaxed">{s.body}</p>
                </div>
              </Reveal>
            ))}
          </ol>
        </div>
      </section>

      {/* Inside the app */}
      <section id="inside" className="page-container py-20 sm:py-24 space-y-24 scroll-mt-20">
        <SectionHead kicker="Inside the app" title="What the care team actually sees">
          Real screens from the working app, with sample data.
        </SectionHead>

        {/* Care Bridge */}
        <div className="grid grid-cols-1 lg:grid-cols-[1fr_1.6fr] gap-10 lg:gap-14 items-center">
          <Reveal className="space-y-5">
            <IconBridge className="w-8 h-8 text-rubric" />
            <h3 className="text-[2rem] leading-tight">A two-way bridge, with the meaning checked</h3>
            <p className="text-[1.08rem] text-ink-2 leading-relaxed">
              The pastor writes the reply in their own language. Koinonia translates it, then a separate AI call that never saw the original
              translates it back, and a third compares the two. Any phrase whose meaning changed is highlighted - and the reply can’t be approved
              until the check has run on the exact words being sent.
            </p>
            <ul className="space-y-2.5 text-ink-2">
              {[
                'The request arrives with personal details already removed',
                'Summary, passage and group suggestion, labelled as written by AI',
                'In testing it caught “Fellowship” coming back as “Association”',
              ].map((t) => (
                <li key={t} className="flex gap-2.5">
                  <VesicaBullet className="w-2 h-3 text-rubric mt-2 shrink-0" />
                  {t}
                </li>
              ))}
            </ul>
          </Reveal>
          <Plate
            src="/shots/care-bridge.jpg"
            alt="The Care Bridge with the meaning-drift check"
            caption="The Care Bridge: the request, the reply, and the independent back-translation."
            delay={150}
          />
        </div>

        {/* Glossary */}
        <div className="grid grid-cols-1 lg:grid-cols-[1.6fr_1fr] gap-10 lg:gap-14 items-center">
          <Reveal className="leaf p-6 sm:p-8 order-2 lg:order-1 overflow-x-auto">
            <p className="rubric mb-1">“God loves you, and the Holy Spirit is with you.”</p>
            <p className="text-sm text-ink-3 mb-6">Translated by the app for a Catholic parish, without and with its glossary.</p>
            <table className="w-full text-left min-w-[30rem]">
              <thead>
                <tr className="border-b border-rule-strong">
                  <th className="pb-2 w-16" />
                  <th className="rubric-ink font-normal pb-2">Without the glossary</th>
                  <th className="rubric pb-2">With the glossary</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-rule">
                <tr>
                  <td className="py-4 align-top">
                    <LangMark code="ko" />
                  </td>
                  <td className="py-4 pr-4 font-serif text-[1.15rem]">
                    <mark className="bg-alarm-wash text-alarm px-0.5">하나님</mark>께서 당신을 사랑하시며…
                    <span className="block text-sm text-ink-3 font-sans mt-1">Protestant usage - flagged</span>
                  </td>
                  <td className="py-4 font-serif text-[1.15rem]">
                    <mark className="bg-vine-wash text-vine px-0.5">하느님</mark>께서 당신을 사랑하시며…
                    <span className="block text-sm text-ink-3 font-sans mt-1">Catholic usage</span>
                  </td>
                </tr>
                <tr>
                  <td className="py-4 align-top">
                    <LangMark code="zh" />
                  </td>
                  <td className="py-4 pr-4 font-serif text-[1.15rem]">
                    神爱你，<mark className="bg-alarm-wash text-alarm px-0.5">圣灵</mark>与你同在。
                    <span className="block text-sm text-ink-3 font-sans mt-1">Protestant usage - flagged</span>
                  </td>
                  <td className="py-4 font-serif text-[1.15rem]">
                    <mark className="bg-vine-wash text-vine px-0.5">天主</mark>爱你，<mark className="bg-vine-wash text-vine px-0.5">圣神</mark>与你同在。
                    <span className="block text-sm text-ink-3 font-sans mt-1">Catholic usage</span>
                  </td>
                </tr>
              </tbody>
            </table>
          </Reveal>
          <Reveal delay={150} className="space-y-5 order-1 lg:order-2">
            <IconGlossary className="w-8 h-8 text-rubric" />
            <h3 className="text-[2rem] leading-tight">Translation that knows the tradition</h3>
            <p className="text-[1.08rem] text-ink-2 leading-relaxed">
              Catholics and Protestants use different words in the same language - 하느님 or 하나님, 天主 or 上帝, Mass or service. Generic
              translation gets this wrong. The pastor approves a glossary once; every translation follows it and is checked word by word.
            </p>
          </Reveal>
        </div>

        {/* Crisis */}
        <div className="grid grid-cols-1 lg:grid-cols-[1fr_auto_1fr] gap-10 lg:gap-14 items-center">
          <Reveal className="space-y-5">
            <IconLifebuoy className="w-8 h-8 text-alarm" />
            <h3 className="text-[2rem] leading-tight">A crisis is never answered by AI</h3>
            <p className="text-[1.08rem] text-ink-2 leading-relaxed">
              Signs of self-harm, abuse or danger, in any of the 12 languages, skip the queue and the AI. The phone shows local crisis lines in
              the person’s language at once; every open dashboard raises an alert so a person responds; the attendee may leave a number for a
              call back.
            </p>
          </Reveal>
          <Reveal delay={120}>
            <Phone src="/shots/phone-crisis.png" alt="The crisis panel on the attendee’s phone" className="w-[250px] mx-auto" />
          </Reveal>
          <Reveal delay={240} className="border-l-2 border-alarm pl-5 space-y-3">
            <p className="rubric !text-alarm">On the phone, instantly</p>
            <p className="font-serif text-[1.35rem] leading-snug">“You matter. Please reach out now.”</p>
            <p className="text-ink-2">Emergency 112 and the anti-violence line 1522 in Italy; 911, 988 and the domestic violence hotline in the US.</p>
          </Reveal>
        </div>

        {/* Live + insights */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-12">
          <Reveal className="space-y-6">
            <Plate src="/shots/live-console.jpg" alt="The live service console" caption="One tap at the back of the church; every following phone moves on." />
            <div className="space-y-3">
              <IconBell className="w-7 h-7 text-rubric" />
              <h3 className="text-[1.7rem] leading-tight">Live service cues</h3>
              <p className="text-ink-2 leading-relaxed">
                A volunteer taps “Next” as the service moves on. Every phone with “Follow live” turned on jumps to the same moment and explains
                it in the reader’s language - including what visitors from other traditions can do.
              </p>
            </div>
          </Reveal>
          <Reveal delay={150} className="space-y-6">
            <Plate src="/shots/insights.jpg" alt="Language-demand insights" caption="Counts only: a language and a time, nothing about the person." />
            <div className="space-y-3">
              <IconInsights className="w-7 h-7 text-rubric" />
              <h3 className="text-[1.7rem] leading-tight">Who is arriving, and who will greet them</h3>
              <p className="text-ink-2 leading-relaxed">
                Pew scans are compared with the greeter rota: “Arabic scans are up, and no Arabic-speaking greeter is on at 11:00.” Leaders see
                where a language group is growing without anyone to welcome them.
              </p>
            </div>
          </Reveal>
        </div>

        {/* Roles */}
        <div className="grid grid-cols-1 lg:grid-cols-[1.6fr_1fr] gap-10 lg:gap-14 items-center">
          <Plate
            src="/shots/sign-in.jpg"
            alt="Staff sign-in with roles"
            caption="Staff sign in with a role; the server enforces what each role may do."
            delay={0}
            className="order-2 lg:order-1"
          />
          <Reveal delay={150} className="space-y-6 order-1 lg:order-2">
            <IconSeal className="w-8 h-8 text-rubric" />
            <h3 className="text-[2rem] leading-tight">The AI drafts. A pastor decides.</h3>
            <div className="divide-y divide-rule border-y border-rule">
              {[
                { icon: IconCrook, role: 'Pastor', text: 'Approves every reply, the glossary and the Sunday notes.' },
                { icon: IconCare, role: 'Care team', text: 'Drafts and checks replies; a pastor approves them.' },
                { icon: IconDoor, role: 'Welcome volunteer', text: 'Runs live cues and greeter planning; cannot read care requests.' },
              ].map((r) => (
                <div key={r.role} className="flex gap-3 py-3.5">
                  <r.icon className="w-6 h-6 text-rubric shrink-0" />
                  <p>
                    <span className="font-serif text-lg">{r.role}.</span> <span className="text-ink-2">{r.text}</span>
                  </p>
                </div>
              ))}
            </div>
          </Reveal>
        </div>
      </section>

      {/* How we use AI */}
      <section id="ai" className="bg-nave text-vellum scroll-mt-20">
        <div className="page-container py-20 sm:py-24 space-y-12">
          <SectionHead tone="light" kicker="Honest about AI" title="What the AI does - and what it never does" />
          <div className="grid grid-cols-1 md:grid-cols-3 gap-10 md:gap-0 md:divide-x md:divide-nave-3">
            {[
              {
                head: 'The AI does',
                items: [
                  'Summarises requests for the pastor',
                  'Suggests a passage and a group, by id',
                  'Drafts, translates and back-translates replies',
                  'Compares meaning and flags changes',
                  'Translates the Sunday notes',
                ],
              },
              {
                head: 'The AI never',
                items: [
                  'Sees names, numbers or addresses',
                  'Writes or translates Bible text',
                  'Answers a crisis',
                  'Sends anything without a person approving it',
                ],
              },
              {
                head: 'Known limits',
                items: [
                  'The privacy filter is pattern-based and can miss an unusual name, or names written in Arabic or Korean script; attendees are asked not to name others',
                  'Bible passages in the demo are sample text; a church connects its licensed translation',
                ],
              },
            ].map((col, ci) => (
              <Reveal delay={ci * 120} key={col.head} className="md:px-8 md:first:pl-0 md:last:pr-0 space-y-4">
                <p className="font-sc tracking-[0.07em] text-[#e08a72]">{col.head}</p>
                <ul className="space-y-3">
                  {col.items.map((t) => (
                    <li key={t} className="flex gap-2.5 text-[#d9cfbf] leading-relaxed">
                      <VesicaBullet className="w-2 h-3 text-[#e08a72] mt-2 shrink-0" />
                      {t}
                    </li>
                  ))}
                </ul>
              </Reveal>
            ))}
          </div>
          <p className="text-sm text-[#a99d8c] border-t border-nave-3 pt-5">
            Model: Claude, called with the Anthropic SDK -{' '}
            {status?.ai ? `currently ${status.model} via ${status.provider}` : 'this server is currently in sample mode'}. Koinonia itself was built
            with the help of Claude Code.
          </p>
        </div>
      </section>

      {/* Try it */}
      <section id="try" className="page-container py-20 sm:py-24 grid grid-cols-1 lg:grid-cols-[1.4fr_1fr] gap-12 items-center scroll-mt-20">
        <Reveal className="space-y-6">
          <SectionHead kicker="Try it" title="Scan it with your phone">
            Open the pew page on your phone, send a prayer request, and watch it arrive in the Care Bridge on this screen. Approve a reply, then
            read it back on your phone with the pickup code.
          </SectionHead>
          <div className="flex flex-wrap gap-3">
            <button onClick={() => go('/pew?church=san-venanzio-unicam')} className="btn btn-rubric">
              <IconPew className="w-5 h-5" /> Open the pew page
            </button>
            <button onClick={() => go('/app/care')} className="btn btn-outline">
              <IconCare className="w-5 h-5" /> Staff: the Care Bridge
            </button>
            <button onClick={() => go('/app/live')} className="btn btn-outline">
              <IconBell className="w-5 h-5" /> Staff: live service
            </button>
          </div>
        </Reveal>
        <Reveal delay={150} className="flex justify-center">
          <div className="leaf p-6 text-center space-y-3 w-[18rem]">
            <p className="rubric">Basilica di San Venanzio · sample</p>
            <PewQrCode value={tryUrl} className="w-52 h-52 mx-auto [&>svg]:w-full [&>svg]:h-full" />
            <p className="font-serif text-lg leading-snug">Scan to follow in your language - and ask for prayer</p>
            <p className="text-xs text-ink-3 break-all font-mono">{tryUrl}</p>
          </div>
        </Reveal>
      </section>

      {/* Footer */}
      <footer className="page-container pb-10">
        <div className="double-rule pt-6 flex flex-col md:flex-row md:items-center justify-between gap-4 text-sm text-ink-3">
          <Wordmark size="sm" />
          <p>AI for Church Hackathon 2026 · Care &amp; Community · sample data, fictional people</p>
          <p className="rubric-ink">{status?.ai ? 'Live AI' : 'Sample mode'}</p>
        </div>
      </footer>
    </div>
  );
};
