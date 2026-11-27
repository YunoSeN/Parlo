import { useRef, useState } from "react";
import {
  AnimatePresence,
  motion,
  MotionValue,
  useMotionValue,
  useReducedMotion,
  useSpring,
  useTransform,
} from "motion/react";
import { Compass, MoreHorizontal, Moon, Sun, X } from "lucide-react";
import { CountryFontSpec, getCultureByLanguage } from "../lib/cultures";
import { sfxEngine } from "../lib/sfx";
import { AppView } from "../types";
import { DockIconId, DockNavIcon } from "./DockNavIcon";
import { LanguageFlagBadge } from "./LanguageFlagBadge";

export interface MagnificationDockProps {
  activeView: AppView;
  onNavigate: (view: AppView) => void;
  categoryFonts: Record<AppView, CountryFontSpec>;
  activeLanguageCode: string;
  isSessionActive: boolean;
  savedPhrasesCount: number;
  chatOpen: boolean;
  chatMessageCount: number;
  soundPanelOpen: boolean;
  activeSoundLayersCount: number;
  isDarkTheme?: boolean;
  onToggleTheme?: () => void;
  onOpenOnboarding?: () => void;
  onToggleChat: () => void;
  onToggleSoundPanel: () => void;
  onToggleVoiceSession: () => void;
  onOpenCommandPalette: () => void;
  onSpeakCultureProverb: () => void;
}

interface DockDestination {
  id: AppView;
  label: string;
  shortcut: string;
  iconId: DockIconId;
}

const PRIMARY_DESTINATIONS: DockDestination[] = [
  { id: "studio", label: "Practice", shortcut: "1", iconId: "studio" },
  { id: "scenarios", label: "Scenarios", shortcut: "2", iconId: "scenarios" },
  { id: "phrasebook", label: "Words", shortcut: "3", iconId: "phrasebook" },
  { id: "review", label: "Progress", shortcut: "4", iconId: "review" },
];

// Compact, refined desktop macOS dock dimensions
const BASE_ICON_SIZE = 36;
const MAX_ICON_SIZE = 48;
const MAGNIFY_RANGE = 104;
const EASE_EXIT = [0.16, 1, 0.3, 1] as const;

interface DockIconTileProps {
  mouseX: MotionValue<number>;
  label: string;
  sublabel?: string;
  shortcut?: string;
  countryFont?: CountryFontSpec;
  active?: boolean;
  highlightTone?: "primary" | "danger" | "neutral";
  badgeCount?: number;
  livePulse?: boolean;
  iconId: DockIconId;
  onClick: () => void;
}

