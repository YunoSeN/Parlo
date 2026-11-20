import { useCallback, useEffect, useMemo, useState } from "react";
import { AnimatePresence, motion, useMotionValue, useSpring } from "motion/react";
import {
  Command,
  Flame,
  LogIn,
  LogOut,
  Moon,
  Sun,
} from "lucide-react";
import { AtmosphericBackdrop } from "./components/AtmosphericBackdrop";
import { CommandPalette } from "./components/CommandPalette";
import { LanguageCultureMenu } from "./components/LanguageCultureMenu";
import { MagnificationDock } from "./components/MagnificationDock";
import { ParloLogo } from "./components/ParloLogo";
import { PhrasebookView } from "./components/PhrasebookView";
import { PricingSection } from "./components/PricingSection";
import { ReviewView } from "./components/ReviewView";
import { ScenariosView } from "./components/ScenariosView";
import { SpatialSceneView } from "./components/SpatialSceneView";
import { StudioView } from "./components/StudioView";
import { getLanguageByCode, SCENARIOS } from "./data/catalog";
import { useAuth } from "./hooks/useAuth";
import { useLivePartner } from "./hooks/useLivePartner";
import { speakWithBrowserTts } from "./lib/audio";
import { computeDailyStreak } from "./lib/streaks";
import {
  CountryFontSpec,
  createInitialCategoryFonts,
  getCultureByLanguage,
  pickRandomCountryFont,
  syncCulturalMotifCssVariables,
} from "./lib/cultures";
import { DEFAULT_THEME_ID, PARLO_THEMES, ThemeId } from "./lib/themes";
import {
  fetchReplyHints,
  fetchTurnFeedback,
  fetchTurnTranslation,
} from "./lib/api";
import {
  fetchAccountState,
  persistCustomScenario,
  persistPhraseMastered,
  persistPracticeSession,
  persistSavedPhrase,
  persistSessionDebrief,
  persistWeeklyGoal,
  removeSavedPhrase,
} from "./lib/cloudApi";
import {
  AppView,
  CefrLevel,
  CoachFeedback,
  CorrectionStyle,
  DebriefReport,
  PracticeSessionRecord,
  ReplySuggestion,
  SavedPhrase,
  Scenario,
  SpeakingPace,
  TranscriptTurn,
  VoiceName,
} from "./types";

const PHRASES_STORAGE_KEY = "parlo_saved_phrases_v1";
const SESSIONS_STORAGE_KEY = "parlo_practice_sessions_v1";
const CUSTOM_SCENARIOS_KEY = "parlo_custom_scenarios_v1";
const WEEKLY_GOAL_STORAGE_KEY = "parlo_weekly_goal_v1";
const THEME_STORAGE_KEY = "parlo_theme_v3";

function readStorage<T>(key: string, fallback: T): T {
  try {
    const raw = localStorage.getItem(key);
    return raw ? (JSON.parse(raw) as T) : fallback;
  } catch {
    return fallback;
  }
}

