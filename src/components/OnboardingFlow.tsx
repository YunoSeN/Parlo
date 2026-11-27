import { useEffect, useMemo, useState } from "react";
import { AnimatePresence, motion, useReducedMotion } from "motion/react";
import {
  ArrowLeft,
  ArrowRight,
  Check,
  Mic,
  X,
} from "lucide-react";
import { CEFR_DESCRIPTIONS, LANGUAGES } from "../data/catalog";
import { SoundscapeLayerId } from "../lib/ambientAudio";
import { getCultureByLanguage } from "../lib/cultures";
import { sfxEngine } from "../lib/sfx";
import { extractCefrShortLabel } from "../lib/textMetrics";
import { CefrLevel, Scenario, SpeakingPace, VoiceName } from "../types";
import { CulturalMotifArt } from "./CulturalMotifArt";
import { LanguageFlagBadge } from "./LanguageFlagBadge";
import { ScenarioImage } from "./ScenarioImage";

export interface OnboardingFlowProps {
  open: boolean;
  languageCode: string;
  level: CefrLevel;
  voiceName?: VoiceName;
  speakingPace?: SpeakingPace;
  weeklyGoal?: number;
  activeScenarioId: string;
  scenarios: Scenario[];
  activeSoundLayers?: SoundscapeLayerId[];
  sfxEnabled?: boolean;
  onSelectLanguage: (code: string) => void;
  onSelectLevel: (level: CefrLevel) => void;
  onSelectVoice?: (voice: VoiceName) => void;
  onChangeSpeakingPace?: (pace: SpeakingPace) => void;
  onChangeWeeklyGoal?: (goal: number) => void;
  onSelectScenario: (scenario: Scenario) => void;
  onToggleSoundLayer?: (id: SoundscapeLayerId) => void;
  onToggleSfx?: () => void;
  onComplete: (launchVoice: boolean) => void;
  onSkip: () => void;
}

const STEPS = [
  { id: 0, short: "Language & Level", title: "What would you like to practice?" },
  { id: 1, short: "Opening Scene", title: "Pick a real-world scene & start speaking" },
] as const;

const EASE_SMOOTH = [0.16, 1, 0.3, 1] as const;

