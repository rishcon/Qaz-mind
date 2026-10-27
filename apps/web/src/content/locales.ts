import { Language } from '../types';

/** Landing copy. Only text that is shown is kept here; nothing claims a feature, price or result that does not exist yet. */
export interface LocaleContent {
  nav: {
    howItWorks: string;
    subjects: string;
    login: string;
    startFree: string;
  };
  hero: {
    microLabel: string;
    headlinePart1: string;
    headlinePart2: string;
    support: string;
    primaryCta: string;
    secondaryLink: string;
    maxScoreNote: string;
  };
  problem: {
    tag: string;
    headline: string;
    description: string;
    traditionalLabel: string;
    traditionalText: string;
    qazmindLabel: string;
    qazmindText: string;
    statNumber: string;
    statSubtext: string;
  };
  approach: {
    tag: string;
    headline: string;
    step1Num: string;
    step1Title: string;
    step1Desc: string;
    step2Num: string;
    step2Title: string;
    step2Desc: string;
    step3Num: string;
    step3Title: string;
    step3Desc: string;
  };
  route: {
    tag: string;
    headline: string;
    description: string;
  };
  subjects: {
    tag: string;
    headline: string;
    mandatoryHeading: string;
    profileHeading: string;
  };
  finalCta: {
    headline: string;
    subtext: string;
    cta: string;
    guarantee: string;
  };
  footer: {
    copyright: string;
    tagline: string;
    terms: string;
    privacy: string;
    standardNote: string;
  };
}

