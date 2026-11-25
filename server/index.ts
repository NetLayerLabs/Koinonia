// Koinonia local server: AI calls (API key stays here, never in the browser), the care queue,
// pickup codes, the crisis fast lane, glossaries, language insights and live service cues.
// Run with: node --env-file-if-exists=.env --env-file-if-exists=.env.local server/index.ts

import { clientIp, demoLoginEnabled, login, logout, passcodeConfigured, staffFor, type StaffSession } from './auth.ts';
import { speak, TtsError, ttsEnabled } from './tts.ts';
import { publicDemo, scheduleNightlyReset, takeBudget } from './limits.ts';
import { can, ROLE_META, STAFF_ACCOUNTS, type Permission } from '../src/shared/staff.ts';
import { createServer, type IncomingMessage, type ServerResponse } from 'node:http';
import { networkInterfaces } from 'node:os';
import { randomInt, randomUUID } from 'node:crypto';
import {
  AIUnavailable,
  aiModel,
  aiProviderLabel,
  checkModelAvailable,
  aiEnabled,
  backTranslate,
  compareMeaning,
  translate,
  translateSermon,
  triageRequest,
} from './ai.ts';
import { sampleDraft, sampleNative, sampleTriage } from './sample.ts';
import { db, resetAll, save, type ScanRecord } from './store.ts';
import { screenForCrisis } from '../src/shared/crisis.ts';
import { checkGlossary, defaultGlossary, glossaryPrompt, type Glossary } from '../src/shared/glossary.ts';
import { LANG_CODES, LANG_NAMES, TRADITION_META, isLang, isTradition, type LangCode, type TraditionId } from '../src/shared/languages.ts';
import { SERVICE_ROSTER, serviceForHour } from '../src/shared/roster.ts';
import type {
  CareRecord,
  InsightsResponse,
  PickupView,
  PublishedSermon,
  ReplyCheck,
  ScanStat,
  SermonTranslation,
  StatusResponse,
} from '../src/shared/types.ts';

const PORT = Number(process.env.KOINONIA_API_PORT || 8787);

// ---------- helpers ----------

class HttpError extends Error {
  status: number;
  constructor(status: number, message: string) {
    super(message);
    this.status = status;
  }
}

function send(res: ServerResponse, status: number, body: unknown): void {
  res.writeHead(status, { 'content-type': 'application/json; charset=utf-8', 'cache-control': 'no-store' });
  res.end(JSON.stringify(body));
}

async function readJson(req: IncomingMessage): Promise<Record<string, unknown>> {
  const chunks: Buffer[] = [];
  let size = 0;
  for await (const chunk of req) {
    size += (chunk as Buffer).length;
    if (size > 1_000_000) throw new HttpError(413, 'Request too large');
    chunks.push(chunk as Buffer);
  }
  if (chunks.length === 0) return {};
  try {
    return JSON.parse(Buffer.concat(chunks).toString('utf8'));
  } catch {
    throw new HttpError(400, 'Invalid JSON');
  }
}

function str(value: unknown, field: string, max = 4000): string {
  if (typeof value !== 'string' || value.trim() === '') throw new HttpError(400, `Missing ${field}`);
  return value.slice(0, max);
}

function tradition(value: unknown): TraditionId {
  if (!isTradition(value)) throw new HttpError(400, 'Unknown church profile');
  return value;
}

function lang(value: unknown, field = 'language'): LangCode {
  if (!isLang(value)) throw new HttpError(400, `Unknown ${field}`);
  return value;
}

const CODE_ALPHABET = 'ABCDEFGHJKMNPQRSTUVWXYZ23456789';
function newPickupCode(): string {
  for (;;) {
    let raw = '';
    for (let i = 0; i < 6; i++) raw += CODE_ALPHABET[randomInt(CODE_ALPHABET.length)];
    const code = `${raw.slice(0, 3)}-${raw.slice(3)}`;
    if (!db.care.some((c) => c.pickupCode === code)) return code;
  }
}

function glossaryFor(t: TraditionId): Glossary {
  if (!db.glossaries[t]) db.glossaries[t] = defaultGlossary(t);
  return db.glossaries[t] as Glossary;
}

