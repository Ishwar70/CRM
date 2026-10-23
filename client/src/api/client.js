const BASE_URL = (import.meta.env.VITE_API_URL ?? '').replace(/\/$/, '');

export class ApiRequestError extends Error {
  constructor(status, message, errors = []) {
    super(message);
    this.status = status;
    this.errors = errors;
  }
}

function toQuery(params) {
  if (!params) return '';
  const qs = new URLSearchParams();
  for (const [key, value] of Object.entries(params)) {
    if (value !== undefined && value !== null && value !== '') qs.set(key, String(value));
  }
  const str = qs.toString();
  return str ? `?${str}` : '';
}

export async function request(path, { method = 'GET', body, params } = {}) {
  let res;
  try {
    res = await fetch(`${BASE_URL}/api${path}${toQuery(params)}`, {
      method,
      credentials: 'include',
      headers: body ? { 'Content-Type': 'application/json' } : undefined,
      body: body ? JSON.stringify(body) : undefined,
    });
  } catch {
    throw new ApiRequestError(0, 'Cannot reach the server. Check your connection and try again.');
  }

  let payload = null;
  try {
    payload = await res.json();
  } catch {
    payload = null;
  }

  if (!res.ok || payload?.success === false) {
    throw new ApiRequestError(
      res.status,
      payload?.message ?? `Request failed (${res.status})`,
      payload?.errors ?? [],
    );
  }
  return payload?.data;
}
