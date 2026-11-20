import { useMemo, useState } from "react";
import { BookmarkPlus, CheckCircle2, Loader2, RefreshCw } from "lucide-react";
import { getLanguageByCode } from "../data/catalog";
import { fetchSessionDebrief } from "../lib/api";
import { CountryFontSpec, getCultureByLanguage } from "../lib/cultures";
import { computeDailyStreak } from "../lib/streaks";
import { DebriefReport, PracticeSessionRecord } from "../types";
import { CulturalMotifArt } from "./CulturalMotifArt";
import { DailyStreakCard } from "./DailyStreakCard";
import { EditorialTextReveal } from "./EditorialTextReveal";
import { GlowCtaButton } from "./GlowCtaButton";
import { LanguageFlagBadge } from "./LanguageFlagBadge";
import { SessionProgressChart } from "./SessionProgressChart";
import { WeeklyGoalsWidget } from "./WeeklyGoalsWidget";

interface ReviewViewProps {
  sessions: PracticeSessionRecord[];
  weeklyGoal: number;
  activeLanguageCode?: string;
  categoryFont?: CountryFontSpec;
  onSelectLanguage?: (code: string) => void;
  onChangeWeeklyGoal: (nextGoal: number) => void;
  onSaveDebrief: (sessionId: string, debrief: DebriefReport) => void;
  onSavePhrase: (params: {
    phrase: string;
    translation: string;
    languageCode: string;
    scenarioTitle: string;
    note?: string;
  }) => void;
  onStartNewSession: () => void;
}

function formatDuration(seconds: number): string {
  const mins = Math.floor(seconds / 60);
  const secs = seconds % 60;
  return `${mins}:${secs.toString().padStart(2, "0")}`;
}

