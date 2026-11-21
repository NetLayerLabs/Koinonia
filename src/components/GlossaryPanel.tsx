import React, { useEffect, useState } from 'react';
import { Loader2, Plus, Trash2 } from 'lucide-react';
import type { ChurchTraditionProfile } from '../types/koinonia';
import { SUPPORTED_LANGUAGES } from '../data/koinoniaData';
import { api } from '../lib/api';
import type { Glossary, GlossaryTerm } from '../shared/glossary';
import type { LangCode } from '../shared/languages';
import { IconBridge, IconCrook, IconGlossary, IconSeal } from './brand/Icons';
import { LangMark } from './brand/LangMark';

interface Props {
  profile: ChurchTraditionProfile;
  aiOn: boolean;
  canApprove: boolean;
  onToast: (m: string) => void;
}

const PREVIEW_TEXT: Record<string, string> = {
  'san-venanzio-unicam':
    // Written the way an English-speaking parish would write it ("pastor", "service"), so the glossary's work shows.
    'God loves you, and the Holy Spirit is with you. Our pastor would be glad to see you at the service this Sunday.',
  'grace-fellowship-us':
    'The Lord is close to you. God loves you, the Holy Spirit is with you, and our pastor would be glad to see you at the worship service on Sunday.',
};

function highlight(text: string, words: string[], cls: string) {
  if (words.length === 0) return text;
  const escaped = words.map((w) => w.replace(/[.*+?^${}()|[\]\\]/g, '\\$&'));
  const parts = text.split(new RegExp(`(${escaped.join('|')})`, 'g'));
  return parts.map((part, i) =>
    words.includes(part) ? (
      <mark key={i} className={`${cls} px-0.5 rounded-[1px]`}>
        {part}
      </mark>
    ) : (
      <React.Fragment key={i}>{part}</React.Fragment>
    )
  );
}

