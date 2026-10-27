// Types shared by every QazMind frontend. They mirror the FastAPI schemas (snake_case, as the server sends them).
// Keep this package small: a type belongs here only if both applications use it.

/** Common pagination envelope for list endpoints. */
export interface Page<T> {
  items: T[];
  total: number;
  page: number;
  page_size: number;
}

/** Query parameters accepted by list endpoints. Filters are endpoint-specific and documented in docs/API_CONTRACTS.md. */
export interface PageQuery {
  page?: number;
  page_size?: number;
  search?: string;
}

/** Roles that exist on the server. Roles inside a school are not platform roles. */
export const PLATFORM_ROLES = ['OWNER', 'PLATFORM_ADMIN', 'CONTENT_EDITOR', 'CONTENT_REVIEWER', 'SUPPORT'] as const;
export type PlatformRole = (typeof PLATFORM_ROLES)[number];

/** Result of GET /api/v1/auth/me, as returned by the server. */
export interface SessionUser {
  id: string;
  name: string;
  email: string;
  email_verified: boolean;
  created_at: string;
}

export interface SessionResponse {
  user: SessionUser;
  onboarding_completed: boolean;
}
