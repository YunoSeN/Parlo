import React from "react";
import { ArrowUp, Lightbulb, Mic, MicOff } from "lucide-react";

export interface RadiantPromptInputProps {
  value: string;
  onChange: (value: string) => void;
  onSubmit: () => void;
  placeholder: string;
  disabled?: boolean;
  isLive?: boolean;
  isMuted?: boolean;
  micAvailable?: boolean;
  onToggleMic?: () => void;
  onRequestHint?: () => void;
  loadingHints?: boolean;
  className?: string;
}

/**
 * RadiantPromptInput
 *
 * Kinetic rotating conic-gradient prompt bar adapted for Parlo's live
 * voice & text conversation studio. The rotating conic border automatically
 * inherits the active language's chromatic pigment trio (--parlo-primary,
 * --parlo-glow, --parlo-accent).
 */
export function RadiantPromptInput({
  value,
  onChange,
  onSubmit,
  placeholder,
  disabled = false,
  isLive = false,
  isMuted = false,
  micAvailable = true,
  onToggleMic,
  onRequestHint,
  loadingHints = false,
  className = "",
}: RadiantPromptInputProps) {
  const canSend = Boolean(value.trim()) && !disabled;

  const handleKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      if (canSend) onSubmit();
    }
  };

  return (
    <div className={`relative w-full ${className}`}>
      <div
        data-disabled={disabled ? "true" : "false"}
        className="parlo-radiant-shell rounded-full bg-[var(--parlo-surface-solid)] transition-all duration-300"
      >
        {/* Rotating sharp conic gradient rim */}
        <div className="parlo-radiant-border rounded-full" aria-hidden="true" />

        {/* Inner interactive bar */}
        <div className="relative z-10 flex items-center gap-2 p-1.5 pl-2.5 pr-1.5 h-12 sm:h-[52px]">
          {/* Left Action: Quick Reply Hint Trigger */}
          {onRequestHint && (
            <button
              type="button"
              onClick={onRequestHint}
              disabled={loadingHints}
              title="Generate natural reply ideas (H)"
              aria-label="Generate natural reply ideas"
              className="inline-flex items-center justify-center w-8 h-8 sm:w-9 sm:h-9 rounded-full text-[var(--parlo-ink-muted)] hover:text-[var(--parlo-accent)] hover:bg-[var(--parlo-surface-alt)] transition-colors shrink-0 cursor-pointer disabled:opacity-50"
            >
              <Lightbulb className="w-4 h-4" aria-hidden="true" />
            </button>
          )}

          {/* Kinetic Text Entry */}
          <input
            type="text"
            value={value}
            onChange={(e) => onChange(e.target.value)}
            onKeyDown={handleKeyDown}
            disabled={disabled}
            placeholder={placeholder}
            className="flex-1 bg-transparent border-none outline-none text-sm text-[var(--parlo-ink)] placeholder:text-[var(--parlo-ink-muted)] min-w-0 h-full px-1 disabled:opacity-60"
          />

          {/* Right Actions: Mic Toggle + Submit Arrow */}
          <div className="flex items-center gap-1.5 shrink-0">
            {onToggleMic && (
              <button
                type="button"
                onClick={onToggleMic}
                disabled={isLive && !micAvailable}
                title={
                  !isLive
                    ? "Start live voice session"
                    : isMuted
                    ? "Unmute microphone (M)"
                    : "Mute microphone (M)"
                }
                aria-label={
                  !isLive
                    ? "Start live voice session"
                    : isMuted
                    ? "Unmute microphone"
                    : "Mute microphone"
                }
                className={`inline-flex items-center justify-center w-8 h-8 sm:w-9 sm:h-9 rounded-full transition-colors cursor-pointer disabled:opacity-45 ${
                  isLive && isMuted
                    ? "text-amber-600 bg-amber-500/15"
                    : isLive
                    ? "text-[var(--parlo-primary)] bg-[var(--parlo-primary-soft)]"
                    : "text-[var(--parlo-ink-muted)] hover:text-[var(--parlo-ink)] hover:bg-[var(--parlo-surface-alt)]"
                }`}
              >
                {isLive && isMuted ? (
                  <MicOff className="w-4 h-4" aria-hidden="true" />
                ) : (
                  <Mic className="w-4 h-4" aria-hidden="true" />
                )}
              </button>
            )}

            <button
              type="button"
              onClick={onSubmit}
              disabled={!canSend}
              aria-label="Send reply"
              className={`inline-flex items-center justify-center w-9 h-9 sm:w-10 sm:h-10 rounded-full transition-all duration-200 cursor-pointer ${
                canSend
                  ? "bg-[var(--parlo-primary)] text-[var(--parlo-on-solid)] hover:scale-105 active:scale-95 shadow-md"
                  : "bg-[var(--parlo-canvas)] text-[var(--parlo-ink-muted)] opacity-50 cursor-not-allowed"
              }`}
            >
              <ArrowUp className="w-4 h-4" strokeWidth={2.5} aria-hidden="true" />
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}

export default RadiantPromptInput;
