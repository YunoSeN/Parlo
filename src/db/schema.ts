import { relations } from "drizzle-orm";
import {
  bigint,
  boolean,
  integer,
  pgTable,
  serial,
  text,
  timestamp,
} from "drizzle-orm/pg-core";

export const users = pgTable("users", {
  id: serial("id").primaryKey(),
  uid: text("uid").notNull().unique(),
  email: text("email").notNull(),
  displayName: text("display_name"),
  weeklySessionGoal: integer("weekly_session_goal").notNull().default(4),
  createdAt: timestamp("created_at").defaultNow().notNull(),
  updatedAt: timestamp("updated_at").defaultNow().notNull(),
});

export const practiceSessions = pgTable("practice_sessions", {
  id: serial("id").primaryKey(),
  clientId: text("client_id").notNull().unique(),
  userId: integer("user_id")
    .references(() => users.id, { onDelete: "cascade" })
    .notNull(),
  dateMs: bigint("date_ms", { mode: "number" }).notNull(),
  languageCode: text("language_code").notNull(),
  level: text("level").notNull(),
  scenarioTitle: text("scenario_title").notNull(),
  partnerName: text("partner_name").notNull(),
  durationSeconds: integer("duration_seconds").notNull(),
  userTurnsCount: integer("user_turns_count").notNull(),
  partnerTurnsCount: integer("partner_turns_count").notNull(),
  goalsCompleted: integer("goals_completed").notNull(),
  goalsTotal: integer("goals_total").notNull(),
  transcriptJson: text("transcript_json").notNull(),
  debriefJson: text("debrief_json"),
  createdAt: timestamp("created_at").defaultNow().notNull(),
});

export const savedPhrases = pgTable("saved_phrases", {
  id: serial("id").primaryKey(),
  clientId: text("client_id").notNull().unique(),
  userId: integer("user_id")
    .references(() => users.id, { onDelete: "cascade" })
    .notNull(),
  phrase: text("phrase").notNull(),
  translation: text("translation").notNull(),
  reading: text("reading"),
  languageCode: text("language_code").notNull(),
  scenarioTitle: text("scenario_title").notNull(),
  note: text("note"),
  mastered: boolean("mastered").notNull().default(false),
  createdAtMs: bigint("created_at_ms", { mode: "number" }).notNull(),
});

export const customScenarios = pgTable("custom_scenarios", {
  id: serial("id").primaryKey(),
  clientId: text("client_id").notNull().unique(),
  userId: integer("user_id")
    .references(() => users.id, { onDelete: "cascade" })
    .notNull(),
  title: text("title").notNull(),
  city: text("city").notNull(),
  category: text("category").notNull(),
  defaultLanguageCode: text("default_language_code").notNull(),
  recommendedLevel: text("recommended_level").notNull(),
  partnerName: text("partner_name").notNull(),
  partnerRole: text("partner_role").notNull(),
  defaultVoice: text("default_voice").notNull(),
  summary: text("summary").notNull(),
  promptContext: text("prompt_context").notNull(),
  goalsJson: text("goals_json").notNull(),
  createdAt: timestamp("created_at").defaultNow().notNull(),
});

export const usersRelations = relations(users, ({ many }) => ({
  practiceSessions: many(practiceSessions),
  savedPhrases: many(savedPhrases),
  customScenarios: many(customScenarios),
}));

export const practiceSessionsRelations = relations(
  practiceSessions,
  ({ one }) => ({
    user: one(users, {
      fields: [practiceSessions.userId],
      references: [users.id],
    }),
  })
);

export const savedPhrasesRelations = relations(savedPhrases, ({ one }) => ({
  user: one(users, {
    fields: [savedPhrases.userId],
    references: [users.id],
  }),
}));

export const customScenariosRelations = relations(
  customScenarios,
  ({ one }) => ({
    user: one(users, {
      fields: [customScenarios.userId],
      references: [users.id],
    }),
  })
);
