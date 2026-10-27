/**
 * Russian names of the ENT subjects, by the same identifiers as the server catalog (subjects.id in the database).
 * These are reference names of the official exam structure, not data about users or results.
 */
export const SUBJECT_NAMES_RU: Record<string, string> = {
  history_kz: 'История Казахстана',
  math_lit: 'Математическая грамотность',
  reading_lit: 'Грамотность чтения',
  math_prof: 'Математика (профильная)',
  physics: 'Физика',
  biology: 'Биология',
  chemistry: 'Химия',
  geography: 'География',
  world_history: 'Всемирная история',
  kaz_lang: 'Казахский язык',
  kaz_lit: 'Казахская литература',
  english: 'Иностранный язык',
};

export const subjectNameRu = (subjectId: string): string => SUBJECT_NAMES_RU[subjectId] ?? subjectId;
