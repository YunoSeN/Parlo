import {
  CoachFeedback,
  DebriefReport,
  ReplySuggestion,
  TurnTranslation,
  WordLookupResult,
} from "../types";

type TokenProvider = () => Promise<string | null>;

let apiTokenProvider: TokenProvider | null = null;

export function setApiTokenProvider(provider: TokenProvider | null): void {
  apiTokenProvider = provider;
}

async function postJson<T>(url: string, body: unknown): Promise<T> {
  const headers: Record<string, string> = {
    "Content-Type": "application/json",
  };
  if (apiTokenProvider) {
    try {
      const token = await apiTokenProvider();
      if (token) {
        headers.Authorization = `Bearer ${token}`;
      }
    } catch {
      // Fall back to guest quota cleanly
    }
  }

  const res = await fetch(url, {
    method: "POST",
    headers,
    body: JSON.stringify(body),
  });
  const data = await res.json().catch(() => ({}));
  if (!res.ok) {
    throw new Error(
      typeof data.error === "string" && data.error.trim()
        ? data.error
        : res.status === 429
        ? "Too many requests right now. Please wait a moment and try again."
        : `Request failed (${res.status})`
    );
  }
  return data as T;
}

export async function fetchTurnFeedback(params: {
  turnId: string;
  utterance: string;
  languageName: string;
  dialectLabel?: string;
  dialectDirective?: string;
  level: string;
  scenarioTitle: string;
  recentTurns: { role: string; text: string }[];
  goals: string[];
}): Promise<CoachFeedback> {
  const result = await postJson<{
    isNatural: boolean;
    corrected: string;
    explanation: string;
    tip: string;
    keyPhrase?: { phrase: string; translation: string; reading?: string };
    completedGoalIndices: number[];
  }>("/api/coach/feedback", params);

  return {
    turnId: params.turnId,
    original: params.utterance,
    isNatural: result.isNatural,
    corrected: result.corrected,
    explanation: result.explanation,
    tip: result.tip,
    keyPhrase: result.keyPhrase?.phrase ? result.keyPhrase : undefined,
    completedGoalIndices: Array.isArray(result.completedGoalIndices)
      ? result.completedGoalIndices
      : [],
    createdAt: Date.now(),
  };
}

export async function fetchTurnTranslation(params: {
  text: string;
  languageName: string;
}): Promise<TurnTranslation> {
  return postJson<TurnTranslation>("/api/coach/translate", params);
}

export async function fetchReplyHints(params: {
  languageName: string;
  dialectLabel?: string;
  dialectDirective?: string;
  level: string;
  scenarioTitle: string;
  scenarioPrompt: string;
  recentTurns: { role: string; text: string }[];
}): Promise<ReplySuggestion[]> {
  const res = await postJson<{ suggestions: ReplySuggestion[] }>(
    "/api/coach/hints",
    params
  );
  return res.suggestions ?? [];
}

const wordLookupCache = new Map<string, WordLookupResult>();

export async function fetchWordLookup(params: {
  word: string;
  sentenceContext: string;
  languageName: string;
  dialectLabel?: string;
  level: string;
}): Promise<WordLookupResult> {
  const cacheKey = `${params.languageName}|${params.dialectLabel || ""}|${params.word.trim().toLowerCase()}|${params.sentenceContext.slice(0, 60)}`;
  const cached = wordLookupCache.get(cacheKey);
  if (cached) return cached;

  const result = await postJson<WordLookupResult>("/api/coach/word", params);
  wordLookupCache.set(cacheKey, result);
  return result;
}

export async function fetchSessionDebrief(params: {
  languageName: string;
  level: string;
  scenarioTitle: string;
  transcript: { role: string; text: string }[];
}): Promise<DebriefReport> {
  return postJson<DebriefReport>("/api/coach/debrief", params);
}

export type TutorChatRoleId =
  | "conversation"
  | "grammar"
  | "culture"
  | "phrases";

export type TutorChatSpeedMode = "balanced" | "fast";

export interface TutorChatHistoryItem {
  role: "user" | "model";
  text: string;
}

export async function sendTutorChatMessage(params: {
  history: TutorChatHistoryItem[];
  message: string;
  roleId: TutorChatRoleId;
  speedMode: TutorChatSpeedMode;
  languageName: string;
  languageNative: string;
  dialectLabel?: string;
  dialectDirective?: string;
  level: string;
  cultureAtelier: string;
  scenarioTitle: string;
}): Promise<{ reply: string; model: string }> {
  return postJson<{ reply: string; model: string }>("/api/chat", params);
}


