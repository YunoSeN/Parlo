/**
 * Independently Reviewed Multilingual Validation Corpus & End-to-End 3-Session Fixture Demo
 *
 * Question #6: "Validate the learning-pattern state machine against independently
 * reviewed multilingual examples. Do not assume the AI's confidence label establishes correctness."
 *
 * Also implements the Milestone fixture demonstration: one identifiable mistake
 * recorded, protected against parroting/echoing, revisited via server-authorized
 * prompt directive in later sessions, and reaching transparent evidence without
 * fabricated mastery or acoustic claims.
 */

import { evaluateObservationEligibility } from "./asrFilter.ts";
import { IsolatedLearningStore } from "./isolatedStore.ts";
import {
  CoachObservationInput,
  InputModality,
  LearningPatternRecord,
  PatternCategory,
  TurnOrigin,
} from "./types.ts";

export interface MultilingualReviewFixture {
  id: string;
  description: string;
  languageCode: string;
  dialectId: string;
  inputModality: InputModality;
  turnOrigin: TurnOrigin;
  original: string;
  corrected: string;
  /** Intentionally tests that high AI confidence NEVER overrides deterministic guards,
   *  and low AI confidence NEVER drops genuine verified grammar errors. */
  aiConfidence: "high" | "medium" | "low";
  category: PatternCategory;
  patternKey: string;
  expectedEligible: boolean;
  expectedReason: string;
}

