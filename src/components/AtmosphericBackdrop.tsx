import { useEffect } from "react";
import {
  motion,
  useMotionValue,
  useReducedMotion,
  useSpring,
  useTransform,
} from "motion/react";
import { getCultureByLanguage } from "../lib/cultures";
import { AppView } from "../types";
import { LightRays, RaysOrigin } from "./LightRays";

export interface AtmosphericBackdropProps {
  /** Active language code drives WebGL LightRays spectrum & morphing glow spheres */
  languageCode: string;
  /** Active category view shifts the volumetric ray origin & architectural light balance */
  activeView?: AppView;
  /** Whether Obsidian Glass (dark) or Soft Ceramic (light) finish is active */
  isDark?: boolean;
}

interface ViewLightProfile {
  origin: RaysOrigin;
  spread: number;
  length: number;
  pulsating: boolean;
  spherePrimaryPos: { top: string; right: string };
  sphereAccentPos: { bottom: string; left: string };
}

const VIEW_LIGHT_PROFILES: Record<Exclude<AppView, "spatial">, ViewLightProfile> = {
  studio: {
    origin: "top-center",
    spread: 1.08,
    length: 1.55,
    pulsating: false,
    spherePrimaryPos: { top: "-14%", right: "-6%" },
    sphereAccentPos: { bottom: "-18%", left: "-8%" },
  },
  scenarios: {
    origin: "top-right",
    spread: 0.96,
    length: 1.65,
    pulsating: false,
    spherePrimaryPos: { top: "-12%", right: "4%" },
    sphereAccentPos: { bottom: "-16%", left: "-4%" },
  },
  phrasebook: {
    origin: "top-left",
    spread: 1.0,
    length: 1.6,
    pulsating: false,
    spherePrimaryPos: { top: "-16%", right: "10%" },
    sphereAccentPos: { bottom: "-14%", left: "2%" },
  },
  review: {
    origin: "right",
    spread: 0.9,
    length: 1.55,
    pulsating: false,
    spherePrimaryPos: { top: "-10%", right: "-4%" },
    sphereAccentPos: { bottom: "-16%", left: "-10%" },
  },
  pricing: {
    origin: "top-center",
    spread: 1.2,
    length: 1.75,
    pulsating: true,
    spherePrimaryPos: { top: "-18%", right: "0%" },
    sphereAccentPos: { bottom: "-18%", left: "0%" },
  },
};

/**
 * AtmosphericBackdrop
 *
 * Cinematic, pure architectural atmosphere synchronized across EVERY category
 * and EVERY language — zero illustrative cartoons:
 *  1. Native WebGL volumetric LightRays shifting origin per category & color per language
 *  2. 60x60px precision architectural grid softly masked radially
 *  3. Organic 9s morphing background glow blobs + 120px blurred luminous spheres
 *  4. Subtle concentric architectural / molded ceramic rings in the outer margin
 *  5. Crisp grainy SVG fractal noise texture
 */
