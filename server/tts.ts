// Read-aloud with ElevenLabs. Public text only (homily, Bible passage, service steps):
// prayer requests and replies are never sent here.
//
// The key: ELEVENLABS_API_KEY, or ELEVENLABS_ENV_FILE pointing at another .env file that
// holds it (so the key can stay in one place). It is never logged or sent to the browser.
//
// Every clip is cached on disk by (voice, model, text), so a whole church listening to the
// same homily costs one generation. New generations are limited per visitor.

import { createHash } from 'node:crypto';
import { existsSync, mkdirSync, readFileSync, writeFileSync } from 'node:fs';
import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';
import type { LangCode, TraditionId } from '../src/shared/languages.ts';

const here = dirname(fileURLToPath(import.meta.url));
const CACHE = join(here, 'data', 'tts');

// One native voice per language, chosen from the ElevenLabs voice library.
// English follows the church: American for the US church, British for the Italian one.
const VOICES: Record<Exclude<LangCode, 'en'>, string> = {
  it: '13Cuh3NuYvWOVQtLbRN8', // Marco - deep, reflective (Italian)
  es: 'kcQkGnn0HAT2JRDQ4Ljp', // Norah - warm, clear (Latin American)
  fr: 'aQROLel5sQbj1vuIVi6B', // Nicolas - narrator (Parisian)
  pt: 'CstacWqMhJQlnfLPxRG4', // Will - calm (Brazilian)
  pl: 'o2xdfKUpc1Bwq7RchZuW', // Piotr - reassuring storyteller
  uk: 'eLDtXX7z65CuLasDRxrP', // Leonid - calm teacher
  sw: 'ezWcjzmShLr2IarIA07u', // Mohammed - Swahili
  vi: 'DvG3I1kDzdBY3u4EzYh6', // Ngan - narrator
  zh: 'MI36FIkp9wRP7cpWKPTl', // Evan Zhao - Beijing Mandarin
  ko: 'uyVNoMrnUku1dZyVEXwD', // Anna Kim - Seoul, calm
  ar: 'R6nda3uM038xEEKi7GFl', // Anas - Modern Standard Arabic, gentle
};
const ENGLISH = { american: 'nPczCjzI2devNBz1zQrb' /* Brian */, british: 'JBFqnCBsd6RMkjVDRZzb' /* George */ };

const MAX_CHARS = 4000;
const NEW_CLIPS_PER_WINDOW = 20;
const WINDOW_MS = 10 * 60 * 1000;

let cachedKey: string | null | undefined;

function apiKey(): string | null {
  if (cachedKey !== undefined) return cachedKey;
  const direct = process.env.ELEVENLABS_API_KEY?.trim();
  if (direct) return (cachedKey = direct);
  const file = process.env.ELEVENLABS_ENV_FILE?.trim();
  if (file && existsSync(file)) {
    for (const line of readFileSync(file, 'utf8').split('\n')) {
      const m = line.match(/^\s*(?:export\s+)?ELEVENLABS_API_KEY\s*=\s*(.*?)\s*$/);
      if (m) return (cachedKey = m[1].replace(/^["']|["']$/g, '') || null);
    }
  }
  return (cachedKey = null);
}

export function ttsEnabled(): boolean {
  return Boolean(apiKey());
}

export function voiceFor(lang: LangCode, tradition: TraditionId): string {
  if (lang === 'en') return tradition === 'grace-fellowship-us' ? ENGLISH.american : ENGLISH.british;
  return VOICES[lang];
}

// Flash v2.5 is fast and covers 11 of our languages; Swahili needs Eleven v3.
function modelFor(lang: LangCode): string {
  return lang === 'sw' ? 'eleven_v3' : 'eleven_flash_v2_5';
}

const misses = new Map<string, { count: number; since: number }>();

export class TtsError extends Error {
  status: number;
  constructor(status: number, message: string) {
    super(message);
    this.status = status;
  }
}

/** Returns MP3 bytes for the text, from the cache when possible. */
export async function speak(input: { text: string; lang: LangCode; tradition: TraditionId; client: string }): Promise<Buffer> {
  const key = apiKey();
  if (!key) throw new TtsError(503, 'Read-aloud with native voices is not set up on this server.');
  const text = input.text.replace(/\s+/g, ' ').trim();
  if (!text) throw new TtsError(400, 'Nothing to read.');
  if (text.length > MAX_CHARS) throw new TtsError(413, 'That passage is too long to read aloud.');

  const voice = voiceFor(input.lang, input.tradition);
  const model = modelFor(input.lang);
  const id = createHash('sha256').update(`${voice}|${model}|${text}`).digest('hex');
  const file = join(CACHE, `${id}.mp3`);
  if (existsSync(file)) return readFileSync(file);

  // Only new generations count against the per-visitor limit.
  const m = misses.get(input.client);
  const fresh = !m || Date.now() - m.since > WINDOW_MS;
  if (!fresh && m.count >= NEW_CLIPS_PER_WINDOW) throw new TtsError(429, 'Please wait a few minutes before listening to something new.');
  misses.set(input.client, fresh ? { count: 1, since: Date.now() } : { count: m.count + 1, since: m.since });

  const body: Record<string, unknown> = {
    text,
    model_id: model,
    voice_settings: { stability: 0.6, similarity_boost: 0.8, style: 0.1, use_speaker_boost: true },
  };
  if (model === 'eleven_flash_v2_5') body.language_code = input.lang;

  const res = await fetch(`https://api.elevenlabs.io/v1/text-to-speech/${voice}?output_format=mp3_44100_64`, {
    method: 'POST',
    headers: { 'xi-api-key': key, 'content-type': 'application/json', accept: 'audio/mpeg' },
    body: JSON.stringify(body),
    signal: AbortSignal.timeout(60_000),
  });
  if (!res.ok) {
    const detail = await res.text().catch(() => '');
    console.warn(`ElevenLabs ${res.status} for ${input.lang}: ${detail.slice(0, 200)}`);
    throw new TtsError(res.status === 401 ? 503 : 502, 'The voice service is not available right now.');
  }
  const audio = Buffer.from(await res.arrayBuffer());
  mkdirSync(CACHE, { recursive: true });
  writeFileSync(file, audio);
  return audio;
}
