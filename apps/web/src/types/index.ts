export type Language = 'ru' | 'kz';

/** An ENT subject. The exam structure comes from the ENT specification, not from the content bank. */
export interface SubjectItem {
  id: string;
  code: string;
  nameRu: string;
  nameKz: string;
  category: 'mandatory' | 'profile';
  /** Tasks in the exam for this subject, per the ENT specification. */
  examTasks: number;
  /** Points for this subject in the 140-point exam. The specification states them for profile subjects only. */
  examPoints?: number;
  descriptionRu: string;
  descriptionKz: string;
}

/** One stage of the learning route. Stages carry no progress or duration: none of that is known yet. */
export interface RouteStep {
  step: string;
  titleRu: string;
  titleKz: string;
  subtitleRu: string;
  subtitleKz: string;
  descriptionRu: string;
  descriptionKz: string;
}
