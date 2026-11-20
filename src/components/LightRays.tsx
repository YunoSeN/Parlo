import { useEffect, useRef } from "react";

export type RaysOrigin =
  | "top-center"
  | "top-left"
  | "top-right"
  | "right"
  | "left"
  | "bottom-center"
  | "bottom-right"
  | "bottom-left";

export interface LightRaysProps {
  raysOrigin?: RaysOrigin;
  raysColor?: string;
  secondaryColor?: string;
  raysSpeed?: number;
  lightSpread?: number;
  rayLength?: number;
  pulsating?: boolean;
  fadeDistance?: number;
  followMouse?: boolean;
  mouseInfluence?: number;
  noiseAmount?: number;
  distortion?: number;
  intensity?: number;
  className?: string;
}

/**
 * Parses #RGB, #RRGGBB, rgb(...), or rgba(...) strings (including values
 * resolved from CSS custom properties) into normalized linear-0..1 RGB tuples.
 */
function parseColorToRgb(
  input: string,
  fallback: [number, number, number] = [0.3, 0.85, 0.65]
): [number, number, number] {
  const clean = input.trim();
  if (!clean) return fallback;

  const hex6 = /^#?([a-f\d]{2})([a-f\d]{2})([a-f\d]{2})$/i.exec(clean);
  if (hex6) {
    return [
      parseInt(hex6[1], 16) / 255,
      parseInt(hex6[2], 16) / 255,
      parseInt(hex6[3], 16) / 255,
    ];
  }

  const hex3 = /^#?([a-f\d])([a-f\d])([a-f\d])$/i.exec(clean);
  if (hex3) {
    return [
      parseInt(hex3[1] + hex3[1], 16) / 255,
      parseInt(hex3[2] + hex3[2], 16) / 255,
      parseInt(hex3[3] + hex3[3], 16) / 255,
    ];
  }

  const rgbMatch =
    /^rgba?\(\s*([\d.]+)\s*[,\s]\s*([\d.]+)\s*[,\s]\s*([\d.]+)/i.exec(clean);
  if (rgbMatch) {
    return [
      Math.max(0, Math.min(1, parseFloat(rgbMatch[1]) / 255)),
      Math.max(0, Math.min(1, parseFloat(rgbMatch[2]) / 255)),
      Math.max(0, Math.min(1, parseFloat(rgbMatch[3]) / 255)),
    ];
  }

  return fallback;
}

function getAnchorAndDir(
  origin: RaysOrigin,
  w: number,
  h: number
): { anchor: [number, number]; dir: [number, number] } {
  const outside = 0.18;
  switch (origin) {
    case "top-left":
      return { anchor: [0.06 * w, (1 + outside) * h], dir: [0.65, -0.76] };
    case "top-right":
      return { anchor: [0.94 * w, (1 + outside) * h], dir: [-0.65, -0.76] };
    case "left":
      return { anchor: [-outside * w, 0.55 * h], dir: [1, -0.05] };
    case "right":
      return { anchor: [(1 + outside) * w, 0.55 * h], dir: [-1, -0.05] };
    case "bottom-left":
      return { anchor: [0.06 * w, -outside * h], dir: [0.65, 0.76] };
    case "bottom-center":
      return { anchor: [0.5 * w, -outside * h], dir: [0, 1] };
    case "bottom-right":
      return { anchor: [0.94 * w, -outside * h], dir: [-0.65, 0.76] };
    default: // top-center (WebGL gl_FragCoord y=h is top)
      return { anchor: [0.5 * w, (1 + outside) * h], dir: [0, -1] };
  }
}

const VERT_SRC = `
  attribute vec2 aPosition;
  void main() {
    gl_Position = vec4(aPosition, 0.0, 1.0);
  }
`;

const FRAG_SRC = `
  precision highp float;
  uniform float iTime;
  uniform vec2  iResolution;
  uniform vec2  rayPos;
  uniform vec2  rayDir;
  uniform vec3  raysColor;
  uniform vec3  secondaryColor;
  uniform float raysSpeed;
  uniform float lightSpread;
  uniform float rayLength;
  uniform float pulsating;
  uniform float fadeDistance;
  uniform vec2  mousePos;
  uniform float mouseInfluence;
  uniform float noiseAmount;
  uniform float distortion;
  uniform float intensity;

  float hash21(vec2 p) {
    p = fract(p * vec2(123.34, 456.21));
    p += dot(p, p + 45.32);
    return fract(p.x * p.y);
  }

  float rayStrength(vec2 raySource, vec2 rayRefDir, vec2 coord, float seedA, float seedB, float speed) {
    vec2 sourceToCoord = coord - raySource;
    float dist = length(sourceToCoord);
    vec2 dirNorm = sourceToCoord / max(dist, 0.0001);
    float cosAngle = dot(dirNorm, rayRefDir);

    float d = distortion * sin(iTime * 1.15 + dist * 0.004);
    float distortedAngle = cosAngle + d;

    float spreadFactor = pow(max(distortedAngle, 0.0), 1.0 / max(lightSpread, 0.001));
    float maxDist = max(iResolution.x, iResolution.y) * rayLength;
    float lengthFalloff = clamp((maxDist - dist) / maxDist, 0.0, 1.0);
    float fadeFactor = fadeDistance * max(iResolution.x, iResolution.y);
    float fadeFalloff = clamp((fadeFactor - dist) / fadeFactor, 0.0, 1.0);

    float pulse = pulsating > 0.5 ? (0.86 + 0.14 * sin(iTime * speed * 2.8)) : 1.0;

    float baseStrength = clamp(
      (0.48 + 0.22 * sin(distortedAngle * seedA + iTime * speed)) +
      (0.32 + 0.20 * cos(-distortedAngle * seedB + iTime * speed * 0.78)),
      0.0,
      1.0
    );

    return baseStrength * lengthFalloff * fadeFalloff * spreadFactor * pulse;
  }

  void main() {
    vec2 coord = gl_FragCoord.xy;
    vec2 finalRayDir = normalize(rayDir);

    if (mouseInfluence > 0.0) {
      vec2 mouseScreenPos = mousePos * iResolution.xy;
      vec2 mouseDir = normalize(mouseScreenPos - rayPos);
      finalRayDir = normalize(mix(finalRayDir, mouseDir, mouseInfluence));
    }

    float r1 = rayStrength(rayPos, finalRayDir, coord, 42.6, 29.4, 0.75 * raysSpeed);
    float r2 = rayStrength(rayPos, finalRayDir, coord, 26.2, 18.8, 1.10 * raysSpeed);
    float r3 = rayStrength(rayPos, finalRayDir, coord, 13.5, 51.2, 0.45 * raysSpeed);

    float combined = (r1 * 0.42 + r2 * 0.38 + r3 * 0.20);
    combined = pow(combined, 0.78) * intensity;

    // Chromatic blend between primary culture pigment and secondary accent along ray sweep
    float colorMix = clamp(0.22 + 0.55 * (r2 - r1 * 0.35), 0.0, 1.0);
    vec3 col = mix(raysColor, secondaryColor, colorMix) * combined;

    if (noiseAmount > 0.0) {
      float n = hash21(coord * 0.25 + vec2(iTime * 12.0));
      col *= (1.0 - noiseAmount + noiseAmount * n);
    }

    gl_FragColor = vec4(col, clamp(combined * 0.92, 0.0, 0.85));
  }
`;

/**
 * LightRays
 *
 * Zero-dependency WebGL volumetric light-ray shader background adapted for Parlo.
 * Dynamically smoothly interpolates primary & secondary colors and ray origin
 * whenever the user switches languages or navigates categories, with software-GL
 * frame pacing, reduced-motion safeguards, and deterministic WebGL cleanup on unmount.
 */
export function LightRays({
  raysOrigin = "top-center",
  raysColor = "#10B981",
  secondaryColor = "#3B82F6",
  raysSpeed = 0.85,
  lightSpread = 1.05,
  rayLength = 1.65,
  pulsating = false,
  fadeDistance = 1.05,
  followMouse = true,
  mouseInfluence = 0.18,
  noiseAmount = 0.04,
  distortion = 0.06,
  intensity = 0.55,
  className = "",
}: LightRaysProps) {
  const canvasRef = useRef<HTMLCanvasElement | null>(null);
  const configRef = useRef({
    raysOrigin,
    raysColor: parseColorToRgb(raysColor),
    secondaryColor: parseColorToRgb(secondaryColor, [0.23, 0.51, 0.96]),
    raysSpeed,
    lightSpread,
    rayLength,
    pulsating,
    fadeDistance,
    followMouse,
    mouseInfluence,
    noiseAmount,
    distortion,
    intensity,
  });

  // Keep target shader uniforms synced smoothly without tearing down the WebGL context
  useEffect(() => {
    configRef.current = {
      raysOrigin,
      raysColor: parseColorToRgb(raysColor, configRef.current.raysColor),
      secondaryColor: parseColorToRgb(
        secondaryColor,
        configRef.current.secondaryColor
      ),
      raysSpeed,
      lightSpread,
      rayLength,
      pulsating,
      fadeDistance,
      followMouse,
      mouseInfluence,
      noiseAmount,
      distortion,
      intensity,
    };
  }, [
    distortion,
    fadeDistance,
    followMouse,
    intensity,
    lightSpread,
    mouseInfluence,
    noiseAmount,
    pulsating,
    rayLength,
    raysColor,
    raysOrigin,
    raysSpeed,
    secondaryColor,
  ]);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    const reducedMotion = window.matchMedia(
      "(prefers-reduced-motion: reduce)"
    ).matches;

    const gl = canvas.getContext("webgl", {
      alpha: true,
      antialias: false,
      depth: false,
      stencil: false,
      powerPreference: "high-performance",
      premultipliedAlpha: true,
    });
    if (!gl) return;

    // Detect software WebGL to cap pixel ratio & pace loop gently
    const dbg = gl.getExtension("WEBGL_debug_renderer_info");
    const rendererStr = String(
      gl.getParameter(dbg ? dbg.UNMASKED_RENDERER_WEBGL : gl.RENDERER) ?? ""
    );
    const isSoftwareGl =
      /SwiftShader|llvmpipe|softpipe|Software|Basic Render/i.test(rendererStr);

    const compile = (type: number, source: string) => {
      const sh = gl.createShader(type);
      if (!sh) return null;
      gl.shaderSource(sh, source);
      gl.compileShader(sh);
      if (!gl.getShaderParameter(sh, gl.COMPILE_STATUS)) {
        gl.deleteShader(sh);
        return null;
      }
      return sh;
    };

    const vs = compile(gl.VERTEX_SHADER, VERT_SRC);
    const fs = compile(gl.FRAGMENT_SHADER, FRAG_SRC);
    if (!vs || !fs) {
      if (vs) gl.deleteShader(vs);
      if (fs) gl.deleteShader(fs);
      return;
    }

    const prog = gl.createProgram();
    if (!prog) {
      gl.deleteShader(vs);
      gl.deleteShader(fs);
      return;
    }
    gl.attachShader(prog, vs);
    gl.attachShader(prog, fs);
    gl.linkProgram(prog);
    if (!gl.getProgramParameter(prog, gl.LINK_STATUS)) {
      gl.detachShader(prog, vs);
      gl.detachShader(prog, fs);
      gl.deleteProgram(prog);
      gl.deleteShader(vs);
      gl.deleteShader(fs);
      return;
    }

    gl.useProgram(prog);
    gl.enable(gl.BLEND);
    gl.blendFunc(gl.SRC_ALPHA, gl.ONE_MINUS_SRC_ALPHA);

    // Fullscreen triangle
    const buffer = gl.createBuffer();
    gl.bindBuffer(gl.ARRAY_BUFFER, buffer);
    gl.bufferData(
      gl.ARRAY_BUFFER,
      new Float32Array([-1, -1, 3, -1, -1, 3]),
      gl.STATIC_DRAW
    );
    const posLoc = gl.getAttribLocation(prog, "aPosition");
    gl.enableVertexAttribArray(posLoc);
    gl.vertexAttribPointer(posLoc, 2, gl.FLOAT, false, 0, 0);

    const u = {
      iTime: gl.getUniformLocation(prog, "iTime"),
      iResolution: gl.getUniformLocation(prog, "iResolution"),
      rayPos: gl.getUniformLocation(prog, "rayPos"),
      rayDir: gl.getUniformLocation(prog, "rayDir"),
      raysColor: gl.getUniformLocation(prog, "raysColor"),
      secondaryColor: gl.getUniformLocation(prog, "secondaryColor"),
      raysSpeed: gl.getUniformLocation(prog, "raysSpeed"),
      lightSpread: gl.getUniformLocation(prog, "lightSpread"),
      rayLength: gl.getUniformLocation(prog, "rayLength"),
      pulsating: gl.getUniformLocation(prog, "pulsating"),
      fadeDistance: gl.getUniformLocation(prog, "fadeDistance"),
      mousePos: gl.getUniformLocation(prog, "mousePos"),
      mouseInfluence: gl.getUniformLocation(prog, "mouseInfluence"),
      noiseAmount: gl.getUniformLocation(prog, "noiseAmount"),
      distortion: gl.getUniformLocation(prog, "distortion"),
      intensity: gl.getUniformLocation(prog, "intensity"),
    };

    const mouse = { x: 0.5, y: 0.35 };
    const smoothMouse = { x: 0.5, y: 0.35 };
    const curPrimary: [number, number, number] = [...configRef.current.raysColor];
    const curSecondary: [number, number, number] = [
      ...configRef.current.secondaryColor,
    ];
    let curIntensity = configRef.current.intensity;

    let rafId = 0;
    let timerId = 0;
    let disposed = false;
    let contextLost = false;
    const startTime = performance.now();

    const resize = () => {
      if (disposed || contextLost || gl.isContextLost()) return;
      const parent = canvas.parentElement;
      if (!parent) return;
      const dpr = isSoftwareGl ? 0.75 : Math.min(window.devicePixelRatio || 1, 1.5);
      const w = Math.max(1, Math.floor(parent.clientWidth * dpr));
      const h = Math.max(1, Math.floor(parent.clientHeight * dpr));
      if (canvas.width !== w || canvas.height !== h) {
        canvas.width = w;
        canvas.height = h;
        gl.viewport(0, 0, w, h);
      }
    };

    const onPointerMove = (e: PointerEvent) => {
      if (!configRef.current.followMouse || e.pointerType === "touch") return;
      const rect = canvas.getBoundingClientRect();
      if (!rect.width || !rect.height) return;
      mouse.x = Math.max(0, Math.min(1, (e.clientX - rect.left) / rect.width));
      mouse.y = Math.max(0, Math.min(1, (e.clientY - rect.top) / rect.height));
    };

    const onContextLost = (e: Event) => {
      e.preventDefault();
      contextLost = true;
      cancelAnimationFrame(rafId);
      window.clearTimeout(timerId);
    };

    const onContextRestored = () => {
      if (disposed) return;
      contextLost = false;
      resize();
      rafId = requestAnimationFrame(drawFrame);
    };

    let resizeObserver: ResizeObserver | null = null;
    if (typeof ResizeObserver !== "undefined" && canvas.parentElement) {
      resizeObserver = new ResizeObserver(() => resize());
      resizeObserver.observe(canvas.parentElement);
    }

    canvas.addEventListener("webglcontextlost", onContextLost);
    canvas.addEventListener("webglcontextrestored", onContextRestored);
    window.addEventListener("resize", resize);
    window.addEventListener("pointermove", onPointerMove, { passive: true });
    resize();

    const drawFrame = (now: number) => {
      if (disposed || contextLost || gl.isContextLost()) return;
      const cfg = configRef.current;

      // Smoothly lerp colors when user switches language or theme mode
      const lerp = 0.08;
      for (let i = 0; i < 3; i++) {
        curPrimary[i] += (cfg.raysColor[i] - curPrimary[i]) * lerp;
        curSecondary[i] += (cfg.secondaryColor[i] - curSecondary[i]) * lerp;
      }
      curIntensity += (cfg.intensity - curIntensity) * 0.1;

      smoothMouse.x += (mouse.x - smoothMouse.x) * 0.06;
      smoothMouse.y += (mouse.y - smoothMouse.y) * 0.06;

      const w = canvas.width;
      const h = canvas.height;
      if (w <= 0 || h <= 0) {
        resize();
      }
      const { anchor, dir } = getAnchorAndDir(cfg.raysOrigin, canvas.width, canvas.height);

      gl.clearColor(0, 0, 0, 0);
      gl.clear(gl.COLOR_BUFFER_BIT);

      gl.uniform1f(u.iTime, reducedMotion ? 1.5 : (now - startTime) * 0.001);
      gl.uniform2f(u.iResolution, canvas.width, canvas.height);
      gl.uniform2f(u.rayPos, anchor[0], anchor[1]);
      gl.uniform2f(u.rayDir, dir[0], dir[1]);
      gl.uniform3f(u.raysColor, curPrimary[0], curPrimary[1], curPrimary[2]);
      gl.uniform3f(
        u.secondaryColor,
        curSecondary[0],
        curSecondary[1],
        curSecondary[2]
      );
      gl.uniform1f(u.raysSpeed, cfg.raysSpeed);
      gl.uniform1f(u.lightSpread, cfg.lightSpread);
      gl.uniform1f(u.rayLength, cfg.rayLength);
      gl.uniform1f(u.pulsating, cfg.pulsating ? 1.0 : 0.0);
      gl.uniform1f(u.fadeDistance, cfg.fadeDistance);
      gl.uniform2f(u.mousePos, smoothMouse.x, 1.0 - smoothMouse.y);
      gl.uniform1f(u.mouseInfluence, cfg.followMouse ? cfg.mouseInfluence : 0.0);
      gl.uniform1f(u.noiseAmount, cfg.noiseAmount);
      gl.uniform1f(u.distortion, cfg.distortion);
      gl.uniform1f(u.intensity, curIntensity);

      gl.drawArrays(gl.TRIANGLES, 0, 3);

      if (reducedMotion || disposed) return;
      if (isSoftwareGl) {
        timerId = window.setTimeout(() => {
          if (disposed || contextLost) return;
          rafId = requestAnimationFrame(drawFrame);
        }, 90);
      } else {
        rafId = requestAnimationFrame(drawFrame);
      }
    };

    rafId = requestAnimationFrame(drawFrame);

    return () => {
      disposed = true;
      cancelAnimationFrame(rafId);
      window.clearTimeout(timerId);
      resizeObserver?.disconnect();
      canvas.removeEventListener("webglcontextlost", onContextLost);
      canvas.removeEventListener("webglcontextrestored", onContextRestored);
      window.removeEventListener("resize", resize);
      window.removeEventListener("pointermove", onPointerMove);

      if (!gl.isContextLost()) {
        if (posLoc >= 0) {
          gl.disableVertexAttribArray(posLoc);
        }
        gl.bindBuffer(gl.ARRAY_BUFFER, null);
        gl.useProgram(null);
        gl.detachShader(prog, vs);
        gl.detachShader(prog, fs);
        gl.deleteBuffer(buffer);
        gl.deleteProgram(prog);
        gl.deleteShader(vs);
        gl.deleteShader(fs);
        gl.getExtension("WEBGL_lose_context")?.loseContext();
      }
      canvas.width = 0;
      canvas.height = 0;
    };
  }, []);

  return (
    <canvas
      ref={canvasRef}
      aria-hidden="true"
      className={`pointer-events-none absolute inset-0 w-full h-full block ${className}`}
    />
  );
}

export default LightRays;
