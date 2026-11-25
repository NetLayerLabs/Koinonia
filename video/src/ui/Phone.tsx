import React from "react";
import { Freeze, OffthreadVideo, Sequence, interpolate, staticFile, useCurrentFrame } from "remotion";
import { C } from "../theme";
import { clip } from "./Footage";
import { clamp, soft } from "./motion";

/**
 * An iPhone 15 Pro style frame (titanium edge, Dynamic Island) playing a recording of the live pew page
 * (390x844 CSS px, recorded at 3x). `segs` cut the recording: from local frame `at`, play from clip frame
 * `from` at `rate`, until the next segment; after the last one the clip plays on and then holds.
 * `cam` zooms into the page: at local frame f, scale z about page point (x, y) in CSS px.
 */
export interface Seg { at: number; from: number; rate?: number; hold?: boolean }
export interface PCam { f: number; z?: number; x?: number; y?: number }
const W = 390, H = 844, SB = 50; // the page, and a status bar above it (the recording has none)

export const Phone: React.FC<{
  name: string; height: number; left: number; top: number; segs: Seg[]; cam?: PCam[]; enter?: number; exit?: number;
  tilt?: number; style?: React.CSSProperties; overlay?: React.ReactNode; dark?: boolean;
}> = ({ name, height, left, top, segs, cam = [], enter = 0, exit, tilt = 0, style, overlay, dark }) => {
  const f = useCurrentFrame();
  const c = clip(name);
  const bezel = height * 0.022;
  const sh = height - bezel * 2;
  const k = sh / (H + SB);
  const sw = W * k;
  const width = sw + bezel * 2;
  const inP = interpolate(f, [enter, enter + 22], [0, 1], { ...clamp, easing: soft });
  const outP = exit != null ? interpolate(f, [exit, exit + 14], [0, 1], { ...clamp, easing: soft }) : 0;

  // camera
  const pts = cam.map((p) => ({ f: p.f, z: p.z ?? 1, x: p.x ?? W / 2, y: p.y ?? H / 2 }));
  let cz = 1, cx = W / 2, cy = H / 2;
  if (pts.length) {
    if (f <= pts[0].f) ({ z: cz, x: cx, y: cy } = pts[0]);
    else if (f >= pts[pts.length - 1].f) ({ z: cz, x: cx, y: cy } = pts[pts.length - 1]);
    else for (let i = 1; i < pts.length; i++) if (f <= pts[i].f) {
      const a = pts[i - 1], b = pts[i];
      const t = interpolate(f, [a.f, b.f], [0, 1], { ...clamp, easing: soft });
      cz = a.z + (b.z - a.z) * t; cx = a.x + (b.x - a.x) * t; cy = a.y + (b.y - a.y) * t; break;
    }
  }
  const tx = Math.min(0, Math.max(W - W * cz, W / 2 - cx * cz));
  const ty = Math.min(0, Math.max(H - H * cz, H / 2 - cy * cz));

  // which segment
  let seg = segs[0];
  for (const s of segs) if (f >= s.at) seg = s;
  const last = c ? c.durationFrames - 2 : 0;
  const rate = seg.rate ?? 1;
  const pos = seg.from + Math.max(0, f - seg.at) * rate;
  const video = c ? <OffthreadVideo src={staticFile(c.file)} startFrom={seg.from} playbackRate={rate} muted style={{ width: W, height: H }} /> : null;
  const player = !c ? null : seg.hold || pos >= last
    ? <Freeze frame={seg.hold ? 0 : Math.floor((last - seg.from) / rate)}>{video}</Freeze>
    : <Sequence from={seg.at} layout="none">{video}</Sequence>;

  return (
    <div style={{
      position: "absolute", left, top, width, height, borderRadius: width * 0.16,
      background: "linear-gradient(140deg, #8d877f 0%, #3d3934 18%, #2a2723 50%, #47423c 82%, #9a948b 100%)",
      padding: bezel, boxSizing: "border-box",
      boxShadow: dark ? "0 60px 120px rgba(0,0,0,0.55), 0 0 0 1px rgba(255,255,255,0.08)" : "0 50px 110px rgba(70,45,20,0.30), 0 0 0 1px rgba(28,25,21,0.25)",
      opacity: inP * (1 - outP), transform: `translateY(${(1 - inP) * 60 - outP * 30}px) perspective(2400px) rotateY(${tilt * (1 - inP)}deg)`, ...style,
    }}>
      <div style={{ position: "relative", width: sw, height: sh, borderRadius: width * 0.13, overflow: "hidden", background: C.paper }}>
        <div style={{ position: "absolute", left: 0, top: SB * k, width: W * k, height: H * k, overflow: "hidden" }}>
          <div style={{ position: "absolute", left: 0, top: 0, width: W, height: H, transformOrigin: "0 0", transform: `scale(${k}) translate(${tx}px, ${ty}px) scale(${cz})` }}>
            {player}
            {overlay ? <div style={{ position: "absolute", inset: 0 }}>{overlay}</div> : null}
          </div>
        </div>
        <div style={{ position: "absolute", left: 0, top: 0, width: sw, height: SB * k, background: C.paper, display: "flex", alignItems: "center", justifyContent: "space-between", padding: `0 ${28 * k}px`, boxSizing: "border-box", fontFamily: "-apple-system, 'SF Pro Text', 'Helvetica Neue', sans-serif", fontWeight: 600, fontSize: 16 * k, color: C.ink }}>
          <span style={{ marginLeft: 10 * k }}>9:41</span>
          <span style={{ display: "flex", gap: 5 * k, alignItems: "center" }}>
            {[5, 8, 11, 14].map((h) => <span key={h} style={{ width: 3.2 * k, height: h * k * 0.8, background: C.ink, borderRadius: 1, alignSelf: "flex-end" }} />)}
            <span style={{ width: 24 * k, height: 11.5 * k, border: `${1.2 * k}px solid ${C.ink}`, borderRadius: 3.5 * k, marginLeft: 6 * k, padding: 1.5 * k, boxSizing: "border-box" }}><span style={{ display: "block", width: "78%", height: "100%", background: C.ink, borderRadius: 1.5 * k }} /></span>
          </span>
        </div>
        {/* Dynamic Island */}
        <div style={{ position: "absolute", top: 11 * k, left: "50%", width: 120 * k, height: 34 * k, marginLeft: -60 * k, borderRadius: 999, background: "#0b0a09" }} />
      </div>
    </div>
  );
};
