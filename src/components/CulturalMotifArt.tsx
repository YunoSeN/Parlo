import { useEffect, useId, useRef, useState } from "react";
import { AnimatePresence, motion, useReducedMotion } from "motion/react";
import { getCultureByLanguage } from "../lib/cultures";

export interface CulturalMotifArtProps {
  languageCode: string;
  /** "medallion" = rich luminous cultural stamp; "mini" = compact emblem; "ambient" = refined header watermark */
  variant?: "medallion" | "mini" | "ambient";
  className?: string;
}

const SPRING_SOFT = {
  type: "spring" as const,
  stiffness: 300,
  damping: 20,
};

const MORPH_EASE = [0.16, 1, 0.3, 1] as const;

/**
 * CulturalMotifArt
 *
 * Hybrid Continuous-Morph + Precision Ink-Creation Cultural Emblem Engine:
 * 1. Persistent Morph Foundation (never unmounts): Topologically matched closed
 *    Bézier silhouettes (`haloPath`, `primarySilhouettePath`, `companionSilhouettePath`)
 *    continuously warp from the previous culture's shapes into the newly selected
 *    culture's exact landmark & companion silhouettes (`0.56s`).
 * 2. Museum-Grade Precision Vector Layer: Crisp, individually separated SVG
 *    primitives for all 8 cultures (zero stray pen-drag lines) that visibly draw
 *    themselves into existence via `pathLength: 0 -> 1` stroke creation + smooth
 *    sculptural spring settle right over the morphed silhouettes.
 */
