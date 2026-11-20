import { useMemo } from "react";
import { motion } from "motion/react";
import { Check, Flame, Play } from "lucide-react";
import { computeDailyStreak } from "../lib/streaks";
import { PracticeSessionRecord } from "../types";

interface DailyStreakCardProps {
  sessions: PracticeSessionRecord[];
  activeLanguageCode?: string;
  onStartPractice: () => void;
}

export function DailyStreakCard({
  sessions,
  activeLanguageCode = "es",
  onStartPractice,
}: DailyStreakCardProps) {
  const stats = useMemo(() => computeDailyStreak(sessions), [sessions]);

  const statusText = stats.practicedToday
    ? "You practiced today — streak secured."
    : stats.currentStreak > 0
    ? "Complete a short session today to extend your streak."
    : "Finish one conversation today to start a daily streak.";

  return (
    <section
      aria-label="Daily practice streak"
      className="relative overflow-hidden mt-8 bg-[var(--parlo-surface)] border border-[var(--parlo-border)] rounded-xl parlo-surface-elevated p-6"
    >
      <div
        aria-hidden="true"
        data-culture={activeLanguageCode}
        className="parlo-motif-overlay parlo-motif-corner"
      />
      <div className="relative z-10 grid grid-cols-1 lg:grid-cols-12 gap-6 items-center">
        {/* Left: Active Streak Figure & Record */}
        <div className="lg:col-span-5 flex items-start gap-4">
          <motion.div
            whileHover={{ scale: 1.08, rotate: -4 }}
            transition={{ type: "spring", stiffness: 360, damping: 20 }}
            className={`w-12 h-12 rounded-xl border flex items-center justify-center shrink-0 ${
              stats.practicedToday || stats.currentStreak > 0
                ? "bg-[var(--parlo-accent-soft)] border-[var(--parlo-accent-border)] text-[var(--parlo-accent)]"
                : "bg-[var(--parlo-surface-alt)] border-[var(--parlo-border)] text-[var(--parlo-ink-muted)]"
            }`}
          >
            <Flame
              className={`w-6 h-6 ${
                stats.practicedToday || stats.currentStreak > 0
                  ? "parlo-flame-active"
                  : ""
              }`}
              aria-hidden="true"
            />
          </motion.div>

          <div className="min-w-0">
            <div className="flex items-center gap-2 text-xs text-[var(--parlo-ink-muted)]">
              <span>Daily Streak</span>
              <span aria-hidden="true">·</span>
              <span className="tabular-nums">
                Best: {stats.longestStreak}{" "}
                {stats.longestStreak === 1 ? "day" : "days"}
              </span>
              <span aria-hidden="true">·</span>
              <span className="tabular-nums">
                {stats.totalPracticeDays} active{" "}
                {stats.totalPracticeDays === 1 ? "day" : "days"}
              </span>
            </div>

            <div className="mt-1 flex items-baseline gap-2">
              <span className="font-mono text-3xl font-semibold text-[var(--parlo-ink)] tabular-nums">
                {stats.currentStreak}
              </span>
              <span className="font-serif-editorial text-xl font-medium text-[var(--parlo-ink-secondary)]">
                consecutive {stats.currentStreak === 1 ? "day" : "days"}
              </span>
            </div>

            <p className="mt-1.5 text-xs text-[var(--parlo-ink-secondary)] leading-relaxed">
              {statusText}
            </p>
          </div>
        </div>

        {/* Right: Last 7 Days Consecutive Strip + Optional CTA */}
        <div className="lg:col-span-7 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div
            className="grid grid-cols-7 gap-2 flex-1"
            role="list"
            aria-label="Last 7 days practice history"
          >
            {stats.recentDays.map((day, idx) => {
              const practiced = day.sessionCount > 0;
              return (
                <motion.div
                  key={day.dateKey}
                  role="listitem"
                  initial={{ opacity: 0, y: 8 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{
                    duration: 0.25,
                    delay: idx * 0.03,
                    ease: [0.16, 1, 0.3, 1],
                  }}
                  whileHover={{ y: -3, scale: 1.03 }}
                  title={`${day.dayLabel} ${day.dayNumber}: ${day.sessionCount} ${
                    day.sessionCount === 1 ? "session" : "sessions"
                  }`}
                  className={`flex flex-col items-center justify-center py-2.5 px-1 rounded-lg border text-center transition-colors ${
                    practiced
                      ? "bg-[var(--parlo-accent-soft)] border-[var(--parlo-accent-border)] text-[var(--parlo-ink)]"
                      : day.isToday
                      ? "bg-[var(--parlo-primary-soft)] border-[var(--parlo-primary)]/45 text-[var(--parlo-ink)]"
                      : "bg-[var(--parlo-surface-alt)] border-[var(--parlo-border)] text-[var(--parlo-ink-muted)]"
                  }`}
                >
                  <span className="text-[11px] font-medium">
                    {day.isToday ? "Today" : day.dayLabel}
                  </span>
                  <div
                    className={`mt-1.5 w-6 h-6 rounded-full flex items-center justify-center ${
                      practiced
                        ? "bg-[var(--parlo-accent)] text-[var(--parlo-on-solid)]"
                        : day.isToday
                        ? "border border-dashed border-[var(--parlo-primary)] text-[var(--parlo-primary)]"
                        : "bg-[var(--parlo-canvas)] text-[var(--parlo-ink-muted)]"
                    }`}
                  >
                    {practiced ? (
                      <Check className="w-3.5 h-3.5 stroke-[3]" aria-hidden="true" />
                    ) : (
                      <span className="font-mono text-[10px] tabular-nums">
                        {day.dayNumber}
                      </span>
                    )}
                  </div>
                </motion.div>
              );
            })}
          </div>

          {!stats.practicedToday && (
            <motion.button
              type="button"
              whileHover={{ y: -1.5 }}
              whileTap={{ scale: 0.97 }}
              onClick={onStartPractice}
              className="inline-flex items-center justify-center gap-1.5 px-4 py-2.5 text-xs font-medium text-[var(--parlo-on-solid)] bg-[var(--parlo-ink)] hover:bg-[var(--parlo-primary)] rounded-lg transition-colors whitespace-nowrap shrink-0 cursor-pointer"
            >
              <Play className="w-3.5 h-3.5" aria-hidden="true" />
              Practice Today
            </motion.button>
          )}
        </div>
      </div>
    </section>
  );
}
