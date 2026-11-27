import { PracticeSessionRecord, SavedPhrase, Scenario } from "../types";

export const LEGACY_STORAGE_KEYS = {
  phrases: "parlo_saved_phrases_v1",
  sessions: "parlo_practice_sessions_v1",
  customScenarios: "parlo_custom_scenarios_v1",
  weeklyGoal: "parlo_weekly_goal_v1",
  dialects: "parlo_dialect_by_lang_v1",
  dailyMissions: "parlo_daily_missions_v1",
  srs: "parlo_srs_schedule_v1",
} as const;

export interface ScopedLearningData {
  savedPhrases: SavedPhrase[];
  sessions: PracticeSessionRecord[];
  customScenarios: Scenario[];
  weeklyGoal: number;
  dialectByLanguage: Record<string, string>;
  completedMissions: Record<string, boolean>;
}

export interface GuestMigrationSummary {
  newSessionsCount: number;
  newPhrasesCount: number;
  newScenariosCount: number;
  totalItems: number;
}

export function getStorageScope(uid?: string | null): string {
  return uid ? `uid:${uid}` : "guest";
}

export function scopedKey(scope: string, bucket: string): string {
  return `parlo:v2:${scope}:${bucket}`;
}

export function safeReadJson<T>(
  storage: Pick<Storage, "getItem"> | undefined,
  key: string,
  fallback: T
): T {
  if (!storage) return fallback;
  try {
    const raw = storage.getItem(key);
    return raw ? (JSON.parse(raw) as T) : fallback;
  } catch {
    return fallback;
  }
}

export function safeWriteJson(
  storage: Pick<Storage, "setItem"> | undefined,
  key: string,
  value: unknown
): void {
  if (!storage) return;
  try {
    storage.setItem(key, JSON.stringify(value));
  } catch {
    // ignore quota errors
  }
}

/**
 * Generates collision-resistant client IDs for sessions, phrases, and custom scenarios.
 */
export function generateClientId(prefix: string): string {
  if (
    typeof crypto !== "undefined" &&
    typeof crypto.randomUUID === "function"
  ) {
    return `${prefix}-${crypto.randomUUID()}`;
  }
  return `${prefix}-${Date.now()}-${Math.random().toString(36).slice(2, 10)}`;
}

/**
 * One-time non-destructive migration of legacy v1 global keys into the guest scope
 * when the guest scope has not yet been initialized.
 */
export function migrateLegacyV1ToGuest(
  storage: Pick<Storage, "getItem" | "setItem"> | undefined
): void {
  if (!storage) return;
  const sentinelKey = "parlo:v2:legacy_migrated";
  if (storage.getItem(sentinelKey) === "1") return;

  const mappings: Array<[string, string]> = [
    [LEGACY_STORAGE_KEYS.phrases, scopedKey("guest", "phrases")],
    [LEGACY_STORAGE_KEYS.sessions, scopedKey("guest", "sessions")],
    [LEGACY_STORAGE_KEYS.customScenarios, scopedKey("guest", "custom_scenarios")],
    [LEGACY_STORAGE_KEYS.weeklyGoal, scopedKey("guest", "weekly_goal")],
    [LEGACY_STORAGE_KEYS.dialects, scopedKey("guest", "dialects")],
    [LEGACY_STORAGE_KEYS.dailyMissions, scopedKey("guest", "daily_missions")],
    [LEGACY_STORAGE_KEYS.srs, scopedKey("guest", "srs")],
  ];

  for (const [legacyKey, nextKey] of mappings) {
    try {
      const existingNext = storage.getItem(nextKey);
      const legacyVal = storage.getItem(legacyKey);
      if (!existingNext && legacyVal) {
        storage.setItem(nextKey, legacyVal);
      }
    } catch {
      // ignore storage errors
    }
  }

  try {
    storage.setItem(sentinelKey, "1");
  } catch {
    // ignore storage errors
  }
}

export function readScopedLearningData(
  scope: string,
  storage?: Pick<Storage, "getItem">
): ScopedLearningData {
  const store =
    storage ?? (typeof localStorage !== "undefined" ? localStorage : undefined);
  const rawGoal = safeReadJson<number>(
    store,
    scopedKey(scope, "weekly_goal"),
    4
  );

  return {
    savedPhrases: safeReadJson<SavedPhrase[]>(
      store,
      scopedKey(scope, "phrases"),
      []
    ),
    sessions: safeReadJson<PracticeSessionRecord[]>(
      store,
      scopedKey(scope, "sessions"),
      []
    ),
    customScenarios: safeReadJson<Scenario[]>(
      store,
      scopedKey(scope, "custom_scenarios"),
      []
    ),
    weeklyGoal:
      typeof rawGoal === "number" && rawGoal >= 1 && rawGoal <= 14
        ? rawGoal
        : 4,
    dialectByLanguage: safeReadJson<Record<string, string>>(
      store,
      scopedKey(scope, "dialects"),
      {}
    ),
    completedMissions: safeReadJson<Record<string, boolean>>(
      store,
      scopedKey(scope, "daily_missions"),
      {}
    ),
  };
}

