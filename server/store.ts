// Tiny JSON-file store. Holds only scrubbed text, counts and settings: never raw personal details.

import { mkdirSync, readFileSync, writeFileSync, existsSync } from 'node:fs';
import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';
import type { Glossary } from '../src/shared/glossary.ts';
import type { LangCode, TraditionId } from '../src/shared/languages.ts';
import type { CareRecord, PublishedSermon } from '../src/shared/types.ts';

export interface StoredSession {
  username?: string;
  name: string;
  role?: string;
  expiresAt: string;
}

export interface ScanRecord {
  tradition: TraditionId;
  lang: LangCode;
  at: string;
  sample?: boolean;
}

export interface StoreShape {
  care: CareRecord[];
  scans: ScanRecord[];
  glossaries: Partial<Record<TraditionId, Glossary>>;
  cues: Partial<Record<TraditionId, { index: number; updatedAt: string }>>;
  sermons: Partial<Record<TraditionId, PublishedSermon>>;
  seededCare: Partial<Record<TraditionId, boolean>>;
  seededScans: Partial<Record<TraditionId, boolean>>;
  /** Staff sign-ins, keyed by the SHA-256 of the session token (never the token itself). */
  sessions: Record<string, StoredSession>;
}

const here = dirname(fileURLToPath(import.meta.url));
const FILE = join(here, 'data', 'store.json');

function empty(): StoreShape {
  return { care: [], scans: [], glossaries: {}, cues: {}, sermons: {}, seededCare: {}, seededScans: {}, sessions: {} };
}

function load(): StoreShape {
  if (!existsSync(FILE)) return empty();
  try {
    return { ...empty(), ...JSON.parse(readFileSync(FILE, 'utf8')) };
  } catch {
    return empty();
  }
}

export const db: StoreShape = load();

let timer: NodeJS.Timeout | null = null;
export function save(): void {
  if (timer) return;
  timer = setTimeout(() => {
    timer = null;
    mkdirSync(dirname(FILE), { recursive: true });
    writeFileSync(FILE, JSON.stringify(db, null, 2));
  }, 150);
}

export function resetAll(): void {
  // Keeps staff sign-ins, so whoever pressed "Reset demo" stays signed in.
  Object.assign(db, { ...empty(), sessions: db.sessions });
  save();
}
