import { useEffect, useMemo, useRef, useState } from "react";
import {
  ArrowRight,
  Compass,
  Globe,
  Mic,
  Palette,
  Search,
  Sparkles,
  X,
} from "lucide-react";
import { LANGUAGES } from "../data/catalog";
import { PARLO_THEMES, ThemeId } from "../lib/themes";
import { AppView, CefrLevel, Scenario } from "../types";
import { LanguageFlagBadge } from "./LanguageFlagBadge";

interface CommandItem {
  id: string;
  group: "Actions" | "Views" | "Languages" | "Scenarios" | "Themes";
  label: string;
  subtitle: string;
  keywords: string;
  languageCode?: string;
  swatches?: string[];
  onSelect: () => void;
}

interface CommandPaletteProps {
  open: boolean;
  onClose: () => void;
  activeView: AppView;
  activeLanguageCode: string;
  activeLevel: CefrLevel;
  activeThemeId: ThemeId;
  isSessionActive: boolean;
  scenarios: Scenario[];
  onNavigate: (view: AppView) => void;
  onSelectLanguage: (code: string) => void;
  onSelectLevel: (level: CefrLevel) => void;
  onSelectScenario: (scenario: Scenario) => void;
  onSelectTheme: (themeId: ThemeId) => void;
  onToggleSession: () => void;
}

