export type SoundscapeLayerId =
  | "cafe-rain"
  | "evening-lounge"
  | "morning-breeze"
  | "coastal-waves"
  | "library-hearth";

export type AmbientPreset = "off" | SoundscapeLayerId;

export interface SoundscapeLayerOption {
  id: SoundscapeLayerId;
  label: string;
  tagline: string;
  accentNote: string;
}

export const SOUNDSCAPE_LAYERS: SoundscapeLayerOption[] = [
  {
    id: "cafe-rain",
    label: "Café Rain",
    tagline: "Soft rain against a warm café window",
    accentNote: "Rain",
  },
  {
    id: "evening-lounge",
    label: "Evening Room",
    tagline: "Warm low studio room tone & vinyl hush",
    accentNote: "Vinyl",
  },
  {
    id: "morning-breeze",
    label: "Kyoto Courtyard",
    tagline: "Airy courtyard breeze with subtle depth",
    accentNote: "Breeze",
  },
  {
    id: "coastal-waves",
    label: "Lisboa Swell",
    tagline: "Slow rhythmic Atlantic shoreline waves",
    accentNote: "Ocean",
  },
  {
    id: "library-hearth",
    label: "Atelier Hearth",
    tagline: "Cozy low embers & delicate crackle",
    accentNote: "Hearth",
  },
];

export interface AmbientOption {
  id: AmbientPreset;
  label: string;
  description: string;
}

export const AMBIENT_OPTIONS: AmbientOption[] = [
  { id: "off", label: "Silent", description: "Pure voice studio acoustics" },
  ...SOUNDSCAPE_LAYERS.map((layer) => ({
    id: layer.id as AmbientPreset,
    label: layer.label,
    description: layer.tagline,
  })),
];

interface ActiveLayerGraph {
  gain: GainNode;
  nodes: AudioNode[];
  timers: number[];
}

/**
 * Multi-layer procedural Web Audio API soundscape synthesizer.
 * Generates stereo pink/brown noise, filtered harmonic swells, and subtle
 * hearth/vinyl textures with zero external audio downloads.
 * Supports toggling multiple layers simultaneously and auto-ducking during speech.
 */
class AmbientSoundscapeEngine {
  private ctx: AudioContext | null = null;
  private masterGain: GainNode | null = null;
  private activeLayers = new Map<SoundscapeLayerId, ActiveLayerGraph>();
  private noiseCache = new Map<"pink" | "brown" | "crackle", AudioBuffer>();
  private baseVolume = 0.28;
  private isDucked = false;

  private ensureContext(): AudioContext | null {
    if (typeof window === "undefined") return null;
    const AudioCtx =
      window.AudioContext ||
      (window as unknown as { webkitAudioContext?: typeof AudioContext })
        .webkitAudioContext;
    if (!AudioCtx) return null;
    if (!this.ctx) {
      try {
        this.ctx = new AudioCtx();
        this.masterGain = this.ctx.createGain();
        this.masterGain.gain.value = 0.0001;
        this.masterGain.connect(this.ctx.destination);
      } catch {
        return null;
      }
    }
    if (this.ctx.state === "suspended") {
      void this.ctx.resume().catch(() => {});
    }
    return this.ctx;
  }

