import { apiRequest } from '@/api/client';
import { ENDPOINTS } from '@/api/endpoints';
export const initiateTransfer = (data) => apiRequest(ENDPOINTS.transfers.initiate, { method: 'POST', body: JSON.stringify(data), idempotent: true });
export const confirmTransfer = (id, code) => apiRequest(ENDPOINTS.transfers.confirm(id), { method: 'POST', body: JSON.stringify({ code }), idempotent: true });
