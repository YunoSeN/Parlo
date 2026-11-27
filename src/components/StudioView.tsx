import { useEffect, useRef, useState } from "react";
import { AnimatePresence, motion } from "motion/react";
import {
  AlertCircle,
  BookmarkCheck,
  BookmarkPlus,
  BookOpen,
  Check,
  CheckCircle2,
  ChevronDown,
  CloudRain,
  Compass,
  Disc3,
  Flame,
  Headphones,
  Languages,
  Lightbulb,
  Loader2,
  Mic,
  MicOff,
  PhoneOff,
  RotateCcw,
  SlidersHorizontal,
  Sparkles,
  Volume2,
} from "lucide-react";
import { CEFR_DESCRIPTIONS } from "../data/catalog";
import { LiveConnectionState } from "../hooks/useLivePartner";
import { SoundscapeLayerId } from "../lib/ambientAudio";
import { speakWithBrowserTts } from "../lib/audio";
import { CountryFontSpec } from "../lib/cultures";
import { DailyCulturalMission } from "../lib/dailyMission";
import { RegionalDialectOption } from "../lib/dialects";
import { getRoleplayArtifact } from "../lib/roleplayArtifacts";
import { sfxEngine } from "../lib/sfx";
import { countSpokenUnits } from "../lib/textMetrics";
import {
  CefrLevel,
  CoachFeedback,
  CorrectionStyle,
  LanguageOption,
  MicMode,
  PracticeSessionRecord,
  ReplySuggestion,
  Scenario,
  SpeakingPace,
  TranscriptTurn,
  VoiceName,
} from "../types";
import { AcousticStage } from "./AcousticStage";
import { CulturalEtiquetteCard } from "./CulturalEtiquetteCard";
import { DailyMissionStrip } from "./DailyMissionStrip";
import { GlowCtaButton } from "./GlowCtaButton";
import { RadiantPromptInput } from "./RadiantPromptInput";
import { RoleplayArtifactSheet } from "./RoleplayArtifactSheet";
import { ScenarioImage } from "./ScenarioImage";
import { StudioLandingHero } from "./StudioLandingHero";
import { StudioPostSessionSummary } from "./StudioPostSessionSummary";
import { StudioTunerBar } from "./StudioTunerBar";
import { TiltCard3D } from "./TiltCard3D";
import { WarmupCardDeck } from "./WarmupCardDeck";
import {
  ClickableTranscriptText,
  SelectedWordAnchor,
  WordDictionaryPopover,
} from "./WordDictionaryPopover";

type DeckTab = "coach" | "hints" | "goals";

interface StudioViewProps {
  language: LanguageOption;
  onSelectLanguage: (code: string) => void;
  level: CefrLevel;
  onSelectLevel: (level: CefrLevel) => void;
  voiceName: VoiceName;
  onSelectVoice: (voice: VoiceName) => void;
  scenario: Scenario;
  allScenarios?: Scenario[];
  categoryFont?: CountryFontSpec;
  onSelectScenario?: (scenario: Scenario) => void;
  onOpenScenarios: () => void;
  onOpenSpatial: () => void;
  correctionStyle: CorrectionStyle;
  onChangeCorrectionStyle: (style: CorrectionStyle) => void;
  speakingPace: SpeakingPace;
  onChangeSpeakingPace: (pace: SpeakingPace) => void;
  autoCoach: boolean;
  onToggleAutoCoach: () => void;

  // Live session props
  connectionState: LiveConnectionState;
  isMuted: boolean;
  micMode?: MicMode;
  onChangeMicMode?: (mode: MicMode) => void;
  isPttActive?: boolean;
  onPttActiveChange?: (active: boolean) => void;
  isPartnerSpeaking: boolean;
  micAvailable: boolean;
  errorMessage: string | null;
  elapsedSeconds: number;
  turns: TranscriptTurn[];
  userLevelRef: React.MutableRefObject<number>;
  partnerLevelRef: React.MutableRefObject<number>;
  onStartSession: () => void;
  onEndSession: () => void;
  onToggleMute: () => void;
  onSendTextTurn: (text: string) => void;
  onClearError: () => void;

  // Coaching & persistence props
  coachNotes: CoachFeedback[];
  hints: ReplySuggestion[];
  loadingHints: boolean;
  hintsError: string | null;
  onRequestHints: () => void;
  onTranslateTurn: (turn: TranscriptTurn) => void;
  onAnalyzeTurn: (turn: TranscriptTurn) => void;
  completedGoals: number[];
  onToggleGoal: (index: number) => void;
  savedPhraseStrings: Set<string>;
  onSavePhrase: (params: {
    phrase: string;
    translation: string;
    reading?: string;
    languageCode: string;
    scenarioTitle: string;
    note?: string;
  }) => void;
  lastArchivedSessionId?: string | null;
  lastArchivedSession?: PracticeSessionRecord | null;
  wasLastSessionRecovered?: boolean;
  onDismissSummary?: () => void;
  onOpenReview: () => void;

  // Regional dialect & Daily Cultural Mission props
  dialects?: RegionalDialectOption[];
  activeDialectId?: string;
  onSelectDialect?: (dialectId: string) => void;
  dailyMission?: DailyCulturalMission;
  dailyMissionCompleted?: boolean;
  onStartDailyMission?: () => void;

  // Global soundscape mixer props
  activeSoundLayers: SoundscapeLayerId[];
  onToggleSoundLayer: (id: SoundscapeLayerId) => void;
  onOpenSoundscapePanel: () => void;
}

function formatTimer(seconds: number): string {
  const m = Math.floor(seconds / 60);
  const s = seconds % 60;
  return `${m.toString().padStart(2, "0")}:${s.toString().padStart(2, "0")}`;
}

