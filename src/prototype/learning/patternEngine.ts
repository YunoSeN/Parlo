/**
 * Pure Learning Pattern State Machine & Privacy Policy Engine (PoC)
 *
 * Design principles:
 *   1. Deterministic state recomputation from immutable attempt history (zero drift).
 *   2. Uncalibrated AI confidence (`aiConfidence`) is explicitly IGNORED.
 *   3. Typed evidence and spoken (ASR transcript) evidence are tracked separately;
 *      neither is ever claimed as acoustic pronunciation assessment.
 *   4. Repeating a recent recast or clicking a pre-written chip NEVER counts as
 *      an independent successful use.
 *   5. Server-authoritative prompt personalization uses ONLY allowlisted category
 *      + sanitized canonical slug — never raw user/client text — and respects
 *      Pause Tracking, Delete Pattern, and Delete Learning History immediately.
 */

import {
  evaluateObservationEligibility,
  normalizeContentTokens,
} from "./asrFilter.ts";
import {
  AttemptOutcome,
  CoachObservationInput,
  DismissReason,
  EvidenceModalityScope,
  LearningPatternRecord,
  ModalityEvidenceBreakdown,
  OfflineQueueItem,
  PatternAttemptRecord,
  PatternCategory,
  PatternStatus,
  PrivacyTransitionResult,
  RetestEvaluationInput,
  UserPrivacyPreferences,
} from "./types.ts";

export const ALLOWED_CATEGORIES: ReadonlySet<PatternCategory> = new Set([
  "grammar",
  "vocabulary",
  "word_order",
  "politeness_register",
  "collocation",
  "conjugation",
]);

const DAY_MS = 24 * 60 * 60 * 1000;
export const MIN_CONSISTENCY_INDEPENDENT_USES = 3;
export const MIN_CONSISTENCY_DISTINCT_SESSIONS = 2;
export const MIN_CONSISTENCY_SPAN_MS = 12 * 60 * 60 * 1000; // 12 hours
export const MIN_SAME_SESSION_TURN_SEPARATION = 2;
export const ECHO_OVERLAP_THRESHOLD = 0.75;

/**
 * Canonicalizes a pattern key to a strict safe slug: `<lang>:<kebab-slug>`
 * Returns null if malformed.
 */
export function canonicalizePatternKey(
  languageCode: string,
  rawKey: string
): string | null {
  const lang = languageCode.trim().toLowerCase().replace(/[^a-z]/g, "").slice(0, 4);
  if (lang.length < 2) return null;

  const stripped = rawKey
    .trim()
    .toLowerCase()
    .replace(new RegExp(`^${lang}[:_-]+`), "")
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "")
    .slice(0, 60);

  if (stripped.length < 3) return null;
  return `${lang}:${stripped}`;
}

/**
 * Computes lexical token containment ratio: fraction of learner tokens present
 * in a reference string (e.g., partner's immediately preceding recast or coach tip).
 */
export function computeLexicalContainment(
  learnerUtterance: string,
  referenceText: string
): number {
  const learnerTokens = normalizeContentTokens(learnerUtterance);
  const refSet = new Set(normalizeContentTokens(referenceText));
  if (learnerTokens.length === 0 || refSet.size === 0) return 0;

  let overlap = 0;
  for (const tok of learnerTokens) {
    if (refSet.has(tok)) overlap += 1;
  }
  return overlap / learnerTokens.length;
}

/**
 * Classifies a retest attempt according to the 5-part Independent Successful Use rules.
 */
