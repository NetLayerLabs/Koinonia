import React, { useState } from 'react';
import { ArrowLeft } from 'lucide-react';
import { Wordmark } from './brand/Logo';
import { IconCare, IconCrook, IconDoor, IconPewCard } from './brand/Icons';
import { api, ApiError, type StaffMe } from '../lib/api';
import { go } from '../lib/router';
import { ROLE_META, type StaffRole } from '../shared/staff';

interface Props {
  me: StaffMe;
  onSignedIn: (me: StaffMe) => void;
}

const ROLE_ICON: Record<StaffRole, React.ComponentType<{ className?: string }>> = {
  pastor: IconCrook,
  care: IconCare,
  welcome: IconDoor,
};

/** Sign-in for church staff only. Attendees never see this: the pew page and pickup page stay open. */
export const StaffLogin: React.FC<Props> = ({ me, onSignedIn }) => {
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [busy, setBusy] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  const run = async (key: string, action: () => Promise<StaffMe>) => {
    setBusy(key);
    setError(null);
    try {
      const result = await action();
      setPassword('');
      onSignedIn(result);
    } catch (err) {
      setError(err instanceof ApiError ? err.message : 'Could not reach the Koinonia server.');
    } finally {
      setBusy(null);
    }
  };

  const submit = (e: React.FormEvent) => {
    e.preventDefault();
    void run('form', () => api.login(username.trim(), password));
  };

  const ready = username.trim() !== '' && password !== '';

  return (
    <div className="min-h-screen grid grid-cols-1 lg:grid-cols-[1.05fr_1fr]">
      {/* Left: the promise */}
      <aside className="relative overflow-hidden bg-nave text-vellum px-8 sm:px-12 lg:px-16 py-10 hidden lg:flex flex-col justify-between gap-12 min-h-screen">
        <SealArt />

        <button onClick={() => go('/')} className="relative w-fit cursor-pointer" aria-label="Koinonia home">
          <Wordmark tone="light" size="lg" greek />
        </button>

        <div className="relative space-y-7 max-w-xl">
          <p className="font-sc text-[0.85rem] tracking-[0.14em] text-[#e08a72]">For the people who answer</p>
          <h1 className="font-serif text-[2.6rem] sm:text-[3.4rem] xl:text-[4rem] leading-[1.02]">
            The AI translates.
            <br />
            The pastor decides.
            <br />
            <em className="text-[#e08a72]">The newcomer is heard.</em>
          </h1>
          <p className="text-[1.05rem] text-[#cbbfae] leading-relaxed max-w-lg">
            Each person on the team signs in with their own role. Only a pastor can release a reply, and the server enforces it. People in
            the pews never need an account: they read replies with a private pickup code.
          </p>
        </div>

        <p className="relative font-sc text-[0.78rem] tracking-[0.1em] text-[#8f8474]">Inspired by the Basilica di San Venanzio · Camerino</p>
      </aside>

      {/* Right: sign in */}
      <main className="min-h-[100dvh] lg:min-h-0 flex items-start lg:items-center justify-center px-5 sm:px-10 pt-5 pb-8 lg:py-12" style={{ paddingTop: 'max(20px, env(safe-area-inset-top))' }}>
        <div className="w-full max-w-[30rem] space-y-6 lg:space-y-8">
          {/* Phones: the dark panel is hidden, so the brand sits in a slim row here */}
          <div className="lg:hidden flex items-center justify-between">
            <button onClick={() => go('/')} className="cursor-pointer" aria-label="Koinonia home">
              <Wordmark size="sm" />
            </button>
            <span className="font-serif italic text-[0.95rem] text-rubric">The pastor decides.</span>
          </div>
          <div className="space-y-3">
            <p className="rubric">Church staff</p>
            <h2 className="font-serif text-[2.6rem] lg:text-5xl leading-none">Sign in</h2>
            <p className="text-ink-2 leading-relaxed">
              {me.demoLogin
                ? 'Demo accounts: one click to sign in. Open a second browser window as another role to see live updates.'
                : 'Use the username and password your church gave you.'}
            </p>
          </div>

          {!me.passcodeConfigured && !me.demoLogin && (
            <p className="border-l-4 border-gold bg-gold-wash px-4 py-3 text-sm text-ink">
              No staff password is set on this server yet. Add <code className="font-mono">STAFF_PASSCODE=…</code> to{' '}
              <code className="font-mono">.env.local</code>, save, and reload this page.
            </p>
          )}

          {me.demoLogin && me.accounts.length > 0 && (
            <>
              <div className="leaf divide-y divide-rule">
                {me.accounts.map((a) => {
                  const Icon = ROLE_ICON[a.role];
                  return (
                    <button
                      key={a.username}
                      title={ROLE_META[a.role].summary}
                      onClick={() => void run(a.username, () => api.demoLogin(a.username))}
                      disabled={busy !== null}
                      className="group w-full flex items-center gap-4 px-4 py-3 lg:py-4 text-left border-l-2 border-transparent hover:border-rubric hover:bg-parchment transition-colors cursor-pointer disabled:opacity-60"
                    >
                      <span className="w-11 h-11 shrink-0 flex items-center justify-center border border-rule-strong text-rubric bg-paper">
                        <Icon className="w-6 h-6" />
                      </span>
                      <span className="flex-1 min-w-0">
                        <span className="block font-serif text-[1.2rem] leading-tight">{busy === a.username ? 'Signing in…' : a.name}</span>
                        <span className="block font-sc text-[0.8rem] tracking-[0.06em] text-ink-3">{ROLE_META[a.role].label}</span>
                      </span>
                      <span className="font-mono text-xs text-ink-3">{a.username}</span>
                    </button>
                  );
                })}
              </div>

              <div className="flex items-center gap-3 rubric-ink">
                <span className="h-px flex-1 bg-rule" /> or <span className="h-px flex-1 bg-rule" />
              </div>
            </>
          )}

          <form onSubmit={submit} className="space-y-3">
            <input
              value={username}
              onChange={(e) => setUsername(e.target.value)}
              autoComplete="username"
              autoCapitalize="none"
              spellCheck={false}
              placeholder="Username"
              aria-label="Username"
              className="field !py-3 !text-base"
            />
            <input
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              autoComplete="current-password"
              placeholder="Password"
              aria-label="Password"
              className="field !py-3 !text-base"
            />
            {error && <p className="text-sm font-semibold text-alarm">{error}</p>}
            <button type="submit" disabled={!ready || busy !== null} className="btn btn-ink btn-lg w-full">
              {busy === 'form' ? 'Signing in…' : 'Sign in'}
            </button>
          </form>

          <div className="rule pt-4 flex flex-wrap items-center justify-between gap-3 text-sm">
            <button onClick={() => go('/')} className="inline-flex items-center gap-1.5 text-ink-2 hover:text-ink cursor-pointer">
              <ArrowLeft className="w-4 h-4" /> Back to home
            </button>
            <button
              onClick={() => go('/pew?church=san-venanzio-unicam')}
              className="inline-flex items-center gap-1.5 text-rubric hover:text-rubric-deep cursor-pointer"
            >
              <IconPewCard className="w-4 h-4" /> In the pews? No account needed
            </button>
          </div>
        </div>
      </main>
    </div>
  );
};

