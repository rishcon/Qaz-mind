import { Language } from './index';

export type DashboardView =
  | 'today'
  | 'route'
  | 'subjects'
  | 'subject_detail'
  | 'lesson_reader'
  | 'practice'
  | 'mock_exam'
  | 'mistakes'
  | 'progress'
  | 'settings';

export type StudentStateType = 'returning' | 'new';

export interface DailyTask {
  id: string;
  number: string;
  typeRu: string;
  typeKz: string;
  subjectRu: string;
  subjectKz: string;
  titleRu: string;
  titleKz: string;
  durationRu: string;
  durationKz: string;
  completed: boolean;
  actionView: DashboardView;
  lessonId?: string;
}

export interface LessonItem {
  id: string;
  number: string;
  titleRu: string;
  titleKz: string;
  duration: string;
  status: 'completed' | 'in_progress' | 'locked';
  practiceAvailable: boolean;
}

export interface SyllabusChapter {
  id: string;
  titleRu: string;
  titleKz: string;
  progressPercent: number;
  completedLessonsCount: number;
  totalLessonsCount: number;
  lessons: LessonItem[];
}

export interface MistakeItem {
  id: string;
  subjectRu: string;
  subjectKz: string;
  topicRu: string;
  topicKz: string;
  questionTextRu: string;
  questionTextKz: string;
  studentAnswerRu: string;
  studentAnswerKz: string;
  correctAnswerRu: string;
  correctAnswerKz: string;
  explanationRu: string;
  explanationKz: string;
  priority: 'high' | 'medium' | 'resolved';
  resolved: boolean;
}

export interface MockExamHistory {
  id: string;
  date: string;
  score: number;
  totalScore: number;
  subjectScores: {
    nameRu: string;
    nameKz: string;
    score: number;
    maxScore: number;
  }[];
}

export interface StudentProfile {
  name: string;
  grade: string;
  city: string;
  targetScore: number;
  examLanguage: 'kz' | 'ru';
  profilePairId: string;
  profilePairLabelRu: string;
  profilePairLabelKz: string;
  examDate: string;
  dailyGoalMinutes: number;
}
