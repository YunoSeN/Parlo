/**
 * Language-aware spoken text metrics and compact label utilities.
 * Prevents CJK languages (Japanese, Mandarin) from counting entire unspaced
 * sentences as a single word.
 */

const CJK_REGEX = /[\u3040-\u30ff\u3400-\u4dbf\u4e00-\u9fff\uf900-\ufaff]/g;

/**
 * Counts spoken word-like units in a learner utterance across Latin, Korean,
 * Japanese, and Mandarin scripts.
 */
export function countSpokenUnits(text: string, languageCode?: string): number {
  const trimmed = text.trim();
  if (!trimmed) return 0;

  const isCjkLang = languageCode === "ja" || languageCode === "zh";
  const cjkMatches = trimmed.match(CJK_REGEX);

  // Prefer native Intl.Segmenter word segmentation when available
  if (
    typeof Intl !== "undefined" &&
    "Segmenter" in Intl &&
    (isCjkLang || (cjkMatches && cjkMatches.length > 0))
  ) {
    try {
      const locale =
        languageCode === "ja"
          ? "ja"
          : languageCode === "zh"
          ? "zh"
          : "en";
      const segmenter = new Intl.Segmenter(locale, { granularity: "word" });
      let count = 0;
      for (const seg of segmenter.segment(trimmed)) {
        if (seg.isWordLike) {
          count += 1;
        }
      }
      if (count > 0) return count;
    } catch {
      // Fall through to deterministic regex heuristic
    }
  }

  // Deterministic fallback for runtimes without Intl.Segmenter
  if (cjkMatches && cjkMatches.length > 0) {
    const nonCjk = trimmed.replace(CJK_REGEX, " ").trim();
    const nonCjkWords = nonCjk
      ? nonCjk.split(/\s+/).filter(Boolean).length
      : 0;
    // Approximate spoken CJK words (~2 characters per word unit)
    const cjkUnits = Math.max(1, Math.round(cjkMatches.length / 2));
    return cjkUnits + nonCjkWords;
  }

  return trimmed.split(/\s+/).filter(Boolean).length;
}

/**
 * Extracts the short heading from CEFR descriptions formatted with either
 * an em-dash ("Elementary — ...") or middle dot ("Elementary · ...").
 */
export function extractCefrShortLabel(description: string): string {
  if (!description) return "";
  const [first] = description.split(/[—·]/);
  return (first ?? description).trim();
}
