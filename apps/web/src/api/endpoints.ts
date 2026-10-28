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

export interface ApiMistake {
  question_id: string;
  subject_id: string;
  difficulty: 'easy' | 'medium' | 'hard';
  text_ru: string;
  text_kz: string;
  options: ApiPracticeOption[];
  correct_label: OptionLabel;
  explanation_ru: string;
  explanation_kz: string;
  wrong_label: OptionLabel;
  wrong_count: number;
  last_wrong_at: string;
  /** True when the latest answer to the question is correct. */
  resolved: boolean;
}

export const mistakesApi = {
  list: () => apiRequest<ApiMistake[]>('GET', '/practice/mistakes'),
  retry: (questionId: string, label: OptionLabel) =>
    apiRequest<ApiPracticeReview>('POST', `/practice/mistakes/${encodeURIComponent(questionId)}/retry`, {
      selected_label: label,
    }),
};

// ----- schools --------------------------------------------------------------------------------------------

export type OrganizationType = 'school' | 'lyceum' | 'gymnasium' | 'college' | 'tutoring_center' | 'other';

export interface ApiSchoolApplicationInput {
  school_name: string;
  type: OrganizationType;
  city: string;
  contact_name: string;
  contact_position: string;
  contact_phone: string;
  approx_students: number;
}

export interface ApiSchoolApplication extends ApiSchoolApplicationInput {
  id: string;
  status: 'pending' | 'approved' | 'rejected';
  rejection_reason: string;
  organization_id: string | null;
  created_at: string;
}

export interface ApiOrganization {
  id: string;
  name: string;
  type: OrganizationType;
  city: string;
  status: 'active' | 'suspended' | 'archived';
}

export interface ApiMembership {
  organization: ApiOrganization;
  role: 'SCHOOL_ADMIN' | 'TEACHER';
}

export interface ApiSchoolClass {
  id: string;
  name: string;
  academic_year: string;
  grade: number | null;
  status: 'active' | 'archived';
  student_count: number;
  teacher_count: number;
}

export interface ApiTeacher {
  user_id: string;
  name: string;
  email: string;
  status: string;
  class_ids: string[];
}