function DockIconTile({
  mouseX,
  label,
  sublabel,
  shortcut,
  countryFont,
  active = false,
  highlightTone = "neutral",
  badgeCount,
  livePulse = false,
  iconId,
  onClick,
}: DockIconTileProps) {
  const tileRef = useRef<HTMLButtonElement | null>(null);
  const [hovered, setHovered] = useState(false);
  const prefersReducedMotion = useReducedMotion();

  const distance = useTransform(mouseX, (val) => {
    if (prefersReducedMotion || val === Infinity) return MAGNIFY_RANGE + 1;
    const rect = tileRef.current?.getBoundingClientRect();
    if (!rect) return MAGNIFY_RANGE + 1;
    return val - (rect.left + rect.width / 2);
  });

  const rawSize = useTransform(
    distance,
    [-MAGNIFY_RANGE, 0, MAGNIFY_RANGE],
    [BASE_ICON_SIZE, MAX_ICON_SIZE, BASE_ICON_SIZE]
  );
  const size = useSpring(rawSize, {
    mass: 0.13,
    stiffness: 280,
    damping: 19,
  });

  const rawLift = useTransform(
    distance,
    [-MAGNIFY_RANGE, 0, MAGNIFY_RANGE],
    [0, -7, 0]
  );
  const liftY = useSpring(rawLift, {
    mass: 0.13,
    stiffness: 280,
    damping: 19,
  });

  const iconScale = useTransform(
    size,
    [BASE_ICON_SIZE, MAX_ICON_SIZE],
    [1, 1.24]
  );

  const toneClasses =
    highlightTone === "danger"
      ? "bg-red-500/18 border-red-400/50 text-red-400 hover:bg-red-500/26 shadow-[0_4px_14px_rgba(239,68,68,0.2)]"
      : highlightTone === "primary"
      ? "bg-[color-mix(in_srgb,var(--parlo-primary)_16%,var(--parlo-surface-solid))] border-[color-mix(in_srgb,var(--parlo-primary)_52%,transparent)] text-[var(--parlo-primary)] shadow-[0_4px_14px_color-mix(in_srgb,var(--parlo-primary)_16%,transparent)]"
      : active
      ? "bg-[var(--parlo-surface-solid)] border-[color-mix(in_srgb,var(--parlo-primary)_68%,var(--parlo-border))] text-[var(--parlo-primary)] shadow-[0_6px_16px_color-mix(in_srgb,var(--parlo-primary)_22%,transparent)]"
      : "bg-[var(--parlo-surface)]/92 border-[var(--parlo-border)]/80 text-[var(--parlo-ink-secondary)] hover:text-[var(--parlo-ink)] hover:border-[color-mix(in_srgb,var(--parlo-primary)_42%,var(--parlo-border))]";

  return (
    <div className="relative flex flex-col items-center justify-end">
      {/* Floating Glass Tooltip rendered in this category's random country font with crisp exit */}
      <AnimatePresence>
        {hovered && (
          <motion.div
            initial={
              prefersReducedMotion
                ? { opacity: 0 }
                : { opacity: 0, y: 8, scale: 0.92, filter: "blur(3px)" }
            }
            animate={{ opacity: 1, y: 0, scale: 1, filter: "blur(0px)" }}
            exit={
              prefersReducedMotion
                ? { opacity: 0 }
                : { opacity: 0, y: 5, scale: 0.93, filter: "blur(2px)" }
            }
            transition={{ duration: 0.15, ease: EASE_EXIT }}
            role="tooltip"
            className="pointer-events-none absolute -top-11 left-1/2 -translate-x-1/2 z-50 px-2.5 py-1 rounded-lg bg-[var(--parlo-surface-solid)]/96 border border-[var(--parlo-border)] shadow-xl backdrop-blur-xl whitespace-nowrap flex items-center gap-1.5"
          >
            {countryFont && (
              <LanguageFlagBadge code={countryFont.code} size="xs" />
            )}
            <AnimatePresence mode="wait" initial={false}>
              <motion.span
                key={countryFont ? `${label}-${countryFont.code}` : label}
                initial={{ opacity: 0, y: -3 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: 3 }}
                transition={{ duration: 0.14, ease: EASE_EXIT }}
                style={
                  countryFont
                    ? {
                        fontFamily: countryFont.fontFamily,
                        fontStyle: countryFont.fontStyle,
                        letterSpacing: countryFont.letterSpacing,
                      }
                    : undefined
                }
                className="text-[12px] font-medium text-[var(--parlo-ink)] leading-none"
              >
                {label}
              </motion.span>
            </AnimatePresence>
            {sublabel && (
              <span className="text-[9.5px] font-mono text-[var(--parlo-ink-muted)] leading-none">
                · {sublabel}
              </span>
            )}
            {shortcut && (
              <kbd className="ml-0.5 px-1 py-0.5 text-[9px] font-mono rounded bg-[var(--parlo-canvas)] border border-[var(--parlo-border)] text-[var(--parlo-ink-muted)] leading-none">
                {shortcut}
              </kbd>
            )}
          </motion.div>
        )}
      </AnimatePresence>

      {/* Magnifying Icon-Only Squircle Tile */}
      <motion.button
        ref={tileRef}
        type="button"
        onClick={onClick}
        onMouseEnter={() => setHovered(true)}
        onMouseLeave={() => setHovered(false)}
        onFocus={() => setHovered(true)}
        onBlur={() => setHovered(false)}
        whileTap={prefersReducedMotion ? undefined : { scale: 0.88 }}
        aria-label={sublabel ? `${label} (${sublabel})` : label}
        aria-current={active ? "page" : undefined}
        style={{
          width: prefersReducedMotion ? BASE_ICON_SIZE : size,
          height: prefersReducedMotion ? BASE_ICON_SIZE : size,
          y: prefersReducedMotion ? 0 : liftY,
        }}
        className={`relative flex items-center justify-center rounded-[11px] border backdrop-blur-md transition-colors cursor-pointer shrink-0 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[var(--parlo-primary)] ${toneClasses}`}
      >
        {/* Subtle top specular glass bevel */}
        <span
          aria-hidden="true"
          className="pointer-events-none absolute inset-[1px] rounded-[10px] bg-gradient-to-b from-white/18 via-white/[0.03] to-transparent opacity-70"
        />

        {/* Soft hover luminous wash with clean enter/exit */}
        <AnimatePresence>
          {hovered && !active && (
            <motion.span
              aria-hidden="true"
              initial={{ opacity: 0, scale: 0.85 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.9 }}
              transition={{ duration: 0.15, ease: EASE_EXIT }}
              className="pointer-events-none absolute inset-0 rounded-[10px]"
              style={{
                background:
                  "radial-gradient(circle at 50% 24%, color-mix(in srgb, var(--parlo-primary) 16%, transparent), transparent 74%)",
              }}
            />
          )}
        </AnimatePresence>

        {/* Active ambient cultural aura inside tile */}
        <AnimatePresence>
          {active && (
            <motion.span
              layoutId="parlo-dock-active-aura"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0, scale: 0.88 }}
              transition={{ type: "spring", stiffness: 420, damping: 28 }}
              aria-hidden="true"
              className="pointer-events-none absolute inset-0 rounded-[10px]"
              style={{
                background:
                  "radial-gradient(circle at 50% 22%, color-mix(in srgb, var(--parlo-primary) 26%, transparent), color-mix(in srgb, var(--parlo-accent) 10%, transparent) 55%, transparent 78%)",
              }}
            />
          )}
        </AnimatePresence>

        {/* Live broadcast ring with smooth exit */}
        <AnimatePresence>
          {livePulse && !prefersReducedMotion && (
            <motion.span
              aria-hidden="true"
              initial={{ scale: 0.9, opacity: 0 }}
              animate={{ scale: [1, 1.2, 1], opacity: [0.55, 0.14, 0.55] }}
              exit={{ scale: 1.26, opacity: 0 }}
              transition={{
                scale: {
                  type: "tween",
                  duration: 1.8,
                  repeat: Infinity,
                  ease: "easeInOut",
                },
                opacity: {
                  type: "tween",
                  duration: 1.8,
                  repeat: Infinity,
                  ease: "easeInOut",
                },
              }}
              className="pointer-events-none absolute -inset-0.5 rounded-[12px] border border-[var(--parlo-accent)]"
            />
          )}
        </AnimatePresence>

        {/* Bespoke Duotone Animated Navigation Glyph */}
        <motion.span
          style={{ scale: prefersReducedMotion ? 1 : iconScale }}
          className="relative z-10 inline-flex items-center justify-center"
        >
          <DockNavIcon
            id={iconId}
            active={active}
            hovered={hovered}
            live={livePulse}
            className="w-[17px] h-[17px]"
          />
        </motion.span>

        {/* Numeric badge counter */}
        <AnimatePresence>
          {typeof badgeCount === "number" && badgeCount > 0 && (
            <motion.span
              key="badge"
              initial={prefersReducedMotion ? { opacity: 0 } : { opacity: 0, scale: 0.4 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={prefersReducedMotion ? { opacity: 0 } : { opacity: 0, scale: 0.4 }}
              transition={{ duration: 0.16, ease: EASE_EXIT }}
              aria-hidden="true"
              className="absolute -top-1 -right-1 z-20 min-w-[14px] h-[14px] px-1 rounded-full bg-[var(--parlo-accent)] text-[var(--parlo-on-solid)] font-mono text-[8.5px] font-bold flex items-center justify-center tabular-nums shadow-sm"
            >
              {badgeCount > 99 ? "99+" : badgeCount}
            </motion.span>
          )}
        </AnimatePresence>
      </motion.button>

      {/* Authentic Apple Dock Active Indicator Dot */}
      <span className="h-1.5 flex items-center justify-center mt-0.5">
        <AnimatePresence>
          {active && (
            <motion.span
              layoutId="parlo-dock-active-dot"
              initial={{ opacity: 0, scale: 0 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0 }}
              transition={{ type: "spring", stiffness: 480, damping: 30 }}
              className="w-1 h-1 rounded-full bg-[var(--parlo-primary)] shadow-[0_0_6px_var(--parlo-primary)]"
            />
          )}
        </AnimatePresence>
      </span>
    </div>
  );
}

