import { motion, useReducedMotion } from "motion/react";

const DIGITS = [0, 1, 2, 3, 4, 5, 6, 7, 8, 9];

export interface OdometerNumberProps {
  value: number;
  prefix?: string;
  suffix?: string;
  className?: string;
}

/**
 * OdometerNumber
 *
 * Mechanical Swiss-style rolling digit odometer.
 * Animates each individual numeric digit vertically along a spring drum whenever
 * values change (e.g. billing toggle or cohort seat slider).
 */
export function OdometerNumber({
  value,
  prefix = "",
  suffix = "",
  className = "",
}: OdometerNumberProps) {
  const prefersReducedMotion = useReducedMotion();
  const formatted = Math.round(value).toString();

  if (prefersReducedMotion) {
    return (
      <span className={`tabular-nums ${className}`}>
        {prefix}
        {formatted}
        {suffix}
      </span>
    );
  }

  return (
    <span
      className={`inline-flex items-baseline tabular-nums ${className}`}
      aria-label={`${prefix}${formatted}${suffix}`}
    >
      {prefix && <span aria-hidden="true">{prefix}</span>}
      {formatted.split("").map((char, idx) => {
        const digit = Number(char);
        if (Number.isNaN(digit)) {
          return (
            <span key={`sep-${idx}`} aria-hidden="true">
              {char}
            </span>
          );
        }

        // Key from the right so tens/ones keep steady drums as length changes
        const placeKey = formatted.length - idx;

        return (
          <span
            key={`digit-${placeKey}`}
            aria-hidden="true"
            className="relative inline-block overflow-hidden h-[1.12em] leading-[1.12em] align-bottom"
            style={{ width: "0.62em" }}
          >
            <motion.span
              className="flex flex-col items-center will-change-transform"
              initial={false}
              animate={{ y: `${-digit * 10}%` }}
              transition={{
                type: "spring",
                stiffness: 340,
                damping: 26,
                mass: 0.75,
              }}
            >
              {DIGITS.map((d) => (
                <span
                  key={d}
                  className="block h-[1.12em] leading-[1.12em] text-center"
                >
                  {d}
                </span>
              ))}
            </motion.span>
          </span>
        );
      })}
      {suffix && <span aria-hidden="true">{suffix}</span>}
    </span>
  );
}

export default OdometerNumber;
