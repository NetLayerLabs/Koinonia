// Music bed -> public/audio/music.mp3, sized to src/timing.json totalFrames/30 + 2s.
//   node scripts/music.mjs            (skips if music.mp3 exists; FORCE=1 to redo)
// Path A: ElevenLabs Music API (POST /v1/music). Path B (fallback): several looped
// sound-generation beds stitched with ffmpeg crossfades. Writes .cache/music.json
// { source, bpm, offsetSec } for timing.mjs (beats).
import { readFileSync, writeFileSync, existsSync, mkdirSync } from "node:fs";
import { execFileSync } from "node:child_process";
import { join } from "node:path";
import { ROOT, post, retry } from "./env.mjs";

const OUT = process.env.MUSIC_OUT ? join(ROOT, process.env.MUSIC_OUT) : join(ROOT, "public/audio/music.mp3"); // MUSIC_OUT: write a candidate elsewhere
const META = process.env.MUSIC_OUT ? join(ROOT, `${process.env.MUSIC_OUT}.json`) : join(ROOT, ".cache/music.json");
mkdirSync(join(ROOT, ".cache/music"), { recursive: true });
const timing = existsSync(join(ROOT, "src/timing.json")) ? JSON.parse(readFileSync(join(ROOT, "src/timing.json"), "utf8")) : { totalFrames: 3540 };
const seconds = Math.ceil(timing.totalFrames / 30 + 2);

const PROMPT =
  "Warm, reverent, modern cinematic score for a short film about a church welcoming newcomers who speak other languages. About 84 BPM. " +
  "Felt piano, warm strings, soft cello, gentle organ-like pads, light plucked harp, a soft heartbeat pulse. Hopeful and human, never cheesy. No vocals, no choir. " +
  "It plays continuously from the first second to the last, with no breaks and no silence.";

// The score is generated from a composition plan keyed to src/timing.json (exact section lengths), so its
// shape follows the cut: the PROMPT above is the fallback if the plan is refused.
const SC = Object.fromEntries((timing.scenes || []).map((x) => [x.id, x]));
const lineStart = (id, i) => SC[id]?.lines?.[i]?.startFrame;
// Six sections; the dip under the meeting is shaped by the mix (src/Film.tsx), so the score itself never stops.
const cuts = SC.hook ? [0, SC.turn.from, SC.pew.from, SC.crisis.from, SC.words.from, SC.why.from, timing.totalFrames + 60] : null;
const KEEP = ["silence", "breaks", "pauses", "stops", "drop outs"];
const SECTIONS = [
  ["Alone", ["starts on the very first second", "a lone felt piano melody in a large reverberant space", "a low warm drone", "quiet, tender, a little ache", "sparse"], ["silence", "fade in", "drums", "choir"]],
  ["Light", ["a gentle swell of warm strings", "the piano opens up into hope", "builds to one clear resolving chord", "spacious"], [...KEEP, "drums", "choir"]],
  ["Together", ["a soft steady heartbeat pulse comes in and keeps going", "warm piano and plucked harp", "strings underneath", "gentle forward motion", "leaves room for speech"], [...KEEP, "loud drums", "choir"]],
  ["Hold", ["the pulse drops away", "low sustained cello and soft pads", "serious and careful, but warm", "quiet and continuous"], [...KEEP, "drums", "choir"]],
  ["Lift", ["the pulse returns", "warm, confident, rising strings", "fuller piano", "continuous"], [...KEEP, "choir"]],
  ["Resolve", ["broad warm strings and felt piano", "a gentle final crescendo", "settles into one final chord held through the last three seconds"], ["silence", "abrupt stop", "early fade out", "drums", "new melody", "choir"]],
];
const PLAN = cuts ? {
  positive_global_styles: ["warm reverent cinematic score", "felt piano", "warm strings", "soft cello", "gentle pads", "84 bpm", "hopeful, human, sacred but modern", "instrumental"],
  negative_global_styles: ["vocals", "lyrics", "choir", "dubstep", "aggressive drums", "cheesy", "epic trailer"],
  sections: SECTIONS.map(([section_name, positive_local_styles, negative_local_styles], i) => ({
    section_name, positive_local_styles, negative_local_styles, lines: [],
    duration_ms: Math.round(((cuts[i + 1] - cuts[i]) / 30) * 1000),
  })),
} : null;

const ff = (a) => execFileSync("ffmpeg", ["-y", "-loglevel", "error", ...a]);
const dur = (f) => parseFloat(execFileSync("ffprobe", ["-v", "error", "-show_entries", "format=duration", "-of", "default=nw=1:nk=1", f]).toString());

