/**
 * Strictly Isolated In-Memory Relational Prototype Store (`node:sqlite`)
 *
 * Question #1 & #2 Proof-of-Concept:
 *   - NEVER imports `pg` or `src/db/*`.
 *   - NEVER connects to `process.env.SQL_HOST` or any production Cloud SQL instance.
 *   - Runs exclusively against an ephemeral in-memory SQLite database (`:memory:`)
 *     with `PRAGMA foreign_keys = ON`.
 *   - Proves foreign-key cascades, `ON DELETE SET NULL`, composite uniqueness,
 *     user ownership isolation, transactional rollback on fault, idempotent
 *     retries, and aggregate consistency under interleaved concurrent operations.
 *
 * Honest Engineering Note (documented in test report):
 *   SQLite `:memory:` validates relational schema invariants, FK semantics,
 *   rollback behavior, and single-process async interleaving. It does NOT
 *   substitute for PostgreSQL multi-process MVCC lock contention testing
 *   (which requires a dedicated non-production Postgres database before rollout).
 */

import { createRequire } from "node:module";
import {
  applyMistakeObservation,
  applyRetestEvaluation,
  buildAuthorizedRevisitDirective,
  recomputePatternFromAttempts,
} from "./patternEngine.ts";
import {
  clampReviewTimestamp,
  computeNextSrsState,
  getDefaultSrsCard,
  SrsCardState,
  SrsRating,
  SrsReviewOperation,
} from "./srsSyncCompare.ts";
import {
  CoachObservationInput,
  DismissReason,
  LearningPatternRecord,
  PatternAttemptRecord,
  PatternCategory,
  RetestEvaluationInput,
  UserPrivacyPreferences,
} from "./types.ts";

interface SqliteStatementLike {
  run: (...params: unknown[]) => { changes: number | bigint; lastInsertRowid: number | bigint };
  get: (...params: unknown[]) => Record<string, unknown> | undefined;
  all: (...params: unknown[]) => Record<string, unknown>[];
}

interface SqliteDatabaseLike {
  exec: (sql: string) => void;
  prepare: (sql: string) => SqliteStatementLike;
  close: () => void;
}

const require = createRequire(import.meta.url);
const sqliteMod = require("node:sqlite") as {
  DatabaseSync: new (location: string) => SqliteDatabaseLike;
};

export interface IsolationAuditReport {
  driver: "node:sqlite (:memory:)";
  pgModuleImported: boolean;
  touchesProductionCloudSql: false;
  productionEnvSqlHostPresent: boolean;
  foreignKeysEnabled: boolean;
}

const MAX_REMEMBERED_SRS_EVENTS = 32;

export class IsolatedLearningStore {
  private readonly db: SqliteDatabaseLike;
  private txChain: Promise<unknown> = Promise.resolve();
  private transientFailuresRemaining = 0;
  public transactionRetryCount = 0;

  constructor() {
    // Hard invariant: always in-memory, never a file path or network socket
    this.db = new sqliteMod.DatabaseSync(":memory:");
    this.db.exec("PRAGMA foreign_keys = ON;");
    this.initSchema();
  }

  public getIsolationAudit(): IsolationAuditReport {
    const fkRow = this.db.prepare("PRAGMA foreign_keys;").get();
    return {
      driver: "node:sqlite (:memory:)",
      pgModuleImported: false,
      touchesProductionCloudSql: false,
      productionEnvSqlHostPresent: Boolean(process.env.SQL_HOST),
      foreignKeysEnabled: Number(fkRow?.foreign_keys ?? 0) === 1,
    };
  }

  public injectTransientSerializationFailures(count: number): void {
    this.transientFailuresRemaining = count;
  }

