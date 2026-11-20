import { useMemo, useState } from "react";
import {
  CartesianGrid,
  Line,
  LineChart,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from "recharts";
import { getLanguageByCode } from "../data/catalog";
import { PracticeSessionRecord } from "../types";

interface SessionProgressChartProps {
  sessions: PracticeSessionRecord[];
  selectedSessionId: string | null;
  onSelectSession: (sessionId: string) => void;
}

type MetricView = "both" | "talkTime" | "goalRate";

interface ChartDatum {
  sessionId: string;
  label: string;
  fullDate: string;
  scenarioTitle: string;
  languageName: string;
  level: string;
  talkMinutes: number;
  durationSeconds: number;
  goalRate: number;
  goalsCompleted: number;
  goalsTotal: number;
  userTurnsCount: number;
}

function formatDuration(seconds: number): string {
  const mins = Math.floor(seconds / 60);
  const secs = seconds % 60;
  return `${mins}:${secs.toString().padStart(2, "0")}`;
}

interface CustomTooltipProps {
  active?: boolean;
  payload?: { payload?: ChartDatum }[];
}

function ProgressTooltip({ active, payload }: CustomTooltipProps) {
  if (!active || !payload || payload.length === 0) return null;
  const datum = payload[0]?.payload;
  if (!datum) return null;

  return (
    <div className="bg-[var(--parlo-surface-solid)] border border-[var(--parlo-border)] rounded-xl p-3.5 shadow-lg max-w-[260px]">
      <div className="text-xs text-[var(--parlo-ink-muted)]">
        <span>{datum.fullDate}</span>
        <span className="mx-1.5" aria-hidden="true">
          ·
        </span>
        <span>
          {datum.languageName} ({datum.level})
        </span>
      </div>
      <p className="mt-1 text-sm font-semibold text-[var(--parlo-ink)] leading-snug">
        {datum.scenarioTitle}
      </p>

      <div className="mt-2.5 pt-2.5 border-t border-[var(--parlo-border)] space-y-1.5 text-xs">
        <div className="flex items-center justify-between gap-4">
          <span className="flex items-center gap-2 text-[var(--parlo-ink-secondary)]">
            <span
              className="w-2.5 h-0.5 bg-[var(--parlo-primary)] inline-block"
              aria-hidden="true"
            />
            Talk Time
          </span>
          <span className="font-mono font-medium text-[var(--parlo-ink)] tabular-nums">
            {formatDuration(datum.durationSeconds)} ({datum.talkMinutes} min)
          </span>
        </div>

        <div className="flex items-center justify-between gap-4">
          <span className="flex items-center gap-2 text-[var(--parlo-ink-secondary)]">
            <span
              className="w-2.5 h-0.5 bg-[var(--parlo-accent)] inline-block"
              aria-hidden="true"
            />
            Goal Completion
          </span>
          <span className="font-mono font-medium text-[var(--parlo-ink)] tabular-nums">
            {datum.goalRate}% ({datum.goalsCompleted}/{datum.goalsTotal})
          </span>
        </div>

        <div className="flex items-center justify-between gap-4 text-[var(--parlo-ink-muted)] pt-0.5">
          <span>Spoken Turns</span>
          <span className="font-mono tabular-nums">{datum.userTurnsCount}</span>
        </div>
      </div>
    </div>
  );
}

export function SessionProgressChart({
  sessions,
  selectedSessionId,
  onSelectSession,
}: SessionProgressChartProps) {
  const [metricView, setMetricView] = useState<MetricView>("both");

  // Order chronologically from oldest to newest for progression tracking
  const chartData = useMemo<ChartDatum[]>(() => {
    const ordered = [...sessions].sort((a, b) => a.date - b.date);
    return ordered.map((session, idx) => {
      const lang = getLanguageByCode(session.languageCode);
      const goalRate =
        session.goalsTotal > 0
          ? Math.round((session.goalsCompleted / session.goalsTotal) * 100)
          : 0;
      const talkMinutes = Number((session.durationSeconds / 60).toFixed(1));
      const d = new Date(session.date);
      const shortDate = d.toLocaleDateString(undefined, {
        month: "short",
        day: "numeric",
      });

      return {
        sessionId: session.id,
        label: `#${idx + 1} · ${shortDate}`,
        fullDate: d.toLocaleDateString(undefined, {
          month: "short",
          day: "numeric",
          year: "numeric",
        }),
        scenarioTitle: session.scenarioTitle,
        languageName: lang.name,
        level: session.level,
        talkMinutes,
        durationSeconds: session.durationSeconds,
        goalRate,
        goalsCompleted: session.goalsCompleted,
        goalsTotal: session.goalsTotal,
        userTurnsCount: session.userTurnsCount,
      };
    });
  }, [sessions]);

  const summaryStats = useMemo(() => {
    const totalSeconds = sessions.reduce((acc, s) => acc + s.durationSeconds, 0);
    const totalRate = chartData.reduce((acc, d) => acc + d.goalRate, 0);
    const avgGoalRate =
      chartData.length > 0 ? Math.round(totalRate / chartData.length) : 0;
    const avgMinutes =
      sessions.length > 0
        ? (totalSeconds / 60 / sessions.length).toFixed(1)
        : "0.0";

    return {
      totalDurationLabel: formatDuration(totalSeconds),
      avgMinutes,
      avgGoalRate,
    };
  }, [chartData, sessions]);

  const showTalkTime = metricView === "both" || metricView === "talkTime";
  const showGoalRate = metricView === "both" || metricView === "goalRate";

  return (
    <section
      aria-label="Practice progression chart"
      className="mt-8 bg-[var(--parlo-surface)] border border-[var(--parlo-border)] rounded-xl parlo-surface-elevated p-6"
    >
      <div className="flex flex-col md:flex-row md:items-start justify-between gap-4 pb-5 border-b border-[var(--parlo-border)]">
        <div>
          <h2 className="font-serif-editorial text-2xl font-medium text-[var(--parlo-ink)]">
            Talk-Time & Goal Progression
          </h2>
          <div className="mt-1 flex flex-wrap items-center gap-x-2 gap-y-1 text-xs text-[var(--parlo-ink-muted)] tabular-nums">
            <span>Total talk time: {summaryStats.totalDurationLabel}</span>
            <span aria-hidden="true">·</span>
            <span>Avg session: {summaryStats.avgMinutes} min</span>
            <span aria-hidden="true">·</span>
            <span>Avg goal rate: {summaryStats.avgGoalRate}%</span>
          </div>
        </div>

        {/* Interactive Series Filter */}
        <div className="inline-flex items-center gap-1 p-1 bg-[var(--parlo-surface-alt)] border border-[var(--parlo-border)] parlo-well-recessed rounded-lg shrink-0 self-start">
          {(
            [
              { id: "both", label: "Both Metrics" },
              { id: "talkTime", label: "Talk Time" },
              { id: "goalRate", label: "Goal Rate" },
            ] as { id: MetricView; label: string }[]
          ).map((option) => (
            <button
              key={option.id}
              type="button"
              onClick={() => setMetricView(option.id)}
              className={`px-3 py-1.5 text-xs font-medium rounded-md transition-colors whitespace-nowrap shrink-0 cursor-pointer ${
                metricView === option.id
                  ? "bg-[var(--parlo-surface)] text-[var(--parlo-ink)] parlo-keycap-thumb"
                  : "text-[var(--parlo-ink-muted)] hover:text-[var(--parlo-ink)]"
              }`}
            >
              {option.label}
            </button>
          ))}
        </div>
      </div>

      {/* Explicit Accessible Series Key */}
      <div className="mt-4 flex flex-wrap items-center justify-between gap-3 text-xs text-[var(--parlo-ink-secondary)]">
        <div className="flex flex-wrap items-center gap-5">
          {showTalkTime && (
            <span className="inline-flex items-center gap-2">
              <span
                className="w-3.5 h-0.5 bg-[var(--parlo-primary)] inline-block"
                aria-hidden="true"
              />
              <span>Talk Time (min, left axis)</span>
            </span>
          )}
          {showGoalRate && (
            <span className="inline-flex items-center gap-2">
              <span
                className="w-3.5 h-0.5 bg-[var(--parlo-accent)] inline-block"
                aria-hidden="true"
              />
              <span>Goal Completion Rate (%, right axis)</span>
            </span>
          )}
        </div>

        <span className="text-[var(--parlo-ink-muted)]">
          {sessions.length === 1
            ? "Complete another session to plot progression trends."
            : "Click any point to inspect that session below."}
        </span>
      </div>

      <div className="mt-4 w-full h-[280px]">
        <ResponsiveContainer width="100%" height="100%">
          <LineChart
            data={chartData}
            margin={{ top: 12, right: 12, left: 0, bottom: 4 }}
            onClick={(state) => {
              const s = state as {
                activeTooltipIndex?: number | string | null;
                activePayload?: { payload?: ChartDatum }[];
              } | null;
              const fromPayload = s?.activePayload?.[0]?.payload?.sessionId;
              if (fromPayload) {
                onSelectSession(fromPayload);
                return;
              }
              if (
                typeof s?.activeTooltipIndex === "number" &&
                chartData[s.activeTooltipIndex]
              ) {
                onSelectSession(chartData[s.activeTooltipIndex].sessionId);
              }
            }}
          >
            <CartesianGrid
              stroke="var(--parlo-border)"
              strokeDasharray="3 3"
              vertical={false}
            />
            <XAxis
              dataKey="label"
              tick={{ fill: "var(--parlo-ink-muted)", fontSize: 12 }}
              axisLine={{ stroke: "var(--parlo-border)" }}
              tickLine={false}
              dy={6}
            />

            {showTalkTime && (
              <YAxis
                yAxisId="left"
                orientation="left"
                allowDecimals={true}
                domain={[0, "auto"]}
                tick={{ fill: "var(--parlo-ink-muted)", fontSize: 12 }}
                axisLine={false}
                tickLine={false}
                width={44}
                tickFormatter={(value: number) => `${value}m`}
              />
            )}

            {showGoalRate && (
              <YAxis
                yAxisId="right"
                orientation="right"
                domain={[0, 100]}
                ticks={[0, 25, 50, 75, 100]}
                tick={{ fill: "var(--parlo-ink-muted)", fontSize: 12 }}
                axisLine={false}
                tickLine={false}
                width={44}
                tickFormatter={(value: number) => `${value}%`}
              />
            )}

            <Tooltip
              content={<ProgressTooltip />}
              cursor={{ stroke: "var(--parlo-ink-muted)", strokeDasharray: "3 3" }}
            />

            {showTalkTime && (
              <Line
                yAxisId="left"
                type="monotone"
                dataKey="talkMinutes"
                name="Talk Time (min)"
                stroke="var(--parlo-primary)"
                strokeWidth={2.25}
                dot={(props) => {
                  const { cx, cy, payload } = props as {
                    cx?: number;
                    cy?: number;
                    payload?: ChartDatum;
                  };
                  if (cx == null || cy == null) return <g key="empty-t" />;
                  const isSelected = payload?.sessionId === selectedSessionId;
                  return (
                    <circle
                      key={`talk-${payload?.sessionId ?? cx}`}
                      cx={cx}
                      cy={cy}
                      r={isSelected ? 6 : 4}
                      fill={isSelected ? "var(--parlo-primary)" : "#FFFFFF"}
                      stroke="var(--parlo-primary)"
                      strokeWidth={2}
                      style={{ cursor: "pointer" }}
                      onClick={() => {
                        if (payload?.sessionId) {
                          onSelectSession(payload.sessionId);
                        }
                      }}
                    />
                  );
                }}
                activeDot={{
                  r: 6,
                  fill: "var(--parlo-primary)",
                  stroke: "#FFFFFF",
                  strokeWidth: 2,
                }}
                isAnimationActive={false}
              />
            )}

            {showGoalRate && (
              <Line
                yAxisId="right"
                type="monotone"
                dataKey="goalRate"
                name="Goal Completion (%)"
                stroke="var(--parlo-accent)"
                strokeWidth={2.25}
                strokeDasharray="6 3"
                dot={(props) => {
                  const { cx, cy, payload } = props as {
                    cx?: number;
                    cy?: number;
                    payload?: ChartDatum;
                  };
                  if (cx == null || cy == null) return <g key="empty-g" />;
                  const isSelected = payload?.sessionId === selectedSessionId;
                  return (
                    <circle
                      key={`goal-${payload?.sessionId ?? cx}`}
                      cx={cx}
                      cy={cy}
                      r={isSelected ? 6 : 4}
                      fill={isSelected ? "var(--parlo-accent)" : "#FFFFFF"}
                      stroke="var(--parlo-accent)"
                      strokeWidth={2}
                      style={{ cursor: "pointer" }}
                      onClick={() => {
                        if (payload?.sessionId) {
                          onSelectSession(payload.sessionId);
                        }
                      }}
                    />
                  );
                }}
                activeDot={{
                  r: 6,
                  fill: "var(--parlo-accent)",
                  stroke: "#FFFFFF",
                  strokeWidth: 2,
                }}
                isAnimationActive={false}
              />
            )}
          </LineChart>
        </ResponsiveContainer>
      </div>
    </section>
  );
}