export function CommandPalette({
  open,
  onClose,
  activeView,
  activeLanguageCode,
  activeLevel,
  activeThemeId,
  isSessionActive,
  scenarios,
  onNavigate,
  onSelectLanguage,
  onSelectLevel,
  onSelectScenario,
  onSelectTheme,
  onToggleSession,
}: CommandPaletteProps) {
  const [query, setQuery] = useState("");
  const [highlightIdx, setHighlightIdx] = useState(0);
  const inputRef = useRef<HTMLInputElement | null>(null);

  useEffect(() => {
    if (open) {
      setQuery("");
      setHighlightIdx(0);
      window.setTimeout(() => inputRef.current?.focus(), 20);
    }
  }, [open]);

  const items = useMemo<CommandItem[]>(() => {
    const list: CommandItem[] = [
      {
        id: "action-session",
        group: "Actions",
        label: isSessionActive ? "End Live Voice Session" : "Start Live Voice Session",
        subtitle: isSessionActive
          ? "Archive transcript and stop microphone"
          : "Jump straight into real-time voice practice",
        keywords: "mic voice talk speak start end session practice",
        onSelect: onToggleSession,
      },
      ...(["A2", "B1", "B2", "C1"] as CefrLevel[]).map((lvl) => ({
        id: `level-${lvl}`,
        group: "Actions" as const,
        label: `Set Proficiency to CEFR ${lvl}`,
        subtitle: activeLevel === lvl ? "Currently active level" : "Tune conversation complexity",
        keywords: `cefr level ${lvl.toLowerCase()} difficulty`,
        onSelect: () => onSelectLevel(lvl),
      })),
      {
        id: "view-studio",
        group: "Views",
        label: "Open Voice Studio",
        subtitle: activeView === "studio" ? "Current view" : "Live conversation & real-time coach",
        keywords: "studio home voice chat",
        onSelect: () => onNavigate("studio"),
      },
      {
        id: "view-spatial",
        group: "Views",
        label: "Open 3D Spatial Stage",
        subtitle: activeView === "spatial" ? "Current view" : "Interactive café tabletop immersion",
        keywords: "3d stage spatial diorama threejs",
        onSelect: () => onNavigate("spatial"),
      },
      {
        id: "view-scenarios",
        group: "Views",
        label: "Browse Scenarios",
        subtitle: activeView === "scenarios" ? "Current view" : "Curated roleplays & custom builder",
        keywords: "scenarios roleplay places custom",
        onSelect: () => onNavigate("scenarios"),
      },
      {
        id: "view-phrasebook",
        group: "Views",
        label: "Open Phrasebook",
        subtitle: activeView === "phrasebook" ? "Current view" : "Saved expressions & flashcards",
        keywords: "phrasebook vocab flashcards words",
        onSelect: () => onNavigate("phrasebook"),
      },
      {
        id: "view-review",
        group: "Views",
        label: "Open Session Review",
        subtitle: activeView === "review" ? "Current view" : "Daily streak, weekly goal & debriefs",
        keywords: "review streak goals chart analytics debrief",
        onSelect: () => onNavigate("review"),
      },
      {
        id: "view-pricing",
        group: "Views",
        label: "View Membership & Plans",
        subtitle: activeView === "pricing" ? "Current view" : "Starter, Conversationalist & Cohort plans",
        keywords: "pricing plans upgrade billing subscription",
        onSelect: () => onNavigate("pricing"),
      },
      ...PARLO_THEMES.map((theme) => ({
        id: `theme-${theme.id}`,
        group: "Themes" as const,
        label: `Theme: ${theme.name}`,
        subtitle:
          activeThemeId === theme.id ? "Active palette" : theme.tagline,
        keywords: `theme color palette ${theme.name.toLowerCase()} ${theme.tagline.toLowerCase()}`,
        swatches: theme.swatches.map((s) => s.hex),
        onSelect: () => onSelectTheme(theme.id),
      })),
      ...LANGUAGES.map((lang) => ({
        id: `lang-${lang.code}`,
        group: "Languages" as const,
        label: `${lang.name} (${lang.nativeName})`,
        subtitle:
          activeLanguageCode === lang.code
            ? "Currently selected language"
            : lang.regionHint,
        keywords: `language ${lang.name.toLowerCase()} ${lang.nativeName.toLowerCase()} ${lang.code}`,
        languageCode: lang.code,
        onSelect: () => {
          onSelectLanguage(lang.code);
          onNavigate("studio");
        },
      })),
      ...scenarios.slice(0, 8).map((sc) => ({
        id: `scenario-${sc.id}`,
        group: "Scenarios" as const,
        label: sc.title,
        subtitle: `${sc.city} · Partner: ${sc.partnerName} (${sc.recommendedLevel})`,
        keywords: `scenario ${sc.title.toLowerCase()} ${sc.city.toLowerCase()} ${sc.category.toLowerCase()}`,
        onSelect: () => onSelectScenario(sc),
      })),
    ];

    return list;
  }, [
    activeLanguageCode,
    activeLevel,
    activeThemeId,
    activeView,
    isSessionActive,
    onNavigate,
    onSelectLanguage,
    onSelectLevel,
    onSelectScenario,
    onSelectTheme,
    onToggleSession,
    scenarios,
  ]);

  const filtered = useMemo(() => {
    const q = query.trim().toLowerCase();
    if (!q) return items.slice(0, 14);
    return items.filter(
      (item) =>
        item.label.toLowerCase().includes(q) ||
        item.subtitle.toLowerCase().includes(q) ||
        item.keywords.includes(q) ||
        item.group.toLowerCase().includes(q)
    );
  }, [items, query]);

  useEffect(() => {
    setHighlightIdx(0);
  }, [query]);

  useEffect(() => {
    if (!open) return;
    const onKeyDown = (e: KeyboardEvent) => {
      if (e.key === "Escape") {
        e.preventDefault();
        onClose();
      } else if (e.key === "ArrowDown") {
        e.preventDefault();
        setHighlightIdx((prev) =>
          filtered.length > 0 ? (prev + 1) % filtered.length : 0
        );
      } else if (e.key === "ArrowUp") {
        e.preventDefault();
        setHighlightIdx((prev) =>
          filtered.length > 0
            ? (prev - 1 + filtered.length) % filtered.length
            : 0
        );
      } else if (e.key === "Enter" && filtered[highlightIdx]) {
        e.preventDefault();
        filtered[highlightIdx].onSelect();
        onClose();
      }
    };
    window.addEventListener("keydown", onKeyDown);
    return () => window.removeEventListener("keydown", onKeyDown);
  }, [filtered, highlightIdx, onClose, open]);

  if (!open) return null;

  const getGroupIcon = (group: CommandItem["group"]) => {
    switch (group) {
      case "Actions":
        return <Mic className="w-3.5 h-3.5 text-[var(--parlo-primary)]" aria-hidden="true" />;
      case "Themes":
        return <Palette className="w-3.5 h-3.5 text-[var(--parlo-accent)]" aria-hidden="true" />;
      case "Languages":
        return <Globe className="w-3.5 h-3.5 text-[var(--parlo-primary)]" aria-hidden="true" />;
      case "Scenarios":
        return <Sparkles className="w-3.5 h-3.5 text-[var(--parlo-accent)]" aria-hidden="true" />;
      default:
        return <Compass className="w-3.5 h-3.5 text-[var(--parlo-ink-muted)]" aria-hidden="true" />;
    }
  };

  return (
    <div
      className="fixed inset-0 z-50 flex items-start justify-center pt-[12vh] px-4 bg-black/35"
      role="dialog"
      aria-modal="true"
      aria-label="Parlo Quick Command Palette"
      onMouseDown={(e) => {
        if (e.target === e.currentTarget) onClose();
      }}
    >
      <div className="w-full max-w-xl bg-[var(--parlo-surface-solid)]/95 backdrop-blur-xl border border-[var(--parlo-border)] rounded-2xl shadow-2xl overflow-hidden">
        {/* Search Input */}
        <div className="flex items-center gap-3 px-4 py-3.5 border-b border-[var(--parlo-border)]">
          <Search
            className="w-4 h-4 text-[var(--parlo-ink-muted)] shrink-0"
            aria-hidden="true"
          />
          <input
            ref={inputRef}
            type="text"
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder="Jump to a language, scenario, palette, or view..."
            aria-label="Search commands"
            className="flex-1 bg-transparent text-sm text-[var(--parlo-ink)] placeholder:text-[var(--parlo-ink-muted)] focus:outline-none"
          />
          <button
            type="button"
            onClick={onClose}
            aria-label="Close quick palette"
            className="p-1 text-[var(--parlo-ink-muted)] hover:text-[var(--parlo-ink)] rounded-md cursor-pointer"
          >
            <X className="w-4 h-4" aria-hidden="true" />
          </button>
        </div>

        {/* Results */}
        <div className="max-h-[360px] overflow-y-auto divide-y divide-[var(--parlo-border)]/50">
          {filtered.length === 0 ? (
            <div className="py-10 px-6 text-center text-sm text-[var(--parlo-ink-muted)]">
              No matching commands for “{query}”.
            </div>
          ) : (
            filtered.map((item, idx) => {
              const active = idx === highlightIdx;
              return (
                <button
                  key={item.id}
                  type="button"
                  onMouseEnter={() => setHighlightIdx(idx)}
                  onClick={() => {
                    item.onSelect();
                    onClose();
                  }}
                  className={`w-full text-left px-4 py-3 flex items-center justify-between gap-3 transition-colors cursor-pointer ${
                    active
                      ? "bg-[var(--parlo-primary-soft)]"
                      : "hover:bg-[var(--parlo-canvas)]/70"
                  }`}
                >
                  <div className="flex items-center gap-3 min-w-0">
                    <div className="w-7 h-7 rounded-lg bg-[var(--parlo-canvas)] border border-[var(--parlo-border)] flex items-center justify-center shrink-0">
                      {item.languageCode ? (
                        <LanguageFlagBadge code={item.languageCode} size="sm" />
                      ) : (
                        getGroupIcon(item.group)
                      )}
                    </div>
                    <div className="min-w-0">
                      <p className="text-sm font-medium text-[var(--parlo-ink)] truncate">
                        {item.label}
                      </p>
                      <p className="text-xs text-[var(--parlo-ink-muted)] truncate">
                        {item.subtitle}
                      </p>
                    </div>
                  </div>

                  <div className="flex items-center gap-2 shrink-0">
                    {item.swatches && (
                      <span className="inline-flex items-center -space-x-0.5" aria-hidden="true">
                        {item.swatches.map((hex) => (
                          <span
                            key={hex}
                            className="w-2.5 h-2.5 rounded-full border border-black/15"
                            style={{ backgroundColor: hex }}
                          />
                        ))}
                      </span>
                    )}
                    <span className="text-[11px] font-mono text-[var(--parlo-ink-muted)]">
                      {item.group}
                    </span>
                    {active && (
                      <ArrowRight
                        className="w-3.5 h-3.5 text-[var(--parlo-primary)]"
                        aria-hidden="true"
                      />
                    )}
                  </div>
                </button>
              );
            })
          )}
        </div>

        {/* Footer Hints */}
        <div className="px-4 py-2.5 bg-[var(--parlo-canvas)] border-t border-[var(--parlo-border)] flex items-center justify-between text-[11px] font-mono text-[var(--parlo-ink-muted)]">
          <span>↑↓ Navigate · Enter Select</span>
          <span>Esc Close</span>
        </div>
      </div>
    </div>
  );
}
