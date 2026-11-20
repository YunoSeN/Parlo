import { AnimatePresence, motion, useReducedMotion } from "motion/react";

export type DockIconId =
  | "studio"
  | "spatial"
  | "scenarios"
  | "phrasebook"
  | "review"
  | "pricing"
  | "voice-live"
  | "voice-end"
  | "tutor-chat"
  | "soundscape"
  | "proverb-audio"
  | "command";

export interface DockNavIconProps {
  id: DockIconId;
  active?: boolean;
  hovered?: boolean;
  live?: boolean;
  className?: string;
}

const SPRING_SNAPPY = {
  type: "spring" as const,
  stiffness: 420,
  damping: 22,
};

const EASE_SMOOTH = [0.16, 1, 0.3, 1] as const;

/**
 * DockNavIcon
 *
 * Bespoke duotone animated SVG glyphs designed specifically for Parlo's
 * floating MagnificationDock. Every destination and utility icon features
 * sculpted architectural geometry, subtle layered accent fills, and
 * spring-driven micro-motion on hover, active, and live states.
 */
export function DockNavIcon({
  id,
  active = false,
  hovered = false,
  live = false,
  className = "w-[21px] h-[21px]",
}: DockNavIconProps) {
  const prefersReducedMotion = useReducedMotion();
  const engaged = !prefersReducedMotion && (hovered || active);
  const strokeW = active ? 1.85 : 1.65;

  return (
    <AnimatePresence mode="wait" initial={false}>
      <motion.span
        key={id}
        initial={
          prefersReducedMotion
            ? { opacity: 0 }
            : { opacity: 0, scale: 0.72, rotate: -10 }
        }
        animate={{ opacity: 1, scale: 1, rotate: 0 }}
        exit={
          prefersReducedMotion
            ? { opacity: 0 }
            : { opacity: 0, scale: 0.72, rotate: 10 }
        }
        transition={{ duration: 0.18, ease: EASE_SMOOTH }}
        className="inline-flex items-center justify-center"
      >
        {renderGlyph(id, {
          active,
          hovered,
          live,
          engaged,
          prefersReducedMotion: Boolean(prefersReducedMotion),
          strokeW,
          className,
        })}
      </motion.span>
    </AnimatePresence>
  );
}

interface GlyphCtx {
  active: boolean;
  hovered: boolean;
  live: boolean;
  engaged: boolean;
  prefersReducedMotion: boolean;
  strokeW: number;
  className: string;
}

