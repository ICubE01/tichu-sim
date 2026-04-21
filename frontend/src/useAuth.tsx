import React, { createContext, useState, useContext, useEffect } from 'react';

interface MeResponse {
  id: number;
  name: string;
}

interface Auth {
  ready: boolean;
  accessToken: string | null;
  user: MeResponse | null;
  login: (token: string) => void;
  logout: () => void;
  refresh: () => Promise<void>;
}

const AuthContext = createContext<Auth | null>(null);

export const AuthProvider = ({ children }: { children: React.ReactNode }) => {
  const [ready, setReady] = useState(false);
  const [accessToken, setAccessToken] = useState<string | null>(null);
  const [user, setUser] = useState<MeResponse | null>(null);

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
    fetchUserInfo(token).then();
    setReady(true);
  };

  const logout = () => {
    setAccessToken(null);
    setUser(null);
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
        const newToken = data.accessToken || data.token;
        if (newToken) {
          setAccessToken(newToken);
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

  // Refresh tokens when a window is refreshed
  useEffect(() => {
    refresh().then();
  }, []);

  return (
    <AuthContext.Provider value={{ ready, accessToken, user, login, logout, refresh }}>
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
