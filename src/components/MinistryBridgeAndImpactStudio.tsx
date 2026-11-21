import React, { useState } from 'react';
import { Check, Copy, Loader2 } from 'lucide-react';
import { api } from '../lib/api';
import type { PublishedSermon } from '../shared/types';
import { ChurchTraditionProfile, ImpactReportMetric } from '../types/koinonia';
import { SUPPORTED_LANGUAGES, VERIFIED_SCRIPTURE_CORPUS } from '../data/koinoniaData';
import { IconGlossary, IconLectern, IconSeal } from './brand/Icons';
import { LangMark } from './brand/LangMark';

interface MinistryBridgeAndImpactStudioProps {
  profile: ChurchTraditionProfile;
  aiOn: boolean;
  canPublish: boolean;
  onToast: (message: string) => void;
  onNavigateToPew: () => void;
}

/** A section opening, like an order of service: red numeral, rubric, serif heading, one sentence. */
const SectionHead: React.FC<{ numeral: string; rubric: React.ReactNode; title: React.ReactNode; children?: React.ReactNode }> = ({
  numeral,
  rubric,
  title,
  children,
}) => (
  <header className="grid grid-cols-[2.75rem_1fr] gap-x-3 max-[601px]:grid-cols-[2rem_1fr] max-[601px]:gap-x-2">
    <span className="font-serif text-4xl max-[601px]:text-3xl leading-none text-rubric pt-1" aria-hidden>
      {numeral}
    </span>
    <div className="space-y-1.5 min-w-0">
      <p className="rubric">{rubric}</p>
      <h2 className="text-3xl max-[601px]:text-2xl leading-[1.08] text-ink">{title}</h2>
      {children && <div className="text-ink-2 max-w-2xl leading-relaxed">{children}</div>}
    </div>
  </header>
);

const FieldLabel: React.FC<{ htmlFor: string; children: React.ReactNode; note?: string }> = ({ htmlFor, children, note }) => (
  <label htmlFor={htmlFor} className="block mb-1.5">
    <span className="rubric">{children}</span>
    {note && <span className="block text-sm text-ink-3 mt-0.5">{note}</span>}
  </label>
);

