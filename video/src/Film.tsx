import React from "react";
import { AbsoluteFill, Audio, Freeze, Sequence, interpolate, staticFile, useCurrentFrame } from "remotion";
import { T, scene, wordAt, lineEnd } from "./timing";
import { C } from "./theme";
import { Subtitles } from "./ui/Subtitles";
import { Grain } from "./ui/Grain";
import { clamp } from "./ui/motion";
import { Ask, Bridge, Close, Crisis, Hook, Pew, Problem, Reply, Stack, Sunday, Turn, Why, Words } from "./scenes";

const SCENES: Record<string, React.FC> = { hook: Hook, problem: Problem, turn: Turn, pew: Pew, ask: Ask, bridge: Bridge, reply: Reply, crisis: Crisis, words: Words, sunday: Sunday, stack: Stack, why: Why, close: Close };
const XF = 10; // crossfade frames between scenes

const end = (id: string) => scene(id).from + scene(id).durationInFrames;
const FadeIn: React.FC<{ dur: number; children: React.ReactNode }> = ({ dur, children }) => {
  const f = useCurrentFrame();
  return <AbsoluteFill style={{ opacity: interpolate(f, [0, dur], [0, 1], clamp) }}>{children}</AbsoluteFill>;
};

// Subtitles run where big type is not already carrying the words.
const BIG: string[] = ["hook", "turn", "why", "close"];
const bigLines = new Set(["problem_0", "problem_1", "pew_0", "pew_1", "bridge_4", "crisis_0", "crisis_2", "reply_1", "stack_1"]);
const hideSubs = (f: number) => {
  const s = T.scenes.find((x) => f >= x.from && f < x.from + x.durationInFrames);
  if (!s) return true;
  if (BIG.includes(s.id)) return true;
  const i = s.lines.findIndex((l) => f >= l.startFrame - 3 && f <= l.words[l.words.length - 1].end + 10);
  return i >= 0 && bigLines.has(`${s.id}_${i}`);
};
// over paper, subtitles are set in ink
const PAPER_SCENES = new Set(["pew", "ask", "bridge", "reply", "words", "sunday"]);
const DARK_SPANS = (): [number, number][] => [
  [scene("pew").from, scene("pew").lines[1].startFrame - 10],
  [scene("ask").from, scene("ask").lines[1].startFrame - 12],
  [scene("bridge").lines[4].startFrame - 6, end("bridge")],
  [scene("reply").lines[1].startFrame - 6, end("reply")],
];
const toneOf = (f: number) => {
  const s = T.scenes.find((x) => f >= x.from && f < x.from + x.durationInFrames);
  if (!s || !PAPER_SCENES.has(s.id)) return "light" as const;
  return DARK_SPANS().some(([a, b]) => f >= a && f < b) ? ("light" as const) : ("ink" as const);
};

// The app's own Italian voice reading the homily (fetched from the live app's /api/tts; public/audio/real).
const ITALIAN_AT = lineEnd("pew", 2) + 14 + 6;
const ITALIAN_LEN = 150;

// Music: ducked under every spoken line and under the app's own voice; dipped for the crisis.
const SPANS = [...T.scenes.flatMap((s) => s.lines.map((l) => [l.startFrame, l.words[l.words.length - 1].end] as const)), [ITALIAN_AT, ITALIAN_AT + ITALIAN_LEN] as const];
const DUCK: number[] = (() => {
  const v = new Array<number>(T.totalFrames + 1).fill(0);
  for (let f = 0; f <= T.totalFrames; f++) {
    let d = 0;
    for (const [a, b] of SPANS) d = Math.max(d, interpolate(f, [a - 10, a, b, b + 16], [0, 1, 1, 0], clamp));
    v[f] = d;
  }
  return v;
})();
const musicVolume = (f: number) => {
  const last = T.totalFrames;
  const cr = scene("crisis");
  const dip = interpolate(f, [cr.from - 10, cr.from + 10, cr.from + cr.durationInFrames - 30, cr.from + cr.durationInFrames], [1, 0.6, 0.6, 1], clamp);
  const fadeOut = interpolate(f, [last - 20, last], [1, 0], clamp);
  const fadeIn = interpolate(f, [0, 10], [0, 1], clamp);
  return Math.max(0, 0.5 - 0.36 * DUCK[Math.min(last, Math.max(0, f))]) * dip * fadeOut * fadeIn;
};

