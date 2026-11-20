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
import { OnboardingFlow } from "./components/OnboardingFlow";
import { ParloLogo } from "./components/ParloLogo";
import { ParloTutorChat } from "./components/ParloTutorChat";
import { PhrasebookView } from "./components/PhrasebookView";
import { PricingSection } from "./components/PricingSection";
import { ReviewView } from "./components/ReviewView";
import { ScenariosView } from "./components/ScenariosView";
import { SoundscapePanel } from "./components/SoundscapePanel";
import { SpatialSceneView } from "./components/SpatialSceneView";
import { StudioView } from "./components/StudioView";
import { getLanguageByCode, SCENARIOS } from "./data/catalog";
import { useAuth } from "./hooks/useAuth";
import { useLivePartner } from "./hooks/useLivePartner";
import { ambientEngine, SoundscapeLayerId } from "./lib/ambientAudio";
import { speakWithBrowserTts } from "./lib/audio";
import { getDailyCulturalMission } from "./lib/dailyMission";
import { getDialectById, getDialectsForLanguage } from "./lib/dialects";
import { syncDocumentSeo } from "./lib/seo";
import { sfxEngine } from "./lib/sfx";
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
const SFX_STORAGE_KEY = "parlo_sfx_enabled_v1";
const AMBIENT_VOL_STORAGE_KEY = "parlo_ambient_volume_v1";
const ONBOARDING_DONE_KEY = "parlo_onboarding_completed_v1";
const DIALECT_STORAGE_KEY = "parlo_dialect_by_lang_v1";
const DAILY_MISSION_STORAGE_KEY = "parlo_daily_missions_v1";

function readStorage<T>(key: string, fallback: T): T {
  try {
    const raw = localStorage.getItem(key);
    return raw ? (JSON.parse(raw) as T) : fallback;
  } catch {
    return fallback;
  }
}

const VIEW_ORDER: AppView[] = [
  "studio",
  "spatial",
  "scenarios",
  "phrasebook",
  "review",
  "pricing",
];

