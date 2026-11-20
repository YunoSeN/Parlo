import { useEffect, useState } from "react";
import { AnimatePresence, motion } from "motion/react";

export interface RolodexWordProps {
  words: string[];
  intervalMs?: number;
  className?: string;
}

/**
 * RolodexWord
 *
 * Inline 3D mechanical slot-machine / Rolodex word rotator.
 * - Old word rotates +90deg backward on the X-axis.
 * - New word flips up from -90deg at the bottom.
 * - Strictly left-aligned inside an unclipped preserve-3d inline-grid so
 *   variable-length words remain flush against preceding inline text.
 */
export function RolodexWord({
  words,
  intervalMs = 2600,
  className = "",
}: RolodexWordProps) {
  const safeWords = words.length > 0 ? words : [""];
  const [index, setIndex] = useState(0);
  const [paused, setPaused] = useState(false);

  useEffect(() => {
    if (safeWords.length <= 1 || paused) return;
    const id = window.setInterval(() => {
      setIndex((prev) => (prev + 1) % safeWords.length);
    }, intervalMs);
    return () => window.clearInterval(id);
  }, [intervalMs, paused, safeWords.length]);

  const activeWord = safeWords[index % safeWords.length];

  return (
    <span
      className={`parlo-rolodex-stage ${className}`}
      onMouseEnter={() => setPaused(true)}
      onMouseLeave={() => setPaused(false)}
      aria-live="polite"
    >
      <AnimatePresence mode="popLayout" initial={false}>
        <motion.span
          key={`${index}-${activeWord}`}
          className="parlo-rolodex-item text-left"
          initial={{
            rotateX: -90,
            opacity: 0,
            y: "0.22em",
          }}
          animate={{
            rotateX: 0,
            opacity: 1,
            y: "0em",
          }}
          exit={{
            rotateX: 90,
            opacity: 0,
            y: "-0.22em",
          }}
          transition={{
            duration: 0.46,
            ease: [0.22, 1, 0.36, 1],
          }}
        >
          {activeWord}
        </motion.span>
      </AnimatePresence>
    </span>
  );
}

export default RolodexWord;
