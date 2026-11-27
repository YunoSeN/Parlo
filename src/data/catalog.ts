import { LanguageOption, Scenario, VoicePersona } from '../types';
import madridCafeImg from '../assets/images/scenario_cafe_madrid_1795088840066.jpg';
import tokyoCounterImg from '../assets/images/scenario_tokyo_counter_1795088841647.jpg';
import parisBookshopImg from '../assets/images/scenario_paris_bookshop_1795088841684.jpg';
import berlinStudioImg from '../assets/images/scenario_berlin_studio_1795088841576.jpg';
import seoulCafeImg from '../assets/images/scenario_seoul_cafe_1795740488383.jpg';
import taipeiTeahouseImg from '../assets/images/scenario_taipei_teahouse_1795740489239.jpg';
import lisbonBakeryImg from '../assets/images/scenario_lisbon_bakery_1795740491214.jpg';
import milanBreraImg from '../assets/images/scenario_milan_brera_1795740490736.jpg';

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
  A1: 'Beginner — short warm phrases, gentle bilingual rescue',
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
    durationLabel: '3–5 min',
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
      it: [
        { text: 'Buongiorno, mi fa un macchiato con latte d’avena?', meaning: 'Good morning, could you make me a macchiato with oat milk?' },
      ],
      zh: [
        { text: '早上好，可以来一杯燕麦拿铁吗？', reading: 'Zǎoshang hǎo, kěyǐ lái yì bēi yànmài nátiě ma?', meaning: 'Good morning, could I get an oat milk latte?' },
      ],
      ko: [
        { text: '안녕하세요, 오트밀크 라떼 한 잔 부탁드려요.', reading: 'Annyeonghaseyo, oteumilkeu ratte han jan butakdeuryeoyo.', meaning: 'Hello, one oat milk latte please.' },
      ],
      pt: [
        { text: 'Bom dia, queria um café com leite de aveia, por favor.', meaning: 'Good morning, I would like a coffee with oat milk, please.' },
      ],
    },
  },
  {
    id: 'tokyo-counter',
    title: 'Evening Counter in Shimokitazawa',
    city: 'Tokyo',
    category: 'Dining',
    durationLabel: '5–7 min',
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
    durationLabel: '5–8 min',
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
    id: 'seoul-cafe',
    title: 'Late-Afternoon Vinyl Café in Seongsu',
    city: 'Seoul',
    category: 'Culture',
    durationLabel: '3–5 min',
    defaultLanguageCode: 'ko',
    recommendedLevel: 'A2',
    partnerName: 'Minji',
    partnerRole: 'Vinyl Café Host & Barista',
    defaultVoice: 'Kore',
    imageUrl: seoulCafeImg,
    fallbackGradient: 'from-amber-950 via-stone-800 to-slate-950',
    summary:
      'Order a hand-drip coffee or iced americano, ask what Korean vinyl record is spinning, and chat about favorite music and cafés.',
    promptContext:
      'You are Minji, the warm host and barista of an intimate vinyl listening café in Seongsu-dong, Seoul. Greet the guest, recommend a hand-drip coffee or seasonal ade, talk briefly about the vinyl album currently playing, and ask what music or neighborhood spots they enjoy.',
    goals: [
      'Greet Minji and order a drink with ice or warmth preference',
      'Ask about the album currently playing on the turntable',
      'Share a music genre or café mood you enjoy',
    ],
    starterPhrases: {
      ko: [
        { text: '안녕하세요, 아이스 아메리카노 한 잔 주세요.', reading: 'Annyeonghaseyo, aiseu amerikano han jan juseyo.', meaning: 'Hello, one iced Americano please.' },
        { text: '지금 나오는 노래 정말 좋네요. 누구 앨범이에요?', reading: 'Jigeum naoneun norae jeongmal jonneyo. Nugu aelbeomieyo?', meaning: 'The song playing right now is really nice. Whose album is it?' },
        { text: '저는 잔잔한 인디 음악 듣는 걸 좋아해요.', reading: 'Jeoneun janjanhan indi eumak deutneun geol joahaeyo.', meaning: 'I love listening to calm indie music.' },
      ],
    },
  },
  {
    id: 'taipei-teahouse',
    title: 'Lantern Tea Counter in Dadaocheng',
    city: 'Taipei',
    category: 'Dining',
    durationLabel: '3–5 min',
    defaultLanguageCode: 'zh',
    recommendedLevel: 'A2',
    partnerName: 'Wei-Lin',
    partnerRole: 'Tea Master & Host',
    defaultVoice: 'Zephyr',
    imageUrl: taipeiTeahouseImg,
    fallbackGradient: 'from-amber-950 via-stone-900 to-zinc-950',
    summary:
      'Step out of a light evening drizzle, sample fragrant high-mountain oolong tea, and chat about tea flavors and favorite street snacks.',
    promptContext:
      'You are Wei-Lin, a warm and unhurried tea host at a wooden tea counter in Dadaocheng, Taipei. Welcome the guest out of the light rain, introduce two oolong or roasted teas, ask whether they prefer floral or toasty flavors, and chat briefly about tea snacks or evening plans.',
    goals: [
      'Greet Wei-Lin and ask for a tea recommendation',
      'Share whether you prefer floral, light, or roasted flavors',
      'Ask about a paired tea snack and thank the host warmly',
    ],
    starterPhrases: {
      zh: [
        { text: '你好，外面在下小雨，可以推荐一款热茶吗？', reading: 'Nǐ hǎo, wàimiàn zài xià xiǎoyǔ, kěyǐ tuījiàn yì kuǎn rè chá ma?', meaning: 'Hello, it is drizzling outside—could you recommend a warm tea?' },
        { text: '我比较喜欢带一点花香、口感清爽的茶。', reading: 'Wǒ bǐjiào xǐhuan dài yìdiǎn huāxiāng, kǒugǎn qīngshuǎng de chá.', meaning: 'I prefer tea with a light floral aroma and a crisp finish.' },
        { text: '这款乌龙茶很香，配什么点心最合适？', reading: 'Zhè kuǎn wūlóngchá hěn xiāng, pèi shénme diǎnxin zuì héshì?', meaning: 'This oolong tea smells wonderful—what snack pairs best with it?' },
      ],
    },
  },
  {
    id: 'lisbon-bakery',
    title: 'Morning Padaria & Espresso Counter',
    city: 'Lisbon & São Paulo',
    category: 'Everyday',
    durationLabel: '3–5 min',
    defaultLanguageCode: 'pt',
    recommendedLevel: 'A2',
    partnerName: 'Rafael',
    partnerRole: 'Neighborhood Baker & Barista',
    defaultVoice: 'Puck',
    imageUrl: lisbonBakeryImg,
    fallbackGradient: 'from-sky-950 via-slate-800 to-stone-900',
    summary:
      'Stop by a sunny corner padaria, ask for warm pastries fresh from the oven, order your morning coffee, and chat like a local regular.',
    promptContext:
      'You are Rafael, an upbeat, warm neighborhood baker and barista at a sunlit corner padaria. Welcome the guest, tell them that warm pastel de nata and pão de queijo just came out of the oven, take their coffee order, and make cheerful small talk about the morning.',
    goals: [
      'Greet Rafael and ask what just came warm out of the oven',
      'Order a coffee and one pastry for here or to go',
      'Make brief friendly small talk and ask for the bill',
    ],
    starterPhrases: {
      pt: [
        { text: 'Bom dia! O pão de queijo acabou de sair do forno?', meaning: 'Good morning! Did the cheese bread just come out of the oven?' },
        { text: 'Queria um café pingado e um pastel de nata, por favor.', meaning: 'I would like a coffee with a dash of milk and a custard tart, please.' },
        { text: 'Está uma delícia. Pode trazer a conta quando puder?', meaning: 'It is delicious. Could you bring the bill whenever you can?' },
      ],
    },
  },
  {
    id: 'berlin-studio',
    title: 'Design Critique & Project Sync',
    city: 'Berlin',
    category: 'Workplace',
    durationLabel: '8–10 min',
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
    durationLabel: '6–8 min',
    defaultLanguageCode: 'it',
    recommendedLevel: 'B1',
    partnerName: 'Sofia',
    partnerRole: 'Apartment Host',
    defaultVoice: 'Kore',
    imageUrl: milanBreraImg,
    fallbackGradient: 'from-slate-700 via-blue-950 to-slate-900',
    summary:
      'Tour a sunlit furnished apartment in Brera, clarify monthly utilities and transit links, and negotiate a flexible move-in date.',
    promptContext:
      'You are Sofia, showing a sunlit two-room apartment in Brera, Milan to a prospective tenant. Describe the neighborhood, answer questions about rent, utilities, heating, and internet, and ask about the tenant’s plans and preferred move-in date.',
    goals: [
      'Ask about monthly utilities and what is included in the rent',
      'Inquire about neighborhood noise and public transit',
      'Propose a move-in date and ask about the deposit process',
    ],
    starterPhrases: {
      it: [
        { text: 'Le spese condominiali sono incluse nell’affitto?', meaning: 'Are building maintenance fees included in the rent?' },
        { text: 'Com’è la zona la sera? È abbastanza tranquilla?', meaning: 'What is the neighborhood like in the evening? Is it fairly quiet?' },
        { text: 'Sarebbe possibile entrare verso la metà del mese prossimo?', meaning: 'Would it be possible to move in around the middle of next month?' },
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
    recommendedLevel: 'B1',
    partnerName: 'Elena',
    partnerRole: 'Conversation Partner',
    defaultVoice: 'Zephyr',
    imageUrl: berlinStudioImg,
    fallbackGradient: 'from-blue-950 via-slate-800 to-slate-950',
    summary:
      'Speak freely about your day, travel, books, cinema, or weekend ideas with a responsive partner who keeps the dialogue flowing naturally.',
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
      de: [
        { text: 'Diese Woche habe ich einen richtig guten Film gesehen.', meaning: 'This week I watched a really great film.' },
      ],
      it: [
        { text: 'Ultimamente ho voglia di organizzare un piccolo viaggio nel fine settimana.', meaning: 'Lately I feel like planning a short weekend trip.' },
      ],
      zh: [
        { text: '这周我一直在想周末去哪里放松一下。', reading: 'Zhè zhōu wǒ yìzhí zài xiǎng zhōumò qù nǎlǐ fàngsōng yíxià.', meaning: 'This week I have been wondering where to unwind this weekend.' },
      ],
      ko: [
        { text: '요즘 주말에 가볼 만한 조용한 동네를 찾고 있어요.', reading: 'Yojeum jumare gabol manhan joyonghan dongnereul chatgo isseoyo.', meaning: 'Lately I am looking for a quiet neighborhood to visit on the weekend.' },
      ],
      pt: [
        { text: 'Esta semana comecei um livro novo e estou adorando.', meaning: 'This week I started a new book and I am loving it.' },
      ],
    },
  },
];

export function getLanguageByCode(code: string): LanguageOption {
  return LANGUAGES.find((l) => l.code === code) ?? LANGUAGES[0];
}
