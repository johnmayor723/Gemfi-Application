import { SERVICES } from '@/api/services';

export const ENDPOINTS = {
  auth: {
    login: `${SERVICES.auth}/auth/login`,
    refresh: `${SERVICES.auth}/auth/refresh-token`,
    logout: `${SERVICES.auth}/auth/logout`,
    logoutAll: `${SERVICES.auth}/auth/logout-all`,
    sessions: `${SERVICES.auth}/auth/sessions`,
    forgotPassword: `${SERVICES.auth}/auth/forgot-password`,
    resetPassword: `${SERVICES.auth}/auth/reset-password`,
    changePassword: `${SERVICES.auth}/auth/change-password`,
    enrollment: {
      start: `${SERVICES.auth}/auth/enrollment/start`,
      verify: `${SERVICES.auth}/auth/enrollment/verify`,
      complete: `${SERVICES.auth}/auth/enrollment/complete`,
    },
  },
  customer: { me: `${SERVICES.customerProfile}/profile` },
  accounts: { me: `${SERVICES.account}/accounts/me` },
  transfers: {
    initiate: `${SERVICES.transaction}/transfers`,
    confirm: (id) => `${SERVICES.transaction}/transfers/${id}/confirm`,
  },
  beneficiaries: {
    list: `${SERVICES.beneficiary}/beneficiaries`,
    create: `${SERVICES.beneficiary}/beneficiaries`,
    byId: (id) => `${SERVICES.beneficiary}/beneficiaries/${id}`,
  },
  notifications: {
    list: `${SERVICES.notification}/notifications`,
    markRead: (id) => `${SERVICES.notification}/notifications/${id}/read`,
  },
  statements: {
    generate: `${SERVICES.statement}/statements`,
  },
  standingOrders: {
    list: `${SERVICES.transaction}/standing-orders`,
    create: `${SERVICES.transaction}/standing-orders`,
    byId: (id) => `${SERVICES.transaction}/standing-orders/${id}`,
    confirm: (id) => `${SERVICES.transaction}/standing-orders/${id}/confirm`,
    cancel: (id) => `${SERVICES.transaction}/standing-orders/${id}/cancel`,
    pause: (id) => `${SERVICES.transaction}/standing-orders/${id}/pause`,
    resume: (id) => `${SERVICES.transaction}/standing-orders/${id}/resume`,
  },
  bulkTransfers: {
    list: `${SERVICES.transaction}/bulk-transfers`,
    create: `${SERVICES.transaction}/bulk-transfers`,
    byId: (id) => `${SERVICES.transaction}/bulk-transfers/${id}`,
    confirm: (id) => `${SERVICES.transaction}/bulk-transfers/${id}/confirm`,
  },
  kyc: {
    me: `${SERVICES.kyc}/kyc/me`,
    linkBvn: `${SERVICES.kyc}/kyc/link-bvn`,
    linkNin: `${SERVICES.kyc}/kyc/link-nin`,
  },
};
