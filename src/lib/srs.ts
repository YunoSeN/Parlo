import { SrsCardState, SrsRating } from "../types";

const SRS_STORAGE_KEY = "parlo_srs_schedule_v1";
const DAY_MS = 24 * 60 * 60 * 1000;

export type SrsScheduleMap = Record<string, SrsCardState>;

export function readSrsScheduleMap(): SrsScheduleMap {
  try {
    const raw = localStorage.getItem(SRS_STORAGE_KEY);
    if (!raw) return {};
    const parsed = JSON.parse(raw);
    return parsed && typeof parsed === "object" ? (parsed as SrsScheduleMap) : {};
  } catch {
    return {};
  }
}

export function saveSrsScheduleMap(map: SrsScheduleMap): void {
  try {
    localStorage.setItem(SRS_STORAGE_KEY, JSON.stringify(map));
  } catch {
    // ignore storage quota errors
  }
}

export function getDefaultSrsCard(now = Date.now()): SrsCardState {
  return {
    repetitions: 0,
    intervalDays: 0,
    easeFactor: 2.5,
    nextReviewAt: now,
    lastReviewedAt: 0,
  };
}

/**
 * Standard SM-2 spaced-repetition calculation tuned for concise 3-button recall:
 * - "again": resets repetitions, schedules tomorrow (1d)
 * - "good": 1d -> 3d -> round(prev * easeFactor)
 * - "easy": 4d -> round(prev * easeFactor * 1.3)
 */
export function computeNextSrsState(
  prev: SrsCardState | undefined,
  rating: SrsRating,
  now = Date.now()
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
    // easy
    nextEase = Math.min(2.9, Number((current.easeFactor + 0.15).toFixed(2)));
    if (nextReps === 1) nextInterval = 4;
    else if (nextReps === 2) nextInterval = 7;
    else
      nextInterval = Math.max(
        7,
        Math.round(current.intervalDays * nextEase * 1.25)
      );
  }

  return {
    repetitions: nextReps,
    intervalDays: nextInterval,
    easeFactor: nextEase,
    nextReviewAt: now + nextInterval * DAY_MS,
    lastReviewedAt: now,
  };
}

export function isSrsCardDue(
  state: SrsCardState | undefined,
  now = Date.now()
): boolean {
  if (!state) return true;
  return state.nextReviewAt <= now;
}

export function formatIntervalLabel(days: number): string {
  if (days <= 0) return "Due now";
  if (days === 1) return "1d";
  if (days < 30) return `${days}d`;
  const months = Math.round(days / 30);
  return `${months}mo`;
}
