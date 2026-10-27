// PROTOTYPE CONTENT. Not used by the student screens: lessons come from the server (see apps/api/content).
// Kept as the source for scripts/export-prototype-lessons.ts. Counts of questions or topics are not stored here:
// nothing invented is shown to students.
import { SyllabusChapter } from '../types/dashboard';

export interface SubjectContent {
  id: string;
  code: string;
  nameRu: string;
  nameKz: string;
  category: 'mandatory' | 'profile';
  chapters: SyllabusChapter[];
}

export const ALL_SUBJECT_CURRICULA: Record<string, SubjectContent> = {
  history_kz: {
    id: 'history_kz',
    code: '01',
    nameRu: 'История Казахстана',
    nameKz: 'Қазақстан тарихы',
    category: 'mandatory',
    chapters: [
      {
        id: 'ch-ancient',
        titleRu: 'Древний Казахстан',
        titleKz: 'Ежелгі Қазақстан',
        progressPercent: 100,
        completedLessonsCount: 3,
        totalLessonsCount: 3,
        lessons: [
          { id: 'l_hist_1', number: '1.1', titleRu: 'Палеолит и неолит на территории Казахстана', titleKz: 'Қазақстан аумағындағы палеолит және неолит', duration: '12 мин', status: 'completed', practiceAvailable: true },
          { id: 'l_hist_2', number: '1.2', titleRu: 'Эпоха бронзы: Андроновская культура', titleKz: 'Қола дәуірі: Андрон мәдениеті', duration: '15 мин', status: 'completed', practiceAvailable: true },
          { id: 'l_hist_3', number: '1.3', titleRu: 'Саки: социальный строй, военное дело и культура', titleKz: 'Сақтар: қоғамдық құрылысы мен мәдениеті', duration: '18 мин', status: 'completed', practiceAvailable: true },
        ],
      },
      {
        id: 'ch-khanate',
        titleRu: 'Казахское ханство',
        titleKz: 'Қазақ хандығы',
        progressPercent: 33,
        completedLessonsCount: 1,
        totalLessonsCount: 3,
        lessons: [
          { id: 'lesson-khanate-foundation', number: '2.1', titleRu: 'Образование Казахского ханства (1465 г.)', titleKz: 'Қазақ хандығының құрылуы (1465 ж.)', duration: '12 мин', status: 'in_progress', practiceAvailable: true },
          { id: 'l_hist_kasym', number: '2.2', titleRu: 'Правление Касым хана и свод «Қасқа жолы»', titleKz: 'Қасым ханның билігі және «Қасқа жолы»', duration: '14 мин', status: 'locked', practiceAvailable: true },
          { id: 'l_hist_tauke', number: '2.3', titleRu: 'Хан Тауке и свод законов «Жеті Жарғы»', titleKz: 'Тәуке хан және «Жеті Жарғы» заңдар жинағы', duration: '16 мин', status: 'locked', practiceAvailable: true },
        ],
      },
      {
        id: 'ch-20th',
        titleRu: 'Казахстан в XX веке и независимость',
        titleKz: 'XX ғасырдағы Қазақстан және Тәуелсіздік',
        progressPercent: 0,
        completedLessonsCount: 0,
        totalLessonsCount: 2,
        lessons: [
          { id: 'l_hist_alash', number: '3.1', titleRu: 'Национальное движение Алаш и правительство Алаш-Орды', titleKz: 'Алаш қозғалысы және Алаш-Орда үкіметі', duration: '20 мин', status: 'locked', practiceAvailable: false },
          { id: 'l_hist_indep', number: '3.2', titleRu: 'Провозглашение государственной независимости 1991 года', titleKz: '1991 жылғы Тәуелсіздіктің жариялануы', duration: '15 мин', status: 'locked', practiceAvailable: false },
        ],
      },
    ],
  },
  math_lit: {
    id: 'math_lit',
    code: '02',
    nameRu: 'Математическая грамотность',
    nameKz: 'Математикалық сауаттылық',
    category: 'mandatory',
    chapters: [
      {
        id: 'ch-mathlit-percents',
        titleRu: 'Проценты, пропорции и смеси',
        titleKz: 'Пайыздар, пропорциялар және қоспалар',
        progressPercent: 50,
        completedLessonsCount: 1,
        totalLessonsCount: 2,
        lessons: [
          { id: 'l_ml_1', number: '1.1', titleRu: 'Быстрый расчет процентов без формул', titleKz: 'Формуласыз пайыздарды жылдам есептеу', duration: '10 мин', status: 'completed', practiceAvailable: true },
          { id: 'l_ml_2', number: '1.2', titleRu: 'Сложные проценты и банковские вклады', titleKz: 'Күрделі пайыздар және банк салымдары', duration: '14 мин', status: 'in_progress', practiceAvailable: true },
        ],
      },
      {
        id: 'ch-mathlit-logic',
        titleRu: 'Логика, ряды чисел и закономерности',
        titleKz: 'Логика, сандық қатарлар мен заңдылықтар',
        progressPercent: 0,
        completedLessonsCount: 0,
        totalLessonsCount: 2,
        lessons: [
          { id: 'l_ml_3', number: '2.1', titleRu: 'Арифметические и геометрические паттерны', titleKz: 'Арифметикалық және геометриялық паттерндер', duration: '12 мин', status: 'locked', practiceAvailable: true },
          { id: 'l_ml_4', number: '2.2', titleRu: 'Теория вероятностей: игральные кости и шары', titleKz: 'Ықтималдықтар теориясы: сүйектер мен шарлар', duration: '15 мин', status: 'locked', practiceAvailable: true },
        ],
      },
    ],
  },
  reading_lit: {
    id: 'reading_lit',
    code: '03',
    nameRu: 'Грамотность чтения',
    nameKz: 'Оқу сауаттылығы',
    category: 'mandatory',
    chapters: [
      {
        id: 'ch-read-core',
        titleRu: 'Анализ текста и подтекст',
        titleKz: 'Мәтінді талдау және астарлы ой',
        progressPercent: 0,
        completedLessonsCount: 0,
        totalLessonsCount: 2,
        lessons: [
          { id: 'l_rl_1', number: '1.1', titleRu: 'Определение главной мысли и микротем', titleKz: 'Негізгі ой мен микротақырыптарды анықтау', duration: '12 мин', status: 'in_progress', practiceAvailable: true },
          { id: 'l_rl_2', number: '1.2', titleRu: 'Стили речи и аргументация автора', titleKz: 'Сөйлеу стильдері мен автор дәлелдері', duration: '14 мин', status: 'locked', practiceAvailable: true },
        ],
      },
    ],
  },
  math_prof: {
    id: 'math_prof',
    code: '04',
    nameRu: 'Математика (профильная)',
    nameKz: 'Математика (бейіндік)',
    category: 'profile',
    chapters: [
      {
        id: 'ch-mp-trig',
        titleRu: 'Тригонометрия и уравнения',
        titleKz: 'Тригонометрия және теңдеулер',
        progressPercent: 0,
        completedLessonsCount: 0,
        totalLessonsCount: 2,
        lessons: [
          { id: 'l_mp_1', number: '1.1', titleRu: 'Формулы приведения и двойного угла', titleKz: 'Келтіру және қос бұрыш формулалары', duration: '18 мин', status: 'in_progress', practiceAvailable: true },
          { id: 'l_mp_2', number: '1.2', titleRu: 'Тригонометрические неравенства на окружности', titleKz: 'Шеңбердегі тригонометриялық теңсіздіктер', duration: '20 мин', status: 'locked', practiceAvailable: true },
        ],
      },
      {
        id: 'ch-mp-calc',
        titleRu: 'Производная и интеграл',
        titleKz: 'Туынды және интеграл',
        progressPercent: 0,
        completedLessonsCount: 0,
        totalLessonsCount: 2,
        lessons: [
          { id: 'l_mp_3', number: '2.1', titleRu: 'Геометрический смысл производной и касательная', titleKz: 'Туындының геометриялық мағынасы және жанама', duration: '16 мин', status: 'locked', practiceAvailable: true },
          { id: 'l_mp_4', number: '2.2', titleRu: 'Вычисление площадей фигур с помощью интеграла', titleKz: 'Интеграл арқылы фигуралар ауданын есептеу', duration: '22 мин', status: 'locked', practiceAvailable: true },
        ],
      },
    ],
  },
  physics: {
    id: 'physics',
    code: '05',
    nameRu: 'Физика',
    nameKz: 'Физика',
    category: 'profile',
    chapters: [
      {
        id: 'ch-phys-mech',
        titleRu: 'Механика и законы сохранения',
        titleKz: 'Механика және сақталу заңдары',
        progressPercent: 0,
        completedLessonsCount: 0,
        totalLessonsCount: 2,
        lessons: [
          { id: 'l_phys_1', number: '1.1', titleRu: 'Кинематика равноускоренного движения', titleKz: 'Бірқалыпты үдемелі қозғалыс кинематикасы', duration: '16 мин', status: 'in_progress', practiceAvailable: true },
          { id: 'l_phys_2', number: '1.2', titleRu: 'Закон сохранения импульса и энергии', titleKz: 'Импульс пен энергияның сақталу заңы', duration: '18 мин', status: 'locked', practiceAvailable: true },
        ],
      },
      {
        id: 'ch-phys-elec',
        titleRu: 'Электродинамика и магнетизм',
        titleKz: 'Электродинамика және магнетизм',
        progressPercent: 0,
        completedLessonsCount: 0,
        totalLessonsCount: 2,
        lessons: [
          { id: 'l_phys_3', number: '2.1', titleRu: 'Закон Ома для полной цепи и соединение проводников', titleKz: 'Толық тізбек үшін Ом заңы және өткізгіштерді қосу', duration: '15 мин', status: 'locked', practiceAvailable: true },
          { id: 'l_phys_4', number: '2.2', titleRu: 'Сила Лоренца и Ампера в магнитном поле', titleKz: 'Магнит өрісіндегі Лоренц және Ампер күші', duration: '20 мин', status: 'locked', practiceAvailable: true },
        ],
      },
    ],
  },
  biology: {
    id: 'biology',
    code: '06',
    nameRu: 'Биология',
    nameKz: 'Биология',
    category: 'profile',
    chapters: [
      {
        id: 'ch-bio-cell',
        titleRu: 'Клеточная биология и генетика',
        titleKz: 'Жасушалық биология және генетика',
        progressPercent: 0,
        completedLessonsCount: 0,
        totalLessonsCount: 2,
        lessons: [
          { id: 'l_bio_1', number: '1.1', titleRu: 'Строение клетки: органоиды и их функции', titleKz: 'Жасушаның құрылысы: органоидтар және олардың қызметі', duration: '15 мин', status: 'in_progress', practiceAvailable: true },
          { id: 'l_bio_2', number: '1.2', titleRu: 'Законы Менделя и решение генетических задач', titleKz: 'Мендель заңдары және генетикалық есептерді шығару', duration: '18 мин', status: 'locked', practiceAvailable: true },
        ],
      },
      {
        id: 'ch-bio-human',
        titleRu: 'Анатомия человека',
        titleKz: 'Адам анатомиясы',
        progressPercent: 0,
        completedLessonsCount: 0,
        totalLessonsCount: 2,
        lessons: [
          { id: 'l_bio_3', number: '2.1', titleRu: 'Кровеносная система и круги кровообращения', titleKz: 'Қан айналым жүйесі және қан айналым шеңберлері', duration: '16 мин', status: 'locked', practiceAvailable: true },
          { id: 'l_bio_4', number: '2.2', titleRu: 'Нервная система и рефлекторная дуга', titleKz: 'Жүйке жүйесі және рефлекторлық доға', duration: '18 мин', status: 'locked', practiceAvailable: true },
        ],
      },
    ],
  },
  chemistry: {
    id: 'chemistry',
    code: '07',
    nameRu: 'Химия',
    nameKz: 'Химия',
    category: 'profile',
    chapters: [
      {
        id: 'ch-chem-inorg',
        titleRu: 'Периодический закон и расчетные задачи',
        titleKz: 'Периодтық заң және есептеулер',
        progressPercent: 0,
        completedLessonsCount: 0,
        totalLessonsCount: 2,
        lessons: [
          { id: 'l_chem_1', number: '1.1', titleRu: 'Строение электронных оболочек и степени окисления', titleKz: 'Электрондық қабаттардың құрылысы және тотығу дәрежесі', duration: '16 мин', status: 'in_progress', practiceAvailable: true },
          { id: 'l_chem_2', number: '1.2', titleRu: 'Окислительно-восстановительные реакции методом баланса', titleKz: 'Электрондық баланс әдісімен тотығу-тотықсыздану реакциялары', duration: '20 мин', status: 'locked', practiceAvailable: true },
        ],
      },
      {
        id: 'ch-chem-org',
        titleRu: 'Органическая химия',
        titleKz: 'Органикалық химия',
        progressPercent: 0,
        completedLessonsCount: 0,
        totalLessonsCount: 2,
        lessons: [
          { id: 'l_chem_3', number: '2.1', titleRu: 'Углеводороды: алканы, алкены и алкины', titleKz: 'Көмірсутектер: алкандар, алкендер және алкиндер', duration: '18 мин', status: 'locked', practiceAvailable: true },
          { id: 'l_chem_4', number: '2.2', titleRu: 'Спирты, альдегиды и карбоновые кислоты', titleKz: 'Спирттер, альдегидтер және карбон қышқылдары', duration: '18 мин', status: 'locked', practiceAvailable: true },
        ],
      },
    ],
  },
  geography: {
    id: 'geography',
    code: '08',
    nameRu: 'География',
    nameKz: 'География',
    category: 'profile',
    chapters: [
      {
        id: 'ch-geo-kz',
        titleRu: 'Физическая и экономическая география РК',
        titleKz: 'ҚР физикалық және экономикалық географиясы',
        progressPercent: 0,
        completedLessonsCount: 0,
        totalLessonsCount: 2,
        lessons: [
          { id: 'l_geo_1', number: '1.1', titleRu: 'Рельеф, полезные ископаемые и климатические пояса РК', titleKz: 'ҚР жер бедері, пайдалы қазбалары және климаттық белдеулері', duration: '16 мин', status: 'in_progress', practiceAvailable: true },
          { id: 'l_geo_2', number: '1.2', titleRu: 'Экономические районы и промышленность Казахстана', titleKz: 'Қазақстанның экономикалық аудандары мен өнеркәсібі', duration: '18 мин', status: 'locked', practiceAvailable: true },
        ],
      },
    ],
  },
  world_history: {
    id: 'world_history',
    code: '09',
    nameRu: 'Всемирная история',
    nameKz: 'Дүниежүзі тарихы',
    category: 'profile',
    chapters: [
      {
        id: 'ch-wh-modern',
        titleRu: 'Новая и новейшая история',
        titleKz: 'Жаңа және қазіргі заман тарихы',
        progressPercent: 0,
        completedLessonsCount: 0,
        totalLessonsCount: 2,
        lessons: [
          { id: 'l_wh_1', number: '1.1', titleRu: 'Эпоха Просвещения и буржуазные революции', titleKz: 'Ағартушылық дәуірі және буржуазиялық революциялар', duration: '16 мин', status: 'in_progress', practiceAvailable: true },
          { id: 'l_wh_2', number: '1.2', titleRu: 'Первая мировая война и Версальско-Вашингтонская система', titleKz: 'Бірінші дүниежүзілік соғыс және Версаль-Вашингтон жүйесі', duration: '18 мин', status: 'locked', practiceAvailable: true },
        ],
      },
    ],
  },
};

