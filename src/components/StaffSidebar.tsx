import React, { useEffect, useState } from 'react';
import { LogOut, PanelLeftClose, PanelLeftOpen, RotateCcw } from 'lucide-react';
import { VesicaMark, Wordmark } from './brand/Logo';
import type { IconProps } from './brand/Icons';
import { ROLE_META, type StaffRole } from '../shared/staff';
import type { ChurchTraditionId } from '../types/koinonia';

export interface SidebarTab {
  id: string;
  label: string;
  icon: (p: IconProps) => React.ReactElement;
}

interface Props {
  tabs: SidebarTab[];
  activeTab: string;
  onSelect: (id: string) => void;
  churches: { id: ChurchTraditionId; short: string; name: string; note: string }[];
  traditionId: ChurchTraditionId;
  onChurch: (id: ChurchTraditionId) => void;
  aiLabel: string;
  aiOn: boolean;
  aiTitle?: string;
  staffName: string;
  role: StaffRole;
  roleIcon: (p: IconProps) => React.ReactElement;
  canReset: boolean;
  onReset: () => void;
  onSignOut: () => void;
  counts: { waiting: number; crisis: number } | null;
}

// Sections of the sidebar, in the order of a Sunday: care first, then the service, then welcome.
const GROUPS: { label: string; ids: string[] }[] = [
  { label: '', ids: ['today'] },
  { label: 'Care', ids: ['care'] },
  { label: 'Sunday', ids: ['pew', 'live', 'studio'] },
  { label: 'Welcome', ids: ['groups', 'qrkit'] },
];

function useWideScreen() {
  const query = '(min-width: 1024px)';
  const [wide, setWide] = useState(() => (typeof window === 'undefined' ? true : window.matchMedia(query).matches));
  useEffect(() => {
    const mq = window.matchMedia(query);
    const on = () => setWide(mq.matches);
    mq.addEventListener('change', on);
    return () => mq.removeEventListener('change', on);
  }, []);
  return wide;
}

/**
 * The staff sidebar. Full height, attached to the left edge; folds to an icon rail.
 * The open/closed choice is remembered on this device; "[" toggles it from the keyboard.
 * The active section is marked with a red silk ribbon, like a missal's bookmark.
 */
