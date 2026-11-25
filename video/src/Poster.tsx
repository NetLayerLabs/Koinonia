import React from "react";
import { AbsoluteFill, Img, staticFile } from "remotion";
import { C, sc, serif, serifItalic } from "./theme";
import { Rose } from "./ui/Rose";

/** The YouTube thumbnail: big words, the rose window, the logo. Readable small. */
export const Poster: React.FC = () => (
  <AbsoluteFill style={{ background: C.paper }}>
    <div style={{ position: "absolute", right: -120, top: -40 }}><Rose size={1160} /></div>
    <div style={{ position: "absolute", left: 100, top: 120, width: 1000 }}>
      <Img src={staticFile("brand/koinonia-header.png")} style={{ height: 120, width: "auto" }} />
      <div style={{ fontFamily: serif, fontSize: 150, lineHeight: 0.98, color: C.ink, fontWeight: 500, marginTop: 50 }}>
        Every newcomer, <span style={{ fontFamily: serifItalic, fontStyle: "italic", color: C.rubric }}>heard.</span>
      </div>
      <div style={{ fontFamily: sc, fontSize: 38, color: C.rubric, marginTop: 40 }}>12 languages · a pastor approves every word</div>
    </div>
  </AbsoluteFill>
);
