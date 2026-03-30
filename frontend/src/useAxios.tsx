import axios from 'axios';
import {useEffect} from 'react';
import {useAuth} from './useAuth.tsx';

const api = axios.create({
  baseURL: '/api',
  withCredentials: true,
});

export const useAxios = () => {
  const {accessToken, login, logout} = useAuth();

  useEffect(() => {
    const requestIntercept = api.interceptors.request.use(
      (config) => {
        if (!config.headers['Authorization'] && accessToken !== null) {
          config.headers['Authorization'] = `Bearer ${accessToken}`;
        }
        return config;
      },
      (error) => Promise.reject(error)
    );

    const responseIntercept = api.interceptors.response.use(
      (response) => response,
      async (error) => {
        const prevRequest = error?.config;
        if (prevRequest?.sent && error?.response?.status !== 401) {
          return Promise.reject(error);
        }

        prevRequest.sent = true;
        try {
          const res = await axios.post('/api/auth/refresh', {}, {withCredentials: true});
          const newAccessToken = res.data.accessToken;

          login(newAccessToken);

          prevRequest.headers['Authorization'] = `Bearer ${newAccessToken}`;
          return api(prevRequest);
        } catch (refreshError) {
          logout();
          return Promise.reject(refreshError);
        }
      }
    );

    return () => {
      api.interceptors.request.eject(requestIntercept);
      api.interceptors.response.eject(responseIntercept);
    };
  }, [accessToken, login, logout]);

  return api;
};
