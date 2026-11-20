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
import {
  BarChart3,
  BookMarked,
  Box,
  Command,
  Compass,
  Gem,
  Mic,
  PhoneOff,
  Radio,
  Volume2,
} from "lucide-react";
import { CountryFontSpec, getCultureByLanguage } from "../lib/cultures";
import { AppView } from "../types";
import { LanguageFlagBadge } from "./LanguageFlagBadge";

export interface MagnificationDockProps {
  activeView: AppView;
  onNavigate: (view: AppView) => void;
  categoryFonts: Record<AppView, CountryFontSpec>;
  activeLanguageCode: string;
  isSessionActive: boolean;
  savedPhrasesCount: number;
  onToggleVoiceSession: () => void;
  onOpenCommandPalette: () => void;
  onSpeakCultureProverb: () => void;
}

interface DockDestination {
  id: AppView;
  label: string;
  shortcut: string;
  icon: typeof Mic;
}

const DOCK_DESTINATIONS: DockDestination[] = [
  { id: "studio", label: "Studio", shortcut: "1", icon: Mic },
  { id: "spatial", label: "3D Stage", shortcut: "2", icon: Box },
  { id: "scenarios", label: "Scenarios", shortcut: "3", icon: Compass },
  { id: "phrasebook", label: "Phrasebook", shortcut: "4", icon: BookMarked },
  { id: "review", label: "Review", shortcut: "5", icon: BarChart3 },
  { id: "pricing", label: "Pricing", shortcut: "6", icon: Gem },
];

