# AI for Church Hackathon 2026 — Submission Guide

Deadline: **November 27, 2026, 11:59 PM ET** · Track: **Care & Community** · Video: **5 minutes or less** (YouTube, Vimeo or Loom)

Before recording: paste your 0G key into `ZEROG_API_KEY` in `.env.local` so the video shows live translation and the drift check, not sample mode. Check every claim below against what is on screen.

---

## Project name
Koinonia

## Tagline
Every newcomer in the pew can be heard — in their own language. A two-way pastoral care bridge with on-phone privacy, a meaning-drift check, and a crisis lane that always goes to a person.

## Description (paste into the form)

```text
Every Sunday, international students, immigrants and quiet seekers sit through services they can't fully follow, then leave without anyone knowing they needed prayer or help. Translation tools help them hear the sermon. Nothing helps them be heard — and the care team often can't read their request, or pastes private details into public AI tools to try.

Koinonia is a two-way care bridge. An attendee scans a card in the pew (no app), and writes a prayer or care request in any of 12 languages. Names, phone numbers, emails, student IDs and addresses are removed on their phone before anything is sent. The pastor reads an AI summary in their own language, writes the reply in their own language, and Koinonia translates it.

Before the pastor can approve, Koinonia translates the reply back with a separate AI call that never saw the original, compares the two, and highlights any phrase whose meaning changed. A glossary the pastor approves once keeps every translation in the church's own vocabulary — Catholics and Protestants use different words for God and the Holy Spirit in Korean, Chinese and Vietnamese, and generic translation gets this wrong.

The attendee reads the approved reply with a private pickup code — no phone number, email or account. Requests showing self-harm, abuse or danger, in any of the 12 languages, skip the AI entirely: the attendee instantly sees local crisis lines in their language, and every open dashboard shows an alert so a person responds.

Koinonia also helps the whole service: a volunteer taps "Next" and every phone in the pews follows the service live in its reader's language; anonymous scan counts show leaders where a language group is growing without a greeter who speaks it; and sermon notes are published in all 12 languages with the glossary applied.

How we use AI: Claude Opus 5.5, served through the 0G Compute Network, summarises, drafts, translates and checks translations. It never sees personal details, never writes Bible text, never answers a crisis, and never sends anything — a person approves every reply. The privacy filter is pattern-based and can miss unusual names, so attendees are asked not to name others.

Inspired by the Basilica di San Venanzio in Camerino, Italy, where UNICAM students from dozens of countries worship with local families. Includes a Catholic parish profile and a US Protestant church profile. Built with Claude Code during the hackathon window.
```

---

## Demo video script (about 4 minutes)

Have two screens visible: the laptop (Care Bridge) and your phone (pew view, opened by scanning the QR code in the Pew QR Kit tab — same Wi-Fi).

**0:00–0:30 — The problem.** Landing page. "Every Sunday at the Basilica di San Venanzio in Camerino, students from dozens of countries sit in the pews… Translation apps help them hear. Nothing helps them be heard."

**0:30–1:20 — The pew.** On your phone: scan the card, choose Arabic (right-to-left). Open *Prayer & Care*, type a request with a name and phone number, and show them disappearing in the black box as you type. Send it; show the pickup code.

**1:20–2:30 — The pastor.** On the laptop, the request appears in the Care Bridge. Show "Original wording" is not available ("stays on the attendee's phone"). Write the reply in Italian. Click *Translate and check meaning*: show the Arabic, the independent back-translation, and the verdict. Then deliberately add an ambiguous phrase, re-check, and show the flagged drift. Fix it, approve.

**2:30–2:50 — Pickup.** On the phone, open the reply page: the approved reply, the passage from stored text, the group invitation.

**2:50–3:20 — Tradition glossary.** Open *Tradition glossary*, choose Chinese or Korean, type a neutral sentence such as "God loves you, and the Holy Spirit is with you. We are praying for you." (avoid words like "Mass" or "priest", which already tell the AI the church is Catholic), click *Compare live translations*: without the glossary vs. with it (天主 / 上帝, 하느님 / 하나님). Switch the header to Grace Fellowship and show the terms flip.

**3:20–3:45 — Crisis lane.** On the phone, send "I don't feel safe at home". The phone immediately shows crisis lines in the attendee's language; the laptop shows the red alert. Open it: "No AI reply was drafted."

**3:45–4:10 — Live cues and insights.** *Live service* tab: tap Next; the phone (with Follow live on) moves. *Groups, volunteers & insights*: "Arabic scans up, and no Arabic-speaking greeter at the 11:00 Mass." Close: "Koinonia — every newcomer heard."

---

## Before submitting

- [ ] Judges can sign in: with `DEMO_LOGIN=true` they use the one-click demo accounts (sample data only, but anyone with the link can then use your AI credits); otherwise give them a username and `STAFF_PASSCODE` in the submission notes
- [ ] `.env.local` has a working key and the header shows **Live AI**
- [ ] Deploy (optional but recommended) so judges have a live link, and print a test card pointing at it
- [x] Sample clergy renamed to fictional people (Don Tommaso Ferrante, Sr. Chiara Benedetti); the rules forbid real people's personal information
- [ ] Read-aloud works on a real phone (ElevenLabs key set; tap Listen on the Italian page)
- [ ] Interface translations: ask a native speaker to skim at least Italian, Spanish and Arabic
- [ ] Description and video match exactly what is on screen
