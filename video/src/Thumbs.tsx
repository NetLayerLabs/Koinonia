import React from "react";
import { AbsoluteFill, Img, staticFile } from "remotion";
import { C, sans, sc, serif, serifItalic } from "./theme";
import { Phone } from "./ui/Phone";

// YouTube thumbnail options. People: frames from the film's stock clips (Mixkit 46763, 46531).
// The phone shows a real frame of the live app (the reply clip): "Aprobado por Fr. Andrea Ricci".

const Logo: React.FC<{ h: number; light?: boolean }> = ({ h, light }) => (
  <Img src={staticFile(`brand/${light ? "koinonia-header-light.png" : "koinonia-header.png"}`)} style={{ height: h, width: "auto" }} />
);
const ReplyPhone: React.FC<{ left: number; top: number; height: number; rot?: number }> = ({ left, top, height, rot = 0 }) => (
  <div style={{ position: "absolute", left, top, transform: `rotate(${rot}deg)` }}>
    <Phone name="reply" height={height} left={0} top={0} dark enter={-40} segs={[{ at: 0, from: 330, hold: true }]} cam={[{ f: 0, z: 1 }]} />
  </div>
);

/** A: the newcomer with her phone, and the real approved reply. */
export const ThumbA: React.FC = () => (
  <AbsoluteFill style={{ background: C.nave }}>
    <Img src={staticFile("poster/phone-woman.jpg")} style={{ position: "absolute", left: -120, top: 0, height: 1080, width: "auto", filter: "saturate(1.05) contrast(1.05)" }} />
    <AbsoluteFill style={{ background: "linear-gradient(90deg, rgba(30,26,22,0) 30%, rgba(30,26,22,0.85) 58%, rgba(30,26,22,1) 75%)" }} />
    <AbsoluteFill style={{ background: "linear-gradient(0deg, rgba(30,26,22,0.85) 0%, rgba(30,26,22,0) 40%)" }} />
    <ReplyPhone left={1330} top={70} height={940} rot={4} />
    <div style={{ position: "absolute", left: 80, bottom: 70 }}>
      <div style={{ fontFamily: serif, fontWeight: 700, fontSize: 210, lineHeight: 0.9, color: "#fff", textShadow: "0 6px 30px rgba(0,0,0,0.6)" }}>
        <span style={{ fontFamily: serifItalic, fontStyle: "italic", color: "#ff7a5c" }}>Heard.</span>
      </div>
      <div style={{ fontFamily: sans, fontWeight: 700, fontSize: 64, color: "#fff", marginTop: 14, textShadow: "0 4px 20px rgba(0,0,0,0.7)" }}>In her own language.</div>
    </div>
    <div style={{ position: "absolute", left: 80, top: 60, background: "rgba(251,248,241,0.92)", padding: "14px 22px", borderRadius: 6 }}><Logo h={74} /></div>
  </AbsoluteFill>
);

/** B: alone in the pew. */
export const ThumbB: React.FC = () => (
  <AbsoluteFill style={{ background: C.nave }}>
    <Img src={staticFile("poster/pew-woman.jpg")} style={{ position: "absolute", left: -1050, top: -170, height: 2160, width: "auto", filter: "saturate(1.1) contrast(1.08) brightness(0.95)" }} />
    <AbsoluteFill style={{ background: "linear-gradient(90deg, rgba(20,16,12,0.92) 0%, rgba(20,16,12,0.75) 38%, rgba(20,16,12,0) 62%)" }} />
    <div style={{ position: "absolute", left: 90, top: 150, width: 980 }}>
      <div style={{ fontFamily: serif, fontWeight: 700, fontSize: 132, lineHeight: 0.98, color: "#fff" }}>
        No one here spoke <span style={{ fontFamily: serifItalic, fontStyle: "italic", color: "#ff7a5c" }}>her language.</span>
      </div>
      <div style={{ fontFamily: sans, fontWeight: 700, fontSize: 54, color: C.goldLight, marginTop: 36 }}>Until her phone did.</div>
    </div>
    <div style={{ position: "absolute", left: 90, bottom: 70, background: "rgba(251,248,241,0.92)", padding: "14px 22px", borderRadius: 6 }}><Logo h={70} /></div>
  </AbsoluteFill>
);

/** C: before and after. */
export const ThumbC: React.FC = () => (
  <AbsoluteFill style={{ background: C.paper }}>
    <div style={{ position: "absolute", left: 0, top: 0, width: 960, height: 1080, overflow: "hidden" }}>
      <Img src={staticFile("poster/pew-woman.jpg")} style={{ position: "absolute", left: -1180, top: -200, height: 2200, width: "auto", filter: "grayscale(0.85) brightness(0.7) contrast(1.1)" }} />
      <AbsoluteFill style={{ background: "linear-gradient(0deg, rgba(20,16,12,0.85) 0%, rgba(20,16,12,0) 45%)" }} />
      <div style={{ position: "absolute", left: 60, bottom: 60, fontFamily: serif, fontWeight: 700, fontSize: 150, color: "rgba(255,255,255,0.92)" }}>Unheard.</div>
    </div>
    <div style={{ position: "absolute", left: 960, top: 0, width: 960, height: 1080, background: C.paper }}>
      <ReplyPhone left={530} top={110} height={820} rot={3} />
      <div style={{ position: "absolute", left: 60, top: 70 }}><Logo h={70} /></div>
      <div style={{ position: "absolute", left: 60, bottom: 60, fontFamily: serifItalic, fontStyle: "italic", fontWeight: 700, fontSize: 150, color: C.rubric }}>Heard.</div>
      <div style={{ position: "absolute", left: 66, top: 210, width: 400, fontFamily: sc, fontWeight: 700, fontSize: 40, lineHeight: 1.25, color: C.ink }}>In her own language. A pastor approves every word.</div>
    </div>
    <div style={{ position: "absolute", left: 954, top: 0, width: 12, height: 1080, background: C.rubric }} />
  </AbsoluteFill>
);
