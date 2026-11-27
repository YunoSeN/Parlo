/**
 * Modality-Aware & Homophone-Aware ASR / Dialect Filtering Rules (PoC)
 *
 * Key design principle:
 *   - NEVER blindly drop 1-char or diacritic-only diffs!
 *   - In `typed_text`: Spanish `si`/`sí`, French `a`/`à`, `ou`/`où`, `esta`/`está`
 *     are genuine learner grammar/orthography errors and MUST be preserved.
 *   - In `asr_transcript`: speech recognition cannot reliably distinguish silent
 *     orthographic homophones (`a`/`à`, `et`/`est`, `ces`/`ses`, `a`/`ha`).
 *     Those are classified as `asr_ambiguous` (never persisted as learner errors),
 *     whereas AUDIBLE 1-char grammar errors (`mucha calor` -> `mucho calor`,
 *     `un table` -> `une table`, `der Buch` -> `das Buch`) are PRESERVED!
 */

import { InputModality } from "./types.ts";

export type FilterDecision =
  | { eligible: true; reason: "valid_observation" }
  | {
      eligible: false;
      reason:
        | "punctuation_or_casing_only"
        | "fragment_or_truncated_asr"
        | "asr_homophone_ambiguous"
        | "dialect_valid_expression"
        | "scaffolded_chip_input";
      detail: string;
    };

/**
 * Curated per-language sets of true spoken homophones where ASR frequently
 * emits the wrong orthographic form even when the learner spoke correctly.
 *
 * Note: Audible minimal pairs (e.g. Spanish `mucho`/`mucha`, French `un`/`une`,
 * Spanish `esta` vs `está` stress difference) are intentionally NOT in these sets.
 */
export const SPOKEN_HOMOPHONE_SETS: Record<string, string[][]> = {
  es: [
    ["a", "ha"],
    ["si", "sí"],
    ["tu", "tú"],
    ["el", "él"],
    ["mi", "mí"],
    ["de", "dé"],
    ["se", "sé"],
    ["mas", "más"],
    ["te", "té"],
    ["haya", "halla", "allá"],
    ["echo", "hecho"],
    ["vaya", "valla"],
    ["has", "as"],
    ["ves", "vez"],
    ["tubo", "tuvo"],
  ],
  fr: [
    ["a", "à", "as"],
    ["ou", "où"],
    ["et", "est", "es"],
    ["ces", "ses", "c'est", "s'est"],
    ["son", "sont"],
    ["on", "ont"],
    ["ce", "se"],
    ["la", "là", "l'a"],
    ["mes", "mais", "met", "mets"],
    ["peu", "peut", "peux"],
    ["verre", "vers", "vert"],
    ["ça", "sa"],
    ["tout", "tous"],
  ],
  it: [
    ["e", "è"],
    ["a", "ha"],
    ["o", "ho"],
    ["ai", "hai"],
    ["anno", "hanno"],
    ["la", "là"],
    ["li", "lì"],
    ["si", "sì"],
    ["da", "dà", "da'"],
  ],
  de: [
    ["das", "dass"],
    ["seid", "seit"],
    ["wieder", "wider"],
    ["man", "mann"],
    ["viel", "fiel"],
    ["mehr", "meer"],
  ],
  pt: [
    ["a", "à", "há"],
    ["mais", "mas"],
    ["por", "pôr"],
    ["pode", "pôde"],
    ["mau", "mal"],
  ],
};

/**
 * Regional dialect expressions accepted as natural in their respective dialect.
 * Guards against AI coaching models with Castilian/Parisian/Tokyo standard bias
 * penalizing valid regional variants.
 */
