import { LANG_CODES, type LangCode } from '../shared/languages';
import { t } from './i18n';

/**
 * The older per-language string set, now a thin wrapper over src/lib/i18n.
 * New code should call t()/useT() from './i18n' directly.
 */
export interface PewStrings {
  codeTitle: string;
  codeHelp: string;
  waiting: string;
  replyFrom: string;
  check: string;
  enterCode: string;
  openReply: string;
  followLive: string;
  liveNow: string;
  /** Screen-reader label for the logo button. */
  home: string;
  /** Reading direction of the language, for the page root. */
  dir: 'ltr' | 'rtl';
}

export const PEW_STRINGS = Object.fromEntries(
  LANG_CODES.map((lang) => [
    lang,
    {
      codeTitle: t(lang, 'code.title'),
      codeHelp: t(lang, 'code.help'),
      waiting: t(lang, 'pickup.waiting'),
      replyFrom: t(lang, 'pickup.replyFrom'),
      check: t(lang, 'pickup.check'),
      enterCode: t(lang, 'code.enter'),
      openReply: t(lang, 'code.openReply'),
      followLive: t(lang, 'live.follow'),
      liveNow: t(lang, 'live.now'),
      home: t(lang, 'nav.home'),
      dir: lang === 'ar' ? 'rtl' : 'ltr',
    },
  ])
) as Record<LangCode, PewStrings>;
