/**
 * Isolated Prototype Types — Learning Memory & Cross-Device SRS PoC
 *
 * Strictly separated from production application code and database schemas.
 * Enforces explicit epistemic provenance:
 *   1. ASR/Typed transcript text (never treated as acoustic pronunciation assessment)
 *   2. AI coaching judgment (never treated as calibrated ground truth)
 *   3. Objective user/system actions (timestamps, counts, dismissals, SRS taps)
 */

export type PatternCategory =
  | "grammar"
  | "vocabulary"
  | "word_order"
  | "politeness_register"
  | "collocation"
  | "conjugation";

export type InputModality = "asr_transcript" | "typed_text";

export type TurnOrigin = "free_speech" | "free_typed" | "scaffolded_chip";

export type AttemptOutcome =
  | "mistake"
  | "independent_success"
  | "scaffolded_echo"
  | "still_struggling"
  | "asr_ambiguous_ignored"
  | "dialect_valid_ignored";

export type PatternStatus =
  | "observed"
  | "recurring"
  | "improving"
  | "consistent_in_practice";

export type EvidenceModalityScope =
  | "none"
  | "spoken_transcript_only"
  | "typed_only"
  | "mixed_spoken_and_typed";

export type DismissReason =
  | "asr_misheard"
  | "dialect_valid"
  | "not_relevant";

export interface CoachObservationInput {
  idempotencyKey: string;
  sessionClientId: string;
  turnIndex: number;
  languageCode: string;
  dialectId: string;
  inputModality: InputModality;
  turnOrigin: TurnOrigin;
  utterance: string;
  corrected: string;
  explanation: string;
  isNatural: boolean;
  /** Informational only — explicitly ignored by state-machine eligibility gates. */
  aiConfidence?: "high" | "medium" | "low";
  patternKey: string;
  category: PatternCategory;
  title: string;
  timestampMs: number;
  /** Immediately preceding partner utterance for echo/recast detection. */
  prevPartnerTurn?: string;
  /** Most recent coach correction shown in this same session for this pattern. */
  recentSameSessionTip?: {
    correction: string;
    turnIndex: number;
  };
}

export interface RetestEvaluationInput {
  idempotencyKey: string;
  sessionClientId: string;
  turnIndex: number;
  languageCode: string;
  dialectId: string;
  inputModality: InputModality;
  turnOrigin: TurnOrigin;
  utterance: string;
  attempted: boolean;
  aiJudgedNatural: boolean;
  /** Informational only — explicitly ignored by state-machine eligibility gates. */
  aiConfidence?: "high" | "medium" | "low";
  evidenceNote: string;
  timestampMs: number;
  prevPartnerTurn?: string;
  recentSameSessionTip?: {
    correction: string;
    turnIndex: number;
  };
}

export interface ModalityEvidenceBreakdown {
  mistakesCount: number;
  independentSuccessCount: number;
  distinctSuccessSessionsCount: number;
  firstSuccessAtMs: number | null;
  latestSuccessAtMs: number | null;
  /** Hard invariant: neither ASR transcripts nor typed text assess acoustics. */
  acousticPronunciationAssessed: false;
}

export interface PatternAttemptRecord {
  idempotencyKey: string;
  patternClientId: string;
  sessionClientId: string;
  turnIndex: number;
  dialectId: string;
  /** Tier 1 Provenance: how text entered the system */
  inputModality: InputModality;
  /** Tier 3 Provenance: objective UI/input origin */
  turnOrigin: TurnOrigin;
  outcome: AttemptOutcome;
  utterance: string;
  suggestedPhrasing: string | null;
  /** Tier 2 Provenance: AI judgment text (never ground truth) */
  aiJudgmentNote: string;
  createdAtMs: number;
  /** Explicit provenance contract for downstream rendering */
  provenance: {
    transcriptSourceLabel: "Speech transcript (ASR)" | "Typed text";
    acousticAssessed: false;
    judgmentSource: "AI coach observation";
  };
}

export interface LearningPatternRecord {
  clientId: string;
  userId: number;
  languageCode: string;
  patternKey: string;
  category: PatternCategory;
  title: string;
  explanation: string;
  latestMistake: string;
  latestCorrection: string;
  status: PatternStatus;
  /** Objective aggregate counts recomputed strictly from persisted attempts */
  occurrencesCount: number;
  independentSuccessCount: number;
  distinctSuccessSessionsCount: number;
  /** Explicit modality separation — typed success never masquerades as spoken */
  spokenEvidence: ModalityEvidenceBreakdown;
  typedEvidence: ModalityEvidenceBreakdown;
  consistencyModality: EvidenceModalityScope;
  dismissedAtMs: number | null;
  dismissReason: DismissReason | null;
  firstSeenAtMs: number;
  lastSeenAtMs: number;
  nextRetestAtMs: number;
  attempts: PatternAttemptRecord[];
}

export interface UserPrivacyPreferences {
  trackingPaused: boolean;
  allowAiPersonalization: boolean;
  pausedAtMs: number | null;
  historyDeletedAtMs: number | null;
}

export interface OfflineQueueItem {
  idempotencyKey: string;
  kind: "pattern_attempt" | "srs_review";
  createdAtMs: number;
  payload: Record<string, unknown>;
}

export interface PrivacyTransitionResult {
  preferences: UserPrivacyPreferences;
  retainedOfflineQueue: OfflineQueueItem[];
  purgedOfflineCount: number;
  allowFuturePromptPersonalization: boolean;
  auditAction:
    | "pause_tracking"
    | "resume_tracking"
    | "delete_pattern"
    | "delete_learning_history";
}
