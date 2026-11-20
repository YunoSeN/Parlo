import { useMemo } from "react";
import { motion } from "motion/react";
import { Check, CheckCircle2, Minus, Plus, Target } from "lucide-react";
import { PracticeSessionRecord } from "../types";

interface WeeklyGoalsWidgetProps {
  sessions: PracticeSessionRecord[];
  weeklyGoal: number;
  onChangeWeeklyGoal: (nextGoal: number) => void;
}

const DAY_LABELS = ["Mon", "Tue", "Wed", "Thu", "Fri", "Sat", "Sun"];
const PRESET_GOALS = [2, 4, 5, 7];

function getStartOfLocalWeek(referenceDate: Date): Date {
  const start = new Date(
    referenceDate.getFullYear(),
    referenceDate.getMonth(),
    referenceDate.getDate()
  );
  // Convert Sunday (0) -> 6, Monday (1) -> 0 ... Saturday (6) -> 5
  const dayOffset = (start.getDay() + 6) % 7;
  start.setDate(start.getDate() - dayOffset);
  start.setHours(0, 0, 0, 0);
  return start;
}

function formatDuration(seconds: number): string {
  const mins = Math.floor(seconds / 60);
  const secs = seconds % 60;
  return `${mins}:${secs.toString().padStart(2, "0")}`;
}

