import { motion } from "motion/react";
import { CEFR_DESCRIPTIONS, VOICE_PERSONAS } from "../data/catalog";
import { RegionalDialectOption } from "../lib/dialects";
import { CefrLevel, SpeakingPace, VoiceName } from "../types";

interface StudioTunerBarProps {
  level: CefrLevel;
  onSelectLevel: (level: CefrLevel) => void;
  voiceName: VoiceName;
  onSelectVoice: (voice: VoiceName) => void;
  speakingPace: SpeakingPace;
  onChangeSpeakingPace: (pace: SpeakingPace) => void;
  dialects?: RegionalDialectOption[];
  activeDialectId?: string;
  onSelectDialect?: (dialectId: string) => void;
  disabled: boolean;
}

const SPRING_THUMB = {
  type: "spring" as const,
  stiffness: 480,
  damping: 30,
  mass: 0.72,
};

/**
 * StudioTunerBar
 *
 * Machined Braun / Teenage-Engineering-inspired studio instrument desk.
 * Pairs recessed tactile wells with raised keycap spring thumbs.
 */
export function StudioTunerBar({
  level,
  onSelectLevel,
  voiceName,
  onSelectVoice,
  speakingPace,
  onChangeSpeakingPace,
  dialects = [],
  activeDialectId,
  onSelectDialect,
  disabled,
}: StudioTunerBarProps) {
  const activePersona =
    VOICE_PERSONAS.find((v) => v.id === voiceName) ?? VOICE_PERSONAS[0];

  return (
    <div className="bg-[var(--parlo-surface)] border border-[var(--parlo-border)] rounded-2xl parlo-surface-elevated p-3.5 sm:p-4 flex flex-col xl:flex-row xl:flex-wrap xl:items-center justify-between gap-3.5">
      {/* CEFR Level Rail */}
      <div className="flex flex-wrap items-center gap-2.5">
        <span className="text-[11px] font-mono tracking-wide text-[var(--parlo-ink-muted)]">
          CEFR
        </span>
        <div
          className="inline-flex items-center gap-1 p-1 bg-[var(--parlo-canvas)] parlo-well-recessed rounded-lg"
          role="group"
          aria-label="Proficiency level"
        >
          {(["A2", "B1", "B2", "C1"] as CefrLevel[]).map((lvl) => {
            const active = level === lvl;
            return (
              <motion.button
                key={lvl}
                type="button"
                disabled={disabled}
                whileTap={disabled ? undefined : { scale: 0.94 }}
                onClick={() => onSelectLevel(lvl)}
                title={CEFR_DESCRIPTIONS[lvl]}
                className={`relative px-2.5 py-1 text-xs font-mono font-medium rounded-md transition-colors whitespace-nowrap cursor-pointer disabled:cursor-not-allowed ${
                  active
                    ? "text-[var(--parlo-on-solid)]"
                    : "text-[var(--parlo-ink-muted)] hover:text-[var(--parlo-ink)]"
                }`}
              >
                {active && (
                  <motion.span
                    layoutId="parlo-tuner-cefr"
                    transition={SPRING_THUMB}
                    className="absolute inset-0 rounded-md bg-[var(--parlo-primary)] parlo-keycap-thumb"
                  />
                )}
                <span className="relative z-10">{lvl}</span>
              </motion.button>
            );
          })}
        </div>
      </div>

      {/* Regional Dialect Calibration Rail */}
      {dialects.length > 0 && onSelectDialect && (
        <div className="flex flex-wrap items-center gap-2.5">
          <span className="text-[11px] font-mono tracking-wide text-[var(--parlo-ink-muted)]">
            Dialect
          </span>
          <div
            className="inline-flex items-center gap-1 p-1 bg-[var(--parlo-canvas)] parlo-well-recessed rounded-lg"
            role="group"
            aria-label="Regional dialect accent"
          >
            {dialects.map((dialect) => {
              const active = dialect.id === activeDialectId;
              return (
                <motion.button
                  key={dialect.id}
                  type="button"
                  disabled={disabled}
                  whileTap={disabled ? undefined : { scale: 0.94 }}
                  onClick={() => onSelectDialect(dialect.id)}
                  title={`${dialect.regionTag} — e.g. “${dialect.signatureExpression}”`}
                  className={`relative px-2.5 py-1 text-xs font-medium rounded-md transition-colors whitespace-nowrap cursor-pointer disabled:cursor-not-allowed ${
                    active
                      ? "text-[var(--parlo-ink)]"
                      : "text-[var(--parlo-ink-muted)] hover:text-[var(--parlo-ink)]"
                  }`}
                >
                  {active && (
                    <motion.span
                      layoutId="parlo-tuner-dialect"
                      transition={SPRING_THUMB}
                      className="absolute inset-0 rounded-md bg-[var(--parlo-surface)] border border-[var(--parlo-border)]/80 parlo-keycap-thumb"
                    />
                  )}
                  <span className="relative z-10">{dialect.label}</span>
                </motion.button>
              );
            })}
          </div>
        </div>
      )}

      {/* Tactile Voice Persona Rail */}
      <div className="flex flex-col sm:flex-row sm:items-center gap-2 sm:gap-2.5 min-w-0">
        <span className="text-[11px] font-mono tracking-wide text-[var(--parlo-ink-muted)] shrink-0">
          Partner Voice
        </span>
        <div
          className="inline-flex items-center gap-1 p-1 bg-[var(--parlo-canvas)] parlo-well-recessed rounded-lg overflow-x-auto max-w-full no-scrollbar"
          role="group"
          aria-label="Partner voice persona"
        >
          {VOICE_PERSONAS.map((vp) => {
            const active = vp.id === voiceName;
            return (
              <motion.button
                key={vp.id}
                type="button"
                disabled={disabled}
                whileTap={disabled ? undefined : { scale: 0.94 }}
                onClick={() => onSelectVoice(vp.id)}
                title={`${vp.label} — ${vp.tone}`}
                className={`relative px-2.5 py-1.5 sm:py-1 text-xs font-medium rounded-md transition-colors whitespace-nowrap shrink-0 cursor-pointer disabled:cursor-not-allowed ${
                  active
                    ? "text-[var(--parlo-ink)]"
                    : "text-[var(--parlo-ink-muted)] hover:text-[var(--parlo-ink)]"
                }`}
              >
                {active && (
                  <motion.span
                    layoutId="parlo-tuner-voice"
                    transition={SPRING_THUMB}
                    className="absolute inset-0 rounded-md bg-[var(--parlo-surface)] border border-[var(--parlo-border)]/80 parlo-keycap-thumb"
                  />
                )}
                <span className="relative z-10">{vp.label}</span>
              </motion.button>
            );
          })}
        </div>
        <span className="hidden 2xl:inline text-xs text-[var(--parlo-ink-muted)]">
          {activePersona.tone}
        </span>
      </div>

      {/* Speaking Pace Rail */}
      <div className="flex flex-wrap items-center gap-2.5">
        <span className="text-[11px] font-mono tracking-wide text-[var(--parlo-ink-muted)]">
          Pace
        </span>
        <div
          className="inline-flex items-center gap-1 p-1 bg-[var(--parlo-canvas)] parlo-well-recessed rounded-lg"
          role="group"
          aria-label="Partner speaking pace"
        >
          {(["slow", "natural", "brisk"] as SpeakingPace[]).map((pace) => {
            const active = speakingPace === pace;
            return (
              <motion.button
                key={pace}
                type="button"
                disabled={disabled}
                whileTap={disabled ? undefined : { scale: 0.94 }}
                onClick={() => onChangeSpeakingPace(pace)}
                className={`relative px-2.5 py-1 text-xs font-medium rounded-md capitalize transition-colors whitespace-nowrap cursor-pointer disabled:cursor-not-allowed ${
                  active
                    ? "text-[var(--parlo-ink)]"
                    : "text-[var(--parlo-ink-muted)] hover:text-[var(--parlo-ink)]"
                }`}
              >
                {active && (
                  <motion.span
                    layoutId="parlo-tuner-pace"
                    transition={SPRING_THUMB}
                    className="absolute inset-0 rounded-md bg-[var(--parlo-surface)] border border-[var(--parlo-border)]/80 parlo-keycap-thumb"
                  />
                )}
                <span className="relative z-10">{pace}</span>
              </motion.button>
            );
          })}
        </div>
      </div>
    </div>
  );
}

export default StudioTunerBar;
