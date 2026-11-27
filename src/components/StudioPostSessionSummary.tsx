import {
  ArrowRight,
  BookmarkCheck,
  BookmarkPlus,
  CheckCircle2,
  RotateCcw,
  Sparkles,
  Volume2,
} from "lucide-react";
import { speakWithBrowserTts } from "../lib/audio";
import {
  CoachFeedback,
  LanguageOption,
  PracticeSessionRecord,
} from "../types";

export interface StudioPostSessionSummaryProps {
  session: PracticeSessionRecord;
  coachNotes: CoachFeedback[];
  language: LanguageOption;
  wasRecovered?: boolean;
  savedPhraseStrings: Set<string>;
  onSavePhrase: (params: {
    phrase: string;
    translation: string;
    reading?: string;
    languageCode: string;
    scenarioTitle: string;
    note?: string;
  }) => void;
  onOpenReview: () => void;
  onPracticeAgain: () => void;
  onDismiss: () => void;
}

function formatDuration(seconds: number): string {
  const m = Math.floor(seconds / 60);
  const s = seconds % 60;
  return m > 0 ? `${m}m ${s}s` : `${s}s`;
}

export function StudioPostSessionSummary({
  session,
  coachNotes,
  language,
  wasRecovered = false,
  savedPhraseStrings,
  onSavePhrase,
  onOpenReview,
  onPracticeAgain,
  onDismiss,
}: StudioPostSessionSummaryProps) {
  const refinements = coachNotes.filter((n) => !n.isNatural).slice(0, 2);
  const naturalCount = coachNotes.filter((n) => n.isNatural).length;

  return (
    <section
      aria-label="Session summary"
      className="mt-4 rounded-2xl border border-[var(--parlo-primary)]/45 bg-[var(--parlo-surface-solid)] p-5 shadow-sm space-y-4"
    >
      <div className="flex flex-wrap items-start justify-between gap-3 pb-3.5 border-b border-[var(--parlo-border)]">
        <div className="min-w-0">
          <div className="flex items-center gap-2 text-xs font-mono text-[var(--parlo-primary)]">
            <CheckCircle2 className="w-4 h-4 shrink-0" aria-hidden="true" />
            <span>
              {wasRecovered
                ? "Interrupted session preserved"
                : "Conversation archived"}
            </span>
          </div>
          <h3 className="mt-1 font-display text-lg font-semibold text-[var(--parlo-ink)]">
            {session.scenarioTitle} · {formatDuration(session.durationSeconds)}
          </h3>
          <p className="mt-0.5 text-xs text-[var(--parlo-ink-muted)] tabular-nums">
            {session.userTurnsCount} spoken{" "}
            {session.userTurnsCount === 1 ? "turn" : "turns"} · Goals{" "}
            {session.goalsCompleted}/{session.goalsTotal}
            {coachNotes.length > 0
              ? ` · ${naturalCount}/${coachNotes.length} turns phrased naturally`
              : ""}
          </p>
        </div>

        <button
          type="button"
          onClick={onDismiss}
          className="text-xs font-medium text-[var(--parlo-ink-muted)] hover:text-[var(--parlo-ink)] cursor-pointer"
        >
          Dismiss
        </button>
      </div>

      {refinements.length > 0 && (
        <div className="space-y-2.5">
          <p className="flex items-center gap-1.5 text-xs font-semibold text-[var(--parlo-ink)]">
            <Sparkles
              className="w-3.5 h-3.5 text-[var(--parlo-primary)]"
              aria-hidden="true"
            />
            Key Phrasing Takeaways
          </p>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
            {refinements.map((note) => {
              const phraseToSave = note.keyPhrase?.phrase || note.corrected;
              const isSaved = savedPhraseStrings.has(
                phraseToSave.trim().toLowerCase()
              );
              return (
                <div
                  key={note.turnId}
                  className="p-3.5 rounded-xl border border-[var(--parlo-border)] bg-[var(--parlo-canvas)]/70 space-y-1.5"
                >
                  <p className="text-xs text-[var(--parlo-ink-muted)] line-through">
                    {note.original}
                  </p>
                  <p className="text-sm font-semibold text-[var(--parlo-ink)] leading-snug">
                    {note.corrected}
                  </p>
                  <p className="text-xs text-[var(--parlo-ink-secondary)] leading-relaxed">
                    {note.explanation}
                  </p>
                  <div className="pt-1.5 flex items-center justify-between gap-2">
                    <button
                      type="button"
                      onClick={() =>
                        speakWithBrowserTts(
                          note.corrected,
                          language.speechLocale
                        )
                      }
                      className="inline-flex items-center gap-1 text-xs font-medium text-[var(--parlo-ink-muted)] hover:text-[var(--parlo-ink)] cursor-pointer"
                    >
                      <Volume2 className="w-3.5 h-3.5" aria-hidden="true" />
                      Hear
                    </button>
                    <button
                      type="button"
                      disabled={isSaved}
                      onClick={() =>
                        onSavePhrase({
                          phrase: phraseToSave,
                          translation:
                            note.keyPhrase?.translation || note.explanation,
                          reading: note.keyPhrase?.reading,
                          languageCode: language.code,
                          scenarioTitle: session.scenarioTitle,
                          note: note.tip,
                        })
                      }
                      className="inline-flex items-center gap-1 text-xs font-medium text-[var(--parlo-primary)] hover:underline disabled:text-emerald-500 cursor-pointer"
                    >
                      {isSaved ? (
                        <BookmarkCheck className="w-3.5 h-3.5" aria-hidden="true" />
                      ) : (
                        <BookmarkPlus className="w-3.5 h-3.5" aria-hidden="true" />
                      )}
                      {isSaved ? "Saved" : "Save Phrase"}
                    </button>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      )}

      <div className="flex flex-wrap items-center justify-between gap-3 pt-1">
        <button
          type="button"
          onClick={onPracticeAgain}
          className="min-h-[40px] inline-flex items-center gap-2 px-4 py-2 text-xs font-medium text-[var(--parlo-ink)] bg-[var(--parlo-surface)] border border-[var(--parlo-border)] hover:border-[var(--parlo-ink-muted)] rounded-xl transition-colors cursor-pointer"
        >
          <RotateCcw className="w-3.5 h-3.5" aria-hidden="true" />
          Practice Again
        </button>

        <button
          type="button"
          onClick={onOpenReview}
          className="min-h-[40px] inline-flex items-center gap-2 px-4 py-2 text-xs font-semibold text-[var(--parlo-on-solid)] bg-[var(--parlo-primary)] hover:bg-[var(--parlo-primary-hover)] rounded-xl transition-colors cursor-pointer"
        >
          Open Full Coaching Debrief
          <ArrowRight className="w-3.5 h-3.5" aria-hidden="true" />
        </button>
      </div>
    </section>
  );
}

export default StudioPostSessionSummary;
