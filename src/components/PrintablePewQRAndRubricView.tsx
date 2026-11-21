import { copyText } from '../lib/copy';
import React, { useState } from 'react';
import { Check, Copy, Printer } from 'lucide-react';
import { ChurchTraditionProfile } from '../types/koinonia';
import { SUPPORTED_LANGUAGES } from '../data/koinoniaData';
import type { StatusResponse } from '../shared/types';
import { PewQrCode, pewUrl } from './PewQrCode';
import { VesicaMark } from './brand/Logo';
import { IconPewCard, IconScrub, VesicaBullet } from './brand/Icons';
import { LangMark } from './brand/LangMark';

interface Props {
  profile: ChurchTraditionProfile;
  status: StatusResponse | null;
}

const AI_RULES = [
  'Names, phone numbers, emails, student IDs and addresses are removed on the attendee’s phone. The AI never sees them.',
  'The AI summarises, drafts and translates. A pastor reviews and approves every reply; nothing is sent automatically.',
  'Each translation is translated back separately and compared, so a pastor sees any change in meaning before approving.',
  'Requests that show self-harm, abuse or danger skip the AI entirely and go to a person, with local crisis lines on the attendee’s screen.',
  'Bible text is shown from stored passages, never written by the AI.',
  'The filter works by matching patterns and can miss things, so attendees are asked not to name other people.',
];

