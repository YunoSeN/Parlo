import React, { useEffect, useRef, useState } from "react";
import { AnimatePresence, motion, PanInfo, useReducedMotion } from "motion/react";
import {
  BookmarkCheck,
  BookmarkPlus,
  Pause,
  Play,
  SkipBack,
  SkipForward,
} from "lucide-react";
import { getDailyWarmupPhrase } from "../data/dailyPhrases";
import { speakWithBrowserTts } from "../lib/audio";
import { LanguageOption } from "../types";
import { LanguageFlagBadge } from "./LanguageFlagBadge";

export interface WarmupCardDeckProps {
  language: LanguageOption;
  savedPhraseStrings: Set<string>;
  onSavePhrase: (params: {
    phrase: string;
    translation: string;
    reading?: string;
    languageCode: string;
    scenarioTitle: string;
    note?: string;
  }) => void;
}

const BAR_COUNT = 28;
const RESTING_BARS = Array.from({ length: BAR_COUNT }, (_, i) => {
  const t = i / (BAR_COUNT - 1);
  return 0.24 + Math.sin(t * Math.PI) * 0.42 + (i % 3 === 0 ? 0.14 : 0);
});

/**
 * Animated mini acoustic waveform embedded in the WarmupCardDeck transport bar
 * (inspired by DeckPlayer's live bar visualizer, synced to TTS playback).
 */
function MiniAudioWaveform({ isPlaying }: { isPlaying: boolean }) {
  const [bars, setBars] = useState<number[]>(RESTING_BARS);

  useEffect(() => {
    if (!isPlaying) {
      setBars(RESTING_BARS);
      return;
    }
    const id = window.setInterval(() => {
      setBars((prev) =>
        prev.map((h, i) => {
          const env = 0.35 + Math.sin((i / (BAR_COUNT - 1)) * Math.PI) * 0.65;
          const next = h + (Math.random() - 0.48) * 0.55;
          return Math.max(0.16, Math.min(1, next * env + 0.18));
        })
      );
    }, 110);
    return () => window.clearInterval(id);
  }, [isPlaying]);

  return (
    <div
      className="flex items-center gap-[2.5px] h-6 flex-1 min-w-[90px]"
      aria-hidden="true"
    >
      {bars.map((height, idx) => (
        <span
          key={idx}
          className="flex-1 rounded-full transition-all duration-100"
          style={{
            height: `${Math.round(height * 100)}%`,
            backgroundColor: isPlaying
              ? idx < BAR_COUNT * 0.45
                ? "var(--parlo-primary)"
                : "var(--parlo-accent)"
              : "var(--parlo-ink-muted)",
            opacity: isPlaying ? 0.5 + height * 0.5 : 0.28,
          }}
        />
      ))}
    </div>
  );
}

/**
 * WarmupCardDeck
 *
 * Tactile 3-card stacked audio deck combining drag-to-swap physics,
 * DeckPlayer-inspired transport & live acoustic waveform playback,
 * authentic LanguageFlagBadge, and Cyber-Serif shimmer spotlight borders.
 */
