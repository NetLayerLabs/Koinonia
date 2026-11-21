import { runZeroPIIShield } from '../utils/privacyShield';

const TOKEN = /\[[A-Z_]+_REDACTED_\d+\]/g;

/**
 * On the attendee's own phone only: put their real details back into a reply that
 * mentions a token like [PERSON_REDACTED_1]. The original wording never left the phone,
 * so we redact it again (the same, deterministic filter), line it up with the original,
 * and read off what each token stood for. Nothing here is sent anywhere.
 */
export function restoreOnDevice(reply: string, original: string | null): string {
  if (!original || !TOKEN.test(reply)) return reply;
  TOKEN.lastIndex = 0;
  const redacted = runZeroPIIShield(original).redactedText;
  const parts = redacted.split(/(\[[A-Z_]+_REDACTED_\d+\])/);
  const values = new Map<string, string>();
  let pos = 0;
  for (let i = 0; i < parts.length; i++) {
    const part = parts[i];
    if (i % 2 === 0) {
      // fixed text: must appear in the original at this point
      const at = original.indexOf(part, pos);
      if (at < 0) return reply;
      pos = at + part.length;
    } else {
      const next = parts[i + 1] ?? '';
      const end = next ? original.indexOf(next, pos) : original.length;
      if (end < 0) return reply;
      values.set(part, original.slice(pos, end));
      pos = end;
    }
  }
  return reply.replace(TOKEN, (t) => values.get(t) ?? t);
}

/** On another device the details are unknown: drop the token rather than show a code
 *  ("Querido/a [PERSON_REDACTED_1], gracias" becomes "Querido/a, gracias"). */
export function dropTokens(text: string): string {
  return text.replace(/\s?\[[A-Z_]+_REDACTED_\d+\]/g, '');
}
