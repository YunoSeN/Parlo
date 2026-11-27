import assert from "node:assert/strict";
import { describe, it } from "node:test";
import {
  clampString,
  ConcurrencyGuard,
  isAllowedWebSocketOrigin,
  sanitizeStringArray,
  SlidingWindowLimiter,
} from "../middleware/rateLimit.ts";
import {
  computeGuestMigrationSummary,
  generateClientId,
  getStorageScope,
  LEGACY_STORAGE_KEYS,
  mergeGuestIntoAccount,
  migrateLegacyV1ToGuest,
  readScopedLearningData,
  scopedKey,
  writeScopedCollection,
} from "../lib/accountStorage.ts";
import {
  computeNextSrsState,
  formatIntervalLabel,
  isSrsCardDue,
} from "../lib/srs.ts";
import { getDailyCulturalMission } from "../lib/dailyMission.ts";
import { computeDailyStreak } from "../lib/streaks.ts";
import { tokenizeTranscript } from "../components/WordDictionaryPopover.tsx";
import type { PracticeSessionRecord, SavedPhrase, Scenario } from "../types.ts";

function createMemoryStorage(): Pick<Storage, "getItem" | "setItem"> & {
  dump: () => Record<string, string>;
} {
  const map = new Map<string, string>();
  return {
    getItem(key: string) {
      return map.has(key) ? map.get(key)! : null;
    },
    setItem(key: string, value: string) {
      map.set(key, value);
    },
    dump() {
      return Object.fromEntries(map.entries());
    },
  };
}

describe("Backend Rate Limiting & Input Validation", () => {
  it("enforces sliding window quotas and resets once the window elapses", () => {
    const limiter = new SlidingWindowLimiter();
    const t0 = 1_700_000_000_000;

    const r1 = limiter.check("coach:ip:1.2.3.4", 2, 10_000, t0);
    assert.equal(r1.allowed, true);
    assert.equal(r1.remaining, 1);

    const r2 = limiter.check("coach:ip:1.2.3.4", 2, 10_000, t0 + 1_000);
    assert.equal(r2.allowed, true);
    assert.equal(r2.remaining, 0);

    const r3 = limiter.check("coach:ip:1.2.3.4", 2, 10_000, t0 + 2_000);
    assert.equal(r3.allowed, false);
    assert.equal(r3.remaining, 0);
    assert.ok(r3.retryAfterSeconds >= 8);

    // After t0 + 10_001ms, first slot expires
    const r4 = limiter.check("coach:ip:1.2.3.4", 2, 10_000, t0 + 10_001);
    assert.equal(r4.allowed, true);
    assert.equal(r4.remaining, 0);
  });

  it("tracks concurrent WebSocket slots and releases cleanly", () => {
    const guard = new ConcurrencyGuard();
    assert.equal(guard.acquire("ip:10.0.0.1", 2), true);
    assert.equal(guard.acquire("ip:10.0.0.1", 2), true);
    assert.equal(guard.acquire("ip:10.0.0.1", 2), false);
    assert.equal(guard.getCount("ip:10.0.0.1"), 2);

    guard.release("ip:10.0.0.1");
    assert.equal(guard.getCount("ip:10.0.0.1"), 1);
    assert.equal(guard.acquire("ip:10.0.0.1", 2), true);

    guard.release("ip:10.0.0.1");
    guard.release("ip:10.0.0.1");
    assert.equal(guard.getCount("ip:10.0.0.1"), 0);
  });

  it("validates WebSocket Origin against Host to block cross-site hijacking", () => {
    assert.equal(
      isAllowedWebSocketOrigin("https://parlo.app", "parlo.app"),
      true
    );
    assert.equal(
      isAllowedWebSocketOrigin("http://localhost:3000", "localhost:3000"),
      true
    );
    assert.equal(
      isAllowedWebSocketOrigin("https://evil.example", "parlo.app"),
      false
    );
    assert.equal(isAllowedWebSocketOrigin("not-a-url", "parlo.app"), false);
    assert.equal(isAllowedWebSocketOrigin(undefined, "parlo.app"), true);
    assert.equal(
      isAllowedWebSocketOrigin("https://parlo.app", undefined),
      false
    );
  });

  it("clamps untrusted strings and sanitizes string arrays", () => {
    assert.equal(clampString("  hola mundo  ", 4), "hola");
    assert.equal(clampString("   ", 20, "fallback"), "fallback");
    assert.equal(clampString(12345, 20, "fallback"), "fallback");

    assert.deepEqual(
      sanitizeStringArray(["  one ", "", 42, "two-longer", "three"], 2, 5),
      ["one", "two-l"]
    );
  });
});

