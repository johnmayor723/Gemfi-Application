import { createContext, useContext, useEffect, useState, useCallback } from 'react';
import { getSession, clearSession, SESSION_EXPIRED_EVENT } from '@/lib/session';
import * as adminApi from '@/api/admin.api';

const AuthContext = createContext(null);

export function AuthProvider({ children }) {
  const [session, setSessionState] = useState(() => getSession());

  useEffect(() => {
    const onExpired = () => setSessionState(null);
    window.addEventListener(SESSION_EXPIRED_EVENT, onExpired);
    return () => window.removeEventListener(SESSION_EXPIRED_EVENT, onExpired);
  }, []);

  const login = useCallback(async (username, password) => {
    const newSession = await adminApi.login(username, password);
    setSessionState(newSession);
    return newSession;
  }, []);

  const logout = useCallback(async () => {
    await adminApi.logout().catch(() => {});
    clearSession();
    setSessionState(null);
  }, []);

  return (
    <AuthContext.Provider value={{ admin: session?.admin || null, isAuthenticated: !!session, login, logout }}>
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error('useAuth must be used within AuthProvider');
  return ctx;
}
