import { PracticeSessionRecord } from "../types";

export interface StreakDayPoint {
  dateKey: string;
  dayLabel: string;
  dayNumber: number;
  sessionCount: number;
  isToday: boolean;
}

export interface DailyStreakStats {
  currentStreak: number;
  longestStreak: number;
  practicedToday: boolean;
  totalPracticeDays: number;
  recentDays: StreakDayPoint[];
}

const SHORT_DAYS = ["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"];

function toLocalDateKey(date: Date): string {
  const y = date.getFullYear();
  const m = String(date.getMonth() + 1).padStart(2, "0");
  const d = String(date.getDate()).padStart(2, "0");
  return `${y}-${m}-${d}`;
}

function toDayIndex(date: Date): number {
  return Math.floor(
    Date.UTC(date.getFullYear(), date.getMonth(), date.getDate()) / 86_400_000
  );
}

export function computeDailyStreak(
  sessions: PracticeSessionRecord[],
  referenceDate: Date = new Date()
): DailyStreakStats {
  const countsByKey = new Map<string, number>();
  const distinctDayIndices = new Set<number>();

  for (const session of sessions) {
    const d = new Date(session.date);
    if (Number.isNaN(d.getTime())) continue;
    const key = toLocalDateKey(d);
    countsByKey.set(key, (countsByKey.get(key) ?? 0) + 1);
    distinctDayIndices.add(toDayIndex(d));
  }

  const today = new Date(
    referenceDate.getFullYear(),
    referenceDate.getMonth(),
    referenceDate.getDate()
  );
  const todayIndex = toDayIndex(today);
  const practicedToday = distinctDayIndices.has(todayIndex);

  // Active streak counts consecutive days ending today, or ending yesterday if not yet practiced today
  let currentStreak = 0;
  let cursorIndex = practicedToday ? todayIndex : todayIndex - 1;
  while (distinctDayIndices.has(cursorIndex)) {
    currentStreak += 1;
    cursorIndex -= 1;
  }

  // Longest historical consecutive day streak across all sessions
  const sortedIndices = Array.from(distinctDayIndices).sort((a, b) => a - b);
  let longestStreak = 0;
  let running = 0;
  for (let i = 0; i < sortedIndices.length; i += 1) {
    if (i === 0 || sortedIndices[i] === sortedIndices[i - 1] + 1) {
      running += 1;
    } else {
      running = 1;
    }
    if (running > longestStreak) {
      longestStreak = running;
    }
  }

  // Rolling last 7 local days (oldest -> today)
  const recentDays: StreakDayPoint[] = [];
  for (let offset = 6; offset >= 0; offset -= 1) {
    const d = new Date(today);
    d.setDate(today.getDate() - offset);
    const key = toLocalDateKey(d);
    recentDays.push({
      dateKey: key,
      dayLabel: SHORT_DAYS[d.getDay()],
      dayNumber: d.getDate(),
      sessionCount: countsByKey.get(key) ?? 0,
      isToday: offset === 0,
    });
  }

  return {
    currentStreak,
    longestStreak,
    practicedToday,
    totalPracticeDays: distinctDayIndices.size,
    recentDays,
  };
}
