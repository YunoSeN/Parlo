import { useEffect } from "react";
import { AnimatePresence, motion, useReducedMotion } from "motion/react";
import {
  CloudRain,
  Disc3,
  Flame,
  Sparkles,
  Volume2,
  VolumeX,
  Waves,
  Wind,
  X,
} from "lucide-react";
import {
  SOUNDSCAPE_LAYERS,
  SoundscapeLayerId,
} from "../lib/ambientAudio";
import { sfxEngine } from "../lib/sfx";

export interface SoundscapePanelProps {
  open: boolean;
  onClose: () => void;
  activeLayers: SoundscapeLayerId[];
  ambientVolume: number;
  sfxEnabled: boolean;
  activeLanguageCode: string;
  onToggleLayer: (id: SoundscapeLayerId) => void;
  onMuteAllLayers: () => void;
  onChangeAmbientVolume: (vol: number) => void;
  onToggleSfx: () => void;
}

const LAYER_ICONS: Record<SoundscapeLayerId, typeof CloudRain> = {
  "cafe-rain": CloudRain,
  "evening-lounge": Disc3,
  "morning-breeze": Wind,
  "coastal-waves": Waves,
  "library-hearth": Flame,
};

const EASE_SMOOTH = [0.16, 1, 0.3, 1] as const;

