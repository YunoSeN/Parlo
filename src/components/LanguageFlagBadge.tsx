import React from "react";

export interface LanguageFlagBadgeProps {
  code: string;
  size?: "xs" | "sm" | "md" | "lg";
  className?: string;
}

const SIZE_MAP = {
  xs: "w-3.5 h-3.5",
  sm: "w-4 h-4",
  md: "w-5 h-5",
  lg: "w-8 h-8",
};

/**
 * LanguageFlagBadge
 *
 * Crisp, authentic circular flag emblem SVGs for all 8 supported languages.
 * Replaces generic 2-color dots with unmistakable national flag geometry
 * wrapped in a subtle inner specular glass rim.
 */
export function LanguageFlagBadge({
  code,
  size = "sm",
  className = "",
}: LanguageFlagBadgeProps) {
  const dimClass = SIZE_MAP[size];

  const renderFlagSvg = () => {
    switch (code) {
      /* SPAIN — Crimson / Gold / Crimson (1:2:1) + subtle coat-of-arms accent */
      case "es":
        return (
          <svg viewBox="0 0 24 24" className="w-full h-full block" aria-hidden="true">
            <rect width="24" height="6" y="0" fill="#AA151B" />
            <rect width="24" height="12" y="6" fill="#F1BF00" />
            <rect width="24" height="6" y="18" fill="#AA151B" />
            {/* Minimal architectural crest mark */}
            <rect x="6.5" y="9.2" width="3.6" height="4.8" rx="1.2" fill="#AA151B" />
            <rect x="7.4" y="10.2" width="1.8" height="2.6" rx="0.4" fill="#F1BF00" />
          </svg>
        );

      /* FRANCE — Bleu / Blanc / Rouge vertical tricolor */
      case "fr":
        return (
          <svg viewBox="0 0 24 24" className="w-full h-full block" aria-hidden="true">
            <rect width="8" height="24" x="0" fill="#002395" />
            <rect width="8" height="24" x="8" fill="#F8FAFC" />
            <rect width="8" height="24" x="16" fill="#ED2939" />
          </svg>
        );

      /* JAPAN — Crisp white field with centered Hinomaru crimson sun */
      case "ja":
        return (
          <svg viewBox="0 0 24 24" className="w-full h-full block" aria-hidden="true">
            <rect width="24" height="24" fill="#F9FAFB" />
            <circle cx="12" cy="12" r="5.6" fill="#BC002D" />
          </svg>
        );

      /* GERMANY — Black / Crimson / Gold horizontal tricolor */
      case "de":
        return (
          <svg viewBox="0 0 24 24" className="w-full h-full block" aria-hidden="true">
            <rect width="24" height="8" y="0" fill="#141416" />
            <rect width="24" height="8" y="8" fill="#DD0000" />
            <rect width="24" height="8" y="16" fill="#FFCE00" />
          </svg>
        );

      /* ITALY — Emerald / White / Crimson vertical tricolor */
      case "it":
        return (
          <svg viewBox="0 0 24 24" className="w-full h-full block" aria-hidden="true">
            <rect width="8" height="24" x="0" fill="#009246" />
            <rect width="8" height="24" x="8" fill="#F8FAFC" />
            <rect width="8" height="24" x="16" fill="#CE2B37" />
          </svg>
        );

      /* CHINA — Crimson field with golden star + 4-star arc */
      case "zh":
        return (
          <svg viewBox="0 0 24 24" className="w-full h-full block" aria-hidden="true">
            <rect width="24" height="24" fill="#DE2910" />
            <polygon
              points="7.2,5.6 8.1,8.3 10.9,8.3 8.6,9.9 9.5,12.6 7.2,11 4.9,12.6 5.8,9.9 3.5,8.3 6.3,8.3"
              fill="#FFDE00"
            />
            <circle cx="12.5" cy="5.8" r="1.05" fill="#FFDE00" />
            <circle cx="14.3" cy="8.1" r="1.05" fill="#FFDE00" />
            <circle cx="14.1" cy="11.1" r="1.05" fill="#FFDE00" />
            <circle cx="12.1" cy="13.2" r="1.05" fill="#FFDE00" />
          </svg>
        );

      /* SOUTH KOREA — Crisp white with authentic red/blue Taegeuk & corner trigrams */
      case "ko":
        return (
          <svg viewBox="0 0 24 24" className="w-full h-full block" aria-hidden="true">
            <rect width="24" height="24" fill="#F9FAFB" />
            {/* Subtle corner trigram strokes */}
            <g stroke="#18181B" strokeWidth="1.2" strokeLinecap="round" opacity="0.88">
              <path d="M3.8 6.4 L6.4 3.8 M5.1 7.7 L7.7 5.1" />
              <path d="M17.6 3.8 L20.2 6.4 M16.3 5.1 L18.9 7.7" />
              <path d="M3.8 17.6 L6.4 20.2 M5.1 16.3 L7.7 18.9" />
              <path d="M17.6 20.2 L20.2 17.6 M16.3 18.9 L18.9 16.3" />
            </g>
            {/* Authentic Red & Blue Taegeuk */}
            <circle cx="12" cy="12" r="5" fill="#0047A0" />
            <path
              d="M7 12 A5 5 0 0 1 17 12 A2.5 2.5 0 0 1 12 12 A2.5 2.5 0 0 0 7 12 Z"
              fill="#CD2E3A"
            />
          </svg>
        );

      /* PORTUGAL — Deep green (left) + Crimson (right) with golden armillary sphere */
      case "pt":
      default:
        return (
          <svg viewBox="0 0 24 24" className="w-full h-full block" aria-hidden="true">
            <rect width="9.6" height="24" x="0" fill="#006600" />
            <rect width="14.4" height="24" x="9.6" fill="#D80027" />
            <circle cx="9.6" cy="12" r="4.1" fill="#FFCC00" />
            <circle cx="9.6" cy="12" r="2.4" fill="#D80027" />
            <rect x="8.5" y="10.8" width="2.2" height="2.4" rx="0.6" fill="#FFFFFF" />
          </svg>
        );
    }
  };

  return (
    <span
      className={`relative inline-flex items-center justify-center rounded-full overflow-hidden shrink-0 ring-1 ring-black/15 dark:ring-white/25 shadow-xs ${dimClass} ${className}`}
      aria-hidden="true"
    >
      {renderFlagSvg()}
      {/* Subtle glass specular bevel over the flag emblem */}
      <span
        className="pointer-events-none absolute inset-0 rounded-full"
        style={{
          background:
            "linear-gradient(145deg, rgba(255,255,255,0.34) 0%, rgba(255,255,255,0) 48%, rgba(0,0,0,0.16) 100%)",
        }}
      />
    </span>
  );
}

export default LanguageFlagBadge;