function lanAddresses(): string[] {
  const out: string[] = [];
  for (const list of Object.values(networkInterfaces())) {
    for (const addr of list ?? []) {
      if (addr.family === 'IPv4' && !addr.internal) out.push(addr.address);
    }
  }
  return out;
}

// ---------- live events (server-sent events) ----------

type Listener = { res: ServerResponse; role: string };
const listeners: Record<TraditionId, Set<Listener>> = {
  'san-venanzio-unicam': new Set(),
  'grace-fellowship-us': new Set(),
};

// Care and crisis alerts only go to signed-in staff; cues, presence and sermons go to everyone.
const STAFF_ONLY_EVENTS = new Set(['care', 'crisis']);

function broadcast(t: TraditionId, event: string, data: unknown): void {
  const payload = `event: ${event}\ndata: ${JSON.stringify(data)}\n\n`;
  const staffOnly = STAFF_ONLY_EVENTS.has(event);
  for (const l of listeners[t]) if (!staffOnly || l.role === 'staff') l.res.write(payload);
}

function followerCount(t: TraditionId): number {
  return [...listeners[t]].filter((l) => l.role === 'pew').length;
}

function broadcastPresence(t: TraditionId): void {
  broadcast(t, 'presence', { pewFollowers: followerCount(t) });
}

// ---------- sample scan history (clearly flagged) ----------

function seedScanHistory(t: TraditionId): void {
  if (db.seededScans[t]) return;
  db.seededScans[t] = true;
  let seed = t === 'san-venanzio-unicam' ? 17 : 41;
  const rand = () => {
    seed = (seed * 1103515245 + 12345) % 2147483648;
    return seed / 2147483648;
  };
  // per-Sunday averages for the earlier month and the latest month, and the preferred service
  const plan: Partial<Record<LangCode, [number, number, number]>> =
    t === 'san-venanzio-unicam'
      ? { it: [16, 17, 1], en: [13, 14, 0], es: [5, 5, 1], fr: [4, 4, 0], zh: [3, 3, 0], ar: [2, 5, 0], uk: [3, 3, 0], pl: [2, 2, 1], sw: [2, 2, 0], pt: [2, 2, 1], ko: [1, 1, 0], vi: [1, 1, 0] }
      : { en: [24, 25, 0], es: [11, 12, 0], ko: [2, 5, 0], ar: [2, 3, 0], zh: [3, 3, 1], vi: [2, 2, 0], pt: [2, 2, 0], fr: [1, 1, 1], sw: [1, 1, 0] };
  const slots = SERVICE_ROSTER[t];
  const now = new Date();
  for (let daysAgo = 59; daysAgo >= 1; daysAgo--) {
    const day = new Date(now);
    day.setDate(now.getDate() - daysAgo);
    if (day.getDay() !== 0) continue; // Sundays only
    const recent = daysAgo <= 30;
    for (const code of LANG_CODES) {
      const p = plan[code];
      if (!p) continue;
      const avg = recent ? p[1] : p[0];
      const count = Math.max(0, Math.round(avg + (rand() - 0.5) * 2));
      for (let i = 0; i < count; i++) {
        const slot = rand() < 0.8 ? slots[p[2]] : slots[1 - p[2]];
        const at = new Date(day);
        at.setHours(slot.startHour, Math.floor(rand() * 60) + 30, 0, 0);
        db.scans.push({ tradition: t, lang: code, at: at.toISOString(), sample: true });
      }
    }
  }
  save();
}

function insights(t: TraditionId): InsightsResponse {
  seedScanHistory(t);
  const now = Date.now();
  const day = 86_400_000;
  const scans = db.scans.filter((s) => s.tradition === t);
  const stats: ScanStat[] = LANG_CODES.map((code) => {
    const mine = scans.filter((s) => s.lang === code);
    const last = mine.filter((s) => now - Date.parse(s.at) <= 30 * day);
    const prev = mine.filter((s) => {
      const age = now - Date.parse(s.at);
      return age > 30 * day && age <= 60 * day;
    });
    const byService: Record<string, number> = {};
    for (const s of last) {
      const slot = serviceForHour(t, new Date(s.at).getHours());
      const key = slot ? slot.id : 'other';
      byService[key] = (byService[key] ?? 0) + 1;
    }
    return {
      lang: code,
      last30: last.length,
      prev30: prev.length,
      byService,
      careRequests: db.care.filter((c) => c.tradition === t && c.language === code).length,
    };
  }).filter((s) => s.last30 + s.prev30 + s.careRequests > 0);
  return {
    tradition: t,
    totalLast30: stats.reduce((n, s) => n + s.last30, 0),
    stats: stats.sort((a, b) => b.last30 - a.last30),
    includesSampleHistory: scans.some((s) => s.sample),
  };
}