export default function App() {
  const [activeView, setActiveView] = useState<AppView>("studio");
  const [viewDirection, setViewDirection] = useState<number>(1);
  const [categoryFonts, setCategoryFonts] = useState<
    Record<AppView, CountryFontSpec>
  >(() => createInitialCategoryFonts());
  const { user, authError, signInWithGoogle, logout, getToken, clearAuthError } =
    useAuth();

  const handleNavigateView = useCallback((view: AppView) => {
    setActiveView((prev) => {
      if (prev !== view) {
        const prevIdx = VIEW_ORDER.indexOf(prev);
        const nextIdx = VIEW_ORDER.indexOf(view);
        setViewDirection(nextIdx >= prevIdx ? 1 : -1);
        sfxEngine.playNav();
      }
      return view;
    });
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
  const [chatOpen, setChatOpen] = useState<boolean>(false);
  const [chatMessageCount, setChatMessageCount] = useState<number>(0);
  const [soundPanelOpen, setSoundPanelOpen] = useState<boolean>(false);
  const [onboardingOpen, setOnboardingOpen] = useState<boolean>(
    () => !readStorage<boolean>(ONBOARDING_DONE_KEY, false)
  );
  const [activeSoundLayers, setActiveSoundLayers] = useState<
    SoundscapeLayerId[]
  >([]);
  const [ambientVolume, setAmbientVolume] = useState<number>(() => {
    const stored = readStorage<number>(AMBIENT_VOL_STORAGE_KEY, 0.28);
    return typeof stored === "number" && stored >= 0.04 && stored <= 0.65
      ? stored
      : 0.28;
  });
  const [sfxEnabled, setSfxEnabled] = useState<boolean>(() => {
    const stored = readStorage<boolean>(SFX_STORAGE_KEY, true);
    return typeof stored === "boolean" ? stored : true;
  });
  const [themeId, setThemeId] = useState<ThemeId>(() => {
    const stored = readStorage<string>(THEME_STORAGE_KEY, DEFAULT_THEME_ID);
    return PARLO_THEMES.some((t) => t.id === stored)
      ? (stored as ThemeId)
      : DEFAULT_THEME_ID;
  });

  // Sync procedural SFX & Soundscape Mixer engines
  useEffect(() => {
    sfxEngine.setEnabled(sfxEnabled);
    try {
      localStorage.setItem(SFX_STORAGE_KEY, JSON.stringify(sfxEnabled));
    } catch {
      // ignore storage errors
    }
  }, [sfxEnabled]);

  useEffect(() => {
    ambientEngine.setVolume(ambientVolume);
    try {
      localStorage.setItem(
        AMBIENT_VOL_STORAGE_KEY,
        JSON.stringify(ambientVolume)
      );
    } catch {
      // ignore storage errors
    }
  }, [ambientVolume]);

  useEffect(() => {
    ambientEngine.syncLayers(activeSoundLayers);
  }, [activeSoundLayers]);

  useEffect(() => {
    return () => {
      ambientEngine.muteAll();
    };
  }, []);

  const handleToggleSoundPanel = useCallback(() => {
    setSoundPanelOpen((prev) => {
      const next = !prev;
      if (next) sfxEngine.playOpenModal();
      else sfxEngine.playCloseModal();
      return next;
    });
  }, []);

  const handleToggleSoundLayer = useCallback((id: SoundscapeLayerId) => {
    setActiveSoundLayers((prev) => {
      const willEnable = !prev.includes(id);
      sfxEngine.playToggle(willEnable);
      return willEnable ? [...prev, id] : prev.filter((l) => l !== id);
    });
  }, []);

  const handleMuteAllSoundLayers = useCallback(() => {
    setActiveSoundLayers([]);
    sfxEngine.playToggle(false);
  }, []);

  const handleToggleSfx = useCallback(() => {
    setSfxEnabled((prev) => {
      const next = !prev;
      sfxEngine.setEnabled(next);
      if (next) {
        sfxEngine.playToggle(true);
      }
      return next;
    });
  }, []);

  const handleToggleChat = useCallback(() => {
    setChatOpen((prev) => {
      const next = !prev;
      if (next) sfxEngine.playOpenModal();
      else sfxEngine.playCloseModal();
      return next;
    });
  }, []);

  const handleToggleCommandPalette = useCallback(() => {
    setCommandOpen((prev) => {
      const next = !prev;
      if (next) sfxEngine.playOpenModal();
      else sfxEngine.playCloseModal();
      return next;
    });
  }, []);

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
        handleToggleCommandPalette();
        return;
      }
      if ((e.metaKey || e.ctrlKey) && e.key.toLowerCase() === "j") {
        e.preventDefault();
        handleToggleChat();
        return;
      }
      if ((e.metaKey || e.ctrlKey) && e.key.toLowerCase() === "m") {
        e.preventDefault();
        handleToggleSoundPanel();
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
  }, [
    handleNavigateView,
    handleToggleChat,
    handleToggleCommandPalette,
    handleToggleSoundPanel,
  ]);

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
  const [dialectByLanguage, setDialectByLanguage] = useState<
    Record<string, string>
  >(() => readStorage<Record<string, string>>(DIALECT_STORAGE_KEY, {}));
  const [completedMissions, setCompletedMissions] = useState<
    Record<string, boolean>
  >(() => readStorage<Record<string, boolean>>(DAILY_MISSION_STORAGE_KEY, {}));

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

  const activeDialects = useMemo(
    () => getDialectsForLanguage(languageCode),
    [languageCode]
  );

  const activeDialect = useMemo(
    () => getDialectById(languageCode, dialectByLanguage[languageCode]),
    [dialectByLanguage, languageCode]
  );

  const dailyMission = useMemo(
    () => getDailyCulturalMission(languageCode, level),
    [languageCode, level]
  );
  const dailyMissionCompleted = Boolean(completedMissions[dailyMission.id]);

  const handleSelectDialect = useCallback(
    (dialectId: string) => {
      sfxEngine.playToggle(true);
      setDialectByLanguage((prev) => ({ ...prev, [languageCode]: dialectId }));
    },
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

  // Sync dynamic document title, meta description, OpenGraph, Twitter & canonical URL
  useEffect(() => {
    syncDocumentSeo({
      activeView,
      languageName: language.name,
      cultureAtelier: activeCulture.atelierName,
      scenarioTitle: activeScenario.title,
    });
  }, [activeCulture.atelierName, activeScenario.title, activeView, language.name]);

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

  useEffect(() => {
    try {
      localStorage.setItem(
        DIALECT_STORAGE_KEY,
        JSON.stringify(dialectByLanguage)
      );
    } catch {
      // ignore quota issues
    }
  }, [dialectByLanguage]);

  useEffect(() => {
    try {
      localStorage.setItem(
        DAILY_MISSION_STORAGE_KEY,
        JSON.stringify(completedMissions)
      );
    } catch {
      // ignore quota issues
    }
  }, [completedMissions]);

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
          dialectLabel: activeDialect.label,
          dialectDirective: activeDialect.speechStyleDirective,
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
    [
      activeDialect.label,
      activeDialect.speechStyleDirective,
      activeScenario.goals,
      activeScenario.title,
      language.name,
      level,
    ]
  );

  const live = useLivePartner({
    language,
    level,
    voiceName,
    scenario: activeScenario,
    correctionStyle,
    speakingPace,
    dialectLabel: activeDialect.label,
    dialectDirective: activeDialect.speechStyleDirective,
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

  // Gently auto-duck soundscapes whenever the live voice partner speaks
  useEffect(() => {
    ambientEngine.setDucked(live.isPartnerSpeaking);
  }, [live.isPartnerSpeaking]);

  const handleStartPractice = useCallback(() => {
    sfxEngine.playSessionStart();
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
    sfxEngine.playSessionEnd();
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

      if (
        record.userTurnsCount >= dailyMission.targetTurns &&
        !completedMissions[dailyMission.id]
      ) {
        setCompletedMissions((prev) => ({
          ...prev,
          [dailyMission.id]: true,
        }));
        sfxEngine.playSavePhrase();
      }

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
    completedMissions,
    dailyMission.id,
    dailyMission.targetTurns,
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
        dialectLabel: activeDialect.label,
        dialectDirective: activeDialect.speechStyleDirective,
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
    activeDialect.label,
    activeDialect.speechStyleDirective,
    activeScenario.promptContext,
    activeScenario.title,
    language.name,
    level,
    live.turns,
  ]);

  const [pendingMissionStart, setPendingMissionStart] = useState(false);

  const handleStartDailyMission = useCallback(async () => {
    if (
      live.connectionState === "live" ||
      live.connectionState === "connecting"
    ) {
      await live.stopSession();
    }
    const targetScenario =
      allScenarios.find((s) => s.id === dailyMission.scenarioId) ??
      activeScenario;
    setActiveScenarioId(targetScenario.id);
    setVoiceName(targetScenario.defaultVoice);
    setCoachNotes([]);
    setHints([]);
    setHintsError(null);
    setCompletedGoals([]);
    setLastArchivedSessionId(null);
    live.resetTranscript();
    setActiveView("studio");
    setPendingMissionStart(true);
  }, [activeScenario, allScenarios, dailyMission.scenarioId, live]);

  useEffect(() => {
    if (!pendingMissionStart) return;
    setPendingMissionStart(false);
    sfxEngine.playSessionStart();
    void live.startSession();
  }, [live, pendingMissionStart]);

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
      sfxEngine.playCultureMorph(code);
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
        sfxEngine.playSavePhrase();
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
            if (nextMastered) sfxEngine.playSavePhrase();
            else sfxEngine.playToggle(false);
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
      sfxEngine.playToggle(false);
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
    setCompletedGoals((prev) => {
      const removing = prev.includes(index);
      if (removing) sfxEngine.playToggle(false);
      else sfxEngine.playSavePhrase();
      return removing ? prev.filter((i) => i !== index) : [...prev, index];
    });
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

  const handleCompleteOnboarding = useCallback(
    (launchVoice: boolean) => {
      setOnboardingOpen(false);
      try {
        localStorage.setItem(ONBOARDING_DONE_KEY, JSON.stringify(true));
      } catch {
        // ignore storage errors
      }
      if (launchVoice) {
        handleStartPractice();
      } else {
        sfxEngine.playSavePhrase();
      }
    },
    [handleStartPractice]
  );

  const handleSkipOnboarding = useCallback(() => {
    setOnboardingOpen(false);
    sfxEngine.playCloseModal();
    try {
      localStorage.setItem(ONBOARDING_DONE_KEY, JSON.stringify(true));
    } catch {
      // ignore storage errors
    }
  }, []);

  const handleOpenOnboarding = useCallback(() => {
    sfxEngine.playOpenModal();
    setOnboardingOpen(true);
  }, []);

  const handleToggleTheme = useCallback(() => {
    setThemeId((prev) => {
      const next =
        prev === "obsidian-glass" ? "soft-ceramic" : "obsidian-glass";
      sfxEngine.playToggle(next === "soft-ceramic");
      return next;
    });
  }, []);

  return (
    <div
      className={`min-h-screen parlo-viewport-stage text-[var(--parlo-ink)] transition-colors duration-300 ${
        activeView === "spatial" ? "" : "sm:p-3 lg:p-4"
      }`}
    >
      <a
        href="#main-content"
        className="sr-only focus:not-sr-only focus:fixed focus:top-3 focus:left-3 focus:z-[60] focus:px-4 focus:py-2 focus:rounded-xl focus:bg-[var(--parlo-primary)] focus:text-[var(--parlo-on-solid)] focus:text-xs focus:font-semibold focus:shadow-lg"
      >
        Skip to main content
      </a>

      <div
        className={`relative flex flex-col transition-colors duration-300 ${
          activeView === "spatial"
            ? "min-h-screen bg-[var(--parlo-canvas)]"
            : "parlo-floating-shell max-w-[1520px] mx-auto min-h-[calc(100dvh)] sm:min-h-[calc(100vh-1.5rem)] lg:min-h-[calc(100vh-2rem)] sm:rounded-[2rem] overflow-x-clip"
        }`}
      >
        {activeView !== "spatial" && (
          <AtmosphericBackdrop
            languageCode={languageCode}
            activeView={activeView}
            isDark={themeId === "obsidian-glass"}
          />
        )}

        {/* Clean Floating Header (Compact 54px on phones to stay well inside 15% sticky budget) */}
        <header
          onPointerMove={handleHeaderPointerMove}
          onPointerLeave={handleHeaderPointerLeave}
          className="sticky top-0 z-30 bg-[var(--parlo-shell)]/84 backdrop-blur-xl border-b border-[var(--parlo-border)]/70 parlo-nav-island transition-colors duration-200"
        >
          <div className="max-w-[1360px] mx-auto px-3 sm:px-6 h-14 sm:h-16 flex items-center justify-between gap-2 sm:gap-6">
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
          <div className="flex items-center gap-1.5 sm:gap-2 shrink-0">
            <LanguageCultureMenu
              activeLanguageCode={languageCode}
              onSelectLanguage={handleSelectLanguage}
            />

            <motion.button
              type="button"
              whileHover={{ y: -1.5, scale: 1.04 }}
              whileTap={{ scale: 0.95 }}
              onClick={handleToggleTheme}
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
              className="hidden sm:inline-flex items-center justify-center w-8 h-8 rounded-lg border border-[var(--parlo-border)] bg-[var(--parlo-surface)] text-[var(--parlo-ink-secondary)] hover:text-[var(--parlo-ink)] hover:border-[var(--parlo-primary)] transition-colors shrink-0 cursor-pointer overflow-hidden"
            >
              <AnimatePresence mode="wait" initial={false}>
                <motion.span
                  key={themeId}
                  initial={{ opacity: 0, rotate: -45, scale: 0.65 }}
                  animate={{ opacity: 1, rotate: 0, scale: 1 }}
                  exit={{ opacity: 0, rotate: 45, scale: 0.65 }}
                  transition={{ duration: 0.18, ease: [0.16, 1, 0.3, 1] }}
                  className="inline-flex items-center justify-center"
                >
                  {themeId === "obsidian-glass" ? (
                    <Sun className="w-3.5 h-3.5" aria-hidden="true" />
                  ) : (
                    <Moon className="w-3.5 h-3.5" aria-hidden="true" />
                  )}
                </motion.span>
              </AnimatePresence>
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
                  ? "bg-[color-mix(in_srgb,var(--parlo-accent)_14%,var(--parlo-surface))] border-[var(--parlo-accent-border)] text-[var(--parlo-accent)] hover:bg-[color-mix(in_srgb,var(--parlo-accent)_22%,var(--parlo-surface))]"
                  : dailyStreak.currentStreak > 0
                  ? "bg-[var(--parlo-surface)] border-[var(--parlo-accent-border)] text-[var(--parlo-ink)] hover:bg-[color-mix(in_srgb,var(--parlo-accent)_10%,var(--parlo-surface))]"
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

            <AnimatePresence mode="wait" initial={false}>
              {isSessionActive ? (
                <motion.button
                  key="header-end-session"
                  type="button"
                  initial={{ opacity: 0, scale: 0.92, y: 4 }}
                  animate={{ opacity: 1, scale: 1, y: 0 }}
                  exit={{ opacity: 0, scale: 0.92, y: -4 }}
                  whileHover={{ y: -1.5 }}
                  whileTap={{ scale: 0.97 }}
                  transition={{ duration: 0.16, ease: [0.16, 1, 0.3, 1] }}
                  onClick={handleEndSession}
                  className="px-3 sm:px-4 py-1.5 sm:py-2 text-xs font-semibold text-[var(--parlo-on-solid)] bg-[var(--parlo-ink)] hover:bg-[var(--parlo-primary)] rounded-lg transition-colors whitespace-nowrap shrink-0 cursor-pointer focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[var(--parlo-ink)]"
                >
                  End
                  <span className="hidden sm:inline"> Session</span>
                </motion.button>
              ) : (
                <motion.button
                  key="header-start-practice"
                  type="button"
                  initial={{ opacity: 0, scale: 0.92, y: 4 }}
                  animate={{ opacity: 1, scale: 1, y: 0 }}
                  exit={{ opacity: 0, scale: 0.92, y: -4 }}
                  whileHover={{ y: -1.5 }}
                  whileTap={{ scale: 0.97 }}
                  transition={{ duration: 0.16, ease: [0.16, 1, 0.3, 1] }}
                  onClick={handleStartPractice}
                  className="px-3 sm:px-4 py-1.5 sm:py-2 text-xs font-semibold text-[var(--parlo-on-solid)] bg-[var(--parlo-primary)] hover:bg-[var(--parlo-primary-hover)] rounded-lg shadow-xs transition-colors whitespace-nowrap shrink-0 cursor-pointer focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[var(--parlo-primary)]"
                >
                  <span className="sm:hidden">Practice</span>
                  <span className="hidden sm:inline">Start Practice</span>
                </motion.button>
              )}
            </AnimatePresence>
          </div>
        </div>
      </header>

      <main
        id="main-content"
        className="relative z-10 flex-1"
        style={{ perspective: "1600px" }}
      >
        <AnimatePresence mode="wait" initial={false}>
          <motion.div
            key={activeView}
            initial={
              activeView === "spatial"
                ? { opacity: 0, scale: 0.985 }
                : {
                    opacity: 0,
                    x: viewDirection * 22,
                    y: 8,
                    scale: 0.992,
                    filter: "blur(3px)",
                  }
            }
            animate={{
              opacity: 1,
              x: 0,
              y: 0,
              scale: 1,
              filter: "blur(0px)",
            }}
            exit={
              activeView === "spatial"
                ? { opacity: 0, scale: 0.985 }
                : {
                    opacity: 0,
                    x: viewDirection * -20,
                    y: -6,
                    scale: 0.99,
                    filter: "blur(3px)",
                  }
            }
            transition={{ duration: 0.24, ease: [0.16, 1, 0.3, 1] }}
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
            dialects={activeDialects}
            activeDialectId={activeDialect.id}
            onSelectDialect={handleSelectDialect}
            dailyMission={dailyMission}
            dailyMissionCompleted={dailyMissionCompleted}
            onStartDailyMission={() => void handleStartDailyMission()}
            activeSoundLayers={activeSoundLayers}
            onToggleSoundLayer={handleToggleSoundLayer}
            onOpenSoundscapePanel={handleToggleSoundPanel}
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
            dailyMission={dailyMission}
            dailyMissionCompleted={dailyMissionCompleted}
            onStartDailyMission={() => void handleStartDailyMission()}
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
      <AnimatePresence>
        {activeView !== "spatial" && (
          <motion.footer
            key="parlo-footer"
            initial={{ opacity: 0, y: 12 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: 12 }}
            transition={{ duration: 0.2, ease: [0.16, 1, 0.3, 1] }}
            className="relative z-10 border-t border-[var(--parlo-border)]/70 bg-[var(--parlo-surface)] backdrop-blur-md mt-8 pb-24 md:pb-20"
          >
          <div className="max-w-[1360px] mx-auto px-4 sm:px-6 py-4 flex flex-col lg:flex-row items-center justify-between gap-4 text-xs text-[var(--parlo-ink-muted)]">
            <div className="flex flex-wrap items-center justify-center sm:justify-start gap-2.5">
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
                onClick={handleOpenOnboarding}
                className="text-[var(--parlo-ink-secondary)] hover:text-[var(--parlo-ink)] underline-offset-2 hover:underline cursor-pointer"
              >
                Setup Guide
              </button>
              <span aria-hidden="true">·</span>
              <button
                type="button"
                onClick={handleToggleCommandPalette}
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
                    onClick={() => {
                      if (themeId !== palette.id) {
                        sfxEngine.playToggle(palette.mode === "light");
                        setThemeId(palette.id);
                      }
                    }}
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
        </motion.footer>
        )}
      </AnimatePresence>

      <MagnificationDock
        activeView={activeView}
        onNavigate={handleNavigateView}
        categoryFonts={categoryFonts}
        activeLanguageCode={languageCode}
        isSessionActive={isSessionActive}
        savedPhrasesCount={savedPhrases.length}
        chatOpen={chatOpen}
        chatMessageCount={chatMessageCount}
        soundPanelOpen={soundPanelOpen}
        activeSoundLayersCount={activeSoundLayers.length}
        isDarkTheme={themeId === "obsidian-glass"}
        onToggleTheme={handleToggleTheme}
        onOpenOnboarding={handleOpenOnboarding}
        onToggleChat={handleToggleChat}
        onToggleSoundPanel={handleToggleSoundPanel}
        onToggleVoiceSession={() => {
          if (isSessionActive) {
            void handleEndSession();
          } else {
            handleStartPractice();
          }
        }}
        onOpenCommandPalette={handleToggleCommandPalette}
        onSpeakCultureProverb={() => {
          sfxEngine.playNav();
          speakWithBrowserTts(
            activeCulture.culturalProverb,
            language.speechLocale
          );
        }}
      />

      <OnboardingFlow
        open={onboardingOpen}
        languageCode={languageCode}
        level={level}
        voiceName={voiceName}
        speakingPace={speakingPace}
        weeklyGoal={weeklyGoal}
        activeScenarioId={activeScenario.id}
        scenarios={allScenarios}
        activeSoundLayers={activeSoundLayers}
        sfxEnabled={sfxEnabled}
        onSelectLanguage={handleSelectLanguage}
        onSelectLevel={setLevel}
        onSelectVoice={setVoiceName}
        onChangeSpeakingPace={setSpeakingPace}
        onChangeWeeklyGoal={handleChangeWeeklyGoal}
        onSelectScenario={(sc) => {
          setActiveScenarioId(sc.id);
          setVoiceName(sc.defaultVoice);
          setCoachNotes([]);
          setHints([]);
          setHintsError(null);
          setCompletedGoals([]);
        }}
        onToggleSoundLayer={handleToggleSoundLayer}
        onToggleSfx={handleToggleSfx}
        onComplete={handleCompleteOnboarding}
        onSkip={handleSkipOnboarding}
      />

      <SoundscapePanel
        open={soundPanelOpen}
        onClose={() => {
          setSoundPanelOpen(false);
          sfxEngine.playCloseModal();
        }}
        activeLayers={activeSoundLayers}
        ambientVolume={ambientVolume}
        sfxEnabled={sfxEnabled}
        activeLanguageCode={languageCode}
        onToggleLayer={handleToggleSoundLayer}
        onMuteAllLayers={handleMuteAllSoundLayers}
        onChangeAmbientVolume={setAmbientVolume}
        onToggleSfx={handleToggleSfx}
      />

      <ParloTutorChat
        open={chatOpen}
        onClose={() => {
          setChatOpen(false);
          sfxEngine.playCloseModal();
        }}
        language={language}
        level={level}
        scenario={activeScenario}
        dialectLabel={activeDialect.label}
        dialectDirective={activeDialect.speechStyleDirective}
        savedPhraseStrings={savedPhraseStrings}
        onSavePhrase={handleSavePhrase}
        onMessageCountChange={setChatMessageCount}
      />

      <CommandPalette
        open={commandOpen}
        onClose={() => {
          setCommandOpen(false);
          sfxEngine.playCloseModal();
        }}
        activeView={activeView}
        activeLanguageCode={languageCode}
        activeLevel={level}
        activeThemeId={themeId}
        isSessionActive={isSessionActive}
        chatOpen={chatOpen}
        soundPanelOpen={soundPanelOpen}
        scenarios={allScenarios}
        onNavigate={handleNavigateView}
        onSelectLanguage={handleSelectLanguage}
        onSelectLevel={setLevel}
        onSelectScenario={(sc) => void handleSelectScenario(sc)}
        onSelectTheme={(id) => {
          sfxEngine.playToggle(id === "soft-ceramic");
          setThemeId(id);
        }}
        onToggleChat={handleToggleChat}
        onToggleSoundPanel={handleToggleSoundPanel}
        onOpenOnboarding={handleOpenOnboarding}
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
