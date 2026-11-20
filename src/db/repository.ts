import { and, desc, eq } from "drizzle-orm";
import { db } from "./index.ts";
import {
  customScenarios,
  practiceSessions,
  savedPhrases,
} from "./schema.ts";
import {
  CefrLevel,
  DebriefReport,
  PracticeSessionRecord,
  SavedPhrase,
  Scenario,
  VoiceName,
} from "../types.ts";

function safeJsonParse<T>(raw: string | null | undefined, fallback: T): T {
  if (!raw) return fallback;
  try {
    return JSON.parse(raw) as T;
  } catch {
    return fallback;
  }
}

export async function listUserSessions(
  userId: number
): Promise<PracticeSessionRecord[]> {
  try {
    const rows = await db
      .select()
      .from(practiceSessions)
      .where(eq(practiceSessions.userId, userId))
      .orderBy(desc(practiceSessions.dateMs));

    return rows.map((row) => ({
      id: row.clientId,
      date: row.dateMs,
      languageCode: row.languageCode,
      level: row.level as CefrLevel,
      scenarioTitle: row.scenarioTitle,
      partnerName: row.partnerName,
      durationSeconds: row.durationSeconds,
      userTurnsCount: row.userTurnsCount,
      partnerTurnsCount: row.partnerTurnsCount,
      goalsCompleted: row.goalsCompleted,
      goalsTotal: row.goalsTotal,
      transcript: safeJsonParse<
        {
          role: "user" | "partner";
          text: string;
        }[]
      >(row.transcriptJson, []),
      debrief: safeJsonParse<DebriefReport | undefined>(
        row.debriefJson,
        undefined
      ),
    }));
  } catch (error) {
    console.error("Failed to list practice sessions:", error);
    throw new Error("Unable to load practice sessions.", { cause: error });
  }
}

export async function upsertPracticeSession(
  userId: number,
  record: PracticeSessionRecord
): Promise<void> {
  try {
    await db
      .insert(practiceSessions)
      .values({
        clientId: record.id,
        userId,
        dateMs: record.date,
        languageCode: record.languageCode,
        level: record.level,
        scenarioTitle: record.scenarioTitle,
        partnerName: record.partnerName,
        durationSeconds: record.durationSeconds,
        userTurnsCount: record.userTurnsCount,
        partnerTurnsCount: record.partnerTurnsCount,
        goalsCompleted: record.goalsCompleted,
        goalsTotal: record.goalsTotal,
        transcriptJson: JSON.stringify(record.transcript),
        debriefJson: record.debrief ? JSON.stringify(record.debrief) : null,
      })
      .onConflictDoUpdate({
        target: practiceSessions.clientId,
        set: {
          durationSeconds: record.durationSeconds,
          goalsCompleted: record.goalsCompleted,
          debriefJson: record.debrief ? JSON.stringify(record.debrief) : null,
        },
        setWhere: eq(practiceSessions.userId, userId),
      });
  } catch (error) {
    console.error("Failed to save practice session:", error);
    throw new Error("Unable to save practice session.", { cause: error });
  }
}

export async function saveSessionDebriefRecord(
  userId: number,
  clientId: string,
  debrief: DebriefReport
): Promise<void> {
  try {
    await db
      .update(practiceSessions)
      .set({ debriefJson: JSON.stringify(debrief) })
      .where(
        and(
          eq(practiceSessions.userId, userId),
          eq(practiceSessions.clientId, clientId)
        )
      );
  } catch (error) {
    console.error("Failed to update session debrief:", error);
    throw new Error("Unable to save coaching debrief.", { cause: error });
  }
}

export async function listUserPhrases(userId: number): Promise<SavedPhrase[]> {
  try {
    const rows = await db
      .select()
      .from(savedPhrases)
      .where(eq(savedPhrases.userId, userId))
      .orderBy(desc(savedPhrases.createdAtMs));

    return rows.map((row) => ({
      id: row.clientId,
      phrase: row.phrase,
      translation: row.translation,
      reading: row.reading ?? undefined,
      languageCode: row.languageCode,
      scenarioTitle: row.scenarioTitle,
      note: row.note ?? undefined,
      createdAt: row.createdAtMs,
      mastered: row.mastered,
    }));
  } catch (error) {
    console.error("Failed to list saved phrases:", error);
    throw new Error("Unable to load saved phrases.", { cause: error });
  }
}

