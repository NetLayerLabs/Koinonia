// Tradition-aware translation glossary. The pastor approves it once; every AI translation is
// instructed to follow it, and every output is checked against it with plain string matching.

import type { LangCode, TraditionId } from './languages.ts';

export interface GlossaryTerm {
  id: string;
  lang: LangCode;
  concept: string; // English description of what the term means
  preferred: string; // the word this tradition uses
  avoid: string[]; // words another tradition uses that should not appear
  note: string;
}

export interface Glossary {
  tradition: TraditionId;
  terms: GlossaryTerm[];
  approvedBy: string | null;
  approvedAt: string | null;
}

const CATHOLIC: GlossaryTerm[] = [
  { id: 'c-zh-god', lang: 'zh', concept: 'God', preferred: '天主', avoid: ['上帝'], note: 'Chinese Catholics say 天主; Protestants say 上帝 or 神.' },
  { id: 'c-zh-spirit', lang: 'zh', concept: 'Holy Spirit', preferred: '圣神', avoid: ['圣灵'], note: 'Catholic usage is 圣神; Protestant usage is 圣灵.' },
  { id: 'c-zh-lord', lang: 'zh', concept: 'the LORD (divine name in the Psalms)', preferred: '上主', avoid: ['耶和华'], note: 'Catholic Bibles render the divine name 上主; the Protestant Union Version uses 耶和华.' },
  { id: 'c-zh-priest', lang: 'zh', concept: 'priest', preferred: '神父', avoid: ['牧师'], note: 'A Catholic priest is 神父, not 牧师 (pastor).' },
  { id: 'c-zh-mass', lang: 'zh', concept: 'Mass', preferred: '弥撒', avoid: ['礼拜'], note: 'Sunday worship is 弥撒.' },
  { id: 'c-ko-god', lang: 'ko', concept: 'God', preferred: '하느님', avoid: ['하나님'], note: 'Korean Catholics say 하느님; Protestants say 하나님.' },
  { id: 'c-ko-lord', lang: 'ko', concept: 'the LORD (divine name in the Psalms)', preferred: '주님', avoid: ['여호와'], note: 'Catholic Korean Bibles use 주님 where Protestant versions use 여호와.' },
  { id: 'c-ko-priest', lang: 'ko', concept: 'priest', preferred: '신부님', avoid: ['목사님'], note: 'A Catholic priest is 신부님.' },
  { id: 'c-ko-mass', lang: 'ko', concept: 'Mass', preferred: '미사', avoid: ['예배'], note: 'Sunday worship is 미사.' },
  { id: 'c-vi-god', lang: 'vi', concept: 'God', preferred: 'Thiên Chúa', avoid: ['Đức Chúa Trời'], note: 'Vietnamese Catholics say Thiên Chúa.' },
  { id: 'c-vi-spirit', lang: 'vi', concept: 'Holy Spirit', preferred: 'Chúa Thánh Thần', avoid: ['Thánh Linh'], note: 'Catholic: Thánh Thần; Protestant: Đức Thánh Linh.' },
  { id: 'c-en-mass', lang: 'en', concept: 'Sunday worship', preferred: 'Mass', avoid: ['worship service'], note: 'Say Mass, not service.' },
  { id: 'c-en-priest', lang: 'en', concept: 'the parish leader', preferred: 'priest', avoid: ['pastor'], note: 'Refer to the priest (Don/Father), not pastor.' },
  { id: 'c-it-mass', lang: 'it', concept: 'Sunday worship', preferred: 'Messa', avoid: ['culto'], note: 'In Italian Catholic usage it is la Messa.' },
  { id: 'c-es-mass', lang: 'es', concept: 'Sunday worship', preferred: 'Misa', avoid: ['culto'], note: 'In Spanish Catholic usage it is la Misa.' },
];

