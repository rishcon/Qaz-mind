// Paths of the administrative API (planned, see docs/API_CONTRACTS.md). The backend does not serve them yet:
// QazMind Admin reads its data from the local mock repository until these endpoints exist.

export const ADMIN_ENDPOINTS = {
  me: '/admin/me',
  overview: '/admin/overview',
  users: '/admin/users',
  userById: (id: string) => `/admin/users/${encodeURIComponent(id)}`,
  schools: '/admin/schools',
  schoolById: (id: string) => `/admin/schools/${encodeURIComponent(id)}`,
  subjects: '/admin/subjects',
  lessons: '/admin/lessons',
  questions: '/admin/questions',
  questionById: (id: string) => `/admin/questions/${encodeURIComponent(id)}`,
  exams: '/admin/exams',
  assignments: '/admin/assignments',
  audit: '/admin/audit',
  analytics: '/admin/analytics',
  monitoring: '/admin/monitoring',
} as const;