  private initSchema(): void {
    this.db.exec(`
      CREATE TABLE users (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        uid TEXT NOT NULL UNIQUE,
        email TEXT NOT NULL,
        tracking_paused INTEGER NOT NULL DEFAULT 0,
        allow_ai_personalization INTEGER NOT NULL DEFAULT 1,
        paused_at_ms INTEGER,
        history_deleted_at_ms INTEGER
      );

      CREATE TABLE practice_sessions (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        client_id TEXT NOT NULL,
        user_id INTEGER NOT NULL REFERENCES users(id) ON DELETE CASCADE,
        scenario_title TEXT NOT NULL,
        UNIQUE(user_id, client_id)
      );

      CREATE TABLE learning_patterns (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        client_id TEXT NOT NULL,
        user_id INTEGER NOT NULL REFERENCES users(id) ON DELETE CASCADE,
        language_code TEXT NOT NULL,
        pattern_key TEXT NOT NULL,
        category TEXT NOT NULL,
        title TEXT NOT NULL,
        explanation TEXT NOT NULL,
        latest_mistake TEXT NOT NULL,
        latest_correction TEXT NOT NULL,
        status TEXT NOT NULL DEFAULT 'observed',
        occurrences_count INTEGER NOT NULL DEFAULT 1,
        independent_success_count INTEGER NOT NULL DEFAULT 0,
        distinct_success_sessions_count INTEGER NOT NULL DEFAULT 0,
        dismissed_at_ms INTEGER,
        dismiss_reason TEXT,
        first_seen_at_ms INTEGER NOT NULL,
        last_seen_at_ms INTEGER NOT NULL,
        next_retest_at_ms INTEGER NOT NULL,
        UNIQUE(user_id, client_id),
        UNIQUE(user_id, language_code, pattern_key)
      );

      CREATE TABLE pattern_attempts (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        idempotency_key TEXT NOT NULL,
        user_id INTEGER NOT NULL REFERENCES users(id) ON DELETE CASCADE,
        pattern_id INTEGER NOT NULL REFERENCES learning_patterns(id) ON DELETE CASCADE,
        session_id INTEGER REFERENCES practice_sessions(id) ON DELETE SET NULL,
        session_client_id TEXT NOT NULL,
        turn_index INTEGER NOT NULL,
        dialect_id TEXT NOT NULL,
        input_modality TEXT NOT NULL,
        turn_origin TEXT NOT NULL,
        outcome TEXT NOT NULL,
        utterance TEXT NOT NULL,
        suggested_phrasing TEXT,
        ai_judgment_note TEXT NOT NULL,
        created_at_ms INTEGER NOT NULL,
        UNIQUE(user_id, idempotency_key)
      );

      CREATE TABLE saved_phrases (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        client_id TEXT NOT NULL,
        user_id INTEGER NOT NULL REFERENCES users(id) ON DELETE CASCADE,
        phrase TEXT NOT NULL,
        translation TEXT NOT NULL,
        srs_json TEXT,
        srs_version INTEGER NOT NULL DEFAULT 0,
        srs_applied_event_ids_json TEXT NOT NULL DEFAULT '[]',
        srs_last_rating TEXT,
        UNIQUE(user_id, client_id)
      );
    `);
  }

  /**
   * FIFO async mutex transaction runner simulating concurrent request handling
   * with automatic retry on transient serialization/lock conflicts (like Postgres 40001).
   * Unlike a raw promise chain, a rollback/40001 never poisons downstream queued waiters.
   */
  private async runTransaction<T>(fn: () => T, maxRetries = 6): Promise<T> {
    let attempt = 0;
    while (true) {
      attempt += 1;
      // Yield to event loop so Promise.all callers genuinely interleave
      await Promise.resolve();

      const prev = this.txChain;
      let release!: () => void;
      this.txChain = new Promise<void>((resolve) => {
        release = resolve;
      });

      await prev;
      try {
        this.db.exec("BEGIN IMMEDIATE;");
        try {
          if (this.transientFailuresRemaining > 0) {
            this.transientFailuresRemaining -= 1;
            const err = new Error("SERIALIZATION_FAILURE_SIMULATED");
            (err as Error & { code?: string }).code = "40001";
            throw err;
          }
          const out = fn();
          this.db.exec("COMMIT;");
          return out;
        } catch (err) {
          this.db.exec("ROLLBACK;");
          throw err;
        }
      } catch (err) {
        const code = (err as Error & { code?: string })?.code;
        if (code === "40001" && attempt <= maxRetries) {
          this.transactionRetryCount += 1;
          continue;
        }
        throw err;
      } finally {
        release();
      }
    }
  }

  public createUser(uid: string, email: string): number {
    const res = this.db
      .prepare("INSERT INTO users (uid, email) VALUES (?, ?)")
      .run(uid, email);
    return Number(res.lastInsertRowid);
  }

  public deleteUser(userId: number): void {
    this.db.prepare("DELETE FROM users WHERE id = ?").run(userId);
  }

  public createSession(userId: number, clientId: string, scenarioTitle: string): number {
    const res = this.db
      .prepare(
        "INSERT INTO practice_sessions (user_id, client_id, scenario_title) VALUES (?, ?, ?)"
      )
      .run(userId, clientId, scenarioTitle);
    return Number(res.lastInsertRowid);
  }

