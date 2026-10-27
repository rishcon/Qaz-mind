import { Language } from '../types';

export interface LocaleContent {
  nav: {
    platform: string;
    howItWorks: string;
    subjects: string;
    pricing: string;
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
    maxScoreBadge: string;
    maxScoreNote: string;
    interactiveHint: string;
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
  product: {
    tag: string;
    headline: string;
    subheadline: string;
    sidebarToday: string;
    sidebarSubjects: string;
    sidebarPractice: string;
    sidebarMock: string;
    sidebarMistakes: string;
    sidebarProgress: string;
    keyConceptTitle: string;
    interactiveExerciseTitle: string;
    checkAnswer: string;
    nextLesson: string;
  };
  route: {
    tag: string;
    headline: string;
    description: string;
    stepCompleted: string;
    stepCurrent: string;
    stepUpcoming: string;
  };
  practice: {
    tag: string;
    headline: string;
    subheadline: string;
    timerRemaining: string;
    questionOutOf: string;
    markForReview: string;
    flaggedNotice: string;
    previous: string;
    next: string;
    finishExam: string;
    examConsoleTitle: string;
  };
  subjects: {
    tag: string;
    headline: string;
    mandatoryHeading: string;
    profileHeading: string;
    viewSyllabus: string;
    hideSyllabus: string;
  };
  pricing: {
    tag: string;
    headline: string;
    freeTitle: string;
    freePrice: string;
    freePeriod: string;
    freeFeatures: string[];
    freeCta: string;
    plusTitle: string;
    plusBadge: string;
    plusFeatures: string[];
    plusCta: string;
    noCardNeeded: string;
  };
  finalCta: {
    headline: string;
    subtext: string;
    cta: string;
    guarantee: string;
  };
  modal: {
    title: string;
    subtitle: string;
    targetScoreLabel: string;
    nameLabel: string;
    namePlaceholder: string;
    phoneLabel: string;
    phonePlaceholder: string;
    profileSubjectLabel: string;
    startBtn: string;
    successTitle: string;
    successMessage: string;
    closeBtn: string;
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
      platform: 'Платформа',
      howItWorks: 'Как это работает',
      subjects: 'Предметы',
      pricing: 'Тарифы',
      login: 'Войти',
      startFree: 'Начать бесплатно',
    },
    hero: {
      microLabel: 'QAZMIND / ПОДГОТОВКА К ЕНТ',
      headlinePart1: 'ЕНТ — не лотерея.',
      headlinePart2: 'Готовься осознанно.',
      support: 'Учи темы, решай задания и разбирай ошибки. QazMind помогает превратить подготовку к ЕНТ в понятный ежедневный процесс.',
      primaryCta: 'Начать подготовку',
      secondaryLink: 'Посмотреть, как это работает',
      maxScoreBadge: '140',
      maxScoreNote: 'максимальный балл ЕНТ. Каждый балл — это разобранная тема, а не случайность.',
      interactiveHint: 'Попробуй ответить прямо сейчас:',
    },
    problem: {
      tag: '01 / ПРОБЛЕМА',
      headline: 'Сотни тестов.\nНоль понимания?',
      description: 'Бесконечная практика без разбора ошибок не помогает понять, что именно нужно подтянуть.',
      traditionalLabel: 'Хаотичное нарешивание',
      traditionalText: 'Решение сотен типовых сборников наугад. Ошибки повторяются из недели в неделю, порождая страх перед экзаменом.',
      qazmindLabel: 'Осознанная траектория QazMind',
      qazmindText: 'Каждая ошибка маркируется кодом темы. Ты закрываешь фундаментальную причину пробела, а не просто запоминаешь букву ответа.',
      statNumber: '73%',
      statSubtext: 'ошибок на ЕНТ происходят из-за повторения одних и тех же неусвоенных ключевых дат, формул и терминов.',
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
    product: {
      tag: '03 / ВНУТРИ QAZMIND',
      headline: 'Открой. Пойми. Реши.',
      subheadline: 'Рабочая среда, в которой приятно учиться каждый день. Никакого визуального шума — только фокус на сути предмета.',
      sidebarToday: 'Сегодня',
      sidebarSubjects: 'Предметы',
      sidebarPractice: 'Практика',
      sidebarMock: 'Пробное ЕНТ',
      sidebarMistakes: 'Банк ошибок',
      sidebarProgress: 'Аналитика',
      keyConceptTitle: 'Ключевой концепт темы',
      interactiveExerciseTitle: 'Контрольный вопрос блока',
      checkAnswer: 'Проверить ответ',
      nextLesson: 'Следующий блок темы',
    },
    route: {
      tag: '04 / ТВОЙ МАРШРУТ',
      headline: 'План, который знает,\nс чего начать.',
      description: 'Индивидуальная траектория от первой входной диагностики до уверенного написания итогового тестирования.',
      stepCompleted: 'Пройдено',
      stepCurrent: 'В процессе',
      stepUpcoming: 'Впереди',
    },
    practice: {
      tag: '05 / ПРАКТИКА',
      headline: 'К экзамену готовятся.\nНе угадывают.',
      subheadline: 'Точный интерфейс официального тестирования. Строгий регламент, реальный темп и отсутствие подсказок приучают к атмосфере аудитории.',
      timerRemaining: 'Осталось времени:',
      questionOutOf: 'Вопрос',
      markForReview: 'Отметить на перепроверку',
      flaggedNotice: 'Вопрос отмечен флажком для повторного просмотра',
      previous: 'Назад',
      next: 'Вперёд',
      finishExam: 'Завершить симуляцию',
      examConsoleTitle: 'СИМУЛЯТОР ЭКЗАМЕНА ЕНТ / ҰБТ',
    },
    subjects: {
      tag: '06 / ПРЕДМЕТЫ',
      headline: 'Всё важное.\nНичего лишнего.',
      mandatoryHeading: 'Обязательные предметы',
      profileHeading: 'Профильные предметы',
      viewSyllabus: 'Смотреть программу курса',
      hideSyllabus: 'Свернуть описание',
    },
    pricing: {
      tag: '07 / ДОСТУП',
      headline: 'Начать можно бесплатно.',
      freeTitle: 'Базовый',
      freePrice: '0 ₸',
      freePeriod: 'навсегда',
      freeFeatures: [
        'Входная диагностика пробелов по всем обязательным предметам',
        'Базовые интерактивные конспекты ключевых тем',
        'Тематические упражнения с пояснениями к ответам',
        'Отслеживание прогресса по 3 обязательным дисциплинам',
      ],
      freeCta: 'Начать бесплатно',
      plusTitle: 'QazMind Plus',
      plusBadge: 'Скоро',
      plusFeatures: [
        'Полная программа подготовки по обязательным и профильным предметам',
        'Неограниченная симуляция пробного ЕНТ с таймингом',
        'Умный банк ошибок с адаптивным интервальным повторением',
        'Аналитика вероятности поступления на грант по вузам Казахстана',
        'Персональный разбор сложных текстовых и расчетных задач',
      ],
      plusCta: 'Уведомить о запуске',
      noCardNeeded: 'Банковская карта не требуется. Доступ открывается сразу.',
    },
    finalCta: {
      headline: 'Твоя цель.\nТвой темп.\nТвой QazMind.',
      subtext: 'Присоединяйся к осознанной подготовке к ЕНТ. Пройди диагностику сегодня и узнай свои сильные и слабые темы.',
      cta: 'Начать бесплатно',
      guarantee: 'Бесплатный доступ без скрытых условий и ограничений по времени.',
    },
    modal: {
      title: 'Быстрый старт в QazMind',
      subtitle: 'Выбери целевой балл и начни с вводной 15-минутной диагностики',
      targetScoreLabel: 'Твой целевой балл на ЕНТ (из 140):',
      nameLabel: 'Имя',
      namePlaceholder: 'Например, Алишер',
      phoneLabel: 'Номер телефона (WhatsApp)',
      phonePlaceholder: '+7 (707) 000-00-00',
      profileSubjectLabel: 'Твоя профильная пара предметов:',
      startBtn: 'Открыть личный план подготовки',
      successTitle: 'План подготовки сформирован!',
      successMessage: 'Диагностика активирована. Мы сохранили твои настройки и ждём тебя в личном кабинете.',
      closeBtn: 'Перейти к занятиям',
    },
    footer: {
      copyright: '© 2026 QAZMIND. Образовательная платформа подготовки к ЕНТ.',
      tagline: 'Разработано в Алматы для будущих студентов Казахстана.',
      terms: 'Условия использования',
      privacy: 'Политика конфиденциальности',
      standardNote: 'Материалы соответствуют типовым учебным программам МОН РК и спецификациям Национального центра тестирования.',
    },
  },
  kz: {
    nav: {
      platform: 'Платформа',
      howItWorks: 'Қалай жұмыс істейді',
      subjects: 'Пәндер',
      pricing: 'Тарифтер',
      login: 'Кіру',
      startFree: 'Тегін бастау',
    },
    hero: {
      microLabel: 'QAZMIND / ҰБТ-ҒА ДАЙЫНДЫҚ',
      headlinePart1: 'ҰБТ — лотерея емес.',
      headlinePart2: 'Саналы түрде дайындал.',
      support: 'Тақырыптарды түсін, тапсырмаларды шеш және қателерді талда. QazMind ҰБТ-ға дайындықты күнделікті жүйелі әрі түсінікті үдеріске айналдырады.',
      primaryCta: 'Дайындықты бастау',
      secondaryLink: 'Қалай жұмыс істейтінін көру',
      maxScoreBadge: '140',
      maxScoreNote: 'ҰБТ-ның ең жоғары балы. Әрбір балл — бұл кездейсоқтық емес, талданған тақырып нәтижесі.',
      interactiveHint: 'Қазір жауап беріп көр:',
    },
    problem: {
      tag: '01 / МӘСЕЛЕ',
      headline: 'Жүздеген тест.\nНөл түсінік?',
      description: 'Қатені талдамай шексіз тест жаттау нені күшейту керектігін түсінуге көмектеспейді.',
      traditionalLabel: 'Ретсіз тест жаттау',
      traditionalText: 'Кездейсоқ кітапшаларды шексіз белгілеу. Қателер апта сайын қайталанып, емтихан алдында қорқыныш тудырады.',
      qazmindLabel: 'QazMind саналы траекториясы',
      qazmindText: 'Әрбір қате тақырып кодымен белгіленеді. Сен жауап әрпін жаттамай, олқылықтың түпкі себебін жоясың.',
      statNumber: '73%',
      statSubtext: 'ҰБТ-дағы қателіктер бірдей меңгерілмеген тарихи даталар, формулалар мен терминдерден туындайды.',
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
    product: {
      tag: '03 / QAZMIND ІШІНДЕ',
      headline: 'Аш. Түсін. Шеш.',
      subheadline: 'Күн сайын білім алуға шабыт беретін оқу ортасы. Артық визуалды шу жоқ — тек пәннің мәніне назар аудару.',
      sidebarToday: 'Бүгін',
      sidebarSubjects: 'Пәндер',
      sidebarPractice: 'Практика',
      sidebarMock: 'Байқау ҰБТ-сы',
      sidebarMistakes: 'Қателер банкі',
      sidebarProgress: 'Аналитика',
      keyConceptTitle: 'Тақырыптың басты түйіні',
      interactiveExerciseTitle: 'Блоктың бақылау сұрағы',
      checkAnswer: 'Жауапты тексеру',
      nextLesson: 'Келесі тақырып блогы',
    },
    route: {
      tag: '04 / СЕНІҢ МАРШРУТЫҢ',
      headline: 'Неден бастау керегін\nбілетін жоспар.',
      description: 'Алғашқы кіріспе диагностикадан бастап қорытынды тестілеуді сенімді тапсыруға дейінгі жеке жолың.',
      stepCompleted: 'Аяқталды',
      stepCurrent: 'Орындалуда',
      stepUpcoming: 'Алда',
    },
    practice: {
      tag: '05 / ПРАКТИКА',
      headline: 'Емтиханға дайындалады.\nБолжамайды.',
      subheadline: 'Ресми тестілеудің нақты интерфейсі. Қатаң тәртіп, нақты қарқын және сыбырсыз орта аудитория сезіміне бейімдейді.',
      timerRemaining: 'Қалған уақыт:',
      questionOutOf: 'Сұрақ',
      markForReview: 'Қайта тексеруге белгілеу',
      flaggedNotice: 'Сұрақ қайта қарау үшін белгіленді',
      previous: 'Артқа',
      next: 'Алға',
      finishExam: 'Симуляцияны аяқтау',
      examConsoleTitle: 'ҰБТ / ЕНТ ЕМТИХАН СИМУЛЯТОРЫ',
    },
    subjects: {
      tag: '06 / ПӘНДЕР',
      headline: 'Барлық маңыздысы.\nАртық ештеңе жоқ.',
      mandatoryHeading: 'Міндетті пәндер',
      profileHeading: 'Бейіндік пәндер',
      viewSyllabus: 'Курс бағдарламасын көру',
      hideSyllabus: 'Сипаттаманы жинау',
    },
    pricing: {
      tag: '07 / ҚОЛЖЕТІМДІЛІК',
      headline: 'Тегін бастауға болады.',
      freeTitle: 'Базалық',
      freePrice: '0 ₸',
      freePeriod: 'әрқашан',
      freeFeatures: [
        'Барлық міндетті пәндер бойынша бастапқы диагностика',
        'Негізгі тақырыптардың интерактивті конспектілері',
        'Жауаптарға түсіндірмесі бар тақырыптық жаттығулар',
        '3 міндетті пән бойынша прогресті бақылау',
      ],
      freeCta: 'Тегін бастау',
      plusTitle: 'QazMind Plus',
      plusBadge: 'Жақында',
      plusFeatures: [
        'Міндетті және бейіндік пәндер бойынша толық бағдарлама',
        'Таймері бар байқау ҰБТ-сын шексіз тапсыру',
        'Ақылды интервалды қайталау жүйесі бар қателер банкі',
        'Қазақстан ЖОО-ларына грантқа түсу ықтималдығының аналитикасы',
        'Күрделі мәтіндік және есептеу тапсырмаларын жеке талдау',
      ],
      plusCta: 'Іске қосу туралы хабарлау',
      noCardNeeded: 'Банк картасы қажет емес. Қолжетімділік бірден ашылады.',
    },
    finalCta: {
      headline: 'Сенің мақсатың.\nСенің қарқының.\nСенің QazMind-ың.',
      subtext: 'ҰБТ-ға саналы дайындыққа қосыл. Диагностикадан бүгін өт те, мықты және әлсіз тұстарыңды біл.',
      cta: 'Тегін бастау',
      guarantee: 'Жасырын шарттарсыз және уақыт шектеуінсіз тегін қолжетімділік.',
    },
    modal: {
      title: 'QazMind-та жылдам бастау',
      subtitle: 'Мақсатты балыңды таңдап, 15 минуттық кіріспе диагностиканы баста',
      targetScoreLabel: 'ҰБТ-дағы мақсатты балың (140-тан):',
      nameLabel: 'Аты-жөніңіз',
      namePlaceholder: 'Мысалы, Әлішер',
      phoneLabel: 'Телефон нөмірі (WhatsApp)',
      phonePlaceholder: '+7 (707) 000-00-00',
      profileSubjectLabel: 'Бейіндік жұп пәндеріңіз:',
      startBtn: 'Жеке дайындық жоспарын ашу',
      successTitle: 'Дайындық жоспары құрылды!',
      successMessage: 'Диагностика белсендірілді. Баптауларың сақталды, сені жеке кабинетте күтеміз.',
      closeBtn: 'Сабаққа көшу',
    },
    footer: {
      copyright: '© 2026 QAZMIND. ҰБТ-ға дайындық білім беру платформасы.',
      tagline: 'Қазақстанның болашақ студенттері үшін Алматыда жасалған.',
      terms: 'Пайдалану шарттары',
      privacy: 'Құпиялылық саясаты',
      standardNote: 'Материалдар ҚР Оқу-ағарту министрлігінің типтік бағдарламаларына және Ұлттық тестілеу орталығының спецификацияларына сәйкес келеді.',
    },
  },
};