export function ReviewView({
  sessions,
  weeklyGoal,
  activeLanguageCode = "es",
  categoryFont,
  onChangeWeeklyGoal,
  onSaveDebrief,
  onSavePhrase,
  onStartNewSession,
}: ReviewViewProps) {
  const [selectedId, setSelectedId] = useState<string | null>(
    sessions[0]?.id ?? null
  );
  const [loadingId, setLoadingId] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [savedTerms, setSavedTerms] = useState<Record<string, boolean>>({});

  const activeSession =
    sessions.find((s) => s.id === selectedId) ?? sessions[0] ?? null;

  const activeCulture = getCultureByLanguage(activeLanguageCode);

  const summaryStats = useMemo(() => {
    const streak = computeDailyStreak(sessions);
    const totalSeconds = sessions.reduce((sum, s) => sum + s.durationSeconds, 0);
    const totalTurns = sessions.reduce((sum, s) => sum + s.userTurnsCount, 0);
    const totalMinutes = Math.round(totalSeconds / 60);
    return {
      streakDays: streak.currentStreak,
      totalMinutes,
      totalTurns,
    };
  }, [sessions]);

  const handleGenerateDebrief = async (session: PracticeSessionRecord) => {
    setLoadingId(session.id);
    setError(null);
    try {
      const lang = getLanguageByCode(session.languageCode);
      const report = await fetchSessionDebrief({
        languageName: lang.name,
        level: session.level,
        scenarioTitle: session.scenarioTitle,
        transcript: session.transcript,
      });
      onSaveDebrief(session.id, report);
    } catch (err) {
      setError(
        err instanceof Error ? err.message : "Could not generate session debrief."
      );
    } finally {
      setLoadingId(null);
    }
  };

  return (
    <div className="max-w-[1200px] mx-auto px-6 py-8">
      {/* Raycast-Inspired Technical Plate Header */}
      <div className="relative overflow-hidden rounded-2xl border border-[var(--parlo-border)] bg-[var(--parlo-surface)] parlo-machined-frame">
        <div
          aria-hidden="true"
          className="pointer-events-none absolute inset-0 parlo-tech-field opacity-45"
        />
        <div
          aria-hidden="true"
          data-culture={activeLanguageCode}
          className="parlo-motif-overlay parlo-motif-header"
        />
        <CulturalMotifArt
          languageCode={activeLanguageCode}
          variant="ambient"
          className="hidden md:block absolute right-48 -bottom-5 w-36 h-36 z-0"
        />
        <div className="relative z-10 p-6 sm:p-8 flex flex-col md:flex-row md:items-end justify-between gap-6">
          <div>
            <p className="flex flex-wrap items-center gap-2 font-tech text-[10px] uppercase tracking-[0.2em] text-[var(--parlo-ink-muted)]">
              <LanguageFlagBadge code={activeLanguageCode} size="xs" />
              <span className="text-[var(--parlo-primary)] font-semibold">
                {activeCulture.atelierName}
              </span>
              <span aria-hidden="true">·</span>
              <span>{activeCulture.landmarkTag}</span>
              <span aria-hidden="true">·</span>
              <span>Speaking ledger & coaching debriefs</span>
              {categoryFont && (
                <>
                  <span aria-hidden="true">·</span>
                  <span>Type: {categoryFont.city}</span>
                </>
              )}
            </p>
            <h1
              className="mt-2.5 font-serif-editorial text-3xl sm:text-5xl font-medium tracking-[-0.025em] leading-[1.08] text-[var(--parlo-ink)]"
              style={
                categoryFont
                  ? {
                      fontFamily: categoryFont.fontFamily,
                      fontStyle: categoryFont.fontStyle,
                      letterSpacing: categoryFont.letterSpacing,
                    }
                  : undefined
              }
            >
              <EditorialTextReveal text="Session Review." />{" "}
              <span className="italic font-normal text-[var(--parlo-ink-muted)]">
                Measure real spoken momentum.
              </span>
            </h1>
            <p className="mt-2 text-sm sm:text-base text-[var(--parlo-ink-secondary)] max-w-2xl">
              Inspect completed conversations, generate structured grammar debriefs, and archive standout expressions.
            </p>
          </div>

          <GlowCtaButton
            onClick={onStartNewSession}
            className="py-2.5 px-4 text-sm shrink-0"
          >
            Return to Studio
          </GlowCtaButton>
        </div>

        {/* Decimal-Indexed Real Activity Plate */}
        <div className="relative z-10 grid grid-cols-1 sm:grid-cols-3 border-t border-[var(--parlo-border)] bg-[var(--parlo-surface-alt)]/80 divide-y sm:divide-y-0 sm:divide-x divide-[var(--parlo-border)]">
          <div className="px-6 py-4">
            <p className="text-xs font-mono text-[var(--parlo-ink-muted)]">
              01. Active Streak
            </p>
            <p className="mt-1 font-mono text-2xl font-semibold text-[var(--parlo-ink)] tabular-nums">
              {summaryStats.streakDays}{" "}
              <span className="text-xs font-normal text-[var(--parlo-ink-muted)]">
                {summaryStats.streakDays === 1 ? "day" : "days"}
              </span>
            </p>
          </div>
          <div className="px-6 py-4">
            <p className="text-xs font-mono text-[var(--parlo-ink-muted)]">
              02. Total Spoken Time
            </p>
            <p className="mt-1 font-mono text-2xl font-semibold text-[var(--parlo-ink)] tabular-nums">
              {summaryStats.totalMinutes}{" "}
              <span className="text-xs font-normal text-[var(--parlo-ink-muted)]">
                min logged
              </span>
            </p>
          </div>
          <div className="px-6 py-4">
            <p className="text-xs font-mono text-[var(--parlo-ink-muted)]">
              03. Spoken Turns
            </p>
            <p className="mt-1 font-mono text-2xl font-semibold text-[var(--parlo-ink)] tabular-nums">
              {summaryStats.totalTurns}{" "}
              <span className="text-xs font-normal text-[var(--parlo-ink-muted)]">
                across {sessions.length} {sessions.length === 1 ? "session" : "sessions"}
              </span>
            </p>
          </div>
        </div>
      </div>

      <DailyStreakCard
        sessions={sessions}
        activeLanguageCode={activeLanguageCode}
        onStartPractice={onStartNewSession}
      />

      <WeeklyGoalsWidget
        sessions={sessions}
        weeklyGoal={weeklyGoal}
        onChangeWeeklyGoal={onChangeWeeklyGoal}
      />

      {sessions.length === 0 ? (
        <div className="mt-6 bg-[var(--parlo-surface)] border border-[var(--parlo-border)] rounded-xl parlo-surface-elevated p-12 text-center">
          <h2 className="font-serif-editorial text-2xl font-medium text-[var(--parlo-ink)]">
            No completed sessions yet
          </h2>
          <p className="mt-2 text-sm text-[var(--parlo-ink-secondary)] max-w-md mx-auto">
            Finish a live voice conversation in the Studio and click End Session to archive the transcript, track your weekly practice goal, and generate a coaching debrief.
          </p>
        </div>
      ) : (
        <>
          <SessionProgressChart
            sessions={sessions}
            selectedSessionId={activeSession?.id ?? null}
            onSelectSession={(sessionId) => {
              setSelectedId(sessionId);
              setError(null);
            }}
          />

          <div className="mt-6 grid grid-cols-1 lg:grid-cols-12 gap-8 items-start">
          {/* Left: Session Ledger */}
          <div className="lg:col-span-4 bg-[var(--parlo-surface)] border border-[var(--parlo-border)] rounded-xl parlo-surface-elevated divide-y divide-[var(--parlo-border)]/70">
            <div className="px-5 py-3.5 flex items-center justify-between">
              <span className="font-tech text-[10px] uppercase tracking-[0.18em] font-semibold text-[var(--parlo-ink-secondary)]">
                Completed Sessions
              </span>
              <span className="text-xs font-mono text-[var(--parlo-ink-muted)] tabular-nums">
                {sessions.length} total
              </span>
            </div>
            {sessions.map((session) => {
              const lang = getLanguageByCode(session.languageCode);
              const selected = activeSession?.id === session.id;
              return (
                <button
                  key={session.id}
                  type="button"
                  onClick={() => {
                    setSelectedId(session.id);
                    setError(null);
                  }}
                  className={`w-full text-left px-5 py-4 transition-colors cursor-pointer ${
                    selected
                      ? "bg-[var(--parlo-primary-soft)]"
                      : "hover:bg-[var(--parlo-surface-alt)]"
                  }`}
                >
                  <div className="flex items-center justify-between gap-2 text-xs text-[var(--parlo-ink-muted)]">
                    <span className="inline-flex items-center gap-1.5">
                      <LanguageFlagBadge code={session.languageCode} size="xs" />
                      {lang.name} · {session.level}
                    </span>
                    <span className="font-mono tabular-nums">
                      {formatDuration(session.durationSeconds)}
                    </span>
                  </div>
                  <p className="mt-1 text-sm font-semibold text-[var(--parlo-ink)] truncate">
                    {session.scenarioTitle}
                  </p>
                  <div className="mt-1.5 flex items-center gap-2 text-xs text-[var(--parlo-ink-muted)] tabular-nums">
                    <span>{session.userTurnsCount} spoken turns</span>
                    <span aria-hidden="true">·</span>
                    <span>
                      {new Date(session.date).toLocaleDateString(undefined, {
                        month: "short",
                        day: "numeric",
                      })}
                    </span>
                  </div>
                </button>
              );
            })}
          </div>

          {/* Right: Active Session Debrief */}
          {activeSession && (
            <div className="lg:col-span-8 space-y-6">
              <div className="bg-[var(--parlo-surface)] border border-[var(--parlo-border)] rounded-xl parlo-surface-elevated p-6">
                <div className="flex flex-col sm:flex-row sm:items-start justify-between gap-4 pb-5 border-b border-[var(--parlo-border)]">
                  <div>
                    <div className="flex items-center gap-2 text-xs text-[var(--parlo-ink-muted)]">
                      <LanguageFlagBadge code={activeSession.languageCode} size="xs" />
                      <span>
                        {getLanguageByCode(activeSession.languageCode).name}
                      </span>
                      <span aria-hidden="true">·</span>
                      <span>CEFR {activeSession.level}</span>
                      <span aria-hidden="true">·</span>
                      <span>Partner: {activeSession.partnerName}</span>
                    </div>
                    <h2 className="mt-1 font-serif-editorial text-2xl sm:text-3xl font-medium text-[var(--parlo-ink)]">
                      {activeSession.scenarioTitle}
                    </h2>
                  </div>

                  <button
                    type="button"
                    disabled={loadingId === activeSession.id}
                    onClick={() => handleGenerateDebrief(activeSession)}
                    className="inline-flex items-center gap-2 px-4 py-2 text-xs font-medium text-[var(--parlo-on-solid)] bg-[var(--parlo-ink)] hover:bg-[var(--parlo-primary)] disabled:opacity-60 rounded-lg transition-colors whitespace-nowrap shrink-0 cursor-pointer"
                  >
                    {loadingId === activeSession.id ? (
                      <>
                        <Loader2 className="w-3.5 h-3.5 animate-spin" aria-hidden="true" />
                        Analyzing Transcript...
                      </>
                    ) : (
                      <>
                        <RefreshCw className="w-3.5 h-3.5" aria-hidden="true" />
                        {activeSession.debrief
                          ? "Refresh Debrief"
                          : "Generate Coaching Debrief"}
                      </>
                    )}
                  </button>
                </div>

                {/* Factual Session Metrics Strip */}
                <div className="grid grid-cols-3 gap-4 py-5 border-b border-[var(--parlo-border)]">
                  <div>
                    <p className="text-xs text-[var(--parlo-ink-muted)]">Duration</p>
                    <p className="mt-1 font-mono text-lg font-medium text-[var(--parlo-ink)] tabular-nums">
                      {formatDuration(activeSession.durationSeconds)}
                    </p>
                  </div>
                  <div>
                    <p className="text-xs text-[var(--parlo-ink-muted)]">Your Turns</p>
                    <p className="mt-1 font-mono text-lg font-medium text-[var(--parlo-ink)] tabular-nums">
                      {activeSession.userTurnsCount}
                    </p>
                  </div>
                  <div>
                    <p className="text-xs text-[var(--parlo-ink-muted)]">Goals Reached</p>
                    <p className="mt-1 font-mono text-lg font-medium text-[var(--parlo-ink)] tabular-nums">
                      {activeSession.goalsCompleted} / {activeSession.goalsTotal}
                    </p>
                  </div>
                </div>

                {error && (
                  <div className="mt-5 p-4 bg-rose-500/12 border border-rose-500/30 rounded-lg text-sm text-rose-500">
                    {error}
                  </div>
                )}

                {activeSession.debrief ? (
                  <div className="mt-6 space-y-8">
                    <div>
                      <h3 className="text-sm font-semibold text-[var(--parlo-ink)]">
                        Overview
                      </h3>
                      <p className="mt-2 text-sm text-[var(--parlo-ink-secondary)] leading-relaxed">
                        {activeSession.debrief.summary}
                      </p>
                    </div>

                    {activeSession.debrief.strengths.length > 0 && (
                      <div>
                        <h3 className="text-sm font-semibold text-[var(--parlo-ink)]">
                          What Worked Well
                        </h3>
                        <ul className="mt-3 space-y-2">
                          {activeSession.debrief.strengths.map((item, idx) => (
                            <li
                              key={idx}
                              className="flex items-start gap-2.5 text-sm text-[var(--parlo-ink-secondary)]"
                            >
                              <CheckCircle2
                                className="w-4 h-4 text-emerald-500 shrink-0 mt-0.5"
                                aria-hidden="true"
                              />
                              <span>{item}</span>
                            </li>
                          ))}
                        </ul>
                      </div>
                    )}

                    {activeSession.debrief.focusAreas.length > 0 && (
                      <div>
                        <h3 className="text-sm font-semibold text-[var(--parlo-ink)]">
                          Phrasing Refinements
                        </h3>
                        <div className="mt-3 divide-y divide-[var(--parlo-border)]/70 border border-[var(--parlo-border)] rounded-lg">
                          {activeSession.debrief.focusAreas.map((area, idx) => (
                            <div key={idx} className="p-4 space-y-1.5">
                              <p className="text-xs text-[var(--parlo-ink-muted)] line-through">
                                {area.original}
                              </p>
                              <p className="text-sm font-medium text-[var(--parlo-ink)]">
                                {area.improved}
                              </p>
                              <p className="text-xs text-[var(--parlo-ink-secondary)]">
                                {area.note}
                              </p>
                            </div>
                          ))}
                        </div>
                      </div>
                    )}

                    {activeSession.debrief.vocabularyHighlights.length > 0 && (
                      <div>
                        <h3 className="text-sm font-semibold text-[var(--parlo-ink)]">
                          Vocabulary Highlights
                        </h3>
                        <div className="mt-3 divide-y divide-[var(--parlo-border)]/70 border border-[var(--parlo-border)] rounded-lg">
                          {activeSession.debrief.vocabularyHighlights.map(
                            (vocab, idx) => {
                              const key = `${activeSession.id}-${vocab.term}`;
                              const saved = Boolean(savedTerms[key]);
                              return (
                                <div
                                  key={idx}
                                  className="p-4 flex items-start justify-between gap-4"
                                >
                                  <div>
                                    <p className="text-sm font-semibold text-[var(--parlo-ink)]">
                                      {vocab.term}
                                    </p>
                                    <p className="text-sm text-[var(--parlo-ink-secondary)]">
                                      {vocab.translation}
                                    </p>
                                    <p className="mt-1 text-xs text-[var(--parlo-ink-muted)]">
                                      {vocab.context}
                                    </p>
                                  </div>
                                  <button
                                    type="button"
                                    disabled={saved}
                                    onClick={() => {
                                      onSavePhrase({
                                        phrase: vocab.term,
                                        translation: vocab.translation,
                                        languageCode: activeSession.languageCode,
                                        scenarioTitle: activeSession.scenarioTitle,
                                        note: vocab.context,
                                      });
                                      setSavedTerms((prev) => ({
                                        ...prev,
                                        [key]: true,
                                      }));
                                    }}
                                    className="inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium text-[var(--parlo-ink)] bg-[var(--parlo-surface-alt)] hover:border-[var(--parlo-primary)] border border-[var(--parlo-border)] disabled:text-emerald-500 disabled:bg-emerald-500/12 rounded-md transition-colors whitespace-nowrap shrink-0 cursor-pointer"
                                  >
                                    <BookmarkPlus
                                      className="w-3.5 h-3.5"
                                      aria-hidden="true"
                                    />
                                    {saved ? "Saved" : "Save"}
                                  </button>
                                </div>
                              );
                            }
                          )}
                        </div>
                      </div>
                    )}

                    <div className="pt-4 border-t border-[var(--parlo-border)]">
                      <h3 className="text-sm font-semibold text-[var(--parlo-ink)]">
                        Recommended Next Focus
                      </h3>
                      <p className="mt-1.5 text-sm text-[var(--parlo-ink-secondary)]">
                        {activeSession.debrief.nextStep}
                      </p>
                    </div>
                  </div>
                ) : (
                  <div className="mt-6 py-8 text-center">
                    <p className="text-sm text-[var(--parlo-ink-secondary)]">
                      Generate a coaching debrief to receive tailored strengths, natural phrasing refinements, and vocabulary highlights from this conversation.
                    </p>
                  </div>
                )}
              </div>

              {/* Transcript Archive */}
              <div className="bg-[var(--parlo-surface)] border border-[var(--parlo-border)] rounded-xl parlo-surface-elevated p-6">
                <h3 className="text-sm font-semibold text-[var(--parlo-ink)] pb-4 border-b border-[var(--parlo-border)]">
                  Archived Transcript
                </h3>
                <div className="mt-4 space-y-4 max-h-[380px] overflow-y-auto pr-1">
                  {activeSession.transcript.map((turn, idx) => (
                    <div key={idx} className="space-y-1">
                      <span className="text-xs font-medium text-[var(--parlo-ink-muted)]">
                        {turn.role === "user" ? "You" : activeSession.partnerName}
                      </span>
                      <p className="text-sm text-[var(--parlo-ink-secondary)] leading-relaxed">
                        {turn.text}
                      </p>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          )}
          </div>
        </>
      )}
    </div>
  );
}
