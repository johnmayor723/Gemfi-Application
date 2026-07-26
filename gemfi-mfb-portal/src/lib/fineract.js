// Fineract API client — stores config in localStorage, no Base44 entities

const STORAGE_KEY = 'fineract_config';

export function getFineractConfig() {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (!raw) return null;
    return JSON.parse(raw);
  } catch {
    return null;
  }
}

export function saveFineractConfig(config) {
  localStorage.setItem(STORAGE_KEY, JSON.stringify(config));
}

export function clearFineractConfig() {
  localStorage.removeItem(STORAGE_KEY);
}

export function isConfigured() {
  const config = getFineractConfig();
  return !!(config && config.baseUrl && config.tenantId && config.username && config.password);
}

export async function fineractApi(path, options = {}) {
  const config = getFineractConfig();
  if (!config) throw new Error('Fineract not configured');

  const { method = 'GET', body, params } = options;
  
  let url = `${config.baseUrl.replace(/\/+$/, '')}/fineract-provider/api/v1${path}`;
  
  if (params) {
    const sp = new URLSearchParams();
    Object.entries(params).forEach(([k, v]) => {
      if (v !== undefined && v !== null && v !== '') sp.append(k, v);
    });
    const qs = sp.toString();
    if (qs) url += `?${qs}`;
  }

  const headers = {
    'Content-Type': 'application/json',
    'Fineract-Platform-TenantId': config.tenantId,
    'Authorization': 'Basic ' + btoa(`${config.username}:${config.password}`),
  };

  const res = await fetch(url, {
    method,
    headers,
    body: body ? JSON.stringify(body) : undefined,
  });

  if (!res.ok) {
    let errorMsg = `HTTP ${res.status}`;
    try {
      const err = await res.json();
      if (err.errors && err.errors.length > 0) {
        errorMsg = err.errors.map(e => e.defaultUserMessage || e.developerMessage || JSON.stringify(e)).join('; ');
      } else {
        errorMsg = err.defaultUserMessage || err.developerMessage || JSON.stringify(err);
      }
    } catch {}
    throw new Error(errorMsg);
  }

  const text = await res.text();
  if (!text) return null;
  return JSON.parse(text);
}