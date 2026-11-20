export type ThemeId = "obsidian-glass" | "soft-ceramic";

export interface ThemeSwatch {
  role: "Canvas" | "Ink" | "Primary" | "Accent";
  name: string;
  hex: string;
}

export interface ParloTheme {
  id: ThemeId;
  name: string;
  mode: "light" | "dark";
  tagline: string;
  swatches: [ThemeSwatch, ThemeSwatch, ThemeSwatch, ThemeSwatch];
  canvas: string;
  surface: string;
  ink: string;
  primary: string;
  accent: string;
}

/**
 * One unified adaptive Parlo surface architecture in two tactile studio finishes:
 * - Obsidian Glass (Dark-Mode-First): Floating obsidian shell, 60px precision grid,
 *   grainy fractal noise, 120px glow-spheres & blurred glass cards that morph to every language.
 * - Soft Ceramic (Neumorphic Light): Cool molded clay surfaces with dual opposing RGBA
 *   extruded & carved-inset shadows that tint seamlessly to every language.
 */
export const PARLO_THEMES: ParloTheme[] = [
  {
    id: "obsidian-glass",
    name: "Obsidian Glass",
    mode: "dark",
    tagline:
      "Floating obsidian shell, 60px architectural grid, 120px glow-spheres & blurred glass cards adapting to every language",
    canvas: "#0C0C0F",
    surface: "#121318",
    ink: "#EBEBEB",
    primary: "#CCFF00",
    accent: "#10B981",
    swatches: [
      { role: "Canvas", name: "Obsidian Shell", hex: "#0C0C0F" },
      { role: "Ink", name: "Studio Chalk", hex: "#EBEBEB" },
      { role: "Primary", name: "Culture Luminous", hex: "#CCFF00" },
      { role: "Accent", name: "Culture Spark", hex: "#10B981" },
    ],
  },
  {
    id: "soft-ceramic",
    name: "Soft Ceramic",
    mode: "light",
    tagline:
      "Tactile neumorphic cool-clay studio with dual opposing soft shadows & carved wells adapting to every language",
    canvas: "#E0E5EC",
    surface: "#E5E9F0",
    ink: "#26303D",
    primary: "#15548A",
    accent: "#DF4B22",
    swatches: [
      { role: "Canvas", name: "Soft Clay", hex: "#E0E5EC" },
      { role: "Ink", name: "Graphite Ink", hex: "#26303D" },
      { role: "Primary", name: "Culture Primary", hex: "#15548A" },
      { role: "Accent", name: "Culture Accent", hex: "#DF4B22" },
    ],
  },
];

export const DEFAULT_THEME_ID: ThemeId = "obsidian-glass";

export function getThemeById(id: string | null | undefined): ParloTheme {
  return PARLO_THEMES.find((t) => t.id === id) ?? PARLO_THEMES[0];
}
