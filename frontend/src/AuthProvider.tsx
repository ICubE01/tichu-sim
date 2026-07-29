import React, { useCallback, useEffect, useMemo, useState } from 'react';
import { JwtResponse, UserAuthDto } from "@/types.ts";
import { AuthContext } from '@/AuthContext.ts';

const fetchUserInfo = async (token: string): Promise<UserAuthDto> => {
  const response = await fetch('/api/auth/me', { headers: { 'Authorization': `Bearer ${token}` } });
  if (!response.ok) {
    throw new Error('Failed to fetch user info');
  }
  return await response.json() as UserAuthDto;
};

export const AuthProvider = ({ children }: { children: React.ReactNode }) => {
  const [ready, setReady] = useState(false);
  const [accessToken, setAccessToken] = useState<string | null>(null);
  const [user, setUser] = useState<UserAuthDto | null>(null);
  const [impersonating, setImpersonating] = useState<string | null>(null);

  const login = useCallback(async (token: string) => {
    const userData = await fetchUserInfo(token);
    setUser(userData);
    setAccessToken(token);
    setImpersonating(null);
    setReady(true);
  }, []);

  const logout = useCallback(async () => {
    try {
      await fetch('/api/auth/refresh', { method: 'DELETE', credentials: 'include' });
    } catch (error) {
      console.error('Failed to call logout endpoint:', error);
    }
    setAccessToken(null);
    setUser(null);
    setImpersonating(null);
    setReady(true);
  }, []);

  const refresh = useCallback(async (): Promise<string | null> => {
    try {
      const response = await fetch('/api/auth/refresh', {
        method: 'POST',
        credentials: 'include',
      });

      if (response.ok) {
        const data = await response.json() as JwtResponse;
        const newToken = data.token;
        if (newToken) {
          const userData = await fetchUserInfo(newToken);
          setUser(userData);
          setAccessToken(newToken);
          setImpersonating(null);
          return newToken;
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
    return null;
  }, [logout]);

  const reloadUser = useCallback(async () => {
    if (!accessToken) {
      return;
    }
    try {
      const userData = await fetchUserInfo(accessToken);
      setUser(userData);
    } catch (error) {
      console.error('Failed to fetch user info:', error);
    }
  }, [accessToken]);

  const impersonateBot = useCallback(async (token: string, botName: string) => {
    const botUser = await fetchUserInfo(token);
    setUser(botUser);
    setAccessToken(token);
    setImpersonating(botName);
  }, []);

  // Refresh tokens when a window is refreshed
  useEffect(() => {
    (async () => {
      await refresh();
    })();
  }, [refresh]);

  const value = useMemo(
    () => ({ ready, accessToken, user, impersonating, login, logout, refresh, reloadUser, impersonateBot }),
    [ready, accessToken, user, impersonating, login, logout, refresh, reloadUser, impersonateBot]
  );

  return (
    <AuthContext.Provider value={value}>
      {children}
    </AuthContext.Provider>
  );
};
