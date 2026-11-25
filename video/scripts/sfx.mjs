// Sound effects via ElevenLabs /v1/sound-generation. Skips files that already exist.
//   node scripts/sfx.mjs                 all missing
//   ONLY=stamp,impact node scripts/sfx.mjs   force regenerate some
import { writeFileSync, mkdirSync, existsSync } from "node:fs";
import { join } from "node:path";
import { ROOT, post, retry } from "./env.mjs";

const SFX = {
  room: ["Quiet large stone church interior ambience, soft natural reverb, faint distant footsteps and a cough far away, no music, no voices", 14],
  bell: ["A single distant church bell toll ringing out over a small Italian hill town, long natural decay, no music", 5],
  page: ["A thin missal page turned softly in a quiet church, close, gentle", 1],
  tap: ["Single soft fingertip tap on a phone glass screen, close and clean", 0.5],
  keys: ["Soft fast typing on a smartphone touch keyboard, gentle haptic taps, close, clean, no music", 6],
  send: ["Soft airy message sent swoosh, modern phone, short and gentle", 0.8],
  chime: ["Warm clean confirmation chime, two soft ascending bell notes, gentle, short tail", 1.5],
  notify: ["Soft single notification ping on a laptop, warm, gentle, short", 0.7],
  seal: ["A wax seal pressed firmly onto paper, soft thud with a slight crackle, close", 0.8],
  alert: ["Low serious two-note alert tone, calm but urgent, clean, short, modern interface", 1.2],
  whoosh: ["Soft slow airy whoosh, smooth cinematic transition, no music", 1.2],
  impact: ["Deep warm cinematic impact with a long soft reverb tail like a low bell, single hit, modern", 3],
  riser: ["Gentle airy rising swell building to a peak, warm, cinematic, no drums", 3],
  candle: ["A match struck and a candle wick catching, quiet church, close", 1.5],
  pop: ["Soft paper card placed down on a wooden table, gentle, short", 0.5],
  street: ["Quiet old Italian town street ambience in the morning, distant footsteps on stone, birds, a far scooter, no music", 8],
};

const dir = join(ROOT, "public/audio/sfx");
mkdirSync(dir, { recursive: true });
const only = process.env.ONLY ? process.env.ONLY.split(",") : null;

for (const [name, [text, dur]] of Object.entries(SFX)) {
  const f = join(dir, `${name}.mp3`);
  if (only ? !only.includes(name) : existsSync(f)) { console.log(`${name}: skip`); continue; }
  try {
    const buf = await retry(async () => {
      const res = await post("/sound-generation?output_format=mp3_44100_128", { text, duration_seconds: dur, prompt_influence: 0.5 });
      return Buffer.from(await res.arrayBuffer());
    });
    writeFileSync(f, buf);
    console.log(`${name}: ${(buf.length / 1024).toFixed(0)}kb`);
  } catch (e) { console.error(`${name}: FAILED ${e.message}`); }
}
