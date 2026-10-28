export type DashboardView =
  | 'today'
  | 'route'
  | 'subjects'
  | 'practice'
  | 'mock_exam'
  | 'mistakes'
  | 'assignments'
  | 'progress'
  | 'settings';

/** A question the student answered wrongly, as stored on the server. `id` is the question id. */
export interface MistakeItem {
  id: string;
  subjectRu: string;
  subjectKz: string;
  questionTextRu: string;
  questionTextKz: string;
  options: { label: string; textRu: string; textKz: string }[];
  wrongLabel: string;
  correctLabel: string;
  explanationRu: string;
  explanationKz: string;
  wrongCount: number;
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
