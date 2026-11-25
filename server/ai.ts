// Live AI layer (Claude). Every function receives text that was already scrubbed of
// personal details in the browser. Biblical text is never generated here: verses are
// picked by id from the church's stored passages and attached separately.
//
// Two ways to reach Claude, picked from environment variables (see .env.local):
//   1. 0G Compute Router  - ZEROG_API_KEY (preferred when set). Uses the router's
//      Anthropic-compatible /v1/messages endpoint, so the official Anthropic SDK works
//      unchanged with a different base URL.
//   2. Anthropic directly - ANTHROPIC_API_KEY.

import Anthropic from '@anthropic-ai/sdk';
import { betaZodOutputFormat } from '@anthropic-ai/sdk/helpers/beta/zod';
import { z } from 'zod';

type Provider = '0g' | 'anthropic' | 'none';

const ZEROG_DEFAULT_BASE_URL = 'https://router-api.0g.ai';
const ZEROG_DEFAULT_MODEL = 'claude-opus-5.5'; // 0G model ids use dots
const ANTHROPIC_MODEL = 'claude-opus-5-5';

function provider(): Provider {
  if (process.env.ZEROG_API_KEY) return '0g';
  if (process.env.ANTHROPIC_API_KEY || process.env.ANTHROPIC_AUTH_TOKEN) return 'anthropic';
  return 'none';
}

function zerogBaseURL(): string {
  // Accept either ".../v1" or the bare host: the SDK adds /v1/messages itself.
  return (process.env.ZEROG_BASE_URL || ZEROG_DEFAULT_BASE_URL).replace(/\/+$/, '').replace(/\/v1$/, '');
}

export function aiModel(): string {
  return provider() === '0g' ? process.env.ZEROG_MODEL || ZEROG_DEFAULT_MODEL : ANTHROPIC_MODEL;
}

/**
 * On 0G, translation work (translate, back-translate, compare, Sunday notes, interface strings)
 * can run on a faster model set with ZEROG_FAST_MODEL (e.g. claude-sonnet-5.5), so the meaning
 * check takes seconds instead of a minute. Reading a request (triage and the safety flag) always
 * uses the main model.
 */
function fastModel(): string {
  return process.env.ZEROG_FAST_MODEL?.trim() || aiModel();
}

export function aiProviderLabel(): string {
  const p = provider();
  return p === '0g' ? '0G Compute' : p === 'anthropic' ? 'Anthropic API' : 'none';
}

export function aiEnabled(): boolean {
  return provider() !== 'none';
}

// No AI call may hang for minutes (the SDK default is 10). Triage, which a person in the pew
// is waiting on, gets a shorter limit of its own; see triageRequest.
const AI_TIMEOUT_MS = 120_000;
const TRIAGE_TIMEOUT_MS = 40_000;

let client: Anthropic | null = null;

function getClient(): Anthropic {
  if (client) return client;
  if (provider() === '0g') {
    const key = process.env.ZEROG_API_KEY!;
    client = new Anthropic({
      baseURL: zerogBaseURL(),
      apiKey: null,
      authToken: key, // sent as "Authorization: Bearer sk-…", as 0G's quickstart shows
      defaultHeaders: { 'x-api-key': key }, // also accepted by Anthropic-style gateways
      timeout: AI_TIMEOUT_MS,
      maxRetries: 1,
    });
  } else {
    client = new Anthropic({ timeout: AI_TIMEOUT_MS, maxRetries: 1 });
  }
  return client;
}

export class AIUnavailable extends Error {}

function mapError(error: unknown): never {
  const where = provider() === '0g' ? '0G Compute' : 'the Claude API';
  if (error instanceof Anthropic.AuthenticationError) throw new AIUnavailable(`The API key was rejected by ${where}.`);
  if (error instanceof Anthropic.RateLimitError) throw new AIUnavailable(`Rate limited by ${where}. Try again in a minute.`);
  if (error instanceof Anthropic.APIConnectionError) throw new AIUnavailable(`Could not reach ${where}.`);
  if (error instanceof Anthropic.APIError) {
    if (error.status === 402) throw new AIUnavailable(`${where}: not enough balance. Top up your 0G credits and try again.`);
    throw new AIUnavailable(`${where} error ${error.status}: ${error.message}`);
  }
  throw error;
}

async function structured<S extends z.ZodType>(
  schema: S,
  system: string,
  user: string,
  effort: 'low' | 'medium',
  tier: 'main' | 'fast' = effort === 'low' ? 'fast' : 'main',
  timeout?: number
): Promise<z.infer<S>> {
  return provider() === '0g'
    ? structuredViaTool(schema, system, user, tier === 'fast' ? fastModel() : aiModel(), timeout)
    : structuredDirect(schema, system, user, effort, timeout);
}

