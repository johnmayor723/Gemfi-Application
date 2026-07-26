import { apiRequest } from '@/api/client';
import { ENDPOINTS } from '@/api/endpoints';
export const getNotifications = () => apiRequest(ENDPOINTS.notifications.list);
export const markNotificationRead = (id) => apiRequest(ENDPOINTS.notifications.markRead(id), { method: 'PATCH' });