export function classifyRetestAttempt(
  pattern: LearningPatternRecord,
  input: RetestEvaluationInput
): {
  outcome: AttemptOutcome | null;
  reason: string;
} {
  if (!input.attempted) {
    return { outcome: null, reason: "Target skill was not attempted in this turn." };
  }

  // Rule 1: Free-production origin (objective)
  if (input.turnOrigin === "scaffolded_chip") {
    return {
      outcome: "scaffolded_echo",
      reason: "Pre-written chip/starter clicks never count as independent production.",
    };
  }

  if (!input.aiJudgedNatural) {
    return {
      outcome: "still_struggling",
      reason: "Learner attempted the skill but the phrasing still showed difficulty.",
    };
  }

  // Rule 2: Same-session turn-separation delay gate (deterministic)
  const sameSessionMistakeOrTip = pattern.attempts
    .filter(
      (a) =>
        a.sessionClientId === input.sessionClientId &&
        (a.outcome === "mistake" || a.outcome === "still_struggling")
    )
    .reduce((maxTurn, a) => Math.max(maxTurn, a.turnIndex), -1);

  const recentTipTurn = input.recentSameSessionTip?.turnIndex ?? -1;
  const lastScaffoldTurn = Math.max(sameSessionMistakeOrTip, recentTipTurn);

  if (
    lastScaffoldTurn >= 0 &&
    input.turnIndex - lastScaffoldTurn < MIN_SAME_SESSION_TURN_SEPARATION
  ) {
    return {
      outcome: "scaffolded_echo",
      reason: `Occurred within ${MIN_SAME_SESSION_TURN_SEPARATION} turns of a same-session mistake or tip.`,
    };
  }

  // Rule 3: Same-session lexical echo gate (against immediately preceding partner turn
  //         or same-session displayed coach correction).
  //         Note: Intentionally does NOT block cross-session fixed formulas (e.g. polite
  //         expressions recalled freely in a later session without an immediate prompt).
  if (input.prevPartnerTurn) {
    const partnerOverlap = computeLexicalContainment(
      input.utterance,
      input.prevPartnerTurn
    );
    if (partnerOverlap >= ECHO_OVERLAP_THRESHOLD) {
      return {
        outcome: "scaffolded_echo",
        reason: `Lexical overlap (${Math.round(partnerOverlap * 100)}%) with immediately preceding partner turn indicates a recast echo.`,
      };
    }
  }

  if (input.recentSameSessionTip) {
    const tipOverlap = computeLexicalContainment(
      input.utterance,
      input.recentSameSessionTip.correction
    );
    if (tipOverlap >= ECHO_OVERLAP_THRESHOLD) {
      return {
        outcome: "scaffolded_echo",
        reason: `Lexical overlap (${Math.round(tipOverlap * 100)}%) with same-session displayed correction indicates repetition, not independent recall.`,
      };
    }
  }

  return {
    outcome: "independent_success",
    reason: "Free production passed turn-separation and non-echo checks.",
  };
}

function emptyModalityBreakdown(): ModalityEvidenceBreakdown {
  return {
    mistakesCount: 0,
    independentSuccessCount: 0,
    distinctSuccessSessionsCount: 0,
    firstSuccessAtMs: null,
    latestSuccessAtMs: null,
    acousticPronunciationAssessed: false,
  };
}

function buildModalityBreakdown(
  attempts: PatternAttemptRecord[],
  modality: "asr_transcript" | "typed_text"
): ModalityEvidenceBreakdown {
  const filtered = attempts.filter((a) => a.inputModality === modality);
  const breakdown = emptyModalityBreakdown();
  const successSessions = new Set<string>();

  for (const attempt of filtered) {
    if (attempt.outcome === "mistake" || attempt.outcome === "still_struggling") {
      breakdown.mistakesCount += 1;
    } else if (attempt.outcome === "independent_success") {
      breakdown.independentSuccessCount += 1;
      successSessions.add(attempt.sessionClientId);
      breakdown.firstSuccessAtMs =
        breakdown.firstSuccessAtMs === null
          ? attempt.createdAtMs
          : Math.min(breakdown.firstSuccessAtMs, attempt.createdAtMs);
      breakdown.latestSuccessAtMs =
        breakdown.latestSuccessAtMs === null
          ? attempt.createdAtMs
          : Math.max(breakdown.latestSuccessAtMs, attempt.createdAtMs);
    }
  }

  breakdown.distinctSuccessSessionsCount = successSessions.size;
  return breakdown;
}

/**
 * Pure deterministic recomputation of all pattern aggregates and status
 * directly from its immutable attempt log. Guarantees zero counter drift.
 */
