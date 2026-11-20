import { AppView } from "../types";

export interface CountryFontSpec {
  code: string;
  country: string;
  city: string;
  fontName: string;
  fontFamily: string;
  fontStyle?: "normal" | "italic";
  letterSpacing?: string;
}

export const COUNTRY_FONTS: CountryFontSpec[] = [
  {
    code: "es",
    country: "Spain",
    city: "Sevilla",
    fontName: "Yeseva One",
    fontFamily: '"Yeseva One", Georgia, serif',
    fontStyle: "normal",
    letterSpacing: "0.01em",
  },
  {
    code: "fr",
    country: "France",
    city: "Paris",
    fontName: "Cormorant Garamond",
    fontFamily: '"Cormorant Garamond", Georgia, serif',
    fontStyle: "italic",
    letterSpacing: "0.02em",
  },
  {
    code: "ja",
    country: "Japan",
    city: "Kyoto",
    fontName: "Shippori Mincho",
    fontFamily: '"Shippori Mincho", Georgia, serif',
    fontStyle: "normal",
    letterSpacing: "0.03em",
  },
  {
    code: "de",
    country: "Germany",
    city: "Berlin",
    fontName: "Syne",
    fontFamily: '"Syne", sans-serif',
    fontStyle: "normal",
    letterSpacing: "-0.02em",
  },
  {
    code: "it",
    country: "Italy",
    city: "Firenze",
    fontName: "Cinzel",
    fontFamily: '"Cinzel", Georgia, serif',
    fontStyle: "normal",
    letterSpacing: "0.06em",
  },
  {
    code: "zh",
    country: "China",
    city: "Suzhou",
    fontName: "ZCOOL XiaoWei",
    fontFamily: '"ZCOOL XiaoWei", Georgia, serif',
    fontStyle: "normal",
    letterSpacing: "0.03em",
  },
  {
    code: "ko",
    country: "Korea",
    city: "Seoul",
    fontName: "Unbounded",
    fontFamily: '"Unbounded", sans-serif',
    fontStyle: "normal",
    letterSpacing: "-0.02em",
  },
  {
    code: "pt",
    country: "Portugal & Brazil",
    city: "Lisboa",
    fontName: "Fraunces",
    fontFamily: '"Fraunces", Georgia, serif',
    fontStyle: "italic",
    letterSpacing: "-0.01em",
  },
];

export function getCountryFontByCode(code: string): CountryFontSpec {
  return COUNTRY_FONTS.find((f) => f.code === code) ?? COUNTRY_FONTS[0];
}

/**
 * Picks a truly random country font (never sequentially ordered, and avoids
 * repeating the immediate previous font when possible).
 */
export function pickRandomCountryFont(excludeCode?: string): CountryFontSpec {
  const pool = excludeCode
    ? COUNTRY_FONTS.filter((f) => f.code !== excludeCode)
    : COUNTRY_FONTS;
  const idx = Math.floor(Math.random() * pool.length);
  return pool[idx] ?? COUNTRY_FONTS[0];
}

/**
 * Randomly shuffles all 8 country fonts (Fisher-Yates) and assigns a distinct
 * random country font to each of the 6 app categories on initial load.
 */
export function createInitialCategoryFonts(): Record<AppView, CountryFontSpec> {
  const shuffled = [...COUNTRY_FONTS];
  for (let i = shuffled.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [shuffled[i], shuffled[j]] = [shuffled[j], shuffled[i]];
  }
  return {
    studio: shuffled[0],
    spatial: shuffled[1],
    scenarios: shuffled[2],
    phrasebook: shuffled[3],
    review: shuffled[4],
    pricing: shuffled[5],
  };
}

/**
 * High-craft SVG tile pattern specification stored in the cultural dataset and
 * dynamically injected into CSS custom properties (`--parlo-motif-pattern-*`).
 */
export interface CulturalMotifTileSpec {
  width: number;
  height: number;
  /** Inner SVG markup rendered inside a <svg width height viewBox> mask tile */
  svgBody: string;
}

/**
 * Topologically matched SVG paths for Framer Motion `d` morphing in ParloLogo:
 * - primaryPath: M + 4 cubic Bézier segments (M ... C ... C ... C ... C ...)
 * - secondaryPath: M + 2 cubic Bézier segments (M ... C ... C ...)
 * - accentPath: M + 4 closed cubic Bézier segments (M ... C ... C ... C ... C ... Z)
 */
export interface CulturalLogoMorphSpec {
  scriptWord: string;
  motifLabel: string;
  primaryPath: string;
  secondaryPath: string;
  accentPath: string;
}

export const PARLO_BASE_LOGO_MORPH: CulturalLogoMorphSpec = {
  scriptWord: "Parlo",
  motifLabel: "Parlo Acoustic Monogram",
  primaryPath:
    "M 6.8 19.8 C 6.8 14.8 6.8 9.8 6.8 4.8 C 9.0 4.8 11.2 4.8 13.0 4.8 C 17.6 4.8 19.2 7.4 19.2 10.2 C 19.2 13.2 17.2 15.4 10.6 15.4",
  secondaryPath:
    "M 9.6 8.0 C 11.8 7.8 14.4 8.6 14.4 10.4 C 14.4 12.2 11.8 13.0 9.6 12.8",
  accentPath:
    "M 11.8 8.3 C 13.0 8.3 13.9 9.2 13.9 10.4 C 13.9 11.6 13.0 12.5 11.8 12.5 C 10.6 12.5 9.7 11.6 9.7 10.4 C 9.7 9.2 10.6 8.3 11.8 8.3 Z",
};

