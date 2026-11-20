export type AmbientPreset = "off" | "cafe-rain" | "evening-lounge" | "morning-breeze";

export interface AmbientOption {
  id: AmbientPreset;
  label: string;
  description: string;
}

export const AMBIENT_OPTIONS: AmbientOption[] = [
  { id: "off", label: "Silent", description: "Pure voice studio acoustics" },
  { id: "cafe-rain", label: "Café Rain", description: "Soft rain against a café window" },
  { id: "evening-lounge", label: "Evening Room", description: "Warm low studio room tone" },
  { id: "morning-breeze", label: "Morning Air", description: "Calm airy breeze for focus" },
];

/**
 * Lightweight procedural Web Audio API soundscape generator.
 * Uses filtered pink/brown noise buffers so no external audio files are needed.
 */
class AmbientSoundscapeEngine {
  private ctx: AudioContext | null = null;
  private masterGain: GainNode | null = null;
  private activeNodes: AudioNode[] = [];
  private currentPreset: AmbientPreset = "off";
  private baseVolume = 0.22;
  private isDucked = false;

  private ensureContext(): AudioContext | null {
    if (typeof window === "undefined") return null;
    const AudioCtx =
      window.AudioContext ||
      (window as unknown as { webkitAudioContext?: typeof AudioContext })
        .webkitAudioContext;
    if (!AudioCtx) return null;
    if (!this.ctx) {
      this.ctx = new AudioCtx();
      this.masterGain = this.ctx.createGain();
      this.masterGain.gain.value = 0.0001;
      this.masterGain.connect(this.ctx.destination);
    }
    if (this.ctx.state === "suspended") {
      void this.ctx.resume().catch(() => {});
    }
    return this.ctx;
  }

  private createNoiseBuffer(ctx: AudioContext, type: "pink" | "brown"): AudioBuffer {
    const sampleRate = ctx.sampleRate;
    const length = sampleRate * 4;
    const buffer = ctx.createBuffer(2, length, sampleRate);

    for (let ch = 0; ch < 2; ch += 1) {
      const data = buffer.getChannelData(ch);
      if (type === "pink") {
        let b0 = 0;
        let b1 = 0;
        let b2 = 0;
        let b3 = 0;
        let b4 = 0;
        let b5 = 0;
        let b6 = 0;
        for (let i = 0; i < length; i += 1) {
          const white = Math.random() * 2 - 1;
          b0 = 0.99886 * b0 + white * 0.0555179;
          b1 = 0.99332 * b1 + white * 0.0750759;
          b2 = 0.96900 * b2 + white * 0.1538520;
          b3 = 0.86650 * b3 + white * 0.3104856;
          b4 = 0.55000 * b4 + white * 0.5329522;
          b5 = -0.7616 * b5 - white * 0.0168980;
          data[i] = (b0 + b1 + b2 + b3 + b4 + b5 + b6 + white * 0.5362) * 0.045;
          b6 = white * 0.115926;
        }
      } else {
        let lastOut = 0;
        for (let i = 0; i < length; i += 1) {
          const white = Math.random() * 2 - 1;
          lastOut = (lastOut + 0.02 * white) / 1.02;
          data[i] = lastOut * 0.42;
        }
      }
    }
    return buffer;
  }

  private stopActiveNodes() {
    for (const node of this.activeNodes) {
      try {
        if ("stop" in node && typeof (node as AudioBufferSourceNode).stop === "function") {
          (node as AudioBufferSourceNode).stop();
        }
        node.disconnect();
      } catch {
        // ignore already stopped nodes
      }
    }
    this.activeNodes = [];
  }

  private applyGain() {
    if (!this.ctx || !this.masterGain) return;
    const now = this.ctx.currentTime;
    const target =
      this.currentPreset === "off"
        ? 0.0001
        : this.baseVolume * (this.isDucked ? 0.35 : 1);
    this.masterGain.gain.cancelScheduledValues(now);
    this.masterGain.gain.setTargetAtTime(Math.max(0.0001, target), now, 0.25);
  }

  public setPreset(preset: AmbientPreset) {
    if (preset === this.currentPreset) return;
    this.currentPreset = preset;

    if (preset === "off") {
      this.applyGain();
      window.setTimeout(() => {
        if (this.currentPreset === "off") {
          this.stopActiveNodes();
        }
      }, 350);
      return;
    }

    const ctx = this.ensureContext();
    if (!ctx || !this.masterGain) return;

    this.stopActiveNodes();

    const source = ctx.createBufferSource();
    source.loop = true;

    const filter = ctx.createBiquadFilter();
    const lfo = ctx.createOscillator();
    const lfoGain = ctx.createGain();

    if (preset === "cafe-rain") {
      source.buffer = this.createNoiseBuffer(ctx, "pink");
      filter.type = "bandpass";
      filter.frequency.value = 1150;
      filter.Q.value = 0.55;
      lfo.frequency.value = 0.09;
      lfoGain.gain.value = 180;
    } else if (preset === "evening-lounge") {
      source.buffer = this.createNoiseBuffer(ctx, "brown");
      filter.type = "lowpass";
      filter.frequency.value = 340;
      filter.Q.value = 0.7;
      lfo.frequency.value = 0.05;
      lfoGain.gain.value = 55;
    } else {
      source.buffer = this.createNoiseBuffer(ctx, "pink");
      filter.type = "lowpass";
      filter.frequency.value = 720;
      filter.Q.value = 0.4;
      lfo.frequency.value = 0.12;
      lfoGain.gain.value = 240;
    }

    lfo.connect(lfoGain);
    lfoGain.connect(filter.frequency);
    source.connect(filter);
    filter.connect(this.masterGain);

    source.start();
    lfo.start();
    this.activeNodes = [source, filter, lfo, lfoGain];
    this.applyGain();
  }

  public setVolume(volume: number) {
    this.baseVolume = Math.max(0.02, Math.min(0.6, volume));
    this.applyGain();
  }

  public setDucked(ducked: boolean) {
    if (this.isDucked === ducked) return;
    this.isDucked = ducked;
    this.applyGain();
  }

  public dispose() {
    this.currentPreset = "off";
    this.stopActiveNodes();
    if (this.ctx) {
      void this.ctx.close().catch(() => {});
      this.ctx = null;
      this.masterGain = null;
    }
  }
}

export const ambientEngine = new AmbientSoundscapeEngine();
