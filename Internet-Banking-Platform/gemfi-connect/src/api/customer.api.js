import { apiRequest } from '@/api/client';
import { ENDPOINTS } from '@/api/endpoints';
export const getProfile = () => apiRequest(ENDPOINTS.customer.me);
export const updateProfile = (data) => apiRequest(ENDPOINTS.customer.me, { method: 'PATCH', body: JSON.stringify(data) });