import { SERVICES } from '@/api/services';

export const ENDPOINTS = {
  onboarding: {
    submit: `${SERVICES.onboarding}/onboarding/requests`,
    status: (id) => `${SERVICES.onboarding}/onboarding/requests/${id}/status`,
  },
};