export const PrintablePewQRAndRubricView: React.FC<Props> = ({ profile, status }) => {
  const [customHeaderNote, setCustomHeaderNote] = useState<string>(
    profile.id === 'san-venanzio-unicam'
      ? 'Welcome to Basilica di San Venanzio • No one walks alone'
      : 'Welcome home to Grace Fellowship • Follow along in your heart language'
  );
  const [customWifiNote, setCustomWifiNote] = useState<string>(
    profile.id === 'san-venanzio-unicam' ? 'Free Wi-Fi: SanVenanzio_Guest' : 'Free Wi-Fi: GraceFellowship_Guest'
  );
  const [copied, setCopied] = useState(false);
  const url = pewUrl(status, profile.id);
  const isLocalOnly = /localhost|127\.0\.0\.1/.test(url);

  return (
    <div className="space-y-12">
      <section className="space-y-6">
        <header className="flex flex-col lg:flex-row lg:items-end lg:justify-between gap-4 no-print">
          <div className="space-y-1.5 max-w-2xl">
            <p className="rubric inline-flex items-center gap-1.5">
              <IconPewCard className="w-4 h-4" /> Print and place in the pews
            </p>
            <h2 className="text-3xl max-[601px]:text-2xl leading-[1.08] text-ink">The pew card</h2>
            <p className="text-ink-2 leading-relaxed">
              Visitors rarely download a church app. A card in the pew with a QR code opens the companion straight in the phone’s browser, in 12
              languages.
            </p>
          </div>
          <button onClick={() => window.print()} className="btn btn-ink self-start lg:self-auto">
            <Printer className="w-4 h-4" /> Print cards
          </button>
        </header>

        <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start">
          {/* Settings for the card */}
          <div className="lg:col-span-5 min-w-0 space-y-5 no-print">
            <div>
              <label htmlFor="card-welcome" className="rubric block mb-1.5">
                Welcome line
              </label>
              <input
                id="card-welcome"
                type="text"
                value={customHeaderNote}
                onChange={(e) => setCustomHeaderNote(e.target.value)}
                className="field font-serif"
              />
            </div>
            <div>
              <label htmlFor="card-footer" className="rubric block mb-1.5">
                Footer note
              </label>
              <input id="card-footer" type="text" value={customWifiNote} onChange={(e) => setCustomWifiNote(e.target.value)} className="field" />
            </div>

            <div className="inset p-4 space-y-2.5">
              <p className="rubric">Try it on your phone now</p>
              <p className="text-sm text-ink-2 leading-relaxed">
                {isLocalOnly
                  ? 'This computer has no network address to share yet. Connect to Wi-Fi and reload.'
                  : 'Point your phone camera at the code. Your phone must be on the same Wi-Fi as this computer while you are running Koinonia locally; once deployed, the code points to the public address.'}
              </p>
              <div className="flex items-center gap-2">
                <code className="flex-1 min-w-0 font-mono text-xs bg-vellum border border-rule rounded-[2px] px-2 py-1.5 truncate max-[901px]:whitespace-normal max-[901px]:break-all text-ink-2">
                  {url}
                </code>
                <button
                  onClick={() => {
                    void copyText(url).then((ok) => {
                      if (!ok) return;
                      setCopied(true);
                      setTimeout(() => setCopied(false), 2000);
                    });
                  }}
                  className="btn btn-outline btn-sm shrink-0"
                  title="Copy link"
                >
                  {copied ? <Check className="w-3.5 h-3.5 text-vine" /> : <Copy className="w-3.5 h-3.5" />}
                  {copied ? 'Copied' : 'Copy'}
                </button>
              </div>
            </div>
          </div>

          {/* The card itself, as it will be printed: two inks on white */}
          <div className="lg:col-span-7 min-w-0">
            <article
              className="mx-auto w-full max-w-[26rem] bg-white border-[5px] border-double border-rubric p-1.5 print:max-w-[26rem]"
              aria-label="Pew card preview"
            >
              <div className="border border-rubric/40 px-6 pt-6 pb-5 sm:px-8 max-[601px]:px-4 flex flex-col items-center text-center">
                <VesicaMark size={34} />
                <p className="rubric mt-3">{profile.cityCountry}</p>
                <h3 className="font-serif text-[1.65rem] leading-[1.1] text-ink mt-1">{profile.churchName}</h3>
                <p className="font-serif italic text-ink-2 leading-snug mt-2 max-w-[20rem]">{customHeaderNote}</p>

                <div className="w-16 border-t-[3px] border-double border-rubric mt-4" aria-hidden />

                <div className="mt-5 p-2 border border-ink">
                  <PewQrCode value={url} className="w-48 h-48 [&>svg]:w-full [&>svg]:h-full" />
                </div>

                <p className="font-serif text-xl leading-snug text-ink mt-5 max-w-[19rem]">
                  Scan to follow in your language <span className="text-rubric">and ask for prayer</span>
                </p>
                <p className="text-sm text-ink-2 leading-relaxed mt-2 max-w-[21rem]">
                  Open your phone camera to follow today’s {profile.sermonTerm.toLowerCase()}, see what is happening during the service, and send a
                  confidential prayer request in your own language. A real person reads every request. No app needed.
                </p>

                <ul className="grid grid-cols-3 sm:grid-cols-4 gap-x-3 gap-y-2 mt-5 w-full text-left" aria-label="Languages">
                  {SUPPORTED_LANGUAGES.map((l) => (
                    <li key={l.code} className="flex items-center gap-1.5 min-w-0">
                      <LangMark code={l.code} size="sm" />
                      <span className="text-[0.72rem] leading-tight text-ink truncate" dir={l.rtl ? 'rtl' : 'ltr'}>
                        {l.nativeName}
                      </span>
                    </li>
                  ))}
                </ul>

                <div className="w-full rule mt-5 pt-3 space-y-1.5">
                  <p className="flex items-start justify-center gap-1.5 text-xs text-ink-2 leading-snug">
                    <IconScrub className="w-4 h-4 shrink-0 text-rubric" />
                    <span>Your name and contact details are removed on your phone before anything is sent.</span>
                  </p>
                  <p className="text-xs text-ink-3">{customWifiNote}</p>
                </div>

                <p className="mt-3 inline-flex items-center gap-1.5 font-sc text-[0.7rem] tracking-[0.12em] text-ink-3">
                  <VesicaMark size={14} /> Koinonia
                </p>
              </div>
            </article>
            <p className="text-center text-sm text-ink-3 mt-3 no-print">This is what prints. The settings are left off the page.</p>
          </div>
        </div>
      </section>

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 no-print">
        <section className="lg:col-span-7 leaf p-6 sm:p-7 max-[601px]:p-4 space-y-4">
          <div className="space-y-1.5">
            <p className="rubric">Where the idea came from · Camerino, Italy</p>
            <h3 className="text-2xl max-[601px]:text-xl leading-tight text-ink">Inspired by the Basilica di San Venanzio and UNICAM</h3>
          </div>
          <p className="prose-missal drop-cap">
            In the hilltop university town of Camerino, the Basilica di San Venanzio, dedicated to the young martyr St Venantius, is home to
            local families and to international students of the University of Camerino (UNICAM), who come from many countries.
          </p>
          <p className="prose-missal">
            Many sit in the pews unable to follow the Italian homily, and leave without anyone knowing they needed prayer. Koinonia is built so
            that the newcomer can be heard in their own language, and the priest can answer in his.
          </p>
          <p className="flex items-start gap-2 text-sm text-ink-2 border-l-2 border-gold bg-gold-wash px-3 py-2">
            <span className="tag tag-gold shrink-0">Sample</span>
            <span>
              The Basilica profile uses sample data to show how the app would work in a Catholic university parish. It is not an official parish
              tool.
            </span>
          </p>
        </section>

        <section className="lg:col-span-5 leaf p-6 sm:p-7 max-[601px]:p-4 space-y-4">
          <div className="space-y-1.5">
            <p className="rubric">How we use AI</p>
            <h3 className="text-2xl max-[601px]:text-xl leading-tight text-ink">What it does, and what it never sees</h3>
          </div>
          <ul className="divide-y divide-rule border-y border-rule">
            {AI_RULES.map((rule) => (
              <li key={rule} className="flex gap-3 py-2.5 text-[0.95rem] leading-snug text-ink">
                <VesicaBullet className="w-2 h-3 mt-1.5 shrink-0 text-rubric" />
                <span>{rule}</span>
              </li>
            ))}
          </ul>
        </section>
      </div>
    </div>
  );
};
