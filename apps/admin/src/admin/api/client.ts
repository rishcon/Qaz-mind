// QazMind Admin talks to the same FastAPI backend as QazMind Web, under /api/v1/admin.
// Every call is checked on the server: the staff session, the second factor and the role's permission.
import { ApiError, createApiClient, errorText } from '@qazmind/contracts';

export { ApiError, errorText };

/** Fired when the server answers 401: the session ended, so the app returns to the sign-in screen. */
export const UNAUTHORIZED_EVENT = 'qazmind-admin-unauthorized';

const http = createApiClient({
  baseUrl: '/api/v1',
  timeoutMs: 20000,
  onUnauthorized: () => window.dispatchEvent(new Event(UNAUTHORIZED_EVENT)),
});

const get = <T,>(path: string) => http.request<T>('GET', path);
const post = <T,>(path: string, body?: unknown) => http.request<T>('POST', path, body ?? {});
const put = <T,>(path: string, body: unknown) => http.request<T>('PUT', path, body);

function query(params: Record<string, string | number | undefined | null>): string {
  const parts = Object.entries(params)
    .filter(([, v]) => v !== undefined && v !== null && v !== '' && v !== 'all')
    .map(([k, v]) => `${encodeURIComponent(k)}=${encodeURIComponent(String(v))}`);
  return parts.length ? `?${parts.join('&')}` : '';
}

// ----- types (as returned by the server) ---------------------------------------------------------------------

export type StaffRole =
  | 'OWNER'
  | 'PLATFORM_ADMIN'
  | 'CONTENT_MANAGER'
  | 'CONTENT_REVIEWER'
  | 'SUPPORT_AGENT'
  | 'FINANCE_MANAGER'
  | 'ANALYST';

export interface StaffMember {
  id: string;
  email: string;
  name: string;
  status: 'invited' | 'active' | 'disabled';
  roles: StaffRole[];
  mfa_enabled: boolean;
  created_at: string;
  last_sign_in_at: string | null;
}

export interface StaffSession {
  staff: StaffMember;
  permissions: string[];
  mfa_verified: boolean;
  mfa_enrolled: boolean;
}

export interface AuditEntry {
  id: number;
  created_at: string;
  actor_email: string | null;
  actor_roles: string[];
  action: string;
  target_type: string | null;
  target_id: string | null;
  result: 'success' | 'failure';
  details: Record<string, unknown>;
  request_id: string | null;
  ip: string | null;
}

export interface Overview {
  users_total: number;
  users_verified: number;
  onboarding_completed: number;
  active_24h: number;
  new_7d: number;
  lessons_published: number;
  lessons_in_review: number;
  lessons_completed: number;
  questions: Record<'draft' | 'in_review' | 'approved' | 'published' | 'archived', number>;
  registrations_by_day: Array<{ date: string; count: number }>;
  attention: Array<{ id: string; title: string; count: number; action_url: string }>;
  recent_audit: AuditEntry[];
  generated_at: string;
}

export interface Page<T> {
  items: T[];
  total: number;
  page: number;
  page_size: number;
}

export interface StudentRow {
  id: string;
  name: string;
  email: string;
  status: 'active' | 'disabled';
  email_verified: boolean;
  created_at: string;
  last_seen_at: string | null;
  onboarding_completed: boolean;
  target_score: number | null;
  profile_pair_id: string | null;
  lessons_completed: number;
  locked_until: string | null;
}

export interface StudentDetail extends StudentRow {
  profile: {
    exam_lang: string;
    interface_lang: string;
    target_score: number;
    exam_year: number;
    exam_period: string;
    daily_goal_minutes: number;
    profile_pair: string;
    onboarding_completed_at: string | null;
  } | null;
  active_sessions: number;
  sessions: Array<{ created_at: string; last_seen_at: string; expires_at: string; revoked: boolean }>;
  progress: Array<{
    lesson_slug: string;
    title: string;
    state: string;
    last_step: number;
    completed_at: string | null;
    updated_at: string;
  }>;
}

export interface Subject {
  id: string;
  code: string;
  title_ru: string;
  title_kz: string;
  category: 'mandatory' | 'profile';
  active: boolean;
  topics: number;
  lessons: number;
  lessons_published: number;
  questions: number;
}

export interface Topic {
  id: string;
  subject_id: string;
  slug: string;
  position: number;
  title_ru: string;
  title_kz: string;
  lessons: number;
}

export interface LessonStep {
  heading_ru: string;
  heading_kz: string;
  body_ru: string;
  body_kz: string;
  key_fact_ru?: string | null;
  key_fact_kz?: string | null;
  example_ru?: string | null;
  example_kz?: string | null;
}

export interface LessonVersion {
  id: string;
  version: number;
  status: 'draft' | 'in_review' | 'approved' | 'published' | 'archived';
  title_ru: string;
  title_kz: string;
  estimated_minutes: number;
  source_reference: string;
  steps: LessonStep[];
  author: string;
  reviewer: string | null;
  created_at: string;
  published_at: string | null;
}

export interface LessonRow {
  slug: string;
  subject_id: string;
  topic_id: string;
  topic_title: string;
  position: number;
  has_published: boolean;
  completed_by: number;
  latest: LessonVersion;
}

export interface LessonDetail {
  slug: string;
  subject_id: string;
  topic_id: string;
  topic_title: string;
  versions: LessonVersion[];
}

export interface LessonBody {
  title_ru: string;
  title_kz: string;
  estimated_minutes: number;
  source_reference: string;
  steps: LessonStep[];
}

export type WorkflowAction = 'submit' | 'return' | 'approve' | 'publish' | 'archive';

