import "dotenv/config";
import http from "node:http";
import path from "node:path";
import { fileURLToPath } from "node:url";
import express from "express";
import { WebSocketServer, WebSocket } from "ws";
import {
  GoogleGenAI,
  LiveServerMessage,
  Modality,
  ThinkingLevel,
  Type,
} from "@google/genai";
import { requireAuth, AuthRequest } from "./src/middleware/auth.ts";
import { getOrCreateUser, updateUserWeeklyGoal } from "./src/db/users.ts";
import {
  deleteSavedPhraseRecord,
  listUserCustomScenarios,
  listUserPhrases,
  listUserSessions,
  saveSessionDebriefRecord,
  toggleSavedPhraseMastered,
  upsertCustomScenario,
  upsertPracticeSession,
  upsertSavedPhrase,
} from "./src/db/repository.ts";
import {
  DebriefReport,
  PracticeSessionRecord,
  SavedPhrase,
  Scenario,
} from "./src/types.ts";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const PORT = Number(process.env.PORT) || 3000;
const IS_PRODUCTION = process.env.NODE_ENV === "production";

function getGeminiClient(): GoogleGenAI {
  const apiKey = process.env.GEMINI_API_KEY;
  if (!apiKey) {
    throw new Error(
      "GEMINI_API_KEY is not configured. Please add your key in Settings > Secrets."
    );
  }
  return new GoogleGenAI({
    apiKey,
    httpOptions: {
      headers: {
        "User-Agent": "aistudio-build",
      },
    },
  });
}

function formatApiError(err: unknown): { status: number; message: string } {
  const raw = err instanceof Error ? err.message : String(err);
  if (raw.includes("API_KEY_INVALID") || raw.includes("PERMISSION_DENIED") || raw.includes("403")) {
    return {
      status: 403,
      message:
        "The Gemini API key was rejected. Please verify your API key in Settings > Secrets.",
    };
  }
  if (raw.includes("RESOURCE_EXHAUSTED") || raw.includes("429")) {
    return {
      status: 429,
      message:
        "Rate limit reached on the Gemini API. Please wait a moment and try again.",
    };
  }
  if (raw.includes("GEMINI_API_KEY is not configured")) {
    return { status: 500, message: raw };
  }
  return { status: 500, message: raw || "Unexpected Gemini API error." };
}

interface LiveStartConfig {
  languageName: string;
  languageNative: string;
  level: string;
  voiceName: string;
  scenarioTitle: string;
  scenarioPrompt: string;
  partnerName: string;
  partnerRole: string;
  correctionStyle: "gentle" | "active" | "immersive";
  speakingPace: "slow" | "natural" | "brisk";
  goals: string[];
}

function buildPartnerSystemInstruction(cfg: LiveStartConfig): string {
  const paceDirective =
    cfg.speakingPace === "slow"
      ? "Speak clearly at a relaxed, unhurried pace with clean articulation and short sentences."
      : cfg.speakingPace === "brisk"
      ? "Speak at an authentic, brisk native speed with natural contractions and colloquialisms."
      : "Speak at a natural, comfortable conversational speed suitable for the learner's level.";

  const correctionDirective =
    cfg.correctionStyle === "active"
      ? "When the learner makes a noticeable grammar or word-choice mistake, gently model or briefly note the natural phrasing in the target language, then immediately continue the conversation."
      : cfg.correctionStyle === "gentle"
      ? "Do not interrupt the flow with lectures. If the learner makes a clear mistake, naturally recast the correct form in your reply so they hear how a native speaker says it."
      : "Stay 100% immersed in character. Never break character to correct grammar; focus purely on a realistic, engaging exchange.";

  const goalsList =
    cfg.goals.length > 0
      ? `Conversation milestones to naturally guide the learner toward:\n${cfg.goals
          .map((g, i) => `${i + 1}. ${g}`)
          .join("\n")}`
      : "";

  return [
    `You are ${cfg.partnerName}, a ${cfg.partnerRole}.`,
    `Language: Speak strictly in ${cfg.languageName} (${cfg.languageNative}) unless the learner explicitly asks for brief help in English.`,
    `Learner CEFR Proficiency: ${cfg.level}. Match your vocabulary and sentence complexity to ${cfg.level} so the learner feels stretched yet supported.`,
    `Scenario: ${cfg.scenarioTitle}. ${cfg.scenarioPrompt}`,
    paceDirective,
    correctionDirective,
    goalsList,
    "Keep each spoken response concise (1 to 3 sentences) and end with a natural prompt or question so the learner speaks often. Never read out stage directions, markdown, or emojis.",
  ]
    .filter(Boolean)
    .join("\n\n");
}

