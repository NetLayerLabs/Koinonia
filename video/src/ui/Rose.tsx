import React from "react";
import { interpolate, useCurrentFrame } from "remotion";
import { C, LANGS, serif } from "../theme";
import { clamp, expo } from "./motion";

/**
 * The film's motif: Koinonia's rose window (src/components/brand/RoseWindow.tsx in the app), drawn by frame.
 * Twelve petals are the twelve pew languages, each in its own script. Red light travels from a petal to the
 * centre (a request arriving) and gold travels back out (a reply returning).
 *  - `build` (local frame) draws it in: stone, petals one by one, then the vesica.
 *  - `pulses` are request/reply lights on cue; `ambient` keeps the landing page's own gentle traffic going.
 *  - `lit` lights petals (by language code) from a frame on.
 */
export interface Pulse { lang: string; at: number; dir: "in" | "out"; dur?: number }

const CX = 300;
const PETAL_R = 198;
const PANE_R = 46;
const FILLS = ["#f3dfd6", "#f1e5c8", "#dde8de"];
const polar = (r: number, i: number, n = 12, off = -90) => {
  const a = ((off + (360 / n) * i) * Math.PI) / 180;
  return { x: CX + r * Math.cos(a), y: CX + r * Math.sin(a) };
};

export const Rose: React.FC<{
  size: number; build?: number; pulses?: Pulse[]; ambient?: boolean; lit?: { lang: string; at: number; until?: number }[];
  spin?: number; style?: React.CSSProperties; glow?: number;
}> = ({ size, build, pulses = [], ambient, lit = [], spin = 1, style, glow = 1 }) => {
  const f = useCurrentFrame();
  const turn = (f / 30) * (360 / 160) * spin; // one turn in 160 s, like the landing page
  const b = (from: number, len = 14) => (build == null ? 1 : interpolate(f, [build + from, build + from + len], [0, 1], { ...clamp, easing: expo }));
  const breathe = 1 + 0.03 * Math.sin((f / 30) * ((2 * Math.PI) / 6));
  const all: Pulse[] = [...pulses];
  if (ambient) {
    for (let k = 0; k < 40; k++) {
      const i = (k * 5) % 12;
      const at = k * 28 - 400;
      all.push({ lang: LANGS[i].code, at, dir: "in", dur: 60 }, { lang: LANGS[i].code, at: at + 90, dir: "out", dur: 60 });
    }
  }
  const petalLit = (code: string) => Math.max(0, ...lit.filter((l) => l.lang === code).map((l) => interpolate(f, [l.at, l.at + 8, (l.until ?? 1e9), (l.until ?? 1e9) + 12], [0, 1, 1, 0], clamp)));
  return (
    <svg viewBox="0 0 600 600" width={size} height={size} style={{ overflow: "visible", ...style }}>
      <defs>
        <radialGradient id="rw-glow" cx="50%" cy="50%" r="50%">
          <stop offset="0%" stopColor="#f6d9a8" stopOpacity={0.95 * glow} />
          <stop offset="55%" stopColor="#f1e5c8" stopOpacity={0.35 * glow} />
          <stop offset="100%" stopColor="#f1e5c8" stopOpacity="0" />
        </radialGradient>
        <clipPath id="rw-clip"><circle cx={CX} cy={CX} r="276" /></clipPath>
      </defs>
      <g opacity={b(0, 18)} transform={`translate(${CX} ${CX}) scale(${0.92 + 0.08 * b(0, 18)}) translate(${-CX} ${-CX})`}>
        <circle cx={CX} cy={CX} r="296" fill="#efe6d4" stroke={C.ink} strokeWidth="1.5" />
        <circle cx={CX} cy={CX} r="286" fill="none" stroke={C.rule} strokeWidth="1" />
        <g transform={`rotate(${-turn * 0.62} ${CX} ${CX})`}>
          {Array.from({ length: 36 }, (_, i) => {
            const p = polar(268, i, 36);
            return <circle key={i} cx={p.x} cy={p.y} r="7.5" fill={C.vellum} stroke={C.ink} strokeWidth="1" opacity={b(4 + i * 0.4, 8)} />;
          })}
        </g>
      </g>
      <g clipPath="url(#rw-clip)">
        <circle cx={CX} cy={CX} r="258" fill={C.vellum} opacity={b(2, 18)} />
        <circle cx={CX} cy={CX} r="150" fill="url(#rw-glow)" transform={`translate(${CX} ${CX}) scale(${breathe}) translate(${-CX} ${-CX})`} opacity={b(30, 20)} />
        <g transform={`rotate(${turn} ${CX} ${CX})`}>
          {LANGS.map((_, i) => {
            const a = polar(PETAL_R - PANE_R, i), e = polar(92, i);
            const p = b(8 + i * 2, 12);
            return <line key={`s${i}`} x1={e.x} y1={e.y} x2={e.x + (a.x - e.x) * p} y2={e.y + (a.y - e.y) * p} stroke={C.ink} strokeWidth="1.2" />;
          })}
          {LANGS.map((_, i) => {
            const p = polar(PETAL_R + 2, i + 0.5);
            return (
              <path key={`t${i}`} d={`M ${p.x} ${p.y} m -14 14 a 22 22 0 0 1 14 -32 a 22 22 0 0 1 14 32 z`}
                transform={`rotate(${30 * (i + 0.5)} ${p.x} ${p.y})`} fill="#efe6d4" stroke={C.ink} strokeWidth="1" opacity={b(14 + i * 2, 10)} />
            );
          })}
          {LANGS.map((l, i) => {
            const p = polar(PETAL_R, i);
            const s = b(10 + i * 2.5, 14);
            const on = petalLit(l.code);
            const base = FILLS[i % 3];
            return (
              <g key={l.code} transform={`translate(${p.x} ${p.y}) scale(${0.4 + 0.6 * s}) translate(${-p.x} ${-p.y})`} opacity={s}>
                <circle cx={p.x} cy={p.y} r={PANE_R + 6} fill="none" stroke={on ? C.rubric : C.ink} strokeWidth={1.4 + on * 2.2} />
                <circle cx={p.x} cy={p.y} r={PANE_R} fill={on ? mix(base, "#e9a48f", on) : base} stroke={C.ink} strokeWidth="1" />
                <text x={p.x} y={p.y} textAnchor="middle" dominantBaseline="central" fontFamily={`${serif}, 'Noto Naskh Arabic', 'Apple SD Gothic Neo', 'PingFang SC', serif`}
                  fontWeight={600} fontSize="30" fill={C.ink} transform={`rotate(${-turn} ${p.x} ${p.y})`}>{l.mark}</text>
              </g>
            );
          })}
          <circle cx={CX} cy={CX} r="92" fill={C.vellum} stroke={C.ink} strokeWidth="1.4" opacity={b(28, 14)} />
          <circle cx={CX} cy={CX} r="84" fill="none" stroke={C.rule} strokeWidth="1" strokeDasharray="2 5" opacity={b(30, 14)} />
          {all.map((pu, k) => {
            const i = LANGS.findIndex((l) => l.code === pu.lang);
            const dur = pu.dur ?? 34;
            const t = interpolate(f, [pu.at, pu.at + dur], [0, 1], { ...clamp, easing: expo });
            if (f < pu.at || f > pu.at + dur + 10) return null;
            const a = polar(PETAL_R - PANE_R, i), e = polar(96, i);
            const [from, to] = pu.dir === "in" ? [a, e] : [e, a];
            const x = from.x + (to.x - from.x) * t, y = from.y + (to.y - from.y) * t;
            const o = interpolate(f, [pu.at, pu.at + 4, pu.at + dur, pu.at + dur + 10], [0, 1, 1, 0], clamp);
            const col = pu.dir === "in" ? C.rubric : C.gold;
            return (
              <g key={k} opacity={o}>
                <circle cx={x} cy={y} r={11} fill={col} opacity={0.22} />
                <circle cx={x} cy={y} r={5.5} fill={col} />
              </g>
            );
          })}
        </g>
        <g opacity={b(34, 16)} transform={`translate(${CX} ${CX}) scale(${breathe * (0.6 + 0.4 * b(34, 16))}) translate(${-CX} ${-CX})`}>
          <circle cx={CX - 28} cy={CX} r="56" fill="none" stroke={C.ink} strokeWidth="1.8" />
          <circle cx={CX + 28} cy={CX} r="56" fill="none" stroke={C.ink} strokeWidth="1.8" />
          <path d={`M ${CX} ${CX - 48.5} A 56 56 0 0 1 ${CX} ${CX + 48.5} A 56 56 0 0 1 ${CX} ${CX - 48.5} Z`} fill={C.rubric} />
          <path d={`M ${CX} ${CX - 24} V ${CX + 24} M ${CX - 14} ${CX - 7} H ${CX + 14}`} stroke={C.vellum} strokeWidth="3" strokeLinecap="round" />
        </g>
      </g>
      <circle cx={CX} cy={CX} r="276" fill="none" stroke={C.ink} strokeWidth="2" opacity={b(0, 18)} />
    </svg>
  );
};

function mix(a: string, b: string, t: number) {
  const p = (h: string) => [1, 3, 5].map((i) => parseInt(h.slice(i, i + 2), 16));
  const [x, y] = [p(a), p(b)];
  return `rgb(${x.map((v, i) => Math.round(v + (y[i] - v) * t)).join(",")})`;
}

/** Where a petal sits on a Rose drawn at `size` (for lines and labels drawn outside the SVG). Ignores the turn. */
export const petalAt = (lang: string, size: number) => {
  const i = LANGS.findIndex((l) => l.code === lang);
  const p = polar(PETAL_R, i);
  return { x: (p.x / 600) * size, y: (p.y / 600) * size };
};

/** A tiny in-ease helper for scenes: 0 -> 1 from frame a over d frames. */
export const ease = (f: number, a: number, d = 14) => interpolate(f, [a, a + d], [0, 1], { ...clamp, easing: expo });