/** Direct Anthropic API: native structured outputs plus server-side model fallback. */
async function structuredDirect<S extends z.ZodType>(schema: S, system: string, user: string, effort: 'low' | 'medium', timeout?: number): Promise<z.infer<S>> {
  let res;
  try {
    res = await getClient().beta.messages.parse({
      model: ANTHROPIC_MODEL,
      max_tokens: 16000,
      betas: ['server-side-fallback-2026-07-01'],
      fallbacks: 'default',
      system,
      messages: [{ role: 'user', content: user }],
      output_config: { effort, format: betaZodOutputFormat(schema) },
    }, timeout ? { timeout, maxRetries: 0 } : undefined);
  } catch (error) {
    mapError(error);
  }
  if (res.stop_reason === 'refusal') throw new AIUnavailable('The model declined this request; a human should handle it directly.');
  if (!res.parsed_output) throw new AIUnavailable('The model returned no structured output.');
  return res.parsed_output;
}

/**
 * Through the 0G router. Its catalog does not list structured outputs (output_config)
 * for every Claude model, but all of them support tools, so the answer is collected as
 * the input of a single "submit" tool and validated with the same Zod schema.
 */
async function structuredViaTool<S extends z.ZodType>(schema: S, system: string, user: string, model: string, timeout?: number): Promise<z.infer<S>> {
  const { $schema: _ignored, ...inputSchema } = z.toJSONSchema(schema) as Record<string, unknown>;
  const tool = {
    name: 'submit',
    description: 'Submit your complete answer. This is the only way to answer.',
    input_schema: inputSchema as Anthropic.Tool.InputSchema,
  };
  const instruction = '\n\nAnswer only by calling the "submit" tool once, with every field filled in. Do not write anything else.';

  let lastProblem = 'no answer';
  for (let attempt = 0; attempt < 2; attempt++) {
    let res: Anthropic.Message;
    try {
      res = await getClient().messages.create({
        model,
        max_tokens: 16000,
        system: system + instruction,
        tools: [tool],
        messages: [{ role: 'user', content: attempt === 0 ? user : `${user}\n\n(Reminder: call the "submit" tool with the answer.)` }],
      }, timeout ? { timeout, maxRetries: 0 } : undefined);
    } catch (error) {
      mapError(error);
    }
    if (res.stop_reason === 'refusal') throw new AIUnavailable('The model declined this request; a human should handle it directly.');

    const call = res.content.find((b): b is Anthropic.ToolUseBlock => b.type === 'tool_use' && b.name === 'submit');
    let candidate: unknown = call?.input;
    if (candidate === undefined) {
      // Some routes answer in text: accept a JSON object if that is what came back.
      const text = res.content.map((b) => (b.type === 'text' ? b.text : '')).join('');
      const json = text.slice(text.indexOf('{'), text.lastIndexOf('}') + 1);
      try {
        candidate = json ? JSON.parse(json) : undefined;
      } catch {
        candidate = undefined;
      }
    }
    const parsed = schema.safeParse(candidate);
    if (parsed.success) return parsed.data;
    lastProblem = candidate === undefined ? 'the model did not call the submit tool' : parsed.error.message;
  }
  throw new AIUnavailable(`The model returned no usable structured output (${lastProblem}).`);
}

/** Startup check (0G only): the model catalog is public, so confirm the model id exists. */
export async function checkModelAvailable(): Promise<string | null> {
  if (provider() !== '0g') return null;
  try {
    const res = await fetch(`${zerogBaseURL()}/v1/models`, { signal: AbortSignal.timeout(8000) });
    if (!res.ok) return `Could not read the 0G model list (HTTP ${res.status}).`;
    const body = (await res.json()) as { data?: { id: string }[] };
    const ids = (body.data ?? []).map((m) => m.id);
    if (!ids.includes(aiModel())) {
      const claude = ids.filter((id) => id.startsWith('claude')).join(', ');
      return `Model "${aiModel()}" is not in the 0G catalog. Claude models there: ${claude || 'none found'}.`;
    }
    return null;
  } catch {
    return 'Could not reach 0G to check the model list.';
  }
}

const CARE_SYSTEM = `You support the pastoral care team of a local church. Attendees write prayer and care requests from the pew in their own language. Personal details have already been replaced by tokens such as [PERSON_REDACTED_1] or [PHONE_REDACTED_1]: never guess or reconstruct what they stood for.

Rules:
- You draft; a human pastor reviews, edits and approves every word. Nothing you write reaches the attendee unless a human approves it.
- Never quote or paraphrase Bible verses yourself. A verse is attached separately from the church's approved text; you only pick its id.
- Never give medical, legal, immigration or financial advice, and never promise money or services. Offer prayer, presence and a next step with real people.
- If there is any sign of self-harm, suicidal thoughts, abuse, violence or immediate danger, set safety_concern to true. When in doubt, set it to true.
- Use the vocabulary of the church's tradition.
- Never put a token such as [PERSON_REDACTED_1] in the draft reply: greet the person warmly without a name.`;