export function WeeklyGoalsWidget({
  sessions,
  weeklyGoal,
  onChangeWeeklyGoal,
}: WeeklyGoalsWidgetProps) {
  const stats = useMemo(() => {
    const now = new Date();
    const weekStart = getStartOfLocalWeek(now);
    const weekStartMs = weekStart.getTime();
    const weekEnd = new Date(weekStart);
    weekEnd.setDate(weekEnd.getDate() + 7);
    const weekEndMs = weekEnd.getTime();

    const todayIndex = (now.getDay() + 6) % 7;

    const dailyCounts = [0, 0, 0, 0, 0, 0, 0];
    let weeklySeconds = 0;
    let completedThisWeek = 0;

    // Group all sessions by local week start timestamp to compute consecutive weeks on target
    const sessionsByWeek = new Map<number, number>();

    for (const s of sessions) {
      const d = new Date(s.date);
      const sWeekStart = getStartOfLocalWeek(d).getTime();
      sessionsByWeek.set(sWeekStart, (sessionsByWeek.get(sWeekStart) ?? 0) + 1);

      if (s.date >= weekStartMs && s.date < weekEndMs) {
        completedThisWeek += 1;
        weeklySeconds += s.durationSeconds;
        const dayIdx = (d.getDay() + 6) % 7;
        dailyCounts[dayIdx] += 1;
      }
    }

    // Calculate consecutive weeks meeting the current weeklyGoal
    let streakWeeks = 0;
    const cursor = new Date(weekStart);
    // If current week already meets goal, count it; otherwise start checking from last week
    if (completedThisWeek < weeklyGoal) {
      cursor.setDate(cursor.getDate() - 7);
    }
    while ((sessionsByWeek.get(cursor.getTime()) ?? 0) >= weeklyGoal) {
      streakWeeks += 1;
      cursor.setDate(cursor.getDate() - 7);
      if (streakWeeks >= 52) break;
    }

    const weekEndDisplay = new Date(weekEnd);
    weekEndDisplay.setDate(weekEndDisplay.getDate() - 1);
    const rangeLabel = `${weekStart.toLocaleDateString(undefined, {
      month: "short",
      day: "numeric",
    })} – ${weekEndDisplay.toLocaleDateString(undefined, {
      month: "short",
      day: "numeric",
    })}`;

    return {
      completedThisWeek,
      weeklySeconds,
      dailyCounts,
      todayIndex,
      streakWeeks,
      rangeLabel,
    };
  }, [sessions, weeklyGoal]);

  const progressRatio = Math.min(
    100,
    weeklyGoal > 0 ? Math.round((stats.completedThisWeek / weeklyGoal) * 100) : 0
  );
  const goalReached = stats.completedThisWeek >= weeklyGoal;
  const remaining = Math.max(0, weeklyGoal - stats.completedThisWeek);

  const handleStep = (delta: number) => {
    const next = Math.max(1, Math.min(14, weeklyGoal + delta));
    onChangeWeeklyGoal(next);
  };

  return (
    <section
      aria-label="Weekly practice goals"
      className="mt-8 bg-[var(--parlo-surface)] border border-[var(--parlo-border)] rounded-xl parlo-surface-elevated p-6"
    >
      <div className="flex flex-col lg:flex-row lg:items-start justify-between gap-5 pb-5 border-b border-[var(--parlo-border)]">
        <div>
          <div className="flex items-center gap-2 text-xs text-[var(--parlo-ink-muted)]">
            <span>Current Week</span>
            <span aria-hidden="true">·</span>
            <span className="tabular-nums">{stats.rangeLabel}</span>
            {stats.streakWeeks > 0 && (
              <>
                <span aria-hidden="true">·</span>
                <span className="font-medium text-emerald-500 tabular-nums">
                  {stats.streakWeeks}{" "}
                  {stats.streakWeeks === 1 ? "week" : "weeks"} on target
                </span>
              </>
            )}
          </div>
          <h2 className="mt-1 font-serif-editorial text-2xl font-medium text-[var(--parlo-ink)]">
            Weekly Practice Goal
          </h2>
        </div>

        {/* User-defined Weekly Target Control */}
        <div className="flex flex-wrap items-center gap-3 shrink-0">
          <div
            className="inline-flex items-center gap-1 p-1 bg-[var(--parlo-surface-alt)] border border-[var(--parlo-border)] parlo-well-recessed rounded-lg"
            role="group"
            aria-label="Weekly goal presets"
          >
            {PRESET_GOALS.map((preset) => {
              const active = weeklyGoal === preset;
              return (
                <button
                  key={preset}
                  type="button"
                  onClick={() => onChangeWeeklyGoal(preset)}
                  className={`relative px-2.5 py-1.5 text-xs font-medium rounded-md transition-colors whitespace-nowrap tabular-nums cursor-pointer ${
                    active
                      ? "text-[var(--parlo-ink)]"
                      : "text-[var(--parlo-ink-muted)] hover:text-[var(--parlo-ink)]"
                  }`}
                >
                  {active && (
                    <motion.span
                      layoutId="parlo-weekly-preset"
                      transition={{ type: "spring", stiffness: 460, damping: 34 }}
                      className="absolute inset-0 rounded-md bg-[var(--parlo-surface)] parlo-keycap-thumb"
                    />
                  )}
                  <span className="relative z-10">{preset}/wk</span>
                </button>
              );
            })}
          </div>

          <div className="inline-flex items-center border border-[var(--parlo-border)] rounded-lg bg-[var(--parlo-surface-alt)]">
            <button
              type="button"
              onClick={() => handleStep(-1)}
              disabled={weeklyGoal <= 1}
              aria-label="Decrease weekly session goal"
              className="w-9 h-9 inline-flex items-center justify-center text-[var(--parlo-ink-secondary)] hover:bg-[var(--parlo-surface)] disabled:opacity-40 rounded-l-lg transition-colors cursor-pointer"
            >
              <Minus className="w-3.5 h-3.5" aria-hidden="true" />
            </button>
            <span
              className="px-3 text-xs font-mono font-medium text-[var(--parlo-ink)] tabular-nums whitespace-nowrap"
              aria-live="polite"
            >
              {weeklyGoal} {weeklyGoal === 1 ? "session" : "sessions"}
            </span>
            <button
              type="button"
              onClick={() => handleStep(1)}
              disabled={weeklyGoal >= 14}
              aria-label="Increase weekly session goal"
              className="w-9 h-9 inline-flex items-center justify-center text-[var(--parlo-ink-secondary)] hover:bg-[var(--parlo-surface)] disabled:opacity-40 rounded-r-lg transition-colors cursor-pointer"
            >
              <Plus className="w-3.5 h-3.5" aria-hidden="true" />
            </button>
          </div>
        </div>
      </div>

      {/* Progress Bar & Mon-Sun Activity Breakdown */}
      <div className="mt-5 grid grid-cols-1 lg:grid-cols-12 gap-6 items-center">
        <div className="lg:col-span-6 space-y-3">
          <div className="flex items-baseline justify-between gap-4">
            <div className="flex items-baseline gap-2">
              <span className="font-mono text-2xl font-medium text-[var(--parlo-ink)] tabular-nums">
                {stats.completedThisWeek} / {weeklyGoal}
              </span>
              <span className="text-sm text-[var(--parlo-ink-secondary)]">sessions completed</span>
            </div>
            <span className="font-mono text-sm font-medium text-[var(--parlo-ink-secondary)] tabular-nums">
              {progressRatio}%
            </span>
          </div>

          <div
            className="w-full h-2.5 bg-[var(--parlo-surface-alt)] rounded-full overflow-hidden"
            role="progressbar"
            aria-valuenow={stats.completedThisWeek}
            aria-valuemin={0}
            aria-valuemax={weeklyGoal}
            aria-label="Weekly practice goal progress"
          >
            <motion.div
              className={`h-full rounded-full origin-left ${
                goalReached ? "bg-emerald-500" : "bg-[var(--parlo-primary)]"
              }`}
              initial={{ scaleX: 0 }}
              animate={{
                scaleX: Math.min(
                  1,
                  stats.completedThisWeek / Math.max(1, weeklyGoal)
                ),
              }}
              transition={{ type: "spring", stiffness: 180, damping: 24 }}
              style={{ width: "100%" }}
            />
          </div>

          <div className="flex flex-wrap items-center justify-between gap-2 text-xs">
            <span
              className={`inline-flex items-center gap-1.5 font-medium ${
                goalReached ? "text-emerald-500" : "text-[var(--parlo-ink-secondary)]"
              }`}
            >
              {goalReached ? (
                <>
                  <CheckCircle2 className="w-3.5 h-3.5" aria-hidden="true" />
                  Weekly target reached
                </>
              ) : (
                <>
                  <Target className="w-3.5 h-3.5 text-[var(--parlo-primary)]" aria-hidden="true" />
                  {remaining} more {remaining === 1 ? "session" : "sessions"} to
                  reach your target
                </>
              )}
            </span>

            <span className="font-mono text-[var(--parlo-ink-muted)] tabular-nums">
              {formatDuration(stats.weeklySeconds)} spoken this week
            </span>
          </div>
        </div>

        {/* Mon–Sun Daily Cadence Grid */}
        <div className="lg:col-span-6">
          <div className="grid grid-cols-7 gap-2">
            {DAY_LABELS.map((day, idx) => {
              const count = stats.dailyCounts[idx];
              const isToday = idx === stats.todayIndex;
              const practiced = count > 0;
              return (
                <motion.div
                  key={day}
                  whileHover={{ y: -3, scale: 1.03 }}
                  transition={{ type: "spring", stiffness: 400, damping: 24 }}
                  className={`flex flex-col items-center justify-center py-2.5 px-1 rounded-lg border text-center ${
                    practiced
                      ? "bg-emerald-500/12 border-emerald-500/35 text-emerald-500"
                      : isToday
                      ? "bg-[var(--parlo-primary-soft)] border-[var(--parlo-primary)]/45 text-[var(--parlo-ink)]"
                      : "bg-[var(--parlo-surface-alt)] border-[var(--parlo-border)] text-[var(--parlo-ink-muted)]"
                  }`}
                >
                  <span className="text-[11px] font-medium">{day}</span>
                  <div className="mt-1.5 h-5 flex items-center justify-center">
                    {practiced ? (
                      <span className="inline-flex items-center gap-0.5 font-mono text-xs font-medium text-emerald-500 tabular-nums">
                        <Check className="w-3 h-3" aria-hidden="true" />
                        {count}
                      </span>
                    ) : (
                      <span className="font-mono text-xs text-[var(--parlo-ink-muted)] tabular-nums">
                        0
                      </span>
                    )}
                  </div>
                </motion.div>
              );
            })}
          </div>
        </div>
      </div>
    </section>
  );
}