const PROTESTANT: GlossaryTerm[] = [
  { id: 'p-zh-god', lang: 'zh', concept: 'God', preferred: '上帝', avoid: ['天主'], note: 'Protestant Chinese usage is 上帝 or 神, not 天主.' },
  { id: 'p-zh-spirit', lang: 'zh', concept: 'Holy Spirit', preferred: '圣灵', avoid: ['圣神'], note: 'Protestant usage is 圣灵.' },
  { id: 'p-zh-pastor', lang: 'zh', concept: 'pastor', preferred: '牧师', avoid: ['神父'], note: 'A Protestant pastor is 牧师.' },
  { id: 'p-zh-service', lang: 'zh', concept: 'Sunday worship', preferred: '礼拜', avoid: ['弥撒'], note: 'Sunday worship is 礼拜 (主日崇拜), not Mass.' },
  { id: 'p-ko-god', lang: 'ko', concept: 'God', preferred: '하나님', avoid: ['하느님'], note: 'Korean Protestants say 하나님.' },
  { id: 'p-ko-pastor', lang: 'ko', concept: 'pastor', preferred: '목사님', avoid: ['신부님'], note: 'A Protestant pastor is 목사님.' },
  { id: 'p-ko-service', lang: 'ko', concept: 'Sunday worship', preferred: '예배', avoid: ['미사'], note: 'Sunday worship is 예배.' },
  { id: 'p-vi-god', lang: 'vi', concept: 'God', preferred: 'Đức Chúa Trời', avoid: ['Thiên Chúa'], note: 'Vietnamese Protestants usually say Đức Chúa Trời.' },
  { id: 'p-vi-spirit', lang: 'vi', concept: 'Holy Spirit', preferred: 'Đức Thánh Linh', avoid: ['Thánh Thần'], note: 'Protestant: Đức Thánh Linh.' },
  { id: 'p-en-service', lang: 'en', concept: 'Sunday worship', preferred: 'worship service', avoid: ['Mass'], note: 'Say service or worship gathering.' },
  { id: 'p-en-communion', lang: 'en', concept: 'Communion', preferred: 'the Lord’s Supper', avoid: ['Eucharist'], note: 'Communion or the Lord’s Supper.' },
  { id: 'p-es-service', lang: 'es', concept: 'Sunday worship', preferred: 'culto', avoid: ['Misa'], note: 'Protestant Spanish usage is el culto.' },
];

export function defaultGlossary(tradition: TraditionId): Glossary {
  return {
    tradition,
    terms: tradition === 'san-venanzio-unicam' ? CATHOLIC : PROTESTANT,
    approvedBy: null,
    approvedAt: null,
  };
}

export function termsForLang(glossary: Glossary, lang: LangCode): GlossaryTerm[] {
  return glossary.terms.filter((t) => t.lang === lang);
}

export interface GlossaryViolation {
  termId: string;
  concept: string;
  found: string;
  preferred: string;
}

/** Plain string check: which "avoid" words slipped into a text? */
export function checkGlossary(glossary: Glossary, lang: LangCode, text: string): GlossaryViolation[] {
  const lower = text.toLowerCase();
  const out: GlossaryViolation[] = [];
  for (const term of termsForLang(glossary, lang)) {
    for (const bad of term.avoid) {
      const needle = bad.toLowerCase();
      if (!lower.includes(needle)) continue;
      // "Mass" should not trip on "Massachusetts", "pastor" on "pastoral".
      if (/^[a-z]/.test(needle)) {
        const re = new RegExp(`(^|[^a-zà-ÿ])${needle.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')}($|[^a-zà-ÿ])`, 'i');
        if (!re.test(text)) continue;
      }
      out.push({ termId: term.id, concept: term.concept, found: bad, preferred: term.preferred });
    }
  }
  return out;
}

export function glossaryPrompt(glossary: Glossary, lang: LangCode): string {
  const terms = termsForLang(glossary, lang);
  if (terms.length === 0) return '';
  return terms
    .map((t) => `- ${t.concept}: write "${t.preferred}"${t.avoid.length ? `, never ${t.avoid.map((a) => `"${a}"`).join(' or ')}` : ''}. (${t.note})`)
    .join('\n');
}