  private getNoiseBuffer(
    ctx: AudioContext,
    type: "pink" | "brown" | "crackle"
  ): AudioBuffer {
    const cached = this.noiseCache.get(type);
    if (cached) return cached;

    const sampleRate = ctx.sampleRate;
    const length = sampleRate * 5;
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
          b2 = 0.969 * b2 + white * 0.153852;
          b3 = 0.8665 * b3 + white * 0.3104856;
          b4 = 0.55 * b4 + white * 0.5329522;
          b5 = -0.7616 * b5 - white * 0.016898;
          data[i] = (b0 + b1 + b2 + b3 + b4 + b5 + b6 + white * 0.5362) * 0.045;
          b6 = white * 0.115926;
        }
      } else if (type === "brown") {
        let lastOut = 0;
        for (let i = 0; i < length; i += 1) {
          const white = Math.random() * 2 - 1;
          lastOut = (lastOut + 0.02 * white) / 1.02;
          data[i] = lastOut * 0.42;
        }
      } else {
        // Sparse delicate organic crackle impulses (for vinyl & hearth embers)
        let decay = 0;
        for (let i = 0; i < length; i += 1) {
          if (Math.random() < 0.00055) {
            decay = (Math.random() * 0.85 + 0.15) * (Math.random() < 0.5 ? 1 : -1);
          }
          data[i] = decay * 0.32;
          decay *= 0.84;
        }
      }
    }

    this.noiseCache.set(type, buffer);
    return buffer;
  }

  private applyMasterGain() {
    if (!this.ctx || !this.masterGain) return;
    const now = this.ctx.currentTime;
    const count = this.activeLayers.size;
    // Normalize slightly when multiple layers are stacked so the mix stays airy
    const stackCompensation = count > 1 ? 1 / Math.sqrt(count) : 1;
    const target =
      count === 0
        ? 0.0001
        : this.baseVolume * stackCompensation * (this.isDucked ? 0.32 : 1);

    this.masterGain.gain.cancelScheduledValues(now);
    this.masterGain.gain.setTargetAtTime(Math.max(0.0001, target), now, 0.22);
  }

  private createLayerGraph(
    ctx: AudioContext,
    id: SoundscapeLayerId
  ): ActiveLayerGraph {
    const layerGain = ctx.createGain();
    layerGain.gain.value = 0.0001;
    if (this.masterGain) {
      layerGain.connect(this.masterGain);
    }

    const nodes: AudioNode[] = [layerGain];
    const timers: number[] = [];

    if (id === "cafe-rain") {
      // Stereo rainfall hiss + subtle glass low-warmth bed
      const rainSrc = ctx.createBufferSource();
      rainSrc.loop = true;
      rainSrc.buffer = this.getNoiseBuffer(ctx, "pink");

      const rainFilter = ctx.createBiquadFilter();
      rainFilter.type = "bandpass";
      rainFilter.frequency.value = 1280;
      rainFilter.Q.value = 0.52;

      const lfo = ctx.createOscillator();
      lfo.frequency.value = 0.085;
      const lfoGain = ctx.createGain();
      lfoGain.gain.value = 220;

      const rumbleSrc = ctx.createBufferSource();
      rumbleSrc.loop = true;
      rumbleSrc.buffer = this.getNoiseBuffer(ctx, "brown");
      const rumbleFilter = ctx.createBiquadFilter();
      rumbleFilter.type = "lowpass";
      rumbleFilter.frequency.value = 260;
      const rumbleGain = ctx.createGain();
      rumbleGain.gain.value = 0.38;

      lfo.connect(lfoGain);
      lfoGain.connect(rainFilter.frequency);
      rainSrc.connect(rainFilter);
      rainFilter.connect(layerGain);

      rumbleSrc.connect(rumbleFilter);
      rumbleFilter.connect(rumbleGain);
      rumbleGain.connect(layerGain);

      rainSrc.start();
      rumbleSrc.start();
      lfo.start();
      nodes.push(
        rainSrc,
        rainFilter,
        lfo,
        lfoGain,
        rumbleSrc,
        rumbleFilter,
        rumbleGain
      );
    } else if (id === "evening-lounge") {
      // Warm analog room bed + ultra-delicate vinyl dust
      const roomSrc = ctx.createBufferSource();
      roomSrc.loop = true;
      roomSrc.buffer = this.getNoiseBuffer(ctx, "brown");
      const roomFilter = ctx.createBiquadFilter();
      roomFilter.type = "lowpass";
      roomFilter.frequency.value = 320;
      roomFilter.Q.value = 0.7;

      const vinylSrc = ctx.createBufferSource();
      vinylSrc.loop = true;
      vinylSrc.buffer = this.getNoiseBuffer(ctx, "crackle");
      const vinylFilter = ctx.createBiquadFilter();
      vinylFilter.type = "bandpass";
      vinylFilter.frequency.value = 2600;
      vinylFilter.Q.value = 0.8;
      const vinylGain = ctx.createGain();
      vinylGain.gain.value = 0.24;

      roomSrc.connect(roomFilter);
      roomFilter.connect(layerGain);

      vinylSrc.connect(vinylFilter);
      vinylFilter.connect(vinylGain);
      vinylGain.connect(layerGain);

      roomSrc.start();
      vinylSrc.start();
      nodes.push(
        roomSrc,
        roomFilter,
        vinylSrc,
        vinylFilter,
        vinylGain
      );
    } else if (id === "morning-breeze") {
      // Airy sweeping wind across eaves
      const breezeSrc = ctx.createBufferSource();
      breezeSrc.loop = true;
      breezeSrc.buffer = this.getNoiseBuffer(ctx, "pink");

      const breezeFilter = ctx.createBiquadFilter();
      breezeFilter.type = "bandpass";
      breezeFilter.frequency.value = 640;
      breezeFilter.Q.value = 0.9;

      const lfo = ctx.createOscillator();
      lfo.frequency.value = 0.11;
      const lfoGain = ctx.createGain();
      lfoGain.gain.value = 290;

      lfo.connect(lfoGain);
      lfoGain.connect(breezeFilter.frequency);
      breezeSrc.connect(breezeFilter);
      breezeFilter.connect(layerGain);

      breezeSrc.start();
      lfo.start();
      nodes.push(breezeSrc, breezeFilter, lfo, lfoGain);
    } else if (id === "coastal-waves") {
      // Slow breathing ocean swell modulating filter + amplitude
      const waveSrc = ctx.createBufferSource();
      waveSrc.loop = true;
      waveSrc.buffer = this.getNoiseBuffer(ctx, "pink");

      const waveFilter = ctx.createBiquadFilter();
      waveFilter.type = "lowpass";
      waveFilter.frequency.value = 540;
      waveFilter.Q.value = 0.45;

      const swellGain = ctx.createGain();
      swellGain.gain.value = 0.65;

      const swellLfo = ctx.createOscillator();
      swellLfo.frequency.value = 0.13; // ~7.7s wave cycle
      const swellAmp = ctx.createGain();
      swellAmp.gain.value = 0.34;
      const swellFreq = ctx.createGain();
      swellFreq.gain.value = 320;

      swellLfo.connect(swellAmp);
      swellAmp.connect(swellGain.gain);
      swellLfo.connect(swellFreq);
      swellFreq.connect(waveFilter.frequency);

      waveSrc.connect(waveFilter);
      waveFilter.connect(swellGain);
      swellGain.connect(layerGain);

      waveSrc.start();
      swellLfo.start();
      nodes.push(
        waveSrc,
        waveFilter,
        swellGain,
        swellLfo,
        swellAmp,
        swellFreq
      );
    } else {
      // library-hearth: Deep glowing hearth body + warm organic ember crackles
      const emberSrc = ctx.createBufferSource();
      emberSrc.loop = true;
      emberSrc.buffer = this.getNoiseBuffer(ctx, "brown");
      const emberFilter = ctx.createBiquadFilter();
      emberFilter.type = "lowpass";
      emberFilter.frequency.value = 240;

      const emberLfo = ctx.createOscillator();
      emberLfo.frequency.value = 0.24;
      const emberLfoGain = ctx.createGain();
      emberLfoGain.gain.value = 65;

      const crackleSrc = ctx.createBufferSource();
      crackleSrc.loop = true;
      crackleSrc.buffer = this.getNoiseBuffer(ctx, "crackle");
      const crackleFilter = ctx.createBiquadFilter();
      crackleFilter.type = "highpass";
      crackleFilter.frequency.value = 1400;
      const crackleGain = ctx.createGain();
      crackleGain.gain.value = 0.46;

      emberLfo.connect(emberLfoGain);
      emberLfoGain.connect(emberFilter.frequency);
      emberSrc.connect(emberFilter);
      emberFilter.connect(layerGain);

      crackleSrc.connect(crackleFilter);
      crackleFilter.connect(crackleGain);
      crackleGain.connect(layerGain);

      emberSrc.start();
      crackleSrc.start();
      emberLfo.start();
      nodes.push(
        emberSrc,
        emberFilter,
        emberLfo,
        emberLfoGain,
        crackleSrc,
        crackleFilter,
        crackleGain
      );
    }

    const now = ctx.currentTime;
    layerGain.gain.setTargetAtTime(1, now, 0.24);

    return { gain: layerGain, nodes, timers };
  }

  private tearDownLayer(graph: ActiveLayerGraph) {
    for (const t of graph.timers) {
      window.clearInterval(t);
    }
    for (const node of graph.nodes) {
      try {
        if (
          "stop" in node &&
          typeof (node as AudioBufferSourceNode).stop === "function"
        ) {
          (node as AudioBufferSourceNode).stop();
        }
        node.disconnect();
      } catch {
        // ignore already stopped nodes
      }
    }
  }

  public setLayerEnabled(id: SoundscapeLayerId, enabled: boolean) {
    const existing = this.activeLayers.get(id);
    if (enabled) {
      if (existing) return;
      const ctx = this.ensureContext();
      if (!ctx || !this.masterGain) return;
      const graph = this.createLayerGraph(ctx, id);
      this.activeLayers.set(id, graph);
      this.applyMasterGain();
    } else if (existing) {
      this.activeLayers.delete(id);
      if (this.ctx) {
        const now = this.ctx.currentTime;
        existing.gain.gain.cancelScheduledValues(now);
        existing.gain.gain.setTargetAtTime(0.0001, now, 0.14);
      }
      this.applyMasterGain();
      window.setTimeout(() => {
        this.tearDownLayer(existing);
      }, 360);
    }
  }

  public toggleLayer(id: SoundscapeLayerId): boolean {
    const next = !this.activeLayers.has(id);
    this.setLayerEnabled(id, next);
    return next;
  }

  public syncLayers(layers: SoundscapeLayerId[]) {
    const desired = new Set(layers);
    for (const activeId of Array.from(this.activeLayers.keys())) {
      if (!desired.has(activeId)) {
        this.setLayerEnabled(activeId, false);
      }
    }
    for (const layerId of desired) {
      if (!this.activeLayers.has(layerId)) {
        this.setLayerEnabled(layerId, true);
      }
    }
  }

  public muteAll() {
    this.syncLayers([]);
  }

  public getActiveLayers(): SoundscapeLayerId[] {
    return Array.from(this.activeLayers.keys());
  }

  /** Backwards-compatible single-preset setter */
  public setPreset(preset: AmbientPreset) {
    if (preset === "off") {
      this.muteAll();
    } else {
      this.syncLayers([preset]);
    }
  }

  public setVolume(volume: number) {
    this.baseVolume = Math.max(0.02, Math.min(0.65, volume));
    this.applyMasterGain();
  }

  public setDucked(ducked: boolean) {
    if (this.isDucked === ducked) return;
    this.isDucked = ducked;
    this.applyMasterGain();
  }

  public dispose() {
    for (const graph of this.activeLayers.values()) {
      this.tearDownLayer(graph);
    }
    this.activeLayers.clear();
    this.noiseCache.clear();
    if (this.ctx) {
      void this.ctx.close().catch(() => {});
      this.ctx = null;
      this.masterGain = null;
    }
  }
}

export const ambientEngine = new AmbientSoundscapeEngine();
