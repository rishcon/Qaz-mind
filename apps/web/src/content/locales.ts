import { Language } from '../types';

/**
 * Landing copy. Short on purpose: the page shows the product, the text only names it.
 * Nothing here claims a result, a price or a feature that does not exist yet.
 */
export interface LocaleContent {
  nav: { subjects: string; howItWorks: string; login: string; start: string };
  hero: {
    label: string;
    title: string;
    subtitle: string;
    cta: string;
    secondary: string;
    facts: Array<{ value: string; label: string }>;
  };
  window: {
    caption: string;
    menu: string[];
    firstStep: string;
    firstStepTitle: string;
    action: string;
    cards: string[];
  };
  exam: {
    label: string;
    title: string;
    caption: string;
    note: string;
    mandatory: string;
    profile: string;
    tasks: string;
    points: string;
  };
  steps: { label: string; items: [string, string, string] };
  school: { label: string; title: string; caption: string; tag: string; columns: [string, string, string] };
  finalCta: { title: string; cta: string };
  footer: { tagline: string; copyright: string };
}

export const locales: Record<Language, LocaleContent> = {
  ru: {
    nav: { subjects: 'Предметы', howItWorks: 'Как это работает', login: 'Войти', start: 'Начать' },
    hero: {
      label: 'ПОДГОТОВКА К ЕНТ',
      title: 'ЕНТ по темам,\nа не наугад.',
      subtitle: 'Уроки, задания и разбор ошибок в одном кабинете.',
      cta: 'Начать подготовку',
      secondary: 'Как это работает',
      facts: [
        { value: '120', label: 'заданий на экзамене' },
        { value: '140', label: 'баллов максимум' },
        { value: '240', label: 'минут' },
      ],
    },
    window: {
      caption: 'Схема личного кабинета',
      menu: ['Сегодня', 'Мой маршрут', 'Предметы', 'Практика', 'Пробное ЕНТ', 'Мои ошибки', 'Прогресс'],
      firstStep: 'Первый шаг',
      firstStepTitle: 'Начните с первого урока',
      action: 'К предметам',
      cards: ['Моя цель', 'Изучено уроков', 'Ошибок к повторению'],
    },
    exam: {
      label: 'СТРУКТУРА ЭКЗАМЕНА',
      title: 'Экзамен по спецификации.',
      caption: 'Три обязательных предмета и два профильных, которые выбираете вы.',
      note: 'Пробный экзамен откроется, когда в банке появятся опубликованные вопросы.',
      mandatory: 'Обязательные',
      profile: 'Профильные',
      tasks: 'заданий',
      points: 'баллов',
    },
    steps: {
      label: 'КАК ЭТО РАБОТАЕТ',
      items: ['Выберите предметы ЕНТ', 'Учитесь по темам', 'Решайте и разбирайте ошибки'],
    },
    school: {
      label: 'ДЛЯ ШКОЛ',
      title: 'Классы и задания учителя.',
      caption: 'Кабинет школы в разработке.',
      tag: 'В разработке',
      columns: ['Классы', 'Ученики', 'Задания'],
    },
    finalCta: { title: 'Начните подготовку сегодня.', cta: 'Создать аккаунт' },
    footer: { tagline: 'Подготовка к ЕНТ и ҰБТ', copyright: '© QAZMIND' },
  },
  kz: {
    nav: { subjects: 'Пәндер', howItWorks: 'Қалай жұмыс істейді', login: 'Кіру', start: 'Бастау' },
    hero: {
      label: 'ҰБТ-ҒА ДАЙЫНДЫҚ',
      title: 'ҰБТ тақырыптар бойынша,\nжүйелі түрде.',
      subtitle: 'Сабақтар, тапсырмалар және қателерді талдау — бір кабинетте.',
      cta: 'Дайындықты бастау',
      secondary: 'Қалай жұмыс істейді',
      facts: [
        { value: '120', label: 'емтихандағы тапсырма' },
        { value: '140', label: 'ең көп балл' },
        { value: '240', label: 'минут' },
      ],
    },
    window: {
      caption: 'Оқушы кабинетінің сызбасы',
      menu: ['Бүгін', 'Менің маршрутым', 'Пәндер', 'Практика', 'Байқау ҰБТ-сы', 'Менің қателерім', 'Прогресс'],
      firstStep: 'Бірінші қадам',
      firstStepTitle: 'Алғашқы сабақтан бастаңыз',
      action: 'Пәндерге',
      cards: ['Менің мақсатым', 'Оқылған сабақтар', 'Қайталауға қателер'],
    },
    exam: {
      label: 'ЕМТИХАН ҚҰРЫЛЫМЫ',
      title: 'Спецификация бойынша емтихан.',
      caption: 'Үш міндетті пән және екі бейіндік пән. Бейіндіктерін өзіңіз таңдайсыз.',
      note: 'Байқау емтиханы жарияланған сұрақтар банкте пайда болғанда ашылады.',
      mandatory: 'Міндетті',
      profile: 'Бейіндік',
      tasks: 'тапсырма',
      points: 'балл',
    },
    steps: {
      label: 'ҚАЛАЙ ЖҰМЫС ІСТЕЙДІ',
      items: ['ҰБТ пәндерін таңдаңыз', 'Тақырыптар бойынша оқыңыз', 'Тапсырма шешіп, қателерді талдаңыз'],
    },
    school: {
      label: 'МЕКТЕПТЕР ҮШІН',
      title: 'Сынып пен мұғалім тапсырмалары.',
      caption: 'Мектеп кабинеті әзірленуде.',
      tag: 'Әзірленуде',
      columns: ['Сыныптар', 'Оқушылар', 'Тапсырмалар'],
    },
    finalCta: { title: 'Дайындықты бүгіннен бастаңыз.', cta: 'Аккаунт ашу' },
    footer: { tagline: 'ҰБТ және ЕНТ-ге дайындық', copyright: '© QAZMIND' },
  },
};