export interface QuestionOption {
  label: 'A' | 'B' | 'C' | 'D' | 'E';
  text_ru: string;
  text_kz: string;
}

export interface QuestionBody {
  subject_id: string;
  topic_id: string | null;
  difficulty: 'easy' | 'medium' | 'hard';
  points: number;
  text_ru: string;
  text_kz: string;
  options: QuestionOption[];
  correct_label: QuestionOption['label'];
  explanation_ru: string;
  explanation_kz: string;
  source_reference: string;
  external_id: string | null;
}

export interface Question extends QuestionBody {
  id: string;
  type: string;
  status: 'draft' | 'in_review' | 'approved' | 'published' | 'archived';
  review_notes: string;
  author: string | null;
  reviewer: string | null;
  version: number;
  created_at: string;
  updated_at: string;
  published_at: string | null;
}

export interface Monitoring {
  services: Array<{
    id: string;
    name: string;
    status: 'ok' | 'down' | 'not_configured';
    latency_ms: number | null;
    details: string;
  }>;
  student_sessions_active: number;
  staff_sessions_active: number;
  staff_active: number;
  admin_failures_24h: number;
  checked_at: string;
}

// ----- calls -------------------------------------------------------------------------------------------------

export const adminApi = {
  // sign-in
  login: (email: string, password: string) =>
    post<{ next: 'mfa_setup' | 'mfa_verify' }>('/admin/auth/login', { email, password }),
  mfaSetup: () => get<{ secret: string; otpauth_uri: string }>('/admin/auth/mfa/setup'),
  mfaVerify: (code: string) => post<StaffSession>('/admin/auth/mfa', { code }),
  session: () => get<StaffSession>('/admin/auth/session'),
  logout: () => post<void>('/admin/auth/logout'),
  invitation: (token: string) =>
    get<{ email: string; name: string; roles: StaffRole[] }>(`/admin/auth/invitations/${encodeURIComponent(token)}`),
  acceptInvitation: (token: string, name: string, password: string) =>
    post<{ status: string }>('/admin/auth/invitations/accept', { token, name, password }),

  // staff
  staff: () => get<{ items: StaffMember[] }>('/admin/staff'),
  invite: (email: string, name: string, roles: StaffRole[]) =>
    post<{ status: string }>('/admin/staff/invitations', { email, name, roles }),
  setRoles: (id: string, roles: StaffRole[]) => put<{ status: string }>(`/admin/staff/${id}/roles`, { roles }),
  disableStaff: (id: string) => post<{ status: string }>(`/admin/staff/${id}/disable`),
  enableStaff: (id: string) => post<{ status: string }>(`/admin/staff/${id}/enable`),
  revokeStaffSessions: (id: string) => post<{ status: string }>(`/admin/staff/${id}/sessions/revoke`),

  // data
  overview: () => get<Overview>('/admin/overview'),
  users: (params: { search?: string; status?: string; page?: number; page_size?: number }) =>
    get<Page<StudentRow>>(`/admin/users${query(params)}`),
  user: (id: string) => get<StudentDetail>(`/admin/users/${id}`),
  setUserStatus: (id: string, status: 'active' | 'disabled', reason: string) =>
    post<{ status: string }>(`/admin/users/${id}/status`, { status, reason }),
  revokeUserSessions: (id: string) => post<{ revoked: number }>(`/admin/users/${id}/sessions/revoke`),
  audit: (params: { action?: string; actor?: string; result?: string; page?: number; page_size?: number }) =>
    get<Page<AuditEntry>>(`/admin/audit${query(params)}`),
  monitoring: () => get<Monitoring>('/admin/monitoring'),

  // content
  subjects: () => get<{ items: Subject[] }>('/admin/subjects'),
  topics: (subjectId?: string) => get<{ items: Topic[] }>(`/admin/topics${query({ subject_id: subjectId })}`),
  createTopic: (body: { subject_id: string; slug: string; title_ru: string; title_kz: string }) =>
    post<{ id: string }>('/admin/topics', body),
  lessons: (params: { subject_id?: string; status?: string; search?: string }) =>
    get<{ items: LessonRow[] }>(`/admin/lessons${query(params)}`),
  lesson: (slug: string) => get<LessonDetail>(`/admin/lessons/${encodeURIComponent(slug)}`),
  createLesson: (body: LessonBody & { topic_id: string; slug: string }) =>
    post<{ slug: string; version: number }>('/admin/lessons', body),
  createLessonVersion: (slug: string, body: LessonBody) =>
    post<{ slug: string; version: number }>(`/admin/lessons/${encodeURIComponent(slug)}/versions`, body),
  lessonTransition: (slug: string, version: number, action: WorkflowAction) =>
    post<{ status: string }>(`/admin/lessons/${encodeURIComponent(slug)}/versions/${version}/transition`, { action }),

  // questions
  questions: (params: { subject_id?: string; status?: string; search?: string; page?: number; page_size?: number }) =>
    get<Page<Question>>(`/admin/questions${query(params)}`),
  question: (id: string) => get<Question>(`/admin/questions/${id}`),
  createQuestion: (body: QuestionBody) => post<{ id: string }>('/admin/questions', body),
  updateQuestion: (id: string, body: QuestionBody) => put<{ id: string; version: number }>(`/admin/questions/${id}`, body),
  questionTransition: (id: string, action: WorkflowAction, notes = '') =>
    post<{ status: string }>(`/admin/questions/${id}/transition`, { action, notes }),
  importQuestions: (rows: QuestionBody[]) => post<{ created: number }>('/admin/questions/import', { rows }),
};
