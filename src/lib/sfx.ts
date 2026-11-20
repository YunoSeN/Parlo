/**
 * Procedural Web Audio UI Sound Effects Engine (SFX)
 *
 * Synthesizes subtle, tactile ceramic/glass micro-acoustic feedback with zero
 * external audio assets. Every sound is shaped with fast soft envelopes so it
 * feels refined, crisp, and never fatiguing.
 */

const CULTURE_CHIME_PAIRS: Record<string, [number, number]> = {
  es: [440, 554.37], // Warm Andalusian major third (A4 -> C#5)
  fr: [523.25, 659.25], // Impressionist C5 -> E5
  ja: [440, 587.33], // Clean Japanese fourth (A4 -> D5)
  de: [392, 587.33], // Architectural fifth (G4 -> D5)
  it: [493.88, 622.25], // Warm Florentine interval (B4 -> D#5)
  zh: [523.25, 659.25], // Pentatonic C5 -> E5
  ko: [440, 523.25], // Soft minor third (A4 -> C5)
  pt: [466.16, 587.33], // Atlantic warmth (Bb4 -> D5)
};

class TactileSfxEngine {
  private ctx: AudioContext | null = null;
  private enabled = true;
  private volume = 0.36;

  private ensureContext(): AudioContext | null {
    if (!this.enabled || typeof window === "undefined") return null;
    const AudioCtx =
      window.AudioContext ||
      (window as unknown as { webkitAudioContext?: typeof AudioContext })
        .webkitAudioContext;
    if (!AudioCtx) return null;
    if (!this.ctx) {
      try {
        this.ctx = new AudioCtx();
      } catch {
        return null;
      }
    }
    if (this.ctx.state === "suspended") {
      void this.ctx.resume().catch(() => {});
    }
    return this.ctx;
  }

  public setEnabled(enabled: boolean) {
    this.enabled = enabled;
  }

  public isEnabled(): boolean {
    return this.enabled;
  }

  public setVolume(vol: number) {
    this.volume = Math.max(0.05, Math.min(0.85, vol));
  }

  private playTone(params: {
    freq: number;
    endFreq?: number;
    duration: number;
    type?: OscillatorType;
    gainPeak?: number;
    delay?: number;
    attack?: number;
  }) {
    const ctx = this.ensureContext();
    if (!ctx) return;

    const now = ctx.currentTime + (params.delay ?? 0);
    const osc = ctx.createOscillator();
    const gain = ctx.createGain();

    osc.type = params.type ?? "sine";
    osc.frequency.setValueAtTime(params.freq, now);
    if (params.endFreq && params.endFreq !== params.freq) {
      osc.frequency.exponentialRampToValueAtTime(
        params.endFreq,
        now + params.duration
      );
    }

    const peak = (params.gainPeak ?? 0.16) * this.volume;
    const attack = params.attack ?? 0.008;

    gain.gain.setValueAtTime(0.0001, now);
    gain.gain.linearRampToValueAtTime(peak, now + attack);
    gain.gain.exponentialRampToValueAtTime(0.0001, now + params.duration);

    osc.connect(gain);
    gain.connect(ctx.destination);

    osc.start(now);
    osc.stop(now + params.duration + 0.02);
  }

  /** Soft ceramic tap when navigating between dock views */
  public playNav() {
    this.playTone({
      freq: 620,
      endFreq: 740,
      duration: 0.075,
      type: "sine",
      gainPeak: 0.13,
      attack: 0.004,
    });
    this.playTone({
      freq: 1240,
      endFreq: 1180,
      duration: 0.045,
      type: "triangle",
      gainPeak: 0.045,
      attack: 0.003,
    });
  }

  /** Tactile switch click (crisp rising pluck for ON, damped warm tap for OFF) */
  public playToggle(on: boolean) {
    if (on) {
      this.playTone({
        freq: 480,
        endFreq: 720,
        duration: 0.08,
        type: "triangle",
        gainPeak: 0.14,
        attack: 0.004,
      });
      this.playTone({
        freq: 960,
        duration: 0.06,
        type: "sine",
        gainPeak: 0.08,
        delay: 0.03,
      });
    } else {
      this.playTone({
        freq: 520,
        endFreq: 340,
        duration: 0.075,
        type: "sine",
        gainPeak: 0.12,
        attack: 0.004,
      });
    }
  }

