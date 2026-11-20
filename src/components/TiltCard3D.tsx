import React, { useRef, useState } from "react";
import {
  motion,
  useMotionTemplate,
  useMotionValue,
  useReducedMotion,
  useSpring,
  useTransform,
} from "motion/react";

export interface TiltCard3DProps {
  /** Maximum tilt angle in degrees toward the mouse pointer (default 7deg) */
  maxTilt?: number;
  /** Magnetic translation pull in pixels toward the mouse pointer (default 5px) */
  magneticPull?: number;
  /** Subtle scale lift on hover (default 1.015) */
  hoverScale?: number;
  /** Show directional cursor spotlight & glass specular sheen (default true) */
  glare?: boolean;
  /** Disable 3D tilt & magnetic pull */
  disabled?: boolean;
  className?: string;
  style?: React.CSSProperties;
  children: React.ReactNode;
}

/**
 * TiltCard3D
 *
 * Physics-driven Magnetic 3D Parallax card using MotionValues + springs
 * (zero React re-renders on pointer move):
 * - Tilts smoothly toward the user's mouse pointer (tactile responsive 3D depth)
 * - Subtle magnetic translation pull following the pointer
 * - Raycast-style cursor-tracking luminous hairline rim & specular sheen
 */
export function TiltCard3D({
  maxTilt = 7,
  magneticPull = 5,
  hoverScale = 1.015,
  glare = true,
  disabled = false,
  className = "",
  style,
  children,
}: TiltCard3DProps) {
  const ref = useRef<HTMLDivElement | null>(null);
  const prefersReducedMotion = useReducedMotion();
  const [hovered, setHovered] = useState(false);

  const normX = useMotionValue(0);
  const normY = useMotionValue(0);
  const spotX = useMotionValue(50);
  const spotY = useMotionValue(50);

  const springConfig = { stiffness: 280, damping: 24, mass: 0.6 };
  const smoothX = useSpring(normX, springConfig);
  const smoothY = useSpring(normY, springConfig);

  // Tilt smoothly toward the user's pointer for tactile physical depth
  const rotateY = useTransform(smoothX, [-0.5, 0.5], [-maxTilt, maxTilt]);
  const rotateX = useTransform(smoothY, [-0.5, 0.5], [maxTilt, -maxTilt]);

  // Subtle magnetic pull translating the card gently toward the mouse pointer
  const pullX = useTransform(smoothX, [-0.5, 0.5], [-magneticPull, magneticPull]);
  const pullY = useTransform(smoothY, [-0.5, 0.5], [-magneticPull, magneticPull]);

  const borderSpotBg = useMotionTemplate`radial-gradient(220px circle at ${spotX}% ${spotY}%, color-mix(in srgb, var(--parlo-primary) 54%, var(--parlo-accent) 30%), transparent 68%)`;

  const shouldSkip = (pointerType?: string) =>
    disabled || Boolean(prefersReducedMotion) || pointerType === "touch";

  const handlePointerEnter = (e: React.PointerEvent<HTMLDivElement>) => {
    if (shouldSkip(e.pointerType)) return;
    setHovered(true);
  };

  const handlePointerMove = (e: React.PointerEvent<HTMLDivElement>) => {
    if (shouldSkip(e.pointerType)) return;
    const el = ref.current;
    if (!el) return;

    const rect = el.getBoundingClientRect();
    if (rect.width === 0 || rect.height === 0) return;

    const px = Math.max(0, Math.min(1, (e.clientX - rect.left) / rect.width));
    const py = Math.max(0, Math.min(1, (e.clientY - rect.top) / rect.height));

    normX.set(px - 0.5);
    normY.set(py - 0.5);
    spotX.set(px * 100);
    spotY.set(py * 100);
  };

  const handlePointerLeave = () => {
    setHovered(false);
    normX.set(0);
    normY.set(0);
  };

  return (
    <motion.div
      ref={ref}
      onPointerEnter={handlePointerEnter}
      onPointerMove={handlePointerMove}
      onPointerLeave={handlePointerLeave}
      animate={
        hovered && !shouldSkip()
          ? { scale: hoverScale }
          : { scale: 1 }
      }
      transition={{ type: "spring", stiffness: 320, damping: 26, mass: 0.65 }}
      style={{
        ...style,
        transformPerspective: 1100,
        rotateX: shouldSkip() ? 0 : rotateX,
        rotateY: shouldSkip() ? 0 : rotateY,
        x: shouldSkip() ? 0 : pullX,
        y: shouldSkip() ? 0 : pullY,
        transformStyle: "preserve-3d",
      }}
      className={`parlo-tilt-card relative will-change-transform ${
        hovered ? "is-tilted" : ""
      } ${className}`}
    >
      {/* Precision Cursor-Tracking Hairline Edge Rim (zero muddy center glare) */}
      {glare && !prefersReducedMotion && (
        <motion.div
          aria-hidden="true"
          className="parlo-spotlight-rim pointer-events-none absolute -inset-px rounded-[inherit] z-20 transition-opacity duration-250"
          style={{
            opacity: hovered ? 0.78 : 0,
            background: borderSpotBg,
          }}
        />
      )}

      {children}
    </motion.div>
  );
}

export default TiltCard3D;
