import React, { createContext, useState, useContext, useEffect } from 'react';

export type Role = 'USER' | 'ADMIN' | 'BOT';

interface MeResponse {
  id: number;
  name: string;
  role: Role;
}

interface Auth {
  ready: boolean;
  accessToken: string | null;
  user: MeResponse | null;
  impersonating: string | null;
  login: (token: string) => void;
  logout: () => Promise<void>;
  refresh: () => Promise<void>;
  becomeBot: (token: string, botName: string) => Promise<void>;
}

const AuthContext = createContext<Auth | null>(null);

export const AuthProvider = ({ children }: { children: React.ReactNode }) => {
  const [ready, setReady] = useState(false);
  const [accessToken, setAccessToken] = useState<string | null>(null);
  const [user, setUser] = useState<MeResponse | null>(null);
  const [impersonating, setImpersonating] = useState<string | null>(null);

  const fetchUserInfo = async (token: string) => {
    try {
      const response = await fetch('/api/auth/me', {
        headers: { 'Authorization': `Bearer ${token}` }
      });
      if (response.ok) {
        const userData = await response.json();
        setUser(userData);
      }
    } catch (error) {
      console.error("Failed to fetch user info:", error);
    }
  };

  const login = (token: string) => {
    setAccessToken(token);
    setImpersonating(null);
    fetchUserInfo(token).then();
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
        const data = await response.json();
        // Match user's manual change in useAxios where res.data.accessToken is used
        const newToken = data.token;
        if (newToken) {
          setAccessToken(newToken);
          setImpersonating(null);
          await fetchUserInfo(newToken);
        } else {
          logout();
        }
      } else {
        logout();
      }
    } catch (error) {
      console.log("Failed token refreshing:", error);
      logout();
    } finally {
      setReady(true);
    }
  };

  const becomeBot = async (token: string, botName: string) => {
    setUser(null);
    setAccessToken(token);
    setImpersonating(botName);
    await fetchUserInfo(token);
  };

  // Refresh tokens when a window is refreshed
  useEffect(() => {
    refresh().then();
  }, []);

  return (
    <AuthContext.Provider value={{ ready, accessToken, user, impersonating, login, logout, refresh, becomeBot }}>
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
