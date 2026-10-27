// Paths of the administrative API. The backend does not serve them yet, and QazMind Admin does not call them:
// its data layer returns no data and refuses every write until these endpoints exist (see docs/INTEGRATION.md).
// Access model, roles and staff lifecycle: docs/ADMIN_ACCESS.md.

export const ADMIN_ENDPOINTS = {
  // Staff sign-in (separate from student sign-in, with mandatory MFA)
  authLogin: '/admin/auth/login',
  authMfa: '/admin/auth/mfa',
  authLogout: '/admin/auth/logout',
  authMe: '/admin/auth/me',

  // Staff accounts and roles (owner only)
  staff: '/admin/staff',
  staffInvitations: '/admin/staff/invitations',
  staffById: (id: string) => `/admin/staff/${encodeURIComponent(id)}`,
  staffRoles: (id: string) => `/admin/staff/${encodeURIComponent(id)}/roles`,
  staffDisable: (id: string) => `/admin/staff/${encodeURIComponent(id)}/disable`,
  staffSessionsRevoke: (id: string) => `/admin/staff/${encodeURIComponent(id)}/sessions/revoke`,

  // Platform data
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
