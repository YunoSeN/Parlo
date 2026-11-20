import { useState } from "react";
import { AnimatePresence, motion, useReducedMotion } from "motion/react";
import { Volume2 } from "lucide-react";
import { getCultureByLanguage } from "../lib/cultures";
import { speakWithBrowserTts } from "../lib/audio";
import { LanguageOption } from "../types";
import { CulturalMotifArt } from "./CulturalMotifArt";

export interface CulturalEtiquetteCardProps {
  language: LanguageOption;
}

/**
 * CulturalEtiquetteCard
 *
 * Tactile cultural rhythm & speaking etiquette micro-card rendered in the
 * Studio Coaching Deck. Displays an animated 9-bar spoken prosody contour
 * tailored to each language alongside a real etiquette insight and 1-tap audio.
 */
export function CulturalEtiquetteCard({ language }: CulturalEtiquetteCardProps) {
  const [playing, setPlaying] = useState(false);
  const prefersReducedMotion = useReducedMotion();
  const culture = getCultureByLanguage(language.code);

  const handleListen = () => {
    setPlaying(true);
    speakWithBrowserTts(culture.samplePhrase, language.speechLocale);
    window.setTimeout(() => setPlaying(false), 2200);
  };

  return (
    <div className="relative overflow-hidden rounded-xl border border-[var(--parlo-border)] bg-[var(--parlo-canvas)]/70 p-4 space-y-3">
      {/* Subtle CSS-masked cultural pattern in corner */}
      <div
        aria-hidden="true"
        data-culture={language.code}
        className="parlo-motif-overlay parlo-motif-corner"
      />

      <AnimatePresence mode="wait">
        <motion.div
          key={language.code}
          initial={prefersReducedMotion ? { opacity: 0 } : { opacity: 0, y: 6 }}
          animate={{ opacity: 1, y: 0 }}
          exit={prefersReducedMotion ? { opacity: 0 } : { opacity: 0, y: -5 }}
          transition={{ duration: 0.24, ease: [0.16, 1, 0.3, 1] }}
          className="relative z-10 space-y-2.5"
        >
          <div className="flex items-center justify-between gap-2">
            <div className="flex items-center gap-2.5 min-w-0">
              <CulturalMotifArt
                languageCode={language.code}
                variant="mini"
                className="w-8 h-8 rounded-lg"
              />
              <span className="text-[11px] font-mono tracking-wide text-[var(--parlo-accent)] truncate">
                {culture.atelierName} · Rhythm & Etiquette
              </span>
            </div>

            {/* Animated 9-bar language prosody contour */}
            <div
              aria-hidden="true"
              className="inline-flex items-end gap-[3px] h-4"
            >
              {culture.prosodyContour.map((weight, i) => (
                <motion.span
                  key={`${language.code}-bar-${i}`}
                  className="w-[3px] rounded-full bg-[var(--parlo-primary)]"
                  initial={{ height: 4 }}
                  animate={
                    playing && !prefersReducedMotion
                      ? {
                          height: [
                            Math.round(weight * 14) + 2,
                            Math.round(((weight + 0.35) % 1) * 14) + 2,
                            Math.round(weight * 14) + 2,
                          ],
                        }
                      : { height: Math.round(weight * 14) + 2 }
                  }
                  transition={
                    playing
                      ? {
                          type: "tween",
                          duration: 0.65,
                          delay: i * 0.05,
                          repeat: 2,
                          ease: "easeInOut",
                        }
                      : {
                          type: "spring",
                          stiffness: 360,
                          damping: 22,
                          delay: i * 0.025,
                        }
                  }
                />
              ))}
            </div>
          </div>

          <p className="text-xs font-semibold text-[var(--parlo-ink)]">
            {culture.etiquetteTitle}
          </p>
          <p className="text-xs text-[var(--parlo-ink-muted)] leading-relaxed">
            {culture.etiquetteBody}
          </p>

          <div className="pt-2 border-t border-[var(--parlo-border)]/70 flex items-start justify-between gap-3">
            <div className="min-w-0">
              <p className="text-xs font-medium text-[var(--parlo-ink)] leading-snug">
                “{culture.samplePhrase}”
              </p>
              {culture.sampleReading && (
                <p className="font-mono text-[11px] text-[var(--parlo-ink-muted)] mt-0.5">
                  {culture.sampleReading}
                </p>
              )}
              <p className="text-[11px] text-[var(--parlo-ink-muted)] mt-0.5">
                {culture.sampleMeaning}
              </p>
            </div>

            <motion.button
              type="button"
              whileHover={{ scale: 1.06 }}
              whileTap={{ scale: 0.94 }}
              onClick={handleListen}
              aria-label={`Listen to ${language.name} cultural phrase`}
              className="w-8 h-8 rounded-lg bg-[var(--parlo-surface)] border border-[var(--parlo-border)] hover:border-[var(--parlo-primary)] text-[var(--parlo-primary)] inline-flex items-center justify-center shrink-0 cursor-pointer transition-colors"
            >
              <Volume2 className="w-3.5 h-3.5" aria-hidden="true" />
            </motion.button>
          </div>
        </motion.div>
      </AnimatePresence>
    </div>
  );
}

export default CulturalEtiquetteCard;