export async function upsertSavedPhrase(
  userId: number,
  phrase: SavedPhrase
): Promise<void> {
  try {
    await db
      .insert(savedPhrases)
      .values({
        clientId: phrase.id,
        userId,
        phrase: phrase.phrase,
        translation: phrase.translation,
        reading: phrase.reading ?? null,
        languageCode: phrase.languageCode,
        scenarioTitle: phrase.scenarioTitle,
        note: phrase.note ?? null,
        mastered: phrase.mastered,
        createdAtMs: phrase.createdAt,
      })
      .onConflictDoUpdate({
        target: savedPhrases.clientId,
        set: {
          mastered: phrase.mastered,
          translation: phrase.translation,
          note: phrase.note ?? null,
        },
        setWhere: eq(savedPhrases.userId, userId),
      });
  } catch (error) {
    console.error("Failed to save phrase:", error);
    throw new Error("Unable to save phrase.", { cause: error });
  }
}

export async function toggleSavedPhraseMastered(
  userId: number,
  clientId: string,
  mastered: boolean
): Promise<void> {
  try {
    await db
      .update(savedPhrases)
      .set({ mastered })
      .where(
        and(
          eq(savedPhrases.userId, userId),
          eq(savedPhrases.clientId, clientId)
        )
      );
  } catch (error) {
    console.error("Failed to toggle phrase mastery:", error);
    throw new Error("Unable to update phrase status.", { cause: error });
  }
}

export async function deleteSavedPhraseRecord(
  userId: number,
  clientId: string
): Promise<void> {
  try {
    await db
      .delete(savedPhrases)
      .where(
        and(
          eq(savedPhrases.userId, userId),
          eq(savedPhrases.clientId, clientId)
        )
      );
  } catch (error) {
    console.error("Failed to delete saved phrase:", error);
    throw new Error("Unable to remove saved phrase.", { cause: error });
  }
}

export async function listUserCustomScenarios(
  userId: number
): Promise<Scenario[]> {
  try {
    const rows = await db
      .select()
      .from(customScenarios)
      .where(eq(customScenarios.userId, userId))
      .orderBy(desc(customScenarios.createdAt));

    return rows.map((row) => ({
      id: row.clientId,
      title: row.title,
      city: row.city,
      category: row.category,
      durationLabel: "Flexible",
      defaultLanguageCode: row.defaultLanguageCode,
      recommendedLevel: row.recommendedLevel as CefrLevel,
      partnerName: row.partnerName,
      partnerRole: row.partnerRole,
      defaultVoice: row.defaultVoice as VoiceName,
      fallbackGradient: "from-slate-800 via-blue-950 to-slate-900",
      summary: row.summary,
      promptContext: row.promptContext,
      goals: safeJsonParse<string[]>(row.goalsJson, []),
      starterPhrases: {},
      isCustom: true,
    }));
  } catch (error) {
    console.error("Failed to list custom scenarios:", error);
    throw new Error("Unable to load custom scenarios.", { cause: error });
  }
}

export async function upsertCustomScenario(
  userId: number,
  scenario: Scenario
): Promise<void> {
  try {
    await db
      .insert(customScenarios)
      .values({
        clientId: scenario.id,
        userId,
        title: scenario.title,
        city: scenario.city,
        category: scenario.category,
        defaultLanguageCode: scenario.defaultLanguageCode,
        recommendedLevel: scenario.recommendedLevel,
        partnerName: scenario.partnerName,
        partnerRole: scenario.partnerRole,
        defaultVoice: scenario.defaultVoice,
        summary: scenario.summary,
        promptContext: scenario.promptContext,
        goalsJson: JSON.stringify(scenario.goals),
      })
      .onConflictDoNothing({
        target: customScenarios.clientId,
      });
  } catch (error) {
    console.error("Failed to save custom scenario:", error);
    throw new Error("Unable to save custom scenario.", { cause: error });
  }
}
