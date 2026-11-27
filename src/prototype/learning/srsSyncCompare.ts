/**
 * Side-by-Side Comparison: Event-Sourced SRS vs. Simpler Server-Authoritative Versioned SRS
 *
 * Question #5: "Compare event-sourced SRS synchronization with a simpler
 * server-authoritative, versioned alternative. Choose the least complex solution
 * that passes offline, duplicate and conflict tests."
 *
 * Both implementations share the exact same pure SM-2 math (`computeNextSrsState`)
 * so the comparison isolates ONLY synchronization semantics, schema complexity,
 * and conflict behavior.
 */

export type SrsRating = "again" | "good" | "easy";

export interface SrsCardState {
  repetitions: number;
  intervalDays: number;
  easeFactor: number;
  nextReviewAt: number;
  lastReviewedAt: number;
}

export interface SrsReviewOperation {
  eventId: string;
  phraseClientId: string;
  rating: SrsRating;
  clientReviewedAtMs: number;
  baseVersion: number;
  deviceId: string;
}

const DAY_MS = 24 * 60 * 60 * 1000;
const MAX_BACKDATE_MS = 30 * DAY_MS;
const MAX_FUTURE_SKEW_MS = 60 * 1000;

export function getDefaultSrsCard(now: number): SrsCardState {
  return {
    repetitions: 0,
    intervalDays: 0,
    easeFactor: 2.5,
    nextReviewAt: now,
    lastReviewedAt: 0,
  };
}

export function computeNextSrsState(
  prev: SrsCardState | undefined,
  rating: SrsRating,
  now: number
): SrsCardState {
  const current = prev ?? getDefaultSrsCard(now);

  if (rating === "again") {
    return {
      repetitions: 0,
      intervalDays: 1,
      easeFactor: Math.max(1.3, Number((current.easeFactor - 0.2).toFixed(2))),
      nextReviewAt: now + DAY_MS,
      lastReviewedAt: now,
    };
  }

  const nextReps = current.repetitions + 1;
  let nextInterval = 1;
  let nextEase = current.easeFactor;

  if (rating === "good") {
    if (nextReps === 1) nextInterval = 1;
    else if (nextReps === 2) nextInterval = 3;
    else nextInterval = Math.max(4, Math.round(current.intervalDays * current.easeFactor));
  } else {
    nextEase = Math.min(2.9, Number((current.easeFactor + 0.15).toFixed(2)));
    if (nextReps === 1) nextInterval = 4;
    else if (nextReps === 2) nextInterval = 7;
    else nextInterval = Math.max(7, Math.round(current.intervalDays * nextEase * 1.25));
  }

  return {
    repetitions: nextReps,
    intervalDays: nextInterval,
    easeFactor: nextEase,
    nextReviewAt: now + nextInterval * DAY_MS,
    lastReviewedAt: now,
  };
}

export function clampReviewTimestamp(
  clientReviewedAtMs: number,
  serverNowMs: number
): number {
  const minAllowed = serverNowMs - MAX_BACKDATE_MS;
  const maxAllowed = serverNowMs + MAX_FUTURE_SKEW_MS;
  return Math.min(maxAllowed, Math.max(minAllowed, clientReviewedAtMs));
}

// ============================================================================
// APPROACH A: Event-Sourced Append-Only Log (requires extra `srs_review_events` table)
// ============================================================================

export interface StoredSrsEvent extends SrsReviewOperation {
  effectiveReviewedAtMs: number;
  serverReceivedAtMs: number;
}

export class EventSourcedSrsSync {
  private readonly eventsByPhrase = new Map<string, StoredSrsEvent[]>();
  private readonly seenEventIds = new Set<string>();
  private readonly versions = new Map<string, number>();

  public ingest(
    op: SrsReviewOperation,
    serverNowMs: number
  ): { applied: boolean; version: number; state: SrsCardState } {
    const existingList = this.eventsByPhrase.get(op.phraseClientId) ?? [];

    if (this.seenEventIds.has(op.eventId)) {
      return {
        applied: false,
        version: this.versions.get(op.phraseClientId) ?? 0,
        state: this.fold(existingList, serverNowMs),
      };
    }

    this.seenEventIds.add(op.eventId);
    const stored: StoredSrsEvent = {
      ...op,
      effectiveReviewedAtMs: clampReviewTimestamp(
        op.clientReviewedAtMs,
        serverNowMs
      ),
      serverReceivedAtMs: serverNowMs,
    };

    const nextList = [...existingList, stored];
    this.eventsByPhrase.set(op.phraseClientId, nextList);
    const nextVersion = (this.versions.get(op.phraseClientId) ?? 0) + 1;
    this.versions.set(op.phraseClientId, nextVersion);

    return {
      applied: true,
      version: nextVersion,
      state: this.fold(nextList, serverNowMs),
    };
  }

