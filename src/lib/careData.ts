import type { ChurchTraditionProfile } from '../types/koinonia';
import type { CareRecord } from '../shared/types';

// What each stored passage is for, so the AI can pick one by id (it never writes verse text).
export const VERSE_THEMES: Record<string, string> = {
  'luke-21-19': 'endurance and hope in hard seasons',
  'psalm-34-18': 'comfort for the brokenhearted, grief, loneliness',
  'philippians-4-19': 'provision in material need',
  'matthew-11-28': 'rest and welcome for the weary and the seeking',
  'isaiah-41-10': 'courage against fear and anxiety, exams',
};

/** The care team can work in English or Italian; replies are translated into the attendee's language. */
export const PASTOR_LANGUAGES = [
  { code: 'en', label: 'English' },
  { code: 'it', label: 'Italiano' },
] as const;

export function groupsForAI(profile: ChurchTraditionProfile) {
  return profile.smallGroups.map((g) => ({
    id: g.id,
    name: g.name,
    languages: g.languages,
    schedule: g.schedule,
    audience: g.audienceTag,
  }));
}

/** The profile's built-in example requests, converted for the server (scrubbed text only). */
export function seedRecords(profile: ChurchTraditionProfile): Omit<CareRecord, 'id' | 'pickupCode'>[] {
  const hoursAgo = (h: number) => new Date(Date.now() - h * 3_600_000).toISOString();
  return profile.careQueue.map((item, index) => {
    const approved = item.approvalStatus === 'Approved & Sent';
    const groupName = profile.smallGroups.find((g) => g.id === item.matchedGroupId)?.name ?? 'our welcome group';
    return {
      tradition: profile.id,
      createdAt: hoursAgo(3 + index * 5),
      source: item.sourceChannel,
      language: item.originalLanguage,
      redactedText: item.redactedInputZeroPII,
      piiTokens: item.detectedPIITokens
        .filter((t) => t.redactedCount > 0)
        .map((t) => ({ type: t.type, redactedCount: t.redactedCount })),
      status: approved ? 'approved' : 'pending',
      mode: 'sample',
      category: item.category,
      urgency: item.urgency,
      summaryForLeader: item.translatedSummaryForLeader,
      verseId: item.verifiedScriptureId,
      groupId: item.matchedGroupId ?? null,
      // Starting draft in English (the care team's default working language); the pastor edits it.
      draftPastorText: `Peace be with you! Thank you for sharing your heart with us today. You are not invisible or alone here - our care team is praying for you, and we would love to welcome you in person at "${groupName}" this week. May God's peace stay with you.`,
      check: null,
      crisisKinds: [],
      crisisReason: '',
      callbackNumber: null,
      handledNote: null,
      approvedReply: approved ? item.draftReplyNativeLanguage : null,
      approvedBy: approved ? profile.leaderName : null,
      approvedAt: approved ? hoursAgo(1 + index) : null,
    };
  });
}

/** Sample originals (with personal details) exist only in this browser's bundled demo data. */
export function sampleOriginal(profile: ChurchTraditionProfile, redactedText: string): string | null {
  return profile.careQueue.find((c) => c.redactedInputZeroPII === redactedText)?.rawInputWithPII ?? null;
}