const TriageSchema = z.object({
  safety_concern: z.boolean(),
  safety_reason: z.string().describe('Empty if no concern. Otherwise one sentence for the pastor.'),
  category: z.enum([
    'Homesickness & Student Transition',
    'Grief & Pastoral Visit',
    'Benevolence & Material Need',
    'Seeker Theological Q&A',
    'Prayer & Exam Anxiety',
  ]),
  urgency: z.enum(['Immediate (Within 4h)', 'High (Within 24h)', 'Standard (Within 48h)']),
  summary_for_leader: z.string().describe('2-3 sentences in the pastor language: what the person shared and what they asked for.'),
  verse_id: z.string().describe('One id from the list of approved passages.'),
  group_id: z.string().describe('One id from the list of groups, or an empty string if none fits.'),
  draft_reply: z.string().describe('A warm reply of 3-5 sentences in the pastor language, written as the pastor, inviting the person to the chosen group if one fits. No Bible quotations.'),
});

export type Triage = z.infer<typeof TriageSchema>;

export async function triageRequest(input: {
  redactedText: string;
  attendeeLanguage: string;
  pastorLanguage: string;
  traditionLabel: string;
  leaderName: string;
  verses: { id: string; reference: string; theme: string }[];
  groups: { id: string; name: string; languages: string[]; schedule: string; audience: string }[];
}): Promise<Triage> {
  const user = `Church: ${input.traditionLabel}. Sign the draft reply as the church's care team, never with a person's name: the pastor who approves it is named separately on the attendee's screen.
Pastor language: ${input.pastorLanguage}. Attendee wrote in: ${input.attendeeLanguage}.

Approved passages (pick one id):
${input.verses.map((v) => `- ${v.id}: ${v.reference} - ${v.theme}`).join('\n')}

Groups (pick one id, or none):
${input.groups.map((g) => `- ${g.id}: ${g.name} (${g.audience}; languages: ${g.languages.join(', ')}; ${g.schedule})`).join('\n')}

<request>
${input.redactedText}
</request>`;
  return structured(TriageSchema, CARE_SYSTEM, user, 'medium', undefined, TRIAGE_TIMEOUT_MS);
}

const TranslationSchema = z.object({ translation: z.string() });

export async function translate(input: {
  text: string;
  from: string;
  to: string;
  traditionLabel: string;
  glossary: string; // empty string means no glossary
}): Promise<string> {
  const system = `You translate pastoral messages for a church (${input.traditionLabel}). Translate faithfully and warmly, keep the meaning exact, keep tokens like [PERSON_REDACTED_1] unchanged, and do not add or remove content.${
    input.glossary
      ? `\n\nThe pastor approved this glossary for ${input.to}. Follow it exactly:\n${input.glossary}`
      : ''
  }`;
  const out = await structured(TranslationSchema, system, `Translate from ${input.from} to ${input.to}:\n\n<text>\n${input.text}\n</text>`, 'low');
  return out.translation;
}

/** Independent back-translation: this call never sees the pastor's original text. */
export async function backTranslate(input: { text: string; from: string; to: string }): Promise<string> {
  const system =
    'You are a careful, literal translator. Translate the text exactly as written, preserving every nuance, without smoothing over awkward or surprising phrasing. Do not guess what the author meant to say.';
  const out = await structured(
    TranslationSchema,
    system,
    `Translate from ${input.from} to ${input.to}:\n\n<text>\n${input.text}\n</text>`,
    'low'
  );
  return out.translation;
}

const DriftSchema = z.object({
  verdict: z.enum(['faithful', 'minor_drift', 'major_drift']),
  issues: z.array(
    z.object({
      original_phrase: z.string(),
      back_translated_phrase: z.string(),
      explanation: z.string().describe('One sentence: how the meaning changed and why it matters pastorally.'),
      severity: z.enum(['minor', 'major']),
    })
  ),
});

export async function compareMeaning(input: { original: string; backTranslation: string; language: string }) {
  const system = `You check whether a pastor's message kept its meaning after being translated and independently translated back. Compare the ORIGINAL with the BACK-TRANSLATION (both in ${input.language}). Report only real changes in meaning: added or lost promises, changed tone (warm vs. cold, invitation vs. command), theological terms that shifted, wrong people or times. Ignore harmless word-order and synonym differences. "major" means the attendee could be misled, hurt or confused.`;
  const out = await structured(
    DriftSchema,
    system,
    `<original>\n${input.original}\n</original>\n\n<back_translation>\n${input.backTranslation}\n</back_translation>`,
    'medium',
    'fast'
  );
  return out;
}

