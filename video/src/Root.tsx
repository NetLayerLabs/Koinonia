import React from "react";
import { Composition } from "remotion";
import { Film } from "./Film";
import { Poster } from "./Poster";
import { ThumbA, ThumbB, ThumbC } from "./Thumbs";
import { T } from "./timing";

export const Root: React.FC = () => (
  <>
    <Composition id="Koinonia" component={Film} durationInFrames={T.totalFrames} fps={T.fps} width={1920} height={1080} />
    <Composition id="Poster" component={Poster} durationInFrames={1} fps={30} width={1920} height={1080} />
    <Composition id="ThumbA" component={ThumbA} durationInFrames={1} fps={30} width={1920} height={1080} />
    <Composition id="ThumbB" component={ThumbB} durationInFrames={1} fps={30} width={1920} height={1080} />
    <Composition id="ThumbC" component={ThumbC} durationInFrames={1} fps={30} width={1920} height={1080} />
  </>
);
