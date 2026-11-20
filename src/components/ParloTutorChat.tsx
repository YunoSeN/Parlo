import { useEffect, useMemo, useRef, useState } from "react";
import { AnimatePresence, motion, useReducedMotion } from "motion/react";
import {
  AlertCircle,
  BookmarkCheck,
  BookmarkPlus,
  BookOpen,
  Check,
  Compass,
  Copy,
  Loader2,
  MessageSquareText,
  RotateCcw,
  Send,
  Sparkles,
  Trash2,
  Volume2,
  X,
  Zap,
} from "lucide-react";
import {
  sendTutorChatMessage,
  TutorChatRoleId,
  TutorChatSpeedMode,
} from "../lib/api";
import { speakWithBrowserTts } from "../lib/audio";
import { getCultureByLanguage } from "../lib/cultures";
import { sfxEngine } from "../lib/sfx";
import { CefrLevel, LanguageOption, Scenario } from "../types";
import { LanguageFlagBadge } from "./LanguageFlagBadge";

export interface ChatTurnMessage {
  id: string;
  role: "user" | "model";
  text: string;
  roleId: TutorChatRoleId;
  model?: string;
  createdAt: number;
}

export interface ParloTutorChatProps {
  open: boolean;
  onClose: () => void;
  language: LanguageOption;
  level: CefrLevel;
  scenario: Scenario;
  dialectLabel?: string;
  dialectDirective?: string;
  savedPhraseStrings: Set<string>;
  onSavePhrase: (params: {
    phrase: string;
    translation: string;
    reading?: string;
    languageCode: string;
    scenarioTitle: string;
    note?: string;
  }) => void;
  onMessageCountChange?: (count: number) => void;
}

interface RoleConfig {
  id: TutorChatRoleId;
  label: string;
  shortDesc: string;
  icon: typeof MessageSquareText;
  placeholder: string;
}

const TUTOR_ROLES: RoleConfig[] = [
  {
    id: "conversation",
    label: "Partner",
    shortDesc: "Natural in-language dialogue calibrated to your CEFR level.",
    icon: MessageSquareText,
    placeholder: "Reply in target language or ask to start a scene...",
  },
  {
    id: "grammar",
    label: "Grammar",
    shortDesc: "Side-by-side phrasing polish, nuance & register breakdown.",
    icon: BookOpen,
    placeholder: "Paste a sentence to polish or ask a grammar question...",
  },
  {
    id: "culture",
    label: "Culture",
    shortDesc: "Local etiquette, unspoken norms & polite social cues.",
    icon: Compass,
    placeholder: "Ask about local customs, politeness, or idioms...",
  },
  {
    id: "phrases",
    label: "Phrases",
    shortDesc: "Ready-to-speak lines with readings & formal/casual variants.",
    icon: Sparkles,
    placeholder: "What situation do you need natural phrases for?",
  },
];

