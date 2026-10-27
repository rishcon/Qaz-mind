// Shared HTTP transport for QazMind Web and QazMind Admin. Both applications call the same FastAPI backend.
// The session lives in an HttpOnly cookie, so the page never reads it. State-changing requests echo the
// qm_csrf cookie in the X-CSRF-Token header (double-submit), as the backend requires.

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

export interface ApiClientOptions {
  /** Full API prefix, for example "/api/v1" (same origin through the dev proxy) or "http://localhost:8000/api/v1". */
  baseUrl: string;
  /** Per-request timeout. Requests that exceed it fail with code TIMEOUT. */
  timeoutMs?: number;
  /** Called on 401: the caller decides where to send the user. */
  onUnauthorized?: () => void;
  /** Called on 403 before the error is thrown. */
  onForbidden?: (error: ApiError) => void;
  csrfCookieName?: string;
  csrfHeaderName?: string;
  /** Replaces the global fetch, for tests. Resolved on each request. */
  fetchImpl?: typeof fetch;
}

export interface RequestOptions {
  signal?: AbortSignal;
}

export interface ApiClient {
  request<T>(method: string, path: string, body?: unknown, options?: RequestOptions): Promise<T>;
}

const UNSAFE_METHODS = new Set(['POST', 'PUT', 'PATCH', 'DELETE']);

function readCookie(name: string): string | null {
  if (typeof document === 'undefined') return null;
  const prefix = `${name}=`;
  for (const part of document.cookie.split(';')) {
    const trimmed = part.trim();
    if (trimmed.startsWith(prefix)) return decodeURIComponent(trimmed.slice(prefix.length));
  }
  return null;
}

function trimTrailingSlash(value: string): string {
  return value.replace(/\/+$/, '');
}

export function createApiClient(options: ApiClientOptions): ApiClient {
  const base = trimTrailingSlash(options.baseUrl);
  const timeoutMs = options.timeoutMs ?? 15000;
  const csrfCookie = options.csrfCookieName ?? 'qm_csrf';
  const csrfHeader = options.csrfHeaderName ?? 'X-CSRF-Token';

  const doFetch = (input: string, init: RequestInit) => (options.fetchImpl ?? globalThis.fetch)(input, init);

  async function rawRequest(
    method: string,
    path: string,
    body: unknown,
    headers: Record<string, string>,
    external?: AbortSignal
  ): Promise<Response> {
    const controller = new AbortController();
    const timer = setTimeout(() => controller.abort(), timeoutMs);
    const onExternalAbort = () => controller.abort();
    external?.addEventListener('abort', onExternalAbort);
    try {
      return await doFetch(`${base}${path}`, {
        method,
        credentials: 'include',
        signal: controller.signal,
        headers: {
          Accept: 'application/json',
          ...(body !== undefined ? { 'Content-Type': 'application/json' } : {}),
          ...headers,
        },
        body: body !== undefined ? JSON.stringify(body) : undefined,
      });
    } catch (error) {
      if (external?.aborted) {
        throw new ApiError(0, 'ABORTED', 'Запрос отменён');
      }
      if (controller.signal.aborted) {
        throw new ApiError(0, 'TIMEOUT', 'Сервер не ответил вовремя. Попробуйте снова.');
      }
      throw new ApiError(0, 'NETWORK_ERROR', 'Нет соединения с сервером. Проверьте интернет и попробуйте снова.');
    } finally {
      clearTimeout(timer);
      external?.removeEventListener('abort', onExternalAbort);
    }
  }

  async function ensureCsrfToken(external?: AbortSignal): Promise<string> {
    const existing = readCookie(csrfCookie);
    if (existing) return existing;
    const response = await rawRequest('GET', '/auth/csrf', undefined, {}, external);
    if (!response.ok) throw await toApiError(response);
    const data = (await response.json()) as { csrf_token: string };
    return data.csrf_token;
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
      error?.request_id ?? response.headers.get('X-Request-ID')
    );
  }

  return {
    async request<T>(method: string, path: string, body?: unknown, requestOptions?: RequestOptions): Promise<T> {
      const headers: Record<string, string> = {};
      if (UNSAFE_METHODS.has(method)) {
        headers[csrfHeader] = await ensureCsrfToken(requestOptions?.signal);
      }
      const response = await rawRequest(method, path, body, headers, requestOptions?.signal);
      if (!response.ok) {
        const error = await toApiError(response);
        if (response.status === 401) options.onUnauthorized?.();
        if (response.status === 403) options.onForbidden?.(error);
        throw error;
      }
      if (response.status === 204) {
        return undefined as T;
      }
      return (await response.json()) as T;
    },
  };
}

/** Text to show the user for any failed request. Server messages are already in Russian. */
export function errorText(error: unknown): string {
  if (error instanceof ApiError) return error.message;
  return 'Не удалось выполнить действие. Попробуйте позже.';
}