export const schoolApi = {
  apply: (body: ApiSchoolApplicationInput) => apiRequest<ApiSchoolApplication>('POST', '/school-applications', body),
  myApplications: () => apiRequest<ApiSchoolApplication[]>('GET', '/school-applications/mine'),
  myOrganizations: () => apiRequest<ApiMembership[]>('GET', '/me/organizations'),
  classes: (orgId: string) => apiRequest<ApiSchoolClass[]>('GET', `/organizations/${encodeURIComponent(orgId)}/classes`),
  createClass: (orgId: string, body: { name: string; academic_year: string; grade?: number | null }) =>
    apiRequest<ApiSchoolClass>('POST', `/organizations/${encodeURIComponent(orgId)}/classes`, body),
  updateClass: (orgId: string, classId: string, body: { name?: string; status?: 'active' | 'archived' }) =>
    apiRequest<ApiSchoolClass>('PATCH', `/organizations/${encodeURIComponent(orgId)}/classes/${encodeURIComponent(classId)}`, body),
  teachers: (orgId: string) => apiRequest<ApiTeacher[]>('GET', `/organizations/${encodeURIComponent(orgId)}/teachers`),
  setTeacherClasses: (orgId: string, teacherId: string, classIds: string[]) =>
    apiRequest<ApiTeacher[]>(
      'POST',
      `/organizations/${encodeURIComponent(orgId)}/teachers/${encodeURIComponent(teacherId)}/classes`,
      { class_ids: classIds },
    ),

  // invitations, codes, requests, licences
  invitations: (orgId: string) => apiRequest<ApiInvitation[]>('GET', `/organizations/${encodeURIComponent(orgId)}/invitations`),
  invite: (orgId: string, body: { email: string; role: 'TEACHER' | 'STUDENT'; class_id?: string | null }) =>
    apiRequest<ApiInvitation>('POST', `/organizations/${encodeURIComponent(orgId)}/invitations`, body),
  resendInvitation: (orgId: string, id: string) =>
    apiRequest<ApiInvitation>('POST', `/organizations/${encodeURIComponent(orgId)}/invitations/${encodeURIComponent(id)}/resend`, {}),
  revokeInvitation: (orgId: string, id: string) =>
    apiRequest<ApiInvitation>('POST', `/organizations/${encodeURIComponent(orgId)}/invitations/${encodeURIComponent(id)}/revoke`, {}),
  acceptInvitation: (token: string) => apiRequest<{ organization_id: string; role: string; class_id: string | null }>('POST', '/invitations/accept', { token }),
  joinCodes: (orgId: string, classId: string) =>
    apiRequest<ApiJoinCode[]>('GET', `/organizations/${encodeURIComponent(orgId)}/classes/${encodeURIComponent(classId)}/join-codes`),
  createJoinCode: (orgId: string, classId: string, body: { valid_days: number; max_uses: number }) =>
    apiRequest<ApiJoinCode>('POST', `/organizations/${encodeURIComponent(orgId)}/classes/${encodeURIComponent(classId)}/join-codes`, body),
  revokeJoinCode: (orgId: string, classId: string, codeId: string) =>
    apiRequest<ApiJoinCode>(
      'POST',
      `/organizations/${encodeURIComponent(orgId)}/classes/${encodeURIComponent(classId)}/join-codes/${encodeURIComponent(codeId)}/revoke`,
      {},
    ),
  classRequests: (orgId: string, classId: string) =>
    apiRequest<ApiClassJoinRequest[]>('GET', `/organizations/${encodeURIComponent(orgId)}/classes/${encodeURIComponent(classId)}/join-requests`),
  decideRequest: (requestId: string, action: 'approve' | 'reject') =>
    apiRequest<{ status: string }>('POST', `/classes/join-requests/${encodeURIComponent(requestId)}/${action}`, {}),
  students: (orgId: string, classId: string) =>
    apiRequest<ApiClassStudent[]>('GET', `/organizations/${encodeURIComponent(orgId)}/classes/${encodeURIComponent(classId)}/students`),
  removeStudent: (orgId: string, classId: string, userId: string) =>
    apiRequest<void>(
      'POST',
      `/organizations/${encodeURIComponent(orgId)}/classes/${encodeURIComponent(classId)}/students/${encodeURIComponent(userId)}/remove`,
      {},
    ),
  licenses: (orgId: string) => apiRequest<ApiLicense[]>('GET', `/organizations/${encodeURIComponent(orgId)}/licenses`),
  // the student's side
  requestJoin: (code: string) => apiRequest<ApiMyJoinRequest>('POST', '/classes/join-requests', { code }),
  myJoinRequests: () => apiRequest<ApiMyJoinRequest[]>('GET', '/me/join-requests'),
  mySchoolClasses: () => apiRequest<ApiMyClass[]>('GET', '/me/school-classes'),
};

export interface ApiInvitation {
  id: string;
  email: string;
  role: 'TEACHER' | 'STUDENT';
  class_id: string | null;
  status: 'pending' | 'accepted' | 'revoked';
  expires_at: string;
  created_at: string;
}

export interface ApiJoinCode {
  id: string;
  code_hint: string;
  expires_at: string;
  max_uses: number;
  uses_count: number;
  revoked: boolean;
  /** Present only in the answer to the creating call. */
  code: string | null;
}

export interface ApiClassJoinRequest {
  id: string;
  status: 'pending' | 'approved' | 'rejected';
  user_id: string;
  name: string;
  email: string;
  created_at: string;
}

export interface ApiClassStudent {
  user_id: string;
  name: string;
  email: string;
  joined_at: string;
}

export interface ApiLicense {
  id: string;
  plan: string;
  seat_limit: number;
  seats_used: number;
  starts_at: string;
  expires_at: string;
  status: string;
  current: boolean;
}

export interface ApiMyJoinRequest {
  id: string;
  status: 'pending' | 'approved' | 'rejected';
  class_id: string;
  class_name: string;
  organization_name: string;
  created_at: string;
}

export interface ApiMyClass {
  class_id: string;
  class_name: string;
  academic_year: string;
  organization_id: string;
  organization_name: string;
}
