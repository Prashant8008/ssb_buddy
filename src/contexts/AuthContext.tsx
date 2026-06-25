import React, { createContext, useCallback, useContext, useEffect, useState } from 'react';

function hasValidToken(): boolean {
  const token = localStorage.getItem('access_token');
  if (!token) return false;
  try {
    const payload = JSON.parse(atob(token.split('.')[1]));
    if (payload.exp && payload.exp * 1000 < Date.now()) return false;
    return true;
  } catch {
    return false;
  }
}

interface AuthContextValue {
  isAuthenticated: boolean;
  login: (access: string, refresh: string) => void;
  logoutLocal: () => void;
}

const AuthContext = createContext<AuthContextValue | null>(null);

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [isAuthenticated, setIsAuthenticated] = useState(hasValidToken);

  const login = useCallback((access: string, refresh: string) => {
    localStorage.setItem('access_token', access);
    localStorage.setItem('refresh_token', refresh);
    setIsAuthenticated(true);
    window.dispatchEvent(new Event('auth:login'));
  }, []);

  const logoutLocal = useCallback(() => {
    localStorage.removeItem('access_token');
    localStorage.removeItem('refresh_token');
    setIsAuthenticated(false);
    window.dispatchEvent(new Event('auth:logout'));
  }, []);

  useEffect(() => {
    const sync = () => setIsAuthenticated(hasValidToken());
    window.addEventListener('storage', sync);
    window.addEventListener('auth:login', sync);
    window.addEventListener('auth:logout', sync);
    return () => {
      window.removeEventListener('storage', sync);
      window.removeEventListener('auth:login', sync);
      window.removeEventListener('auth:logout', sync);
    };
  }, []);

  useEffect(() => {
    if (!hasValidToken()) {
      localStorage.removeItem('access_token');
      localStorage.removeItem('refresh_token');
      setIsAuthenticated(false);
    }
  }, []);

  return (
    <AuthContext.Provider value={{ isAuthenticated, login, logoutLocal }}>
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error('useAuth must be used within AuthProvider');
  return ctx;
}