  /** Delicate 2-note harmonic chime tuned to each culture's modal interval */
  public playCultureMorph(languageCode: string) {
    const [f1, f2] = CULTURE_CHIME_PAIRS[languageCode] ?? [440, 554.37];
    this.playTone({
      freq: f1,
      duration: 0.24,
      type: "sine",
      gainPeak: 0.14,
      attack: 0.012,
    });
    this.playTone({
      freq: f2,
      duration: 0.34,
      type: "sine",
      gainPeak: 0.12,
      delay: 0.075,
      attack: 0.012,
    });
  }

  /** Warm studio broadcast chime when going live */
  public playSessionStart() {
    this.playTone({
      freq: 440,
      duration: 0.22,
      type: "sine",
      gainPeak: 0.14,
      attack: 0.01,
    });
    this.playTone({
      freq: 554.37,
      duration: 0.26,
      type: "sine",
      gainPeak: 0.13,
      delay: 0.07,
      attack: 0.01,
    });
    this.playTone({
      freq: 659.25,
      duration: 0.36,
      type: "triangle",
      gainPeak: 0.1,
      delay: 0.14,
      attack: 0.01,
    });
  }

  /** Soft descending cadence when ending a voice session */
  public playSessionEnd() {
    this.playTone({
      freq: 587.33,
      duration: 0.18,
      type: "sine",
      gainPeak: 0.12,
      attack: 0.008,
    });
    this.playTone({
      freq: 440,
      endFreq: 392,
      duration: 0.32,
      type: "sine",
      gainPeak: 0.12,
      delay: 0.09,
      attack: 0.01,
    });
  }

  /** Crisp wooden/glass pop when sending a chat message */
  public playMessageSend() {
    this.playTone({
      freq: 510,
      endFreq: 780,
      duration: 0.07,
      type: "sine",
      gainPeak: 0.13,
      attack: 0.004,
    });
  }

  /** Gentle resonant glass bell when Gemini replies */
  public playMessageReceive() {
    this.playTone({
      freq: 660,
      duration: 0.18,
      type: "sine",
      gainPeak: 0.11,
      attack: 0.008,
    });
    this.playTone({
      freq: 880,
      duration: 0.26,
      type: "sine",
      gainPeak: 0.09,
      delay: 0.065,
      attack: 0.008,
    });
  }

  /** Bright crystalline sparkle when saving a phrase or completing a goal */
  public playSavePhrase() {
    this.playTone({
      freq: 659.25,
      duration: 0.14,
      type: "triangle",
      gainPeak: 0.11,
      attack: 0.006,
    });
    this.playTone({
      freq: 987.77,
      duration: 0.26,
      type: "sine",
      gainPeak: 0.13,
      delay: 0.055,
      attack: 0.006,
    });
  }

  /** Soft papery brush tone when flipping a flashcard */
  public playFlipCard() {
    this.playTone({
      freq: 360,
      endFreq: 540,
      duration: 0.065,
      type: "triangle",
      gainPeak: 0.09,
      attack: 0.004,
    });
  }

  /** Soft rising breath for opening modals/drawers */
  public playOpenModal() {
    this.playTone({
      freq: 390,
      endFreq: 560,
      duration: 0.11,
      type: "sine",
      gainPeak: 0.1,
      attack: 0.008,
    });
  }

  /** Soft falling breath for closing modals/drawers */
  public playCloseModal() {
    this.playTone({
      freq: 480,
      endFreq: 330,
      duration: 0.095,
      type: "sine",
      gainPeak: 0.09,
      attack: 0.006,
    });
  }
}

export const sfxEngine = new TactileSfxEngine();

export const playClickSfx = () => sfxEngine.playNav();
export const playSuccessSfx = () => sfxEngine.playSavePhrase();
