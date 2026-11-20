import React, { useEffect, useRef, useState } from "react";

export interface GlowingEdgeCardProps
  extends React.HTMLAttributes<HTMLDivElement> {
  /**
   * Optional surface tone:
   * - "surface": Parlo warm paper card surface (default)
   * - "ink": High-contrast dark cypress/sumi ink showcase card
   */
  tone?: "surface" | "ink";
  /**
   * Play a gentle one-time directional sweep on mount
   */
  introSweep?: boolean;
  /**
   * Enable tactile 3D perspective tilt following cursor position (default true)
   */
  tilt3d?: boolean;
  /**
   * Inner content container className
   */
  contentClassName?: string;
  children?: React.ReactNode;
}

function round(value: number, precision = 2): number {
  return parseFloat(value.toFixed(precision));
}

function clamp(value: number, min = 0, max = 100): number {
  return Math.min(Math.max(value, min), max);
}

/**
 * GlowingEdgeCard
 *
 * Pointer-tracking directional glowing edge card adapted to Parlo's 4-color
 * CSS variable system (--parlo-primary, --parlo-accent, --parlo-surface).
 * Calculates pointer angle, edge proximity, and smooth 3D perspective tilt on
 * pointermove so the card responds physically to cursor movement.
 */
export function GlowingEdgeCard({
  tone = "surface",
  introSweep = false,
  tilt3d = true,
  className = "",
  contentClassName = "",
  style,
  children,
  onPointerMove,
  onPointerLeave,
  ...props
}: GlowingEdgeCardProps) {
  const cardRef = useRef<HTMLDivElement | null>(null);
  const [isAnimating, setIsAnimating] = useState(false);
  const [isHovered, setIsHovered] = useState(false);

  const handlePointerMove = (e: React.PointerEvent<HTMLDivElement>) => {
    onPointerMove?.(e);
    const el = cardRef.current;
    if (!el) return;

    const rect = el.getBoundingClientRect();
    if (rect.width === 0 || rect.height === 0) return;

    const x = e.clientX - rect.left;
    const y = e.clientY - rect.top;
    const perX = clamp((100 / rect.width) * x);
    const perY = clamp((100 / rect.height) * y);

    const cx = rect.width / 2;
    const cy = rect.height / 2;
    const dx = x - cx;
    const dy = y - cy;

    let angleDeg = 0;
    if (dx !== 0 || dy !== 0) {
      angleDeg = Math.atan2(dy, dx) * (180 / Math.PI) + 90;
      if (angleDeg < 0) angleDeg += 360;
    }

    const kx = dx !== 0 ? cx / Math.abs(dx) : Infinity;
    const ky = dy !== 0 ? cy / Math.abs(dy) : Infinity;
    const edgeProximity = clamp(1 / Math.min(kx, ky), 0, 1);

    el.style.setProperty("--pointer-x", `${round(perX)}%`);
    el.style.setProperty("--pointer-y", `${round(perY)}%`);
    el.style.setProperty("--pointer-deg", `${round(angleDeg)}deg`);
    el.style.setProperty("--pointer-d", `${round(edgeProximity * 100)}`);

    if (
      tilt3d &&
      e.pointerType !== "touch" &&
      !window.matchMedia("(prefers-reduced-motion: reduce)").matches
    ) {
      const rx = ((0.5 - y / rect.height) * 8).toFixed(2);
      const ry = ((x / rect.width - 0.5) * 8).toFixed(2);
      el.style.transform = `perspective(1100px) rotateX(${rx}deg) rotateY(${ry}deg) scale3d(1.01, 1.01, 1)`;
      if (!isHovered) setIsHovered(true);
    }

    if (isAnimating) {
      setIsAnimating(false);
    }
  };

  const handlePointerLeave = (e: React.PointerEvent<HTMLDivElement>) => {
    onPointerLeave?.(e);
    setIsHovered(false);
    if (cardRef.current && tilt3d) {
      cardRef.current.style.transform =
        "perspective(1100px) rotateX(0deg) rotateY(0deg) scale3d(1, 1, 1)";
    }
  };

  useEffect(() => {
    if (!introSweep) return;
    if (window.matchMedia("(prefers-reduced-motion: reduce)").matches) return;

    let rafId = 0;
    let active = true;

    const timer = window.setTimeout(() => {
      const el = cardRef.current;
      if (!el || !active) return;

      setIsAnimating(true);
      const startTime = performance.now();
      const angleStart = 115;
      const angleEnd = 455;

      const animate = (now: number) => {
        if (!active || !cardRef.current) return;
        const elapsed = now - startTime;

        if (elapsed < 600) {
          const t = elapsed / 600;
          const ease = 1 - Math.pow(1 - t, 3);
          cardRef.current.style.setProperty("--pointer-d", `${round(ease * 92)}`);
        } else if (elapsed > 2200 && elapsed < 3400) {
          const t = (elapsed - 2200) / 1200;
          const ease = t * t * t;
          cardRef.current.style.setProperty(
            "--pointer-d",
            `${round((1 - ease) * 92)}`
          );
        }

        if (elapsed < 3200) {
          const t = elapsed / 3200;
          const ease = t < 0.5 ? 2 * t * t : 1 - Math.pow(-2 * t + 2, 2) / 2;
          const deg = angleStart + (angleEnd - angleStart) * ease;
          cardRef.current.style.setProperty("--pointer-deg", `${round(deg)}deg`);
          const rad = ((deg - 90) * Math.PI) / 180;
          cardRef.current.style.setProperty(
            "--pointer-x",
            `${round(50 + Math.cos(rad) * 44)}%`
          );
          cardRef.current.style.setProperty(
            "--pointer-y",
            `${round(50 + Math.sin(rad) * 44)}%`
          );
        }

        if (elapsed < 3400) {
          rafId = requestAnimationFrame(animate);
        } else {
          setIsAnimating(false);
        }
      };

      rafId = requestAnimationFrame(animate);
    }, 350);

    return () => {
      active = false;
      window.clearTimeout(timer);
      cancelAnimationFrame(rafId);
    };
  }, [introSweep]);

  const surfaceClasses =
    tone === "ink"
      ? "bg-[var(--parlo-ink)] text-[var(--parlo-on-solid)] border border-[var(--parlo-ink)]"
      : "bg-[var(--parlo-surface)] text-[var(--parlo-ink)] border border-[var(--parlo-border)]";

  return (
    <div
      ref={cardRef}
      onPointerMove={handlePointerMove}
      onPointerLeave={handlePointerLeave}
      style={{
        ...style,
        transformStyle: tilt3d ? "preserve-3d" : undefined,
        transition: isHovered
          ? "transform 130ms cubic-bezier(0.22, 1, 0.36, 1)"
          : "transform 450ms cubic-bezier(0.16, 1, 0.3, 1)",
      }}
      className={`parlo-glow-card rounded-2xl will-change-transform ${
        isAnimating ? "is-animating" : ""
      } ${className}`}
      {...props}
    >
      <div className="parlo-glow-card-halo" aria-hidden="true" />
      <div className="parlo-glow-card-border" aria-hidden="true" />
      <div
        className={`relative z-10 w-full h-full rounded-[inherit] overflow-hidden parlo-surface-elevated ${surfaceClasses} ${contentClassName}`}
      >
        <div className="parlo-glow-card-wash" aria-hidden="true" />
        <div className="relative z-10 w-full h-full flex flex-col">
          {children}
        </div>
      </div>
    </div>
  );
}

export default GlowingEdgeCard;
