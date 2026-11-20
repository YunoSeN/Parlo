import React, { useRef } from "react";
import {
  AnimatePresence,
  motion,
  useMotionTemplate,
  useMotionValue,
  useReducedMotion,
} from "motion/react";
import { Box, Compass, Mic, PhoneOff, Volume2 } from "lucide-react";
import { LANGUAGES } from "../data/catalog";
import { speakWithBrowserTts } from "../lib/audio";
import { CountryFontSpec, getCultureByLanguage } from "../lib/cultures";
import { CefrLevel, LanguageOption, Scenario } from "../types";
import { CulturalMotifArt } from "./CulturalMotifArt";
import { EditorialTextReveal } from "./EditorialTextReveal";
import { GlowCtaButton } from "./GlowCtaButton";
import { GlowingEdgeCard } from "./GlowingEdgeCard";
import { LanguageFlagBadge } from "./LanguageFlagBadge";
import { RolodexWord } from "./RolodexWord";

interface StudioLandingHeroProps {
  language: LanguageOption;
  level: CefrLevel;
  scenario: Scenario;
  isLive: boolean;
  isConnecting: boolean;
  categoryFont?: CountryFontSpec;
  onSelectLanguage: (code: string) => void;
  onStartSession: () => void;
  onEndSession: () => void;
  onOpenScenarios: () => void;
  onOpenSpatial: () => void;
}

