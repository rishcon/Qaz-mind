// Thin fetch wrapper for the QazMind API (/api/v1).
// Session lives in an HttpOnly cookie, so the page never sees it. State-changing requests echo the
// qm_csrf cookie in the X-CSRF-Token header (double-submit), as required by the backend.

export interface ApiErrorDetail {
  field: string;
  message: string;
}

export class ApiError extends Error {
  readonly status: number;
  readonly code: string;
  readonly details: ApiErrorDetail[];
  readonly requestId: string | null;

  constructor(status: number, code: string, message: string, details: ApiErrorDetail[] = [], requestId: string | null = null) {
    super(message);
    this.name = 'ApiError';
    this.status = status;
    this.code = code;
    this.details = details;
    this.requestId = requestId;
  }
}

const API_PREFIX = '/api/v1';
const CSRF_COOKIE = 'qm_csrf';
const CSRF_HEADER = 'X-CSRF-Token';
const UNSAFE_METHODS = new Set(['POST', 'PUT', 'PATCH', 'DELETE']);

function baseUrl(): string {
  // import.meta.env is undefined outside Vite (for example in the Node unit tests), hence the optional chain.
  const configured = (import.meta.env?.VITE_API_BASE_URL ?? '').trim();
  return configured ? configured.replace(/\/$/, '') : '';
}

function readCookie(name: string): string | null {
  if (typeof document === 'undefined') return null;
  const prefix = `${name}=`;
  for (const part of document.cookie.split(';')) {
    const trimmed = part.trim();
    if (trimmed.startsWith(prefix)) return decodeURIComponent(trimmed.slice(prefix.length));
  }
  return null;
}

async function ensureCsrfToken(): Promise<string> {
  const existing = readCookie(CSRF_COOKIE);
  if (existing) return existing;
  const response = await rawRequest('GET', '/auth/csrf');
  const body = (await response.json()) as { csrf_token: string };
  return body.csrf_token;
}

async function rawRequest(method: string, path: string, body?: unknown, headers: Record<string, string> = {}): Promise<Response> {
  try {
    return await fetch(`${baseUrl()}${API_PREFIX}${path}`, {
      method,
      credentials: 'include',
      headers: {
        Accept: 'application/json',
        ...(body !== undefined ? { 'Content-Type': 'application/json' } : {}),
        ...headers,
      },
      body: body !== undefined ? JSON.stringify(body) : undefined,
    });
  } catch {
    throw new ApiError(0, 'NETWORK_ERROR', 'Нет соединения с сервером. Проверьте интернет и попробуйте снова.');
  }
}

async function toApiError(response: Response): Promise<ApiError> {
  let payload: unknown = null;
  try {
    payload = await response.json();
  } catch {
    payload = null;
  }
  const error = (payload as { error?: { code?: string; message?: string; details?: ApiErrorDetail[]; request_id?: string } })?.error;
  return new ApiError(
    response.status,
    error?.code ?? 'HTTP_ERROR',
    error?.message ?? 'Не удалось выполнить запрос. Попробуйте позже.',
    error?.details ?? [],
    error?.request_id ?? response.headers.get('X-Request-ID'),
  );
}

/** Text to show the user for any failed request. Server messages are already in Russian. */
export function errorText(error: unknown): string {
  if (error instanceof ApiError) return error.message;
  return 'Не удалось выполнить действие. Попробуйте позже.';
}

export async function apiRequest<T>(method: string, path: string, body?: unknown): Promise<T> {
  const headers: Record<string, string> = {};
  if (UNSAFE_METHODS.has(method)) {
    headers[CSRF_HEADER] = await ensureCsrfToken();
  }
  const response = await rawRequest(method, path, body, headers);
  if (!response.ok) {
    throw await toApiError(response);
  }
  if (response.status === 204) {
    return undefined as T;
  }
  return (await response.json()) as T;
}
