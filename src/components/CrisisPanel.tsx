import React, { useState } from 'react';
import { Phone } from 'lucide-react';
import { IconLifebuoy } from './brand/Icons';
import { api } from '../lib/api';
import { CRISIS_MESSAGE, crisisLinesFor } from '../shared/crisis';
import { useT } from '../lib/i18n';
import type { LangCode, TraditionId } from '../shared/languages';

interface Props {
  tradition: TraditionId;
  lang: LangCode;
  code: string | null; // null while the request is still being sent
  rtl?: boolean;
}

/** Shown on the attendee's phone the instant crisis signals are found. No AI text appears here. */
export const CrisisPanel: React.FC<Props> = ({ tradition, lang, code, rtl }) => {
  const msg = CRISIS_MESSAGE[lang];
  const t = useT(lang);
  const lines = crisisLinesFor(tradition);
  const [phone, setPhone] = useState('');
  const [sent, setSent] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const sendCallback = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!code || !phone.trim()) return;
    try {
      await api.pickupCallback(code, phone.trim());
      setSent(true);
    } catch (err) {
      setError(err instanceof Error ? err.message : t('crisis.sendError'));
    }
  };

  return (
    <section className="border-2 border-alarm bg-vellum" dir={rtl ? 'rtl' : 'ltr'} aria-live="assertive">
      <div className="bg-alarm text-white px-5 max-[601px]:px-4 py-3 flex items-center gap-2.5">
        <IconLifebuoy className="w-6 h-6 shrink-0" />
        <h4 className="font-serif text-xl leading-tight">{msg.title}</h4>
      </div>

      <div className="p-5 max-[601px]:p-4 space-y-4">
        <p className="text-[0.95rem] leading-relaxed text-ink">{msg.body}</p>

        <div className="divide-y divide-rule border-y border-rule">
          {lines.map((l) => (
            <a
              key={l.number}
              href={`tel:${l.number.replace(/[^\d+]/g, '')}`}
              className="flex flex-wrap items-center justify-between gap-x-4 gap-y-1 py-3 max-[901px]:min-h-[52px] hover:bg-alarm-wash -mx-2 px-2"
              dir="ltr"
            >
              <span className="min-w-0">
                <span dir="auto" className="block font-semibold text-ink">{t(`crisis.line.${l.id}`)}</span>
                <span dir="auto" className="block text-sm text-ink-3">{t(`crisis.note.${l.id}`)}</span>
              </span>
              <span className="flex items-center gap-2 font-mono text-xl font-semibold text-alarm whitespace-nowrap">
                <Phone className="w-5 h-5" /> {l.number}
              </span>
            </a>
          ))}
        </div>

        <p className="border-s-4 border-alarm bg-alarm-wash px-4 py-3 font-semibold text-ink [overflow-wrap:anywhere]">{msg.usher}</p>

        {code && (
          <form onSubmit={sendCallback} className="space-y-2">
            <p className="text-sm text-ink-2">{t('crisis.callbackHelp')}</p>
            {sent ? (
              <p className="tag tag-vine">{t('crisis.callbackThanks')}</p>
            ) : (
              <div className="flex gap-2">
                <input type="tel" value={phone} onChange={(e) => setPhone(e.target.value)} placeholder="+39 …" dir="ltr" className="field flex-1 min-w-0" />
                <button type="submit" className="btn btn-ink shrink-0 max-[901px]:min-h-[44px]!">
                  {t('crisis.send')}
                </button>
              </div>
            )}
            {error && <p className="text-sm text-alarm">{error}</p>}
          </form>
        )}
      </div>
    </section>
  );
};