  public deleteSession(userId: number, clientId: string): boolean {
    const res = this.db
      .prepare("DELETE FROM practice_sessions WHERE user_id = ? AND client_id = ?")
      .run(userId, clientId);
    return Number(res.changes) > 0;
  }

  public createPhrase(
    userId: number,
    clientId: string,
    phrase: string,
    translation: string
  ): number {
    const res = this.db
      .prepare(
        "INSERT INTO saved_phrases (user_id, client_id, phrase, translation) VALUES (?, ?, ?, ?)"
      )
      .run(userId, clientId, phrase, translation);
    return Number(res.lastInsertRowid);
  }

  public getUserPrivacy(userId: number): UserPrivacyPreferences {
    const row = this.db
      .prepare(
        "SELECT tracking_paused, allow_ai_personalization, paused_at_ms, history_deleted_at_ms FROM users WHERE id = ?"
      )
      .get(userId);
    if (!row) {
      throw new Error(`User ${userId} not found`);
    }
    return {
      trackingPaused: Number(row.tracking_paused) === 1,
      allowAiPersonalization: Number(row.allow_ai_personalization) === 1,
      pausedAtMs: row.paused_at_ms === null ? null : Number(row.paused_at_ms),
      historyDeletedAtMs:
        row.history_deleted_at_ms === null ? null : Number(row.history_deleted_at_ms),
    };
  }

  public setTrackingPaused(userId: number, paused: boolean, nowMs: number): void {
    this.db
      .prepare(
        `UPDATE users
         SET tracking_paused = ?, allow_ai_personalization = ?, paused_at_ms = ?
         WHERE id = ?`
      )
      .run(paused ? 1 : 0, paused ? 0 : 1, paused ? nowMs : null, userId);
  }

  public deletePattern(userId: number, patternClientId: string): boolean {
    const res = this.db
      .prepare("DELETE FROM learning_patterns WHERE user_id = ? AND client_id = ?")
      .run(userId, patternClientId);
    return Number(res.changes) > 0;
  }

  public dismissPattern(
    userId: number,
    patternClientId: string,
    reason: DismissReason,
    nowMs: number
  ): boolean {
    const res = this.db
      .prepare(
        `UPDATE learning_patterns
         SET dismissed_at_ms = ?, dismiss_reason = ?
         WHERE user_id = ? AND client_id = ?`
      )
      .run(nowMs, reason, userId, patternClientId);
    return Number(res.changes) > 0;
  }

  public deleteAllLearningHistory(userId: number, nowMs: number): {
    deletedPatterns: number;
  } {
    const res = this.db
      .prepare("DELETE FROM learning_patterns WHERE user_id = ?")
      .run(userId);
    this.db
      .prepare("UPDATE users SET history_deleted_at_ms = ? WHERE id = ?")
      .run(nowMs, userId);
    return { deletedPatterns: Number(res.changes) };
  }

  private hydratePattern(row: Record<string, unknown>): LearningPatternRecord {
    const patternId = Number(row.id);
    const attemptRows = this.db
      .prepare(
        `SELECT * FROM pattern_attempts
         WHERE pattern_id = ?
         ORDER BY created_at_ms ASC, idempotency_key ASC`
      )
      .all(patternId);

    const attempts: PatternAttemptRecord[] = attemptRows.map((a) => ({
      idempotencyKey: String(a.idempotency_key),
      patternClientId: String(row.client_id),
      sessionClientId: String(a.session_client_id),
      turnIndex: Number(a.turn_index),
      dialectId: String(a.dialect_id),
      inputModality: a.input_modality as PatternAttemptRecord["inputModality"],
      turnOrigin: a.turn_origin as PatternAttemptRecord["turnOrigin"],
      outcome: a.outcome as PatternAttemptRecord["outcome"],
      utterance: String(a.utterance),
      suggestedPhrasing:
        a.suggested_phrasing === null ? null : String(a.suggested_phrasing),
      aiJudgmentNote: String(a.ai_judgment_note),
      createdAtMs: Number(a.created_at_ms),
      provenance: {
        transcriptSourceLabel:
          a.input_modality === "asr_transcript"
            ? "Speech transcript (ASR)"
            : "Typed text",
        acousticAssessed: false,
        judgmentSource: "AI coach observation",
      },
    }));

    return recomputePatternFromAttempts({
      clientId: String(row.client_id),
      userId: Number(row.user_id),
      languageCode: String(row.language_code),
      patternKey: String(row.pattern_key),
      category: row.category as PatternCategory,
      title: String(row.title),
      explanation: String(row.explanation),
      latestMistake: String(row.latest_mistake),
      latestCorrection: String(row.latest_correction),
      dismissedAtMs:
        row.dismissed_at_ms === null ? null : Number(row.dismissed_at_ms),
      dismissReason:
        row.dismiss_reason === null ? null : (row.dismiss_reason as DismissReason),
      attempts,
    });
  }

