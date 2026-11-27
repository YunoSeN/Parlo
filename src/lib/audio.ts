/**
 * Manual 16-bit signed little-endian PCM encoding/decoding and gapless 24kHz
 * playback scheduler for Gemini Live API audio streams.
 */

export function createAudioContextSafe(preferredSampleRate?: number): AudioContext {
  const AudioCtx =
    window.AudioContext ||
    (window as unknown as { webkitAudioContext?: typeof AudioContext })
      .webkitAudioContext;
  if (!AudioCtx) {
    throw new Error("Web Audio API is not supported in this browser.");
  }
  if (preferredSampleRate) {
    try {
      return new AudioCtx({ sampleRate: preferredSampleRate });
    } catch {
      // Safari / iOS / some Bluetooth headsets reject non-native sampleRate
    }
  }
  return new AudioCtx();
}

export function downsampleAndEncodePcm16(
  input: Float32Array,
  inputSampleRate: number,
  targetSampleRate = 16000
): string {
  let samples = input;

  if (inputSampleRate !== targetSampleRate && inputSampleRate > 0) {
    const ratio = inputSampleRate / targetSampleRate;
    const newLength = Math.max(1, Math.round(input.length / ratio));
    const resampled = new Float32Array(newLength);
    for (let i = 0; i < newLength; i++) {
      const srcIndex = i * ratio;
      const low = Math.floor(srcIndex);
      const high = Math.min(low + 1, input.length - 1);
      const frac = srcIndex - low;
      resampled[i] = input[low] * (1 - frac) + input[high] * frac;
    }
    samples = resampled;
  }

  const buffer = new ArrayBuffer(samples.length * 2);
  const view = new DataView(buffer);
  for (let i = 0; i < samples.length; i++) {
    const clamped = Math.max(-1, Math.min(1, samples[i]));
    const int16 = clamped < 0 ? clamped * 0x8000 : clamped * 0x7fff;
    view.setInt16(i * 2, int16, true);
  }

  return arrayBufferToBase64(buffer);
}

function arrayBufferToBase64(buffer: ArrayBuffer): string {
  const bytes = new Uint8Array(buffer);
  const chunkSize = 0x8000;
  let binary = "";
  for (let i = 0; i < bytes.length; i += chunkSize) {
    const slice = bytes.subarray(i, Math.min(i + chunkSize, bytes.length));
    binary += String.fromCharCode(...slice);
  }
  return btoa(binary);
}

export function decodeBase64Pcm16ToFloat32(base64: string): Float32Array {
  const binary = atob(base64);
  const byteLength = binary.length;
  const bytes = new Uint8Array(byteLength);
  for (let i = 0; i < byteLength; i++) {
    bytes[i] = binary.charCodeAt(i);
  }
  const sampleCount = Math.floor(byteLength / 2);
  const view = new DataView(bytes.buffer, bytes.byteOffset, bytes.byteLength);
  const float32 = new Float32Array(sampleCount);
  for (let i = 0; i < sampleCount; i++) {
    const int16 = view.getInt16(i * 2, true);
    float32[i] = int16 / 0x8000;
  }
  return float32;
}

export function computeRms(samples: Float32Array): number {
  if (samples.length === 0) return 0;
  let sum = 0;
  for (let i = 0; i < samples.length; i++) {
    sum += samples[i] * samples[i];
  }
  return Math.min(1, Math.sqrt(sum / samples.length) * 3.4);
}

export class GaplessAudioPlayer {
  private ctx: AudioContext | null = null;
  private analyser: AnalyserNode | null = null;
  private nextStartTime = 0;
  private activeSources = new Set<AudioBufferSourceNode>();
  private timeDomainData = new Float32Array(256);
  private onSpeakingChange?: (speaking: boolean) => void;

  constructor(onSpeakingChange?: (speaking: boolean) => void) {
    this.onSpeakingChange = onSpeakingChange;
  }

  public async ensureContext(): Promise<AudioContext> {
    if (!this.ctx || this.ctx.state === "closed") {
      this.ctx = createAudioContextSafe(24000);
      this.analyser = this.ctx.createAnalyser();
      this.analyser.fftSize = 512;
      this.analyser.smoothingTimeConstant = 0.78;
      this.analyser.connect(this.ctx.destination);
      this.timeDomainData = new Float32Array(this.analyser.fftSize);
    }
    if (this.ctx.state === "suspended") {
      await this.ctx.resume().catch(() => {});
    }
    return this.ctx;
  }

  public enqueuePcm24kBase64(base64: string): void {
    if (!this.ctx || !this.analyser || this.ctx.state === "closed") return;
    if (this.ctx.state === "suspended") {
      void this.ctx.resume().catch(() => {});
    }

    let float32: Float32Array;
    try {
      float32 = decodeBase64Pcm16ToFloat32(base64);
    } catch {
      return;
    }
    if (float32.length === 0) return;

    const audioBuffer = this.ctx.createBuffer(1, float32.length, 24000);
    audioBuffer.getChannelData(0).set(float32);

    const source = this.ctx.createBufferSource();
    source.buffer = audioBuffer;
    source.connect(this.analyser);

    const now = this.ctx.currentTime;
    const startAt = Math.max(now + 0.015, this.nextStartTime);
    this.nextStartTime = startAt + audioBuffer.duration;

    const wasEmpty = this.activeSources.size === 0;
    this.activeSources.add(source);
    if (wasEmpty) {
      this.onSpeakingChange?.(true);
    }

    source.onended = () => {
      this.activeSources.delete(source);
      if (this.activeSources.size === 0) {
        this.onSpeakingChange?.(false);
      }
    };

    source.start(startAt);
  }

