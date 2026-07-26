import React, { createContext, useContext, useEffect, useMemo, useState } from 'react';
import { login as loginRequest, logout as clearSession } from '@/api/auth.api';
import { tokens } from '@/api/client';

const AuthContext = createContext(null);
export const useBankAuth = () => useContext(AuthContext);

export default function AuthProvider({ children }) {
  const [user, setUser] = useState(() => JSON.parse(sessionStorage.getItem('gemfi_user') || 'null'));
  const [loading, setLoading] = useState(false);
  const signIn = async (identifier, password) => {
    setLoading(true);
    try { const nextUser = await loginRequest(identifier, password); setUser(nextUser); sessionStorage.setItem('gemfi_user', JSON.stringify(nextUser)); }
    finally { setLoading(false); }
  };
  const authenticateWith = (data) => {
    tokens.set(data.accessToken, data.refreshToken);
    setUser(data.user);
    sessionStorage.setItem('gemfi_user', JSON.stringify(data.user));
  };
  const signOut = () => { clearSession(); setUser(null); sessionStorage.removeItem('gemfi_user'); };
  useEffect(() => {
    const unauthorized = () => signOut();
    window.addEventListener('gemfi:unauthorized', unauthorized);
    return () => window.removeEventListener('gemfi:unauthorized', unauthorized);
  }, []);
  const value = useMemo(() => ({ user, loading, isAuthenticated: Boolean(user && tokens.access), signIn, authenticateWith, signOut }), [user, loading]);
  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}