  public getPatternForUser(
    userId: number,
    patternClientId: string
  ): LearningPatternRecord | null {
    const row = this.db
      .prepare("SELECT * FROM learning_patterns WHERE user_id = ? AND client_id = ?")
      .get(userId, patternClientId);
    return row ? this.hydratePattern(row) : null;
  }

  public listPatternsForUser(userId: number): LearningPatternRecord[] {
    const rows = this.db
      .prepare(
        "SELECT * FROM learning_patterns WHERE user_id = ? ORDER BY last_seen_at_ms DESC"
      )
      .all(userId);
    return rows.map((r) => this.hydratePattern(r));
  }

  public countAllAttempts(): number {
    const row = this.db.prepare("SELECT COUNT(*) AS cnt FROM pattern_attempts").get();
    return Number(row?.cnt ?? 0);
  }

  public resolveAuthorizedPromptDirective(
    requestingUserId: number | null,
    targetPatternClientId: string
  ): string | null {
    if (requestingUserId === null) return null;
    const privacy = this.getUserPrivacy(requestingUserId);
    const pattern = this.getPatternForUser(requestingUserId, targetPatternClientId);
    return buildAuthorizedRevisitDirective({
      pattern,
      requestingUserId,
      privacy,
    });
  }

  /**
   * Transactionally records a coaching mistake observation with idempotency,
   * composite uniqueness, and deterministic aggregate recomputation.
   */
  public async recordMistake(
    userId: number,
    input: CoachObservationInput,
    proposedClientId: string
  ): Promise<{ accepted: boolean; reason: string; pattern: LearningPatternRecord | null }> {
    return this.runTransaction(() => {
      const privacy = this.getUserPrivacy(userId);
      const existingRow = this.db
        .prepare(
          `SELECT * FROM learning_patterns
           WHERE user_id = ? AND language_code = ? AND pattern_key = ?`
        )
        .get(userId, input.languageCode, input.patternKey.toLowerCase());

      const existing = existingRow ? this.hydratePattern(existingRow) : null;
      const evaluated = applyMistakeObservation({
        existing,
        input,
        userId,
        newClientId: proposedClientId,
        privacy,
      });

      if (!evaluated.accepted || !evaluated.pattern) {
        return evaluated;
      }

      if (evaluated.reason === "idempotent_duplicate_noop") {
        return evaluated;
      }

      const next = evaluated.pattern;
      let patternRowId: number;

      if (!existingRow) {
        const insertRes = this.db
          .prepare(
            `INSERT INTO learning_patterns (
              client_id, user_id, language_code, pattern_key, category, title,
              explanation, latest_mistake, latest_correction, status,
              occurrences_count, independent_success_count,
              distinct_success_sessions_count, first_seen_at_ms, last_seen_at_ms,
              next_retest_at_ms
            ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`
          )
          .run(
            next.clientId,
            userId,
            next.languageCode,
            next.patternKey,
            next.category,
            next.title,
            next.explanation,
            next.latestMistake,
            next.latestCorrection,
            next.status,
            next.occurrencesCount,
            next.independentSuccessCount,
            next.distinctSuccessSessionsCount,
            next.firstSeenAtMs,
            next.lastSeenAtMs,
            next.nextRetestAtMs
          );
        patternRowId = Number(insertRes.lastInsertRowid);
      } else {
        patternRowId = Number(existingRow.id);
      }

      const sessionRow = this.db
        .prepare("SELECT id FROM practice_sessions WHERE user_id = ? AND client_id = ?")
        .get(userId, input.sessionClientId);

      const newAttempt = next.attempts.find(
        (a) => a.idempotencyKey === input.idempotencyKey
      );
      if (!newAttempt) {
        throw new Error("Expected newly constructed attempt for idempotencyKey");
      }
      this.db
        .prepare(
          `INSERT OR IGNORE INTO pattern_attempts (
            idempotency_key, user_id, pattern_id, session_id, session_client_id,
            turn_index, dialect_id, input_modality, turn_origin, outcome,
            utterance, suggested_phrasing, ai_judgment_note, created_at_ms
          ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`
        )
        .run(
          newAttempt.idempotencyKey,
          userId,
          patternRowId,
          sessionRow ? Number(sessionRow.id) : null,
          newAttempt.sessionClientId,
          newAttempt.turnIndex,
          newAttempt.dialectId,
          newAttempt.inputModality,
          newAttempt.turnOrigin,
          newAttempt.outcome,
          newAttempt.utterance,
          newAttempt.suggestedPhrasing,
          newAttempt.aiJudgmentNote,
          newAttempt.createdAtMs
        );

      // Re-hydrate from persisted attempts and update materialized counts inside same TX
      const freshRow = this.db
        .prepare("SELECT * FROM learning_patterns WHERE id = ?")
        .get(patternRowId)!;
      const recomputed = this.hydratePattern(freshRow);

      this.db
        .prepare(
          `UPDATE learning_patterns
           SET title = ?, explanation = ?, latest_mistake = ?, latest_correction = ?,
               status = ?, occurrences_count = ?, independent_success_count = ?,
               distinct_success_sessions_count = ?, last_seen_at_ms = ?, next_retest_at_ms = ?
           WHERE id = ? AND user_id = ?`
        )
        .run(
          next.title,
          next.explanation,
          next.latestMistake,
          next.latestCorrection,
          recomputed.status,
          recomputed.occurrencesCount,
          recomputed.independentSuccessCount,
          recomputed.distinctSuccessSessionsCount,
          recomputed.lastSeenAtMs,
          recomputed.nextRetestAtMs,
          patternRowId,
          userId
        );

      return {
        accepted: true,
        reason: evaluated.reason,
        pattern: this.getPatternForUser(userId, recomputed.clientId),
      };
    });
  }

