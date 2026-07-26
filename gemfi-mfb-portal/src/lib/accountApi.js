// Account Service API client — independent from Fineract, called
// directly from the browser (not proxied through the Fineract gateway).
// Reads accountServiceBaseUrl from the same localStorage config as Fineract.
import { getFineractConfig } from './fineract';

export function getAccountServiceConfig() {
  const config = getFineractConfig();
  return config?.accountServiceBaseUrl ? config : null;
}

export function isAccountServiceConfigured() {
  const config = getFineractConfig();
  return !!(config && config.accountServiceBaseUrl);
}

export async function accountApi(path, options = {}) {
  const config = getFineractConfig();
  if (!config || !config.accountServiceBaseUrl) {
    throw new Error('Account Service is not configured. Configure an Account Service URL to enable Account Number generation.');
  }

  const { method = 'GET', body } = options;

  const url = `${config.accountServiceBaseUrl.replace(/\/+$/, '')}${path}`;

  const res = await fetch(url, {
    method,
    headers: { 'Content-Type': 'application/json' },
    body: body ? JSON.stringify(body) : undefined,
  });

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
