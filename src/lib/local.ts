// Things that stay on this device only (localStorage): the attendee's original wording,
// their pickup codes, and their private journal. None of it is sent to the server.

import { useEffect, useState } from 'react';

export function useLocalState<T>(key: string, initial: T): [T, (value: T | ((prev: T) => T)) => void] {
  const [value, setValue] = useState<T>(() => {
    try {
      const raw = localStorage.getItem(key);
      return raw ? (JSON.parse(raw) as T) : initial;
    } catch {
      return initial;
    }
  });
  useEffect(() => {
    try {
      localStorage.setItem(key, JSON.stringify(value));
    } catch {
      /* storage full or disabled: keep working in memory */
    }
  }, [key, value]);
  return [value, setValue];
}

export interface MyRequest {
  code: string;
  tradition: string;
  language: string;
  createdAt: string;
  original: string; // the attendee's own words, kept only on their phone
  crisis: boolean;
}

const MY_REQUESTS = 'koinonia.myRequests';

export function loadMyRequests(): MyRequest[] {
  try {
    return JSON.parse(localStorage.getItem(MY_REQUESTS) ?? '[]') as MyRequest[];
  } catch {
    return [];
  }
}

export function rememberRequest(req: MyRequest): void {
  const list = loadMyRequests().filter((r) => r.code !== req.code);
  localStorage.setItem(MY_REQUESTS, JSON.stringify([req, ...list].slice(0, 20)));
}

export function originalForCode(code: string): string | null {
  return loadMyRequests().find((r) => r.code === code)?.original ?? null;
}
