import React, { useState } from "react";
import { motion, useMotionValue, useReducedMotion, useSpring } from "motion/react";

export interface GlowCtaButtonProps
  extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: "primary" | "ink";
  leadingIcon?: React.ReactNode;
  showArrow?: boolean;
  onClick?: React.MouseEventHandler<HTMLButtonElement>;
  children: React.ReactNode;
}

interface GlowCoords {
  x: string;
  y: string;
  opacity: number;
}

/**
 * GlowCtaButton
 *
 * Tactile Superdesign-inspired Light Beam + Magnetic Jelly-Squish CTA button.
 * - Uses `parlo-glow-cta` cursor-driven radial rim & glow (--cta-x, --cta-y)
 * - Subtle spring magnetic pull toward cursor + physical keycap bevel depth
 * - Automated light-beam glint sweep on hover
 * - Dual-arrow kinetic portal translation on hover
 */
export function GlowCtaButton({
  variant = "primary",
  leadingIcon,
  showArrow = true,
  type = "button",
  className = "",
  style,
  children,
  onClick,
  onMouseMove,
  onMouseLeave,
  disabled,
  ...props
}: GlowCtaButtonProps) {
  const prefersReducedMotion = useReducedMotion();
  const [glow, setGlow] = useState<GlowCoords>({
    x: "50%",
    y: "50%",
    opacity: 0,
  });

  const magX = useMotionValue(0);
  const magY = useMotionValue(0);
  const smoothX = useSpring(magX, { stiffness: 360, damping: 22, mass: 0.6 });
  const smoothY = useSpring(magY, { stiffness: 360, damping: 22, mass: 0.6 });

  const handleMouseMove = (e: React.MouseEvent<HTMLButtonElement>) => {
    onMouseMove?.(e);
    if (disabled) return;
    const rect = e.currentTarget.getBoundingClientRect();
    const localX = e.clientX - rect.left;
    const localY = e.clientY - rect.top;
    setGlow({
      x: `${localX.toFixed(1)}px`,
      y: `${localY.toFixed(1)}px`,
      opacity: 1,
    });

    if (!prefersReducedMotion && rect.width > 0 && rect.height > 0) {
      const nx = (localX / rect.width - 0.5) * 2;
      const ny = (localY / rect.height - 0.5) * 2;
      magX.set(nx * 3.5);
      magY.set(ny * 2.5);
    }
  };

  const handleMouseLeave = (e: React.MouseEvent<HTMLButtonElement>) => {
    onMouseLeave?.(e);
    setGlow((prev) => ({ ...prev, opacity: 0 }));
    magX.set(0);
    magY.set(0);
  };

  const toneClass =
    variant === "ink"
      ? "bg-[var(--parlo-ink)] hover:bg-[var(--parlo-primary)]"
      : "bg-[var(--parlo-primary)] hover:bg-[var(--parlo-primary-hover)]";

  const cssVars = {
    ...style,
    "--cta-x": glow.x,
    "--cta-y": glow.y,
    "--cta-opacity": glow.opacity,
  } as React.CSSProperties;

  return (
    <motion.button
      type={type}
      disabled={disabled}
      onClick={onClick}
      onMouseMove={handleMouseMove}
      onMouseLeave={handleMouseLeave}
      style={{
        ...cssVars,
        x: prefersReducedMotion ? 0 : smoothX,
        y: prefersReducedMotion ? 0 : smoothY,
      }}
      whileHover={disabled || prefersReducedMotion ? undefined : { scale: 1.018 }}
      whileTap={
        disabled || prefersReducedMotion
          ? undefined
          : { scaleX: 1.028, scaleY: 0.945 }
      }
      transition={{ type: "spring", stiffness: 500, damping: 20, mass: 0.65 }}
      className={`parlo-glow-cta parlo-keycap-cta group inline-flex items-center justify-center gap-2.5 px-5 py-3 text-sm font-medium text-[var(--parlo-on-solid)] rounded-xl transition-colors duration-200 whitespace-nowrap cursor-pointer focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[var(--parlo-primary)] disabled:opacity-55 disabled:cursor-not-allowed ${toneClass} ${className}`}
      {...(props as Record<string, unknown>)}
    >
      {/* Diagonal Superdesign Light-Beam Sweep */}
      <span aria-hidden="true" className="parlo-cta-beam" />

      {leadingIcon && (
        <span className="relative z-10 inline-flex items-center shrink-0 transition-transform duration-300 ease-out group-hover:-rotate-6 group-hover:scale-110">
          {leadingIcon}
        </span>
      )}
      <span className="relative z-10">{children}</span>
      {showArrow && (
        <span
          aria-hidden="true"
          className="relative z-10 inline-flex w-4 h-4 overflow-hidden shrink-0"
        >
          {/* Primary arrow glides cleanly out right */}
          <svg
            className="w-4 h-4 shrink-0 transition-transform duration-300 ease-[cubic-bezier(0.16,1,0.3,1)] group-hover:translate-x-5"
            viewBox="0 0 16 16"
            fill="none"
          >
            <path
              d="M3.25 8H12.75M12.75 8L8.75 4M12.75 8L8.75 12"
              stroke="currentColor"
              strokeWidth="1.7"
              strokeLinecap="round"
              strokeLinejoin="round"
            />
          </svg>
          {/* Trailing arrow enters from left */}
          <svg
            className="absolute inset-0 w-4 h-4 shrink-0 -translate-x-5 transition-transform duration-300 ease-[cubic-bezier(0.16,1,0.3,1)] group-hover:translate-x-0"
            viewBox="0 0 16 16"
            fill="none"
          >
            <path
              d="M3.25 8H12.75M12.75 8L8.75 4M12.75 8L8.75 12"
              stroke="currentColor"
              strokeWidth="1.7"
              strokeLinecap="round"
              strokeLinejoin="round"
            />
          </svg>
        </span>
      )}
    </motion.button>
  );
}

export default GlowCtaButton;