// ---------- care flow ----------

function pickupView(c: CareRecord): PickupView {
  return {
    code: c.pickupCode,
    status: c.status,
    language: c.language,
    tradition: c.tradition,
    reply: c.status === 'approved' ? c.approvedReply : null,
    approvedBy: c.status === 'approved' ? c.approvedBy : null,
    approvedAt: c.status === 'approved' ? c.approvedAt : null,
    verseId: c.status === 'approved' ? c.verseId : null,
    groupId: c.status === 'approved' ? c.groupId : null,
    createdAt: c.createdAt,
  };
}

async function createCare(body: Record<string, unknown>, client: string): Promise<CareRecord> {
  const t = tradition(body.tradition);
  const language = lang(body.language);
  const pastorLang = lang(body.pastorLanguage ?? 'en', 'pastor language');
  const redactedText = str(body.redactedText, 'request text');
  const leaderName = str(body.leaderName, 'leader name', 200);
  const verses = Array.isArray(body.verses) ? (body.verses as { id: string; reference: string; theme: string }[]) : [];
  const groups = Array.isArray(body.groups)
    ? (body.groups as { id: string; name: string; languages: string[]; schedule: string; audience: string }[])
    : [];
  // Counts only (what kind of detail was removed on the phone, and how many): keep the shape strict.
  const piiTokens: CareRecord['piiTokens'] = (Array.isArray(body.piiTokens) ? body.piiTokens : [])
    .slice(0, 20)
    .filter((x): x is { type: string; redactedCount: number } =>
      Boolean(x) && typeof (x as { type?: unknown }).type === 'string' && Number.isInteger((x as { redactedCount?: unknown }).redactedCount))
    .map((x) => ({ type: x.type.slice(0, 40), redactedCount: Math.max(0, Math.min(1000, x.redactedCount)) })) as CareRecord['piiTokens'];
  const source = body.source === 'Test request' ? 'Test request' : 'Pew QR Scan';

  const base: CareRecord = {
    id: randomUUID(),
    tradition: t,
    createdAt: new Date().toISOString(),
    source,
    language,
    redactedText,
    piiTokens,
    status: 'pending',
    pickupCode: newPickupCode(),
    mode: aiEnabled() ? 'live' : 'sample',
    category: null,
    urgency: 'Standard (Within 48h)',
    summaryForLeader: '',
    verseId: null,
    groupId: null,
    draftPastorText: '',
    check: null,
    crisisKinds: [],
    crisisReason: '',
    callbackNumber: null,
    handledNote: null,
    approvedReply: null,
    approvedBy: null,
    approvedAt: null,
  };

  // 1. Deterministic crisis screen first: a match never reaches the AI drafting step.
  const screen = screenForCrisis(redactedText);
  if (screen.isCrisis) {
    return {
      ...base,
      status: 'crisis',
      urgency: 'Immediate (Within 4h)',
      crisisKinds: screen.kinds,
      crisisReason: `Matched: ${screen.matched.slice(0, 4).join(', ')}`,
      summaryForLeader: 'Crisis signals detected in the attendee’s own words. No AI reply was drafted. Read the request and contact a human now.',
    };
  }

  // 2. AI triage and draft (or clearly-labelled sample output when AI is off).
  // On the public demo each visitor has an AI budget; past it the request is still accepted
  // and reaches the pastor, it just skips the AI step. Nobody asking for help is turned away.
  const meta = TRADITION_META[t];
  const withinBudget = takeBudget('careTriage', client);
  // If the AI does not answer in time, the request is still accepted and reaches the pastor
  // without an AI summary: nobody asking for help is turned away because of an outage.
  let triage: Awaited<ReturnType<typeof triageRequest>> | null = null;
  let aiFailed = false;
  if (aiEnabled() && withinBudget) {
    try {
      triage = await triageRequest({
        redactedText,
        attendeeLanguage: LANG_NAMES[language],
        pastorLanguage: LANG_NAMES[pastorLang],
        traditionLabel: `${meta.churchName} - ${meta.label}`,
        leaderName,
        verses,
        groups,
      });
    } catch (error) {
      if (!(error instanceof AIUnavailable)) throw error;
      console.warn(`Triage skipped: ${error.message}`);
      aiFailed = true;
    }
  }
  if (triage) {
    if (triage.safety_concern) {
      return {
        ...base,
        status: 'crisis',
        urgency: 'Immediate (Within 4h)',
        crisisKinds: ['immediate-danger'],
        crisisReason: `AI safety check: ${triage.safety_reason}`,
        summaryForLeader: 'The AI safety check flagged this request. No reply was drafted. Read it and contact a human now.',
      };
    }
    const verseId = verses.some((v) => v.id === triage.verse_id) ? triage.verse_id : verses[0]?.id ?? null;
    const groupId = groups.some((g) => g.id === triage.group_id) ? triage.group_id : null;
    return {
      ...base,
      category: triage.category,
      urgency: triage.urgency,
      summaryForLeader: triage.summary_for_leader,
      verseId,
      groupId,
      draftPastorText: triage.draft_reply,
    };
  }

  const sample = sampleTriage(redactedText);
  const group = groups.find((g) => g.languages.includes(language)) ?? groups[0];
  return {
    ...base,
    category: sample.category,
    urgency: sample.urgency,
    mode: 'sample',
    summaryForLeader: `${aiFailed ? '[No AI summary - the AI service did not answer in time]' : aiEnabled() ? '[No AI summary - this visitor reached the demo limit]' : '[Sample - AI is off]'} Request written in ${LANG_NAMES[language]}: “${redactedText.slice(0, 220)}${redactedText.length > 220 ? '…' : ''}”`,
    verseId: verses.some((v) => v.id === sample.verseId) ? sample.verseId : verses[0]?.id ?? null,
    groupId: group?.id ?? null,
    draftPastorText: sampleDraft(pastorLang, group?.name ?? 'our welcome group'),
  };
}