export const MinistryBridgeAndImpactStudio: React.FC<MinistryBridgeAndImpactStudioProps> = ({
  profile,
  aiOn,
  canPublish,
  onToast,
  onNavigateToPew,
}) => {
  const [draftTitle, setDraftTitle] = useState<string>(profile.currentMessageTitle.en);
  const [draftSummary, setDraftSummary] = useState<string>(profile.currentMessageSummary.en);
  const [selectedScriptureId, setSelectedScriptureId] = useState<string>(
    profile.primaryScripture.id
  );
  const [draftTakeaways, setDraftTakeaways] = useState<string>(profile.keyTakeaways.en.join('\n'));
  // Every box starts unticked: a person has to check each one.
  const [creedalCheckPassed, setCreedalCheckPassed] = useState<boolean>(false);
  const [scriptureLockVerified, setScriptureLockVerified] = useState<boolean>(false);
  const [pastorSignOff, setPastorSignOff] = useState<boolean>(false);
  const [publishSuccess, setPublishSuccess] = useState<boolean>(false);
  const [publishing, setPublishing] = useState(false);
  const [publishError, setPublishError] = useState<string | null>(null);
  const [published, setPublished] = useState<PublishedSermon | null>(null);

  // Impact story state
  const [metrics, setMetrics] = useState<ImpactReportMetric[]>(profile.impactStory.metrics);
  const [impactNarrative, setImpactNarrative] = useState<string>(
    profile.impactStory.narrativeDraft
  );
  const [storyApproved, setStoryApproved] = useState<boolean>(false);
  const [copiedReport, setCopiedReport] = useState<boolean>(false);

  const handleToggleMetricVerify = (id: string) => {
    setMetrics((prev) =>
      prev.map((m) => (m.id === id ? { ...m, leaderVerified: !m.leaderVerified } : m))
    );
  };

  const allMetricsVerified = metrics.every((m) => m.leaderVerified);

  const handlePublishPewBridge = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!creedalCheckPassed || !scriptureLockVerified || !pastorSignOff) return;
    setPublishing(true);
    setPublishError(null);
    try {
      const result = await api.publishSermon({
        tradition: profile.id,
        title: draftTitle,
        summary: draftSummary,
        takeaways: draftTakeaways.split('\n').map((x) => x.trim()).filter(Boolean),
        scriptureId: selectedScriptureId,
        sourceLanguage: 'en',
        publishedBy: profile.leaderName,
      });
      setPublished(result);
      setPublishSuccess(true);
      onToast(
        result.mode === 'live'
          ? `Published and translated into ${result.translations.length} languages. Phones update right away.`
          : 'Published in English. Turn on live AI to translate into the other 11 languages.'
      );
    } catch (err) {
      setPublishError(err instanceof Error ? err.message : 'Publishing failed');
    } finally {
      setPublishing(false);
    }
  };

  const handleCopyImpactReport = () => {
    const text = `${profile.impactStory.monthLabel}\n${profile.impactStory.headline}\n\n${impactNarrative}\n\nVerified Metrics:\n${metrics
      .map((m) => `- ${m.label}: ${m.value} (${m.changeLabel})`)
      .join('\n')}\n\nPrivacy Guarantee: ${profile.impactStory.privacyGuaranteeNote}`;
    navigator.clipboard.writeText(text);
    setCopiedReport(true);
    setTimeout(() => setCopiedReport(false), 2500);
  };

  const term = profile.sermonTerm.toLowerCase();

  const checklist: { key: string; checked: boolean; set: (v: boolean) => void; head: string; body: string }[] = [
    {
      key: 'theology',
      checked: creedalCheckPassed,
      set: setCreedalCheckPassed,
      head: 'Teaching',
      body: 'I have read the summary and it is faithful to what our church teaches.',
    },
    {
      key: 'scripture',
      checked: scriptureLockVerified,
      set: setScriptureLockVerified,
      head: 'Bible text',
      body: 'The passage comes from our church’s Bible translation. Koinonia shows stored text and never asks the AI to write or translate Scripture.',
    },
    {
      key: 'signoff',
      checked: pastorSignOff,
      set: setPastorSignOff,
      head: 'Sign-off',
      body: 'I approve these notes for the pews this Sunday. My sign-in name is recorded as the publisher.',
    },
  ];
  const ticked = checklist.filter((c) => c.checked).length;

  return (
    <div className="space-y-14">
      {/* I. The Sunday notes, written once and published to the pews in 12 languages */}
      <section className="space-y-6">
        <SectionHead
          numeral="I"
          rubric={
            <span className="inline-flex items-center gap-1.5">
              <IconLectern className="w-4 h-4" /> Sunday {term}
            </span>
          }
          title="Prepare the notes for the pews"
        >
          Write your {term} notes once, in English. Koinonia translates them into the 12 pew languages using your tradition’s glossary,
          checks each translation for words from the wrong tradition, and publishes only after the checklist is complete.
        </SectionHead>

        <div className="flex flex-wrap items-center gap-1.5 sm:pl-[3.5rem]" aria-label="The 12 pew languages">
          {SUPPORTED_LANGUAGES.map((l) => (
            <span key={l.code} title={l.name}>
              <LangMark code={l.code} size="sm" />
            </span>
          ))}
          <span className="text-sm text-ink-3 ml-1.5">12 languages</span>
        </div>

        <form onSubmit={handlePublishPewBridge} className="grid grid-cols-1 lg:grid-cols-12 gap-6">
          {/* The leaflet itself */}
          <div className="lg:col-span-7 leaf p-6 sm:p-7 max-[601px]:p-4 space-y-6">
            <div>
              <FieldLabel htmlFor="studio-title">Title of the {term}</FieldLabel>
              <input
                id="studio-title"
                type="text"
                value={draftTitle}
                onChange={(e) => {
                  setDraftTitle(e.target.value);
                  setPublishSuccess(false);
                }}
                className="field font-serif text-2xl leading-tight py-2.5"
              />
            </div>

            <div>
              <FieldLabel htmlFor="studio-passage" note="Shown from stored text. The AI never writes or translates it.">
                Bible passage
              </FieldLabel>
              <select
                id="studio-passage"
                value={selectedScriptureId}
                onChange={(e) => {
                  setSelectedScriptureId(e.target.value);
                  setPublishSuccess(false);
                }}
                className="field font-serif"
              >
                {Object.values(VERIFIED_SCRIPTURE_CORPUS).map((scr) => (
                  <option key={scr.id} value={scr.id}>
                    {scr.reference}
                  </option>
                ))}
              </select>
            </div>

            <div className="double-rule pt-5">
              <FieldLabel htmlFor="studio-summary">Summary and application</FieldLabel>
              <textarea
                id="studio-summary"
                rows={5}
                value={draftSummary}
                onChange={(e) => {
                  setDraftSummary(e.target.value);
                  setPublishSuccess(false);
                }}
                className="field font-serif text-[1.05rem] leading-relaxed"
              />
            </div>

            <div>
              <FieldLabel htmlFor="studio-takeaways" note="One per line.">
                For the week
              </FieldLabel>
              <textarea
                id="studio-takeaways"
                rows={3}
                value={draftTakeaways}
                onChange={(e) => {
                  setDraftTakeaways(e.target.value);
                  setPublishSuccess(false);
                }}
                className="field leading-relaxed"
              />
            </div>
          </div>

          {/* The checklist and the publish button */}
          <div className="lg:col-span-5 leaf p-6 max-[601px]:p-4 flex flex-col gap-5">
            <div>
              <p className="rubric">Before it goes to the pews</p>
              <h3 className="text-xl leading-snug mt-1">Three things a person must confirm</h3>
              <p className="text-sm text-ink-2 mt-1">An ordained or authorised leader ticks each one. None are ticked for you.</p>
            </div>

            <ol className="divide-y divide-rule border-y border-rule">
              {checklist.map((c, i) => (
                <li key={c.key}>
                  <label className="grid grid-cols-[1.5rem_1fr_auto] gap-3 items-start py-3.5 cursor-pointer -mx-2 px-2 hover:bg-parchment">
                    <span className="font-serif text-lg leading-6 text-rubric">{['i', 'ii', 'iii'][i]}.</span>
                    <span className="text-[0.95rem] leading-snug text-ink">
                      <span className="font-semibold">{c.head}.</span> <span className="text-ink-2">{c.body}</span>
                    </span>
                    <input
                      type="checkbox"
                      checked={c.checked}
                      onChange={(e) => c.set(e.target.checked)}
                      className="mt-1 w-4 h-4 max-[901px]:w-5 max-[901px]:h-5 accent-vine cursor-pointer"
                    />
                  </label>
                </li>
              ))}
            </ol>

            <div className="mt-auto space-y-3">
              <p className="text-sm text-ink-3 num-lining">{ticked} of 3 confirmed</p>
              <button
                type="submit"
                disabled={!canPublish || !creedalCheckPassed || !scriptureLockVerified || !pastorSignOff || publishing}
                className="btn btn-rubric btn-lg w-full whitespace-normal text-center"
              >
                {publishing ? <Loader2 className="w-4 h-4 animate-spin shrink-0" /> : <IconSeal className="w-5 h-5 shrink-0" />}
                <span>
                  {!canPublish
                    ? 'Only a pastor can publish the Sunday notes'
                    : publishing
                    ? 'Translating into 12 languages…'
                    : aiOn
                    ? 'Approve, translate and publish in 12 languages'
                    : 'Approve and publish (English only, AI is off)'}
                </span>
              </button>
              {!canPublish && (
                <p className="text-sm text-ink-3">You can edit the draft, but publishing needs a signed-in pastor.</p>
              )}
              {publishError && <p className="text-sm text-alarm">{publishError}</p>}

              {publishSuccess && (
                <div className="flex flex-wrap items-center justify-between gap-2 border-l-2 border-vine bg-vine-wash px-3 py-2.5">
                  <span className="flex items-center gap-2 text-sm font-semibold text-vine">
                    <IconSeal className="w-4 h-4" /> Published. Open phones update right away.
                  </span>
                  <button type="button" onClick={onNavigateToPew} className="btn btn-ghost btn-sm text-vine">
                    See it on the pew page
                  </button>
                </div>
              )}
            </div>
          </div>
        </form>

        {published && (
          <div className="leaf p-6 max-[601px]:p-4 space-y-4">
            <div className="flex flex-wrap items-baseline justify-between gap-2">
              <div>
                <p className="rubric">The translations</p>
                <h3 className="text-xl mt-1">As published to the pews</h3>
              </div>
              {published.mode === 'sample' ? (
                <span className="tag tag-gold">AI off, English only</span>
              ) : (
                <span className="text-sm text-ink-3">{published.translations.length} languages</span>
              )}
            </div>

            <div className="overflow-x-auto">
              <table className="w-full max-[901px]:min-w-[36rem] text-left border-collapse">
                <thead>
                  <tr className="border-b border-rule-strong">
                    <th className="rubric-ink font-medium py-2 pr-4 w-44">Language</th>
                    <th className="rubric-ink font-medium py-2 pr-4">Title and summary</th>
                    <th className="rubric-ink font-medium py-2 w-40">
                      <span className="inline-flex items-center gap-1.5">
                        <IconGlossary className="w-4 h-4" /> Glossary
                      </span>
                    </th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-rule">
                  {published.translations.map((tr) => {
                    const meta = SUPPORTED_LANGUAGES.find((l) => l.code === tr.lang);
                    return (
                      <tr key={tr.lang} className="align-top">
                        <td className="py-3 pr-4">
                          <span className="flex items-center gap-2.5">
                            <LangMark code={tr.lang} size="sm" />
                            <span className="text-sm text-ink">{meta?.name ?? tr.lang}</span>
                          </span>
                        </td>
                        <td className="py-3 pr-4" dir={meta?.rtl ? 'rtl' : 'ltr'}>
                          <span className="block font-serif text-[1.05rem] leading-snug text-ink line-clamp-2">{tr.title}</span>
                          <span className="block text-sm text-ink-2 line-clamp-2 mt-0.5">{tr.summary}</span>
                        </td>
                        <td className="py-3">
                          {tr.glossaryViolations.length === 0 ? (
                            <span className="tag tag-vine">
                              <IconSeal className="w-3.5 h-3.5" /> Clear
                            </span>
                          ) : (
                            <span className="flex flex-col items-start gap-1">
                              <span className="tag tag-gold">Check wording</span>
                              <span className="text-xs text-ink-2">{tr.glossaryViolations.map((v) => v.found).join(', ')}</span>
                            </span>
                          )}
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          </div>
        )}
      </section>

      {/* II. The monthly impact story */}
      <section className="space-y-6 double-rule pt-10">
        <SectionHead numeral="II" rubric="Monthly impact story" title={profile.impactStory.monthLabel}>
          A draft piece for your newsletter. Check every figure against your own records before you approve it, then copy it out.
        </SectionHead>

        <div className="sm:pl-[3.5rem]">
          <p className="inline-flex items-start gap-2 border-l-2 border-gold bg-gold-wash px-3 py-2 text-sm text-ink-2">
            <span className="tag tag-gold shrink-0">Sample</span>
            <span>
              These figures and the story are sample data for this demo. Koinonia does not count them yet, and this section sends nothing to the
              AI.
            </span>
          </p>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
          <div className="lg:col-span-5 leaf p-6 max-[601px]:p-4 space-y-3">
            <p className="rubric">Check each figure</p>
            <ul className="divide-y divide-rule border-y border-rule">
              {metrics.map((m) => (
                <li key={m.id}>
                  <label className="grid grid-cols-[1fr_auto] gap-3 items-start py-3.5 cursor-pointer -mx-2 px-2 hover:bg-parchment">
                    <span>
                      <span className="block font-serif text-2xl leading-tight text-ink num-lining">{m.value}</span>
                      <span className="block text-sm text-ink">{m.label}</span>
                      <span className="block text-sm text-ink-3">{m.changeLabel}</span>
                    </span>
                    <span className="flex flex-col items-end gap-1.5 pt-1">
                      <input
                        type="checkbox"
                        checked={m.leaderVerified}
                        onChange={() => handleToggleMetricVerify(m.id)}
                        className="w-4 h-4 max-[901px]:w-5 max-[901px]:h-5 accent-vine cursor-pointer"
                        aria-label={`Checked: ${m.label}`}
                      />
                      <span className={m.leaderVerified ? 'text-xs text-vine' : 'text-xs text-ink-3'}>
                        {m.leaderVerified ? 'Checked' : 'Not checked'}
                      </span>
                    </span>
                  </label>
                </li>
              ))}
            </ul>
          </div>

          <div className="lg:col-span-7 leaf p-6 max-[601px]:p-4 space-y-4">
            <div>
              <p className="rubric">The headline</p>
              <p className="font-serif text-xl leading-snug text-ink mt-1">{profile.impactStory.headline}</p>
            </div>
            <div>
              <FieldLabel htmlFor="impact-narrative">The story</FieldLabel>
              <textarea
                id="impact-narrative"
                rows={7}
                value={impactNarrative}
                onChange={(e) => setImpactNarrative(e.target.value)}
                className="field font-serif text-[1.05rem] leading-relaxed"
              />
            </div>

            <div className="flex flex-wrap items-center justify-between gap-3 pt-1">
              {storyApproved ? (
                <span className="tag tag-vine text-sm py-1 max-[601px]:whitespace-normal">
                  <IconSeal className="w-4 h-4" /> Approved by {profile.leaderName}
                </span>
              ) : (
                <button onClick={() => setStoryApproved(true)} disabled={!allMetricsVerified} className="btn btn-vine max-[601px]:w-full max-[601px]:min-h-[44px]!">
                  <IconSeal className="w-4 h-4" /> Approve the story
                </button>
              )}

              <button onClick={handleCopyImpactReport} className="btn btn-outline max-[601px]:w-full">
                {copiedReport ? (
                  <>
                    <Check className="w-4 h-4 text-vine" /> Copied
                  </>
                ) : (
                  <>
                    <Copy className="w-4 h-4" /> Copy for the newsletter
                  </>
                )}
              </button>
            </div>
            {!allMetricsVerified && !storyApproved && (
              <p className="text-sm text-ink-3">Tick every figure to approve the story.</p>
            )}
          </div>
        </div>
      </section>
    </div>
  );
};
