import { useEffect, useRef, useState } from 'react';
import type { Glossary } from '../shared/glossary';
import type { TraditionId } from '../shared/languages';
import type { StaffAccount, StaffRole } from '../shared/staff';
import type {
  CareRecord,
  InsightsResponse,
  PickupView,
  PublishedSermon,
  StatusResponse,
} from '../shared/types';

export class ApiError extends Error {
  status: number;
  constructor(status: number, message: string) {
    super(message);
    this.status = status;
  }
}

export const SIGNED_OUT_EVENT = 'koinonia:signed-out';

export interface StaffMe {
  signedIn: boolean;
  username: string | null;
  name: string | null;
  role: StaffRole | null;
  passcodeConfigured: boolean;
  demoLogin: boolean;
  accounts: StaffAccount[];
}

async function call<T>(path: string, init?: RequestInit & { json?: unknown }): Promise<T> {
  const res = await fetch(path, {
    ...init,
    headers: init?.json !== undefined ? { 'content-type': 'application/json' } : undefined,
    body: init?.json !== undefined ? JSON.stringify(init.json) : init?.body,
  });
  const text = await res.text();
  const data = text ? JSON.parse(text) : null;
  if (!res.ok) {
    // A staff route answered "not signed in" (session expired or signed out elsewhere).
    if (res.status === 401 && !path.startsWith('/api/login')) window.dispatchEvent(new Event(SIGNED_OUT_EVENT));
    throw new ApiError(res.status, data?.error ?? `Request failed (${res.status})`);
  }
  return data as T;
}

export const api = {
  status: () => call<StatusResponse>('/api/status'),
  me: () => call<StaffMe>('/api/me'),
  login: (username: string, password: string) => call<StaffMe>('/api/login', { method: 'POST', json: { username, password } }),
  demoLogin: (username: string) => call<StaffMe>('/api/login', { method: 'POST', json: { username, demo: true } }),
  logout: () => call<StaffMe>('/api/logout', { method: 'POST' }),
  scan: (tradition: TraditionId, lang: string) => call('/api/scan', { method: 'POST', json: { tradition, lang } }),
  insights: (tradition: TraditionId) => call<InsightsResponse>(`/api/insights?tradition=${tradition}`),
  careList: (tradition: TraditionId) => call<{ items: CareRecord[]; seeded: boolean }>(`/api/care?tradition=${tradition}`),
  careSeed: (tradition: TraditionId, items: Omit<CareRecord, 'id' | 'pickupCode'>[]) =>
    call('/api/care/seed', { method: 'POST', json: { tradition, items } }),
  careCreate: (body: Record<string, unknown>) =>
    call<{ record: PickupView; crisis: boolean }>('/api/care', { method: 'POST', json: body }),
  careCheck: (id: string, body: { pastorText: string; pastorLanguage: string; groupName: string }) =>
    call<{ record: CareRecord }>(`/api/care/${id}/check`, { method: 'POST', json: body }),
  careApprove: (id: string, body: { pastorText: string; approvedBy: string; acknowledgedDrift: boolean }) =>
    call<{ record: CareRecord }>(`/api/care/${id}/approve`, { method: 'POST', json: body }),
  careHandled: (id: string, note: string) => call<{ record: CareRecord }>(`/api/care/${id}/handled`, { method: 'POST', json: { note } }),
  pickup: (code: string) => call<PickupView>(`/api/pickup/${encodeURIComponent(code.toUpperCase())}`),
  pickupCallback: (code: string, phone: string) =>
    call(`/api/pickup/${encodeURIComponent(code.toUpperCase())}/callback`, { method: 'POST', json: { phone } }),
  glossary: (tradition: TraditionId) => call<Glossary>(`/api/glossary?tradition=${tradition}`),
  saveGlossary: (tradition: TraditionId, terms: Glossary['terms'], approvedBy?: string) =>
    call<Glossary>('/api/glossary', { method: 'PUT', json: { tradition, terms, approvedBy } }),
  glossaryPreview: (body: { tradition: TraditionId; lang: string; text: string; pastorLanguage: string }) =>
    call<{ without: string; withGlossary: string; violationsWithout: { found: string; preferred: string }[]; violationsWith: { found: string; preferred: string }[] }>(
      '/api/glossary/preview',
      { method: 'POST', json: body }
    ),
  setCue: (tradition: TraditionId, index: number) => call('/api/cues', { method: 'POST', json: { tradition, index } }),
  sermon: (tradition: TraditionId) => call<PublishedSermon | null>(`/api/sermon?tradition=${tradition}`),
  publishSermon: (body: Record<string, unknown>) => call<PublishedSermon>('/api/sermon/publish', { method: 'POST', json: body }),
  reset: () => call('/api/reset', { method: 'POST' }),
};

export function useStatus(): StatusResponse | null {
  const [status, setStatus] = useState<StatusResponse | null>(null);
  useEffect(() => {
    let alive = true;
    api
      .status()
      .then((s) => alive && setStatus(s))
      .catch(() => alive && setStatus({ ai: false, model: '', provider: 'none', lanAddresses: [] }));
    return () => {
      alive = false;
    };
  }, []);
  return status;
}

export type LiveEvent =
  | { type: 'hello'; data: { cue: { index: number }; pewFollowers: number } }
  | { type: 'cue'; data: { index: number } }
  | { type: 'presence'; data: { pewFollowers: number } }
  | { type: 'care'; data: { id?: string; reset?: boolean } }
  | { type: 'crisis'; data: { id: string; language: string; callback?: boolean } }
  | { type: 'sermon'; data: { publishedAt: string } };

/** Subscribe to the server's live event stream for one church profile. */
export function useLiveEvents(tradition: TraditionId, role: 'pew' | 'staff', onEvent: (e: LiveEvent) => void, enabled = true) {
  const handler = useRef(onEvent);
  handler.current = onEvent;
  const [connected, setConnected] = useState(false);
  useEffect(() => {
    if (!enabled) return;
    const source = new EventSource(`/api/events?tradition=${tradition}&role=${role}`);
    const types: LiveEvent['type'][] = ['hello', 'cue', 'presence', 'care', 'crisis', 'sermon'];
    const listeners = types.map((type) => {
      const fn = (ev: MessageEvent) => handler.current({ type, data: JSON.parse(ev.data) } as LiveEvent);
      source.addEventListener(type, fn);
      return [type, fn] as const;
    });
    source.onopen = () => setConnected(true);
    source.onerror = () => setConnected(false);
    return () => {
      listeners.forEach(([type, fn]) => source.removeEventListener(type, fn));
      source.close();
      setConnected(false);
    };
  }, [tradition, role, enabled]);
  return connected;
}
