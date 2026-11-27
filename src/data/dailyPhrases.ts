export interface DailyWarmupPhrase {
  phrase: string;
  reading?: string;
  translation: string;
  usageNote: string;
}

const PHRASES_BY_LANGUAGE: Record<string, DailyWarmupPhrase[]> = {
  es: [
    {
      phrase: "Por cierto, ¿me recomiendas algo de la casa?",
      translation: "By the way, do you recommend a house specialty?",
      usageNote: "Natural connector ('por cierto') to pivot smoothly in conversation.",
    },
    {
      phrase: "A ver si te entiendo bien...",
      translation: "Let's see if I'm understanding you right...",
      usageNote: "Buys natural thinking time while sounding genuinely engaged.",
    },
    {
      phrase: "Me viene genial, muchas gracias.",
      translation: "That works wonderfully for me, thank you so much.",
      usageNote: "Warm idiomatic alternative to a textbook 'está bien'.",
    },
    {
      phrase: "Qué buena pinta tiene esto.",
      translation: "This looks amazing / delicious.",
      usageNote: "Everyday Spanish compliment for food, pastries, or even a weekend plan.",
    },
    {
      phrase: "Me da igual, elige tú lo que te apetezca.",
      translation: "Either works for me—pick whatever you feel like.",
      usageNote: "Relaxed local phrasing ('te apetezca') used constantly with friends.",
    },
    {
      phrase: "¿Cómo se dice esto de forma más natural?",
      translation: "How do you say this more naturally?",
      usageNote: "Great casual hobbyist rescue line when learning in real dialogue.",
    },
    {
      phrase: "Con este tiempo solo apetece un café calentito.",
      translation: "With this weather, all you want is a warm coffee.",
      usageNote: "Effortless small-talk opener at any neighborhood counter.",
    },
  ],
  fr: [
    {
      phrase: "À vrai dire, je cherche quelque chose d'un peu plus léger.",
      translation: "To tell the truth, I'm looking for something a bit lighter.",
      usageNote: "Polite conversational softener used constantly in cafés and shops.",
    },
    {
      phrase: "Si je ne me trompe pas, c'est juste au bout de la rue.",
      translation: "If I'm not mistaken, it's right at the end of the street.",
      usageNote: "Classic French nuance phrase for checking assumptions politely.",
    },
    {
      phrase: "Ça me ferait vraiment plaisir.",
      translation: "That would really make me happy / I'd love that.",
      usageNote: "Expressive, natural way to accept an offer or suggestion.",
    },
    {
      phrase: "Du coup, on se retrouve plutôt vers midi ?",
      translation: "So, shall we meet around noon instead?",
      usageNote: "'Du coup' is the ubiquitous everyday spoken French connector.",
    },
    {
      phrase: "C'est exactement l'ambiance que je cherchais.",
      translation: "That's the exact vibe I was looking for.",
      usageNote: "Works for books, cafés, films, and neighborhoods alike.",
    },
    {
      phrase: "Ça marche, on fait comme ça !",
      translation: "Sounds good, let's do that!",
      usageNote: "Warm, natural everyday agreement ('ça marche').",
    },
    {
      phrase: "Tu me conseilles quoi si je viens pour la première fois ?",
      translation: "What do you recommend if it's my first time here?",
      usageNote: "Invites lively personal opinions from locals.",
    },
  ],
  ja: [
    {
      phrase: "おすすめのメニューはありますか？",
      reading: "Osusume no menyū wa arimasu ka?",
      translation: "Do you have any menu recommendations?",
      usageNote: "Polite everyday opener for counters, cafés, and izakaya.",
    },
    {
      phrase: "なるほど、そういうことですね。",
      reading: "Naruhodo, sō iu koto desu ne.",
      translation: "I see, so that's how it is.",
      usageNote: "Essential active-listening backchannel (aizuchi) that sounds fluent.",
    },
    {
      phrase: "少し考えてもいいですか？",
      reading: "Sukoshi kangaete mo ii desu ka?",
      translation: "May I take a moment to think about it?",
      usageNote: "Graceful way to pause and gather your thoughts in Japanese.",
    },
    {
      phrase: "すごく落ち着く雰囲気ですね。",
      reading: "Sugoku ochitsuku fun'iki desu ne.",
      translation: "This place has such a relaxing atmosphere.",
      usageNote: "Warm compliment for cafés, bookshops, and quiet bars.",
    },
    {
      phrase: "もう一回ゆっくり言ってもらえますか？",
      reading: "Mō ikkai yukkuri itte moraemasu ka?",
      translation: "Could you say that once more slowly?",
      usageNote: "Friendly, natural safety-net phrase for live conversations.",
    },
    {
      phrase: "それ、前から気になっていたんです。",
      reading: "Sore, mae kara ki ni natte ita n desu.",
      translation: "I've been curious about that for a while.",
      usageNote: "Natural way to show enthusiasm about a dish, movie, or place.",
    },
    {
      phrase: "また近いうちに来ますね。",
      reading: "Mata chikai uchi ni kimasu ne.",
      translation: "I'll definitely come back again soon.",
      usageNote: "Leaves a warm regular's impression when saying goodbye.",
    },
  ],
  de: [
    {
      phrase: "Ehrlich gesagt klingt das nach einem richtig guten Plan.",
      translation: "Honestly, that sounds like a really good plan.",
      usageNote: "Natural conversational opener ('ehrlich gesagt') for warm agreement.",
    },
    {
      phrase: "Könnten Sie mir kurz weiterhelfen?",
      translation: "Could you quickly help me out?",
      usageNote: "Polite subjunctive ('könnten') ideal for studios, transit, and shops.",
    },
    {
      phrase: "Darauf bin ich gar nicht gekommen.",
      translation: "I hadn't even thought of that.",
      usageNote: "Expressive reaction that keeps collaborative discussions flowing.",
    },
    {
      phrase: "Das kommt ganz drauf an, wie das Wetter wird.",
      translation: "That really depends on how the weather turns out.",
      usageNote: "Natural spoken contraction ('drauf' instead of 'darauf').",
    },
    {
      phrase: "Ich probiere heute mal was Neues aus.",
      translation: "I'm going to try something new today.",
      usageNote: "Uses modal particle 'mal' to sound relaxed and native.",
    },
    {
      phrase: "Passt dir das zeitlich gut?",
      translation: "Does that timing work well for you?",
      usageNote: "Concise everyday phrasing for making casual plans.",
    },
    {
      phrase: "Ich mag die entspannte Stimmung hier.",
      translation: "I really like the relaxed vibe here.",
      usageNote: "Great conversation bridge at cafés, galleries, or parks.",
    },
  ],
  it: [
    {
      phrase: "A dire il vero, non l'ho ancora provato.",
      translation: "To tell the truth, I haven't tried it yet.",
      usageNote: "Idiomatic lead-in that adds natural Italian cadence.",
    },
    {
      phrase: "Per me va benissimo, facciamo così.",
      translation: "That works great for me, let's do that.",
      usageNote: "Warm, decisive phrase for agreeing on plans.",
    },
    {
      phrase: "Mi potresti consigliare qualcosa di tipico?",
      translation: "Could you recommend something local/typical for me?",
      usageNote: "Friendly conditional request for dining or travel conversations.",
    },
    {
      phrase: "Che bella atmosfera che c'è qui!",
      translation: "What a lovely atmosphere there is here!",
      usageNote: "Expressive exclamation that immediately warms up small talk.",
    },
    {
      phrase: "Aspetta un attimo, ci penso su.",
      translation: "Hold on a second, let me think about it.",
      usageNote: "Natural conversational filler that buys thinking time gracefully.",
    },
    {
      phrase: "Non vedo l'ora di tornarci.",
      translation: "I can't wait to go back there.",
      usageNote: "Classic Italian idiom ('non vedere l'ora') for excitement.",
    },
    {
      phrase: "Mi piace tantissimo questo quartiere la sera.",
      translation: "I love this neighborhood in the evening.",
      usageNote: "Ideal for chatting about Milan, Rome, or local walks.",
    },
  ],
  pt: [
    {
      phrase: "Na verdade, estou praticando para falar com mais calma.",
      translation: "Actually, I'm practicing to speak more calmly.",
      usageNote: "Natural conversational bridge ('na verdade') used daily.",
    },
    {
      phrase: "Faz todo sentido, obrigado por explicar.",
      translation: "That makes complete sense, thanks for explaining.",
      usageNote: "Confident follow-up that shows comprehension in dialogue.",
    },
    {
      phrase: "Que tal combinarmos para o fim da tarde?",
      translation: "How about we plan for late afternoon?",
      usageNote: "Effortless Brazilian & European Portuguese suggestion pattern.",
    },
    {
      phrase: "Nossa, que cheiro maravilhoso de café fresco!",
      translation: "Wow, what a wonderful smell of fresh coffee!",
      usageNote: "Warm, lively opening at any corner padaria.",
    },
    {
      phrase: "Se puder, fala um pouquinho mais devagar?",
      translation: "If you can, could you speak a tiny bit slower?",
      usageNote: "Friendly diminutive ('pouquinho') keeps requests super polite.",
    },
    {
      phrase: "Estou adorando conhecer esse bairro.",
      translation: "I'm loving getting to know this neighborhood.",
      usageNote: "Great casual small-talk anchor while traveling or exploring.",
    },
    {
      phrase: "Com certeza volto aqui na semana que vem.",
      translation: "I'm definitely coming back here next week.",
      usageNote: "'Com certeza' sounds much more natural than a stiff 'sim'.",
    },
  ],
  ko: [
    {
      phrase: "혹시 추천해 주실 만한 게 있을까요?",
      reading: "Hoksi chucheonhae jusil manhan ge isseulkkayo?",
      translation: "By any chance, is there something you'd recommend?",
      usageNote: "Softened polite request using '혹시' and '-(으)ㄹ까요?'.",
    },
    {
      phrase: "아, 그런 뜻이었군요!",
      reading: "A, geureon tteusieotgunyo!",
      translation: "Oh, that's what it meant!",
      usageNote: "Natural realization ending ('-군요') for lively conversations.",
    },
    {
      phrase: "천천히 다시 한 번 말씀해 주시겠어요?",
      reading: "Cheoncheonhi dasi han beon malsseumhae jusigesseoyo?",
      translation: "Could you please say that one more time slowly?",
      usageNote: "Respectful way to ask your partner to repeat clearly.",
    },
    {
      phrase: "여기 분위기 진짜 좋네요!",
      reading: "Yeogi bunwigi jinjja jonneyo!",
      translation: "The vibe here is genuinely awesome!",
      usageNote: "Natural exclamation ('-네요') for cafés, restaurants, and music.",
    },
    {
      phrase: "요즘 날씨 진짜 딱 좋은 것 같아요.",
      reading: "Yojeum nalssi jinjja ttak joeun geot gatayo.",
      translation: "The weather lately feels just right.",
      usageNote: "Soft opinion framing ('-것 같아요') sounds authentically Korean.",
    },
    {
      phrase: "따뜻한 걸로 할지 아이스로 할지 고민돼요.",
      reading: "Ttatteuthan geollo halji aiseuro halji gomindwaeyo.",
      translation: "I can't decide whether to get it hot or iced.",
      usageNote: "Relatable café line using '고민되다' (torn between choices).",
    },
    {
      phrase: "다음에 친구랑 같이 또 올게요.",
      reading: "Daeume chingurang gachi tto olgeyo.",
      translation: "I'll come again with a friend next time.",
      usageNote: "Warm promise ending ('-(으)ㄹ게요') when wrapping up.",
    },
  ],
  zh: [
    {
      phrase: "说实话，我一直想试试这个。",
      reading: "Shuō shíhuà, wǒ yīzhí xiǎng shìshi zhège.",
      translation: "To be honest, I've been wanting to try this.",
      usageNote: "Smooth spoken opener ('说实话') common in casual dialogue.",
    },
    {
      phrase: "原来是这样，我现在明白了。",
      reading: "Yuánlái shì zhèyàng, wǒ xiànzài míngbai le.",
      translation: "So that's how it is—now I understand.",
      usageNote: "Natural way to acknowledge an explanation smoothly.",
    },
    {
      phrase: "你觉得哪一个更合适？",
      reading: "Nǐ juéde nǎ yī gè gèng héshì?",
      translation: "Which one do you think fits better?",
      usageNote: "Great open-ended follow-up to invite your partner to elaborate.",
    },
    {
      phrase: "这里的气氛特别舒服。",
      reading: "Zhèlǐ de qìfēn tèbié shūfu.",
      translation: "The atmosphere here feels super cozy.",
      usageNote: "'特别舒服' is a warm, everyday compliment for tea houses and cafés.",
    },
    {
      phrase: "不好意思，可以再慢一点说吗？",
      reading: "Bù hǎoyìsi, kěyǐ zài màn yìdiǎn shuō ma?",
      translation: "Sorry, could you say that a bit more slowly?",
      usageNote: "Polite softener ('不好意思') makes asking for a repeat effortless.",
    },
    {
      phrase: "我平时比较喜欢清淡一点的味道。",
      reading: "Wǒ píngshí bǐjiào xǐhuan qīngdàn yìdiǎn de wèidào.",
      translation: "I usually prefer lighter, milder flavors.",
      usageNote: "Super handy phrase for tea counters, noodles, and street food.",
    },
    {
      phrase: "下次路过我一定再来坐坐。",
      reading: "Xiàcì lùguò wǒ yídìng zài lái zuòzuo.",
      translation: "Next time I pass by, I'll definitely drop in again.",
      usageNote: "Verb reduplication ('坐坐') sounds warm, casual, and native.",
    },
  ],
};

export function getDailyWarmupPhrase(
  languageCode: string,
  dayOffset = 0
): DailyWarmupPhrase {
  const list = PHRASES_BY_LANGUAGE[languageCode] ?? PHRASES_BY_LANGUAGE.es;
  const now = new Date();
  const daySeed =
    now.getFullYear() * 366 + now.getMonth() * 31 + now.getDate() + dayOffset;
  const idx = ((daySeed % list.length) + list.length) % list.length;
  return list[idx];
}

export function getWarmupPhrasesForLanguage(
  languageCode: string
): DailyWarmupPhrase[] {
  return PHRASES_BY_LANGUAGE[languageCode] ?? PHRASES_BY_LANGUAGE.es;
}
