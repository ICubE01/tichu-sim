import React, {createContext, useState, useContext, useEffect} from 'react';

const AuthContext = createContext(null);

export const AuthProvider = ({children}) => {
  const [ready, setReady] = useState(false);
  const [accessToken, setAccessToken] = useState(null);
  const [user, setUser] = useState(null);

  const fetchUserInfo = async (token) => {
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

  const login = (token) => {
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
        setAccessToken(data.token);
        await fetchUserInfo(data.token);
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
    <AuthContext.Provider value={{ready, accessToken, user, login, logout, refresh}}>
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => useContext(AuthContext);
