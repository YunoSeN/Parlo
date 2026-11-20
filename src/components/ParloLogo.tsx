import { useEffect, useRef, useState } from "react";
import {
  motion,
  MotionValue,
  useMotionTemplate,
  useMotionValue,
  useReducedMotion,
  useTransform,
} from "motion/react";
import {
  getCultureByLanguage,
  PARLO_BASE_LOGO_MORPH,
} from "../lib/cultures";

export interface ParloLogoProps {
  /** Active language code drives the hover cultural SVG path morph */
  languageCode?: string;
  /** Incremented whenever the user explicitly selects a language */
  selectionCount?: number;
  /** Compact variant for footer or secondary placements */
  size?: "md" | "sm";
  /** Gently breathes the acoustic aperture when a voice session is live */
  isLive?: boolean;
  /** Activates acoustic resonance pulse when the AI partner is speaking */
  isSpeaking?: boolean;
  /** Normalized (-1 to 1) horizontal pointer position from parent header container */
  parallaxX?: MotionValue<number>;
  /** Normalized (-1 to 1) vertical pointer position from parent header container */
  parallaxY?: MotionValue<number>;
  /** Optional click handler (renders as button when provided) */
  onClick?: () => void;
  className?: string;
}

const PATH_MORPH_TRANSITION = {
  duration: 0.52,
  ease: [0.16, 1, 0.3, 1] as const,
};

/**
 * ParloLogo
 *
 * Sculptural kinetic brand mark with reversed Framer Motion SVG path morphing:
 * - At Rest: keeps the iconic geometric 'P' acoustic monogram intact and clean.
 * - On Hover: performs a tactile micro-bounce spring and smoothly morphs the 'P'
 *   curves directly into the active language's cultural motif shape (Alhambra arch,
 *   Eiffel spire, Torii gate, Bauhaus portal, Duomo cupola, Suzhou lantern,
 *   Bukchon Hanok, Lisboa azulejo) with header-linked floating 3D parallax.
 * - Wordmark: Always stays "Parlo" in its signature clean geometric logo font.
 */
