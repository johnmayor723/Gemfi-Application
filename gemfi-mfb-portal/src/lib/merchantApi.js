// Merchant Service API client — independent from Fineract, called
// directly from the browser. Reads accountServiceBaseUrl from the
// same localStorage config as Fineract/Account Service — nginx
// fronts merchant-service on that same host under /merchants and
// /admin/merchant.
//
// Admin actions require a short-lived session token, obtained the
// same way as account-service's: exchange the Fineract credentials
// already stored in Connection settings at
// POST /admin/merchant/auth/login (merchant-service verifies them
// against real Fineract).
import { getFineractConfig } from './fineract';

// In-memory only — a session token is meant to be short-lived and
// should not survive a page reload the way localStorage would.
let adminSession = null; // { token, expiresAt }

export function isMerchantServiceConfigured() {
  const config = getFineractConfig();
  return !!(config && config.accountServiceBaseUrl);
}

function clearAdminSession() {
  adminSession = null;
}

async function loginAdmin(config) {
  const url = `${config.accountServiceBaseUrl.replace(/\/+$/, '')}/admin/merchant/auth/login`;

  const res = await fetch(url, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ username: config.username, password: config.password }),
  });

  const payload = await res.json().catch(() => null);

  if (!res.ok || !payload?.data?.token) {
    throw new Error(payload?.message || 'Merchant Service admin login failed. Check the credentials in Connection settings.');
  }

  // Refresh a little before actual expiry so an in-flight request
  // never races the token dying mid-air.
  const expiresAt = Date.now() + (payload.data.expiresInMinutes * 60 * 1000) - (30 * 1000);

  adminSession = { token: payload.data.token, expiresAt };
  return adminSession.token;
}

async function getAdminToken(config) {
  if (adminSession && adminSession.expiresAt > Date.now()) {
    return adminSession.token;
  }
  return loginAdmin(config);
}

export async function merchantApi(path, options = {}) {
  const config = getFineractConfig();
  if (!config || !config.accountServiceBaseUrl) {
    throw new Error('Merchant Service is not configured. Configure an Account Service URL to enable merchant management.');
  }

  const { method = 'GET', body } = options;

  const url = `${config.accountServiceBaseUrl.replace(/\/+$/, '')}${path}`;

  const doFetch = (token) => fetch(url, {
    method,
    headers: { 'Content-Type': 'application/json', 'Authorization': 'Bearer ' + token },
    body: body ? JSON.stringify(body) : undefined,
  });

  let token = await getAdminToken(config);
  let res = await doFetch(token);

  // Session may have expired from inactivity between calls — retry
  // once with a fresh login before surfacing an error.
  if (res.status === 401) {
    clearAdminSession();
    token = await getAdminToken(config);
    res = await doFetch(token);
  }

  if (!res.ok) {
    let errorMsg = `HTTP ${res.status}`;
    try {
      const err = await res.json();
      if (err.errors && err.errors.length > 0) {
        errorMsg = err.errors.map(e => e.msg || e.message || JSON.stringify(e)).join('; ');
      } else {
        errorMsg = err.message || JSON.stringify(err);
      }
    } catch {}
    throw new Error(errorMsg);
  }

  const text = await res.text();
  if (!text) return null;
  return JSON.parse(text);
}

export async function listMerchants({ status, merchantCategory } = {}) {
  const params = new URLSearchParams();
  if (status) params.set('status', status);
  if (merchantCategory) params.set('merchantCategory', merchantCategory);
  const qs = params.toString();
  const result = await merchantApi(`/merchants${qs ? `?${qs}` : ''}`);
  return result?.data ?? [];
}

export async function getMerchant(id) {
  const result = await merchantApi(`/merchants/${id}`);
  return result?.data ?? null;
}

export async function approveMerchant(id, {
  settlementFineractAccountId,
  settlementFineractAccountNumber,
  feeSchedule,
}) {
  const result = await merchantApi(`/merchants/${id}/approve`, {
    method: 'PATCH',
    body: {
      settlementFineractAccountId: settlementFineractAccountId || undefined,
      settlementFineractAccountNumber: settlementFineractAccountNumber || undefined,
      feeSchedule,
    },
  });
  return result?.data ?? null;
}

export async function rejectMerchant(id, rejectionReason) {
  const result = await merchantApi(`/merchants/${id}/reject`, {
    method: 'PATCH',
    body: { rejectionReason },
  });
  return result?.data ?? null;
}

export async function updateMerchantStatus(id, status) {
  const result = await merchantApi(`/merchants/${id}/status`, {
    method: 'PATCH',
    body: { status },
  });
  return result?.data ?? null;
}

export async function updateFeeSchedule(id, feeSchedule) {
  const result = await merchantApi(`/merchants/${id}/fee-schedule`, {
    method: 'PATCH',
    body: { feeSchedule },
  });
  return result?.data ?? null;
}
