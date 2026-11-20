import { eq } from "drizzle-orm";
import { db } from "./index.ts";
import { users } from "./schema.ts";

export async function getOrCreateUser(
  uid: string,
  email: string,
  displayName?: string | null
) {
  try {
    const result = await db
      .insert(users)
      .values({
        uid,
        email,
        displayName: displayName ?? null,
      })
      .onConflictDoUpdate({
        target: users.uid,
        set: {
          email,
          displayName: displayName ?? null,
          updatedAt: new Date(),
        },
      })
      .returning();

    return result[0];
  } catch (error) {
    console.error("Failed to upsert user record:", error);
    throw new Error("Unable to synchronize user profile.", { cause: error });
  }
}

export async function updateUserWeeklyGoal(uid: string, weeklyGoal: number) {
  const clamped = Math.max(1, Math.min(14, Math.round(weeklyGoal)));
  try {
    const result = await db
      .update(users)
      .set({
        weeklySessionGoal: clamped,
        updatedAt: new Date(),
      })
      .where(eq(users.uid, uid))
      .returning();

    return result[0] ?? null;
  } catch (error) {
    console.error("Failed to update weekly session goal:", error);
    throw new Error("Unable to update weekly goal.", { cause: error });
  }
}