export function StudioLandingHero({
  language,
  level,
  scenario,
  isLive,
  isConnecting,
  categoryFont,
  onSelectLanguage,
  onStartSession,
  onEndSession,
  onOpenScenarios,
  onOpenSpatial,
}: StudioLandingHeroProps) {
  const locked = isLive || isConnecting;
  const prefersReducedMotion = useReducedMotion();
  const culture = getCultureByLanguage(language.code);

  const gridRef = useRef<HTMLDivElement | null>(null);
  const gridX = useMotionValue(-200);
  const gridY = useMotionValue(-200);
  const gridSpotBg = useMotionTemplate`radial-gradient(220px circle at ${gridX}px ${gridY}px, color-mix(in srgb, var(--parlo-primary) 16%, transparent), transparent 72%)`;

  const handleGridMove = (e: React.PointerEvent<HTMLDivElement>) => {
    if (prefersReducedMotion || e.pointerType === "touch") return;
    const rect = gridRef.current?.getBoundingClientRect();
    if (!rect) return;
    gridX.set(e.clientX - rect.left);
    gridY.set(e.clientY - rect.top);
  };

  const handleGridLeave = () => {
    gridX.set(-200);
    gridY.set(-200);
  };

  // Compact single-line studio bar while a live voice conversation is active
  if (locked) {
    return (
      <motion.section
        initial={{ opacity: 0, y: -6 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.22, ease: [0.16, 1, 0.3, 1] }}
        aria-label="Active session header"
        className="mb-5 pb-4 border-b border-[var(--parlo-border)] flex flex-wrap items-center justify-between gap-4"
      >
        <div className="flex flex-wrap items-center gap-x-3 gap-y-1">
          <span className="text-xs font-mono tracking-wide text-[var(--parlo-accent)]">
            {isConnecting ? "CONNECTING" : "ON AIR"}
          </span>
          <span className="text-[var(--parlo-border)]" aria-hidden="true">
            /
          </span>
          <p className="font-display text-lg font-semibold text-[var(--parlo-ink)]">
            {scenario.title}
          </p>
          <span className="text-xs font-mono text-[var(--parlo-ink-muted)]">
            {language.name} · CEFR {level} · {culture.atelierName}
          </span>
        </div>

        <div className="flex items-center gap-3 text-xs font-mono text-[var(--parlo-ink-muted)]">
          <span className="hidden sm:inline">Press M to mute · H for hints</span>
          <motion.button
            type="button"
            whileHover={{ y: -1.5 }}
            whileTap={{ scale: 0.96 }}
            onClick={onEndSession}
            className="inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-sans font-medium text-[var(--parlo-on-solid)] bg-[var(--parlo-ink)] hover:bg-[var(--parlo-primary)] rounded-lg transition-colors cursor-pointer"
          >
            <PhoneOff className="w-3.5 h-3.5" aria-hidden="true" />
            End Session
          </motion.button>
        </div>
      </motion.section>
    );
  }

  return (
    <section
      aria-label="Parlo Voice Studio introduction"
      className="relative mb-6 pb-6 border-b border-[var(--parlo-border)] grid grid-cols-1 lg:grid-cols-12 gap-6 items-center"
    >
      {/* Left: Masked Editorial Display Statement & Tactile Controls */}
      <div className="lg:col-span-7 space-y-4">
        <motion.div
          initial={{ opacity: 0, y: 8 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.32, ease: [0.16, 1, 0.3, 1] }}
          className="flex flex-wrap items-center gap-x-2.5 gap-y-1 text-[10px] font-tech uppercase tracking-[0.2em] text-[var(--parlo-ink-muted)]"
        >
          <LanguageFlagBadge code={language.code} size="xs" />
          <span className="text-[var(--parlo-primary)] font-semibold">
            {culture.atelierName}
          </span>
          <span aria-hidden="true">·</span>
          <span>{culture.landmarkTag}</span>
          {categoryFont && (
            <>
              <span aria-hidden="true">·</span>
              <span className="text-[var(--parlo-ink-secondary)]">
                Type: {categoryFont.city}
              </span>
            </>
          )}
        </motion.div>

        <h1
          className="text-5xl sm:text-6xl lg:text-[60px] font-normal tracking-[-0.03em] text-[var(--parlo-ink)] leading-[1.03] [text-wrap:balance]"
          style={
            categoryFont
              ? {
                  fontFamily: categoryFont.fontFamily,
                  fontStyle: categoryFont.fontStyle,
                  letterSpacing: categoryFont.letterSpacing,
                }
              : undefined
          }
        >
          <EditorialTextReveal text="Speak naturally in" delay={0.04} />{" "}
          <RolodexWord
            words={LANGUAGES.map((l) => `${l.name}.`)}
            className="italic font-medium text-[var(--parlo-primary)]"
          />
          <span className="block mt-2.5 font-sans not-italic text-lg sm:text-xl font-normal text-[var(--parlo-ink-muted)] tracking-[-0.01em] leading-snug">
            Real voice, real rhythm, zero rehearsal friction.
          </span>
        </h1>

        <motion.p
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.38, delay: 0.14, ease: [0.16, 1, 0.3, 1] }}
          className="text-sm sm:text-[15px] text-[var(--parlo-ink-secondary)] max-w-xl leading-relaxed"
        >
          Step into{" "}
          <span className="font-semibold text-[var(--parlo-ink)]">
            {scenario.title}
          </span>{" "}
          with {scenario.partnerName} in {scenario.city} — calibrated to CEFR{" "}
          <span className="font-mono text-xs font-medium text-[var(--parlo-primary)]">
            {level}
          </span>{" "}
          with live written phrasing notes.
        </motion.p>

        {/* Authentic Cultural Proverb & Native Cadence Immersion Ribbon */}
        <AnimatePresence mode="wait">
          <motion.div
            key={`proverb-${language.code}`}
            initial={prefersReducedMotion ? { opacity: 0 } : { opacity: 0, y: 6 }}
            animate={{ opacity: 1, y: 0 }}
            exit={prefersReducedMotion ? { opacity: 0 } : { opacity: 0, y: -4 }}
            transition={{ duration: 0.28, ease: [0.16, 1, 0.3, 1] }}
            className="max-w-xl rounded-xl border border-[var(--parlo-border)]/80 bg-[var(--parlo-surface)]/75 backdrop-blur-md px-3.5 py-2.5 flex items-center justify-between gap-3"
          >
            <div className="min-w-0">
              <p
                className="text-sm sm:text-[15px] text-[var(--parlo-ink)] leading-snug truncate"
                style={{ fontFamily: culture.displayFontFamily }}
              >
                “{culture.culturalProverb}”
              </p>
              <p className="mt-0.5 text-[11px] text-[var(--parlo-ink-muted)] truncate">
                {culture.culturalProverbMeaning} · {culture.cityLine}
              </p>
            </div>
            <button
              type="button"
              onClick={() =>
                speakWithBrowserTts(
                  culture.culturalProverb,
                  language.speechLocale
                )
              }
              title={`Hear ${language.name} proverb`}
              className="inline-flex items-center gap-1.5 px-2.5 py-1.5 rounded-lg border border-[var(--parlo-border)] bg-[var(--parlo-canvas)]/80 hover:border-[var(--parlo-primary)] text-[11px] font-medium text-[var(--parlo-ink-secondary)] hover:text-[var(--parlo-primary)] transition-colors shrink-0 cursor-pointer"
            >
              <Volume2 className="w-3.5 h-3.5 text-[var(--parlo-primary)]" aria-hidden="true" />
              <span className="hidden sm:inline">Hear</span>
            </button>
          </motion.div>
        </AnimatePresence>

        <motion.div
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.38, delay: 0.2, ease: [0.16, 1, 0.3, 1] }}
          className="pt-1 flex flex-wrap items-center gap-3"
        >
          <GlowCtaButton
            onClick={onStartSession}
            leadingIcon={<Mic className="w-4 h-4" aria-hidden="true" />}
          >
            Start Voice Session
          </GlowCtaButton>

          <motion.button
            type="button"
            whileHover={{ y: -2, scale: 1.01 }}
            whileTap={{ scaleX: 1.02, scaleY: 0.95 }}
            transition={{ type: "spring", stiffness: 480, damping: 24 }}
            onClick={onOpenScenarios}
            className="parlo-surface-elevated inline-flex items-center gap-1.5 px-4 py-3 text-sm font-medium text-[var(--parlo-ink)] bg-[var(--parlo-surface)] border border-[var(--parlo-border)] hover:border-[var(--parlo-ink)] rounded-xl transition-colors whitespace-nowrap cursor-pointer"
          >
            <Compass
              className="w-4 h-4 text-[var(--parlo-ink-muted)]"
              aria-hidden="true"
            />
            Change Scenario
          </motion.button>

          <motion.button
            type="button"
            whileHover={{ y: -1.5, x: 1 }}
            whileTap={{ scale: 0.96 }}
            transition={{ type: "spring", stiffness: 460, damping: 24 }}
            onClick={onOpenSpatial}
            className="inline-flex items-center gap-1.5 px-3.5 py-3 text-sm font-medium text-[var(--parlo-ink-muted)] hover:text-[var(--parlo-ink)] transition-colors whitespace-nowrap cursor-pointer group"
          >
            <Box
              className="w-4 h-4 text-[var(--parlo-primary)] transition-transform duration-300 group-hover:rotate-12 group-hover:scale-110"
              aria-hidden="true"
            />
            3D Stage
          </motion.button>
        </motion.div>
      </div>

      {/* Right: Animated Cultural Medallion + Tactile 8-Language Selector Card */}
      <motion.div
        initial={{ opacity: 0, y: 18, rotateX: 4 }}
        animate={{ opacity: 1, y: 0, rotateX: 0 }}
        transition={{ duration: 0.48, delay: 0.1, ease: [0.16, 1, 0.3, 1] }}
        className="lg:col-span-5"
      >
        <GlowingEdgeCard introSweep contentClassName="relative overflow-hidden p-4 sm:p-5">
          {/* Subtle CSS-masked cultural architectural pattern */}
          <div
            aria-hidden="true"
            data-culture={language.code}
            className="parlo-motif-overlay parlo-motif-corner"
          />

          {/* Animated Cultural Emblem Artwork + Country-Font Greeting Header */}
          <div className="relative z-10 flex items-center gap-3.5 pb-3.5 mb-3.5 border-b border-[var(--parlo-border)]/75">
            <CulturalMotifArt
              languageCode={language.code}
              variant="medallion"
              className="w-16 h-16"
            />

            <div className="min-w-0 flex-1">
              <AnimatePresence mode="wait">
                <motion.div
                  key={language.code}
                  initial={
                    prefersReducedMotion ? { opacity: 0 } : { opacity: 0, y: 6 }
                  }
                  animate={{ opacity: 1, y: 0 }}
                  exit={
                    prefersReducedMotion ? { opacity: 0 } : { opacity: 0, y: -5 }
                  }
                  transition={{ duration: 0.24, ease: [0.16, 1, 0.3, 1] }}
                >
                  <div className="flex items-baseline justify-between gap-2">
                    <p
                      className="text-2xl font-semibold text-[var(--parlo-ink)] leading-tight truncate"
                      style={{ fontFamily: culture.displayFontFamily }}
                    >
                      {culture.greeting}
                    </p>
                    <span className="inline-flex items-center gap-1.5 font-tech uppercase tracking-[0.16em] text-[10px] text-[var(--parlo-primary)] font-semibold shrink-0">
                      <LanguageFlagBadge code={language.code} size="xs" />
                      {language.name}
                    </span>
                  </div>
                  <p className="mt-0.5 text-xs text-[var(--parlo-ink-secondary)] truncate">
                    {culture.atelierName}{" "}
                    <span className="text-[var(--parlo-ink-muted)]" aria-hidden="true">
                      ·
                    </span>{" "}
                    <span className="text-[var(--parlo-ink-muted)]">
                      {culture.cityLine}
                    </span>
                  </p>
                  <p className="mt-0.5 text-[11px] font-mono text-[var(--parlo-ink-muted)] truncate">
                    {culture.waveformName} · {culture.patternName}
                  </p>
                </motion.div>
              </AnimatePresence>
            </div>
          </div>

          {/* Recessed Bento Tray with Shared Cursor Spotlight & Circular Flags */}
          <div
            ref={gridRef}
            onPointerMove={handleGridMove}
            onPointerLeave={handleGridLeave}
            className="relative p-1.5 rounded-xl bg-[var(--parlo-canvas)]/80 parlo-well-recessed overflow-hidden"
          >
            {!prefersReducedMotion && (
              <motion.div
                aria-hidden="true"
                className="pointer-events-none absolute inset-0 rounded-[inherit] z-0"
                style={{ background: gridSpotBg }}
              />
            )}

            <div
              className="relative z-10 grid grid-cols-2 sm:grid-cols-4 lg:grid-cols-2 gap-1.5"
              role="radiogroup"
              aria-label="Choose practice language"
            >
              {LANGUAGES.map((lang) => {
                const selected = lang.code === language.code;
                return (
                  <motion.button
                    key={lang.code}
                    type="button"
                    role="radio"
                    aria-checked={selected}
                    whileHover={{ y: -1.5 }}
                    whileTap={{ scaleX: 1.02, scaleY: 0.95 }}
                    transition={{ type: "spring", stiffness: 520, damping: 24 }}
                    onClick={() => onSelectLanguage(lang.code)}
                    className={`relative flex items-center justify-between gap-2 px-3 py-2.5 rounded-xl border text-left transition-colors cursor-pointer ${
                      selected
                        ? "border-[var(--parlo-primary)] text-[var(--parlo-ink)]"
                        : "bg-[var(--parlo-surface)]/85 border-[var(--parlo-border)]/80 text-[var(--parlo-ink-secondary)] hover:border-[var(--parlo-ink-muted)] hover:bg-[var(--parlo-surface)]"
                    }`}
                  >
                    {selected && (
                      <motion.span
                        layoutId="parlo-hero-lang-active"
                        transition={{
                          type: "spring",
                          stiffness: 440,
                          damping: 30,
                        }}
                        className="absolute inset-0 rounded-[11px] bg-[var(--parlo-surface-solid)] parlo-keycap-thumb"
                      />
                    )}
                    <span className="relative z-10 inline-flex items-center gap-2 min-w-0">
                      <LanguageFlagBadge code={lang.code} size="sm" />
                      <span className="text-xs font-medium truncate">
                        {lang.nativeName}
                      </span>
                    </span>
                    <span
                      className={`relative z-10 font-mono text-[10px] uppercase shrink-0 ${
                        selected
                          ? "text-[var(--parlo-primary)] font-semibold"
                          : "text-[var(--parlo-ink-muted)]"
                      }`}
                    >
                      {lang.code}
                    </span>
                  </motion.button>
                );
              })}
            </div>
          </div>
        </GlowingEdgeCard>
      </motion.div>
    </section>
  );
}

export default StudioLandingHero;
