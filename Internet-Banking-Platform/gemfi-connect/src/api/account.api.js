import { apiRequest } from '@/api/client';
import { ENDPOINTS } from '@/api/endpoints';
export const getAccounts = () => apiRequest(ENDPOINTS.accounts.me);