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
  "seoul-cafe": {
    id: "artifact-seoul-cafe",
    scenarioIds: ["seoul-cafe"],
    kind: "menu",
    headerKicker: "성수 바이닐 카페 · 오늘의 메뉴 & LP",
    title: "Seongsu Pour-Over & Vinyl Shelf",
    subtitle: "Order drinks and ask Minji about the records spinning today.",
    footerNote: "디카페인·오트밀크 변경 가능 · 신청곡은 카운터에 편하게 말씀해 주세요.",
    items: [
      {
        id: "seoul-handdrip",
        title: "에티오피아 예가체프 핸드드립",
        reading: "Etiopia Yegachepeu Haendeudeurip",
        detail: "Floral jasmine aroma with bright citrus notes · Hot or Iced",
        meta: "₩6,500",
        speakPrompt: "안녕하세요, 에티오피아 핸드드립 아이스로 한 잔 부탁드려요.",
      },
      {
        id: "seoul-yuja-ade",
        title: "고흥 수제 유자 에이드",
        reading: "Goheung Suje Yuja Eideu",
        detail: "Sparkling house-made citron ade with fresh rosemary sprig",
        meta: "₩6,000",
        speakPrompt: "수제 유자 에이드는 많이 달지 않나요?",
      },
      {
        id: "seoul-financier",
        title: "솔티드 버터 휘낭시에",
        reading: "Soltideu Beoteo Hwinangsie",
        detail: "Warm crisp-edged brown butter financier baked at 3 PM",
        meta: "₩3,800",
        speakPrompt: "방금 구운 휘낭시에 하나도 같이 주문할게요.",
      },
      {
        id: "seoul-lp-pick",
        title: "오늘의 추천 LP · 90년대 시티팝 & 인디",
        reading: "Oneurui Chucheon LP",
        detail: "Ask Minji about the artist currently spinning on the tube amp",
        meta: "Now Playing",
        speakPrompt: "지금 틀어 주신 LP 분위기가 너무 좋은데, 어떤 가수 앨범이에요?",
      },
    ],
  },
  "taipei-teahouse": {
    id: "artifact-taipei-teahouse",
    scenarioIds: ["taipei-teahouse"],
    kind: "menu",
    headerKicker: "大稻埕茶室 · 今日茶單",
    title: "Dadaocheng Seasonal Tea List",
    subtitle: "Explore oolong aromas and tea snacks at Wei-Lin's counter.",
    footerNote: "每壺可回沖三至四次 · 歡迎告知偏好的茶湯濃淡。",
    items: [
      {
        id: "alishan-oolong",
        title: "阿里山高山金萱烏龍",
        reading: "Ālǐshān Gāoshān Jīnxuān Wūlóng",
        detail: "High-mountain oolong with creamy floral fragrance and clean sweet finish",
        meta: "NT$240",
        speakPrompt: "我想试试阿里山金萱乌龙，喝起来会不会很清爽？",
      },
      {
        id: "muzha-tieguanyin",
        title: "木柵炭焙鐵觀音",
        reading: "Mùzhà Tànbèi Tiěguānyīn",
        detail: "Slow charcoal-roasted oolong with warm nutty caramel notes",
        meta: "NT$260",
        speakPrompt: "如果喜欢焙火香气重一点的，推荐木栅铁观音吗？",
      },
      {
        id: "mungbean-cake",
        title: "手工桂花綠豆糕",
        reading: "Shǒugōng Guìhuā Lǜdòugāo",
        detail: "Melt-in-the-mouth osmanthus mung bean tea pastries (3 pieces)",
        meta: "NT$120",
        speakPrompt: "可以再来一份桂花绿豆糕配茶吗？",
      },
      {
        id: "pineapple-cake",
        title: "微酸土鳳梨酥",
        reading: "Wēisuān Tǔ Fènglísū",
        detail: "Warm flaky butter pastry filled with tangy native pineapple jam",
        meta: "NT$110",
        speakPrompt: "这个土凤梨酥甜度高吗？我想点一个尝尝。",
      },
    ],
  },
  "lisbon-bakery": {
    id: "artifact-lisbon-bakery",
    scenarioIds: ["lisbon-bakery"],
    kind: "menu",
    headerKicker: "Padaria da Esquina · Fornada da Manhã",
    title: "Warm Oven & Espresso Counter",
    subtitle: "Order fresh pastries and coffee with Rafael like a morning regular.",
    footerNote: "Leite de aveia disponível · Fornadas quentes a cada 30 minutos.",
    items: [
      {
        id: "pastel-nata",
        title: "Pastel de nata recém-saído do forno",
        detail: "Massa folhada estaladiça com creme morno e canela opcional",
        meta: "€1.40",
        speakPrompt: "Bom dia! Esse pastel de nata acabou de sair do forno? Quero um com canela.",
      },
      {
        id: "pao-queijo",
        title: "Pão de queijo mineiro quentinho",
        detail: "Crosta dourada e miolo macio com queijo curado da Serra",
        meta: "€2.20",
        speakPrompt: "Me vê dois pães de queijo quentinhos, por favor?",
      },
      {
        id: "cafe-pingado",
        title: "Café pingado / Galão cremoso",
        detail: "Expresso aromático com um toque de leite ou leite de aveia",
        meta: "€2.10",
        speakPrompt: "Para beber, queria um café pingado com leite de aveia, por favor.",
      },
      {
        id: "suco-laranja",
        title: "Sumo de laranja natural na hora",
        detail: "Laranjas doces espremidas no momento · sem gelo ou com gelo",
        meta: "€3.20",
        speakPrompt: "O sumo de laranja é natural? Pode ser sem gelo, por favor.",
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

  // Fallback by active language for custom/open scenarios across ALL 8 languages
  const langFallbackMap: Record<string, string> = {
    es: "madrid-cafe",
    ja: "tokyo-counter",
    fr: "paris-bookshop",
    de: "berlin-studio",
    it: "milan-apartment",
    ko: "seoul-cafe",
    zh: "taipei-teahouse",
    pt: "lisbon-bakery",
  };
  const fallbackKey = langFallbackMap[languageCode] ?? "madrid-cafe";
  const fallback = SCENARIO_ARTIFACTS[fallbackKey];
  return {
    ...fallback,
    id: `artifact-${fallbackKey}-${scenarioId}`,
    subtitle: `Local cultural reference card adapted for “${scenarioTitle}”.`,
  };
}
