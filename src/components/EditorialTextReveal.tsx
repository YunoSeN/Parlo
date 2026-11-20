import React from "react";
import { motion, useReducedMotion } from "motion/react";

export interface EditorialTextRevealProps {
  text: string;
  className?: string;
  delay?: number;
  stagger?: number;
}

/**
 * EditorialTextReveal
 *
 * Superdesign-inspired masked baseline reveal with blur-to-sharp optical focus.
 * Each word rises cleanly out of an invisible baseline mask with crisp settling
 * timing, keeping content immediately accessible for assistive tech.
 */
export function EditorialTextReveal({
  text,
  className = "",
  delay = 0,
  stagger = 0.04,
}: EditorialTextRevealProps) {
  const prefersReducedMotion = useReducedMotion();
  const words = text.split(" ");

  if (prefersReducedMotion) {
    return <span className={className}>{text}</span>;
  }

  return (
    <span className={`inline ${className}`} aria-label={text}>
      {words.map((word, idx) => (
        <span
          key={`${word}-${idx}`}
          aria-hidden="true"
          className="inline-block overflow-hidden align-bottom pb-[0.06em] -mb-[0.06em]"
        >
          <motion.span
            className="inline-block"
            initial={{ y: "92%", opacity: 0, filter: "blur(5px)" }}
            animate={{ y: "0%", opacity: 1, filter: "blur(0px)" }}
            transition={{
              duration: 0.48,
              delay: delay + idx * stagger,
              ease: [0.16, 1, 0.3, 1],
            }}
          >
            {word}
            {idx < words.length - 1 ? "\u00A0" : ""}
          </motion.span>
        </span>
      ))}
    </span>
  );
}

export default EditorialTextReveal;
