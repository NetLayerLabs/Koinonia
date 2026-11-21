import React from 'react';
import { langMark } from './LangMark';

/**
 * The hero image: a rose window, the round stained-glass window of an Italian basilica.
 * Its twelve petals are the twelve languages, each written in its own script.
 * In continuous motion:
 *  - the tracery turns slowly (the letters stay upright);
 *  - points of red light travel from each petal to the centre (a request arriving)
 *    and points of gold travel back out (a reply returning);
 *  - the petals light up in turn, as if each language were speaking;
 *  - the vesica at the centre, the shared space, glows;
 *  - shafts of light drift across the glass.
 * Visitors who ask for reduced motion get the still window.
 */

const LANGS = ['en', 'it', 'ar', 'zh', 'es', 'ko', 'fr', 'uk', 'sw', 'vi', 'pt', 'pl'];
const C = 300; // centre
const PETAL_R = 198; // distance of petal centres
const PANE_R = 46;
const TURN = 160; // seconds per full turn

function polar(r: number, i: number, n = 12, offset = -90) {
  const a = ((offset + (360 / n) * i) * Math.PI) / 180;
  return { x: C + r * Math.cos(a), y: C + r * Math.sin(a) };
}

const PANE_FILLS = ['#f3dfd6', '#f1e5c8', '#dde8de'];

