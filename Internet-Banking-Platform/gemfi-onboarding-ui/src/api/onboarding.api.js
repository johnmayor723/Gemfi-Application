import { ENDPOINTS } from '@/api/endpoints';

async function parseResponse(response) {
  const body = response.status === 204 ? null : await response.json().catch(() => null);
  if (!response.ok) throw Object.assign(new Error(body?.message || 'Request failed'), { status: response.status, body });
  return body;
}

/**
 * `payload.logo` (if present) must be a File - sent as multipart so the
 * browser sets the multipart boundary itself, not JSON.
 */
export async function submitOnboardingRequest(payload) {
  const formData = new FormData();
  formData.append('companyName', payload.companyName);
  formData.append('contactEmail', payload.contactEmail);
  formData.append('contactPhone', payload.contactPhone);
  if (payload.contactAddress) formData.append('contactAddress', payload.contactAddress);
  formData.append('primaryColor', payload.primaryColor);
  formData.append('secondaryColor', payload.secondaryColor);
  if (payload.logo) formData.append('logo', payload.logo);

  const response = await fetch(ENDPOINTS.onboarding.submit, {
    method: 'POST',
    body: formData,
  });
  return parseResponse(response);
}

export async function getOnboardingStatus(id) {
  const response = await fetch(ENDPOINTS.onboarding.status(id));
  return parseResponse(response);
}