export function writeScopedCollection(
  scope: string,
  bucket: string,
  value: unknown,
  storage?: Pick<Storage, "setItem">
): void {
  const store =
    storage ?? (typeof localStorage !== "undefined" ? localStorage : undefined);
  safeWriteJson(store, scopedKey(scope, bucket), value);
}

/**
 * Computes how many guest items are not yet present in the signed-in account,
 * so the UI can ask the user explicitly before importing guest data.
 */
export function computeGuestMigrationSummary(
  guestData: Pick<
    ScopedLearningData,
    "sessions" | "savedPhrases" | "customScenarios"
  >,
  accountData: Pick<
    ScopedLearningData,
    "sessions" | "savedPhrases" | "customScenarios"
  >
): GuestMigrationSummary {
  const accountSessionIds = new Set(accountData.sessions.map((s) => s.id));
  const accountPhraseIds = new Set(accountData.savedPhrases.map((p) => p.id));
  const accountPhraseTexts = new Set(
    accountData.savedPhrases.map(
      (p) => `${p.languageCode}:${p.phrase.trim().toLowerCase()}`
    )
  );
  const accountScenarioIds = new Set(
    accountData.customScenarios.map((sc) => sc.id)
  );

  const newSessionsCount = guestData.sessions.filter(
    (s) => !accountSessionIds.has(s.id)
  ).length;
  const newPhrasesCount = guestData.savedPhrases.filter(
    (p) =>
      !accountPhraseIds.has(p.id) &&
      !accountPhraseTexts.has(
        `${p.languageCode}:${p.phrase.trim().toLowerCase()}`
      )
  ).length;
  const newScenariosCount = guestData.customScenarios.filter(
    (sc) => !accountScenarioIds.has(sc.id)
  ).length;

  return {
    newSessionsCount,
    newPhrasesCount,
    newScenariosCount,
    totalItems: newSessionsCount + newPhrasesCount + newScenariosCount,
  };
}

/**
 * Non-destructively merges guest items into an account without overwriting existing account records.
 * Returns both the merged collections and the newly added items to persist to the backend.
 */
export function mergeGuestIntoAccount(
  guestData: Pick<
    ScopedLearningData,
    "sessions" | "savedPhrases" | "customScenarios"
  >,
  accountData: Pick<
    ScopedLearningData,
    "sessions" | "savedPhrases" | "customScenarios"
  >
): {
  mergedSessions: PracticeSessionRecord[];
  mergedPhrases: SavedPhrase[];
  mergedScenarios: Scenario[];
  addedSessions: PracticeSessionRecord[];
  addedPhrases: SavedPhrase[];
  addedScenarios: Scenario[];
} {
  const sessionMap = new Map<string, PracticeSessionRecord>();
  for (const s of accountData.sessions) sessionMap.set(s.id, s);
  const addedSessions: PracticeSessionRecord[] = [];
  for (const s of guestData.sessions) {
    if (!sessionMap.has(s.id)) {
      sessionMap.set(s.id, s);
      addedSessions.push(s);
    }
  }

  const phraseMap = new Map<string, SavedPhrase>();
  const phraseTextSet = new Set<string>();
  for (const p of accountData.savedPhrases) {
    phraseMap.set(p.id, p);
    phraseTextSet.add(`${p.languageCode}:${p.phrase.trim().toLowerCase()}`);
  }
  const addedPhrases: SavedPhrase[] = [];
  for (const p of guestData.savedPhrases) {
    const key = `${p.languageCode}:${p.phrase.trim().toLowerCase()}`;
    if (!phraseMap.has(p.id) && !phraseTextSet.has(key)) {
      phraseMap.set(p.id, p);
      phraseTextSet.add(key);
      addedPhrases.push(p);
    }
  }

  const scenarioMap = new Map<string, Scenario>();
  for (const sc of accountData.customScenarios) scenarioMap.set(sc.id, sc);
  const addedScenarios: Scenario[] = [];
  for (const sc of guestData.customScenarios) {
    if (!scenarioMap.has(sc.id)) {
      scenarioMap.set(sc.id, sc);
      addedScenarios.push(sc);
    }
  }

  return {
    mergedSessions: Array.from(sessionMap.values()).sort(
      (a, b) => b.date - a.date
    ),
    mergedPhrases: Array.from(phraseMap.values()).sort(
      (a, b) => b.createdAt - a.createdAt
    ),
    mergedScenarios: Array.from(scenarioMap.values()),
    addedSessions,
    addedPhrases,
    addedScenarios,
  };
}
