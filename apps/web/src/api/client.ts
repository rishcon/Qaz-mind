// QazMind Web uses the shared transport from @qazmind/contracts. The names exported here are kept, so the
// screens import them exactly as before.
//
// VITE_API_BASE_URL is the full API prefix, for example http://localhost:8000/api/v1.
// When it is empty, requests go to /api/v1 on the same origin and the Vite dev proxy forwards them.
import { ApiError, createApiClient, errorText } from '@qazmind/contracts';
import type { ApiErrorDetail } from '@qazmind/contracts';

export { ApiError, errorText };
export type { ApiErrorDetail };

const configuredBase = (import.meta.env?.VITE_API_BASE_URL ?? '').trim();

// The auth provider registers a handler that drops the local session when the server answers 401.
let unauthorizedHandler: (() => void) | null = null;
export function setUnauthorizedHandler(handler: (() => void) | null): void {
  unauthorizedHandler = handler;
}

const client = createApiClient({
  baseUrl: configuredBase || '/api/v1',
  onUnauthorized: () => unauthorizedHandler?.(),
});

export function apiRequest<T>(method: string, path: string, body?: unknown): Promise<T> {
  return client.request<T>(method, path, body);
}
