import { apiRequest } from '@/api/client';
import { ENDPOINTS } from '@/api/endpoints';

export const getKycMe = () => apiRequest(ENDPOINTS.kyc.me);
export const linkBvn = (bvn) => apiRequest(ENDPOINTS.kyc.linkBvn, { method: 'POST', body: JSON.stringify({ bvn }) });
export const linkNin = (nin) => apiRequest(ENDPOINTS.kyc.linkNin, { method: 'POST', body: JSON.stringify({ nin }) });
