const STORAGE_KEY = 'gemfi_admin_session';

/**
 * sessionStorage (not localStorage) - an admin session is
 * meant to end with the browser tab, matching the server's
 * own short-lived-token model rather than persisting a login
 * indefinitely on a shared machine.
 */
export function getSession() {
  const raw = sessionStorage.getItem(STORAGE_KEY);
  if (!raw) return null;
  try {
    const session = JSON.parse(raw);
    if (session.expiresAt <= Date.now()) {
      sessionStorage.removeItem(STORAGE_KEY);
      return null;
    }
    return session;
  } catch {
    sessionStorage.removeItem(STORAGE_KEY);
    return null;
  }
}

export function setSession({ token, expiresInMinutes, admin }) {
  const session = {
    token,
    admin,
    expiresAt: Date.now() + expiresInMinutes * 60 * 1000,
  };
  sessionStorage.setItem(STORAGE_KEY, JSON.stringify(session));
  return session;
}

export function clearSession() {
  sessionStorage.removeItem(STORAGE_KEY);
}

/**
 * Fired whenever the server rejects the current token (expired,
 * invalid, or timed out from inactivity) so the app can react
 * from wherever the 401 happened, not just from the call site.
 */
export const SESSION_EXPIRED_EVENT = 'gemfi-admin-session-expired';

export function notifySessionExpired() {
  clearSession();
  window.dispatchEvent(new Event(SESSION_EXPIRED_EVENT));
}