export const locales: Record<Language, LocaleContent> = {
  ru: {
    nav: {
      howItWorks: 'Как это работает',
      subjects: 'Предметы',
      login: 'Войти',
      startFree: 'Начать подготовку',
    },
    hero: {
      microLabel: 'QAZMIND / ПОДГОТОВКА К ЕНТ',
      headlinePart1: 'ЕНТ — не лотерея.',
      headlinePart2: 'Готовься осознанно.',
      support: 'Учи темы, решай задания и разбирай ошибки. QazMind помогает превратить подготовку к ЕНТ в понятный ежедневный процесс.',
      primaryCta: 'Начать подготовку',
      secondaryLink: 'Посмотреть, как это работает',
      maxScoreNote: 'максимальный балл ЕНТ. Каждый балл — это разобранная тема, а не случайность.',
    },
    problem: {
      tag: '01 / ПРОБЛЕМА',
      headline: 'Сотни тестов.\nНоль понимания?',
      description: 'Бесконечная практика без разбора ошибок не помогает понять, что именно нужно подтянуть.',
      traditionalLabel: 'Хаотичное нарешивание',
      traditionalText: 'Решение сотен типовых сборников наугад. Ошибки повторяются из недели в неделю, порождая страх перед экзаменом.',
      qazmindLabel: 'Осознанная траектория QazMind',
      qazmindText: 'Каждая ошибка маркируется кодом темы. Ты закрываешь фундаментальную причину пробела, а не просто запоминаешь букву ответа.',
      statNumber: '120',
      statSubtext: 'заданий в экзамене ЕНТ. Каждое проверяет конкретную тему, поэтому пробел в одной теме становится ошибкой.',
    },
    approach: {
      tag: '02 / ПОДХОД',
      headline: 'Не больше заданий.\nБольше понимания.',
      step1Num: '01',
      step1Title: 'Разберись в теме',
      step1Desc: 'Короткие сфокусированные блоки теории без лишней воды. Исторический контекст, наглядные причинно-следственные связи и строгие формулировки.',
      step2Num: '02',
      step2Title: 'Закрепи знания',
      step2Desc: 'Прицельные задания на ключевые триггеры. Вопросы повышенной сложности, контекстные выдержки и задачи на логику.',
      step3Num: '03',
      step3Title: 'Исправь ошибки',
      step3Desc: 'Персональный банк ошибок с объяснением каждого дистрактора. Вопрос возвращается в практику ровно тогда, когда ты готов закрепить его.',
    },
    route: {
      tag: '03 / ТВОЙ МАРШРУТ',
      headline: 'План, который знает,\nс чего начать.',
      description: 'Индивидуальная траектория от первой входной диагностики до уверенного написания итогового тестирования.',
    },
    subjects: {
      tag: '04 / ПРЕДМЕТЫ',
      headline: 'Всё важное.\nНичего лишнего.',
      mandatoryHeading: 'Обязательные предметы',
      profileHeading: 'Профильные предметы',
    },
    finalCta: {
      headline: 'Твоя цель.\nТвой темп.\nТвой QazMind.',
      subtext: 'Зарегистрируйся, укажи целевой балл и профильные предметы, чтобы начать подготовку.',
      cta: 'Начать подготовку',
      guarantee: 'Регистрация по email, подтверждение почты, затем короткий вводный опрос.',
    },
    footer: {
      copyright: '© 2026 QAZMIND. Образовательная платформа подготовки к ЕНТ.',
      tagline: 'Подготовка к ЕНТ и ҰБТ.',
      terms: 'Условия использования',
      privacy: 'Политика конфиденциальности',
      standardNote: 'Структура экзамена соответствует спецификации Национального центра тестирования.',
    },
  },
  kz: {
    nav: {
      howItWorks: 'Қалай жұмыс істейді',
      subjects: 'Пәндер',
      login: 'Кіру',
      startFree: 'Дайындықты бастау',
    },
    hero: {
      microLabel: 'QAZMIND / ҰБТ-ҒА ДАЙЫНДЫҚ',
      headlinePart1: 'ҰБТ — лотерея емес.',
      headlinePart2: 'Саналы түрде дайындал.',
      support: 'Тақырыптарды түсін, тапсырмаларды шеш және қателерді талда. QazMind ҰБТ-ға дайындықты күнделікті жүйелі әрі түсінікті үдеріске айналдырады.',
      primaryCta: 'Дайындықты бастау',
      secondaryLink: 'Қалай жұмыс істейтінін көру',
      maxScoreNote: 'ҰБТ-ның ең жоғары балы. Әрбір балл — бұл кездейсоқтық емес, талданған тақырып нәтижесі.',
    },
    problem: {
      tag: '01 / МӘСЕЛЕ',
      headline: 'Жүздеген тест.\nНөл түсінік?',
      description: 'Қатені талдамай шексіз тест жаттау нені күшейту керектігін түсінуге көмектеспейді.',
      traditionalLabel: 'Ретсіз тест жаттау',
      traditionalText: 'Кездейсоқ кітапшаларды шексіз белгілеу. Қателер апта сайын қайталанып, емтихан алдында қорқыныш тудырады.',
      qazmindLabel: 'QazMind саналы траекториясы',
      qazmindText: 'Әрбір қате тақырып кодымен белгіленеді. Сен жауап әрпін жаттамай, олқылықтың түпкі себебін жоясың.',
      statNumber: '120',
      statSubtext: 'ҰБТ емтиханындағы тапсырма. Әрқайсысы нақты тақырыпты тексереді, сондықтан бір тақырыптағы олқылық қателікке айналады.',
    },
    approach: {
      tag: '02 / ТӘСІЛ',
      headline: 'Көп тапсырма емес.\nТерең түсінік.',
      step1Num: '01',
      step1Title: 'Тақырыпты түсін',
      step1Desc: 'Артық сөзсіз шоғырландырылған теория. Тарихи контекст, айқын себеп-салдар байланыстары мен нақты формулалар.',
      step2Num: '02',
      step2Title: 'Білімді бекіт',
      step2Desc: 'Негізгі триггерлерге бағытталған тапсырмалар. Күрделілігі жоғары сұрақтар, мәнмәтіндік үзінділер және логикалық есептер.',
      step3Num: '03',
      step3Title: 'Қатені түзет',
      step3Desc: 'Әрбір бұрыс нұсқаға түсіндірмесі бар жеке қателер банкі. Сұрақ білім толық бекітілгенше қайта оралады.',
    },
    route: {
      tag: '03 / СЕНІҢ МАРШРУТЫҢ',
      headline: 'Неден бастау керегін\nбілетін жоспар.',
      description: 'Алғашқы кіріспе диагностикадан бастап қорытынды тестілеуді сенімді тапсыруға дейінгі жеке жолың.',
    },
    subjects: {
      tag: '04 / ПӘНДЕР',
      headline: 'Барлық маңыздысы.\nАртық ештеңе жоқ.',
      mandatoryHeading: 'Міндетті пәндер',
      profileHeading: 'Бейіндік пәндер',
    },
    finalCta: {
      headline: 'Сенің мақсатың.\nСенің қарқының.\nСенің QazMind-ың.',
      subtext: 'Тіркеліп, мақсатты балыңды және бейіндік пәндеріңді көрсет — дайындықты бастау үшін.',
      cta: 'Дайындықты бастау',
      guarantee: 'Email арқылы тіркелу, поштаны растау, содан кейін қысқа бастапқы сауалнама.',
    },
    footer: {
      copyright: '© 2026 QAZMIND. ҰБТ-ға дайындық білім беру платформасы.',
      tagline: 'ҰБТ-ға және ЕНТ-ге дайындық.',
      terms: 'Пайдалану шарттары',
      privacy: 'Құпиялылық саясаты',
      standardNote: 'Емтихан құрылымы Ұлттық тестілеу орталығының спецификациясына сәйкес келеді.',
    },
  },
};
