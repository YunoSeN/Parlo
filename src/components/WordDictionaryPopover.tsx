import { useEffect, useMemo, useRef, useState } from "react";
import { AnimatePresence, motion } from "motion/react";
import {
  BookmarkCheck,
  BookmarkPlus,
  BookOpen,
  RefreshCw,
  Volume2,
  X,
} from "lucide-react";
import { fetchWordLookup } from "../lib/api";
import { speakWithBrowserTts } from "../lib/audio";
import { playClickSfx, playSuccessSfx } from "../lib/sfx";
import { LanguageOption, WordLookupResult } from "../types";

export interface SelectedWordAnchor {
  word: string;
  sentence: string;
  rect: {
    top: number;
    left: number;
    bottom: number;
    width: number;
  };
}

interface TextSegment {
  text: string;
  clickable: boolean;
}

/**
 * Tokenizes Latin/accented words cleanly and splits CJK sentences into
 * short 2-3 character tap targets (or natural script boundaries) so learners
 * can click any word in Spanish, French, Japanese, Chinese, Korean, etc.
 */
function tokenizeTranscript(text: string): TextSegment[] {
  const segments: TextSegment[] = [];
  // Match CJK ideographs / kana runs, Latin/Cyrillic/Hangul words with apostrophes/hyphens, or punctuation/spaces
  const regex =
    /([\u4e00-\u9fff]+|[\u3040-\u309f]+|[\u30a0-\u30ff]+|[A-Za-zÀ-ÖØ-öø-ÿĀ-ž\uAC00-\uD7AF]+(?:['’-][A-Za-zÀ-ÖØ-öø-ÿĀ-ž\uAC00-\uD7AF]+)*|[^A-Za-zÀ-ÖØ-öø-ÿĀ-ž\uAC00-\uD7AF\u3040-\u30ff\u4e00-\u9fff]+)/g;
  let match: RegExpExecArray | null;
  while ((match = regex.exec(text)) !== null) {
    const token = match[0];
    const isWord =
      /[A-Za-zÀ-ÖØ-öø-ÿĀ-ž\uAC00-\uD7AF\u3040-\u30ff\u4e00-\u9fff]/.test(token);
    if (!isWord) {
      segments.push({ text: token, clickable: false });
      continue;
    }

    // If a pure CJK run is longer than 4 chars, break into comfortable 2-char study chunks
    const isCjkRun = /^[\u4e00-\u9fff\u3040-\u30ff]+$/.test(token);
    if (isCjkRun && token.length > 4) {
      for (let i = 0; i < token.length; i += 2) {
        segments.push({ text: token.slice(i, i + 2), clickable: true });
      }
    } else {
      segments.push({ text: token, clickable: true });
    }
  }
  return segments;
}

interface ClickableTranscriptTextProps {
  text: string;
  activeWord?: string | null;
  onSelectWord: (anchor: SelectedWordAnchor) => void;
}

export function ClickableTranscriptText({
  text,
  activeWord,
  onSelectWord,
}: ClickableTranscriptTextProps) {
  const segments = useMemo(() => tokenizeTranscript(text), [text]);

  return (
    <>
      {segments.map((seg, idx) => {
        if (!seg.clickable) {
          return <span key={idx}>{seg.text}</span>;
        }
        const isActive =
          activeWord != null &&
          activeWord.toLowerCase() === seg.text.toLowerCase();
        return (
          <button
            key={idx}
            type="button"
            onClick={(e) => {
              e.stopPropagation();
              playClickSfx();
              const r = e.currentTarget.getBoundingClientRect();
              onSelectWord({
                word: seg.text,
                sentence: text,
                rect: {
                  top: r.top,
                  left: r.left,
                  bottom: r.bottom,
                  width: r.width,
                },
              });
            }}
            title="Click for instant cultural breakdown"
            className={`inline text-left rounded-[3px] transition-colors cursor-pointer decoration-dotted underline-offset-[3px] hover:underline hover:bg-[var(--parlo-primary)]/14 hover:text-[var(--parlo-ink)] focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-[var(--parlo-primary)] ${
              isActive
                ? "bg-[var(--parlo-primary)]/20 underline decoration-solid text-[var(--parlo-ink)]"
                : ""
            }`}
          >
            {seg.text}
          </button>
        );
      })}
    </>
  );
}

interface WordDictionaryPopoverProps {
  anchor: SelectedWordAnchor | null;
  language: LanguageOption;
  dialectLabel?: string;
  scenarioTitle: string;
  savedPhraseStrings: Set<string>;
  onClose: () => void;
  onSavePhrase: (params: {
    phrase: string;
    translation: string;
    reading?: string;
    languageCode: string;
    scenarioTitle: string;
    note?: string;
  }) => void;
}

export function WordDictionaryPopover({
  anchor,
  language,
  dialectLabel,
  scenarioTitle,
  savedPhraseStrings,
  onClose,
  onSavePhrase,
}: WordDictionaryPopoverProps) {
  const popoverRef = useRef<HTMLDivElement | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [result, setResult] = useState<WordLookupResult | null>(null);
  const [retrySeed, setRetrySeed] = useState(0);

  // Fetch cultural breakdown whenever anchor changes
  useEffect(() => {
    if (!anchor) return;
    let cancelled = false;
    setLoading(true);
    setError(null);
    setResult(null);

    fetchWordLookup({
      word: anchor.word,
      sentence: anchor.sentence,
      languageName: language.name,
      languageCode: language.code,
      dialectLabel,
    })
      .then((data) => {
        if (!cancelled) {
          setResult(data);
          setLoading(false);
        }
      })
      .catch((err) => {
        if (!cancelled) {
          setError(
            err instanceof Error
              ? err.message
              : "Could not look up this word right now."
          );
          setLoading(false);
        }
      });

    return () => {
      cancelled = true;
    };
  }, [anchor, dialectLabel, language.code, language.name, retrySeed]);

  // Dismiss on Esc or click outside
  useEffect(() => {
    if (!anchor) return;
    const onKeyDown = (e: KeyboardEvent) => {
      if (e.key === "Escape") onClose();
    };
    const onMouseDown = (e: MouseEvent) => {
      if (
        popoverRef.current &&
        !popoverRef.current.contains(e.target as Node)
      ) {
        onClose();
      }
    };
    window.addEventListener("keydown", onKeyDown);
    window.addEventListener("mousedown", onMouseDown);
    return () => {
      window.removeEventListener("keydown", onKeyDown);
      window.removeEventListener("mousedown", onMouseDown);
    };
  }, [anchor, onClose]);

  const coords = useMemo(() => {
    if (!anchor || typeof window === "undefined") {
      return { top: 80, left: 16 };
    }
    const cardW = Math.min(340, window.innerWidth - 24);
    const estH = 265;
    let left = anchor.rect.left + anchor.rect.width / 2 - cardW / 2;
    left = Math.max(12, Math.min(left, window.innerWidth - cardW - 12));

    const spaceBelow = window.innerHeight - anchor.rect.bottom;
    let top =
      spaceBelow >= estH + 16
        ? anchor.rect.bottom + 10
        : Math.max(16, anchor.rect.top - estH - 10);
    top = Math.min(top, Math.max(16, window.innerHeight - estH - 12));
    return { top, left, width: cardW };
  }, [anchor]);

  const targetPhrase = result?.baseForm || anchor?.word || "";
  const isSaved =
    targetPhrase.length > 0 &&
    savedPhraseStrings.has(targetPhrase.trim().toLowerCase());

  return (
    <AnimatePresence>
      {anchor && (
        <motion.div
          ref={popoverRef}
          key="word-dictionary-popover"
          role="dialog"
          aria-label={`Dictionary breakdown for ${anchor.word}`}
          initial={{ opacity: 0, y: 6, scale: 0.97 }}
          animate={{ opacity: 1, y: 0, scale: 1 }}
          exit={{ opacity: 0, y: 4, scale: 0.97 }}
          transition={{ duration: 0.16, ease: [0.16, 1, 0.3, 1] }}
          style={{
            top: coords.top,
            left: coords.left,
            width: coords.width,
          }}
          className="fixed z-50 rounded-xl bg-[var(--parlo-surface-solid)] border border-[var(--parlo-border)] shadow-[0_22px_52px_-12px_rgba(0,0,0,0.45)] p-4 text-[var(--parlo-ink)]"
        >
          {/* Header */}
          <div className="flex items-start justify-between gap-2 pb-2.5 border-b border-[var(--parlo-border)]">
            <div className="min-w-0">
              <div className="flex items-center gap-1.5 text-[11px] font-mono uppercase tracking-wider text-[var(--parlo-ink-muted)]">
                <BookOpen className="w-3 h-3 text-[var(--parlo-primary)]" aria-hidden="true" />
                <span>{language.name}</span>
                {dialectLabel && (
                  <>
                    <span aria-hidden="true">·</span>
                    <span className="truncate">{dialectLabel}</span>
                  </>
                )}
              </div>
              <div className="mt-1 flex flex-wrap items-baseline gap-x-2 gap-y-0.5">
                <span className="font-display text-lg font-semibold text-[var(--parlo-ink)]">
                  {result?.baseForm || anchor.word}
                </span>
                {result?.reading && (
                  <span className="font-mono text-xs text-[var(--parlo-ink-muted)]">
                    {result.reading}
                  </span>
                )}
                {result?.partOfSpeech && (
                  <span className="text-[11px] font-medium text-[var(--parlo-primary)]">
                    · {result.partOfSpeech}
                  </span>
                )}
              </div>
            </div>
            <button
              type="button"
              onClick={onClose}
              aria-label="Close dictionary popover"
              className="p-1 text-[var(--parlo-ink-muted)] hover:text-[var(--parlo-ink)] rounded-md transition-colors cursor-pointer"
            >
              <X className="w-4 h-4" />
            </button>
          </div>

          {/* Body */}
          <div className="pt-3 space-y-2.5 text-xs">
            {loading && (
              <div className="space-y-2 py-1" aria-busy="true">
                <div className="h-3.5 w-3/4 rounded bg-[var(--parlo-border)]/70 animate-pulse" />
                <div className="h-3 w-full rounded bg-[var(--parlo-border)]/50 animate-pulse" />
                <div className="h-3 w-5/6 rounded bg-[var(--parlo-border)]/40 animate-pulse" />
              </div>
            )}

            {!loading && error && (
              <div className="space-y-2 py-1">
                <p className="text-[var(--parlo-danger)]">{error}</p>
                <button
                  type="button"
                  onClick={() => setRetrySeed((n) => n + 1)}
                  className="inline-flex items-center gap-1.5 px-2.5 py-1 text-xs font-medium text-[var(--parlo-ink)] border border-[var(--parlo-border)] rounded-md hover:border-[var(--parlo-ink-muted)] cursor-pointer"
                >
                  <RefreshCw className="w-3 h-3" aria-hidden="true" />
                  Retry
                </button>
              </div>
            )}

            {!loading && result && (
              <>
                <p className="text-sm font-medium text-[var(--parlo-ink)] leading-snug">
                  {result.meaning}
                </p>

                {result.dialectNote && (
                  <p className="text-xs text-[var(--parlo-ink-secondary)] leading-relaxed">
                    <span className="font-medium text-[var(--parlo-primary)]">
                      Usage:{" "}
                    </span>
                    {result.dialectNote}
                  </p>
                )}

                {result.example && (
                  <div className="rounded-lg bg-[var(--parlo-surface-soft)] border border-[var(--parlo-border)] px-3 py-2 space-y-0.5">
                    <p className="text-xs font-medium text-[var(--parlo-ink)] leading-snug">
                      “{result.example}”
                    </p>
                    {result.exampleTranslation && (
                      <p className="text-[11px] text-[var(--parlo-ink-muted)]">
                        {result.exampleTranslation}
                      </p>
                    )}
                  </div>
                )}

                <div className="pt-1 flex items-center justify-between gap-2">
                  <button
                    type="button"
                    onClick={() => {
                      playClickSfx();
                      speakWithBrowserTts(
                        result.baseForm || anchor.word,
                        language.speechLocale
                      );
                    }}
                    className="inline-flex items-center gap-1.5 px-2.5 py-1.5 text-xs font-medium text-[var(--parlo-ink-secondary)] hover:text-[var(--parlo-ink)] bg-[var(--parlo-surface-soft)] border border-[var(--parlo-border)] rounded-lg transition-colors whitespace-nowrap cursor-pointer"
                  >
                    <Volume2 className="w-3.5 h-3.5" aria-hidden="true" />
                    Listen
                  </button>

                  <button
                    type="button"
                    disabled={isSaved}
                    onClick={() => {
                      playSuccessSfx();
                      onSavePhrase({
                        phrase: result.baseForm || anchor.word,
                        translation: result.meaning,
                        reading: result.reading,
                        languageCode: language.code,
                        scenarioTitle,
                        note:
                          result.example ||
                          result.dialectNote ||
                          anchor.sentence,
                      });
                    }}
                    className="inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium rounded-lg transition-colors whitespace-nowrap cursor-pointer bg-[var(--parlo-primary)] text-[var(--parlo-on-solid)] hover:bg-[var(--parlo-primary-hover)] disabled:opacity-75"
                  >
                    {isSaved ? (
                      <BookmarkCheck className="w-3.5 h-3.5" aria-hidden="true" />
                    ) : (
                      <BookmarkPlus className="w-3.5 h-3.5" aria-hidden="true" />
                    )}
                    {isSaved ? "Saved" : "Save Word"}
                  </button>
                </div>
              </>
            )}
          </div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}
