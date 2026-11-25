import React from "react";
import { AbsoluteFill, Img, OffthreadVideo, Sequence, interpolate, staticFile, useCurrentFrame } from "remotion";
import { scene, wordAt, lineStart, lineEnd } from "./timing";
import { C, mono, sans, sc, serif, serifItalic } from "./theme";
import { clamp, expo, soft } from "./ui/motion";
import { Browser } from "./ui/Footage";
import { Phone } from "./ui/Phone";
import { Rose, ease } from "./ui/Rose";
import film from "../data/film.json";

// Koinonia's demo film. The people are real stock footage (Mixkit, data/stock.json) in a dramatization;
// every app screen is a recording of the live app (src/footage.json) and every quoted value comes from
// data/film.json (read from the live app). The motif is Koinonia's own rose window (ui/Rose.tsx).

const S = scene;
/** Local frame (inside scene `id`) of the start of `word`. */
const W = (id: string, word: string, nth = 0) => wordAt(id, word, nth) - S(id).from;
const LS = (id: string, i: number) => lineStart(id, i) - S(id).from;
const LE = (id: string, i: number) => lineEnd(id, i) - S(id).from;
const URL = "koinonia.netlayerlabs.com";
const GRADE = "sepia(0.12) saturate(0.9) contrast(1.04) brightness(0.96)";

// ---------------------------------------------------------------- shared pieces

/** Real people: a stock clip, full bleed, warm grade, slow push. `from` is the in-point in seconds. */
const Shot: React.FC<{ id: number; from?: number; at?: number; dur: number; rate?: number; z?: [number, number]; origin?: string; filter?: string }> = ({ id, from = 0, at = 0, dur, rate = 1, z = [1.02, 1.1], origin = "50% 50%", filter = GRADE }) => {
  const f = useCurrentFrame() - at;
  if (f < 0 || f >= dur) return null;
  const s = interpolate(f, [0, dur], z, clamp);
  return (
    <AbsoluteFill style={{ overflow: "hidden" }}>
      <AbsoluteFill style={{ transform: `scale(${s})`, transformOrigin: origin }}>
        <Sequence from={at} durationInFrames={dur} layout="none">
          <OffthreadVideo src={staticFile(`footage/stock/${id}.mp4`)} startFrom={Math.round(from * 30)} playbackRate={rate} muted
            style={{ width: "100%", height: "100%", objectFit: "cover", filter }} />
        </Sequence>
      </AbsoluteFill>
    </AbsoluteFill>
  );
};

/** Darkening so type can sit on footage. */
const Shade: React.FC<{ left?: number; floor?: number; all?: number }> = ({ left = 0, floor = 0.5, all = 0 }) => (
  <AbsoluteFill style={{
    background: [
      left ? `linear-gradient(90deg, rgba(20,16,12,${left}) 0%, rgba(20,16,12,${left * 0.55}) 40%, rgba(20,16,12,0) 70%)` : "",
      floor ? `linear-gradient(0deg, rgba(20,16,12,${floor}) 0%, rgba(20,16,12,0) 45%)` : "",
      all ? `rgba(20,16,12,${all})` : "",
      "radial-gradient(ellipse at 50% 45%, rgba(0,0,0,0) 55%, rgba(0,0,0,0.32) 100%)",
    ].filter(Boolean).join(", "),
  }} />
);

/** Fade, rise and un-blur. */
const In: React.FC<{ at: number; dur?: number; y?: number; x?: number; out?: number; style?: React.CSSProperties; children: React.ReactNode }> = ({ at, dur = 14, y = 22, x = 0, out, style, children }) => {
  const f = useCurrentFrame();
  const p = interpolate(f, [at, at + dur], [0, 1], { ...clamp, easing: expo });
  const o = out != null ? interpolate(f, [out, out + 10], [1, 0], clamp) : 1;
  if (p <= 0 || o <= 0) return null;
  return <div style={{ opacity: p * o, transform: `translate(${(1 - p) * x}px, ${(1 - p) * y}px)`, filter: p < 1 ? `blur(${(1 - p) * 6}px)` : undefined, ...style }}>{children}</div>;
};

