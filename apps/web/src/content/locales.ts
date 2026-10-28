import { Language } from '../types';

/**
 * Landing copy. Short on purpose: the page explains the product in a sentence and lets the visitor try the exam structure.
 * Nothing here claims a result, a price or a feature that does not exist yet.
 */
export interface LocaleContent {
  nav: { subjects: string; howItWorks: string; login: string; start: string };
  hero: {
    label: string;
    title: string;
    lead: string;
    today: string;
    format: string;
    cta: string;
    secondary: string;
  };
  steps: {
    label: string;
    soon: string;
    items: [{ title: string; text: string }, { title: string; text: string }, { title: string; text: string }];
  };
  build: {
    label: string;
    title: string;
    hint: string;
    mandatory: string;
    profile: string;
    pick: string;
    tasks: string;
    of: string;
    note: string;
  };
  cta: { title: string; button: string; school: string };
  footer: { tagline: string; copyright: string };
}

export const locales: Record<Language, LocaleContent> = {
  ru: {
    nav: { subjects: 'Собрать ЕНТ', howItWorks: 'Как это работает', login: 'Войти', start: 'Начать' },
    hero: {
      label: 'ПОДГОТОВКА К ЕНТ',
      title: 'ЕНТ — по одной\nтеме за раз.',
      lead: 'QazMind — платформа подготовки к ЕНТ: короткие уроки по темам, задания с разбором и личный кабинет, где виден ваш путь.',
      today: 'Сегодня',
      format: '120 заданий · 240 минут · до 140 баллов',
      cta: 'Начать подготовку',
      secondary: 'Как это работает',
    },
    steps: {
      label: 'КАК ЭТО РАБОТАЕТ',
      soon: 'скоро',
      items: [
        { title: 'Выберите предметы', text: 'Три обязательных и два профильных — как на экзамене.' },
        { title: 'Учитесь по темам', text: 'Короткие уроки: одна тема, один шаг.' },
        { title: 'Закрепляйте', text: 'Задания с разбором, ошибки возвращаются на повторение.' },
      ],
    },
    build: {
      label: 'ЭКЗАМЕН',
      title: 'Соберите свой ЕНТ.',
      hint: 'Выберите два профильных предмета — структура пересчитается.',
      mandatory: 'Обязательный',
      profile: 'Профильный',
      pick: 'Выберите',
      tasks: 'заданий',
      of: 'из',
      note: '240 минут · максимум 140 баллов · по спецификации ЕНТ',
    },
    cta: { title: 'Начните\nсегодня.', button: 'Создать аккаунт', school: 'Для школ — кабинет в разработке' },
    footer: { tagline: 'Подготовка к ЕНТ и ҰБТ', copyright: '© QAZMIND' },
  },
  kz: {
    nav: { subjects: 'ҰБТ құрастыру', howItWorks: 'Қалай жұмыс істейді', login: 'Кіру', start: 'Бастау' },
    hero: {
      label: 'ҰБТ-ҒА ДАЙЫНДЫҚ',
      title: 'ҰБТ — бір\nтақырыптан.',
      lead: 'QazMind — ҰБТ-ға дайындық платформасы: тақырыптар бойынша қысқа сабақтар, талдауы бар тапсырмалар және жолыңыз көрінетін жеке кабинет.',
      today: 'Бүгін',
      format: '120 тапсырма · 240 минут · 140 балға дейін',
      cta: 'Дайындықты бастау',
      secondary: 'Қалай жұмыс істейді',
    },
    steps: {
      label: 'ҚАЛАЙ ЖҰМЫС ІСТЕЙДІ',
      soon: 'жақында',
      items: [
        { title: 'Пәндерді таңдаңыз', text: 'Үш міндетті және екі бейіндік пән — емтихандағыдай.' },
        { title: 'Тақырып бойынша оқыңыз', text: 'Қысқа сабақтар: бір тақырып, бір қадам.' },
        { title: 'Бекітіңіз', text: 'Талдауы бар тапсырмалар, қателер қайталауға қайтады.' },
      ],
    },
    build: {
      label: 'ЕМТИХАН',
      title: 'Өз ҰБТ-ңызды жинаңыз.',
      hint: 'Екі бейіндік пәнді таңдаңыз — құрылым қайта есептеледі.',
      mandatory: 'Міндетті',
      profile: 'Бейіндік',
      pick: 'Таңдаңыз',
      tasks: 'тапсырма',
      of: '/',
      note: '240 минут · ең көбі 140 балл · ҰБТ спецификациясы бойынша',
    },
    cta: { title: 'Бүгіннен\nбастаңыз.', button: 'Аккаунт ашу', school: 'Мектептер үшін — кабинет әзірленуде' },
    footer: { tagline: 'ҰБТ және ЕНТ-ге дайындық', copyright: '© QAZMIND' },
  },
};