export const MULTILINGUAL_CORPUS: MultilingualReviewFixture[] = [
  // 1. Spanish — genuine AUDIBLE 1-char grammar mistake in ASR (MUST KEEP)
  {
    id: "es-asr-gender-calor",
    description: "Audible gender agreement error 'mucha calor' -> 'mucho calor' in ASR voice",
    languageCode: "es",
    dialectId: "es-madrid",
    inputModality: "asr_transcript",
    turnOrigin: "free_speech",
    original: "Hoy tengo mucha calor en la terraza",
    corrected: "Hoy tengo mucho calor en la terraza",
    aiConfidence: "low", // Low AI confidence must NOT cause valid error to be ignored!
    category: "grammar",
    patternKey: "es:gender-agreement-calor",
    expectedEligible: true,
    expectedReason: "valid_observation",
  },
  // 2. Spanish — genuine TYPED diacritic grammar error si vs sí (MUST KEEP!)
  {
    id: "es-typed-si-vs-si-accent",
    description: "Typed grammar accent error 'si' (if) -> 'sí' (yes) MUST be preserved",
    languageCode: "es",
    dialectId: "es-madrid",
    inputModality: "typed_text",
    turnOrigin: "free_typed",
    original: "Si, quiero un café con leche",
    corrected: "Sí, quiero un café con leche",
    aiConfidence: "medium",
    category: "grammar",
    patternKey: "es:diacritic-si-affirmative",
    expectedEligible: true,
    expectedReason: "valid_observation",
  },
  // 3. Spanish — ASR homophone si vs sí (MUST FILTER as asr_homophone_ambiguous)
  {
    id: "es-asr-homophone-si",
    description: "Spoken ASR diff 'si' -> 'sí' cannot be reliably attributed to learner",
    languageCode: "es",
    dialectId: "es-madrid",
    inputModality: "asr_transcript",
    turnOrigin: "free_speech",
    original: "Si quiero un café con leche",
    corrected: "Sí quiero un café con leche",
    aiConfidence: "high", // High AI confidence must NOT override ASR homophone guard!
    category: "grammar",
    patternKey: "es:diacritic-si-affirmative",
    expectedEligible: false,
    expectedReason: "asr_homophone_ambiguous",
  },
  // 4. Spanish — valid Mexican dialect expression penalized by Castilian bias (MUST FILTER)
  {
    id: "es-cdmx-dialect-valid",
    description: "Valid Mexico City '¿Me regalas un cafecito ahorita?' must NOT be marked wrong",
    languageCode: "es",
    dialectId: "es-cdmx",
    inputModality: "asr_transcript",
    turnOrigin: "free_speech",
    original: "¿Me regalas un cafecito ahorita, porfa?",
    corrected: "¿Me pones un café ahora, por favor?",
    aiConfidence: "high",
    category: "vocabulary",
    patternKey: "es:ordering-coffee-phrasing",
    expectedEligible: false,
    expectedReason: "dialect_valid_expression",
  },
  // 5. French — genuine TYPED grammar error a vs à (MUST KEEP!)
  {
    id: "fr-typed-a-vs-a-grave",
    description: "Typed French preposition error 'a Paris' -> 'à Paris' MUST be preserved",
    languageCode: "fr",
    dialectId: "fr-paris",
    inputModality: "typed_text",
    turnOrigin: "free_typed",
    original: "Je vais a Paris demain matin",
    corrected: "Je vais à Paris demain matin",
    aiConfidence: "low",
    category: "grammar",
    patternKey: "fr:preposition-a-vs-avoir",
    expectedEligible: true,
    expectedReason: "valid_observation",
  },
  // 6. French — spoken ASR homophone a vs à (MUST FILTER as asr_homophone_ambiguous)
  {
    id: "fr-asr-homophone-a-grave",
    description: "Spoken ASR diff 'a' -> 'à' is an inaudible homophone",
    languageCode: "fr",
    dialectId: "fr-paris",
    inputModality: "asr_transcript",
    turnOrigin: "free_speech",
    original: "Je vais a Paris demain matin",
    corrected: "Je vais à Paris demain matin",
    aiConfidence: "high",
    category: "grammar",
    patternKey: "fr:preposition-a-vs-avoir",
    expectedEligible: false,
    expectedReason: "asr_homophone_ambiguous",
  },
  // 7. French — genuine spoken auxiliary error j'ai allé -> je suis allé (MUST KEEP)
  {
    id: "fr-asr-auxiliary-etre",
    description: "Spoken auxiliary verb error 'j'ai allé' -> 'je suis allé' is clearly audible",
    languageCode: "fr",
    dialectId: "fr-paris",
    inputModality: "asr_transcript",
    turnOrigin: "free_speech",
    original: "Hier j'ai allé à la librairie",
    corrected: "Hier je suis allé à la librairie",
    aiConfidence: "medium",
    category: "conjugation",
    patternKey: "fr:passe-compose-etre-aller",
    expectedEligible: true,
    expectedReason: "valid_observation",
  },
  // 8. French — valid Québécois expression (MUST FILTER)
  {
    id: "fr-montreal-dialect-valid",
    description: "Valid Montréal 'C'est ben correct' must not be penalized",
    languageCode: "fr",
    dialectId: "fr-montreal",
    inputModality: "asr_transcript",
    turnOrigin: "free_speech",
    original: "C'est ben correct, merci beaucoup",
    corrected: "C'est très bien, merci beaucoup",
    aiConfidence: "high",
    category: "collocation",
    patternKey: "fr:casual-agreement",
    expectedEligible: false,
    expectedReason: "dialect_valid_expression",
  },
  // 9. Japanese — genuine spoken particle error (MUST KEEP)
  {
    id: "ja-asr-particle-ni-vs-de",
    description: "Spoken Japanese location particle '図書館に勉強します' -> '図書館で勉強します'",
    languageCode: "ja",
    dialectId: "ja-tokyo",
    inputModality: "asr_transcript",
    turnOrigin: "free_speech",
    original: "図書館に日本語を勉強します",
    corrected: "図書館で日本語を勉強します",
    aiConfidence: "medium",
    category: "grammar",
    patternKey: "ja:particle-de-action-location",
    expectedEligible: true,
    expectedReason: "valid_observation",
  },
  // 10. Japanese — valid Kansai dialect (MUST FILTER)
  {
    id: "ja-kansai-dialect-valid",
    description: "Valid Kansai 'めっちゃ美味しいですね、おおきに' must not be standardized away",
    languageCode: "ja",
    dialectId: "ja-kansai",
    inputModality: "asr_transcript",
    turnOrigin: "free_speech",
    original: "めっちゃ美味しいですね、おおきに",
    corrected: "とても美味しいですね、ありがとうございます",
    aiConfidence: "high",
    category: "politeness_register",
    patternKey: "ja:standard-gratitude",
    expectedEligible: false,
    expectedReason: "dialect_valid_expression",
  },
  // 11. German — genuine spoken gender/case error (MUST KEEP)
  {
    id: "de-asr-article-das-buch",
    description: "Audible German article error 'der Buch' -> 'das Buch'",
    languageCode: "de",
    dialectId: "de-berlin",
    inputModality: "asr_transcript",
    turnOrigin: "free_speech",
    original: "Ich lese der Buch im Studio",
    corrected: "Ich lese das Buch im Studio",
    aiConfidence: "medium",
    category: "grammar",
    patternKey: "de:neuter-article-buch",
    expectedEligible: true,
    expectedReason: "valid_observation",
  },
  // 12. German — valid Viennese Austrian coffeehouse phrasing (MUST FILTER)
  {
    id: "de-vienna-dialect-valid",
    description: "Valid Vienna 'Grüß Gott, eine Melange bitte' must not be rewritten",
    languageCode: "de",
    dialectId: "de-vienna",
    inputModality: "asr_transcript",
    turnOrigin: "free_speech",
    original: "Grüß Gott, eine Melange bitte",
    corrected: "Guten Tag, einen Milchkaffee bitte",
    aiConfidence: "high",
    category: "vocabulary",
    patternKey: "de:coffee-order",
    expectedEligible: false,
    expectedReason: "dialect_valid_expression",
  },
  // 13. Italian — ASR homophone e vs è (MUST FILTER)
  {
    id: "it-asr-homophone-e",
    description: "Spoken ASR diff 'e' -> 'è' is homophone ambiguity",
    languageCode: "it",
    dialectId: "it-milan",
    inputModality: "asr_transcript",
    turnOrigin: "free_speech",
    original: "Questo appartamento e molto luminoso",
    corrected: "Questo appartamento è molto luminoso",
    aiConfidence: "high",
    category: "grammar",
    patternKey: "it:verb-essere-accent",
    expectedEligible: false,
    expectedReason: "asr_homophone_ambiguous",
  },
  // 14. Portuguese — valid São Paulo expression (MUST FILTER)
  {
    id: "pt-saopaulo-dialect-valid",
    description: "Valid São Paulo 'Pode deixar, tudo certinho' must not be penalized",
    languageCode: "pt",
    dialectId: "pt-saopaulo",
    inputModality: "asr_transcript",
    turnOrigin: "free_speech",
    original: "Pode deixar, está tudo certinho",
    corrected: "Não se preocupe, está tudo correto",
    aiConfidence: "high",
    category: "collocation",
    patternKey: "pt:formal-reassurance",
    expectedEligible: false,
    expectedReason: "dialect_valid_expression",
  },
  // 15. Scaffolded chip click (MUST FILTER)
  {
    id: "chip-excluded",
    description: "Pre-written Starter Phrase / Reply Hint click never records an error",
    languageCode: "es",
    dialectId: "es-madrid",
    inputModality: "typed_text",
    turnOrigin: "scaffolded_chip",
    original: "Quiero un café",
    corrected: "Quisiera un café",
    aiConfidence: "high",
    category: "politeness_register",
    patternKey: "es:polite-coffee-order",
    expectedEligible: false,
    expectedReason: "scaffolded_chip_input",
  },
  // 16. Pure punctuation diff on typed text (MUST FILTER)
  {
    id: "typed-punctuation-only",
    description: "Missing period/capitalization alone is not a persistent language mistake",
    languageCode: "fr",
    dialectId: "fr-paris",
    inputModality: "typed_text",
    turnOrigin: "free_typed",
    original: "bonjour je voudrais un café",
    corrected: "Bonjour, je voudrais un café.",
    aiConfidence: "high",
    category: "grammar",
    patternKey: "fr:capitalization",
    expectedEligible: false,
    expectedReason: "punctuation_or_casing_only",
  },
];

