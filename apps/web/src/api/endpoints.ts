import { apiRequest, ApiError } from './client';

// ----- DTOs returned by /api/v1 (snake_case, as on the server) ---------------------------------

export interface ApiUser {
  id: string;
  name: string;
  email: string;
  email_verified: boolean;
  created_at: string;
}

export interface MeResponse {
  user: ApiUser;
  onboarding_completed: boolean;
}

export interface StatusResponse {
  status: string;
}

export interface ApiProfile {
  interface_lang: 'ru' | 'kz';
  exam_lang: 'ru' | 'kz';
  profile_pair_id: string;
  target_score: number;
  exam_year: number;
  exam_period: 'june_main' | 'march_paid' | 'ent_2027';
  daily_goal_minutes: number;
  onboarding_completed_at: string | null;
}

export interface ApiProfilePair {
  id: string;
  code: string;
  title_ru: string;
  title_kz: string;
  cluster_ru: string;
  cluster_kz: string;
  subject_codes: string[];
}

export interface OnboardingPayload {
  interface_lang: 'ru' | 'kz';
  exam_lang: 'ru' | 'kz';
  profile_pair_id: string;
  target_score: number;
  exam_year: number;
  exam_period: ApiProfile['exam_period'];
  daily_goal_minutes: number;
}

export type ProfilePatch = Partial<OnboardingPayload>;

// ----- auth ------------------------------------------------------------------------------------

export const authApi = {
  register: (name: string, email: string, password: string) =>
    apiRequest<StatusResponse>('POST', '/auth/register', { name, email, password }),
  verifyEmail: (token: string) => apiRequest<MeResponse>('POST', '/auth/verify-email', { token }),
  resendVerification: (email: string) => apiRequest<StatusResponse>('POST', '/auth/resend-verification', { email }),
  login: (email: string, password: string) => apiRequest<MeResponse>('POST', '/auth/login', { email, password }),
  logout: () => apiRequest<void>('POST', '/auth/logout'),
  me: () => apiRequest<MeResponse>('GET', '/auth/me'),
  forgotPassword: (email: string) => apiRequest<StatusResponse>('POST', '/auth/password/forgot', { email }),
  resetPassword: (token: string, password: string) =>
    apiRequest<StatusResponse>('POST', '/auth/password/reset', { token, password }),
};

// ----- profile ---------------------------------------------------------------------------------

export const profileApi = {
  /** Returns null when onboarding has not been completed yet (the server answers 404). */
  getProfile: async (): Promise<ApiProfile | null> => {
    try {
      return await apiRequest<ApiProfile>('GET', '/me/profile');
    } catch (error) {
      if (error instanceof ApiError && error.status === 404) return null;
      throw error;
    }
  },
  completeOnboarding: (payload: OnboardingPayload) =>
    apiRequest<ApiProfile>('POST', '/me/onboarding/complete', payload),
  updateProfile: (patch: ProfilePatch) => apiRequest<ApiProfile>('PATCH', '/me/profile', patch),
  listProfilePairs: () => apiRequest<ApiProfilePair[]>('GET', '/catalog/profile-pairs'),
};

// ----- curriculum and lessons (stage 4) --------------------------------------------------------

export type LessonProgressState = 'not_started' | 'in_progress' | 'completed';

export interface ApiLessonProgress {
  state: LessonProgressState;
  last_step: number;
  completed_at: string | null;
}

export interface ApiSubject {
  id: string;
  code: string;
  title_ru: string;
  title_kz: string;
  category: 'mandatory' | 'profile';
  /** Lessons with a published version. Zero means the material is not ready. */
  published_lessons: number;
}

export interface ApiCurriculum {
  subject: ApiSubject;
  topics: {
    slug: string;
    title_ru: string;
    title_kz: string;
    lessons: {
      slug: string;
      title_ru: string;
      title_kz: string;
      estimated_minutes: number;
      progress: ApiLessonProgress;
    }[];
  }[];
}

export interface ApiLessonStep {
  index: number;
  heading_ru: string;
  heading_kz: string;
  body_ru: string;
  body_kz: string;
  key_fact_ru: string | null;
  key_fact_kz: string | null;
  example_ru: string | null;
  example_kz: string | null;
}

export interface ApiLesson {
  slug: string;
  subject_id: string;
  topic_slug: string;
  title_ru: string;
  title_kz: string;
  estimated_minutes: number;
  source_reference: string;
  version: number;
  steps: ApiLessonStep[];
  progress: ApiLessonProgress;
}

export interface ApiProgressRecord {
  lesson_slug: string;
  state: LessonProgressState;
  last_step: number;
  completed_at: string | null;
}

export const learningApi = {
  listSubjects: () => apiRequest<ApiSubject[]>('GET', '/subjects'),
  curriculum: (subjectId: string) =>
    apiRequest<ApiCurriculum>('GET', `/subjects/${encodeURIComponent(subjectId)}/curriculum`),
  lesson: (slug: string) => apiRequest<ApiLesson>('GET', `/lessons/${encodeURIComponent(slug)}`),
  saveProgress: (slug: string, lastStep: number, completed: boolean) =>
    apiRequest<ApiProgressRecord>('PUT', `/me/lessons/${encodeURIComponent(slug)}/progress`, {
      last_step: lastStep,
      completed,
    }),
  myProgress: () => apiRequest<ApiProgressRecord[]>('GET', '/me/progress'),
};

// ----- practice --------------------------------------------------------------------------------

export type OptionLabel = 'A' | 'B' | 'C' | 'D' | 'E';

export interface ApiPracticeSubject {
  subject_id: string;
  /** Published questions available for practice. */
  available: number;
}

export interface ApiPracticeOption {
  label: OptionLabel;
  text_ru: string;
  text_kz: string;
}

export interface ApiPracticeQuestion {
  id: string;
  difficulty: 'easy' | 'medium' | 'hard';
  text_ru: string;
  text_kz: string;
  options: ApiPracticeOption[];
}

/** Present only for a question that was already answered: the server reveals the key after the answer is saved. */
export interface ApiPracticeReview {
  selected_label: OptionLabel;
  correct_label: OptionLabel;
  is_correct: boolean;
  explanation_ru: string;
  explanation_kz: string;
}

export interface ApiPracticeSession {
  id: string;
  subject_id: string;
  created_at: string;
  finished_at: string | null;
  total: number;
  answered: number;
  correct: number;
  items: { question: ApiPracticeQuestion; review: ApiPracticeReview | null }[];
}

export const practiceApi = {
  subjects: () => apiRequest<ApiPracticeSubject[]>('GET', '/practice/subjects'),
  stats: () => apiRequest<{ answered: number; correct: number }>('GET', '/practice/stats'),
  start: (subjectId: string, count: number) =>
    apiRequest<ApiPracticeSession>('POST', '/practice/sessions', { subject_id: subjectId, count }),
  session: (id: string) => apiRequest<ApiPracticeSession>('GET', `/practice/sessions/${encodeURIComponent(id)}`),
  answer: (id: string, questionId: string, label: OptionLabel) =>
    apiRequest<ApiPracticeReview>('POST', `/practice/sessions/${encodeURIComponent(id)}/answers`, {
      question_id: questionId,
      selected_label: label,
    }),
  finish: (id: string) => apiRequest<ApiPracticeSession>('POST', `/practice/sessions/${encodeURIComponent(id)}/finish`),
};