export function recomputePatternFromAttempts(
  base: Omit<
    LearningPatternRecord,
    | "status"
    | "occurrencesCount"
    | "independentSuccessCount"
    | "distinctSuccessSessionsCount"
    | "spokenEvidence"
    | "typedEvidence"
    | "consistencyModality"
    | "firstSeenAtMs"
    | "lastSeenAtMs"
    | "nextRetestAtMs"
  >
): LearningPatternRecord {
  const sorted = [...base.attempts].sort(
    (a, b) => a.createdAtMs - b.createdAtMs || a.idempotencyKey.localeCompare(b.idempotencyKey)
  );

  const spokenEvidence = buildModalityBreakdown(sorted, "asr_transcript");
  const typedEvidence = buildModalityBreakdown(sorted, "typed_text");

  let occurrencesCount = 0;
  let independentSuccessCount = 0;
  const allSuccessSessions = new Set<string>();
  let firstSuccessAtMs: number | null = null;
  let latestSuccessAtMs: number | null = null;
  let latestMistakeAtMs: number | null = null;

  for (const a of sorted) {
    if (a.outcome === "mistake" || a.outcome === "still_struggling") {
      occurrencesCount += 1;
      latestMistakeAtMs =
        latestMistakeAtMs === null
          ? a.createdAtMs
          : Math.max(latestMistakeAtMs, a.createdAtMs);
    } else if (a.outcome === "independent_success") {
      independentSuccessCount += 1;
      allSuccessSessions.add(a.sessionClientId);
      firstSuccessAtMs =
        firstSuccessAtMs === null
          ? a.createdAtMs
          : Math.min(firstSuccessAtMs, a.createdAtMs);
      latestSuccessAtMs =
        latestSuccessAtMs === null
          ? a.createdAtMs
          : Math.max(latestSuccessAtMs, a.createdAtMs);
    }
  }

  const distinctSuccessSessionsCount = allSuccessSessions.size;
  const firstSeenAtMs = sorted[0]?.createdAtMs ?? Date.now();
  const lastSeenAtMs = sorted[sorted.length - 1]?.createdAtMs ?? firstSeenAtMs;

  const successSpanMs =
    firstSuccessAtMs !== null && latestSuccessAtMs !== null
      ? latestSuccessAtMs - firstSuccessAtMs
      : 0;

  // Regression guard: if the MOST RECENT substantive attempt was a struggle/mistake,
  // do NOT stay in `consistent_in_practice`!
  const lastSubstantive = [...sorted]
    .reverse()
    .find(
      (a) =>
        a.outcome === "mistake" ||
        a.outcome === "still_struggling" ||
        a.outcome === "independent_success"
    );

  let status: PatternStatus;
  if (
    independentSuccessCount >= MIN_CONSISTENCY_INDEPENDENT_USES &&
    distinctSuccessSessionsCount >= MIN_CONSISTENCY_DISTINCT_SESSIONS &&
    successSpanMs >= MIN_CONSISTENCY_SPAN_MS &&
    lastSubstantive?.outcome === "independent_success"
  ) {
    status = "consistent_in_practice";
  } else if (
    independentSuccessCount > 0 &&
    lastSubstantive?.outcome === "independent_success"
  ) {
    status = "improving";
  } else if (occurrencesCount >= 2) {
    status = "recurring";
  } else {
    status = "observed";
  }

  // Explicit modality scope for honest UI reporting
  let consistencyModality: EvidenceModalityScope = "none";
  if (
    spokenEvidence.independentSuccessCount > 0 &&
    typedEvidence.independentSuccessCount > 0
  ) {
    consistencyModality = "mixed_spoken_and_typed";
  } else if (spokenEvidence.independentSuccessCount > 0) {
    consistencyModality = "spoken_transcript_only";
  } else if (typedEvidence.independentSuccessCount > 0) {
    consistencyModality = "typed_only";
  }

  // Deterministic revisit schedule
  const nextRetestAtMs =
    status === "consistent_in_practice"
      ? lastSeenAtMs + 14 * DAY_MS
      : status === "improving"
      ? lastSeenAtMs + DAY_MS
      : lastSeenAtMs;

  return {
    ...base,
    attempts: sorted,
    status,
    occurrencesCount,
    independentSuccessCount,
    distinctSuccessSessionsCount,
    spokenEvidence,
    typedEvidence,
    consistencyModality,
    firstSeenAtMs,
    lastSeenAtMs,
    nextRetestAtMs,
  };
}

/**
 * Pure helper to process a new coaching mistake observation (respecting privacy
 * and ASR/dialect filters). Returns updated pattern or null if filtered/paused.
 */