const SermonSchema = z.object({
  title: z.string(),
  summary: z.string(),
  takeaways: z.array(z.string()),
});

export async function translateSermon(input: {
  title: string;
  summary: string;
  takeaways: string[];
  to: string;
  traditionLabel: string;
  glossary: string;
}) {
  const system = `You translate a church's Sunday message notes for attendees who read ${input.to} (${input.traditionLabel}). Translate faithfully; do not add theology, do not add or alter Bible quotations.${
    input.glossary ? `\n\nApproved glossary for ${input.to} (follow exactly):\n${input.glossary}` : ''
  }`;
  const user = `Translate into ${input.to}. Return the title, summary and the same number of takeaways.\n\n<title>${input.title}</title>\n<summary>${input.summary}</summary>\n<takeaways>\n${input.takeaways.map((t, i) => `${i + 1}. ${t}`).join('\n')}\n</takeaways>`;
  return structured(SermonSchema, system, user, 'low');
}

/**
 * One-time translation of the attendee interface (buttons, headings, labels), used by
 * server/scripts/translate-ui.ts. The result is saved in the app, not generated per visit.
 */
export async function translateInterface(input: { strings: Record<string, string>; to: string }): Promise<Record<string, string>> {
  const keys = Object.keys(input.strings);
  // Keys are optional so one skipped key does not fail the batch; the caller retries what is missing.
  const schema = z.object(Object.fromEntries(keys.map((k) => [k, z.string().optional()])) as Record<string, z.ZodOptional<z.ZodString>>);
  const system = `You translate the interface of a church app for newcomers (buttons, headings, short labels, help text) into ${input.to}.
Rules:
- Natural, warm, plain ${input.to} that a newcomer would understand; short where the English is short (buttons stay short).
- Keep every placeholder like {name} or {count} exactly as written.
- Keep "Koinonia" untranslated. Keep pickup codes and numbers unchanged.
- Use neutral Christian vocabulary that suits both Catholic and Protestant churches; do not pick a tradition-specific word for God, the Holy Spirit or the service where a neutral word exists.
- Never use an em dash; use a hyphen or a comma.
- Return every key.`;
  const user = `Translate each value into ${input.to}. Return a JSON object with exactly the same keys.\n\n${JSON.stringify(input.strings, null, 2)}`;
  const out = (await structured(schema, system, user, 'low')) as Record<string, string | undefined>;
  return Object.fromEntries(
    keys.filter((k) => typeof out[k] === 'string' && out[k]!.trim()).map((k) => [k, out[k]!.replace(/\u2014/g, '-')])
  );
}

/**
 * One-time translation of a church's own service guide and 7-day plan text (not Scripture),
 * used by server/scripts/translate-content.ts. Saved in the app, not generated per visit.
 */
export async function translateContent(input: {
  strings: Record<string, string>;
  to: string;
  traditionLabel: string;
  glossary: string;
}): Promise<Record<string, string>> {
  const keys = Object.keys(input.strings);
  const schema = z.object(Object.fromEntries(keys.map((k) => [k, z.string().optional()])) as Record<string, z.ZodOptional<z.ZodString>>);
  const system = `You translate a church's guide to its Sunday service and its 7-day reading plan into ${input.to}, for newcomers who read ${input.to} (${input.traditionLabel}).
Rules:
- Translate faithfully and warmly. Do not add theology, and do not add, quote or alter Bible verses.
- Use the vocabulary of this church's tradition.
- Keep names of people, places and groups as written (for example Basilica di San Venanzio, UNICAM, Camerino, Grace Fellowship).
- Text in Italian inside parentheses or «» quotes is what is said aloud in the service: keep it exactly as written.
- Where the English gives a spoken response, give the response as it is said in ${input.to} services if you know it.
- Keep times, numbers and the bullet "•" as written. Never use an em dash; use a hyphen or a comma.
- Return every key.${input.glossary ? `\n\nApproved glossary for ${input.to} (follow exactly):\n${input.glossary}` : ''}`;
  const user = `Translate each value into ${input.to}. Return a JSON object with exactly the same keys.\n\n${JSON.stringify(input.strings, null, 2)}`;
  const out = (await structured(schema, system, user, 'low')) as Record<string, string | undefined>;
  return Object.fromEntries(
    keys.filter((k) => typeof out[k] === 'string' && out[k]!.trim()).map((k) => [k, out[k]!.replace(/—/g, '-')])
  );
}
