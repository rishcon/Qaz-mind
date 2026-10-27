export type Language = 'ru' | 'kz';

export interface QuestionOption {
  id: string;
  textRu: string;
  textKz: string;
}

export interface Question {
  id: string;
  subjectRu: string;
  subjectKz: string;
  topicRu: string;
  topicKz: string;
  lessonStep: string; // e.g. "03 / 08"
  questionRu: string;
  questionKz: string;
  options: QuestionOption[];
  correctOptionId: string;
  explanationRu: string;
  explanationKz: string;
}

export interface ExamQuestion {
  id: number;
  subjectRu: string;
  subjectKz: string;
  questionRu: string;
  questionKz: string;
  options: {
    id: string;
    textRu: string;
    textKz: string;
  }[];
  correctId: string;
  explanationRu: string;
  explanationKz: string;
}

export interface SubjectItem {
  id: string;
  code: string;
  nameRu: string;
  nameKz: string;
  category: 'mandatory' | 'profile';
  status: 'available' | 'beta' | 'in_development';
  statusLabelRu: string;
  statusLabelKz: string;
  questionsCount: number;
  topicsCount: number;
  descriptionRu: string;
  descriptionKz: string;
}

export interface RouteStep {
  step: string;
  titleRu: string;
  titleKz: string;
  subtitleRu: string;
  subtitleKz: string;
  descriptionRu: string;
  descriptionKz: string;
  status: 'completed' | 'current' | 'upcoming';
  durationRu: string;
  durationKz: string;
  kpiRu: string;
  kpiKz: string;
}

export type LearningAppTab = 'today' | 'subjects' | 'practice' | 'mock_ent' | 'mistakes' | 'progress';
