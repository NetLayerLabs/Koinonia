// Church staff roles. Shared by the server (which enforces them) and the dashboard
// (which only hides what a role cannot do). Attendees have no account and no role.
//
// The names below are fictional demo accounts.

export type StaffRole = 'pastor' | 'care' | 'welcome';

export type Permission =
  | 'care:read' // read the care queue (scrubbed requests)
  | 'care:draft' // run the translation + meaning check, save drafts
  | 'care:approve' // release a reply to the attendee
  | 'crisis:handle' // mark a crisis request as handled
  | 'glossary:approve'
  | 'glossary:preview'
  | 'cues:send'
  | 'insights:read'
  | 'sermon:publish'
  | 'demo:reset';

export const ROLE_PERMISSIONS: Record<StaffRole, Permission[]> = {
  pastor: [
    'care:read',
    'care:draft',
    'care:approve',
    'crisis:handle',
    'glossary:approve',
    'glossary:preview',
    'cues:send',
    'insights:read',
    'sermon:publish',
    'demo:reset',
  ],
  care: ['care:read', 'care:draft', 'crisis:handle', 'glossary:preview', 'cues:send', 'insights:read'],
  welcome: ['cues:send', 'insights:read'],
};

export const ROLE_META: Record<StaffRole, { label: string; summary: string }> = {
  pastor: { label: 'Pastor', summary: 'Approves every reply, the glossary and the Sunday notes' },
  care: { label: 'Care team', summary: 'Drafts and checks replies; a pastor approves them' },
  welcome: { label: 'Welcome volunteer', summary: 'Runs live service cues and greeter planning; cannot read care requests' },
};

export interface StaffAccount {
  username: string;
  name: string;
  role: StaffRole;
}

export const STAFF_ACCOUNTS: StaffAccount[] = [
  { username: 'andrea', name: 'Fr. Andrea Ricci', role: 'pastor' },
  { username: 'grace', name: 'Grace Adeyemi', role: 'care' },
  { username: 'minh', name: 'Minh Tran', role: 'welcome' },
];

export function can(role: StaffRole | null | undefined, permission: Permission): boolean {
  return Boolean(role && ROLE_PERMISSIONS[role]?.includes(permission));
}

export function isStaffRole(value: unknown): value is StaffRole {
  return value === 'pastor' || value === 'care' || value === 'welcome';
}
