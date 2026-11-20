import { LanguageOption, Scenario, VoicePersona } from '../types';
import madridCafeImg from '../assets/images/scenario_cafe_madrid_1795088840066.jpg';
import tokyoCounterImg from '../assets/images/scenario_tokyo_counter_1795088841647.jpg';
import parisBookshopImg from '../assets/images/scenario_paris_bookshop_1795088841684.jpg';
import berlinStudioImg from '../assets/images/scenario_berlin_studio_1795088841576.jpg';

export const LANGUAGES: LanguageOption[] = [
  {
    code: 'es',
    speechLocale: 'es-ES',
    name: 'Spanish',
    nativeName: 'Español',
    regionHint: 'Spain & Latin America',
  },
  {
    code: 'fr',
    speechLocale: 'fr-FR',
    name: 'French',
    nativeName: 'Français',
    regionHint: 'Paris & Francophonie',
  },
  {
    code: 'ja',
    speechLocale: 'ja-JP',
    name: 'Japanese',
    nativeName: '日本語',
    regionHint: 'Tokyo standard',
    hasNonLatinScript: true,
  },
  {
    code: 'de',
    speechLocale: 'de-DE',
    name: 'German',
    nativeName: 'Deutsch',
    regionHint: 'Berlin & DACH',
  },
  {
    code: 'it',
    speechLocale: 'it-IT',
    name: 'Italian',
    nativeName: 'Italiano',
    regionHint: 'Milan & Rome',
  },
  {
    code: 'zh',
    speechLocale: 'zh-CN',
    name: 'Mandarin',
    nativeName: '普通话',
    regionHint: 'Standard Mandarin',
    hasNonLatinScript: true,
  },
  {
    code: 'ko',
    speechLocale: 'ko-KR',
    name: 'Korean',
    nativeName: '한국어',
    regionHint: 'Seoul standard',
    hasNonLatinScript: true,
  },
  {
    code: 'pt',
    speechLocale: 'pt-BR',
    name: 'Portuguese',
    nativeName: 'Português',
    regionHint: 'São Paulo & Lisbon',
  },
];

export const VOICE_PERSONAS: VoicePersona[] = [
  { id: 'Zephyr', label: 'Zephyr', tone: 'Warm & articulate' },
  { id: 'Kore', label: 'Kore', tone: 'Crisp & encouraging' },
  { id: 'Puck', label: 'Puck', tone: 'Lively & conversational' },
  { id: 'Charon', label: 'Charon', tone: 'Calm & measured' },
  { id: 'Fenrir', label: 'Fenrir', tone: 'Deep & steady' },
];

export const CEFR_DESCRIPTIONS: Record<string, string> = {
  A2: 'Elementary — clear everyday phrases, slower cadence',
  B1: 'Intermediate — connected daily topics, natural pace',
  B2: 'Upper Intermediate — nuanced opinions & idioms',
  C1: 'Advanced — fluent debate, subtle tone & register',
};

