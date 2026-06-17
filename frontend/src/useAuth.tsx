import React, { createContext, useState, useContext, useEffect } from 'react';
import { JwtResponse, MeResponse } from "@/types.ts";

interface Auth {
  ready: boolean;
  accessToken: string | null;
  user: MeResponse | null;
  impersonating: string | null;
  login: (token: string) => Promise<void>;
  logout: () => Promise<void>;
  refresh: () => Promise<void>;
  reloadUser: () => Promise<void>;
  impersonateBot: (token: string, botName: string) => Promise<void>;
}

const AuthContext = createContext<Auth | null>(null);

export const AuthProvider = ({ children }: { children: React.ReactNode }) => {
  const [ready, setReady] = useState(false);
  const [accessToken, setAccessToken] = useState<string | null>(null);
  const [user, setUser] = useState<MeResponse | null>(null);
  const [impersonating, setImpersonating] = useState<string | null>(null);

  const fetchUserInfo = async (token: string): Promise<MeResponse> => {
    const response = await fetch('/api/auth/me', { headers: { 'Authorization': `Bearer ${token}` } });
    if (!response.ok) {
      throw new Error('Failed to fetch user info');
    }
    return await response.json() as MeResponse;
  };

  const login = async (token: string) => {
    const userData = await fetchUserInfo(token);
    setUser(userData);
    setAccessToken(token);
    setImpersonating(null);
    setReady(true);
  };

  const logout = async () => {
    try {
      await fetch('/api/auth/logout', { method: 'POST', credentials: 'include' });
    } catch (error) {
      console.error('Failed to call logout endpoint:', error);
    }
    setAccessToken(null);
    setUser(null);
    setImpersonating(null);
    setReady(true);
  };

  const refresh = async () => {
    try {
      const response = await fetch('/api/auth/refresh', {
        method: 'POST',
        credentials: 'include',
      });

      if (response.ok) {
        const data = await response.json() as JwtResponse;
        // Match user's manual change in useAxios where res.data.accessToken is used
        const newToken = data.token;
        if (newToken) {
          const userData = await fetchUserInfo(newToken);
          setUser(userData);
          setAccessToken(newToken);
          setImpersonating(null);
        } else {
          await logout();
        }
      } else {
        await logout();
      }
    } catch (error) {
      console.log("Failed token refreshing:", error);
      await logout();
    } finally {
      setReady(true);
    }
  };

  const reloadUser = async () => {
    if (!accessToken) {
      return;
    }
    try {
      const userData = await fetchUserInfo(accessToken);
      setUser(userData);
    } catch (error) {
      console.error('Failed to fetch user info:', error);
    }
  }

  const impersonateBot = async (token: string, botName: string) => {
    const botUser = await fetchUserInfo(token);
    setUser(botUser);
    setAccessToken(token);
    setImpersonating(botName);
  };

  // Refresh tokens when a window is refreshed
  useEffect(() => {
    refresh().then();
  }, []);

  return (
    <AuthContext.Provider value={{ ready, accessToken, user, impersonating, login, logout, refresh, reloadUser, impersonateBot }}>
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};
