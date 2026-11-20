import {
  CoachFeedback,
  DebriefReport,
  ReplySuggestion,
  TurnTranslation,
} from "../types";

async function postJson<T>(url: string, body: unknown): Promise<T> {
  const res = await fetch(url, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(body),
  });
  const data = await res.json().catch(() => ({}));
  if (!res.ok) {
    throw new Error(data.error || `Request failed (${res.status})`);
  }
  return data as T;
}

export async function fetchTurnFeedback(params: {
  turnId: string;
  utterance: string;
  languageName: string;
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

export async function fetchSessionDebrief(params: {
  languageName: string;
  level: string;
  scenarioTitle: string;
  transcript: { role: string; text: string }[];
}): Promise<DebriefReport> {
  return postJson<DebriefReport>("/api/coach/debrief", params);
}
