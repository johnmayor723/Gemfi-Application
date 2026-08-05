// Agency Service API client — independent from Fineract, called
// directly from the browser. Reads accountServiceBaseUrl from the
// same localStorage config as Fineract/Account Service — nginx
// fronts agency-service on that same host under /agents and
// /admin/agency.
//
// Admin actions require a short-lived session token, obtained the
// same way as account-service's: exchange the Fineract credentials
// already stored in Connection settings at
// POST /admin/agency/auth/login (agency-service verifies them
// against real Fineract).
import { getFineractConfig } from './fineract';

// In-memory only — a session token is meant to be short-lived and
// should not survive a page reload the way localStorage would.
let adminSession = null; // { token, expiresAt }

export function isAgencyServiceConfigured() {
  const config = getFineractConfig();
  return !!(config && config.accountServiceBaseUrl);
}

function clearAdminSession() {
  adminSession = null;
}

async function loginAdmin(config) {
  const url = `${config.accountServiceBaseUrl.replace(/\/+$/, '')}/admin/agency/auth/login`;

  const res = await fetch(url, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ username: config.username, password: config.password }),
  });

  const payload = await res.json().catch(() => null);

  if (!res.ok || !payload?.data?.token) {
    throw new Error(payload?.message || 'Agency Service admin login failed. Check the credentials in Connection settings.');
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

export async function agencyApi(path, options = {}) {
  const config = getFineractConfig();
  if (!config || !config.accountServiceBaseUrl) {
    throw new Error('Agency Service is not configured. Configure an Account Service URL to enable agent management.');
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

export async function listAgents({ status, agentType, parentAgentId } = {}) {
  const params = new URLSearchParams();
  if (status) params.set('status', status);
  if (agentType) params.set('agentType', agentType);
  if (parentAgentId) params.set('parentAgentId', parentAgentId);
  const qs = params.toString();
  const result = await agencyApi(`/agents${qs ? `?${qs}` : ''}`);
  return result?.data ?? [];
}

export async function getAgent(id) {
  const result = await agencyApi(`/agents/${id}`);
  return result?.data ?? null;
}

export async function approveAgent(id, {
  settlementFineractAccountId,
  settlementFineractAccountNumber,
  commissionSchedule,
  dailyCashInLimit,
  dailyCashOutLimit,
  perTransactionLimit,
}) {
  const result = await agencyApi(`/agents/${id}/approve`, {
    method: 'PATCH',
    body: {
      settlementFineractAccountId: settlementFineractAccountId || undefined,
      settlementFineractAccountNumber: settlementFineractAccountNumber || undefined,
      commissionSchedule,
      dailyCashInLimit,
      dailyCashOutLimit,
      perTransactionLimit,
    },
  });
  return result?.data ?? null;
}

export async function rejectAgent(id, rejectionReason) {
  const result = await agencyApi(`/agents/${id}/reject`, {
    method: 'PATCH',
    body: { rejectionReason },
  });
  return result?.data ?? null;
}

export async function updateAgentStatus(id, status) {
  const result = await agencyApi(`/agents/${id}/status`, {
    method: 'PATCH',
    body: { status },
  });
  return result?.data ?? null;
}

export async function updateCommissionSchedule(id, commissionSchedule) {
  const result = await agencyApi(`/agents/${id}/commission-schedule`, {
    method: 'PATCH',
    body: { commissionSchedule },
  });
  return result?.data ?? null;
}

export async function updateAgentLimits(id, { dailyCashInLimit, dailyCashOutLimit, perTransactionLimit }) {
  const result = await agencyApi(`/agents/${id}/limits`, {
    method: 'PATCH',
    body: { dailyCashInLimit, dailyCashOutLimit, perTransactionLimit },
  });
  return result?.data ?? null;
}
