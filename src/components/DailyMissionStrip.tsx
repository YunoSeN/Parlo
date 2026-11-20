import { ArrowRight, CheckCircle2, Compass, Volume2 } from "lucide-react";
import { speakWithBrowserTts } from "../lib/audio";
import { DailyCulturalMission } from "../lib/dailyMission";
import { playClickSfx } from "../lib/sfx";
import { LanguageOption } from "../types";

interface DailyMissionStripProps {
  mission: DailyCulturalMission;
  language: LanguageOption;
  completed: boolean;
  compact?: boolean;
  onStartMission: () => void;
}

export function DailyMissionStrip({
  mission,
  language,
  completed,
  compact = false,
  onStartMission,
}: DailyMissionStripProps) {
  return (
    <div
      className={`rounded-xl bg-[var(--parlo-surface-solid)] border border-[var(--parlo-border)] ${
        compact ? "px-3.5 py-3" : "px-4 py-3.5 sm:px-5 sm:py-4"
      }`}
    >
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
        <div className="min-w-0 space-y-1">
          <div className="flex flex-wrap items-center gap-x-2 gap-y-0.5 text-[11px] font-mono uppercase tracking-wider text-[var(--parlo-ink-muted)]">
            {completed ? (
              <span className="inline-flex items-center gap-1 text-[var(--parlo-success)] font-semibold">
                <CheckCircle2 className="w-3.5 h-3.5" aria-hidden="true" />
                Mission Complete
              </span>
            ) : (
              <span className="inline-flex items-center gap-1 text-[var(--parlo-primary)] font-semibold">
                <Compass className="w-3.5 h-3.5" aria-hidden="true" />
                Daily 3-Min Cultural Mission
              </span>
            )}
            <span aria-hidden="true">·</span>
            <span className="tabular-nums">{mission.targetTurns} spoken turns</span>
            <span aria-hidden="true">·</span>
            <span>{language.name}</span>
          </div>

          <h3 className="font-display text-sm sm:text-base font-semibold text-[var(--parlo-ink)] leading-snug">
            {mission.title}
          </h3>

          <p className="text-xs text-[var(--parlo-ink-secondary)] leading-relaxed max-w-2xl">
            {mission.prompt}
          </p>

          {!compact && (
            <div className="pt-0.5 flex flex-wrap items-center gap-x-3 gap-y-1 text-[11px] text-[var(--parlo-ink-muted)]">
              <span>
                <span className="font-medium text-[var(--parlo-ink-secondary)]">
                  Starter:{" "}
                </span>
                “{mission.starterLine}”
              </span>
              <button
                type="button"
                onClick={() => {
                  playClickSfx();
                  speakWithBrowserTts(mission.starterLine, language.speechLocale);
                }}
                className="inline-flex items-center gap-1 text-[var(--parlo-primary)] hover:underline cursor-pointer whitespace-nowrap"
              >
                <Volume2 className="w-3 h-3" aria-hidden="true" />
                Hear line
              </button>
            </div>
          )}
        </div>

        <div className="flex items-center gap-2 shrink-0">
          {compact && (
            <button
              type="button"
              onClick={() => {
                playClickSfx();
                speakWithBrowserTts(mission.starterLine, language.speechLocale);
              }}
              title={`Hear starter: ${mission.starterLine}`}
              className="inline-flex items-center gap-1.5 px-2.5 py-2 text-xs font-medium text-[var(--parlo-ink-secondary)] hover:text-[var(--parlo-ink)] border border-[var(--parlo-border)] rounded-lg transition-colors whitespace-nowrap cursor-pointer"
            >
              <Volume2 className="w-3.5 h-3.5" aria-hidden="true" />
              Starter
            </button>
          )}
          <button
            type="button"
            onClick={() => {
              playClickSfx();
              onStartMission();
            }}
            className="inline-flex items-center gap-1.5 px-3.5 py-2 text-xs font-medium rounded-lg transition-colors whitespace-nowrap cursor-pointer bg-[var(--parlo-primary)] text-[var(--parlo-on-solid)] hover:bg-[var(--parlo-primary-hover)]"
          >
            {completed ? "Replay Mission" : "Start Mission"}
            <ArrowRight className="w-3.5 h-3.5" aria-hidden="true" />
          </button>
        </div>
      </div>
    </div>
  );
}
