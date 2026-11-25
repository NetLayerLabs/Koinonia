# Koinonia: the demo film

A 3:52 film for the judges of the AI for Church Hackathon 2026 (Care & Community track): a story, the problem, then Koinonia working for real on the live site.

- Output: `out/koinonia-demo-4k.mp4` (3840x2160, 30 fps), `out/koinonia-thumbnail.png` / `.jpg`.
- Remotion 4.0.530, React 19, TypeScript. Voices, music and sound effects from ElevenLabs.
- Nothing here is part of the app: `video/` is excluded from the app's TypeScript and from `deploy/deploy.sh`.

## The film

| Time | Scene | Picture |
|---|---|---|
| 0:00 | Story | A young woman praying alone in a pew; the vault of a church with the app's own Italian order of service drifting over it. |
| 0:12 | Problem | A university town, students, a couple in the pews; "Nothing helps them be heard."; a request the care team can't read, and one pasted, name and number included, into a public chatbot. |
| 0:35 | Koinonia | The rose window draws itself; requests travel in (red), replies travel out (gold); the logo. |
| 0:48 | The pew page | The live pew page: English, then Arabic right to left, then Italian, and the app's own Italian voice reading the homily. |
| 1:10 | Asking privately | Lucía's request typed on the live page in Spanish; her name and number turn into tokens on the phone; her private code. |
| 1:28 | The Care Bridge | The live Care Bridge: the AI summary, passage, group and English draft; the translation into Spanish, the independent back-translation, "Meaning kept"; the pastor approves. |
| 1:57 | The reply | Her phone opens the reply: Spanish, "Aprobado por Fr. Andrea Ricci", the psalm, the group. |
| 2:12 | Crisis lane | "I don't feel safe at home tonight." typed on a phone; crisis lines at once; the pastor's dashboard turns red at the same moment. |
| 2:30 | The church's own words | 하느님 / 하나님; the glossary comparison run live; 미사 and 예배 on the two churches' Korean pew pages. |
| 2:49 | Sunday | A volunteer taps Next on the live console; a phone following in Arabic moves; the welcome-team insights. |
| 3:05 | Under the hood | Claude via the 0G Compute Network, ElevenLabs; and what Claude never does. |
| 3:27 | Why it is different | Privacy on the phone, a meaning check before every reply, a person for every cry for help. |
| 3:40 | Close | Logo, "Every newcomer, heard.", the URL, the event, and the dramatization notice. |

The motif is Koinonia's own rose window (`src/components/brand/RoseWindow.tsx` in the app, redrawn by frame in `src/ui/Rose.tsx`): twelve petals for the twelve pew languages, red light travelling in for a request, gold travelling out for a reply.

## What is real

- **App footage.** Every app screen is a recording of the live site, https://koinonia.netlayerlabs.com, made on 25 November 2026, about 21:00 to 21:40 UTC with `scripts/capture.mjs` (headless Chromium, real clicks and real typing; phones at 390x844 CSS px, 3x; desktops at 1600x900, 2x). The clips are in `public/footage/*.mp4`, indexed in `src/footage.json`. Parts are sped up or cut (the typing plays at 1.75x; the 16 s wait for the meaning check and the 7 s wait for the pickup code are cut), and this is the only editing of the recordings.
- **AI output.** The summary, draft, Spanish translation, back-translation and verdict ("Meaning kept") are what the live app's AI (Claude through 0G Compute) returned for Lucía's request in that recording; the glossary comparison too. Values quoted in cards are in `data/film.json`, copied from the capture log (`.cache/capture.json`): pickup code FG3-D57, "Aprobado por Fr. Andrea Ricci", Psalm 34:18, "Comunidad Erasmus & Latinoamericana San Venanzio", Tuesdays 20:30, the crisis lines 112 and 1522, the glossary output.
- **The app's Italian voice** (0:53 to 0:58) is the clip the live app's read-aloud returns for the Italian homily (`public/audio/real/homily-it.mp3`, fetched from `/api/tts`, ElevenLabs voice "Koinonia it Marco").
- **The Chinese request** in the problem scene is the app's own sample request. The Spanish request is the one typed in the recording.
- **Insights** (2:58) are the app's sample history, labelled on screen.
- **People.** The people are stock footage from Mixkit under its free licence (`data/stock.json`, with each clip's page), in a dramatization. Lucía, Fr. Andrea Ricci and both churches are the app's sample data and fictional people. The close says so on screen.
- **Logos.** Koinonia's own artwork (`public/brand/koinonia-*.png`, from the app); Claude's mark (Simple Icons); the 0G logo (from 0g.ai); the ElevenLabs logo (from elevenlabs.io/brand). Unaltered, except the Claude mark is tinted its brand orange.
- **Voice, music and effects.** The narrator is ElevenLabs "George" (eleven_multilingual_v2); "Koinonia" is spelled for the voice as "Koy-noh-nee-ah" in `script.json`. The score is ElevenLabs Music from a composition plan keyed to the scenes (`scripts/music.mjs`); 16 effects are ElevenLabs sound generation (`scripts/sfx.mjs`).

## Writes the capture made

The capture wrote to the live demo: one Spanish prayer request with its meaning check and approval (twice: the first draft came back in Spanish, which was a real bug, fixed in `server/ai.ts` and deployed before the second take), one crisis message, one glossary comparison, and a few "Next" taps on the live service. The live data was backed up first and restored afterwards.

## Build it

```bash
cd video
npm install
node scripts/stock.mjs            # the Mixkit clips in data/stock.json
ONLY=landing,lang,ko,insights node scripts/capture.mjs      # read-only clips
ONLY=ask,bridge,reply,crisis,gloss,live node scripts/capture.mjs   # writes to the live demo (see above)
node scripts/encode.mjs           # frames -> public/footage/*.mp4 and src/footage.json
node scripts/voiceover.mjs        # narration (ElevenLabs key read at run time, never stored here)
node scripts/sfx.mjs && node scripts/music.mjs && node scripts/timing.mjs
node scripts/stills.mjs 300 1200 2800    # check frames
npm run draft                     # half-scale draft
npm run render4k && npm run finish   # 4K master, then audio to -14 LUFS / -1 dBTP
npm run poster                    # thumbnail
```

The ElevenLabs key is read at run time from `~/.config/elevenlabs/.env` (`scripts/env.mjs`) and is never printed, logged or copied into this folder.
