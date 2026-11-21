# Koinonia (Κοινωνία)

**Every newcomer in the pew can be heard - in their own language.**

Koinonia lets someone who doesn't speak the church's language ask for prayer or help in their own, and lets the pastor answer in theirs. Personal details are removed on the attendee's phone, a person approves every reply, and urgent cries for help go straight to a human.

Inspired by the Basilica di San Venanzio in Camerino, Italy, where students of UNICAM from dozens of countries worship alongside local families. The Basilica profile is sample data showing how the app would work in a Catholic university parish; it is not an official parish tool.

Track: **Care & Community** - AI for Church Hackathon 2026.

---

## What it does

| Feature | What actually happens |
|---|---|
| **Two-way care bridge** | An attendee writes in any of 12 languages. The pastor reads an AI summary and drafts a reply in English or Italian. Koinonia translates it into the attendee's language. |
| **Personal details stay on the phone** | Names (self-introductions), phone numbers, emails, student IDs and street addresses are replaced with tokens in the browser before anything is sent (`src/utils/privacyShield.ts`). The server and the AI only receive the scrubbed text. The original wording is kept in the attendee's browser only. |
| **Meaning-drift check** | Each reply is translated, then translated back by a separate AI call that never sees the original, then a third call compares the two and highlights phrases whose meaning changed. Approval is blocked until the check has run on the exact text being sent; a "major drift" result needs an explicit confirmation. |
| **Reply by pickup code** | The attendee gets a short code (e.g. `K7Q-4XM`) and reads the approved reply at `/#/pickup/K7Q-4XM`. No phone number, email or account. |
| **Crisis fast lane** | A multilingual keyword screen (browser and server) plus an AI safety flag. A match never gets an AI draft: it skips the queue, the attendee immediately sees local crisis lines (112/1522 in Italy; 911/988 and the DV hotline in the US) in their language, every open dashboard shows a red alert, and the attendee may optionally leave a callback number for a human. |
| **Tradition glossary** | Catholic and Protestant vocabulary differs within one language (하느님 / 하나님, 天主·圣神 / 上帝·圣灵, Mass / service). The pastor approves a glossary once; translations are instructed to follow it and every output is checked word by word. A side-by-side "with vs. without glossary" comparison is built in. |
| **Live service cues** | A volunteer taps "Next" in the console; every phone with "Follow live" on jumps to the same moment of the service, explained in the reader's language (server-sent events). |
| **Language-demand insights** | Each pew scan stores only a language and a timestamp. Counts are compared with the greeter rota to suggest e.g. "Arabic scans up 120%, and no Arabic-speaking greeter is scheduled at the 11:00 Mass." Generated sample history is clearly labelled. |
| **Sermon publisher** | Write the notes once in English; with AI on, they are translated into all 12 languages with the glossary and published to the pew companion. The theology checklist starts unticked. |
| **Staff sign-in and roles** | Three roles, enforced by the server: **Pastor** (approves replies, the glossary and Sunday notes), **Care team** (drafts and runs the meaning check, cannot approve) and **Welcome volunteer** (live cues and greeter planning, cannot read care requests). Fictional demo accounts: `andrea` (pastor), `grace` (care team), `minh` (welcome); password = `STAFF_PASSCODE`. With `DEMO_LOGIN=true` the sign-in page offers them as one-click buttons. Approvals record who signed in. Attendees never sign in: the pew page, sending a request, the pickup page and live cues stay open. Sessions are HttpOnly cookies (only a hash of the token is stored), and repeated wrong passcodes are blocked for 15 minutes. |
| **Read-aloud in a native voice** | The homily, the Bible passage and each step of the service can be read aloud by ElevenLabs, with one native voice per language. English uses an American voice for the US church and a British one for the Italian parish. Each clip is generated once and cached, so a whole room costs one generation. Prayer requests and replies are never sent to ElevenLabs. Without a key, the phone's own voice is used. |
| **The whole pew page in your language** | Every button, heading and label on the attendee pages switches to the chosen language, and Arabic is right-to-left throughout. The 116 interface strings were translated once by Claude and saved in `src/lib/i18n/`; they are marked as machine-translated in the app. The church's glossary also applies to the interface, so a Catholic parish reads 미사 where a Protestant church reads 예배. |
| **Printable pew card** | A real, scannable QR code. When running locally it encodes this computer's Wi-Fi address so a phone on the same network can open it. |

## How AI is used (and where it isn't)

- **AI does:** summarise requests, pick a passage id and a group, draft replies, translate, back-translate, compare meaning, translate sermon notes. Model: Claude Opus 5.5, called with the official Anthropic SDK. By default it goes through the **0G Compute Router** (`ZEROG_API_KEY`, model `claude-opus-5.5`, Anthropic-compatible `/v1/messages`); answers come back through a single tool call and are validated against a schema. With `ANTHROPIC_API_KEY` instead, it calls the Anthropic API directly with native structured outputs and server-side model fallback.
- **AI never:** sees names or contact details, writes or translates Bible text (passages are shown from stored text by id), answers a crisis request, or sends anything by itself.
- **Known limits:** the privacy filter is pattern-based. It catches common formats and self-introductions ("My name is…", "Mi chiamo…", "我叫…"), but it can miss a name written another way, or in Arabic, Korean and other languages. Attendees are asked not to name other people. The Bible passages in the demo are sample text; a church should connect its licensed translation before real use.

The project itself was built with the help of Claude (Claude Code).

## Run it

```bash
npm install
# optional: paste your 0G key into ZEROG_API_KEY in .env.local to turn on live AI
#           (or ANTHROPIC_API_KEY to call Anthropic directly; see .env.example)
npm run dev               # website on http://localhost:5180 + local API on 127.0.0.1:8787
```

The server restarts by itself when `.env.local` is saved. Without a key Koinonia runs in **sample mode**: everything works (privacy filter, crisis lane, pickup codes, approvals, live cues, insights, QR), but triage and translations show fixed sample text, labelled "sample" everywhere they appear.

Pages:

- `/#/` - landing page
- `/#/app/care` - Care Bridge (staff sign-in required for every `/#/app/...` page) (pastor's queue, drift check, crisis lane, glossary)
- `/#/app/live` - live service console
- `/#/pew?church=san-venanzio-unicam&lang=ar` - what a phone opens from the pew card
- `/#/pickup/CODE` - where the attendee reads the reply

Data is kept in `server/data/store.json` (scrubbed text, counts and settings only). "Reset demo" in the header clears it.

## Project layout

```
server/           local API: Claude calls (key stays server-side), care queue, pickup codes, SSE, insights
  ai.ts           triage, translate, back-translate, compare, sermon translation (structured outputs)
  sample.ts       labelled sample output when no API key is set
src/shared/       code shared by browser and server: crisis screen, glossary, roster, types
src/components/   Landing, CareBridge, GlossaryPanel, LiveServiceConsole, LanguageInsights, PickupPage, …
src/utils/privacyShield.ts   in-browser personal-detail filter
src/components/brand/  logo (vesica), custom icons, language tiles, flags, rose window, iPhone frame
public/shots/     real screenshots of the app used on the landing page (sample data)
DESIGN.md         the design system ("the missal"): tokens, type, components, rules
```