function extractSavableSnippet(text: string): string {
  const cleaned = text
    .replace(/\*\*/g, "")
    .replace(/[#>`]/g, "")
    .trim();
  const quoted = cleaned.match(/[“"「『]([^”"」』]{4,120})[”"」』]/);
  if (quoted && quoted[1]) {
    return quoted[1].trim();
  }
  const firstLine = cleaned
    .split(/\n+/)
    .map((l) => l.replace(/^[-•*\d.)\s]+/, "").trim())
    .find((l) => l.length >= 4);
  if (!firstLine) return cleaned.slice(0, 120);
  return firstLine.length > 120 ? `${firstLine.slice(0, 117)}...` : firstLine;
}

export function ParloTutorChat({
  open,
  onClose,
  language,
  level,
  scenario,
  dialectLabel,
  dialectDirective,
  savedPhraseStrings,
  onSavePhrase,
  onMessageCountChange,
}: ParloTutorChatProps) {
  const [roleId, setRoleId] = useState<TutorChatRoleId>("conversation");
  const [speedMode, setSpeedMode] = useState<TutorChatSpeedMode>("balanced");
  const [messages, setMessages] = useState<ChatTurnMessage[]>([]);
  const [draft, setDraft] = useState("");
  const [sending, setSending] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [lastFailedPrompt, setLastFailedPrompt] = useState<string | null>(null);
  const [copiedId, setCopiedId] = useState<string | null>(null);

  const threadRef = useRef<HTMLDivElement | null>(null);
  const inputRef = useRef<HTMLTextAreaElement | null>(null);
  const prefersReducedMotion = useReducedMotion();

  const culture = useMemo(
    () => getCultureByLanguage(language.code),
    [language.code]
  );

  const activeRole = useMemo(
    () => TUTOR_ROLES.find((r) => r.id === roleId) ?? TUTOR_ROLES[0],
    [roleId]
  );

  const starterPrompts = useMemo(() => {
    switch (roleId) {
      case "grammar":
        return [
          `How do I sound more natural ordering at "${scenario.title}" in ${language.name}?`,
          `Explain the difference between polite and casual forms in ${language.name} at CEFR ${level}.`,
          `Check this phrase for me: "${culture.samplePhrase}"`,
        ];
      case "culture":
        return [
          `What local etiquette should I keep in mind during "${scenario.title}"?`,
          `Teach me a warm local idiom from ${culture.cityLine} and when to use it.`,
          `What small social mistakes do visitors commonly make in ${language.name}?`,
        ];
      case "phrases":
        return [
          `Give me 3 natural ${language.name} openers for "${scenario.title}" with readings.`,
          `How can I politely ask someone to speak a little slower in ${language.name}?`,
          `Share 3 everyday transition words natives in ${culture.cityLine} use constantly.`,
        ];
      case "conversation":
      default:
        return [
          `${culture.greeting}! Let's practice "${scenario.title}" at a ${level} pace.`,
          `Ask me an opening question in ${language.name} as ${scenario.partnerName}.`,
          `Let's do a quick 3-turn warm-up in ${language.name} about my day.`,
        ];
    }
  }, [
    culture.cityLine,
    culture.greeting,
    culture.samplePhrase,
    language.name,
    level,
    roleId,
    scenario.partnerName,
    scenario.title,
  ]);

  useEffect(() => {
    onMessageCountChange?.(messages.length);
  }, [messages.length, onMessageCountChange]);

  useEffect(() => {
    if (!open) return;
    const timer = window.setTimeout(() => {
      inputRef.current?.focus();
    }, 120);
    return () => window.clearTimeout(timer);
  }, [open]);

  useEffect(() => {
    if (!open) return;
    const onKeyDown = (e: KeyboardEvent) => {
      if (e.key === "Escape") {
        e.preventDefault();
        onClose();
      }
    };
    window.addEventListener("keydown", onKeyDown);
    return () => window.removeEventListener("keydown", onKeyDown);
  }, [open, onClose]);

  useEffect(() => {
    const el = threadRef.current;
    if (!el) return;
    el.scrollTo({
      top: el.scrollHeight,
      behavior: prefersReducedMotion ? "auto" : "smooth",
    });
  }, [messages, sending, prefersReducedMotion]);

  const submitMessage = async (rawText: string) => {
    const trimmed = rawText.trim();
    if (!trimmed || sending) return;

    setError(null);
    setLastFailedPrompt(null);
    setDraft("");

    const userMsg: ChatTurnMessage = {
      id: `user-${Date.now()}-${Math.random().toString(36).slice(2, 6)}`,
      role: "user",
      text: trimmed,
      roleId,
      createdAt: Date.now(),
    };

    const historyForApi = messages.map((m) => ({
      role: m.role,
      text: m.text,
    }));

    setMessages((prev) => [...prev, userMsg]);
    setSending(true);
    sfxEngine.playMessageSend();

    try {
      const result = await sendTutorChatMessage({
        history: historyForApi,
        message: trimmed,
        roleId,
        speedMode,
        languageName: language.name,
        languageNative: language.nativeName,
        level,
        cultureAtelier: culture.atelierName,
        scenarioTitle: scenario.title,
        dialectLabel,
        dialectDirective,
      });

      const modelMsg: ChatTurnMessage = {
        id: `model-${Date.now()}-${Math.random().toString(36).slice(2, 6)}`,
        role: "model",
        text: result.reply,
        roleId,
        model: result.model,
        createdAt: Date.now(),
      };
      setMessages((prev) => [...prev, modelMsg]);
      sfxEngine.playMessageReceive();
    } catch (err) {
      setMessages((prev) => prev.filter((m) => m.id !== userMsg.id));
      setLastFailedPrompt(trimmed);
      setError(
        err instanceof Error
          ? err.message
          : "Unable to reach Gemini right now. Please try again."
      );
    } finally {
      setSending(false);
    }
  };

  const handleCopy = (msg: ChatTurnMessage) => {
    if (!navigator.clipboard) return;
    void navigator.clipboard.writeText(msg.text).then(() => {
      setCopiedId(msg.id);
      window.setTimeout(() => {
        setCopiedId((cur) => (cur === msg.id ? null : cur));
      }, 1600);
    });
  };

  return (
    <AnimatePresence>
      {open && (
        <>
          {/* Subtle click-away backdrop on smaller viewports */}
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.18 }}
            onClick={onClose}
            aria-hidden="true"
            className="fixed inset-0 z-40 bg-black/25 backdrop-blur-[2px] lg:bg-transparent lg:backdrop-blur-none lg:pointer-events-none"
          />

          <motion.aside
            role="dialog"
            aria-modal="false"
            aria-label="Parlo Gemini Tutor Chat"
            initial={
              prefersReducedMotion
                ? { opacity: 0 }
                : { opacity: 0, x: 26, y: 10, scale: 0.97, filter: "blur(3px)" }
            }
            animate={{ opacity: 1, x: 0, y: 0, scale: 1, filter: "blur(0px)" }}
            exit={
              prefersReducedMotion
                ? { opacity: 0 }
                : { opacity: 0, x: 24, y: 8, scale: 0.965, filter: "blur(3px)" }
            }
            transition={{ duration: 0.22, ease: [0.16, 1, 0.3, 1] }}
            className="fixed inset-x-2.5 sm:inset-x-auto sm:right-5 top-[64px] sm:top-[72px] bottom-[74px] md:bottom-[72px] z-50 sm:w-[min(440px,calc(100vw-2rem))] flex flex-col rounded-2xl border border-[var(--parlo-border)] bg-[var(--parlo-surface-solid)]/96 backdrop-blur-2xl shadow-[0_24px_64px_-16px_rgba(0,0,0,0.55)] overflow-hidden"
          >
            {/* Cultural top accent hairline */}
            <div
              aria-hidden="true"
              className="h-[2px] w-full shrink-0"
              style={{
                background:
                  "linear-gradient(90deg, var(--parlo-primary) 0%, var(--parlo-accent) 60%, transparent 100%)",
              }}
            />

            {/* Header */}
            <div className="relative overflow-hidden px-4 pt-3.5 pb-3 border-b border-[var(--parlo-border)] shrink-0">
              <div
                aria-hidden="true"
                data-culture={language.code}
                className="parlo-motif-overlay parlo-motif-corner"
              />
              <div className="relative z-10 flex items-center justify-between gap-2">
                <div className="flex items-center gap-2.5 min-w-0">
                  <div className="w-8 h-8 rounded-xl bg-[var(--parlo-primary-soft)] border border-[var(--parlo-border)] flex items-center justify-center shrink-0">
                    <LanguageFlagBadge code={language.code} size="md" />
                  </div>
                  <div className="min-w-0">
                    <div className="flex items-center gap-1.5">
                      <h2 className="font-display text-sm font-semibold text-[var(--parlo-ink)] truncate">
                        Parlo Tutor Chat
                      </h2>
                      <span className="px-1.5 py-0.5 rounded-md bg-[var(--parlo-canvas)] border border-[var(--parlo-border)] font-mono text-[10px] text-[var(--parlo-primary)] font-semibold shrink-0">
                        {level}
                      </span>
                    </div>
                    <p className="text-[11px] text-[var(--parlo-ink-muted)] truncate">
                      {language.name}
                      {dialectLabel ? ` (${dialectLabel})` : ""} ·{" "}
                      {culture.atelierName}
                    </p>
                  </div>
                </div>

                <div className="flex items-center gap-1 shrink-0">
                  {/* Speed Mode Toggle (Balanced Hydrogen vs Fast Flash-Lite) */}
                  <button
                    type="button"
                    onClick={() =>
                      setSpeedMode((prev) => {
                        const next = prev === "balanced" ? "fast" : "balanced";
                        sfxEngine.playToggle(next === "fast");
                        return next;
                      })
                    }
                    title={
                      speedMode === "balanced"
                        ? "Balanced tutoring (Gemini 4 Hydrogen) — click for Fast mode"
                        : "Fast replies (Gemini 3.1 Flash-Lite) — click for Balanced mode"
                    }
                    className={`inline-flex items-center gap-1 px-2 py-1 rounded-lg border text-[10px] font-mono transition-colors cursor-pointer ${
                      speedMode === "fast"
                        ? "bg-[var(--parlo-primary-soft)] border-[var(--parlo-primary)]/50 text-[var(--parlo-primary)]"
                        : "bg-[var(--parlo-canvas)] border-[var(--parlo-border)] text-[var(--parlo-ink-muted)] hover:text-[var(--parlo-ink)]"
                    }`}
                  >
                    <Zap className="w-3 h-3" aria-hidden="true" />
                    <span>{speedMode === "fast" ? "Fast" : "Balanced"}</span>
                  </button>

                  {messages.length > 0 && (
                    <button
                      type="button"
                      onClick={() => {
                        setMessages([]);
                        setError(null);
                        setLastFailedPrompt(null);
                      }}
                      title="Clear conversation history"
                      aria-label="Clear conversation history"
                      className="p-1.5 rounded-lg text-[var(--parlo-ink-muted)] hover:text-[var(--parlo-ink)] hover:bg-[var(--parlo-canvas)] transition-colors cursor-pointer"
                    >
                      <Trash2 className="w-3.5 h-3.5" aria-hidden="true" />
                    </button>
                  )}

                  <button
                    type="button"
                    onClick={onClose}
                    aria-label="Close Tutor Chat"
                    className="p-1.5 rounded-lg text-[var(--parlo-ink-muted)] hover:text-[var(--parlo-ink)] hover:bg-[var(--parlo-canvas)] transition-colors cursor-pointer"
                  >
                    <X className="w-4 h-4" aria-hidden="true" />
                  </button>
                </div>
              </div>

              {/* Role-Based System Instruction Selector */}
              <div
                className="relative z-10 mt-3 grid grid-cols-4 gap-1 p-1 rounded-xl bg-[var(--parlo-canvas)] border border-[var(--parlo-border)]"
                role="tablist"
                aria-label="Tutor persona role"
              >
                {TUTOR_ROLES.map((role) => {
                  const active = role.id === roleId;
                  const RoleIcon = role.icon;
                  return (
                    <button
                      key={role.id}
                      type="button"
                      role="tab"
                      aria-selected={active}
                      onClick={() => {
                        if (role.id !== roleId) {
                          sfxEngine.playToggle(true);
                          setRoleId(role.id);
                        }
                      }}
                      className={`relative flex items-center justify-center gap-1 py-1.5 px-1.5 rounded-lg text-[11px] font-medium transition-colors cursor-pointer whitespace-nowrap ${
                        active
                          ? "text-[var(--parlo-on-solid)]"
                          : "text-[var(--parlo-ink-muted)] hover:text-[var(--parlo-ink)]"
                      }`}
                    >
                      {active && (
                        <motion.span
                          layoutId="parlo-chat-role-pill"
                          transition={{
                            type: "spring",
                            stiffness: 460,
                            damping: 32,
                          }}
                          className="absolute inset-0 rounded-lg bg-[var(--parlo-primary)]"
                        />
                      )}
                      <RoleIcon
                        className="relative z-10 w-3 h-3 shrink-0"
                        aria-hidden="true"
                      />
                      <span className="relative z-10">{role.label}</span>
                    </button>
                  );
                })}
              </div>

              <AnimatePresence mode="wait" initial={false}>
                <motion.p
                  key={activeRole.id}
                  initial={{ opacity: 0, y: 4 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, y: -4 }}
                  transition={{ duration: 0.15, ease: [0.16, 1, 0.3, 1] }}
                  className="relative z-10 mt-2 text-[11px] text-[var(--parlo-ink-muted)] leading-snug"
                >
                  {activeRole.shortDesc}
                </motion.p>
              </AnimatePresence>
            </div>

            {/* Scrollable Multi-Turn Conversation Thread */}
            <div
              ref={threadRef}
              className="flex-1 overflow-y-auto px-4 py-4 space-y-3.5"
            >
              {messages.length === 0 ? (
                <div className="space-y-4 py-2">
                  <div className="p-3.5 rounded-xl bg-[var(--parlo-canvas)]/80 border border-[var(--parlo-border)]">
                    <p className="font-tech text-[10px] uppercase tracking-[0.18em] text-[var(--parlo-primary)] font-semibold">
                      {activeRole.label} Mode · {scenario.title}
                    </p>
                    <p className="mt-1.5 text-xs text-[var(--parlo-ink-secondary)] leading-relaxed">
                      Multi-turn context stays active across follow-ups. Ask
                      about grammar, test a sentence, or rehearse{" "}
                      <span className="text-[var(--parlo-ink)] font-medium">
                        {language.name}
                      </span>{" "}
                      dialogue anytime.
                    </p>
                  </div>

                  <div className="space-y-2">
                    <p className="text-[11px] font-mono text-[var(--parlo-ink-muted)]">
                      Try a starter prompt
                    </p>
                    {starterPrompts.map((promptText, idx) => (
                      <button
                        key={idx}
                        type="button"
                        onClick={() => void submitMessage(promptText)}
                        className="w-full text-left px-3.5 py-2.5 rounded-xl border border-[var(--parlo-border)] bg-[var(--parlo-surface)] hover:border-[var(--parlo-primary)]/60 hover:bg-[var(--parlo-primary-soft)]/50 text-xs text-[var(--parlo-ink)] leading-snug transition-colors cursor-pointer"
                      >
                        {promptText}
                      </button>
                    ))}
                  </div>
                </div>
              ) : (
                messages.map((msg) => {
                  const isUser = msg.role === "user";
                  const snippet = !isUser
                    ? extractSavableSnippet(msg.text)
                    : "";
                  const isSaved =
                    !isUser &&
                    savedPhraseStrings.has(snippet.trim().toLowerCase());
                  const roleBadge =
                    TUTOR_ROLES.find((r) => r.id === msg.roleId)?.label ??
                    "Tutor";

                  return (
                    <motion.div
                      key={msg.id}
                      initial={
                        prefersReducedMotion
                          ? { opacity: 0 }
                          : { opacity: 0, y: 8 }
                      }
                      animate={{ opacity: 1, y: 0 }}
                      transition={{ duration: 0.2, ease: [0.16, 1, 0.3, 1] }}
                      className={`flex flex-col ${
                        isUser ? "items-end" : "items-start"
                      }`}
                    >
                      <div className="flex items-center gap-1.5 mb-1 px-1 text-[10px] font-mono text-[var(--parlo-ink-muted)]">
                        <span>{isUser ? "You" : `Parlo · ${roleBadge}`}</span>
                      </div>

                      <div
                        className={`max-w-[90%] rounded-2xl px-3.5 py-2.5 text-[13px] leading-relaxed whitespace-pre-wrap break-words ${
                          isUser
                            ? "bg-[var(--parlo-primary)] text-[var(--parlo-on-solid)] rounded-br-sm shadow-xs"
                            : "bg-[var(--parlo-canvas)] border border-[var(--parlo-border)] text-[var(--parlo-ink)] rounded-bl-sm"
                        }`}
                      >
                        {msg.text}
                      </div>

                      {!isUser && (
                        <div className="mt-1.5 flex items-center gap-2 px-1">
                          <button
                            type="button"
                            onClick={() =>
                              speakWithBrowserTts(
                                snippet || msg.text,
                                language.speechLocale
                              )
                            }
                            className="inline-flex items-center gap-1 text-[11px] text-[var(--parlo-ink-muted)] hover:text-[var(--parlo-primary)] transition-colors cursor-pointer"
                          >
                            <Volume2 className="w-3 h-3" aria-hidden="true" />
                            Listen
                          </button>
                          <button
                            type="button"
                            onClick={() => handleCopy(msg)}
                            className="inline-flex items-center gap-1 text-[11px] text-[var(--parlo-ink-muted)] hover:text-[var(--parlo-ink)] transition-colors cursor-pointer"
                          >
                            {copiedId === msg.id ? (
                              <>
                                <Check
                                  className="w-3 h-3 text-[var(--parlo-accent)]"
                                  aria-hidden="true"
                                />
                                Copied
                              </>
                            ) : (
                              <>
                                <Copy className="w-3 h-3" aria-hidden="true" />
                                Copy
                              </>
                            )}
                          </button>
                          <button
                            type="button"
                            disabled={isSaved || !snippet}
                            onClick={() =>
                              onSavePhrase({
                                phrase: snippet,
                                translation: `From ${roleBadge} chat (${scenario.title})`,
                                languageCode: language.code,
                                scenarioTitle: scenario.title,
                                note:
                                  msg.text.length > 200
                                    ? `${msg.text.slice(0, 197)}...`
                                    : msg.text,
                              })
                            }
                            className="inline-flex items-center gap-1 text-[11px] text-[var(--parlo-ink-muted)] hover:text-[var(--parlo-primary)] disabled:text-[var(--parlo-accent)] transition-colors cursor-pointer"
                          >
                            {isSaved ? (
                              <>
                                <BookmarkCheck
                                  className="w-3 h-3"
                                  aria-hidden="true"
                                />
                                Saved
                              </>
                            ) : (
                              <>
                                <BookmarkPlus
                                  className="w-3 h-3"
                                  aria-hidden="true"
                                />
                                Save
                              </>
                            )}
                          </button>
                        </div>
                      )}
                    </motion.div>
                  );
                })
              )}

              <AnimatePresence>
                {sending && (
                  <motion.div
                    key="chat-thinking"
                    initial={{ opacity: 0, y: 6, scale: 0.96 }}
                    animate={{ opacity: 1, y: 0, scale: 1 }}
                    exit={{ opacity: 0, y: -4, scale: 0.95 }}
                    transition={{ duration: 0.16, ease: [0.16, 1, 0.3, 1] }}
                    className="flex items-start gap-2 pt-1"
                  >
                    <div className="inline-flex items-center gap-2 px-3.5 py-2.5 rounded-2xl rounded-bl-sm bg-[var(--parlo-canvas)] border border-[var(--parlo-border)] text-xs text-[var(--parlo-ink-muted)]">
                      <Loader2
                        className="w-3.5 h-3.5 animate-spin text-[var(--parlo-primary)]"
                        aria-hidden="true"
                      />
                      <span>
                        Composing {activeRole.label.toLowerCase()} reply...
                      </span>
                    </div>
                  </motion.div>
                )}
              </AnimatePresence>

              <AnimatePresence>
                {error && (
                  <motion.div
                    key="chat-error"
                    initial={{ opacity: 0, y: 6, scale: 0.97 }}
                    animate={{ opacity: 1, y: 0, scale: 1 }}
                    exit={{ opacity: 0, y: -6, scale: 0.97 }}
                    transition={{ duration: 0.18, ease: [0.16, 1, 0.3, 1] }}
                    className="p-3 rounded-xl border border-red-500/35 bg-red-500/10 text-xs text-red-400 flex items-start justify-between gap-2"
                  >
                    <div className="flex items-start gap-2 min-w-0">
                      <AlertCircle
                        className="w-4 h-4 shrink-0 mt-0.5"
                        aria-hidden="true"
                      />
                      <span className="leading-relaxed">{error}</span>
                    </div>
                    {lastFailedPrompt && (
                      <button
                        type="button"
                        onClick={() => void submitMessage(lastFailedPrompt)}
                        className="inline-flex items-center gap-1 px-2 py-1 rounded-md bg-red-500/20 hover:bg-red-500/30 text-red-200 font-medium shrink-0 cursor-pointer"
                      >
                        <RotateCcw className="w-3 h-3" aria-hidden="true" />
                        Retry
                      </button>
                    )}
                  </motion.div>
                )}
              </AnimatePresence>
            </div>

            {/* Composer */}
            <form
              onSubmit={(e) => {
                e.preventDefault();
                void submitMessage(draft);
              }}
              className="p-3 border-t border-[var(--parlo-border)] bg-[var(--parlo-surface)]/80 shrink-0"
            >
              <div className="flex items-end gap-2 rounded-xl border border-[var(--parlo-border)] bg-[var(--parlo-canvas)] px-3 py-2 focus-within:border-[var(--parlo-primary)] transition-colors">
                <textarea
                  ref={inputRef}
                  rows={1}
                  value={draft}
                  onChange={(e) => setDraft(e.target.value)}
                  onKeyDown={(e) => {
                    if (e.key === "Enter" && !e.shiftKey) {
                      e.preventDefault();
                      void submitMessage(draft);
                    }
                  }}
                  placeholder={activeRole.placeholder}
                  aria-label="Message Parlo Tutor"
                  className="flex-1 resize-none max-h-28 bg-transparent text-[13px] text-[var(--parlo-ink)] placeholder:text-[var(--parlo-ink-muted)] focus:outline-none leading-snug py-0.5"
                />
                <button
                  type="submit"
                  disabled={sending || !draft.trim()}
                  aria-label="Send message"
                  className="w-8 h-8 rounded-lg bg-[var(--parlo-primary)] hover:bg-[var(--parlo-primary-hover)] text-[var(--parlo-on-solid)] disabled:opacity-40 inline-flex items-center justify-center shrink-0 transition-colors cursor-pointer disabled:cursor-not-allowed"
                >
                  {sending ? (
                    <Loader2
                      className="w-3.5 h-3.5 animate-spin"
                      aria-hidden="true"
                    />
                  ) : (
                    <Send className="w-3.5 h-3.5" aria-hidden="true" />
                  )}
                </button>
              </div>
              <div className="mt-1.5 px-1 flex items-center justify-between text-[10px] font-mono text-[var(--parlo-ink-muted)]">
                <span>Enter to send · Shift+Enter newline</span>
                <span>⌘J toggle</span>
              </div>
            </form>
          </motion.aside>
        </>
      )}
    </AnimatePresence>
  );
}

export default ParloTutorChat;