export function evaluateMultilingualCorpus(): {
  total: number;
  passed: number;
  failures: Array<{ id: string; expected: string; actual: string }>;
} {
  const failures: Array<{ id: string; expected: string; actual: string }> = [];
  for (const fx of MULTILINGUAL_CORPUS) {
    const decision = evaluateObservationEligibility({
      languageCode: fx.languageCode,
      dialectId: fx.dialectId,
      inputModality: fx.inputModality,
      turnOrigin: fx.turnOrigin,
      original: fx.original,
      corrected: fx.corrected,
    });

    if (
      decision.eligible !== fx.expectedEligible ||
      decision.reason !== fx.expectedReason
    ) {
      failures.push({
        id: fx.id,
        expected: `${fx.expectedEligible}:${fx.expectedReason}`,
        actual: `${decision.eligible}:${decision.reason}`,
      });
    }
  }
  return {
    total: MULTILINGUAL_CORPUS.length,
    passed: MULTILINGUAL_CORPUS.length - failures.length,
    failures,
  };
}

export interface VerticalSliceStepLog {
  step: string;
  sessionId: string;
  modality: InputModality;
  outcome: string;
  statusAfter: string;
  spokenIndependentUses: number;
  typedIndependentUses: number;
  distinctSessions: number;
  authorizedDirectiveUsed: boolean;
}

