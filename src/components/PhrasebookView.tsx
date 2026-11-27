import { useEffect, useMemo, useState } from "react";
import { AnimatePresence, motion } from "motion/react";
import {
  Check,
  ChevronLeft,
  ChevronRight,
  Plus,
  RotateCcw,
  Trash2,
  Volume2,
} from "lucide-react";
import { getLanguageByCode, LANGUAGES, SCENARIOS } from "../data/catalog";
import { speakWithBrowserTts } from "../lib/audio";
import { CountryFontSpec, getCultureByLanguage } from "../lib/cultures";
import { sfxEngine } from "../lib/sfx";
import {
  computeNextSrsState,
  formatIntervalLabel,
  isSrsCardDue,
  readSrsScheduleMap,
  saveSrsScheduleMap,
  SrsScheduleMap,
} from "../lib/srs";
import { SavedPhrase, SrsRating } from "../types";
import { CulturalMotifArt } from "./CulturalMotifArt";
import { EditorialTextReveal } from "./EditorialTextReveal";
import { LanguageFlagBadge } from "./LanguageFlagBadge";
import { TiltCard3D } from "./TiltCard3D";

interface PhrasebookViewProps {
  phrases: SavedPhrase[];
  storageScope?: string;
  activeLanguageCode?: string;
  categoryFont?: CountryFontSpec;
  onSelectLanguage?: (code: string) => void;
  onAddPhrase: (phrase: Omit<SavedPhrase, "id" | "createdAt" | "mastered">) => void;
  onToggleMastered: (id: string) => void;
  onDeletePhrase: (id: string) => void;
}

const SPRING_TAB = {
  type: "spring" as const,
  stiffness: 460,
  damping: 34,
};