async function runCheck(c: CareRecord, pastorText: string, pastorLang: LangCode, groupName: string): Promise<ReplyCheck> {
  const glossary = glossaryFor(c.tradition);
  const meta = TRADITION_META[c.tradition];
  if (!aiEnabled()) {
    const nativeText =
      c.language === pastorLang ? pastorText : sampleNative(c.language, groupName, meta.family === 'Catholic');
    return {
      pastorText,
      pastorLang,
      nativeText,
      backTranslation: null,
      verdict: 'not_checked',
      issues: [],
      glossaryViolations: checkGlossary(glossary, c.language, nativeText),
      mode: 'sample',
      checkedAt: new Date().toISOString(),
    };
  }
  const nativeText =
    c.language === pastorLang
      ? pastorText
      : await translate({
          text: pastorText,
          from: LANG_NAMES[pastorLang],
          to: LANG_NAMES[c.language],
          traditionLabel: `${meta.churchName} - ${meta.label}`,
          glossary: glossaryPrompt(glossary, c.language),
        });
  let backTranslation: string | null = null;
  let verdict: ReplyCheck['verdict'] = 'faithful';
  let issues: ReplyCheck['issues'] = [];
  if (c.language !== pastorLang) {
    backTranslation = await backTranslate({ text: nativeText, from: LANG_NAMES[c.language], to: LANG_NAMES[pastorLang] });
    const drift = await compareMeaning({ original: pastorText, backTranslation, language: LANG_NAMES[pastorLang] });
    verdict = drift.verdict;
    issues = drift.issues.map((i) => ({
      originalPhrase: i.original_phrase,
      backTranslatedPhrase: i.back_translated_phrase,
      explanation: i.explanation,
      severity: i.severity,
    }));
  }
  return {
    pastorText,
    pastorLang,
    nativeText,
    backTranslation,
    verdict,
    issues,
    glossaryViolations: checkGlossary(glossary, c.language, nativeText),
    mode: 'live',
    checkedAt: new Date().toISOString(),
  };
}

