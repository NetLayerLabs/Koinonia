export type ChurchTraditionId = 'san-venanzio-unicam' | 'grace-fellowship-us';

export type SupportedLanguageCode =
  | 'en'
  | 'it'
  | 'es'
  | 'fr'
  | 'zh'
  | 'ar'
  | 'sw'
  | 'pt'
  | 'pl'
  | 'ko'
  | 'vi'
  | 'uk';

export interface LanguageOption {
  code: SupportedLanguageCode;
  name: string;
  nativeName: string;
  rtl?: boolean;
  regionNote: string;
}

export interface VerifiedScripture {
  id: string;
  reference: string;
  translation: string;
  licenseNote: string;
  verifiedHash: string;
  texts: Record<SupportedLanguageCode, string>;
}

export interface LiturgicalStep {
  id: string;
  order: number;
  timestampLabel: string;
  title: Record<SupportedLanguageCode, string>;
  whatHappens: Record<SupportedLanguageCode, string>;
  spiritualMeaning: Record<SupportedLanguageCode, string>;
  postureOrResponse: Record<SupportedLanguageCode, string>;
}

export interface SevenDayHabitItem {
  day: number;
  dayLabel: string;
  title: Record<SupportedLanguageCode, string>;
  scriptureRef: string;
  scriptureText: Record<SupportedLanguageCode, string>;
  reflectionPrompt: Record<SupportedLanguageCode, string>;
  actionStep: Record<SupportedLanguageCode, string>;
  prayerFocus: Record<SupportedLanguageCode, string>;
  leaderApproved: boolean;
  approvedBy: string;
}

export interface CareRequestItem {
  id: string;
  submittedAt: string;
  sourceChannel: 'Pew QR Scan' | 'Campus Welcome Desk' | 'WhatsApp Bridge' | 'Weekly Check-In';
  originalLanguage: SupportedLanguageCode;
  languageLabel: string;
  rawInputWithPII: string;
  redactedInputZeroPII: string;
  detectedPIITokens: {
    type: 'NAME' | 'PHONE' | 'EMAIL' | 'STUDENT_ID' | 'ADDRESS';
    token: string;
    redactedCount: number;
  }[];
  category:
    | 'Homesickness & Student Transition'
    | 'Grief & Pastoral Visit'
    | 'Benevolence & Material Need'
    | 'Seeker Theological Q&A'
    | 'Prayer & Exam Anxiety';
  urgency: 'Immediate (Within 4h)' | 'High (Within 24h)' | 'Standard (Within 48h)';
  translatedSummaryForLeader: string;
  pastoralContextNote: string;
  verifiedScriptureId: string;
  draftReplyNativeLanguage: string;
  draftReplyBackTranslation: string;
  assignedLeaderName: string;
  matchedGroupId?: string;
  approvalStatus: 'Pending Human Approval' | 'Approved & Sent' | 'In Pastoral Follow-Up';
  theologicalGuardrailPassed: boolean;
}

export interface SmallGroupCommunity {
  id: string;
  name: string;
  leaderName: string;
  leaderRole: string;
  languages: SupportedLanguageCode[];
  languageLabels: string[];
  schedule: string;
  location: string;
  audienceTag: string;
  currentMembers: number;
  maxCapacity: number;
  description: string;
  tags: string[];
  matchScore?: number;
  matchReasons?: string[];
}

export interface VolunteerRoleGap {
  id: string;
  serviceName: string;
  roleTitle: string;
  timeSlot: string;
  reasonForGap: string;
  requiredLanguages: string[];
  status: 'Open Gap' | 'Invite Approved & Sent';
  suggestedCandidates: {
    id: string;
    name: string;
    roleHistory: string;
    languages: string[];
    lastServed: string;
    burnoutRisk: 'Low' | 'Moderate';
    matchScore: number;
    availabilityNote: string;
  }[];
  selectedCandidateId?: string;
}

export interface ImpactReportMetric {
  id: string;
  label: string;
  value: string;
  changeLabel: string;
  leaderVerified: boolean;
}

export interface ChurchTraditionProfile {
  id: ChurchTraditionId;
  shortLabel: string;
  badgeText: string;
  churchName: string;
  cityCountry: string;
  campusOrNeighborhood: string;
  leaderTitle: string;
  leaderName: string;
  coLeaderName: string;
  sermonTerm: 'Homily' | 'Sermon';
  serviceTerm: 'Sunday Solemn & University Mass' | 'Sunday Worship Gathering';
  heritageBannerTitle: string;
  heritageBannerStory: string;
  currentSeriesTitle: string;
  currentMessageTitle: Record<SupportedLanguageCode, string>;
  currentMessageSummary: Record<SupportedLanguageCode, string>;
  keyTakeaways: Record<SupportedLanguageCode, string[]>;
  primaryScripture: VerifiedScripture;
  liturgicalSteps: LiturgicalStep[];
  sevenDayJourney: SevenDayHabitItem[];
  careQueue: CareRequestItem[];
  smallGroups: SmallGroupCommunity[];
  volunteerGaps: VolunteerRoleGap[];
  impactStory: {
    monthLabel: string;
    headline: string;
    narrativeDraft: string;
    privacyGuaranteeNote: string;
    metrics: ImpactReportMetric[];
  };
}
