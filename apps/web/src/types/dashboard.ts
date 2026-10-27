export type DashboardView =
  | 'today'
  | 'route'
  | 'subjects'
  | 'practice'
  | 'mock_exam'
  | 'mistakes'
  | 'progress'
  | 'settings';

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
