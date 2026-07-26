import { apiRequest } from '@/api/client';
import { ENDPOINTS } from '@/api/endpoints';
export const getBulkTransfers = () => apiRequest(ENDPOINTS.bulkTransfers.list);
export const initiateBulkTransfer = (data) => apiRequest(ENDPOINTS.bulkTransfers.create, { method: 'POST', body: JSON.stringify(data), idempotent: true });
export const confirmBulkTransfer = (id, code) => apiRequest(ENDPOINTS.bulkTransfers.confirm(id), { method: 'POST', body: JSON.stringify({ code }), idempotent: true });