const BASE_ICON_SIZE = 42;
const MAX_ICON_SIZE = 60;
const MAGNIFY_RANGE = 128;

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
  icon: typeof Mic;
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
  icon: Icon,
  onClick,
}: DockIconTileProps) {
  const tileRef = useRef<HTMLButtonElement | null>(null);
  const [hovered, setHovered] = useState(false);
  const prefersReducedMotion = useReducedMotion();

  // Compute cursor distance from this icon's horizontal center
  const distance = useTransform(mouseX, (val) => {
    if (prefersReducedMotion || val === Infinity) return MAGNIFY_RANGE + 1;
    const rect = tileRef.current?.getBoundingClientRect();
    if (!rect) return MAGNIFY_RANGE + 1;
    return val - (rect.left + rect.width / 2);
  });

  // Smooth Apple-style spring magnification & vertical arc lift
  const rawSize = useTransform(
    distance,
    [-MAGNIFY_RANGE, 0, MAGNIFY_RANGE],
    [BASE_ICON_SIZE, MAX_ICON_SIZE, BASE_ICON_SIZE]
  );
  const size = useSpring(rawSize, {
    mass: 0.14,
    stiffness: 260,
    damping: 18,
  });

  const rawLift = useTransform(
    distance,
    [-MAGNIFY_RANGE, 0, MAGNIFY_RANGE],
    [0, -9, 0]
  );
  const liftY = useSpring(rawLift, {
    mass: 0.14,
    stiffness: 260,
    damping: 18,
  });

  const iconScale = useTransform(
    size,
    [BASE_ICON_SIZE, MAX_ICON_SIZE],
    [1, 1.32]
  );

  const toneClasses =
    highlightTone === "danger"
      ? "bg-red-500/18 border-red-400/50 text-red-400 hover:bg-red-500/26"
      : highlightTone === "primary"
      ? "bg-[color-mix(in_srgb,var(--parlo-primary)_18%,var(--parlo-surface-solid))] border-[color-mix(in_srgb,var(--parlo-primary)_50%,transparent)] text-[var(--parlo-primary)]"
      : active
      ? "bg-[var(--parlo-surface-solid)] border-[color-mix(in_srgb,var(--parlo-primary)_62%,var(--parlo-border))] text-[var(--parlo-primary)] shadow-[0_6px_18px_color-mix(in_srgb,var(--parlo-primary)_22%,transparent)]"
      : "bg-[var(--parlo-surface)]/90 border-[var(--parlo-border)]/80 text-[var(--parlo-ink-secondary)] hover:text-[var(--parlo-ink)] hover:border-[var(--parlo-ink-muted)]/60";

  return (
    <div className="relative flex flex-col items-center justify-end">
      {/* Floating Glass Tooltip rendered in this category's random country font */}
      <AnimatePresence>
        {hovered && (
          <motion.div
            initial={
              prefersReducedMotion
                ? { opacity: 0 }
                : { opacity: 0, y: 8, scale: 0.92 }
            }
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={
              prefersReducedMotion
                ? { opacity: 0 }
                : { opacity: 0, y: 5, scale: 0.94 }
            }
            transition={{ duration: 0.16, ease: [0.16, 1, 0.3, 1] }}
            role="tooltip"
            className="pointer-events-none absolute -top-12 left-1/2 -translate-x-1/2 z-50 px-3 py-1.5 rounded-xl bg-[var(--parlo-surface-solid)]/96 border border-[var(--parlo-border)] shadow-xl backdrop-blur-xl whitespace-nowrap flex items-center gap-2"
          >
            {countryFont && (
              <LanguageFlagBadge code={countryFont.code} size="xs" />
            )}
            <motion.span
              key={countryFont ? `${label}-${countryFont.code}` : label}
              initial={{ opacity: 0.5, y: -2 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.18 }}
              style={
                countryFont
                  ? {
                      fontFamily: countryFont.fontFamily,
                      fontStyle: countryFont.fontStyle,
                      letterSpacing: countryFont.letterSpacing,
                    }
                  : undefined
              }
              className="text-[13px] font-medium text-[var(--parlo-ink)] leading-none"
            >
              {label}
            </motion.span>
            {sublabel && (
              <span className="text-[10px] font-mono text-[var(--parlo-ink-muted)] leading-none">
                · {sublabel}
              </span>
            )}
            {shortcut && (
              <kbd className="ml-0.5 px-1.5 py-0.5 text-[9px] font-mono rounded bg-[var(--parlo-canvas)] border border-[var(--parlo-border)] text-[var(--parlo-ink-muted)] leading-none">
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
        whileTap={prefersReducedMotion ? undefined : { scale: 0.9 }}
        aria-label={sublabel ? `${label} (${sublabel})` : label}
        aria-current={active ? "page" : undefined}
        style={{
          width: prefersReducedMotion ? BASE_ICON_SIZE : size,
          height: prefersReducedMotion ? BASE_ICON_SIZE : size,
          y: prefersReducedMotion ? 0 : liftY,
        }}
        className={`relative flex items-center justify-center rounded-[14px] border backdrop-blur-md transition-colors cursor-pointer shrink-0 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[var(--parlo-primary)] ${toneClasses}`}
      >
        {/* Subtle top specular glass rim */}
        <span
          aria-hidden="true"
          className="pointer-events-none absolute inset-[1px] rounded-[13px] bg-gradient-to-b from-white/15 to-transparent opacity-60"
        />

        {/* Active ambient cultural aura inside tile */}
        {active && (
          <motion.span
            layoutId="parlo-dock-active-aura"
            transition={{ type: "spring", stiffness: 420, damping: 28 }}
            aria-hidden="true"
            className="pointer-events-none absolute inset-0 rounded-[13px]"
            style={{
              background:
                "radial-gradient(circle at 50% 25%, color-mix(in srgb, var(--parlo-primary) 24%, transparent), transparent 72%)",
            }}
          />
        )}

        {/* Live broadcast ring when voice session is active */}
        {livePulse && !prefersReducedMotion && (
          <motion.span
            aria-hidden="true"
            animate={{ scale: [1, 1.24, 1], opacity: [0.55, 0.12, 0.55] }}
            transition={{
              type: "tween",
              duration: 1.8,
              repeat: Infinity,
              ease: "easeInOut",
            }}
            className="pointer-events-none absolute -inset-0.5 rounded-[15px] border border-[var(--parlo-accent)]"
          />
        )}

        <motion.span
          style={{ scale: prefersReducedMotion ? 1 : iconScale }}
          className="relative z-10 inline-flex items-center justify-center"
        >
          <Icon className="w-[18px] h-[18px]" strokeWidth={active ? 2.2 : 1.85} aria-hidden="true" />
        </motion.span>

        {/* Subtle numeric count indicator (e.g., saved phrases count) */}
        {typeof badgeCount === "number" && badgeCount > 0 && (
          <span
            aria-hidden="true"
            className="absolute -top-1 -right-1 z-20 min-w-[16px] h-4 px-1 rounded-full bg-[var(--parlo-accent)] text-[var(--parlo-on-solid)] font-mono text-[9px] font-bold flex items-center justify-center tabular-nums shadow-sm"
          >
            {badgeCount > 99 ? "99+" : badgeCount}
          </span>
        )}
      </motion.button>

      {/* Authentic Apple Dock Active Indicator Dot */}
      <span className="h-2 flex items-center justify-center mt-0.5">
        {active && (
          <motion.span
            layoutId="parlo-dock-active-dot"
            transition={{ type: "spring", stiffness: 480, damping: 30 }}
            className="w-1.5 h-1.5 rounded-full bg-[var(--parlo-primary)] shadow-[0_0_8px_var(--parlo-primary)]"
          />
        )}
      </span>
    </div>
  );
}

/**
 * MagnificationDock
 *
 * Apple macOS-inspired icon-only floating magnification navigation dock:
 * - Zero inline text inside the dock bar; clean magnifying squircle icons.
 * - Hovering reveals a floating glass tooltip displaying each view's title in
 *   its randomized country typography (cycling randomly on every click).
 * - Includes a sleek utility bay on the right (Live Voice toggle, Command Palette
 *   Quick Jump, and Hear Active Culture Proverb).
 */
export function MagnificationDock({
  activeView,
  onNavigate,
  categoryFonts,
  activeLanguageCode,
  isSessionActive,
  savedPhrasesCount,
  onToggleVoiceSession,
  onOpenCommandPalette,
  onSpeakCultureProverb,
}: MagnificationDockProps) {
  const mouseX = useMotionValue(Infinity);
  const culture = getCultureByLanguage(activeLanguageCode);

  return (
    <div className="fixed bottom-3.5 left-1/2 -translate-x-1/2 z-40 pointer-events-none px-3 max-w-[98vw]">
      <nav
        aria-label="Primary studio dock"
        onMouseMove={(e) => mouseX.set(e.clientX)}
        onMouseLeave={() => mouseX.set(Infinity)}
        className="pointer-events-auto relative flex items-end gap-1.5 sm:gap-2 px-2.5 sm:px-3 pt-2 pb-1 rounded-[22px] bg-[var(--parlo-shell)]/82 backdrop-blur-2xl border border-[var(--parlo-border)]/85 shadow-[0_18px_46px_-10px_rgba(0,0,0,0.42),0_0_0_1px_rgba(255,255,255,0.06)_inset]"
      >
        {/* Subtle cultural horizon sheen along the top edge of the glass dock */}
        <span
          aria-hidden="true"
          className="pointer-events-none absolute inset-x-6 top-0 h-[1px] opacity-75"
          style={{
            background:
              "linear-gradient(90deg, transparent 0%, var(--parlo-primary) 35%, var(--parlo-accent) 65%, transparent 100%)",
          }}
        />

        {/* Core 6 Navigation Views (Icon-only, random country typography in hover tooltip) */}
        {DOCK_DESTINATIONS.map((dest) => {
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
              icon={dest.icon}
              onClick={() => onNavigate(dest.id)}
            />
          );
        })}

        {/* macOS-style Hairline Divider separating navigation from quick utilities */}
        <span
          aria-hidden="true"
          className="self-center w-[1px] h-7 mx-0.5 sm:mx-1 bg-[var(--parlo-border)]/90 mb-2 shrink-0"
        />

        {/* Utility 1: Instant Live Voice Session Toggle from any screen */}
        <DockIconTile
          mouseX={mouseX}
          label={isSessionActive ? "End Voice Session" : "Start Live Voice"}
          sublabel={isSessionActive ? "On Air" : culture.atelierName}
          highlightTone={isSessionActive ? "danger" : "primary"}
          livePulse={isSessionActive}
          icon={isSessionActive ? PhoneOff : Radio}
          onClick={onToggleVoiceSession}
        />

        {/* Utility 2: Hear Active Culture Proverb / Native Rhythm */}
        <DockIconTile
          mouseX={mouseX}
          label={`Hear ${culture.greeting}`}
          sublabel={culture.cityLine}
          icon={Volume2}
          onClick={onSpeakCultureProverb}
        />

        {/* Utility 3: Quick Jump Command Palette (Cmd/Ctrl + K) */}
        <DockIconTile
          mouseX={mouseX}
          label="Quick Jump"
          shortcut="⌘K"
          icon={Command}
          onClick={onOpenCommandPalette}
        />
      </nav>
    </div>
  );
}

export default MagnificationDock;