export function RoseWindow({ className = '' }: { className?: string }) {
  return (
    <div className={`rose-window relative ${className}`}>
      <style>{`
        .rose-window .rw-turn { transform-origin: ${C}px ${C}px; animation: rw-spin ${TURN}s linear infinite; }
        .rose-window .rw-upright { transform-box: fill-box; transform-origin: center; animation: rw-spin ${TURN}s linear infinite reverse; }
        .rose-window .rw-ring { transform-origin: ${C}px ${C}px; animation: rw-spin ${TURN * 1.6}s linear infinite reverse; }
        .rose-window .rw-breathe { transform-origin: ${C}px ${C}px; animation: rw-breathe 6s ease-in-out infinite; }
        .rose-window .rw-shaft { animation: rw-shaft 14s ease-in-out infinite; }
        .rose-window .rw-shaft.b { animation-delay: -7s; animation-duration: 18s; }
        @keyframes rw-spin { to { transform: rotate(360deg); } }
        @keyframes rw-breathe { 0%, 100% { transform: scale(1); opacity: .9; } 50% { transform: scale(1.06); opacity: 1; } }
        @keyframes rw-shaft { 0%, 100% { opacity: .0; transform: translateX(-30px); } 50% { opacity: .55; transform: translateX(30px); } }
        @media (prefers-reduced-motion: reduce) {
          .rose-window * { animation: none !important; }
          .rose-window .rw-pulses { display: none; }
        }
      `}</style>

      <svg viewBox="0 0 600 600" className="w-full h-auto" role="img" aria-labelledby="rw-title">
        <title id="rw-title">
          A rose window whose twelve petals are twelve languages; light travels from each petal to the shared centre and back.
        </title>
        <defs>
          <radialGradient id="rw-glow" cx="50%" cy="50%" r="50%">
            <stop offset="0%" stopColor="#f6d9a8" stopOpacity="0.95" />
            <stop offset="55%" stopColor="#f1e5c8" stopOpacity="0.35" />
            <stop offset="100%" stopColor="#f1e5c8" stopOpacity="0" />
          </radialGradient>
          <linearGradient id="rw-shaft-grad" x1="0" y1="0" x2="1" y2="1">
            <stop offset="0%" stopColor="#fff6e2" stopOpacity="0" />
            <stop offset="50%" stopColor="#fff6e2" stopOpacity="0.9" />
            <stop offset="100%" stopColor="#fff6e2" stopOpacity="0" />
          </linearGradient>
          <clipPath id="rw-clip">
            <circle cx={C} cy={C} r="276" />
          </clipPath>
        </defs>

        {/* stone surround */}
        <circle cx={C} cy={C} r="296" fill="#efe6d4" stroke="var(--color-ink)" strokeWidth="1.5" />
        <circle cx={C} cy={C} r="286" fill="none" stroke="var(--color-rule-strong)" strokeWidth="1" />

        {/* outer ring of small roundels, turning the other way */}
        <g className="rw-ring">
          {Array.from({ length: 36 }, (_, i) => {
            const p = polar(268, i, 36);
            return <circle key={i} cx={p.x} cy={p.y} r="7.5" fill="#fbf8f1" stroke="var(--color-ink)" strokeWidth="1" />;
          })}
        </g>

        <g clipPath="url(#rw-clip)">
          <circle cx={C} cy={C} r="258" fill="#fbf8f1" />
          <circle cx={C} cy={C} r="150" fill="url(#rw-glow)" className="rw-breathe" />

          <g className="rw-turn">
            {/* spokes */}
            {LANGS.map((_, i) => {
              const a = polar(PETAL_R - PANE_R, i);
              const b = polar(92, i);
              return <line key={`s${i}`} x1={a.x} y1={a.y} x2={b.x} y2={b.y} stroke="var(--color-ink)" strokeWidth="1.2" />;
            })}

            {/* tracery between petals: pointed arches */}
            {LANGS.map((_, i) => {
              const p = polar(PETAL_R + 2, i + 0.5);
              return (
                <path
                  key={`t${i}`}
                  d={`M ${p.x} ${p.y} m -14 14 a 22 22 0 0 1 14 -32 a 22 22 0 0 1 14 32 z`}
                  transform={`rotate(${(360 / 12) * (i + 0.5)} ${p.x} ${p.y})`}
                  fill="#efe6d4"
                  stroke="var(--color-ink)"
                  strokeWidth="1"
                />
              );
            })}

            {/* petals: one pane per language */}
            {LANGS.map((code, i) => {
              const p = polar(PETAL_R, i);
              const fill = PANE_FILLS[i % 3];
              return (
                <g key={code}>
                  <circle cx={p.x} cy={p.y} r={PANE_R + 6} fill="none" stroke="var(--color-ink)" strokeWidth="1.4" />
                  <circle cx={p.x} cy={p.y} r={PANE_R} fill={fill} stroke="var(--color-ink)" strokeWidth="1">
                    {/* each language lights up in turn */}
                    <animate
                      attributeName="fill"
                      values={`${fill};#e9b8a6;${fill};${fill}`}
                      keyTimes="0;0.08;0.2;1"
                      dur="12s"
                      begin={`${i}s`}
                      repeatCount="indefinite"
                    />
                  </circle>
                  <g className="rw-upright">
                    <text
                      x={p.x}
                      y={p.y}
                      textAnchor="middle"
                      dominantBaseline="central"
                      fontFamily="Alegreya, 'Noto Naskh Arabic', serif"
                      fontWeight="600"
                      fontSize="30"
                      fill="var(--color-ink)"
                    >
                      {langMark(code)}
                    </text>
                  </g>
                </g>
              );
            })}

            {/* inner ring */}
            <circle cx={C} cy={C} r="92" fill="#fbf8f1" stroke="var(--color-ink)" strokeWidth="1.4" />
            <circle cx={C} cy={C} r="84" fill="none" stroke="var(--color-rule-strong)" strokeWidth="1" strokeDasharray="2 5" />

            {/* light travelling: requests in (red), replies out (gold) */}
            <g className="rw-pulses">
              {LANGS.map((_, i) => {
                const a = polar(PETAL_R - PANE_R, i);
                const b = polar(96, i);
                const inPath = `M ${a.x} ${a.y} L ${b.x} ${b.y}`;
                const outPath = `M ${b.x} ${b.y} L ${a.x} ${a.y}`;
                const start = (i * 1.7) % 12;
                return (
                  <g key={`p${i}`}>
                    <circle r="4.5" fill="var(--color-rubric)" opacity="0">
                      <animateMotion path={inPath} dur="12s" begin={`${start}s`} repeatCount="indefinite" keyPoints="0;0;1;1" keyTimes="0;0.0001;0.18;1" calcMode="linear" />
                      <animate attributeName="opacity" values="0;1;1;0;0" keyTimes="0;0.02;0.16;0.19;1" dur="12s" begin={`${start}s`} repeatCount="indefinite" />
                    </circle>
                    <circle r="4.5" fill="var(--color-gold)" opacity="0">
                      <animateMotion path={outPath} dur="12s" begin={`${start + 3}s`} repeatCount="indefinite" keyPoints="0;0;1;1" keyTimes="0;0.0001;0.18;1" calcMode="linear" />
                      <animate attributeName="opacity" values="0;1;1;0;0" keyTimes="0;0.02;0.16;0.19;1" dur="12s" begin={`${start + 3}s`} repeatCount="indefinite" />
                    </circle>
                  </g>
                );
              })}
            </g>
          </g>

          {/* the centre: a vesica, the shared space - it does not turn */}
          <g className="rw-breathe">
            <circle cx={C - 28} cy={C} r="56" fill="none" stroke="var(--color-ink)" strokeWidth="1.8" />
            <circle cx={C + 28} cy={C} r="56" fill="none" stroke="var(--color-ink)" strokeWidth="1.8" />
            <path d={`M ${C} ${C - 48.5} A 56 56 0 0 1 ${C} ${C + 48.5} A 56 56 0 0 1 ${C} ${C - 48.5} Z`} fill="var(--color-rubric)" />
            <path d={`M ${C} ${C - 24} V ${C + 24} M ${C - 14} ${C - 7} H ${C + 14}`} stroke="#fbf8f1" strokeWidth="3" strokeLinecap="round" />
          </g>

          {/* drifting shafts of light */}
          <g transform="rotate(28 300 300)">
            <rect className="rw-shaft" x="120" y="-60" width="70" height="720" fill="url(#rw-shaft-grad)" />
            <rect className="rw-shaft b" x="330" y="-60" width="46" height="720" fill="url(#rw-shaft-grad)" />
          </g>
        </g>

        <circle cx={C} cy={C} r="276" fill="none" stroke="var(--color-ink)" strokeWidth="2" />
      </svg>
    </div>
  );
}