export const DIALECT_ACCEPTED_PATTERNS: Record<string, RegExp[]> = {
  "es-cdmx": [
    /\bahorita\b/i,
    /\bme regalas\b/i,
    /\bcafecito\b/i,
    /\bporfa\b/i,
    /\bqu[eé] onda\b/i,
    /\bplaticar\b/i,
  ],
  "es-madrid": [/\bvale\b/i, /\bme pones\b/i, /\bvosotros\b/i, /\bplanazo\b/i],
  "fr-montreal": [
    /\bben correct\b/i,
    /\bbienvenue\b/i,
    /\bun p['’]tit\b/i,
    /\bbonne journ[eé]e l[aà]\b/i,
    /\bjaser\b/i,
  ],
  "fr-paris": [/\bdu coup\b/i, /\bcarr[eé]ment\b/i, /\bchouette\b/i],
  "ja-kansai": [/おおきに/, /めっちゃ/, /やねん/, /ほんま/],
  "de-vienna": [/\bgr[uü][sß] gott\b/i, /\bmelange\b/i, /\bpasst eh\b/i, /\bschmankerl\b/i],
  "pt-saopaulo": [/\bpode deixar\b/i, /\bimagina\b/i, /\btudo certinho\b/i, /\bcafezinho\b/i],
  "pt-lisbon": [/\buma bica\b/i, /\bfixe\b/i, /\bse faz favor\b/i],
};

const CJK_LANGS = new Set(["ja", "zh", "ko"]);

/**
 * Tokenizes a sentence preserving diacritics and contractions while stripping
 * surrounding punctuation.
 */
export function normalizeContentTokens(text: string): string[] {
  const cleaned = text
    .toLowerCase()
    .replace(/[.,!?;:()[\]"«»„“”¿¡。、！？]/g, " ")
    .replace(/\s+/g, " ")
    .trim();
  if (!cleaned) return [];
  return cleaned.split(" ").filter(Boolean);
}

/**
 * Checks whether two single words belong to the exact same spoken homophone set
 * for the given language.
 */
export function areSpokenHomophones(
  languageCode: string,
  wordA: string,
  wordB: string
): boolean {
  const a = wordA.toLowerCase();
  const b = wordB.toLowerCase();
  if (a === b) return true;

  const sets = SPOKEN_HOMOPHONE_SETS[languageCode];
  if (!sets) return false;
  return sets.some((group) => group.includes(a) && group.includes(b));
}

/**
 * Detects whether the learner utterance uses an accepted regional expression
 * for the active dialect AND the AI attempted to rewrite it away.
 */
export function isDialectVariantFalseCorrection(
  dialectId: string,
  original: string,
  corrected: string
): boolean {
  const patterns = DIALECT_ACCEPTED_PATTERNS[dialectId];
  if (!patterns || patterns.length === 0) return false;

  for (const rx of patterns) {
    if (rx.test(original) && !rx.test(corrected)) {
      return true;
    }
  }
  return false;
}

/**
 * Evaluates whether a coaching observation is eligible to create/update a
 * persistent learning pattern.
 */
export function evaluateObservationEligibility(params: {
  languageCode: string;
  dialectId: string;
  inputModality: InputModality;
  turnOrigin: "free_speech" | "free_typed" | "scaffolded_chip";
  original: string;
  corrected: string;
}): FilterDecision {
  const {
    languageCode,
    dialectId,
    inputModality,
    turnOrigin,
    original,
    corrected,
  } = params;

  if (turnOrigin === "scaffolded_chip") {
    return {
      eligible: false,
      reason: "scaffolded_chip_input",
      detail: "Pre-written chip clicks are excluded from learner error tracking.",
    };
  }

  const origTrimmed = original.trim();
  const corrTrimmed = corrected.trim();

  // 1. Truncated / ultra-short ASR fragments (applies only to ASR voice)
  if (inputModality === "asr_transcript") {
    if (/[…-]$|\.\.\.$/.test(origTrimmed)) {
      return {
        eligible: false,
        reason: "fragment_or_truncated_asr",
        detail: "Utterance ends in an ASR truncation marker.",
      };
    }

    const strippedLen = origTrimmed.replace(/[\s.,!?;:¿¡。、！？]/g, "").length;
    if (CJK_LANGS.has(languageCode)) {
      if (strippedLen < 3) {
        return {
          eligible: false,
          reason: "fragment_or_truncated_asr",
          detail: "CJK ASR fragment shorter than 3 characters.",
        };
      }
    } else {
      const words = normalizeContentTokens(origTrimmed);
      if (words.length < 2 || strippedLen < 6) {
        return {
          eligible: false,
          reason: "fragment_or_truncated_asr",
          detail: "Spoken ASR fragment shorter than 2 words / 6 characters.",
        };
      }
    }
  }

  // 2. Pure punctuation / whitespace / capitalization diffs (both modalities)
  const origTokens = normalizeContentTokens(origTrimmed);
  const corrTokens = normalizeContentTokens(corrTrimmed);

  if (
    origTokens.length === corrTokens.length &&
    origTokens.every((tok, idx) => tok === corrTokens[idx])
  ) {
    return {
      eligible: false,
      reason: "punctuation_or_casing_only",
      detail: "Difference is limited to punctuation, spacing, or capitalization.",
    };
  }

  // 3. Dialect-variant guard (both modalities — don't penalize valid regional forms)
  if (isDialectVariantFalseCorrection(dialectId, origTrimmed, corrTrimmed)) {
    return {
      eligible: false,
      reason: "dialect_valid_expression",
      detail: `Original uses an accepted regional expression for ${dialectId}.`,
    };
  }

  // 4. Modality-specific ASR homophone ambiguity check:
  //    ONLY applies to `asr_transcript`. Typed text preserves `si`/`sí`, `a`/`à`, etc.!
  if (
    inputModality === "asr_transcript" &&
    origTokens.length === corrTokens.length &&
    origTokens.length > 0
  ) {
    const diffs: Array<{ orig: string; corr: string }> = [];
    for (let i = 0; i < origTokens.length; i++) {
      if (origTokens[i] !== corrTokens[i]) {
        diffs.push({ orig: origTokens[i], corr: corrTokens[i] });
      }
    }

    if (
      diffs.length > 0 &&
      diffs.every((d) => areSpokenHomophones(languageCode, d.orig, d.corr))
    ) {
      return {
        eligible: false,
        reason: "asr_homophone_ambiguous",
        detail: `Spoken ASR diff (${diffs
          .map((d) => `${d.orig}→${d.corr}`)
          .join(", ")}) consists solely of spoken homophones; cannot attribute to learner error.`,
      };
    }
  }

  return { eligible: true, reason: "valid_observation" };
}