export const SCENARIOS: Scenario[] = [
  {
    id: 'madrid-cafe',
    title: 'Morning Counter at Café Lavapiés',
    city: 'Madrid',
    category: 'Everyday',
    durationLabel: '5 min',
    defaultLanguageCode: 'es',
    recommendedLevel: 'A2',
    partnerName: 'Mateo',
    partnerRole: 'Neighborhood Barista',
    defaultVoice: 'Puck',
    imageUrl: madridCafeImg,
    fallbackGradient: 'from-slate-800 via-slate-700 to-slate-900',
    summary:
      'Order coffee with a custom milk preference, ask what came fresh out of the oven, and make brief morning small talk.',
    promptContext:
      'You are Mateo, a friendly barista behind a busy neighborhood espresso bar in Madrid. Welcome the customer, ask what they would like to drink, suggest a fresh pastry, and chat briefly about the morning weather or neighborhood.',
    goals: [
      'Greet the barista naturally for the time of day',
      'Order a beverage with one specific customization',
      'Ask for a recommendation and request the check',
    ],
    starterPhrases: {
      es: [
        { text: 'Buenos días, ¿me pones un café con leche de avena?', meaning: 'Good morning, could I have a coffee with oat milk?' },
        { text: '¿Qué tenéis recién hecho hoy?', meaning: 'What do you have freshly baked today?' },
        { text: 'Cuando puedas, me cobras por favor.', meaning: 'Whenever you can, I would like to pay please.' },
      ],
      fr: [
        { text: 'Bonjour, je voudrais un café crème avec du lait d’avoine.', meaning: 'Hello, I would like a coffee with oat milk.' },
        { text: 'Qu’est-ce qui vient de sortir du four ?', meaning: 'What just came out of the oven?' },
      ],
      ja: [
        { text: 'おはようございます。ホットのラテを一つお願いします。', reading: 'Ohayou gozaimasu. Hotto no rate o hitotsu onegaishimasu.', meaning: 'Good morning. One hot latte, please.' },
      ],
      de: [
        { text: 'Guten Morgen, ich hätte gern einen Cappuccino mit Hafermilch.', meaning: 'Good morning, I would like a cappuccino with oat milk.' },
      ],
    },
  },
  {
    id: 'tokyo-counter',
    title: 'Evening Counter in Shimokitazawa',
    city: 'Tokyo',
    category: 'Dining',
    durationLabel: '7 min',
    defaultLanguageCode: 'ja',
    recommendedLevel: 'B1',
    partnerName: 'Kenji',
    partnerRole: 'Counter Chef & Owner',
    defaultVoice: 'Charon',
    imageUrl: tokyoCounterImg,
    fallbackGradient: 'from-stone-800 via-slate-800 to-zinc-900',
    summary:
      'Take a seat at an intimate wooden dining counter, ask about seasonal dishes and ingredients, and talk about your evening.',
    promptContext:
      'You are Kenji, the warm, observant owner-chef of a small counter eatery in Shimokitazawa, Tokyo. Greet the guest, explain two seasonal specials, check for any dietary preferences, and ask where they are visiting from or how their week is going.',
    goals: [
      'Ask for a seat at the counter and inquire about seasonal specials',
      'Mention a food preference or allergy clearly',
      'Compliment a dish and chat briefly with the chef',
    ],
    starterPhrases: {
      ja: [
        { text: 'こんばんは。カウンター席は空いていますか？', reading: 'Konbanwa. Kauntaa-seki wa aite imasu ka?', meaning: 'Good evening. Is there a seat available at the counter?' },
        { text: '今日のおすすめは何ですか？', reading: 'Kyou no osusume wa nan desu ka?', meaning: 'What is today’s recommendation?' },
        { text: 'とても美味しいです。何が入っていますか？', reading: 'Totemo oishii desu. Nani ga haitte imasu ka?', meaning: 'It’s delicious. What ingredients are in it?' },
      ],
      es: [
        { text: 'Buenas noches, ¿hay sitio en la barra?', meaning: 'Good evening, is there room at the counter?' },
      ],
    },
  },
  {
    id: 'paris-bookshop',
    title: 'Left Bank Bookshop Recommendation',
    city: 'Paris',
    category: 'Culture',
    durationLabel: '8 min',
    defaultLanguageCode: 'fr',
    recommendedLevel: 'B1',
    partnerName: 'Claire',
    partnerRole: 'Independent Bookseller',
    defaultVoice: 'Zephyr',
    imageUrl: parisBookshopImg,
    fallbackGradient: 'from-slate-700 via-slate-800 to-slate-950',
    summary:
      'Describe a book or film you recently loved, debate themes with the bookseller, and pick out a gift for a friend.',
    promptContext:
      'You are Claire, a thoughtful independent bookseller on the Left Bank in Paris. Help the visitor find a novel or essay collection by asking what moods, authors, or themes they enjoy, and share a brief opinion on contemporary literature.',
    goals: [
      'Describe a genre or theme you have been enjoying recently',
      'Ask for two contrasting recommendations and compare them',
      'Explain why one book fits you or a friend better',
    ],
    starterPhrases: {
      fr: [
        { text: 'Bonjour, je cherche un roman contemporain assez immersif.', meaning: 'Hello, I am looking for a fairly immersive contemporary novel.' },
        { text: 'J’ai beaucoup aimé l’atmosphère, mais moins la fin.', meaning: 'I really liked the atmosphere, though less so the ending.' },
        { text: 'C’est pour offrir à un ami qui adore l’histoire.', meaning: 'It’s a gift for a friend who loves history.' },
      ],
    },
  },
  {
    id: 'berlin-studio',
    title: 'Design Critique & Project Sync',
    city: 'Berlin',
    category: 'Workplace',
    durationLabel: '10 min',
    defaultLanguageCode: 'de',
    recommendedLevel: 'B2',
    partnerName: 'Lukas',
    partnerRole: 'Lead Product Architect',
    defaultVoice: 'Fenrir',
    imageUrl: berlinStudioImg,
    fallbackGradient: 'from-slate-800 via-zinc-800 to-slate-950',
    summary:
      'Walk a colleague through a project milestone, negotiate a realistic timeline, and respond diplomatically to constructive feedback.',
    promptContext:
      'You are Lukas, a pragmatic and collaborative design lead in a Berlin studio. You are meeting a teammate for a weekly project sync. Ask for an update on their current deliverable, raise one polite concern about the upcoming deadline, and collaborate on a trade-off.',
    goals: [
      'Summarize recent progress concisely and clearly',
      'Address a scheduling constraint with a concrete proposal',
      'Agree on next steps and clarify responsibilities',
    ],
    starterPhrases: {
      de: [
        { text: 'Wir liegen beim Prototyp gut im Zeitplan, aber ein Punkt braucht noch Abstimmung.', meaning: 'We are on schedule with the prototype, though one point needs alignment.' },
        { text: 'Wäre es möglich, diesen Teil auf nächste Woche zu verschieben?', meaning: 'Would it be possible to move this part to next week?' },
        { text: 'Lass uns die Prioritäten kurz festhalten.', meaning: 'Let us briefly lock in the priorities.' },
      ],
    },
  },
  {
    id: 'milan-apartment',
    title: 'Viewing a Bright Flat in Brera',
    city: 'Milan',
    category: 'Housing',
    durationLabel: '8 min',
    defaultLanguageCode: 'it',
    recommendedLevel: 'B1',
    partnerName: 'Sofia',
    partnerRole: 'Apartment Host',
    defaultVoice: 'Kore',
    imageUrl: parisBookshopImg,
    fallbackGradient: 'from-slate-700 via-blue-950 to-slate-900',
    summary:
      'Tour a furnished apartment, clarify monthly utilities and transit links, and negotiate a flexible move-in date.',
    promptContext:
      'You are Sofia, showing a sunlit two-room apartment in Milan to a prospective tenant. Describe the neighborhood, answer questions about rent, utilities, heating, and internet, and ask about the tenant’s plans and preferred move-in date.',
    goals: [
      'Ask about monthly utilities and what is included in the rent',
      'Inquire about neighborhood noise and public transit',
      'Propose a move-in date and ask about the deposit process',
    ],
    starterPhrases: {
      it: [
        { text: 'Le spese condominiali sono incluse nell’affitto?', meaning: 'Are building maintenance fees included in the rent?' },
        { text: 'Com’è la zona la sera? È abbastanza tranquilla?', meaning: 'What is the neighborhood like in the evening? Is it fairly quiet?' },
      ],
    },
  },
  {
    id: 'open-conversation',
    title: 'Unscripted Free Conversation',
    city: 'Open Studio',
    category: 'Fluency',
    durationLabel: 'Flexible',
    defaultLanguageCode: 'es',
    recommendedLevel: 'B2',
    partnerName: 'Elena',
    partnerRole: 'Conversation Partner',
    defaultVoice: 'Zephyr',
    imageUrl: berlinStudioImg,
    fallbackGradient: 'from-blue-950 via-slate-800 to-slate-950',
    summary:
      'Speak freely about your day, travel, books, work, or current ideas with a responsive partner who keeps the dialogue flowing naturally.',
    promptContext:
      'You are Elena, an engaging, curious native conversation partner. Have a natural, unscripted dialogue on whatever topic the learner brings up. Ask thoughtful follow-up questions and keep turns concise so the learner speaks at least half the time.',
    goals: [
      'Introduce a topic from your week or an interest you care about',
      'Ask your partner a follow-up question in return',
      'Express an opinion with a brief reason or example',
    ],
    starterPhrases: {
      es: [
        { text: 'Esta semana estuve pensando en cambiar mi rutina diaria.', meaning: 'This week I have been thinking about changing my daily routine.' },
      ],
      fr: [
        { text: 'Dernièrement, j’essaie de trouver un meilleur équilibre au quotidien.', meaning: 'Lately, I have been trying to find a better everyday balance.' },
      ],
      ja: [
        { text: '最近、新しい趣味を始めようと思っています。', reading: 'Saikin, atarashii shumi o hajimeyou to omotte imasu.', meaning: 'Lately, I have been thinking of starting a new hobby.' },
      ],
    },
  },
];

export function getLanguageByCode(code: string): LanguageOption {
  return LANGUAGES.find((l) => l.code === code) ?? LANGUAGES[0];
}