export function PhrasebookView({
  phrases,
  storageScope = "guest",
  activeLanguageCode = "es",
  categoryFont,
  onAddPhrase,
  onToggleMastered,
  onDeletePhrase,
}: PhrasebookViewProps) {
  const [filterLang, setFilterLang] = useState<string>("all");
  const [mode, setMode] = useState<"list" | "flashcards">("list");
  const [deckFilter, setDeckFilter] = useState<"due" | "all">("due");
  const [srsMap, setSrsMap] = useState<SrsScheduleMap>(() =>
    readSrsScheduleMap(storageScope)
  );
  const [cardIndex, setCardIndex] = useState(0);
  const [slideDir, setSlideDir] = useState<1 | -1>(1);
  const [revealed, setRevealed] = useState(false);

  // Reload account-scoped SRS schedule whenever signed-in user changes
  useEffect(() => {
    setSrsMap(readSrsScheduleMap(storageScope));
    setCardIndex(0);
    setRevealed(false);
  }, [storageScope]);

  // Manual quick-add form
  const [showAdd, setShowAdd] = useState(false);
  const [newPhrase, setNewPhrase] = useState("");
  const [newTranslation, setNewTranslation] = useState("");
  const [newReading, setNewReading] = useState("");
  const [newLang, setNewLang] = useState(activeLanguageCode);

  const activeLanguage = getLanguageByCode(activeLanguageCode);
  const activeCulture = getCultureByLanguage(activeLanguageCode);

  const savedSet = useMemo(
    () => new Set(phrases.map((p) => p.phrase.trim().toLowerCase())),
    [phrases]
  );

  // Live curated expressions tailored to the active language for 1-click study & save
  const culturalDiscoveryPhrases = useMemo(() => {
    const items: {
      text: string;
      reading?: string;
      meaning: string;
      source: string;
    }[] = [
      {
        text: activeCulture.samplePhrase,
        reading: activeCulture.sampleReading,
        meaning: activeCulture.sampleMeaning,
        source: activeCulture.etiquetteTitle,
      },
    ];

    for (const sc of SCENARIOS) {
      const starters = sc.starterPhrases[activeLanguageCode];
      if (!starters) continue;
      for (const st of starters) {
        if (items.length >= 3) break;
        if (!items.some((x) => x.text === st.text)) {
          items.push({
            text: st.text,
            reading: st.reading,
            meaning: st.meaning,
            source: sc.title,
          });
        }
      }
      if (items.length >= 3) break;
    }
    return items;
  }, [activeCulture, activeLanguageCode]);

  const filtered = useMemo(() => {
    if (filterLang === "all") return phrases;
    return phrases.filter((p) => p.languageCode === filterLang);
  }, [phrases, filterLang]);

  const masteredCount = useMemo(
    () => filtered.filter((p) => p.mastered).length,
    [filtered]
  );

  const dueFiltered = useMemo(
    () => filtered.filter((p) => isSrsCardDue(srsMap[p.id])),
    [filtered, srsMap]
  );

  const flashcardDeck = deckFilter === "due" ? dueFiltered : filtered;

  const safeCardIndex =
    flashcardDeck.length > 0
      ? Math.min(cardIndex, flashcardDeck.length - 1)
      : 0;
  const currentCard = flashcardDeck[safeCardIndex];
  const currentCardSrs = currentCard ? srsMap[currentCard.id] : undefined;

  const handleRateCard = (rating: SrsRating) => {
    if (!currentCard) return;
    const nextState = computeNextSrsState(srsMap[currentCard.id], rating);
    const updatedMap: SrsScheduleMap = {
      ...srsMap,
      [currentCard.id]: nextState,
    };
    setSrsMap(updatedMap);
    saveSrsScheduleMap(updatedMap, storageScope);

    if (rating === "again") {
      sfxEngine.playToggle(false);
    } else {
      sfxEngine.playSavePhrase();
    }

    if (!currentCard.mastered && nextState.repetitions >= 3) {
      onToggleMastered(currentCard.id);
    }

    setRevealed(false);
    setSlideDir(1);
    if (deckFilter === "all" && flashcardDeck.length > 1) {
      setCardIndex((prev) => (prev + 1) % flashcardDeck.length);
    } else {
      setCardIndex(0);
    }
  };

  // Keyboard shortcuts in Flashcard mode: Space flips card, Left/Right navigates deck
  useEffect(() => {
    if (mode !== "flashcards" || flashcardDeck.length === 0) return;
    const onKeyDown = (e: KeyboardEvent) => {
      if (
        e.target instanceof HTMLInputElement ||
        e.target instanceof HTMLTextAreaElement ||
        e.target instanceof HTMLSelectElement
      ) {
        return;
      }
      if (e.code === "Space") {
        e.preventDefault();
        setRevealed((r) => !r);
      } else if (e.key === "ArrowRight") {
        e.preventDefault();
        setSlideDir(1);
        setCardIndex((prev) => (prev + 1) % flashcardDeck.length);
        setRevealed(false);
      } else if (e.key === "ArrowLeft") {
        e.preventDefault();
        setSlideDir(-1);
        setCardIndex((prev) =>
          prev === 0 ? flashcardDeck.length - 1 : prev - 1
        );
        setRevealed(false);
      }
    };
    window.addEventListener("keydown", onKeyDown);
    return () => window.removeEventListener("keydown", onKeyDown);
  }, [flashcardDeck.length, mode]);

  const handleAddSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newPhrase.trim() || !newTranslation.trim()) return;
    onAddPhrase({
      phrase: newPhrase.trim(),
      translation: newTranslation.trim(),
      reading: newReading.trim() || undefined,
      languageCode: newLang,
      scenarioTitle: "Personal Entry",
    });
    setNewPhrase("");
    setNewTranslation("");
    setNewReading("");
    setShowAdd(false);
  };

  return (
    <div className="max-w-[1200px] mx-auto px-4 sm:px-6 py-6 sm:py-8">
      <div className="relative overflow-hidden rounded-2xl border border-[var(--parlo-border)] bg-[var(--parlo-surface)] parlo-machined-frame p-6 sm:p-8 flex flex-col md:flex-row md:items-end justify-between gap-6">
        <div
          aria-hidden="true"
          data-culture={activeLanguageCode}
          className="parlo-motif-overlay parlo-motif-header"
        />
        <CulturalMotifArt
          languageCode={activeLanguageCode}
          variant="ambient"
          className="hidden md:block absolute right-52 -bottom-5 w-36 h-36 z-0"
        />
        <div className="relative z-10">
          <div className="flex flex-wrap items-center gap-2 font-tech text-[10px] uppercase tracking-[0.2em] text-[var(--parlo-ink-muted)]">
            <LanguageFlagBadge code={activeLanguageCode} size="xs" />
            <span className="text-[var(--parlo-primary)] font-semibold">
              {activeLanguage.name}
            </span>
            <span aria-hidden="true">·</span>
            <span>{activeCulture.landmarkTag}</span>
            <span aria-hidden="true">·</span>
            <span>{phrases.length} saved expressions</span>
            {categoryFont && (
              <>
                <span aria-hidden="true">·</span>
                <span>Type: {categoryFont.city}</span>
              </>
            )}
          </div>
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
            <EditorialTextReveal text="Phrasebook." />{" "}
            <span className="italic font-normal text-[var(--parlo-ink-muted)]">
              Remember how natives really say it.
            </span>
          </h1>
          <p className="mt-2 text-sm sm:text-base text-[var(--parlo-ink-secondary)] max-w-2xl">
            Expressions saved from your live conversations and grammar notes—practice listening or flip 3D active recall flashcards.
          </p>
        </div>

        <div className="relative z-10 flex items-center gap-3 shrink-0">
          <div className="inline-flex items-center gap-1 p-1 bg-[var(--parlo-canvas)] parlo-well-recessed rounded-xl">
            {(
              [
                { id: "list", label: "Collection" },
                { id: "flashcards", label: "3D Flashcards" },
              ] as const
            ).map((opt) => {
              const active = mode === opt.id;
              return (
                <button
                  key={opt.id}
                  type="button"
                  onClick={() => {
                    setMode(opt.id);
                    if (opt.id === "flashcards") {
                      setCardIndex(0);
                      setRevealed(false);
                    }
                  }}
                  className={`relative px-3.5 py-1.5 text-xs font-medium rounded-lg transition-colors whitespace-nowrap cursor-pointer ${
                    active
                      ? "text-[var(--parlo-ink)]"
                      : "text-[var(--parlo-ink-muted)] hover:text-[var(--parlo-ink)]"
                  }`}
                >
                  {active && (
                    <motion.span
                      layoutId="parlo-phrase-mode"
                      transition={SPRING_TAB}
                      className="absolute inset-0 rounded-lg bg-[var(--parlo-surface)] parlo-keycap-thumb"
                    />
                  )}
                  <span className="relative z-10">{opt.label}</span>
                </button>
              );
            })}
          </div>

          <motion.button
            type="button"
            whileHover={{ y: -1.5 }}
            whileTap={{ scale: 0.97 }}
            onClick={() => {
              setNewLang(activeLanguageCode);
              setShowAdd((prev) => !prev);
            }}
            className="inline-flex items-center gap-1.5 px-4 py-2 text-xs font-semibold text-[var(--parlo-on-solid)] bg-[var(--parlo-ink)] hover:bg-[var(--parlo-primary)] rounded-xl transition-colors whitespace-nowrap shrink-0 cursor-pointer"
          >
            <Plus className="w-3.5 h-3.5" aria-hidden="true" />
            Add Phrase
          </motion.button>
        </div>
      </div>

      {/* Cofounder-Inspired Live Cultural Expressions Discovery Strip (1-click listen & save) */}
      <section aria-label="Curated cultural expressions" className="mt-6">
        <div className="flex items-baseline justify-between gap-3 mb-3">
          <div className="flex items-baseline gap-2">
            <span className="font-mono text-xs text-[var(--parlo-accent)]">
              01.
            </span>
            <h2 className="font-display text-base font-semibold text-[var(--parlo-ink)]">
              Everyday {activeLanguage.name} Starters
            </h2>
            <span className="hidden sm:inline text-xs text-[var(--parlo-ink-muted)]">
              Curated for {activeCulture.cityLine}
            </span>
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          {culturalDiscoveryPhrases.map((item, idx) => {
            const alreadySaved = savedSet.has(item.text.trim().toLowerCase());
            return (
              <TiltCard3D
                key={`${activeLanguageCode}-${idx}`}
                maxTilt={5.5}
                magneticPull={4}
                hoverScale={1.012}
                className="parlo-shimmer-card relative overflow-hidden rounded-xl bg-[var(--parlo-surface)] border border-[var(--parlo-border)] p-4 flex flex-col justify-between gap-3"
              >
                <div
                  aria-hidden="true"
                  data-culture={activeLanguageCode}
                  className="parlo-motif-overlay parlo-motif-card-subtle"
                />
                <div className="relative z-10">
                  <p className="text-[11px] font-mono text-[var(--parlo-ink-muted)] truncate">
                    {item.source}
                  </p>
                  <p className="mt-1.5 font-display text-base font-semibold text-[var(--parlo-ink)] leading-snug">
                    {item.text}
                  </p>
                  {item.reading && (
                    <p className="mt-0.5 font-mono text-[11px] text-[var(--parlo-ink-muted)]">
                      {item.reading}
                    </p>
                  )}
                  <p className="mt-1 text-xs text-[var(--parlo-ink-secondary)]">
                    {item.meaning}
                  </p>
                </div>

                <div className="relative z-10 pt-2.5 border-t border-[var(--parlo-border)]/70 flex items-center justify-between gap-2">
                  <button
                    type="button"
                    onClick={() =>
                      speakWithBrowserTts(item.text, activeLanguage.speechLocale)
                    }
                    className="inline-flex items-center gap-1.5 text-xs font-medium text-[var(--parlo-ink-secondary)] hover:text-[var(--parlo-ink)] cursor-pointer"
                  >
                    <Volume2 className="w-3.5 h-3.5 text-[var(--parlo-primary)]" aria-hidden="true" />
                    Listen
                  </button>

                  <button
                    type="button"
                    disabled={alreadySaved}
                    onClick={() =>
                      onAddPhrase({
                        phrase: item.text,
                        translation: item.meaning,
                        reading: item.reading,
                        languageCode: activeLanguageCode,
                        scenarioTitle: item.source,
                      })
                    }
                    className="inline-flex items-center gap-1 px-2.5 py-1 text-xs font-medium rounded-lg border border-[var(--parlo-border)] bg-[var(--parlo-surface-alt)] text-[var(--parlo-ink)] hover:border-[var(--parlo-primary)] hover:text-[var(--parlo-primary)] disabled:opacity-75 disabled:text-emerald-500 transition-colors cursor-pointer"
                  >
                    {alreadySaved ? (
                      <>
                        <Check className="w-3 h-3" aria-hidden="true" />
                        Saved
                      </>
                    ) : (
                      <>
                        <Plus className="w-3 h-3" aria-hidden="true" />
                        Save
                      </>
                    )}
                  </button>
                </div>
              </TiltCard3D>
            );
          })}
        </div>
      </section>

      <AnimatePresence initial={false}>
        {showAdd && (
          <motion.form
            initial={{ opacity: 0, y: -10, scale: 0.99 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: -8, scale: 0.99 }}
            transition={{ duration: 0.22, ease: [0.16, 1, 0.3, 1] }}
            onSubmit={handleAddSubmit}
            className="mt-6 bg-[var(--parlo-surface)] border border-[var(--parlo-border)] rounded-xl parlo-surface-elevated p-5 grid grid-cols-1 md:grid-cols-4 gap-4 items-end"
          >
            <label className="block">
              <span className="block text-xs font-medium text-[var(--parlo-ink-secondary)] mb-1.5">
                Target Language Expression
              </span>
              <input
                type="text"
                required
                value={newPhrase}
                onChange={(e) => setNewPhrase(e.target.value)}
                placeholder="e.g. ¿Me puedes echar una mano?"
                className="w-full px-3 py-2 text-sm bg-[var(--parlo-canvas)] border border-[var(--parlo-border)] text-[var(--parlo-ink)] placeholder:text-[var(--parlo-ink-muted)] rounded-lg focus:outline-none focus:border-[var(--parlo-primary)]"
              />
            </label>
            <label className="block">
              <span className="block text-xs font-medium text-[var(--parlo-ink-secondary)] mb-1.5">
                English Meaning
              </span>
              <input
                type="text"
                required
                value={newTranslation}
                onChange={(e) => setNewTranslation(e.target.value)}
                placeholder="e.g. Could you give me a hand?"
                className="w-full px-3 py-2 text-sm bg-[var(--parlo-canvas)] border border-[var(--parlo-border)] text-[var(--parlo-ink)] placeholder:text-[var(--parlo-ink-muted)] rounded-lg focus:outline-none focus:border-[var(--parlo-primary)]"
              />
            </label>
            <label className="block">
              <span className="block text-xs font-medium text-[var(--parlo-ink-secondary)] mb-1.5">
                Language
              </span>
              <select
                value={newLang}
                onChange={(e) => setNewLang(e.target.value)}
                className="w-full px-3 py-2 text-sm bg-[var(--parlo-canvas)] border border-[var(--parlo-border)] text-[var(--parlo-ink)] rounded-lg focus:outline-none focus:border-[var(--parlo-primary)]"
              >
                {LANGUAGES.map((l) => (
                  <option key={l.code} value={l.code}>
                    {l.name}
                  </option>
                ))}
              </select>
            </label>
            <div className="flex items-center gap-2">
              <button
                type="submit"
                className="flex-1 px-4 py-2 text-sm font-medium text-[var(--parlo-on-solid)] bg-[var(--parlo-primary)] hover:bg-[var(--parlo-primary-hover)] rounded-lg transition-colors whitespace-nowrap cursor-pointer"
              >
                Save
              </button>
              <button
                type="button"
                onClick={() => setShowAdd(false)}
                className="px-3 py-2 text-sm font-medium text-[var(--parlo-ink-muted)] hover:text-[var(--parlo-ink)] cursor-pointer"
              >
                Cancel
              </button>
            </div>
            <label className="block md:col-span-2">
              <span className="block text-xs font-medium text-[var(--parlo-ink-secondary)] mb-1.5">
                Pronunciation / Reading (optional)
              </span>
              <input
                type="text"
                value={newReading}
                onChange={(e) => setNewReading(e.target.value)}
                placeholder="Romanization or stress hint"
                className="w-full px-3 py-2 text-sm bg-[var(--parlo-canvas)] border border-[var(--parlo-border)] text-[var(--parlo-ink)] placeholder:text-[var(--parlo-ink-muted)] rounded-lg focus:outline-none focus:border-[var(--parlo-primary)]"
              />
            </label>
          </motion.form>
        )}
      </AnimatePresence>

      {/* Filter & Summary Row */}
      <div className="mt-6 flex flex-wrap items-center justify-between gap-4">
        <div className="flex items-center gap-1 p-1 bg-[var(--parlo-surface-alt)] border border-[var(--parlo-border)] parlo-well-recessed rounded-xl overflow-x-auto no-scrollbar max-w-full">
          {[{ code: "all", name: "All Languages" }, ...LANGUAGES].map((lang) => {
            const active = filterLang === lang.code;
            return (
              <button
                key={lang.code}
                type="button"
                onClick={() => {
                  setFilterLang(lang.code);
                  setCardIndex(0);
                  setRevealed(false);
                }}
                className={`relative inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium rounded-lg transition-colors whitespace-nowrap cursor-pointer ${
                  active
                    ? "text-[var(--parlo-ink)]"
                    : "text-[var(--parlo-ink-muted)] hover:text-[var(--parlo-ink)]"
                }`}
              >
                {active && (
                  <motion.span
                    layoutId="parlo-phrase-lang"
                    transition={SPRING_TAB}
                    className="absolute inset-0 rounded-lg bg-[var(--parlo-surface)] parlo-keycap-thumb"
                  />
                )}
                {lang.code !== "all" && (
                  <LanguageFlagBadge
                    code={lang.code}
                    size="xs"
                    className="relative z-10"
                  />
                )}
                <span className="relative z-10">{lang.name}</span>
              </button>
            );
          })}
        </div>

        <div className="text-xs text-[var(--parlo-ink-muted)] tabular-nums">
          <span>{filtered.length} saved</span>
          <span className="mx-2" aria-hidden="true">
            ·
          </span>
          <span>{masteredCount} mastered</span>
        </div>
      </div>

      {filtered.length === 0 ? (
        <div className="mt-8 bg-[var(--parlo-surface)] border border-[var(--parlo-border)] rounded-xl parlo-surface-elevated p-12 text-center">
          <h2 className="font-display text-xl font-semibold text-[var(--parlo-ink)]">
            Your phrasebook is ready
          </h2>
          <p className="mt-2 text-sm text-[var(--parlo-ink-muted)] max-w-md mx-auto">
            Click Save Phrase on any turn or coach correction during a Studio conversation, or add your own expression above.
          </p>
        </div>
      ) : mode === "flashcards" ? (
        <div className="mt-8 max-w-2xl mx-auto">
          {/* Smart Spaced-Repetition Deck Filter */}
          <div className="mb-6 flex flex-wrap items-center justify-between gap-3">
            <div
              className="inline-flex items-center gap-1 p-1 bg-[var(--parlo-surface-alt)] border border-[var(--parlo-border)] parlo-well-recessed rounded-xl"
              role="group"
              aria-label="Flashcard review queue"
            >
              {(
                [
                  { id: "due", label: `Due Today (${dueFiltered.length})` },
                  { id: "all", label: `All Saved (${filtered.length})` },
                ] as const
              ).map((opt) => {
                const active = deckFilter === opt.id;
                return (
                  <button
                    key={opt.id}
                    type="button"
                    onClick={() => {
                      sfxEngine.playNav();
                      setDeckFilter(opt.id);
                      setCardIndex(0);
                      setRevealed(false);
                    }}
                    className={`relative px-3 py-1.5 text-xs font-medium rounded-lg transition-colors whitespace-nowrap tabular-nums cursor-pointer ${
                      active
                        ? "text-[var(--parlo-ink)]"
                        : "text-[var(--parlo-ink-muted)] hover:text-[var(--parlo-ink)]"
                    }`}
                  >
                    {active && (
                      <motion.span
                        layoutId="parlo-srs-queue"
                        transition={SPRING_TAB}
                        className="absolute inset-0 rounded-lg bg-[var(--parlo-surface)] parlo-keycap-thumb"
                      />
                    )}
                    <span className="relative z-10">{opt.label}</span>
                  </button>
                );
              })}
            </div>

            <span className="text-xs font-mono text-[var(--parlo-ink-muted)] tabular-nums">
              Smart SM-2 Spaced Repetition
            </span>
          </div>

          {!currentCard ? (
            <div className="bg-[var(--parlo-surface)] border border-[var(--parlo-border)] rounded-2xl parlo-surface-elevated p-10 text-center space-y-3">
              <h2 className="font-display text-xl font-semibold text-[var(--parlo-ink)]">
                All caught up for today
              </h2>
              <p className="text-sm text-[var(--parlo-ink-muted)] max-w-md mx-auto">
                Every saved phrase in this language filter is scheduled for a future review. Switch to All Saved anytime for extra practice.
              </p>
              <button
                type="button"
                onClick={() => {
                  sfxEngine.playNav();
                  setDeckFilter("all");
                  setCardIndex(0);
                  setRevealed(false);
                }}
                className="inline-flex items-center gap-2 px-4 py-2 text-xs font-medium text-[var(--parlo-on-solid)] bg-[var(--parlo-primary)] hover:bg-[var(--parlo-primary-hover)] rounded-lg transition-colors cursor-pointer"
              >
                Practice All Saved ({filtered.length})
              </button>
            </div>
          ) : (
            <>
              {/* Physical 3D Stacked Deck Stage */}
              <div className="parlo-flip-scene relative">
                {flashcardDeck.length > 2 && (
                  <div
                    aria-hidden="true"
                    className="pointer-events-none absolute inset-x-6 -bottom-3 h-full rounded-2xl bg-[var(--parlo-surface)]/70 border border-[var(--parlo-border)] -z-20"
                    style={{ transform: "translateY(8px) scale(0.94)" }}
                  />
                )}
                {flashcardDeck.length > 1 && (
                  <div
                    aria-hidden="true"
                    className="pointer-events-none absolute inset-x-3 -bottom-1.5 h-full rounded-2xl bg-[var(--parlo-surface)]/88 border border-[var(--parlo-border)] -z-10"
                    style={{ transform: "translateY(4px) scale(0.97)" }}
                  />
                )}

                <AnimatePresence mode="wait" initial={false}>
                  <motion.div
                    key={currentCard.id}
                    initial={{ opacity: 0, x: slideDir * 44, rotateZ: slideDir * 1.5 }}
                    animate={{ opacity: 1, x: 0, rotateZ: 0 }}
                    exit={{ opacity: 0, x: slideDir * -44, rotateZ: slideDir * -1.5 }}
                    transition={{ duration: 0.24, ease: [0.16, 1, 0.3, 1] }}
                  >
                    <motion.div
                      onClick={() => {
                        sfxEngine.playFlipCard();
                        setRevealed((r) => !r);
                      }}
                      role="button"
                      tabIndex={0}
                      onKeyDown={(e) => {
                        if (e.key === "Enter" || e.key === " ") {
                          e.preventDefault();
                          setRevealed((r) => !r);
                        }
                      }}
                      aria-label={
                        revealed
                          ? "Showing translation. Click to flip back to expression."
                          : "Showing expression. Click to flip card and reveal translation."
                      }
                      animate={{ rotateY: revealed ? 180 : 0 }}
                      transition={{
                        type: "spring",
                        stiffness: 260,
                        damping: 26,
                      }}
                      className="parlo-flip-card min-h-[340px] w-full cursor-pointer select-none"
                    >
                      {/* FRONT FACE: Target Language Expression */}
                      <div className="parlo-flip-face overflow-hidden absolute inset-0 bg-[var(--parlo-surface)] border border-[var(--parlo-border)] rounded-2xl parlo-surface-elevated p-8 sm:p-10 flex flex-col justify-between text-center">
                        <div
                          aria-hidden="true"
                          data-culture={currentCard.languageCode}
                          className="parlo-motif-overlay parlo-motif-corner"
                        />
                        <div className="relative z-10 flex items-center justify-between text-xs text-[var(--parlo-ink-muted)] tabular-nums">
                          <span>
                            {getLanguageByCode(currentCard.languageCode).name} ·{" "}
                            {currentCard.scenarioTitle}
                          </span>
                          <span className="font-mono">
                            {safeCardIndex + 1} / {flashcardDeck.length} ·{" "}
                            {formatIntervalLabel(currentCardSrs?.intervalDays ?? 0)}
                          </span>
                        </div>

                        <div className="relative z-10 my-6">
                          <p className="font-display text-2xl sm:text-3xl font-semibold text-[var(--parlo-ink)] leading-snug">
                            {currentCard.phrase}
                          </p>
                          {currentCard.reading && (
                            <p className="mt-2 font-mono text-sm text-[var(--parlo-ink-muted)]">
                              {currentCard.reading}
                            </p>
                          )}

                          <div className="mt-5 flex items-center justify-center">
                            <button
                              type="button"
                              onClick={(e) => {
                                e.stopPropagation();
                                speakWithBrowserTts(
                                  currentCard.phrase,
                                  getLanguageByCode(currentCard.languageCode)
                                    .speechLocale
                                );
                              }}
                              className="inline-flex items-center gap-2 px-3.5 py-2 text-xs font-medium text-[var(--parlo-ink)] bg-[var(--parlo-canvas)] border border-[var(--parlo-border)] hover:border-[var(--parlo-ink)] rounded-lg transition-colors cursor-pointer"
                            >
                              <Volume2
                                className="w-4 h-4 text-[var(--parlo-primary)]"
                                aria-hidden="true"
                              />
                              Listen
                            </button>
                          </div>
                        </div>

                        <div className="relative z-10 pt-4 border-t border-[var(--parlo-border)]/70 flex items-center justify-between text-xs text-[var(--parlo-ink-muted)]">
                          <span>Front · Expression</span>
                          <span className="font-mono text-[var(--parlo-primary)]">
                            Click or press Space to flip
                          </span>
                        </div>
                      </div>

                      {/* BACK FACE: English Meaning & Usage Note */}
                      <div className="parlo-flip-face parlo-flip-back overflow-hidden absolute inset-0 bg-[var(--parlo-ink)] text-[var(--parlo-on-solid)] border border-[var(--parlo-ink)] rounded-2xl parlo-surface-elevated p-8 sm:p-10 flex flex-col justify-between text-center">
                        <div
                          aria-hidden="true"
                          data-culture={currentCard.languageCode}
                          className="parlo-motif-overlay parlo-motif-corner parlo-motif-dark"
                        />
                        <div className="relative z-10 flex items-center justify-between text-xs text-[var(--parlo-on-solid)]/65 tabular-nums">
                          <span>
                            {getLanguageByCode(currentCard.languageCode).name} ·
                            Translation
                          </span>
                          <span className="font-mono">
                            {safeCardIndex + 1} / {flashcardDeck.length}
                          </span>
                        </div>

                        <div className="relative z-10 my-6 space-y-3">
                          <p className="font-display text-2xl sm:text-3xl font-semibold text-[var(--parlo-on-solid)] leading-snug">
                            {currentCard.translation}
                          </p>
                          <p className="font-mono text-xs text-[var(--parlo-on-solid)]/70">
                            {currentCard.phrase}
                          </p>
                          {currentCard.note && (
                            <p className="mt-2 text-sm text-[var(--parlo-on-solid)]/80 max-w-md mx-auto leading-relaxed">
                              {currentCard.note}
                            </p>
                          )}
                        </div>

                        <div className="relative z-10 pt-4 border-t border-[var(--parlo-on-solid)]/18 flex items-center justify-between text-xs text-[var(--parlo-on-solid)]/70">
                          <span>Back · Rate recall below</span>
                          <span className="font-mono text-[var(--parlo-accent)]">
                            Click or press Space to flip back
                          </span>
                        </div>
                      </div>
                    </motion.div>
                  </motion.div>
                </AnimatePresence>
              </div>

              {/* SM-2 Recall Rating Bar (shown when flipped) */}
              <AnimatePresence initial={false}>
                {revealed && (
                  <motion.div
                    key="srs-rating-bar"
                    initial={{ opacity: 0, y: 8 }}
                    animate={{ opacity: 1, y: 0 }}
                    exit={{ opacity: 0, y: 6 }}
                    transition={{ duration: 0.18, ease: [0.16, 1, 0.3, 1] }}
                    className="mt-5 p-3 rounded-xl bg-[var(--parlo-surface)] border border-[var(--parlo-border)] flex flex-col sm:flex-row sm:items-center justify-between gap-3"
                  >
                    <span className="text-xs text-[var(--parlo-ink-muted)]">
                      How easily did you recall this phrase?
                    </span>
                    <div className="grid grid-cols-3 gap-2">
                      {(
                        [
                          {
                            rating: "again" as SrsRating,
                            label: "Again",
                            tone: "border-red-500/35 text-red-500 hover:bg-red-500/10",
                          },
                          {
                            rating: "good" as SrsRating,
                            label: "Good",
                            tone: "border-[var(--parlo-primary)]/45 text-[var(--parlo-primary)] hover:bg-[var(--parlo-primary-soft)]",
                          },
                          {
                            rating: "easy" as SrsRating,
                            label: "Easy",
                            tone: "border-emerald-500/40 text-emerald-500 hover:bg-emerald-500/10",
                          },
                        ] as const
                      ).map(({ rating, label, tone }) => {
                        const preview = computeNextSrsState(
                          currentCardSrs,
                          rating
                        );
                        return (
                          <button
                            key={rating}
                            type="button"
                            onClick={() => handleRateCard(rating)}
                            className={`px-3 py-1.5 rounded-lg border text-xs font-medium transition-colors whitespace-nowrap tabular-nums cursor-pointer ${tone}`}
                          >
                            {label} · {formatIntervalLabel(preview.intervalDays)}
                          </button>
                        );
                      })}
                    </div>
                  </motion.div>
                )}
              </AnimatePresence>

              <div className="mt-6 flex flex-wrap items-center justify-between gap-3">
                <motion.button
                  type="button"
                  whileHover={{ x: -2 }}
                  whileTap={{ scale: 0.97 }}
                  onClick={() => {
                    setSlideDir(-1);
                    setCardIndex((prev) =>
                      prev === 0 ? flashcardDeck.length - 1 : prev - 1
                    );
                    setRevealed(false);
                  }}
                  className="inline-flex items-center gap-1.5 px-3.5 py-2 text-sm font-medium text-[var(--parlo-ink)] bg-[var(--parlo-surface)] border border-[var(--parlo-border)] hover:border-[var(--parlo-ink)] rounded-lg transition-colors cursor-pointer"
                >
                  <ChevronLeft className="w-4 h-4" aria-hidden="true" />
                  Previous
                </motion.button>

                <div className="flex flex-wrap items-center gap-2">
                  <button
                    type="button"
                    onClick={() => {
                      sfxEngine.playFlipCard();
                      setRevealed((r) => !r);
                    }}
                    className="inline-flex items-center gap-1.5 px-3 py-2 text-xs font-medium text-[var(--parlo-ink-muted)] hover:text-[var(--parlo-ink)] cursor-pointer"
                  >
                    <RotateCcw className="w-3.5 h-3.5" aria-hidden="true" />
                    Flip Card
                  </button>
                  <motion.button
                    type="button"
                    whileTap={{ scale: 0.96 }}
                    onClick={() => onToggleMastered(currentCard.id)}
                    className={`inline-flex items-center gap-1.5 px-3.5 py-2 text-xs font-medium rounded-lg border transition-colors cursor-pointer ${
                      currentCard.mastered
                        ? "bg-emerald-500/12 border-emerald-500/35 text-emerald-500"
                        : "bg-[var(--parlo-surface)] border-[var(--parlo-border)] text-[var(--parlo-ink)] hover:border-[var(--parlo-ink)]"
                    }`}
                  >
                    <Check className="w-3.5 h-3.5" aria-hidden="true" />
                    {currentCard.mastered ? "Mastered" : "Mark Mastered"}
                  </motion.button>
                </div>

                <motion.button
                  type="button"
                  whileHover={{ x: 2 }}
                  whileTap={{ scale: 0.97 }}
                  onClick={() => {
                    setSlideDir(1);
                    setCardIndex((prev) => (prev + 1) % flashcardDeck.length);
                    setRevealed(false);
                  }}
                  className="inline-flex items-center gap-1.5 px-3.5 py-2 text-sm font-medium text-[var(--parlo-ink)] bg-[var(--parlo-surface)] border border-[var(--parlo-border)] hover:border-[var(--parlo-ink)] rounded-lg transition-colors cursor-pointer"
                >
                  Next
                  <ChevronRight className="w-4 h-4" aria-hidden="true" />
                </motion.button>
              </div>
            </>
          )}
        </div>
      ) : (
        <div className="mt-6 bg-[var(--parlo-surface)] border border-[var(--parlo-border)] rounded-xl parlo-surface-elevated divide-y divide-[var(--parlo-border)]/70">
          {filtered.map((item, idx) => {
            const lang = getLanguageByCode(item.languageCode);
            return (
              <motion.div
                key={item.id}
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{
                  duration: 0.24,
                  delay: Math.min(idx * 0.03, 0.24),
                  ease: [0.16, 1, 0.3, 1],
                }}
                className="p-5 flex flex-col sm:flex-row sm:items-center justify-between gap-4 hover:bg-[var(--parlo-canvas)]/40 transition-colors"
              >
                <div className="min-w-0">
                  <div className="flex items-center gap-2 text-xs text-[var(--parlo-ink-muted)]">
                    <LanguageFlagBadge code={item.languageCode} size="xs" />
                    <span>{lang.name}</span>
                    <span aria-hidden="true">·</span>
                    <span>{item.scenarioTitle}</span>
                    {item.mastered && (
                      <>
                        <span aria-hidden="true">·</span>
                        <span className="font-medium text-emerald-500">
                          Mastered
                        </span>
                      </>
                    )}
                  </div>
                  <p className="mt-1 font-serif-editorial text-lg font-medium text-[var(--parlo-ink)]">
                    {item.phrase}
                  </p>
                  {item.reading && (
                    <p className="mt-0.5 font-mono text-xs text-[var(--parlo-ink-muted)]">
                      {item.reading}
                    </p>
                  )}
                  <p className="mt-1 text-sm text-[var(--parlo-ink-secondary)]">
                    {item.translation}
                  </p>
                  {item.note && (
                    <p className="mt-1 text-xs text-[var(--parlo-ink-muted)]">{item.note}</p>
                  )}
                </div>

                <div className="flex items-center gap-2 shrink-0">
                  <button
                    type="button"
                    onClick={() =>
                      speakWithBrowserTts(item.phrase, lang.speechLocale)
                    }
                    aria-label={`Listen to ${item.phrase}`}
                    className="inline-flex items-center justify-center w-10 h-10 text-[var(--parlo-ink-muted)] hover:text-[var(--parlo-ink)] hover:bg-[var(--parlo-surface-alt)] rounded-lg transition-colors cursor-pointer"
                  >
                    <Volume2 className="w-4 h-4" aria-hidden="true" />
                  </button>
                  <button
                    type="button"
                    onClick={() => onToggleMastered(item.id)}
                    className={`inline-flex items-center gap-1.5 px-3 py-2 text-xs font-medium rounded-lg border transition-colors whitespace-nowrap cursor-pointer ${
                      item.mastered
                        ? "bg-emerald-500/12 border-emerald-500/35 text-emerald-500"
                        : "bg-[var(--parlo-surface)] border-[var(--parlo-border)] text-[var(--parlo-ink)] hover:border-[var(--parlo-primary)]"
                    }`}
                  >
                    <Check className="w-3.5 h-3.5" aria-hidden="true" />
                    {item.mastered ? "Mastered" : "Mark Mastered"}
                  </button>
                  <button
                    type="button"
                    onClick={() => onDeletePhrase(item.id)}
                    aria-label={`Remove ${item.phrase}`}
                    className="inline-flex items-center justify-center w-10 h-10 text-[var(--parlo-ink-muted)] hover:text-rose-500 hover:bg-rose-500/10 rounded-lg transition-colors cursor-pointer"
                  >
                    <Trash2 className="w-4 h-4" aria-hidden="true" />
                  </button>
                </div>
              </motion.div>
            );
          })}
        </div>
      )}
    </div>
  );
}
