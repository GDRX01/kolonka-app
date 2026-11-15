import { createContext, useCallback, useContext, useEffect, useMemo, useState } from 'react';
import { api, tokenStore } from './api.js';

const AuthContext = createContext(null);
export const useAuth = () => useContext(AuthContext);

export function AuthProvider({ children }) {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(!!tokenStore.get()); // only wait if there is a token to check

  const loadMe = useCallback(async () => {
    try {
      const data = await api('/me');
      setUser(data.user);
    } catch {
      tokenStore.clear();
      setUser(null);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    if (tokenStore.get()) loadMe();
    const expired = () => setUser(null);
    window.addEventListener('auth:expired', expired);
    return () => window.removeEventListener('auth:expired', expired);
  }, [loadMe]);

  const login = useCallback(async (email, password, remember) => {
    const data = await api('/login', { method: 'POST', body: { email, password } });
    tokenStore.set(data.token, remember);
    setUser(data.user);
    return data.user;
  }, []);

  const register = useCallback(async (payload) => {
    const data = await api('/register', { method: 'POST', body: payload });
    tokenStore.set(data.token, true);
    setUser(data.user);
    return data.user;
  }, []);

  const logout = useCallback(async () => {
    try {
      await api('/logout', { method: 'POST' });
    } catch {
      /* token may already be invalid */
    }
    tokenStore.clear();
    setUser(null);
  }, []);

  const value = useMemo(
    () => ({ user, setUser, loading, login, register, logout, isAdmin: user?.role === 'admin' }),
    [user, loading, login, register, logout],
  );
  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}