  public interrupt(): void {
    for (const source of this.activeSources) {
      try {
        source.onended = null;
        source.stop();
        source.disconnect();
      } catch {
        // already ended
      }
    }
    this.activeSources.clear();
    this.nextStartTime = 0;
    this.onSpeakingChange?.(false);
  }

  public getOutputLevel(): number {
    if (!this.analyser || this.activeSources.size === 0) return 0;
    this.analyser.getFloatTimeDomainData(this.timeDomainData);
    return computeRms(this.timeDomainData);
  }

  public async dispose(): Promise<void> {
    this.interrupt();
    if (this.ctx && this.ctx.state !== "closed") {
      try {
        await this.ctx.close();
      } catch {
        // ignore
      }
    }
    this.ctx = null;
    this.analyser = null;
  }
}

export function speakWithBrowserTts(text: string, locale: string): void {
  if (typeof window === "undefined" || !("speechSynthesis" in window)) return;
  try {
    window.speechSynthesis.cancel();
    const utterance = new SpeechSynthesisUtterance(text);
    utterance.lang = locale;
    utterance.rate = 0.94;
    window.speechSynthesis.speak(utterance);
  } catch {
    // ignore speechSynthesis errors in restricted browsers
  }
}

export interface MicCaptureHandle {
  disconnect: () => void;
  mode: "worklet" | "script-processor";
}

const WORKLET_PROCESSOR_SOURCE = `
class ParloMicCaptureProcessor extends AudioWorkletProcessor {
  constructor() {
    super();
    this._buffer = new Float32Array(2048);
    this._offset = 0;
  }
  process(inputs) {
    const input = inputs[0] && inputs[0][0];
    if (!input) return true;
    let i = 0;
    while (i < input.length) {
      const space = this._buffer.length - this._offset;
      const toCopy = Math.min(space, input.length - i);
      this._buffer.set(input.subarray(i, i + toCopy), this._offset);
      this._offset += toCopy;
      i += toCopy;
      if (this._offset >= this._buffer.length) {
        const chunk = this._buffer.slice(0);
        this.port.postMessage(chunk, [chunk.buffer]);
        this._offset = 0;
      }
    }
    return true;
  }
}
registerProcessor("parlo-mic-capture", ParloMicCaptureProcessor);
`;

/**
 * Attaches a microphone capture node preferring AudioWorkletNode (off-main-thread)
 * and gracefully falling back to ScriptProcessorNode if AudioWorklet is unavailable.
 */
export async function createMicCaptureNode(
  inputCtx: AudioContext,
  source: MediaStreamAudioSourceNode,
  onSamples: (samples: Float32Array) => void
): Promise<MicCaptureHandle> {
  const silentGain = inputCtx.createGain();
  silentGain.gain.value = 0;

  if (
    typeof AudioWorkletNode !== "undefined" &&
    inputCtx.audioWorklet &&
    typeof Blob !== "undefined" &&
    typeof URL !== "undefined"
  ) {
    let blobUrl: string | null = null;
    try {
      const blob = new Blob([WORKLET_PROCESSOR_SOURCE], {
        type: "application/javascript",
      });
      blobUrl = URL.createObjectURL(blob);
      await inputCtx.audioWorklet.addModule(blobUrl);
      const workletNode = new AudioWorkletNode(inputCtx, "parlo-mic-capture", {
        numberOfInputs: 1,
        numberOfOutputs: 1,
        channelCount: 1,
      });
      workletNode.port.onmessage = (event: MessageEvent<Float32Array>) => {
        if (event.data instanceof Float32Array) {
          onSamples(event.data);
        }
      };
      source.connect(workletNode);
      workletNode.connect(silentGain);
      silentGain.connect(inputCtx.destination);
      URL.revokeObjectURL(blobUrl);
      blobUrl = null;

      return {
        mode: "worklet",
        disconnect: () => {
          workletNode.port.onmessage = null;
          try {
            workletNode.disconnect();
            silentGain.disconnect();
          } catch {
            // ignore
          }
        },
      };
    } catch {
      if (blobUrl) {
        URL.revokeObjectURL(blobUrl);
      }
      // Fall through to ScriptProcessorNode
    }
  }

  const processor = inputCtx.createScriptProcessor(4096, 1, 1);
  processor.onaudioprocess = (audioEvent) => {
    onSamples(audioEvent.inputBuffer.getChannelData(0));
  };
  source.connect(processor);
  processor.connect(silentGain);
  silentGain.connect(inputCtx.destination);

  return {
    mode: "script-processor",
    disconnect: () => {
      processor.onaudioprocess = null;
      try {
        processor.disconnect();
        silentGain.disconnect();
      } catch {
        // ignore
      }
    },
  };
}

