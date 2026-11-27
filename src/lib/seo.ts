import { AppView } from "../types";

export interface SeoSyncInput {
  activeView: AppView;
  languageName: string;
  cultureAtelier: string;
  scenarioTitle: string;
}

function upsertMeta(attr: "name" | "property", key: string, content: string) {
  let el = document.head.querySelector<HTMLMetaElement>(
    `meta[${attr}="${key}"]`
  );
  if (!el) {
    el = document.createElement("meta");
    el.setAttribute(attr, key);
    document.head.appendChild(el);
  }
  el.setAttribute("content", content);
}

function upsertCanonical(href: string) {
  let link = document.head.querySelector<HTMLLinkElement>(
    'link[rel="canonical"]'
  );
  if (!link) {
    link = document.createElement("link");
    link.setAttribute("rel", "canonical");
    document.head.appendChild(link);
  }
  link.setAttribute("href", href);
}

/**
 * Dynamically synchronizes document title, meta description, OpenGraph,
 * Twitter Card metadata, and canonical URL for the active studio view & language.
 */
export function syncDocumentSeo({
  activeView,
  languageName,
  cultureAtelier,
  scenarioTitle,
}: SeoSyncInput) {
  if (typeof document === "undefined" || typeof window === "undefined") return;

  const viewCopy: Record<AppView, { title: string; description: string }> = {
    studio: {
      title: `Parlo — Practice ${languageName} Voice Conversation Live`,
      description: `Speak ${languageName} live in "${scenarioTitle}" with real-time voice replies, instant grammar notes, and ${cultureAtelier} atmosphere.`,
    },
    spatial: {
      title: `Parlo 3D Stage — Immersive ${languageName} Voice Studio`,
      description: `Enter Parlo's interactive 3D voice stage to rehearse ${languageName} conversations with spatial acoustic resonance and real-time coaching.`,
    },
    scenarios: {
      title: `Parlo Scenarios — Real-World ${languageName} Roleplay`,
      description: `Browse curated café, travel, culture, and custom ${languageName} roleplay scenarios calibrated for CEFR A1 to C1 speaking fluency.`,
    },
    phrasebook: {
      title: `Parlo Phrasebook — ${languageName} Idioms & Flashcards`,
      description: `Review saved ${languageName} expressions with interactive flashcards, native audio playback, pronunciation readings, and mastery tracking.`,
    },
    review: {
      title: `Parlo Review — ${languageName} Speaking Analytics & Debrief`,
      description: `Track daily streaks, weekly speaking goals, and CEFR coaching debriefs across your live ${languageName} practice sessions.`,
    },
    pricing: {
      title: `Parlo Plans & Pricing — Voice Language Learning Studio`,
      description: `Compare Starter, Fluency Pro, Studio Max, and Teams plans for unlimited real-time voice practice, coaching debriefs, and custom scenarios.`,
    },
  };

  const { title, description } = viewCopy[activeView];
  const canonicalUrl = `${window.location.origin}${window.location.pathname}`;

  document.title = title;
  upsertMeta("name", "description", description);
  upsertMeta("property", "og:title", title);
  upsertMeta("property", "og:description", description);
  upsertMeta("property", "og:url", canonicalUrl);
  upsertMeta("name", "twitter:title", title);
  upsertMeta("name", "twitter:description", description);
  upsertCanonical(canonicalUrl);
}
