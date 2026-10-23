import { afterEach, describe, expect, it, vi } from 'vitest';
import { ApiRequestError, request } from './client.js';

afterEach(() => vi.unstubAllGlobals());

describe('request', () => {
  it('sends credentials, builds the query string, and unwraps data', async () => {
    const fetchMock = vi.fn().mockResolvedValue({
      ok: true,
      json: async () => ({ success: true, data: { ok: 1 } }),
    });
    vi.stubGlobal('fetch', fetchMock);

    const data = await request('/leads', { params: { page: 2, search: '', status: 'new' } });

    expect(data).toEqual({ ok: 1 });
    const [url, init] = fetchMock.mock.calls[0];
    expect(url).toBe('/api/leads?page=2&status=new');
    expect(init.credentials).toBe('include');
  });

  it('throws ApiRequestError with server message and field errors', async () => {
    vi.stubGlobal(
      'fetch',
      vi.fn().mockResolvedValue({
        ok: false,
        status: 400,
        json: async () => ({ success: false, message: 'Validation failed', errors: [{ field: 'name' }] }),
      }),
    );
    await expect(request('/leads', { method: 'POST', body: {} })).rejects.toMatchObject({
      status: 400,
      message: 'Validation failed',
      errors: [{ field: 'name' }],
    });
  });

  it('maps network failures to a friendly error', async () => {
    vi.stubGlobal('fetch', vi.fn().mockRejectedValue(new TypeError('Failed to fetch')));
    await expect(request('/health')).rejects.toBeInstanceOf(ApiRequestError);
  });
});