/** A large, faint vesica seal behind the headline, with the name running round it. */
function SealArt() {
  return (
    <svg
      aria-hidden
      viewBox="0 0 600 600"
      className="pointer-events-none absolute -right-48 -bottom-40 w-[44rem] h-[44rem] text-vellum/[0.07]"
      fill="none"
      stroke="currentColor"
    >
      <defs>
        <path id="koinonia-seal-ring" d="M300,300 m-268,0 a268,268 0 1,1 536,0 a268,268 0 1,1 -536,0" />
      </defs>
      <circle cx="300" cy="300" r="290" strokeWidth="1.2" />
      <circle cx="300" cy="300" r="246" strokeWidth="1" strokeDasharray="1 7" />
      <circle cx="250" cy="300" r="100" strokeWidth="1.6" />
      <circle cx="350" cy="300" r="100" strokeWidth="1.6" />
      <path d="M300 213.4A100 100 0 0 1 300 386.6 100 100 0 0 1 300 213.4Z" fill="currentColor" stroke="none" />
      <text fill="currentColor" stroke="none" fontSize="21" letterSpacing="10" fontFamily="Alegreya, serif">
        <textPath href="#koinonia-seal-ring">ΚΟΙΝΩΝΙΑ · EVERY NEWCOMER HEARD · IN THEIR OWN LANGUAGE · </textPath>
      </text>
    </svg>
  );
}
