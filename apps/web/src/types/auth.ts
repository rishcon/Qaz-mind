import { Language } from './index';

export interface UserAccount {
  id: string;
  name: string;
  email: string;
  isEmailVerified: boolean;
  createdAt: string;
}

export interface OnboardingState {
  completed: boolean;
  step: number; // 1 | 2 | 3 | 4
  interfaceLang: Language;
  profilePairId: string;
  targetScore: number;
  examYear: string;
  examPeriod: string;
  dailyGoalMinutes: number;
}

export interface OfficialProfilePair {
  id: string;
  code: string;
  titleRu: string;
  titleKz: string;
  clusterRu: string;
  clusterKz: string;
  subjectIds: [string, string];
  subjectNamesRu: [string, string];
  subjectNamesKz: [string, string];
}

export const OFFICIAL_PROFILE_PAIRS: OfficialProfilePair[] = [
  {
    id: 'math_phys',
    code: '01',
    titleRu: 'Математика + Физика',
    titleKz: 'Математика + Физика',
    clusterRu: 'Инженерия, IT, архитектура и строительство',
    clusterKz: 'Инженерия, IT, сәулет және құрылыс',
    subjectIds: ['math_prof', 'physics'],
    subjectNamesRu: ['Математика (профильная)', 'Физика'],
    subjectNamesKz: ['Математика (бейіндік)', 'Физика'],
  },
  {
    id: 'chem_bio',
    code: '02',
    titleRu: 'Биология + Химия',
    titleKz: 'Биология + Химия',
    clusterRu: 'Медицина, фармация, биотехнологии и ветеринария',
    clusterKz: 'Медицина, фармация, биотехнология және ветеринария',
    subjectIds: ['biology', 'chemistry'],
    subjectNamesRu: ['Биология', 'Химия'],
    subjectNamesKz: ['Биология', 'Химия'],
  },
  {
    id: 'geo_math',
    code: '03',
    titleRu: 'Математика + География',
    titleKz: 'Математика + География',
    clusterRu: 'Экономика, аудит, менеджмент, финансы и логистика',
    clusterKz: 'Экономика, аудит, менеджмент, қаржы және логистика',
    subjectIds: ['math_prof', 'geography'],
    subjectNamesRu: ['Математика (профильная)', 'География'],
    subjectNamesKz: ['Математика (бейіндік)', 'География'],
  },
  {
    id: 'hist_geo',
    code: '04',
    titleRu: 'Всемирная история + География',
    titleKz: 'Дүниежүзі тарихы + География',
    clusterRu: 'Юриспруденция, право, регионоведение и международные отношения',
    clusterKz: 'Заңтану, құқық, аймақтану және халықаралық қатынастар',
    subjectIds: ['world_history', 'geography'],
    subjectNamesRu: ['Всемирная история', 'География'],
    subjectNamesKz: ['Дүниежүзі тарихы', 'География'],
  },
  {
    id: 'kaz_lang_lit',
    code: '05',
    titleRu: 'Казахский язык + Казахская литература',
    titleKz: 'Қазақ тілі + Қазақ әдебиеті',
    clusterRu: 'Филология, журналистика, педагогика и издательское дело',
    clusterKz: 'Филология, журналистика, педагогика және баспа ісі',
    subjectIds: ['kaz_lang', 'kaz_lit'],
    subjectNamesRu: ['Казахский язык', 'Казахская литература'],
    subjectNamesKz: ['Қазақ тілі', 'Қазақ әдебиеті'],
  },
  {
    id: 'foreign_hist',
    code: '06',
    titleRu: 'Иностранный язык + Всемирная история',
    titleKz: 'Шетел тілі + Дүниежүзі тарихы',
    clusterRu: 'Лингвистика, переводческое дело, туризм и востоковедение',
    clusterKz: 'Лингвистика, аударма ісі, туризм және шығыстану',
    subjectIds: ['english', 'world_history'],
    subjectNamesRu: ['Иностранный язык', 'Всемирная история'],
    subjectNamesKz: ['Шетел тілі', 'Дүниежүзі тарихы'],
  },
];

export const MANDATORY_SUBJECT_IDS = ['history_kz', 'math_lit', 'reading_lit'] as const;
