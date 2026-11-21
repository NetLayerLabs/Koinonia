# AI for Church Hackathon 2026 - Submission Guide

- **Deadline:** Friday, November 27, 2026, 11:59 PM ET. Aim to submit by Wednesday, November 25. A draft does not count; click Submit.
- **Track:** Care & Community.
- **Video:** 5 minutes or less (YouTube, Vimeo or Loom). It is played at the live showcase on Tuesday, December 1, 12:00 PM ET.
- **Team:** Netlayer Labs (solo).
- **Live demo:** https://koinonia.netlayerlabs.com.
- **Code:** https://github.com/NetLayerLabs/Koinonia (make it public, or share access, if the form asks for code).

Record the video against the live site, with AI and voices on, and check every claim below against what is on screen.

---

## Project name
Koinonia

## Tagline
Every newcomer in the pew can be heard - in their own language. A pastor answers in theirs, a person approves every word, and a cry for help always reaches a human.

## Description (paste into the form)

```text
Every Sunday, international students, immigrants and quiet seekers sit through services they can't fully follow, then leave without anyone knowing they needed prayer or help. Translation apps help them hear the sermon. Nothing helps them be heard - and the care team often can't read their request, or pastes private details into a public AI tool to try.

Koinonia is a two-way pastoral care bridge. A newcomer scans a card in the pew - no app, no account - and the whole page switches to their language (12 languages, Arabic right-to-left). They follow the homily, hear it read aloud by a native voice, and ask for prayer or help in their own words. Names, phone numbers, emails, student IDs and addresses are removed on their phone before anything is sent.

The pastor reads an AI summary in their own language and writes the reply in their own language. Before they can approve, Koinonia translates the reply, translates it back with a separate AI call that never saw the original, and highlights any phrase whose meaning changed. A glossary the pastor approves once keeps every translation - and the interface itself - in the church's own vocabulary: Catholics and Protestants use different words for God, the Holy Spirit and the service in Korean, Chinese and Vietnamese.

The newcomer reads the approved reply with a private pickup code. Requests showing self-harm, abuse or danger skip the AI entirely: the phone instantly shows local crisis lines in the person's language, and every open dashboard raises an alert so a person responds.

Staff sign in with a role, and the server enforces it: only a pastor can release a reply; the care team drafts and checks; welcome volunteers run live service cues - one tap moves every phone in the pews - and see which language groups are arriving without a greeter who speaks their language. On a phone, the staff app works like a native app.

How we use AI: Claude (served through the 0G Compute Network) summarises, drafts, translates and checks translations. It never sees personal details, never writes Bible text, never answers a crisis, and never sends anything without a person's approval. Voices are ElevenLabs, for public text only. The interface translations are machine-made and say so. The privacy filter is pattern-based and can miss unusual names, so attendees are asked not to name others.

Inspired by the Basilica di San Venanzio in Camerino, Italy, where university students from many countries worship with local families. The parish and US church in the demo are sample profiles with fictional people. Built with Claude Code during the hackathon.
```

---

## Demo video script (about 4 min 30 s)

Have two screens: the laptop (staff) and your phone (pew page; scan the QR code on the landing page or the Pew card tab).

| Time | Scene | What to show and say |
|---|---|---|
| 0:00-0:25 | **The problem** | Landing page, rose window turning. "Every Sunday, newcomers sit in the pews unable to follow, and leave without anyone knowing they needed prayer. Translation apps help them hear. Nothing helps them be heard." |
| 0:25-1:05 | **The pew, in their language** | On the phone, scan the card, pick Arabic: the whole app turns right-to-left. Switch to Italiano and tap Ascolta: a native Italian voice reads the homily. "No app, no account, every word in their language." |
| 1:05-1:45 | **Asking for help, privately** | Prayer tab. Type in Spanish: "Hola, me llamo Lucía... mi número es +39 333...". Show the name and number turning into black bars as you type. Send; show the pickup code. "Personal details never leave the phone." |
| 1:45-2:50 | **The pastor answers** | Laptop: sign in as Grace (care team). The request is waiting, with the AI summary. Run "Translate and check": show the Spanish, the independent back-translation, and the verdict. Point out the Approve button is locked for the care team. Sign in as Fr. Andrea (pastor), approve. "The AI drafts. A pastor decides." |
| 2:50-3:10 | **The reply** | Phone: open the reply with the code: the approved reply, now with the person's own name restored on their own phone, the passage and the group invitation. |
| 3:10-3:35 | **Tradition glossary** | Care Bridge, Tradition glossary, Korean: "God loves you, and the Holy Spirit is with you." Compare without and with: 하나님 flagged, 하느님 for a Catholic parish. Switch the pew page to Korean in each church: 미사 for the parish, 예배 for the Protestant church. |
| 3:35-3:55 | **Crisis lane** | Phone, English: "I don't feel safe at home tonight." Crisis lines appear instantly; the laptop shows the red alert; open it: "No AI reply was drafted." |
| 3:55-4:20 | **Sunday** | Live service: tap Next and the phone moves. Today screen: "Arabic readers up this month, and no Arabic-speaking greeter at 11:00." |
| 4:20-4:30 | **Close** | Landing page. "Koinonia: every newcomer heard, in their own language." Show the URL. |

Tips: rehearse once; record in 1080p; use a real phone (screen mirroring) for the phone shots; keep the cursor slow.

---

## Judges and visitors

- **Staff sign-in:** one-click demo accounts on the sign-in page (Fr. Andrea Ricci, pastor; Grace Adeyemi, care team; Minh Tran, welcome volunteer). All are fictional.
- **The public demo:**
  - limits AI use per visitor;
  - never turns a request away: past the limit, it skips only the AI summary;
  - resets itself to clean sample data every night at 08:00 UTC (3 AM New York).

## Before submitting

- [x] Sample clergy renamed to fictional people (Don Tommaso Ferrante, Sr. Chiara Benedetti)
- [x] Deployed at koinonia.netlayerlabs.com, with live AI, native voices and public-demo safeguards
- [ ] DNS record added (A, `koinonia`, 38.49.213.208) and HTTPS working
- [ ] Read-aloud works on a real phone: tap Ascolta on the Italian page
- [ ] Phone: the top and bottom bars clear the notch and home bar; tapping a text field does not zoom
- [ ] A native speaker skims Italian, Spanish and Arabic
- [ ] Video recorded against the live site and uploaded
- [ ] Screenshots uploaded (real ones in `public/shots/`, plus live-site captures)
- [ ] Submitted (not a draft) by November 25
- [ ] Link shared with your church and friends for People's Choice; showcase is December 1, 12:00 PM ET