describe("Account-Scoped Storage & Non-Destructive Guest Migration", () => {
  const samplePhrase: SavedPhrase = {
    id: "phrase-guest-1",
    phrase: "¿Me pones un cortado?",
    translation: "Could you get me a cortado?",
    languageCode: "es",
    scenarioTitle: "Morning Café in Madrid",
    createdAt: 1_700_000_000_000,
    mastered: false,
  };

  const sampleSession: PracticeSessionRecord = {
    id: "session-guest-1",
    date: 1_700_000_100_000,
    languageCode: "es",
    level: "B1",
    scenarioTitle: "Morning Café in Madrid",
    partnerName: "Lucía",
    durationSeconds: 185,
    userTurnsCount: 5,
    partnerTurnsCount: 5,
    goalsCompleted: 2,
    goalsTotal: 3,
    transcript: [
      { role: "partner", text: "¡Buenos días!" },
      { role: "user", text: "Hola, ¿me pones un cortado?" },
    ],
  };

  const sampleScenario: Scenario = {
    id: "custom-guest-1",
    title: "Airport Customs",
    city: "Madrid",
    category: "Travel",
    defaultLanguageCode: "es",
    recommendedLevel: "B1",
    durationLabel: "4 min",
    partnerName: "Carlos",
    partnerRole: "Agent",
    defaultVoice: "Fenrir",
    imageUrl: "",
    fallbackGradient: "from-slate-800 to-slate-900",
    summary: "Answer brief customs questions.",
    promptContext: "Customs desk at Barajas.",
    goals: ["State your destination"],
    starterPhrases: {},
    isCustom: true,
  };

  it("isolates guest and authenticated storage keys and migrates legacy v1 once", () => {
    const store = createMemoryStorage();
    store.setItem(LEGACY_STORAGE_KEYS.phrases, JSON.stringify([samplePhrase]));
    store.setItem(LEGACY_STORAGE_KEYS.weeklyGoal, JSON.stringify(6));

    assert.equal(getStorageScope(null), "guest");
    assert.equal(getStorageScope("user_abc"), "uid:user_abc");
    assert.notEqual(
      scopedKey("guest", "phrases"),
      scopedKey("uid:user_abc", "phrases")
    );

    migrateLegacyV1ToGuest(store);
    const guestLoaded = readScopedLearningData("guest", store);
    assert.equal(guestLoaded.savedPhrases.length, 1);
    assert.equal(guestLoaded.weeklyGoal, 6);

    // Account scope remains completely empty and isolated from guest scope
    const userLoaded = readScopedLearningData("uid:user_abc", store);
    assert.equal(userLoaded.savedPhrases.length, 0);
    assert.equal(userLoaded.weeklyGoal, 4);

    // Writing to account scope does not leak into guest scope
    writeScopedCollection("uid:user_abc", "weekly_goal", 9, store);
    assert.equal(readScopedLearningData("uid:user_abc", store).weeklyGoal, 9);
    assert.equal(readScopedLearningData("guest", store).weeklyGoal, 6);
  });

  it("computes accurate guest migration summary and deduplicates phrases on merge", () => {
    const accountDuplicatePhrase: SavedPhrase = {
      ...samplePhrase,
      id: "phrase-account-existing",
      phrase: "  ¿ME PONES UN CORTADO? ",
    };

    const summary = computeGuestMigrationSummary(
      {
        sessions: [sampleSession],
        savedPhrases: [samplePhrase],
        customScenarios: [sampleScenario],
      },
      {
        sessions: [],
        savedPhrases: [accountDuplicatePhrase],
        customScenarios: [],
      }
    );

    assert.equal(summary.newSessionsCount, 1);
    assert.equal(summary.newPhrasesCount, 0);
    assert.equal(summary.newScenariosCount, 1);
    assert.equal(summary.totalItems, 2);

    const merged = mergeGuestIntoAccount(
      {
        sessions: [sampleSession],
        savedPhrases: [samplePhrase],
        customScenarios: [sampleScenario],
      },
      {
        sessions: [],
        savedPhrases: [accountDuplicatePhrase],
        customScenarios: [],
      }
    );

    assert.equal(merged.mergedSessions.length, 1);
    assert.equal(merged.addedSessions.length, 1);
    assert.equal(merged.mergedPhrases.length, 1);
    assert.equal(merged.addedPhrases.length, 0);
    assert.equal(merged.mergedScenarios.length, 1);
    assert.equal(merged.addedScenarios.length, 1);
  });

  it("generates unique collision-resistant client IDs", () => {
    const a = generateClientId("session");
    const b = generateClientId("session");
    assert.ok(a.startsWith("session-"));
    assert.notEqual(a, b);
  });
});

