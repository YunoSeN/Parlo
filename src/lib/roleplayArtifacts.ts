export interface RoleplayArtifactItem {
  id: string;
  title: string;
  reading?: string;
  detail: string;
  meta: string;
  speakPrompt: string;
}

export interface RoleplayArtifact {
  id: string;
  scenarioIds: string[];
  kind: "menu" | "board" | "reading-list" | "brief" | "lease" | "guide";
  headerKicker: string;
  title: string;
  subtitle: string;
  footerNote: string;
  items: RoleplayArtifactItem[];
}

const SCENARIO_ARTIFACTS: Record<string, RoleplayArtifact> = {
  "madrid-cafe": {
    id: "artifact-madrid-cafe",
    scenarioIds: ["madrid-cafe"],
    kind: "menu",
    headerKicker: "Café Lavapiés · Carta de Mañana",
    title: "Barra & Horno del Día",
    subtitle: "Reference real menu items while ordering with Mateo.",
    footerNote: "Leche de avena, soja o sin lactosa sin suplemento · Servicio en barra o terraza.",
    items: [
      {
        id: "cafe-cortado",
        title: "Café cortado de especialidad",
        detail: "Espresso doble con un toque de leche vaporizada",
        meta: "€2.40",
        speakPrompt: "Buenos días, ¿me pones un café cortado con leche de avena, por favor?",
      },
      {
        id: "tostada-tomate",
        title: "Tostada de pan de masa madre",
        detail: "Tomate rallado natural y aceite de oliva virgen extra",
        meta: "€3.60",
        speakPrompt: "¿La tostada con tomate lleva aceite de oliva virgen extra?",
      },
      {
        id: "bizcocho-limon",
        title: "Bizcocho casero de limón y romero",
        detail: "Recién horneado esta mañana a las 08:00",
        meta: "€3.20",
        speakPrompt: "Ese bizcocho de limón tiene muy buena pinta, me llevo un trozo.",
      },
      {
        id: "zumo-naranja",
        title: "Zumo de naranja recién exprimido",
        detail: "Naranjas de Valencia · vaso grande",
        meta: "€3.80",
        speakPrompt: "¿El zumo de naranja es recién exprimido? Quiero uno también.",
      },
    ],
  },
  "tokyo-counter": {
    id: "artifact-tokyo-counter",
    scenarioIds: ["tokyo-counter"],
    kind: "board",
    headerKicker: "下北沢カウンター · 今夜のお品書き",
    title: "Tonight's Wooden Counter Board",
    subtitle: "Ask Kenji about seasonal specials, ingredients, or pairings.",
    footerNote: "お通し付き · 食物アレルギーがあればお気軽にお伝えください。",
    items: [
      {
        id: "yuzu-shio",
        title: "柚子塩ラーメン",
        reading: "Yuzu Shio Rāmen",
        detail: "Clear dashi broth with fragrant Kochi yuzu peel & tender chicken",
        meta: "¥1,180",
        speakPrompt: "すみません、柚子塩ラーメンのスープはあっさりしていますか？",
      },
      {
        id: "agedashi-tofu",
        title: "季節野菜の揚げ出し豆腐",
        reading: "Kisetsu yasai no agedashi dōfu",
        detail: "Crisp silk tofu with autumn mushrooms in warm ginger broth",
        meta: "¥720",
        speakPrompt: "季節野菜の揚げ出し豆腐を一つお願いします。",
      },
      {
        id: "saba-shioyaki",
        title: "炭火焼き塩サバ",
        reading: "Sumibiyaki shio-saba",
        detail: "Charcoal-grilled mackerel with grated daikon & sudachi citrus",
        meta: "¥960",
        speakPrompt: "炭火焼き塩サバは今日のおすすめですか？",
      },
      {
        id: "hojicha-warm",
        title: "京都産 焙じ茶（温）",
        reading: "Kyōto-san Hōjicha (Atatakai)",
        detail: "Slow-roasted Kyoto green tea with toasted nutty aroma",
        meta: "¥450",
        speakPrompt: "飲み物は温かい焙じ茶をいただけますか？",
      },
    ],
  },
  "paris-bookshop": {
    id: "artifact-paris-bookshop",
    scenarioIds: ["paris-bookshop"],
    kind: "reading-list",
    headerKicker: "Librairie Rive Gauche · Coups de Cœur",
    title: "Claire's Staff Picks Shelf",
    subtitle: "Compare genres, ask about themes, or choose a gift edition.",
    footerNote: "Emballage cadeau en papier kraft offert · Dédicaces le jeudi soir.",
    items: [
      {
        id: "roman-nuit",
        title: "Les Lumières de la Seine",
        detail: "Roman contemporain · atmosphère poétique et lente à Paris",
        meta: "€19.50",
        speakPrompt: "J'aime beaucoup les romans avec une belle atmosphère : celui-ci est-il plutôt lent ou rythmé ?",
      },
      {
        id: "essai-villes",
        title: "Habiter le silence",
        detail: "Essai littéraire sur l'architecture, les cafés et la mémoire urbaine",
        meta: "€16.00",
        speakPrompt: "Est-ce que cet essai sur les villes conviendrait comme cadeau pour un ami ?",
      },
      {
        id: "polar-lyon",
        title: "Dernier train pour Lyon",
        detail: "Roman policier psychologique · intrigue serrée en huis clos",
        meta: "€14.90",
        speakPrompt: "Si je cherche quelque chose de plus haletant, vous me conseillez ce polar ?",
      },
      {
        id: "edition-poche",
        title: "Carnet de poésie de poche",
        detail: "Édition reliée en lin · anthologie bilingue illustrée",
        meta: "€12.50",
        speakPrompt: "Est-ce que vous pourriez emballer ce petit recueil pour offrir ?",
      },
    ],
  },
  "berlin-studio": {
    id: "artifact-berlin-studio",
    scenarioIds: ["berlin-studio"],
    kind: "brief",
    headerKicker: "Berlin Studio · Sprint 14 Sync Brief",
    title: "Milestone & Trade-Off Sheet",
    subtitle: "Reference deliverables and dates while negotiating with Lukas.",
    footerNote: "Nächstes Stakeholder-Review: Donnerstag, 15:00 Uhr · Raum Mitte.",
    items: [
      {
        id: "proto-v2",
        title: "Interaktiver Navigations-Prototyp",
        detail: "Status: 85% fertig · Mobile Gesten brauchen noch Feinschliff",
        meta: "Fällig: Mi",
        speakPrompt: "Beim Navigations-Prototyp sind wir fast durch, aber die mobilen Gesten brauchen noch einen Tag.",
      },
      {
        id: "a11y-audit",
        title: "Barrierefreiheits- & Kontrastprüfung",
        detail: "WCAG-AA Prüfung für Dark- und Light-Mode noch offen",
        meta: "Priorität: Hoch",
        speakPrompt: "Ich würde vorschlagen, die Kontrastprüfung heute vorzuziehen.",
      },
      {
        id: "copy-review",
        title: "Onboarding-Texte & Mikro-Copy",
        detail: "Wartet auf finales Feedback aus dem Produktteam",
        meta: "Blocker",
        speakPrompt: "Wäre es möglich, die finalen Onboarding-Texte auf nächste Woche zu verschieben?",
      },
    ],
  },
  "milan-apartment": {
    id: "artifact-milan-apartment",
    scenarioIds: ["milan-apartment"],
    kind: "lease",
    headerKicker: "Quartiere Brera · Scheda Immobile",
    title: "Bilocale Luminoso — Via Solferino",
    subtitle: "Clarify utilities, transit, and move-in dates with Sofia.",
    footerNote: "Contratto transitorio 12–18 mesi · Metro M2 Moscova a 4 minuti a piedi.",
    items: [
      {
        id: "canone-mensile",
        title: "Canone mensile + Spese condominiali",
        detail: "€1.450/mese · €180 spese (riscaldamento centralizzato incluso)",
        meta: "€1.630 tot.",
        speakPrompt: "Le spese condominiali includono già il riscaldamento e l'acqua?",
      },
      {
        id: "deposito-cauzionale",
        title: "Deposito cauzionale & Disponibilità",
        detail: "2 mensilità di caparra · Libero dal 1° del mese prossimo",
        meta: "2 mesi",
        speakPrompt: "Sarebbe possibile entrare verso la metà del mese prossimo?",
      },
      {
        id: "esposizione-cortile",
        title: "Terzo piano con balcone interno",
        detail: "Affaccio su cortile silenzioso · Fibra ottica 1 Gbps attiva",
        meta: "62 m²",
        speakPrompt: "Il cortile interno è abbastanza tranquillo la sera e nei fine settimana?",
      },
    ],
  },
};

