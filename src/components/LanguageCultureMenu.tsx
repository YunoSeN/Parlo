import { useEffect, useRef, useState } from "react";
import { AnimatePresence, motion } from "motion/react";
import { Check, ChevronDown } from "lucide-react";
import { LANGUAGES } from "../data/catalog";
import { getCultureByLanguage } from "../lib/cultures";
import { CulturalMotifArt } from "./CulturalMotifArt";
import { LanguageFlagBadge } from "./LanguageFlagBadge";

export interface LanguageCultureMenuProps {
  activeLanguageCode: string;
  onSelectLanguage: (code: string) => void;
}

/**
 * LanguageCultureMenu
 *
 * Compact, single-line header popover replacing repetitive per-page language bars.
 * Lets users transform the entire app's cultural theme, palette, and live ambient
 * background effect in one click from any view without cluttering page layouts.
 */
export function LanguageCultureMenu({
  activeLanguageCode,
  onSelectLanguage,
}: LanguageCultureMenuProps) {
  const [open, setOpen] = useState(false);
  const containerRef = useRef<HTMLDivElement | null>(null);
  const activeCulture = getCultureByLanguage(activeLanguageCode);

  useEffect(() => {
    if (!open) return;
    const onPointerDown = (e: PointerEvent) => {
      if (
        containerRef.current &&
        !containerRef.current.contains(e.target as Node)
      ) {
        setOpen(false);
      }
    };
    const onKeyDown = (e: KeyboardEvent) => {
      if (e.key === "Escape") setOpen(false);
    };
    document.addEventListener("pointerdown", onPointerDown);
    window.addEventListener("keydown", onKeyDown);
    return () => {
      document.removeEventListener("pointerdown", onPointerDown);
      window.removeEventListener("keydown", onKeyDown);
    };
  }, [open]);

  return (
    <div ref={containerRef} className="relative shrink-0">
      <motion.button
        type="button"
        whileHover={{ y: -1 }}
        whileTap={{ scale: 0.97 }}
        onClick={() => setOpen((prev) => !prev)}
        aria-expanded={open}
        aria-haspopup="menu"
        title={`Active language & cultural theme: ${activeCulture.atelierName}`}
        className="inline-flex items-center gap-2 px-2.5 py-1.5 rounded-lg border border-[var(--parlo-border)] bg-[var(--parlo-surface)] hover:border-[var(--parlo-ink-muted)] text-xs font-medium text-[var(--parlo-ink)] transition-colors whitespace-nowrap shrink-0 cursor-pointer"
      >
        <LanguageFlagBadge code={activeLanguageCode} size="sm" />
        <span className="font-mono uppercase text-[11px] font-semibold tracking-tight">
          {activeLanguageCode}
        </span>
        <span className="hidden sm:inline text-[var(--parlo-ink-muted)] font-normal max-w-[92px] truncate">
          {activeCulture.atelierName}
        </span>
        <ChevronDown
          className={`w-3.5 h-3.5 text-[var(--parlo-ink-muted)] transition-transform duration-200 ${
            open ? "rotate-180" : ""
          }`}
          aria-hidden="true"
        />
      </motion.button>

      <AnimatePresence>
        {open && (
          <motion.div
            role="menu"
            aria-label="Choose language and cultural theme"
            initial={{ opacity: 0, y: 8, scale: 0.97 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: 6, scale: 0.97 }}
            transition={{ duration: 0.18, ease: [0.16, 1, 0.3, 1] }}
            className="absolute right-0 mt-2 w-[min(380px,calc(100vw-1.5rem))] rounded-2xl bg-[var(--parlo-surface-solid)]/96 backdrop-blur-xl border border-[var(--parlo-border)] parlo-card-tactile overflow-hidden z-50"
          >
            <div className="px-4 py-3 border-b border-[var(--parlo-border)]/75 flex items-center justify-between gap-2 bg-[var(--parlo-surface-alt)]">
              <span className="text-xs font-semibold text-[var(--parlo-ink)]">
                Language & Atmosphere
              </span>
              <span className="text-[11px] font-mono text-[var(--parlo-primary)]">
                {activeCulture.waveformName}
              </span>
            </div>

            <div className="p-2 grid grid-cols-2 gap-1.5">
              {LANGUAGES.map((lang) => {
                const selected = lang.code === activeLanguageCode;
                const cult = getCultureByLanguage(lang.code);
                return (
                  <button
                    key={lang.code}
                    type="button"
                    role="menuitemradio"
                    aria-checked={selected}
                    onClick={() => {
                      onSelectLanguage(lang.code);
                      setOpen(false);
                    }}
                    className={`group flex items-center gap-2.5 p-2 rounded-xl border text-left transition-all cursor-pointer ${
                      selected
                        ? "bg-[var(--parlo-primary-soft)] border-[var(--parlo-primary)] text-[var(--parlo-ink)]"
                        : "bg-transparent border-transparent hover:bg-[var(--parlo-surface-alt)] hover:border-[var(--parlo-border)] text-[var(--parlo-ink-secondary)]"
                    }`}
                  >
                    <CulturalMotifArt
                      languageCode={lang.code}
                      variant="mini"
                      className="w-9 h-9 rounded-xl"
                    />
                    <div className="min-w-0 flex-1">
                      <div className="flex items-center justify-between gap-1">
                        <span className="text-xs font-semibold text-[var(--parlo-ink)] truncate">
                          {lang.nativeName}
                        </span>
                        {selected && (
                          <Check
                            className="w-3.5 h-3.5 text-[var(--parlo-primary)] shrink-0"
                            aria-hidden="true"
                          />
                        )}
                      </div>
                      <p className="text-[11px] text-[var(--parlo-ink-muted)] truncate">
                        {cult.atelierName}
                      </p>
                    </div>
                  </button>
                );
              })}
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}

export default LanguageCultureMenu;
