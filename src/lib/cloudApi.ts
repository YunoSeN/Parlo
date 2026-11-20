import {
  DebriefReport,
  PracticeSessionRecord,
  SavedPhrase,
  Scenario,
} from "../types";

export interface AccountStateResponse {
  weeklySessionGoal: number;
  sessions: PracticeSessionRecord[];
  phrases: SavedPhrase[];
  customScenarios: Scenario[];
}

async function authRequest<T>(
  url: string,
  token: string,
  options: RequestInit = {}
): Promise<T> {
  const res = await fetch(url, {
    ...options,
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${token}`,
      ...(options.headers || {}),
    },
  });
  const data = await res.json().catch(() => ({}));
  if (!res.ok) {
    throw new Error(data.error || `Request failed (${res.status})`);
  }
  return data as T;
}

export function fetchAccountState(token: string) {
  return authRequest<AccountStateResponse>("/api/me/state", token, {
    method: "GET",
  });
}

export function persistWeeklyGoal(token: string, weeklySessionGoal: number) {
  return authRequest<{ weeklySessionGoal: number }>("/api/me/goal", token, {
    method: "PUT",
    body: JSON.stringify({ weeklySessionGoal }),
  });
}

export function persistPracticeSession(
  token: string,
  session: PracticeSessionRecord
) {
  return authRequest<{ ok: boolean }>("/api/me/sessions", token, {
    method: "POST",
    body: JSON.stringify(session),
  });
}

export function persistSessionDebrief(
  token: string,
  sessionId: string,
  debrief: DebriefReport
) {
  return authRequest<{ ok: boolean }>(
    `/api/me/sessions/${encodeURIComponent(sessionId)}/debrief`,
    token,
    {
      method: "PUT",
      body: JSON.stringify(debrief),
    }
  );
}

export function persistSavedPhrase(token: string, phrase: SavedPhrase) {
  return authRequest<{ ok: boolean }>("/api/me/phrases", token, {
    method: "POST",
    body: JSON.stringify(phrase),
  });
}

export function persistPhraseMastered(
  token: string,
  phraseId: string,
  mastered: boolean
) {
  return authRequest<{ ok: boolean }>(
    `/api/me/phrases/${encodeURIComponent(phraseId)}`,
    token,
    {
      method: "PATCH",
      body: JSON.stringify({ mastered }),
    }
  );
}

export function removeSavedPhrase(token: string, phraseId: string) {
  return authRequest<{ ok: boolean }>(
    `/api/me/phrases/${encodeURIComponent(phraseId)}`,
    token,
    {
      method: "DELETE",
    }
  );
}

export function persistCustomScenario(token: string, scenario: Scenario) {
  return authRequest<{ ok: boolean }>("/api/me/scenarios", token, {
    method: "POST",
    body: JSON.stringify(scenario),
  });
}
