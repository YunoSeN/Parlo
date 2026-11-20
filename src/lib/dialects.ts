export interface RegionalDialectOption {
  id: string;
  languageCode: string;
  label: string;
  regionTag: string;
  speechStyleDirective: string;
  signatureExpression: string;
  signatureMeaning: string;
}

export const REGIONAL_DIALECTS: Record<string, RegionalDialectOption[]> = {
  es: [
    {
      id: "es-madrid",
      languageCode: "es",
      label: "Madrid",
      regionTag: "Castilian · Spain",
      speechStyleDirective:
        "Use natural Peninsular Spanish as spoken in Madrid (vosotros when plural, local terms like 'vale', 'genial', 'un café con leche', 'la cuenta').",
      signatureExpression: "¡Qué planazo, vale!",
      signatureMeaning: "What a great plan, sounds good!",
    },
    {
      id: "es-cdmx",
      languageCode: "es",
      label: "Mexico City",
      regionTag: "CDMX · Mexico",
      speechStyleDirective:
        "Use warm, natural Mexican Spanish as spoken in Mexico City (ustedes for plural, polite diminutives like 'ahorita', 'un cafecito', '¿qué onda?', 'con mucho gusto').",
      signatureExpression: "¿Me regalas un cafecito, porfa?",
      signatureMeaning: "Could I get a quick coffee, please?",
    },
  ],
  fr: [
    {
      id: "fr-paris",
      languageCode: "fr",
      label: "Paris",
      regionTag: "Île-de-France",
      speechStyleDirective:
        "Use crisp, contemporary Parisian French with natural spoken rhythm ('du coup', 'carrément', 'l'addition s'il vous plaît', polished vouvoiement with strangers).",
      signatureExpression: "C'est vraiment chouette ici.",
      signatureMeaning: "It's really lovely here.",
    },
    {
      id: "fr-montreal",
      languageCode: "fr",
      label: "Montréal",
      regionTag: "Québec · Canada",
      speechStyleDirective:
        "Use friendly, warm Québécois French as spoken in Montréal (accessible phrasing like 'bienvenue', 'c'est ben correct', 'un p'tit café', 'bonne journée là'). Keep idioms clear for learners.",
      signatureExpression: "C'est ben correct, merci beaucoup !",
      signatureMeaning: "That's totally fine, thank you so much!",
    },
  ],
  ja: [
    {
      id: "ja-tokyo",
      languageCode: "ja",
      label: "Tokyo",
      regionTag: "Standard Hyōjungo",
      speechStyleDirective:
        "Use natural Standard Tokyo Japanese (polite desu/masu in hospitality settings, crisp modern everyday cadence).",
      signatureExpression: "こちらこそ、よろしくお願いします。",
      signatureMeaning: "Likewise, pleasure speaking with you.",
    },
    {
      id: "ja-kansai",
      languageCode: "ja",
      label: "Kansai",
      regionTag: "Osaka & Kyoto",
      speechStyleDirective:
        "Use warm, approachable Kansai-flavored Japanese (gentle expressions like 'おおきに', 'めっちゃ美味しい', '〜やねん' kept clear and learner-friendly alongside polite forms).",
      signatureExpression: "めっちゃ美味しいですね、おおきに！",
      signatureMeaning: "That's super delicious, thank you!",
    },
  ],
  de: [
    {
      id: "de-berlin",
      languageCode: "de",
      label: "Berlin",
      regionTag: "Northern & Studio German",
      speechStyleDirective:
        "Use direct, modern Standard German as spoken in Berlin creative studios ('passt super', 'alles klar', 'gerne', crisp pragmatic tone).",
      signatureExpression: "Passt super, machen wir so.",
      signatureMeaning: "Works great, let's do that.",
    },
    {
      id: "de-vienna",
      languageCode: "de",
      label: "Vienna",
      regionTag: "Austrian · Wien",
      speechStyleDirective:
        "Use warm Viennese Austrian German ('Grüß Gott', 'Melange', 'Schmankerl', 'passt eh', polite coffeehouse charm while keeping grammar clear).",
      signatureExpression: "Grüß Gott, eine Melange bitte.",
      signatureMeaning: "Hello, one Viennese coffee please.",
    },
  ],
  it: [
    {
      id: "it-milan",
      languageCode: "it",
      label: "Milan",
      regionTag: "Lombardy · North",
      speechStyleDirective:
        "Use polished, contemporary Northern Italian as spoken in Milan ('aperitivo', 'perfetto', 'ci sta', clear modern phrasing).",
      signatureExpression: "Ci sta, facciamo così allora.",
      signatureMeaning: "Sounds good, let's go with that.",
    },
    {
      id: "it-rome",
      languageCode: "it",
      label: "Rome",
      regionTag: "Lazio · Central",
      speechStyleDirective:
        "Use expressive, warm Roman-flavored Italian ('daje', 'che bello', 'dimmi tutto', lively hospitality while keeping vocabulary clear for learners).",
      signatureExpression: "Dimmi tutto, come ti sembra?",
      signatureMeaning: "Tell me everything, how does it look to you?",
    },
  ],
  zh: [
    {
      id: "zh-beijing",
      languageCode: "zh",
      label: "Beijing",
      regionTag: "Northern Mandarin",
      speechStyleDirective:
        "Use clear Standard Northern Mandarin with light Beijing warmth ('没问题', '挺好的', '您这边请').",
      signatureExpression: "挺好的，就这么定了。",
      signatureMeaning: "Sounds great, let's settle on that.",
    },
    {
      id: "zh-taipei",
      languageCode: "zh",
      label: "Taipei",
      regionTag: "Taiwan Mandarin",
      speechStyleDirective:
        "Use gentle, polite Taipei Mandarin ('不好意思', '真的假的', '辛苦了', soft sentence-final particles like '喔' and '呢').",
      signatureExpression: "不好意思，请问这个怎么点呢？",
      signatureMeaning: "Excuse me, how do I order this?",
    },
  ],
  ko: [
    {
      id: "ko-seoul",
      languageCode: "ko",
      label: "Seoul",
      regionTag: "Standard Gyeonggi",
      speechStyleDirective:
        "Use natural Standard Seoul Korean (warm 해요체 polite endings, modern Seongsu/Hongdae conversational nuance).",
      signatureExpression: "여기 분위기 정말 좋네요.",
      signatureMeaning: "The atmosphere here is really lovely.",
    },
    {
      id: "ko-busan",
      languageCode: "ko",
      label: "Busan",
      regionTag: "Coastal Gyeongsang",
      speechStyleDirective:
        "Use friendly, warm Busan-flavored polite Korean with gentle coastal warmth while remaining easy for learners to understand.",
      signatureExpression: "오늘 바다 바람이 참 좋네요.",
      signatureMeaning: "The sea breeze feels really nice today.",
    },
  ],
  pt: [
    {
      id: "pt-lisbon",
      languageCode: "pt",
      label: "Lisbon",
      regionTag: "European Portuguese",
      speechStyleDirective:
        "Use authentic European Portuguese as spoken in Lisbon ('uma bica', 'está bem', 'com certeza', 'faça favor', 'fixe').",
      signatureExpression: "Queria uma bica e um pastel, se faz favor.",
      signatureMeaning: "I'd like an espresso and a pastry, please.",
    },
    {
      id: "pt-saopaulo",
      languageCode: "pt",
      label: "São Paulo",
      regionTag: "Brazilian Portuguese",
      speechStyleDirective:
        "Use warm, natural Brazilian Portuguese as spoken in São Paulo ('tudo bem?', 'pode deixar', 'um cafezinho', 'imagina!').",
      signatureExpression: "Pode deixar, tudo certinho!",
      signatureMeaning: "Leave it to me, all set!",
    },
  ],
};

export function getDialectsForLanguage(
  languageCode: string
): RegionalDialectOption[] {
  return REGIONAL_DIALECTS[languageCode] ?? REGIONAL_DIALECTS.es;
}

export function getDialectById(
  languageCode: string,
  dialectId?: string
): RegionalDialectOption {
  const list = getDialectsForLanguage(languageCode);
  return list.find((d) => d.id === dialectId) ?? list[0];
}
