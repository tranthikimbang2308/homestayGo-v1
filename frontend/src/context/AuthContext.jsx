import { createContext, useCallback, useContext, useEffect, useMemo, useState } from 'react';
import client, { TOKEN_KEY } from '../api/client.js';

const AuthContext = createContext(null);

export function AuthProvider({ children }) {
  const [token, setToken] = useState(() => localStorage.getItem(TOKEN_KEY));
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(() => Boolean(localStorage.getItem(TOKEN_KEY)));

  const clearSession = useCallback(() => {
    localStorage.removeItem(TOKEN_KEY);
    setToken(null);
    setUser(null);
  }, []);

  useEffect(() => {
    const handleUnauthorized = () => {
      setToken(null);
      setUser(null);
    };
    window.addEventListener('hg:unauthorized', handleUnauthorized);
    return () => window.removeEventListener('hg:unauthorized', handleUnauthorized);
  }, []);

  useEffect(() => {
    let cancelled = false;
    if (!token) {
      setLoading(false);
      return undefined;
    }
    if (user) {
      setLoading(false);
      return undefined;
    }
    setLoading(true);
    client
      .get('/auth/me')
      .then((res) => {
        if (!cancelled) setUser(res.data.data);
      })
      .catch(() => {
        if (!cancelled) clearSession();
      })
      .finally(() => {
        if (!cancelled) setLoading(false);
      });
    return () => {
      cancelled = true;
    };
  }, [token]);

  const applySession = useCallback((data) => {
    localStorage.setItem(TOKEN_KEY, data.token);
    setUser(data.user);
    setToken(data.token);
    setLoading(false);
    return data.user;
  }, []);

  const login = useCallback(
    async (email, password) => {
      const res = await client.post('/auth/login', { email, password });
      return applySession(res.data.data);
    },
    [applySession]
  );

  const register = useCallback(
    async (payload) => {
      const res = await client.post('/auth/register', payload);
      return applySession(res.data.data);
    },
    [applySession]
  );

  const logout = useCallback(() => {
    clearSession();
  }, [clearSession]);

  const updateUser = useCallback((nextUser) => {
    setUser((prev) => (typeof nextUser === 'function' ? nextUser(prev) : { ...prev, ...nextUser }));
  }, []);

  const value = useMemo(
    () => ({
      user,
      token,
      loading,
      login,
      register,
      logout,
      updateUser,
      isAuthenticated: Boolean(token && user),
    }),
    [user, token, loading, login, register, logout, updateUser]
  );

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

export function useAuth() {
  const context = useContext(AuthContext);
  if (!context) throw new Error('useAuth phải dùng bên trong AuthProvider');
  return context;
}

export default AuthContext;
