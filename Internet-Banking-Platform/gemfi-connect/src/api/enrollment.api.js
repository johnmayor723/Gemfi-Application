import { apiRequest } from '@/api/client';
import { ENDPOINTS } from '@/api/endpoints';

export const startEnrollment = (payload) =>
  apiRequest(ENDPOINTS.auth.enrollment.start, { method: 'POST', body: JSON.stringify(payload) }, false);

export const verifyEnrollment = (payload) =>
  apiRequest(ENDPOINTS.auth.enrollment.verify, { method: 'POST', body: JSON.stringify(payload) }, false);

export const completeEnrollment = (payload) =>
  apiRequest(ENDPOINTS.auth.enrollment.complete, { method: 'POST', body: JSON.stringify(payload) }, false);