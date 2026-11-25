import React from "react";
import { interpolate, useCurrentFrame } from "remotion";
import { C, mono, sans } from "../theme";
import { T, type Line } from "../timing";
import { clamp } from "./motion";

type Word = Line["words"][number];
const BREAK_BEFORE = new Set(["from", "to", "in", "with", "and", "which", "because", "so", "but", "for"]);

/** Sentences first; a sentence over 11 words breaks after a comma or before a joining word, nearest the middle. */
function phrases(words: Word[]): Word[][] {
  const sentences: Word[][] = [];
  let cur: Word[] = [];
  for (const w of words) {
    cur.push(w);
    // a colon ends a phrase only when a lowercase word follows ("facts: who led ..."), not before a name ("so far: Lovable.")
    const next = words[words.indexOf(w) + 1];
    const colon = /:$/.test(w.word) && next && /^[a-z]/.test(next.word);
    if ((/[.?!]$/.test(w.word) || colon) && cur.length >= 2) { sentences.push(cur); cur = []; }
  }
  if (cur.length) {
    if (cur.length < 2 && sentences.length) sentences[sentences.length - 1].push(...cur);
    else sentences.push(cur);
  }
  const out: Word[][] = [];
  const split = (s: Word[]) => {
    if (s.length <= 11) { out.push(s); return; }
    const mid = s.length / 2;
    let best = -1;
    for (let i = 3; i <= s.length - 3; i++) {
      const ok = /[,:]$/.test(s[i - 1].word) || BREAK_BEFORE.has(s[i].word.toLowerCase().replace(/[^a-z]/g, ""));
      if (ok && (best < 0 || Math.abs(i - mid) < Math.abs(best - mid))) best = i;
    }
    if (best < 0) best = Math.ceil(mid);
    split(s.slice(0, best));
    split(s.slice(best));
  };
  for (const s of sentences) split(s);
  return out;
}

/**
 * Documentary subtitles: the spoken phrase, set plainly at the bottom of the frame.
 * A line is split at punctuation into short phrases; each phrase shows while it is spoken.
 */
export const Subtitles: React.FC<{
  hidden?: (frame: number, line: Line) => boolean; tag?: (line: Line) => string | null; bottom?: number;
  /** "ink" over the app's paper background, otherwise light type over footage. */ tone?: (frame: number) => "ink" | "light";
}> = ({ hidden, tag, bottom = 54, tone }) => {
  const frame = useCurrentFrame();
  const line = T.scenes.flatMap((s) => s.lines).find((l) => frame >= l.startFrame - 3 && frame <= l.words[l.words.length - 1].end + 10);
  if (!line || hidden?.(frame, line)) return null;
  const chunks = phrases(line.words);
  let shown = chunks[0];
  for (const c of chunks) if (frame >= c[0].start - 2) shown = c;
  const lastEnd = line.words[line.words.length - 1].end;
  const op = interpolate(frame, [line.startFrame - 3, line.startFrame + 3, lastEnd + 4, lastEnd + 10], [0, 1, 1, 0], clamp);
  const ink = tone?.(frame) === "ink";
  return (
    <div style={{ position: "absolute", left: 0, right: 0, bottom, display: "flex", justifyContent: "center", opacity: op, pointerEvents: "none" }}>
      <div style={{
        maxWidth: 1400, textAlign: "center", fontFamily: sans, fontSize: 38, fontWeight: 500, lineHeight: 1.3, letterSpacing: "-0.005em",
        color: ink ? C.ink : "#FBF9F3", textShadow: ink ? "0 1px 2px rgba(255,255,255,0.8)" : "0 2px 3px rgba(0,0,0,0.55), 0 0 22px rgba(0,0,0,0.45)",
      }}>
        {tag?.(line) ? <span style={{ fontFamily: mono, fontSize: 17, fontWeight: 500, letterSpacing: "0.14em", color: "#fff", marginRight: 16, verticalAlign: "middle", textShadow: "none", background: C.signal, borderRadius: 6, padding: "4px 10px" }}>{tag(line)}</span> : null}
        {shown.map((w) => w.word).join(" ")}
      </div>
    </div>
  );
};
