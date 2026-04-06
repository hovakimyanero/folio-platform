import React, { createContext, useContext, useState, useEffect, useCallback } from 'react';
import { api, apiJson, saveTokens, clearTokens, loadTokens, getAccessToken } from '../services/api';

const AuthContext = createContext(null);

export function AuthProvider({ children }) {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);

  const checkAuth = useCallback(async () => {
    try {
      await loadTokens();
      if (!getAccessToken()) { setLoading(false); return; }
      const res = await api('/auth/me');
      if (res.ok) {
        const data = await res.json();
        setUser(data);
      } else {
        await clearTokens();
      }
    } catch {
      await clearTokens();
    }
    setLoading(false);
  }, []);

  useEffect(() => { checkAuth(); }, [checkAuth]);

  const login = async (email, password) => {
    const data = await apiJson('/auth/login', {
      method: 'POST',
      body: { email, password },
    });
    await saveTokens(data.accessToken, data.refreshToken);
    setUser(data.user);
    return data;
  };

  const register = async (username, email, password) => {
    const data = await apiJson('/auth/register', {
      method: 'POST',
      body: { username, email, password },
    });
    return data;
  };

  const forgotPassword = async (email) => {
    return apiJson('/auth/forgot-password', {
      method: 'POST',
      body: { email },
    });
  };

  const resendVerification = async (email) => {
    return apiJson('/auth/resend-verification', {
      method: 'POST',
      body: { email },
    });
  };

  const logout = async () => {
    await clearTokens();
    setUser(null);
  };

  return (
    <AuthContext.Provider value={{ user, setUser, loading, login, register, forgotPassword, resendVerification, logout }}>
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error('useAuth must be inside AuthProvider');
  return ctx;
}
