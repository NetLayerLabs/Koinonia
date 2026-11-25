// Translate each church's own service guide, 7-day plan and pew labels (src/data/koinoniaData.ts)
// into the languages they were not written in, once, with Claude and the church's glossary, and
// save them in src/data/content-i18n.json. Existing entries are kept; only missing text is sent.
// Bible text is never sent: verses come from the church's licensed translations only.
//
// Run: node --env-file-if-exists=.env --env-file-if-exists=.env.local server/scripts/translate-content.ts

import { execFileSync } from 'node:child_process';
import { mkdtempSync, readFileSync, writeFileSync, rmSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { dirname, join } from 'node:path';
import { fileURLToPath, pathToFileURL } from 'node:url';
import { aiEnabled, translateContent } from '../ai.ts';
import { defaultGlossary, glossaryPrompt } from '../../src/shared/glossary.ts';
import { LANG_NAMES, TRADITION_META, type LangCode, type TraditionId } from '../../src/shared/languages.ts';

const root = join(dirname(fileURLToPath(import.meta.url)), '..', '..');
const file = join(root, 'src', 'data', 'content-i18n.json');

if (!aiEnabled()) {
  console.error('No AI key: set ZEROG_API_KEY or ANTHROPIC_API_KEY in .env.local');
  process.exit(1);
}

// The church data is browser code: bundle it once so Node can read what is still untranslated.
const tmp = mkdtempSync(join(tmpdir(), 'koinonia-content-'));
const bundle = join(tmp, 'data.mjs');
execFileSync(join(root, 'node_modules', '.bin', 'esbuild'), [join(root, 'src', 'data', 'koinoniaData.ts'), '--bundle', '--format=esm', '--platform=node', `--outfile=${bundle}`, '--log-level=warning']);
const data = (await import(pathToFileURL(bundle).href)) as { untranslatedContent: (t: string) => Partial<Record<LangCode, string[]>> };
rmSync(tmp, { recursive: true, force: true });

type ContentMap = Record<string, Partial<Record<LangCode, Record<string, string>>>>;
const saved: ContentMap = JSON.parse(readFileSync(file, 'utf8'));

const jobs: { tradition: TraditionId; lang: LangCode; texts: string[] }[] = [];
for (const tradition of Object.keys(TRADITION_META) as TraditionId[]) {
  for (const [lang, texts] of Object.entries(data.untranslatedContent(tradition)) as [LangCode, string[]][]) {
    const todo = texts.filter((en) => !saved[tradition]?.[lang]?.[en]);
    if (todo.length) jobs.push({ tradition, lang, texts: todo });
  }
}
console.log(`${jobs.length} church/language pairs, ${jobs.reduce((n, j) => n + j.texts.length, 0)} texts to translate`);

async function run(job: (typeof jobs)[number]): Promise<void> {
  const meta = TRADITION_META[job.tradition];
  const done: Record<string, string> = {};
  for (let pass = 0; pass < 3; pass++) {
    const missing = job.texts.filter((en) => !(en in done));
    if (!missing.length) break;
    for (let i = 0; i < missing.length; i += 25) {
      const batch = missing.slice(i, i + 25);
      try {
        const out = await translateContent({
          strings: Object.fromEntries(batch.map((en, k) => [`t${k}`, en])),
          to: LANG_NAMES[job.lang],
          traditionLabel: `${meta.churchName} - ${meta.label}`,
          glossary: glossaryPrompt(defaultGlossary(job.tradition), job.lang),
        });
        batch.forEach((en, k) => out[`t${k}`] && (done[en] = out[`t${k}`]));
      } catch (e) {
        console.warn(`${job.tradition}/${job.lang}: batch failed (${(e as Error).message.slice(0, 120)}); will retry`);
      }
    }
  }
  const byLang = ((saved[job.tradition] ??= {})[job.lang] ??= {});
  Object.assign(byLang, done);
  const left = job.texts.length - Object.keys(done).length;
  console.log(`${job.tradition}/${job.lang}: ${Object.keys(done).length} translated${left ? `, ${left} still in English` : ''}`);
}

// A few at a time, saving after each, so a stopped run keeps what it finished.
const queue = [...jobs];
await Promise.all(
  Array.from({ length: 6 }, async () => {
    for (let job = queue.shift(); job; job = queue.shift()) {
      await run(job);
      writeFileSync(file, JSON.stringify(saved, null, 2) + '\n');
    }
  })
);