export function applyMistakeObservation(params: {
  existing: LearningPatternRecord | null;
  input: CoachObservationInput;
  userId: number;
  newClientId: string;
  privacy: UserPrivacyPreferences;
}): {
  accepted: boolean;
  reason: string;
  pattern: LearningPatternRecord | null;
} {
  const { existing, input, userId, newClientId, privacy } = params;

  if (privacy.trackingPaused) {
    return {
      accepted: false,
      reason: "tracking_paused",
      pattern: existing,
    };
  }

  if (input.isNatural) {
    return {
      accepted: false,
      reason: "utterance_already_natural",
      pattern: existing,
    };
  }

  const canonicalKey = canonicalizePatternKey(input.languageCode, input.patternKey);
  if (!canonicalKey || !ALLOWED_CATEGORIES.has(input.category)) {
    return {
      accepted: false,
      reason: "invalid_pattern_taxonomy",
      pattern: existing,
    };
  }

  // Note: input.aiConfidence is intentionally NEVER checked here.
  const filter = evaluateObservationEligibility({
    languageCode: input.languageCode,
    dialectId: input.dialectId,
    inputModality: input.inputModality,
    turnOrigin: input.turnOrigin,
    original: input.utterance,
    corrected: input.corrected,
  });

  if (!filter.eligible) {
    return {
      accepted: false,
      reason: filter.reason,
      pattern: existing,
    };
  }

  // Idempotency guard
  if (existing?.attempts.some((a) => a.idempotencyKey === input.idempotencyKey)) {
    return {
      accepted: true,
      reason: "idempotent_duplicate_noop",
      pattern: existing,
    };
  }

  const patternClientId = existing?.clientId ?? newClientId;
  const attempt: PatternAttemptRecord = {
    idempotencyKey: input.idempotencyKey,
    patternClientId,
    sessionClientId: input.sessionClientId,
    turnIndex: input.turnIndex,
    dialectId: input.dialectId,
    inputModality: input.inputModality,
    turnOrigin: input.turnOrigin,
    outcome: "mistake",
    utterance: input.utterance.trim().slice(0, 240),
    suggestedPhrasing: input.corrected.trim().slice(0, 240),
    aiJudgmentNote: input.explanation.trim().slice(0, 240),
    createdAtMs: input.timestampMs,
    provenance: {
      transcriptSourceLabel:
        input.inputModality === "asr_transcript"
          ? "Speech transcript (ASR)"
          : "Typed text",
      acousticAssessed: false,
      judgmentSource: "AI coach observation",
    },
  };

  const nextPattern = recomputePatternFromAttempts({
    clientId: patternClientId,
    userId,
    languageCode: input.languageCode,
    patternKey: canonicalKey,
    category: input.category,
    title: input.title.trim().slice(0, 120),
    explanation: input.explanation.trim().slice(0, 280),
    latestMistake: attempt.utterance,
    latestCorrection: attempt.suggestedPhrasing ?? "",
    dismissedAtMs: existing?.dismissedAtMs ?? null,
    dismissReason: existing?.dismissReason ?? null,
    attempts: [...(existing?.attempts ?? []), attempt],
  });

  return {
    accepted: true,
    reason: "recorded_mistake",
    pattern: nextPattern,
  };
}

/**
 * Pure helper to process a follow-up retest attempt against an existing pattern.
 */
export function applyRetestEvaluation(params: {
  pattern: LearningPatternRecord;
  input: RetestEvaluationInput;
  privacy: UserPrivacyPreferences;
}): {
  recorded: boolean;
  outcome: AttemptOutcome | null;
  reason: string;
  pattern: LearningPatternRecord;
} {
  const { pattern, input, privacy } = params;

  if (privacy.trackingPaused || pattern.dismissedAtMs !== null) {
    return {
      recorded: false,
      outcome: null,
      reason: privacy.trackingPaused ? "tracking_paused" : "pattern_dismissed",
      pattern,
    };
  }

  if (pattern.attempts.some((a) => a.idempotencyKey === input.idempotencyKey)) {
    return {
      recorded: true,
      outcome:
        pattern.attempts.find((a) => a.idempotencyKey === input.idempotencyKey)
          ?.outcome ?? null,
      reason: "idempotent_duplicate_noop",
      pattern,
    };
  }

  const classified = classifyRetestAttempt(pattern, input);
  if (!classified.outcome) {
    return {
      recorded: false,
      outcome: null,
      reason: classified.reason,
      pattern,
    };
  }

  const attempt: PatternAttemptRecord = {
    idempotencyKey: input.idempotencyKey,
    patternClientId: pattern.clientId,
    sessionClientId: input.sessionClientId,
    turnIndex: input.turnIndex,
    dialectId: input.dialectId,
    inputModality: input.inputModality,
    turnOrigin: input.turnOrigin,
    outcome: classified.outcome,
    utterance: input.utterance.trim().slice(0, 240),
    suggestedPhrasing:
      classified.outcome === "still_struggling" ? pattern.latestCorrection : null,
    aiJudgmentNote: input.evidenceNote.trim().slice(0, 240),
    createdAtMs: input.timestampMs,
    provenance: {
      transcriptSourceLabel:
        input.inputModality === "asr_transcript"
          ? "Speech transcript (ASR)"
          : "Typed text",
      acousticAssessed: false,
      judgmentSource: "AI coach observation",
    },
  };

  const updated = recomputePatternFromAttempts({
    ...pattern,
    attempts: [...pattern.attempts, attempt],
  });

  return {
    recorded: true,
    outcome: classified.outcome,
    reason: classified.reason,
    pattern: updated,
  };
}

