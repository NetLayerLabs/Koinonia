import React, { useState, useMemo } from 'react';
import {
  ChurchTraditionProfile,
  SupportedLanguageCode,
  VolunteerRoleGap,
} from '../types/koinonia';
import { SUPPORTED_LANGUAGES } from '../data/koinoniaData';
import { LanguageInsights } from './LanguageInsights';
import { IconDoor, IconSeal, IconTable, VesicaBullet } from './brand/Icons';
import { LangMark } from './brand/LangMark';

interface CommunityAndVolunteerHubProps {
  profile: ChurchTraditionProfile;
  selectedLang: SupportedLanguageCode;
  volunteerGaps: VolunteerRoleGap[];
  onApproveVolunteerInvite: (gapId: string, candidateId: string) => void;
}

const ROMAN = ['I', 'II', 'III', 'IV', 'V', 'VI'];

export const CommunityAndVolunteerHub: React.FC<CommunityAndVolunteerHubProps> = ({
  profile,
  selectedLang,
  volunteerGaps,
  onApproveVolunteerInvite,
}) => {
  const [filterLang, setFilterLang] = useState<SupportedLanguageCode | 'ALL'>('ALL');
  const [filterFocus, setFilterFocus] = useState<string>('ALL');
  const [joinedGroupIds, setJoinedGroupIds] = useState<string[]>([]);
  const [selectedCandidateMap, setSelectedCandidateMap] = useState<Record<string, string>>({});

  const rankedGroups = useMemo(() => {
    return profile.smallGroups
      .map((grp) => {
        let dynamicScore = grp.matchScore || 90;
        const targetLang = filterLang === 'ALL' ? selectedLang : filterLang;
        if (grp.languages.includes(targetLang)) {
          dynamicScore = Math.min(99, dynamicScore + 3);
        }
        return { ...grp, computedScore: dynamicScore };
      })
      .filter((grp) => {
        if (filterLang !== 'ALL' && !grp.languages.includes(filterLang)) return false;
        if (filterFocus !== 'ALL') {
          const combined = `${grp.name} ${grp.description} ${grp.tags.join(' ')}`.toLowerCase();
          if (!combined.includes(filterFocus.toLowerCase())) return false;
        }
        return true;
      })
      .sort((a, b) => b.computedScore - a.computedScore);
  }, [profile.smallGroups, filterLang, filterFocus, selectedLang]);

  const handleJoinGroup = (groupId: string) => {
    if (joinedGroupIds.includes(groupId)) return;
    setJoinedGroupIds((prev) => [...prev, groupId]);
  };

  const targetLang = filterLang === 'ALL' ? selectedLang : filterLang;

  return (
    <div className="space-y-8">
      <LanguageInsights profile={profile} />

      {/* Groups: where Sunday continues during the week. */}
      <section className="leaf p-6 max-[601px]:p-4 space-y-5">
        <header className="flex flex-col lg:flex-row lg:items-end lg:justify-between gap-5">
          <div className="flex gap-4 max-[601px]:gap-3 min-w-0">
            <IconTable className="w-6 h-6 text-rubric shrink-0 mt-1 max-[601px]:hidden" />
            <div className="space-y-1.5 min-w-0">
              <p className="rubric">From Sunday to the rest of the week</p>
              <h2 className="text-3xl max-[601px]:text-2xl leading-[1.1] text-ink">Groups and tables to join</h2>
              <p className="text-ink-2 max-w-2xl">
                Weekly dinners, study tables and home groups at <span className="text-ink font-medium">{profile.churchName}</span>,
                sorted so the ones that speak your language come first.
              </p>
            </div>
          </div>

          <div className="flex flex-wrap items-end gap-3 min-w-0">
            <label className="space-y-1 min-w-0 max-w-full max-[601px]:w-full">
              <span className="rubric-ink block">Language</span>
              <select
                value={filterLang}
                onChange={(e) => setFilterLang(e.target.value as SupportedLanguageCode | 'ALL')}
                className="field w-auto max-w-full max-[601px]:w-full py-2 text-sm"
              >
                <option value="ALL">All languages ({SUPPORTED_LANGUAGES.length})</option>
                {SUPPORTED_LANGUAGES.map((l) => (
                  <option key={l.code} value={l.code}>
                    {l.name} ({l.nativeName})
                  </option>
                ))}
              </select>
            </label>
            <label className="space-y-1 min-w-0 max-w-full max-[601px]:w-full">
              <span className="rubric-ink block">Who it is for</span>
              <select value={filterFocus} onChange={(e) => setFilterFocus(e.target.value)} className="field w-auto max-w-full max-[601px]:w-full py-2 text-sm">
                <option value="ALL">Everyone</option>
                <option value="International">International students and scholars</option>
                <option value="Seeker">Seekers, faith and science questions</option>
                <option value="Dinner">Free dinner and hospitality</option>
                <option value="Family">Families, all ages together</option>
              </select>
            </label>
          </div>
        </header>

        {rankedGroups.length === 0 ? (
          <p className="double-rule pt-5 text-ink-2">No group matches these filters yet.</p>
        ) : (
          <ul className="divide-y divide-rule double-rule">
            {rankedGroups.map((group) => {
              const isJoined = joinedGroupIds.includes(group.id);
              const speaksYours = group.languages.includes(targetLang);
              return (
                <li key={group.id} className="py-5 grid grid-cols-1 min-[901px]:grid-cols-12 gap-x-6 gap-y-4">
                  <div className="min-[901px]:col-span-8 min-w-0 space-y-3">
                    <div className="space-y-0.5">
                      <p className="rubric">{group.audienceTag}</p>
                      <h3 className="text-xl max-[601px]:text-lg leading-snug text-ink">{group.name}</h3>
                    </div>
                    <p className="text-[0.95rem] leading-relaxed text-ink-2">{group.description}</p>

                    <dl className="grid grid-cols-[auto_1fr] gap-x-4 gap-y-1 text-sm">
                      <dt className="rubric-ink">When</dt>
                      <dd className="text-ink min-w-0">{group.schedule}</dd>
                      <dt className="rubric-ink">Where</dt>
                      <dd className="text-ink min-w-0">{group.location}</dd>
                      <dt className="rubric-ink">Host</dt>
                      <dd className="text-ink min-w-0">
                        {group.leaderName} <span className="text-ink-3">({group.leaderRole})</span>
                      </dd>
                    </dl>

                    {group.matchReasons && (
                      <div className="space-y-1.5">
                        <p className="rubric-ink">Why this group</p>
                        <ul className="space-y-1">
                          {group.matchReasons.map((reason, idx) => (
                            <li key={idx} className="text-sm text-ink-2 flex items-start gap-2">
                              <VesicaBullet className="w-2 h-3 text-rubric shrink-0 mt-1" />
                              <span>{reason}</span>
                            </li>
                          ))}
                        </ul>
                      </div>
                    )}
                  </div>

                  <div className="min-[901px]:col-span-4 min-w-0 flex flex-col gap-3 min-[901px]:items-end min-[901px]:text-right">
                    <div className="flex flex-wrap gap-1.5 min-[901px]:justify-end">
                      {group.languages.map((code, i) => (
                        <span key={code} title={group.languageLabels[i] ?? code}>
                          <LangMark code={code} active={code === targetLang} />
                          <span className="sr-only">{group.languageLabels[i] ?? code}</span>
                        </span>
                      ))}
                    </div>
                    {speaksYours && <span className="tag tag-vine self-start min-[901px]:self-end">Speaks your language</span>}
                    <p className="text-sm text-ink-3 num-lining">
                      {group.currentMembers} of {group.maxCapacity} places taken
                    </p>
                    <div className="min-[901px]:mt-auto">
                      {isJoined ? (
                        <div className="space-y-1">
                          <span className="tag tag-vine">
                            <IconSeal className="w-3.5 h-3.5" /> Interest noted
                          </span>
                          <p className="text-xs text-ink-3">Demo: nothing is sent to the host.</p>
                        </div>
                      ) : (
                        <button onClick={() => handleJoinGroup(group.id)} className="btn btn-outline btn-sm max-[601px]:w-full">
                          I would like to join
                        </button>
                      )}
                    </div>
                  </div>
                </li>
              );
            })}
          </ul>
        )}
      </section>

      {/* Volunteer gaps: an open role, a few people who could step in, and a person who decides. */}
      <section className="leaf p-6 max-[601px]:p-4 space-y-5">
        <header className="flex flex-col lg:flex-row lg:items-start lg:justify-between gap-4">
          <div className="flex gap-4 max-[601px]:gap-3 min-w-0">
            <IconDoor className="w-6 h-6 text-rubric shrink-0 mt-1 max-[601px]:hidden" />
            <div className="space-y-1.5 min-w-0">
              <p className="rubric">Volunteer rota</p>
              <h2 className="text-3xl max-[601px]:text-2xl leading-[1.1] text-ink">Open places on Sunday</h2>
              <p className="text-ink-2 max-w-2xl">
                When someone on the rota cannot serve, each open role lists up to three people who could step in, with the languages
                they speak and when they last served, so no one is asked too often. No invitation goes out until{' '}
                <span className="text-ink font-medium">{profile.leaderName}</span> approves it.
              </p>
            </div>
          </div>
          <span className="tag tag-gold self-start shrink-0">Sample rota</span>
        </header>

        <ul className="divide-y divide-rule double-rule">
          {volunteerGaps.map((gap) => {
            const selectedCandId =
              selectedCandidateMap[gap.id] ||
              gap.selectedCandidateId ||
              gap.suggestedCandidates[0]?.id;
            const isFilled = gap.status === 'Invite Approved & Sent';

            return (
              <li key={gap.id} className="py-6 space-y-4">
                <div className="flex flex-wrap items-start justify-between gap-3">
                  <div className="space-y-1 min-w-0">
                    <p className="rubric">
                      {gap.serviceName} <span className="rubric-ink">· {gap.timeSlot}</span>
                    </p>
                    <h3 className="text-xl max-[601px]:text-lg leading-snug text-ink">Open role: {gap.roleTitle}</h3>
                    <p className="text-sm text-ink-2">
                      <span className="rubric-ink me-1.5">Why it is open</span>
                      {gap.reasonForGap}
                    </p>
                  </div>
                  {isFilled ? (
                    <span className="tag tag-vine">
                      <IconSeal className="w-3.5 h-3.5" /> Invitation approved
                    </span>
                  ) : (
                    <span className="tag tag-gold">Open</span>
                  )}
                </div>

                <div className="grid grid-cols-1 min-[901px]:grid-cols-3 border border-rule divide-y min-[901px]:divide-y-0 min-[901px]:divide-x divide-rule" role="radiogroup" aria-label={`Who could serve as ${gap.roleTitle}`}>
                  {gap.suggestedCandidates.map((cand, index) => {
                    const isPicked = selectedCandId === cand.id;
                    return (
                      <button
                        key={cand.id}
                        type="button"
                        role="radio"
                        aria-checked={isPicked}
                        onClick={() => setSelectedCandidateMap((prev) => ({ ...prev, [gap.id]: cand.id }))}
                        className={`text-left p-4 min-w-0 space-y-2 border-l-2 cursor-pointer transition-colors ${
                          isPicked ? 'border-l-rubric bg-parchment' : 'border-l-transparent hover:bg-parchment/60'
                        }`}
                      >
                        <div className="flex items-center justify-between gap-2">
                          <span className="font-serif text-rubric">{ROMAN[index] ?? index + 1}.</span>
                          <span className={`tag ${cand.burnoutRisk === 'Low' ? 'tag-vine' : 'tag-gold'}`}>
                            {cand.burnoutRisk === 'Low' ? 'Well rested' : 'Served recently'}
                          </span>
                        </div>
                        <p className="font-semibold text-ink leading-snug">{cand.name}</p>
                        <p className="text-sm text-ink-2">{cand.roleHistory}</p>
                        <dl className="text-sm space-y-0.5">
                          <div>
                            <dt className="rubric-ink inline me-1.5">Last served</dt>
                            <dd className="inline text-ink">{cand.lastServed}</dd>
                          </div>
                          <div>
                            <dt className="rubric-ink inline me-1.5">Available</dt>
                            <dd className="inline text-ink">{cand.availabilityNote}</dd>
                          </div>
                          <div>
                            <dt className="rubric-ink inline me-1.5">Speaks</dt>
                            <dd className="inline text-ink">{cand.languages.join(' · ')}</dd>
                          </div>
                        </dl>
                      </button>
                    );
                  })}
                </div>

                <div className="flex flex-wrap items-center justify-between gap-3">
                  <p className="text-sm text-ink-3 max-w-xl">
                    A person approves every invitation. In this demo, approving records the decision; no message is actually sent.
                  </p>
                  <button
                    onClick={() => onApproveVolunteerInvite(gap.id, selectedCandId)}
                    className={`btn ${isFilled ? 'btn-vine' : 'btn-rubric'} max-[601px]:w-full max-[601px]:min-h-[44px]!`}
                  >
                    {isFilled ? (
                      <>
                        <IconSeal className="w-4 h-4" /> Approved
                      </>
                    ) : (
                      'Approve invitation'
                    )}
                  </button>
                </div>
              </li>
            );
          })}
        </ul>
      </section>
    </div>
  );
};
