import { ENDPOINTS } from '@/api/endpoints';
import { getSession, setSession, clearSession, notifySessionExpired } from '@/lib/session';

async function parseResponse(response) {
  const body = response.status === 204 ? null : await response.json().catch(() => null);
  if (!response.ok) throw Object.assign(new Error(body?.message || 'Request failed'), { status: response.status, body });
  return body;
}

/**
 * Attaches the current session token and, on a 401, clears the
 * session and broadcasts SESSION_EXPIRED_EVENT instead of just
 * throwing - the caller's error handling still runs (so a page
 * mid-submit can show its own message), but the app-wide login
 * gate reacts too, from wherever the 401 happened.
 */
async function authedFetch(url, options = {}) {
  const session = getSession();
  if (!session) {
    notifySessionExpired();
    throw Object.assign(new Error('Your session has expired. Please log in again.'), { status: 401 });
  }

  const headers = { ...(options.headers || {}), Authorization: `Bearer ${session.token}` };
  if (!options.isFormData) headers['Content-Type'] = 'application/json';

  const response = await fetch(url, { ...options, headers });

  if (response.status === 401) {
    notifySessionExpired();
  }

  return parseResponse(response);
}

export async function login(username, password) {
  const response = await fetch(ENDPOINTS.admin.login, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ username, password }),
  });
  const body = await parseResponse(response);
  return setSession(body.data);
}

export async function logout() {
  try {
    await authedFetch(ENDPOINTS.admin.logout, { method: 'POST' });
  } finally {
    clearSession();
  }
}

export async function fetchSession() {
  const body = await authedFetch(ENDPOINTS.admin.session);
  return body.data;
}

export async function listRequests(status) {
  const url = status ? `${ENDPOINTS.admin.list}?status=${encodeURIComponent(status)}` : ENDPOINTS.admin.list;
  const body = await authedFetch(url);
  return body.data;
}

export async function getRequest(id) {
  const body = await authedFetch(ENDPOINTS.admin.getById(id));
  return body.data;
}

/**
 * `payload.logo` (if present) must be a File - sent as multipart
 * so the browser sets the boundary itself, matching the public
 * submit endpoint's convention.
 */
export async function createRequest(payload) {
  const formData = new FormData();
  formData.append('companyName', payload.companyName);
  formData.append('contactEmail', payload.contactEmail);
  formData.append('contactPhone', payload.contactPhone);
  if (payload.contactAddress) formData.append('contactAddress', payload.contactAddress);
  formData.append('primaryColor', payload.primaryColor);
  formData.append('secondaryColor', payload.secondaryColor);
  if (payload.logo) formData.append('logo', payload.logo);

  const body = await authedFetch(ENDPOINTS.admin.create, {
    method: 'POST',
    body: formData,
    isFormData: true,
  });
  return body.data;
}

export async function updateRequest(id, payload) {
  const body = await authedFetch(ENDPOINTS.admin.update(id), {
    method: 'PATCH',
    body: JSON.stringify(payload),
  });
  return body.data;
}

export async function rejectRequest(id, reason) {
  const body = await authedFetch(ENDPOINTS.admin.reject(id), {
    method: 'POST',
    body: JSON.stringify({ reason }),
  });
  return body.data;
}

export async function approveRequest(id) {
  const body = await authedFetch(ENDPOINTS.admin.approve(id), {
    method: 'POST',
  });
  return body.data;
}

export async function setRequestStatus(id, status) {
  const body = await authedFetch(ENDPOINTS.admin.setStatus(id), {
    method: 'PATCH',
    body: JSON.stringify({ status }),
  });
  return body.data;
}