/**
 * Server-Authoritative Prompt Directive Builder.
 *
 * NEVER accepts raw client prompt text or raw learner utterances!
 * Builds a bounded, sanitized pedagogical directive strictly from an authorized
 * server-owned pattern's allowlisted `category` + canonical `patternKey` slug.
 */
export function buildAuthorizedRevisitDirective(params: {
  pattern: LearningPatternRecord | null;
  requestingUserId: number | null;
  privacy: UserPrivacyPreferences;
}): string | null {
  const { pattern, requestingUserId, privacy } = params;

  if (!pattern || requestingUserId === null) return null;
  if (privacy.trackingPaused || !privacy.allowAiPersonalization) return null;
  if (pattern.userId !== requestingUserId) return null;
  if (pattern.dismissedAtMs !== null) return null;
  if (!ALLOWED_CATEGORIES.has(pattern.category)) return null;

  const validatedKey = canonicalizePatternKey(
    pattern.languageCode,
    pattern.patternKey
  );
  if (!validatedKey) return null;

  const readableTopic = validatedKey
    .split(":")[1]
    .replace(/-/g, " ")
    .slice(0, 60);

  return [
    "Optional Pedagogical Focus (server-verified):",
    `During this conversation, create 1 or 2 natural openings where the learner can practice ${pattern.category.replace("_", " ")} (${readableTopic}).`,
    "Stay completely in character. Do not announce this focus or quote previous errors.",
  ].join(" ");
}

/**
 * Full Privacy State Transitions (Pause Tracking, Resume, Delete Pattern, Delete History).
 * Explicitly defines offline queue cleanup and downstream AI personalization behavior.
 */
export function applyPrivacyAction(params: {
  action:
    | { type: "pause_tracking"; nowMs: number }
    | { type: "resume_tracking"; nowMs: number }
    | { type: "delete_pattern"; patternClientId: string; nowMs: number }
    | { type: "delete_learning_history"; nowMs: number };
  preferences: UserPrivacyPreferences;
  offlineQueue: OfflineQueueItem[];
}): PrivacyTransitionResult {
  const { action, preferences, offlineQueue } = params;

  switch (action.type) {
    case "pause_tracking": {
      // Drop queued pattern attempts immediately so paused data cannot sync later;
      // preserve unrelated SRS phrase reviews.
      const retained = offlineQueue.filter((q) => q.kind !== "pattern_attempt");
      return {
        preferences: {
          ...preferences,
          trackingPaused: true,
          allowAiPersonalization: false,
          pausedAtMs: action.nowMs,
        },
        retainedOfflineQueue: retained,
        purgedOfflineCount: offlineQueue.length - retained.length,
        allowFuturePromptPersonalization: false,
        auditAction: "pause_tracking",
      };
    }

    case "resume_tracking": {
      return {
        preferences: {
          ...preferences,
          trackingPaused: false,
          allowAiPersonalization: true,
          pausedAtMs: null,
        },
        retainedOfflineQueue: offlineQueue,
        purgedOfflineCount: 0,
        allowFuturePromptPersonalization: true,
        auditAction: "resume_tracking",
      };
    }

    case "delete_pattern": {
      // Purge any pending offline attempts referencing the deleted pattern.
      const retained = offlineQueue.filter(
        (q) =>
          q.kind !== "pattern_attempt" ||
          q.payload.patternClientId !== action.patternClientId
      );
      return {
        preferences,
        retainedOfflineQueue: retained,
        purgedOfflineCount: offlineQueue.length - retained.length,
        allowFuturePromptPersonalization:
          !preferences.trackingPaused && preferences.allowAiPersonalization,
        auditAction: "delete_pattern",
      };
    }

    case "delete_learning_history": {
      // Purge ALL queued pattern attempts; historical deleted data is gone and
      // cannot re-enter AI prompts. Tracking remains in user's chosen pause state.
      const retained = offlineQueue.filter((q) => q.kind !== "pattern_attempt");
      return {
        preferences: {
          ...preferences,
          historyDeletedAtMs: action.nowMs,
        },
        retainedOfflineQueue: retained,
        purgedOfflineCount: offlineQueue.length - retained.length,
        allowFuturePromptPersonalization:
          !preferences.trackingPaused && preferences.allowAiPersonalization,
        auditAction: "delete_learning_history",
      };
    }
  }
}

export function dismissPatternRecord(
  pattern: LearningPatternRecord,
  reason: DismissReason,
  nowMs: number
): LearningPatternRecord {
  return {
    ...pattern,
    dismissedAtMs: nowMs,
    dismissReason: reason,
  };
}