/**
 * Topologically matched 3-layer closed silhouette paths (viewBox 0 0 100 100)
 * used as the continuous Framer Motion morphing foundation inside CulturalMotifArt:
 * - haloPath: M + 4 C + Z (atmospheric backdrop aura)
 * - primarySilhouettePath: M + 8 C + Z (main landmark silhouette)
 * - companionSilhouettePath: M + 6 C + Z (secondary cultural emblem silhouette)
 */
export interface CulturalEmblemMorphSpec {
  haloPath: string;
  primarySilhouettePath: string;
  companionSilhouettePath: string;
}

export interface CulturalThemeSpec {
  code: string;
  themeDataAttr: string;
  atelierName: string;
  patternName: string;
  effectName: string;
  /** Cultural acoustic waveform signature displayed on the Ready-to-Speak studio stage */
  waveformName: string;
  greeting: string;
  cityLine: string;
  motifCaption: string;
  /** Authentic country landmark & cultural idiom for ambient immersion */
  landmarkTag: string;
  culturalProverb: string;
  culturalProverbMeaning: string;
  displayFontFamily: string;
  /** Light-mode Soft Ceramic pigment trio */
  primaryHex: string;
  accentHex: string;
  glowHex: string;
  /** Dark-mode Obsidian Glass luminous neon pigment trio */
  darkPrimaryHex: string;
  darkAccentHex: string;
  darkGlowHex: string;
  canvasHex: string;
  inkHex: string;
  /** Real conversational etiquette & phonetic cadence guidance per culture */
  etiquetteTitle: string;
  etiquetteBody: string;
  samplePhrase: string;
  sampleReading?: string;
  sampleMeaning: string;
  /** 9 normalized syllable-rhythm weights evoking natural spoken prosody */
  prosodyContour: number[];
  /** Architectural SVG tile mask pulled dynamically into CSS variables */
  motifTile: CulturalMotifTileSpec;
  /** Morphable Framer Motion SVG paths for ParloLogo transformation */
  logoMorph: CulturalLogoMorphSpec;
  /** Morphable 6-layer Framer Motion SVG paths for CulturalMotifArt */
  emblemMorph: CulturalEmblemMorphSpec;
}

