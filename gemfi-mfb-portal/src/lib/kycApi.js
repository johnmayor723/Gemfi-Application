// KYC Service API client — independent from Fineract
// Reads kycBaseUrl from the same localStorage config as Fineract.
import { getFineractConfig } from './fineract';

export function getKycConfig() {
  const config = getFineractConfig();
  return config?.kycBaseUrl ? config : null;
}

export function isKycConfigured() {
  const config = getFineractConfig();
  return !!(config && config.kycBaseUrl);
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

  const headers = {
    'Fineract-Platform-TenantId': config.tenantId,
    'Authorization': 'Basic ' + btoa(`${config.username}:${config.password}`),
  };

  if (!isFile) headers['Content-Type'] = 'application/json';

  const res = await fetch(url, {
    method,
    headers,
    body: formData || (body ? JSON.stringify(body) : undefined),
  });

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

    const url = `${config.kycBaseUrl.replace(/\/+$/, '')}${path}`;
    const formData = new FormData();
    formData.append(fieldName, file);
    Object.entries(extraFields).forEach(([k, v]) => {
      if (v !== undefined && v !== null && v !== '') formData.append(k, v);
    });

    const xhr = new XMLHttpRequest();
    xhr.open('POST', url);
    xhr.setRequestHeader('Fineract-Platform-TenantId', config.tenantId);
    xhr.setRequestHeader('Authorization', 'Basic ' + btoa(`${config.username}:${config.password}`));

    xhr.upload.onprogress = (e) => {
      if (e.lengthComputable && onProgress) {
        onProgress(Math.round((e.loaded / e.total) * 100));
      }
    };

    xhr.onload = () => {
      if (xhr.status >= 200 && xhr.status < 300) {
        try { resolve(JSON.parse(xhr.responseText)); }
        catch { resolve(null); }
      } else {
        let msg = `HTTP ${xhr.status}`;
        try { const e = JSON.parse(xhr.responseText); msg = e.message || e.defaultUserMessage || msg; } catch {}
        reject(new Error(msg));
      }
    };

    xhr.onerror = () => reject(new Error('Network error during upload'));
    xhr.send(formData);
  });
}