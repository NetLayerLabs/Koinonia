// Sunday services and who is greeting at each, per church profile (sample data).
// The server uses the time windows to count scans per service; the insights panel
// compares scan languages with the languages the scheduled greeters speak.

import type { LangCode, TraditionId } from './languages.ts';

export interface ServiceSlot {
  id: string;
  label: string;
  startHour: number; // local hour when scans start counting for this service
  endHour: number;
  greeters: { name: string; languages: LangCode[] }[];
}

export const SERVICE_ROSTER: Record<TraditionId, ServiceSlot[]> = {
  'san-venanzio-unicam': [
    {
      id: 'sv-1100',
      label: 'Sunday 11:00 University Mass',
      startHour: 10,
      endHour: 13,
      greeters: [
        { name: 'Giulia (Law)', languages: ['it', 'en'] },
        { name: 'Chidi (PhD Computer Science)', languages: ['en', 'fr'] },
      ],
    },
    {
      id: 'sv-1830',
      label: 'Sunday 18:30 Evening Mass',
      startHour: 18,
      endHour: 20,
      greeters: [{ name: 'Valentina (Pharmacy)', languages: ['it', 'es'] }],
    },
  ],
  'grace-fellowship-us': [
    {
      id: 'gf-1000',
      label: 'Sunday 10:00 AM Worship',
      startHour: 9,
      endHour: 12,
      greeters: [
        { name: 'Marcus', languages: ['en'] },
        { name: 'Mateo Alvarez', languages: ['es', 'en'] },
      ],
    },
    {
      id: 'gf-1800',
      label: 'Sunday 6:00 PM Gathering',
      startHour: 17,
      endHour: 20,
      greeters: [{ name: 'Hannah Kim', languages: ['ko', 'en'] }],
    },
  ],
};

export function serviceForHour(tradition: TraditionId, hour: number): ServiceSlot | null {
  return SERVICE_ROSTER[tradition].find((s) => hour >= s.startHour && hour < s.endHour) ?? null;
}
