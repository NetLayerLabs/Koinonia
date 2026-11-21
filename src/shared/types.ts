// Records exchanged between the browser and the local Koinonia server.
// The server never stores raw text with personal details: only the scrubbed version.

import type { CrisisKind } from './crisis.ts';
import type { GlossaryViolation } from './glossary.ts';
import type { LangCode, TraditionId } from './languages.ts';

export type CareCategory =
  | 'Homesickness & Student Transition'
  | 'Grief & Pastoral Visit'
  | 'Benevolence & Material Need'
  | 'Seeker Theological Q&A'
  | 'Prayer & Exam Anxiety';

export type CareUrgency = 'Immediate (Within 4h)' | 'High (Within 24h)' | 'Standard (Within 48h)';

export type AIMode = 'live' | 'sample';

export interface PIITokenCount {
  type: 'NAME' | 'PHONE' | 'EMAIL' | 'STUDENT_ID' | 'ADDRESS';
  redactedCount: number;
}

export interface DriftIssue {
  originalPhrase: string;
  backTranslatedPhrase: string;
  explanation: string;
  severity: 'minor' | 'major';
}

export interface ReplyCheck {
  pastorText: string;
  pastorLang: LangCode;
  nativeText: string;
  backTranslation: string | null;
  verdict: 'faithful' | 'minor_drift' | 'major_drift' | 'not_checked';
  issues: DriftIssue[];
  glossaryViolations: GlossaryViolation[];
  mode: AIMode;
  checkedAt: string;
}

export type CareStatus = 'pending' | 'approved' | 'crisis' | 'crisis-handled';

export interface CareRecord {
  id: string;
  tradition: TraditionId;
  createdAt: string;
  source: 'Pew QR Scan' | 'Campus Welcome Desk' | 'WhatsApp Bridge' | 'Weekly Check-In' | 'Test request';
  language: LangCode;
  redactedText: string;
  piiTokens: PIITokenCount[];
  status: CareStatus;
  pickupCode: string;
  mode: AIMode;
  // triage (absent for crisis records: the AI never drafts for those)
  category: CareCategory | null;
  urgency: CareUrgency;
  summaryForLeader: string;
  verseId: string | null;
  groupId: string | null;
  draftPastorText: string;
  check: ReplyCheck | null;
  // crisis lane
  crisisKinds: CrisisKind[];
  crisisReason: string;
  callbackNumber: string | null; // only if the attendee chose to leave one, for a human; never sent to AI
  handledNote: string | null;
  // release
  approvedReply: string | null;
  approvedBy: string | null;
  approvedAt: string | null;
}

export interface PickupView {
  code: string;
  status: CareStatus;
  language: LangCode;
  tradition: TraditionId;
  reply: string | null;
  approvedBy: string | null;
  approvedAt: string | null;
  verseId: string | null;
  groupId: string | null;
  createdAt: string;
}

export interface ScanStat {
  lang: LangCode;
  last30: number;
  prev30: number;
  byService: Record<string, number>;
  careRequests: number;
}

export interface InsightsResponse {
  tradition: TraditionId;
  totalLast30: number;
  stats: ScanStat[];
  includesSampleHistory: boolean;
}

export interface SermonTranslation {
  lang: LangCode;
  title: string;
  summary: string;
  takeaways: string[];
  glossaryViolations: GlossaryViolation[];
}

export interface PublishedSermon {
  tradition: TraditionId;
  scriptureId: string;
  publishedAt: string;
  publishedBy: string;
  mode: AIMode;
  translations: SermonTranslation[];
}

export interface StatusResponse {
  ai: boolean;
  model: string;
  provider: string;
  /** The public demo: manual reset is off and the demo resets itself nightly. */
  publicDemo?: boolean;
  lanAddresses: string[];
}