  private fold(events: StoredSrsEvent[], fallbackNowMs: number): SrsCardState {
    if (events.length === 0) return getDefaultSrsCard(fallbackNowMs);
    const ordered = [...events].sort(
      (a, b) =>
        a.effectiveReviewedAtMs - b.effectiveReviewedAtMs ||
        a.eventId.localeCompare(b.eventId)
    );
    let state: SrsCardState | undefined;
    for (const ev of ordered) {
      state = computeNextSrsState(state, ev.rating, ev.effectiveReviewedAtMs);
    }
    return state!;
  }

  public getEventCount(phraseClientId: string): number {
    return this.eventsByPhrase.get(phraseClientId)?.length ?? 0;
  }
}

// ============================================================================
// APPROACH B: Simpler Server-Authoritative Versioned State (ZERO extra DB table!)
//
// Stores ONLY 3 fields on the existing `saved_phrases` row:
//   - `srsState` (JSON)
//   - `srsVersion` (monotonic integer)
//   - `appliedEventIds` (bounded ring buffer of last 32 processed event UUIDs)
//
// Conflict Rule ("Conservative Lapse-Wins"):
//   1. If `eventId` already in `appliedEventIds` -> idempotent no-op.
//   2. Timestamp is strictly server-clamped (`serverNowMs` for online ops;
//      clamped client timestamp only for offline conflict detection).
//   3. If `baseVersion < currentVersion` (stale offline op) AND the server
//      already recorded a MORE RECENT `again` lapse (reps === 0 && lastReviewedAt > 0)
//      AND the stale op is optimistic (`good`/`easy`), mark the event as processed
//      WITHOUT overwriting the lapse (conservative memory preservation!).
//   4. Otherwise apply the rating onto the current server state and increment version.
// ============================================================================

export interface VersionedSrsRow {
  state: SrsCardState;
  version: number;
  appliedEventIds: string[];
  lastRating: SrsRating | null;
}

const MAX_REMEMBERED_EVENT_IDS = 32;

export class ServerAuthoritativeVersionedSrsSync {
  private readonly rows = new Map<string, VersionedSrsRow>();

  public ingest(
    op: SrsReviewOperation,
    serverNowMs: number
  ): {
    applied: boolean;
    staleOptimisticSkipped: boolean;
    version: number;
    state: SrsCardState;
  } {
    const existing: VersionedSrsRow = this.rows.get(op.phraseClientId) ?? {
      state: getDefaultSrsCard(serverNowMs),
      version: 0,
      appliedEventIds: [],
      lastRating: null,
    };

    // 1. Exact duplicate retry -> idempotent no-op
    if (existing.appliedEventIds.includes(op.eventId)) {
      return {
        applied: false,
        staleOptimisticSkipped: false,
        version: existing.version,
        state: existing.state,
      };
    }

    const nextAppliedIds = [...existing.appliedEventIds, op.eventId].slice(
      -MAX_REMEMBERED_EVENT_IDS
    );

    const isStaleVersion = op.baseVersion < existing.version;
    const clampedClientTs = clampReviewTimestamp(
      op.clientReviewedAtMs,
      serverNowMs
    );

    // 2. Conservative Lapse-Wins Rule for stale offline optimistic reviews:
    //    If another device already recorded a lapse (`again`) on the server,
    //    a stale offline `good`/`easy` from an older baseVersion MUST NOT
    //    erase the lapse and artificially lengthen the interval.
    if (
      isStaleVersion &&
      existing.lastRating === "again" &&
      op.rating !== "again" &&
      clampedClientTs <= existing.state.lastReviewedAt
    ) {
      const preserved: VersionedSrsRow = {
        ...existing,
        appliedEventIds: nextAppliedIds,
      };
      this.rows.set(op.phraseClientId, preserved);
      return {
        applied: false,
        staleOptimisticSkipped: true,
        version: preserved.version,
        state: preserved.state,
      };
    }

    // 3. Apply operation authoritatively using server clock (immune to client clock skew!)
    const nextState = computeNextSrsState(
      existing.version === 0 ? undefined : existing.state,
      op.rating,
      serverNowMs
    );

    const updated: VersionedSrsRow = {
      state: nextState,
      version: existing.version + 1,
      appliedEventIds: nextAppliedIds,
      lastRating: op.rating,
    };
    this.rows.set(op.phraseClientId, updated);

    return {
      applied: true,
      staleOptimisticSkipped: false,
      version: updated.version,
      state: updated.state,
    };
  }

  public getRow(phraseClientId: string): VersionedSrsRow | undefined {
    return this.rows.get(phraseClientId);
  }
}