export const CULTURAL_THEMES: Record<string, CulturalThemeSpec> = {
  es: {
    code: "es",
    themeDataAttr: "culture-es",
    atelierName: "Sevilla Sol",
    patternName: "Andalusian Azulejo",
    effectName: "Solar Cobalt Horizon",
    waveformName: "Compás Pulse",
    greeting: "¡Hola!",
    cityLine: "Madrid & Sevilla",
    motifCaption: "Azulejo rosette & courtyard warmth",
    landmarkTag: "Alhambra Courtyard · Sobremesa",
    culturalProverb: "Poco a poco se anda lejos.",
    culturalProverbMeaning: "Little by little, one walks far.",
    displayFontFamily: '"Yeseva One", Georgia, serif',
    canvasHex: "#E3E4EA",
    inkHex: "#242D3B",
    primaryHex: "#15548A",
    accentHex: "#DF4B22",
    glowHex: "#F2A922",
    darkPrimaryHex: "#F7B731",
    darkAccentHex: "#FF5E3A",
    darkGlowHex: "#3B82F6",
    etiquetteTitle: "Warm Café Directness",
    etiquetteBody:
      "In Spain, friendly direct orders like “¿Me pones…?” sound warmer and more natural than overly formal phrasing, paired with crisp, even syllable timing.",
    samplePhrase: "Cuando puedas, ¿me pones un cortado?",
    sampleMeaning: "Whenever you have a moment, could I get a cortado?",
    prosodyContour: [0.46, 0.72, 0.58, 0.88, 0.52, 0.78, 0.64, 0.92, 0.48],
    motifTile: {
      width: 52,
      height: 52,
      svgBody: `<g fill="none" stroke="#000" stroke-width="1.15" stroke-linejoin="round"><path d="M26 5L31.5 14.5L42.5 14.5L37 24L42.5 33.5L31.5 33.5L26 43L20.5 33.5L9.5 33.5L15 24L9.5 14.5L20.5 14.5Z"/><path d="M26 13L30 20L37 24L30 28L26 35L22 28L15 24L22 20Z" stroke-opacity="0.65"/><path d="M0 0L8 8M52 0L44 8M0 52L8 44M52 52L44 44" stroke-opacity="0.45"/></g>`,
    },
    logoMorph: {
      scriptWord: "Habla",
      motifLabel: "Alhambra Arch & Azulejo Star",
      primaryPath:
        "M 6.2 19.5 C 6.2 16.0 4.4 13.5 4.6 10.4 C 4.8 6.4 8.2 4.2 12.0 4.2 C 15.8 4.2 19.2 6.4 19.4 10.4 C 19.6 13.5 17.8 16.0 17.8 19.5",
      secondaryPath:
        "M 6.5 17.2 C 8.4 14.6 10.2 13.6 12.0 13.6 C 13.8 13.6 15.6 14.6 17.5 17.2",
      accentPath:
        "M 12.0 6.8 C 12.6 8.6 13.0 9.0 14.8 9.6 C 13.0 10.2 12.6 10.6 12.0 12.4 C 11.4 10.6 11.0 10.2 9.2 9.6 C 11.0 9.0 11.4 8.6 12.0 6.8 Z",
    },
    emblemMorph: {
      // Andalusian horseshoe arch aura (exact 4 C)
      haloPath:
        "M 17 85 C 17 65 17 52 17 45 C 17 26.5 31.5 14 49 14 C 66.5 14 81 26.5 81 45 C 81 52 81 65 81 85 Z",
      // 8-point Andalusian Azulejo star rosette (exact 8 C)
      primarySilhouettePath:
        "M 41 18 C 44 26 47 28 57 25 C 54 35 56 38 64 42 C 56 46 54 49 57 59 C 47 56 44 58 41 66 C 38 58 35 56 25 59 C 28 49 26 46 18 42 C 26 38 28 35 25 25 C 35 28 38 26 41 18 Z",
      // Pleated Spanish Abanico fan silhouette (exact 6 C)
      companionSilhouettePath:
        "M 39 82 C 39 68 50 57 64 57 C 78 57 89 68 89 82 C 82 82 75 82 69 82 C 66 82 62 82 59 82 C 53 82 46 82 39 82 C 39 82 39 82 39 82 Z",
    },
  },
  fr: {
    code: "fr",
    themeDataAttr: "culture-fr",
    atelierName: "Paris Rive Gauche",
    patternName: "Haussmann Filigree",
    effectName: "Cobalt Champagne Halo",
    waveformName: "Liaison Legato",
    greeting: "Bonjour",
    cityLine: "Paris & Lyon",
    motifCaption: "Haussmann ironwork & smooth liaison",
    landmarkTag: "Tour Eiffel · Café de Flore",
    culturalProverb: "Petit à petit, l’oiseau fait son nid.",
    culturalProverbMeaning: "Step by step, the bird builds its nest.",
    displayFontFamily: '"Cormorant Garamond", Georgia, serif',
    canvasHex: "#E0E4EE",
    inkHex: "#222A3A",
    primaryHex: "#263D94",
    accentHex: "#C9334B",
    glowHex: "#E0AE46",
    darkPrimaryHex: "#7C9CFF",
    darkAccentHex: "#FF5C8A",
    darkGlowHex: "#F2C96B",
    etiquetteTitle: "The Essential Bonjour",
    etiquetteBody:
      "Always open every shop or café exchange with a clear “Bonjour” before making a request, letting final phrase syllables rise gently in smooth liaison.",
    samplePhrase: "Bonjour, je prendrais un café crème, s’il vous plaît.",
    sampleMeaning: "Hello, I would like a coffee with cream, please.",
    prosodyContour: [0.42, 0.54, 0.62, 0.7, 0.58, 0.68, 0.76, 0.86, 0.96],
    motifTile: {
      width: 48,
      height: 48,
      svgBody: `<g fill="none" stroke="#000" stroke-width="1.05" stroke-linecap="round"><path d="M24 3C28 12 36 20 45 24C36 28 28 36 24 45C20 36 12 28 3 24C12 20 20 12 24 3Z"/><path d="M24 12C26.5 17 31 21.5 36 24C31 26.5 26.5 31 24 36C21.5 31 17 26.5 12 24C17 21.5 21.5 17 24 12Z" stroke-opacity="0.65"/><path d="M0 24H8M40 24H48M24 0V8M24 40V48" stroke-opacity="0.45"/></g>`,
    },
    logoMorph: {
      scriptWord: "Parle",
      motifLabel: "Tour Eiffel Spire",
      primaryPath:
        "M 5.2 19.8 C 8.2 15.4 10.2 11.2 11.0 7.4 C 11.4 5.4 11.7 4.2 12.0 3.6 C 12.3 4.2 12.6 5.4 13.0 7.4 C 13.8 11.2 15.8 15.4 18.8 19.8",
      secondaryPath:
        "M 7.8 19.4 C 8.6 16.2 10.2 15.0 12.0 15.0 C 13.8 15.0 15.4 16.2 16.2 19.4",
      accentPath:
        "M 12.0 8.6 C 12.5 10.3 12.9 10.7 14.6 11.2 C 12.9 11.7 12.5 12.1 12.0 13.8 C 11.5 12.1 11.1 11.7 9.4 11.2 C 11.1 10.7 11.5 10.3 12.0 8.6 Z",
    },
    emblemMorph: {
      // Golden-hour Parisian sun halo (exact 4 C)
      haloPath:
        "M 44 10 C 61 10 74 23 74 40 C 74 57 61 70 44 70 C 27 70 14 57 14 40 C 14 23 27 10 44 10 Z",
      // Sculpted Eiffel Tower silhouette with arched base (exact 8 C)
      primarySilhouettePath:
        "M 44 10 C 45.2 18 46.2 26 47.4 36 C 49.4 51 55.2 68 65.5 85 C 61.5 85 58.2 85 55.5 85 C 52.4 76 48.8 70.5 44 70.5 C 39.2 70.5 35.6 76 32.5 85 C 29.8 85 26.5 85 22.5 85 C 32.8 68 38.6 51 40.6 36 C 41.8 26 42.8 18 44 10 Z",
      // Warm buttery French Croissant crescent (exact 6 C)
      companionSilhouettePath:
        "M 60 72 C 61.5 60 72.5 54 83.5 59.5 C 87.5 61.5 90 66.5 87.5 71.5 C 85.5 75.2 81 74.2 79 71 C 76.5 67 70.5 66.5 67.5 71 C 65.5 74 61 75.5 60 72 C 60 72 60 72 60 72 Z",
    },
  },
  ja: {
    code: "ja",
    themeDataAttr: "culture-ja",
    atelierName: "Kyoto Washi",
    patternName: "Seigaiha Wave",
    effectName: "Sakura Vermilion Aura",
    waveformName: "Seigaiha Ripple",
    greeting: "こんにちは",
    cityLine: "Kyoto & Tokyo",
    motifCaption: "Seigaiha ripple & soft pitch-accent",
    landmarkTag: "Fushimi Torii · Kissaten Tea",
    culturalProverb: "一期一会 — Ichigo Ichie",
    culturalProverbMeaning: "Treasure every encounter as once in a lifetime.",
    displayFontFamily: '"Shippori Mincho", Georgia, serif',
    canvasHex: "#E4E3EA",
    inkHex: "#232A38",
    primaryHex: "#1B3B78",
    accentHex: "#D6362C",
    glowHex: "#F08BA5",
    darkPrimaryHex: "#FF85A1",
    darkAccentHex: "#FF4D4D",
    darkGlowHex: "#6B8CFF",
    etiquetteTitle: "Aizuchi & Soft Pitch",
    etiquetteBody:
      "Brief listening cues like “なるほど” (naruhodo) or “そうですね” show attentiveness while keeping rhythm even across morae with subtle pitch drops.",
    samplePhrase: "すみません、今日のおすすめは何ですか？",
    sampleReading: "Sumimasen, kyou no osusume wa nan desu ka?",
    sampleMeaning: "Excuse me, what is today’s recommendation?",
    prosodyContour: [0.38, 0.82, 0.82, 0.56, 0.44, 0.78, 0.74, 0.52, 0.66],
    motifTile: {
      width: 56,
      height: 32,
      svgBody: `<g fill="none" stroke="#000" stroke-width="1.1"><path d="M0 32A28 28 0 0 1 56 32M7 32A21 21 0 0 1 49 32M14 32A14 14 0 0 1 42 32M21 32A7 7 0 0 1 35 32"/><path d="M-28 16A28 28 0 0 1 28 16M-21 16A21 21 0 0 1 21 16M28 16A28 28 0 0 1 84 16M35 16A21 21 0 0 1 77 16" stroke-opacity="0.55"/></g>`,
    },
    logoMorph: {
      scriptWord: "パルロ",
      motifLabel: "Fushimi Torii Gate",
      primaryPath:
        "M 7.8 19.6 C 7.8 14.8 7.8 10.6 7.8 7.4 C 6.2 7.2 5.0 6.6 4.4 5.8 C 9.2 7.2 14.8 7.2 19.6 5.8 C 16.2 6.8 16.2 13.0 16.2 19.6",
      secondaryPath:
        "M 5.4 10.8 C 7.8 10.8 10.0 10.8 12.0 10.8 C 14.0 10.8 16.2 10.8 18.6 10.8",
      accentPath:
        "M 12.0 12.8 C 13.2 12.8 14.2 13.8 14.2 15.0 C 14.2 16.2 13.2 17.2 12.0 17.2 C 10.8 17.2 9.8 16.2 9.8 15.0 C 9.8 13.8 10.8 12.8 12.0 12.8 Z",
    },
    emblemMorph: {
      // Kyoto luminous rising sun disc (exact 4 C)
      haloPath:
        "M 50 15 C 65.5 15 78 27.5 78 43 C 78 58.5 65.5 71 50 71 C 34.5 71 22 58.5 22 43 C 22 27.5 34.5 15 50 15 Z",
      // Vermilion Fushimi Torii Gate swept kasagi & twin pillars (exact 8 C)
      primarySilhouettePath:
        "M 14 25.5 C 29 30.8 71 30.8 86 25.5 C 83.5 31.2 76 34 67.5 35 C 68.5 51 69.5 66 70.5 82 C 67.5 82 66 82 64.5 82 C 63.5 66 62.5 51 62 36 C 52 36 48 36 38 36 C 37.5 51 36.5 66 35.5 82 C 33 82 31.5 82 29.5 82 Z",
      // Sculpted Sakura blossom silhouette (exact 6 C)
      companionSilhouettePath:
        "M 78 43 C 81.5 41.5 84.5 45.5 82.5 48.5 C 86 50 85 55 81 55 C 82 59 77 60.5 75.5 56.5 C 72.5 59.5 69 56.5 71 52.5 C 68 50.5 70 46 74 47 C 73.5 43.5 75.5 42 78 43 Z",
    },
  },
  de: {
    code: "de",
    themeDataAttr: "culture-de",
    atelierName: "Berlin Bauhaus",
    patternName: "Weimar Grid",
    effectName: "Acid-Lime Studio Grid",
    waveformName: "Bauhaus Equalizer",
    greeting: "Guten Tag",
    cityLine: "Berlin & Weimar",
    motifCaption: "Weimar caliper geometry & crisp stress",
    landmarkTag: "Brandenburger Tor · Atelier",
    culturalProverb: "Übung macht den Meister.",
    culturalProverbMeaning: "Deliberate practice makes the master.",
    displayFontFamily: '"Syne", sans-serif',
    canvasHex: "#DEE5E9",
    inkHex: "#1E2832",
    primaryHex: "#0E5D75",
    accentHex: "#DF5118",
    glowHex: "#82B814",
    darkPrimaryHex: "#CCFF00",
    darkAccentHex: "#10B981",
    darkGlowHex: "#22D3EE",
    etiquetteTitle: "Clear Structure & Sie/Du",
    etiquetteBody:
      "German workplace and everyday conversations prize clarity and thoughtful pacing—anchor key verbs cleanly and use “Sie” until invited to switch to “du”.",
    samplePhrase: "Könnten wir das kurz gemeinsam abstimmen?",
    sampleMeaning: "Could we briefly align on that together?",
    prosodyContour: [0.86, 0.44, 0.62, 0.78, 0.38, 0.88, 0.52, 0.72, 0.42],
    motifTile: {
      width: 48,
      height: 48,
      svgBody: `<g fill="none" stroke="#000" stroke-width="1.15"><path d="M0 24H48M24 0V48" stroke-opacity="0.45"/><path d="M24 0A24 24 0 0 1 48 24M0 24A24 24 0 0 0 24 48"/><path d="M12 12H24V24H12Z" stroke-opacity="0.65"/><path d="M24 36L36 24" stroke-opacity="0.7"/></g>`,
    },
    logoMorph: {
      scriptWord: "Sprich",
      motifLabel: "Bauhaus Caliper Portal",
      primaryPath:
        "M 5.5 19.0 C 5.5 14.2 5.5 9.8 5.5 5.6 C 9.8 5.6 14.2 5.6 18.5 5.6 C 18.5 9.8 18.5 14.2 18.5 19.0 C 18.5 14.6 15.6 11.4 12.0 11.4",
      secondaryPath:
        "M 5.6 12.0 C 5.6 15.8 8.4 18.8 12.0 18.8 C 15.6 18.8 18.4 15.8 18.4 12.0",
      accentPath:
        "M 12.0 7.2 C 13.2 7.2 14.4 8.4 14.4 9.6 C 14.4 10.8 13.2 12.0 12.0 12.0 C 10.8 12.0 9.6 10.8 9.6 9.6 C 9.6 8.4 10.8 7.2 12.0 7.2 Z",
    },
    emblemMorph: {
      // Bauhaus geometric offset sun disc (exact 4 C)
      haloPath:
        "M 67 12 C 77.5 12 86 20.5 86 31 C 86 41.5 77.5 50 67 50 C 56.5 50 48 41.5 48 31 C 48 20.5 56.5 12 67 12 Z",
      // Brandenburg Gate monumental entablature & colonnade frame (exact 8 C)
      primarySilhouettePath:
        "M 17 31 C 39 31 61 31 83 31 C 83 35 83 38 78 40.5 C 78 53 78 65 78 77.5 C 82 77.5 86 79 86 82.5 C 62 82.5 38 82.5 14 82.5 C 14 79 18 77.5 22 77.5 C 22 65 22 53 22 40.5 C 17 38 17 35 17 31 Z",
      // Bauhaus kinetic crest crown (exact 6 C)
      companionSilhouettePath:
        "M 34 22 C 36 18 37.5 15 39 14 C 44 13 50 11 55 14 C 58 15 62 15.5 65.5 15.5 C 65.5 18 65.5 20 65.5 22 C 55 22 45 22 34 22 C 34 22 34 22 34 22 Z",
    },
  },
  it: {
    code: "it",
    themeDataAttr: "culture-it",
    atelierName: "Firenze Travertino",
    patternName: "Florentine Vault",
    effectName: "Emerald Vault Glow",
    waveformName: "Bel Canto Arc",
    greeting: "Ciao",
    cityLine: "Firenze & Milano",
    motifCaption: "Florentine arc & melodic vowel flow",
    landmarkTag: "Cupola del Duomo · Espresso al Banco",
    culturalProverb: "Chi va piano, va sano e va lontano.",
    culturalProverbMeaning: "Who speaks calmly goes far and true.",
    displayFontFamily: '"Cinzel", Georgia, serif',
    canvasHex: "#E1E6E2",
    inkHex: "#222C28",
    primaryHex: "#156347",
    accentHex: "#CC4825",
    glowHex: "#DEA036",
    darkPrimaryHex: "#34D399",
    darkAccentHex: "#FF6B4A",
    darkGlowHex: "#FBBF24",
    etiquetteTitle: "Melodic Vowel Cadence",
    etiquetteBody:
      "Give pure vowels and double consonants their full beat—phrases like “Magari!” or “Volentieri” add effortless warmth to everyday Italian.",
    samplePhrase: "Buongiorno, mi dica pure com’è la zona.",
    sampleMeaning: "Good morning, please tell me all about the neighborhood.",
    prosodyContour: [0.48, 0.9, 0.56, 0.76, 0.44, 0.84, 0.62, 0.94, 0.52],
    motifTile: {
      width: 48,
      height: 40,
      svgBody: `<g fill="none" stroke="#000" stroke-width="1.15"><path d="M3 40V20C3 9.5 12.5 3 24 3C35.5 3 45 9.5 45 20V40"/><path d="M11 40V22C11 14 16.5 9.5 24 9.5C31.5 9.5 37 14 37 22V40" stroke-opacity="0.6"/><path d="M24 3V15M3 20H11M37 20H45" stroke-opacity="0.45"/></g>`,
    },
    logoMorph: {
      scriptWord: "Parla",
      motifLabel: "Florentine Duomo Cupola",
      primaryPath:
        "M 4.6 18.6 C 4.8 12.4 7.6 6.8 12.0 4.4 C 16.4 6.8 19.2 12.4 19.4 18.6 C 16.2 18.6 14.0 18.6 12.0 18.6 C 10.0 18.6 7.8 18.6 4.6 18.6",
      secondaryPath:
        "M 8.4 18.4 C 8.8 12.8 10.2 8.2 12.0 4.8 C 13.8 8.2 15.2 12.8 15.6 18.4",
      accentPath:
        "M 12.0 11.2 C 13.2 11.2 14.2 12.2 14.2 13.4 C 14.2 14.6 13.2 15.6 12.0 15.6 C 10.8 15.6 9.8 14.6 9.8 13.4 C 9.8 12.2 10.8 11.2 12.0 11.2 Z",
    },
    emblemMorph: {
      // Florentine vault luminous halo (exact 4 C)
      haloPath:
        "M 50 10 C 66.5 10 80 23.5 80 40 C 80 56.5 66.5 70 50 70 C 33.5 70 20 56.5 20 40 C 20 23.5 33.5 10 50 10 Z",
      // Brunelleschi Duomo Cupola Renaissance dome silhouette (exact 8 C)
      primarySilhouettePath:
        "M 50 21 C 61 21 71 29 76 41 C 78 46 79 50 79 53 C 79 57 79 61 79 65 C 68 65 59 65 50 65 C 41 65 32 65 21 65 C 21 61 21 57 21 53 C 21 50 22 46 24 41 C 29 29 39 21 50 21 Z",
      // Faceted Italian Moka Espresso Pot silhouette (exact 6 C)
      companionSilhouettePath:
        "M 37 51 C 45 51 55 51 63 51 C 61 56 60 61 58.5 67 C 60 72 61.5 77 63 83 C 54 83 46 83 37 83 C 38.5 77 40 72 41.5 67 C 40 61 38.5 56 37 51 Z",
    },
  },
  zh: {
    code: "zh",
    themeDataAttr: "culture-zh",
    atelierName: "Suzhou Ink",
    patternName: "Suzhou Lattice",
    effectName: "Jade Cinnabar Sphere",
    waveformName: "Tonal Contour",
    greeting: "你好",
    cityLine: "Beijing & Suzhou",
    motifCaption: "Suzhou lattice & four-tone pitch curve",
    landmarkTag: "Suzhou Garden · Tea Pavilion",
    culturalProverb: "千里之行，始于足下。",
    culturalProverbMeaning: "A journey of a thousand miles begins with one step.",
    displayFontFamily: '"ZCOOL XiaoWei", Georgia, serif',
    canvasHex: "#E3E5E3",
    inkHex: "#232B2A",
    primaryHex: "#0F6659",
    accentHex: "#CE2E2B",
    glowHex: "#E8A235",
    darkPrimaryHex: "#2DD4BF",
    darkAccentHex: "#FF5252",
    darkGlowHex: "#F5B041",
    etiquetteTitle: "Tonal Contour Clarity",
    etiquetteBody:
      "Focus on clean tone shapes rather than speed—softening requests with “请问” (qǐngwèn) and “一下” (yíxià) immediately sounds natural and courteous.",
    samplePhrase: "请问，可以帮我看一下这个吗？",
    sampleReading: "Qǐngwèn, kěyǐ bāng wǒ kàn yíxià zhège ma?",
    sampleMeaning: "Excuse me, could you take a quick look at this for me?",
    prosodyContour: [0.54, 0.86, 0.34, 0.74, 0.92, 0.42, 0.78, 0.62, 0.5],
    motifTile: {
      width: 48,
      height: 48,
      svgBody: `<g fill="none" stroke="#000" stroke-width="1.15" stroke-linecap="square"><path d="M5 5H43V43H5ZM15 15H33V33H15Z"/><path d="M5 24H15M33 24H43M24 5V15M24 33V43" stroke-opacity="0.6"/><path d="M19 19H29V29H19Z" stroke-opacity="0.5"/></g>`,
    },
    logoMorph: {
      scriptWord: "帕洛",
      motifLabel: "Suzhou Silk Lantern",
      primaryPath:
        "M 12.0 4.4 C 16.8 4.4 19.4 7.6 19.4 12.0 C 19.4 16.4 16.8 19.6 12.0 19.6 C 7.2 19.6 4.6 16.4 4.6 12.0 C 4.6 7.6 7.2 4.4 12.0 4.4",
      secondaryPath:
        "M 12.0 4.8 C 15.2 7.6 15.2 16.4 12.0 19.2 C 8.8 16.4 8.8 7.6 12.0 4.8",
      accentPath:
        "M 12.0 9.4 C 13.0 10.4 13.6 11.0 14.6 12.0 C 13.6 13.0 13.0 13.6 12.0 14.6 C 11.0 13.6 10.4 13.0 9.4 12.0 C 10.4 11.0 11.0 10.4 12.0 9.4 Z",
    },
    emblemMorph: {
      // Warm Suzhou lantern radiance halo (exact 4 C)
      haloPath:
        "M 44 15 C 60.5 15 74 28.5 74 45 C 74 61.5 60.5 75 44 75 C 27.5 75 14 61.5 14 45 C 14 28.5 27.5 15 44 15 Z",
      // Sculpted Suzhou Silk Lantern oval body (exact 8 C)
      primarySilhouettePath:
        "M 36 25.5 C 41 25.5 47 25.5 52 25.5 C 60 27.5 65 35 65 45 C 65 55 60 62.5 52 64.5 C 47 64.5 41 64.5 36 64.5 C 28 62.5 23 55 23 45 C 23 35 28 27.5 36 25.5 C 36 25.5 36 25.5 36 25.5 C 36 25.5 36 25.5 36 25.5 Z",
      // Cinnabar Calligraphy Chop Seal block (exact 6 C)
      companionSilhouettePath:
        "M 69 63 C 75 63 80 63 85 63 C 87 63 88 64.5 88 67.5 C 88 72.5 88 77.5 88 82.5 C 88 84.5 86.5 85 83.5 85 C 77.5 85 72.5 85 69 85 C 66.5 85 66 83 66 74 Z",
    },
  },
  ko: {
    code: "ko",
    themeDataAttr: "culture-ko",
    atelierName: "Seoul Hanok",
    patternName: "Hanok Changhoji",
    effectName: "Celadon Prism Field",
    waveformName: "Taegeuk Phase",
    greeting: "안녕하세요",
    cityLine: "Seoul, Bukchon",
    motifCaption: "Changhoji grid & dual-phase cadence",
    landmarkTag: "Bukchon Hanok · Tea Courtyard",
    culturalProverb: "시작이 반이다.",
    culturalProverbMeaning: "Well begun is already half done.",
    displayFontFamily: '"Unbounded", sans-serif',
    canvasHex: "#DFE6EA",
    inkHex: "#202B34",
    primaryHex: "#16687A",
    accentHex: "#D94436",
    glowHex: "#5550A6",
    darkPrimaryHex: "#38BDF8",
    darkAccentHex: "#FB7185",
    darkGlowHex: "#A78BFA",
    etiquetteTitle: "Polite -요 Flow & Softeners",
    etiquetteBody:
      "Ending sentences in polite “-아요/어요” with gentle openers like “혹시” (by any chance) keeps everyday Seoul conversations respectful and relaxed.",
    samplePhrase: "혹시 여기서 제일 인기 있는 메뉴가 뭐예요?",
    sampleReading: "Hoksi yeogiseo jeil ingi inneun menyuga mwoyeyo?",
    sampleMeaning: "By any chance, what is the most popular dish here?",
    prosodyContour: [0.5, 0.66, 0.58, 0.78, 0.62, 0.84, 0.56, 0.72, 0.88],
    motifTile: {
      width: 44,
      height: 44,
      svgBody: `<g fill="none" stroke="#000" stroke-width="1.05"><path d="M0 22H44M22 0V44" stroke-opacity="0.45"/><path d="M22 6L38 22L22 38L6 22Z"/><path d="M14 14H30V30H14Z" stroke-opacity="0.55"/><path d="M16 22C18 19 20 19 22 22C24 25 26 25 28 22" stroke-opacity="0.8"/></g>`,
    },
    logoMorph: {
      scriptWord: "파를로",
      motifLabel: "Bukchon Hanok & Taegeuk",
      primaryPath:
        "M 4.2 12.2 C 7.6 11.8 10.2 9.4 12.0 5.6 C 13.8 9.4 16.4 11.8 19.8 12.2 C 17.6 14.8 17.2 16.8 17.2 19.2 C 14.6 19.2 9.4 19.2 6.8 19.2",
      secondaryPath:
        "M 7.0 15.4 C 8.6 13.4 10.4 13.4 12.0 15.4 C 13.6 17.4 15.4 17.4 17.0 15.4",
      accentPath:
        "M 12.0 9.2 C 13.1 9.2 14.0 10.1 14.0 11.2 C 14.0 12.3 13.1 13.2 12.0 13.2 C 10.9 13.2 10.0 12.3 10.0 11.2 C 10.0 10.1 10.9 9.2 12.0 9.2 Z",
    },
    emblemMorph: {
      // Celestial Taegeuk halo behind Bukchon Hanok (exact 4 C)
      haloPath:
        "M 50 16 C 60 16 68 24 68 34 C 68 44 60 52 50 52 C 40 52 32 44 32 34 C 32 24 40 16 50 16 Z",
      // Bukchon Hanok sweeping Giwa curved roof silhouette (exact 8 C)
      primarySilhouettePath:
        "M 11 49 C 27 47.5 39 39.5 50 28 C 61 39.5 73 47.5 89 49 C 87 51.5 85 53.5 83 56 C 69 55 58 51.5 50 45.5 C 42 51.5 31 55 17 56 C 15 53.5 13 51.5 11 49 C 11 49 11 49 11 49 C 11 49 11 49 11 49 Z",
      // Harmonic Taegeuk swirling crescent emblem (exact 6 C)
      companionSilhouettePath:
        "M 32 34 C 32 24 40 16 50 16 C 60 16 68 24 68 34 C 62.5 27.5 55.5 27.5 50 34 C 44.5 40.5 37.5 40.5 32 34 C 32 34 32 34 32 34 C 32 34 32 34 32 34 Z",
    },
  },
  pt: {
    code: "pt",
    themeDataAttr: "culture-pt",
    atelierName: "Lisboa Azulejo",
    patternName: "Lisboa Quatrefoil",
    effectName: "Atlantic Azure Glow",
    waveformName: "Atlantic Swell",
    greeting: "Olá",
    cityLine: "Lisboa & São Paulo",
    motifCaption: "Cobalt azulejo & rolling Atlantic swell",
    landmarkTag: "Elétrico 28 · Alfama Miradouro",
    culturalProverb: "Devagar se vai ao longe.",
    culturalProverbMeaning: "Unhurried rhythm carries you farthest.",
    displayFontFamily: '"Fraunces", Georgia, serif',
    canvasHex: "#DFE5EE",
    inkHex: "#202B3C",
    primaryHex: "#1650A8",
    accentHex: "#D6800C",
    glowHex: "#2B93B8",
    darkPrimaryHex: "#60A5FA",
    darkAccentHex: "#FBBF24",
    darkGlowHex: "#22D3EE",
    etiquetteTitle: "Expressive Warmth & Rhythm",
    etiquetteBody:
      "Phrases like “Tudo bem?” and diminutives like “um cafezinho” soften requests and invite genuine rapport across Lisbon and Brazil alike.",
    samplePhrase: "Olá, tudo bem? Queria um cafezinho, por favor.",
    sampleMeaning: "Hello, all good? I’d love a small coffee, please.",
    prosodyContour: [0.52, 0.76, 0.46, 0.88, 0.64, 0.72, 0.84, 0.58, 0.7],
    motifTile: {
      width: 50,
      height: 50,
      svgBody: `<g fill="none" stroke="#000" stroke-width="1.15" stroke-linejoin="round"><path d="M25 4C30 12 38 20 46 25C38 30 30 38 25 46C20 38 12 30 4 25C12 20 20 12 25 4Z"/><path d="M25 14L36 25L25 36L14 25Z" stroke-opacity="0.65"/><path d="M0 0A12 12 0 0 0 12 12M50 0A12 12 0 0 1 38 12M0 50A12 12 0 0 1 12 38M50 50A12 12 0 0 0 38 38" stroke-opacity="0.45"/></g>`,
    },
    logoMorph: {
      scriptWord: "Fala",
      motifLabel: "Lisboa Azulejo Star",
      primaryPath:
        "M 12.0 3.8 C 14.0 7.8 16.2 10.0 20.2 12.0 C 16.2 14.0 14.0 16.2 12.0 20.2 C 10.0 16.2 7.8 14.0 3.8 12.0 C 7.8 10.0 10.0 7.8 12.0 3.8",
      secondaryPath:
        "M 6.4 12.6 C 8.2 10.6 10.2 10.6 12.0 12.6 C 13.8 14.6 15.8 14.6 17.6 12.6",
      accentPath:
        "M 12.0 9.5 C 12.8 11.0 13.0 11.2 14.5 12.0 C 13.0 12.8 12.8 13.0 12.0 14.5 C 11.2 13.0 11.0 12.8 9.5 12.0 C 11.0 11.2 11.2 11.0 12.0 9.5 Z",
    },
    emblemMorph: {
      // Atlantic soft radiant halo (exact 4 C)
      haloPath:
        "M 47 22 C 63 22 76 35 76 51 C 76 67 63 80 47 80 C 31 80 18 67 18 51 C 18 35 31 22 47 22 Z",
      // Lisbon Tram 28 iconic streetcar chassis (exact 8 C)
      primarySilhouettePath:
        "M 25.5 45.5 C 38 45.5 56 45.5 68.5 45.5 C 71 45.5 73 47.5 73 50 C 73 58 73 65 73 72 C 73 74.5 71 76.5 68.5 76.5 C 56 76.5 38 76.5 25.5 76.5 C 23 76.5 21 74.5 21 72 C 21 65 21 58 21 50 C 21 47.5 23 45.5 25.5 45.5 Z",
      // Cobalt Lisboa Azulejo ceramic tile square (exact 6 C)
      companionSilhouettePath:
        "M 70 14 C 75 14 81 14 86 14 C 88 14 89 15 89 17.5 C 89 22.5 89 27.5 89 32.5 C 89 35 88 36 86 36 C 81 36 75 36 70 36 C 68 36 67 34.5 67 25 Z",
    },
  },
};

