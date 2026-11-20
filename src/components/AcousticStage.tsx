import { MutableRefObject, useEffect, useRef } from "react";
import { LiveConnectionState } from "../hooks/useLivePartner";
import { getCultureByLanguage } from "../lib/cultures";

interface AcousticStageProps {
  languageCode: string;
  connectionState: LiveConnectionState;
  isPartnerSpeaking: boolean;
  isMuted: boolean;
  userLevelRef: MutableRefObject<number>;
  partnerLevelRef: MutableRefObject<number>;
}

/**
 * AcousticStage
 *
 * Logo-matched & culture-adaptive "Ready to speak" acoustic instrument canvas.
 * - Centerpiece: Sculptural Parlo geometric 'P' acoustic aperture & glowing resonance dot
 *   framed by 3D-tilted orbital halos that respond to cursor tilt and live speech energy.
 * - Per-Language Horizon Lines: Renders each language's signature prosody rhythm and
 *   cultural waveform geometry (Seigaiha Ripple for ja, Bauhaus Equalizer for de,
 *   Compás Pulse for es, Liaison Legato for fr, Bel Canto Arc for it, Tonal Contour for zh,
 *   Taegeuk Phase for ko, Atlantic Swell for pt).
 */
export function AcousticStage({
  languageCode,
  connectionState,
  isPartnerSpeaking,
  isMuted,
  userLevelRef,
  partnerLevelRef,
}: AcousticStageProps) {
  const canvasRef = useRef<HTMLCanvasElement | null>(null);
  const pointerTiltRef = useRef<{ x: number; y: number }>({ x: 0, y: 0 });
  const culture = getCultureByLanguage(languageCode);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext("2d");
    if (!ctx) return;

    const reducedMotion = window.matchMedia(
      "(prefers-reduced-motion: reduce)"
    ).matches;

    let rafId = 0;
    let phase = 0;
    let orbitAngle = 0;
    let smoothUser = 0;
    let smoothPartner = 0;
    let smoothTiltX = 0;
    let smoothTiltY = 0;

    const prosody = culture.prosodyContour;

    const resize = () => {
      const rect = canvas.getBoundingClientRect();
      const dpr = Math.min(window.devicePixelRatio || 1, 2);
      const width = Math.max(1, Math.floor(rect.width * dpr));
      const height = Math.max(1, Math.floor(rect.height * dpr));
      if (canvas.width !== width || canvas.height !== height) {
        canvas.width = width;
        canvas.height = height;
      }
    };

    const cachedTheme = {
      isDark: true,
      primaryHex: culture.darkPrimaryHex,
      accentHex: culture.darkAccentHex,
      glowHex: culture.darkGlowHex,
      borderHex: "rgba(255,255,255,0.12)",
    };

    const syncThemeColors = () => {
      const rootEl = document.documentElement;
      const isDark = rootEl.dataset.mode !== "light";
      const styles = getComputedStyle(rootEl);
      cachedTheme.isDark = isDark;
      cachedTheme.primaryHex =
        styles.getPropertyValue("--parlo-primary").trim() ||
        (isDark ? culture.darkPrimaryHex : culture.primaryHex);
      cachedTheme.accentHex =
        styles.getPropertyValue("--parlo-accent").trim() ||
        (isDark ? culture.darkAccentHex : culture.accentHex);
      cachedTheme.glowHex =
        styles.getPropertyValue("--parlo-glow").trim() ||
        (isDark ? culture.darkGlowHex : culture.glowHex);
      cachedTheme.borderHex =
        styles.getPropertyValue("--parlo-border").trim() ||
        (isDark ? "rgba(255,255,255,0.12)" : "rgba(163,177,198,0.45)");
    };

    syncThemeColors();
    const themeObserver = new MutationObserver(syncThemeColors);
    themeObserver.observe(document.documentElement, {
      attributes: true,
      attributeFilter: ["data-culture", "data-mode", "class"],
    });

    const traceRoundedRect = (
      x: number,
      y: number,
      width: number,
      height: number,
      radius: number
    ) => {
      if (typeof ctx.roundRect === "function") {
        ctx.roundRect(x, y, width, height, radius);
      } else {
        const r = Math.min(radius, width / 2, height / 2);
        ctx.moveTo(x + r, y);
        ctx.arcTo(x + width, y, x + width, y + height, r);
        ctx.arcTo(x + width, y + height, x, y + height, r);
        ctx.arcTo(x, y + height, x, y, r);
        ctx.arcTo(x, y, x + width, y, r);
        ctx.closePath();
      }
    };

    const drawRibbon = (
      w: number,
      h: number,
      yOffset: number,
      amplitude: number,
      freq: number,
      speedPhase: number,
      strokeStyle: string,
      lineWidth: number,
      glowBlur: number,
      fillAlpha = 0,
      harmonicMod = 0.24
    ) => {
      const midY = h / 2 + yOffset;
      const steps = 96;
      ctx.save();
      ctx.beginPath();
      for (let i = 0; i <= steps; i++) {
        const t = i / steps;
        const x = t * w;
        const env = Math.sin(Math.PI * t);
        const envSq = env * env;

        // Subtle prosody modulation across the horizontal span
        const pIdx = t * (prosody.length - 1);
        const p0 = prosody[Math.floor(pIdx)] ?? 0.6;
        const p1 = prosody[Math.min(prosody.length - 1, Math.ceil(pIdx))] ?? 0.6;
        const pWeight = 0.68 + (p0 + (p1 - p0) * (pIdx % 1)) * 0.56;

        const y =
          midY +
          (Math.sin(t * Math.PI * freq + speedPhase) * (1 - harmonicMod) +
            Math.cos(t * Math.PI * (freq * 1.65) - speedPhase * 0.72) *
              harmonicMod) *
            amplitude *
            envSq *
            pWeight;

        if (i === 0) ctx.moveTo(x, y);
        else ctx.lineTo(x, y);
      }

      if (glowBlur > 0) {
        ctx.shadowColor = strokeStyle;
        ctx.shadowBlur = glowBlur;
      }
      ctx.strokeStyle = strokeStyle;
      ctx.lineWidth = lineWidth;
      ctx.lineCap = "round";
      ctx.stroke();

      if (fillAlpha > 0) {
        ctx.shadowBlur = 0;
        ctx.lineTo(w, midY);
        ctx.lineTo(0, midY);
        ctx.closePath();
        ctx.globalAlpha *= fillAlpha;
        ctx.fillStyle = strokeStyle;
        ctx.fill();
      }
      ctx.restore();
    };

    const drawCulturalCadence = (
      w: number,
      h: number,
      cx: number,
      cy: number,
      primaryHex: string,
      accentHex: string,
      glowHex: string,
      energy: number,
      isDark: boolean,
      dpr: number
    ) => {
      const isLive = connectionState === "live";
      const idleScale = isLive ? 1 + energy * 2.1 : 1;
      const glow = isDark ? 10 * dpr : 0;

      // Cultural geometry signatures layered cleanly around the Parlo center aperture
      if (languageCode === "de") {
        // Berlin Bauhaus Equalizer: crisp architectural columns driven by German prosody
        const barCount = 36;
        const margin = w * 0.06;
        const span = w - margin * 2;
        ctx.save();
        for (let i = 0; i < barCount; i++) {
          const t = i / (barCount - 1);
          const x = margin + t * span;
          const distCenter = Math.abs(t - 0.5) * 2;
          if (distCenter < 0.14) continue; // leave clean breathing space for Parlo logo aperture

          const pVal = prosody[i % prosody.length];
          const wave =
            0.5 + 0.5 * Math.sin(phase * 1.4 + i * 0.55);
          const barH =
            (5 + pVal * 15 * (0.45 + wave * 0.55)) *
            idleScale *
            (1 - distCenter * 0.55) *
            dpr;

          ctx.strokeStyle = i % 4 === 0 ? accentHex : primaryHex;
          ctx.globalAlpha = isLive ? 0.58 : 0.34;
          ctx.lineWidth = 2.2 * dpr;
          ctx.lineCap = "square";
          if (glow > 0 && i % 4 === 0) {
            ctx.shadowColor = accentHex;
            ctx.shadowBlur = glow;
          } else {
            ctx.shadowBlur = 0;
          }
          ctx.beginPath();
          ctx.moveTo(x, cy - barH);
          ctx.lineTo(x, cy + barH);
          ctx.stroke();
        }
        ctx.restore();
      } else if (languageCode === "ja") {
        // Kyoto Seigaiha Ripple: serene concentric semi-circular acoustic wave arcs
        ctx.save();
        const ringCount = 5;
        for (let r = 1; r <= ringCount; r++) {
          const pulse = reducedMotion
            ? 0
            : Math.sin(phase * 0.9 - r * 0.65) * 4 * dpr;
          const radius = (22 + r * 20) * dpr * (1 + energy * 0.16) + pulse;
          ctx.beginPath();
          ctx.arc(cx, cy + 16 * dpr, radius, Math.PI * 1.08, Math.PI * 1.92);
          ctx.strokeStyle = r % 2 === 0 ? accentHex : primaryHex;
          ctx.globalAlpha = Math.max(0.08, 0.36 - r * 0.055);
          ctx.lineWidth = (r === 1 ? 1.7 : 1.2) * dpr;
          if (glow > 0) {
            ctx.shadowColor = r % 2 === 0 ? accentHex : primaryHex;
            ctx.shadowBlur = glow * 0.8;
          }
          ctx.stroke();
        }
        ctx.restore();
      } else if (languageCode === "es") {
        // Spanish Compás Pulse: symmetric rhythmic stems echoing 12-beat Andalusian cadence
        const steps = 28;
        const margin = w * 0.07;
        const span = w - margin * 2;
        ctx.save();
        for (let i = 0; i < steps; i++) {
          const t = i / (steps - 1);
          const x = margin + t * span;
          const distCenter = Math.abs(t - 0.5) * 2;
          if (distCenter < 0.14) continue;
          const isAccentBeat = i % 3 === 0;
          const pVal = prosody[i % prosody.length];
          const beatPulse =
            0.55 + 0.45 * Math.cos(phase * 1.6 - Math.abs(i - steps / 2) * 0.5);
          const stemH =
            (isAccentBeat ? 14 : 7) *
            pVal *
            beatPulse *
            idleScale *
            (1 - distCenter * 0.45) *
            dpr;

          ctx.strokeStyle = isAccentBeat ? accentHex : primaryHex;
          ctx.globalAlpha = isAccentBeat ? 0.55 : 0.28;
          ctx.lineWidth = (isAccentBeat ? 2.1 : 1.3) * dpr;
          ctx.lineCap = "round";
          ctx.beginPath();
          ctx.moveTo(x, cy - stemH);
          ctx.lineTo(x, cy + stemH);
          ctx.stroke();

          if (isAccentBeat) {
            ctx.beginPath();
            ctx.arc(x, cy - stemH - 3.2 * dpr, 1.8 * dpr, 0, Math.PI * 2);
            ctx.fillStyle = glowHex;
            ctx.fill();
          }
        }
        ctx.restore();
      } else if (languageCode === "zh") {
        // Mandarin Tonal Contour: four-tone pitch anchor curves with glowing inflection nodes
        const nodes = 9;
        const margin = w * 0.1;
        const span = w - margin * 2;
        ctx.save();
        ctx.beginPath();
        for (let i = 0; i < nodes; i++) {
          const t = i / (nodes - 1);
          const x = margin + t * span;
          const pVal = prosody[i];
          const lift = Math.sin(phase * 1.1 + i * 0.8) * 3.5 * dpr;
          const y = cy + (0.58 - pVal) * h * 0.52 * idleScale + lift;
          if (i === 0) ctx.moveTo(x, y);
          else {
            const prevT = (i - 1) / (nodes - 1);
            const prevX = margin + prevT * span;
            const prevY =
              cy +
              (0.58 - prosody[i - 1]) * h * 0.52 * idleScale +
              Math.sin(phase * 1.1 + (i - 1) * 0.8) * 3.5 * dpr;
            const midX = (prevX + x) / 2;
            ctx.quadraticCurveTo(prevX, prevY, midX, (prevY + y) / 2);
            ctx.lineTo(x, y);
          }
        }
        ctx.strokeStyle = glowHex;
        ctx.globalAlpha = 0.42;
        ctx.lineWidth = 1.6 * dpr;
        if (glow > 0) {
          ctx.shadowColor = glowHex;
          ctx.shadowBlur = glow;
        }
        ctx.stroke();

        for (let i = 0; i < nodes; i++) {
          const t = i / (nodes - 1);
          const x = margin + t * span;
          if (Math.abs(t - 0.5) < 0.08) continue;
          const pVal = prosody[i];
          const y =
            cy +
            (0.58 - pVal) * h * 0.52 * idleScale +
            Math.sin(phase * 1.1 + i * 0.8) * 3.5 * dpr;
          ctx.beginPath();
          ctx.arc(x, y, 2.4 * dpr, 0, Math.PI * 2);
          ctx.fillStyle = i % 2 === 0 ? primaryHex : accentHex;
          ctx.globalAlpha = 0.72;
          ctx.fill();
        }
        ctx.restore();
      } else {
        // fr (Liaison Legato), it (Bel Canto Arc), ko (Taegeuk Phase), pt (Atlantic Swell):
        // Subtle calibrated prosody stem ticks flanking the central Parlo aperture
        const tickCount = 26;
        const margin = w * 0.06;
        const span = w - margin * 2;
        ctx.save();
        for (let i = 0; i < tickCount; i++) {
          const t = i / (tickCount - 1);
          const x = margin + t * span;
          const distCenter = Math.abs(t - 0.5) * 2;
          if (distCenter < 0.14) continue;
          const pVal = prosody[i % prosody.length];
          const tickH =
            (3.5 + pVal * 9) * (1 - distCenter * 0.5) * idleScale * dpr;
          ctx.beginPath();
          ctx.moveTo(x, cy - tickH);
          ctx.lineTo(x, cy + tickH);
          ctx.strokeStyle =
            i % 3 === 0 ? accentHex : i % 2 === 0 ? primaryHex : glowHex;
          ctx.globalAlpha = 0.24 + (1 - distCenter) * 0.22;
          ctx.lineWidth = 1.4 * dpr;
          ctx.lineCap = "round";
          ctx.stroke();
        }
        ctx.restore();
      }
    };

    const drawParloLogoAperture = (
      cx: number,
      cy: number,
      primaryHex: string,
      accentHex: string,
      glowHex: string,
      energy: number,
      isDark: boolean,
      dpr: number
    ) => {
      const isLive = connectionState === "live";
      const breathe = reducedMotion ? 0 : Math.sin(phase * 1.35) * 0.06;
      const scale = (1 + breathe + energy * 0.24) * dpr;

      // 3D tilted outer & inner orbital halos linked to Parlo aperture
      const rx1 = (38 + energy * 16) * dpr;
      const ry1 = rx1 * (0.42 + Math.abs(smoothTiltY) * 0.14);
      const rx2 = (28 + energy * 11) * dpr;
      const ry2 = rx2 * 0.56;

      // Outer halo
      ctx.save();
      ctx.translate(cx, cy);
      ctx.rotate(-0.2 + smoothTiltX * 0.14);
      ctx.beginPath();
      ctx.ellipse(0, 0, rx1, ry1, 0, 0, Math.PI * 2);
      ctx.strokeStyle = primaryHex;
      ctx.globalAlpha = isLive ? 0.58 : 0.34;
      ctx.lineWidth = 1.35 * dpr;
      if (isDark) {
        ctx.shadowColor = primaryHex;
        ctx.shadowBlur = 10 * dpr;
      }
      ctx.stroke();

      // Orbiting bead 1
      const bx1 = Math.cos(orbitAngle) * rx1;
      const by1 = Math.sin(orbitAngle) * ry1;
      ctx.beginPath();
      ctx.arc(bx1, by1, 2.5 * dpr, 0, Math.PI * 2);
      ctx.fillStyle = primaryHex;
      ctx.globalAlpha = 0.9;
      ctx.fill();
      ctx.restore();

      // Inner counter-rotating halo
      ctx.save();
      ctx.translate(cx, cy);
      ctx.rotate(0.24 - smoothTiltX * 0.16);
      ctx.beginPath();
      ctx.ellipse(0, 0, rx2, ry2, 0, 0, Math.PI * 2);
      ctx.strokeStyle = accentHex;
      ctx.globalAlpha = isLive ? 0.54 : 0.28;
      ctx.lineWidth = 1.2 * dpr;
      if (isDark) {
        ctx.shadowColor = accentHex;
        ctx.shadowBlur = 8 * dpr;
      }
      ctx.stroke();

      const bx2 = Math.cos(-orbitAngle * 1.4 + 1.1) * rx2;
      const by2 = Math.sin(-orbitAngle * 1.4 + 1.1) * ry2;
      ctx.beginPath();
      ctx.arc(bx2, by2, 2.2 * dpr, 0, Math.PI * 2);
      ctx.fillStyle = glowHex;
      ctx.globalAlpha = 0.85;
      ctx.fill();
      ctx.restore();

      // Sculptural Parlo 'P' Acoustic Aperture Vessel at dead center
      ctx.save();
      ctx.translate(cx, cy);

      // Soft ambient aura behind aperture
      const auraGrad = ctx.createRadialGradient(0, 0, 2 * dpr, 0, 0, 26 * dpr);
      auraGrad.addColorStop(
        0,
        isDark ? "rgba(255,255,255,0.14)" : "rgba(255,255,255,0.75)"
      );
      auraGrad.addColorStop(1, "rgba(0,0,0,0)");
      ctx.fillStyle = auraGrad;
      ctx.beginPath();
      ctx.arc(0, 0, 26 * dpr, 0, Math.PI * 2);
      ctx.fill();

      // Rounded architectural badge shell echoing ParloLogo
      const half = 15.5 * scale;
      const rad = 5.5 * scale;
      ctx.beginPath();
      traceRoundedRect(-half, -half, half * 2, half * 2, rad);
      ctx.fillStyle = isDark ? "rgba(12, 13, 18, 0.88)" : "rgba(228, 233, 240, 0.92)";
      ctx.fill();
      ctx.lineWidth = 1.25 * dpr;
      ctx.strokeStyle = isLive ? primaryHex : isDark ? "rgba(255,255,255,0.22)" : "rgba(36,45,58,0.18)";
      if (isDark) {
        ctx.shadowColor = primaryHex;
        ctx.shadowBlur = (isLive ? 16 : 8) * dpr;
      }
      ctx.stroke();
      ctx.shadowBlur = 0;

      // Pure Geometric 'P' Acoustic Monogram (exact geometry of ParloLogo)
      const s = scale * 0.95;
      ctx.translate(-12 * s, -12 * s);
      ctx.strokeStyle = isDark ? "#EBEBEB" : "#242D3A";
      ctx.lineWidth = 2.35 * s;
      ctx.lineCap = "round";
      ctx.lineJoin = "round";

      // Vertical stem
      ctx.beginPath();
      ctx.moveTo(6.5 * s, 4.5 * s);
      ctx.lineTo(6.5 * s, 19.5 * s);
      ctx.stroke();

      // Open acoustic bowl loop
      ctx.beginPath();
      ctx.moveTo(6.5 * s, 5.5 * s);
      ctx.lineTo(12.2 * s, 5.5 * s);
      ctx.bezierCurveTo(
        15.55 * s,
        5.5 * s,
        18 * s,
        7.58 * s,
        18 * s,
        10.6 * s
      );
      ctx.bezierCurveTo(
        18 * s,
        13.62 * s,
        15.55 * s,
        15.7 * s,
        12.2 * s,
        15.7 * s
      );
      ctx.lineTo(10.1 * s, 15.7 * s);
      ctx.stroke();

      // Glowing Parlo Focal Resonance Core Dot
      const dotPulse = reducedMotion
        ? 1
        : 1 + Math.sin(phase * 2.1) * 0.14 + energy * 0.35;
      ctx.beginPath();
      ctx.arc(11.6 * s, 10.6 * s, 2.25 * s * dotPulse, 0, Math.PI * 2);
      ctx.fillStyle = accentHex;
      if (isDark) {
        ctx.shadowColor = accentHex;
        ctx.shadowBlur = 12 * dpr;
      }
      ctx.fill();
      ctx.restore();
    };

    const render = () => {
      resize();
      const w = canvas.width;
      const h = canvas.height;
      const dpr = Math.min(window.devicePixelRatio || 1, 2);

      ctx.clearRect(0, 0, w, h);

      const targetUser =
        connectionState === "live" && !isMuted ? userLevelRef.current : 0;
      const targetPartner =
        connectionState === "live" ? partnerLevelRef.current : 0;

      smoothUser += (targetUser - smoothUser) * 0.2;
      smoothPartner += (targetPartner - smoothPartner) * 0.2;

      smoothTiltX += (pointerTiltRef.current.x - smoothTiltX) * 0.12;
      smoothTiltY += (pointerTiltRef.current.y - smoothTiltY) * 0.12;

      const energy = Math.max(smoothUser, smoothPartner);
      if (!reducedMotion) {
        phase += connectionState === "live" ? 0.055 + energy * 0.045 : 0.022;
        orbitAngle += connectionState === "live" ? 0.026 + energy * 0.05 : 0.012;
      }

      const { isDark, primaryHex, accentHex, glowHex, borderHex } = cachedTheme;

      const cx = w / 2 + smoothTiltX * 12 * dpr;
      const cy = h / 2 + smoothTiltY * 5 * dpr;
      const maxAmp = h * 0.34;
      const glowBlur = isDark ? 12 * dpr : 0;

      // Subtle architectural center horizon line
      ctx.save();
      const grad = ctx.createLinearGradient(0, cy, w, cy);
      grad.addColorStop(0, "transparent");
      grad.addColorStop(0.18, borderHex);
      grad.addColorStop(0.5, primaryHex);
      grad.addColorStop(0.82, borderHex);
      grad.addColorStop(1, "transparent");
      ctx.beginPath();
      ctx.moveTo(0, cy);
      ctx.lineTo(w, cy);
      ctx.strokeStyle = grad;
      ctx.globalAlpha = isDark ? 0.32 : 0.4;
      ctx.lineWidth = 1 * dpr;
      ctx.stroke();
      ctx.restore();

      // Per-language cultural cadence & geometric rhythm layer
      drawCulturalCadence(
        w,
        h,
        cx,
        cy,
        primaryHex,
        accentHex,
        glowHex,
        energy,
        isDark,
        dpr
      );

      // Per-language waveform tuning parameters
      const freqByLang: Record<string, [number, number, number]> = {
        es: [3.6, 5.2, 0.28],
        fr: [2.4, 3.8, 0.14],
        ja: [2.8, 4.4, 0.18],
        de: [4.2, 6.4, 0.32],
        it: [3.0, 4.6, 0.22],
        zh: [3.4, 5.0, 0.26],
        ko: [3.2, 4.8, 0.2],
        pt: [2.6, 4.0, 0.2],
      };
      const [baseFreq, altFreq, harmMod] = freqByLang[languageCode] ?? [3.2, 4.8, 0.22];

      if (connectionState === "idle" || connectionState === "error") {
        // Ready-to-speak dual harmonic ribbons tuned to active language rhythm
        ctx.save();
        ctx.globalAlpha = isDark ? 0.34 : 0.26;
        drawRibbon(
          w,
          h,
          -4 * dpr,
          reducedMotion ? 0 : 6.5 * dpr,
          altFreq,
          -phase * 0.85,
          accentHex,
          1.35 * dpr,
          glowBlur * 0.7,
          0,
          harmMod
        );
        ctx.globalAlpha = isDark ? 0.78 : 0.62;
        drawRibbon(
          w,
          h,
          0,
          reducedMotion ? 0 : 8.5 * dpr,
          baseFreq,
          phase,
          primaryHex,
          2.0 * dpr,
          glowBlur,
          0.08,
          harmMod
        );
        ctx.globalAlpha = isDark ? 0.34 : 0.26;
        drawRibbon(
          w,
          h,
          4 * dpr,
          reducedMotion ? 0 : 5.5 * dpr,
          baseFreq * 0.82,
          phase * 0.7 + 1.2,
          glowHex,
          1.2 * dpr,
          glowBlur * 0.6,
          0,
          harmMod
        );
        ctx.restore();
      } else if (connectionState === "connecting") {
        ctx.save();
        ctx.globalAlpha = 0.42;
        drawRibbon(
          w,
          h,
          -4 * dpr,
          reducedMotion ? 4 * dpr : 11 * dpr,
          altFreq * 1.15,
          -phase * 1.35,
          accentHex,
          1.5 * dpr,
          glowBlur * 0.8,
          0,
          harmMod
        );
        ctx.globalAlpha = 0.9;
        drawRibbon(
          w,
          h,
          0,
          reducedMotion ? 5 * dpr : 13 * dpr,
          baseFreq * 1.15,
          phase * 1.55,
          primaryHex,
          2.2 * dpr,
          glowBlur * 1.1,
          0.1,
          harmMod
        );
        ctx.restore();
      } else {
        // Active live session: dynamic partner (primary) and learner (accent) acoustic waves
        const partnerAmp =
          Math.max(isPartnerSpeaking ? 0.18 : 0.05, smoothPartner) * maxAmp;
        const userAmp = Math.max(isMuted ? 0 : 0.05, smoothUser) * maxAmp;

        ctx.save();
        ctx.globalAlpha = 0.28;
        drawRibbon(
          w,
          h,
          -6 * dpr + smoothTiltY * 4 * dpr,
          partnerAmp * 0.65,
          altFreq * 1.1,
          -phase * 1.2,
          glowHex,
          1.35 * dpr,
          glowBlur * 0.6,
          0,
          harmMod
        );
        ctx.restore();

        ctx.save();
        ctx.globalAlpha = isPartnerSpeaking ? 0.96 : 0.44;
        drawRibbon(
          w,
          h,
          0,
          partnerAmp,
          baseFreq * 1.1,
          phase * 1.3,
          primaryHex,
          2.5 * dpr,
          glowBlur * 1.2,
          isPartnerSpeaking ? 0.11 : 0.04,
          harmMod
        );
        ctx.restore();

        if (!isMuted) {
          ctx.save();
          ctx.globalAlpha = smoothUser > 0.05 ? 0.95 : 0.36;
          drawRibbon(
            w,
            h,
            4 * dpr - smoothTiltY * 4 * dpr,
            userAmp,
            altFreq,
            phase * 0.98 + 1.4,
            accentHex,
            2.2 * dpr,
            glowBlur,
            smoothUser > 0.05 ? 0.1 : 0.03,
            harmMod
          );
          ctx.restore();
        }
      }

      // Draw sculptural Parlo Logo Aperture on top at the stage focal center
      drawParloLogoAperture(
        cx,
        cy,
        primaryHex,
        accentHex,
        glowHex,
        energy,
        isDark,
        dpr
      );

      rafId = requestAnimationFrame(render);
    };

    rafId = requestAnimationFrame(render);
    return () => {
      cancelAnimationFrame(rafId);
      themeObserver.disconnect();
    };
  }, [
    connectionState,
    culture,
    isMuted,
    isPartnerSpeaking,
    languageCode,
    partnerLevelRef,
    userLevelRef,
  ]);

  const handlePointerMove = (e: React.PointerEvent<HTMLDivElement>) => {
    const rect = e.currentTarget.getBoundingClientRect();
    if (!rect.width || !rect.height) return;
    pointerTiltRef.current = {
      x: ((e.clientX - rect.left) / rect.width - 0.5) * 2,
      y: ((e.clientY - rect.top) / rect.height - 0.5) * 2,
    };
  };

  const handlePointerLeave = () => {
    pointerTiltRef.current = { x: 0, y: 0 };
  };

  return (
    <div
      onPointerMove={handlePointerMove}
      onPointerLeave={handlePointerLeave}
      className="relative w-full h-36 sm:h-40 overflow-hidden rounded-xl"
    >
      <canvas
        ref={canvasRef}
        className="w-full h-full block"
        aria-label={`${culture.waveformName} live acoustic waveform for ${culture.atelierName}`}
      />
      <span className="pointer-events-none absolute right-2.5 bottom-1.5 font-mono text-[10px] tracking-wide text-[var(--parlo-ink-muted)] select-none">
        {culture.waveformName} · {culture.atelierName}
      </span>
    </div>
  );
}