/**
 * Rich lesson database with step-by-step reading modules.
 */
export interface LessonModule {
  id: string;
  subjectId: string;
  subjectNameRu: string;
  subjectNameKz: string;
  titleRu: string;
  titleKz: string;
  durationRu: string;
  durationKz: string;
  steps: {
    stepNumber: number;
    headingRu: string;
    headingKz: string;
    bodyRu: string;
    bodyKz: string;
    keyFactRu?: string;
    keyFactKz?: string;
    exampleRu?: string;
    exampleKz?: string;
  }[];
  checkpointQuestion: {
    questionRu: string;
    questionKz: string;
    options: { id: string; textRu: string; textKz: string }[];
    correctId: string;
    explanationRu: string;
    explanationKz: string;
  };
}

export const LESSON_MODULES: Record<string, LessonModule> = {
  'lesson-khanate-foundation': {
    id: 'lesson-khanate-foundation',
    subjectId: 'history_kz',
    subjectNameRu: 'История Казахстана',
    subjectNameKz: 'Қазақстан тарихы',
    titleRu: 'Образование Казахского ханства (1465 г.)',
    titleKz: 'Қазақ хандығының құрылуы (1465 ж.)',
    durationRu: '12 минут',
    durationKz: '12 минут',
    steps: [
      {
        stepNumber: 1,
        headingRu: 'Исторический фон: кризис Ханства Абулхаира',
        headingKz: 'Тарихи жағдай: Әбілқайыр хандығындағы дағдарыс',
        bodyRu: 'В 1450-х годах в Ханстве Абулхаира («Государстве кочевых узбеков») обострились внутренние феодальные междоусобицы и поражение от ойратов в 1457 году у Сыгнака. Жесткие поборы хана вызвали массовое недовольство родов.',
        bodyKz: '1450-жылдары Әбілқайыр хандығында («Көшпелі өзбектер мемлекеті») ішкі феодалдық тартыстар мен 1457 жылы Сығанақ түбінде ойраттардан жеңіліс жағдайды ушықтырды.',
        keyFactRu: '1457 год — Сыгнакская битва: поражение хана Абулхаира от ойратов.',
        keyFactKz: '1457 жыл — Сығанақ шайқасы: Әбілқайыр ханның ойраттардан жеңілуі.',
      },
      {
        stepNumber: 2,
        headingRu: 'Откочевка султанов Керея и Жанибека',
        headingKz: 'Керей мен Жәнібек сұлтандардың көшуі',
        bodyRu: 'Потомки Урус-хана султаны Керей и Жанибек в 1459–1460 гг. возглавили откочевку недовольных родов на восток, в пределы Семиречья (Могулистан). Хан Могулистана Есен-буга радушно принял их, рассчитывая использовать их силы как буфер против ойратов и Абулхаира.',
        bodyKz: 'Орыс ханның ұрпақтары Керей мен Жәнібек сұлтандар 1459–1460 жж. наразы руларды Жетісуға (Моғолстан) бастап барды. Моғолстан ханы Есенбұға оларды құшақ жая қарсы алды.',
        keyFactRu: 'Хан Могулистана Есен-буга выделил откочевавшим казахам земли в урочище Козыбаши в долине реки Чу.',
        keyFactKz: 'Моғолстан ханы Есенбұға Шу алқабындағы Қозыбасы өңірін бөлді.',
      },
      {
        stepNumber: 3,
        headingRu: 'Провозглашение ханства и историческое значение',
        headingKz: 'Хандықтың жариялануы және тарихи маңызы',
        bodyRu: 'В 1465 году в урочище Козыбаши (долина реки Чу) было официально провозглашено создание Казахского ханства. Первым ханом стал Керей как старший по возрасту, а его соправителем — Жанибек. Согласно историку Мухаммаду Хайдару Дулати в «Тарих-и Рашиди», это положило начало суверенной казахской государственности.',
        bodyKz: '1465 жылы Қозыбасы өңірінде Қазақ хандығы құрылды. Жасы үлкен болғандықтан Керей хан сайланды, оның серігі Жәнібек болды. Мұхаммед Хайдар Дулати «Тарихи Рашиди» еңбегінде осы оқиғаны жазады.',
        keyFactRu: '«Тарих-и Рашиди» Мухаммада Хайдара Дулати — главный письменный источник о дате основания ханства (870 г. хиджры / 1465–1466 гг.).',
        keyFactKz: 'Мұхаммед Хайдар Дулатидің «Тарихи Рашиди» еңбегі — хандықтың құрылуы туралы негізгі дереккөз.',
      },
    ],
    checkpointQuestion: {
      questionRu: 'В каком урочище султаны Керей и Жанибек основали ставку Казахского ханства в 1465 году?',
      questionKz: '1465 жылы Керей мен Жәнібек сұлтандар Қазақ хандығының алғашқы ордасын қай өңірде құрды?',
      options: [
        { id: 'A', textRu: 'В низовьях Сырдарьи у Сыгнака', textKz: 'Сығанақ маңындағы Сырдария төменгі ағысы' },
        { id: 'B', textRu: 'В урочище Козыбаши в долине реки Чу', textKz: 'Шу алқабындағы Қозыбасы өңірінде' },
        { id: 'C', textRu: 'В предгорьях Улытау в Сарыарке', textKz: 'Сарыарқадағы Ұлытау баурайында' },
        { id: 'D', textRu: 'В оазисе Отрара', textKz: 'Отырар оазисінде' },
      ],
      correctId: 'B',
      explanationRu: 'Верно! Именно в урочище Козыбаши в западном Семиречье хан Могулистана Есен-буга выделил земли, где в 1465 году зародилась казахская государственность.',
      explanationKz: 'Дұрыс! Дәл осы Шу бойындағы Қозыбасы өңірінде 1465 жылы Қазақ хандығы шаңырақ көтерді.',
    },
  },
  'l_ml_1': {
    id: 'l_ml_1',
    subjectId: 'math_lit',
    subjectNameRu: 'Математическая грамотность',
    subjectNameKz: 'Математикалық сауаттылық',
    titleRu: 'Быстрый расчет процентов без формул',
    titleKz: 'Формуласыз пайыздарды жылдам есептеу',
    durationRu: '10 минут',
    durationKz: '10 минут',
    steps: [
      {
        stepNumber: 1,
        headingRu: 'Базовый метод опорных долей (10%, 5%, 1%)',
        headingKz: 'Негізгі тірек үлестер әдісі (10%, 5%, 1%)',
        bodyRu: 'Любой процент на ЕНТ рассчитывается в уме за 5 секунд через сдвиг запятой: 10% — сдвиг запятой на 1 знак влево. 1% — на 2 знака влево. 5% — это половина от 10%.',
        bodyKz: 'Кез келген пайыз 5 секундта есептеледі: 10% — үтірді солға 1 таңбаға жылжыту. 1% — 2 таңбаға жылжыту. 5% — 10%-дың жартысы.',
        exampleRu: 'Найти 15% от 420: 10% = 42. 5% = 21. 15% = 42 + 21 = 63.',
        exampleKz: '420-ның 15%-ын табу: 10% = 42. 5% = 21. 15% = 42 + 21 = 63.',
      },
      {
        stepNumber: 2,
        headingRu: 'Мультипликативное наложение скидок и наценок',
        headingKz: 'Жеңілдіктер мен үстемелердің көбейтінділік сипаты',
        bodyRu: 'Ловушка ЕНТ: если цена упала на 20%, а затем выросла на 20%, она НЕ осталась прежней! Изменение считается умножением: P * 0.8 * 1.2 = 0.96 * P (цена упала на 4%).',
        bodyKz: 'ҰБТ қақпаны: егер баға 20%-ға төмендеп, содан кейін 20%-ға өссе, ол бұрынғыдай қалмайды: P * 0.8 * 1.2 = 0.96 * P (баға 4%-ға азайды).',
        keyFactRu: 'Проценты перемножаются коэффициентами: (1 - 0.20) * (1 + 0.25) = 0.8 * 1.25 = 1.0 (исходная цена).',
        keyFactKz: 'Пайыздар коэффициенттермен көбейтіледі: 0.8 * 1.25 = 1.0.',
      },
    ],
    checkpointQuestion: {
      questionRu: 'Цена товара снизилась на 20%, а затем выросла на 25%. Как изменилась первоначальная цена?',
      questionKz: 'Тауар бағасы 20%-ға арзандап, содан соң 25%-ға қымбаттады. Бастапқы баға қалай өзгерді?',
      options: [
        { id: 'A', textRu: 'Увеличилась на 5%', textKz: '5%-ға өсті' },
        { id: 'B', textRu: 'Не изменилась', textKz: 'Өзгерген жоқ' },
        { id: 'C', textRu: 'Уменьшилась на 5%', textKz: '5%-ға азайды' },
        { id: 'D', textRu: 'Увеличилась на 2.5%', textKz: '2.5%-ға өсті' },
      ],
      correctId: 'B',
      explanationRu: 'Верно! 100% * 0.8 * 1.25 = 100%. Исходная цена полностью сохранилась.',
      explanationKz: 'Дұрыс! 100% * 0.8 * 1.25 = 100%. Бастапқы баға өзгеріссіз қалды.',
    },
  },
  'l_phys_1': {
    id: 'l_phys_1',
    subjectId: 'physics',
    subjectNameRu: 'Физика',
    subjectNameKz: 'Физика',
    titleRu: 'Кинематика равноускоренного движения',
    titleKz: 'Бірқалыпты үдемелі қозғалыс кинематикасы',
    durationRu: '16 минут',
    durationKz: '16 минут',
    steps: [
      {
        stepNumber: 1,
        headingRu: 'Уравнения скорости и перемещения',
        headingKz: 'Жылдамдық пен орын ауыстыру теңдеулері',
        bodyRu: 'При постоянном ускорении a = const: v = v0 + at. Перемещение: s = v0*t + (a*t^2)/2. Безвременная формула: v^2 - v0^2 = 2as.',
        bodyKz: 'Тұрақты үдеуде a = const: v = v0 + at. Орын ауыстыру: s = v0*t + (a*t^2)/2. Уақытсыз формула: v^2 - v0^2 = 2as.',
        keyFactRu: 'Безвременная формула v^2 - v0^2 = 2as экономит время, когда t неизвестно.',
        keyFactKz: 'Уақытсыз формула v^2 - v0^2 = 2as уақыт белгісіз болғанда өте пайдалы.',
      },
    ],
    checkpointQuestion: {
      questionRu: 'Автомобиль трогается с места с ускорением 2 м/с². Какой путь он пройдет за 4 секунды?',
      questionKz: 'Автомобиль орнынан 2 м/с² үдеумен қозғала бастады. 4 секундта ол қандай жол жүреді?',
      options: [
        { id: 'A', textRu: '8 м', textKz: '8 м' },
        { id: 'B', textRu: '16 м', textKz: '16 м' },
        { id: 'C', textRu: '32 м', textKz: '32 м' },
        { id: 'D', textRu: '4 м', textKz: '4 м' },
      ],
      correctId: 'B',
      explanationRu: 'Верно! s = (a*t^2)/2 = (2 * 4^2) / 2 = 16 метров.',
      explanationKz: 'Дұрыс! s = (2 * 16) / 2 = 16 метр.',
    },
  },
  'l_bio_1': {
    id: 'l_bio_1',
    subjectId: 'biology',
    subjectNameRu: 'Биология',
    subjectNameKz: 'Биология',
    titleRu: 'Строение клетки: органоиды и их функции',
    titleKz: 'Жасушаның құрылысы: органоидтар және олардың қызметі',
    durationRu: '15 минут',
    durationKz: '15 минут',
    steps: [
      {
        stepNumber: 1,
        headingRu: 'Двумембранные органоиды: митохондрии и пластиды',
        headingKz: 'Қос мембраналы органоидтар: митохондрия мен пластидтер',
        bodyRu: 'Митохондрии — энергетические станции клетки, синтезирующие АТФ в процессе клеточного дыхания. Имеют собственную кольцевую ДНК и рибосомы 70S.',
        bodyKz: 'Митохондриялар — АТФ синтездейтін жасушаның энергетикалық станциясы. Өзіндік сақиналы ДНҚ мен рибосомалары бар.',
        keyFactRu: 'Синтез АТФ происходит на кристах внутренней мембраны митохондрий.',
        keyFactKz: 'АТФ синтезі митохондрияның ішкі мембранасының кристаларында жүреді.',
      },
    ],
    checkpointQuestion: {
      questionRu: 'Какой органоид клетки отвечает за синтез молекул АТФ?',
      questionKz: 'Жасушада АТФ молекулаларының синтезіне қандай органоид жауапты?',
      options: [
        { id: 'A', textRu: 'Рибосома', textKz: 'Рибосома' },
        { id: 'B', textRu: 'Митохондрия', textKz: 'Митохондрия' },
        { id: 'C', textRu: 'Комплекс Гольджи', textKz: 'Гольджи жиынтығы' },
        { id: 'D', textRu: 'Лизосома', textKz: 'Лизосома' },
      ],
      correctId: 'B',
      explanationRu: 'Верно! Митохондрии осуществляют окислительное фосфорилирование и синтезируют АТФ.',
      explanationKz: 'Дұрыс! Митохондриялар АТФ молекулаларын синтездейді.',
    },
  },
};
