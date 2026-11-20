import { useState } from "react";
import { AnimatePresence, motion } from "motion/react";
import { ArrowRight, Filter, Plus, X } from "lucide-react";
import { getLanguageByCode, LANGUAGES, VOICE_PERSONAS } from "../data/catalog";
import { CountryFontSpec, getCultureByLanguage } from "../lib/cultures";
import { CefrLevel, Scenario, VoiceName } from "../types";
import { CulturalMotifArt } from "./CulturalMotifArt";
import { EditorialTextReveal } from "./EditorialTextReveal";
import { LanguageFlagBadge } from "./LanguageFlagBadge";
import { ScenarioImage } from "./ScenarioImage";
import { TiltCard3D } from "./TiltCard3D";

interface ScenariosViewProps {
  scenarios: Scenario[];
  activeScenarioId: string;
  activeLanguageCode?: string;
  categoryFont?: CountryFontSpec;
  onSelectLanguage?: (code: string) => void;
  onSelectScenario: (scenario: Scenario) => void;
  onCreateScenario: (scenario: Scenario) => void;
}

const CATEGORIES = ["All", "Everyday", "Dining", "Culture", "Workplace", "Housing", "Fluency", "Custom"];

export function ScenariosView({
  scenarios,
  activeScenarioId,
  activeLanguageCode = "es",
  categoryFont,
  onSelectScenario,
  onCreateScenario,
}: ScenariosViewProps) {
  const [selectedCategory, setSelectedCategory] = useState("All");
  const [onlyActiveLanguage, setOnlyActiveLanguage] = useState(false);
  const [showBuilder, setShowBuilder] = useState(false);

  const activeLanguage = getLanguageByCode(activeLanguageCode);
  const activeCulture = getCultureByLanguage(activeLanguageCode);

  // Custom scenario builder state
  const [title, setTitle] = useState("");
  const [city, setCity] = useState("");
  const [languageCode, setLanguageCode] = useState(activeLanguageCode);
  const [level, setLevel] = useState<CefrLevel>("B1");
  const [partnerName, setPartnerName] = useState("");
  const [partnerRole, setPartnerRole] = useState("");
  const [voice, setVoice] = useState<VoiceName>("Zephyr");
  const [promptContext, setPromptContext] = useState("");
  const [goalsText, setGoalsText] = useState(
    "Introduce your purpose clearly\nAsk two follow-up questions\nWrap up with a natural closing"
  );

  const filtered = scenarios
    .filter((s) => {
      const matchesCat =
        selectedCategory === "All"
          ? true
          : selectedCategory === "Custom"
          ? Boolean(s.isCustom)
          : s.category === selectedCategory;
      const matchesLang = onlyActiveLanguage
        ? s.defaultLanguageCode === activeLanguageCode
        : true;
      return matchesCat && matchesLang;
    })
    .sort((a, b) => {
      // Gently surface active language scenarios first while preserving catalog order
      const aMatch = a.defaultLanguageCode === activeLanguageCode ? 0 : 1;
      const bMatch = b.defaultLanguageCode === activeLanguageCode ? 0 : 1;
      return aMatch - bMatch;
    });

  const handleSubmitCustom = (e: React.FormEvent) => {
    e.preventDefault();
    if (!title.trim() || !promptContext.trim()) return;

    const parsedGoals = goalsText
      .split("\n")
      .map((line) => line.trim())
      .filter(Boolean);

    const newScenario: Scenario = {
      id: `custom-${Date.now()}`,
      title: title.trim(),
      city: city.trim() || "Custom Setting",
      category: "Custom",
      durationLabel: "Flexible",
      defaultLanguageCode: languageCode,
      recommendedLevel: level,
      partnerName: partnerName.trim() || "Alex",
      partnerRole: partnerRole.trim() || "Conversation Partner",
      defaultVoice: voice,
      fallbackGradient: "from-slate-800 via-blue-950 to-slate-900",
      summary: promptContext.trim(),
      promptContext: promptContext.trim(),
      goals:
        parsedGoals.length > 0
          ? parsedGoals
          : ["Maintain a natural back-and-forth exchange"],
      starterPhrases: {},
      isCustom: true,
    };

    onCreateScenario(newScenario);
    onSelectScenario(newScenario);
    setShowBuilder(false);
    setTitle("");
    setCity("");
    setPartnerName("");
    setPartnerRole("");
    setPromptContext("");
  };

  return (
    <div className="max-w-[1200px] mx-auto px-6 py-8">
      {/* Raycast-Inspired Technical Header Field with Two-Tone Display Contrast */}
      <div className="relative overflow-hidden rounded-2xl border border-[var(--parlo-border)] bg-[var(--parlo-surface)] parlo-machined-frame p-6 sm:p-8 flex flex-col md:flex-row md:items-end justify-between gap-6">
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
        <div className="relative z-10">
          <div className="flex flex-wrap items-center gap-2 font-tech text-[10px] uppercase tracking-[0.2em] text-[var(--parlo-ink-muted)]">
            <LanguageFlagBadge code={activeLanguageCode} size="xs" />
            <span className="text-[var(--parlo-primary)] font-semibold">
              {activeCulture.atelierName}
            </span>
            <span aria-hidden="true">·</span>
            <span>{activeCulture.landmarkTag}</span>
            {categoryFont && (
              <>
                <span aria-hidden="true">·</span>
                <span className="text-[var(--parlo-ink-secondary)]">
                  Type: {categoryFont.city}
                </span>
              </>
            )}
          </div>
          <h1
            className="mt-2.5 text-3xl sm:text-5xl font-medium tracking-[-0.025em] leading-[1.08] text-[var(--parlo-ink)] [text-wrap:balance]"
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
            <EditorialTextReveal text="Real-World Immersion." />{" "}
            <span className="italic font-normal text-[var(--parlo-ink-muted)]">
              Pick a room and start talking.
            </span>
          </h1>
          <p className="mt-2.5 text-sm sm:text-base text-[var(--parlo-ink-secondary)] max-w-2xl">
            Step into everyday cafés, studios, and neighborhoods with a native-speaking voice partner calibrated to {activeLanguage.name}.
          </p>
        </div>
        <button
          type="button"
          onClick={() => setShowBuilder((prev) => !prev)}
          className="relative z-10 inline-flex items-center justify-center gap-2 px-4 py-2.5 text-sm font-medium text-[var(--parlo-on-solid)] bg-[var(--parlo-ink)] hover:bg-[var(--parlo-primary)] rounded-xl transition-colors whitespace-nowrap shrink-0 cursor-pointer focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[var(--parlo-primary)]"
        >
          {showBuilder ? (
            <>
              <X className="w-4 h-4" aria-hidden="true" />
              Close Builder
            </>
          ) : (
            <>
              <Plus className="w-4 h-4" aria-hidden="true" />
              Create Custom Scenario
            </>
          )}
        </button>
      </div>

      <AnimatePresence initial={false}>
        {showBuilder && (
          <motion.form
            initial={{ opacity: 0, y: -12, scale: 0.99 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: -10, scale: 0.99 }}
            transition={{ duration: 0.22, ease: [0.16, 1, 0.3, 1] }}
            onSubmit={handleSubmitCustom}
            className="relative overflow-hidden mt-8 bg-[var(--parlo-surface)] border border-[var(--parlo-border)] rounded-xl parlo-surface-elevated p-6 space-y-5"
          >
            <div
              aria-hidden="true"
              data-culture={languageCode}
              className="parlo-motif-overlay parlo-motif-corner"
            />
          <div className="relative z-10 flex items-center justify-between">
            <h2 className="font-serif-editorial text-2xl font-medium text-[var(--parlo-ink)]">
              Design Your Own Situation
            </h2>
            <span className="font-tech text-[10px] uppercase tracking-[0.18em] text-[var(--parlo-ink-muted)]">
              Ready for live voice practice
            </span>
          </div>

          <div className="relative z-10 grid grid-cols-1 md:grid-cols-3 gap-4">
            <label className="block">
              <span className="block text-xs font-medium text-[var(--parlo-ink-secondary)] mb-1.5">
                Scenario Title
              </span>
              <input
                type="text"
                required
                value={title}
                onChange={(e) => setTitle(e.target.value)}
                placeholder="e.g. Pharmacy Visit for Cold Medicine"
                className="w-full px-3.5 py-2.5 text-sm bg-[var(--parlo-canvas)] border border-[var(--parlo-border)] text-[var(--parlo-ink)] placeholder:text-[var(--parlo-ink-muted)] rounded-lg focus:outline-none focus:border-[var(--parlo-primary)]"
              />
            </label>

            <label className="block">
              <span className="block text-xs font-medium text-[var(--parlo-ink-secondary)] mb-1.5">
                City or Location
              </span>
              <input
                type="text"
                value={city}
                onChange={(e) => setCity(e.target.value)}
                placeholder="e.g. Lisbon, Kyoto, Lyon"
                className="w-full px-3.5 py-2.5 text-sm bg-[var(--parlo-canvas)] border border-[var(--parlo-border)] text-[var(--parlo-ink)] placeholder:text-[var(--parlo-ink-muted)] rounded-lg focus:outline-none focus:border-[var(--parlo-primary)]"
              />
            </label>

            <label className="block">
              <span className="block text-xs font-medium text-[var(--parlo-ink-secondary)] mb-1.5">
                Language
              </span>
              <select
                value={languageCode}
                onChange={(e) => setLanguageCode(e.target.value)}
                className="w-full px-3.5 py-2.5 text-sm bg-[var(--parlo-canvas)] border border-[var(--parlo-border)] text-[var(--parlo-ink)] rounded-lg focus:outline-none focus:border-[var(--parlo-primary)]"
              >
                {LANGUAGES.map((lang) => (
                  <option key={lang.code} value={lang.code}>
                    {lang.name} ({lang.nativeName})
                  </option>
                ))}
              </select>
            </label>

            <label className="block">
              <span className="block text-xs font-medium text-[var(--parlo-ink-secondary)] mb-1.5">
                Partner Name
              </span>
              <input
                type="text"
                value={partnerName}
                onChange={(e) => setPartnerName(e.target.value)}
                placeholder="e.g. Inês"
                className="w-full px-3.5 py-2.5 text-sm bg-[var(--parlo-canvas)] border border-[var(--parlo-border)] text-[var(--parlo-ink)] placeholder:text-[var(--parlo-ink-muted)] rounded-lg focus:outline-none focus:border-[var(--parlo-primary)]"
              />
            </label>

            <label className="block">
              <span className="block text-xs font-medium text-[var(--parlo-ink-secondary)] mb-1.5">
                Partner Role
              </span>
              <input
                type="text"
                value={partnerRole}
                onChange={(e) => setPartnerRole(e.target.value)}
                placeholder="e.g. Local Pharmacist"
                className="w-full px-3.5 py-2.5 text-sm bg-[var(--parlo-canvas)] border border-[var(--parlo-border)] text-[var(--parlo-ink)] placeholder:text-[var(--parlo-ink-muted)] rounded-lg focus:outline-none focus:border-[var(--parlo-primary)]"
              />
            </label>

            <div className="grid grid-cols-2 gap-3">
              <label className="block">
                <span className="block text-xs font-medium text-[var(--parlo-ink-secondary)] mb-1.5">
                  Level
                </span>
                <select
                  value={level}
                  onChange={(e) => setLevel(e.target.value as CefrLevel)}
                  className="w-full px-3 py-2.5 text-sm bg-[var(--parlo-canvas)] border border-[var(--parlo-border)] text-[var(--parlo-ink)] rounded-lg focus:outline-none focus:border-[var(--parlo-primary)]"
                >
                  {(["A2", "B1", "B2", "C1"] as CefrLevel[]).map((lvl) => (
                    <option key={lvl} value={lvl}>
                      CEFR {lvl}
                    </option>
                  ))}
                </select>
              </label>

              <label className="block">
                <span className="block text-xs font-medium text-[var(--parlo-ink-secondary)] mb-1.5">
                  Voice
                </span>
                <select
                  value={voice}
                  onChange={(e) => setVoice(e.target.value as VoiceName)}
                  className="w-full px-3 py-2.5 text-sm bg-[var(--parlo-canvas)] border border-[var(--parlo-border)] text-[var(--parlo-ink)] rounded-lg focus:outline-none focus:border-[var(--parlo-primary)]"
                >
                  {VOICE_PERSONAS.map((vp) => (
                    <option key={vp.id} value={vp.id}>
                      {vp.label}
                    </option>
                  ))}
                </select>
              </label>
            </div>
          </div>

          <div className="relative z-10 grid grid-cols-1 md:grid-cols-2 gap-4">
            <label className="block">
              <span className="block text-xs font-medium text-[var(--parlo-ink-secondary)] mb-1.5">
                Situation & Partner Instructions
              </span>
              <textarea
                required
                rows={3}
                value={promptContext}
                onChange={(e) => setPromptContext(e.target.value)}
                placeholder="Describe who the partner is, where you are meeting, and what should happen..."
                className="w-full px-3.5 py-2.5 text-sm bg-[var(--parlo-canvas)] border border-[var(--parlo-border)] text-[var(--parlo-ink)] placeholder:text-[var(--parlo-ink-muted)] rounded-lg focus:outline-none focus:border-[var(--parlo-primary)]"
              />
            </label>

            <label className="block">
              <span className="block text-xs font-medium text-[var(--parlo-ink-secondary)] mb-1.5">
                Conversation Goals (one per line)
              </span>
              <textarea
                rows={3}
                value={goalsText}
                onChange={(e) => setGoalsText(e.target.value)}
                className="w-full px-3.5 py-2.5 text-sm bg-[var(--parlo-canvas)] border border-[var(--parlo-border)] text-[var(--parlo-ink)] rounded-lg focus:outline-none focus:border-[var(--parlo-primary)]"
              />
            </label>
          </div>

          <div className="relative z-10 flex items-center justify-end gap-3 pt-2">
            <button
              type="button"
              onClick={() => setShowBuilder(false)}
              className="px-4 py-2 text-sm font-medium text-[var(--parlo-ink-muted)] hover:text-[var(--parlo-ink)] transition-colors cursor-pointer"
            >
              Cancel
            </button>
            <button
              type="submit"
              className="px-4 py-2 text-sm font-medium text-[var(--parlo-on-solid)] bg-[var(--parlo-primary)] hover:bg-[var(--parlo-primary-hover)] rounded-lg transition-colors whitespace-nowrap cursor-pointer"
            >
              Open in Studio
            </button>
          </div>
          </motion.form>
        )}
      </AnimatePresence>

      {/* Tactile Category Filter Rail + Active Language Focus Toggle */}
      <div className="mt-6 flex flex-wrap items-center justify-between gap-3 pb-2">
        <div className="inline-flex items-center gap-1 p-1 bg-[var(--parlo-surface-alt)] border border-[var(--parlo-border)] parlo-well-recessed rounded-xl overflow-x-auto max-w-full">
          {CATEGORIES.map((category) => {
            const active = selectedCategory === category;
            return (
              <button
                key={category}
                type="button"
                onClick={() => setSelectedCategory(category)}
                className={`relative px-3.5 py-1.5 text-xs font-medium rounded-lg transition-colors whitespace-nowrap shrink-0 cursor-pointer ${
                  active
                    ? "text-[var(--parlo-ink)]"
                    : "text-[var(--parlo-ink-muted)] hover:text-[var(--parlo-ink)]"
                }`}
              >
                {active && (
                  <motion.span
                    layoutId="parlo-scenario-cat"
                    transition={{
                      type: "spring",
                      stiffness: 460,
                      damping: 32,
                    }}
                    className="absolute inset-0 rounded-lg bg-[var(--parlo-surface)] parlo-keycap-thumb"
                  />
                )}
                <span className="relative z-10">{category}</span>
              </button>
            );
          })}
        </div>

        <button
          type="button"
          onClick={() => setOnlyActiveLanguage((prev) => !prev)}
          aria-pressed={onlyActiveLanguage}
          className={`inline-flex items-center gap-2 px-3.5 py-2 text-xs font-medium rounded-xl border transition-colors whitespace-nowrap shrink-0 cursor-pointer ${
            onlyActiveLanguage
              ? "bg-[var(--parlo-primary-soft)] border-[var(--parlo-primary)] text-[var(--parlo-primary)]"
              : "bg-[var(--parlo-surface)] border-[var(--parlo-border)] text-[var(--parlo-ink-secondary)] hover:border-[var(--parlo-ink-muted)]"
          }`}
        >
          <LanguageFlagBadge code={activeLanguageCode} size="xs" />
          <Filter className="w-3.5 h-3.5" aria-hidden="true" />
          <span>
            {onlyActiveLanguage
              ? `${activeLanguage.name} Only`
              : `Filter: ${activeLanguage.name}`}
          </span>
        </button>
      </div>

      {/* Scenarios Editorial Grid with 3D Perspective Tilt Cards */}
      {filtered.length === 0 ? (
        <div className="mt-8 bg-[var(--parlo-surface)] border border-[var(--parlo-border)] rounded-xl parlo-surface-elevated p-10 text-center">
          <p className="text-sm text-[var(--parlo-ink-muted)]">
            No scenarios in this category yet. Create a custom scenario above to practice any real-life dialogue.
          </p>
        </div>
      ) : (
        <div className="mt-6 grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {filtered.map((scenario, idx) => {
            const isActive = scenario.id === activeScenarioId;
            const matchesActiveLanguage =
              scenario.defaultLanguageCode === activeLanguageCode;
            const defaultLang =
              LANGUAGES.find((l) => l.code === scenario.defaultLanguageCode) ??
              LANGUAGES[0];
            const cardCulture = getCultureByLanguage(
              scenario.defaultLanguageCode
            );

            return (
              <motion.div
                key={scenario.id}
                initial={{ opacity: 0, y: 18 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{
                  duration: 0.34,
                  delay: Math.min(idx * 0.05, 0.28),
                  ease: [0.16, 1, 0.3, 1],
                }}
                className="h-full"
              >
                <TiltCard3D
                  maxTilt={6}
                  magneticPull={5}
                  hoverScale={1.014}
                  glare={false}
                  className={`group h-full flex flex-col bg-[var(--parlo-surface)] border rounded-2xl overflow-hidden transition-colors shadow-sm hover:shadow-xl ${
                    isActive
                      ? "border-[var(--parlo-primary)] ring-1 ring-[var(--parlo-primary)]/25"
                      : matchesActiveLanguage
                      ? "border-[var(--parlo-primary)]/55 hover:border-[var(--parlo-primary)]"
                      : "border-[var(--parlo-border)] hover:border-[var(--parlo-primary)]/60"
                  }`}
                >
                  <div className="aspect-[4/3] w-full overflow-hidden">
                    <div className="w-full h-full transition-transform duration-500 ease-out group-hover:scale-105">
                      <ScenarioImage
                        src={scenario.imageUrl}
                        alt={`${scenario.title} in ${scenario.city}`}
                        title={scenario.title}
                        fallbackGradient={scenario.fallbackGradient}
                        className="w-full h-full"
                        scrim
                      />
                    </div>
                  </div>

                  <div className="relative overflow-hidden p-5 flex-1 flex flex-col">
                    {/* Subtle CSS-masked cultural motif overlay matched to scenario language */}
                    <div
                      aria-hidden="true"
                      data-culture={scenario.defaultLanguageCode}
                      className="parlo-motif-overlay parlo-motif-card-subtle"
                    />

                    <div className="relative z-10 flex flex-wrap items-center gap-x-2 gap-y-0.5 text-xs font-mono text-[var(--parlo-ink-muted)]">
                      <span>{scenario.city}</span>
                      <span aria-hidden="true">·</span>
                      <span>{scenario.category}</span>
                      <span aria-hidden="true">·</span>
                      <span>{scenario.recommendedLevel}</span>
                      <span aria-hidden="true">·</span>
                      <span>{scenario.durationLabel}</span>
                    </div>

                    <h3 className="relative z-10 mt-2 font-display text-xl font-bold text-[var(--parlo-ink)] leading-snug">
                      {scenario.title}
                    </h3>

                    <p className="relative z-10 mt-2 text-sm text-[var(--parlo-ink-secondary)] leading-relaxed flex-1">
                      {scenario.summary}
                    </p>

                    <div className="relative z-10 mt-4 pt-4 border-t border-[var(--parlo-border)]/70 flex items-center justify-between gap-3">
                      <div className="flex items-center gap-2.5 min-w-0">
                        <LanguageFlagBadge
                          code={scenario.defaultLanguageCode}
                          size="md"
                        />
                        <div className="text-xs text-[var(--parlo-ink-muted)] truncate">
                          <span className="font-semibold text-[var(--parlo-ink)]">
                            {scenario.partnerName}
                          </span>
                          <span className="block text-[11px] truncate" title={cardCulture.patternName}>
                            <span
                              className={
                                matchesActiveLanguage
                                  ? "text-[var(--parlo-primary)] font-medium"
                                  : ""
                              }
                            >
                              {defaultLang.name}
                            </span>
                            {" · "}
                            {cardCulture.atelierName}
                          </span>
                        </div>
                      </div>

                      <button
                        type="button"
                        onClick={() => onSelectScenario(scenario)}
                        className={`inline-flex items-center gap-1.5 px-3.5 py-2 text-xs font-semibold rounded-lg transition-all whitespace-nowrap shrink-0 cursor-pointer ${
                          isActive
                            ? "bg-[var(--parlo-primary)] text-[var(--parlo-on-solid)] hover:bg-[var(--parlo-primary-hover)]"
                            : "bg-[var(--parlo-ink)] text-[var(--parlo-on-solid)] hover:bg-[var(--parlo-primary)]"
                        }`}
                      >
                        {isActive ? "Active" : "Practice"}
                        <ArrowRight
                          className="w-3.5 h-3.5 transition-transform duration-200 group-hover:translate-x-0.5"
                          aria-hidden="true"
                        />
                      </button>
                    </div>
                  </div>
                </TiltCard3D>
              </motion.div>
            );
          })}
        </div>
      )}
    </div>
  );
}