export const GlossaryPanel: React.FC<Props> = ({ profile, aiOn, canApprove, onToast }) => {
  const [glossary, setGlossary] = useState<Glossary | null>(null);
  const [langFilter, setLangFilter] = useState<LangCode>('zh');
  const [saving, setSaving] = useState(false);
  const [preview, setPreview] = useState<Awaited<ReturnType<typeof api.glossaryPreview>> | null>(null);
  const [previewBusy, setPreviewBusy] = useState(false);
  const [previewError, setPreviewError] = useState<string | null>(null);

  useEffect(() => {
    api.glossary(profile.id).then(setGlossary).catch(() => setGlossary(null));
    setPreview(null);
  }, [profile.id]);

  if (!glossary) {
    return (
      <div className="leaf p-6 text-sm text-ink-3 flex items-center gap-2">
        <Loader2 className="w-4 h-4 animate-spin" /> Loading glossary…
      </div>
    );
  }

  const terms = glossary.terms.filter((t) => t.lang === langFilter);
  const langsWithTerms = SUPPORTED_LANGUAGES.filter((l) => glossary.terms.some((t) => t.lang === l.code));

  const updateTerm = (id: string, patch: Partial<GlossaryTerm>) =>
    setGlossary({ ...glossary, approvedBy: null, terms: glossary.terms.map((t) => (t.id === id ? { ...t, ...patch } : t)) });

  const addTerm = () =>
    setGlossary({
      ...glossary,
      approvedBy: null,
      terms: [...glossary.terms, { id: `custom-${Date.now()}`, lang: langFilter, concept: 'New term', preferred: '', avoid: [], note: '' }],
    });

  const removeTerm = (id: string) => setGlossary({ ...glossary, approvedBy: null, terms: glossary.terms.filter((t) => t.id !== id) });

  const approve = async () => {
    setSaving(true);
    try {
      const saved = await api.saveGlossary(profile.id, glossary.terms, profile.leaderName);
      setGlossary(saved);
      onToast(`Glossary approved by ${saved.approvedBy ?? 'you'}. Every translation now follows it.`);
    } finally {
      setSaving(false);
    }
  };

  const runPreview = async () => {
    setPreviewBusy(true);
    setPreviewError(null);
    try {
      setPreview(await api.glossaryPreview({ tradition: profile.id, lang: langFilter, text: PREVIEW_TEXT[profile.id], pastorLanguage: 'en' }));
    } catch (e) {
      setPreviewError(e instanceof Error ? e.message : 'Preview failed');
    } finally {
      setPreviewBusy(false);
    }
  };

  const avoidWords = terms.flatMap((t) => t.avoid);
  const preferredWords = terms.map((t) => t.preferred).filter(Boolean);

  return (
    <section className="leaf p-6 sm:p-8 max-[601px]:p-4 space-y-6">
      <header className="flex flex-col lg:flex-row lg:items-start lg:justify-between gap-4">
        <div className="space-y-2 max-w-3xl min-w-0">
          <p className="rubric flex items-center gap-1.5">
            <IconGlossary className="w-4 h-4" /> Tradition glossary · approve once, used in every translation
          </p>
          <h3 className="font-serif text-2xl sm:text-3xl leading-[1.1] text-ink">The same word, said the way {profile.churchName} says it</h3>
          <p className="text-ink-2 leading-relaxed">
            Catholics and Protestants use different words in the same language. Korean Catholics say 하느님 for God, Protestants 하나님; Chinese
            Catholics say 天主 and 圣神, Protestants 上帝 and 圣灵. The AI is told to follow these terms, and every translation is then checked
            word by word.
          </p>
        </div>
        <div className="shrink-0">
          {glossary.approvedBy ? (
            <span className="tag tag-vine text-sm py-1 px-2.5 max-[601px]:whitespace-normal">
              <IconSeal className="w-4 h-4" /> Approved by {glossary.approvedBy}
            </span>
          ) : !canApprove ? (
            <span className="inline-flex items-center gap-2 text-sm text-ink-2 border border-rule-strong px-3 py-2">
              <IconCrook className="w-4 h-4 text-rubric" /> Waiting for a pastor to approve
            </span>
          ) : (
            <button onClick={approve} disabled={saving} className="btn btn-vine max-[601px]:w-full max-[601px]:min-h-[44px]!">
              {saving ? <Loader2 className="w-4 h-4 animate-spin" /> : <IconSeal className="w-4 h-4" />}
              {saving ? 'Saving…' : 'Approve glossary'}
            </button>
          )}
        </div>
      </header>

      <div role="tablist" className="flex flex-wrap border-b border-rule">
        {langsWithTerms.map((l) => {
          const on = langFilter === l.code;
          return (
            <button
              key={l.code}
              role="tab"
              aria-selected={on}
              onClick={() => {
                setLangFilter(l.code);
                setPreview(null);
              }}
              className={`flex items-center gap-2 px-3 py-2 -mb-px border-b-2 text-sm cursor-pointer transition-colors max-[901px]:min-h-[40px] ${
                on ? 'border-rubric bg-parchment text-ink font-semibold' : 'border-transparent text-ink-2 hover:text-ink'
              }`}
            >
              <LangMark code={l.code} size="sm" active={on} />
              {l.name} <span className="num-old text-ink-3">{glossary.terms.filter((t) => t.lang === l.code).length}</span>
            </button>
          );
        })}
      </div>

      <div className="overflow-x-auto">
        <table className="w-full max-[901px]:min-w-[42rem] text-sm">
          <thead>
            <tr className="text-left">
              <th className="rubric-ink font-medium py-2 pr-3">Meaning</th>
              <th className="rubric-ink font-medium py-2 pr-3">This church says</th>
              <th className="rubric-ink font-medium py-2 pr-3">Never use</th>
              <th className="rubric-ink font-medium py-2 pr-3">Why</th>
              <th />
            </tr>
          </thead>
          <tbody className="divide-y divide-rule border-y border-rule">
            {terms.map((t) => (
              <tr key={t.id} className="align-top">
                <td className="py-2 pr-3">
                  <input
                    value={t.concept}
                    onChange={(e) => updateTerm(t.id, { concept: e.target.value })}
                    aria-label="Meaning"
                    className="w-full bg-transparent font-serif text-[1rem] text-ink px-1 py-1 border-b border-transparent hover:border-rule focus:border-rubric focus:outline-none"
                  />
                </td>
                <td className="py-2 pr-3">
                  <input
                    value={t.preferred}
                    onChange={(e) => updateTerm(t.id, { preferred: e.target.value })}
                    aria-label="This church says"
                    className="field py-1 px-2 bg-vine-wash border-vine/40 font-semibold text-vine"
                  />
                </td>
                <td className="py-2 pr-3">
                  <input
                    value={t.avoid.join(', ')}
                    onChange={(e) => updateTerm(t.id, { avoid: e.target.value.split(',').map((s) => s.trim()).filter(Boolean) })}
                    aria-label="Never use"
                    className="field py-1 px-2 bg-rubric-wash border-rubric/40 text-rubric-deep"
                  />
                </td>
                <td className="py-2 pr-3">
                  <input
                    value={t.note}
                    onChange={(e) => updateTerm(t.id, { note: e.target.value })}
                    aria-label="Why"
                    className="w-full bg-transparent text-ink-2 px-1 py-1 border-b border-transparent hover:border-rule focus:border-rubric focus:outline-none"
                  />
                </td>
                <td className="py-2">
                  <button onClick={() => removeTerm(t.id)} className="btn btn-ghost btn-sm px-2 max-[901px]:min-w-[40px] hover:text-rubric" title="Remove term" aria-label="Remove term">
                    <Trash2 className="w-3.5 h-3.5" />
                  </button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
        <button onClick={addTerm} className="btn btn-ghost btn-sm text-rubric mt-2 -ml-3">
          <Plus className="w-3.5 h-3.5" /> Add a term
        </button>
      </div>

      {/* Before / after */}
      <div className="inset p-5 max-[601px]:p-4 space-y-4">
        <div className="flex flex-wrap items-start justify-between gap-3">
          <div className="space-y-1">
            <p className="rubric">Before and after</p>
            <p className="text-sm text-ink-2">The same sentence, translated with and without the glossary.</p>
          </div>
          <button onClick={runPreview} disabled={previewBusy || !aiOn} title={aiOn ? '' : 'Needs live AI'} className="btn btn-ink btn-sm max-[601px]:w-full">
            {previewBusy ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <IconBridge className="w-4 h-4" />}
            Compare live translations
          </button>
        </div>
        <p className="font-serif italic text-ink leading-relaxed">“{PREVIEW_TEXT[profile.id]}”</p>
        {!aiOn && <p className="text-xs text-ink-3">Needs live AI (add an API key). The rules above still apply to sample text.</p>}
        {previewError && <p className="text-sm text-rubric-deep">{previewError}</p>}
        {preview && (
          <div className="grid grid-cols-1 min-[901px]:grid-cols-2 border-t border-rule-strong min-[901px]:divide-x divide-rule-strong">
            <div className="pt-4 min-w-0 min-[901px]:pr-5 space-y-2">
              <p className="rubric-ink">
                Without the glossary · <span className="num-old">{preview.violationsWithout.length}</span> wrong-tradition{' '}
                {preview.violationsWithout.length === 1 ? 'term' : 'terms'}
              </p>
              <p className="font-serif text-lg leading-relaxed text-ink" lang={langFilter}>
                {highlight(preview.without, avoidWords, 'bg-rubric-wash text-rubric-deep underline decoration-rubric decoration-1 underline-offset-[3px]')}
              </p>
            </div>
            <div className="pt-4 min-w-0 min-[901px]:pl-5 space-y-2 border-t border-rule-strong min-[901px]:border-t-0 mt-4 min-[901px]:mt-0">
              <p className="rubric">
                With {profile.churchName}’s glossary · <span className="num-old">{preview.violationsWith.length}</span>{' '}
                {preview.violationsWith.length === 1 ? 'problem' : 'problems'}
              </p>
              <p className="font-serif text-lg leading-relaxed text-ink" lang={langFilter}>
                {highlight(preview.withGlossary, preferredWords, 'bg-vine-wash text-vine')}
              </p>
            </div>
          </div>
        )}
      </div>
    </section>
  );
};