export function getCultureByLanguage(code: string): CulturalThemeSpec {
  return CULTURAL_THEMES[code] ?? CULTURAL_THEMES.es;
}

const motifUriCache = new Map<string, string>();

/**
 * Dynamically builds an encoded CSS `url("data:image/svg+xml,...")` mask URI
 * from a culture's dataset `motifTile` specification.
 */
export function buildMotifTileDataUri(code: string): string {
  const cached = motifUriCache.get(code);
  if (cached) return cached;

  const { motifTile } = getCultureByLanguage(code);
  const rawSvg = `<svg xmlns="http://www.w3.org/2000/svg" width="${motifTile.width}" height="${motifTile.height}" viewBox="0 0 ${motifTile.width} ${motifTile.height}">${motifTile.svgBody}</svg>`;
  const uri = `url("data:image/svg+xml,${encodeURIComponent(rawSvg)}")`;
  motifUriCache.set(code, uri);
  return uri;
}

let allMotifsRegistered = false;

/**
 * Dynamically populates `:root` CSS custom properties for the motif system
 * directly from `CULTURAL_THEMES`, eliminating hardcoded SVGs in `index.css`.
 */
export function syncCulturalMotifCssVariables(
  root: HTMLElement,
  activeCode: string
): void {
  if (!allMotifsRegistered) {
    for (const [code, spec] of Object.entries(CULTURAL_THEMES)) {
      root.style.setProperty(
        `--parlo-motif-pattern-${code}`,
        buildMotifTileDataUri(code)
      );
      root.style.setProperty(
        `--parlo-motif-size-${code}`,
        `${spec.motifTile.width}px ${spec.motifTile.height}px`
      );
    }
    allMotifsRegistered = true;
  }

  const active = getCultureByLanguage(activeCode);
  root.style.setProperty(
    "--parlo-motif-pattern",
    buildMotifTileDataUri(active.code)
  );
  root.style.setProperty(
    "--parlo-motif-size",
    `${active.motifTile.width}px ${active.motifTile.height}px`
  );
}
