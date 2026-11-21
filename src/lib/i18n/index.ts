import { createElement, Fragment, useMemo, type ReactNode } from 'react';
import type { LangCode, TraditionId } from '../../shared/languages';
import { defaultGlossary } from '../../shared/glossary';
import { EN } from './en';
import it from './it.json';
import es from './es.json';
import fr from './fr.json';
import zh from './zh.json';
import ar from './ar.json';
import sw from './sw.json';
import pt from './pt.json';
import pl from './pl.json';
import ko from './ko.json';
import vi from './vi.json';
import uk from './uk.json';

/** Every interface string has a key; English (en.ts) is the source. */
export type UiKey = keyof typeof EN;
export type UiVars = Record<string, string | number>;
type Dict = Partial<Record<UiKey, string>>;

const TABLES: Record<Exclude<LangCode, 'en'>, Dict> = {
  it: it as Dict,
  es: es as Dict,
  fr: fr as Dict,
  zh: zh as Dict,
  ar: ar as Dict,
  sw: sw as Dict,
  pt: pt as Dict,
  pl: pl as Dict,
  ko: ko as Dict,
  vi: vi as Dict,
  uk: uk as Dict,
};

const RTL_LANGS: ReadonlySet<LangCode> = new Set(['ar']);

/** The raw template for a key in a language, falling back to English when it is missing. */
function template(lang: LangCode, key: UiKey): string {
  if (lang !== 'en') {
    const s = TABLES[lang]?.[key];
    if (s) return s;
  }
  const en: string = EN[key] ?? key;
  // On a right-to-left page, keep an English fallback reading left to right ("Need help?", not "?Need help").
  return RTL_LANGS.has(lang) ? `⁦${en}⁩` : en;
}

// Interface text follows the church's own vocabulary, like every reply does: a Catholic parish
// reads 미사 / 弥撒 where a Protestant church reads 예배 / 礼拜. Applied to the scripts where the
// traditions use different words for the same thing.
const GLOSSARY_LANGS: ReadonlySet<LangCode> = new Set(['ko', 'zh', 'vi']);
const glossaryCache = new Map<string, [string, string][]>();

function withChurchVocabulary(lang: LangCode, tradition: TraditionId | undefined, s: string): string {
  if (!tradition || !GLOSSARY_LANGS.has(lang)) return s;
  const cacheKey = `${tradition}:${lang}`;
  let pairs = glossaryCache.get(cacheKey);
  if (!pairs) {
    pairs = defaultGlossary(tradition)
      .terms.filter((term) => term.lang === lang)
      .flatMap((term) => term.avoid.filter(Boolean).map((a) => [a, term.preferred] as [string, string]))
      .sort((a, b) => b[0].length - a[0].length);
    glossaryCache.set(cacheKey, pairs);
  }
  return pairs.reduce((acc, [avoid, preferred]) => acc.split(avoid).join(preferred), s);
}

/** Translate one interface string, filling `{name}` placeholders from `vars`. */
export function t(lang: LangCode, key: UiKey, vars?: UiVars, tradition?: TraditionId): string {
  const s = withChurchVocabulary(lang, tradition, template(lang, key));
  if (!vars) return s;
  return s.replace(/\{(\w+)\}/g, (m, name: string) => (name in vars ? String(vars[name]) : m));
}

/** Like t(), but placeholders may be React nodes (e.g. a bold name inside a sentence). */
export function tRich(lang: LangCode, key: UiKey, parts: Record<string, ReactNode>): ReactNode[] {
  return template(lang, key)
    .split(/(\{\w+\})/g)
    .filter((p) => p !== '')
    .map((p, i) => {
      const m = /^\{(\w+)\}$/.exec(p);
      return createElement(Fragment, { key: i }, m && m[1] in parts ? parts[m[1]] : p);
    });
}

/**
 * A translator bound to one language (and, optionally, one church's vocabulary), for components:
 * `const t = useT(lang, profile.id); t('tab.more')`.
 */
export function useT(lang: LangCode, tradition?: TraditionId): (key: UiKey, vars?: UiVars) => string {
  return useMemo(() => (key: UiKey, vars?: UiVars) => t(lang, key, vars, tradition), [lang, tradition]);
}

/** Every language except English is translated by a script, not by a person. */
export function isMachineTranslated(lang: LangCode): boolean {
  return lang !== 'en';
}