export function CulturalMotifArt({
  languageCode,
  variant = "medallion",
  className = "",
}: CulturalMotifArtProps) {
  const [hovered, setHovered] = useState(false);
  const [morphEpoch, setMorphEpoch] = useState(0);
  const [isMorphing, setIsMorphing] = useState(false);
  const prevLangRef = useRef(languageCode);
  const morphTimerRef = useRef<number | null>(null);
  const prefersReducedMotion = useReducedMotion();
  const uid = useId().replace(/:/g, "");

  const culture = getCultureByLanguage(languageCode);
  const morph = culture.emblemMorph;
  const isAmbient = variant === "ambient";
  const isMini = variant === "mini";

  useEffect(() => {
    return () => {
      if (morphTimerRef.current !== null) {
        window.clearTimeout(morphTimerRef.current);
      }
    };
  }, []);

  useEffect(() => {
    if (prevLangRef.current !== languageCode) {
      prevLangRef.current = languageCode;
      setMorphEpoch((n) => n + 1);
      if (!prefersReducedMotion) {
        if (morphTimerRef.current !== null) {
          window.clearTimeout(morphTimerRef.current);
        }
        setIsMorphing(true);
        morphTimerRef.current = window.setTimeout(() => {
          setIsMorphing(false);
        }, 520);
      }
    }
  }, [languageCode, prefersReducedMotion]);

  const drawStroke = (delay = 0.08, duration = 0.56) =>
    prefersReducedMotion
      ? {}
      : {
          initial: { pathLength: 0, opacity: 0 },
          animate: { pathLength: 1, opacity: 1 },
          transition: {
            pathLength: { duration, delay, ease: MORPH_EASE },
            opacity: { duration: 0.2, delay },
          },
        };

  const revealBody = (delay = 0.14) =>
    prefersReducedMotion
      ? {}
      : {
          initial: { opacity: 0, scale: 0.88 },
          animate: { opacity: 1, scale: 1 },
          transition: { duration: 0.44, delay, ease: MORPH_EASE },
        };

  const renderPrecisionDetails = (code: string) => {
    switch (code) {
      /* ==================================================================
         FRENCH — Golden-Hour Eiffel Tower + Warm Flaky Croissant
         ================================================================== */
      case "fr":
        return (
          <g>
            {/* Sculpted Eiffel Tower silhouette with crisp openwork cutouts */}
            <motion.g
              {...revealBody(0.1)}
              style={{ transformOrigin: "44px 55px" }}
            >
              <path
                d="M44 10L45.4 20H46.8C47.5 39 52.8 61 65.5 85H55.5C52.4 76 48.8 70.5 44 70.5C39.2 70.5 35.6 76 32.5 85H22.5C35.2 61 40.5 39 41.2 20H42.6L44 10Z"
                fill={`url(#cm-primary-${uid})`}
                fillOpacity={isAmbient ? 0.68 : 0.96}
              />
              <path
                d="M44 26L41.8 44H46.2L44 26ZM39.6 50L35.4 63H52.6L48.4 50H39.6Z"
                fill="var(--parlo-canvas)"
                fillOpacity="0.9"
              />
              <motion.path
                d="M41.2 44L46.5 33M46.8 44L41.5 33M37 63L47 50M51 63L41 50"
                stroke="var(--parlo-primary)"
                strokeWidth="1.2"
                strokeLinecap="round"
                {...drawStroke(0.2, 0.5)}
              />
              <rect
                x="33.5"
                y="62.2"
                width="21"
                height="2.6"
                rx="1.2"
                fill="var(--parlo-ink)"
                fillOpacity="0.88"
              />
              <rect
                x="38.2"
                y="43.5"
                width="11.6"
                height="2.2"
                rx="1"
                fill="var(--parlo-ink)"
                fillOpacity="0.88"
              />
              <rect
                x="40.8"
                y="20"
                width="6.4"
                height="2"
                rx="0.9"
                fill="var(--parlo-glow)"
              />
            </motion.g>

            {/* Gently pulsing Parisian spire star */}
            <motion.g
              animate={
                prefersReducedMotion
                  ? undefined
                  : {
                      scale: hovered ? [1, 1.4, 1] : [1, 1.2, 1],
                      opacity: [0.72, 1, 0.72],
                    }
              }
              transition={{
                type: "tween",
                duration: hovered ? 0.9 : 2.6,
                repeat: Infinity,
                ease: "easeInOut",
              }}
              style={{ transformOrigin: "44px 10px" }}
            >
              <circle cx="44" cy="10" r="2.3" fill="var(--parlo-glow)" />
              <motion.path
                d="M44 5V15M39 10H49"
                stroke="var(--parlo-glow)"
                strokeWidth="1.25"
                strokeLinecap="round"
                {...drawStroke(0.24, 0.42)}
              />
            </motion.g>

            {/* Warm buttery croissant with gentle float */}
            <motion.g
              {...revealBody(0.18)}
              animate={
                prefersReducedMotion
                  ? { opacity: 1, scale: 1 }
                  : {
                      opacity: 1,
                      scale: 1,
                      rotate: hovered ? -9 : [-2, 2, -2],
                      y: hovered ? -2.5 : [0, -1.5, 0],
                    }
              }
              transition={
                hovered
                  ? SPRING_SOFT
                  : {
                      opacity: { duration: 0.36, delay: 0.16 },
                      scale: { duration: 0.36, delay: 0.16 },
                      rotate: {
                        type: "tween",
                        duration: 4.2,
                        repeat: Infinity,
                        ease: "easeInOut",
                      },
                      y: {
                        type: "tween",
                        duration: 4.2,
                        repeat: Infinity,
                        ease: "easeInOut",
                      },
                    }
              }
              style={{ transformOrigin: "74px 66px" }}
            >
              <path
                d="M60 72C61.5 60 72.5 54 83.5 59.5C87.5 61.5 90 66.5 87.5 71.5C85.5 75.2 81 74.2 79 71C76.5 67 70.5 66.5 67.5 71C65.5 74 61 75.5 60 72Z"
                fill="var(--parlo-glow)"
                fillOpacity={isAmbient ? 0.65 : 0.95}
                stroke="var(--parlo-accent)"
                strokeWidth="1.2"
                strokeLinejoin="round"
              />
              <motion.path
                d="M68 60.5C69.5 63.5 70 67.5 68.5 70.5M75 58.2C75.5 62 75 66.5 73.5 69.5M81.5 60.5C80.5 63.5 79 67 77.5 69.5"
                stroke="var(--parlo-canvas)"
                strokeWidth="1.25"
                strokeLinecap="round"
                strokeOpacity="0.9"
                {...drawStroke(0.24, 0.45)}
              />
            </motion.g>
          </g>
        );

      /* ==================================================================
         JAPANESE — Rising Sun Disc + Vermilion Torii + Sculpted Sakura
         ================================================================== */
      case "ja":
        return (
          <g>
            {/* Soft inner Kyoto sun disc & Higashiyama ridge */}
            <motion.circle
              cx="50"
              cy="43"
              r="18"
              fill="var(--parlo-accent)"
              fillOpacity={isAmbient ? 0.24 : 0.26}
              {...revealBody(0.08)}
              style={{ transformOrigin: "50px 43px" }}
            />
            <motion.path
              d="M12 83Q32 64 52 75T88 83Z"
              fill="var(--parlo-glow)"
              fillOpacity={isAmbient ? 0.25 : 0.24}
              {...revealBody(0.1)}
            />

            {/* Vermilion Torii Gate */}
            <motion.g
              {...revealBody(0.12)}
              style={{ transformOrigin: "50px 55px" }}
            >
              <path
                d="M32.5 31L29.5 82H35.5L38 31H32.5ZM62 31L64.5 82H70.5L67.5 31H62Z"
                fill="var(--parlo-accent)"
                fillOpacity={isAmbient ? 0.72 : 0.96}
              />
              <rect
                x="27"
                y="77"
                width="11"
                height="5.5"
                rx="1.4"
                fill="var(--parlo-ink)"
                fillOpacity="0.9"
              />
              <rect
                x="62"
                y="77"
                width="11"
                height="5.5"
                rx="1.4"
                fill="var(--parlo-ink)"
                fillOpacity="0.9"
              />
              <rect
                x="20"
                y="39"
                width="60"
                height="4.8"
                rx="1.2"
                fill="var(--parlo-accent)"
              />
              <rect
                x="46.2"
                y="30"
                width="7.6"
                height="12.5"
                rx="1"
                fill="var(--parlo-ink)"
                fillOpacity="0.92"
              />
              <rect
                x="48.5"
                y="32.5"
                width="3"
                height="7.5"
                rx="0.6"
                fill="var(--parlo-primary)"
              />
              <path
                d="M14 25.5C29 30.8 71 30.8 86 25.5L83.5 31.2C69.5 35.5 30.5 35.5 16.5 31.2L14 25.5Z"
                fill="var(--parlo-accent)"
              />
              <motion.path
                d="M13 24.5C29 29.8 71 29.8 87 24.5L85.8 27.6C70.5 32.2 29.5 32.2 14.2 27.6L13 24.5Z"
                fill="var(--parlo-ink)"
                fillOpacity="0.92"
                {...revealBody(0.16)}
              />
            </motion.g>

            {/* Sculpted 5-petal notched Sakura blossom */}
            <motion.g
              animate={
                prefersReducedMotion
                  ? undefined
                  : {
                      x: hovered ? [0, 4.5, 0] : [0, 2.5, 0],
                      y: hovered ? [0, 4.5, 0] : [0, 3, 0],
                      rotate: hovered ? [0, 22, 0] : [0, 12, 0],
                    }
              }
              transition={{
                type: "tween",
                duration: hovered ? 1.8 : 4.2,
                repeat: Infinity,
                ease: "easeInOut",
              }}
              style={{ transformOrigin: "78px 50px" }}
            >
              {[0, 72, 144, 216, 288].map((deg) => (
                <path
                  key={deg}
                  d="M78 50 C76.2 46.8 75.6 44.2 77.1 42.6 L78 44.1 L78.9 42.6 C80.4 44.2 79.8 46.8 78 50 Z"
                  fill="var(--parlo-primary)"
                  transform={`rotate(${deg} 78 50)`}
                />
              ))}
              <path
                d="M78 48.2 L79.3 50 L78 51.8 L76.7 50 Z"
                fill="var(--parlo-canvas)"
              />
            </motion.g>

            {/* Drifting sakura petal */}
            <motion.path
              d="M18 53C22 50 26 52.5 24.5 56.5C22 58.5 17.5 56.5 18 53Z"
              fill="var(--parlo-primary)"
              fillOpacity="0.9"
              animate={
                prefersReducedMotion
                  ? undefined
                  : { x: [0, 5.5, 0], y: [0, 7.5, 0], rotate: [0, -24, 0] }
              }
              transition={{
                type: "tween",
                duration: hovered ? 2 : 5,
                delay: 0.25,
                repeat: Infinity,
                ease: "easeInOut",
              }}
              style={{ transformOrigin: "21px 54px" }}
            />
          </g>
        );

      /* ==================================================================
         SPANISH — Alhambra Arch + 8-Point Azulejo Star + Pleated Abanico Fan
         ================================================================== */
      case "es":
        return (
          <g>
            {/* Alhambra arch hairline outline drawn smoothly */}
            <motion.path
              d="M17 85V45C17 26.5 31.5 14 49 14C66.5 14 81 26.5 81 45V85"
              stroke="var(--parlo-primary)"
              strokeOpacity="0.52"
              strokeWidth="1.3"
              strokeLinecap="round"
              {...drawStroke(0.08, 0.55)}
            />

            {/* Gently turning 8-point Andalusian Azulejo Ceramic Rosette */}
            <motion.g
              {...revealBody(0.12)}
              animate={
                prefersReducedMotion
                  ? { opacity: 1, scale: 1 }
                  : {
                      opacity: 1,
                      scale: 1,
                      rotate: hovered ? 45 : [0, 12, 0],
                    }
              }
              transition={
                hovered
                  ? { type: "spring", stiffness: 210, damping: 18 }
                  : {
                      opacity: { duration: 0.34, delay: 0.1 },
                      scale: { duration: 0.34, delay: 0.1 },
                      rotate: {
                        type: "tween",
                        duration: 6.5,
                        repeat: Infinity,
                        ease: "easeInOut",
                      },
                    }
              }
              style={{ transformOrigin: "41px 42px" }}
            >
              <rect
                x="24"
                y="25"
                width="34"
                height="34"
                rx="1.8"
                fill="var(--parlo-primary)"
                fillOpacity={isAmbient ? 0.58 : 0.94}
              />
              <rect
                x="24"
                y="25"
                width="34"
                height="34"
                rx="1.8"
                transform="rotate(45 41 42)"
                fill="var(--parlo-primary)"
                fillOpacity={isAmbient ? 0.58 : 0.94}
              />
              <rect
                x="29.5"
                y="30.5"
                width="23"
                height="23"
                fill="var(--parlo-canvas)"
                fillOpacity="0.92"
              />
              <rect
                x="29.5"
                y="30.5"
                width="23"
                height="23"
                transform="rotate(45 41 42)"
                fill="var(--parlo-canvas)"
                fillOpacity="0.92"
              />
              <circle cx="41" cy="42" r="8" fill="var(--parlo-accent)" />
              <circle cx="41" cy="42" r="3.4" fill="var(--parlo-canvas)" />
            </motion.g>

            {/* Pleated Spanish Abanico Fan */}
            <motion.g
              {...revealBody(0.16)}
              animate={
                prefersReducedMotion
                  ? { opacity: 1, scale: 1 }
                  : {
                      opacity: 1,
                      scale: hovered ? 1.09 : 1,
                      rotate: hovered ? -8 : [-2, 2, -2],
                    }
              }
              transition={
                hovered
                  ? SPRING_SOFT
                  : {
                      opacity: { duration: 0.36, delay: 0.15 },
                      scale: { duration: 0.36, delay: 0.15 },
                      rotate: {
                        type: "tween",
                        duration: 4.4,
                        repeat: Infinity,
                        ease: "easeInOut",
                      },
                    }
              }
              style={{ transformOrigin: "64px 82px" }}
            >
              <path
                d="M39 82A25 25 0 0 1 89 82Z"
                fill="var(--parlo-accent)"
                fillOpacity={isAmbient ? 0.65 : 0.96}
                stroke="var(--parlo-ink)"
                strokeOpacity="0.72"
                strokeWidth="1.15"
                strokeLinejoin="round"
              />
              <path
                d="M49 82A15 15 0 0 1 79 82Z"
                fill="var(--parlo-canvas)"
                fillOpacity="0.9"
              />
              <motion.path
                d="M64 82L45 66M64 82L54 60M64 82V57M64 82L74 60M64 82L83 66"
                stroke="var(--parlo-ink)"
                strokeOpacity="0.85"
                strokeWidth="1.15"
                strokeLinecap="round"
                {...drawStroke(0.22, 0.45)}
              />
              <circle cx="64" cy="82" r="2.8" fill="var(--parlo-primary)" />
              <circle cx="64" cy="82" r="1.2" fill="var(--parlo-canvas)" />
            </motion.g>
          </g>
        );

      /* ==================================================================
         GERMAN — Brandenburg Gate Colonnade + Bauhaus Kinetic Crest
         ================================================================== */
      case "de":
        return (
          <g>
            <rect
              x="16"
              y="18"
              width="28"
              height="64"
              rx="1.5"
              fill="var(--parlo-accent)"
              fillOpacity="0.14"
            />

            {/* Brandenburg Gate Architecture */}
            <motion.g
              {...revealBody(0.12)}
              style={{ transformOrigin: "50px 58px" }}
            >
              <rect
                x="36"
                y="25"
                width="28"
                height="6"
                rx="1"
                fill="var(--parlo-primary)"
              />
              <rect
                x="17"
                y="31"
                width="66"
                height="6.5"
                rx="1.2"
                fill="var(--parlo-ink)"
                fillOpacity="0.9"
              />
              <rect
                x="20"
                y="37.5"
                width="60"
                height="3"
                fill="var(--parlo-primary)"
              />

              {[23, 35.5, 48, 60.5, 73].map((cx, i) => (
                <g key={cx}>
                  <rect
                    x={cx - 2.2}
                    y="40.5"
                    width="4.4"
                    height="37"
                    fill="var(--parlo-primary)"
                    fillOpacity={isAmbient ? 0.65 : 0.94}
                  />
                  <motion.line
                    x1={cx - 0.6}
                    y1="42"
                    x2={cx - 0.6}
                    y2="76"
                    stroke="var(--parlo-canvas)"
                    strokeWidth="0.95"
                    strokeOpacity="0.68"
                    {...drawStroke(0.16 + i * 0.04, 0.36)}
                  />
                </g>
              ))}
              <rect
                x="14"
                y="77.5"
                width="72"
                height="5"
                rx="1.2"
                fill="var(--parlo-ink)"
                fillOpacity="0.9"
              />
            </motion.g>

            {/* Bauhaus kinetic balance crest */}
            <motion.g
              {...revealBody(0.18)}
              animate={
                prefersReducedMotion
                  ? { opacity: 1, scale: 1 }
                  : {
                      opacity: 1,
                      scale: 1,
                      rotate: hovered ? 12 : [-4, 4, -4],
                    }
              }
              transition={
                hovered
                  ? { type: "spring", stiffness: 290, damping: 14 }
                  : {
                      opacity: { duration: 0.34, delay: 0.16 },
                      scale: { duration: 0.34, delay: 0.16 },
                      rotate: {
                        type: "tween",
                        duration: 3.8,
                        repeat: Infinity,
                        ease: "easeInOut",
                      },
                    }
              }
              style={{ transformOrigin: "50px 21px" }}
            >
              <motion.line
                x1="34"
                y1="21"
                x2="66"
                y2="21"
                stroke="var(--parlo-ink)"
                strokeOpacity="0.92"
                strokeWidth="1.8"
                strokeLinecap="round"
                {...drawStroke(0.2, 0.4)}
              />
              <circle cx="50" cy="15.5" r="4.8" fill="var(--parlo-accent)" />
              <polygon
                points="34,21 38,14 42,21"
                fill="var(--parlo-primary)"
              />
              <rect
                x="60"
                y="15.5"
                width="5.5"
                height="5.5"
                fill="var(--parlo-glow)"
              />
            </motion.g>
          </g>
        );

      /* ==================================================================
         ITALIAN — Florentine Duomo Cupola + Faceted Moka Espresso Pot
         ================================================================== */
      case "it":
        return (
          <g>
            {/* Florentine Brunelleschi Cupola */}
            <motion.g
              {...revealBody(0.1)}
              style={{ transformOrigin: "50px 44px" }}
            >
              <rect
                x="46.5"
                y="13"
                width="7"
                height="8"
                rx="1"
                fill="var(--parlo-primary)"
              />
              <motion.circle
                cx="50"
                cy="11"
                r="2.4"
                fill="var(--parlo-glow)"
                animate={
                  prefersReducedMotion ? undefined : { scale: [1, 1.32, 1] }
                }
                transition={{
                  type: "tween",
                  duration: 2.8,
                  repeat: Infinity,
                  ease: "easeInOut",
                }}
                style={{ transformOrigin: "50px 11px" }}
              />
              <path
                d="M21 53C21 33 34 21 50 21C66 21 79 33 79 53Z"
                fill="var(--parlo-accent)"
                fillOpacity={isAmbient ? 0.36 : 0.38}
                stroke="var(--parlo-accent)"
                strokeWidth="1.4"
              />
              <motion.path
                d="M50 21V53M50 21C39 27 33 39 33 53M50 21C61 27 67 39 67 53"
                stroke="var(--parlo-canvas)"
                strokeWidth="1.35"
                strokeOpacity="0.9"
                strokeLinecap="round"
                {...drawStroke(0.16, 0.5)}
              />
              <rect
                x="20"
                y="53"
                width="60"
                height="12"
                fill="var(--parlo-primary)"
                fillOpacity="0.22"
              />
              <circle cx="31" cy="59" r="2.3" fill="var(--parlo-primary)" />
              <circle cx="69" cy="59" r="2.3" fill="var(--parlo-primary)" />
            </motion.g>

            {/* Faceted Italian Moka Espresso Pot */}
            <motion.g
              {...revealBody(0.16)}
              animate={
                prefersReducedMotion
                  ? { opacity: 1, scale: 1 }
                  : { opacity: 1, scale: 1, y: hovered ? -3 : 0 }
              }
              transition={SPRING_SOFT}
              style={{ transformOrigin: "50px 66px" }}
            >
              <motion.path
                d="M62 55H68.5C71.5 55 72 64.5 66 66.5L60.5 67.5"
                stroke="var(--parlo-ink)"
                strokeOpacity="0.9"
                strokeWidth="2.5"
                strokeLinecap="round"
                strokeLinejoin="round"
                {...drawStroke(0.22, 0.42)}
              />
              <polygon
                points="37,51 63,51 58.5,67 41.5,67"
                fill="var(--parlo-surface-solid)"
                stroke="var(--parlo-ink)"
                strokeOpacity="0.8"
                strokeWidth="1.35"
                strokeLinejoin="round"
              />
              <polygon
                points="52,51 63,51 58.5,67 51,67"
                fill="var(--parlo-primary)"
                fillOpacity="0.32"
              />
              <polygon
                points="41.5,67 58.5,67 63,83 37,83"
                fill="var(--parlo-primary)"
                fillOpacity={isAmbient ? 0.65 : 0.95}
                stroke="var(--parlo-ink)"
                strokeOpacity="0.8"
                strokeWidth="1.35"
                strokeLinejoin="round"
              />
              <polygon
                points="46,67 52,67 53,83 45,83"
                fill="var(--parlo-canvas)"
                fillOpacity="0.28"
              />
              <polygon
                points="43,46.5 57,46.5 63,51 37,51"
                fill="var(--parlo-accent)"
                stroke="var(--parlo-ink)"
                strokeOpacity="0.8"
                strokeWidth="1.25"
                strokeLinejoin="round"
              />
              <rect
                x="47.5"
                y="42.5"
                width="5"
                height="4"
                rx="1.2"
                fill="var(--parlo-ink)"
                fillOpacity="0.92"
              />
              <motion.path
                d="M46 39C44 35.5 48 33 46 29.5M54 38C52 34.5 56 32 54 28.5"
                stroke="var(--parlo-glow)"
                strokeWidth="1.5"
                strokeLinecap="round"
                animate={
                  prefersReducedMotion
                    ? undefined
                    : { y: [0, -3.5, 0], opacity: [0.35, 0.98, 0.35] }
                }
                transition={{
                  type: "tween",
                  duration: hovered ? 1.15 : 2.4,
                  repeat: Infinity,
                  ease: "easeInOut",
                }}
              />
            </motion.g>
          </g>
        );

      /* ==================================================================
         MANDARIN — Swaying Suzhou Silk Lantern + Cinnabar Calligraphy Seal
         ================================================================== */
      case "zh":
        return (
          <g>
            {/* Swaying Suzhou Silk Lantern */}
            <motion.g
              {...revealBody(0.1)}
              animate={
                prefersReducedMotion
                  ? { opacity: 1, scale: 1 }
                  : {
                      opacity: 1,
                      scale: 1,
                      rotate: hovered ? [-6, 6, -2, 0] : [-3, 3, -3],
                    }
              }
              transition={{
                opacity: { duration: 0.36, delay: 0.1 },
                scale: { duration: 0.36, delay: 0.1 },
                rotate: {
                  type: "tween",
                  duration: hovered ? 1.2 : 4.4,
                  repeat: hovered ? 0 : Infinity,
                  ease: "easeInOut",
                },
              }}
              style={{ transformOrigin: "44px 10px" }}
            >
              <motion.line
                x1="44"
                y1="10"
                x2="44"
                y2="23"
                stroke="var(--parlo-glow)"
                strokeWidth="1.6"
                {...drawStroke(0.12, 0.36)}
              />
              <ellipse
                cx="44"
                cy="45"
                rx="21"
                ry="19.5"
                fill="var(--parlo-accent)"
                fillOpacity={isAmbient ? 0.65 : 0.95}
                stroke="var(--parlo-glow)"
                strokeWidth="1.2"
              />
              <ellipse
                cx="44"
                cy="45"
                rx="10"
                ry="16.5"
                fill="var(--parlo-glow)"
                fillOpacity="0.3"
              />
              <motion.path
                d="M44 25.5C35.5 34 35.5 56 44 64.5M44 25.5C52.5 34 52.5 56 44 64.5"
                stroke="var(--parlo-canvas)"
                strokeWidth="1.15"
                strokeOpacity="0.78"
                {...drawStroke(0.18, 0.48)}
              />
              <rect
                x="35.5"
                y="22.5"
                width="17"
                height="4.5"
                rx="1.4"
                fill="var(--parlo-ink)"
                fillOpacity="0.92"
              />
              <rect
                x="36.5"
                y="63"
                width="15"
                height="4.5"
                rx="1.4"
                fill="var(--parlo-ink)"
                fillOpacity="0.92"
              />
              <motion.line
                x1="44"
                y1="67.5"
                x2="44"
                y2="79"
                stroke="var(--parlo-glow)"
                strokeWidth="1.8"
                strokeLinecap="round"
                {...drawStroke(0.22, 0.36)}
              />
              <path d="M41.2 76L44 84L46.8 76Z" fill="var(--parlo-accent)" />
            </motion.g>

            {/* Cinnabar Calligraphy Chop Seal */}
            <motion.g
              {...revealBody(0.18)}
              animate={
                prefersReducedMotion
                  ? { opacity: 1, scale: 1 }
                  : {
                      opacity: 1,
                      scale: hovered ? 1.1 : 1,
                      rotate: hovered ? -5 : 0,
                    }
              }
              transition={SPRING_SOFT}
              style={{ transformOrigin: "77px 74px" }}
            >
              <rect
                x="66"
                y="63"
                width="22"
                height="22"
                rx="3"
                fill="var(--parlo-primary)"
                fillOpacity={isAmbient ? 0.65 : 0.96}
              />
              <rect
                x="69"
                y="66"
                width="16"
                height="16"
                rx="1.5"
                stroke="var(--parlo-canvas)"
                strokeWidth="1.1"
                strokeOpacity="0.9"
              />
              <motion.path
                d="M72.5 70H81.5M77 70V78.5M73 74.2H81M73.5 78.5H80.5"
                stroke="var(--parlo-canvas)"
                strokeWidth="1.35"
                strokeLinecap="round"
                {...drawStroke(0.24, 0.45)}
              />
            </motion.g>
          </g>
        );

      /* ==================================================================
         KOREAN — Bukchon Hanok Curved Roof + Revolving Taegeuk Halo
         ================================================================== */
      case "ko":
        return (
          <g>
            {/* Revolving Taegeuk Emblem */}
            <motion.g
              {...revealBody(0.1)}
              animate={
                prefersReducedMotion
                  ? { opacity: 1, scale: 1 }
                  : { opacity: 1, scale: 1, rotate: hovered ? 180 : 360 }
              }
              transition={
                hovered
                  ? { type: "spring", stiffness: 180, damping: 18 }
                  : {
                      opacity: { duration: 0.34, delay: 0.08 },
                      scale: { duration: 0.34, delay: 0.08 },
                      rotate: {
                        type: "tween",
                        duration: 16,
                        repeat: Infinity,
                        ease: "linear",
                      },
                    }
              }
              style={{ transformOrigin: "50px 34px" }}
            >
              <circle
                cx="50"
                cy="34"
                r="18"
                fill="var(--parlo-accent)"
                fillOpacity={isAmbient ? 0.34 : 0.38}
              />
              <path
                d="M32 34A18 18 0 0 0 68 34C62.5 27.5 55.5 27.5 50 34C44.5 40.5 37.5 40.5 32 34Z"
                fill="var(--parlo-primary)"
                fillOpacity={isAmbient ? 0.42 : 0.48}
              />
            </motion.g>

            {/* Bukchon Hanok Curved Giwa Roof & Changhoji Lattice */}
            <motion.g
              {...revealBody(0.14)}
              style={{ transformOrigin: "50px 58px" }}
            >
              <path
                d="M11 49C27 47.5 39 39.5 50 28C61 39.5 73 47.5 89 49L83 56C69 55 58 51.5 50 45.5C42 51.5 31 55 17 56L11 49Z"
                fill="var(--parlo-ink)"
                fillOpacity={isAmbient ? 0.65 : 0.94}
              />
              <motion.path
                d="M15 49.5C30 47.5 41 40.5 50 31.5C59 40.5 70 47.5 85 49.5"
                stroke="var(--parlo-primary)"
                strokeWidth="1.4"
                strokeLinecap="round"
                {...drawStroke(0.18, 0.48)}
              />
              <rect
                x="23"
                y="55"
                width="54"
                height="4.2"
                fill="var(--parlo-accent)"
              />
              <rect
                x="26"
                y="59.2"
                width="4.2"
                height="20.8"
                fill="var(--parlo-primary)"
              />
              <rect
                x="69.8"
                y="59.2"
                width="4.2"
                height="20.8"
                fill="var(--parlo-primary)"
              />
              <rect
                x="35"
                y="62"
                width="30"
                height="16"
                rx="1"
                fill="var(--parlo-surface-solid)"
                stroke="var(--parlo-primary)"
                strokeWidth="1.3"
              />
              <motion.path
                d="M45 62V78M55 62V78M35 70H65"
                stroke="var(--parlo-primary)"
                strokeWidth="1.05"
                strokeOpacity="0.75"
                {...drawStroke(0.24, 0.42)}
              />
              <rect
                x="19"
                y="80"
                width="62"
                height="4.5"
                rx="1.2"
                fill="var(--parlo-ink)"
                fillOpacity="0.88"
              />
            </motion.g>
          </g>
        );

      /* ==================================================================
         PORTUGUESE — Lisbon Tram 28 + Rotating Cobalt Azulejo Ceramic Tile
         ================================================================== */
      case "pt":
      default:
        return (
          <g>
            {/* Rotating Cobalt Azulejo Ceramic Tile (top-right, completely isolated) */}
            <motion.g
              {...revealBody(0.14)}
              animate={
                prefersReducedMotion
                  ? { opacity: 1, scale: 1 }
                  : {
                      opacity: 1,
                      scale: 1,
                      rotate: hovered ? 90 : [0, 8, 0],
                    }
              }
              transition={
                hovered
                  ? SPRING_SOFT
                  : {
                      opacity: { duration: 0.34, delay: 0.14 },
                      scale: { duration: 0.34, delay: 0.14 },
                      rotate: {
                        type: "tween",
                        duration: 5.5,
                        repeat: Infinity,
                        ease: "easeInOut",
                      },
                    }
              }
              style={{ transformOrigin: "78px 25px" }}
            >
              <rect
                x="67"
                y="14"
                width="22"
                height="22"
                rx="2.6"
                fill="var(--parlo-surface-solid)"
                stroke="var(--parlo-primary)"
                strokeWidth="1.45"
              />
              <path
                d="M78 17.5L85.5 25L78 32.5L70.5 25Z"
                fill="var(--parlo-primary)"
                fillOpacity={isAmbient ? 0.65 : 0.94}
              />
              <circle cx="78" cy="25" r="2.6" fill="var(--parlo-canvas)" />
            </motion.g>

            {/* Clean overhead catenary cable & steel tramway rail (independent strokes) */}
            <motion.path
              d="M10 29Q48 33 88 26"
              stroke="var(--parlo-ink)"
              strokeWidth="1.15"
              strokeOpacity="0.48"
              strokeLinecap="round"
              {...drawStroke(0.1, 0.5)}
            />
            <motion.line
              x1="12"
              y1="82.5"
              x2="88"
              y2="82.5"
              stroke="var(--parlo-ink)"
              strokeOpacity="0.78"
              strokeWidth="1.8"
              strokeLinecap="round"
              {...drawStroke(0.12, 0.45)}
            />

            {/* Lisbon Tram 28 gently gliding along the Alfama rail */}
            <motion.g
              {...revealBody(0.12)}
              animate={
                prefersReducedMotion
                  ? { opacity: 1, scale: 1 }
                  : {
                      opacity: 1,
                      scale: 1,
                      x: hovered ? 5 : [-1.5, 2, -1.5],
                    }
              }
              transition={
                hovered
                  ? { type: "spring", stiffness: 260, damping: 18 }
                  : {
                      opacity: { duration: 0.36, delay: 0.12 },
                      scale: { duration: 0.36, delay: 0.12 },
                      x: {
                        type: "tween",
                        duration: 4.6,
                        repeat: Infinity,
                        ease: "easeInOut",
                      },
                    }
              }
              style={{ transformOrigin: "47px 62px" }}
            >
              {/* Rooftop diamond pantograph */}
              <motion.path
                d="M41 44L47 30.5L53 44M43 30.5H51"
                stroke="var(--parlo-ink)"
                strokeOpacity="0.86"
                strokeWidth="1.5"
                strokeLinecap="round"
                strokeLinejoin="round"
                {...drawStroke(0.18, 0.42)}
              />
              {/* Roof crown */}
              <rect
                x="27"
                y="42"
                width="40"
                height="4"
                rx="2"
                fill="var(--parlo-ink)"
                fillOpacity="0.9"
              />
              {/* Upper cream cabin */}
              <rect
                x="21"
                y="45.5"
                width="52"
                height="16.5"
                rx="4.5"
                fill="var(--parlo-surface-solid)"
                stroke="var(--parlo-ink)"
                strokeOpacity="0.78"
                strokeWidth="1.4"
              />
              {/* Lower warm ochre-gold tram chassis */}
              <path
                d="M21 60.5H73V72C73 74.5 71 76.5 68.5 76.5H25.5C23 76.5 21 74.5 21 72V60.5Z"
                fill="var(--parlo-accent)"
                fillOpacity={isAmbient ? 0.68 : 0.96}
                stroke="var(--parlo-ink)"
                strokeOpacity="0.78"
                strokeWidth="1.4"
              />
              {/* Three symmetrical panoramic windows */}
              {[26.5, 39.5, 52.5].map((wx) => (
                <rect
                  key={wx}
                  x={wx}
                  y="49"
                  width="9.5"
                  height="9.5"
                  rx="2"
                  fill="var(--parlo-primary)"
                  fillOpacity="0.34"
                  stroke="var(--parlo-ink)"
                  strokeOpacity="0.72"
                  strokeWidth="1.15"
                />
              ))}
              {/* Glowing brass headlamp */}
              <circle
                cx="67.5"
                cy="68.5"
                r="2.6"
                fill="var(--parlo-glow)"
                stroke="var(--parlo-ink)"
                strokeWidth="1"
              />
              {/* Twin flanged iron bogie wheels */}
              <circle
                cx="33"
                cy="79"
                r="3.4"
                fill="var(--parlo-ink)"
                fillOpacity="0.92"
              />
              <circle cx="33" cy="79" r="1.2" fill="var(--parlo-canvas)" />
              <circle
                cx="61"
                cy="79"
                r="3.4"
                fill="var(--parlo-ink)"
                fillOpacity="0.92"
              />
              <circle cx="61" cy="79" r="1.2" fill="var(--parlo-canvas)" />
            </motion.g>
          </g>
        );
    }
  };

  const svgElement = (
    <svg
      viewBox="0 0 100 100"
      fill="none"
      className="w-full h-full"
      aria-hidden="true"
    >
      <defs>
        <radialGradient id={`cm-halo-${uid}`} cx="50%" cy="46%" r="50%">
          <stop offset="0%" stopColor="var(--parlo-glow)" stopOpacity="0.4" />
          <stop
            offset="65%"
            stopColor="var(--parlo-primary)"
            stopOpacity="0.14"
          />
          <stop offset="100%" stopColor="var(--parlo-primary)" stopOpacity="0" />
        </radialGradient>
        <linearGradient
          id={`cm-primary-${uid}`}
          x1="50%"
          y1="8%"
          x2="50%"
          y2="90%"
        >
          <stop offset="0%" stopColor="var(--parlo-primary)" />
          <stop offset="100%" stopColor="var(--parlo-accent)" />
        </linearGradient>
      </defs>

      {/* LAYER 1: Persistent Morphing Atmospheric Halo (NEVER unmounts!) */}
      <motion.path
        initial={false}
        animate={{ d: morph.haloPath }}
        transition={
          prefersReducedMotion
            ? { duration: 0.01 }
            : { duration: 0.6, ease: MORPH_EASE }
        }
        fill={`url(#cm-halo-${uid})`}
      />

      {/* LAYER 2: Permanently Mounted Continuous Morph Silhouettes (visible only during morph transition, then fade cleanly to 0) */}
      {!prefersReducedMotion && (
        <motion.g
          pointerEvents="none"
          initial={false}
          animate={{ opacity: isMorphing ? 0.72 : 0 }}
          transition={{ duration: isMorphing ? 0.14 : 0.34, ease: MORPH_EASE }}
        >
          <motion.path
            initial={false}
            animate={{ d: morph.primarySilhouettePath }}
            transition={{ duration: 0.56, ease: MORPH_EASE }}
            fill="var(--parlo-primary)"
            fillOpacity={0.34}
            stroke="var(--parlo-primary)"
            strokeOpacity={0.68}
            strokeWidth={1.15}
          />
          <motion.path
            initial={false}
            animate={{ d: morph.companionSilhouettePath }}
            transition={{ duration: 0.58, ease: MORPH_EASE }}
            fill="var(--parlo-accent)"
            fillOpacity={0.34}
            stroke="var(--parlo-glow)"
            strokeOpacity={0.55}
            strokeWidth={1.0}
          />
        </motion.g>
      )}

      {/* LAYER 3: Precision Museum-Grade Multi-Part Cultural Vector Illustration */}
      <AnimatePresence mode="wait" initial={false}>
        <motion.g
          key={`art-${languageCode}`}
          initial={prefersReducedMotion ? { opacity: 0 } : { opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={
            prefersReducedMotion
              ? { opacity: 0 }
              : { opacity: 0, scale: 0.9 }
          }
          transition={{ duration: 0.2, ease: MORPH_EASE }}
          style={{ transformOrigin: "50px 50px" }}
        >
          {renderPrecisionDetails(languageCode)}
        </motion.g>
      </AnimatePresence>
    </svg>
  );

  if (isAmbient) {
    return (
      <div className={`pointer-events-none select-none opacity-25 ${className}`}>
        {svgElement}
      </div>
    );
  }

  return (
    <motion.div
      onMouseEnter={() => setHovered(true)}
      onMouseLeave={() => setHovered(false)}
      whileHover={prefersReducedMotion ? undefined : { scale: 1.06, y: -1.5 }}
      transition={{ type: "spring", stiffness: 420, damping: 20 }}
      style={{
        background:
          "radial-gradient(circle at 30% 20%, color-mix(in srgb, var(--parlo-primary) 20%, transparent), color-mix(in srgb, var(--parlo-accent) 10%, transparent) 58%, var(--parlo-canvas) 100%)",
      }}
      title={`${culture.atelierName} — ${culture.patternName}`}
      className={`relative shrink-0 rounded-2xl border border-[var(--parlo-border)] parlo-well-recessed overflow-hidden cursor-pointer shadow-inner ${className}`}
    >
      {/* Subtle creation aura pulse ring when morphing into a new language */}
      {!prefersReducedMotion && morphEpoch > 0 && (
        <motion.span
          key={`ring-${morphEpoch}`}
          aria-hidden="true"
          initial={{ scale: 0.35, opacity: 0.65 }}
          animate={{ scale: 1.5, opacity: 0 }}
          transition={{
            type: "tween",
            duration: 0.68,
            ease: MORPH_EASE,
          }}
          className="pointer-events-none absolute inset-2 rounded-full border border-[var(--parlo-primary)]"
        />
      )}

      <div className={isMini ? "w-full h-full p-0.5" : "w-full h-full p-1"}>
        {svgElement}
      </div>
    </motion.div>
  );
}

export default CulturalMotifArt;
