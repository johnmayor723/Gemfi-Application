// KYC Service API client — independent from Fineract
// Reads kycBaseUrl from the same localStorage config as Fineract.
// Admin access to kyc-service now requires a short-lived session
// token obtained by exchanging the stored Fineract credentials at
// POST /admin/auth/login (kyc-service verifies them against real
// Fineract, not just trusting whatever the client claims).
import { getFineractConfig } from './fineract';

// In-memory only — a session token is meant to be short-lived and
// should not survive a page reload the way localStorage would.
let adminSession = null; // { token, expiresAt }

export function getKycConfig() {
  const config = getFineractConfig();
  return config?.kycBaseUrl ? config : null;
}

export function isKycConfigured() {
  const config = getFineractConfig();
  return !!(config && config.kycBaseUrl);
}

function clearAdminSession() {
  adminSession = null;
}

async function loginAdmin(config) {
  const url = `${config.kycBaseUrl.replace(/\/+$/, '')}/admin/auth/login`;

  const res = await fetch(url, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ username: config.username, password: config.password }),
  });

  const payload = await res.json().catch(() => null);

  if (!res.ok || !payload?.data?.token) {
    throw new Error(payload?.message || 'KYC Service admin login failed. Check the credentials in Connection settings.');
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

export async function kycApi(path, options = {}) {
  const config = getFineractConfig();
  if (!config || !config.kycBaseUrl) {
    throw new Error('KYC Service is not configured. Configure a KYC API endpoint to enable identity verification and compliance features.');
  }

  const { method = 'GET', body, params, formData, isFile = false } = options;

  let url = `${config.kycBaseUrl.replace(/\/+$/, '')}${path}`;

  if (params) {
    const sp = new URLSearchParams();
    Object.entries(params).forEach(([k, v]) => {
      if (v !== undefined && v !== null && v !== '') sp.append(k, v);
    });
    const qs = sp.toString();
    if (qs) url += `?${qs}`;
  }

  const doFetch = async (token) => {
    const headers = {
      'Authorization': 'Bearer ' + token,
    };
    if (!isFile) headers['Content-Type'] = 'application/json';

    return fetch(url, {
      method,
      headers,
      body: formData || (body ? JSON.stringify(body) : undefined),
    });
  };

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
        errorMsg = err.errors.map(e => e.defaultUserMessage || e.developerMessage || JSON.stringify(e)).join('; ');
      } else {
        errorMsg = err.defaultUserMessage || err.message || err.developerMessage || JSON.stringify(err);
      }
    } catch {}
    throw new Error(errorMsg);
  }

  if (isFile) return res.blob();
  const text = await res.text();
  if (!text) return null;
  return JSON.parse(text);
}

// Upload file with progress tracking via XHR
export function kycUpload(path, file, fieldName = 'file', extraFields = {}, onProgress) {
  return new Promise((resolve, reject) => {
    const config = getFineractConfig();
    if (!config || !config.kycBaseUrl) {
      reject(new Error('KYC Service is not configured.'));
      return;
    }

    getAdminToken(config).then((token) => {
      const url = `${config.kycBaseUrl.replace(/\/+$/, '')}${path}`;
      const formData = new FormData();
      formData.append(fieldName, file);
      Object.entries(extraFields).forEach(([k, v]) => {
        if (v !== undefined && v !== null && v !== '') formData.append(k, v);
      });

      const xhr = new XMLHttpRequest();
      xhr.open('POST', url);
      xhr.setRequestHeader('Authorization', 'Bearer ' + token);

      xhr.upload.onprogress = (e) => {
        if (e.lengthComputable && onProgress) {
          onProgress(Math.round((e.loaded / e.total) * 100));
        }
      };

      xhr.onload = () => {
        if (xhr.status >= 200 && xhr.status < 300) {
          try { resolve(JSON.parse(xhr.responseText)); }
          catch { resolve(null); }
        } else if (xhr.status === 401) {
          clearAdminSession();
          reject(new Error('Admin session expired. Please retry the upload.'));
        } else {
          let msg = `HTTP ${xhr.status}`;
          try { const e = JSON.parse(xhr.responseText); msg = e.message || e.defaultUserMessage || msg; } catch {}
          reject(new Error(msg));
        }
      };

      xhr.onerror = () => reject(new Error('Network error during upload'));
      xhr.send(formData);
    }).catch(reject);
  });
}