export function ParloLogo({
  languageCode = "es",
  selectionCount = 0,
  size = "md",
  isLive = false,
  isSpeaking = false,
  parallaxX,
  parallaxY,
  onClick,
  className = "",
}: ParloLogoProps) {
  const [hovered, setHovered] = useState(false);
  const [culturePulse, setCulturePulse] = useState(false);

  const pulseTimerRef = useRef<number | null>(null);
  const prevLangRef = useRef(languageCode);
  const prevSelectionRef = useRef(selectionCount);
  const prefersReducedMotion = useReducedMotion();

  useEffect(() => {
    return () => {
      if (pulseTimerRef.current !== null) {
        window.clearTimeout(pulseTimerRef.current);
      }
    };
  }, []);

  // Gentle spring acknowledgment on the 'P' vessel when switching culture, while keeping 'P' at rest
  useEffect(() => {
    const langChanged = prevLangRef.current !== languageCode;
    const selectionChanged =
      selectionCount > 0 && prevSelectionRef.current !== selectionCount;
    prevLangRef.current = languageCode;
    prevSelectionRef.current = selectionCount;

    if (!langChanged && !selectionChanged) return;
    if (size === "sm" || prefersReducedMotion) return;

    if (pulseTimerRef.current !== null) {
      window.clearTimeout(pulseTimerRef.current);
    }
    setCulturePulse(true);
    pulseTimerRef.current = window.setTimeout(() => {
      setCulturePulse(false);
    }, 460);
  }, [languageCode, prefersReducedMotion, selectionCount, size]);

  const fallbackX = useMotionValue(0);
  const fallbackY = useMotionValue(0);
  const px = parallaxX ?? fallbackX;
  const py = parallaxY ?? fallbackY;

  const isSmall = size === "sm";
  const motionScale = prefersReducedMotion ? 0 : isSmall ? 0.45 : 1;

  // Floating 3D vessel rotation linked to mouse position in the header
  const rotateY = useTransform(
    px,
    [-1, 1],
    [-14 * motionScale, 14 * motionScale]
  );
  const rotateX = useTransform(
    py,
    [-1, 1],
    [11 * motionScale, -11 * motionScale]
  );
  const vesselX = useTransform(
    px,
    [-1, 1],
    [-2.5 * motionScale, 2.5 * motionScale]
  );
  const vesselY = useTransform(
    py,
    [-1, 1],
    [-1.8 * motionScale, 1.8 * motionScale]
  );

  const coreX = useTransform(
    px,
    [-1, 1],
    [-3.2 * motionScale, 3.2 * motionScale]
  );
  const coreY = useTransform(
    py,
    [-1, 1],
    [-2.4 * motionScale, 2.4 * motionScale]
  );
  const textX = useTransform(
    px,
    [-1, 1],
    [-1.4 * motionScale, 1.4 * motionScale]
  );

  const sheenX = useTransform(px, [-1, 1], [18, 82]);
  const sheenY = useTransform(py, [-1, 1], [16, 84]);
  const sheenBackground = useMotionTemplate`radial-gradient(circle at ${sheenX}% ${sheenY}%, rgba(255,255,255,0.34) 0%, rgba(255,255,255,0.06) 44%, transparent 72%)`;

  const culture = getCultureByLanguage(languageCode);
  const cultureMorph = culture.logoMorph;

  // Always keep 'P' at rest; morph smoothly into active cultural shape on hover
  const showingCulturalShape = hovered;
  const activeMorph = showingCulturalShape
    ? cultureMorph
    : PARLO_BASE_LOGO_MORPH;
  const isAccentActive = hovered || isLive || culturePulse;

  const boxSize = isSmall ? "w-6 h-6 rounded-[7px]" : "w-8 h-8 rounded-[10px]";
  const svgSize = isSmall ? 15 : 19;
  const textSize = isSmall ? "text-[15px]" : "text-[22px]";

  const content = (
    <span
      className={`group inline-flex items-center ${
        isSmall ? "gap-2" : "gap-2.5"
      } whitespace-nowrap shrink-0 select-none ${className}`}
      style={{ perspective: "420px" }}
      onMouseEnter={() => setHovered(true)}
      onMouseLeave={() => setHovered(false)}
    >
      {/* Sculptural Floating Emblem Vessel (Micro-Bounce Spring + Header Floating Parallax) */}
      <motion.span
        aria-hidden="true"
        style={{
          rotateX,
          rotateY,
          x: vesselX,
          y: vesselY,
          transformStyle: "preserve-3d",
        }}
        animate={
          prefersReducedMotion
            ? undefined
            : hovered
            ? { scale: 1.1, rotate: -4 }
            : culturePulse
            ? { scale: 1.07, rotate: 4 }
            : { scale: 1, rotate: 0 }
        }
        transition={{
          type: "spring",
          stiffness: 440,
          damping: 16,
          mass: 0.56,
        }}
        className={`parlo-logo-vessel relative inline-flex items-center justify-center shrink-0 overflow-hidden ${boxSize} ${
          isAccentActive ? "is-live" : ""
        }`}
      >
        <motion.span
          className="pointer-events-none absolute inset-0 rounded-[inherit]"
          style={{ background: sheenBackground }}
        />

        {/* Unified Framer Motion Path-Morphing SVG Mark ('P' -> Cultural Motif on hover) */}
        <motion.span
          style={{
            x: coreX,
            y: coreY,
            transformStyle: "preserve-3d",
            translateZ: 8,
          }}
          animate={
            prefersReducedMotion
              ? undefined
              : isSpeaking
              ? { scale: [1, 1.09, 1] }
              : hovered
              ? { scale: 1.08 }
              : { scale: 1 }
          }
          transition={
            isSpeaking
              ? {
                  type: "tween",
                  duration: 1.1,
                  repeat: Infinity,
                  ease: "easeInOut",
                }
              : {
                  type: "spring",
                  stiffness: 460,
                  damping: 15,
                }
          }
          className="relative z-10 inline-flex items-center justify-center"
        >
          <svg
            width={svgSize}
            height={svgSize}
            viewBox="0 0 24 24"
            fill="none"
            xmlns="http://www.w3.org/2000/svg"
          >
            {/* Primary Contour: 'P' Monogram at rest -> Cultural Motif Silhouette on hover */}
            <motion.path
              initial={false}
              animate={{ d: activeMorph.primaryPath }}
              transition={
                prefersReducedMotion
                  ? { duration: 0.01 }
                  : PATH_MORPH_TRANSITION
              }
              stroke="var(--parlo-on-solid)"
              strokeWidth="2.15"
              strokeLinecap="round"
              strokeLinejoin="round"
            />

            {/* Secondary Cultural Rib / Acoustic Resonance Contour */}
            <motion.path
              initial={false}
              animate={{
                d: activeMorph.secondaryPath,
                opacity: showingCulturalShape ? 0.9 : 0.42,
              }}
              transition={
                prefersReducedMotion
                  ? { duration: 0.01 }
                  : { ...PATH_MORPH_TRANSITION, duration: 0.56 }
              }
              stroke="var(--parlo-on-solid)"
              strokeWidth="1.55"
              strokeLinecap="round"
              strokeLinejoin="round"
            />

            {/* Accent Focal Jewel / Vocal Aperture Core */}
            <motion.path
              initial={false}
              animate={{
                d: activeMorph.accentPath,
                scale: hovered ? 1.12 : 1,
              }}
              transition={
                prefersReducedMotion
                  ? { duration: 0.01 }
                  : {
                      d: PATH_MORPH_TRANSITION,
                      scale: { type: "spring", stiffness: 420, damping: 18 },
                    }
              }
              style={{ transformOrigin: "12px 12px" }}
              fill="var(--parlo-accent)"
            />
          </svg>
        </motion.span>
      </motion.span>

      {/* Locked Signature Logo Wordmark ("Parlo" stays permanently in its geometric logo font) */}
      <motion.span
        style={{ x: textX }}
        className={`relative font-display font-semibold tracking-[-0.028em] ${textSize} leading-[1.12] inline-flex items-baseline text-[var(--parlo-ink)]`}
        aria-label="Parlo"
      >
        <span
          className={`transition-colors duration-200 ${
            hovered ? "text-[var(--parlo-accent)]" : "text-[var(--parlo-ink)]"
          }`}
        >
          P
        </span>
        <span
          className={`transition-colors duration-200 ${
            hovered ? "text-[var(--parlo-primary)]" : "text-[var(--parlo-ink)]"
          }`}
        >
          arlo
        </span>

        {/* Hairline underline drawn smoothly in active culture pigments on hover */}
        <motion.span
          aria-hidden="true"
          className="pointer-events-none absolute left-0 right-0 -bottom-[2px] h-[1.5px] rounded-full origin-left"
          style={{
            background:
              "linear-gradient(90deg, var(--parlo-accent) 0%, var(--parlo-primary) 100%)",
          }}
          animate={
            prefersReducedMotion
              ? { scaleX: 0 }
              : { scaleX: hovered ? 1 : 0, opacity: hovered ? 0.95 : 0 }
          }
          transition={{ duration: 0.28, ease: [0.16, 1, 0.3, 1] }}
        />
      </motion.span>
    </span>
  );

  if (onClick) {
    return (
      <button
        type="button"
        onClick={onClick}
        title={`Parlo · Hover icon for ${cultureMorph.motifLabel}`}
        aria-label="Parlo — Return to Voice Studio"
        className="inline-flex items-center whitespace-nowrap shrink-0 cursor-pointer rounded-lg py-1 pr-1.5 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[var(--parlo-primary)]"
      >
        {content}
      </button>
    );
  }

  return content;
}

export default ParloLogo;
