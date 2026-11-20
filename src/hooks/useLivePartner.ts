import { useCallback, useEffect, useRef, useState } from "react";
import {
  computeRms,
  downsampleAndEncodePcm16,
  GaplessAudioPlayer,
} from "../lib/audio";
import {
  CefrLevel,
  CorrectionStyle,
  LanguageOption,
  Scenario,
  SpeakingPace,
  TranscriptTurn,
  VoiceName,
} from "../types";

export type LiveConnectionState =
  | "idle"
  | "connecting"
  | "live"
  | "error";

export interface LiveSessionParams {
  language: LanguageOption;
  level: CefrLevel;
  voiceName: VoiceName;
  scenario: Scenario;
  correctionStyle: CorrectionStyle;
  speakingPace: SpeakingPace;
  onUserTurnFinalized?: (turn: TranscriptTurn, allTurns: TranscriptTurn[]) => void;
}

export function useLivePartner(params: LiveSessionParams) {
  const [connectionState, setConnectionState] =
    useState<LiveConnectionState>("idle");
  const [isMuted, setIsMuted] = useState(false);
  const [isPartnerSpeaking, setIsPartnerSpeaking] = useState(false);
  const [micAvailable, setMicAvailable] = useState(true);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [elapsedSeconds, setElapsedSeconds] = useState(0);
  const [turns, setTurns] = useState<TranscriptTurn[]>([]);

  // Refs to prevent stale closures inside WebSocket/audio callbacks
  const wsRef = useRef<WebSocket | null>(null);
  const playerRef = useRef<GaplessAudioPlayer | null>(null);
  const inputCtxRef = useRef<AudioContext | null>(null);
  const mediaStreamRef = useRef<MediaStream | null>(null);
  const processorRef = useRef<ScriptProcessorNode | null>(null);
  const sourceNodeRef = useRef<MediaStreamAudioSourceNode | null>(null);
  const isMutedRef = useRef(false);
  const isReadyRef = useRef(false);
  const userLevelRef = useRef(0);
  const partnerLevelRef = useRef(0);
  const turnsRef = useRef<TranscriptTurn[]>([]);
  const activeUserTurnIdRef = useRef<string | null>(null);
  const activePartnerTurnIdRef = useRef<string | null>(null);
  const onUserTurnFinalizedRef = useRef(params.onUserTurnFinalized);

  useEffect(() => {
    onUserTurnFinalizedRef.current = params.onUserTurnFinalized;
  }, [params.onUserTurnFinalized]);

  useEffect(() => {
    turnsRef.current = turns;
  }, [turns]);

  useEffect(() => {
    isMutedRef.current = isMuted;
  }, [isMuted]);

  // Session duration timer
  useEffect(() => {
    if (connectionState !== "live") return;
    const interval = window.setInterval(() => {
      setElapsedSeconds((prev) => prev + 1);
    }, 1000);
    return () => window.clearInterval(interval);
  }, [connectionState]);

  // Poll partner output RMS smoothly for visualizer
  useEffect(() => {
    let rafId = 0;
    const tick = () => {
      partnerLevelRef.current = playerRef.current?.getOutputLevel() ?? 0;
      if (isMutedRef.current || connectionState !== "live") {
        userLevelRef.current *= 0.85;
      }
      rafId = requestAnimationFrame(tick);
    };
    rafId = requestAnimationFrame(tick);
    return () => cancelAnimationFrame(rafId);
  }, [connectionState]);

  const finalizeActiveUserTurn = useCallback(() => {
    const userTurnId = activeUserTurnIdRef.current;
    if (!userTurnId) return;
    activeUserTurnIdRef.current = null;

    let finalizedTurn: TranscriptTurn | null = null;
    const nextTurns = turnsRef.current.map((t) => {
      if (t.id === userTurnId) {
        finalizedTurn = { ...t, isStreaming: false };
        return finalizedTurn;
      }
      return t;
    });
    turnsRef.current = nextTurns;
    setTurns(nextTurns);

    if (finalizedTurn && (finalizedTurn as TranscriptTurn).text.trim().length > 1) {
      onUserTurnFinalizedRef.current?.(finalizedTurn, nextTurns);
    }
  }, []);

  const finalizeActivePartnerTurn = useCallback(() => {
    const partnerTurnId = activePartnerTurnIdRef.current;
    if (!partnerTurnId) return;
    activePartnerTurnIdRef.current = null;

    setTurns((prev) => {
      const next = prev.map((t) =>
        t.id === partnerTurnId ? { ...t, isStreaming: false } : t
      );
      turnsRef.current = next;
      return next;
    });
  }, []);

  const appendTranscriptDelta = useCallback(
    (role: "user" | "partner", delta: string) => {
      if (!delta) return;

      if (role === "user") {
        // User started speaking -> close out any open partner turn
        if (activePartnerTurnIdRef.current) {
          finalizeActivePartnerTurn();
        }
        const currentId = activeUserTurnIdRef.current;
        if (!currentId) {
          const newId = `user-${Date.now()}-${Math.random().toString(36).slice(2, 6)}`;
          activeUserTurnIdRef.current = newId;
          const newTurn: TranscriptTurn = {
            id: newId,
            role: "user",
            text: delta.trimStart(),
            timestamp: Date.now(),
            isStreaming: true,
          };
          setTurns((prev) => {
            const next = [...prev, newTurn];
            turnsRef.current = next;
            return next;
          });
        } else {
          setTurns((prev) => {
            const next = prev.map((t) =>
              t.id === currentId ? { ...t, text: t.text + delta } : t
            );
            turnsRef.current = next;
            return next;
          });
        }
      } else {
        // Partner started speaking -> finalize active user turn for coaching!
        if (activeUserTurnIdRef.current) {
          finalizeActiveUserTurn();
        }
        const currentId = activePartnerTurnIdRef.current;
        if (!currentId) {
          const newId = `partner-${Date.now()}-${Math.random().toString(36).slice(2, 6)}`;
          activePartnerTurnIdRef.current = newId;
          const newTurn: TranscriptTurn = {
            id: newId,
            role: "partner",
            text: delta.trimStart(),
            timestamp: Date.now(),
            isStreaming: true,
          };
          setTurns((prev) => {
            const next = [...prev, newTurn];
            turnsRef.current = next;
            return next;
          });
        } else {
          setTurns((prev) => {
            const next = prev.map((t) =>
              t.id === currentId ? { ...t, text: t.text + delta } : t
            );
            turnsRef.current = next;
            return next;
          });
        }
      }
    },
    [finalizeActivePartnerTurn, finalizeActiveUserTurn]
  );

  const teardownMediaAndSocket = useCallback(async () => {
    isReadyRef.current = false;

    if (processorRef.current) {
      processorRef.current.onaudioprocess = null;
      try {
        processorRef.current.disconnect();
      } catch {
        // ignore
      }
      processorRef.current = null;
    }

    if (sourceNodeRef.current) {
      try {
        sourceNodeRef.current.disconnect();
      } catch {
        // ignore
      }
      sourceNodeRef.current = null;
    }

    if (mediaStreamRef.current) {
      mediaStreamRef.current.getTracks().forEach((track) => track.stop());
      mediaStreamRef.current = null;
    }

    if (inputCtxRef.current) {
      if (inputCtxRef.current.state !== "closed") {
        try {
          await inputCtxRef.current.close();
        } catch {
          // ignore
        }
      }
      inputCtxRef.current = null;
    }

    if (wsRef.current) {
      const ws = wsRef.current;
      wsRef.current = null;
      if (ws.readyState === WebSocket.OPEN) {
        try {
          ws.send(JSON.stringify({ type: "stop" }));
        } catch {
          // ignore
        }
      }
      try {
        ws.close();
      } catch {
        // ignore
      }
    }

    if (playerRef.current) {
      await playerRef.current.dispose();
      playerRef.current = null;
    }

    userLevelRef.current = 0;
    partnerLevelRef.current = 0;
    setIsPartnerSpeaking(false);
    finalizeActiveUserTurn();
    finalizeActivePartnerTurn();
  }, [finalizeActivePartnerTurn, finalizeActiveUserTurn]);

  const stopSession = useCallback(async () => {
    await teardownMediaAndSocket();
    setConnectionState("idle");
  }, [teardownMediaAndSocket]);

  const startSession = useCallback(async () => {
    await teardownMediaAndSocket();
    setErrorMessage(null);
    setConnectionState("connecting");
    setElapsedSeconds(0);
    setIsMuted(false);
    isMutedRef.current = false;
    activeUserTurnIdRef.current = null;
    activePartnerTurnIdRef.current = null;

    // Prepare 24kHz gapless output player on user gesture
    const player = new GaplessAudioPlayer((speaking) => {
      setIsPartnerSpeaking(speaking);
    });
    playerRef.current = player;
    await player.ensureContext();

    // Attempt microphone access (16kHz input)
    let stream: MediaStream | null = null;
    try {
      stream = await navigator.mediaDevices.getUserMedia({
        audio: {
          channelCount: 1,
          echoCancellation: true,
          noiseSuppression: true,
          autoGainControl: true,
        },
      });
      setMicAvailable(true);
    } catch {
      // Allow text-input fallback even if microphone permission is unavailable
      setMicAvailable(false);
      setIsMuted(true);
      isMutedRef.current = true;
    }

    const protocol = window.location.protocol === "https:" ? "wss:" : "ws:";
    const ws = new WebSocket(`${protocol}//${window.location.host}/api/live`);
    wsRef.current = ws;

    ws.onopen = () => {
      ws.send(
        JSON.stringify({
          type: "start",
          config: {
            languageName: params.language.name,
            languageNative: params.language.nativeName,
            level: params.level,
            voiceName: params.voiceName,
            scenarioTitle: params.scenario.title,
            scenarioPrompt: params.scenario.promptContext,
            partnerName: params.scenario.partnerName,
            partnerRole: params.scenario.partnerRole,
            correctionStyle: params.correctionStyle,
            speakingPace: params.speakingPace,
            goals: params.scenario.goals,
          },
        })
      );
    };

    ws.onmessage = (event) => {
      let msg: {
        type?: string;
        data?: string;
        text?: string;
        message?: string;
        reason?: string;
      };
      try {
        msg = JSON.parse(event.data);
      } catch {
        return;
      }

      if (msg.type === "ready") {
        if (!isReadyRef.current) {
          isReadyRef.current = true;
          setConnectionState("live");

          // Start capturing mic audio now that Gemini Live is ready
          if (stream) {
            mediaStreamRef.current = stream;
            const inputCtx = new AudioContext({ sampleRate: 16000 });
            inputCtxRef.current = inputCtx;
            const source = inputCtx.createMediaStreamSource(stream);
            sourceNodeRef.current = source;
            const processor = inputCtx.createScriptProcessor(4096, 1, 1);
            processorRef.current = processor;

            processor.onaudioprocess = (audioEvent) => {
              if (
                !isReadyRef.current ||
                isMutedRef.current ||
                ws.readyState !== WebSocket.OPEN
              ) {
                userLevelRef.current *= 0.8;
                return;
              }
              const channelData = audioEvent.inputBuffer.getChannelData(0);
              userLevelRef.current = computeRms(channelData);
              const base64 = downsampleAndEncodePcm16(
                channelData,
                inputCtx.sampleRate,
                16000
              );
              ws.send(JSON.stringify({ type: "audio", data: base64 }));
            };

            source.connect(processor);
            // Route through silent gain node so mic doesn't echo back to speakers
            const silentGain = inputCtx.createGain();
            silentGain.gain.value = 0;
            processor.connect(silentGain);
            silentGain.connect(inputCtx.destination);
          }

          // Prompt partner to greet the learner right away
          ws.send(JSON.stringify({ type: "promptGreeting" }));
        }
        return;
      }

      if (msg.type === "audio" && msg.data) {
        playerRef.current?.enqueuePcm24kBase64(msg.data);
        return;
      }

      if (msg.type === "interrupted") {
        playerRef.current?.interrupt();
        finalizeActivePartnerTurn();
        return;
      }

      if (msg.type === "inputTranscript" && msg.text) {
        appendTranscriptDelta("user", msg.text);
        return;
      }

      if (msg.type === "outputTranscript" && msg.text) {
        appendTranscriptDelta("partner", msg.text);
        return;
      }

      if (msg.type === "turnComplete") {
        finalizeActivePartnerTurn();
        return;
      }

      if (msg.type === "error") {
        setErrorMessage(
          msg.message || "Unable to connect to the Gemini Live voice partner."
        );
        setConnectionState("error");
        void teardownMediaAndSocket();
        return;
      }

      if (msg.type === "closed") {
        setConnectionState((prev) => (prev === "error" ? "error" : "idle"));
      }
    };

    ws.onerror = () => {
      setErrorMessage(
        "Voice WebSocket connection interrupted. Please try starting the session again."
      );
      setConnectionState("error");
      void teardownMediaAndSocket();
    };

    ws.onclose = () => {
      if (isReadyRef.current) {
        isReadyRef.current = false;
        setConnectionState((prev) => (prev === "error" ? "error" : "idle"));
      }
    };
  }, [
    appendTranscriptDelta,
    finalizeActivePartnerTurn,
    params.correctionStyle,
    params.language.name,
    params.language.nativeName,
    params.level,
    params.scenario.goals,
    params.scenario.partnerName,
    params.scenario.partnerRole,
    params.scenario.promptContext,
    params.scenario.title,
    params.speakingPace,
    params.voiceName,
    teardownMediaAndSocket,
  ]);

  const toggleMute = useCallback(() => {
    setIsMuted((prev) => {
      const next = !prev;
      isMutedRef.current = next;
      return next;
    });
  }, []);

  const sendTextTurn = useCallback(
    (text: string) => {
      const trimmed = text.trim();
      if (!trimmed) return;
      if (!wsRef.current || wsRef.current.readyState !== WebSocket.OPEN) return;

      // Interrupt partner speech if they are talking
      playerRef.current?.interrupt();
      finalizeActivePartnerTurn();

      const newTurn: TranscriptTurn = {
        id: `user-${Date.now()}-${Math.random().toString(36).slice(2, 6)}`,
        role: "user",
        text: trimmed,
        timestamp: Date.now(),
        isStreaming: false,
      };
      const nextTurns = [...turnsRef.current, newTurn];
      turnsRef.current = nextTurns;
      setTurns(nextTurns);

      wsRef.current.send(JSON.stringify({ type: "text", text: trimmed }));
      onUserTurnFinalizedRef.current?.(newTurn, nextTurns);
    },
    [finalizeActivePartnerTurn]
  );

  const resetTranscript = useCallback(() => {
    turnsRef.current = [];
    setTurns([]);
    setElapsedSeconds(0);
    activeUserTurnIdRef.current = null;
    activePartnerTurnIdRef.current = null;
  }, []);

  // Clean up on unmount
  useEffect(() => {
    return () => {
      void teardownMediaAndSocket();
    };
  }, [teardownMediaAndSocket]);

  return {
    connectionState,
    isMuted,
    isPartnerSpeaking,
    micAvailable,
    errorMessage,
    elapsedSeconds,
    turns,
    setTurns,
    userLevelRef,
    partnerLevelRef,
    startSession,
    stopSession,
    toggleMute,
    sendTextTurn,
    resetTranscript,
    clearError: () => setErrorMessage(null),
  };
}
