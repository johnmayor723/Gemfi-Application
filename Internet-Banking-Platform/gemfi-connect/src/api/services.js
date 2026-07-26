export const SERVICES = {
  auth: import.meta.env.VITE_AUTH_SERVICE_URL,
  account: import.meta.env.VITE_ACCOUNT_SERVICE_URL,
  customerProfile: import.meta.env.VITE_CUSTOMER_PROFILE_SERVICE_URL,
  transaction: import.meta.env.VITE_TRANSACTION_SERVICE_URL,
  beneficiary: import.meta.env.VITE_BENEFICIARY_SERVICE_URL,
  notification: import.meta.env.VITE_NOTIFICATION_SERVICE_URL,
  statement: import.meta.env.VITE_STATEMENT_SERVICE_URL,
  kyc: import.meta.env.VITE_KYC_SERVICE_URL,
};
