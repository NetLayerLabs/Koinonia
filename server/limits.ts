// Public-demo safeguards: how many AI calls one visitor can trigger, and the nightly reset.
// Every limit is per visitor address (the one the reverse proxy saw) over a sliding window.

type Bucket = { count: number; since: number };
const buckets = new Map<string, Bucket>();

const RULES = {
  // New prayer requests that get an AI summary and draft. Past this, requests are still
  // accepted and reach the pastor; they just skip the AI step. Crisis requests never count.
  careTriage: { max: 6, windowMs: 10 * 60 * 1000 },
  // Staff actions that call the AI (meaning check, glossary comparison).
  staffAi: { max: 30, windowMs: 10 * 60 * 1000 },
  // Publishing Sunday notes translates into 11 languages at once.
  publish: { max: 3, windowMs: 60 * 60 * 1000 },
} as const;

export type LimitName = keyof typeof RULES;

/** Takes one unit of budget; returns false when the visitor is over the limit. */
export function takeBudget(name: LimitName, client: string): boolean {
  const rule = RULES[name];
  const key = `${name}:${client}`;
  const now = Date.now();
  const b = buckets.get(key);
  if (!b || now - b.since > rule.windowMs) {
    buckets.set(key, { count: 1, since: now });
    return true;
  }
  if (b.count >= rule.max) return false;
  b.count += 1;
  return true;
}

/** Public demo mode: no manual reset; the demo resets itself every night instead. */
export function publicDemo(): boolean {
  return process.env.PUBLIC_DEMO?.trim().toLowerCase() === 'true';
}

/** Calls `reset` every day at RESET_HOUR_UTC (default 08:00 UTC = 3 AM New York). */
export function scheduleNightlyReset(reset: () => void): void {
  const hour = Number(process.env.RESET_HOUR_UTC ?? 8);
  const next = () => {
    const now = new Date();
    const at = new Date(Date.UTC(now.getUTCFullYear(), now.getUTCMonth(), now.getUTCDate(), hour, 0, 0));
    if (at.getTime() <= now.getTime()) at.setUTCDate(at.getUTCDate() + 1);
    return at.getTime() - now.getTime();
  };
  const loop = () =>
    setTimeout(() => {
      reset();
      console.log(`Nightly demo reset done (${new Date().toISOString()})`);
      loop();
    }, next());
  loop();
}
