// Account Service API client — independent from Fineract, called
// directly from the browser (not proxied through the Fineract gateway).
// Reads accountServiceBaseUrl from the same localStorage config as Fineract.
//
// Provision/lookup now require a short-lived admin session token,
// obtained the same way as kyc-service's: exchange the Fineract
// credentials already stored in Connection settings at
// POST /admin/auth/login (account-service verifies them against real
// Fineract, not just trusting whatever the client claims).
import { getFineractConfig } from './fineract';

// In-memory only — a session token is meant to be short-lived and
// should not survive a page reload the way localStorage would.
let adminSession = null; // { token, expiresAt }

export function getAccountServiceConfig() {
  const config = getFineractConfig();
  return config?.accountServiceBaseUrl ? config : null;
}

export function isAccountServiceConfigured() {
  const config = getFineractConfig();
  return !!(config && config.accountServiceBaseUrl);
}

function clearAdminSession() {
  adminSession = null;
}

async function loginAdmin(config) {
  const url = `${config.accountServiceBaseUrl.replace(/\/+$/, '')}/admin/auth/login`;

  const res = await fetch(url, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ username: config.username, password: config.password }),
  });

  const payload = await res.json().catch(() => null);

  if (!res.ok || !payload?.data?.token) {
    throw new Error(payload?.message || 'Account Service admin login failed. Check the credentials in Connection settings.');
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

export async function accountApi(path, options = {}) {
  const config = getFineractConfig();
  if (!config || !config.accountServiceBaseUrl) {
    throw new Error('Account Service is not configured. Configure an Account Service URL to enable Account Number generation.');
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
    if (res.status === 404) return null;
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

// Generates the Account Number for a savings account just created in
// Fineract. Safe to retry — Account Service never regenerates a number
// once assigned to a fineractAccountId.
export async function registerAccount({ fineractAccountId, name, phoneNumber }) {
  const result = await accountApi('/accounts', {
    method: 'POST',
    body: { fineractAccountId: String(fineractAccountId), name, phoneNumber },
  });
  return result?.accountNumber;
}

// Returns { accountNumber, nuban, fineractAccountNumber, fineractAccountId }
// or null if no mapping exists yet for this savings account.
export async function getAccountIdentifiers(fineractAccountId) {
  const result = await accountApi(`/accounts/fineract/${fineractAccountId}`);
  return result?.data ?? null;
}