  /**
   * Transactionally records a follow-up retest attempt with ownership enforcement
   * and deterministic aggregate recomputation.
   */
  public async recordRetest(
    userId: number,
    patternClientId: string,
    input: RetestEvaluationInput
  ): Promise<{
    found: boolean;
    recorded: boolean;
    outcome: string | null;
    reason: string;
    pattern: LearningPatternRecord | null;
  }> {
    return this.runTransaction(() => {
      const privacy = this.getUserPrivacy(userId);
      const row = this.db
        .prepare("SELECT * FROM learning_patterns WHERE user_id = ? AND client_id = ?")
        .get(userId, patternClientId);

      if (!row) {
        return {
          found: false,
          recorded: false,
          outcome: null,
          reason: "not_found_or_forbidden",
          pattern: null,
        };
      }

      const existing = this.hydratePattern(row);
      const res = applyRetestEvaluation({ pattern: existing, input, privacy });
      if (!res.recorded || res.reason === "idempotent_duplicate_noop") {
        return { found: true, ...res };
      }

      const patternRowId = Number(row.id);
      const sessionRow = this.db
        .prepare("SELECT id FROM practice_sessions WHERE user_id = ? AND client_id = ?")
        .get(userId, input.sessionClientId);

      const newAttempt = res.pattern.attempts.find(
        (a) => a.idempotencyKey === input.idempotencyKey
      );
      if (!newAttempt) {
        throw new Error("Expected newly constructed retest attempt for idempotencyKey");
      }
      this.db
        .prepare(
          `INSERT OR IGNORE INTO pattern_attempts (
            idempotency_key, user_id, pattern_id, session_id, session_client_id,
            turn_index, dialect_id, input_modality, turn_origin, outcome,
            utterance, suggested_phrasing, ai_judgment_note, created_at_ms
          ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`
        )
        .run(
          newAttempt.idempotencyKey,
          userId,
          patternRowId,
          sessionRow ? Number(sessionRow.id) : null,
          newAttempt.sessionClientId,
          newAttempt.turnIndex,
          newAttempt.dialectId,
          newAttempt.inputModality,
          newAttempt.turnOrigin,
          newAttempt.outcome,
          newAttempt.utterance,
          newAttempt.suggestedPhrasing,
          newAttempt.aiJudgmentNote,
          newAttempt.createdAtMs
        );

      const recomputed = this.hydratePattern(row);
      this.db
        .prepare(
          `UPDATE learning_patterns
           SET status = ?, occurrences_count = ?, independent_success_count = ?,
               distinct_success_sessions_count = ?, last_seen_at_ms = ?, next_retest_at_ms = ?
           WHERE id = ? AND user_id = ?`
        )
        .run(
          recomputed.status,
          recomputed.occurrencesCount,
          recomputed.independentSuccessCount,
          recomputed.distinctSuccessSessionsCount,
          recomputed.lastSeenAtMs,
          recomputed.nextRetestAtMs,
          patternRowId,
          userId
        );

      return {
        found: true,
        recorded: true,
        outcome: res.outcome,
        reason: res.reason,
        pattern: this.getPatternForUser(userId, patternClientId),
      };
    });
  }

