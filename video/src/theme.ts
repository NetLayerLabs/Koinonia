import { loadFont as loadSerif } from "@remotion/google-fonts/Alegreya";
import { loadFont as loadSans } from "@remotion/google-fonts/AlegreyaSans";
import { loadFont as loadSC } from "@remotion/google-fonts/AlegreyaSansSC";
import { loadFont as loadMono } from "@remotion/google-fonts/IBMPlexMono";

/** Koinonia's families (DESIGN.md, "the missal"): Alegreya for display, Alegreya Sans for text, small caps for rubrics. */
export const serif = loadSerif("normal", { weights: ["400", "500", "700"], subsets: ["latin", "latin-ext"] }).fontFamily;
export const serifItalic = loadSerif("italic", { weights: ["400", "500"], subsets: ["latin", "latin-ext"] }).fontFamily;
export const sans = loadSans("normal", { weights: ["400", "500", "700"], subsets: ["latin", "latin-ext"] }).fontFamily;
export const sc = loadSC("normal", { weights: ["500", "700"], subsets: ["latin"] }).fontFamily;
export const mono = loadMono("normal", { weights: ["400", "500"], subsets: ["latin"] }).fontFamily;

/** Koinonia's colour tokens (src/index.css): two inks on paper, gold for illumination, the nave for dark. */
export const C = {
  paper: "#f4eee2",
  vellum: "#fbf8f1",
  parchment: "#ede4d3",
  rule: "#d9cdb8",
  ink: "#1c1915",
  ink2: "#4a433a",
  ink3: "#7f7566",
  rubric: "#a5301e",
  rubricDeep: "#7e2216",
  rubricWash: "#f3dfd6",
  rubricLight: "#e0735c", // the rubric, lifted to read on the dark nave
  gold: "#a67a28",
  goldLight: "#d9ae5c",
  goldWash: "#f1e5c8",
  vine: "#2d5a44",
  vineWash: "#dde8de",
  alarm: "#c4170c",
  nave: "#1e1a16",
  nave2: "#2b2520",
  nave3: "#3b332b",
  // names the shared ui/ components use
  bg: "#1e1a16",
  night: "#1e1a16",
  faint: "#8f877a",
  teal: "#a5301e",
  signal: "#a5301e",
};

/** The twelve pew languages, as the landing page's rose window shows them (in their own script). */
export const LANGS = [
  { code: "en", mark: "En" }, { code: "it", mark: "It" }, { code: "ar", mark: "ع" }, { code: "zh", mark: "中" },
  { code: "es", mark: "Es" }, { code: "ko", mark: "한" }, { code: "fr", mark: "Fr" }, { code: "uk", mark: "Ук" },
  { code: "sw", mark: "Sw" }, { code: "vi", mark: "Vi" }, { code: "pt", mark: "Pt" }, { code: "pl", mark: "Pl" },
] as const;