interface Fx { file: string; at: number; vol: number; dur?: number; fade?: number }
function effects(): Fx[] {
  const s = (id: string) => scene(id).from;
  const w = wordAt;
  const fx: Fx[] = [
    { file: "room", at: 0, vol: 0.5, dur: s("problem") + 20, fade: 20 },
    { file: "bell", at: 6, vol: 0.32 },
    { file: "street", at: s("problem"), vol: 0.35, dur: w("problem", "Translation") - s("problem"), fade: 12 },
    { file: "room", at: w("problem", "Translation") - 10, vol: 0.35, dur: 140, fade: 12 },
    { file: "pop", at: w("problem", "Chinese") - 6, vol: 0.4 },
    { file: "pop", at: w("problem", "Spanish") - 6, vol: 0.4 },
    { file: "whoosh", at: w("problem", "pastes") - 4, vol: 0.3 },
    { file: "riser", at: s("turn") - 70, vol: 0.28 },
    { file: "impact", at: s("turn") + 2, vol: 0.35 },
    { file: "bell", at: w("turn", "Koinonia") - 2, vol: 0.18 },
    { file: "chime", at: w("turn", "approves") - 2, vol: 0.25 },
    { file: "tap", at: w("pew", "tap,") - 2, vol: 0.5 },
    { file: "tap", at: w("pew", "Italian,") - 6, vol: 0.5 },
    { file: "tap", at: ITALIAN_AT - 8, vol: 0.5 },
    { file: "keys", at: scene("ask").lines[1].startFrame - 12, vol: 0.32, dur: 140, fade: 10 },
    { file: "send", at: w("ask", "sends") - 2, vol: 0.45 },
    { file: "chime", at: w("ask", "private") - 4, vol: 0.22 },
    { file: "notify", at: s("bridge") + 10, vol: 0.4 },
    { file: "page", at: w("bridge", "summary,") - 6, vol: 0.4 },
    { file: "whoosh", at: w("bridge", "translates") - 8, vol: 0.2 },
    { file: "chime", at: w("bridge", "Meaning") - 4, vol: 0.3 },
    { file: "seal", at: w("bridge", "unlock.") + 6, vol: 0.5 },
    { file: "page", at: w("reply", "opens") - 4, vol: 0.4 },
    { file: "room", at: scene("reply").lines[1].startFrame - 6, vol: 0.3, dur: 150, fade: 12 },
    { file: "candle", at: s("crisis") + 4, vol: 0.4 },
    { file: "alert", at: w("crisis", "red.") - 10, vol: 0.4 },
    { file: "page", at: s("words") + 6, vol: 0.35 },
    { file: "tap", at: w("words", "Mass") - 4, vol: 0.4 },
    { file: "tap", at: w("sunday", "Next,") - 2, vol: 0.5 },
    { file: "whoosh", at: s("stack") - 6, vol: 0.2 },
    { file: "pop", at: w("stack", "Claude,") - 4, vol: 0.3 },
    { file: "pop", at: w("stack", "ElevenLabs") - 4, vol: 0.3 },
    { file: "whoosh", at: s("why") - 6, vol: 0.2 },
    { file: "impact", at: s("close") + 4, vol: 0.28 },
    { file: "room", at: s("close") - 10, vol: 0.4, dur: T.totalFrames - s("close") + 10, fade: 24 },
    { file: "bell", at: w("close", "heard.") + 2, vol: 0.22 },
  ];
  return fx.filter((x) => x.at >= 0 && x.at < T.totalFrames);
}

export const Film: React.FC = () => (
  <AbsoluteFill style={{ background: C.nave }}>
    {T.scenes.map((s, i) => {
      const Comp = SCENES[s.id];
      return (
        <React.Fragment key={s.id}>
          {/* the crossfade: the incoming scene's first frame, held, fades in over the outgoing one */}
          {i > 0 && (
            <Sequence from={s.from - XF} durationInFrames={XF} name={`${s.id} in`}>
              <FadeIn dur={XF}><Freeze frame={0}><Comp /></Freeze></FadeIn>
            </Sequence>
          )}
          <Sequence from={s.from} durationInFrames={s.durationInFrames} name={s.id}><Comp /></Sequence>
        </React.Fragment>
      );
    })}
    <Grain opacity={0.035} />
    <Subtitles hidden={hideSubs} tone={toneOf} bottom={44} />
    <Audio src={staticFile("audio/music.mp3")} volume={musicVolume} />
    <Sequence from={ITALIAN_AT} durationInFrames={ITALIAN_LEN} name="app voice: Italian homily">
      <Audio src={staticFile("audio/real/homily-it.mp3")} volume={(f) => 0.9 * interpolate(f, [0, 4, ITALIAN_LEN - 20, ITALIAN_LEN], [0, 1, 1, 0], clamp)} />
    </Sequence>
    {T.scenes.flatMap((s) => s.lines).map((l, i) => (
      <Sequence key={`vo${i}`} from={l.startFrame} durationInFrames={l.durationFrames} name={`vo ${l.text.slice(0, 18)}`}>
        <Audio src={staticFile(l.file)} volume={1} />
      </Sequence>
    ))}
    {effects().map((x, i) => {
      const d = x.dur ?? 150;
      const fade = x.fade ?? 0;
      return (
        <Sequence key={`fx${i}`} from={x.at} durationInFrames={d} name={`fx ${x.file}`}>
          <Audio src={staticFile(`audio/sfx/${x.file}.mp3`)} volume={(f) => x.vol * (fade ? interpolate(f, [0, fade, d - fade, d], [0, 1, 1, 0], clamp) : 1)} />
        </Sequence>
      );
    })}
  </AbsoluteFill>
);