  /**
   * Transactional Server-Authoritative Versioned SRS review (Approach B — zero extra table).
   */
  public async applyVersionedSrsReview(
    userId: number,
    op: SrsReviewOperation,
    serverNowMs: number
  ): Promise<{
    found: boolean;
    applied: boolean;
    staleOptimisticSkipped: boolean;
    version: number;
    state: SrsCardState | null;
  }> {
    return this.runTransaction(() => {
      const row = this.db
        .prepare(
          `SELECT id, srs_json, srs_version, srs_applied_event_ids_json, srs_last_rating
           FROM saved_phrases
           WHERE user_id = ? AND client_id = ?`
        )
        .get(userId, op.phraseClientId);

      if (!row) {
        return {
          found: false,
          applied: false,
          staleOptimisticSkipped: false,
          version: 0,
          state: null,
        };
      }

      const currentVersion = Number(row.srs_version);
      const currentState: SrsCardState = row.srs_json
        ? (JSON.parse(String(row.srs_json)) as SrsCardState)
        : getDefaultSrsCard(serverNowMs);
      const appliedIds: string[] = JSON.parse(
        String(row.srs_applied_event_ids_json || "[]")
      );
      const lastRating = row.srs_last_rating
        ? (String(row.srs_last_rating) as SrsRating)
        : null;

      if (appliedIds.includes(op.eventId)) {
        return {
          found: true,
          applied: false,
          staleOptimisticSkipped: false,
          version: currentVersion,
          state: currentState,
        };
      }

      const nextIds = [...appliedIds, op.eventId].slice(-MAX_REMEMBERED_SRS_EVENTS);
      const isStaleVersion = op.baseVersion < currentVersion;
      const clampedClientTs = clampReviewTimestamp(op.clientReviewedAtMs, serverNowMs);

      if (
        isStaleVersion &&
        lastRating === "again" &&
        op.rating !== "again" &&
        clampedClientTs <= currentState.lastReviewedAt
      ) {
        this.db
          .prepare(
            `UPDATE saved_phrases
             SET srs_applied_event_ids_json = ?
             WHERE id = ? AND user_id = ?`
          )
          .run(JSON.stringify(nextIds), Number(row.id), userId);

        return {
          found: true,
          applied: false,
          staleOptimisticSkipped: true,
          version: currentVersion,
          state: currentState,
        };
      }

      const nextState = computeNextSrsState(
        currentVersion === 0 ? undefined : currentState,
        op.rating,
        serverNowMs
      );
      const nextVersion = currentVersion + 1;

      this.db
        .prepare(
          `UPDATE saved_phrases
           SET srs_json = ?, srs_version = ?, srs_applied_event_ids_json = ?, srs_last_rating = ?
           WHERE id = ? AND user_id = ?`
        )
        .run(
          JSON.stringify(nextState),
          nextVersion,
          JSON.stringify(nextIds),
          op.rating,
          Number(row.id),
          userId
        );

      return {
        found: true,
        applied: true,
        staleOptimisticSkipped: false,
        version: nextVersion,
        state: nextState,
      };
    });
  }

  public getPhraseSrsSnapshot(
    userId: number,
    phraseClientId: string
  ): { version: number; state: SrsCardState | null } | null {
    const row = this.db
      .prepare(
        "SELECT srs_json, srs_version FROM saved_phrases WHERE user_id = ? AND client_id = ?"
      )
      .get(userId, phraseClientId);
    if (!row) return null;
    return {
      version: Number(row.srs_version),
      state: row.srs_json ? (JSON.parse(String(row.srs_json)) as SrsCardState) : null,
    };
  }

  public close(): void {
    this.db.close();
  }
}
