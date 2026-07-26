import { apiRequest } from '@/api/client';
import { ENDPOINTS } from '@/api/endpoints';
export const getStandingOrders = () => apiRequest(ENDPOINTS.standingOrders.list);
export const initiateStandingOrder = (data) => apiRequest(ENDPOINTS.standingOrders.create, { method: 'POST', body: JSON.stringify(data), idempotent: true });
export const confirmStandingOrder = (id, code) => apiRequest(ENDPOINTS.standingOrders.confirm(id), { method: 'POST', body: JSON.stringify({ code }), idempotent: true });
export const cancelStandingOrder = (id) => apiRequest(ENDPOINTS.standingOrders.cancel(id), { method: 'POST' });
export const pauseStandingOrder = (id) => apiRequest(ENDPOINTS.standingOrders.pause(id), { method: 'POST' });
export const resumeStandingOrder = (id) => apiRequest(ENDPOINTS.standingOrders.resume(id), { method: 'POST' });