export function getRoleplayArtifact(
  scenarioId: string,
  languageCode: string,
  scenarioTitle: string
): RoleplayArtifact {
  const exact = SCENARIO_ARTIFACTS[scenarioId];
  if (exact) return exact;

  // Fallback by active language for custom/open scenarios
  const langFallbackMap: Record<string, string> = {
    es: "madrid-cafe",
    ja: "tokyo-counter",
    fr: "paris-bookshop",
    de: "berlin-studio",
    it: "milan-apartment",
  };
  const fallbackKey = langFallbackMap[languageCode];
  if (fallbackKey && SCENARIO_ARTIFACTS[fallbackKey]) {
    return {
      ...SCENARIO_ARTIFACTS[fallbackKey],
      subtitle: `Local cultural reference card adapted for “${scenarioTitle}”.`,
    };
  }

  return {
    id: `artifact-generic-${languageCode}`,
    scenarioIds: [scenarioId],
    kind: "guide",
    headerKicker: "Parlo Field Card · Conversation Anchors",
    title: scenarioTitle,
    subtitle: "Use these concrete conversation pivots to keep dialogue flowing naturally.",
    footerNote: "Tap any prompt to hear it aloud or prefill your live response.",
    items: [
      {
        id: "anchor-1",
        title: "Ask for a local recommendation",
        detail: "Invite your partner to share their favorite personal choice",
        meta: "Opening",
        speakPrompt: "What would you personally recommend here if it were your first visit?",
      },
      {
        id: "anchor-2",
        title: "Share a preference & follow up",
        detail: "Compare two options and explain what matters most to you",
        meta: "Deepen",
        speakPrompt: "I usually prefer something calm and local—how does this compare?",
      },
      {
        id: "anchor-3",
        title: "Close warmly like a regular",
        detail: "Thank your partner and mention returning soon",
        meta: "Closing",
        speakPrompt: "Thank you so much for your help—I will definitely come back soon.",
      },
    ],
  };
}
