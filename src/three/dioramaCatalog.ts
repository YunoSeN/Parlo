import { SpatialRoomId } from "../types";

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

export interface SpatialRoomSpec {
  id: SpatialRoomId;
  shortLabel: string;
  title: string;
  cityTag: string;
  subtitle: string;
  defaultCameraPos: [number, number, number];
  defaultTargetPos: [number, number, number];
  lampLightPos: [number, number, number];
  lampLightColor: number;
  lampLightIntensity: number;
  props: SpatialPropEntry[];
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

export const TOKYO_COUNTER_PROPS: SpatialPropEntry[] = [
  {
    id: "ramen-bowl",
    label: "Steaming Ramen Donburi",
    category: "Signature Dish",
    position: [-0.95, 0, 0.55],
    cameraOffset: [-0.7, 1.55, 2.35],
    terms: {
      ja: {
        term: "特製醤油ラーメン",
        reading: "Tokusei shouyu raamen",
        meaning: "Chef’s soy-broth ramen",
        samplePrompt: "すみません、特製醤油ラーメンを麺かためで一つお願いします。",
      },
      es: {
        term: "El bol de ramen caliente",
        meaning: "Steaming bowl of ramen",
        samplePrompt: "¿Cuál es el caldo más popular de la casa esta noche?",
      },
      fr: {
        term: "Le bol de ramen fumant",
        meaning: "Steaming ramen bowl",
        samplePrompt: "Bonsoir, quel bouillon conseillez-vous pour une première visite ?",
      },
      de: {
        term: "Die dampfende Ramen-Schale",
        meaning: "Steaming ramen bowl",
        samplePrompt: "Welche Brühe empfehlen Sie heute Abend besonders?",
      },
      it: {
        term: "La ciotola di ramen caldo",
        meaning: "Warm ramen bowl",
        samplePrompt: "Buonasera, quale brodo mi consiglia per questa sera?",
      },
      zh: {
        term: "招牌酱油拉面",
        reading: "Zhāopái jiàngyóu lāmiàn",
        meaning: "Signature soy ramen",
        samplePrompt: "你好，请给我一碗招牌酱油拉面，面条稍微硬一点。",
      },
      ko: {
        term: "특제 소유 라멘",
        reading: "Teukje soyu ramen",
        meaning: "House soy-broth ramen",
        samplePrompt: "특제 소유 라멘 한 그릇 부탁드려요, 면은 조금 단단하게 해주세요.",
      },
      pt: {
        term: "A tigela de lámen fumegante",
        meaning: "Steaming bowl of ramen",
        samplePrompt: "Boa noite, qual caldo da casa você recomenda hoje?",
      },
    },
  },
  {
    id: "tetsubin-tea",
    label: "Cast-Iron Tetsubin & Cup",
    category: "Tea",
    position: [0.22, 0, -0.45],
    cameraOffset: [0.65, 1.48, 1.95],
    terms: {
      ja: {
        term: "鉄瓶と温かいお茶",
        reading: "Tetsubin to atatakai ocha",
        meaning: "Cast-iron teapot & hot tea",
        samplePrompt: "すみません、温かいほうじ茶をおかわりいただけますか？",
      },
      es: {
        term: "La tetera de hierro fundido",
        meaning: "Cast-iron teapot",
        samplePrompt: "¿Me puedes servir un poco más de té tostado caliente?",
      },
      fr: {
        term: "La théière en fonte",
        meaning: "Cast-iron teapot",
        samplePrompt: "Pourrais-je avoir un peu de thé vert grillé bien chaud ?",
      },
      de: {
        term: "Die gusseiserne Teekanne",
        meaning: "Cast-iron teapot",
        samplePrompt: "Könnte ich bitte noch eine Tasse gerösteten grünen Tee bekommen?",
      },
      it: {
        term: "La teiera in ghisa",
        meaning: "Cast-iron teapot",
        samplePrompt: "Potrei avere un altro po’ di tè verde tostato caldo?",
      },
      zh: {
        term: "铁壶和热焙茶",
        reading: "Tiěhú hé rè bèichá",
        meaning: "Cast-iron teapot & roasted tea",
        samplePrompt: "麻烦再帮我续一杯热焙茶，谢谢。",
      },
      ko: {
        term: "무쇠 주전자와 따뜻한 차",
        reading: "Musoe jujeonja-wa ttatteutan cha",
        meaning: "Cast-iron teapot & warm tea",
        samplePrompt: "죄송하지만 따뜻한 호지차 한 잔 더 주실 수 있나요?",
      },
      pt: {
        term: "O bule de ferro fundido",
        meaning: "Cast-iron teapot",
        samplePrompt: "Você poderia servir mais um pouco de chá verde torrado?",
      },
    },
  },
  {
    id: "specials-board",
    label: "Hinoki Specials Plaque",
    category: "Chef’s Menu",
    position: [-0.02, 0, 0.78],
    cameraOffset: [-0.05, 1.4, 2.45],
    terms: {
      ja: {
        term: "本日のおすすめ札",
        reading: "Honjitsu no osusume fuda",
        meaning: "Today’s wooden specials menu",
        samplePrompt: "今日のおすすめの中で、一番季節感のある一品はどれですか？",
      },
      es: {
        term: "La tabla de sugerencias del día",
        meaning: "Wooden daily specials board",
        samplePrompt: "De las sugerencias de hoy, ¿qué plato de temporada recomiendas?",
      },
      fr: {
        term: "L’ardoise des plats du jour",
        meaning: "Daily specials plaque",
        samplePrompt: "Parmi les suggestions du soir, quel plat de saison me conseillez-vous ?",
      },
      de: {
        term: "Die Tageskarte aus Holz",
        meaning: "Wooden daily specials plaque",
        samplePrompt: "Was auf der heutigen Tageskarte ist besonders saisonal?",
      },
      it: {
        term: "La tavoletta dei piatti del giorno",
        meaning: "Wooden daily specials board",
        samplePrompt: "Tra i piatti del giorno, qual è la specialità di stagione?",
      },
      zh: {
        term: "今日推荐木牌",
        reading: "Jīnrì tuījiàn mùpái",
        meaning: "Daily specials wooden plaque",
        samplePrompt: "请问今日推荐里哪一道是最应季的招牌菜？",
      },
      ko: {
        term: "오늘의 추천 메뉴판",
        reading: "Oneur-ui chucheon menyupan",
        meaning: "Today’s specials plaque",
        samplePrompt: "오늘의 추천 메뉴 중에서 가장 제철 느낌이 나는 요리는 무엇인가요?",
      },
      pt: {
        term: "A placa de especiais do dia",
        meaning: "Wooden daily specials plaque",
        samplePrompt: "Entre os especiais de hoje, qual prato da estação você indica?",
      },
    },
  },
  {
    id: "sake-set",
    label: "Tokkuri Carafe & Cups",
    category: "Evening Drink",
    position: [1.18, 0, 0.54],
    cameraOffset: [1.45, 1.35, 2.25],
    terms: {
      ja: {
        term: "徳利とお猪口",
        reading: "Tokkuri to ochoko",
        meaning: "Sake carafe & ceramic cups",
        samplePrompt: "すっきりした辛口の日本酒はありますか？冷やでお願いします。",
      },
      es: {
        term: "La jarra de sake y los vasos",
        meaning: "Sake carafe and cups",
        samplePrompt: "¿Tienen algún sake seco y ligero para acompañar la cena?",
      },
      fr: {
        term: "La carafe de saké et ses coupes",
        meaning: "Sake carafe & cups",
        samplePrompt: "Auriez-vous un saké sec et frais pour accompagner le plat ?",
      },
      de: {
        term: "Die Sake-Karaffe mit Schalen",
        meaning: "Sake carafe & cups",
        samplePrompt: "Haben Sie einen trockenen, gekühlten Sake als Empfehlung?",
      },
      it: {
        term: "La caraffa da sakè e le tazzine",
        meaning: "Sake carafe & cups",
        samplePrompt: "Avete un sakè secco e leggero da servire fresco?",
      },
      zh: {
        term: "清酒壶与酒杯",
        reading: "Qīngjiǔhú yǔ jiǔbēi",
        meaning: "Sake carafe & ceramic cups",
        samplePrompt: "请问有清爽偏干型的清酒吗？冰镇的就好。",
      },
      ko: {
        term: "도쿠리와 술잔",
        reading: "Dokkuri-wa suljan",
        meaning: "Sake carafe & cups",
        samplePrompt: "깔끔하고 드라이한 사케로 차갑게 한 병 추천해 주실래요?",
      },
      pt: {
        term: "A garrafa de saquê e os copinhos",
        meaning: "Sake carafe & cups",
        samplePrompt: "Vocês têm um saquê seco e refrescante para harmonizar?",
      },
    },
  },
  {
    id: "chochin-lantern",
    label: "Washi Chōchin Counter Lantern",
    category: "Atmosphere",
    position: [1.42, 0, -0.72],
    cameraOffset: [2.05, 1.68, 1.45],
    terms: {
      ja: {
        term: "和紙の提灯",
        reading: "Washi no chouchin",
        meaning: "Washi paper counter lantern",
        samplePrompt: "このカウンター、提灯の明かりが温かくて落ち着きますね。",
      },
      es: {
        term: "El farolillo de papel washi",
        meaning: "Washi paper lantern",
        samplePrompt: "Me encanta la luz cálida de los farolillos en esta barra.",
      },
      fr: {
        term: "La lanterne en papier washi",
        meaning: "Washi paper lantern",
        samplePrompt: "L’éclairage des lanternes donne une ambiance vraiment chaleureuse au comptoir.",
      },
      de: {
        term: "Die Washi-Papierlaterne",
        meaning: "Washi paper lantern",
        samplePrompt: "Das warme Licht der Papierlaternen macht die Theke sehr gemütlich.",
      },
      it: {
        term: "La lanterna di carta washi",
        meaning: "Washi paper lantern",
        samplePrompt: "La luce calda delle lanterne rende questo bancone davvero accogliente.",
      },
      zh: {
        term: "和纸灯笼",
        reading: "Hézhǐ dēnglong",
        meaning: "Washi paper lantern",
        samplePrompt: "吧台这里暖暖的灯笼光让人觉得特别放松。",
      },
      ko: {
        term: "화지 초롱등",
        reading: "Hwaji chorongdeung",
        meaning: "Washi paper lantern",
        samplePrompt: "초롱등 불빛이 은은해서 카운터 분위기가 정말 아늑하네요.",
      },
      pt: {
        term: "A lanterna de papel washi",
        meaning: "Washi paper lantern",
        samplePrompt: "A luz suave das lanternas deixa este balcão muito acolhedor.",
      },
    },
  },
];

export const PARIS_BOOKSHOP_PROPS: SpatialPropEntry[] = [
  {
    id: "book-stack",
    label: "Linen-Bound Novel Stack",
    category: "Literature",
    position: [-1.1, 0, 0.48],
    cameraOffset: [-0.85, 1.45, 2.3],
    terms: {
      fr: {
        term: "La pile de romans reliés",
        meaning: "Stack of linen-bound novels",
        samplePrompt: "Bonjour, auriez-vous un roman contemporain qui se passe à Paris ?",
      },
      es: {
        term: "La pila de novelas encuadernadas",
        meaning: "Stack of bound novels",
        samplePrompt: "Busco una novela contemporánea fácil de disfrutar para leer en el tren.",
      },
      ja: {
        term: "布張りの洋書スタック",
        reading: "Nunobari no yousho sutakku",
        meaning: "Stack of cloth-bound books",
        samplePrompt: "旅先で読みやすい現代小説をおすすめしていただけますか？",
      },
      de: {
        term: "Der Stapel Leinenromane",
        meaning: "Stack of cloth-bound novels",
        samplePrompt: "Können Sie mir einen gut lesbaren Gegenwartsroman empfehlen?",
      },
      it: {
        term: "La pila di romanzi rilegati",
        meaning: "Stack of bound novels",
        samplePrompt: "Cerco un romanzo contemporaneo ambientato in città, cosa mi consiglia?",
      },
      zh: {
        term: "布面精装小说",
        reading: "Bùmiàn jīngzhuāng xiǎoshuō",
        meaning: "Linen-bound novels",
        samplePrompt: "你好，可以推荐一本适合旅途中阅读的当代小说吗？",
      },
      ko: {
        term: "양장본 소설 더미",
        reading: "Yangjangbon soseol deomi",
        meaning: "Stack of hardcover novels",
        samplePrompt: "여행 중에 읽기 좋은 현대 소설 한 권 추천해 주실 수 있나요?",
      },
      pt: {
        term: "A pilha de romances encadernados",
        meaning: "Stack of bound novels",
        samplePrompt: "Olá, você recomenda um romance contemporâneo gostoso de ler?",
      },
    },
  },
  {
    id: "staff-picks-card",
    label: "Coup de Cœur Easel Card",
    category: "Recommendation",
    position: [0.05, 0, -0.52],
    cameraOffset: [0.4, 1.45, 1.95],
    terms: {
      fr: {
        term: "Le coup de cœur du libraire",
        meaning: "Bookseller’s handwritten pick",
        samplePrompt: "Qu’est-ce qui vous a particulièrement plu dans ce coup de cœur ?",
      },
      es: {
        term: "La recomendación del librero",
        meaning: "Bookseller’s favorite pick",
        samplePrompt: "¿Por qué recomiendan especialmente este título esta semana?",
      },
      ja: {
        term: "書店員のおすすめカード",
        reading: "Shoten’in no osusume kaado",
        meaning: "Staff recommendation card",
        samplePrompt: "こちらの書店員さんのおすすめ、どんなところが魅力ですか？",
      },
      de: {
        term: "Die Buchhändler-Empfehlung",
        meaning: "Bookseller’s pick card",
        samplePrompt: "Was gefällt Ihnen an dieser Empfehlung besonders gut?",
      },
      it: {
        term: "Il consiglio del libraio",
        meaning: "Bookseller’s pick card",
        samplePrompt: "Che cosa rende speciale il libro consigliato questa settimana?",
      },
      zh: {
        term: "店员手写推荐卡",
        reading: "Diànyuán shǒuxiě tuījiànkǎ",
        meaning: "Handwritten staff pick card",
        samplePrompt: "请问这张推荐卡上的书为什么这么受欢迎？",
      },
      ko: {
        term: "서점원 추천 카드",
        reading: "Seojeomwon chucheon kadeu",
        meaning: "Bookseller’s recommendation card",
        samplePrompt: "이 서점원 추천 도서는 어떤 점이 가장 매력적인가요?",
      },
      pt: {
        term: "A indicação do livreiro",
        meaning: "Bookseller’s favorite pick",
        samplePrompt: "O que você mais gostou neste livro em destaque na mesa?",
      },
    },
  },
  {
    id: "fountain-inkwell",
    label: "Glass Inkwell & Dip Pen",
    category: "Stationery",
    position: [-0.06, 0, 0.82],
    cameraOffset: [-0.08, 1.38, 2.45],
    terms: {
      fr: {
        term: "L’encrier en verre et la plume",
        meaning: "Glass inkwell & fountain pen",
        samplePrompt: "J’adore cette papeterie—avez-vous des carnets adaptés à l’encre plume ?",
      },
      es: {
        term: "El tintero de cristal y la pluma",
        meaning: "Glass inkwell & pen",
        samplePrompt: "¿Tienen cuadernos de buen gramaje para escribir con pluma estilográfica?",
      },
      ja: {
        term: "ガラスのインク瓶と万年筆",
        reading: "Garasu no inku-bin to mannenhitsu",
        meaning: "Glass inkwell & pen",
        samplePrompt: "万年筆でも裏抜けしにくいノートはありますか？",
      },
      de: {
        term: "Das Tintenfass mit Füller",
        meaning: "Glass inkwell & fountain pen",
        samplePrompt: "Haben Sie Notizbücher mit Papier, das gut für Füllertinte geeignet ist?",
      },
      it: {
        term: "Il calamaio di vetro e la stilografica",
        meaning: "Glass inkwell & fountain pen",
        samplePrompt: "Avete quaderni con carta spessa adatta alla penna stilografica?",
      },
      zh: {
        term: "玻璃墨水瓶与钢笔",
        reading: "Bōli mòshuǐpíng yǔ gāngbǐ",
        meaning: "Glass inkwell & fountain pen",
        samplePrompt: "请问有适合钢笔书写、不洇纸的笔记本吗？",
      },
      ko: {
        term: "유리 잉크병과 만년필",
        reading: "Yuri inkeubyeong-gwa mannyeonpil",
        meaning: "Glass inkwell & fountain pen",
        samplePrompt: "만년필 잉크가 번지지 않는 노트가 있을까요?",
      },
      pt: {
        term: "O tinteiro de vidro e a caneta",
        meaning: "Glass inkwell & pen",
        samplePrompt: "Vocês têm cadernos com papel mais encorpado para caneta-tinteiro?",
      },
    },
  },
  {
    id: "creme-watch",
    label: "Café Crème & Brass Watch",
    category: "Reading Break",
    position: [1.18, 0, 0.56],
    cameraOffset: [1.45, 1.35, 2.25],
    terms: {
      fr: {
        term: "Le café crème et la montre",
        meaning: "Café crème & pocket watch",
        samplePrompt: "Est-ce que je peux feuilleter ce recueil tranquille pendant quelques minutes ?",
      },
      es: {
        term: "El café con leche y el reloj",
        meaning: "Latte & pocket watch",
        samplePrompt: "¿Hasta qué hora permanece abierta la librería esta tarde?",
      },
      ja: {
        term: "カフェクレームと懐中時計",
        reading: "Kafe kureemu to kaichuudokei",
        meaning: "Café crème & pocket watch",
        samplePrompt: "少しこちらで試し読みをしてもよろしいですか？",
      },
      de: {
        term: "Der Milchkaffee und die Taschenuhr",
        meaning: "Café crème & pocket watch",
        samplePrompt: "Wie lange hat Ihre Buchhandlung heute Abend geöffnet?",
      },
      it: {
        term: "Il caffellatte e l’orologio da tasca",
        meaning: "Café crème & pocket watch",
        samplePrompt: "Posso sfogliare questo volume per qualche minuto qui al tavolo?",
      },
      zh: {
        term: "奶咖与黄铜怀表",
        reading: "Nǎikā yǔ huángtóng huáibiǎo",
        meaning: "Café crème & brass pocket watch",
        samplePrompt: "请问书店今天晚上营业到几点？我可以先翻阅一下吗？",
      },
      ko: {
        term: "카페 크렘과 회중시계",
        reading: "Kape keurem-gwa hoejungsigye",
        meaning: "Café crème & pocket watch",
        samplePrompt: "잠시 여기 앉아서 이 책을 천천히 훑어봐도 될까요?",
      },
      pt: {
        term: "O café com leite e o relógio de bolso",
        meaning: "Café crème & pocket watch",
        samplePrompt: "Até que horas a livraria fica aberta hoje à tarde?",
      },
    },
  },
  {
    id: "banker-lamp",
    label: "Emerald Banker’s Lamp",
    category: "Atmosphere",
    position: [1.42, 0, -0.75],
    cameraOffset: [2.05, 1.72, 1.4],
    terms: {
      fr: {
        term: "La lampe de bibliothécaire",
        meaning: "Emerald glass banker’s lamp",
        samplePrompt: "Quelle atmosphère apaisante dans cette librairie de la Rive Gauche !",
      },
      es: {
        term: "La lámpara verde de biblioteca",
        meaning: "Emerald library lamp",
        samplePrompt: "Me encanta el silencio y la luz verde de esta mesa de lectura.",
      },
      ja: {
        term: "エメラルドのバンカーズランプ",
        reading: "Emerarudo no bankaazu ranpu",
        meaning: "Emerald banker’s lamp",
        samplePrompt: "深い緑色のシェードの灯りが、本を読むのにちょうどいいですね。",
      },
      de: {
        term: "Die grüne Bibliotheksleuchte",
        meaning: "Emerald library lamp",
        samplePrompt: "Diese Leselampe erinnert mich an eine alte Universitätsbibliothek.",
      },
      it: {
        term: "La lampada verde da biblioteca",
        meaning: "Emerald library lamp",
        samplePrompt: "Adoro la luce verde di questa lampada, mette subito voglia di leggere.",
      },
      zh: {
        term: "祖母绿银行家台灯",
        reading: "Zǔmǔlǜ yínhángjiā táidēng",
        meaning: "Emerald banker’s lamp",
        samplePrompt: "这盏祖母绿台灯让整张书桌都特别有老书店的氛围。",
      },
      ko: {
        term: "에메랄드 뱅커스 램프",
        reading: "Emeraldeu baengkeoseu raempeu",
        meaning: "Emerald banker’s lamp",
        samplePrompt: "초록빛 스탠드 조명 덕분에 오래된 서점 분위기가 물씬 나네요.",
      },
      pt: {
        term: "A luminária verde de biblioteca",
        meaning: "Emerald library lamp",
        samplePrompt: "Essa luminária verde deixa a mesa de leitura com um charme clássico.",
      },
    },
  },
];

export const SPATIAL_ROOMS: SpatialRoomSpec[] = [
  {
    id: "madrid-cafe",
    shortLabel: "Madrid Café",
    title: "Madrid Café Terrace",
    cityTag: "Lavapiés · Marble Counter",
    subtitle: "Morning espresso bar, brass kettle & sunny neighborhood chatter",
    defaultCameraPos: [0.1, 2.35, 4.35],
    defaultTargetPos: [0, 0.35, 0.1],
    lampLightPos: [1.08, 1.05, -0.54],
    lampLightColor: 0xffd7a1,
    lampLightIntensity: 1.1,
    props: SPATIAL_PROPS,
  },
  {
    id: "tokyo-counter",
    shortLabel: "Tokyo Counter",
    title: "Shimokitazawa Hinoki Counter",
    cityTag: "Tokyo · Evening Izakaya",
    subtitle: "Warm cypress bar, steaming ramen, cast-iron tea & glowing lantern",
    defaultCameraPos: [0.05, 2.32, 4.32],
    defaultTargetPos: [0, 0.38, 0.08],
    lampLightPos: [1.32, 1.06, -0.68],
    lampLightColor: 0xffb974,
    lampLightIntensity: 1.35,
    props: TOKYO_COUNTER_PROPS,
  },
  {
    id: "paris-bookshop",
    shortLabel: "Paris Bookshop",
    title: "Left-Bank Bookshop Desk",
    cityTag: "Saint-Germain · Reading Table",
    subtitle: "Walnut desk, emerald banker’s lamp, linen novels & staff picks",
    defaultCameraPos: [0.12, 2.36, 4.38],
    defaultTargetPos: [0, 0.36, 0.1],
    lampLightPos: [1.2, 1.08, -0.58],
    lampLightColor: 0xcff7db,
    lampLightIntensity: 1.15,
    props: PARIS_BOOKSHOP_PROPS,
  },
];

export function getSpatialRoomById(roomId: SpatialRoomId): SpatialRoomSpec {
  return SPATIAL_ROOMS.find((room) => room.id === roomId) ?? SPATIAL_ROOMS[0];
}

export function getRecommendedRoomForLanguage(
  languageCode: string
): SpatialRoomId {
  switch (languageCode) {
    case "ja":
    case "zh":
    case "ko":
      return "tokyo-counter";
    case "fr":
    case "de":
    case "it":
      return "paris-bookshop";
    case "es":
    case "pt":
    default:
      return "madrid-cafe";
  }
}

export function getPropLocalizedTerm(
  prop: SpatialPropEntry,
  languageCode: string
) {
  return prop.terms[languageCode] ?? prop.terms.es ?? Object.values(prop.terms)[0];
}
