import { CefrLevel } from "../types";

export interface DailyCulturalMission {
  id: string;
  dateKey: string;
  languageCode: string;
  title: string;
  prompt: string;
  scenarioId: string;
  targetTurns: number;
  culturalTip: string;
  starterLine: string;
}

interface MissionTemplate {
  title: string;
  prompt: string;
  scenarioId: string;
  preferredLanguages?: string[];
  culturalTip: string;
  starters: Record<string, string>;
}

const MISSION_TEMPLATES: MissionTemplate[] = [
  {
    title: "Order with a Specific Twist",
    prompt:
      "Ask for a local drink with one milk or ice preference and ask what just came fresh out of the oven.",
    scenarioId: "madrid-cafe",
    preferredLanguages: ["es"],
    culturalTip:
      "Use soft framing ('Could I have...' / 'Whenever you have a moment') to sound warmly local.",
    starters: {
      es: "Buenos días, ¿me pones un cortado con leche de avena?",
      fr: "Bonjour, je prendrais un café crème avec du lait d'avoine, s'il vous plaît.",
      ja: "おはようございます。オーツミルクのラテを一ついただけますか？",
      de: "Guten Morgen, ich hätte gern einen Cappuccino mit Hafermilch.",
      it: "Buongiorno, mi fa un macchiato con latte d'avena?",
      zh: "你好，请问可以来一杯燕麦拿铁吗？",
      ko: "안녕하세요, 오트밀크 라떼 한 잔 부탁드려요.",
      pt: "Bom dia, podia fazer um café com leite de aveia, por favor?",
    },
  },
  {
    title: "Ask the Chef for Tonight's Secret",
    prompt:
      "Sit at the counter, ask which seasonal dish is best tonight, and mention one flavor you love.",
    scenarioId: "tokyo-counter",
    preferredLanguages: ["ja"],
    culturalTip:
      "Complimenting aroma or freshness right after the chef explains a dish builds immediate rapport.",
    starters: {
      es: "Buenas noches, ¿qué plato de temporada me recomiendas hoy?",
      fr: "Bonsoir, quel est le plat de saison que vous préférez ce soir ?",
      ja: "こんばんは。今夜一番おすすめの季節料理は何ですか？",
      de: "Guten Abend, welches Saisongericht empfehlen Sie heute Abend?",
      it: "Buonasera, qual è il piatto di stagione che consiglia stasera?",
      zh: "晚上好，请问今晚最推荐哪一道时令菜？",
      ko: "안녕하세요, 오늘 제철 메뉴 중에 가장 추천하시는 요리가 있나요?",
      pt: "Boa noite, qual é o prato da estação que você mais recomenda hoje?",
    },
  },
  {
    title: "Compare Two Books & Pick a Gift",
    prompt:
      "Describe a mood or genre you enjoy, compare two recommendations, and pick one for a close friend.",
    scenarioId: "paris-bookshop",
    preferredLanguages: ["fr"],
    culturalTip:
      "Bridge comparisons with contrast connectors ('however', 'on the other hand') to sound effortlessly natural.",
    starters: {
      es: "Busco una novela con buena atmósfera para regalar a un amigo.",
      fr: "Bonjour, je cherche un roman immersif pour offrir à un ami.",
      ja: "友人に贈る、雰囲気のある現代小説を探しています。",
      de: "Hallo, ich suche einen atmosphärischen Roman als Geschenk.",
      it: "Buongiorno, cerco un romanzo coinvolgente da regalare a un amico.",
      zh: "你好，我想找一本氛围感很强的小说送给朋友。",
      ko: "안녕하세요, 친구에게 선물할 분위기 있는 소설을 찾고 있어요.",
      pt: "Olá, estou procurando um romance envolvente para dar de presente.",
    },
  },
  {
    title: "Spin a Record & Order Pour-Over",
    prompt:
      "Order a hot or iced drink at the vinyl counter and ask Minji about the album playing right now.",
    scenarioId: "seoul-cafe",
    preferredLanguages: ["ko"],
    culturalTip:
      "Commenting on the music or cozy atmosphere is the easiest ice-breaker in neighborhood cafés.",
    starters: {
      es: "Qué buena música suena hoy, ¿de quién es este disco?",
      fr: "J'adore ce morceau qui passe, c'est quel album ?",
      ja: "今流れている曲、素敵ですね。誰のアルバムですか？",
      de: "Die Musik hier ist super — welches Album läuft gerade?",
      it: "Che bella musica che c'è oggi, di chi è questo disco?",
      zh: "现在放的这首歌真好听，是哪位歌手的专辑？",
      ko: "안녕하세요, 지금 나오는 LP 너무 좋네요. 누구 앨범이에요?",
      pt: "Adorei a música que está tocando, de quem é esse disco?",
    },
  },
  {
    title: "Rainy Evening Tea Tasting",
    prompt:
      "Step in from a light drizzle, share whether you like floral or roasted tea, and pick a snack pairing.",
    scenarioId: "taipei-teahouse",
    preferredLanguages: ["zh"],
    culturalTip:
      "Describing texture and aroma ('light', 'toasty', 'floral') unlocks rich everyday vocabulary fast.",
    starters: {
      es: "Con esta lluvia apetece un té calentito, ¿cuál me recomiendas?",
      fr: "Avec cette petite pluie, j'ai envie d'un thé chaud — vous conseillez lequel ?",
      ja: "少し肌寒いので、温かいお茶のおすすめを教えていただけますか？",
      de: "Bei dem Regen hätte ich Lust auf einen warmen Tee — was empfiehlst du?",
      it: "Con questa pioggerella ci vuole un tè caldo, cosa mi consigli?",
      zh: "你好，外面在下小雨，可以推荐一款清香一点的热乌龙茶吗？",
      ko: "비도 오고 해서 따뜻한 차 한 잔 마시고 싶은데 추천해 주실 수 있나요?",
      pt: "Com essa chuvinha deu vontade de um chá quente — qual você recomenda?",
    },
  },
  {
    title: "Warm Morning Padaria Ritual",
    prompt:
      "Ask Rafael what just came warm out of the oven, order your morning coffee, and chat like a regular.",
    scenarioId: "lisbon-bakery",
    preferredLanguages: ["pt"],
    culturalTip:
      "Warm neighborhood greetings plus a quick compliment about fresh pastries feel authentically local.",
    starters: {
      es: "¡Buenos días! ¿Qué acaba de salir calentito del horno?",
      fr: "Bonjour ! Qu'est-ce qui vient juste de sortir tout chaud du four ?",
      ja: "おはようございます！今ちょうど焼き上がったパンはありますか？",
      de: "Guten Morgen! Was kommt denn gerade frisch aus dem Ofen?",
      it: "Buongiorno! Cosa è appena uscito caldo dal forno?",
      zh: "早上好！请问刚出炉的点心有哪些？",
      ko: "안녕하세요! 방금 오븐에서 갓 나온 빵이 있나요?",
      pt: "Bom dia! O pão de queijo ou o pastel de nata acabou de sair do forno?",
    },
  },
  {
    title: "Negotiate a Timeline Diplomatically",
    prompt:
      "Give a crisp status update, flag one realistic constraint, and propose a clean trade-off.",
    scenarioId: "berlin-studio",
    preferredLanguages: ["de"],
    culturalTip:
      "Pairing a constraint immediately with a concrete alternative sounds calm and confident in every language.",
    starters: {
      es: "Vamos bien de tiempo, aunque una parte necesita un día más.",
      fr: "On avance bien, mais un point mériterait un jour supplémentaire.",
      ja: "順調に進んでいますが、一点だけ日程の調整を相談できますか？",
      de: "Wir liegen gut im Plan, aber ein Punkt braucht noch einen Tag Puffer.",
      it: "Procediamo bene, ma un dettaglio richiederebbe un giorno in più.",
      zh: "整体进度不错，但有一个细节想商量顺延一天。",
      ko: "전반적으로 순조로운데 한 부분만 하루 정도 여유가 필요할 것 같아요.",
      pt: "Estamos no prazo, mas um detalhe precisaria de mais um dia.",
    },
  },
  {
    title: "Tour a Neighborhood Apartment",
    prompt:
      "Ask what utilities are included, check evening quietness, and propose your ideal move-in date.",
    scenarioId: "milan-apartment",
    preferredLanguages: ["it"],
    culturalTip:
      "Asking about transit and evening atmosphere shows genuine local curiosity beyond the rent number.",
    starters: {
      es: "¿Los gastos de comunidad están incluidos en el alquiler mensual?",
      fr: "Les charges et le chauffage sont-ils compris dans le loyer ?",
      ja: "管理費や光熱費は毎月の家賃に含まれていますか？",
      de: "Sind die Nebenkosten und Heizung in der Warmmiete enthalten?",
      it: "Le spese condominiali e il riscaldamento sono inclusi nell'affitto?",
      zh: "请问物业费和暖气费都包含在月租里吗？",
      ko: "관리비랑 난방비가 월세에 포함되어 있나요?",
      pt: "As despesas do condomínio já estão incluídas no aluguel?",
    },
  },
];