export function WarmupCardDeck({
  language,
  savedPhraseStrings,
  onSavePhrase,
}: WarmupCardDeckProps) {
  const [offset, setOffset] = useState(0);
  const [exitDir, setExitDir] = useState<1 | -1>(1);
  const [isPlaying, setIsPlaying] = useState(false);
  const playTimeoutRef = useRef<number | null>(null);
  const prefersReducedMotion = useReducedMotion();

  const stopPlayback = () => {
    if (playTimeoutRef.current !== null) {
      window.clearTimeout(playTimeoutRef.current);
      playTimeoutRef.current = null;
    }
    if (typeof window !== "undefined" && "speechSynthesis" in window) {
      window.speechSynthesis.cancel();
    }
    setIsPlaying(false);
  };

  useEffect(() => {
    return () => stopPlayback();
  }, [language.code]);

  const stepCard = (delta: 1 | -1) => {
    stopPlayback();
    setExitDir(delta);
    setOffset((prev) => (prev + delta + 12) % 12);
  };

  const handleTogglePlay = (phraseText: string) => {
    if (isPlaying) {
      stopPlayback();
      return;
    }
    setIsPlaying(true);
    speakWithBrowserTts(phraseText, language.speechLocale);
    const estMs = Math.max(1800, Math.min(4800, phraseText.length * 75));
    playTimeoutRef.current = window.setTimeout(() => {
      setIsPlaying(false);
    }, estMs);
  };

  const handleDragEnd = (
    _event: MouseEvent | TouchEvent | PointerEvent,
    info: PanInfo
  ) => {
    if (Math.abs(info.offset.x) > 72 || Math.abs(info.velocity.x) > 360) {
      stepCard(info.offset.x >= 0 ? 1 : -1);
    }
  };

  const handleSpotlightMove = (e: React.MouseEvent<HTMLDivElement>) => {
    const rect = e.currentTarget.getBoundingClientRect();
    e.currentTarget.style.setProperty("--spot-x", `${e.clientX - rect.left}px`);
    e.currentTarget.style.setProperty("--spot-y", `${e.clientY - rect.top}px`);
  };

  const stackOffsets = [2, 1, 0];

  return (
    <div className="relative pt-1 pb-5" style={{ perspective: "1100px" }}>
      <div className="flex items-center justify-between gap-3 mb-2.5">
        <div className="flex items-center gap-2 text-[11px] font-tech uppercase tracking-[0.16em] text-[var(--parlo-ink-muted)]">
          <LanguageFlagBadge code={language.code} size="xs" />
          <span className="text-[var(--parlo-primary)] font-semibold">
            Daily Warm-Up Deck
          </span>
          <span aria-hidden="true">·</span>
          <span className="normal-case tracking-normal font-mono">
            {language.name}
          </span>
        </div>

        <span className="text-[11px] font-mono text-[var(--parlo-ink-muted)] hidden sm:inline">
          Drag or use transport controls
        </span>
      </div>

      {/* Physical 3-card stacked viewport */}
      <div className="relative min-h-[218px]">
        <AnimatePresence initial={false} mode="popLayout">
          {stackOffsets.map((depth) => {
            const cardIndex = (offset + depth) % 12;
            const phrase = getDailyWarmupPhrase(language.code, cardIndex);
            const isFront = depth === 0;
            const isSaved = savedPhraseStrings.has(
              phrase.phrase.trim().toLowerCase()
            );

            const scale = 1 - depth * 0.036;
            const yOffset = depth * 10;
            const rotateZ = depth === 0 ? 0 : depth === 1 ? 1.15 : -1.25;
            const opacity = depth === 0 ? 1 : depth === 1 ? 0.72 : 0.4;

            return (
              <motion.div
                key={`${language.code}-${cardIndex}`}
                onMouseMove={isFront ? handleSpotlightMove : undefined}
                style={{
                  zIndex: 30 - depth * 10,
                  transformOrigin: "50% 85%",
                }}
                initial={
                  isFront
                    ? false
                    : {
                        scale: 0.9,
                        y: 24,
                        opacity: 0,
                      }
                }
                animate={{
                  scale,
                  y: yOffset,
                  rotateZ,
                  opacity,
                  x: 0,
                }}
                exit={
                  prefersReducedMotion
                    ? { opacity: 0 }
                    : {
                        x: exitDir * 240,
                        y: -14,
                        rotateZ: exitDir * 10,
                        opacity: 0,
                        scale: 0.94,
                        transition: {
                          duration: 0.3,
                          ease: [0.16, 1, 0.3, 1],
                        },
                      }
                }
                transition={{
                  type: "spring",
                  stiffness: 340,
                  damping: 26,
                  mass: 0.78,
                }}
                drag={isFront && !prefersReducedMotion ? "x" : false}
                dragConstraints={{ left: 0, right: 0 }}
                dragElastic={0.45}
                onDragEnd={isFront ? handleDragEnd : undefined}
                whileDrag={{ scale: 1.02, rotateZ: 2.5, cursor: "grabbing" }}
                onClick={!isFront ? () => stepCard(1) : undefined}
                className={`${
                  isFront
                    ? "relative cursor-grab active:cursor-grabbing parlo-shimmer-card"
                    : "absolute inset-0 cursor-pointer select-none"
                } rounded-2xl border border-[var(--parlo-border)] bg-[var(--parlo-surface-solid)]/92 p-4 sm:p-5 parlo-card-tactile overflow-hidden`}
              >
                <div className="relative z-10 flex items-start justify-between gap-3">
                  <div className="min-w-0">
                    <p className="font-serif-editorial text-xl sm:text-[23px] font-medium text-[var(--parlo-ink)] leading-snug">
                      “{phrase.phrase}”
                    </p>
                    {phrase.reading && (
                      <p className="mt-0.5 font-mono text-xs text-[var(--parlo-primary)]">
                        {phrase.reading}
                      </p>
                    )}
                    <p className="mt-1 text-sm text-[var(--parlo-ink-secondary)]">
                      {phrase.translation}
                    </p>
                    <p className="mt-1 text-xs text-[var(--parlo-ink-muted)] leading-relaxed">
                      {phrase.usageNote}
                    </p>
                  </div>

                  <span className="font-mono text-[11px] text-[var(--parlo-ink-muted)] tabular-nums shrink-0">
                    #{(cardIndex + 1).toString().padStart(2, "0")}/12
                  </span>
                </div>

                {/* DeckPlayer-inspired Mini Audio Transport + Live Waveform Bar */}
                <div className="relative z-10 mt-4 px-3 py-2.5 rounded-xl bg-[var(--parlo-canvas)]/90 border border-[var(--parlo-border)]/80 parlo-well-recessed flex flex-wrap items-center gap-3">
                  <div className="flex items-center gap-1 shrink-0">
                    <button
                      type="button"
                      onClick={(e) => {
                        e.stopPropagation();
                        stepCard(-1);
                      }}
                      aria-label="Previous warm-up card"
                      className="p-1.5 text-[var(--parlo-ink-muted)] hover:text-[var(--parlo-ink)] rounded-full transition-colors cursor-pointer"
                    >
                      <SkipBack className="w-3.5 h-3.5" aria-hidden="true" />
                    </button>

                    <button
                      type="button"
                      onClick={(e) => {
                        e.stopPropagation();
                        handleTogglePlay(phrase.phrase);
                      }}
                      aria-label={isPlaying ? "Pause pronunciation" : "Play pronunciation"}
                      className="inline-flex items-center justify-center w-8 h-8 rounded-full bg-[var(--parlo-primary)] text-[var(--parlo-on-solid)] hover:scale-105 active:scale-95 transition-transform shadow-sm cursor-pointer"
                    >
                      {isPlaying ? (
                        <Pause className="w-3.5 h-3.5 fill-current" aria-hidden="true" />
                      ) : (
                        <Play className="w-3.5 h-3.5 fill-current ml-0.5" aria-hidden="true" />
                      )}
                    </button>

                    <button
                      type="button"
                      onClick={(e) => {
                        e.stopPropagation();
                        stepCard(1);
                      }}
                      aria-label="Next warm-up card"
                      className="p-1.5 text-[var(--parlo-ink-muted)] hover:text-[var(--parlo-ink)] rounded-full transition-colors cursor-pointer"
                    >
                      <SkipForward className="w-3.5 h-3.5" aria-hidden="true" />
                    </button>
                  </div>

                  <MiniAudioWaveform isPlaying={isFront && isPlaying} />

                  <button
                    type="button"
                    disabled={isSaved}
                    onClick={(e) => {
                      e.stopPropagation();
                      onSavePhrase({
                        phrase: phrase.phrase,
                        translation: phrase.translation,
                        reading: phrase.reading,
                        languageCode: language.code,
                        scenarioTitle: "Daily Warm-Up",
                        note: phrase.usageNote,
                      });
                    }}
                    className="inline-flex items-center gap-1.5 px-2.5 py-1.5 text-xs font-medium text-[var(--parlo-ink)] bg-[var(--parlo-surface-solid)] border border-[var(--parlo-border)] hover:border-[var(--parlo-primary)] disabled:text-[var(--parlo-primary)] rounded-lg transition-colors cursor-pointer shrink-0"
                  >
                    {isSaved ? (
                      <BookmarkCheck className="w-3.5 h-3.5" aria-hidden="true" />
                    ) : (
                      <BookmarkPlus className="w-3.5 h-3.5" aria-hidden="true" />
                    )}
                    {isSaved ? "Saved" : "Save"}
                  </button>
                </div>
              </motion.div>
            );
          })}
        </AnimatePresence>
      </div>
    </div>
  );
}

export default WarmupCardDeck;
