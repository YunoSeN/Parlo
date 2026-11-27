import assert from "node:assert/strict";
import fs from "node:fs";
import path from "node:path";
import { describe, it } from "node:test";
import { getWarmupPhrasesForLanguage } from "../data/dailyPhrases.ts";
import {
  didSessionCompleteDailyMission,
  getDailyCulturalMission,
} from "../lib/dailyMission.ts";
import { getRoleplayArtifact } from "../lib/roleplayArtifacts.ts";
import { countSpokenUnits, extractCefrShortLabel } from "../lib/textMetrics.ts";
import { CefrLevel } from "../types.ts";

const ALL_LANGUAGE_CODES = ["es", "fr", "ja", "de", "it", "zh", "ko", "pt"];

describe("Sprint 1 — 8-Language Parity, A1 Tier & Text Metrics", () => {
  it("declares dedicated curated scenarios for all 8 languages in catalog.ts", () => {
    const catalogSrc = fs.readFileSync(
      path.resolve("src/data/catalog.ts"),
      "utf8"
    );
    const expectedScenarioIds = [
      "madrid-cafe",
      "tokyo-counter",
      "paris-bookshop",
      "seoul-cafe",
      "taipei-teahouse",
      "lisbon-bakery",
      "berlin-studio",
      "milan-apartment",
    ];
    for (const id of expectedScenarioIds) {
      assert.ok(
        catalogSrc.includes(`id: '${id}'`),
        `Expected catalog.ts to define scenario '${id}'`
      );
    }
    assert.ok(
      catalogSrc.includes("A1: 'Beginner"),
      "Expected CEFR_DESCRIPTIONS to include A1 Beginner tier"
    );
  });

  it("never falls back to English speakPrompts in roleplay artifacts for zh, ko, or pt", () => {
    const englishSentinel = "What would you personally recommend here";
    for (const code of ALL_LANGUAGE_CODES) {
      const artifact = getRoleplayArtifact(
        "open-conversation",
        code,
        "Free Chat"
      );
      assert.ok(
        artifact.items.length >= 3,
        `Expected >= 3 artifact items for ${code}`
      );
      for (const item of artifact.items) {
        assert.ok(
          !item.speakPrompt.includes(englishSentinel),
          `Found English fallback speakPrompt for ${code}`
        );
      }
    }

    const koArtifact = getRoleplayArtifact("seoul-cafe", "ko", "Seoul Café");
    assert.ok(
      koArtifact.items.some((i) => /[\uac00-\ud7af]/.test(i.speakPrompt)),
      "Expected Hangul speakPrompt in Seoul café artifact"
    );

    const zhArtifact = getRoleplayArtifact(
      "taipei-teahouse",
      "zh",
      "Taipei Tea"
    );
    assert.ok(
      zhArtifact.items.some((i) => /[\u4e00-\u9fff]/.test(i.speakPrompt)),
      "Expected Hanzi speakPrompt in Taipei tea house artifact"
    );

    const ptArtifact = getRoleplayArtifact(
      "lisbon-bakery",
      "pt",
      "Lisbon Padaria"
    );
    assert.ok(
      ptArtifact.items.some((i) =>
        /forno|queijo|aveia|laranja/i.test(i.speakPrompt)
      ),
      "Expected native Portuguese speakPrompt in Lisbon padaria artifact"
    );
  });

  it("provides at least 7 distinct daily warmup phrases for every supported language", () => {
    for (const code of ALL_LANGUAGE_CODES) {
      const phrases = getWarmupPhrasesForLanguage(code);
      assert.ok(
        phrases.length >= 7,
        `Expected >= 7 warmup phrases for ${code}, got ${phrases.length}`
      );
      const unique = new Set(phrases.map((p) => p.phrase));
      assert.equal(unique.size, phrases.length);
    }
  });

  it("extracts crisp CEFR short labels from em-dash and middle-dot descriptions", () => {
    assert.equal(
      extractCefrShortLabel(
        "Beginner — short warm phrases, gentle bilingual rescue"
      ),
      "Beginner"
    );
    assert.equal(
      extractCefrShortLabel("Elementary — clear everyday phrases"),
      "Elementary"
    );
    assert.equal(
      extractCefrShortLabel("Intermediate · natural pace"),
      "Intermediate"
    );

    const levels: CefrLevel[] = ["A1", "A2", "B1", "B2", "C1"];
    assert.equal(levels.length, 5);
  });

  it("counts Japanese and Mandarin spoken units accurately instead of returning 1 word", () => {
    const jaCount = countSpokenUnits(
      "こんばんは、今日のおすすめの季節料理は何ですか？",
      "ja"
    );
    assert.ok(jaCount >= 6, `Expected >= 6 Japanese units, got ${jaCount}`);

    const zhCount = countSpokenUnits(
      "你好，外面在下小雨，可以推荐一款清爽的乌龙茶吗？",
      "zh"
    );
    assert.ok(zhCount >= 8, `Expected >= 8 Mandarin units, got ${zhCount}`);

    assert.equal(
      countSpokenUnits("Buenos días, un café con leche de avena.", "es"),
      8
    );
    assert.equal(countSpokenUnits("", "es"), 0);
  });

  it("verifies daily ritual completion by language, turns, and scenario or goal match", () => {
    const mission = getDailyCulturalMission("ko", "A1");
    assert.equal(mission.targetTurns, 2);

    // Wrong language must NOT complete the mission
    assert.equal(
      didSessionCompleteDailyMission({
        mission,
        sessionLanguageCode: "es",
        sessionScenarioId: mission.scenarioId,
        userTurnsCount: 5,
        goalsCompleted: 2,
      }),
      false
    );

    // Too few turns must NOT complete the mission
    assert.equal(
      didSessionCompleteDailyMission({
        mission,
        sessionLanguageCode: "ko",
        sessionScenarioId: mission.scenarioId,
        userTurnsCount: 1,
        goalsCompleted: 1,
      }),
      false
    );

    // Wrong scenario AND zero goals must NOT complete the mission
    assert.equal(
      didSessionCompleteDailyMission({
        mission,
        sessionLanguageCode: "ko",
        sessionScenarioId: "open-conversation",
        userTurnsCount: 3,
        goalsCompleted: 0,
      }),
      false
    );

    // Matching language + mission scenario + target turns completes the mission
    assert.equal(
      didSessionCompleteDailyMission({
        mission,
        sessionLanguageCode: "ko",
        sessionScenarioId: mission.scenarioId,
        userTurnsCount: 2,
        goalsCompleted: 0,
      }),
      true
    );
  });
});