/**
 * MagnificationDock
 *
 * Dual-ergonomic navigation:
 * - Desktop (md+): Compact Apple macOS-inspired icon-only magnification dock.
 * - Phone (< md): Thumb-zone 5-slot bottom navigation bar (<= 62px + safe area)
 *   with a center Live Voice button and a slide-up "More" bottom sheet housing
 *   secondary views & audio utilities with >= 44px touch targets.
 */
export function MagnificationDock({
  activeView,
  onNavigate,
  categoryFonts,
  activeLanguageCode,
  isSessionActive,
  savedPhrasesCount,
  chatOpen,
  chatMessageCount,
  soundPanelOpen,
  activeSoundLayersCount,
  isDarkTheme = true,
  onToggleTheme,
  onOpenOnboarding,
  onToggleChat,
  onToggleSoundPanel,
  onToggleVoiceSession,
  onOpenCommandPalette,
  onSpeakCultureProverb,
}: MagnificationDockProps) {
  const mouseX = useMotionValue(Infinity);
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const prefersReducedMotion = useReducedMotion();
  const culture = getCultureByLanguage(activeLanguageCode);

  const secondaryViewActive =
    activeView === "spatial" ||
    activeView === "review" ||
    activeView === "pricing";

  const toggleMobileMenu = () => {
    setMobileMenuOpen((prev) => {
      const next = !prev;
      if (next) sfxEngine.playOpenModal();
      else sfxEngine.playCloseModal();
      return next;
    });
  };

  return (
    <>
      {/* DESKTOP COMPACT MACOS MAGNIFICATION DOCK (md and up) */}
      <div className="hidden md:block fixed bottom-2.5 left-1/2 -translate-x-1/2 z-40 pointer-events-none px-3 max-w-[98vw]">
        <nav
          aria-label="Primary studio dock"
          onMouseMove={(e) => mouseX.set(e.clientX)}
          onMouseLeave={() => mouseX.set(Infinity)}
          className="pointer-events-auto relative flex items-end gap-1.5 px-2 pt-1.5 pb-0.5 rounded-[18px] bg-[var(--parlo-shell)]/86 backdrop-blur-2xl border border-[var(--parlo-border)]/85 shadow-[0_14px_38px_-10px_rgba(0,0,0,0.44),0_0_0_1px_rgba(255,255,255,0.06)_inset]"
        >
          {/* Subtle cultural horizon sheen along top edge */}
          <span
            aria-hidden="true"
            className="pointer-events-none absolute inset-x-5 top-0 h-[1px] opacity-80"
            style={{
              background:
                "linear-gradient(90deg, transparent 0%, var(--parlo-primary) 35%, var(--parlo-accent) 65%, transparent 100%)",
            }}
          />

          {/* Core 4 Learning Loop Views: Practice · Scenarios · Words · Progress */}
          {PRIMARY_DESTINATIONS.map((dest) => {
            const catFont = categoryFonts[dest.id];
            return (
              <DockIconTile
                key={dest.id}
                mouseX={mouseX}
                label={dest.label}
                sublabel={catFont?.city}
                shortcut={dest.shortcut}
                countryFont={catFont}
                active={activeView === dest.id}
                badgeCount={dest.id === "phrasebook" ? savedPhrasesCount : undefined}
                livePulse={dest.id === "studio" && isSessionActive}
                iconId={dest.iconId}
                onClick={() => onNavigate(dest.id)}
              />
            );
          })}

          {/* Hairline Divider */}
          <span
            aria-hidden="true"
            className="self-center w-[1px] h-5 mx-0.5 bg-[var(--parlo-border)]/90 mb-1.5 shrink-0"
          />

          {/* Utility 1: Live Voice Session */}
          <DockIconTile
            mouseX={mouseX}
            label={isSessionActive ? "End Voice Session" : "Start Speaking"}
            sublabel={isSessionActive ? "On Air" : culture.atelierName}
            highlightTone={isSessionActive ? "danger" : "primary"}
            livePulse={isSessionActive}
            iconId={isSessionActive ? "voice-end" : "voice-live"}
            onClick={onToggleVoiceSession}
          />

          {/* Utility 2: 3D Immersion Rooms */}
          <DockIconTile
            mouseX={mouseX}
            label="3D Rooms"
            sublabel="Spatial Stage"
            shortcut="5"
            active={activeView === "spatial"}
            iconId="spatial"
            onClick={() => onNavigate("spatial")}
          />

          {/* Utility 3: Multi-Turn Tutor Chat */}
          <DockIconTile
            mouseX={mouseX}
            label={chatOpen ? "Close Tutor Chat" : "Tutor Chat"}
            sublabel="Multi-Turn"
            shortcut="⌘J"
            active={chatOpen}
            badgeCount={!chatOpen && chatMessageCount > 0 ? chatMessageCount : undefined}
            iconId="tutor-chat"
            onClick={onToggleChat}
          />

          {/* Utility 4: Soundscapes & SFX Mixer */}
          <DockIconTile
            mouseX={mouseX}
            label={soundPanelOpen ? "Close Soundscapes" : "Soundscapes"}
            sublabel={
              activeSoundLayersCount > 0
                ? `${activeSoundLayersCount} playing`
                : "Ambience"
            }
            shortcut="⌘M"
            active={soundPanelOpen}
            livePulse={activeSoundLayersCount > 0}
            badgeCount={
              !soundPanelOpen && activeSoundLayersCount > 0
                ? activeSoundLayersCount
                : undefined
            }
            iconId="soundscape"
            onClick={onToggleSoundPanel}
          />

          {/* Utility 5: Command Palette */}
          <DockIconTile
            mouseX={mouseX}
            label="Quick Jump"
            shortcut="⌘K"
            iconId="command"
            onClick={onOpenCommandPalette}
          />
        </nav>
      </div>

      {/* MOBILE THUMB-ZONE BOTTOM NAVIGATION BAR (< md) */}
      <nav
        aria-label="Mobile studio navigation"
        className="md:hidden fixed bottom-0 inset-x-0 z-40 bg-[var(--parlo-shell)]/94 backdrop-blur-2xl border-t border-[var(--parlo-border)]/85 pb-[env(safe-area-inset-bottom)] shadow-[0_-8px_28px_rgba(0,0,0,0.22)]"
      >
        <div className="grid grid-cols-5 items-center h-[60px] px-1">
          {/* Slot 1: Studio */}
          <button
            type="button"
            onClick={() => {
              setMobileMenuOpen(false);
              onNavigate("studio");
            }}
            aria-current={activeView === "studio" ? "page" : undefined}
            className={`min-h-[48px] flex flex-col items-center justify-center gap-0.5 rounded-xl transition-colors cursor-pointer ${
              activeView === "studio"
                ? "text-[var(--parlo-primary)]"
                : "text-[var(--parlo-ink-muted)]"
            }`}
          >
            <DockNavIcon
              id="studio"
              active={activeView === "studio"}
              live={isSessionActive}
              className="w-[20px] h-[20px]"
            />
            <span className="text-[11px] font-medium leading-none">Practice</span>
          </button>

          {/* Slot 2: Scenarios */}
          <button
            type="button"
            onClick={() => {
              setMobileMenuOpen(false);
              onNavigate("scenarios");
            }}
            aria-current={activeView === "scenarios" ? "page" : undefined}
            className={`min-h-[48px] flex flex-col items-center justify-center gap-0.5 rounded-xl transition-colors cursor-pointer ${
              activeView === "scenarios"
                ? "text-[var(--parlo-primary)]"
                : "text-[var(--parlo-ink-muted)]"
            }`}
          >
            <DockNavIcon
              id="scenarios"
              active={activeView === "scenarios"}
              className="w-[20px] h-[20px]"
            />
            <span className="text-[11px] font-medium leading-none">Scenes</span>
          </button>

          {/* Slot 3: Center Primary Live Voice Trigger */}
          <div className="flex items-center justify-center">
            <motion.button
              type="button"
              whileTap={{ scale: 0.92 }}
              onClick={() => {
                setMobileMenuOpen(false);
                onToggleVoiceSession();
              }}
              aria-label={
                isSessionActive ? "End live voice session" : "Start live voice session"
              }
              className={`relative -mt-3 w-12 h-12 rounded-2xl border flex items-center justify-center shadow-lg transition-colors cursor-pointer ${
                isSessionActive
                  ? "bg-red-500 text-white border-red-400 shadow-red-500/30"
                  : "bg-[var(--parlo-primary)] text-[var(--parlo-on-solid)] border-[var(--parlo-primary)] shadow-[0_8px_22px_color-mix(in_srgb,var(--parlo-primary)_38%,transparent)]"
              }`}
            >
              <DockNavIcon
                id={isSessionActive ? "voice-end" : "voice-live"}
                active={true}
                live={isSessionActive}
                className="w-[20px] h-[20px]"
              />
            </motion.button>
          </div>

          {/* Slot 4: Words */}
          <button
            type="button"
            onClick={() => {
              setMobileMenuOpen(false);
              onNavigate("phrasebook");
            }}
            aria-current={activeView === "phrasebook" ? "page" : undefined}
            className={`relative min-h-[48px] flex flex-col items-center justify-center gap-0.5 rounded-xl transition-colors cursor-pointer ${
              activeView === "phrasebook"
                ? "text-[var(--parlo-primary)]"
                : "text-[var(--parlo-ink-muted)]"
            }`}
          >
            <span className="relative inline-flex">
              <DockNavIcon
                id="phrasebook"
                active={activeView === "phrasebook"}
                className="w-[20px] h-[20px]"
              />
              {savedPhrasesCount > 0 && (
                <span className="absolute -top-1 -right-2 min-w-[14px] h-[14px] px-1 rounded-full bg-[var(--parlo-accent)] text-[var(--parlo-on-solid)] font-mono text-[8.5px] font-bold flex items-center justify-center tabular-nums">
                  {savedPhrasesCount > 99 ? "99+" : savedPhrasesCount}
                </span>
              )}
            </span>
            <span className="text-[11px] font-medium leading-none">Words</span>
          </button>

          {/* Slot 5: More Sheet Trigger */}
          <button
            type="button"
            onClick={toggleMobileMenu}
            aria-expanded={mobileMenuOpen}
            aria-label="Open more views and studio tools"
            className={`relative min-h-[48px] flex flex-col items-center justify-center gap-0.5 rounded-xl transition-colors cursor-pointer ${
              mobileMenuOpen || secondaryViewActive || chatOpen || soundPanelOpen
                ? "text-[var(--parlo-primary)]"
                : "text-[var(--parlo-ink-muted)]"
            }`}
          >
            <span className="relative inline-flex">
              <MoreHorizontal className="w-[20px] h-[20px]" aria-hidden="true" />
              {(activeSoundLayersCount > 0 || chatOpen) && (
                <span className="absolute -top-0.5 -right-1 w-2 h-2 rounded-full bg-[var(--parlo-accent)]" />
              )}
            </span>
            <span className="text-[10px] font-medium leading-none">More</span>
          </button>
        </div>
      </nav>

      {/* MOBILE SLIDE-UP "MORE" SHEET (< md) */}
      <AnimatePresence>
        {mobileMenuOpen && (
          <div className="md:hidden fixed inset-0 z-50 flex items-end">
            <motion.div
              key="mobile-sheet-backdrop"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              transition={{ duration: 0.18 }}
              onClick={toggleMobileMenu}
              aria-hidden="true"
              className="fixed inset-0 bg-black/50 backdrop-blur-xs"
            />

            <motion.section
              key="mobile-sheet-body"
              role="dialog"
              aria-modal="true"
              aria-label="Studio destinations and audio tools"
              initial={prefersReducedMotion ? { opacity: 0 } : { y: "100%" }}
              animate={{ y: 0, opacity: 1 }}
              exit={prefersReducedMotion ? { opacity: 0 } : { y: "100%" }}
              transition={{ duration: 0.24, ease: EASE_EXIT }}
              className="relative z-10 w-full rounded-t-[26px] border-t border-[var(--parlo-border)] bg-[var(--parlo-surface-solid)]/98 backdrop-blur-2xl pb-[max(1rem,env(safe-area-inset-bottom))] shadow-[0_-18px_48px_rgba(0,0,0,0.48)]"
            >
              {/* Drag handle */}
              <div className="pt-2.5 pb-1 flex justify-center">
                <span className="w-10 h-1 rounded-full bg-[var(--parlo-border)]" />
              </div>

              <div className="px-4 py-2.5 flex items-center justify-between border-b border-[var(--parlo-border)]/80">
                <div className="flex items-center gap-2">
                  <LanguageFlagBadge code={activeLanguageCode} size="sm" />
                  <span className="font-display text-sm font-semibold text-[var(--parlo-ink)]">
                    Studio & Tools
                  </span>
                </div>
                <button
                  type="button"
                  onClick={toggleMobileMenu}
                  aria-label="Close menu"
                  className="min-w-[40px] min-h-[40px] inline-flex items-center justify-center rounded-xl text-[var(--parlo-ink-muted)] hover:text-[var(--parlo-ink)] cursor-pointer"
                >
                  <X className="w-4 h-4" aria-hidden="true" />
                </button>
              </div>

              <div className="p-4 space-y-4 max-h-[70dvh] overflow-y-auto">
                {/* Secondary Views */}
                <div>
                  <p className="text-[11px] font-mono text-[var(--parlo-ink-muted)] mb-2">
                    Views
                  </p>
                  <div className="grid grid-cols-3 gap-2">
                    {(
                      [
                        { id: "review", label: "Progress", iconId: "review" },
                        { id: "spatial", label: "3D Rooms", iconId: "spatial" },
                        { id: "pricing", label: "Plans", iconId: "pricing" },
                      ] as const
                    ).map((item) => {
                      const active = activeView === item.id;
                      return (
                        <button
                          key={item.id}
                          type="button"
                          onClick={() => {
                            setMobileMenuOpen(false);
                            onNavigate(item.id);
                          }}
                          className={`min-h-[64px] p-2.5 rounded-2xl border flex flex-col items-center justify-center gap-1.5 transition-colors cursor-pointer ${
                            active
                              ? "bg-[var(--parlo-primary-soft)] border-[var(--parlo-primary)] text-[var(--parlo-primary)]"
                              : "bg-[var(--parlo-surface)] border-[var(--parlo-border)] text-[var(--parlo-ink-secondary)]"
                          }`}
                        >
                          <DockNavIcon
                            id={item.iconId}
                            active={active}
                            className="w-[20px] h-[20px]"
                          />
                          <span className="text-xs font-medium">{item.label}</span>
                        </button>
                      );
                    })}
                  </div>
                </div>

                {/* Audio, AI & Utility Actions */}
                <div>
                  <p className="text-[11px] font-mono text-[var(--parlo-ink-muted)] mb-2">
                    Tools & Audio
                  </p>
                  <div className="grid grid-cols-2 gap-2">
                    <button
                      type="button"
                      onClick={() => {
                        setMobileMenuOpen(false);
                        onToggleChat();
                      }}
                      className={`min-h-[52px] px-3 py-2.5 rounded-xl border flex items-center gap-2.5 text-left transition-colors cursor-pointer ${
                        chatOpen
                          ? "bg-[var(--parlo-primary-soft)] border-[var(--parlo-primary)] text-[var(--parlo-primary)]"
                          : "bg-[var(--parlo-surface)] border-[var(--parlo-border)] text-[var(--parlo-ink)]"
                      }`}
                    >
                      <DockNavIcon
                        id="tutor-chat"
                        active={chatOpen}
                        className="w-[18px] h-[18px]"
                      />
                      <div className="min-w-0">
                        <p className="text-xs font-semibold truncate">Tutor Chat</p>
                        <p className="text-[10px] text-[var(--parlo-ink-muted)] truncate">
                          Grammar & culture
                        </p>
                      </div>
                    </button>

                    <button
                      type="button"
                      onClick={() => {
                        setMobileMenuOpen(false);
                        onToggleSoundPanel();
                      }}
                      className={`min-h-[52px] px-3 py-2.5 rounded-xl border flex items-center gap-2.5 text-left transition-colors cursor-pointer ${
                        soundPanelOpen || activeSoundLayersCount > 0
                          ? "bg-[var(--parlo-primary-soft)] border-[var(--parlo-primary)] text-[var(--parlo-primary)]"
                          : "bg-[var(--parlo-surface)] border-[var(--parlo-border)] text-[var(--parlo-ink)]"
                      }`}
                    >
                      <DockNavIcon
                        id="soundscape"
                        active={soundPanelOpen}
                        live={activeSoundLayersCount > 0}
                        className="w-[18px] h-[18px]"
                      />
                      <div className="min-w-0">
                        <p className="text-xs font-semibold truncate">Soundscapes</p>
                        <p className="text-[10px] text-[var(--parlo-ink-muted)] truncate">
                          {activeSoundLayersCount > 0
                            ? `${activeSoundLayersCount} active`
                            : "Ambience & SFX"}
                        </p>
                      </div>
                    </button>

                    <button
                      type="button"
                      onClick={() => {
                        setMobileMenuOpen(false);
                        onSpeakCultureProverb();
                      }}
                      className="min-h-[52px] px-3 py-2.5 rounded-xl border border-[var(--parlo-border)] bg-[var(--parlo-surface)] text-[var(--parlo-ink)] flex items-center gap-2.5 text-left cursor-pointer"
                    >
                      <DockNavIcon
                        id="proverb-audio"
                        className="w-[18px] h-[18px]"
                      />
                      <div className="min-w-0">
                        <p className="text-xs font-semibold truncate">
                          Hear {culture.greeting}
                        </p>
                        <p className="text-[10px] text-[var(--parlo-ink-muted)] truncate">
                          Native proverb
                        </p>
                      </div>
                    </button>

                    {onToggleTheme && (
                      <button
                        type="button"
                        onClick={() => {
                          onToggleTheme();
                        }}
                        className="min-h-[52px] px-3 py-2.5 rounded-xl border border-[var(--parlo-border)] bg-[var(--parlo-surface)] text-[var(--parlo-ink)] flex items-center gap-2.5 text-left cursor-pointer"
                      >
                        {isDarkTheme ? (
                          <Sun className="w-[18px] h-[18px] text-[var(--parlo-primary)] shrink-0" aria-hidden="true" />
                        ) : (
                          <Moon className="w-[18px] h-[18px] text-[var(--parlo-primary)] shrink-0" aria-hidden="true" />
                        )}
                        <div className="min-w-0">
                          <p className="text-xs font-semibold truncate">
                            {isDarkTheme ? "Light Mode" : "Dark Mode"}
                          </p>
                          <p className="text-[10px] text-[var(--parlo-ink-muted)] truncate">
                            {isDarkTheme ? "Soft Ceramic" : "Obsidian Glass"}
                          </p>
                        </div>
                      </button>
                    )}

                    {onOpenOnboarding && (
                      <button
                        type="button"
                        onClick={() => {
                          setMobileMenuOpen(false);
                          onOpenOnboarding();
                        }}
                        className="min-h-[52px] px-3 py-2.5 rounded-xl border border-[var(--parlo-border)] bg-[var(--parlo-surface)] text-[var(--parlo-ink)] flex items-center gap-2.5 text-left cursor-pointer"
                      >
                        <Compass className="w-[18px] h-[18px] text-[var(--parlo-primary)] shrink-0" aria-hidden="true" />
                        <div className="min-w-0">
                          <p className="text-xs font-semibold truncate">Guided Setup</p>
                          <p className="text-[10px] text-[var(--parlo-ink-muted)] truncate">
                            Calibrate studio
                          </p>
                        </div>
                      </button>
                    )}

                    <button
                      type="button"
                      onClick={() => {
                        setMobileMenuOpen(false);
                        onOpenCommandPalette();
                      }}
                      className="min-h-[52px] px-3 py-2.5 rounded-xl border border-[var(--parlo-border)] bg-[var(--parlo-surface)] text-[var(--parlo-ink)] flex items-center gap-2.5 text-left cursor-pointer"
                    >
                      <DockNavIcon
                        id="command"
                        className="w-[18px] h-[18px]"
                      />
                      <div className="min-w-0">
                        <p className="text-xs font-semibold truncate">Quick Jump</p>
                        <p className="text-[10px] text-[var(--parlo-ink-muted)] truncate">
                          Search anything
                        </p>
                      </div>
                    </button>
                  </div>
                </div>
              </div>
            </motion.section>
          </div>
        )}
      </AnimatePresence>
    </>
  );
}

export default MagnificationDock;
