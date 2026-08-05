import { SERVICES } from '@/api/services';

const BASE = SERVICES.onboarding;

export const ENDPOINTS = {
  admin: {
    login: `${BASE}/admin/onboarding/auth/login`,
    logout: `${BASE}/admin/onboarding/auth/logout`,
    session: `${BASE}/admin/onboarding/auth/session`,
    list: `${BASE}/admin/onboarding/requests`,
    create: `${BASE}/admin/onboarding/requests`,
    getById: (id) => `${BASE}/admin/onboarding/requests/${id}`,
    update: (id) => `${BASE}/admin/onboarding/requests/${id}`,
    reject: (id) => `${BASE}/admin/onboarding/requests/${id}/reject`,
    approve: (id) => `${BASE}/admin/onboarding/requests/${id}/approve`,
    setStatus: (id) => `${BASE}/admin/onboarding/requests/${id}/status`,
    tenantUsers: (id) => `${BASE}/admin/onboarding/requests/${id}/fineract/users`,
    tenantRoles: (id) => `${BASE}/admin/onboarding/requests/${id}/fineract/roles`,
  },
  logo: (id) => `${BASE}/onboarding/requests/${id}/logo`,
};
