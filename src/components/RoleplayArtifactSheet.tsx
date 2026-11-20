import {
  BookmarkCheck,
  BookmarkPlus,
  BookOpen,
  ClipboardList,
  FileText,
  Send,
  UtensilsCrossed,
  Volume2,
  X,
} from "lucide-react";
import { speakWithBrowserTts } from "../lib/audio";
import { RoleplayArtifact } from "../lib/roleplayArtifacts";
import { playClickSfx, playSuccessSfx } from "../lib/sfx";
import { LanguageOption } from "../types";

interface RoleplayArtifactSheetProps {
  artifact: RoleplayArtifact;
  language: LanguageOption;
  scenarioTitle: string;
  isLive: boolean;
  savedPhraseStrings: Set<string>;
  onClose: () => void;
  onUsePrompt: (promptText: string) => void;
  onSavePhrase: (params: {
    phrase: string;
    translation: string;
    reading?: string;
    languageCode: string;
    scenarioTitle: string;
    note?: string;
  }) => void;
}

function getKindIcon(kind: RoleplayArtifact["kind"]) {
  switch (kind) {
    case "menu":
    case "board":
      return UtensilsCrossed;
    case "reading-list":
      return BookOpen;
    case "brief":
      return ClipboardList;
    case "lease":
    case "guide":
    default:
      return FileText;
  }
}

export function RoleplayArtifactSheet({
  artifact,
  language,
  scenarioTitle,
  isLive,
  savedPhraseStrings,
  onClose,
  onUsePrompt,
  onSavePhrase,
}: RoleplayArtifactSheetProps) {
  const Icon = getKindIcon(artifact.kind);

  return (
    <section
      aria-label={`Interactive scene prop: ${artifact.title}`}
      className="rounded-xl bg-[var(--parlo-surface-solid)] border border-[var(--parlo-border)] shadow-[var(--parlo-shadow-sm)] overflow-hidden"
    >
      {/* Editorial Cultural Header */}
      <div className="px-4 py-3 border-b border-[var(--parlo-border)] flex items-start justify-between gap-3 bg-[var(--parlo-surface-soft)]">
        <div className="min-w-0">
          <div className="flex items-center gap-1.5 text-[11px] font-mono uppercase tracking-wider text-[var(--parlo-primary)]">
            <Icon className="w-3.5 h-3.5 shrink-0" aria-hidden="true" />
            <span className="truncate">{artifact.headerKicker}</span>
          </div>
          <h3 className="mt-0.5 font-display text-base font-semibold text-[var(--parlo-ink)]">
            {artifact.title}
          </h3>
          <p className="text-xs text-[var(--parlo-ink-muted)] mt-0.5">
            {artifact.subtitle}
          </p>
        </div>

        <button
          type="button"
          onClick={() => {
            playClickSfx();
            onClose();
          }}
          aria-label="Close scene prop"
          className="p-1.5 text-[var(--parlo-ink-muted)] hover:text-[var(--parlo-ink)] rounded-lg transition-colors cursor-pointer shrink-0"
        >
          <X className="w-4 h-4" />
        </button>
      </div>

      {/* Authentic Item Rows */}
      <div className="divide-y divide-[var(--parlo-border)]">
        {artifact.items.map((item) => {
          const isSaved = savedPhraseStrings.has(
            item.title.trim().toLowerCase()
          );
          return (
            <div
              key={item.id}
              className="px-4 py-3 flex flex-col sm:flex-row sm:items-center justify-between gap-2.5 hover:bg-[var(--parlo-surface-soft)]/70 transition-colors"
            >
              <div className="min-w-0 space-y-0.5">
                <div className="flex flex-wrap items-baseline gap-x-2 gap-y-0.5">
                  <span className="font-medium text-sm text-[var(--parlo-ink)]">
                    {item.title}
                  </span>
                  {item.reading && (
                    <span className="font-mono text-[11px] text-[var(--parlo-ink-muted)]">
                      {item.reading}
                    </span>
                  )}
                  <span className="text-xs font-mono font-semibold tabular-nums text-[var(--parlo-primary)]">
                    · {item.meta}
                  </span>
                </div>
                <p className="text-xs text-[var(--parlo-ink-secondary)] leading-snug">
                  {item.detail}
                </p>
                <p className="text-[11px] text-[var(--parlo-ink-muted)] italic pt-0.5">
                  “{item.speakPrompt}”
                </p>
              </div>

              <div className="flex items-center gap-1.5 shrink-0">
                <button
                  type="button"
                  onClick={() => {
                    playClickSfx();
                    speakWithBrowserTts(item.speakPrompt, language.speechLocale);
                  }}
                  title="Hear natural pronunciation"
                  className="inline-flex items-center gap-1 px-2.5 py-1.5 text-xs font-medium text-[var(--parlo-ink-secondary)] hover:text-[var(--parlo-ink)] border border-[var(--parlo-border)] rounded-lg transition-colors whitespace-nowrap cursor-pointer"
                >
                  <Volume2 className="w-3.5 h-3.5" aria-hidden="true" />
                  Listen
                </button>

                <button
                  type="button"
                  disabled={isSaved}
                  onClick={() => {
                    playSuccessSfx();
                    onSavePhrase({
                      phrase: item.title,
                      translation: item.detail,
                      reading: item.reading,
                      languageCode: language.code,
                      scenarioTitle,
                      note: item.speakPrompt,
                    });
                  }}
                  title="Save to Phrasebook"
                  className="inline-flex items-center gap-1 px-2.5 py-1.5 text-xs font-medium text-[var(--parlo-ink-secondary)] hover:text-[var(--parlo-ink)] border border-[var(--parlo-border)] rounded-lg transition-colors whitespace-nowrap cursor-pointer disabled:text-[var(--parlo-success)] disabled:border-[var(--parlo-success)]/40"
                >
                  {isSaved ? (
                    <BookmarkCheck className="w-3.5 h-3.5" aria-hidden="true" />
                  ) : (
                    <BookmarkPlus className="w-3.5 h-3.5" aria-hidden="true" />
                  )}
                  {isSaved ? "Saved" : "Save"}
                </button>

                <button
                  type="button"
                  onClick={() => {
                    playClickSfx();
                    onUsePrompt(item.speakPrompt);
                  }}
                  className="inline-flex items-center gap-1 px-2.5 py-1.5 text-xs font-medium text-[var(--parlo-on-solid)] bg-[var(--parlo-primary)] hover:bg-[var(--parlo-primary-hover)] rounded-lg transition-colors whitespace-nowrap cursor-pointer"
                >
                  <Send className="w-3 h-3" aria-hidden="true" />
                  {isLive ? "Say Now" : "Use Line"}
                </button>
              </div>
            </div>
          );
        })}
      </div>

      {/* Cultural Footnote */}
      <div className="px-4 py-2 bg-[var(--parlo-surface-soft)] border-t border-[var(--parlo-border)] text-[11px] text-[var(--parlo-ink-muted)]">
        {artifact.footerNote}
      </div>
    </section>
  );
}
