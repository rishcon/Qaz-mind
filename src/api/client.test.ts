import test from 'node:test';
import assert from 'node:assert/strict';
import { ApiError, apiRequest, errorText } from './client';
import { authApi, profileApi } from './endpoints';

type Call = { url: string; init: RequestInit };

const originalFetch = globalThis.fetch;

/** Replaces fetch with a scripted sequence of responses and records every call. */
function scriptFetch(responses: Array<() => Response | Promise<Response>>): Call[] {
  const calls: Call[] = [];
  let index = 0;
  globalThis.fetch = (async (url: string | URL | Request, init?: RequestInit) => {
    calls.push({ url: String(url), init: init ?? {} });
    const next = responses[index++];
    if (!next) throw new Error(`unexpected fetch #${index}: ${String(url)}`);
    return next();
  }) as typeof fetch;
  return calls;
}

function json(status: number, body: unknown): Response {
  return new Response(JSON.stringify(body), { status, headers: { 'Content-Type': 'application/json' } });
}

test('unsafe requests fetch the CSRF token first and echo it in X-CSRF-Token', async () => {
  const calls = scriptFetch([
    () => json(200, { csrf_token: 'token-123' }),
    () => json(200, { status: 'check_email' }),
  ]);

  const result = await authApi.register('Алия', 'aliya@qazmind.kz', 'CorrectHorse42');

  assert.deepEqual(result, { status: 'check_email' });
  assert.equal(calls[0].url, '/api/v1/auth/csrf');
  assert.equal(calls[1].url, '/api/v1/auth/register');
  assert.equal(calls[1].init.method, 'POST');
  assert.equal((calls[1].init.headers as Record<string, string>)['X-CSRF-Token'], 'token-123');
  assert.equal(calls[1].init.credentials, 'include');
  assert.deepEqual(JSON.parse(String(calls[1].init.body)), {
    name: 'Алия',
    email: 'aliya@qazmind.kz',
    password: 'CorrectHorse42',
  });
});

test('safe requests do not fetch or send a CSRF token', async () => {
  const calls = scriptFetch([() => json(200, { user: {}, onboarding_completed: false })]);
  await authApi.me();
  assert.equal(calls.length, 1);
  assert.equal(calls[0].url, '/api/v1/auth/me');
  assert.equal((calls[0].init.headers as Record<string, string>)['X-CSRF-Token'], undefined);
});

test('server error envelope becomes an ApiError with code, details and request id', async () => {
  scriptFetch([
    () => json(200, { csrf_token: 'token-abc' }),
    () =>
      new Response(
        JSON.stringify({
          error: {
            code: 'VALIDATION_ERROR',
            message: 'Проверьте введённые данные',
            details: [{ field: 'password', message: 'String should have at least 8 characters' }],
            request_id: 'req-42',
          },
        }),
        { status: 422, headers: { 'Content-Type': 'application/json' } }
      ),
  ]);

  await assert.rejects(
    () => authApi.register('Алия', 'aliya@qazmind.kz', 'short'),
    (error: unknown) => {
      assert.ok(error instanceof ApiError);
      assert.equal(error.status, 422);
      assert.equal(error.code, 'VALIDATION_ERROR');
      assert.equal(error.requestId, 'req-42');
      assert.deepEqual(error.details, [{ field: 'password', message: 'String should have at least 8 characters' }]);
      assert.equal(errorText(error), 'Проверьте введённые данные');
      return true;
    }
  );
});

test('network failure is reported as NETWORK_ERROR, not as a crash', async () => {
  scriptFetch([() => Promise.reject(new TypeError('Failed to fetch'))]);
  await assert.rejects(
    () => apiRequest('GET', '/auth/me'),
    (error: unknown) => error instanceof ApiError && error.code === 'NETWORK_ERROR' && error.status === 0
  );
});

test('204 No Content resolves to undefined', async () => {
  scriptFetch([() => json(200, { csrf_token: 'token-x' }), () => new Response(null, { status: 204 })]);
  assert.equal(await authApi.logout(), undefined);
});

test('a missing profile (404) is returned as null, other errors are rethrown', async () => {
  scriptFetch([
    () => json(404, { error: { code: 'PROFILE_NOT_FOUND', message: 'Профиль обучения ещё не заполнен' } }),
  ]);
  assert.equal(await profileApi.getProfile(), null);

  scriptFetch([() => json(500, { error: { code: 'INTERNAL_ERROR', message: 'Внутренняя ошибка сервера' } })]);
  await assert.rejects(() => profileApi.getProfile(), (error: unknown) => error instanceof ApiError && error.status === 500);
});

test.after(() => {
  globalThis.fetch = originalFetch;
});
