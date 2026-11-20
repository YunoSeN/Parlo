import { useEffect, useMemo, useState } from "react";
import { AnimatePresence, motion, useReducedMotion } from "motion/react";
import {
  ArrowLeft,
  ArrowRight,
  Check,
  CloudRain,
  Disc3,
  Flame,
  Mic,
  Sparkles,
  Volume2,
  Waves,
  Wind,
  X,
} from "lucide-react";
import {
  CEFR_DESCRIPTIONS,
  LANGUAGES,
  VOICE_PERSONAS,
} from "../data/catalog";
import { SOUNDSCAPE_LAYERS, SoundscapeLayerId } from "../lib/ambientAudio";
import { getCultureByLanguage } from "../lib/cultures";
import { sfxEngine } from "../lib/sfx";
import { CefrLevel, Scenario, SpeakingPace, VoiceName } from "../types";
import { CulturalMotifArt } from "./CulturalMotifArt";
import { LanguageFlagBadge } from "./LanguageFlagBadge";
import { ScenarioImage } from "./ScenarioImage";

export interface OnboardingFlowProps {
  open: boolean;
  languageCode: string;
  level: CefrLevel;
  voiceName: VoiceName;
  speakingPace: SpeakingPace;
  weeklyGoal: number;
  activeScenarioId: string;
  scenarios: Scenario[];
  activeSoundLayers: SoundscapeLayerId[];
  sfxEnabled: boolean;
  onSelectLanguage: (code: string) => void;
  onSelectLevel: (level: CefrLevel) => void;
  onSelectVoice: (voice: VoiceName) => void;
  onChangeSpeakingPace: (pace: SpeakingPace) => void;
  onChangeWeeklyGoal: (goal: number) => void;
  onSelectScenario: (scenario: Scenario) => void;
  onToggleSoundLayer: (id: SoundscapeLayerId) => void;
  onToggleSfx: () => void;
  onComplete: (launchVoice: boolean) => void;
  onSkip: () => void;
}

const STEPS = [
  { id: 0, short: "Language", title: "Choose your language & atmosphere" },
  { id: 1, short: "Voice", title: "Calibrate level & partner voice" },
  { id: 2, short: "Rhythm", title: "Set weekly goal & soundscape" },
  { id: 3, short: "Scene", title: "Pick your opening scene" },
] as const;

const WEEKLY_GOAL_PRESETS = [
  { sessions: 2, label: "Casual", detail: "2 sessions / wk" },
  { sessions: 4, label: "Steady", detail: "4 sessions / wk" },
  { sessions: 5, label: "Focused", detail: "5 sessions / wk" },
  { sessions: 7, label: "Daily", detail: "7 sessions / wk" },
] as const;

const LAYER_ICONS: Record<SoundscapeLayerId, typeof CloudRain> = {
  "cafe-rain": CloudRain,
  "evening-lounge": Disc3,
  "morning-breeze": Wind,
  "coastal-waves": Waves,
  "library-hearth": Flame,
};

const EASE_SMOOTH = [0.16, 1, 0.3, 1] as const;

