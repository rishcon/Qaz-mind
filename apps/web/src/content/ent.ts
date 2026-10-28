import { SubjectItem } from '../types';

/**
 * ENT subject catalogue. Names and exam structure come from the ENT specification in the technical spec:
 * 120 tasks and 140 points in total; history 20 tasks, reading 10, mathematical literacy 10; every profile
 * subject has 40 tasks worth 50 points. Only the profile subjects are stated with points.
 */
export const ENT_SUBJECTS: SubjectItem[] = [
  {
    id: 'history_kz',
    code: '01',
    nameRu: 'История Казахстана',
    nameKz: 'Қазақстан тарихы',
    category: 'mandatory',
    examTasks: 20,
  },
  {
    id: 'math_lit',
    code: '02',
    nameRu: 'Математическая грамотность',
    nameKz: 'Математикалық сауаттылық',
    category: 'mandatory',
    examTasks: 10,
  },
  {
    id: 'reading_lit',
    code: '03',
    nameRu: 'Грамотность чтения',
    nameKz: 'Оқу сауаттылығы',
    category: 'mandatory',
    examTasks: 10,
  },
  {
    id: 'math_prof',
    code: '04',
    nameRu: 'Математика',
    nameKz: 'Математика',
    category: 'profile',
    examTasks: 40,
    examPoints: 50,
  },
  {
    id: 'physics',
    code: '05',
    nameRu: 'Физика',
    nameKz: 'Физика',
    category: 'profile',
    examTasks: 40,
    examPoints: 50,
  },
  {
    id: 'biology',
    code: '06',
    nameRu: 'Биология',
    nameKz: 'Биология',
    category: 'profile',
    examTasks: 40,
    examPoints: 50,
  },
  {
    id: 'chemistry',
    code: '07',
    nameRu: 'Химия',
    nameKz: 'Химия',
    category: 'profile',
    examTasks: 40,
    examPoints: 50,
  },
  {
    id: 'geography',
    code: '08',
    nameRu: 'География',
    nameKz: 'География',
    category: 'profile',
    examTasks: 40,
    examPoints: 50,
  },
  {
    id: 'world_history',
    code: '09',
    nameRu: 'Всемирная история',
    nameKz: 'Дүниежүзі тарихы',
    category: 'profile',
    examTasks: 40,
    examPoints: 50,
  },
];