describe("SM-2 Spaced Repetition, Daily Mission & Streaks", () => {
  it("progresses intervals for good/easy ratings and resets on again", () => {
    const t0 = 1_700_000_000_000;
    assert.equal(isSrsCardDue(undefined, t0), true);

    const s1 = computeNextSrsState(undefined, "good", t0);
    assert.equal(s1.repetitions, 1);
    assert.equal(s1.intervalDays, 1);
    assert.equal(isSrsCardDue(s1, t0 + 1000), false);

    const s2 = computeNextSrsState(s1, "good", t0 + 86_400_000);
    assert.equal(s2.repetitions, 2);
    assert.equal(s2.intervalDays, 3);

    const s3 = computeNextSrsState(s2, "easy", t0 + 4 * 86_400_000);
    assert.equal(s3.repetitions, 3);
    assert.ok(s3.intervalDays >= 7);
    assert.ok(s3.easeFactor > s2.easeFactor);

    const reset = computeNextSrsState(s3, "again", t0 + 12 * 86_400_000);
    assert.equal(reset.repetitions, 0);
    assert.equal(reset.intervalDays, 1);
    assert.ok(reset.easeFactor < s3.easeFactor);

    assert.equal(formatIntervalLabel(0), "Due now");
    assert.equal(formatIntervalLabel(1), "1d");
    assert.equal(formatIntervalLabel(14), "14d");
    assert.equal(formatIntervalLabel(60), "2mo");
  });

  it("generates deterministic Daily Cultural Missions scaled by CEFR level", () => {
    const mA2 = getDailyCulturalMission("ja", "A2");
    const mB1 = getDailyCulturalMission("ja", "B1");
    const mC1 = getDailyCulturalMission("ja", "C1");

    assert.equal(mA2.id, mB1.id);
    assert.equal(mA2.title, mB1.title);
    assert.equal(mA2.targetTurns, 3);
    assert.equal(mB1.targetTurns, 4);
    assert.equal(mC1.targetTurns, 5);
    assert.ok(mA2.starterLine.length > 0);
  });

  it("computes consecutive daily streaks accurately", () => {
    const ref = new Date(2026, 4, 15, 12, 0, 0);
    const makeSession = (daysAgo: number): PracticeSessionRecord => ({
      id: `s-${daysAgo}`,
      date: new Date(2026, 4, 15 - daysAgo, 10, 0, 0).getTime(),
      languageCode: "fr",
      level: "B1",
      scenarioTitle: "Bookshop",
      partnerName: "Camille",
      durationSeconds: 120,
      userTurnsCount: 4,
      partnerTurnsCount: 4,
      goalsCompleted: 2,
      goalsTotal: 3,
      transcript: [],
    });

    const stats = computeDailyStreak(
      [makeSession(0), makeSession(1), makeSession(2), makeSession(5)],
      ref
    );
    assert.equal(stats.practicedToday, true);
    assert.equal(stats.currentStreak, 3);
    assert.equal(stats.longestStreak, 3);
    assert.equal(stats.totalPracticeDays, 4);
    assert.equal(stats.recentDays.length, 7);
  });
});

describe("Click-Any-Word Transcript Tokenizer", () => {
  it("preserves punctuation while making Latin accented/contracted words clickable", () => {
    const tokens = tokenizeTranscript("Bonjour, j'adore l'été à Paris!");
    const clickable = tokens.filter((t) => t.clickable).map((t) => t.text);
    assert.deepEqual(clickable, ["Bonjour", "j'adore", "l'été", "à", "Paris"]);
    assert.equal(tokens.map((t) => t.text).join(""), "Bonjour, j'adore l'été à Paris!");
  });

  it("chunks CJK phrases into clickable segments while preserving full string", () => {
    const input = "おはようございます。お会計お願いします！";
    const tokens = tokenizeTranscript(input);
    const clickable = tokens.filter((t) => t.clickable);
    assert.ok(clickable.length >= 4);
    assert.equal(tokens.map((t) => t.text).join(""), input);
  });
});
