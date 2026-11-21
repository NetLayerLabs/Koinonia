// Shared between the browser and the local Koinonia server. No imports, so Node can load it directly.

export type LangCode =
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

export const LANG_CODES: LangCode[] = ['en', 'it', 'es', 'fr', 'zh', 'ar', 'sw', 'pt', 'pl', 'ko', 'vi', 'uk'];

export const LANG_NAMES: Record<LangCode, string> = {
  en: 'English',
  it: 'Italian',
  es: 'Spanish',
  fr: 'French',
  zh: 'Chinese (Simplified)',
  ar: 'Arabic',
  sw: 'Swahili',
  pt: 'Portuguese',
  pl: 'Polish',
  ko: 'Korean',
  vi: 'Vietnamese',
  uk: 'Ukrainian',
};

export type TraditionId = 'san-venanzio-unicam' | 'grace-fellowship-us';

export const TRADITION_META: Record<
  TraditionId,
  { label: string; family: 'Catholic' | 'Protestant'; country: 'IT' | 'US'; churchName: string }
> = {
  'san-venanzio-unicam': {
    label: 'Catholic parish and university ministry (Italy)',
    family: 'Catholic',
    country: 'IT',
    churchName: 'Basilica di San Venanzio',
  },
  'grace-fellowship-us': {
    label: 'Multi-ethnic Protestant community church (USA)',
    family: 'Protestant',
    country: 'US',
    churchName: 'Grace Fellowship Community Church',
  },
};

export function isTradition(value: unknown): value is TraditionId {
  return value === 'san-venanzio-unicam' || value === 'grace-fellowship-us';
}

export function isLang(value: unknown): value is LangCode {
  return typeof value === 'string' && (LANG_CODES as string[]).includes(value);
}