/** A spoken line set as type: each word arrives as it is said. `range` picks words; `accent` sets words in the italic serif. */
const Spoken: React.FC<{ id: string; line?: number; range?: [number, number]; accent?: Record<string, string>; out?: number; style?: React.CSSProperties; dim?: number }> = ({ id, line = 0, range, accent = {}, out, style, dim }) => {
  const f = useCurrentFrame();
  const base = S(id).from;
  const all = S(id).lines[line].words;
  const words = range ? all.slice(range[0], range[1]) : all;
  const norm = (w: string) => w.toLowerCase().replace(/[^a-z0-9'áéíóú]/g, "");
  const acc = Object.fromEntries(Object.entries(accent).map(([k, v]) => [norm(k), v]));
  const fade = out != null ? interpolate(f, [out, out + 10], [1, 0], clamp) : 1;
  if (fade <= 0) return null;
  return (
    <div style={{ opacity: fade, ...style }}>
      {words.map((w, i) => {
        const t = w.start - base - 3;
        const p = interpolate(f, [t, t + 10], [0, 1], { ...clamp, easing: expo });
        const a = acc[norm(w.word)];
        const op = dim != null ? dim + (1 - dim) * p : p;
        return (
          <span key={i} style={{
            display: "inline-block", marginRight: "0.24em", opacity: op, transform: `translateY(${(1 - p) * 0.3}em)`,
            filter: p < 1 && dim == null ? `blur(${(1 - p) * 5}px)` : undefined,
            ...(a ? { fontFamily: serifItalic, fontStyle: "italic", color: a } : {}),
          }}>{w.word}</span>
        );
      })}
    </div>
  );
};

/** A rubric: the missal's small-caps red label. */
const Rubric: React.FC<{ children: React.ReactNode; color?: string; style?: React.CSSProperties }> = ({ children, color = C.rubric, style }) => (
  <div style={{ fontFamily: sc, fontWeight: 500, fontSize: 26, letterSpacing: "0.06em", color, ...style }}>{children}</div>
);

const Paper: React.FC<{ tone?: "paper" | "vellum" }> = ({ tone = "paper" }) => (
  <AbsoluteFill style={{ background: tone === "paper" ? C.paper : C.vellum }}>
    <AbsoluteFill style={{ background: "radial-gradient(ellipse at 30% 20%, rgba(255,255,255,0.5) 0%, rgba(255,255,255,0) 60%), radial-gradient(ellipse at 80% 100%, rgba(166,122,40,0.08) 0%, rgba(166,122,40,0) 60%)" }} />
  </AbsoluteFill>
);
const Nave: React.FC = () => (
  <AbsoluteFill style={{ background: `radial-gradient(ellipse at 50% 40%, ${C.nave2} 0%, ${C.nave} 70%)` }} />
);

/** The ℣ (request) and ℟ (reply) marks of the missal. */
const VR: React.FC<{ r?: boolean; size?: number; color?: string }> = ({ r, size = 44, color = C.rubric }) => (
  <span style={{ fontFamily: serif, fontSize: size, color, lineHeight: 1 }}>{r ? "℟" : "℣"}</span>
);

/** A leaf: the missal's panel. */
const Leaf: React.FC<{ style?: React.CSSProperties; children: React.ReactNode; dark?: boolean }> = ({ style, children, dark }) => (
  <div style={{ background: dark ? C.nave2 : C.vellum, border: `1px solid ${dark ? C.nave3 : C.rule}`, borderRadius: 4, padding: "26px 30px", boxShadow: dark ? "0 30px 70px rgba(0,0,0,0.45)" : "0 24px 60px rgba(80,55,25,0.14)", ...style }}>{children}</div>
);

/** Text with chosen spans marked: `marks` maps a substring to a style that appears at frame `at`. */
const Marked: React.FC<{ text: string; marks: { s: string; at: number; to?: string; color?: string }[]; style?: React.CSSProperties }> = ({ text, marks, style }) => {
  const f = useCurrentFrame();
  const parts: React.ReactNode[] = [];
  let rest = text;
  let k = 0;
  while (rest.length) {
    let best: { i: number; m: (typeof marks)[number] } | null = null;
    for (const m of marks) { const i = rest.indexOf(m.s); if (i >= 0 && (!best || i < best.i)) best = { i, m }; }
    if (!best) { parts.push(rest); break; }
    parts.push(rest.slice(0, best.i));
    const m = best.m;
    const p = ease(f, m.at, 10);
    const swapped = m.to && p > 0.5;
    parts.push(
      <span key={k++} style={{
        background: swapped ? C.ink : `rgba(196,23,12,${0.16 * p})`, color: swapped ? "#f4eee2" : m.color ?? (p > 0 ? C.alarm : undefined),
        fontFamily: swapped ? mono : undefined, fontSize: swapped ? "0.78em" : undefined, padding: p > 0 ? "0 6px" : 0, borderRadius: 3,
        boxShadow: p > 0 && !swapped ? `inset 0 -3px 0 rgba(196,23,12,${0.7 * p})` : undefined,
      }}>{swapped ? m.to : m.s}</span>,
    );
    rest = rest.slice(best.i + m.s.length);
  }
  return <span style={style}>{parts}</span>;
};

/** Real logos: Koinonia's own artwork (public/brand). */
const KoinoniaLogo: React.FC<{ height: number; light?: boolean; style?: React.CSSProperties }> = ({ height, light, style }) => (
  <Img src={staticFile(`brand/${light ? "koinonia-header-light.png" : "koinonia-header.png"}`)} style={{ height, width: "auto", ...style }} />
);

// ---------------------------------------------------------------- 1. hook: a story

export const Hook: React.FC = () => {
  const f = useCurrentFrame();
  const cut = LS("hook", 1) - 6;
  const drift = (i: number) => (f - cut) * 0.35 + i * 140;
  return (
    <AbsoluteFill style={{ background: C.nave }}>
      <Shot id={46531} from={1.5} dur={cut} z={[1.0, 1.16]} origin="50% 22%" />
      <Shot id={22712} from={1} at={cut} dur={400} z={[1.04, 1.14]} filter="sepia(0.15) saturate(0.85) contrast(1.05) brightness(0.72)" />
      <Shade left={0.75} floor={0.55} />
      {/* the service, in a language they don't speak: the app's own Italian order of service */}
      {f > cut && film.italianService.map((t, i) => (
        <div key={t} style={{
          position: "absolute", left: 1080 + (i % 2) * 260 - drift(i) * 0.4, top: 190 + i * 150, fontFamily: serifItalic, fontStyle: "italic",
          fontSize: 46, color: "rgba(244,238,226,0.55)", opacity: ease(f, cut + 8 + i * 10, 20) * 0.9, filter: "blur(0.6px)", whiteSpace: "nowrap",
        }}>{t}</div>
      ))}
      <div style={{ position: "absolute", left: 130, bottom: 170, width: 1100 }}>
        <Spoken id="hook" line={0} accent={{ heavy: C.goldLight }} out={cut - 6}
          style={{ fontFamily: serif, fontSize: 66, lineHeight: 1.12, color: C.vellum, fontWeight: 500 }} />
        <Spoken id="hook" line={1} range={[0, 10]} out={9999}
          style={{ fontFamily: serif, fontSize: 52, lineHeight: 1.12, color: "rgba(251,248,241,0.8)", fontWeight: 400, position: "absolute", top: -40 }} />
        <Spoken id="hook" line={1} range={[10, 14]} accent={{ "silent.": C.rubricLight }}
          style={{ fontFamily: serif, fontSize: 104, lineHeight: 1.05, color: C.vellum, fontWeight: 500, position: "absolute", top: 60 }} />
      </div>
    </AbsoluteFill>
  );
};

// ---------------------------------------------------------------- 2. the problem

export const Problem: React.FC = () => {
  const f = useCurrentFrame();
  const c1 = W("problem", "students") - 8;
  const c2 = LS("problem", 1) - 8;
  const c3 = LS("problem", 2) - 8;
  const zh = W("problem", "Chinese");
  const es = W("problem", "Spanish,");
  const cant = W("problem", "can't");
  const pastes = W("problem", "pastes");
  const names = W("problem", "names");
  const bot = W("problem", "chatbot.");
  const slide = ease(f, pastes, 30);
  return (
    <AbsoluteFill style={{ background: C.nave }}>
      <Shot id={25156} from={0.5} dur={c1} z={[1.04, 1.12]} />
      <Shot id={4520} from={2} at={c1} dur={c2 - c1} z={[1.02, 1.1]} />
      <Shot id={46481} from={1} at={c2} dur={c3 - c2} z={[1.03, 1.12]} origin="40% 40%" />
      {f < c3 && <Shade left={0.6} floor={0.55} />}
      {f < c2 && (
        <div style={{ position: "absolute", left: 130, bottom: 150, width: 1250 }}>
          <Spoken id="problem" line={0} accent={{ countries: C.goldLight }} style={{ fontFamily: serif, fontSize: 60, lineHeight: 1.14, color: C.vellum, fontWeight: 500 }} />
        </div>
      )}
      {f >= c2 && f < c3 + 4 && (
        <AbsoluteFill style={{ justifyContent: "center", padding: "0 150px" }}>
          <Spoken id="problem" line={1} range={[0, 7]} accent={{ "hear": C.goldLight }} style={{ fontFamily: serif, fontSize: 78, lineHeight: 1.1, color: "rgba(251,248,241,0.85)", fontWeight: 500 }} />
          <Spoken id="problem" line={1} range={[7, 12]} accent={{ "heard.": C.rubricLight }} style={{ fontFamily: serif, fontSize: 118, lineHeight: 1.05, color: C.vellum, fontWeight: 500, marginTop: 18 }} />
        </AbsoluteFill>
      )}
      {f >= c3 && (
        <AbsoluteFill style={{ opacity: ease(f, c3, 12) }}>
          <Nave />
          <Rubric color={C.rubricLight} style={{ position: "absolute", left: 130, top: 110, opacity: ease(f, c3 + 6) }}>Before Koinonia</Rubric>
          {/* a request the care team cannot read: the app's real Chinese sample request */}
          <div style={{ position: "absolute", left: 130, top: 190, width: 760, opacity: ease(f, zh - 6), transform: `translateY(${(1 - ease(f, zh - 6)) * 30}px)` }}>
            <Leaf dark>
              <div style={{ display: "flex", gap: 16, alignItems: "flex-start" }}>
                <VR color={C.rubricLight} />
                <div style={{ fontFamily: "'PingFang SC', 'Noto Sans SC', sans-serif", fontSize: 34, lineHeight: 1.5, color: C.vellum }}>{film.zhSample}</div>
              </div>
            </Leaf>
            <div style={{ marginTop: 18, fontFamily: sans, fontSize: 30, color: "rgba(244,238,226,0.7)", opacity: ease(f, cant) }}>
              The care team can't read it.
            </div>
          </div>
          {/* the same kind of request, with personal details, pasted into a public chatbot */}
          <div style={{ position: "absolute", left: 130 + slide * 880, top: 520 - slide * 40, width: 760, opacity: ease(f, es - 6) * (1 - ease(f, bot + 30, 16) * 0.2), transform: `rotate(${slide * 2}deg) scale(${1 - slide * 0.12})` }}>
            <Leaf dark>
              <div style={{ display: "flex", gap: 16, alignItems: "flex-start" }}>
                <VR color={C.rubricLight} />
                <div style={{ fontFamily: serif, fontSize: 31, lineHeight: 1.45, color: C.vellum }}>
                  <Marked text={film.request} marks={[{ s: "Lucía Gómez", at: names, color: "#ff8f7a" }, { s: "+39 347 812 5531", at: names + 6, color: "#ff8f7a" }]} />
                </div>
              </div>
            </Leaf>
          </div>
          <div style={{ position: "absolute", left: 1040, top: 400, width: 760, height: 420, borderRadius: 18, border: `2px dashed rgba(244,238,226,${0.35 * ease(f, pastes - 10)})`, opacity: ease(f, pastes - 10), display: "flex", alignItems: "flex-start", justifyContent: "center" }}>
            <div style={{ marginTop: -24, background: C.nave, padding: "0 18px", fontFamily: sans, fontSize: 30, color: "rgba(244,238,226,0.8)" }}>a public chatbot</div>
          </div>
          <In at={names + 14} style={{ position: "absolute", left: 1060, top: 850, fontFamily: sans, fontSize: 30, color: "#ff8f7a" }}>Name and phone number included.</In>
        </AbsoluteFill>
      )}
    </AbsoluteFill>
  );
};

// ---------------------------------------------------------------- 3. the turn: Koinonia

export const Turn: React.FC = () => {
  const f = useCurrentFrame();
  const asks = W("turn", "asks");
  const answers = W("turn", "answers");
  const approves = W("turn", "approves");
  const rows = [
    { at: asks, mark: <VR />, text: "A newcomer asks in their language." },
    { at: answers, mark: <VR r />, text: "A pastor answers in theirs." },
    { at: approves, mark: <span style={{ fontFamily: sc, fontSize: 26, color: C.vine, border: `1.5px solid ${C.vine}`, padding: "2px 10px", borderRadius: 3 }}>approved</span>, text: "A person approves every word." },
  ];
  return (
    <AbsoluteFill>
      <Paper />
      <div style={{ position: "absolute", left: 110, top: 120 }}>
        <Rose size={840} build={0} pulses={[
          { lang: "es", at: asks, dir: "in", dur: 30 }, { lang: "es", at: answers, dir: "out", dur: 30 },
          { lang: "ar", at: 60, dir: "in" }, { lang: "ko", at: 80, dir: "in" }, { lang: "zh", at: 100, dir: "out" }, { lang: "uk", at: 70, dir: "out" },
        ]} lit={[{ lang: "es", at: asks - 4 }]} glow={0.6 + 0.4 * ease(f, approves, 20)} />
      </div>
      <div style={{ position: "absolute", left: 1040, top: 210, width: 800 }}>
        <In at={W("turn", "Koinonia") - 4} dur={20}><KoinoniaLogo height={150} /></In>
        <In at={W("turn", "two-way") - 2} style={{ marginTop: 26 }}>
          <div style={{ fontFamily: serif, fontSize: 52, lineHeight: 1.15, color: C.ink, fontWeight: 500 }}>
            A two-way <span style={{ fontFamily: serifItalic, fontStyle: "italic", color: C.rubric }}>pastoral care</span> bridge.
          </div>
        </In>
        <div style={{ marginTop: 50, borderTop: `3px double ${C.rule}`, paddingTop: 30 }}>
          {rows.map((r, i) => (
            <In key={i} at={r.at - 4} x={-20} y={0} style={{ display: "flex", gap: 22, alignItems: "center", marginBottom: 26 }}>
              <div style={{ width: 120, display: "flex", justifyContent: "flex-end" }}>{r.mark}</div>
              <div style={{ fontFamily: serif, fontSize: 40, color: C.ink }}>{r.text}</div>
            </In>
          ))}
        </div>
      </div>
    </AbsoluteFill>
  );
};

// ---------------------------------------------------------------- 4. the pew page

export const Pew: React.FC = () => {
  const f = useCurrentFrame();
  const paper = LS("pew", 1) - 10;
  const tap = W("pew", "tap,");
  const it = W("pew", "Italian,");
  const listenAt = LE("pew", 2) + 14; // the tap on Ascolta, then the app's own Italian voice
  return (
    <AbsoluteFill style={{ background: C.paper }}>
      {f < paper + 10 && (
        <AbsoluteFill style={{ opacity: 1 - ease(f, paper, 10) }}>
          <Shot id={46763} from={1} dur={paper + 12} z={[1.02, 1.1]} />
          <Shade left={0.7} floor={0.4} />
          <div style={{ position: "absolute", left: 130, top: 330, width: 900 }}>
            <Spoken id="pew" line={0} range={[0, 8]} accent={{ "pew.": C.goldLight }} style={{ fontFamily: serif, fontSize: 64, color: C.vellum, fontWeight: 500, lineHeight: 1.12 }} />
            <Spoken id="pew" line={0} range={[8, 12]} accent={{ "account.": C.rubricLight }} style={{ fontFamily: serif, fontSize: 104, color: C.vellum, fontWeight: 500, lineHeight: 1.1, marginTop: 20 }} />
          </div>
        </AbsoluteFill>
      )}
      {f >= paper && (
        <AbsoluteFill style={{ opacity: ease(f, paper, 12) }}>
          <Paper />
          <div style={{ position: "absolute", left: 130, top: 170, width: 820 }}>
            <Rubric>The pew page · no app, no account</Rubric>
            <div style={{ marginTop: 26 }}>
              <Spoken id="pew" line={1} range={[0, 9]} accent={{ "language.": C.rubric }} style={{ fontFamily: serif, fontSize: 62, lineHeight: 1.12, color: C.ink, fontWeight: 500 }} />
            </div>
            <In at={W("pew", "Arabic") - 4} style={{ marginTop: 34, display: "flex", alignItems: "center", gap: 24 }}>
              <div style={{ fontFamily: "'Geeza Pro', 'Noto Naskh Arabic', serif", fontSize: 76, color: C.ink, direction: "rtl" }}>أهلاً بك</div>
              <div style={{ fontFamily: sans, fontSize: 32, color: C.ink2 }}>Arabic, right to left</div>
            </In>
            <In at={it - 4} style={{ marginTop: 30, display: "flex", alignItems: "center", gap: 24 }}>
              <div style={{ fontFamily: serifItalic, fontStyle: "italic", fontSize: 72, color: C.ink }}>Benvenuto</div>
              <div style={{ fontFamily: sans, fontSize: 32, color: C.ink2 }}>Italian, read aloud</div>
            </In>
            <In at={listenAt + 4} style={{ marginTop: 40 }}>
              <Leaf style={{ padding: "18px 24px" }}>
                <Rubric style={{ fontSize: 22 }}>The app's Italian voice · ElevenLabs</Rubric>
                <div style={{ fontFamily: serifItalic, fontStyle: "italic", fontSize: 30, color: C.ink, marginTop: 8 }}>“Quando la Terra Trema: Una Speranza Incrollabile Lontano da Casa.”</div>
              </Leaf>
            </In>
          </div>
          <div style={{ position: "absolute", left: 1555, top: 90, opacity: 0.95 }}>
            <Rose size={330} lit={[{ lang: "ar", at: W("pew", "Arabic") - 2, until: it - 6 }, { lang: "it", at: it - 2 }]} pulses={[{ lang: "ar", at: W("pew", "Arabic"), dir: "out" }, { lang: "it", at: listenAt, dir: "out", dur: 40 }]} />
          </div>
          <Phone name="lang" height={880} left={1060} top={60} enter={paper} segs={[
            { at: 0, from: 30, hold: true },
            { at: tap - 44, from: 40 },
            { at: it - 28, from: 380 },
          ]} cam={[{ f: listenAt - 20, z: 1 }, { f: listenAt + 10, z: 1.35, y: 560 }]} />
        </AbsoluteFill>
      )}
    </AbsoluteFill>
  );
};

// ---------------------------------------------------------------- 5. asking, privately

export const Ask: React.FC = () => {
  const f = useCurrentFrame();
  const paper = LS("ask", 1) - 12;
  const name = W("ask", "name");
  const number = W("ask", "number");
  const sends = W("ask", "sends");
  const code = W("ask", "private");
  return (
    <AbsoluteFill style={{ background: C.paper }}>
      {f < paper + 10 && (
        <AbsoluteFill style={{ opacity: 1 - ease(f, paper, 10) }}>
          <Shot id={39774} from={0.5} dur={paper + 12} z={[1.05, 1.14]} />
          <Shade left={0.75} floor={0.3} />
          <div style={{ position: "absolute", left: 130, top: 330 }}>
            <In at={W("ask", "Lucía") - 4}><div style={{ fontFamily: serif, fontSize: 130, color: C.vellum, fontWeight: 500 }}>Lucía</div></In>
            <In at={W("ask", "arrived") - 2}><div style={{ fontFamily: serif, fontSize: 46, color: "rgba(251,248,241,0.85)" }}>from Bogotá, three weeks ago</div></In>
            <In at={W("ask", "Spanish.") - 4} style={{ marginTop: 26 }}><Rubric color={C.goldLight}>writes in Spanish</Rubric></In>
          </div>
        </AbsoluteFill>
      )}
      {f >= paper && (
        <AbsoluteFill style={{ opacity: ease(f, paper, 12) }}>
          <Paper />
          <div style={{ position: "absolute", left: 130, top: 150, width: 820 }}>
            <Rubric>On her phone, before anything is sent</Rubric>
            <Leaf style={{ marginTop: 24 }}>
              <div style={{ display: "flex", gap: 16 }}>
                <VR />
                <div style={{ fontFamily: serif, fontSize: 33, lineHeight: 1.5, color: C.ink }}>
                  <Marked text={film.request} marks={[{ s: "Lucía Gómez", at: name, to: "[PERSON_REDACTED_1]" }, { s: "+39 347 812 5531", at: number, to: "[PHONE_REDACTED_1]" }]} />
                </div>
              </div>
            </Leaf>
            <In at={W("ask", "never") - 4} style={{ marginTop: 40 }}>
              <div style={{ fontFamily: serif, fontSize: 70, color: C.ink, fontWeight: 500, lineHeight: 1.08 }}>
                They never <span style={{ fontFamily: serifItalic, fontStyle: "italic", color: C.rubric }}>leave</span> it.
              </div>
            </In>
            <In at={code - 4} style={{ marginTop: 40, display: "flex", alignItems: "baseline", gap: 28 }}>
              <Rubric>Her private code</Rubric>
              <div style={{ fontFamily: mono, fontWeight: 500, fontSize: 64, letterSpacing: "0.12em", color: C.ink }}>{film.code}</div>
            </In>
          </div>
          <Phone name="ask" height={880} left={1200} top={60} enter={paper} segs={[
            { at: 0, from: 100, hold: true },
            { at: paper, from: 100, rate: 1.75 },
            { at: paper + 150, from: 392 },
            { at: sends - 18, from: 500 },
            { at: sends + 16, from: 736 },
          ]} />
        </AbsoluteFill>
      )}
    </AbsoluteFill>
  );
};

// ---------------------------------------------------------------- 6. the Care Bridge

export const Bridge: React.FC = () => {
  const f = useCurrentFrame();
  const claude = W("bridge", "Claude");
  const back = W("bridge", "back");
  const kept = W("bridge", "Meaning");
  const unlock = W("bridge", "unlock.");
  const drafts = LS("bridge", 4) - 6;
  // the recording: open the request (116), draft (244), check pressed (357), result (1002), approve (1173)
  const segs = { open: claude - 40, check: W("bridge", "translates") - 14, jump: back + 10, approve: unlock - 40 };
  return (
    <AbsoluteFill style={{ background: C.paper }}>
      <Paper />
      {f < drafts + 8 && (
        <AbsoluteFill style={{ opacity: 1 - ease(f, drafts, 8) }}>
          <BridgeBrowser segs={segs} />
          {/* margin notes naming what the AI wrote, on cue */}
          <In at={W("bridge", "summary,") - 4} x={20} y={0} style={{ position: "absolute", left: 1530, top: 300, width: 330 }}>
            <Note label="Summary · written by AI" text="for the pastor, in English" />
          </In>
          <In at={W("bridge", "psalm") - 4} x={20} y={0} style={{ position: "absolute", left: 1530, top: 450, width: 330 }}>
            <Note label="Suggested passage" text={film.psalm.split(" (")[0]} />
          </In>
          <In at={W("bridge", "group,") - 4} x={20} y={0} style={{ position: "absolute", left: 1530, top: 590, width: 330 }}>
            <Note label="Suggested group" text="Comunidad Erasmus & Latinoamericana" />
          </In>
          <In at={kept - 6} out={drafts - 14} style={{ position: "absolute", left: 1500, top: 760, width: 360 }}>
            <div style={{ background: C.vineWash, border: `1.5px solid ${C.vine}`, padding: "16px 20px", borderRadius: 4 }}>
              <div style={{ fontFamily: sc, fontSize: 24, color: C.vine }}>The meaning check</div>
              <div style={{ fontFamily: serif, fontSize: 44, color: C.vine, fontWeight: 500 }}>{film.verdict}</div>
              <div style={{ fontFamily: sans, fontSize: 24, color: C.ink2, marginTop: 6, opacity: ease(f, unlock - 4) }}>Approve unlocks only now.</div>
            </div>
          </In>
        </AbsoluteFill>
      )}
      {f >= drafts && (
        <AbsoluteFill style={{ opacity: ease(f, drafts, 10) }}>
          <Shot id={47800} from={2} at={drafts} dur={400} z={[1.02, 1.1]} origin="50% 35%" filter="sepia(0.15) saturate(0.85) brightness(0.8)" />
          <Shade all={0.35} floor={0.5} />
          <AbsoluteFill style={{ justifyContent: "center", alignItems: "center" }}>
            <Spoken id="bridge" line={4} range={[0, 3]} style={{ fontFamily: serif, fontSize: 84, color: "rgba(251,248,241,0.85)", fontWeight: 500 }} />
            <Spoken id="bridge" line={4} range={[3, 6]} accent={{ "decides.": C.rubricLight }} style={{ fontFamily: serif, fontSize: 132, color: C.vellum, fontWeight: 500, marginTop: 6 }} />
          </AbsoluteFill>
        </AbsoluteFill>
      )}
    </AbsoluteFill>
  );
};

const Note: React.FC<{ label: string; text: string }> = ({ label, text }) => (
  <div style={{ borderLeft: `3px solid ${C.rubric}`, paddingLeft: 18 }}>
    <div style={{ fontFamily: sc, fontSize: 22, color: C.rubric }}>{label}</div>
    <div style={{ fontFamily: serif, fontSize: 30, color: C.ink, lineHeight: 1.2, marginTop: 4 }}>{text}</div>
  </div>
);

const BridgeBrowser: React.FC<{ segs: { open: number; check: number; jump: number; approve: number } }> = ({ segs }) => {
  const f = useCurrentFrame();
  // The recording, cut into parts, each with its own camera (page CSS px, measured from the frames):
  // the queue; the request opened and scrolled (summary, passage, draft); the check pressed; the result; the approval.
  const parts: { at: number; from: number; cams: { f: number; z: number; rect?: { x: number; y: number; w: number; h: number } }[] }[] = [
    { at: 0, from: 40, cams: [{ f: 0, z: 1.0 }, { f: 30, z: 1.55, rect: { x: 300, y: 470, w: 520, h: 260 } }] },
    { at: segs.open, from: 250, cams: [{ f: 0, z: 1.55, rect: { x: 870, y: 430, w: 680, h: 260 } }, { f: segs.check - segs.open - 70, z: 1.55, rect: { x: 870, y: 430, w: 680, h: 260 } }, { f: segs.check - segs.open - 30, z: 1.6, rect: { x: 900, y: 740, w: 640, h: 150 } }] },
    { at: segs.check, from: 300, cams: [{ f: 0, z: 1.4, rect: { x: 860, y: 480, w: 700, h: 260 } }] },
    { at: segs.jump, from: 960, cams: [{ f: 0, z: 1.5, rect: { x: 900, y: 540, w: 650, h: 340 } }] },
    { at: segs.approve, from: 1135, cams: [{ f: 0, z: 1.35, rect: { x: 880, y: 220, w: 680, h: 520 } }, { f: 24, z: 1.7, rect: { x: 1060, y: 640, w: 500, h: 160 } }] },
  ];
  let p = parts[0];
  for (const x of parts) if (f >= x.at) p = x;
  return (
    <Sequence from={p.at} layout="none" key={p.at}>
      <Browser name="bridge" url={`${URL}/#/app/care`} width={1380} left={80} top={110} light enter={p.at === 0 ? 0 : -30} startFrom={p.from} cams={p.cams} />
    </Sequence>
  );
};

// ---------------------------------------------------------------- 7. the reply

export const Reply: React.FC = () => {
  const f = useCurrentFrame();
  const opens = W("reply", "opens");
  const group = LS("reply", 1) - 6;
  return (
    <AbsoluteFill style={{ background: C.paper }}>
      {f < group + 8 && (
        <AbsoluteFill style={{ opacity: 1 - ease(f, group, 8) }}>
          <Paper />
          <div style={{ position: "absolute", left: 130, top: 140, width: 860 }}>
            <In at={W("reply", "approved") - 4}>
              <div style={{ display: "flex", alignItems: "center", gap: 18 }}><VR r size={56} /><Rubric style={{ fontSize: 30 }}>Aprobado por {film.approvedBy}</Rubric></div>
            </In>
            <In at={W("reply", "Spanish,") - 4} style={{ marginTop: 22 }}>
              <div style={{ fontFamily: serif, fontSize: 36, lineHeight: 1.45, color: C.ink }}>{film.spanish.split(". ").slice(0, 2).join(". ")}.</div>
            </In>
            <In at={W("reply", "psalm,") - 4} style={{ marginTop: 26 }}>
              <Rubric style={{ fontSize: 24 }}>{film.psalm}</Rubric>
              <div style={{ fontFamily: serifItalic, fontStyle: "italic", fontSize: 32, color: C.ink2, marginTop: 6 }}>{film.psalmText}</div>
            </In>
          </div>
          <Phone name="reply" height={880} left={1200} top={60} enter={0} segs={[{ at: 0, from: Math.max(0, 102 - (opens - 0)) }, { at: opens + 20, from: 160 }]} />
        </AbsoluteFill>
      )}
      {f >= group && (
        <AbsoluteFill style={{ opacity: ease(f, group, 10) }}>
          <Shot id={47874} from={1} at={group} dur={300} z={[1.02, 1.1]} />
          <Shade left={0.7} floor={0.45} />
          <div style={{ position: "absolute", left: 130, top: 330, width: 900 }}>
            <Rubric color={C.goldLight}>Tuesdays · 20:30</Rubric>
            <div style={{ fontFamily: serif, fontSize: 52, color: C.vellum, marginTop: 14, fontWeight: 500, lineHeight: 1.15 }}>{film.group}</div>
            <In at={W("reply", "table") - 4} style={{ marginTop: 40 }}>
              <div style={{ fontFamily: serif, fontSize: 96, color: C.vellum, fontWeight: 500 }}>A table to <span style={{ fontFamily: serifItalic, fontStyle: "italic", color: C.goldLight }}>sit at.</span></div>
            </In>
          </div>
        </AbsoluteFill>
      )}
    </AbsoluteFill>
  );
};

// ---------------------------------------------------------------- 8. the crisis lane

export const Crisis: React.FC = () => {
  const f = useCurrentFrame();
  const split = LS("crisis", 1) - 10;
  const end = LS("crisis", 2) - 8;
  // The phone and the dashboard were recorded at the same moment (clip frame 0 = same instant).
  const clip0 = 70; // start both recordings here
  return (
    <AbsoluteFill style={{ background: C.nave }}>
      {f < split + 8 && (
        <AbsoluteFill>
          <Shot id={48540} from={1} dur={split + 10} z={[1.04, 1.12]} filter="saturate(0.9) brightness(0.85)" />
          <Shade all={0.25} />
          <AbsoluteFill style={{ justifyContent: "center", paddingLeft: 140 }}>
            <Spoken id="crisis" line={0} accent={{ "wait.": C.rubricLight }} style={{ fontFamily: serif, fontSize: 110, color: C.vellum, fontWeight: 500 }} />
          </AbsoluteFill>
        </AbsoluteFill>
      )}
      {f >= split && f < end + 8 && (
        <AbsoluteFill style={{ opacity: ease(f, split, 10) * (1 - ease(f, end, 8)) }}>
          <Nave />
          <Phone name="crisis" height={860} left={110} top={80} dark segs={[{ at: 0, from: clip0 }]} />
          <Sequence from={split} layout="none">
            <Browser name="alert" url={`${URL}/#/app/today`} width={1180} left={640} top={210} startFrom={clip0 + split} />
          </Sequence>
          <In at={W("crisis", "never") - 4} style={{ position: "absolute", left: 640, top: 110 }}>
            <div style={{ fontFamily: sans, fontSize: 34, color: C.vellum }}><span style={{ color: C.rubricLight, fontFamily: sc }}>The AI is never asked.</span> A person is alerted.</div>
          </In>
        </AbsoluteFill>
      )}
      {f >= end && (
        <AbsoluteFill style={{ opacity: ease(f, end, 10), justifyContent: "center", paddingLeft: 140 }}>
          <Nave />
          <div style={{ position: "relative" }}>
            <Spoken id="crisis" line={2} range={[0, 6]} style={{ fontFamily: serif, fontSize: 76, color: "rgba(251,248,241,0.85)", fontWeight: 500 }} />
            <Spoken id="crisis" line={2} range={[6, 10]} accent={{ "person.": C.rubricLight }} style={{ fontFamily: serif, fontSize: 120, color: C.vellum, fontWeight: 500 }} />
          </div>
        </AbsoluteFill>
      )}
    </AbsoluteFill>
  );
};

// ---------------------------------------------------------------- 9. the church's own words

export const Words: React.FC = () => {
  const f = useCurrentFrame();
  const god = W("words", "God");
  const gloss = LS("words", 1) - 6;
  const tabs = W("words", "tabs");
  const mass = W("words", "Mass");
  const worship = W("words", "worship");
  return (
    <AbsoluteFill style={{ background: C.paper }}>
      <Paper />
      {f < gloss + 6 && (
        <AbsoluteFill style={{ opacity: 1 - ease(f, gloss, 8) }}>
          <div style={{ position: "absolute", left: 130, top: 150 }}>
            <Rubric>In Korean, the word for God</Rubric>
            <div style={{ display: "flex", gap: 140, marginTop: 60 }}>
              {[["Catholic", "하느님", C.rubric], ["Protestant", "하나님", C.ink]].map(([who, w, col], i) => (
                <In key={who} at={god - 6 + i * 10}>
                  <div style={{ fontFamily: "'Apple SD Gothic Neo', 'Noto Serif KR', serif", fontSize: 210, color: col, fontWeight: 600, lineHeight: 1 }}>{w}</div>
                  <div style={{ fontFamily: sc, fontSize: 34, color: C.ink2, marginTop: 20 }}>{who}</div>
                </In>
              ))}
            </div>
          </div>
        </AbsoluteFill>
      )}
      {f >= gloss && f < tabs && (
        <AbsoluteFill style={{ opacity: ease(f, gloss, 10) * (1 - ease(f, tabs - 10, 10)) }}>
          <Sequence from={gloss} layout="none">
            <Browser name="gloss" url={`${URL}/#/app/care`} width={1500} left={210} top={90} light startFrom={420}
              cams={[{ f: 0, z: 1.0 }, { f: 40, z: 1.45, rect: { x: 300, y: 560, w: 1240, h: 260 } }]} />
          </Sequence>
        </AbsoluteFill>
      )}
      {f >= tabs - 10 && (
        <AbsoluteFill style={{ opacity: ease(f, tabs - 10, 10) }}>
          <Paper />
          <Phone name="ko-cath" height={770} left={320} top={160} segs={[{ at: 0, from: 60 }]} />
          <Phone name="ko-prot" height={770} left={1200} top={160} segs={[{ at: 0, from: 60 }]} />
          <In at={mass - 4} style={{ position: "absolute", left: 120, top: 60, width: 760, textAlign: "center" }}>
            <Rubric style={{ fontSize: 30 }}>Basilica di San Venanzio · Catholic</Rubric>
            <div style={{ fontFamily: serif, fontSize: 40, color: C.ink }}>미사 · <span style={{ fontFamily: serifItalic, fontStyle: "italic", color: C.rubric }}>Mass</span></div>
          </In>
          <In at={worship - 4} style={{ position: "absolute", left: 1000, top: 60, width: 760, textAlign: "center" }}>
            <Rubric style={{ fontSize: 30 }} color={C.ink2}>Grace Fellowship · Protestant</Rubric>
            <div style={{ fontFamily: serif, fontSize: 40, color: C.ink }}>예배 · <span style={{ fontFamily: serifItalic, fontStyle: "italic", color: C.rubric }}>worship</span></div>
          </In>
        </AbsoluteFill>
      )}
    </AbsoluteFill>
  );
};

// ---------------------------------------------------------------- 10. Sunday, together

export const Sunday: React.FC = () => {
  const f = useCurrentFrame();
  const next = W("sunday", "Next,");
  const counts = LS("sunday", 1) - 8;
  // The phone (following, in Arabic) and the console were recorded together; the first Next is at console frame 160.
  const start = Math.max(0, 160 - (next + 4));
  return (
    <AbsoluteFill style={{ background: C.paper }}>
      <Paper />
      {f < counts + 8 && (
        <AbsoluteFill style={{ opacity: 1 - ease(f, counts, 8) }}>
          <Browser name="live" url={`${URL}/#/app/live`} width={1220} left={90} top={150} light startFrom={start}
            cams={[{ f: 0, z: 1.0 }, { f: 30, z: 1.35, rect: { x: 180, y: 120, w: 1000, h: 560 } }]} />
          <Phone name="follow" height={860} left={1420} top={70} segs={[{ at: 0, from: start }]} />
          <In at={next - 6} style={{ position: "absolute", left: 120, top: 70 }}><Rubric>A volunteer taps Next. Every phone follows.</Rubric></In>
        </AbsoluteFill>
      )}
      {f >= counts && (
        <AbsoluteFill style={{ opacity: ease(f, counts, 10) }}>
          <Sequence from={counts} layout="none">
            <Browser name="insights" url={`${URL}/#/app/groups`} width={1500} left={210} top={100} light startFrom={40}
              cams={[{ f: 0, z: 1.0 }, { f: 30, z: 1.0 }, { f: W("sunday", "welcome") - counts, z: 1.7, rect: { x: 1040, y: 200, w: 520, h: 260 } }]} />
          </Sequence>
          <In at={W("sunday", "never") - 4} style={{ position: "absolute", left: 230, top: 40 }}><Rubric>Counts of languages only · sample history in the demo</Rubric></In>
        </AbsoluteFill>
      )}
    </AbsoluteFill>
  );
};

// ---------------------------------------------------------------- 11. under the hood

const Logo: React.FC<{ src: string; h: number; style?: React.CSSProperties }> = ({ src, h, style }) => (
  <Img src={staticFile(`brand/${src}`)} style={{ height: h, width: "auto", ...style }} />
);

export const Stack: React.FC = () => {
  const f = useCurrentFrame();
  const claude = W("stack", "Claude,");
  const zerog = W("stack", "0G");
  const verbs = ["summarises,", "drafts,", "translates,", "checks."].map((w) => W("stack", w));
  const eleven = W("stack", "ElevenLabs");
  const nevers = LS("stack", 1) - 6;
  const never = [0, 1, 2, 3].map((n) => W("stack", "never", n));
  const lines = ["sees personal details.", "writes Bible text.", "answers a crisis.", "sends a word without a person's approval."];
  return (
    <AbsoluteFill>
      <Nave />
      <div style={{ position: "absolute", left: 120, top: 90 }}><Rubric color={C.rubricLight}>Under the hood</Rubric></div>
      {/* the bridge: phone, Koinonia, Claude via 0G; voices by ElevenLabs */}
      <div style={{ position: "absolute", left: 0, top: 0, width: 1920, height: 1080, opacity: 1 - 0.93 * ease(f, nevers, 14) }}>
        <div style={{ position: "absolute", left: 760, top: 200 }}>
          <Rose size={400} ambient glow={0.8} />
        </div>
        <In at={8} style={{ position: "absolute", left: 785, top: 620, width: 350, textAlign: "center" }}>
          <KoinoniaLogo height={64} light />
          <div style={{ fontFamily: sans, fontSize: 22, color: "rgba(244,238,226,0.65)", marginTop: 8 }}>roles · approval gate · crisis screen</div>
        </In>
        <In at={4} style={{ position: "absolute", left: 160, top: 330, width: 460 }}>
          <div style={{ fontFamily: serif, fontSize: 42, color: C.vellum }}>The phone</div>
          <div style={{ fontFamily: sans, fontSize: 26, color: "rgba(244,238,226,0.7)", lineHeight: 1.4, marginTop: 8 }}>Personal details removed here.<br />Crisis lines shown here.</div>
        </In>
        <In at={claude - 6} x={30} y={0} style={{ position: "absolute", left: 1290, top: 250, width: 520 }}>
          <div style={{ display: "flex", alignItems: "center", gap: 22 }}>
            <Logo src="claude.svg" h={74} style={{ filter: "invert(56%) sepia(55%) saturate(700%) hue-rotate(335deg) brightness(95%)" }} />
            <div style={{ fontFamily: serif, fontSize: 64, color: C.vellum, fontWeight: 500 }}>Claude</div>
          </div>
          <In at={zerog - 4} style={{ display: "flex", alignItems: "center", gap: 16, marginTop: 20 }}>
            <div style={{ fontFamily: sans, fontSize: 26, color: "rgba(244,238,226,0.7)" }}>served through</div>
            <Logo src="0g-footer-logo-white.svg" h={38} />
            <div style={{ fontFamily: sans, fontSize: 26, color: "rgba(244,238,226,0.85)" }}>Compute Network</div>
          </In>
          <div style={{ display: "flex", gap: 12, marginTop: 26, flexWrap: "wrap" }}>
            {["summarises", "drafts", "translates", "checks"].map((v, i) => (
              <In key={v} at={verbs[i] - 4} y={10}><span style={{ fontFamily: sc, fontSize: 26, color: C.goldLight, border: `1px solid rgba(217,174,92,0.5)`, padding: "4px 14px", borderRadius: 3 }}>{v}</span></In>
            ))}
          </div>
        </In>
        <In at={eleven - 6} x={30} y={0} style={{ position: "absolute", left: 1290, top: 640, width: 520 }}>
          <Logo src="elevenlabs-white.svg" h={40} />
          <div style={{ fontFamily: sans, fontSize: 26, color: "rgba(244,238,226,0.7)", marginTop: 14 }}>a native voice for every language</div>
        </In>
      </div>
      {f >= nevers && (
        <div style={{ position: "absolute", left: 160, top: 250, width: 1500 }}>
          {lines.map((l, i) => (
            <In key={i} at={never[i] - 4} x={-20} y={0} style={{ marginBottom: 30, fontFamily: serif, fontSize: 64, color: C.vellum, fontWeight: 500, textShadow: "0 2px 20px rgba(0,0,0,0.6)" }}>
              <span style={{ fontFamily: serifItalic, fontStyle: "italic", color: C.rubricLight }}>Never </span>{l}
            </In>
          ))}
        </div>
      )}
    </AbsoluteFill>
  );
};

// ---------------------------------------------------------------- 12. why it is different

export const Why: React.FC = () => {
  const f = useCurrentFrame();
  const cards = [
    { at: W("why", "privacy"), title: "Privacy on the phone", body: "Names, numbers, emails, student IDs and addresses are removed before sending." },
    { at: W("why", "meaning"), title: "A meaning check before every reply", body: "Translated, translated back by a separate call, compared. Then a pastor approves." },
    { at: W("why", "person", 0), title: "A person for every cry for help", body: "Crisis lines at once, in the person's language. The care team alerted." },
  ];
  return (
    <AbsoluteFill>
      <Paper />
      <div style={{ position: "absolute", left: 130, top: 120, width: 1660 }}>
        <Spoken id="why" range={[0, 4]} accent={{ "hear.": C.gold }} style={{ fontFamily: serif, fontSize: 60, color: C.ink2, fontWeight: 500 }} />
        <Spoken id="why" range={[4, 9]} accent={{ "heard:": C.rubric }} style={{ fontFamily: serif, fontSize: 104, color: C.ink, fontWeight: 500, marginTop: 4 }} />
        <div style={{ display: "flex", gap: 36, marginTop: 70 }}>
          {cards.map((c, i) => (
            <In key={i} at={c.at - 6} style={{ flex: 1 }}>
              <div style={{ borderTop: `3px solid ${C.rubric}`, paddingTop: 24 }}>
                <div style={{ fontFamily: serif, fontSize: 30, color: C.rubric, fontWeight: 500 }}>{["I", "II", "III"][i]}</div>
                <div style={{ fontFamily: serif, fontSize: 44, color: C.ink, fontWeight: 500, lineHeight: 1.12, marginTop: 6 }}>{c.title}</div>
                <div style={{ fontFamily: sans, fontSize: 27, color: C.ink2, lineHeight: 1.4, marginTop: 14 }}>{c.body}</div>
              </div>
            </In>
          ))}
        </div>
      </div>
      <div style={{ position: "absolute", right: -160, bottom: -200, opacity: 0.16 }}><Rose size={620} ambient /></div>
    </AbsoluteFill>
  );
};

// ---------------------------------------------------------------- 13. the close

export const Close: React.FC = () => {
  const f = useCurrentFrame();
  const heard = W("close", "heard.");
  return (
    <AbsoluteFill>
      <Paper />
      <div style={{ position: "absolute", left: 150, top: 150 }}>
        <Rose size={780} build={0} ambient glow={1} />
      </div>
      <div style={{ position: "absolute", left: 1020, top: 260, width: 820 }}>
        <In at={W("close", "Koinonia.") - 2} dur={20}><KoinoniaLogo height={140} /></In>
        <In at={W("close", "Every") - 3} style={{ marginTop: 34 }}>
          <div style={{ fontFamily: serif, fontSize: 76, lineHeight: 1.05, color: C.ink, fontWeight: 500 }}>
            Every newcomer, <span style={{ fontFamily: serifItalic, fontStyle: "italic", color: C.rubric, opacity: ease(f, heard - 2) }}>heard.</span>
          </div>
        </In>
        <In at={heard + 24} style={{ marginTop: 50 }}>
          <div style={{ fontFamily: mono, fontSize: 34, color: C.ink }}>{URL}</div>
          <div style={{ fontFamily: sc, fontSize: 28, color: C.rubric, marginTop: 16 }}>AI for Church Hackathon 2026 · Care & Community</div>
        </In>
        <In at={heard + 50} style={{ marginTop: 60 }}>
          <div style={{ fontFamily: sans, fontSize: 21, color: C.ink3, lineHeight: 1.5, width: 760 }}>
            A dramatization with stock footage (Mixkit). The app, its screens, its AI replies and its voices are real, recorded on the live site. The churches are sample data with fictional people.
          </div>
        </In>
      </div>
    </AbsoluteFill>
  );
};
