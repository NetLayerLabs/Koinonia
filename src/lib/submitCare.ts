import type { ChurchTraditionProfile, SupportedLanguageCode } from '../types/koinonia';
import { VERIFIED_SCRIPTURE_CORPUS } from '../data/koinoniaData';
import { runZeroPIIShield } from '../utils/privacyShield';
import { screenForCrisis } from '../shared/crisis';
import { api } from './api';
import { VERSE_THEMES, groupsForAI } from './careData';
import { rememberRequest } from './local';
import type { PickupView } from '../shared/types';

export interface SubmitResult {
  pickup: PickupView;
  crisis: boolean;
  removedCount: number;
}

/**
 * The only path from an attendee to the care team:
 * 1. personal details are scrubbed here in the browser,
 * 2. only the scrubbed text leaves the device,
 * 3. the original wording is kept on this device so the attendee can see what they wrote.
 */
export async function submitCareRequest(params: {
  profile: ChurchTraditionProfile;
  language: SupportedLanguageCode;
  rawText: string;
  source: 'Pew QR Scan' | 'Test request';
  pastorLanguage: 'en' | 'it';
}): Promise<SubmitResult> {
  const shield = runZeroPIIShield(params.rawText);
  const { record, crisis } = await api.careCreate({
    tradition: params.profile.id,
    language: params.language,
    pastorLanguage: params.pastorLanguage,
    redactedText: shield.redactedText,
    piiTokens: shield.tokens.map((t) => ({ type: t.type, redactedCount: t.redactedCount })),
    leaderName: params.profile.leaderName,
    source: params.source,
    verses: Object.values(VERIFIED_SCRIPTURE_CORPUS).map((v) => ({
      id: v.id,
      reference: v.reference,
      theme: VERSE_THEMES[v.id] ?? '',
    })),
    groups: groupsForAI(params.profile),
  });
  rememberRequest({
    code: record.code,
    tradition: params.profile.id,
    language: params.language,
    createdAt: record.createdAt,
    original: params.rawText,
    crisis,
  });
  return { pickup: record, crisis, removedCount: shield.totalEntitiesRedacted };
}

/** Same screen the server runs; used to show crisis lines instantly, even before the network answers. */
export function previewCrisis(rawText: string) {
  return screenForCrisis(runZeroPIIShield(rawText).redactedText);
}