export default function App() {
  const [activeView, setActiveView] = useState<AppView>("studio");
  const [categoryFonts, setCategoryFonts] = useState<
    Record<AppView, CountryFontSpec>
  >(() => createInitialCategoryFonts());
  const { user, authError, signInWithGoogle, logout, getToken, clearAuthError } =
    useAuth();

  const handleNavigateView = useCallback((view: AppView) => {
    setActiveView(view);
    setCategoryFonts((prev) => ({
      ...prev,
      [view]: pickRandomCountryFont(prev[view]?.code),
    }));
  }, []);

  // Persistent collections (local cache + seamless account sync when signed in)
  const [customScenarios, setCustomScenarios] = useState<Scenario[]>(() =>
    readStorage<Scenario[]>(CUSTOM_SCENARIOS_KEY, [])
  );
  const [savedPhrases, setSavedPhrases] = useState<SavedPhrase[]>(() =>
    readStorage<SavedPhrase[]>(PHRASES_STORAGE_KEY, [])
  );
  const [sessions, setSessions] = useState<PracticeSessionRecord[]>(() =>
    readStorage<PracticeSessionRecord[]>(SESSIONS_STORAGE_KEY, [])
  );
  const [weeklyGoal, setWeeklyGoal] = useState<number>(() => {
    const stored = readStorage<number>(WEEKLY_GOAL_STORAGE_KEY, 4);
    return typeof stored === "number" && stored >= 1 && stored <= 14 ? stored : 4;
  });
  const [selectedPlanId, setSelectedPlanId] = useState<string>("starter");
  const [commandOpen, setCommandOpen] = useState<boolean>(false);
  const [themeId, setThemeId] = useState<ThemeId>(() => {
    const stored = readStorage<string>(THEME_STORAGE_KEY, DEFAULT_THEME_ID);
    return PARLO_THEMES.some((t) => t.id === stored)
      ? (stored as ThemeId)
      : DEFAULT_THEME_ID;
  });

  // NOTE: applied in an effect below once languageCode is initialized
  useEffect(() => {
    try {
      localStorage.setItem(THEME_STORAGE_KEY, JSON.stringify(themeId));
    } catch {
      // ignore storage errors
    }
  }, [themeId]);

  useEffect(() => {
    const viewOrder: AppView[] = [
      "studio",
      "spatial",
      "scenarios",
      "phrasebook",
      "review",
      "pricing",
    ];
    const onKeyDown = (e: KeyboardEvent) => {
      if ((e.metaKey || e.ctrlKey) && e.key.toLowerCase() === "k") {
        e.preventDefault();
        setCommandOpen((prev) => !prev);
        return;
      }
      if (
        e.metaKey ||
        e.ctrlKey ||
        e.altKey ||
        e.target instanceof HTMLInputElement ||
        e.target instanceof HTMLTextAreaElement ||
        e.target instanceof HTMLSelectElement ||
        (e.target instanceof HTMLElement && e.target.isContentEditable)
      ) {
        return;
      }
      const num = Number(e.key);
      if (num >= 1 && num <= viewOrder.length) {
        handleNavigateView(viewOrder[num - 1]);
      }
    };
    window.addEventListener("keydown", onKeyDown);
    return () => window.removeEventListener("keydown", onKeyDown);
  }, [handleNavigateView]);

  const dailyStreak = useMemo(() => computeDailyStreak(sessions), [sessions]);

  // Subtle floating parallax values linked to pointer movement within the header
  const headerPointerX = useMotionValue(0);
  const headerPointerY = useMotionValue(0);
  const headerParallaxX = useSpring(headerPointerX, {
    stiffness: 190,
    damping: 22,
    mass: 0.7,
  });
  const headerParallaxY = useSpring(headerPointerY, {
    stiffness: 190,
    damping: 22,
    mass: 0.7,
  });

  const handleHeaderPointerMove = useCallback(
    (e: React.PointerEvent<HTMLElement>) => {
      if (e.pointerType === "touch") return;
      const rect = e.currentTarget.getBoundingClientRect();
      if (rect.width === 0 || rect.height === 0) return;
      const nx = ((e.clientX - rect.left) / rect.width) * 2 - 1;
      const ny = ((e.clientY - rect.top) / rect.height) * 2 - 1;
      headerPointerX.set(Math.max(-1, Math.min(1, nx)));
      headerPointerY.set(Math.max(-1, Math.min(1, ny)));
    },
    [headerPointerX, headerPointerY]
  );

  const handleHeaderPointerLeave = useCallback(() => {
    headerPointerX.set(0);
    headerPointerY.set(0);
  }, [headerPointerX, headerPointerY]);

  // Synchronize user data when signed in via Google Sign-In
  useEffect(() => {
    if (!user) return;
    let cancelled = false;

    const syncFromAccount = async () => {
      const token = await getToken();
      if (!token || cancelled) return;
      try {
        const account = await fetchAccountState(token);
        if (cancelled) return;

        if (
          typeof account.weeklySessionGoal === "number" &&
          account.weeklySessionGoal >= 1
        ) {
          setWeeklyGoal(account.weeklySessionGoal);
        }

        // Merge cloud records with any local guest records so nothing is lost on sign-in
        setSessions((localPrev) => {
          const byId = new Map<string, PracticeSessionRecord>();
          for (const s of account.sessions) byId.set(s.id, s);
          for (const s of localPrev) {
            if (!byId.has(s.id)) {
              byId.set(s.id, s);
              void persistPracticeSession(token, s).catch(() => {});
            }
          }
          return Array.from(byId.values()).sort((a, b) => b.date - a.date);
        });

        setSavedPhrases((localPrev) => {
          const byId = new Map<string, SavedPhrase>();
          for (const p of account.phrases) byId.set(p.id, p);
          for (const p of localPrev) {
            if (!byId.has(p.id)) {
              byId.set(p.id, p);
              void persistSavedPhrase(token, p).catch(() => {});
            }
          }
          return Array.from(byId.values()).sort(
            (a, b) => b.createdAt - a.createdAt
          );
        });

        setCustomScenarios((localPrev) => {
          const byId = new Map<string, Scenario>();
          for (const sc of account.customScenarios) byId.set(sc.id, sc);
          for (const sc of localPrev) {
            if (!byId.has(sc.id)) {
              byId.set(sc.id, sc);
              void persistCustomScenario(token, sc).catch(() => {});
            }
          }
          return Array.from(byId.values());
        });
      } catch {
        // Keep local state interactive if remote sync is transiently unavailable
      }
    };

    void syncFromAccount();
    return () => {
      cancelled = true;
    };
  }, [getToken, user]);

  const allScenarios = useMemo(
    () => [...customScenarios, ...SCENARIOS],
    [customScenarios]
  );

  // Active studio configuration
  const [activeScenarioId, setActiveScenarioId] = useState<string>(
    SCENARIOS[0].id
  );
  const activeScenario = useMemo(
    () => allScenarios.find((s) => s.id === activeScenarioId) ?? SCENARIOS[0],
    [allScenarios, activeScenarioId]
  );

  const [languageCode, setLanguageCode] = useState<string>(
    SCENARIOS[0].defaultLanguageCode
  );
  const [languageSelectionCount, setLanguageSelectionCount] = useState<number>(0);
  const [level, setLevel] = useState<CefrLevel>(SCENARIOS[0].recommendedLevel);
  const [voiceName, setVoiceName] = useState<VoiceName>(
    SCENARIOS[0].defaultVoice
  );
  const [correctionStyle, setCorrectionStyle] =
    useState<CorrectionStyle>("gentle");
  const [speakingPace, setSpeakingPace] = useState<SpeakingPace>("natural");
  const [autoCoach, setAutoCoach] = useState<boolean>(true);

  // Per-session coaching state
  const [coachNotes, setCoachNotes] = useState<CoachFeedback[]>([]);
  const [hints, setHints] = useState<ReplySuggestion[]>([]);
  const [loadingHints, setLoadingHints] = useState(false);
  const [hintsError, setHintsError] = useState<string | null>(null);
  const [completedGoals, setCompletedGoals] = useState<number[]>([]);
  const [lastArchivedSessionId, setLastArchivedSessionId] = useState<
    string | null
  >(null);

  const language = useMemo(
    () => getLanguageByCode(languageCode),
    [languageCode]
  );

  const activeCulture = useMemo(
    () => getCultureByLanguage(languageCode),
    [languageCode]
  );

  // Sync unified adaptive palette & dataset-driven CSS motif variables
  useEffect(() => {
    const isDark = themeId === "obsidian-glass";
    document.documentElement.dataset.culture = languageCode;
    document.documentElement.dataset.mode = isDark ? "dark" : "light";
    document.documentElement.dataset.theme = activeCulture.themeDataAttr;
    document.documentElement.classList.toggle("dark", isDark);
    syncCulturalMotifCssVariables(document.documentElement, languageCode);
  }, [activeCulture.themeDataAttr, languageCode, themeId]);

  // Sync local mirror
  useEffect(() => {
    try {
      localStorage.setItem(PHRASES_STORAGE_KEY, JSON.stringify(savedPhrases));
    } catch {
      // ignore quota issues
    }
  }, [savedPhrases]);

  useEffect(() => {
    try {
      localStorage.setItem(SESSIONS_STORAGE_KEY, JSON.stringify(sessions));
    } catch {
      // ignore quota issues
    }
  }, [sessions]);

  useEffect(() => {
    try {
      localStorage.setItem(
        CUSTOM_SCENARIOS_KEY,
        JSON.stringify(customScenarios)
      );
    } catch {
      // ignore quota issues
    }
  }, [customScenarios]);

  useEffect(() => {
    try {
      localStorage.setItem(WEEKLY_GOAL_STORAGE_KEY, JSON.stringify(weeklyGoal));
    } catch {
      // ignore quota issues
    }
  }, [weeklyGoal]);

  const savedPhraseStrings = useMemo(
    () => new Set(savedPhrases.map((p) => p.phrase.trim().toLowerCase())),
    [savedPhrases]
  );

  const handleChangeWeeklyGoal = useCallback(
    (nextGoal: number) => {
      const clamped = Math.max(1, Math.min(14, Math.round(nextGoal)));
      setWeeklyGoal(clamped);
      void getToken().then((token) => {
        if (token) {
          void persistWeeklyGoal(token, clamped).catch(() => {});
        }
      });
    },
    [getToken]
  );

  const analyzeTurnInternal = useCallback(
    async (
      turn: TranscriptTurn,
      recentTurns: TranscriptTurn[],
      updateTurn: (turnId: string, patch: Partial<TranscriptTurn>) => void
    ) => {
      if (!turn.text.trim() || turn.text.trim().length < 2) return;
      updateTurn(turn.id, { analyzing: true });
      try {
        const feedback = await fetchTurnFeedback({
          turnId: turn.id,
          utterance: turn.text,
          languageName: language.name,
          level,
          scenarioTitle: activeScenario.title,
          recentTurns: recentTurns.map((t) => ({ role: t.role, text: t.text })),
          goals: activeScenario.goals,
        });
        updateTurn(turn.id, { analyzing: false, feedback });
        setCoachNotes((prev) => [
          feedback,
          ...prev.filter((n) => n.turnId !== turn.id),
        ]);
        if (feedback.completedGoalIndices.length > 0) {
          setCompletedGoals((prev) =>
            Array.from(
              new Set([
                ...prev,
                ...feedback.completedGoalIndices.filter(
                  (idx) => idx >= 0 && idx < activeScenario.goals.length
                ),
              ])
            )
          );
        }
      } catch {
        updateTurn(turn.id, { analyzing: false });
      }
    },
    [activeScenario.goals, activeScenario.title, language.name, level]
  );

  const live = useLivePartner({
    language,
    level,
    voiceName,
    scenario: activeScenario,
    correctionStyle,
    speakingPace,
    onUserTurnFinalized: (turn, allTurns) => {
      if (autoCoach) {
        void analyzeTurnInternal(turn, allTurns, (turnId, patch) => {
          live.setTurns((prev) =>
            prev.map((t) => (t.id === turnId ? { ...t, ...patch } : t))
          );
        });
      }
    },
  });

  const handleStartPractice = useCallback(() => {
    if (activeView !== "spatial") {
      setActiveView("studio");
    }
    setLastArchivedSessionId(null);
    setCoachNotes([]);
    setHints([]);
    setHintsError(null);
    setCompletedGoals([]);
    live.resetTranscript();
    void live.startSession();
  }, [activeView, live]);

  const handleEndSession = useCallback(async () => {
    const capturedTurns = live.turns.filter((t) => t.text.trim().length > 0);
    const duration = live.elapsedSeconds;
    await live.stopSession();

    if (capturedTurns.length > 0) {
      const record: PracticeSessionRecord = {
        id: `session-${Date.now()}`,
        date: Date.now(),
        languageCode: language.code,
        level,
        scenarioTitle: activeScenario.title,
        partnerName: activeScenario.partnerName,
        durationSeconds: Math.max(1, duration),
        userTurnsCount: capturedTurns.filter((t) => t.role === "user").length,
        partnerTurnsCount: capturedTurns.filter((t) => t.role === "partner")
          .length,
        goalsCompleted: completedGoals.length,
        goalsTotal: activeScenario.goals.length,
        transcript: capturedTurns.map((t) => ({
          role: t.role,
          text: t.text,
        })),
      };
      setSessions((prev) => [record, ...prev]);
      setLastArchivedSessionId(record.id);

      void getToken().then((token) => {
        if (token) {
          void persistPracticeSession(token, record).catch(() => {});
        }
      });
    }
  }, [
    activeScenario.goals.length,
    activeScenario.partnerName,
    activeScenario.title,
    completedGoals.length,
    getToken,
    language.code,
    level,
    live,
  ]);

  const handleTranslateTurn = useCallback(
    async (turn: TranscriptTurn) => {
      if (turn.translation || turn.translating) return;
      live.setTurns((prev) =>
        prev.map((t) => (t.id === turn.id ? { ...t, translating: true } : t))
      );
      try {
        const translation = await fetchTurnTranslation({
          text: turn.text,
          languageName: language.name,
        });
        live.setTurns((prev) =>
          prev.map((t) =>
            t.id === turn.id ? { ...t, translating: false, translation } : t
          )
        );
      } catch {
        live.setTurns((prev) =>
          prev.map((t) => (t.id === turn.id ? { ...t, translating: false } : t))
        );
      }
    },
    [language.name, live]
  );

  const handleManualAnalyzeTurn = useCallback(
    (turn: TranscriptTurn) => {
      void analyzeTurnInternal(turn, live.turns, (turnId, patch) => {
        live.setTurns((prev) =>
          prev.map((t) => (t.id === turnId ? { ...t, ...patch } : t))
        );
      });
    },
    [analyzeTurnInternal, live]
  );

  const handleRequestHints = useCallback(async () => {
    setLoadingHints(true);
    setHintsError(null);
    try {
      const suggestions = await fetchReplyHints({
        languageName: language.name,
        level,
        scenarioTitle: activeScenario.title,
        scenarioPrompt: activeScenario.promptContext,
        recentTurns: live.turns.map((t) => ({ role: t.role, text: t.text })),
      });
      setHints(suggestions);
    } catch (err) {
      setHintsError(
        err instanceof Error ? err.message : "Could not generate reply ideas."
      );
    } finally {
      setLoadingHints(false);
    }
  }, [
    activeScenario.promptContext,
    activeScenario.title,
    language.name,
    level,
    live.turns,
  ]);

  const handleSelectScenario = useCallback(
    async (scenario: Scenario) => {
      if (
        live.connectionState === "live" ||
        live.connectionState === "connecting"
      ) {
        await live.stopSession();
      }
      setActiveScenarioId(scenario.id);
      setLanguageCode(scenario.defaultLanguageCode);
      setLevel(scenario.recommendedLevel);
      setVoiceName(scenario.defaultVoice);
      setCoachNotes([]);
      setHints([]);
      setHintsError(null);
      setCompletedGoals([]);
      setLastArchivedSessionId(null);
      live.resetTranscript();
      setActiveView("studio");
    },
    [live]
  );

  // Unified language switcher: immediately morphs the entire adaptive palette,
  // ambient background effect, and matching curated scenario when idle.
  const handleSelectLanguage = useCallback(
    (code: string) => {
      setLanguageCode(code);
      setLanguageSelectionCount((prev) => prev + 1);
      const currentlyLive =
        live.connectionState === "live" || live.connectionState === "connecting";
      if (!currentlyLive && !activeScenario.isCustom) {
        const matchingScenario = SCENARIOS.find(
          (sc) => sc.defaultLanguageCode === code
        );
        if (matchingScenario && matchingScenario.id !== activeScenario.id) {
          setActiveScenarioId(matchingScenario.id);
          setVoiceName(matchingScenario.defaultVoice);
          setCoachNotes([]);
          setHints([]);
          setHintsError(null);
          setCompletedGoals([]);
        }
      }
    },
    [activeScenario.id, activeScenario.isCustom, live.connectionState]
  );

  const handleCreateScenario = useCallback(
    (scenario: Scenario) => {
      setCustomScenarios((prev) => [scenario, ...prev]);
      void getToken().then((token) => {
        if (token) {
          void persistCustomScenario(token, scenario).catch(() => {});
        }
      });
    },
    [getToken]
  );

  const handleSavePhrase = useCallback(
    (params: {
      phrase: string;
      translation: string;
      reading?: string;
      languageCode: string;
      scenarioTitle: string;
      note?: string;
    }) => {
      const normalized = params.phrase.trim().toLowerCase();
      let created: SavedPhrase | null = null;

      setSavedPhrases((prev) => {
        if (prev.some((p) => p.phrase.trim().toLowerCase() === normalized)) {
          return prev;
        }
        created = {
          id: `phrase-${Date.now()}-${Math.random().toString(36).slice(2, 6)}`,
          phrase: params.phrase.trim(),
          translation: params.translation.trim(),
          reading: params.reading?.trim() || undefined,
          languageCode: params.languageCode,
          scenarioTitle: params.scenarioTitle,
          note: params.note?.trim() || undefined,
          createdAt: Date.now(),
          mastered: false,
        };
        return [created, ...prev];
      });

      void getToken().then((token) => {
        if (token && created) {
          void persistSavedPhrase(token, created).catch(() => {});
        }
      });
    },
    [getToken]
  );

  const handleToggleMastered = useCallback(
    (id: string) => {
      let nextMastered = false;
      setSavedPhrases((prev) =>
        prev.map((p) => {
          if (p.id === id) {
            nextMastered = !p.mastered;
            return { ...p, mastered: nextMastered };
          }
          return p;
        })
      );
      void getToken().then((token) => {
        if (token) {
          void persistPhraseMastered(token, id, nextMastered).catch(() => {});
        }
      });
    },
    [getToken]
  );

  const handleDeletePhrase = useCallback(
    (id: string) => {
      setSavedPhrases((prev) => prev.filter((p) => p.id !== id));
      void getToken().then((token) => {
        if (token) {
          void removeSavedPhrase(token, id).catch(() => {});
        }
      });
    },
    [getToken]
  );

  const handleSaveDebrief = useCallback(
    (sessionId: string, debrief: DebriefReport) => {
      setSessions((prev) =>
        prev.map((s) => (s.id === sessionId ? { ...s, debrief } : s))
      );
      void getToken().then((token) => {
        if (token) {
          void persistSessionDebrief(token, sessionId, debrief).catch(() => {});
        }
      });
    },
    [getToken]
  );

  const handleToggleGoal = useCallback((index: number) => {
    setCompletedGoals((prev) =>
      prev.includes(index) ? prev.filter((i) => i !== index) : [...prev, index]
    );
  }, []);

  const isSessionActive =
    live.connectionState === "live" || live.connectionState === "connecting";

  const handleSelectPlan = useCallback(
    (planId: string) => {
      if (planId === selectedPlanId && planId !== "schools-teams") {
        setActiveView("studio");
        return;
      }
      setSelectedPlanId(planId);
    },
    [selectedPlanId]
  );

  return (
    <div
      className={`min-h-screen parlo-viewport-stage text-[var(--parlo-ink)] transition-colors duration-300 ${
        activeView === "spatial" ? "" : "sm:p-3 lg:p-4"
      }`}
    >
      <div
        className={`relative flex flex-col transition-colors duration-300 ${
          activeView === "spatial"
            ? "min-h-screen bg-[var(--parlo-canvas)]"
            : "parlo-floating-shell max-w-[1520px] mx-auto min-h-[calc(100vh-1.5rem)] lg:min-h-[calc(100vh-2rem)] sm:rounded-[2rem] overflow-x-clip"
        }`}
      >
        {activeView !== "spatial" && (
          <AtmosphericBackdrop
            languageCode={languageCode}
            activeView={activeView}
            isDark={themeId === "obsidian-glass"}
          />
        )}

        {/* Clean Floating Header (Primary navigation now lives exclusively in the Apple-style MagnificationDock) */}
        <header
          onPointerMove={handleHeaderPointerMove}
          onPointerLeave={handleHeaderPointerLeave}
          className="sticky top-0 z-30 bg-[var(--parlo-shell)]/80 backdrop-blur-xl border-b border-[var(--parlo-border)]/70 parlo-nav-island transition-colors duration-200"
        >
          <div className="max-w-[1360px] mx-auto px-4 sm:px-6 h-16 flex items-center justify-between gap-4 sm:gap-6">
            {/* Brand Mark: 'P' at rest, morphs to cultural motif on hover, locked Parlo font */}
            <ParloLogo
              languageCode={languageCode}
              selectionCount={languageSelectionCount}
              isLive={isSessionActive}
              isSpeaking={live.isPartnerSpeaking}
              parallaxX={headerParallaxX}
              parallaxY={headerParallaxY}
              onClick={() => handleNavigateView("studio")}
            />

          {/* Right Controls: Global culture switcher, surface finish toggle, daily streak & primary action */}
          <div className="flex items-center gap-2 shrink-0">
            <LanguageCultureMenu
              activeLanguageCode={languageCode}
              onSelectLanguage={handleSelectLanguage}
            />

            <motion.button
              type="button"
              whileHover={{ y: -1.5, scale: 1.04 }}
              whileTap={{ scale: 0.95 }}
              onClick={() =>
                setThemeId((prev) =>
                  prev === "obsidian-glass" ? "soft-ceramic" : "obsidian-glass"
                )
              }
              title={
                themeId === "obsidian-glass"
                  ? "Switch to Soft Ceramic (Light)"
                  : "Switch to Obsidian Glass (Dark)"
              }
              aria-label={
                themeId === "obsidian-glass"
                  ? "Switch to Soft Ceramic light mode"
                  : "Switch to Obsidian Glass dark mode"
              }
              className="hidden sm:inline-flex items-center justify-center w-8 h-8 rounded-lg border border-[var(--parlo-border)] bg-[var(--parlo-surface)] text-[var(--parlo-ink-secondary)] hover:text-[var(--parlo-ink)] hover:border-[var(--parlo-primary)] transition-colors shrink-0 cursor-pointer"
            >
              {themeId === "obsidian-glass" ? (
                <Sun className="w-3.5 h-3.5" aria-hidden="true" />
              ) : (
                <Moon className="w-3.5 h-3.5" aria-hidden="true" />
              )}
            </motion.button>

            <motion.button
              type="button"
              whileHover={{ y: -1.5, scale: 1.03 }}
              whileTap={{ scale: 0.97 }}
              onClick={() => handleNavigateView("review")}
              title={
                dailyStreak.practicedToday
                  ? `${dailyStreak.currentStreak}-day streak — practiced today`
                  : dailyStreak.currentStreak > 0
                  ? `${dailyStreak.currentStreak}-day streak — practice today to keep it alive`
                  : "0-day streak — complete a session today to start"
              }
              aria-label={`Daily streak: ${dailyStreak.currentStreak} ${
                dailyStreak.currentStreak === 1 ? "day" : "days"
              }${dailyStreak.practicedToday ? ", practiced today" : ""}`}
              className={`hidden md:inline-flex items-center gap-1.5 px-2.5 py-1.5 text-xs font-mono font-medium rounded-lg border transition-colors whitespace-nowrap shrink-0 tabular-nums cursor-pointer ${
                dailyStreak.practicedToday
                  ? "bg-orange-50 border-orange-200 text-orange-800 hover:bg-orange-100/70"
                  : dailyStreak.currentStreak > 0
                  ? "bg-[var(--parlo-surface)] border-orange-200 text-[var(--parlo-ink)] hover:bg-orange-50/50"
                  : "bg-[var(--parlo-surface)] border-[var(--parlo-border)] text-[var(--parlo-ink-muted)] hover:border-[var(--parlo-ink-muted)]"
              }`}
            >
              <Flame
                className={`w-3.5 h-3.5 ${
                  dailyStreak.practicedToday || dailyStreak.currentStreak > 0
                    ? "text-[var(--parlo-accent)] parlo-flame-active"
                    : "text-[var(--parlo-ink-muted)]"
                }`}
                aria-hidden="true"
              />
              <span>{dailyStreak.currentStreak}d</span>
            </motion.button>

            {isSessionActive ? (
              <motion.button
                type="button"
                whileHover={{ y: -1.5 }}
                whileTap={{ scale: 0.97 }}
                onClick={handleEndSession}
                className="px-4 py-2 text-xs font-semibold text-[var(--parlo-on-solid)] bg-[var(--parlo-ink)] hover:bg-[var(--parlo-primary)] rounded-lg transition-colors whitespace-nowrap shrink-0 cursor-pointer focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[var(--parlo-ink)]"
              >
                End Session
              </motion.button>
            ) : (
              <motion.button
                type="button"
                whileHover={{ y: -1.5 }}
                whileTap={{ scale: 0.97 }}
                onClick={handleStartPractice}
                className="px-4 py-2 text-xs font-semibold text-[var(--parlo-on-solid)] bg-[var(--parlo-primary)] hover:bg-[var(--parlo-primary-hover)] rounded-lg shadow-xs transition-colors whitespace-nowrap shrink-0 cursor-pointer focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[var(--parlo-primary)]"
              >
                Start Practice
              </motion.button>
            )}
          </div>
        </div>
      </header>

      <main className="relative z-10 flex-1" style={{ perspective: "1600px" }}>
        <AnimatePresence mode="wait">
          <motion.div
            key={activeView}
            initial={
              activeView === "spatial"
                ? { opacity: 0 }
                : { opacity: 0, y: 12, rotateX: 1.8 }
            }
            animate={{ opacity: 1, y: 0, rotateX: 0 }}
            exit={
              activeView === "spatial"
                ? { opacity: 0 }
                : { opacity: 0, y: -8, rotateX: -1.2 }
            }
            transition={{ duration: 0.22, ease: [0.16, 1, 0.3, 1] }}
            style={{ transformOrigin: "50% 0%" }}
          >
        {activeView === "studio" && (
          <StudioView
            language={language}
            onSelectLanguage={handleSelectLanguage}
            level={level}
            onSelectLevel={setLevel}
            voiceName={voiceName}
            onSelectVoice={setVoiceName}
            scenario={activeScenario}
            allScenarios={allScenarios}
            categoryFont={categoryFonts.studio}
            onSelectScenario={(sc) => void handleSelectScenario(sc)}
            onOpenScenarios={() => handleNavigateView("scenarios")}
            onOpenSpatial={() => handleNavigateView("spatial")}
            correctionStyle={correctionStyle}
            onChangeCorrectionStyle={setCorrectionStyle}
            speakingPace={speakingPace}
            onChangeSpeakingPace={setSpeakingPace}
            autoCoach={autoCoach}
            onToggleAutoCoach={() => setAutoCoach((prev) => !prev)}
            connectionState={live.connectionState}
            isMuted={live.isMuted}
            isPartnerSpeaking={live.isPartnerSpeaking}
            micAvailable={live.micAvailable}
            errorMessage={live.errorMessage}
            elapsedSeconds={live.elapsedSeconds}
            turns={live.turns}
            userLevelRef={live.userLevelRef}
            partnerLevelRef={live.partnerLevelRef}
            onStartSession={handleStartPractice}
            onEndSession={handleEndSession}
            onToggleMute={live.toggleMute}
            onSendTextTurn={live.sendTextTurn}
            onClearError={live.clearError}
            coachNotes={coachNotes}
            hints={hints}
            loadingHints={loadingHints}
            hintsError={hintsError}
            onRequestHints={handleRequestHints}
            onTranslateTurn={handleTranslateTurn}
            onAnalyzeTurn={handleManualAnalyzeTurn}
            completedGoals={completedGoals}
            onToggleGoal={handleToggleGoal}
            savedPhraseStrings={savedPhraseStrings}
            onSavePhrase={handleSavePhrase}
            lastArchivedSessionId={lastArchivedSessionId}
            onOpenReview={() => handleNavigateView("review")}
          />
        )}

        {activeView === "spatial" && (
          <SpatialSceneView
            language={language}
            scenarioTitle={activeScenario.title}
            connectionState={live.connectionState}
            isPartnerSpeaking={live.isPartnerSpeaking}
            userLevelRef={live.userLevelRef}
            partnerLevelRef={live.partnerLevelRef}
            savedPhraseStrings={savedPhraseStrings}
            onStartSession={handleStartPractice}
            onEndSession={handleEndSession}
            onSendTextTurn={live.sendTextTurn}
            onSavePhrase={handleSavePhrase}
            onOpenStudio={() => handleNavigateView("studio")}
            onSelectLanguage={handleSelectLanguage}
          />
        )}

        {activeView === "scenarios" && (
          <ScenariosView
            scenarios={allScenarios}
            activeScenarioId={activeScenario.id}
            activeLanguageCode={languageCode}
            categoryFont={categoryFonts.scenarios}
            onSelectLanguage={handleSelectLanguage}
            onSelectScenario={handleSelectScenario}
            onCreateScenario={handleCreateScenario}
          />
        )}

        {activeView === "phrasebook" && (
          <PhrasebookView
            phrases={savedPhrases}
            activeLanguageCode={languageCode}
            categoryFont={categoryFonts.phrasebook}
            onSelectLanguage={handleSelectLanguage}
            onAddPhrase={handleSavePhrase}
            onToggleMastered={handleToggleMastered}
            onDeletePhrase={handleDeletePhrase}
          />
        )}

        {activeView === "review" && (
          <ReviewView
            sessions={sessions}
            weeklyGoal={weeklyGoal}
            activeLanguageCode={languageCode}
            categoryFont={categoryFonts.review}
            onSelectLanguage={handleSelectLanguage}
            onChangeWeeklyGoal={handleChangeWeeklyGoal}
            onSaveDebrief={handleSaveDebrief}
            onSavePhrase={handleSavePhrase}
            onStartNewSession={() => handleNavigateView("studio")}
          />
        )}

        {activeView === "pricing" && (
          <PricingSection
            activePlanId={selectedPlanId}
            activeLanguageCode={languageCode}
            categoryFont={categoryFonts.pricing}
            onSelectLanguage={handleSelectLanguage}
            onBookCall={handleSelectPlan}
          />
        )}
          </motion.div>
        </AnimatePresence>
      </main>

      {/* Quiet Footer with Theme Palette Selector & Optional Account Sign-In (hidden in full-bleed 3D Stage) */}
      {activeView !== "spatial" && (
        <footer className="relative z-10 border-t border-[var(--parlo-border)]/70 bg-[var(--parlo-surface)] backdrop-blur-md mt-8 pb-24">
          <div className="max-w-[1360px] mx-auto px-4 sm:px-6 py-4 flex flex-col lg:flex-row items-center justify-between gap-4 text-xs text-[var(--parlo-ink-muted)]">
            <div className="flex flex-wrap items-center gap-2.5">
              <ParloLogo
                languageCode={languageCode}
                size="sm"
                onClick={() => handleNavigateView("studio")}
              />
              <span aria-hidden="true">·</span>
              <button
                type="button"
                onClick={() => handleNavigateView("pricing")}
                className="text-[var(--parlo-ink-secondary)] hover:text-[var(--parlo-ink)] underline-offset-2 hover:underline cursor-pointer"
              >
                Plans & Pricing
              </button>
              <span aria-hidden="true">·</span>
              <button
                type="button"
                onClick={() => setCommandOpen(true)}
                className="inline-flex items-center gap-1 px-2 py-1 text-[11px] font-mono text-[var(--parlo-ink-secondary)] bg-[var(--parlo-canvas)] border border-[var(--parlo-border)] hover:border-[var(--parlo-ink-muted)] hover:text-[var(--parlo-ink)] rounded-md transition-colors cursor-pointer"
                title="Open Quick Studio Launcher (Cmd/Ctrl + K)"
              >
                <Command className="w-3 h-3" aria-hidden="true" />
                <span>K Quick Jump</span>
              </button>
            </div>

            {/* Unified Adaptive Surface Finish Toggle (Obsidian Glass / Soft Ceramic) */}
            <div
              className="flex flex-wrap items-center justify-center gap-1.5"
              role="group"
              aria-label="Studio surface finish"
            >
              {PARLO_THEMES.map((palette) => {
                const active = palette.id === themeId;
                const swatches =
                  palette.mode === "dark"
                    ? [
                        "#0C0C0F",
                        "#EBEBEB",
                        activeCulture.darkPrimaryHex,
                        activeCulture.darkAccentHex,
                      ]
                    : [
                        activeCulture.canvasHex,
                        activeCulture.inkHex,
                        activeCulture.primaryHex,
                        activeCulture.accentHex,
                      ];

                return (
                  <motion.button
                    key={palette.id}
                    type="button"
                    whileHover={{ y: -1.5 }}
                    whileTap={{ scale: 0.97 }}
                    onClick={() => setThemeId(palette.id)}
                    aria-pressed={active}
                    title={`${palette.name} (${activeCulture.atelierName}) — ${palette.tagline}`}
                    className={`relative inline-flex items-center gap-2 px-3 py-1.5 rounded-lg border text-xs transition-colors whitespace-nowrap cursor-pointer ${
                      active
                        ? "border-[var(--parlo-ink)] text-[var(--parlo-ink)] font-medium"
                        : "border-[var(--parlo-border)] bg-[var(--parlo-surface)] text-[var(--parlo-ink-muted)] hover:border-[var(--parlo-ink-muted)] hover:text-[var(--parlo-ink)]"
                    }`}
                  >
                    {active && (
                      <motion.span
                        layoutId="parlo-theme-active"
                        transition={{
                          type: "spring",
                          stiffness: 420,
                          damping: 32,
                        }}
                        className="absolute inset-0 rounded-[7px] bg-[var(--parlo-canvas)] -z-0"
                      />
                    )}
                    <span
                      className="relative z-10 inline-flex items-center -space-x-0.5"
                      aria-hidden="true"
                    >
                      {swatches.map((hex, idx) => (
                        <span
                          key={`${palette.id}-${idx}`}
                          className="w-2.5 h-2.5 rounded-full border border-black/20"
                          style={{ backgroundColor: hex }}
                        />
                      ))}
                    </span>
                    <span className="relative z-10">
                      {palette.name} · {activeCulture.atelierName}
                    </span>
                  </motion.button>
                );
              })}
            </div>

            <div className="flex flex-wrap items-center gap-3">
              {authError && (
                <button
                  type="button"
                  onClick={clearAuthError}
                  className="text-red-700 hover:underline cursor-pointer"
                >
                  {authError}
                </button>
              )}

              {user ? (
                <div className="flex items-center gap-3">
                  <span className="text-[var(--parlo-ink-muted)]">
                    Signed in as{" "}
                    <span className="font-medium text-[var(--parlo-ink)]">
                      {user.displayName || user.email}
                    </span>
                  </span>
                  <button
                    type="button"
                    onClick={() => void logout()}
                    className="inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium text-[var(--parlo-ink)] bg-[var(--parlo-canvas)] border border-[var(--parlo-border)] hover:border-[var(--parlo-ink-muted)] rounded-md transition-colors whitespace-nowrap cursor-pointer"
                  >
                    <LogOut className="w-3.5 h-3.5" aria-hidden="true" />
                    Sign out
                  </button>
                </div>
              ) : (
                <button
                  type="button"
                  onClick={() => void signInWithGoogle()}
                  className="inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium text-[var(--parlo-ink)] bg-[var(--parlo-canvas)] border border-[var(--parlo-border)] hover:border-[var(--parlo-ink-muted)] rounded-md transition-colors whitespace-nowrap cursor-pointer"
                >
                  <LogIn className="w-3.5 h-3.5" aria-hidden="true" />
                  Sign in with Google to save progress
                </button>
              )}
            </div>
          </div>
        </footer>
      )}

      <MagnificationDock
        activeView={activeView}
        onNavigate={handleNavigateView}
        categoryFonts={categoryFonts}
        activeLanguageCode={languageCode}
        isSessionActive={isSessionActive}
        savedPhrasesCount={savedPhrases.length}
        onToggleVoiceSession={() => {
          if (isSessionActive) {
            void handleEndSession();
          } else {
            handleStartPractice();
          }
        }}
        onOpenCommandPalette={() => setCommandOpen(true)}
        onSpeakCultureProverb={() =>
          speakWithBrowserTts(
            activeCulture.culturalProverb,
            language.speechLocale
          )
        }
      />

      <CommandPalette
        open={commandOpen}
        onClose={() => setCommandOpen(false)}
        activeView={activeView}
        activeLanguageCode={languageCode}
        activeLevel={level}
        activeThemeId={themeId}
        isSessionActive={isSessionActive}
        scenarios={allScenarios}
        onNavigate={handleNavigateView}
        onSelectLanguage={handleSelectLanguage}
        onSelectLevel={setLevel}
        onSelectScenario={(sc) => void handleSelectScenario(sc)}
        onSelectTheme={setThemeId}
        onToggleSession={() => {
          if (isSessionActive) {
            void handleEndSession();
          } else {
            handleStartPractice();
          }
        }}
      />
      </div>
    </div>
  );
}