function renderGlyph(id: DockIconId, ctx: GlyphCtx) {
  const { active, hovered, live, engaged, prefersReducedMotion, strokeW, className } =
    ctx;

  switch (id) {
    /* 1. STUDIO — Sculpted Condenser Mic + Rippling Acoustic Arcs */
    case "studio":
      return (
        <svg viewBox="0 0 24 24" fill="none" className={className} aria-hidden="true">
          {/* Glowing capsule core fill */}
          <rect
            x="9"
            y="3.5"
            width="6"
            height="10"
            rx="3"
            fill="currentColor"
            fillOpacity={active ? 0.24 : hovered ? 0.16 : 0.08}
          />
          {/* Capsule outline */}
          <rect
            x="9"
            y="3.5"
            width="6"
            height="10"
            rx="3"
            stroke="currentColor"
            strokeWidth={strokeW}
          />
          {/* Capsule acoustic grille line */}
          <motion.path
            d="M10.8 7.5H13.2M10.8 10H13.2"
            stroke="var(--parlo-accent)"
            strokeWidth="1.4"
            strokeLinecap="round"
            animate={
              engaged || live
                ? { opacity: 1, scaleX: 1.08 }
                : { opacity: 0.65, scaleX: 1 }
            }
            transition={SPRING_SNAPPY}
            style={{ transformOrigin: "12px 8.75px" }}
          />
          {/* Cradle U-arc & base */}
          <path
            d="M6.5 11.2A5.5 5.5 0 0 0 17.5 11.2M12 16.7V20M9 20H15"
            stroke="currentColor"
            strokeWidth={strokeW}
            strokeLinecap="round"
            strokeLinejoin="round"
          />
          {/* Outer live/hover acoustic arcs */}
          <motion.path
            d="M4.2 8.2C3.4 9.3 3.4 11.7 4.2 12.8M19.8 8.2C20.6 9.3 20.6 11.7 19.8 12.8"
            stroke="var(--parlo-accent)"
            strokeWidth="1.45"
            strokeLinecap="round"
            animate={
              prefersReducedMotion
                ? { opacity: active || live ? 0.9 : 0.2 }
                : live
                ? { opacity: [0.35, 1, 0.35], scale: [0.95, 1.08, 0.95] }
                : hovered
                ? { opacity: 0.95, scale: 1.06 }
                : { opacity: active ? 0.72 : 0.22, scale: 1 }
            }
            transition={
              live && !prefersReducedMotion
                ? { type: "tween", duration: 1.4, repeat: Infinity, ease: "easeInOut" }
                : SPRING_SNAPPY
            }
            style={{ transformOrigin: "12px 10.5px" }}
          />
        </svg>
      );

    /* 2. 3D STAGE — Isometric Faceted Architectural Cube + Levitating Core */
    case "spatial":
      return (
        <svg viewBox="0 0 24 24" fill="none" className={className} aria-hidden="true">
          {/* Top lit facet */}
          <path
            d="M12 3.2L19.6 7.5L12 11.8L4.4 7.5L12 3.2Z"
            fill="currentColor"
            fillOpacity={active ? 0.24 : hovered ? 0.18 : 0.1}
          />
          {/* Right shaded facet */}
          <path
            d="M19.6 7.5V16.4L12 20.8V11.8L19.6 7.5Z"
            fill="currentColor"
            fillOpacity={active ? 0.12 : 0.05}
          />
          {/* Outer isometric hexagon */}
          <path
            d="M12 3.2L19.6 7.5V16.4L12 20.8L4.4 16.4V7.5L12 3.2Z"
            stroke="currentColor"
            strokeWidth={strokeW}
            strokeLinejoin="round"
          />
          {/* Inner axes */}
          <path
            d="M4.4 7.5L12 11.8L19.6 7.5M12 11.8V20.8"
            stroke="currentColor"
            strokeWidth={strokeW * 0.85}
            strokeLinecap="round"
            strokeLinejoin="round"
            strokeOpacity="0.82"
          />
          {/* Floating accent spatial prism core */}
          <motion.polygon
            points="12,5.6 14.5,7.4 12,9.2 9.5,7.4"
            fill="var(--parlo-accent)"
            animate={
              engaged
                ? { y: -1.1, scale: 1.15, opacity: 1 }
                : { y: 0, scale: 1, opacity: 0.72 }
            }
            transition={SPRING_SNAPPY}
            style={{ transformOrigin: "12px 7.4px" }}
          />
        </svg>
      );

    /* 3. SCENARIOS — Precision Compass Dial + Spring-Rotating Needle */
    case "scenarios":
      return (
        <svg viewBox="0 0 24 24" fill="none" className={className} aria-hidden="true">
          <circle
            cx="12"
            cy="12"
            r="8.7"
            fill="currentColor"
            fillOpacity={active ? 0.15 : hovered ? 0.1 : 0.05}
            stroke="currentColor"
            strokeWidth={strokeW}
          />
          {/* Subtle cardinal ticks */}
          <path
            d="M12 4.8V6.1M12 17.9V19.2M4.8 12H6.1M17.9 12H19.2"
            stroke="currentColor"
            strokeWidth="1.25"
            strokeLinecap="round"
            strokeOpacity="0.55"
          />
          {/* Rotating duotone needle */}
          <motion.g
            animate={
              prefersReducedMotion
                ? undefined
                : hovered
                ? { rotate: 32, scale: 1.08 }
                : active
                ? { rotate: 12, scale: 1.02 }
                : { rotate: 0, scale: 1 }
            }
            transition={SPRING_SNAPPY}
            style={{ transformOrigin: "12px 12px" }}
          >
            {/* North accent pointer */}
            <polygon points="15.8,8.2 13.3,13.3 10.7,10.7" fill="var(--parlo-accent)" />
            {/* South ink pointer */}
            <polygon
              points="8.2,15.8 10.7,10.7 13.3,13.3"
              fill="currentColor"
              fillOpacity="0.72"
            />
            <circle cx="12" cy="12" r="1.2" fill="var(--parlo-surface-solid)" />
          </motion.g>
        </svg>
      );

    /* 4. PHRASEBOOK — Hardbound Editorial Folio + Sliding Accent Ribbon */
    case "phrasebook":
      return (
        <svg viewBox="0 0 24 24" fill="none" className={className} aria-hidden="true">
          {/* Book cover body */}
          <path
            d="M5.5 4.8A2 2 0 0 1 7.5 2.8H18.5V19.6H7.5A2 2 0 0 0 5.5 21.2V4.8Z"
            fill="currentColor"
            fillOpacity={active ? 0.18 : hovered ? 0.12 : 0.06}
            stroke="currentColor"
            strokeWidth={strokeW}
            strokeLinejoin="round"
          />
          {/* Lower page edge */}
          <path
            d="M5.5 19.6A2 2 0 0 1 7.5 17.6H18.5"
            stroke="currentColor"
            strokeWidth={strokeW}
            strokeLinecap="round"
          />
          {/* Subtle phrase lines */}
          <path
            d="M8.8 13.6H14.6"
            stroke="currentColor"
            strokeWidth="1.3"
            strokeLinecap="round"
            strokeOpacity="0.55"
          />
          {/* Sliding bookmark ribbon */}
          <motion.path
            d="M12.2 2.8H16V10.6L14.1 9.1L12.2 10.6V2.8Z"
            fill="var(--parlo-accent)"
            animate={engaged ? { y: 1.4 } : { y: 0 }}
            transition={SPRING_SNAPPY}
          />
        </svg>
      );

    /* 5. REVIEW — Ascending Fluency Cadence Bars + Apex Spark */
    case "review":
      return (
        <svg viewBox="0 0 24 24" fill="none" className={className} aria-hidden="true">
          {/* Baseline */}
          <path
            d="M4 19.5H20"
            stroke="currentColor"
            strokeWidth={strokeW}
            strokeLinecap="round"
          />
          {/* Bar 1 */}
          <motion.rect
            x="5.5"
            y="12.5"
            width="3.2"
            height="7"
            rx="1.2"
            fill="currentColor"
            fillOpacity={active ? 0.35 : 0.2}
            stroke="currentColor"
            strokeWidth="1.45"
            animate={engaged ? { scaleY: 1.12 } : { scaleY: 1 }}
            transition={SPRING_SNAPPY}
            style={{ transformOrigin: "7.1px 19.5px" }}
          />
          {/* Bar 2 */}
          <motion.rect
            x="10.4"
            y="8.8"
            width="3.2"
            height="10.7"
            rx="1.2"
            fill="currentColor"
            fillOpacity={active ? 0.45 : 0.25}
            stroke="currentColor"
            strokeWidth="1.45"
            animate={engaged ? { scaleY: 1.09 } : { scaleY: 1 }}
            transition={{ ...SPRING_SNAPPY, delay: 0.03 }}
            style={{ transformOrigin: "12px 19.5px" }}
          />
          {/* Bar 3 — Accent peak */}
          <motion.rect
            x="15.3"
            y="5.2"
            width="3.2"
            height="14.3"
            rx="1.2"
            fill="var(--parlo-accent)"
            fillOpacity={active || hovered ? 0.95 : 0.78}
            animate={engaged ? { scaleY: 1.08 } : { scaleY: 1 }}
            transition={{ ...SPRING_SNAPPY, delay: 0.06 }}
            style={{ transformOrigin: "16.9px 19.5px" }}
          />
          {/* Subtle apex pulse dot */}
          <motion.circle
            cx="16.9"
            cy="3.2"
            r="1.1"
            fill="var(--parlo-accent)"
            animate={engaged ? { scale: 1.35, opacity: 1 } : { scale: 0.85, opacity: 0.55 }}
            transition={SPRING_SNAPPY}
            style={{ transformOrigin: "16.9px 3.2px" }}
          />
        </svg>
      );

    /* 6. PRICING — Precision Faceted Atelier Diamond + Shimmer Crown */
    case "pricing":
      return (
        <svg viewBox="0 0 24 24" fill="none" className={className} aria-hidden="true">
          {/* Outer cut gem silhouette */}
          <path
            d="M7.2 4.5H16.8L20.5 9.6L12 19.8L3.5 9.6L7.2 4.5Z"
            fill="currentColor"
            fillOpacity={active ? 0.2 : hovered ? 0.14 : 0.07}
            stroke="currentColor"
            strokeWidth={strokeW}
            strokeLinejoin="round"
          />
          {/* Crown table facet */}
          <motion.path
            d="M9.4 4.5L12 9.6L14.6 4.5H9.4Z"
            fill="var(--parlo-accent)"
            fillOpacity={engaged ? 0.92 : 0.65}
            animate={engaged ? { scale: 1.06 } : { scale: 1 }}
            transition={SPRING_SNAPPY}
            style={{ transformOrigin: "12px 7px" }}
          />
          {/* Internal pavilion facets */}
          <path
            d="M3.5 9.6H20.5M9.4 4.5L8.4 9.6L12 19.8L15.6 9.6L14.6 4.5"
            stroke="currentColor"
            strokeWidth="1.25"
            strokeOpacity="0.65"
            strokeLinejoin="round"
          />
        </svg>
      );

    /* 7A. UTILITY: START LIVE VOICE — Broadcast Core + Harmonic Rings */
    case "voice-live":
      return (
        <svg viewBox="0 0 24 24" fill="none" className={className} aria-hidden="true">
          <motion.path
            d="M5.4 6.8A8.2 8.2 0 0 0 5.4 17.2M18.6 6.8A8.2 8.2 0 0 1 18.6 17.2"
            stroke="currentColor"
            strokeWidth="1.6"
            strokeLinecap="round"
            animate={hovered && !prefersReducedMotion ? { scale: 1.08, opacity: 1 } : { scale: 1, opacity: 0.72 }}
            transition={SPRING_SNAPPY}
            style={{ transformOrigin: "12px 12px" }}
          />
          <motion.path
            d="M8.1 9.1A4.7 4.7 0 0 0 8.1 14.9M15.9 9.1A4.7 4.7 0 0 1 15.9 14.9"
            stroke="currentColor"
            strokeWidth="1.65"
            strokeLinecap="round"
            animate={hovered && !prefersReducedMotion ? { scale: 1.05 } : { scale: 1 }}
            transition={SPRING_SNAPPY}
            style={{ transformOrigin: "12px 12px" }}
          />
          <motion.circle
            cx="12"
            cy="12"
            r="2.6"
            fill="var(--parlo-accent)"
            animate={hovered && !prefersReducedMotion ? { scale: 1.18 } : { scale: 1 }}
            transition={SPRING_SNAPPY}
            style={{ transformOrigin: "12px 12px" }}
          />
        </svg>
      );

    /* 7B. UTILITY: END VOICE SESSION — Crisp Disconnect Arc */
    case "voice-end":
      return (
        <svg viewBox="0 0 24 24" fill="none" className={className} aria-hidden="true">
          <path
            d="M4.2 13.8C6.6 11.4 9.2 10.3 12 10.3C14.8 10.3 17.4 11.4 19.8 13.8L18.1 16.1C17.5 16.8 16.5 16.9 15.7 16.3L14.5 15.4C14.1 15.1 13.9 14.6 14 14.1L14.2 13.3C12.7 13 11.3 13 9.8 13.3L10 14.1C10.1 14.6 9.9 15.1 9.5 15.4L8.3 16.3C7.5 16.9 6.5 16.8 5.9 16.1L4.2 13.8Z"
            fill="currentColor"
            fillOpacity="0.22"
            stroke="currentColor"
            strokeWidth="1.7"
            strokeLinejoin="round"
          />
          <path
            d="M6.5 6.5L17.5 17.5"
            stroke="currentColor"
            strokeWidth="1.8"
            strokeLinecap="round"
          />
        </svg>
      );

    /* 8. UTILITY: GEMINI TUTOR CHAT — Layered Speech Card + Cadence Beads */
    case "tutor-chat":
      return (
        <svg viewBox="0 0 24 24" fill="none" className={className} aria-hidden="true">
          <path
            d="M5 6.4A2.4 2.4 0 0 1 7.4 4H16.6A2.4 2.4 0 0 1 19 6.4V13.8A2.4 2.4 0 0 1 16.6 16.2H10.6L6.6 19.6V16.2H7.4A2.4 2.4 0 0 1 5 13.8V6.4Z"
            fill="currentColor"
            fillOpacity={active ? 0.22 : hovered ? 0.14 : 0.07}
            stroke="currentColor"
            strokeWidth={strokeW}
            strokeLinejoin="round"
          />
          {[8.8, 12, 15.2].map((cx, idx) => (
            <motion.circle
              key={cx}
              cx={cx}
              cy="10.1"
              r="1.15"
              fill={idx === 1 ? "var(--parlo-accent)" : "currentColor"}
              animate={
                engaged
                  ? { y: idx === 1 ? -1.4 : -0.6, scale: 1.15 }
                  : { y: 0, scale: 1 }
              }
              transition={{ ...SPRING_SNAPPY, delay: idx * 0.04 }}
              style={{ transformOrigin: `${cx}px 10.1px` }}
            />
          ))}
        </svg>
      );

    /* 8B. UTILITY: SOUNDSCAPES & SFX MIXER — Acoustic Equalizer Bars */
    case "soundscape":
      return (
        <svg viewBox="0 0 24 24" fill="none" className={className} aria-hidden="true">
          <rect
            x="3.6"
            y="4.4"
            width="16.8"
            height="15.2"
            rx="4.2"
            fill="currentColor"
            fillOpacity={active || live ? 0.2 : hovered ? 0.12 : 0.06}
            stroke="currentColor"
            strokeWidth={strokeW}
          />
          {[
            { x: 7.8, baseY: 9.2, h: 5.6, accent: false },
            { x: 11.1, baseY: 7.4, h: 9.2, accent: true },
            { x: 14.4, baseY: 9.8, h: 4.4, accent: false },
          ].map((bar, idx) => (
            <motion.rect
              key={bar.x}
              x={bar.x}
              y={bar.baseY}
              width="2"
              height={bar.h}
              rx="1"
              fill={bar.accent ? "var(--parlo-accent)" : "currentColor"}
              animate={
                prefersReducedMotion
                  ? undefined
                  : live
                  ? { scaleY: idx === 1 ? [0.7, 1.18, 0.7] : [1.15, 0.65, 1.15] }
                  : engaged
                  ? { scaleY: idx === 1 ? 1.16 : 1.08 }
                  : { scaleY: 1 }
              }
              transition={
                live && !prefersReducedMotion
                  ? {
                      type: "tween",
                      duration: 1.15 + idx * 0.18,
                      repeat: Infinity,
                      ease: "easeInOut",
                    }
                  : SPRING_SNAPPY
              }
              style={{ transformOrigin: `${bar.x + 1}px 12px` }}
            />
          ))}
        </svg>
      );

    /* 9. UTILITY: HEAR CULTURE PROVERB — Acoustic Horn + Rhythmic Arcs */
    case "proverb-audio":
      return (
        <svg viewBox="0 0 24 24" fill="none" className={className} aria-hidden="true">
          <path
            d="M4.5 9.8H7.8L12.6 5.8V18.2L7.8 14.2H4.5A1 1 0 0 1 3.5 13.2V10.8A1 1 0 0 1 4.5 9.8Z"
            fill="currentColor"
            fillOpacity={hovered ? 0.22 : 0.1}
            stroke="currentColor"
            strokeWidth={strokeW}
            strokeLinejoin="round"
          />
          <motion.path
            d="M15.6 9.3A3.6 3.6 0 0 1 15.6 14.7"
            stroke="var(--parlo-accent)"
            strokeWidth="1.65"
            strokeLinecap="round"
            animate={engaged ? { x: 0.7, opacity: 1 } : { x: 0, opacity: 0.85 }}
            transition={SPRING_SNAPPY}
          />
          <motion.path
            d="M18.2 7.1A6.6 6.6 0 0 1 18.2 16.9"
            stroke="currentColor"
            strokeWidth="1.5"
            strokeLinecap="round"
            animate={engaged ? { x: 1.1, opacity: 0.95 } : { x: 0, opacity: 0.55 }}
            transition={{ ...SPRING_SNAPPY, delay: 0.04 }}
          />
        </svg>
      );

    /* 10. UTILITY: QUICK JUMP ⌘K — Sculpted Braided Command Emblem */
    case "command":
    default:
      return (
        <svg viewBox="0 0 24 24" fill="none" className={className} aria-hidden="true">
          <motion.g
            animate={engaged ? { rotate: 12, scale: 1.06 } : { rotate: 0, scale: 1 }}
            transition={SPRING_SNAPPY}
            style={{ transformOrigin: "12px 12px" }}
          >
            <rect
              x="9"
              y="9"
              width="6"
              height="6"
              fill="var(--parlo-accent)"
              fillOpacity={engaged ? 0.3 : 0.14}
            />
            <path
              d="M9 9V6.8A2.3 2.3 0 1 0 6.7 9H9ZM15 9V6.8A2.3 2.3 0 1 1 17.3 9H15ZM9 15V17.2A2.3 2.3 0 1 1 6.7 15H9ZM15 15V17.2A2.3 2.3 0 1 0 17.3 15H15ZM9 9H15V15H9V9Z"
              stroke="currentColor"
              strokeWidth={strokeW}
              strokeLinecap="round"
              strokeLinejoin="round"
            />
          </motion.g>
        </svg>
      );
  }
}

export default DockNavIcon;