async function startServer() {
  const app = express();
  app.use(express.json({ limit: "2mb" }));

  // Health check
  app.get("/api/health", (_req, res) => {
    res.json({ ok: true, hasApiKey: Boolean(process.env.GEMINI_API_KEY) });
  });

  // --- Authenticated User Data Routes (Cloud SQL PostgreSQL) ---
  app.get("/api/me/state", requireAuth, async (req: AuthRequest, res) => {
    try {
      const uid = req.user!.uid;
      const email = req.user!.email || `${uid}@users.parlo.local`;
      const displayName = req.user!.name || null;
      const user = await getOrCreateUser(uid, email, displayName);
      const [sessions, phrases, customScenarios] = await Promise.all([
        listUserSessions(user.id),
        listUserPhrases(user.id),
        listUserCustomScenarios(user.id),
      ]);
      res.json({
        weeklySessionGoal: user.weeklySessionGoal,
        sessions,
        phrases,
        customScenarios,
      });
    } catch (err) {
      const message =
        err instanceof Error ? err.message : "Unable to load saved account data.";
      res.status(500).json({ error: message });
    }
  });

  app.put("/api/me/goal", requireAuth, async (req: AuthRequest, res) => {
    try {
      const { weeklySessionGoal } = req.body as { weeklySessionGoal?: number };
      if (
        typeof weeklySessionGoal !== "number" ||
        !Number.isFinite(weeklySessionGoal)
      ) {
        return res.status(400).json({ error: "Valid weeklySessionGoal is required." });
      }
      const uid = req.user!.uid;
      const email = req.user!.email || `${uid}@users.parlo.local`;
      await getOrCreateUser(uid, email, req.user!.name || null);
      const updated = await updateUserWeeklyGoal(uid, weeklySessionGoal);
      res.json({ weeklySessionGoal: updated?.weeklySessionGoal ?? weeklySessionGoal });
    } catch (err) {
      const message =
        err instanceof Error ? err.message : "Unable to save weekly goal.";
      res.status(500).json({ error: message });
    }
  });

  app.post("/api/me/sessions", requireAuth, async (req: AuthRequest, res) => {
    try {
      const record = req.body as PracticeSessionRecord;
      if (!record?.id || !Array.isArray(record.transcript)) {
        return res.status(400).json({ error: "Valid session record is required." });
      }
      const user = await getOrCreateUser(
        req.user!.uid,
        req.user!.email || `${req.user!.uid}@users.parlo.local`,
        req.user!.name || null
      );
      await upsertPracticeSession(user.id, record);
      res.status(201).json({ ok: true });
    } catch (err) {
      const message =
        err instanceof Error ? err.message : "Unable to save practice session.";
      res.status(500).json({ error: message });
    }
  });

  app.put(
    "/api/me/sessions/:clientId/debrief",
    requireAuth,
    async (req: AuthRequest, res) => {
      try {
        const debrief = req.body as DebriefReport;
        if (!debrief?.summary) {
          return res.status(400).json({ error: "Debrief payload is required." });
        }
        const user = await getOrCreateUser(
          req.user!.uid,
          req.user!.email || `${req.user!.uid}@users.parlo.local`,
          req.user!.name || null
        );
        await saveSessionDebriefRecord(
          user.id,
          String(req.params.clientId),
          debrief
        );
        res.json({ ok: true });
      } catch (err) {
        const message =
          err instanceof Error ? err.message : "Unable to save debrief.";
        res.status(500).json({ error: message });
      }
    }
  );

  app.post("/api/me/phrases", requireAuth, async (req: AuthRequest, res) => {
    try {
      const phrase = req.body as SavedPhrase;
      if (!phrase?.id || !phrase.phrase) {
        return res.status(400).json({ error: "Valid phrase payload is required." });
      }
      const user = await getOrCreateUser(
        req.user!.uid,
        req.user!.email || `${req.user!.uid}@users.parlo.local`,
        req.user!.name || null
      );
      await upsertSavedPhrase(user.id, phrase);
      res.status(201).json({ ok: true });
    } catch (err) {
      const message =
        err instanceof Error ? err.message : "Unable to save phrase.";
      res.status(500).json({ error: message });
    }
  });

  app.patch(
    "/api/me/phrases/:clientId",
    requireAuth,
    async (req: AuthRequest, res) => {
      try {
        const { mastered } = req.body as { mastered?: boolean };
        if (typeof mastered !== "boolean") {
          return res.status(400).json({ error: "Boolean mastered field is required." });
        }
        const user = await getOrCreateUser(
          req.user!.uid,
          req.user!.email || `${req.user!.uid}@users.parlo.local`,
          req.user!.name || null
        );
        await toggleSavedPhraseMastered(
          user.id,
          String(req.params.clientId),
          mastered
        );
        res.json({ ok: true });
      } catch (err) {
        const message =
          err instanceof Error ? err.message : "Unable to update phrase.";
        res.status(500).json({ error: message });
      }
    }
  );

  app.delete(
    "/api/me/phrases/:clientId",
    requireAuth,
    async (req: AuthRequest, res) => {
      try {
        const user = await getOrCreateUser(
          req.user!.uid,
          req.user!.email || `${req.user!.uid}@users.parlo.local`,
          req.user!.name || null
        );
        await deleteSavedPhraseRecord(user.id, String(req.params.clientId));
        res.json({ ok: true });
      } catch (err) {
        const message =
          err instanceof Error ? err.message : "Unable to delete phrase.";
        res.status(500).json({ error: message });
      }
    }
  );

  app.post("/api/me/scenarios", requireAuth, async (req: AuthRequest, res) => {
    try {
      const scenario = req.body as Scenario;
      if (!scenario?.id || !scenario.title) {
        return res.status(400).json({ error: "Valid scenario payload is required." });
      }
      const user = await getOrCreateUser(
        req.user!.uid,
        req.user!.email || `${req.user!.uid}@users.parlo.local`,
        req.user!.name || null
      );
      await upsertCustomScenario(user.id, scenario);
      res.status(201).json({ ok: true });
    } catch (err) {
      const message =
        err instanceof Error ? err.message : "Unable to save custom scenario.";
      res.status(500).json({ error: message });
    }
  });

  // 1. Live Turn Coaching & Grammar Feedback
  app.post("/api/coach/feedback", async (req, res) => {
    try {
      const {
        utterance,
        languageName,
        level,
        scenarioTitle,
        recentTurns = [],
        goals = [],
      } = req.body as {
        utterance: string;
        languageName: string;
        level: string;
        scenarioTitle: string;
        recentTurns?: { role: string; text: string }[];
        goals?: string[];
      };

      if (!utterance || !utterance.trim()) {
        return res.status(400).json({ error: "Utterance is required." });
      }

      const ai = getGeminiClient();
      const contextText = recentTurns
        .slice(-6)
        .map((t) => `${t.role === "user" ? "Learner" : "Partner"}: ${t.text}`)
        .join("\n");

      const goalsPrompt =
        goals.length > 0
          ? `Scenario goals (0-indexed):\n${goals
              .map((g, idx) => `[${idx}] ${g}`)
              .join("\n")}`
          : "No scenario goals provided.";

      const response = await ai.models.generateContent({
        model: "gemini-4-hydrogen",
        contents: `Target language: ${languageName} (CEFR ${level})
Scenario: ${scenarioTitle}
Recent conversation:
${contextText}

Latest learner utterance to evaluate:
"${utterance}"

${goalsPrompt}

Evaluate the learner's utterance carefully. If it is already natural and accurate, set isNatural to true and return the utterance (or a slightly more idiomatic alternative) in corrected. Keep explanation and tip concise, warm, and actionable in English. Also identify any 0-based goal indices clearly accomplished by the learner so far in the conversation.`,
        config: {
          thinkingConfig: { thinkingLevel: ThinkingLevel.LOW },
          responseMimeType: "application/json",
          responseSchema: {
            type: Type.OBJECT,
            properties: {
              isNatural: {
                type: Type.BOOLEAN,
                description:
                  "True if the utterance is grammatically sound and natural for the learner's level.",
              },
              corrected: {
                type: Type.STRING,
                description:
                  "The most natural target-language phrasing of what the learner intended to say.",
              },
              explanation: {
                type: Type.STRING,
                description:
                  "Concise 1-2 sentence explanation in English of what worked well or what changed.",
              },
              tip: {
                type: Type.STRING,
                description:
                  "One short practical speaking or nuance tip in English.",
              },
              keyPhrase: {
                type: Type.OBJECT,
                properties: {
                  phrase: {
                    type: Type.STRING,
                    description: "A useful expression in the target language worth saving.",
                  },
                  translation: {
                    type: Type.STRING,
                    description: "Natural English meaning.",
                  },
                  reading: {
                    type: Type.STRING,
                    description:
                      "Romanization or pronunciation guide if non-Latin script, otherwise empty string.",
                  },
                },
                required: ["phrase", "translation"],
              },
              completedGoalIndices: {
                type: Type.ARRAY,
                items: { type: Type.INTEGER },
                description:
                  "0-based indices of goals accomplished by the learner in the conversation.",
              },
            },
            required: [
              "isNatural",
              "corrected",
              "explanation",
              "tip",
              "completedGoalIndices",
            ],
          },
        },
      });

      const parsed = JSON.parse((response.text ?? "{}").trim());
      res.json(parsed);
    } catch (err) {
      const { status, message } = formatApiError(err);
      res.status(status).json({ error: message });
    }
  });

  // 2. Turn Translation & Breakdown
  app.post("/api/coach/translate", async (req, res) => {
    try {
      const { text, languageName } = req.body as {
        text: string;
        languageName: string;
      };
      if (!text || !text.trim()) {
        return res.status(400).json({ error: "Text is required." });
      }

      const ai = getGeminiClient();
      const response = await ai.models.generateContent({
        model: "gemini-4-hydrogen",
        contents: `Translate this ${languageName} spoken utterance into natural English, include a brief note on any idiomatic phrasing or tone, and provide romanization/pronunciation reading if the script is non-Latin (otherwise leave reading empty).\n\nUtterance: "${text}"`,
        config: {
          thinkingConfig: { thinkingLevel: ThinkingLevel.LOW },
          responseMimeType: "application/json",
          responseSchema: {
            type: Type.OBJECT,
            properties: {
              english: {
                type: Type.STRING,
                description: "Natural English translation.",
              },
              literalNote: {
                type: Type.STRING,
                description:
                  "Brief 1-sentence note on literal meaning, register, or useful vocabulary.",
              },
              reading: {
                type: Type.STRING,
                description:
                  "Romanization (e.g., romaji, pinyin, revised romanization) if non-Latin script, otherwise empty string.",
              },
            },
            required: ["english", "literalNote"],
          },
        },
      });

      const parsed = JSON.parse((response.text ?? "{}").trim());
      res.json(parsed);
    } catch (err) {
      const { status, message } = formatApiError(err);
      res.status(status).json({ error: message });
    }
  });

  // 3. Contextual Reply Hints
  app.post("/api/coach/hints", async (req, res) => {
    try {
      const {
        languageName,
        level,
        scenarioTitle,
        scenarioPrompt,
        recentTurns = [],
      } = req.body as {
        languageName: string;
        level: string;
        scenarioTitle: string;
        scenarioPrompt: string;
        recentTurns?: { role: string; text: string }[];
      };

      const ai = getGeminiClient();
      const transcriptText =
        recentTurns.length > 0
          ? recentTurns
              .slice(-6)
              .map((t) => `${t.role === "user" ? "Learner" : "Partner"}: ${t.text}`)
              .join("\n")
          : "The conversation is just starting.";

      const response = await ai.models.generateContent({
        model: "gemini-4-hydrogen",
        contents: `Generate 3 natural, distinct reply options the learner can say next in ${languageName} (CEFR ${level}).
Scenario: ${scenarioTitle} — ${scenarioPrompt}
Conversation so far:
${transcriptText}

Make each option fit a distinct register or direction (e.g., Polite, Casual, Curious follow-up). Include romanization/reading only if ${languageName} uses a non-Latin script.`,
        config: {
          thinkingConfig: { thinkingLevel: ThinkingLevel.LOW },
          responseMimeType: "application/json",
          responseSchema: {
            type: Type.OBJECT,
            properties: {
              suggestions: {
                type: Type.ARRAY,
                items: {
                  type: Type.OBJECT,
                  properties: {
                    text: {
                      type: Type.STRING,
                      description: "Natural reply in the target language.",
                    },
                    reading: {
                      type: Type.STRING,
                      description:
                        "Pronunciation/romanization if non-Latin script, else empty string.",
                    },
                    translation: {
                      type: Type.STRING,
                      description: "Natural English translation.",
                    },
                    register: {
                      type: Type.STRING,
                      description: "Short 1-2 word tone label like Polite, Warm, Direct, Curious.",
                    },
                  },
                  required: ["text", "translation", "register"],
                },
              },
            },
            required: ["suggestions"],
          },
        },
      });

      const parsed = JSON.parse((response.text ?? "{}").trim());
      res.json(parsed);
    } catch (err) {
      const { status, message } = formatApiError(err);
      res.status(status).json({ error: message });
    }
  });

  // 4. Post-Session Debrief Report
  app.post("/api/coach/debrief", async (req, res) => {
    try {
      const { languageName, level, scenarioTitle, transcript = [] } = req.body as {
        languageName: string;
        level: string;
        scenarioTitle: string;
        transcript: { role: string; text: string }[];
      };

      if (!transcript.length) {
        return res
          .status(400)
          .json({ error: "A conversation transcript is required for review." });
      }

      const ai = getGeminiClient();
      const formatted = transcript
        .map((t) => `${t.role === "user" ? "Learner" : "Partner"}: ${t.text}`)
        .join("\n");

      const response = await ai.models.generateContent({
        model: "gemini-4-hydrogen",
        contents: `Review this completed ${languageName} (CEFR ${level}) speaking practice session in the scenario "${scenarioTitle}".

Transcript:
${formatted}

Provide a clear, encouraging, concrete coaching debrief in English with specific examples drawn strictly from the transcript above. Do not invent arbitrary numeric scores.`,
        config: {
          thinkingConfig: { thinkingLevel: ThinkingLevel.LOW },
          responseMimeType: "application/json",
          responseSchema: {
            type: Type.OBJECT,
            properties: {
              summary: {
                type: Type.STRING,
                description: "2-3 sentence overview of how the conversation went.",
              },
              strengths: {
                type: Type.ARRAY,
                items: { type: Type.STRING },
                description: "2-3 specific things the learner did well.",
              },
              focusAreas: {
                type: Type.ARRAY,
                items: {
                  type: Type.OBJECT,
                  properties: {
                    original: {
                      type: Type.STRING,
                      description: "What the learner actually said.",
                    },
                    improved: {
                      type: Type.STRING,
                      description: "More natural target-language phrasing.",
                    },
                    note: {
                      type: Type.STRING,
                      description: "Short explanation why.",
                    },
                  },
                  required: ["original", "improved", "note"],
                },
              },
              vocabularyHighlights: {
                type: Type.ARRAY,
                items: {
                  type: Type.OBJECT,
                  properties: {
                    term: { type: Type.STRING },
                    translation: { type: Type.STRING },
                    context: { type: Type.STRING },
                  },
                  required: ["term", "translation", "context"],
                },
              },
              nextStep: {
                type: Type.STRING,
                description: "One concrete practice focus for the next session.",
              },
            },
            required: [
              "summary",
              "strengths",
              "focusAreas",
              "vocabularyHighlights",
              "nextStep",
            ],
          },
        },
      });

      const parsed = JSON.parse((response.text ?? "{}").trim());
      res.json(parsed);
    } catch (err) {
      const { status, message } = formatApiError(err);
      res.status(status).json({ error: message });
    }
  });

  // Frontend mounting (Vite middleware in dev, dist in prod)
  if (!IS_PRODUCTION) {
    const { createServer: createViteServer } = await import("vite");
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: "spa",
    });
    app.use(vite.middlewares);
  } else {
    const distPath = path.resolve(__dirname, "dist");
    app.use(express.static(distPath));
    app.get("*", (_req, res) => {
      res.sendFile(path.join(distPath, "index.html"));
    });
  }

  const httpServer = http.createServer(app);
  const wss = new WebSocketServer({ noServer: true });

  httpServer.on("upgrade", (request, socket, head) => {
    const url = new URL(request.url ?? "/", `http://${request.headers.host}`);
    if (url.pathname === "/api/live") {
      wss.handleUpgrade(request, socket, head, (ws) => {
        wss.emit("connection", ws, request);
      });
    } else {
      socket.destroy();
    }
  });

  wss.on("connection", (clientWs: WebSocket) => {
    let liveSession: Awaited<ReturnType<GoogleGenAI["live"]["connect"]>> | null = null;
    let isClosing = false;

    const safeSend = (payload: Record<string, unknown>) => {
      if (clientWs.readyState === WebSocket.OPEN) {
        clientWs.send(JSON.stringify(payload));
      }
    };

    const closeLiveSession = () => {
      if (liveSession) {
        try {
          liveSession.close();
        } catch {
          // ignore close errors
        }
        liveSession = null;
      }
    };

    clientWs.on("message", async (raw) => {
      let msg: {
        type?: string;
        config?: LiveStartConfig;
        data?: string;
        text?: string;
      };
      try {
        msg = JSON.parse(raw.toString());
      } catch {
        return;
      }

      if (msg.type === "start" && msg.config) {
        closeLiveSession();
        try {
          const ai = getGeminiClient();
          const systemInstruction = buildPartnerSystemInstruction(msg.config);
          const allowedVoices = new Set(["Zephyr", "Kore", "Puck", "Charon", "Fenrir"]);
          const voiceName = allowedVoices.has(msg.config.voiceName)
            ? msg.config.voiceName
            : "Zephyr";

          const session = await ai.live.connect({
            model: "gemini-3.8-live",
            config: {
              responseModalities: [Modality.AUDIO],
              speechConfig: {
                voiceConfig: {
                  prebuiltVoiceConfig: { voiceName },
                },
              },
              systemInstruction,
              inputAudioTranscription: {},
              outputAudioTranscription: {},
            },
            callbacks: {
              onopen: () => {
                safeSend({ type: "ready" });
              },
              onmessage: (message: LiveServerMessage) => {
                const content = message.serverContent;
                if (!content) return;

                if (content.interrupted) {
                  safeSend({ type: "interrupted" });
                }

                if (content.inputTranscription?.text) {
                  safeSend({
                    type: "inputTranscript",
                    text: content.inputTranscription.text,
                  });
                }

                if (content.outputTranscription?.text) {
                  safeSend({
                    type: "outputTranscript",
                    text: content.outputTranscription.text,
                  });
                }

                for (const part of content.modelTurn?.parts ?? []) {
                  if (part.inlineData?.data) {
                    safeSend({
                      type: "audio",
                      data: part.inlineData.data,
                    });
                  }
                }

                if (content.turnComplete) {
                  safeSend({ type: "turnComplete" });
                }
              },
              onerror: (e: ErrorEvent) => {
                safeSend({
                  type: "error",
                  message:
                    e?.message ||
                    "Connection to the Gemini Live voice session encountered an error.",
                });
              },
              onclose: (e: CloseEvent) => {
                liveSession = null;
                if (!isClosing) {
                  safeSend({
                    type: "closed",
                    reason: e?.reason || "",
                  });
                }
              },
            },
          });

          if (isClosing || clientWs.readyState !== WebSocket.OPEN) {
            session.close();
            return;
          }

          liveSession = session;
          // Emit ready right after connect resolves in case onopen fired before handler attachment
          safeSend({ type: "ready" });
        } catch (err) {
          const { message } = formatApiError(err);
          safeSend({ type: "error", message });
        }
        return;
      }

      if (msg.type === "audio" && msg.data && liveSession) {
        try {
          liveSession.sendRealtimeInput({
            audio: {
              data: msg.data,
              mimeType: "audio/pcm;rate=16000",
            },
          });
        } catch {
          // ignore transient send errors on closing socket
        }
        return;
      }

      if (msg.type === "text" && msg.text && liveSession) {
        try {
          liveSession.sendRealtimeInput({ text: msg.text });
        } catch (err) {
          const { message } = formatApiError(err);
          safeSend({ type: "error", message });
        }
        return;
      }

      if (msg.type === "promptGreeting" && liveSession) {
        try {
          liveSession.sendRealtimeInput({
            text: "Greet the learner warmly in character in the target language to open our conversation.",
          });
        } catch {
          // ignore
        }
        return;
      }

      if (msg.type === "stop") {
        isClosing = true;
        closeLiveSession();
        safeSend({ type: "closed", reason: "Session ended by user." });
      }
    });

    clientWs.on("close", () => {
      isClosing = true;
      closeLiveSession();
    });

    clientWs.on("error", () => {
      isClosing = true;
      closeLiveSession();
    });
  });

  httpServer.listen(PORT, "0.0.0.0", () => {
    console.log(`Parlo server running on http://0.0.0.0:${PORT}`);
  });
}

startServer().catch((err) => {
  console.error("Failed to start server:", err);
  process.exit(1);
});
