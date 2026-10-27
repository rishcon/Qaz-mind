import test from 'node:test';
import assert from 'node:assert/strict';
import { ApiError, createApiClient } from './http';

type Call = { url: string; init: RequestInit };
type Responder = (init: RequestInit) => Response | Promise<Response>;

const originalFetch = globalThis.fetch;

/** Scripted fetch: each request gets the next responder; every call is recorded. */
function scriptFetch(responders: Responder[]): { calls: Call[]; fetchImpl: typeof fetch } {
  const calls: Call[] = [];
  let index = 0;
  const fetchImpl = (async (url: string | URL | Request, init?: RequestInit) => {
    calls.push({ url: String(url), init: init ?? {} });
    const next = responders[index++];
    if (!next) throw new Error(`unexpected request #${index}: ${String(url)}`);
    return next(init ?? {});
  }) as typeof fetch;
  return { calls, fetchImpl };
}

function json(status: number, body: unknown): Response {
  return new Response(JSON.stringify(body), { status, headers: { 'Content-Type': 'application/json' } });
}

/** A request that never answers, but rejects as soon as the client aborts it (like the real fetch). */
function hangUntilAborted(init: RequestInit): Promise<Response> {
  return new Promise((_resolve, reject) => {
    init.signal?.addEventListener('abort', () => reject(new DOMException('The operation was aborted.', 'AbortError')));
  });
}

test('unsafe requests fetch a CSRF token and send it in the header', async () => {
  const { calls, fetchImpl } = scriptFetch([() => json(200, { csrf_token: 'abc' }), () => json(200, { ok: true })]);
  const client = createApiClient({ baseUrl: 'http://api.test/api/v1', fetchImpl });
  const result = await client.request<{ ok: boolean }>('POST', '/admin/schools/1/approve', { reason: 'x' });
  assert.deepEqual(result, { ok: true });
  assert.equal(calls[0].url, 'http://api.test/api/v1/auth/csrf');
  assert.equal((calls[1].init.headers as Record<string, string>)['X-CSRF-Token'], 'abc');
  assert.equal(calls[1].init.credentials, 'include');
});

test('401 calls onUnauthorized and 403 calls onForbidden before the error is thrown', async () => {
  let unauthorized = 0;
  let forbidden: ApiError | null = null;
  const { fetchImpl } = scriptFetch([
    () => json(401, { error: { code: 'NOT_AUTHENTICATED', message: 'Требуется вход в аккаунт' } }),
    () => json(403, { error: { code: 'FORBIDDEN', message: 'Нет доступа' } }),
  ]);
  const client = createApiClient({
    baseUrl: 'http://api.test/api/v1',
    fetchImpl,
    onUnauthorized: () => {
      unauthorized += 1;
    },
    onForbidden: (error) => {
      forbidden = error;
    },
  });
  await assert.rejects(() => client.request('GET', '/auth/me'), (e: unknown) => e instanceof ApiError && e.status === 401);
  await assert.rejects(() => client.request('GET', '/admin/users'), (e: unknown) => e instanceof ApiError && e.status === 403);
  assert.equal(unauthorized, 1);
  assert.equal((forbidden as ApiError | null)?.code, 'FORBIDDEN');
});

test('a request that does not answer in time fails with TIMEOUT', async () => {
  const { fetchImpl } = scriptFetch([hangUntilAborted]);
  const client = createApiClient({ baseUrl: 'http://api.test/api/v1', timeoutMs: 20, fetchImpl });
  await assert.rejects(() => client.request('GET', '/slow'), (e: unknown) => e instanceof ApiError && e.code === 'TIMEOUT');
});

test('an abort requested by the caller fails with ABORTED, not with a network error', async () => {
  const controller = new AbortController();
  const { fetchImpl } = scriptFetch([hangUntilAborted]);
  const client = createApiClient({ baseUrl: 'http://api.test/api/v1', timeoutMs: 5000, fetchImpl });
  const pending = client.request('GET', '/slow', undefined, { signal: controller.signal });
  controller.abort();
  await assert.rejects(pending, (e: unknown) => e instanceof ApiError && e.code === 'ABORTED');
});

test('a failed connection is reported as NETWORK_ERROR', async () => {
  const { fetchImpl } = scriptFetch([() => Promise.reject(new TypeError('Failed to fetch'))]);
  const client = createApiClient({ baseUrl: 'http://api.test/api/v1', fetchImpl });
  await assert.rejects(() => client.request('GET', '/auth/me'), (e: unknown) => e instanceof ApiError && e.code === 'NETWORK_ERROR');
});

test.after(() => {
  globalThis.fetch = originalFetch;
});
