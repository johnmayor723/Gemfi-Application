import { apiRequest } from '@/api/client';
import { ENDPOINTS } from '@/api/endpoints';
export const getBeneficiaries = () => apiRequest(ENDPOINTS.beneficiaries.list);
export const createBeneficiary = (data) => apiRequest(ENDPOINTS.beneficiaries.create, { method: 'POST', body: JSON.stringify(data) });
export const updateBeneficiary = (id, data) => apiRequest(ENDPOINTS.beneficiaries.byId(id), { method: 'PATCH', body: JSON.stringify(data) });
export const deleteBeneficiary = (id) => apiRequest(ENDPOINTS.beneficiaries.byId(id), { method: 'DELETE' });