// Rough BPM + first-beat offset from an onset envelope (low-passed energy, 10ms hops) via autocorrelation.
function detectBpm(file) {
  const raw = execFileSync("ffmpeg", ["-loglevel", "error", "-i", file, "-t", "60", "-ac", "1", "-ar", "8000", "-af", "lowpass=f=200", "-f", "s16le", "-"], { maxBuffer: 1 << 28 });
  const s = new Int16Array(raw.buffer, raw.byteOffset, raw.length >> 1);
  const hop = 80; // 10ms
  const env = [];
  for (let i = 0; i + hop <= s.length; i += hop) { let e = 0; for (let j = 0; j < hop; j++) e += s[i + j] * s[i + j]; env.push(Math.sqrt(e / hop)); }
  const on = env.map((v, i) => Math.max(0, v - (env[i - 1] ?? v)));
  let best = { bpm: 100, score: -1 };
  for (let bpm = 80; bpm <= 140; bpm += 0.5) {
    const lag = 6000 / bpm; // in 10ms hops
    let sc = 0;
    for (let i = 0; i + lag * 2 < on.length; i++) sc += on[i] * (on[Math.round(i + lag)] + on[Math.round(i + 2 * lag)]);
    if (sc > best.score) best = { bpm, score: sc };
  }
  // phase: best offset within one beat
  const lag = 6000 / best.bpm;
  let ph = { off: 0, sc: -1 };
  for (let o = 0; o < lag; o++) { let sc = 0; for (let t = o; t < on.length; t += lag) sc += on[Math.round(t)] || 0; if (sc > ph.sc) ph = { off: o, sc }; }
  return { bpm: best.bpm, offsetSec: +(ph.off / 100).toFixed(3) };
}

if (existsSync(OUT) && !process.env.FORCE) {
  console.log("music.mp3 exists (FORCE=1 to regenerate)");
} else {
  let source;
  try {
    let buf;
    if (PLAN && !process.env.PROMPT_ONLY) {
      try {
        console.log(`plan: ${PLAN.sections.map((x) => `${x.section_name} ${(x.duration_ms / 1000).toFixed(1)}s`).join(" | ")}`);
        buf = await retry(async () => {
          const res = await post("/music?output_format=mp3_44100_128", { composition_plan: PLAN });
          return Buffer.from(await res.arrayBuffer());
        }, 2);
        source = "elevenlabs-music (composition plan)";
      } catch (e) { console.error(`plan refused (${e.message.slice(0, 200)}); trying the prompt`); }
    }
    if (!buf) {
      buf = await retry(async () => {
        const res = await post("/music?output_format=mp3_44100_128", { prompt: PROMPT, music_length_ms: seconds * 1000, force_instrumental: true });
        return Buffer.from(await res.arrayBuffer());
      }, 2);
      source = "elevenlabs-music";
    }
    writeFileSync(OUT, buf);
  } catch (e) {
    console.error(`Music API unavailable (${e.message.slice(0, 160)}); falling back to sound-generation beds`);
    const BEDS = [
      ["tense", "Tense low synth pulse loop with muted kick like a racing heartbeat, 100 bpm, minimal electronic, sparse, no vocals", 17],
      ["swell", "Reversed cinematic swell rising into silence, 100 bpm, no drums", 5],
      ["groove", "Confident uplifting minimal electronic groove loop, 100 bpm, crisp percussion, warm plucks, no vocals", 22],
      ["build", "Rising optimistic minimal electronic groove loop building energy, 100 bpm, crisp hats, warm plucks, no vocals", 22],
      ["outro", "Soft resolving minimal electronic outro, 100 bpm, warm pads, ends with one clean final hit, no vocals", 12],
    ];
    const parts = [];
    for (const [n, text, d] of BEDS) {
      const f = join(ROOT, ".cache/music", `${n}.mp3`);
      if (!existsSync(f)) {
        const res = await retry(() => post("/sound-generation?output_format=mp3_44100_128", { text, duration_seconds: d, prompt_influence: 0.5 }));
        writeFileSync(f, Buffer.from(await res.arrayBuffer()));
      }
      parts.push(f);
    }
    // layout: tense(loop to 17s) swell(5) groove(loop) build(loop) outro(12) with 1s crossfades
    const grooveLen = (seconds - 17 - 5 - 12) / 2 + 2;
    const segs = [[parts[0], 17.5], [parts[1], 5.5], [parts[2], grooveLen], [parts[3], grooveLen], [parts[4], 12]];
    const inputs = segs.flatMap(([f]) => ["-stream_loop", "-1", "-i", f]);
    let fc = segs.map(([, d], i) => `[${i}:a]atrim=0:${d},asetpts=PTS-STARTPTS[s${i}]`).join(";");
    let prev = "s0";
    for (let i = 1; i < segs.length; i++) { fc += `;[${prev}][s${i}]acrossfade=d=1[x${i}]`; prev = `x${i}`; }
    fc += `;[${prev}]atrim=0:${seconds},afade=t=out:st=${seconds - 1.5}:d=1.5[out]`;
    ff([...inputs, "-filter_complex", fc, "-map", "[out]", "-b:a", "192k", OUT]);
    source = "sound-generation-stitched";
  }
  const beat = detectBpm(OUT);
  writeFileSync(META, JSON.stringify({ source, ...beat, seconds }, null, 1));
}
const meta = JSON.parse(readFileSync(META, "utf8"));
console.log(`music.mp3 ${dur(OUT).toFixed(1)}s (target ${seconds}s) via ${meta.source}; bpm ~${meta.bpm}, first beat ${meta.offsetSec}s`);
console.log("re-run: node scripts/timing.mjs  (to write bpm/beats)");
