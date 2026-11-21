// Translate the attendee interface strings (src/lib/i18n/en.ts) into the other 11 languages
// with Claude, once, and save them as src/lib/i18n/<lang>.json. Existing hand-made entries
// are kept; only missing keys are translated.
//
// Run: node --env-file-if-exists=.env --env-file-if-exists=.env.local server/scripts/translate-ui.ts

import { readFileSync, writeFileSync, existsSync } from 'node:fs';
import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';
import { aiEnabled, translateInterface } from '../ai.ts';
import { EN } from '../../src/lib/i18n/en.ts';

const dir = join(dirname(fileURLToPath(import.meta.url)), '..', '..', 'src', 'lib', 'i18n');
const LANGS: Record<string, string> = {
  it: 'Italian', es: 'Spanish', fr: 'French', zh: 'Simplified Chinese (Mandarin)', ar: 'Modern Standard Arabic',
  sw: 'Swahili', pt: 'Brazilian Portuguese', pl: 'Polish', ko: 'Korean', vi: 'Vietnamese', uk: 'Ukrainian',
};

if (!aiEnabled()) {
  console.error('No AI key: set ZEROG_API_KEY or ANTHROPIC_API_KEY in .env.local');
  process.exit(1);
}

const only = process.argv.slice(2);
const english = EN as Record<string, string>;
const results = await Promise.allSettled(
  Object.entries(LANGS)
    .filter(([code]) => only.length === 0 || only.includes(code))
    .map(async ([code, name]) => {
      const file = join(dir, `${code}.json`);
      const existing: Record<string, string> = existsSync(file) ? JSON.parse(readFileSync(file, 'utf8')) : {};
      const done: Record<string, string> = {};
      // Up to three passes: each asks only for keys still missing, in batches of 40.
      for (let pass = 0; pass < 3; pass++) {
        const missing = Object.entries(english).filter(([k]) => !(k in existing) && !(k in done));
        if (missing.length === 0) break;
        for (let i = 0; i < missing.length; i += 40) {
          try {
            Object.assign(done, await translateInterface({ strings: Object.fromEntries(missing.slice(i, i + 40)), to: name }));
          } catch (e) {
            console.warn(`${code}: batch failed (${(e as Error).message.slice(0, 120)}); will retry`);
          }
        }
      }
      const merged = Object.fromEntries(Object.keys(english).map((k) => [k, existing[k] ?? done[k]]).filter(([, v]) => v));
      writeFileSync(file, JSON.stringify(merged, null, 2) + '\n');
      const left = Object.keys(english).length - Object.keys(merged).length;
      console.log(`${code}: ${Object.keys(done).length} new, ${Object.keys(merged).length} total${left ? `, ${left} still in English` : ''}`);
    })
);
for (const r of results) if (r.status === 'rejected') console.error(r.reason);