/**
 * End-to-End 3-Session Fixture Demonstration:
 *   1. Session 1 (Day 1): Spoken mistake observed (`mucha calor` -> `mucho calor`)
 *   2. Session 1 Turn 3: Learner parrots partner's recast -> `scaffolded_echo` (0 credit!)
 *   3. Session 2 (Day 2, +24h): Server resolves authorized prompt directive (no raw client text);
 *      learner produces 2 independent spoken uses -> `improving` (still NOT consistent!)
 *   4. Session 3 (Day 4, +48h): Learner produces 3rd independent spoken use across 2nd session
 *      -> `consistent_in_practice` (`spoken_transcript_only`, `acousticPronunciationAssessed: false`)
 */
export async function runVerticalSliceDemo(): Promise<{
  steps: VerticalSliceStepLog[];
  finalPattern: LearningPatternRecord;
  authorizedDirective: string;
}> {
  const store = new IsolatedLearningStore();
  try {
    const userId = store.createUser("uid_demo_learner", "learner@example.com");
    const dayMs = 24 * 60 * 60 * 1000;
    const t0 = 1_750_000_000_000;

    store.createSession(userId, "sess-1", "Morning Café in Madrid");
    store.createSession(userId, "sess-2", "Morning Café in Madrid");
    store.createSession(userId, "sess-3", "Open Conversation");

    const steps: VerticalSliceStepLog[] = [];

    // Step 1: Session 1 mistake
    const obs1: CoachObservationInput = {
      idempotencyKey: "demo-s1-t1",
      sessionClientId: "sess-1",
      turnIndex: 1,
      languageCode: "es",
      dialectId: "es-madrid",
      inputModality: "asr_transcript",
      turnOrigin: "free_speech",
      utterance: "Yo tengo mucha calor esta mañana",
      corrected: "Tengo mucho calor esta mañana",
      explanation: "In Spanish, 'calor' is masculine, so use 'mucho calor'.",
      isNatural: false,
      aiConfidence: "medium",
      patternKey: "es:gender-agreement-calor",
      category: "grammar",
      title: "Masculine agreement with calor",
      timestampMs: t0,
    };

    const r1 = await store.recordMistake(userId, obs1, "pat-calor-1");
    if (!r1.pattern) throw new Error("Expected pattern to be recorded in step 1");
    steps.push({
      step: "1. Mistake recorded (Session 1, spoken ASR)",
      sessionId: "sess-1",
      modality: "asr_transcript",
      outcome: "mistake",
      statusAfter: r1.pattern.status,
      spokenIndependentUses: r1.pattern.spokenEvidence.independentSuccessCount,
      typedIndependentUses: r1.pattern.typedEvidence.independentSuccessCount,
      distinctSessions: r1.pattern.distinctSuccessSessionsCount,
      authorizedDirectiveUsed: false,
    });

    // Step 2: Same-session echo right after partner recast (MUST count 0!)
    const r2 = await store.recordRetest(userId, "pat-calor-1", {
      idempotencyKey: "demo-s1-t2",
      sessionClientId: "sess-1",
      turnIndex: 2,
      languageCode: "es",
      dialectId: "es-madrid",
      inputModality: "asr_transcript",
      turnOrigin: "free_speech",
      utterance: "Tengo mucho calor esta mañana",
      attempted: true,
      aiJudgedNatural: true,
      evidenceNote: "Repeated suggested correction verbatim.",
      timestampMs: t0 + 30_000,
      prevPartnerTurn: "¡Sí! Hoy hace mucho calor, ¿tengo mucho calor esta mañana?",
      recentSameSessionTip: {
        correction: "Tengo mucho calor esta mañana",
        turnIndex: 1,
      },
    });
    steps.push({
      step: "2. Parroted recast blocked (Session 1, 0 credit)",
      sessionId: "sess-1",
      modality: "asr_transcript",
      outcome: r2.outcome ?? "none",
      statusAfter: r2.pattern!.status,
      spokenIndependentUses: r2.pattern!.spokenEvidence.independentSuccessCount,
      typedIndependentUses: r2.pattern!.typedEvidence.independentSuccessCount,
      distinctSessions: r2.pattern!.distinctSuccessSessionsCount,
      authorizedDirectiveUsed: false,
    });

    // Step 3: Session 2 (+24h) — Server resolves authorized directive by ID only
    const directive = store.resolveAuthorizedPromptDirective(userId, "pat-calor-1");
    if (!directive) throw new Error("Expected authorized server directive");

    const r3 = await store.recordRetest(userId, "pat-calor-1", {
      idempotencyKey: "demo-s2-t3",
      sessionClientId: "sess-2",
      turnIndex: 3,
      languageCode: "es",
      dialectId: "es-madrid",
      inputModality: "asr_transcript",
      turnOrigin: "free_speech",
      utterance: "En agosto hace mucho calor por el centro",
      attempted: true,
      aiJudgedNatural: true,
      evidenceNote: "Spontaneously used masculine 'mucho calor' in a new context.",
      timestampMs: t0 + dayMs,
      prevPartnerTurn: "¿Qué tal el tiempo cuando vienes en verano?",
    });
    steps.push({
      step: "3. First independent revisit use (Session 2, +24h)",
      sessionId: "sess-2",
      modality: "asr_transcript",
      outcome: r3.outcome ?? "none",
      statusAfter: r3.pattern!.status,
      spokenIndependentUses: r3.pattern!.spokenEvidence.independentSuccessCount,
      typedIndependentUses: r3.pattern!.typedEvidence.independentSuccessCount,
      distinctSessions: r3.pattern!.distinctSuccessSessionsCount,
      authorizedDirectiveUsed: true,
    });

    // Step 4: Session 2 Turn 6 — 2nd independent use (same session -> still improving)
    const r4 = await store.recordRetest(userId, "pat-calor-1", {
      idempotencyKey: "demo-s2-t6",
      sessionClientId: "sess-2",
      turnIndex: 6,
      languageCode: "es",
      dialectId: "es-madrid",
      inputModality: "asr_transcript",
      turnOrigin: "free_speech",
      utterance: "Con tanto calor prefiero un té helado",
      attempted: true,
      aiJudgedNatural: true,
      evidenceNote: "Used masculine 'tanto calor' naturally.",
      timestampMs: t0 + dayMs + 120_000,
      prevPartnerTurn: "¿Prefieres algo caliente o frío ahora?",
    });
    steps.push({
      step: "4. Second independent use in Session 2 (still improving)",
      sessionId: "sess-2",
      modality: "asr_transcript",
      outcome: r4.outcome ?? "none",
      statusAfter: r4.pattern!.status,
      spokenIndependentUses: r4.pattern!.spokenEvidence.independentSuccessCount,
      typedIndependentUses: r4.pattern!.typedEvidence.independentSuccessCount,
      distinctSessions: r4.pattern!.distinctSuccessSessionsCount,
      authorizedDirectiveUsed: true,
    });

    // Step 5: Session 3 (+72h) — 3rd independent use across 2nd distinct session -> consistent_in_practice
    const r5 = await store.recordRetest(userId, "pat-calor-1", {
      idempotencyKey: "demo-s3-t2",
      sessionClientId: "sess-3",
      turnIndex: 2,
      languageCode: "es",
      dialectId: "es-madrid",
      inputModality: "asr_transcript",
      turnOrigin: "free_speech",
      utterance: "Ayer hizo mucho calor caminando por el parque",
      attempted: true,
      aiJudgedNatural: true,
      evidenceNote: "Consistent independent use of 'mucho calor' in a new session.",
      timestampMs: t0 + 3 * dayMs,
      prevPartnerTurn: "¿Saliste a caminar ayer por la tarde?",
    });
    steps.push({
      step: "5. Third independent use across 2nd session (+72h -> consistent)",
      sessionId: "sess-3",
      modality: "asr_transcript",
      outcome: r5.outcome ?? "none",
      statusAfter: r5.pattern!.status,
      spokenIndependentUses: r5.pattern!.spokenEvidence.independentSuccessCount,
      typedIndependentUses: r5.pattern!.typedEvidence.independentSuccessCount,
      distinctSessions: r5.pattern!.distinctSuccessSessionsCount,
      authorizedDirectiveUsed: true,
    });

    return {
      steps,
      finalPattern: r5.pattern!,
      authorizedDirective: directive,
    };
  } finally {
    store.close();
  }
}