export function StudioView({
  language,
  onSelectLanguage,
  level,
  onSelectLevel,
  voiceName,
  onSelectVoice,
  scenario,
  categoryFont,
  onOpenScenarios,
  onOpenSpatial,
  correctionStyle,
  onChangeCorrectionStyle,
  speakingPace,
  onChangeSpeakingPace,
  autoCoach,
  onToggleAutoCoach,
  connectionState,
  isMuted,
  micMode = "hands-free",
  onChangeMicMode,
  isPttActive = false,
  onPttActiveChange,
  isPartnerSpeaking,
  micAvailable,
  errorMessage,
  elapsedSeconds,
  turns,
  userLevelRef,
  partnerLevelRef,
  onStartSession,
  onEndSession,
  onToggleMute,
  onSendTextTurn,
  onClearError,
  coachNotes,
  hints,
  loadingHints,
  hintsError,
  onRequestHints,
  onTranslateTurn,
  onAnalyzeTurn,
  completedGoals,
  onToggleGoal,
  savedPhraseStrings,
  onSavePhrase,
  lastArchivedSession = null,
  wasLastSessionRecovered = false,
  onDismissSummary,
  onOpenReview,
  dialects = [],
  activeDialectId,
  onSelectDialect,
  dailyMission,
  dailyMissionCompleted = false,
  onStartDailyMission,
  activeSoundLayers,
  onToggleSoundLayer,
  onOpenSoundscapePanel,
}: StudioViewProps) {
  const [deckTab, setDeckTab] = useState<DeckTab>("coach");
  const [typedInput, setTypedInput] = useState("");
  const [showArtifact, setShowArtifact] = useState(false);
  const [settingsOpen, setSettingsOpen] = useState(false);
  const [selectedWordAnchor, setSelectedWordAnchor] =
    useState<SelectedWordAnchor | null>(null);
  const transcriptEndRef = useRef<HTMLDivElement | null>(null);

  const activeDialect = dialects.find((d) => d.id === activeDialectId);
  const roleplayArtifact = getRoleplayArtifact(
    scenario.id,
    language.code,
    scenario.title
  );

  const isLive = connectionState === "live";
  const isConnecting = connectionState === "connecting";

  useEffect(() => {
    transcriptEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [turns.length, turns[turns.length - 1]?.text]);

  // Live broadcast desk keyboard shortcuts: M = mute/unmute, H = reply hints, Space = Hold-to-Talk
  useEffect(() => {
    if (!isLive) return;
    const isTextField = (target: EventTarget | null) =>
      target instanceof HTMLInputElement ||
      target instanceof HTMLTextAreaElement ||
      target instanceof HTMLSelectElement;

    const onKeyDown = (e: KeyboardEvent) => {
      if (e.metaKey || e.ctrlKey || e.altKey || isTextField(e.target)) {
        return;
      }
      if (
        e.code === "Space" &&
        micMode === "push-to-talk" &&
        micAvailable &&
        !isMuted
      ) {
        e.preventDefault();
        if (!e.repeat) {
          onPttActiveChange?.(true);
        }
        return;
      }
      const key = e.key.toLowerCase();
      if (key === "m" && micAvailable) {
        e.preventDefault();
        onToggleMute();
      } else if (key === "h" && !loadingHints) {
        e.preventDefault();
        setDeckTab("hints");
        onRequestHints();
      }
    };

    const onKeyUp = (e: KeyboardEvent) => {
      if (e.code === "Space" && micMode === "push-to-talk") {
        onPttActiveChange?.(false);
      }
    };

    const onBlur = () => {
      if (micMode === "push-to-talk") {
        onPttActiveChange?.(false);
      }
    };

    window.addEventListener("keydown", onKeyDown);
    window.addEventListener("keyup", onKeyUp);
    window.addEventListener("blur", onBlur);
    return () => {
      window.removeEventListener("keydown", onKeyDown);
      window.removeEventListener("keyup", onKeyUp);
      window.removeEventListener("blur", onBlur);
    };
  }, [
    isLive,
    isMuted,
    loadingHints,
    micAvailable,
    micMode,
    onPttActiveChange,
    onRequestHints,
    onToggleMute,
  ]);

  const userWordsSpoken = turns
    .filter((t) => t.role === "user")
    .reduce((sum, t) => sum + countSpokenUnits(t.text, language.code), 0);
  const goalProgressPct =
    scenario.goals.length > 0
      ? Math.round((completedGoals.length / scenario.goals.length) * 100)
      : 0;

  const handleSendText = () => {
    if (!typedInput.trim() || !isLive) return;
    onSendTextTurn(typedInput.trim());
    setTypedInput("");
  };

  const handleSuggestReplyClick = () => {
    setDeckTab("hints");
    onRequestHints();
  };

  // Determine explicit state label + accessible icon (never hue-only)
  let statusText = "Ready to speak";
  let statusColorClass = "text-[var(--parlo-ink-secondary)]";
  if (isConnecting) {
    statusText = "Connecting to voice partner...";
    statusColorClass = "text-[var(--parlo-primary)]";
  } else if (connectionState === "error") {
    statusText = "Connection interrupted";
    statusColorClass = "text-red-600";
  } else if (isLive && isPartnerSpeaking) {
    statusText = `${scenario.partnerName} is speaking`;
    statusColorClass = "text-[var(--parlo-primary)]";
  } else if (isLive && isMuted) {
    statusText = micAvailable ? "Microphone muted" : "Text reply mode (mic unavailable)";
    statusColorClass = "text-amber-700";
  } else if (isLive && micMode === "push-to-talk") {
    statusText = isPttActive
      ? "Hold-to-Talk active — speak now"
      : "Hold button or Space to speak";
    statusColorClass = isPttActive
      ? "text-emerald-600 dark:text-emerald-400"
      : "text-[var(--parlo-ink-secondary)]";
  } else if (isLive) {
    statusText = "Listening — speak naturally";
    statusColorClass = "text-emerald-700";
  }

  const starterPhrases =
    scenario.starterPhrases[language.code] ??
    scenario.starterPhrases[scenario.defaultLanguageCode] ??
    [];

  return (
    <div className="max-w-[1360px] mx-auto px-4 sm:px-6 py-6">
      {/* Studio Landing Section with 3D Rolodex, GlowCtaButton & GlowingEdgeCard Dialect Grid */}
      <StudioLandingHero
        language={language}
        level={level}
        scenario={scenario}
        isLive={isLive}
        isConnecting={isConnecting}
        categoryFont={categoryFont}
        onSelectLanguage={onSelectLanguage}
        onStartSession={onStartSession}
        onEndSession={onEndSession}
        onOpenScenarios={onOpenScenarios}
        onOpenSpatial={onOpenSpatial}
      />

      {/* Collapsible Practice Settings Summary Bar (Progressive Disclosure) */}
      <div className="rounded-xl border border-[var(--parlo-border)] bg-[var(--parlo-surface)]/85 px-3.5 py-2.5 flex flex-wrap items-center justify-between gap-3">
        <div className="flex flex-wrap items-center gap-x-2.5 gap-y-1 text-xs text-[var(--parlo-ink-secondary)]">
          <span className="font-mono text-[11px] uppercase tracking-wider text-[var(--parlo-ink-muted)]">
            Session setup
          </span>
          <span aria-hidden="true" className="text-[var(--parlo-border)]">
            ·
          </span>
          <span className="font-mono font-semibold text-[var(--parlo-primary)]">
            CEFR {level}
          </span>
          {activeDialect && (
            <>
              <span aria-hidden="true" className="text-[var(--parlo-border)]">
                ·
              </span>
              <span>{activeDialect.label}</span>
            </>
          )}
          <span aria-hidden="true" className="text-[var(--parlo-border)]">
            ·
          </span>
          <span>Voice: {voiceName}</span>
          <span aria-hidden="true" className="text-[var(--parlo-border)]">
            ·
          </span>
          <span className="capitalize">Pace: {speakingPace}</span>
        </div>

        <button
          type="button"
          onClick={() => {
            sfxEngine.playToggle(!settingsOpen);
            setSettingsOpen((prev) => !prev);
          }}
          aria-expanded={settingsOpen}
          className="min-h-[36px] inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium rounded-lg border border-[var(--parlo-border)] bg-[var(--parlo-canvas)]/75 hover:border-[var(--parlo-primary)] text-[var(--parlo-ink)] transition-colors cursor-pointer whitespace-nowrap"
        >
          <SlidersHorizontal className="w-3.5 h-3.5 text-[var(--parlo-primary)]" aria-hidden="true" />
          <span>{settingsOpen ? "Hide Settings" : "Practice Settings"}</span>
          <ChevronDown
            className={`w-3.5 h-3.5 text-[var(--parlo-ink-muted)] transition-transform duration-200 ${
              settingsOpen ? "rotate-180" : ""
            }`}
            aria-hidden="true"
          />
        </button>
      </div>

      <AnimatePresence initial={false}>
        {settingsOpen && (
          <motion.div
            key="studio-tuner-panel"
            initial={{ opacity: 0, y: -6 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -6 }}
            transition={{ duration: 0.18, ease: [0.16, 1, 0.3, 1] }}
            className="mt-3"
          >
            <StudioTunerBar
              level={level}
              onSelectLevel={onSelectLevel}
              voiceName={voiceName}
              onSelectVoice={onSelectVoice}
              speakingPace={speakingPace}
              onChangeSpeakingPace={onChangeSpeakingPace}
              dialects={dialects}
              activeDialectId={activeDialectId}
              onSelectDialect={onSelectDialect}
              disabled={isLive || isConnecting}
            />
          </motion.div>
        )}
      </AnimatePresence>

      {/* Post-Session Summary Card (shown immediately after finishing or recovering an interrupted session) */}
      <AnimatePresence initial={false}>
        {lastArchivedSession && !isLive && !isConnecting && (
          <motion.div
            key={`post-summary-${lastArchivedSession.id}`}
            initial={{ opacity: 0, y: -8 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -8 }}
            transition={{ duration: 0.22, ease: [0.16, 1, 0.3, 1] }}
          >
            <StudioPostSessionSummary
              session={lastArchivedSession}
              coachNotes={coachNotes}
              language={language}
              wasRecovered={wasLastSessionRecovered}
              savedPhraseStrings={savedPhraseStrings}
              onSavePhrase={onSavePhrase}
              onOpenReview={onOpenReview}
              onPracticeAgain={onStartSession}
              onDismiss={() => onDismissSummary?.()}
            />
          </motion.div>
        )}
      </AnimatePresence>

      {/* Daily 3-Minute Cultural Mission Strip */}
      {!isLive && !isConnecting && dailyMission && onStartDailyMission && (
        <div className="mt-4">
          <DailyMissionStrip
            mission={dailyMission}
            language={language}
            completed={dailyMissionCompleted}
            compact
            onStartMission={onStartDailyMission}
          />
        </div>
      )}

      {/* Main Two-Zone Sandbox Split */}
      <div className="mt-5 grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
        {/* LEFT ZONE (66%): Voice Stage + Live Synchronized Transcript */}
        <section
          aria-label="Live conversation stage"
          className="lg:col-span-8 bg-[var(--parlo-surface)] border border-[var(--parlo-border)] rounded-2xl parlo-machined-frame overflow-hidden flex flex-col"
        >
          {/* Active Scenario Editorial Card with Magnetic 3D Parallax */}
          <div className="p-4 sm:p-5 border-b border-[var(--parlo-border)]/75">
            <TiltCard3D
              maxTilt={5.5}
              magneticPull={5}
              hoverScale={1.01}
              className="relative overflow-hidden rounded-xl border border-[var(--parlo-border)]/80 bg-[var(--parlo-surface-alt)] p-4 sm:p-5 flex flex-col sm:flex-row sm:items-center gap-5"
            >
              <div
                aria-hidden="true"
                data-culture={language.code}
                className="parlo-motif-overlay parlo-motif-header"
              />
              <div
                className="relative z-10 w-full sm:w-32 h-24 rounded-lg overflow-hidden shrink-0 border border-[var(--parlo-border)]"
                style={{ transform: "translateZ(16px)" }}
              >
                <ScenarioImage
                  src={scenario.imageUrl}
                  alt={scenario.title}
                  title={scenario.title}
                  fallbackGradient={scenario.fallbackGradient}
                  className="w-full h-full"
                />
              </div>

              <div
                className="relative z-10 flex-1 min-w-0"
                style={{ transform: "translateZ(10px)" }}
              >
                <div className="flex flex-wrap items-center gap-x-2 gap-y-1 text-xs text-[var(--parlo-ink-muted)]">
                  <span>{scenario.partnerName}</span>
                  <span aria-hidden="true">·</span>
                  <span>{scenario.partnerRole}</span>
                  <span aria-hidden="true">·</span>
                  <span>
                    {language.name}
                    {activeDialect ? ` · ${activeDialect.label}` : ""} ({level})
                  </span>
                  <span aria-hidden="true">·</span>
                  <span className="font-mono tabular-nums text-[var(--parlo-ink)]">
                    {formatTimer(elapsedSeconds)}
                  </span>
                </div>
                <div className="mt-1 flex flex-wrap items-center justify-between gap-2">
                  <h2 className="font-display text-2xl sm:text-[26px] font-bold text-[var(--parlo-ink)] leading-tight [text-wrap:balance]">
                    {scenario.title}
                  </h2>
                  {!isLive && !isConnecting && (
                    <button
                      type="button"
                      onClick={onOpenScenarios}
                      className="inline-flex items-center gap-1 text-xs font-medium text-[var(--parlo-primary)] hover:underline underline-offset-4 cursor-pointer whitespace-nowrap"
                    >
                      <Compass className="w-3.5 h-3.5" aria-hidden="true" />
                      Switch scene
                    </button>
                  )}
                </div>
                <p className="mt-1.5 text-sm text-[var(--parlo-ink-secondary)] leading-relaxed">
                  {scenario.summary}
                </p>

                {/* Live Session Progress Meter (real spoken turns, words, and scenario goals) */}
                {(isLive || turns.length > 0) && (
                  <div className="mt-3 pt-3 border-t border-[var(--parlo-border)]/60 flex flex-wrap items-center gap-x-4 gap-y-2 text-[11px] font-mono text-[var(--parlo-ink-muted)] tabular-nums">
                    <span>{turns.filter((t) => t.role === "user").length} spoken turns</span>
                    <span aria-hidden="true">·</span>
                    <span>{userWordsSpoken} words</span>
                    <span aria-hidden="true">·</span>
                    <div className="flex items-center gap-2">
                      <span>
                        Goals {completedGoals.length}/{scenario.goals.length}
                      </span>
                      <div className="w-20 h-1.5 bg-[var(--parlo-canvas)] rounded-full overflow-hidden">
                        <div
                          className="h-full bg-[var(--parlo-primary)] rounded-full transition-all duration-300"
                          style={{ width: `${goalProgressPct}%` }}
                        />
                      </div>
                    </div>
                  </div>
                )}
              </div>
            </TiltCard3D>
          </div>

          {/* Focal Anchor: Recessed Glass/Neumorphic Acoustic Stage & Primary Voice Controls */}
          <div className="relative overflow-hidden px-5 sm:px-6 py-5 parlo-stage-chamber parlo-grid-60 border-b border-[var(--parlo-border)]">
            <div className="relative z-10 flex items-center justify-between gap-4 mb-2">
              <div
                className={`inline-flex items-center gap-2 text-xs font-mono font-medium ${statusColorClass}`}
                role="status"
                aria-live="polite"
              >
                {isConnecting ? (
                  <Loader2 className="w-3.5 h-3.5 animate-spin text-[var(--parlo-primary)]" aria-hidden="true" />
                ) : isLive && isPartnerSpeaking ? (
                  <Volume2 className="w-3.5 h-3.5 text-[var(--parlo-primary)]" aria-hidden="true" />
                ) : isLive && isMuted ? (
                  <MicOff className="w-3.5 h-3.5 text-amber-600" aria-hidden="true" />
                ) : connectionState === "error" ? (
                  <AlertCircle className="w-3.5 h-3.5 text-red-600" aria-hidden="true" />
                ) : (
                  <Mic className="w-3.5 h-3.5 text-[var(--parlo-primary)]" aria-hidden="true" />
                )}
                <span>{statusText}</span>
              </div>

              <span className="text-xs font-mono text-[var(--parlo-ink-muted)] hidden sm:inline">
                {CEFR_DESCRIPTIONS[level]}
              </span>
            </div>

            <div className="relative z-10">
              <AcousticStage
                languageCode={language.code}
                connectionState={connectionState}
                isPartnerSpeaking={isPartnerSpeaking}
                isMuted={isMuted}
                userLevelRef={userLevelRef}
                partnerLevelRef={partnerLevelRef}
              />
            </div>

            <AnimatePresence initial={false}>
              {errorMessage && (
                <motion.div
                  key="studio-error-banner"
                  initial={{ opacity: 0, y: -6, scale: 0.985 }}
                  animate={{ opacity: 1, y: 0, scale: 1 }}
                  exit={{ opacity: 0, y: -6, scale: 0.985 }}
                  transition={{ duration: 0.18, ease: [0.16, 1, 0.3, 1] }}
                  role="alert"
                  className="mt-3 p-3.5 bg-red-500/10 border border-red-500/35 rounded-xl flex flex-wrap items-center justify-between gap-3"
                >
                  <div className="flex items-start gap-2 text-sm text-red-500 dark:text-red-400">
                    <AlertCircle
                      className="w-4 h-4 shrink-0 mt-0.5 text-red-500 dark:text-red-400"
                      aria-hidden="true"
                    />
                    <span>{errorMessage}</span>
                  </div>
                  <div className="flex items-center gap-2 shrink-0">
                    {connectionState === "error" && (
                      <button
                        type="button"
                        onClick={onStartSession}
                        className="min-h-[34px] inline-flex items-center gap-1.5 px-3 py-1 text-xs font-semibold text-[var(--parlo-on-solid)] bg-[var(--parlo-primary)] hover:bg-[var(--parlo-primary-hover)] rounded-lg transition-colors cursor-pointer"
                      >
                        <RotateCcw className="w-3.5 h-3.5" aria-hidden="true" />
                        Reconnect
                      </button>
                    )}
                    <button
                      type="button"
                      onClick={onClearError}
                      className="min-h-[34px] px-2 text-xs font-medium text-red-500 dark:text-red-300 hover:underline cursor-pointer"
                    >
                      Dismiss
                    </button>
                  </div>
                </motion.div>
              )}
            </AnimatePresence>

            {/* Tactile Voice Control Bar */}
            <div className="relative z-10 mt-4 flex flex-wrap items-center justify-between gap-3">
              <div className="flex flex-wrap items-center gap-2.5">
                {!isLive && !isConnecting ? (
                  <GlowCtaButton
                    onClick={onStartSession}
                    leadingIcon={<Mic className="w-4 h-4" aria-hidden="true" />}
                    className="py-2.5"
                  >
                    Start Voice Session
                  </GlowCtaButton>
                ) : (
                  <button
                    type="button"
                    onClick={onEndSession}
                    className="inline-flex items-center gap-2 px-5 py-2.5 text-sm font-medium text-[var(--parlo-on-solid)] bg-[var(--parlo-ink)] hover:bg-[var(--parlo-primary)] rounded-lg transition-colors whitespace-nowrap shrink-0 cursor-pointer focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[var(--parlo-primary)]"
                  >
                    <PhoneOff className="w-4 h-4" aria-hidden="true" />
                    End Session
                  </button>
                )}

                {isLive && micMode === "push-to-talk" && micAvailable && !isMuted && (
                  <button
                    type="button"
                    onPointerDown={(e) => {
                      e.preventDefault();
                      onPttActiveChange?.(true);
                    }}
                    onPointerUp={() => onPttActiveChange?.(false)}
                    onPointerLeave={() => onPttActiveChange?.(false)}
                    onPointerCancel={() => onPttActiveChange?.(false)}
                    aria-pressed={isPttActive}
                    className={`select-none touch-none inline-flex items-center gap-2 px-4 py-2.5 text-sm font-semibold rounded-lg border transition-all whitespace-nowrap shrink-0 cursor-pointer ${
                      isPttActive
                        ? "bg-[var(--parlo-primary)] border-[var(--parlo-primary)] text-[var(--parlo-on-solid)] scale-[0.98] shadow-md"
                        : "bg-[var(--parlo-surface)] border-[var(--parlo-primary)]/60 text-[var(--parlo-primary)] hover:bg-[var(--parlo-primary-soft)]"
                    }`}
                  >
                    <Mic className="w-4 h-4" aria-hidden="true" />
                    {isPttActive ? "Listening…" : "Hold to Speak"}
                  </button>
                )}

                {isLive && (
                  <button
                    type="button"
                    onClick={onToggleMute}
                    disabled={!micAvailable}
                    className={`inline-flex items-center gap-2 px-4 py-2.5 text-sm font-medium rounded-lg border transition-colors whitespace-nowrap shrink-0 cursor-pointer disabled:opacity-50 ${
                      isMuted
                        ? "bg-[color-mix(in_srgb,var(--parlo-accent)_16%,var(--parlo-surface))] border-[var(--parlo-accent-border)] text-[var(--parlo-accent)]"
                        : "bg-[var(--parlo-surface)] border-[var(--parlo-border)] text-[var(--parlo-ink)] hover:border-[var(--parlo-primary)]/50"
                    }`}
                  >
                    {isMuted ? (
                      <>
                        <MicOff className="w-4 h-4" aria-hidden="true" />
                        Unmute Mic
                      </>
                    ) : (
                      <>
                        <Mic className="w-4 h-4" aria-hidden="true" />
                        Mute Mic
                      </>
                    )}
                  </button>
                )}

                {onChangeMicMode && (
                  <div
                    role="group"
                    aria-label="Microphone mode"
                    className="inline-flex items-center p-0.5 rounded-lg bg-[var(--parlo-surface)] border border-[var(--parlo-border)] text-[11px]"
                  >
                    {(
                      [
                        { id: "hands-free", label: "Hands-Free" },
                        { id: "push-to-talk", label: "Hold-to-Talk" },
                      ] as const
                    ).map((opt) => (
                      <button
                        key={opt.id}
                        type="button"
                        onClick={() => {
                          sfxEngine.playToggle(opt.id === "push-to-talk");
                          onChangeMicMode(opt.id);
                        }}
                        title={
                          opt.id === "push-to-talk"
                            ? "Best for noisy cafés or commutes — hold Space or button to speak"
                            : "Open mic — speak freely anytime"
                        }
                        className={`px-2.5 py-1.5 rounded-md font-medium transition-colors whitespace-nowrap cursor-pointer ${
                          micMode === opt.id
                            ? "bg-[var(--parlo-primary-soft)] text-[var(--parlo-primary)]"
                            : "text-[var(--parlo-ink-muted)] hover:text-[var(--parlo-ink)]"
                        }`}
                      >
                        {opt.label}
                      </button>
                    ))}
                  </div>
                )}
              </div>

              <div className="flex flex-wrap items-center gap-2">
                {/* Inline Quick Soundscape Toggles + Full Mixer Trigger */}
                <div
                  role="group"
                  aria-label="Quick soundscape toggles"
                  className="inline-flex items-center gap-1 p-1 rounded-xl bg-[var(--parlo-surface)] border border-[var(--parlo-border)]"
                >
                  {(
                    [
                      { id: "cafe-rain", label: "Rain", Icon: CloudRain },
                      { id: "evening-lounge", label: "Room", Icon: Disc3 },
                      { id: "library-hearth", label: "Hearth", Icon: Flame },
                    ] as const
                  ).map(({ id, label, Icon }) => {
                    const active = activeSoundLayers.includes(id);
                    return (
                      <button
                        key={id}
                        type="button"
                        role="switch"
                        aria-checked={active}
                        onClick={() => onToggleSoundLayer(id)}
                        title={`Toggle ${label} soundscape`}
                        className={`inline-flex items-center gap-1.5 px-2.5 py-1.5 text-[11px] font-medium rounded-lg transition-colors cursor-pointer whitespace-nowrap ${
                          active
                            ? "bg-[var(--parlo-primary-soft)] text-[var(--parlo-primary)]"
                            : "text-[var(--parlo-ink-muted)] hover:text-[var(--parlo-ink)] hover:bg-[var(--parlo-surface-alt)]"
                        }`}
                      >
                        <Icon className="w-3.5 h-3.5 shrink-0" aria-hidden="true" />
                        <span className="hidden sm:inline">{label}</span>
                      </button>
                    );
                  })}

                  <span
                    className="w-px h-4 bg-[var(--parlo-border)]/80 mx-0.5"
                    aria-hidden="true"
                  />

                  <button
                    type="button"
                    onClick={onOpenSoundscapePanel}
                    title="Open Soundscapes & UI SFX Mixer (Cmd/Ctrl + M)"
                    className={`inline-flex items-center gap-1.5 px-2.5 py-1.5 text-[11px] font-medium rounded-lg transition-colors cursor-pointer whitespace-nowrap ${
                      activeSoundLayers.length > 0
                        ? "text-[var(--parlo-primary)] hover:bg-[var(--parlo-primary-soft)]"
                        : "text-[var(--parlo-ink-secondary)] hover:text-[var(--parlo-ink)] hover:bg-[var(--parlo-surface-alt)]"
                    }`}
                  >
                    {activeSoundLayers.length > 0 ? (
                      <Headphones className="w-3.5 h-3.5 shrink-0" aria-hidden="true" />
                    ) : (
                      <SlidersHorizontal className="w-3.5 h-3.5 shrink-0" aria-hidden="true" />
                    )}
                    <span>
                      {activeSoundLayers.length > 0
                        ? `${activeSoundLayers.length} On`
                        : "Mixer"}
                    </span>
                  </button>
                </div>

                <button
                  type="button"
                  onClick={() => {
                    sfxEngine.playToggle(!showArtifact);
                    setShowArtifact((prev) => !prev);
                  }}
                  aria-expanded={showArtifact}
                  className={`inline-flex items-center gap-2 px-3.5 py-2.5 text-xs font-medium rounded-xl border parlo-keycap-thumb transition-colors whitespace-nowrap shrink-0 cursor-pointer ${
                    showArtifact
                      ? "bg-[var(--parlo-primary-soft)] border-[var(--parlo-primary)] text-[var(--parlo-primary)]"
                      : "text-[var(--parlo-ink)] bg-[var(--parlo-surface)] border-[var(--parlo-border)] hover:border-[var(--parlo-primary)]"
                  }`}
                >
                  <BookOpen className="w-3.5 h-3.5" aria-hidden="true" />
                  Scene Prop
                </button>

                <button
                  type="button"
                  onClick={() => {
                    sfxEngine.playNav();
                    handleSuggestReplyClick();
                  }}
                  disabled={loadingHints}
                  className="inline-flex items-center gap-2 px-3.5 py-2.5 text-xs font-medium text-[var(--parlo-ink)] bg-[var(--parlo-surface)] border border-[var(--parlo-border)] hover:border-[var(--parlo-primary)] rounded-xl parlo-keycap-thumb transition-colors whitespace-nowrap shrink-0 cursor-pointer disabled:opacity-60"
                >
                  {loadingHints ? (
                    <Loader2 className="w-3.5 h-3.5 animate-spin" aria-hidden="true" />
                  ) : (
                    <Lightbulb className="w-3.5 h-3.5 text-[var(--parlo-accent)]" aria-hidden="true" />
                  )}
                  Suggest Reply
                </button>
              </div>
            </div>
          </div>

          {/* Collapsible Scenario-Matched Cultural Prop Artifact (Menu / Board / Shelf / Brief / Lease) */}
          <AnimatePresence initial={false}>
            {showArtifact && (
              <motion.div
                key={`artifact-${scenario.id}-${language.code}`}
                initial={{ opacity: 0, y: -8 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -8 }}
                transition={{ duration: 0.2, ease: [0.16, 1, 0.3, 1] }}
                className="px-4 sm:px-5 pt-4 border-b border-[var(--parlo-border)] pb-4 bg-[var(--parlo-canvas)]/45"
              >
                <RoleplayArtifactSheet
                  artifact={roleplayArtifact}
                  language={language}
                  scenarioTitle={scenario.title}
                  isLive={isLive}
                  savedPhraseStrings={savedPhraseStrings}
                  onClose={() => setShowArtifact(false)}
                  onUsePrompt={(promptText) => {
                    if (isLive) {
                      onSendTextTurn(promptText);
                    } else {
                      setTypedInput(promptText);
                      onStartSession();
                    }
                  }}
                  onSavePhrase={onSavePhrase}
                />
              </motion.div>
            )}
          </AnimatePresence>

          {/* Live Synchronized Editorial Transcript */}
          <div className="p-5 sm:p-6 min-h-[340px] max-h-[480px] overflow-y-auto flex-1">
            {turns.length === 0 ? (
              <div className="h-full flex flex-col justify-center py-2 space-y-6">
                {/* Interactive 3D Swipeable Daily Warm-Up Deck */}
                <WarmupCardDeck
                  language={language}
                  savedPhraseStrings={savedPhraseStrings}
                  onSavePhrase={onSavePhrase}
                />

                <div>
                  <p className="text-sm font-medium text-[var(--parlo-ink)]">
                    Live transcript appears here as you speak
                  </p>
                  <p className="mt-1 text-sm text-[var(--parlo-ink-muted)] max-w-lg leading-relaxed">
                    Click Start Voice Session to connect with {scenario.partnerName}. Interrupt naturally anytime, request translations, or review phrasing suggestions on the right.
                  </p>
                </div>

                {starterPhrases.length > 0 && (
                  <div className="pt-4 border-t border-[var(--parlo-border)]/70">
                    <p className="text-xs font-medium text-[var(--parlo-ink-muted)]">
                      Opening phrases for {scenario.title}
                    </p>
                    <div className="mt-3 space-y-2.5">
                      {starterPhrases.slice(0, 2).map((phrase, idx) => (
                        <div
                          key={idx}
                          className="flex items-start justify-between gap-4"
                        >
                          <div>
                            <p className="text-sm font-medium text-[var(--parlo-ink)]">
                              {phrase.text}
                            </p>
                            {phrase.reading && (
                              <p className="font-mono text-xs text-[var(--parlo-ink-muted)]">
                                {phrase.reading}
                              </p>
                            )}
                            <p className="text-xs text-[var(--parlo-ink-secondary)]">
                              {phrase.meaning}
                            </p>
                          </div>
                          <button
                            type="button"
                            onClick={() =>
                              speakWithBrowserTts(phrase.text, language.speechLocale)
                            }
                            aria-label={`Listen to ${phrase.text}`}
                            className="inline-flex items-center justify-center w-9 h-9 text-[var(--parlo-ink-muted)] hover:text-[var(--parlo-ink)] hover:bg-[var(--parlo-surface-alt)] rounded-lg transition-colors shrink-0 cursor-pointer"
                          >
                            <Volume2 className="w-4 h-4" aria-hidden="true" />
                          </button>
                        </div>
                      ))}
                    </div>
                  </div>
                )}
              </div>
            ) : (
              <div className="divide-y divide-[var(--parlo-border)]/70">
                {turns.map((turn) => {
                  const isUser = turn.role === "user";
                  const isSaved = savedPhraseStrings.has(turn.text.trim().toLowerCase());

                  return (
                    <motion.div
                      key={turn.id}
                      initial={{ opacity: 0, y: 8 }}
                      animate={{ opacity: 1, y: 0 }}
                      transition={{ duration: 0.22, ease: [0.16, 1, 0.3, 1] }}
                      className="py-4 first:pt-0 last:pb-0"
                    >
                      <div className="flex flex-wrap items-center justify-between gap-2 sm:gap-3">
                        <div className="flex flex-wrap items-center gap-2 text-xs text-[var(--parlo-ink-muted)]">
                          <span
                            className={`font-semibold ${
                              isUser
                                ? "text-[var(--parlo-ink)]"
                                : "text-[var(--parlo-primary)]"
                            }`}
                          >
                            {isUser ? "You" : scenario.partnerName}
                          </span>
                          <span aria-hidden="true">·</span>
                          <span className="font-mono tabular-nums">
                            {new Date(turn.timestamp).toLocaleTimeString([], {
                              hour: "2-digit",
                              minute: "2-digit",
                            })}
                          </span>
                          {turn.feedback && (
                            <>
                              <span aria-hidden="true">·</span>
                              <span
                                className={
                                  turn.feedback.isNatural
                                    ? "text-emerald-500 font-medium"
                                    : "text-amber-500 font-medium"
                                }
                              >
                                {turn.feedback.isNatural
                                  ? "Natural phrasing"
                                  : "Coaching note available"}
                              </span>
                            </>
                          )}
                        </div>

                        {!turn.isStreaming && (
                          <div className="flex items-center gap-1">
                            <button
                              type="button"
                              onClick={() => onTranslateTurn(turn)}
                              disabled={turn.translating}
                              className="inline-flex items-center gap-1 px-2 py-1 text-xs font-medium text-[var(--parlo-ink-muted)] hover:text-[var(--parlo-ink)] hover:bg-[var(--parlo-surface-alt)] rounded-md transition-colors whitespace-nowrap cursor-pointer"
                            >
                              {turn.translating ? (
                                <Loader2 className="w-3 h-3 animate-spin" aria-hidden="true" />
                              ) : (
                                <Languages className="w-3 h-3" aria-hidden="true" />
                              )}
                              {turn.translation ? "Translated" : "Translate"}
                            </button>

                            {isUser && !turn.feedback && (
                              <button
                                type="button"
                                onClick={() => onAnalyzeTurn(turn)}
                                disabled={turn.analyzing}
                                className="inline-flex items-center gap-1 px-2 py-1 text-xs font-medium text-[var(--parlo-ink-muted)] hover:text-[var(--parlo-ink)] hover:bg-[var(--parlo-surface-alt)] rounded-md transition-colors whitespace-nowrap cursor-pointer"
                              >
                                {turn.analyzing ? (
                                  <Loader2 className="w-3 h-3 animate-spin" aria-hidden="true" />
                                ) : (
                                  <Sparkles className="w-3 h-3" aria-hidden="true" />
                                )}
                                Check
                              </button>
                            )}

                            <button
                              type="button"
                              disabled={isSaved}
                              onClick={() =>
                                onSavePhrase({
                                  phrase: turn.text.trim(),
                                  translation:
                                    turn.translation?.english ||
                                    `Saved from ${scenario.title}`,
                                  reading: turn.translation?.reading,
                                  languageCode: language.code,
                                  scenarioTitle: scenario.title,
                                })
                              }
                              className="inline-flex items-center gap-1 px-2 py-1 text-xs font-medium text-[var(--parlo-ink-muted)] hover:text-[var(--parlo-ink)] hover:bg-[var(--parlo-surface-alt)] disabled:text-emerald-500 rounded-md transition-colors whitespace-nowrap cursor-pointer"
                            >
                              {isSaved ? (
                                <BookmarkCheck className="w-3 h-3" aria-hidden="true" />
                              ) : (
                                <BookmarkPlus className="w-3 h-3" aria-hidden="true" />
                              )}
                              {isSaved ? "Saved" : "Save"}
                            </button>
                          </div>
                        )}
                      </div>

                      <p className="mt-1.5 text-[15px] text-[var(--parlo-ink)] leading-relaxed">
                        {turn.isStreaming ? (
                          <>
                            {turn.text}
                            <span className="inline-block ml-1 text-[var(--parlo-ink-muted)]">
                              ...
                            </span>
                          </>
                        ) : (
                          <ClickableTranscriptText
                            text={turn.text}
                            activeWord={selectedWordAnchor?.word}
                            onSelectWord={setSelectedWordAnchor}
                          />
                        )}
                      </p>

                      {turn.translation && (
                        <div className="mt-2 pt-2 border-t border-[var(--parlo-border)]/70 text-xs text-[var(--parlo-ink-secondary)] space-y-1">
                          {turn.translation.reading && (
                            <p className="font-mono text-[var(--parlo-ink-muted)]">
                              {turn.translation.reading}
                            </p>
                          )}
                          <p className="text-[var(--parlo-ink)] font-medium">
                            {turn.translation.english}
                          </p>
                          {turn.translation.literalNote && (
                            <p className="text-[var(--parlo-ink-muted)]">
                              {turn.translation.literalNote}
                            </p>
                          )}
                        </div>
                      )}
                    </motion.div>
                  );
                })}
                <div ref={transcriptEndRef} />
              </div>
            )}
          </div>

          {/* Kinetic Radiant Conic-Gradient Reply Bar (Active During Live Voice Session) */}
          <div className="px-4 sm:px-5 py-3.5 border-t border-[var(--parlo-border)] bg-[var(--parlo-stage-bg)]">
            <RadiantPromptInput
              value={typedInput}
              onChange={setTypedInput}
              onSubmit={handleSendText}
              disabled={!isLive}
              isLive={isLive}
              isMuted={isMuted}
              micAvailable={micAvailable}
              onToggleMic={isLive ? onToggleMute : onStartSession}
              onRequestHint={handleSuggestReplyClick}
              loadingHints={loadingHints}
              placeholder={
                isLive
                  ? `Speak aloud or type a reply in ${language.name}...`
                  : "Start a voice session above to speak or send live replies..."
              }
            />
          </div>
        </section>

        {/* RIGHT ZONE (34%): Coach, Hints & Goals Concept Deck */}
        <aside
          aria-label="Language coach and scenario goals"
          className="lg:col-span-4 bg-[var(--parlo-surface)] border border-[var(--parlo-border)] rounded-2xl parlo-surface-elevated overflow-hidden flex flex-col"
        >
          {/* Segmented Deck Navigation with recessed well & tactile spring thumb */}
          <div className="relative overflow-hidden p-3 border-b border-[var(--parlo-border)]">
            <div
              aria-hidden="true"
              data-culture={language.code}
              className="parlo-motif-overlay parlo-motif-corner"
            />
            <div className="relative z-10 grid grid-cols-3 gap-1 p-1 bg-[var(--parlo-canvas)] parlo-well-recessed rounded-lg">
              {(
                [
                  { id: "coach", label: "Coach", count: coachNotes.length },
                  { id: "hints", label: "Hints", count: hints.length },
                  {
                    id: "goals",
                    label: "Goals",
                    count: `${completedGoals.length}/${scenario.goals.length}`,
                  },
                ] as const
              ).map((tab) => {
                const active = deckTab === tab.id;
                return (
                  <button
                    key={tab.id}
                    type="button"
                    onClick={() => {
                      if (deckTab !== tab.id) {
                        sfxEngine.playNav();
                        setDeckTab(tab.id);
                      }
                    }}
                    className={`relative px-2.5 py-2 text-xs font-medium rounded-md transition-colors whitespace-nowrap cursor-pointer ${
                      active
                        ? "text-[var(--parlo-ink)]"
                        : "text-[var(--parlo-ink-muted)] hover:text-[var(--parlo-ink)]"
                    }`}
                  >
                    {active && (
                      <motion.span
                        layoutId="parlo-deck-tab"
                        transition={{
                          type: "spring",
                          stiffness: 460,
                          damping: 32,
                        }}
                        className="absolute inset-0 rounded-md bg-[var(--parlo-surface)] parlo-keycap-thumb"
                      />
                    )}
                    <span className="relative z-10">{tab.label}</span>
                    <span className="relative z-10 ml-1.5 font-mono text-[11px] text-[var(--parlo-ink-muted)] tabular-nums">
                      {tab.count}
                    </span>
                  </button>
                );
              })}
            </div>
          </div>

          <div className="p-5 flex-1 min-h-[480px] max-h-[680px] overflow-y-auto">
            <AnimatePresence mode="wait" initial={false}>
              <motion.div
                key={deckTab}
                initial={{ opacity: 0, y: 8 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -8 }}
                transition={{ duration: 0.18, ease: [0.16, 1, 0.3, 1] }}
              >
            {/* COACH TAB */}
            {deckTab === "coach" && (
              <div className="space-y-5">
                <div className="flex items-center justify-between gap-3 pb-4 border-b border-[var(--parlo-border)]">
                  <div>
                    <h2 className="text-sm font-semibold text-[var(--parlo-ink)]">
                      Live Grammar & Phrasing
                    </h2>
                    <p className="text-xs text-[var(--parlo-ink-muted)] mt-0.5">
                      Quiet written notes while you keep talking
                    </p>
                  </div>
                  <button
                    type="button"
                    role="switch"
                    aria-checked={autoCoach}
                    onClick={() => {
                      sfxEngine.playToggle(!autoCoach);
                      onToggleAutoCoach();
                    }}
                    className={`px-3 py-1.5 text-xs font-medium rounded-lg border transition-colors whitespace-nowrap shrink-0 cursor-pointer ${
                      autoCoach
                        ? "bg-[var(--parlo-primary-soft)] border-[var(--parlo-primary)]/45 text-[var(--parlo-primary)]"
                        : "bg-[var(--parlo-surface)] border-[var(--parlo-border)] text-[var(--parlo-ink-muted)] hover:text-[var(--parlo-ink)]"
                    }`}
                  >
                    Auto: {autoCoach ? "On" : "Off"}
                  </button>
                </div>

                {/* Interactive Cultural Rhythm, Prosody Contour & Etiquette Card */}
                <CulturalEtiquetteCard language={language} />

                {coachNotes.length === 0 ? (
                  <div className="py-6 text-center space-y-2">
                    <p className="text-sm font-medium text-[var(--parlo-ink)]">
                      Waiting for your first turn
                    </p>
                    <p className="text-xs text-[var(--parlo-ink-muted)] leading-relaxed max-w-xs mx-auto">
                      Each time you speak or send a line, your coach evaluates naturalness, suggests idiomatic phrasing, and highlights key expressions without interrupting the voice stream.
                    </p>
                  </div>
                ) : (
                  <div className="divide-y divide-[var(--parlo-border)]">
                    {coachNotes.map((note) => {
                      const phraseToSave = note.keyPhrase?.phrase || note.corrected;
                      const isSaved = savedPhraseStrings.has(
                        phraseToSave.trim().toLowerCase()
                      );

                      return (
                        <div
                          key={note.turnId}
                          className="py-4 first:pt-0 last:pb-0 space-y-2"
                        >
                          <div className="flex items-center justify-between gap-2 text-xs">
                            <span
                              className={`font-semibold ${
                                note.isNatural
                                  ? "text-[var(--parlo-primary)]"
                                  : "text-[var(--parlo-accent)]"
                              }`}
                            >
                              {note.isNatural
                                ? "Accurate & natural"
                                : "More natural phrasing"}
                            </span>
                            <button
                              type="button"
                              onClick={() =>
                                speakWithBrowserTts(
                                  note.corrected,
                                  language.speechLocale
                                )
                              }
                              aria-label="Listen to suggested phrasing"
                              className="inline-flex items-center gap-1 text-[var(--parlo-ink-muted)] hover:text-[var(--parlo-ink)] cursor-pointer"
                            >
                              <Volume2 className="w-3.5 h-3.5" aria-hidden="true" />
                              Hear
                            </button>
                          </div>

                          {!note.isNatural && (
                            <p className="text-xs text-[var(--parlo-ink-muted)] line-through">
                              {note.original}
                            </p>
                          )}

                          <p className="text-sm font-semibold text-[var(--parlo-ink)] leading-snug">
                            {note.corrected}
                          </p>

                          <p className="text-xs text-[var(--parlo-ink-secondary)] leading-relaxed">
                            {note.explanation}
                          </p>

                          {note.tip && (
                            <p className="text-xs text-[var(--parlo-ink-muted)]">
                              Tip: {note.tip}
                            </p>
                          )}

                          {note.keyPhrase && (
                            <div className="pt-2 flex items-center justify-between gap-3">
                              <div className="min-w-0 text-xs">
                                <span className="font-medium text-[var(--parlo-ink)]">
                                  {note.keyPhrase.phrase}
                                </span>
                                <span className="text-[var(--parlo-ink-muted)]">
                                  {" "}
                                  — {note.keyPhrase.translation}
                                </span>
                              </div>
                              <button
                                type="button"
                                disabled={isSaved}
                                onClick={() =>
                                  onSavePhrase({
                                    phrase: note.keyPhrase!.phrase,
                                    translation: note.keyPhrase!.translation,
                                    reading: note.keyPhrase!.reading,
                                    languageCode: language.code,
                                    scenarioTitle: scenario.title,
                                    note: note.tip,
                                  })
                                }
                                className="text-xs font-medium text-[var(--parlo-primary)] hover:underline disabled:text-[var(--parlo-accent)] whitespace-nowrap shrink-0 cursor-pointer"
                              >
                                {isSaved ? "Saved" : "Save"}
                              </button>
                            </div>
                          )}
                        </div>
                      );
                    })}
                  </div>
                )}
              </div>
            )}

            {/* HINTS TAB */}
            {deckTab === "hints" && (
              <div className="space-y-5">
                <div className="flex items-center justify-between gap-3 pb-4 border-b border-[var(--parlo-border)]">
                  <div>
                    <h2 className="text-sm font-semibold text-[var(--parlo-ink)]">
                      Contextual Reply Ideas
                    </h2>
                    <p className="text-xs text-[var(--parlo-ink-muted)] mt-0.5">
                      Tailored to CEFR {level} in {language.name}
                    </p>
                  </div>
                  <button
                    type="button"
                    onClick={onRequestHints}
                    disabled={loadingHints}
                    className="inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium text-[var(--parlo-on-solid)] bg-[var(--parlo-primary)] hover:bg-[var(--parlo-primary-hover)] disabled:opacity-60 rounded-lg transition-colors whitespace-nowrap shrink-0 cursor-pointer"
                  >
                    {loadingHints ? (
                      <Loader2 className="w-3.5 h-3.5 animate-spin" aria-hidden="true" />
                    ) : (
                      <Lightbulb className="w-3.5 h-3.5" aria-hidden="true" />
                    )}
                    Refresh
                  </button>
                </div>

                {hintsError && (
                  <p className="text-xs text-red-400 bg-red-500/10 border border-red-500/30 rounded-lg p-3">
                    {hintsError}
                  </p>
                )}

                {hints.length === 0 && !loadingHints ? (
                  <div className="space-y-4">
                    <p className="text-xs text-[var(--parlo-ink-secondary)] leading-relaxed">
                      Need a nudge on what to say next? Click Refresh to generate three natural options based on the live conversation.
                    </p>
                    {starterPhrases.length > 0 && (
                      <div className="pt-3 border-t border-[var(--parlo-border)] space-y-3">
                        <p className="text-xs font-medium text-[var(--parlo-ink-muted)]">
                          Scenario starters
                        </p>
                        {starterPhrases.map((item, idx) => (
                          <div
                            key={idx}
                            className="p-3.5 bg-[var(--parlo-canvas)]/75 border border-[var(--parlo-border)] rounded-xl space-y-1.5"
                          >
                            <p className="text-sm font-medium text-[var(--parlo-ink)]">
                              {item.text}
                            </p>
                            {item.reading && (
                              <p className="font-mono text-xs text-[var(--parlo-ink-muted)]">
                                {item.reading}
                              </p>
                            )}
                            <p className="text-xs text-[var(--parlo-ink-secondary)]">
                              {item.meaning}
                            </p>
                            <div className="pt-1 flex items-center gap-3">
                              <button
                                type="button"
                                onClick={() =>
                                  speakWithBrowserTts(
                                    item.text,
                                    language.speechLocale
                                  )
                                }
                                className="text-xs font-medium text-[var(--parlo-ink-muted)] hover:text-[var(--parlo-ink)] cursor-pointer"
                              >
                                Listen
                              </button>
                              {isLive && (
                                <button
                                  type="button"
                                  onClick={() => onSendTextTurn(item.text)}
                                  className="text-xs font-medium text-[var(--parlo-primary)] hover:underline cursor-pointer"
                                >
                                  Send in Session
                                </button>
                              )}
                            </div>
                          </div>
                        ))}
                      </div>
                    )}
                  </div>
                ) : (
                  <div className="space-y-3">
                    {hints.map((hint, idx) => {
                      const isSaved = savedPhraseStrings.has(
                        hint.text.trim().toLowerCase()
                      );
                      return (
                        <div
                          key={idx}
                          className="p-4 bg-[var(--parlo-canvas)]/75 border border-[var(--parlo-border)] rounded-xl space-y-1.5"
                        >
                          <div className="flex items-center justify-between gap-2 text-xs text-[var(--parlo-ink-muted)]">
                            <span className="font-medium text-[var(--parlo-accent)]">
                              {hint.register}
                            </span>
                            <button
                              type="button"
                              onClick={() =>
                                speakWithBrowserTts(
                                  hint.text,
                                  language.speechLocale
                                )
                              }
                              className="inline-flex items-center gap-1 hover:text-[var(--parlo-ink)] cursor-pointer"
                            >
                              <Volume2 className="w-3.5 h-3.5" aria-hidden="true" />
                              Hear
                            </button>
                          </div>
                          <p className="text-sm font-semibold text-[var(--parlo-ink)] leading-snug">
                            {hint.text}
                          </p>
                          {hint.reading && (
                            <p className="font-mono text-xs text-[var(--parlo-ink-muted)]">
                              {hint.reading}
                            </p>
                          )}
                          <p className="text-xs text-[var(--parlo-ink-secondary)]">
                            {hint.translation}
                          </p>
                          <div className="pt-2 flex items-center gap-4">
                            {isLive && (
                              <button
                                type="button"
                                onClick={() => onSendTextTurn(hint.text)}
                                className="text-xs font-medium text-[var(--parlo-primary)] hover:underline cursor-pointer"
                              >
                                Send Now
                              </button>
                            )}
                            <button
                              type="button"
                              disabled={isSaved}
                              onClick={() =>
                                onSavePhrase({
                                  phrase: hint.text,
                                  translation: hint.translation,
                                  reading: hint.reading,
                                  languageCode: language.code,
                                  scenarioTitle: scenario.title,
                                })
                              }
                              className="text-xs font-medium text-[var(--parlo-ink-muted)] hover:text-[var(--parlo-ink)] disabled:text-[var(--parlo-accent)] cursor-pointer"
                            >
                              {isSaved ? "Saved" : "Save to Phrasebook"}
                            </button>
                          </div>
                        </div>
                      );
                    })}
                  </div>
                )}
              </div>
            )}

            {/* GOALS & PARTNER SETTINGS TAB */}
            {deckTab === "goals" && (
              <div className="space-y-6">
                <div>
                  <h2 className="text-sm font-semibold text-[var(--parlo-ink)]">
                    Scenario Objectives
                  </h2>
                  <p className="text-xs text-[var(--parlo-ink-muted)] mt-0.5">
                    Checked automatically as you converse, or tap to mark manually
                  </p>
                  <ul className="mt-3 space-y-2.5">
                    {scenario.goals.map((goal, idx) => {
                      const done = completedGoals.includes(idx);
                      return (
                        <li key={idx}>
                          <button
                            type="button"
                            onClick={() => onToggleGoal(idx)}
                            className={`w-full text-left p-3 rounded-xl border flex items-start gap-3 transition-colors cursor-pointer ${
                              done
                                ? "bg-[color-mix(in_srgb,var(--parlo-primary)_12%,var(--parlo-surface))] border-[var(--parlo-primary)]/45 text-[var(--parlo-ink)]"
                                : "bg-[var(--parlo-canvas)]/70 border-[var(--parlo-border)] text-[var(--parlo-ink-secondary)] hover:border-[var(--parlo-primary)]/45 hover:text-[var(--parlo-ink)]"
                            }`}
                          >
                            {done ? (
                              <CheckCircle2
                                className="w-4 h-4 text-[var(--parlo-primary)] shrink-0 mt-0.5"
                                aria-hidden="true"
                              />
                            ) : (
                              <span
                                className="w-4 h-4 rounded-full border border-[var(--parlo-border)] shrink-0 mt-0.5 flex items-center justify-center"
                                aria-hidden="true"
                              >
                                <Check className="w-2.5 h-2.5 text-transparent" />
                              </span>
                            )}
                            <span className="text-xs leading-relaxed">
                              {goal}
                            </span>
                          </button>
                        </li>
                      );
                    })}
                  </ul>
                </div>

                <div className="pt-5 border-t border-[var(--parlo-border)] space-y-4">
                  <div className="flex items-center justify-between gap-2">
                    <h3 className="text-sm font-semibold text-[var(--parlo-ink)]">
                      Partner Coaching Style
                    </h3>
                    <span className="text-[11px] font-mono text-[var(--parlo-ink-muted)]">
                      Pace in Settings
                    </span>
                  </div>

                  <div>
                    <div className="flex items-center justify-between text-xs mb-1.5">
                      <span className="font-medium text-[var(--parlo-ink-secondary)]">
                        Spoken Corrections
                      </span>
                      <span className="text-[var(--parlo-ink-muted)] capitalize">
                        {correctionStyle}
                      </span>
                    </div>
                    <div className="grid grid-cols-3 gap-1 p-1 bg-[var(--parlo-canvas)] border border-[var(--parlo-border)] rounded-lg">
                      {(
                        [
                          { id: "gentle", label: "Gentle" },
                          { id: "active", label: "Active" },
                          { id: "immersive", label: "Immersive" },
                        ] as { id: CorrectionStyle; label: string }[]
                      ).map((opt) => (
                        <button
                          key={opt.id}
                          type="button"
                          disabled={isLive || isConnecting}
                          onClick={() => onChangeCorrectionStyle(opt.id)}
                          className={`py-1.5 text-xs font-medium rounded-md transition-colors cursor-pointer disabled:cursor-not-allowed ${
                            correctionStyle === opt.id
                              ? "bg-[var(--parlo-primary)] text-[var(--parlo-on-solid)] shadow-xs"
                              : "text-[var(--parlo-ink-muted)] hover:text-[var(--parlo-ink)]"
                          }`}
                        >
                          {opt.label}
                        </button>
                      ))}
                    </div>
                    <p className="mt-2 text-xs text-[var(--parlo-ink-muted)] leading-relaxed">
                      {correctionStyle === "gentle"
                        ? "Partner naturally models correct phrasing in reply without breaking character."
                        : correctionStyle === "active"
                        ? "Partner briefly notes key mistakes aloud before continuing the dialogue."
                        : "Pure real-world immersion — corrections stay in the written Coach tab only."}
                    </p>
                  </div>
                </div>
              </div>
            )}
              </motion.div>
            </AnimatePresence>
          </div>
        </aside>
      </div>

      {/* Anchored Click-Any-Word Cultural Dictionary Popover */}
      <WordDictionaryPopover
        anchor={selectedWordAnchor}
        language={language}
        level={level}
        dialectLabel={activeDialect?.label}
        scenarioTitle={scenario.title}
        savedPhraseStrings={savedPhraseStrings}
        onClose={() => setSelectedWordAnchor(null)}
        onSavePhrase={onSavePhrase}
      />
    </div>
  );
}
