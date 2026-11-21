import React from 'react';
import { LogOut, RotateCcw } from 'lucide-react';
import type { IconProps } from './brand/Icons';
import { IconPew } from './brand/Icons';
import { ROLE_META, type StaffRole } from '../shared/staff';
import type { ChurchTraditionId } from '../types/koinonia';

interface Row {
  id: string;
  label: string;
  hint: string;
  icon: (p: IconProps) => React.ReactElement;
}

interface Props {
  rows: Row[];
  onOpen: (id: string) => void;
  churches: { id: ChurchTraditionId; short: string; name: string; note: string }[];
  traditionId: ChurchTraditionId;
  onChurch: (id: ChurchTraditionId) => void;
  staffName: string;
  role: StaffRole;
  roleIcon: (p: IconProps) => React.ReactElement;
  aiLabel: string;
  aiOn: boolean;
  canReset: boolean;
  onReset: () => void;
  onSignOut: () => void;
}

/** The phone "More" screen: grouped rows like a native settings list. */
export function MorePage(p: Props) {
  const RoleIcon = p.roleIcon;
  return (
    <div className="-mx-4 sm:-mx-6 space-y-5">
      {/* Account */}
      <section className="bg-vellum border-y border-rule px-4 sm:px-6 py-4 flex items-center gap-4">
        <span className="w-14 h-14 shrink-0 rounded-full border-2 border-rule-strong bg-paper flex items-center justify-center text-rubric">
          <RoleIcon className="w-7 h-7" />
        </span>
        <span className="min-w-0">
          <span className="block font-serif text-[1.35rem] leading-tight truncate">{p.staffName}</span>
          <span className="block text-ink-3">{ROLE_META[p.role].label} · {ROLE_META[p.role].summary}</span>
        </span>
      </section>

      {/* Sections not in the tab bar */}
      {p.rows.length > 0 && (
        <section className="bg-vellum border-y border-rule divide-y divide-rule">
          {p.rows.map((r) => (
            <button key={r.id} onClick={() => p.onOpen(r.id)} className="w-full flex items-center gap-4 px-4 sm:px-6 py-4 text-left active:bg-parchment cursor-pointer">
              <r.icon className="w-7 h-7 text-rubric shrink-0" />
              <span className="min-w-0">
                <span className="block text-[1.1rem] font-semibold text-rubric-deep">{r.label}</span>
                <span className="block text-ink-2">{r.hint}</span>
              </span>
            </button>
          ))}
        </section>
      )}

      {/* Church */}
      <section className="bg-vellum border-y border-rule px-4 sm:px-6 py-4 space-y-3">
        <p className="rubric">Church</p>
        <div className="grid grid-cols-1 gap-2">
          {p.churches.map((c) => (
            <button
              key={c.id}
              onClick={() => p.onChurch(c.id)}
              aria-pressed={c.id === p.traditionId}
              className={`flex items-center gap-3 px-3.5 py-3 border text-left cursor-pointer ${
                c.id === p.traditionId ? 'border-rubric bg-rubric-wash/60' : 'border-rule hover:bg-paper'
              }`}
            >
              <span className={`w-10 h-10 shrink-0 flex items-center justify-center border font-serif font-semibold ${c.id === p.traditionId ? 'border-rubric text-rubric' : 'border-rule-strong'}`}>
                {c.short}
              </span>
              <span className="min-w-0">
                <span className="block font-serif text-[1.05rem]">{c.name}</span>
                <span className="block text-sm text-ink-3">{c.note}</span>
              </span>
              {c.id === p.traditionId && <span className="ml-auto tag tag-rubric">Open</span>}
            </button>
          ))}
        </div>
        <p className="text-sm text-ink-3">
          AI: <span className={p.aiOn ? 'text-vine' : 'text-gold'}>{p.aiLabel}</span>
        </p>
      </section>

      <section className="bg-vellum border-y border-rule divide-y divide-rule">
        <a href="#/pew?church=san-venanzio-unicam" className="w-full flex items-center gap-4 px-4 sm:px-6 py-4">
          <IconPew className="w-7 h-7 text-rubric shrink-0" />
          <span>
            <span className="block text-[1.1rem] font-semibold text-rubric-deep">Open the pew page</span>
            <span className="block text-ink-2">What a visitor sees after scanning the card</span>
          </span>
        </a>
        {p.canReset && (
          <button onClick={p.onReset} className="w-full flex items-center gap-4 px-4 sm:px-6 py-4 text-left cursor-pointer">
            <RotateCcw className="w-7 h-7 text-rubric shrink-0" strokeWidth={1.6} />
            <span>
              <span className="block text-[1.1rem] font-semibold text-rubric-deep">Reset the demo</span>
              <span className="block text-ink-2">Clear test requests and reload the sample ones</span>
            </span>
          </button>
        )}
        <button onClick={p.onSignOut} className="w-full flex items-center gap-4 px-4 sm:px-6 py-4 text-left cursor-pointer">
          <LogOut className="w-7 h-7 text-rubric shrink-0" strokeWidth={1.6} />
          <span>
            <span className="block text-[1.1rem] font-semibold text-rubric-deep">Sign out</span>
            <span className="block text-ink-2">Visitors never need an account</span>
          </span>
        </button>
      </section>

      {/* Footer links, centred, like a native app's "More" screen */}
      <footer className="px-4 pb-2 text-center space-y-3">
        {[
          ['#/', 'Koinonia home page'],
          ['#/pickup', 'Read a reply with a pickup code'],
        ].map(([href, label]) => (
          <a key={href} href={href} className="block font-semibold text-rubric">
            {label}
          </a>
        ))}
        <p className="text-ink-3 pt-2">Koinonia · sample data, fictional people</p>
      </footer>
    </div>
  );
}