export function OnboardingFlow({
  open,
  languageCode,
  level,
  activeScenarioId,
  scenarios,
  onSelectLanguage,
  onSelectLevel,
  onSelectScenario,
  onComplete,
  onSkip,
}: OnboardingFlowProps) {
  const [step, setStep] = useState<number>(0);
  const [direction, setDirection] = useState<number>(1);
  const prefersReducedMotion = useReducedMotion();

  const activeCulture = getCultureByLanguage(languageCode);
  const activeLanguage =
    LANGUAGES.find((l) => l.code === languageCode) ?? LANGUAGES[0];

  useEffect(() => {
    if (open) {
      setStep(0);
      setDirection(1);
    }
  }, [open]);

  useEffect(() => {
    if (!open) return;
    const onKeyDown = (e: KeyboardEvent) => {
      if (e.key === "Escape") {
        e.preventDefault();
        onSkip();
      }
    };
    window.addEventListener("keydown", onKeyDown);
    return () => window.removeEventListener("keydown", onKeyDown);
  }, [open, onSkip]);

  const recommendedScenarios = useMemo(() => {
    const matching = scenarios.filter(
      (sc) => sc.defaultLanguageCode === languageCode
    );
    const others = scenarios.filter(
      (sc) => sc.defaultLanguageCode !== languageCode
    );
    return [...matching, ...others].slice(0, 4);
  }, [languageCode, scenarios]);

  const goToStep = (next: number) => {
    if (next < 0 || next >= STEPS.length || next === step) return;
    setDirection(next > step ? 1 : -1);
    setStep(next);
    sfxEngine.playNav();
  };

  return (
    <AnimatePresence>
      {open && (
        <div
          className="fixed inset-0 z-50 flex items-end sm:items-center justify-center sm:p-4"
          role="dialog"
          aria-modal="true"
          aria-labelledby="parlo-onboarding-title"
        >
          {/* Scrim backdrop */}
          <motion.div
            key="onboarding-backdrop"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.2 }}
            onClick={onSkip}
            aria-hidden="true"
            className="fixed inset-0 bg-black/58 backdrop-blur-md"
          />

          {/* Responsive 2-Step Dialog / Mobile Bottom Sheet */}
          <motion.div
            key="onboarding-card"
            initial={
              prefersReducedMotion
                ? { opacity: 0 }
                : { opacity: 0, y: 28, scale: 0.97 }
            }
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={
              prefersReducedMotion
                ? { opacity: 0 }
                : { opacity: 0, y: 24, scale: 0.97 }
            }
            transition={{ duration: 0.26, ease: EASE_SMOOTH }}
            className="relative z-10 w-full sm:max-w-[640px] max-h-[92dvh] sm:max-h-[86dvh] flex flex-col rounded-t-[26px] sm:rounded-[24px] border border-[var(--parlo-border)] bg-[var(--parlo-surface-solid)]/98 backdrop-blur-2xl shadow-[0_30px_90px_-18px_rgba(0,0,0,0.65)] overflow-hidden"
          >
            <div
              aria-hidden="true"
              className="h-[2.5px] w-full shrink-0"
              style={{
                background:
                  "linear-gradient(90deg, var(--parlo-primary) 0%, var(--parlo-accent) 62%, transparent 100%)",
              }}
            />

            <div className="sm:hidden pt-2.5 pb-1 flex justify-center shrink-0">
              <span
                aria-hidden="true"
                className="w-10 h-1 rounded-full bg-[var(--parlo-border)]"
              />
            </div>

            {/* Header + 2-Step Progress */}
            <div className="px-5 sm:px-6 pt-3 sm:pt-5 pb-4 border-b border-[var(--parlo-border)] shrink-0">
              <div className="flex items-start justify-between gap-3">
                <div className="min-w-0">
                  <div className="flex items-center gap-2 text-xs font-mono text-[var(--parlo-primary)]">
                    <span>Quick Start</span>
                    <span aria-hidden="true" className="text-[var(--parlo-ink-muted)]">
                      ·
                    </span>
                    <span className="text-[var(--parlo-ink-muted)] tabular-nums">
                      Step {step + 1} of {STEPS.length}
                    </span>
                  </div>
                  <h2
                    id="parlo-onboarding-title"
                    className="mt-1 font-display text-lg sm:text-xl font-bold text-[var(--parlo-ink)] leading-snug [text-wrap:balance]"
                  >
                    {STEPS[step].title}
                  </h2>
                </div>

                <button
                  type="button"
                  onClick={onSkip}
                  aria-label="Skip quick setup"
                  className="min-w-[44px] min-h-[44px] inline-flex items-center justify-center rounded-xl text-[var(--parlo-ink-muted)] hover:text-[var(--parlo-ink)] hover:bg-[var(--parlo-surface-alt)] transition-colors cursor-pointer shrink-0"
                >
                  <X className="w-4 h-4" aria-hidden="true" />
                </button>
              </div>

              <div
                className="mt-3.5 grid grid-cols-2 gap-2.5"
                role="tablist"
                aria-label="Quick setup steps"
              >
                {STEPS.map((item, idx) => {
                  const isActive = idx === step;
                  const isDone = idx < step;
                  return (
                    <button
                      key={item.id}
                      type="button"
                      role="tab"
                      aria-selected={isActive}
                      onClick={() => goToStep(idx)}
                      className="group text-left cursor-pointer focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[var(--parlo-primary)] rounded-md"
                    >
                      <div className="h-1.5 w-full rounded-full bg-[var(--parlo-canvas)] overflow-hidden">
                        <div
                          className="h-full rounded-full transition-all duration-300"
                          style={{
                            width: isDone || isActive ? "100%" : "0%",
                            backgroundColor: isActive
                              ? "var(--parlo-primary)"
                              : "color-mix(in srgb, var(--parlo-primary) 55%, transparent)",
                          }}
                        />
                      </div>
                      <span
                        className={`mt-1.5 block text-xs font-medium truncate transition-colors ${
                          isActive
                            ? "text-[var(--parlo-ink)]"
                            : "text-[var(--parlo-ink-muted)] group-hover:text-[var(--parlo-ink-secondary)]"
                        }`}
                      >
                        {idx + 1}. {item.short}
                      </span>
                    </button>
                  );
                })}
              </div>
            </div>

            {/* Scrollable Step Body */}
            <div className="px-5 sm:px-6 py-5 overflow-y-auto flex-1">
              <AnimatePresence mode="wait" initial={false}>
                <motion.div
                  key={step}
                  initial={
                    prefersReducedMotion
                      ? { opacity: 0 }
                      : { opacity: 0, x: direction * 20 }
                  }
                  animate={{ opacity: 1, x: 0 }}
                  exit={
                    prefersReducedMotion
                      ? { opacity: 0 }
                      : { opacity: 0, x: direction * -20 }
                  }
                  transition={{ duration: 0.2, ease: EASE_SMOOTH }}
                >
                  {/* STEP 1: LANGUAGE + CEFR LEVEL */}
                  {step === 0 && (
                    <div className="space-y-5">
                      <div className="flex items-center gap-3.5 p-3.5 rounded-2xl border border-[var(--parlo-border)] bg-[var(--parlo-surface-alt)]">
                        <CulturalMotifArt
                          languageCode={languageCode}
                          variant="medallion"
                          className="w-12 h-12 shrink-0"
                        />
                        <div className="min-w-0">
                          <p
                            className="text-lg font-semibold text-[var(--parlo-ink)] leading-tight truncate"
                            style={{ fontFamily: activeCulture.displayFontFamily }}
                          >
                            {activeCulture.greeting} — {activeLanguage.name}
                          </p>
                          <p className="text-xs text-[var(--parlo-ink-muted)] mt-0.5 truncate">
                            {activeCulture.atelierName} · {activeCulture.cityLine}
                          </p>
                        </div>
                      </div>

                      <div
                        className="grid grid-cols-2 sm:grid-cols-4 gap-2"
                        role="radiogroup"
                        aria-label="Choose target language"
                      >
                        {LANGUAGES.map((lang) => {
                          const selected = lang.code === languageCode;
                          const cult = getCultureByLanguage(lang.code);
                          return (
                            <button
                              key={lang.code}
                              type="button"
                              role="radio"
                              aria-checked={selected}
                              onClick={() => onSelectLanguage(lang.code)}
                              className={`min-h-[60px] p-2.5 rounded-xl border text-left transition-all cursor-pointer flex flex-col justify-between gap-1.5 ${
                                selected
                                  ? "bg-[var(--parlo-primary-soft)] border-[var(--parlo-primary)] text-[var(--parlo-ink)] shadow-sm"
                                  : "bg-[var(--parlo-surface)] border-[var(--parlo-border)] text-[var(--parlo-ink-secondary)] hover:border-[var(--parlo-ink-muted)]"
                              }`}
                            >
                              <div className="flex items-center justify-between gap-1.5">
                                <LanguageFlagBadge code={lang.code} size="sm" />
                                {selected ? (
                                  <Check
                                    className="w-3.5 h-3.5 text-[var(--parlo-primary)]"
                                    aria-hidden="true"
                                  />
                                ) : (
                                  <span className="font-mono text-[11px] uppercase text-[var(--parlo-ink-muted)]">
                                    {lang.code}
                                  </span>
                                )}
                              </div>
                              <div className="min-w-0">
                                <p className="text-xs font-semibold text-[var(--parlo-ink)] truncate">
                                  {lang.nativeName}
                                </p>
                                <p className="text-[11px] text-[var(--parlo-ink-muted)] truncate">
                                  {cult.cityLine.split("&")[0].trim()}
                                </p>
                              </div>
                            </button>
                          );
                        })}
                      </div>

                      <div>
                        <p className="text-xs font-semibold text-[var(--parlo-ink)] mb-2">
                          Proficiency Level (CEFR)
                        </p>
                        <div className="grid grid-cols-2 sm:grid-cols-5 gap-2">
                          {(["A1", "A2", "B1", "B2", "C1"] as CefrLevel[]).map((lvl) => {
                            const selected = level === lvl;
                            return (
                              <button
                                key={lvl}
                                type="button"
                                onClick={() => {
                                  sfxEngine.playToggle(true);
                                  onSelectLevel(lvl);
                                }}
                                title={CEFR_DESCRIPTIONS[lvl]}
                                className={`min-h-[56px] p-2.5 rounded-xl border text-left transition-colors cursor-pointer ${
                                  selected
                                    ? "bg-[var(--parlo-primary-soft)] border-[var(--parlo-primary)]"
                                    : "bg-[var(--parlo-surface)] border-[var(--parlo-border)] hover:border-[var(--parlo-ink-muted)]"
                                }`}
                              >
                                <div className="flex items-center justify-between">
                                  <span className="font-mono text-xs font-bold text-[var(--parlo-primary)]">
                                    {lvl}
                                  </span>
                                  {selected && (
                                    <Check
                                      className="w-3.5 h-3.5 text-[var(--parlo-primary)]"
                                      aria-hidden="true"
                                    />
                                  )}
                                </div>
                                <p className="text-[11px] text-[var(--parlo-ink-secondary)] mt-1 leading-snug">
                                  {extractCefrShortLabel(CEFR_DESCRIPTIONS[lvl])}
                                </p>
                              </button>
                            );
                          })}
                        </div>
                      </div>
                    </div>
                  )}

                  {/* STEP 2: PICK OPENING SCENE & SPEAK */}
                  {step === 1 && (
                    <div className="space-y-4">
                      <p className="text-sm text-[var(--parlo-ink-secondary)] leading-relaxed">
                        Choose your first real-world scene in{" "}
                        <span className="font-semibold text-[var(--parlo-ink)]">
                          {activeLanguage.name} ({level})
                        </span>
                        . Dialect, voice persona, pace, and ambient soundscapes are available anytime inside Practice Settings.
                      </p>

                      <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
                        {recommendedScenarios.map((sc) => {
                          const selected = sc.id === activeScenarioId;
                          return (
                            <button
                              key={sc.id}
                              type="button"
                              onClick={() => {
                                sfxEngine.playNav();
                                onSelectScenario(sc);
                              }}
                              className={`p-3 rounded-xl border text-left transition-all cursor-pointer flex items-center gap-3 ${
                                selected
                                  ? "bg-[var(--parlo-primary-soft)] border-[var(--parlo-primary)]"
                                  : "bg-[var(--parlo-surface)] border-[var(--parlo-border)] hover:border-[var(--parlo-ink-muted)]"
                              }`}
                            >
                              <div className="w-14 h-14 rounded-lg overflow-hidden shrink-0 border border-[var(--parlo-border)]">
                                <ScenarioImage
                                  src={sc.imageUrl}
                                  alt={sc.title}
                                  title={sc.title}
                                  fallbackGradient={sc.fallbackGradient}
                                  className="w-full h-full"
                                />
                              </div>
                              <div className="min-w-0 flex-1">
                                <p className="text-[11px] font-mono text-[var(--parlo-ink-muted)] truncate">
                                  {sc.city} · {sc.recommendedLevel}
                                </p>
                                <p className="text-xs font-semibold text-[var(--parlo-ink)] truncate mt-0.5">
                                  {sc.title}
                                </p>
                                <p className="text-[11px] text-[var(--parlo-ink-muted)] truncate mt-0.5">
                                  with {sc.partnerName}
                                </p>
                              </div>
                            </button>
                          );
                        })}
                      </div>
                    </div>
                  )}
                </motion.div>
              </AnimatePresence>
            </div>

            {/* Sticky Bottom Bar */}
            <div className="px-5 sm:px-6 py-3.5 pb-[max(0.875rem,env(safe-area-inset-bottom))] border-t border-[var(--parlo-border)] bg-[var(--parlo-surface-alt)]/90 flex items-center justify-between gap-3 shrink-0">
              {step === 0 ? (
                <button
                  type="button"
                  onClick={onSkip}
                  className="min-h-[44px] px-3 text-xs font-medium text-[var(--parlo-ink-muted)] hover:text-[var(--parlo-ink)] transition-colors cursor-pointer"
                >
                  Skip for now
                </button>
              ) : (
                <button
                  type="button"
                  onClick={() => goToStep(step - 1)}
                  className="min-h-[44px] inline-flex items-center gap-1.5 px-3.5 rounded-xl border border-[var(--parlo-border)] bg-[var(--parlo-surface)] text-xs font-medium text-[var(--parlo-ink)] hover:border-[var(--parlo-ink-muted)] transition-colors cursor-pointer"
                >
                  <ArrowLeft className="w-3.5 h-3.5" aria-hidden="true" />
                  Back
                </button>
              )}

              {step === 0 ? (
                <button
                  type="button"
                  onClick={() => goToStep(1)}
                  className="min-h-[44px] inline-flex items-center gap-2 px-5 rounded-xl bg-[var(--parlo-primary)] hover:bg-[var(--parlo-primary-hover)] text-[var(--parlo-on-solid)] text-xs font-semibold transition-colors cursor-pointer shadow-sm"
                >
                  Choose Scene
                  <ArrowRight className="w-3.5 h-3.5" aria-hidden="true" />
                </button>
              ) : (
                <div className="flex items-center gap-2">
                  <button
                    type="button"
                    onClick={() => onComplete(false)}
                    className="min-h-[44px] px-3.5 rounded-xl border border-[var(--parlo-border)] bg-[var(--parlo-surface)] text-xs font-medium text-[var(--parlo-ink)] hover:border-[var(--parlo-ink-muted)] transition-colors cursor-pointer whitespace-nowrap"
                  >
                    Enter Studio
                  </button>
                  <button
                    type="button"
                    onClick={() => onComplete(true)}
                    className="min-h-[44px] inline-flex items-center gap-1.5 px-4 rounded-xl bg-[var(--parlo-primary)] hover:bg-[var(--parlo-primary-hover)] text-[var(--parlo-on-solid)] text-xs font-semibold transition-colors cursor-pointer whitespace-nowrap shadow-sm"
                  >
                    <Mic className="w-3.5 h-3.5" aria-hidden="true" />
                    Start Speaking
                  </button>
                </div>
              )}
            </div>
          </motion.div>
        </div>
      )}
    </AnimatePresence>
  );
}

export default OnboardingFlow;
