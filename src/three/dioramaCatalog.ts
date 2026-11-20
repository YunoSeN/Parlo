export interface SpatialPropEntry {
  id: string;
  label: string;
  category: string;
  position: [number, number, number];
  cameraOffset: [number, number, number];
  terms: Record<
    string,
    {
      term: string;
      reading?: string;
      meaning: string;
      samplePrompt: string;
    }
  >;
}

export const SPATIAL_PROPS: SpatialPropEntry[] = [
  {
    id: "espresso",
    label: "Espresso Cup & Saucer",
    category: "Beverage",
    position: [-1.15, 0, 0.55],
    cameraOffset: [-0.85, 1.35, 2.25],
    terms: {
      es: {
        term: "El café solo",
        meaning: "Single espresso",
        samplePrompt: "¿Me pones un café solo con un poco de leche tibia, por favor?",
      },
      fr: {
        term: "Un café allongé",
        meaning: "Long espresso",
        samplePrompt: "Bonjour, je prendrais un café allongé avec un verre d’eau.",
      },
      ja: {
        term: "エスプレッソ",
        reading: "Esupuresso",
        meaning: "Espresso",
        samplePrompt: "すみません、温かいエスプレッソを一ついただけますか？",
      },
      de: {
        term: "Der Espresso",
        meaning: "Espresso",
        samplePrompt: "Ich hätte gern einen doppelten Espresso und ein Glas Wasser.",
      },
      it: {
        term: "Un caffè macchiato",
        meaning: "Espresso with a touch of foam",
        samplePrompt: "Buongiorno, mi fa un caffè macchiato caldo al banco?",
      },
      zh: {
        term: "浓缩咖啡",
        reading: "Nóngsuō kāfēi",
        meaning: "Espresso",
        samplePrompt: "你好，请给我一杯热浓缩咖啡。",
      },
      ko: {
        term: "에스프레소",
        reading: "Eseupeureso",
        meaning: "Espresso",
        samplePrompt: "안녕하세요, 따뜻한 에스프레소 한 잔 주세요.",
      },
      pt: {
        term: "Um café expresso",
        meaning: "Espresso",
        samplePrompt: "Bom dia, pode me ver um café expresso curto, por favor?",
      },
    },
  },
  {
    id: "kettle",
    label: "Brass Pour-Over Kettle",
    category: "Brewing",
    position: [0.05, 0, -0.55],
    cameraOffset: [0.65, 1.55, 1.85],
    terms: {
      es: {
        term: "La tetera de cuello de cisne",
        meaning: "Gooseneck pour-over kettle",
        samplePrompt: "¿Qué café de filtro recomiendas hoy para preparar con calma?",
      },
      fr: {
        term: "La bouilloire à col de cygne",
        meaning: "Gooseneck kettle",
        samplePrompt: "Est-ce que vous proposez un café filtre de spécialité aujourd’hui ?",
      },
      ja: {
        term: "ドリップケトル",
        reading: "Dorippu ketoru",
        meaning: "Pour-over kettle",
        samplePrompt: "本日のハンドドリップはどの豆がおすすめですか？",
      },
      de: {
        term: "Die Schwanenhalskanne",
        meaning: "Gooseneck kettle",
        samplePrompt: "Welchen Filterkaffee brühen Sie heute frisch auf?",
      },
      it: {
        term: "Il bollitore a collo d’oca",
        meaning: "Gooseneck kettle",
        samplePrompt: "Avete anche un caffè filtro preparato al momento?",
      },
      zh: {
        term: "手冲咖啡壶",
        reading: "Shǒuchōng kāfēihú",
        meaning: "Pour-over kettle",
        samplePrompt: "请问今天手冲咖啡有什么单品豆推荐？",
      },
      ko: {
        term: "드립 포트",
        reading: "Deurip poteu",
        meaning: "Pour-over kettle",
        samplePrompt: "오늘 핸드드립으로 추천해주실 원두가 있나요?",
      },
      pt: {
        term: "A chaleira bico de ganso",
        meaning: "Gooseneck kettle",
        samplePrompt: "Qual café coado vocês estão servindo hoje?",
      },
    },
  },
  {
    id: "croissant",
    label: "Pastry Plate & Croissant",
    category: "Bakery",
    position: [1.22, 0, 0.58],
    cameraOffset: [1.55, 1.35, 2.3],
    terms: {
      es: {
        term: "El cruasán recién horneado",
        meaning: "Freshly baked croissant",
        samplePrompt: "¿Ese cruasán acaba de salir del horno? Me llevo uno.",
      },
      fr: {
        term: "Le croissant au beurre",
        meaning: "Butter croissant",
        samplePrompt: "Vos croissants au beurre sont encore chauds ? J’en prends un.",
      },
      ja: {
        term: "焼きたてのクロワッサン",
        reading: "Yakitate no kurowassan",
        meaning: "Freshly baked croissant",
        samplePrompt: "焼きたてのクロワッサンを一つ温めてもらえますか？",
      },
      de: {
        term: "Das Buttercroissant",
        meaning: "Butter croissant",
        samplePrompt: "Ist das Buttercroissant noch frisch aus dem Ofen?",
      },
      it: {
        term: "Il cornetto caldo",
        meaning: "Warm pastry croissant",
        samplePrompt: "Ha ancora un cornetto semplice appena sfornato?",
      },
      zh: {
        term: "现烤牛角包",
        reading: "Xiànkǎo niújiǎobāo",
        meaning: "Freshly baked croissant",
        samplePrompt: "这个牛角包是刚出炉的吗？请帮我拿一个。",
      },
      ko: {
        term: "갓 구운 크루아상",
        reading: "Gat guun keuruasang",
        meaning: "Freshly baked croissant",
        samplePrompt: "갓 구운 크루아상 하나 포장할 수 있을까요?",
      },
      pt: {
        term: "O croissant amanteigado",
        meaning: "Butter croissant",
        samplePrompt: "Esse croissant saiu do forno agora? Quero um para comer aqui.",
      },
    },
  },
  {
    id: "notebook",
    label: "Phrasebook & Fountain Pen",
    category: "Study",
    position: [-0.08, 0, 0.85],
    cameraOffset: [-0.05, 1.45, 2.55],
    terms: {
      es: {
        term: "El cuaderno de notas",
        meaning: "Notebook & study journal",
        samplePrompt: "Estoy anotando expresiones nuevas de esta ciudad; ¿tienes alguna favorita?",
      },
      fr: {
        term: "Le carnet de voyage",
        meaning: "Travel notebook",
        samplePrompt: "Je note les expressions locales dans mon carnet—comment dit-on cela naturellement ?",
      },
      ja: {
        term: "単語帳と万年筆",
        reading: "Tangochou to mannenhitsu",
        meaning: "Notebook & fountain pen",
        samplePrompt: "新しい表現をメモしているので、ゆっくり教えていただけますか？",
      },
      de: {
        term: "Das Notizbuch",
        meaning: "Notebook",
        samplePrompt: "Ich schreibe mir nützliche Redewendungen auf—welche benutzt man hier oft?",
      },
      it: {
        term: "Il taccuino",
        meaning: "Pocket notebook",
        samplePrompt: "Sto segnando le espressioni tipiche del posto sul mio taccuino.",
      },
      zh: {
        term: "笔记本和钢笔",
        reading: "Bǐjìběn hé gāngbǐ",
        meaning: "Notebook & fountain pen",
        samplePrompt: "我在记地道表达，这句话平时怎么说更自然？",
      },
      ko: {
        term: "단어장과 만년필",
        reading: "Daneojang-gwa mannyeonpil",
        meaning: "Vocabulary notebook & pen",
        samplePrompt: "자주 쓰는 표현을 적어 두고 있어요. 자연스럽게 말해 주실래요?",
      },
      pt: {
        term: "O caderno de anotações",
        meaning: "Study notebook",
        samplePrompt: "Estou anotando expressões do dia a dia—como vocês falam isso por aqui?",
      },
    },
  },
  {
    id: "lamp",
    label: "Brass Café Reading Lamp",
    category: "Atmosphere",
    position: [1.45, 0, -0.78],
    cameraOffset: [2.1, 1.75, 1.35],
    terms: {
      es: {
        term: "La lámpara de latón",
        meaning: "Brass reading lamp",
        samplePrompt: "Qué ambiente tan agradable tiene este rincón para leer y charlar.",
      },
      fr: {
        term: "La lampe en laiton",
        meaning: "Brass reading lamp",
        samplePrompt: "La lumière ici est très agréable pour travailler ou lire un roman.",
      },
      ja: {
        term: "真鍮のテーブルランプ",
        reading: "Shinchuu no teeburu ranpu",
        meaning: "Brass table lamp",
        samplePrompt: "このお店は照明が落ち着いていて、とても居心地がいいですね。",
      },
      de: {
        term: "Die Messinglampe",
        meaning: "Brass lamp",
        samplePrompt: "Die Atmosphäre und das warme Licht hier sind wirklich angenehm.",
      },
      it: {
        term: "La lampada in ottone",
        meaning: "Brass table lamp",
        samplePrompt: "Questo locale ha una luce bellissima, ideale per fare due chiacchiere.",
      },
      zh: {
        term: "黄铜台灯",
        reading: "Huángtóng táidēng",
        meaning: "Brass desk lamp",
        samplePrompt: "这里的灯光很柔和，很适合坐下来慢慢聊天。",
      },
      ko: {
        term: "황동 스탠드 조명",
        reading: "Hwangdong seutaendeu jomyeong",
        meaning: "Brass table lamp",
        samplePrompt: "여기 조명이 따뜻해서 대화하기 정말 좋네요.",
      },
      pt: {
        term: "A luminária de latão",
        meaning: "Brass reading lamp",
        samplePrompt: "Adorei a iluminação deste lugar, dá vontade de ficar conversando.",
      },
    },
  },
];

export function getPropLocalizedTerm(
  prop: SpatialPropEntry,
  languageCode: string
) {
  return prop.terms[languageCode] ?? prop.terms.es;
}
