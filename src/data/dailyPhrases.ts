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
