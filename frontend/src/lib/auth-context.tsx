/* eslint-disable */
'use client';
import React, { createContext, useContext, useState, useEffect, useCallback, ReactNode } from 'react';
import { User, authAPI } from './api';

interface AuthContextType {
  user: User | null;
  token: string | null;
  login: (email: string, password: string) => Promise<void>;
  register: (data: { email: string; password: string; first_name: string; last_name: string }) => Promise<void>;
  logout: () => void;
  loading: boolean;
}

const AuthContext = createContext<AuthContextType | null>(null);

// Module-level logout ref so api.ts can call it on 401 without circular imports
let _logoutCallback: (() => void) | null = null;
export function getLogoutCallback() { return _logoutCallback; }

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [token, setToken] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);

  const logout = useCallback(() => {
    localStorage.removeItem('airbnb_token');
    setToken(null);
    setUser(null);
  }, []);

  // Register the logout callback so api.ts interceptor can use it
  useEffect(() => {
    _logoutCallback = logout;
    return () => { _logoutCallback = null; };
  }, [logout]);

  useEffect(() => {
    const savedToken = localStorage.getItem('airbnb_token');
    if (!savedToken) {
      setLoading(false);
      return;
    }
    // Optimistically restore token into state so components don't flash unauthenticated
    setToken(savedToken);
    authAPI.getMe(savedToken)
      .then(u => setUser(u))
      .catch((err: Error) => {
        // Only clear credentials on definitive auth failures (401/403).
        // Preserve them on network errors so a Render cold-start doesn't log the user out.
        const isAuthError =
          err.message.includes('401') ||
          err.message.includes('403') ||
          err.message.toLowerCase().includes('unauthorized') ||
          err.message.toLowerCase().includes('forbidden') ||
          err.message.toLowerCase().includes('not authenticated') ||
          err.message.toLowerCase().includes('authentication required');
        if (isAuthError) {
          localStorage.removeItem('airbnb_token');
          setToken(null);
          setUser(null);
        }
        // On non-auth errors (network timeout, backend cold-start), keep the token
        // so the user stays logged in once the backend comes back.
      })
      .finally(() => setLoading(false));
  }, []);

  const login = async (email: string, password: string) => {
    const res = await authAPI.login({ email, password });
    localStorage.setItem('airbnb_token', res.access_token);
    setToken(res.access_token);
    setUser(res.user);
  };

  const register = async (data: { email: string; password: string; first_name: string; last_name: string }) => {
    const res = await authAPI.register(data);
    localStorage.setItem('airbnb_token', res.access_token);
    setToken(res.access_token);
    setUser(res.user);
  };

  return (
    <AuthContext.Provider value={{ user, token, login, register, logout, loading }}>
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error('useAuth must be used inside AuthProvider');
  return ctx;
}