export function SoundscapePanel({
  open,
  onClose,
  activeLayers,
  ambientVolume,
  sfxEnabled,
  activeLanguageCode,
  onToggleLayer,
  onMuteAllLayers,
  onChangeAmbientVolume,
  onToggleSfx,
}: SoundscapePanelProps) {
  const prefersReducedMotion = useReducedMotion();

  useEffect(() => {
    if (!open) return;
    const onKeyDown = (e: KeyboardEvent) => {
      if (e.key === "Escape") {
        e.preventDefault();
        onClose();
      }
    };
    window.addEventListener("keydown", onKeyDown);
    return () => window.removeEventListener("keydown", onKeyDown);
  }, [open, onClose]);

  const volumePct = Math.round((ambientVolume / 0.65) * 100);

  return (
    <AnimatePresence>
      {open && (
        <>
          <motion.div
            key="soundscape-backdrop"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.16 }}
            onClick={onClose}
            aria-hidden="true"
            className="fixed inset-0 z-40 bg-black/20 backdrop-blur-[2px] sm:bg-transparent sm:backdrop-blur-none"
          />

          <motion.section
            key="soundscape-panel"
            role="dialog"
            aria-modal="false"
            aria-label="Soundscapes and UI SFX Mixer"
            initial={
              prefersReducedMotion
                ? { opacity: 0 }
                : { opacity: 0, y: 18, scale: 0.95, filter: "blur(4px)" }
            }
            animate={{ opacity: 1, y: 0, scale: 1, filter: "blur(0px)" }}
            exit={
              prefersReducedMotion
                ? { opacity: 0 }
                : { opacity: 0, y: 14, scale: 0.96, filter: "blur(3px)" }
            }
            transition={{ duration: 0.22, ease: EASE_SMOOTH }}
            className="fixed bottom-[74px] md:bottom-[72px] left-1/2 -translate-x-1/2 sm:left-auto sm:translate-x-0 sm:right-5 z-50 w-[min(380px,calc(100vw-1.25rem))] max-h-[76dvh] overflow-y-auto rounded-2xl border border-[var(--parlo-border)] bg-[var(--parlo-surface-solid)]/96 backdrop-blur-2xl shadow-[0_24px_64px_-16px_rgba(0,0,0,0.58)]"
          >
            {/* Cultural top horizon accent */}
            <div
              aria-hidden="true"
              className="h-[2px] w-full"
              style={{
                background:
                  "linear-gradient(90deg, var(--parlo-primary) 0%, var(--parlo-accent) 65%, transparent 100%)",
              }}
            />

            {/* Header */}
            <div className="px-4 pt-3.5 pb-3 border-b border-[var(--parlo-border)] flex items-center justify-between gap-2">
              <div>
                <div className="flex items-center gap-2">
                  <h2 className="font-display text-sm font-semibold text-[var(--parlo-ink)]">
                    Soundscapes & SFX
                  </h2>
                  <AnimatePresence>
                    {activeLayers.length > 0 && (
                      <motion.span
                        initial={{ opacity: 0, scale: 0.7 }}
                        animate={{ opacity: 1, scale: 1 }}
                        exit={{ opacity: 0, scale: 0.7 }}
                        transition={{ duration: 0.16 }}
                        className="px-1.5 py-0.5 rounded-md bg-[var(--parlo-primary-soft)] text-[var(--parlo-primary)] font-mono text-[10px] font-semibold"
                      >
                        {activeLayers.length} active
                      </motion.span>
                    )}
                  </AnimatePresence>
                </div>
                <p className="text-[11px] text-[var(--parlo-ink-muted)] mt-0.5">
                  Layer procedural atmospheres · auto-ducks during speech
                </p>
              </div>

              <div className="flex items-center gap-1 shrink-0">
                <AnimatePresence>
                  {activeLayers.length > 0 && (
                    <motion.button
                      initial={{ opacity: 0, scale: 0.85 }}
                      animate={{ opacity: 1, scale: 1 }}
                      exit={{ opacity: 0, scale: 0.85 }}
                      transition={{ duration: 0.15 }}
                      type="button"
                      onClick={onMuteAllLayers}
                      className="inline-flex items-center gap-1 px-2 py-1 rounded-lg border border-[var(--parlo-border)] bg-[var(--parlo-canvas)] text-[10px] font-mono text-[var(--parlo-ink-muted)] hover:text-[var(--parlo-ink)] transition-colors cursor-pointer"
                    >
                      <VolumeX className="w-3 h-3" aria-hidden="true" />
                      Mute All
                    </motion.button>
                  )}
                </AnimatePresence>

                <button
                  type="button"
                  onClick={onClose}
                  aria-label="Close Soundscapes panel"
                  className="p-1.5 rounded-lg text-[var(--parlo-ink-muted)] hover:text-[var(--parlo-ink)] hover:bg-[var(--parlo-canvas)] transition-colors cursor-pointer"
                >
                  <X className="w-4 h-4" aria-hidden="true" />
                </button>
              </div>
            </div>

            {/* Soundscape Layer Toggles */}
            <div className="p-3.5 space-y-2">
              {SOUNDSCAPE_LAYERS.map((layer) => {
                const active = activeLayers.includes(layer.id);
                const Icon = LAYER_ICONS[layer.id];

                return (
                  <button
                    key={layer.id}
                    type="button"
                    role="switch"
                    aria-checked={active}
                    onClick={() => onToggleLayer(layer.id)}
                    className={`w-full flex items-center justify-between gap-3 px-3 py-2.5 rounded-xl border text-left transition-all cursor-pointer ${
                      active
                        ? "bg-[var(--parlo-primary-soft)] border-[var(--parlo-primary)]/55 text-[var(--parlo-ink)] shadow-xs"
                        : "bg-[var(--parlo-canvas)]/70 border-[var(--parlo-border)] text-[var(--parlo-ink-secondary)] hover:border-[var(--parlo-ink-muted)]/55 hover:text-[var(--parlo-ink)]"
                    }`}
                  >
                    <div className="flex items-center gap-2.5 min-w-0">
                      <span
                        className={`w-8 h-8 rounded-lg border flex items-center justify-center shrink-0 transition-colors ${
                          active
                            ? "bg-[var(--parlo-primary)] border-[var(--parlo-primary)] text-[var(--parlo-on-solid)]"
                            : "bg-[var(--parlo-surface)] border-[var(--parlo-border)] text-[var(--parlo-ink-muted)]"
                        }`}
                      >
                        <Icon className="w-4 h-4" aria-hidden="true" />
                      </span>
                      <div className="min-w-0">
                        <p className="text-xs font-semibold text-[var(--parlo-ink)] truncate">
                          {layer.label}
                        </p>
                        <p className="text-[11px] text-[var(--parlo-ink-muted)] truncate">
                          {layer.tagline}
                        </p>
                      </div>
                    </div>

                    <div className="flex items-center gap-2.5 shrink-0">
                      {/* Animated mini equalizer bars when layer is active */}
                      <AnimatePresence>
                        {active && (
                          <motion.span
                            initial={{ opacity: 0, scale: 0.7 }}
                            animate={{ opacity: 1, scale: 1 }}
                            exit={{ opacity: 0, scale: 0.7 }}
                            transition={{ duration: 0.16 }}
                            aria-hidden="true"
                            className="inline-flex items-end gap-[2px] h-3.5"
                          >
                            {[0, 1, 2].map((bar) => (
                              <motion.span
                                key={bar}
                                className="w-[2.5px] rounded-full bg-[var(--parlo-primary)]"
                                animate={
                                  prefersReducedMotion
                                    ? { height: 8 }
                                    : {
                                        height:
                                          bar === 1
                                            ? [5, 13, 6]
                                            : [9, 4, 11],
                                      }
                                }
                                transition={{
                                  type: "tween",
                                  duration: 1.05 + bar * 0.22,
                                  repeat: Infinity,
                                  ease: "easeInOut",
                                }}
                              />
                            ))}
                          </motion.span>
                        )}
                      </AnimatePresence>

                      {/* Physical toggle pill */}
                      <span
                        aria-hidden="true"
                        className={`relative w-9 h-5 rounded-full border transition-colors flex items-center px-0.5 ${
                          active
                            ? "bg-[var(--parlo-primary)] border-[var(--parlo-primary)]"
                            : "bg-[var(--parlo-surface)] border-[var(--parlo-border)]"
                        }`}
                      >
                        <motion.span
                          layout
                          transition={{
                            type: "spring",
                            stiffness: 500,
                            damping: 32,
                          }}
                          className={`w-3.5 h-3.5 rounded-full shadow-xs ${
                            active
                              ? "ml-auto bg-[var(--parlo-on-solid)]"
                              : "mr-auto bg-[var(--parlo-ink-muted)]"
                          }`}
                        />
                      </span>
                    </div>
                  </button>
                );
              })}

              {/* Ambient Master Volume */}
              <div className="pt-2 px-1">
                <div className="flex items-center justify-between text-[11px] mb-1.5">
                  <span className="inline-flex items-center gap-1.5 font-medium text-[var(--parlo-ink-secondary)]">
                    <Volume2
                      className="w-3.5 h-3.5 text-[var(--parlo-primary)]"
                      aria-hidden="true"
                    />
                    Ambience Level
                  </span>
                  <span className="font-mono text-[var(--parlo-ink-muted)] tabular-nums">
                    {volumePct}%
                  </span>
                </div>
                <input
                  type="range"
                  min={0.04}
                  max={0.65}
                  step={0.01}
                  value={ambientVolume}
                  onChange={(e) => onChangeAmbientVolume(Number(e.target.value))}
                  aria-label="Soundscape ambience volume"
                  className="w-full accent-[var(--parlo-primary)] cursor-pointer"
                />
              </div>
            </div>

            {/* Tactile UI Sound Effects (SFX) Section */}
            <div className="px-3.5 py-3 border-t border-[var(--parlo-border)] bg-[var(--parlo-surface)]/75 space-y-2.5">
              <div className="flex items-center justify-between gap-3">
                <div className="flex items-center gap-2">
                  <Sparkles
                    className={`w-3.5 h-3.5 ${
                      sfxEnabled
                        ? "text-[var(--parlo-accent)]"
                        : "text-[var(--parlo-ink-muted)]"
                    }`}
                    aria-hidden="true"
                  />
                  <div>
                    <p className="text-xs font-semibold text-[var(--parlo-ink)]">
                      Tactile UI SFX
                    </p>
                    <p className="text-[10px] text-[var(--parlo-ink-muted)]">
                      Navigation taps, culture chimes & session cues
                    </p>
                  </div>
                </div>

                <button
                  type="button"
                  role="switch"
                  aria-checked={sfxEnabled}
                  onClick={onToggleSfx}
                  className={`relative w-10 h-5 rounded-full border transition-colors flex items-center px-0.5 cursor-pointer ${
                    sfxEnabled
                      ? "bg-[var(--parlo-accent)] border-[var(--parlo-accent)]"
                      : "bg-[var(--parlo-canvas)] border-[var(--parlo-border)]"
                  }`}
                >
                  <motion.span
                    layout
                    transition={{ type: "spring", stiffness: 500, damping: 32 }}
                    className={`w-3.5 h-3.5 rounded-full shadow-xs ${
                      sfxEnabled
                        ? "ml-auto bg-[var(--parlo-on-solid)]"
                        : "mr-auto bg-[var(--parlo-ink-muted)]"
                    }`}
                  />
                </button>
              </div>

              {/* Quick SFX Audition Row */}
              <div className="flex items-center justify-between gap-1.5 pt-0.5">
                <span className="text-[10px] font-mono text-[var(--parlo-ink-muted)]">
                  Preview SFX
                </span>
                <div className="flex items-center gap-1.5">
                  <button
                    type="button"
                    disabled={!sfxEnabled}
                    onClick={() => sfxEngine.playCultureMorph(activeLanguageCode)}
                    className="px-2 py-1 rounded-md border border-[var(--parlo-border)] bg-[var(--parlo-canvas)] text-[10px] font-mono text-[var(--parlo-ink-secondary)] hover:text-[var(--parlo-ink)] hover:border-[var(--parlo-primary)]/50 disabled:opacity-40 transition-colors cursor-pointer"
                  >
                    Chime
                  </button>
                  <button
                    type="button"
                    disabled={!sfxEnabled}
                    onClick={() => sfxEngine.playToggle(true)}
                    className="px-2 py-1 rounded-md border border-[var(--parlo-border)] bg-[var(--parlo-canvas)] text-[10px] font-mono text-[var(--parlo-ink-secondary)] hover:text-[var(--parlo-ink)] hover:border-[var(--parlo-primary)]/50 disabled:opacity-40 transition-colors cursor-pointer"
                  >
                    Click
                  </button>
                  <button
                    type="button"
                    disabled={!sfxEnabled}
                    onClick={() => sfxEngine.playSavePhrase()}
                    className="px-2 py-1 rounded-md border border-[var(--parlo-border)] bg-[var(--parlo-canvas)] text-[10px] font-mono text-[var(--parlo-ink-secondary)] hover:text-[var(--parlo-ink)] hover:border-[var(--parlo-primary)]/50 disabled:opacity-40 transition-colors cursor-pointer"
                  >
                    Sparkle
                  </button>
                </div>
              </div>
            </div>
          </motion.section>
        </>
      )}
    </AnimatePresence>
  );
}

export default SoundscapePanel;