export function StaffSidebar(p: Props) {
  const [userCollapsed, setUserCollapsed] = useState<boolean>(() => localStorage.getItem('koinonia.sidebar') === 'collapsed');
  const wide = useWideScreen();
  const collapsed = userCollapsed || !wide;

  const toggle = () =>
    setUserCollapsed((c) => {
      localStorage.setItem('koinonia.sidebar', c ? 'open' : 'collapsed');
      return !c;
    });

  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      const t = e.target as HTMLElement | null;
      if (e.key !== '[' || e.metaKey || e.ctrlKey || e.altKey) return;
      if (t && (t.tagName === 'INPUT' || t.tagName === 'TEXTAREA' || t.tagName === 'SELECT' || t.isContentEditable)) return;
      toggle();
    };
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, []);

  const RoleIcon = p.roleIcon;
  const church = p.churches.find((c) => c.id === p.traditionId) ?? p.churches[0];
  const otherChurch = p.churches.find((c) => c.id !== p.traditionId) ?? p.churches[0];

  return (
    <aside
      className="staff-sidebar sticky top-0 h-screen shrink-0 bg-vellum border-r-[3px] border-double border-rule-strong flex flex-col no-print z-40"
      style={{ width: collapsed ? 76 : 272 }}
      aria-label="Staff navigation"
    >
      {/* Brand + collapse */}
      <div className={`flex border-b border-rule ${collapsed ? 'flex-col items-center gap-1.5 py-3' : 'items-center justify-between h-16 px-4'}`}>
        <a href="#/" className="flex items-center gap-2.5 min-w-0 hover:opacity-80" aria-label="Koinonia home page" title="Back to the home page">
          {collapsed ? (
            <VesicaMark size={34} />
          ) : (
            <span className="leading-none">
              <Wordmark size="sm" />
              <span className="block font-sc text-[0.68rem] tracking-[0.14em] text-rubric mt-1">Staff</span>
            </span>
          )}
        </a>
        {wide && !collapsed && (
          <button onClick={toggle} className="btn btn-ghost btn-sm !px-2" aria-label="Collapse the sidebar" title="Collapse  [">
            <PanelLeftClose className="w-[18px] h-[18px]" />
          </button>
        )}
        {wide && collapsed && (
          <button onClick={toggle} className="btn btn-ghost btn-sm !px-2" aria-label="Expand the sidebar" title="Expand  [">
            <PanelLeftOpen className="w-[18px] h-[18px]" />
          </button>
        )}
      </div>

      {/* Navigation */}
      <nav className="flex-1 overflow-y-auto overflow-x-hidden py-3" aria-label="Sections">
        {GROUPS.map((g) => {
          const items = p.tabs.filter((t) => g.ids.includes(t.id));
          if (items.length === 0) return null;
          return (
            <div key={g.label} className="mb-3">
              {!g.label ? null : collapsed ? (
                <div className="mx-auto my-2 w-6 border-t border-rule" />
              ) : (
                <p className="px-5 pb-1.5 pt-1 flex items-center gap-2 font-sc text-[0.72rem] tracking-[0.14em] text-ink-3">
                  {g.label}
                  <span className="h-px flex-1 bg-rule" />
                </p>
              )}
              <ul className={collapsed ? 'space-y-1 px-2' : 'space-y-0.5 px-2.5'}>
                {items.map((t) => {
                  const active = t.id === p.activeTab;
                  const Icon = t.icon;
                  const waiting = t.id === 'care' ? p.counts?.waiting ?? 0 : 0;
                  const crisis = t.id === 'care' ? p.counts?.crisis ?? 0 : 0;
                  return (
                    <li key={t.id} className="relative group">
                      <button
                        onClick={() => p.onSelect(t.id)}
                        aria-current={active ? 'page' : undefined}
                        className={`relative w-full flex items-center gap-3 cursor-pointer transition-colors ${
                          collapsed ? 'justify-center h-11' : 'px-3.5 py-2.5 text-[0.98rem]'
                        } ${active ? 'bg-parchment text-ink font-semibold' : 'text-ink-2 hover:bg-paper hover:text-ink'}`}
                      >
                        {active && <span aria-hidden className="ribbon absolute left-0 top-0 h-[calc(100%+6px)] w-[5px] bg-rubric" />}
                        <span className="relative">
                          <Icon className={`w-5 h-5 ${active ? 'text-rubric' : ''}`} />
                          {collapsed && crisis > 0 && <span className="absolute -top-1 -right-1.5 w-2.5 h-2.5 rounded-full bg-alarm ring-2 ring-vellum animate-pulse" />}
                          {collapsed && crisis === 0 && waiting > 0 && <span className="absolute -top-1 -right-1.5 w-2 h-2 rounded-full bg-gold ring-2 ring-vellum" />}
                        </span>
                        {!collapsed && <span className="flex-1 text-left truncate">{t.label}</span>}
                        {!collapsed && crisis > 0 && (
                          <span className="tag tag-alarm !px-1.5 !py-0 num-lining" title={`${crisis} urgent`}>
                            {crisis}
                          </span>
                        )}
                        {!collapsed && waiting > 0 && (
                          <span className="tag !px-1.5 !py-0 num-lining" title={`${waiting} waiting for a pastor`}>
                            {waiting}
                          </span>
                        )}
                      </button>
                      {collapsed && (
                        <span className="pointer-events-none absolute left-full top-1/2 -translate-y-1/2 ml-3 whitespace-nowrap bg-nave text-vellum text-sm px-2.5 py-1.5 opacity-0 group-hover:opacity-100 transition-opacity z-50">
                          {t.label}
                          {crisis > 0 ? ` · ${crisis} urgent` : waiting > 0 ? ` · ${waiting} waiting` : ''}
                        </span>
                      )}
                    </li>
                  );
                })}
              </ul>
            </div>
          );
        })}
      </nav>

      {/* Church switch */}
      <div className={`border-t border-rule ${collapsed ? 'py-3 flex flex-col items-center gap-2' : 'p-3 space-y-2.5'}`}>
        {collapsed ? (
          <button
            onClick={() => p.onChurch(otherChurch.id)}
            className="w-11 h-11 border border-rule-strong bg-paper font-serif font-semibold text-[0.95rem] hover:border-rubric cursor-pointer relative group"
            title={`${church.name} (${church.note}) - click for ${otherChurch.name}`}
          >
            {church.short}
          </button>
        ) : (
          <div className="grid grid-cols-2 p-1 bg-parchment border border-rule" role="tablist" aria-label="Church">
            {p.churches.map((c) => (
              <button
                key={c.id}
                role="tab"
                aria-selected={c.id === p.traditionId}
                onClick={() => p.onChurch(c.id)}
                title={`${c.name} · ${c.note}`}
                className={`px-2 py-1.5 text-left leading-tight cursor-pointer transition-colors ${
                  c.id === p.traditionId ? 'bg-vellum text-ink border border-rule-strong' : 'text-ink-3 border border-transparent hover:text-ink'
                }`}
              >
                <span className="block font-serif text-[0.95rem] truncate">{c.short === 'SV' ? 'San Venanzio' : 'Grace'}</span>
                <span className="block font-sc text-[0.66rem] tracking-[0.06em] opacity-80 truncate">{c.note}</span>
              </button>
            ))}
          </div>
        )}
        <span
          className={`tag ${p.aiOn ? 'tag-vine' : 'tag-gold'} ${collapsed ? '!px-1.5 !text-[0.62rem]' : ''}`}
          title={p.aiTitle}
        >
          {collapsed ? (p.aiOn ? 'AI' : 'Off') : p.aiLabel}
        </span>
      </div>

      {/* The signed-in person */}
      <div className={`border-t border-rule ${collapsed ? 'py-3 flex flex-col items-center gap-1' : 'p-3 space-y-2'}`}>
        {collapsed ? (
          <>
            <span className="w-10 h-10 flex items-center justify-center border border-rule-strong text-rubric bg-paper" title={`${p.staffName} · ${ROLE_META[p.role].label}`}>
              <RoleIcon className="w-5 h-5" />
            </span>
            <button onClick={p.onSignOut} className="btn btn-ghost btn-sm !px-2" aria-label="Sign out" title="Sign out">
              <LogOut className="w-[18px] h-[18px]" />
            </button>
          </>
        ) : (
          <>
            <div className="flex items-center gap-3 p-2.5 bg-paper border border-rule">
              <span className="w-10 h-10 shrink-0 flex items-center justify-center border border-rule-strong text-rubric bg-vellum">
                <RoleIcon className="w-5 h-5" />
              </span>
              <span className="min-w-0 leading-tight">
                <span className="block font-serif text-[1.05rem] truncate">{p.staffName}</span>
                <span className="block font-sc text-[0.72rem] tracking-[0.08em] text-ink-3">{ROLE_META[p.role].label}</span>
              </span>
            </div>
            <div className="flex items-center justify-between gap-2">
              {p.canReset && (
                <button onClick={p.onReset} className="btn btn-ghost btn-sm" title="Reset the demo data">
                  <RotateCcw className="w-4 h-4" /> Reset
                </button>
              )}
              <button onClick={p.onSignOut} className="btn btn-ghost btn-sm">
                <LogOut className="w-4 h-4" /> Sign out
              </button>
            </div>
          </>
        )}
      </div>

      <style>{`
        .staff-sidebar { transition: width .28s cubic-bezier(.2,.7,.2,1); }
        .staff-sidebar .ribbon { clip-path: polygon(0 0, 100% 0, 100% 100%, 50% calc(100% - 6px), 0 100%); }
        @media (prefers-reduced-motion: reduce) { .staff-sidebar { transition: none; } }
      `}</style>
    </aside>
  );
}
