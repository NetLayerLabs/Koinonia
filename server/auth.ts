// Staff sign-in for the pastor's dashboard. Attendees never sign in: the pew page,
// sending a request, the pickup page and live cues stay open on purpose.
//
// Fixed staff accounts with roles (src/shared/staff.ts). Password: the shared STAFF_PASSCODE
// from .env.local. With DEMO_LOGIN=true the sign-in page also offers one-click demo sign-in,
// for judges and rehearsals; leave it off for a real church. Every approval records who signed in. A sign-in gives a random session token in an
// HttpOnly, SameSite=Strict cookie; only its SHA-256 hash is stored on disk.

import { createHash, randomBytes, timingSafeEqual } from 'node:crypto';
import type { IncomingMessage, ServerResponse } from 'node:http';
import { db, save } from './store.ts';
import { STAFF_ACCOUNTS, isStaffRole, type StaffRole } from '../src/shared/staff.ts';

const COOKIE = 'koinonia_staff';
const SESSION_HOURS = 12;
const MAX_FAILURES = 8;
const FAILURE_WINDOW_MS = 15 * 60 * 1000;

export interface StaffSession {
  username: string;
  name: string;
  role: StaffRole;
  expiresAt: string;
}

const hash = (value: string) => createHash('sha256').update(value).digest();

export function demoLoginEnabled(): boolean {
  return process.env.DEMO_LOGIN?.trim().toLowerCase() === 'true';
}

export function passcodeConfigured(): boolean {
  return Boolean(process.env.STAFF_PASSCODE?.trim());
}

function passcodeMatches(given: string): boolean {
  const expected = process.env.STAFF_PASSCODE?.trim();
  if (!expected) return false;
  // Compare fixed-length hashes so the check takes the same time whatever was typed.
  return timingSafeEqual(hash(given.trim()), hash(expected));
}

function readCookie(req: IncomingMessage, name: string): string | null {
  const header = req.headers.cookie;
  if (!header) return null;
  for (const part of header.split(';')) {
    const [k, ...v] = part.trim().split('=');
    if (k === name) return decodeURIComponent(v.join('='));
  }
  return null;
}

export function clientIp(req: IncomingMessage): string {
  // Behind a hosting proxy, the LAST x-forwarded-for entry is the address the proxy saw;
  // earlier entries are whatever the client claimed, so they are ignored.
  const forwarded = req.headers['x-forwarded-for'];
  const list = (Array.isArray(forwarded) ? forwarded.join(',') : forwarded ?? '').split(',').map((x) => x.trim()).filter(Boolean);
  return list.at(-1) || req.socket.remoteAddress || 'unknown';
}

function isHttps(req: IncomingMessage): boolean {
  return req.headers['x-forwarded-proto'] === 'https';
}

function setCookie(req: IncomingMessage, res: ServerResponse, value: string, maxAgeSeconds: number): void {
  const parts = [`${COOKIE}=${encodeURIComponent(value)}`, 'Path=/', 'HttpOnly', 'SameSite=Strict', `Max-Age=${maxAgeSeconds}`];
  if (isHttps(req)) parts.push('Secure');
  res.setHeader('set-cookie', parts.join('; '));
}

function pruneSessions(): void {
  const now = new Date().toISOString();
  for (const [key, s] of Object.entries(db.sessions)) if (s.expiresAt < now) delete db.sessions[key];
}

/** The signed-in staff member for this request, or null. */
export function staffFor(req: IncomingMessage): StaffSession | null {
  const token = readCookie(req, COOKIE);
  if (!token) return null;
  const session = db.sessions[hash(token).toString('hex')];
  if (!session || session.expiresAt < new Date().toISOString()) return null;
  // Sessions from before roles existed have no role: treat them as signed out.
  if (!isStaffRole(session.role) || !session.username) return null;
  return session as StaffSession;
}

// Wrong-passcode attempts per address, kept in memory.
const failures = new Map<string, { count: number; since: number }>();

export type LoginResult = { ok: true; session: StaffSession } | { ok: false; status: number; error: string };

export function login(
  req: IncomingMessage,
  res: ServerResponse,
  input: { username: string; password?: string; demo?: boolean }
): LoginResult {
  const account = STAFF_ACCOUNTS.find((a) => a.username === input.username.trim().toLowerCase());
  if (input.demo) {
    if (!demoLoginEnabled()) return { ok: false, status: 403, error: 'One-click demo sign-in is turned off on this server.' };
    if (!account) return { ok: false, status: 404, error: 'Unknown demo account.' };
    return startSession(req, res, account);
  }
  if (!passcodeConfigured()) {
    return { ok: false, status: 503, error: 'No staff passcode is set yet. Add STAFF_PASSCODE to .env.local on the server.' };
  }
  const ip = clientIp(req);
  const f = failures.get(ip);
  if (f && Date.now() - f.since < FAILURE_WINDOW_MS && f.count >= MAX_FAILURES) {
    return { ok: false, status: 429, error: 'Too many wrong attempts. Wait 15 minutes and try again.' };
  }
  // Same message for an unknown user and a wrong password, so neither can be guessed separately.
  if (!account || !passcodeMatches(input.password ?? '')) {
    const fresh = !f || Date.now() - f.since >= FAILURE_WINDOW_MS;
    failures.set(ip, fresh ? { count: 1, since: Date.now() } : { count: f.count + 1, since: f.since });
    return { ok: false, status: 401, error: 'That username or password is not right.' };
  }
  failures.delete(ip);
  return startSession(req, res, account);
}

function startSession(req: IncomingMessage, res: ServerResponse, account: (typeof STAFF_ACCOUNTS)[number]): LoginResult {
  pruneSessions();
  const token = randomBytes(32).toString('base64url');
  const session: StaffSession = { username: account.username, name: account.name, role: account.role, expiresAt: new Date(Date.now() + SESSION_HOURS * 3600 * 1000).toISOString() };
  db.sessions[hash(token).toString('hex')] = session;
  save();
  setCookie(req, res, token, SESSION_HOURS * 3600);
  return { ok: true, session };
}

export function logout(req: IncomingMessage, res: ServerResponse): void {
  const token = readCookie(req, COOKIE);
  if (token) {
    delete db.sessions[hash(token).toString('hex')];
    save();
  }
  setCookie(req, res, '', 0);
}
