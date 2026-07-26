import { ENDPOINTS } from '@/api/endpoints';

let refreshPromise = null;

const tokens = {
  get access() { return sessionStorage.getItem('gemfi_access_token'); },
  get refresh() { return sessionStorage.getItem('gemfi_refresh_token'); },
  set(access, refresh) {
    sessionStorage.setItem('gemfi_access_token', access);
    sessionStorage.setItem('gemfi_refresh_token', refresh);
  },
  clear() {
    sessionStorage.removeItem('gemfi_access_token');
    sessionStorage.removeItem('gemfi_refresh_token');
  },
};

const parseResponse = async (response) => {
  const body = response.status === 204 ? null : await response.json().catch(() => null);
  if (!response.ok) throw Object.assign(new Error(body?.message || 'Request failed'), { status: response.status, body });
  return body;
};

async function refreshSession() {
  if (!tokens.refresh) throw new Error('Session expired');
  const response = await fetch(ENDPOINTS.auth.refresh, {
    method: 'POST', headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ refreshToken: tokens.refresh }),
  });
  const result = await parseResponse(response);
  tokens.set(result.data.accessToken, result.data.refreshToken || tokens.refresh);
  return result.data.accessToken;
}

/**
 * Pass `idempotent: true` on any state-changing call that the backend
 * gates with an Idempotency-Key (transfers, standing orders, bulk
 * transfers). The key is generated here, once per apiRequest call, so
 * individual API wrappers never construct it themselves.
 */
export async function apiRequest(url, options = {}, retry = true) {
  const headers = { 'Content-Type': 'application/json', ...options.headers };
  if (tokens.access) headers.Authorization = `Bearer ${tokens.access}`;
  if (options.idempotent && !headers['Idempotency-Key']) headers['Idempotency-Key'] = crypto.randomUUID();
  const response = await fetch(url, { ...options, headers });
  if (response.status === 401 && retry && tokens.refresh) {
    refreshPromise ||= refreshSession().finally(() => { refreshPromise = null; });
    try { await refreshPromise; return apiRequest(url, options, false); }
    catch { tokens.clear(); window.dispatchEvent(new Event('gemfi:unauthorized')); throw new Error('Session expired'); }
  }
  return parseResponse(response);
}

export { tokens };