export function AtmosphericBackdrop({
  languageCode,
  activeView = "studio",
  isDark = true,
}: AtmosphericBackdropProps) {
  const prefersReducedMotion = useReducedMotion();
  const rawX = useMotionValue(0);
  const rawY = useMotionValue(0);

  const smoothX = useSpring(rawX, { stiffness: 42, damping: 26, mass: 1.4 });
  const smoothY = useSpring(rawY, { stiffness: 42, damping: 26, mass: 1.4 });

  const sphere1X = useTransform(smoothX, [-1, 1], [-28, 28]);
  const sphere1Y = useTransform(smoothY, [-1, 1], [-18, 18]);

  const sphere2X = useTransform(smoothX, [-1, 1], [32, -32]);
  const sphere2Y = useTransform(smoothY, [-1, 1], [20, -20]);

  const ringX = useTransform(smoothX, [-1, 1], [14, -14]);
  const ringY = useTransform(smoothY, [-1, 1], [10, -10]);

  useEffect(() => {
    if (prefersReducedMotion) return;

    const handlePointerMove = (e: PointerEvent) => {
      if (e.pointerType === "touch") return;
      const nx = (e.clientX / window.innerWidth) * 2 - 1;
      const ny = (e.clientY / window.innerHeight) * 2 - 1;
      rawX.set(nx);
      rawY.set(ny);
    };

    window.addEventListener("pointermove", handlePointerMove, { passive: true });
    return () => window.removeEventListener("pointermove", handlePointerMove);
  }, [prefersReducedMotion, rawX, rawY]);

  const culture = getCultureByLanguage(languageCode);
  const viewKey = activeView === "spatial" ? "studio" : activeView;
  const profile = VIEW_LIGHT_PROFILES[viewKey];

  const primaryRayColor = isDark ? culture.darkPrimaryHex : culture.primaryHex;
  const secondaryRayColor = isDark ? culture.darkAccentHex : culture.accentHex;

  return (
    <div
      aria-hidden="true"
      className="pointer-events-none absolute inset-0 overflow-hidden rounded-[inherit] z-0"
    >
      {/* 1. Native WebGL Volumetric LightRays (adapts live to language spectrum + category view) */}
      <div className="absolute inset-x-0 top-0 h-[760px] max-h-full overflow-hidden">
        <LightRays
          raysOrigin={profile.origin}
          raysColor={primaryRayColor}
          secondaryColor={secondaryRayColor}
          raysSpeed={0.85}
          lightSpread={profile.spread}
          rayLength={profile.length}
          pulsating={profile.pulsating}
          followMouse={!prefersReducedMotion}
          mouseInfluence={0.2}
          noiseAmount={0.035}
          distortion={0.05}
          intensity={isDark ? 0.34 : 0.13}
        />
      </div>

      {/* 2. Precision 60x60px Architectural Grid */}
      <div
        className="absolute inset-0 parlo-grid-60"
        style={{
          maskImage:
            "radial-gradient(ellipse 92% 76% at 50% 16%, black 22%, transparent 92%)",
          WebkitMaskImage:
            "radial-gradient(ellipse 92% 76% at 50% 16%, black 22%, transparent 92%)",
        }}
      />

      {/* 3. Organic Morphing Luminous Glow Blobs (9s border-radius morph + 120px blur) */}
      <motion.div
        style={
          prefersReducedMotion
            ? {
                top: profile.spherePrimaryPos.top,
                right: profile.spherePrimaryPos.right,
              }
            : {
                x: sphere1X,
                y: sphere1Y,
                top: profile.spherePrimaryPos.top,
                right: profile.spherePrimaryPos.right,
              }
        }
        className={`parlo-glow-sphere parlo-glow-sphere-primary w-[520px] h-[520px] sm:w-[660px] sm:h-[660px] transition-[top,right] duration-700 ease-out ${
          prefersReducedMotion ? "" : "parlo-morph-blob"
        }`}
      />

      <motion.div
        style={
          prefersReducedMotion
            ? {
                bottom: profile.sphereAccentPos.bottom,
                left: profile.sphereAccentPos.left,
              }
            : {
                x: sphere2X,
                y: sphere2Y,
                bottom: profile.sphereAccentPos.bottom,
                left: profile.sphereAccentPos.left,
              }
        }
        className={`parlo-glow-sphere parlo-glow-sphere-accent w-[440px] h-[440px] sm:w-[580px] sm:h-[580px] transition-[bottom,left] duration-700 ease-out ${
          prefersReducedMotion ? "" : "parlo-morph-blob"
        }`}
      />

      {/* 4. Subtle Concentric Architectural / Neumorphic Molded Rings */}
      <motion.div
        style={
          prefersReducedMotion
            ? { top: "7%", right: "-5%" }
            : { x: ringX, y: ringY, top: "7%", right: "-5%" }
        }
        className="hidden lg:flex items-center justify-center absolute w-[420px] h-[420px] opacity-35"
      >
        <div className="parlo-arch-ring-outer w-full h-full flex items-center justify-center p-12">
          <div className="parlo-arch-ring-inner w-full h-full flex items-center justify-center p-12">
            <div className="parlo-arch-ring-outer w-full h-full opacity-70" />
          </div>
        </div>
      </motion.div>

      {/* 5. Grainy SVG Fractal Noise Overlay */}
      <div className="absolute inset-0 parlo-noise-overlay" />
    </div>
  );
}

export default AtmosphericBackdrop;