export function OnboardingFlow({
  open,
  languageCode,
  level,
  voiceName,
  speakingPace,
  weeklyGoal,
  activeScenarioId,
  scenarios,
  activeSoundLayers,
  sfxEnabled,
  onSelectLanguage,
  onSelectLevel,
  onSelectVoice,
  onChangeSpeakingPace,
  onChangeWeeklyGoal,
  onSelectScenario,
  onToggleSoundLayer,
  onToggleSfx,
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

          {/* Responsive Dialog / Mobile Bottom Sheet */}
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
            className="relative z-10 w-full sm:max-w-[660px] max-h-[92dvh] sm:max-h-[86dvh] flex flex-col rounded-t-[26px] sm:rounded-[24px] border border-[var(--parlo-border)] bg-[var(--parlo-surface-solid)]/98 backdrop-blur-2xl shadow-[0_30px_90px_-18px_rgba(0,0,0,0.65)] overflow-hidden"
          >
            {/* Cultural top accent bar */}
            <div
              aria-hidden="true"
              className="h-[2.5px] w-full shrink-0"
              style={{
                background:
                  "linear-gradient(90deg, var(--parlo-primary) 0%, var(--parlo-accent) 62%, transparent 100%)",
              }}
            />

            {/* Mobile sheet grab handle */}
            <div className="sm:hidden pt-2.5 pb-1 flex justify-center shrink-0">
              <span
                aria-hidden="true"
                className="w-10 h-1 rounded-full bg-[var(--parlo-border)]"
              />
            </div>

            {/* Header + Stepper */}
            <div className="px-5 sm:px-6 pt-3 sm:pt-5 pb-4 border-b border-[var(--parlo-border)] shrink-0">
              <div className="flex items-start justify-between gap-3">
                <div className="min-w-0">
                  <div className="flex items-center gap-2 text-[11px] font-mono text-[var(--parlo-primary)]">
                    <span>Guided Studio Setup</span>
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
                  aria-label="Skip guided onboarding"
                  className="min-w-[40px] min-h-[40px] inline-flex items-center justify-center rounded-xl text-[var(--parlo-ink-muted)] hover:text-[var(--parlo-ink)] hover:bg-[var(--parlo-surface-alt)] transition-colors cursor-pointer shrink-0"
                >
                  <X className="w-4 h-4" aria-hidden="true" />
                </button>
              </div>

              {/* Interactive Step Progress Segments */}
              <div
                className="mt-4 grid grid-cols-4 gap-2"
                role="tablist"
                aria-label="Onboarding steps"
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
                        className={`mt-1.5 block text-[11px] font-medium truncate transition-colors ${
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
                  {/* STEP 1: LANGUAGE & CULTURAL ATMOSPHERE */}
                  {step === 0 && (
                    <div className="space-y-4">
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
                              className={`min-h-[64px] p-3 rounded-xl border text-left transition-all cursor-pointer flex flex-col justify-between gap-1.5 ${
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
                                  <span className="font-mono text-[10px] uppercase text-[var(--parlo-ink-muted)]">
                                    {lang.code}
                                  </span>
                                )}
                              </div>
                              <div className="min-w-0">
                                <p className="text-xs font-semibold text-[var(--parlo-ink)] truncate">
                                  {lang.nativeName}
                                </p>
                                <p className="text-[10px] text-[var(--parlo-ink-muted)] truncate">
                                  {cult.cityLine.split("&")[0].trim()}
                                </p>
                              </div>
                            </button>
                          );
                        })}
                      </div>
                    </div>
                  )}

                  {/* STEP 2: CEFR LEVEL, VOICE & PACE */}
                  {step === 1 && (
                    <div className="space-y-5">
                      <div>
                        <p className="text-xs font-semibold text-[var(--parlo-ink)] mb-2">
                          Proficiency Level (CEFR)
                        </p>
                        <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                          {(["A2", "B1", "B2", "C1"] as CefrLevel[]).map((lvl) => {
                            const selected = level === lvl;
                            return (
                              <button
                                key={lvl}
                                type="button"
                                onClick={() => {
                                  sfxEngine.playToggle(true);
                                  onSelectLevel(lvl);
                                }}
                                className={`min-h-[56px] p-3 rounded-xl border text-left transition-colors cursor-pointer flex items-center justify-between gap-3 ${
                                  selected
                                    ? "bg-[var(--parlo-primary-soft)] border-[var(--parlo-primary)]"
                                    : "bg-[var(--parlo-surface)] border-[var(--parlo-border)] hover:border-[var(--parlo-ink-muted)]"
                                }`}
                              >
                                <div className="min-w-0">
                                  <span className="font-mono text-xs font-bold text-[var(--parlo-primary)]">
                                    {lvl}
                                  </span>
                                  <p className="text-xs text-[var(--parlo-ink-secondary)] mt-0.5 leading-snug">
                                    {CEFR_DESCRIPTIONS[lvl]}
                                  </p>
                                </div>
                                {selected && (
                                  <Check
                                    className="w-4 h-4 text-[var(--parlo-primary)] shrink-0"
                                    aria-hidden="true"
                                  />
                                )}
                              </button>
                            );
                          })}
                        </div>
                      </div>

                      <div>
                        <p className="text-xs font-semibold text-[var(--parlo-ink)] mb-2">
                          Partner Voice Persona
                        </p>
                        <div className="grid grid-cols-2 sm:grid-cols-3 gap-2">
                          {VOICE_PERSONAS.map((vp) => {
                            const selected = voiceName === vp.id;
                            return (
                              <button
                                key={vp.id}
                                type="button"
                                onClick={() => {
                                  sfxEngine.playNav();
                                  onSelectVoice(vp.id);
                                }}
                                className={`min-h-[52px] px-3 py-2.5 rounded-xl border text-left transition-colors cursor-pointer ${
                                  selected
                                    ? "bg-[var(--parlo-primary-soft)] border-[var(--parlo-primary)] text-[var(--parlo-ink)]"
                                    : "bg-[var(--parlo-surface)] border-[var(--parlo-border)] text-[var(--parlo-ink-secondary)] hover:border-[var(--parlo-ink-muted)]"
                                }`}
                              >
                                <p className="text-xs font-semibold text-[var(--parlo-ink)]">
                                  {vp.label}
                                </p>
                                <p className="text-[11px] text-[var(--parlo-ink-muted)] truncate">
                                  {vp.tone}
                                </p>
                              </button>
                            );
                          })}
                        </div>
                      </div>

                      <div>
                        <p className="text-xs font-semibold text-[var(--parlo-ink)] mb-2">
                          Speaking Pace
                        </p>
                        <div className="grid grid-cols-3 gap-2">
                          {(
                            [
                              { id: "slow", label: "Slow", note: "Clear pauses" },
                              { id: "natural", label: "Natural", note: "Everyday rhythm" },
                              { id: "brisk", label: "Brisk", note: "Native speed" },
                            ] as const
                          ).map((item) => {
                            const selected = speakingPace === item.id;
                            return (
                              <button
                                key={item.id}
                                type="button"
                                onClick={() => {
                                  sfxEngine.playToggle(true);
                                  onChangeSpeakingPace(item.id);
                                }}
                                className={`min-h-[52px] px-3 py-2 rounded-xl border text-left transition-colors cursor-pointer ${
                                  selected
                                    ? "bg-[var(--parlo-primary-soft)] border-[var(--parlo-primary)]"
                                    : "bg-[var(--parlo-surface)] border-[var(--parlo-border)] hover:border-[var(--parlo-ink-muted)]"
                                }`}
                              >
                                <p className="text-xs font-semibold text-[var(--parlo-ink)]">
                                  {item.label}
                                </p>
                                <p className="text-[11px] text-[var(--parlo-ink-muted)]">
                                  {item.note}
                                </p>
                              </button>
                            );
                          })}
                        </div>
                      </div>
                    </div>
                  )}

                  {/* STEP 3: WEEKLY RHYTHM & SOUNDSCAPE */}
                  {step === 2 && (
                    <div className="space-y-5">
                      <div>
                        <p className="text-xs font-semibold text-[var(--parlo-ink)] mb-2">
                          Weekly Speaking Goal
                        </p>
                        <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
                          {WEEKLY_GOAL_PRESETS.map((preset) => {
                            const selected = weeklyGoal === preset.sessions;
                            return (
                              <button
                                key={preset.sessions}
                                type="button"
                                onClick={() => {
                                  sfxEngine.playSavePhrase();
                                  onChangeWeeklyGoal(preset.sessions);
                                }}
                                className={`min-h-[60px] p-3 rounded-xl border text-left transition-colors cursor-pointer ${
                                  selected
                                    ? "bg-[var(--parlo-primary-soft)] border-[var(--parlo-primary)]"
                                    : "bg-[var(--parlo-surface)] border-[var(--parlo-border)] hover:border-[var(--parlo-ink-muted)]"
                                }`}
                              >
                                <p className="text-xs font-semibold text-[var(--parlo-ink)]">
                                  {preset.label}
                                </p>
                                <p className="mt-0.5 font-mono text-[11px] text-[var(--parlo-ink-muted)] tabular-nums">
                                  {preset.detail}
                                </p>
                              </button>
                            );
                          })}
                        </div>
                      </div>

                      <div>
                        <div className="flex items-center justify-between gap-2 mb-2">
                          <p className="text-xs font-semibold text-[var(--parlo-ink)]">
                            Optional Background Soundscape
                          </p>
                          <span className="text-[11px] text-[var(--parlo-ink-muted)]">
                            Tap to preview live
                          </span>
                        </div>
                        <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                          {SOUNDSCAPE_LAYERS.slice(0, 4).map((layer) => {
                            const active = activeSoundLayers.includes(layer.id);
                            const Icon = LAYER_ICONS[layer.id];
                            return (
                              <button
                                key={layer.id}
                                type="button"
                                role="switch"
                                aria-checked={active}
                                onClick={() => onToggleSoundLayer(layer.id)}
                                className={`min-h-[52px] px-3 py-2.5 rounded-xl border text-left transition-colors cursor-pointer flex items-center justify-between gap-2.5 ${
                                  active
                                    ? "bg-[var(--parlo-primary-soft)] border-[var(--parlo-primary)]"
                                    : "bg-[var(--parlo-surface)] border-[var(--parlo-border)] hover:border-[var(--parlo-ink-muted)]"
                                }`}
                              >
                                <div className="flex items-center gap-2.5 min-w-0">
                                  <Icon
                                    className={`w-4 h-4 shrink-0 ${
                                      active
                                        ? "text-[var(--parlo-primary)]"
                                        : "text-[var(--parlo-ink-muted)]"
                                    }`}
                                    aria-hidden="true"
                                  />
                                  <div className="min-w-0">
                                    <p className="text-xs font-semibold text-[var(--parlo-ink)] truncate">
                                      {layer.label}
                                    </p>
                                    <p className="text-[10px] text-[var(--parlo-ink-muted)] truncate">
                                      {layer.tagline}
                                    </p>
                                  </div>
                                </div>
                                <span
                                  className={`font-mono text-[10px] font-semibold shrink-0 ${
                                    active
                                      ? "text-[var(--parlo-primary)]"
                                      : "text-[var(--parlo-ink-muted)]"
                                  }`}
                                >
                                  {active ? "ON" : "OFF"}
                                </span>
                              </button>
                            );
                          })}
                        </div>
                      </div>

                      <div className="flex items-center justify-between gap-3 p-3.5 rounded-xl border border-[var(--parlo-border)] bg-[var(--parlo-surface)]">
                        <div className="flex items-center gap-2.5 min-w-0">
                          <Volume2
                            className="w-4 h-4 text-[var(--parlo-primary)] shrink-0"
                            aria-hidden="true"
                          />
                          <div className="min-w-0">
                            <p className="text-xs font-semibold text-[var(--parlo-ink)]">
                              Tactile UI Sound Effects
                            </p>
                            <p className="text-[11px] text-[var(--parlo-ink-muted)]">
                              Subtle chimes for switching cultures, saving phrases & toggles
                            </p>
                          </div>
                        </div>
                        <button
                          type="button"
                          role="switch"
                          aria-checked={sfxEnabled}
                          onClick={onToggleSfx}
                          className={`min-h-[36px] px-3 rounded-lg border text-xs font-mono font-semibold transition-colors cursor-pointer shrink-0 ${
                            sfxEnabled
                              ? "bg-[var(--parlo-primary-soft)] border-[var(--parlo-primary)] text-[var(--parlo-primary)]"
                              : "bg-[var(--parlo-canvas)] border-[var(--parlo-border)] text-[var(--parlo-ink-muted)]"
                          }`}
                        >
                          {sfxEnabled ? "ON" : "OFF"}
                        </button>
                      </div>
                    </div>
                  )}

                  {/* STEP 4: PICK OPENING SCENE */}
                  {step === 3 && (
                    <div className="space-y-4">
                      <p className="text-xs text-[var(--parlo-ink-secondary)] leading-relaxed">
                        Choose a real-world conversation to begin in{" "}
                        <span className="font-semibold text-[var(--parlo-ink)]">
                          {activeLanguage.name} ({level})
                        </span>
                        . You can switch scenarios or enter the 3D Stage anytime.
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

            {/* Sticky Bottom Navigation Bar */}
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

              {step < STEPS.length - 1 ? (
                <button
                  type="button"
                  onClick={() => goToStep(step + 1)}
                  className="min-h-[44px] inline-flex items-center gap-2 px-5 rounded-xl bg-[var(--parlo-primary)] hover:bg-[var(--parlo-primary-hover)] text-[var(--parlo-on-solid)] text-xs font-semibold transition-colors cursor-pointer shadow-sm"
                >
                  Continue
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
                    <Sparkles className="w-3 h-3 hidden sm:inline" aria-hidden="true" />
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
