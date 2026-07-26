import { apiRequest, tokens } from '@/api/client';
import { ENDPOINTS } from '@/api/endpoints';

export async function login(identifier, password) {
  const result = await apiRequest(ENDPOINTS.auth.login, {
    method: 'POST', body: JSON.stringify({ identifier: identifier.trim(), password }),
  }, false);
  tokens.set(result.data.accessToken, result.data.refreshToken);
  return result.data.user;
}
export async function logout() {
  const refreshToken = tokens.refresh;
  tokens.clear();
  if (!refreshToken) return;
  await apiRequest(ENDPOINTS.auth.logout, {
    method: 'POST', body: JSON.stringify({ refreshToken }),
  }, false).catch(() => {});
}
export const forgotPassword = (identifier) => apiRequest(ENDPOINTS.auth.forgotPassword, {
  method: 'POST', body: JSON.stringify({ identifier: identifier.trim() }),
}, false);
export const resetPassword = (data) => apiRequest(ENDPOINTS.auth.resetPassword, {
  method: 'POST', body: JSON.stringify(data),
}, false);
export const changePassword = (data) => apiRequest(ENDPOINTS.auth.changePassword, {
  method: 'POST', body: JSON.stringify(data),
});
export const getSessions = () => apiRequest(ENDPOINTS.auth.sessions);
export const logoutAll = () => apiRequest(ENDPOINTS.auth.logoutAll, { method: 'POST' });