// ---------- routes ----------

async function route(req: IncomingMessage, res: ServerResponse): Promise<void> {
  const url = new URL(req.url ?? '/', 'http://localhost');
  const path = url.pathname;
  const method = req.method ?? 'GET';
  const q = (name: string) => url.searchParams.get(name);
  const staff = staffFor(req);
  const requireStaff = (permission?: Permission): StaffSession => {
    if (!staff) throw new HttpError(401, 'Please sign in as church staff.');
    if (permission && !can(staff.role, permission)) {
      throw new HttpError(403, `Your role (${ROLE_META[staff.role].label}) cannot do this. ${ROLE_META[staff.role].summary}.`);
    }
    return staff;
  };
  const meBody = (s: StaffSession | null) => ({
    signedIn: Boolean(s),
    username: s?.username ?? null,
    name: s?.name ?? null,
    role: s?.role ?? null,
    passcodeConfigured: passcodeConfigured(),
    demoLogin: demoLoginEnabled(),
    // Account list is only shown when one-click demo sign-in is on.
    accounts: demoLoginEnabled() ? STAFF_ACCOUNTS : [],
  });

  if (method === 'GET' && path === '/api/status') {
    const body: StatusResponse = { ai: aiEnabled(), model: aiModel(), provider: aiProviderLabel(), lanAddresses: publicDemo() ? [] : lanAddresses(), publicDemo: publicDemo() };
    return send(res, 200, body);
  }

  // Read-aloud in a native voice (public text only; see server/tts.ts)
  if (method === 'POST' && path === '/api/tts') {
    const body = await readJson(req);
    let audio: Buffer;
    try {
      audio = await speak({
        text: str(body.text, 'text', 4000),
        lang: lang(body.lang),
        tradition: tradition(body.tradition),
        client: clientIp(req),
      });
    } catch (e) {
      if (e instanceof TtsError) throw new HttpError(e.status, e.message);
      throw e;
    }
    res.writeHead(200, { 'content-type': 'audio/mpeg', 'cache-control': 'private, max-age=86400', 'content-length': audio.length });
    res.end(audio);
    return;
  }

  // Staff sign-in (attendees never sign in)
  if (method === 'GET' && path === '/api/me') {
    return send(res, 200, meBody(staff));
  }

  if (method === 'POST' && path === '/api/login') {
    const body = await readJson(req);
    const result = login(req, res, {
      username: str(body.username, 'username', 100),
      password: typeof body.password === 'string' ? body.password : '',
      demo: body.demo === true,
    });
    if (!result.ok) throw new HttpError(result.status, result.error);
    return send(res, 200, meBody(result.session));
  }

  if (method === 'POST' && path === '/api/logout') {
    logout(req, res);
    return send(res, 200, meBody(null));
  }

  // Live events
  if (method === 'GET' && path === '/api/events') {
    const t = tradition(q('tradition'));
    const role = q('role') === 'pew' ? 'pew' : 'staff';
    if (role === 'staff') requireStaff();
    res.writeHead(200, {
      'content-type': 'text/event-stream',
      'x-accel-buffering': 'no', // tell nginx not to buffer live events
      'cache-control': 'no-store',
      connection: 'keep-alive',
    });
    res.write(`event: hello\ndata: ${JSON.stringify({ cue: db.cues[t] ?? { index: 0 }, pewFollowers: followerCount(t) })}\n\n`);
    const listener: Listener = { res, role };
    listeners[t].add(listener);
    broadcastPresence(t);
    const ping = setInterval(() => res.write(': ping\n\n'), 25_000);
    req.on('close', () => {
      clearInterval(ping);
      listeners[t].delete(listener);
      broadcastPresence(t);
    });
    return;
  }

  // Scans (counts only: language + time, nothing about the person)
  if (method === 'POST' && path === '/api/scan') {
    const body = await readJson(req);
    const record: ScanRecord = { tradition: tradition(body.tradition), lang: lang(body.lang), at: new Date().toISOString() };
    db.scans.push(record);
    save();
    return send(res, 200, { ok: true });
  }

  if (method === 'GET' && path === '/api/insights') {
    requireStaff('insights:read');
    return send(res, 200, insights(tradition(q('tradition'))));
  }

  // Care queue
  if (method === 'GET' && path === '/api/care') {
    requireStaff('care:read');
    const t = tradition(q('tradition'));
    const items = db.care.filter((c) => c.tradition === t).sort((a, b) => b.createdAt.localeCompare(a.createdAt));
    return send(res, 200, { items, seeded: Boolean(db.seededCare[t]) });
  }

  if (method === 'POST' && path === '/api/care/seed') {
    requireStaff('care:read');
    const body = await readJson(req);
    const t = tradition(body.tradition);
    if (!db.seededCare[t] && Array.isArray(body.items)) {
      for (const raw of body.items as CareRecord[]) {
        db.care.push({ ...raw, id: randomUUID(), tradition: t, pickupCode: newPickupCode() });
      }
      db.seededCare[t] = true;
      save();
      broadcast(t, 'care', { seeded: true });
    }
    return send(res, 200, { ok: true });
  }

  if (method === 'POST' && path === '/api/care') {
    const body = await readJson(req);
    const record = await createCare(body, clientIp(req));
    db.care.push(record);
    save();
    broadcast(record.tradition, 'care', { id: record.id });
    if (record.status === 'crisis') broadcast(record.tradition, 'crisis', { id: record.id, language: record.language });
    return send(res, 200, { record: pickupView(record), crisis: record.status === 'crisis' });
  }

  const careMatch = path.match(/^\/api\/care\/([\w-]+)\/(check|approve|handled|draft)$/);
  if (method === 'POST' && careMatch) {
    const me = requireStaff(careMatch[2] === 'approve' ? 'care:approve' : careMatch[2] === 'handled' ? 'crisis:handle' : 'care:draft');
    const c = db.care.find((x) => x.id === careMatch[1]);
    if (!c) throw new HttpError(404, 'Request not found');
    const body = await readJson(req);
    const action = careMatch[2];

    if (action === 'draft') {
      c.draftPastorText = str(body.pastorText, 'reply', 6000);
      save();
      return send(res, 200, { record: c });
    }

    if (action === 'check') {
      if (aiEnabled() && !takeBudget('staffAi', clientIp(req))) {
        throw new HttpError(429, 'The demo limit for AI checks was reached from this device. Please try again in a few minutes.');
      }
      if (c.status === 'crisis' || c.status === 'crisis-handled') throw new HttpError(409, 'Crisis requests are answered by a person, not drafted.');
      const pastorText = str(body.pastorText, 'reply', 6000);
      const pastorLang = lang(body.pastorLanguage ?? 'en', 'pastor language');
      c.draftPastorText = pastorText;
      c.check = await runCheck(c, pastorText, pastorLang, typeof body.groupName === 'string' ? body.groupName : 'our welcome group');
      save();
      broadcast(c.tradition, 'care', { id: c.id });
      return send(res, 200, { record: c });
    }

    if (action === 'approve') {
      if (c.status === 'crisis' || c.status === 'crisis-handled') throw new HttpError(409, 'Crisis requests are answered by a person, not drafted.');
      if (!c.check) throw new HttpError(409, 'Run the translation and meaning check first.');
      if (str(body.pastorText, 'reply', 6000) !== c.check.pastorText) {
        throw new HttpError(409, 'The reply changed after the last check. Run the check again.');
      }
      if (c.check.verdict === 'major_drift' && body.acknowledgedDrift !== true) {
        throw new HttpError(409, 'The check found a major change in meaning. Review it and confirm before approving.');
      }
      c.status = 'approved';
      c.approvedReply = c.check.nativeText;
      c.approvedBy = me.name; // from the sign-in, not from the request body
      c.approvedAt = new Date().toISOString();
      save();
      broadcast(c.tradition, 'care', { id: c.id });
      return send(res, 200, { record: c });
    }

    if (action === 'handled') {
      c.status = 'crisis-handled';
      c.handledNote = str(body.note, 'note', 1000);
      save();
      broadcast(c.tradition, 'care', { id: c.id });
      return send(res, 200, { record: c });
    }
  }

  // Pickup codes (the attendee's only link to the reply: no contact details needed)
  const pickupMatch = path.match(/^\/api\/pickup\/([A-Z0-9-]{7})(\/callback)?$/i);
  if (pickupMatch) {
    const code = pickupMatch[1].toUpperCase();
    const c = db.care.find((x) => x.pickupCode === code);
    if (!c) throw new HttpError(404, 'No request with that code.');
    if (method === 'GET' && !pickupMatch[2]) return send(res, 200, pickupView(c));
    if (method === 'POST' && pickupMatch[2]) {
      if (c.status !== 'crisis' && c.status !== 'crisis-handled') throw new HttpError(409, 'Callback numbers are only for urgent requests.');
      const body = await readJson(req);
      c.callbackNumber = str(body.phone, 'phone number', 40);
      save();
      broadcast(c.tradition, 'crisis', { id: c.id, language: c.language, callback: true });
      return send(res, 200, { ok: true });
    }
  }

  // Glossary
  if (method === 'GET' && path === '/api/glossary') {
    return send(res, 200, glossaryFor(tradition(q('tradition'))));
  }
  if (method === 'PUT' && path === '/api/glossary') {
    const me = requireStaff('glossary:approve');
    const body = await readJson(req);
    const t = tradition(body.tradition);
    const current = glossaryFor(t);
    const terms = Array.isArray(body.terms) ? (body.terms as Glossary['terms']) : current.terms;
    db.glossaries[t] = {
      tradition: t,
      terms,
      approvedBy: typeof body.approvedBy === 'string' ? me.name : current.approvedBy,
      approvedAt: typeof body.approvedBy === 'string' ? new Date().toISOString() : current.approvedAt,
    };
    save();
    return send(res, 200, db.glossaries[t]);
  }
  if (method === 'POST' && path === '/api/glossary/preview') {
    requireStaff('glossary:preview');
    if (!takeBudget('staffAi', clientIp(req))) {
      throw new HttpError(429, 'The demo limit for AI comparisons was reached from this device. Please try again in a few minutes.');
    }
    // Same text translated with and without the glossary, to show what it changes.
    const body = await readJson(req);
    const t = tradition(body.tradition);
    const target = lang(body.lang);
    const from = lang(body.pastorLanguage ?? 'en', 'pastor language');
    const text = str(body.text, 'text', 3000);
    const glossary = glossaryFor(t);
    if (!aiEnabled()) throw new HttpError(503, 'AI is off: add ZEROG_API_KEY (or ANTHROPIC_API_KEY) to .env.local to compare live translations.');
    const meta = TRADITION_META[t];
    const traditionLabel = `${meta.churchName} - ${meta.label}`;
    const [without, withGlossary] = await Promise.all([
      translate({ text, from: LANG_NAMES[from], to: LANG_NAMES[target], traditionLabel: 'a church', glossary: '' }),
      translate({ text, from: LANG_NAMES[from], to: LANG_NAMES[target], traditionLabel, glossary: glossaryPrompt(glossary, target) }),
    ]);
    return send(res, 200, {
      without,
      withGlossary,
      violationsWithout: checkGlossary(glossary, target, without),
      violationsWith: checkGlossary(glossary, target, withGlossary),
    });
  }

  // Live service cues
  if (method === 'GET' && path === '/api/cues') {
    const t = tradition(q('tradition'));
    return send(res, 200, { ...(db.cues[t] ?? { index: 0, updatedAt: null }), pewFollowers: followerCount(t) });
  }
  if (method === 'POST' && path === '/api/cues') {
    requireStaff('cues:send');
    const body = await readJson(req);
    const t = tradition(body.tradition);
    const index = Number(body.index);
    if (!Number.isInteger(index) || index < 0 || index > 50) throw new HttpError(400, 'Bad step index');
    db.cues[t] = { index, updatedAt: new Date().toISOString() };
    save();
    broadcast(t, 'cue', db.cues[t]);
    return send(res, 200, db.cues[t]);
  }

  // Sermon publishing (AI translation into every pew language, glossary-checked)
  if (method === 'GET' && path === '/api/sermon') {
    return send(res, 200, db.sermons[tradition(q('tradition'))] ?? null);
  }
  if (method === 'POST' && path === '/api/sermon/publish') {
    const me = requireStaff('sermon:publish');
    if (aiEnabled() && !takeBudget('publish', clientIp(req))) {
      throw new HttpError(429, 'Publishing is limited to 3 times an hour on the public demo. Please try again later.');
    }
    const body = await readJson(req);
    const t = tradition(body.tradition);
    const title = str(body.title, 'title', 300);
    const summary = str(body.summary, 'summary', 4000);
    const takeaways = Array.isArray(body.takeaways) ? (body.takeaways as string[]).filter((x) => typeof x === 'string' && x.trim()).slice(0, 5) : [];
    const sourceLang = lang(body.sourceLanguage ?? 'en', 'source language');
    const glossary = glossaryFor(t);
    const meta = TRADITION_META[t];
    let translations: SermonTranslation[];
    let mode: PublishedSermon['mode'] = 'live';
    if (aiEnabled()) {
      translations = await Promise.all(
        LANG_CODES.map(async (code): Promise<SermonTranslation> => {
          if (code === sourceLang) return { lang: code, title, summary, takeaways, glossaryViolations: checkGlossary(glossary, code, `${title} ${summary} ${takeaways.join(' ')}`) };
          const out = await translateSermon({
            title,
            summary,
            takeaways,
            to: LANG_NAMES[code],
            traditionLabel: `${meta.churchName} - ${meta.label}`,
            glossary: glossaryPrompt(glossary, code),
          });
          return {
            lang: code,
            title: out.title,
            summary: out.summary,
            takeaways: out.takeaways,
            glossaryViolations: checkGlossary(glossary, code, `${out.title} ${out.summary} ${out.takeaways.join(' ')}`),
          };
        })
      );
    } else {
      mode = 'sample';
      translations = [{ lang: sourceLang, title, summary, takeaways, glossaryViolations: [] }];
    }
    const published: PublishedSermon = {
      tradition: t,
      scriptureId: str(body.scriptureId, 'scripture', 100),
      publishedAt: new Date().toISOString(),
      publishedBy: me.name,
      mode,
      translations,
    };
    db.sermons[t] = published;
    save();
    broadcast(t, 'sermon', { publishedAt: published.publishedAt });
    return send(res, 200, published);
  }

  if (method === 'POST' && path === '/api/reset') {
    requireStaff('demo:reset');
    if (publicDemo()) throw new HttpError(403, 'The public demo resets itself every night; manual reset is turned off.');
    resetAll();
    for (const t of Object.keys(listeners) as TraditionId[]) broadcast(t, 'care', { reset: true });
    return send(res, 200, { ok: true });
  }

  throw new HttpError(404, 'Not found');
}

const server = createServer((req, res) => {
  route(req, res).catch((error: unknown) => {
    if (error instanceof HttpError) return send(res, error.status, { error: error.message });
    if (error instanceof AIUnavailable) return send(res, 502, { error: error.message, ai: true });
    console.error(error);
    send(res, 500, { error: 'Something went wrong on the Koinonia server.' });
  });
});

server.listen(PORT, '127.0.0.1', () => {
  console.log(`Koinonia API on http://127.0.0.1:${PORT} - AI ${aiEnabled() ? `ON (${aiModel()} via ${aiProviderLabel()})` : 'OFF (sample mode: add ZEROG_API_KEY to .env.local)'}`);
  void checkModelAvailable().then((problem) => problem && console.warn(`Warning: ${problem}`));
  console.log(`Read-aloud voices: ${ttsEnabled() ? 'ElevenLabs' : 'browser only (no ElevenLabs key)'}`);
  if (publicDemo()) {
    console.log('Public demo: manual reset off, nightly reset on');
    scheduleNightlyReset(() => {
      resetAll();
      for (const t of Object.keys(listeners) as TraditionId[]) broadcast(t, 'care', { reset: true });
    });
  }
});