export function getTodayDateKey(): string {
  const now = new Date();
  const y = now.getFullYear();
  const m = String(now.getMonth() + 1).padStart(2, "0");
  const d = String(now.getDate()).padStart(2, "0");
  return `${y}-${m}-${d}`;
}

export function getDailyCulturalMission(
  languageCode: string,
  level: CefrLevel
): DailyCulturalMission {
  const dateKey = getTodayDateKey();
  let hash = 0;
  const seed = `${dateKey}:${languageCode}`;
  for (let i = 0; i < seed.length; i += 1) {
    hash = (hash * 31 + seed.charCodeAt(i)) >>> 0;
  }
  // Surface the language's signature cultural scene on alternating days, rotating across all 8 rituals
  const nativeIdx = MISSION_TEMPLATES.findIndex((t) =>
    t.preferredLanguages?.includes(languageCode)
  );
  const template =
    nativeIdx >= 0 && hash % 2 === 0
      ? MISSION_TEMPLATES[nativeIdx]
      : MISSION_TEMPLATES[hash % MISSION_TEMPLATES.length];

  const targetTurns =
    level === "A1" ? 2 : level === "A2" ? 3 : level === "B1" ? 4 : 5;

  return {
    id: `${dateKey}:${languageCode}`,
    dateKey,
    languageCode,
    title: template.title,
    prompt: template.prompt,
    scenarioId: template.scenarioId,
    targetTurns,
    culturalTip: template.culturalTip,
    starterLine: template.starters[languageCode] ?? template.starters.es,
  };
}

/**
 * Verifies that a completed session genuinely satisfies today's daily ritual
 * (active language match, minimum turn count, and either matching mission
 * scenario or accomplishing at least one scenario milestone).
 */
export function didSessionCompleteDailyMission(params: {
  mission: DailyCulturalMission;
  sessionLanguageCode: string;
  sessionScenarioId: string;
  userTurnsCount: number;
  goalsCompleted: number;
}): boolean {
  if (params.sessionLanguageCode !== params.mission.languageCode) {
    return false;
  }
  if (params.userTurnsCount < params.mission.targetTurns) {
    return false;
  }
  return (
    params.sessionScenarioId === params.mission.scenarioId ||
    params.goalsCompleted >= 1
  );
}
